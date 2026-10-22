"""
MMM pipeline entry point.

Can be used two ways:

1. Standalone (original behaviour):
      python run_mmm_pipeline.py
   Reads data/ folder, writes outputs/ folder.

2. Callable (used by Celery worker):
      from run_mmm_pipeline import run_pipeline
      outputs = run_pipeline(data_path, info_path, spend_path, out_dir)
   Returns a dict of DataFrames + fit_metrics dict.
"""

DEBUG_MODE = False

import os
import tempfile
from pathlib import Path

from src.io.load_data import load_data
from src.io.validate_schema import validate_schema
from src.validation.validate_info import validate_info
from src.validation.validate_data import validate_data
from src.validation.cross_checks import validate_variation_levels
from src.validation.small_data_checks import small_data_warnings
from src.validation.holdout import (
    split_bundle,
    score_holdout,
    verify_forward_model,
)
# Pure helpers — src.search.search pulls in no sampler, so this stays a cheap import.
from src.search.search import plan_search_split, selection_independence
from src.validation.backtest import backtest_spec, plan_origins

from src.logger import get_logger
from src.parser.build_tensors import build_tensors, build_spend_tensor
from src.config import SPEND_FILE
from src.preprocessing.monthly_to_weekly import (
    resolve_model_frequency,
    convert_monthly_to_weekly,
    aggregate_to_monthly,
    detect_frequency,
)
from src.io.load_spend import load_spend
from src.model.economic_sanity_checks import run_economic_sanity_checks
from src.model.stability_controller import run_stable_model

from src.model.effectiveness import compute_effectiveness
from src.model.contributions import extract_media_contributions
from src.model.granularity import (
    detect_model_level,
    detect_spend_levels,
    compute_roi_levels,
)

from src.model.roi import compute_roi
from src.model.marginal_roi import compute_marginal_roi_curves
from src.model.roi_key_points import extract_roi_key_points

from src.io.write_outputs import (
    ensure_dir,
    write_coefficients,
    write_media_contribution,
    write_base_contribution,
    write_reconciliation,
    write_adstock,
    write_saturation,
    write_roi,
    write_channel_efficiency,
    write_marginal_roi,
    write_roi_key_points,
    write_predictions_timeseries,
    write_fit_metrics,
)

import pandas as pd

logger = get_logger("RUNNER")


# ==========================================================================
# Public callable — used by Celery worker
# ==========================================================================

def build_detected_channels(info, bundle) -> dict:
    """
    Map the variables that actually entered the model to their declared groups.

    Shape matches what the legacy Orbit pipeline wrote to
    mmm_models.detected_channels — {group_name: [variable, ...]} — so existing
    consumers (typed `Record<string, string[]>`) keep working.

    Orbit guessed groups from column-name keywords; here the grouping is taken
    from the `subtype` column of info.csv, which is declared explicitly by the
    user and is the same funnel hierarchy the model itself uses
    (base_beta / delta_mid / delta_upper).
    """
    subtype_by_var = {
        str(v): str(s).strip().lower()
        for v, s in zip(info["variable"], info["subtype"])
    }

    groups: dict = {}
    for var in bundle["indexes"]["media"]:
        subtype = subtype_by_var.get(str(var), "")
        if subtype in ("", "na", "nan", "none"):
            key = "unspecified_funnel"
        else:
            key = f"{subtype}_funnel"
        groups.setdefault(key, []).append(str(var))

    control_vars = [str(v) for v in bundle["indexes"].get("control", [])]
    if control_vars:
        groups["control"] = control_vars

    return groups


