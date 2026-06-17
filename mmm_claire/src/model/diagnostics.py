DEBUG_MODE = False
import arviz as az
import numpy as np
from src.logger import get_logger
import pymc as pm
import numpy as np
import pandas as pd

logger = get_logger(__name__)

def thin_trace(trace, max_draws=200):
    """
    Reduce posterior draws for fast PPC.
    Works for PyMC v5 InferenceData.
    """
    n_draws = trace.posterior.sizes["draw"]

    if n_draws <= max_draws:
        return trace

    step = n_draws // max_draws
    return trace.sel(draw=slice(0, n_draws, step))

def run_diagnostics(
    trace,
    rhat_threshold: float = 1.05,
    ess_threshold: int = 200,
):
    """
    Run convergence diagnostics.

    Returns
    -------
    dict with diagnostics summary
    """

    logger.info("Running diagnostics")

    summary = az.summary(trace, round_to=2)

    # R-hat checks
    bad_rhat = summary[summary["r_hat"] > rhat_threshold]

    # ESS checks
    bad_ess = summary[summary["ess_bulk"] < ess_threshold]

    diagnostics = {
        "passed": True,
        "max_rhat": summary["r_hat"].max(),
        "min_ess": summary["ess_bulk"].min(),
        "n_bad_rhat": len(bad_rhat),
        "n_bad_ess": len(bad_ess),
    }

    if len(bad_rhat) > 0:
        logger.warning(
            f"R-hat violation: {len(bad_rhat)} parameters exceed {rhat_threshold}"
        )
        diagnostics["passed"] = False

    if len(bad_ess) > 0:
        logger.warning(
            f"ESS violation: {len(bad_ess)} parameters below {ess_threshold}"
        )
        diagnostics["passed"] = False

    if diagnostics["passed"]:
        logger.info("Diagnostics PASSED")
    else:
        logger.warning("Diagnostics FAILED")

    return diagnostics


def posterior_predictive_check(
    model,
    trace,
    y_obs,
    coverage_threshold: float = 0.9,
):
    """
    Posterior Predictive Check (PPC)
    """

    logger.info("Running posterior predictive checks")

    trace_ppc = thin_trace(trace, max_draws=100)

    with model:
        ppc = pm.sample_posterior_predictive(
            trace_ppc,
            var_names=["likelihood"],   # <-- FIXED
            random_seed=42
        )

    y_sim = ppc.posterior_predictive["likelihood"].values
    # shape: (chains, draws, T, G, SB)

    lower = np.percentile(y_sim, 5, axis=(0, 1))
    upper = np.percentile(y_sim, 95, axis=(0, 1))

    coverage = np.mean((y_obs >= lower) & (y_obs <= upper))

    logger.info(f"PPC coverage: {coverage:.3f}")

    return {
        "coverage": float(coverage),
        "passed": coverage >= coverage_threshold,
    }


# -------------------------------------------------
# 1. Prediction extraction
# -------------------------------------------------

def extract_predictions(trace, bundle):
    """
    Extract posterior mean predictions and actuals (scaled + unscaled)
    """

    y_actual_scaled = bundle["Y_scaled"]

    y_pred_scaled = (
        trace.posterior["mu"]
        .mean(dim=("chain", "draw"))
        .values
    )

    # unscale
    y_actual = y_actual_scaled * bundle["y_std"] + bundle["y_mean"]
    y_pred = y_pred_scaled * bundle["y_std"] + bundle["y_mean"]

    return {
        "y_actual_scaled": y_actual_scaled,
        "y_pred_scaled": y_pred_scaled,
        "y_actual": y_actual,
        "y_pred": y_pred,
    }


# -------------------------------------------------
# 2. Residuals
# -------------------------------------------------

def compute_residuals(y_actual, y_pred):
    return y_actual - y_pred


# -------------------------------------------------
# 3. Fit metrics
# -------------------------------------------------

