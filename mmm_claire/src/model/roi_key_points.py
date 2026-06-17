import numpy as np
from src.logger import get_logger
from src.model.marginal_roi import compute_marginal_roi_curves

logger = get_logger(__name__)


def extract_roi_key_points(trace, bundle):

    curves = compute_marginal_roi_curves(trace, bundle)

    media_list = bundle["indexes"]["media"]
    X_spend = bundle["X_spend"]
    X_media = bundle["X_media"]

    results = {}

    # ----------------------------------------------------
    # Enterprise economic threshold
    # ----------------------------------------------------

    TARGET_MROI = 1.0          # break-even economic ROI
    DIMINISHING_THRESHOLD = 1.2

    for i, m in enumerate(media_list):

        if m not in curves:
            continue

        data = curves[m]

        spend_grid = data["spend"]
        exposure_grid = data["exposure"]
        roi_curve = data["roi"]
        mroi_curve = data["mroi"]
        revenue_curve = data["revenue"]

        current_spend = X_spend[..., i].sum()
        current_exposure = X_media[..., i].mean()

        # ---------------------------------------
        # Smooth marginal ROI (avoid noise)
        # ---------------------------------------

        mroi_smooth = np.convolve(
            mroi_curve,
            np.ones(3)/3,
            mode="same"
        )

        # ---------------------------------------
        # Current point
        # ---------------------------------------

        idx_current = np.argmin(np.abs(spend_grid - current_spend))

        # ---------------------------------------
        # Optimal economic point
        # ---------------------------------------

        opt_idx = np.where(mroi_smooth <= TARGET_MROI)[0]

        if len(opt_idx) > 0:
            idx_opt = opt_idx[0]
        else:
            idx_opt = len(spend_grid) - 1

        # ---------------------------------------
        # Diminishing return point
        # ---------------------------------------

        dim_idx = np.where(mroi_smooth <= DIMINISHING_THRESHOLD)[0]

        if len(dim_idx) > 0:
            idx_dim = dim_idx[0]
        else:
            idx_dim = len(spend_grid) - 1

        # ---------------------------------------
        # Save results
        # ---------------------------------------

        results[m] = {

            "current": {
                "spend": float(current_spend),
                "exposure": float(current_exposure),
                "roi": float(roi_curve[idx_current]),
                "mroi": float(mroi_curve[idx_current]),
                "revenue": float(revenue_curve[idx_current]),
            },

            "optimal_economic": {
                "spend": float(spend_grid[idx_opt]),
                "exposure": float(exposure_grid[idx_opt]),
                "roi": float(roi_curve[idx_opt]),
                "mroi": float(mroi_curve[idx_opt]),
                "revenue": float(revenue_curve[idx_opt]),
            },

            "diminishing_point": {
                "spend": float(spend_grid[idx_dim]),
                "exposure": float(exposure_grid[idx_dim]),
                "roi": float(roi_curve[idx_dim]),
                "mroi": float(mroi_curve[idx_dim]),
                "revenue": float(revenue_curve[idx_dim]),
            }
        }

    logger.info("ROI key points extracted successfully")

    return results