def build_governance(diag: dict) -> dict:
    """
    Convergence evidence for the approval gate, plus a pass/fail verdict.

    Thresholds come from the Model Governance & Validation Framework:
    divergences < 100, ESS > 100, R-hat < 1.05.  A model must pass these
    before it can be approved, so the numbers have to be persisted with the
    model rather than only logged.
    """
    diag = diag or {}

    def _num(value):
        try:
            return None if value is None else float(value)
        except (TypeError, ValueError):
            return None

    max_rhat = _num(diag.get("max_rhat"))
    min_ess = _num(diag.get("min_ess"))
    divergences = _num(diag.get("n_divergences"))

    checks = {
        "rhat":        None if max_rhat is None else max_rhat < 1.05,
        "ess":         None if min_ess is None else min_ess > 100,
        "divergences": None if divergences is None else divergences < 100,
    }
    known = [v for v in checks.values() if v is not None]

    return {
        "max_rhat":      max_rhat,
        "min_ess":       min_ess,
        "n_divergences": None if divergences is None else int(divergences),
        "n_bad_rhat":    diag.get("n_bad_rhat"),
        "n_bad_ess":     diag.get("n_bad_ess"),
        "thresholds":    {"max_rhat": 1.05, "min_ess": 100, "n_divergences": 100},
        "checks":        checks,
        # Unknown metrics must not silently pass a governance gate.
        "passed":        bool(known) and all(known) and len(known) == len(checks),
    }


def holdout_periods_requested() -> int:
    """
    How many trailing periods to hold out, from MMM_HOLDOUT_PERIODS.

    Defaults to 0 (disabled), so existing runs are untouched. A malformed value is a
    configuration mistake and must not silently disable validation.
    """
    raw = os.environ.get("MMM_HOLDOUT_PERIODS", "").strip()
    if not raw:
        return 0
    try:
        n = int(raw)
    except ValueError:
        raise ValueError(
            f"MMM_HOLDOUT_PERIODS must be an integer, got {raw!r}"
        )
    if n < 0:
        raise ValueError(f"MMM_HOLDOUT_PERIODS must not be negative, got {n}")
    return n


def spec_search_requested() -> bool:
    """MMM_SPEC_SEARCH enables the specification search. Off by default."""
    return os.environ.get("MMM_SPEC_SEARCH", "").strip().lower() in ("1", "true", "yes", "on")


def search_holdout_periods_requested(default: int) -> int:
    """
    How many periods the search may select on, from MMM_SEARCH_HOLDOUT_PERIODS.

    Defaults to MMM_HOLDOUT_PERIODS. This is a *second* window, earlier in the series
    than the one `holdout_metrics` reports — see `plan_search_split`. A malformed value
    is a configuration mistake and must not silently reshape the split.
    """
    raw = os.environ.get("MMM_SEARCH_HOLDOUT_PERIODS", "").strip()
    if not raw:
        return default
    try:
        n = int(raw)
    except ValueError:
        raise ValueError(
            f"MMM_SEARCH_HOLDOUT_PERIODS must be an integer, got {raw!r}"
        )
    if n <= 0:
        raise ValueError(
            f"MMM_SEARCH_HOLDOUT_PERIODS must be positive, got {n}; "
            "unset it to default to MMM_HOLDOUT_PERIODS"
        )
    return n


def _positive_int_env(name: str, default: int) -> int:
    """Read a non-negative integer setting, refusing a malformed one."""
    raw = os.environ.get(name, "").strip()
    if not raw:
        return default
    try:
        n = int(raw)
    except ValueError:
        raise ValueError(f"{name} must be an integer, got {raw!r}")
    if n < 0:
        raise ValueError(f"{name} must not be negative, got {n}")
    return n


def backtest_origins_requested() -> int:
    """
    How many expanding-window origins to backtest, from MMM_BACKTEST_ORIGINS.

    `0` (default) keeps the single-window referee and writes no `backtest_metrics`, so
    every existing run is untouched. Above zero this costs one MCMC fit per origin per
    specification — see `validation/backtest.py` on why that is the right place to spend
    compute, and why no number of candidates substitutes for it.
    """
    return _positive_int_env("MMM_BACKTEST_ORIGINS", 0)


def backtest_horizon_requested() -> int:
    """Forecast horizon per origin, from MMM_BACKTEST_HORIZON (default 1 period)."""
    return max(1, _positive_int_env("MMM_BACKTEST_HORIZON", 1))


