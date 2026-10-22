"""
Out-of-sample validation for the MMM.

Until now every reported number — r2, MAPE, RMSE, Bayesian R2 — was computed on the
same periods the model was fitted to. That is fine for describing a fit and useless for
deciding whether a specification generalises. An agent that searches specifications
while scoring itself in-sample will converge on overfitting, because overfitting is what
in-sample scoring rewards.

This module holds out the last `n_holdout` periods, refits on the remainder, and scores
the model on periods it never saw.

The scoring needs a forward pass outside PyMC, because adstock is a recursive scan whose
length is baked into the compiled graph: you cannot simply lengthen the input. So
`forward_mu` reimplements the model's deterministic forward computation in NumPy,
carrying adstock state across the train/test boundary.

Reimplementing a forward model invites silent divergence from the real one, so
`verify_forward_model` recomputes mu for the *training* window and checks it against the
trace's own `mu`. Any drift in `pymc_mmm.py` that this module does not mirror shows up
there as a failed check rather than as a quietly wrong holdout score.
"""

from __future__ import annotations

import copy
from typing import Dict, Optional, Tuple

import numpy as np

from src.logger import get_logger

logger = get_logger(__name__)

# Highest indexed seasonal harmonic the model can declare (see search/spec.py).
MAX_SEASONAL_HARMONICS = 2


# ---------------------------------------------------------------------------
# splitting
# ---------------------------------------------------------------------------

def split_bundle(bundle: dict, n_holdout: int) -> Tuple[dict, dict]:
    """
    Split a tensor bundle into train / holdout along the time axis.

    Returns ``(train_bundle, split_info)``. The split is chronological — the holdout is
    always the most recent periods, never a random sample, because random splits leak
    future information through adstock carryover.

    Known residual: only the time-indexed arrays are sliced. ``X_spend`` is shared by
    reference, so the spend-share prior shift in `build_pymc_model` is computed from the
    whole series including the holdout window. It moves prior *means* using aggregate
    spend totals, never the target, so it is a far milder leak than the split protects
    against — but it is a leak, and changing it would move the published holdout
    baseline, so it is documented rather than silently fixed.
    """

    T = bundle["shapes"]["T"]

    if n_holdout <= 0:
        raise ValueError(f"n_holdout must be positive, got {n_holdout}")
    if n_holdout >= T:
        raise ValueError(
            f"n_holdout ({n_holdout}) must leave training periods: T is {T}"
        )

    t_train = T - n_holdout
    train = copy.copy(bundle)

    # Slice every time-indexed array. Everything else is shared by reference.
    for key in ("Y", "Y_scaled", "Y_revenue", "X_media", "X_media_scaled", "X_control"):
        if key in bundle and bundle[key] is not None:
            train[key] = bundle[key][:t_train]

    train["shapes"] = dict(bundle["shapes"])
    train["shapes"]["T"] = t_train

    train["coords"] = dict(bundle["coords"])
    train["coords"]["time"] = list(bundle["coords"]["time"])[:t_train]

    if "indexes" in bundle:
        train["indexes"] = dict(bundle["indexes"])
        train["indexes"]["time"] = list(bundle["indexes"]["time"])[:t_train]

    split_info = {
        "n_total": int(T),
        "n_train": int(t_train),
        "n_holdout": int(n_holdout),
        "train_periods": [str(p) for p in list(bundle["coords"]["time"])[:t_train]],
        "holdout_periods": [str(p) for p in list(bundle["coords"]["time"])[t_train:]],
    }

    logger.info(
        f"Holdout split: {t_train} train / {n_holdout} holdout "
        f"(holdout starts {split_info['holdout_periods'][0]})"
    )

    return train, split_info


# ---------------------------------------------------------------------------
# forward model (mirrors pymc_mmm.py)
# ---------------------------------------------------------------------------

def _thin(trace, max_draws: int):
    """Flatten chain+draw into a single axis, thinned to at most `max_draws`."""
    post = trace.posterior
    stacked = post.stack(sample=("chain", "draw"))
    n = stacked.sizes["sample"]
    if n <= max_draws:
        idx = np.arange(n)
    else:
        idx = np.linspace(0, n - 1, max_draws).astype(int)
    return stacked.isel(sample=idx), idx


