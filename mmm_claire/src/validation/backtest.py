"""
Rolling-origin backtesting — a referee with enough resolution to be worth consulting.

A single trailing holdout gives one number from one fit. On the 33-month dovato shape
that number comes from six observations (n_holdout x G x SB = 6 x 1 x 1), and the
sampling standard deviation of `skill_vs_naive` on six points is about 0.26 — against a
`min_improvement` threshold of 0.01. The search was comparing specifications with an
instrument that cannot resolve differences four hundred times larger than the one it
claimed to detect. See docs/llm-spec-proposal-evaluation.md.

Two changes buy resolution, and the second matters more than the first:

1. **More evaluation points.** Expanding-window origins: fit on periods [0, o), forecast
   [o, o + horizon), step o forward, repeat. Twelve origins at horizon 1 give twelve
   genuine out-of-sample forecasts instead of six, from twelve fits. Linear in cost.

2. **Pairing.** Every specification is evaluated on the *same* (origin, period) pairs, so
   the comparison can be made point by point. Most of the noise in a skill score is
   shared between two specifications that saw the same data — it is the periods that were
   hard to forecast, not the specification. Differencing removes it. On this data the
   paired noise is roughly half the unpaired noise, and unlike the unpaired figure it
   shrinks as origins are added.

What this module therefore reports is not two skill numbers to subtract, but the paired
gain with a bootstrap interval around it, resampled over **origins** rather than points —
because forecast errors within one origin share a fitted model and are not independent
draws. A gain whose interval straddles zero has not been demonstrated, however large it
looks.

Cost is the honest trade. One MCMC fit per origin per specification, so a 12-origin
backtest of a 20-candidate search is 240 fits where the old loop paid 20. That buys
resolution the old loop could not get at any candidate count: 12 paired points beats 6
unpaired ones, and 200 candidates on 6 unpaired points beats nothing. `plan_origins`
refuses rather than silently running for hours.
"""

from __future__ import annotations

from typing import Callable, Dict, List, Optional, Sequence

import numpy as np

from src.logger import get_logger
from src.validation.holdout import (
    _thin,
    forward_mu,
    split_bundle,
    verify_forward_model,
)

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# planning
# ---------------------------------------------------------------------------

def plan_origins(
    n_total: int,
    n_origins: int,
    horizon: int = 1,
    min_train: Optional[int] = None,
) -> dict:
    """
    Lay out expanding-window origins, latest first feasible last.

    Origin `o` means: train on the first `o` periods, forecast periods
    ``[o, o + horizon)``. The origins are the last `n_origins` that fit, so the backtest
    covers the most recent history — the part a client cares whether the model can
    forecast.

    `min_train` is how little the earliest model may be fitted on; it defaults to half the
    series. Below that the early origins measure a model starved of data rather than the
    specification being judged, and they drag the aggregate without informing it.

    Returns a plan. When `feasible` is false, `reason` says why and the caller is expected
    to decline rather than quietly reduce the backtest to something that cannot resolve
    anything.
    """
    if min_train is None:
        min_train = (n_total + 1) // 2

    last = n_total - horizon
    origins = list(range(last - n_origins + 1, last + 1))

    if horizon < 1:
        reason = f"horizon must be at least 1, got {horizon}"
    elif n_origins < 2:
        reason = (
            f"a paired interval needs origins to resample over, got {n_origins}; "
            "use the single-holdout referee if one fit is all the budget allows"
        )
    elif last < 1:
        reason = f"horizon {horizon} leaves no periods to train on (T={n_total})"
    elif origins[0] < min_train:
        reason = (
            f"T={n_total} cannot carry {n_origins} origins at horizon {horizon}: the "
            f"earliest would train on {origins[0]} periods, under the {min_train} "
            f"minimum (half the series). Ask for at most "
            f"{max(0, last - min_train + 1)} origins, or shorten the horizon."
        )
    else:
        reason = None

    plan = {
        "feasible": reason is None,
        "reason": reason,
        "origins": origins if reason is None else [],
        "horizon": int(horizon),
        "n_origins": int(n_origins),
        "min_train": int(min_train),
        "n_total": int(n_total),
        "n_fits_per_spec": int(n_origins) if reason is None else 0,
    }

    if reason is None and n_origins < 8:
        logger.warning(
            f"BACKTEST | {n_origins} origins is few to bootstrap over; the paired "
            "interval will be wide. That is the data being honest, not a bug."
        )

    return plan