def run_backtest_validation(bundle: dict, model_freq: str, spec_search: dict = None):
    """
    Score the production specification as a sequence of one-step-ahead forecasts.

    Where `run_holdout_validation` fits once and forecasts the whole reserved window in
    one go, this fits once per period in that window and forecasts the next period each
    time — the same periods, the same independence from the search, but N separate
    forecasts from N separate models rather than one N-step extrapolation. That yields
    per-origin evidence, an interval, and a predictive coverage figure that includes
    observation noise.

    The origins are chosen so that every forecast target lies inside the window withheld
    from the specification search, so this is independent evidence by construction.
    Returns None when disabled. Never raises into the main pipeline.
    """
    n_origins = backtest_origins_requested()
    if n_origins == 0:
        return None

    n_reserved = holdout_periods_requested()
    if n_reserved <= 0:
        logger.error(
            "MMM_BACKTEST_ORIGINS is set but MMM_HOLDOUT_PERIODS is not, so there is no "
            "window withheld from the search to score against. Skipping the backtest."
        )
        return {"enabled": True, "error": "MMM_BACKTEST_ORIGINS requires MMM_HOLDOUT_PERIODS > 0"}

    horizon = backtest_horizon_requested()
    T = bundle["shapes"]["T"]

    # Exactly the reserved window: origin T-n forecasts period T-n, ..., origin T-1
    # forecasts period T-1. Asking for more origins than that would reach back into
    # periods the search was allowed to select on.
    if n_origins > n_reserved:
        logger.warning(
            f"MMM_BACKTEST_ORIGINS={n_origins} would forecast periods the search could "
            f"see; capping at MMM_HOLDOUT_PERIODS={n_reserved}."
        )
        n_origins = n_reserved

    plan = plan_origins(T, n_origins, horizon)
    if not plan["feasible"]:
        logger.error(f"Skipping the backtest: {plan['reason']}")
        return {"enabled": True, "error": plan["reason"], "plan": plan}

    logger.info(
        f"Backtest enabled: {len(plan['origins'])} origins "
        f"({plan['origins'][0]}..{plan['origins'][-1]}) at horizon {horizon} — "
        f"this fits {len(plan['origins'])} more models"
    )

    def _fit(train_bundle):
        trace, _diag, _pred, _level = run_stable_model(
            bundle=train_bundle, debug_mode=DEBUG_MODE,
        )
        return trace

    try:
        result = backtest_spec(
            bundle, _fit,
            origins=plan["origins"], horizon=horizon, model_frequency=model_freq,
        )
        result["enabled"] = True
        result["plan"] = plan
        result.update(selection_independence(spec_search))

        # The per-forecast rows are what make pairing possible, but the stored output
        # does not need them; the per-origin summaries carry the interrogable trail.
        result.pop("points", None)
        return result

    except Exception as exc:  # noqa: BLE001 - must not fail the production model
        logger.exception("Backtest validation failed")
        return {"enabled": True, "error": f"{type(exc).__name__}: {exc}"}


