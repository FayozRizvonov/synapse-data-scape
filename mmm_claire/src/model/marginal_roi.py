import numpy as np
from src.logger import get_logger

logger = get_logger(__name__)


def compute_marginal_roi_curves(trace, bundle, diminishing_threshold=1.2):

    media_list = bundle["indexes"]["media"]
    X_media = bundle["X_media"]
    X_spend = bundle["X_spend"]

    y_std = bundle["y_std"]
    y_mean = bundle["y_mean"]

    revenue_per_unit = bundle["revenue_per_unit"]
    logger.info(f"Revenue per unit used in mROI: {revenue_per_unit}")

    shapes = bundle["shapes"]
    T = shapes["T"]
    C = shapes["C"]

    # ---------------------------------------
    # Posterior means
    # ---------------------------------------

    beta = trace.posterior["beta_media"].mean(dim=("chain", "draw")).values
    theta = trace.posterior["theta_media"].mean(dim=("chain", "draw")).values
    gamma = trace.posterior["gamma_media"].mean(dim=("chain", "draw")).values
    base_scaled = trace.posterior["base"].mean(dim=("chain", "draw")).values

    curves = {}

    MIN_SPEND_FACTOR = 0.2
    MAX_SPEND_FACTOR = 2.0
    GRID_SIZE = 40

    # ---------------------------------------
    # Helper: full prediction
    # ---------------------------------------

    def compute_full_prediction(X_input):

        X_ad = np.zeros_like(X_input)

        for c in range(C):
            for t in range(T):

                if t == 0:
                    X_ad[t, :, :, c] = X_input[t, :, :, c]
                else:
                    X_ad[t, :, :, c] = (
                        X_input[t, :, :, c]
                        + theta[c] * X_ad[t - 1, :, :, c]
                    )

        eps = 1e-6
        X_safe = np.clip(X_ad, eps, 1e6)

        X_sat = X_safe / (gamma + X_safe)

        media_effect_scaled = (X_sat * beta).sum(axis=3)

        mu_scaled = base_scaled + media_effect_scaled

        mu_original = mu_scaled * y_std + y_mean

        return mu_original

    # ---------------------------------------
    # Baseline prediction
    # ---------------------------------------

    mu_baseline = compute_full_prediction(X_media)
    baseline_total_kpi = mu_baseline.sum()
    baseline_total_revenue = baseline_total_kpi * revenue_per_unit

    # ---------------------------------------
    # Build ROI curves
    # ---------------------------------------

    for c, m in enumerate(media_list):

        current_spend = X_spend[..., c].sum()

        if current_spend <= 0:
            continue

        spend_grid = np.linspace(
            MIN_SPEND_FACTOR * current_spend,
            MAX_SPEND_FACTOR * current_spend,
            GRID_SIZE,
        )

        revenue_curve = []
        exposure_curve = []
        incremental_revenue_curve = []

        for s in spend_grid:

            scale_factor = s / current_spend

            X_new = X_media.copy()
            X_new[..., c] = X_media[..., c] * scale_factor

            mu_new = compute_full_prediction(X_new)

            total_kpi = mu_new.sum()
            total_revenue = total_kpi * revenue_per_unit

            # incremental revenue vs baseline
            incremental_revenue = total_revenue - baseline_total_revenue

            revenue_curve.append(total_revenue)
            incremental_revenue_curve.append(incremental_revenue)

            exposure_curve.append(X_new[..., c].mean())

        revenue_curve = np.array(revenue_curve)
        incremental_revenue_curve = np.array(incremental_revenue_curve)
        exposure_curve = np.array(exposure_curve)

        # ---------------------------------------
        # ROI curves
        # ---------------------------------------

        roi_curve = incremental_revenue_curve / (spend_grid + 1e-8)

        mroi_curve = np.gradient(incremental_revenue_curve, spend_grid)

        contribution_curve = incremental_revenue_curve / (revenue_per_unit + 1e-8)

        curves[m] = {
            "spend": spend_grid,
            "exposure": exposure_curve,
            "contribution": contribution_curve,
            "revenue": revenue_curve,
            "incremental_revenue": incremental_revenue_curve,
            "roi": roi_curve,
            "mroi": mroi_curve,
        }

    logger.info("Marginal ROI curves computed (ENTERPRISE DELTA MODE)")

    return curves