# ---------------------------------------------------------------------------
# running one specification across the origins
# ---------------------------------------------------------------------------

def backtest_spec(
    bundle_full: dict,
    fit: Callable[[dict], object],
    *,
    origins: Sequence[int],
    horizon: int,
    model_frequency: str,
    max_draws: int = 500,
    verify: bool = True,
    seed: int = 0,
) -> dict:
    """
    Fit one specification at every origin and score each forecast.

    `bundle_full` must already have the specification applied (see
    `search.spec.apply_to_bundle`) — this module knows nothing about specifications, only
    about time. The spec travels on the bundle, so each origin's training slice carries
    it to `build_pymc_model`.

    Every point is keyed by (origin, t, g, sb) so two specifications can be compared
    point by point. `paired_gain` relies on those keys matching exactly.
    """
    T = bundle_full["shapes"]["T"]
    y_mean, y_std = bundle_full["y_mean"], bundle_full["y_std"]
    y_true_all = bundle_full["Y_scaled"] * y_std + y_mean          # (T, G, SB)

    rng = np.random.default_rng(seed)

    points: List[dict] = []
    per_origin: List[dict] = []
    all_match = True
    worst_diff = 0.0

    for o in origins:
        train, _info = split_bundle(bundle_full, T - o)
        train["original_frequency"] = bundle_full.get("original_frequency")
        train["model_frequency"] = model_frequency

        trace = fit(train)

        if verify:
            check = verify_forward_model(trace, train, model_frequency)
            all_match = all_match and bool(check["matches"])
            worst_diff = max(worst_diff, float(check["max_abs_diff"]))

        # Adstock runs from t=0 over the whole series, so carryover into the forecast
        # window reflects the media that actually preceded it.
        mu_draws = forward_mu(trace, bundle_full, model_frequency, max_draws)
        y_pred_draws = mu_draws * y_std + y_mean                   # (D, T, G, SB)

        # Observation noise, thinned identically to mu so draws stay aligned.
        stacked, _idx = _thin(trace, max_draws)
        sigma = np.asarray(stacked["sigma"].values).reshape(-1) * y_std
        if sigma.shape[0] != y_pred_draws.shape[0]:                # a scalar-only trace
            sigma = np.full(y_pred_draws.shape[0], float(sigma.reshape(-1)[0]))

        # The naive forecaster this origin is scored against: the mean of what it saw.
        naive = float(y_true_all[:o].mean())

        o_err: List[float] = []
        for step in range(horizon):
            t = o + step
            if t >= T:
                break
            for g in range(bundle_full["shapes"]["G"]):
                for sb in range(bundle_full["shapes"]["SB"]):
                    draws_mu = y_pred_draws[:, t, g, sb]
                    noise = rng.normal(0.0, 1.0, size=draws_mu.shape[0]) * sigma
                    draws_pred = draws_mu + noise

                    y = float(y_true_all[t, g, sb])
                    pred = float(draws_mu.mean())
                    o_err.append(y - pred)

                    points.append({
                        "origin": int(o),
                        "t": int(t),
                        "step": int(step + 1),
                        "g": int(g),
                        "sb": int(sb),
                        "period": str(list(bundle_full["coords"]["time"])[t]),
                        "y": y,
                        "pred": pred,
                        "naive": naive,
                        "in_mu_90": bool(
                            np.percentile(draws_mu, 5) <= y <= np.percentile(draws_mu, 95)
                        ),
                        "in_pred_90": bool(
                            np.percentile(draws_pred, 5) <= y <= np.percentile(draws_pred, 95)
                        ),
                    })

        err = np.asarray(o_err, dtype=float)
        o_points = [p for p in points if p["origin"] == o]
        o_naive = np.asarray([p["y"] - p["naive"] for p in o_points], dtype=float)
        o_rmse = float(np.sqrt(np.mean(err ** 2))) if err.size else float("nan")
        o_naive_rmse = float(np.sqrt(np.mean(o_naive ** 2))) if o_naive.size else float("nan")

        per_origin.append({
            "origin": int(o),
            "n_train": int(o),
            "n_points": int(err.size),
            "rmse": o_rmse,
            "naive_rmse": o_naive_rmse,
            "skill_vs_naive": (
                float(1.0 - o_rmse / o_naive_rmse) if o_naive_rmse > 0 else float("nan")
            ),
        })

        logger.info(
            f"BACKTEST | origin {o} (train {o}) RMSE={o_rmse:,.1f} "
            f"(naive {o_naive_rmse:,.1f})"
        )

    result = aggregate(points)
    result.update({
        "origins": [int(o) for o in origins],
        "horizon": int(horizon),
        "per_origin": per_origin,
        "points": points,
        "trustworthy": bool(all_match),
        "forward_model_max_abs_diff": worst_diff,
    })

    if not all_match:
        logger.error(
            "BACKTEST | the NumPy forward model no longer mirrors pymc_mmm.py at one or "
            "more origins; these scores are not trustworthy."
        )

    logger.info(
        f"BACKTEST | {len(origins)} origins, {result['n_points']} points | "
        f"RMSE={result['rmse']:,.1f} (naive {result['naive_rmse']:,.1f}) "
        f"skill={result['skill_vs_naive']:+.3f} "
        f"coverage90 mu={result['coverage_90_mu']:.2f} "
        f"pred={result['coverage_90_predictive']:.2f}"
    )

    return result