def run_spec_search(bundle: dict, model_freq: str):
    """
    Search for a specification that forecasts held-out periods better than the default.

    Returns ``(search_record, winning_bundle)``. When disabled or not feasible the
    bundle comes back unchanged, so the caller can always use what it is handed.

    The search needs somewhere to stand: without held-out periods there is no referee,
    and a search scored in-sample would simply add parameters until it overfit. So this
    refuses to run rather than silently optimising the wrong thing.

    It also needs to stand somewhere *else* than where its winner is judged. The last
    `MMM_HOLDOUT_PERIODS` periods are what `holdout_metrics` reports and what the
    approval gate binds on, so the search never sees them: it is handed the series with
    those periods already removed and selects on its own earlier window. Sharing one
    window made the reported skill the maximum over every candidate tried, which the
    gate then read as out-of-sample evidence. See `plan_search_split`.
    """
    if not spec_search_requested():
        return None, bundle

    n_holdout = holdout_periods_requested()
    if n_holdout <= 0:
        logger.error(
            "MMM_SPEC_SEARCH is set but MMM_HOLDOUT_PERIODS is not. A specification "
            "search scored in-sample optimises for overfitting. Skipping the search."
        )
        return {
            "enabled": True,
            "error": "MMM_SPEC_SEARCH requires MMM_HOLDOUT_PERIODS > 0",
        }, bundle

    n_search_holdout = search_holdout_periods_requested(n_holdout)
    plan = plan_search_split(bundle["shapes"]["T"], n_holdout, n_search_holdout)

    if not plan["feasible"]:
        logger.error(
            f"Skipping the specification search: {plan['reason']} Searching and "
            "reporting on the same periods would make the reported skill a selected "
            "maximum, and the approval gate binds on it."
        )
        return {
            "enabled": True,
            "error": plan["reason"],
            "split_plan": plan,
        }, bundle

    logger.info(
        f"SPEC SEARCH | reserving the last {n_holdout} of {plan['n_total']} periods for "
        f"reporting; the search trains on {plan['n_search_train']} and selects on "
        f"{plan['n_search_holdout']}"
    )

    # Which referee judges the candidates. The rolling-origin one compares them on
    # identical forecasts and requires the paired gain's interval to clear zero; the
    # single-window one subtracts two scores and checks a threshold it cannot calibrate.
    fit_budget = int(os.environ.get("MMM_SEARCH_MAX_FITS", "20"))
    min_improvement = float(os.environ.get("MMM_SEARCH_MIN_IMPROVEMENT", "0.01"))
    candidate_budget = fit_budget
    origin_plan = None
    n_origins = backtest_origins_requested()

    if n_origins > 0:
        origin_plan = plan_origins(plan["n_total"] - n_holdout, n_origins,
                                   backtest_horizon_requested())
        if not origin_plan["feasible"]:
            logger.error(
                f"Skipping the specification search: {origin_plan['reason']} "
                "(MMM_BACKTEST_ORIGINS asked for the rolling-origin referee)"
            )
            return {
                "enabled": True,
                "error": origin_plan["reason"],
                "split_plan": plan,
                "origin_plan": origin_plan,
            }, bundle

        per_candidate = len(origin_plan["origins"])
        candidate_budget = fit_budget // per_candidate

        if candidate_budget < 2:
            reason = (
                f"the rolling-origin referee costs {per_candidate} fits per candidate, "
                f"so MMM_SEARCH_MAX_FITS={fit_budget} affords {candidate_budget} "
                "candidates — not even the default plus one. Raise it to at least "
                f"{per_candidate * 7} to search a round, or lower "
                "MMM_BACKTEST_ORIGINS."
            )
            logger.error(f"Skipping the specification search: {reason}")
            return {
                "enabled": True, "error": reason,
                "split_plan": plan, "origin_plan": origin_plan,
            }, bundle

        logger.info(
            f"SPEC SEARCH | rolling-origin referee: {per_candidate} fits per candidate, "
            f"budget {fit_budget} fits = {candidate_budget} candidates"
        )

    try:
        from src.model.pymc_mmm import build_pymc_model
        from src.model.sample_model import sample_model
        from src.search.search import search_specification
        from src.search.spec import ModelSpec, apply_to_bundle

        draws = int(os.environ.get("MMM_SEARCH_DRAWS", "400"))
        chains = int(os.environ.get("MMM_SEARCH_CHAINS", "2"))

        def _fit(candidate_bundle):
            model = build_pymc_model(candidate_bundle)
            return sample_model(
                model, draws=draws, tune=draws, chains=chains, target_accept=0.95
            )

        # The search sees only the periods before the reported window. Everything it
        # scores — including its own holdout — comes out of this shorter series.
        search_bundle, reserved = split_bundle(bundle, n_holdout)
        search_bundle["original_frequency"] = bundle.get("original_frequency")
        search_bundle["model_frequency"] = model_freq

        referee = None
        if origin_plan is not None:
            from src.search.search import RollingOriginReferee

            referee = RollingOriginReferee(
                search_bundle, _fit,
                plan=origin_plan,
                model_frequency=model_freq,
                min_improvement=min_improvement,
            )

        record = search_specification(
            search_bundle,
            _fit,
            n_holdout=n_search_holdout,
            model_frequency=model_freq,
            max_rounds=int(os.environ.get("MMM_SEARCH_ROUNDS", "3")),
            min_improvement=min_improvement,
            max_fits=candidate_budget,
            referee=referee,
        )

        # Recorded so the audit trail shows the protocol, not just the winner, and so
        # the approval gate can verify independence instead of assuming it.
        record["evaluation_reserved"] = True
        record["split_plan"] = plan
        record["reported_periods_withheld"] = reserved["holdout_periods"]
        record["search_periods"] = reserved["train_periods"][-n_search_holdout:]

        if record.get("error") or record.get("kept_default", True):
            return record, bundle

        winner = ModelSpec.from_dict(record["winner"])
        logger.info(
            f"SPEC SEARCH | refitting at full draws with {winner.label()}"
        )
        return record, apply_to_bundle(bundle, winner)

    except Exception as exc:  # noqa: BLE001 - the default spec must still be fittable
        logger.exception("Specification search failed; falling back to the default spec")
        return {"enabled": True, "error": f"{type(exc).__name__}: {exc}"}, bundle


