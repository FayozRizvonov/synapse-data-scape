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

from src.logger import get_logger
from src.parser.build_tensors import build_tensors, build_spend_tensor
from src.config import SPEND_FILE
from src.preprocessing.monthly_to_weekly import convert_monthly_to_weekly
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
    data, original_freq, model_freq = convert_monthly_to_weekly(data)

    bundle = build_tensors(data, info)
    bundle["original_frequency"] = original_freq
    bundle["model_frequency"]    = model_freq

    assert bundle["model_frequency"] == "weekly", \
        "Model frequency is not weekly. Conversion failed."

    small_data_warnings(bundle)

    # -----------------------------------------------------------------------
    # 3. OPTIONAL SPEND INGESTION
    # -----------------------------------------------------------------------
    _spend_path = spend_path or SPEND_FILE

    try:
        spend_df = load_spend(_spend_path)
        spend_df = spend_df.rename(columns={"media": "variable", "spend": "value"})

        if bundle["model_frequency"] == "weekly":
            spend_df, _, _ = convert_monthly_to_weekly(spend_df)
            logger.info("Spend converted to weekly frequency")

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

    return outputs


# ==========================================================================
# Standalone entry point (original behaviour)
# ==========================================================================

def main():
    run_pipeline(out_dir="outputs")


if __name__ == "__main__":
    main()