def aggregate(points: Sequence[dict]) -> dict:
    """Pool every forecast into one set of headline numbers."""
    if not points:
        return {
            "n_points": 0, "n_origins": 0, "rmse": float("nan"),
            "naive_rmse": float("nan"), "skill_vs_naive": float("nan"),
            "mape": float("nan"), "coverage_90_mu": float("nan"),
            "coverage_90_predictive": float("nan"),
        }

    y = np.asarray([p["y"] for p in points], dtype=float)
    pred = np.asarray([p["pred"] for p in points], dtype=float)
    naive = np.asarray([p["naive"] for p in points], dtype=float)

    resid = y - pred
    rmse = float(np.sqrt(np.mean(resid ** 2)))
    naive_rmse = float(np.sqrt(np.mean((y - naive) ** 2)))

    return {
        "n_points": len(points),
        "n_origins": len({p["origin"] for p in points}),
        "rmse": rmse,
        "naive_rmse": naive_rmse,
        "skill_vs_naive": float(1.0 - rmse / naive_rmse) if naive_rmse > 0 else float("nan"),
        "mape": float(np.mean(np.abs(resid / np.maximum(np.abs(y), 1e-8)))),
        # Two coverages, because they answer different questions. The mu interval is the
        # credible interval for the mean function and omits observation noise entirely —
        # it is what holdout.score_holdout reports as `coverage_90`, so it is here for
        # comparability. The predictive interval includes sigma and is the one to read
        # when asking whether the model's stated uncertainty is honest.
        "coverage_90_mu": float(np.mean([p["in_mu_90"] for p in points])),
        "coverage_90_predictive": float(np.mean([p["in_pred_90"] for p in points])),
    }


# ---------------------------------------------------------------------------
# the paired comparison
# ---------------------------------------------------------------------------

def _key(p: dict) -> tuple:
    return (p["origin"], p["t"], p["g"], p["sb"])