def run_holdout_validation(bundle: dict, model_freq: str, spec_search: dict = None):
    """
    Fit a second model on the earlier periods only and score it on the most recent ones.

    Returns None when disabled or not feasible. Never raises into the main pipeline — a
    failed validation must not destroy a production model that already sampled fine, so
    problems are reported in the payload under "error" instead.

    `spec_search` is the search record, if one ran. These scores only mean what they
    appear to mean when the periods scored here were withheld from that search, so the
    verdict travels with the numbers under "selection_independent" — the approval gate
    reads it rather than inferring it.
    """
    n_holdout = holdout_periods_requested()
    if n_holdout == 0:
        return None

    T = bundle["shapes"]["T"]
    if n_holdout >= T:
        logger.error(
            f"MMM_HOLDOUT_PERIODS={n_holdout} leaves no training data (T={T}); "
            "skipping out-of-sample validation."
        )
        return {"enabled": True, "error": f"n_holdout {n_holdout} >= T {T}"}

    logger.info(
        f"Out-of-sample validation enabled: holding out the last {n_holdout} "
        f"of {T} periods (this fits a second model)"
    )

    try:
        train_bundle, split_info = split_bundle(bundle, n_holdout)
        train_bundle["original_frequency"] = bundle.get("original_frequency")
        train_bundle["model_frequency"] = bundle.get("model_frequency")

        trace_tr, _diag_tr, _pred_tr, level_tr = run_stable_model(
            bundle=train_bundle,
            debug_mode=DEBUG_MODE,
        )

        # The NumPy forward pass must still mirror pymc_mmm.py, or the scores below are
        # measuring the wrong model.
        check = verify_forward_model(trace_tr, train_bundle, model_freq)

        metrics = score_holdout(trace_tr, bundle, split_info, model_freq)
        metrics["enabled"] = True
        metrics["train_stability_level"] = int(level_tr)
        metrics["forward_model_check"] = check
        metrics["trustworthy"] = bool(check["matches"])
        metrics.update(selection_independence(spec_search))

        if not check["matches"]:
            logger.error(
                "Holdout scores computed with a forward model that no longer matches "
                "the PyMC model — treat them as invalid."
            )

        if not metrics["selection_independent"]:
            logger.error(
                f"HOLDOUT | {metrics['selection_note']}. skill_vs_naive is not "
                "out-of-sample evidence here and the approval gate will refuse it."
            )

        return metrics

    except Exception as exc:  # noqa: BLE001 - must not fail the production model
        logger.exception("Out-of-sample validation failed")
        return {"enabled": True, "error": f"{type(exc).__name__}: {exc}"}