def compute_fit_metrics(y_actual, y_pred):
    eps = 1e-8

    rmse = np.sqrt(np.mean((y_actual - y_pred) ** 2))

    mape = np.mean(
        np.abs((y_actual - y_pred) / np.maximum(np.abs(y_actual), eps))
    )

    ss_res = np.sum((y_actual - y_pred) ** 2)
    ss_tot = np.sum((y_actual - np.mean(y_actual)) ** 2)
    r2 = 1.0 - ss_res / ss_tot if ss_tot > 0 else np.nan

    return {
        "rmse": float(rmse),
        "mape": float(mape),
        "r2": float(r2),
    }


# -------------------------------------------------
# 4. Base vs media diagnostics
# -------------------------------------------------

def compute_base_vs_media(trace, bundle):
    """
    Compare base-only vs full prediction
    """

    y_pred_scaled = (
        trace.posterior["mu"]
        .mean(dim=("chain", "draw"))
        .values
    )
    if "media_effect" not in trace.posterior.data_vars:
        raise RuntimeError(
            "media_effect not found in trace. "
            "Did you forget pm.Deterministic('media_effect', ...)?"
        )

    media_effect_scaled = (
        trace.posterior["media_effect"]
        .mean(dim=("chain", "draw"))
        .values
    )

    base_pred_scaled = y_pred_scaled - media_effect_scaled

    # unscale
    base_pred = base_pred_scaled * bundle["y_std"] + bundle["y_mean"]
    y_pred = y_pred_scaled * bundle["y_std"] + bundle["y_mean"]
    y_actual = bundle["Y_scaled"] * bundle["y_std"] + bundle["y_mean"]

    base_metrics = compute_fit_metrics(y_actual, base_pred)
    full_metrics = compute_fit_metrics(y_actual, y_pred)

    return {
        "base_metrics": base_metrics,
        "full_metrics": full_metrics,
    }

def compute_bayesian_r2(trace):
    """
    Compute Bayesian R-squared (Gelman et al.)
    """

    # mu: (chain, draw, T, G, SB)
    mu = trace.posterior["mu"].values

    # sigma: (chain, draw)
    sigma = trace.posterior["sigma"].values

    # Flatten spatial/time dimensions
    mu_flat = mu.reshape(mu.shape[0], mu.shape[1], -1)

    # Var(E[y | theta])
    var_signal = np.var(mu_flat, axis=2)

    # E[Var(y | theta)] = sigma^2
    var_noise = sigma ** 2

    r2 = var_signal / (var_signal + var_noise)

    return {
        "bayesian_r2_mean": float(r2.mean()),
        "bayesian_r2_p05": float(np.percentile(r2, 5)),
        "bayesian_r2_p95": float(np.percentile(r2, 95)),
    }

# -------------------------------------------------
# 5. Assemble full diagnostics
# -------------------------------------------------

def run_prediction_diagnostics(trace, bundle):
    """
    Master function called by runner
    """

    preds = extract_predictions(trace, bundle)

    residuals = compute_residuals(
        preds["y_actual"],
        preds["y_pred"],
    )

    fit_metrics = compute_fit_metrics(
        preds["y_actual"],
        preds["y_pred"],
    )

    base_vs_media = compute_base_vs_media(trace, bundle)
    bayes_r2 = compute_bayesian_r2(trace)
    logger.info(
        f"Fit metrics | RMSE={fit_metrics['rmse']:.4f}, "
        f"MAPE={fit_metrics['mape']:.4f}, "
        f"R2={fit_metrics['r2']:.4f}"
    )

    logger.info(
        f"Base RMSE={base_vs_media['base_metrics']['rmse']:.4f} | "
        f"Full RMSE={base_vs_media['full_metrics']['rmse']:.4f}"
    )
    logger.info(
        f"Bayesian R2 | mean={bayes_r2['bayesian_r2_mean']:.3f} "
        f"(p05={bayes_r2['bayesian_r2_p05']:.3f}, "
        f"p95={bayes_r2['bayesian_r2_p95']:.3f})"
    )
    return {
        "fit_metrics": fit_metrics,
        "bayesian_r2": bayes_r2,
        "base_vs_media": base_vs_media,
        "residuals": residuals,
        "predictions": preds,
        "trace": trace
    }