def _seasonality(params, T: int, model_frequency: str) -> np.ndarray:
    """
    Mirror of the season term in pymc_mmm.py. Returns (draws, T).

    Reads whichever seasonality variables the trace actually contains rather than
    assuming a layout, because the model names them two ways: the monthly default
    declares `seasonality_sin`/`seasonality_cos`, while the weekly default and every
    searched spec use the indexed `seasonality_sin{k}`/`seasonality_cos{k}`. A spec
    with zero harmonics declares none at all.
    """
    t = np.arange(T)
    period = 52.0 if model_frequency == "weekly" else 12.0

    def g(name):
        return params[name].values.reshape(-1, 1) if name in params else None

    total = None

    def add(term):
        nonlocal total
        total = term if total is None else total + term

    # unindexed pair (the monthly default) is the first harmonic
    s, c = g("seasonality_sin"), g("seasonality_cos")
    if s is not None and c is not None:
        add(s * np.sin(2 * np.pi * t / period) + c * np.cos(2 * np.pi * t / period))

    # indexed harmonics
    for k in range(1, MAX_SEASONAL_HARMONICS + 1):
        sk, ck = g(f"seasonality_sin{k}"), g(f"seasonality_cos{k}")
        if sk is None or ck is None:
            continue
        add(
            sk * np.sin(2 * k * np.pi * t / period)
            + ck * np.cos(2 * k * np.pi * t / period)
        )

    return np.zeros((1, T)) if total is None else total


def forward_mu(
    trace,
    bundle_full: dict,
    model_frequency: str = "weekly",
    max_draws: int = 500,
) -> np.ndarray:
    """
    Recompute mu over the FULL time range from posterior draws.

    Adstock is run from t=0 across the whole series so carryover into the holdout window
    reflects the media that actually preceded it. Returns ``(draws, T, G, SB)`` on the
    model's scaled units.
    """

    params, _ = _thin(trace, max_draws)

    X_media = bundle_full["X_media"]          # (T, G, SB, C)
    X_control = bundle_full["X_control"]      # (T, G, SB, K)
    T, G, SB, C = X_media.shape

    theta = params["theta_media"].values.T    # (draws, C)
    gamma = params["gamma_media"].values.T    # (draws, C)
    beta_m = params["beta_media"].values.T    # (draws, C)
    D = theta.shape[0]

    # --- adstock: x_ad[t] = x[t] + theta * x_ad[t-1] ---
    th = theta[:, None, None, :]                       # (D,1,1,C)
    x_ad = np.empty((D, T, G, SB, C), dtype=np.float64)
    prev = np.zeros((D, G, SB, C), dtype=np.float64)
    for t in range(T):
        prev = X_media[t][None, ...] + th * prev
        x_ad[:, t] = prev

    # --- Hill saturation ---
    x_safe = np.clip(x_ad, 1e-6, 1e6)
    gm = gamma[:, None, None, None, :]
    x_sat = x_safe / (gm + x_safe)

    media_effect = np.sum(x_sat * beta_m[:, None, None, None, :], axis=-1)  # (D,T,G,SB)

    # --- base ---
    intercept = params["intercept"].values.reshape(-1, 1, 1, 1)

    # A spec may switch the trend off, in which case beta_trend is never declared.
    if "beta_trend" in params:
        trend = (
            params["beta_trend"].values.reshape(-1, 1) * np.arange(T)[None, :]
        )[:, :, None, None]
    else:
        trend = np.zeros((1, T, 1, 1))
    season = _seasonality(params, T, model_frequency)[:, :, None, None]

    beta_c = params["beta_control"].values.T                                # (draws, K)
    control_effect = np.sum(
        X_control[None, ...] * beta_c[:, None, None, None, :], axis=-1
    )                                                                       # (D,T,G,SB)

    return intercept + trend + season + control_effect + media_effect