def run_pipeline(
    data_path=None,
    info_path=None,
    spend_path=None,
    out_dir="outputs",
) -> dict:
    """
    Run the full MMM pipeline and return outputs as a dict of DataFrames.

    Parameters
    ----------
    data_path, info_path : str | Path | None
        Paths to data.csv and info.csv.  Defaults to config paths.
    spend_path : str | Path | None
        Path to spend.csv.  If None, ROI is disabled.
    out_dir : str
        Directory for output CSVs.  Created if it doesn't exist.

    Returns
    -------
    dict with keys:
        coefficients, media_contribution, base_contribution, reconciliation,
        adstock_curves, saturation_curves, roi, marginal_roi_curves,
        roi_key_points, predictions_timeseries, fit_metrics (plain dict),
        channel_efficiency
        + meta: {stability_level}
    """
    logger.info("Starting MMM pipeline")

    # -----------------------------------------------------------------------
    # 1. LOAD & VALIDATE
    # -----------------------------------------------------------------------
    data, info = load_data(data_path, info_path)

    validate_schema(data, info)
    validate_info(info)
    validate_data(data, info)
    validate_variation_levels(data, info)

    logger.info("ALL VALIDATIONS PASSED")

    # -----------------------------------------------------------------------
    # 2. BUILD TENSORS
    # -----------------------------------------------------------------------
    data, original_freq, model_freq = resolve_model_frequency(data)

    bundle = build_tensors(data, info)
    bundle["original_frequency"] = original_freq
    bundle["model_frequency"]    = model_freq

    if model_freq not in ("weekly", "monthly"):
        raise ValueError(
            f"Unsupported model frequency {model_freq!r}; expected 'weekly' or 'monthly'."
        )

    logger.info(
        f"Modeling at {model_freq} frequency "
        f"(source data was {original_freq}, T={bundle['shapes']['T']})"
    )

    small_data_warnings(bundle)

    # -----------------------------------------------------------------------
    # 3. OPTIONAL SPEND INGESTION
    # -----------------------------------------------------------------------
    _spend_path = spend_path or SPEND_FILE

    try:
        spend_df = load_spend(_spend_path)
        spend_df = spend_df.rename(columns={"media": "variable", "spend": "value"})

        # Spend must share the model's frequency, or ROI divides mismatched grids.
        spend_freq = detect_frequency(spend_df)

        if spend_freq == bundle["model_frequency"]:
            logger.info(f"Spend already {spend_freq}; no conversion needed")

        elif bundle["model_frequency"] == "weekly" and spend_freq == "monthly":
            logger.warning(
                "Spend is monthly but the model is weekly — expanding spend with the "
                "harmonic split. ROI and the saturation curves the optimizer reads "
                "will carry that synthetic within-month pattern."
            )
            spend_df, _, _ = convert_monthly_to_weekly(spend_df)

        elif bundle["model_frequency"] == "monthly" and spend_freq == "weekly":
            spend_df = aggregate_to_monthly(spend_df)
            logger.info("Weekly spend aggregated to monthly to match the model")

        spend_df = spend_df.rename(columns={"variable": "media", "value": "spend"})
        bundle   = build_spend_tensor(spend_df, bundle)

        model_level  = detect_model_level(bundle)
        spend_levels = detect_spend_levels(bundle)
        roi_levels   = compute_roi_levels(model_level, spend_levels)

        bundle["model_level"]  = model_level
        bundle["spend_levels"] = spend_levels
        bundle["roi_levels"]   = roi_levels

        logger.info(f"Model level: {model_level} | Spend levels: {spend_levels}")

    except FileNotFoundError:
        logger.warning("spend.csv not found — ROI disabled.")

    # -----------------------------------------------------------------------
    # 4. MODEL EXECUTION
    # -----------------------------------------------------------------------
    # Optional specification search. Off by default; when on, the winning spec is what
    # the production model below is then fitted with, at full sampling settings.
    spec_search, bundle = run_spec_search(bundle, model_freq)

    try:
        trace, diag, pred_diag, stability_level = run_stable_model(
            bundle=bundle,
            debug_mode=DEBUG_MODE,
        )
    except RuntimeError:
        logger.error("All stability levels failed. MODEL REJECTED.")
        raise

    logger.info(f"MODEL ACCEPTED at stability level {stability_level}")

    # -----------------------------------------------------------------------
    # 4b. OPTIONAL OUT-OF-SAMPLE VALIDATION
    # -----------------------------------------------------------------------
    # Off by default: with MMM_HOLDOUT_PERIODS unset this block does nothing and every
    # output below is bit-identical to a run without it. When enabled it fits a SECOND
    # model on the earlier periods only and scores it on the most recent ones; the
    # production model above still sees all the data, so no existing output changes.
    # The search was handed a bundle stopping short of these periods, so the score is
    # independent of how the specification was chosen — and says so in its payload.
    holdout_metrics = run_holdout_validation(bundle, model_freq, spec_search=spec_search)

    # Richer evidence over the same reserved periods: one fit and one forecast per period
    # instead of one fit and an N-step extrapolation. Off unless MMM_BACKTEST_ORIGINS is
    # set, and it costs a fit per origin.
    backtest_metrics = run_backtest_validation(bundle, model_freq, spec_search=spec_search)

    # -----------------------------------------------------------------------
    # 5. POSTERIOR EXTRACTION
    # -----------------------------------------------------------------------
    contrib         = extract_media_contributions(trace=trace, bundle=bundle)
    contrib_arr     = contrib["contribution"]
    total_media     = contrib_arr.sum(axis=3)
    base            = bundle["Y"] - total_media

    effectiveness   = compute_effectiveness(bundle, contrib)
    bundle["effectiveness"] = effectiveness

    roi_results     = compute_roi(bundle, contrib)
    bundle["roi"]   = roi_results

    run_economic_sanity_checks(bundle, contrib)

    mroi_curves     = compute_marginal_roi_curves(trace, bundle)
    bundle["marginal_roi"] = mroi_curves

    roi_key_points  = extract_roi_key_points(trace, bundle)
    bundle["roi_key_points"] = roi_key_points

    # -----------------------------------------------------------------------
    # 6. WRITE CSVs
    # -----------------------------------------------------------------------
    ensure_dir(out_dir)

    write_coefficients(trace, bundle, out_dir)
    write_media_contribution(contrib, bundle, out_dir)
    write_base_contribution(base, bundle, out_dir)
    write_reconciliation(base, contrib, bundle, out_dir)
    write_adstock(trace, bundle, out_dir)
    write_saturation(trace, bundle, out_dir)
    write_roi(trace, contrib, bundle, out_dir)
    write_channel_efficiency(contrib, bundle, out_dir)
    write_marginal_roi(trace, bundle, out_dir)
    write_roi_key_points(bundle, out_dir)
    write_predictions_timeseries(pred_diag, bundle, out_dir)
    write_fit_metrics(pred_diag, out_dir)

    logger.info("ALL OUTPUT CSVs WRITTEN SUCCESSFULLY")

    # -----------------------------------------------------------------------
    # 7. COLLECT DataFrames for Supabase upload
    # -----------------------------------------------------------------------
    def read(filename):
        path = os.path.join(out_dir, filename)
        return pd.read_csv(path) if os.path.exists(path) else None

    fit_metrics_dict = pred_diag.get("fit_metrics", {})

    outputs = {
        "coefficients":          read("coefficients.csv"),
        "media_contribution":    read("media_contribution.csv"),
        "base_contribution":     read("base_contribution.csv"),
        "reconciliation":        read("reconciliation.csv"),
        "adstock_curves":        read("adstock_curves.csv"),
        "saturation_curves":     read("saturation_curves.csv"),
        "roi":                   read("roi.csv"),
        "marginal_roi_curves":   read("marginal_roi_curves.csv"),
        "roi_key_points":        read("roi_key_points.csv"),
        "predictions_timeseries": read("predictions_timeseries.csv"),
        "channel_efficiency":    read("channel_efficiency.csv"),
        "fit_metrics":           fit_metrics_dict,
        # Underscore keys are stripped before outputs are persisted as rows,
        # so _meta carries record-level fields for mmm_models.
        "_meta": {
            "stability_level":   int(stability_level),
            "detected_channels": build_detected_channels(info, bundle),
            "governance":        build_governance(diag),
        },
    }

    if holdout_metrics is not None:
        outputs["holdout_metrics"] = holdout_metrics

    if backtest_metrics is not None:
        outputs["backtest_metrics"] = backtest_metrics

    if spec_search is not None:
        outputs["spec_search"] = spec_search
        outputs["_meta"]["model_spec"] = (
            bundle["spec"].to_dict() if "spec" in bundle else None
        )

    return outputs


# ==========================================================================
# Standalone entry point (original behaviour)
# ==========================================================================

def main():
    run_pipeline(out_dir="outputs")


if __name__ == "__main__":
    main()