def paired_gain(
    incumbent: dict,
    candidate: dict,
    *,
    n_boot: int = 2000,
    seed: int = 0,
    alpha: float = 0.10,
) -> dict:
    """
    How much better does `candidate` forecast than `incumbent`, and is that demonstrated?

    The two must have been scored on identical (origin, period, geo, sub-brand) points;
    anything else is not a paired comparison and is refused rather than approximated.

    The interval comes from resampling **origins** with replacement, not points: forecasts
    made from one fitted model share that model's luck, so points within an origin are not
    independent draws and bootstrapping over them would report an interval several times
    too narrow.

    `gain` is the difference in pooled `skill_vs_naive`. `lo`/`hi` bound it, and
    `p_better` is the share of resamples in which the candidate came out ahead. A gain
    with `lo` at or below zero has not been demonstrated.
    """
    inc = {_key(p): p for p in incumbent.get("points", [])}
    can = {_key(p): p for p in candidate.get("points", [])}

    if not inc or not can:
        return {"paired": False, "reason": "one of the backtests scored no points"}
    if set(inc) != set(can):
        return {
            "paired": False,
            "reason": (
                f"the two backtests do not share their evaluation points "
                f"({len(set(inc) ^ set(can))} differ); a paired comparison needs "
                "identical origins"
            ),
        }

    keys = sorted(inc)
    by_origin: Dict[int, List[tuple]] = {}
    for k in keys:
        by_origin.setdefault(k[0], []).append(k)
    origins = sorted(by_origin)

    y = np.asarray([inc[k]["y"] for k in keys], dtype=float)
    e_inc = y - np.asarray([inc[k]["pred"] for k in keys], dtype=float)
    e_can = y - np.asarray([can[k]["pred"] for k in keys], dtype=float)
    e_nai = y - np.asarray([inc[k]["naive"] for k in keys], dtype=float)
    index = {k: i for i, k in enumerate(keys)}

    def skills(sel: np.ndarray) -> tuple:
        nai = float(np.sqrt(np.mean(e_nai[sel] ** 2)))
        if nai <= 0:
            return float("nan"), float("nan")
        return (
            1.0 - float(np.sqrt(np.mean(e_inc[sel] ** 2))) / nai,
            1.0 - float(np.sqrt(np.mean(e_can[sel] ** 2))) / nai,
        )

    all_sel = np.arange(len(keys))
    skill_inc, skill_can = skills(all_sel)
    gain = skill_can - skill_inc

    rng = np.random.default_rng(seed)
    boot = np.empty(n_boot, dtype=float)
    for b in range(n_boot):
        drawn = rng.choice(origins, size=len(origins), replace=True)
        sel = np.asarray(
            [index[k] for o in drawn for k in by_origin[o]], dtype=int
        )
        s_i, s_c = skills(sel)
        boot[b] = s_c - s_i

    finite = boot[np.isfinite(boot)]
    if finite.size == 0:
        return {"paired": False, "reason": "every bootstrap resample was degenerate"}

    lo = float(np.percentile(finite, 100 * alpha / 2))
    hi = float(np.percentile(finite, 100 * (1 - alpha / 2)))

    return {
        "paired": True,
        "n_origins": len(origins),
        "n_points": len(keys),
        "skill_incumbent": skill_inc,
        "skill_candidate": skill_can,
        "gain": float(gain),
        "lo": lo,
        "hi": hi,
        "sd": float(finite.std()),
        "p_better": float((finite > 0).mean()),
        "n_boot": int(finite.size),
        "interval": f"{100 * (1 - alpha):.0f}%",
        # The question the search actually has to answer.
        "demonstrated": bool(lo > 0),
    }


def decisive(comparison: dict, min_improvement: float = 0.0) -> bool:
    """
    Does this comparison justify moving off the incumbent?

    Two conditions, and the first is the one the old threshold could not express: the
    interval must clear zero, so the gain is distinguishable from noise at all, *and* the
    point estimate must clear `min_improvement`, so a demonstrated but negligible gain
    does not buy complexity. A threshold alone cannot do this — on six points 0.01 was
    0.04 standard deviations, which no amount of tuning fixes.
    """
    if not comparison.get("paired"):
        return False
    return bool(comparison.get("lo", 0.0) > 0.0
                and comparison.get("gain", 0.0) > min_improvement)