def verify_forward_model(
    trace,
    bundle_train: dict,
    model_frequency: str,
    tol: float = 1e-6,
) -> Dict[str, float]:
    """
    Check this module's NumPy forward pass against PyMC's own `mu` on the training
    window. A mismatch means `pymc_mmm.py` changed and `forward_mu` no longer mirrors it
    — fix that before trusting any holdout number.
    """

    mu_np = forward_mu(trace, bundle_train, model_frequency, max_draws=200).mean(axis=0)

    stacked, idx = _thin(trace, 200)
    mu_pymc = stacked["mu"].values            # (T, G, SB, sample)
    mu_pymc = np.moveaxis(mu_pymc, -1, 0).mean(axis=0)

    diff = np.abs(mu_np - mu_pymc)
    result = {
        "max_abs_diff": float(diff.max()),
        "mean_abs_diff": float(diff.mean()),
        "matches": bool(diff.max() < tol),
    }

    if result["matches"]:
        logger.info(
            f"Forward-model check PASSED (max abs diff {result['max_abs_diff']:.2e})"
        )
    else:
        logger.error(
            f"Forward-model check FAILED: max abs diff {result['max_abs_diff']:.2e} "
            f"exceeds {tol:.0e}. src/validation/holdout.py no longer mirrors "
            "src/model/pymc_mmm.py — holdout scores are not trustworthy."
        )

    return result


# ---------------------------------------------------------------------------
# scoring
# ---------------------------------------------------------------------------

def score_holdout(
    trace,
    bundle_full: dict,
    split_info: dict,
    model_frequency: str = "weekly",
    max_draws: int = 500,
) -> dict:
    """
    Score a train-fitted trace on the held-out periods.

    `r2_vs_train_mean` is the honest out-of-sample r2: it measures the model against a
    forecaster that predicts the training mean, which is the thing a model must beat to
    be worth anything. (r2 computed against the *holdout's own* mean is also reported,
    but it flatters the model by granting it knowledge it did not have.)
    """

    n_train = split_info["n_train"]

    mu_draws = forward_mu(trace, bundle_full, model_frequency, max_draws)
    mu_scaled = mu_draws.mean(axis=0)

    y_mean, y_std = bundle_full["y_mean"], bundle_full["y_std"]
    y_pred_all = mu_scaled * y_std + y_mean
    y_true_all = bundle_full["Y_scaled"] * y_std + y_mean

    y_pred = y_pred_all[n_train:].ravel()
    y_true = y_true_all[n_train:].ravel()
    y_train = y_true_all[:n_train].ravel()

    eps = 1e-8
    resid = y_true - y_pred
    rmse = float(np.sqrt(np.mean(resid ** 2)))
    mape = float(np.mean(np.abs(resid / np.maximum(np.abs(y_true), eps))))

    ss_res = float(np.sum(resid ** 2))
    ss_train = float(np.sum((y_true - y_train.mean()) ** 2))
    ss_own = float(np.sum((y_true - y_true.mean()) ** 2))

    # 90% predictive interval coverage — is the stated uncertainty honest?
    pred_draws = (mu_draws[:, n_train:] * y_std + y_mean).reshape(mu_draws.shape[0], -1)
    lo = np.percentile(pred_draws, 5, axis=0)
    hi = np.percentile(pred_draws, 95, axis=0)
    coverage = float(np.mean((y_true >= lo) & (y_true <= hi)))

    naive_rmse = float(np.sqrt(np.mean((y_true - y_train.mean()) ** 2)))

    metrics = {
        "n_holdout": split_info["n_holdout"],
        "n_train": n_train,
        "rmse": rmse,
        "mape": mape,
        "r2_vs_train_mean": float(1.0 - ss_res / ss_train) if ss_train > 0 else float("nan"),
        "r2_vs_holdout_mean": float(1.0 - ss_res / ss_own) if ss_own > 0 else float("nan"),
        "naive_rmse_train_mean": naive_rmse,
        "skill_vs_naive": float(1.0 - rmse / naive_rmse) if naive_rmse > 0 else float("nan"),
        "coverage_90": coverage,
        "holdout_periods": split_info["holdout_periods"],
    }

    logger.info(
        f"HOLDOUT | n={metrics['n_holdout']} "
        f"RMSE={rmse:,.1f} (naive {naive_rmse:,.1f}) "
        f"MAPE={mape:.3f} r2={metrics['r2_vs_train_mean']:.3f} "
        f"skill={metrics['skill_vs_naive']:+.3f} coverage90={coverage:.2f}"
    )

    if metrics["skill_vs_naive"] <= 0:
        logger.warning(
            "HOLDOUT | the model does not beat predicting the training mean. "
            "Out-of-sample it carries no information."
        )

    return metrics
