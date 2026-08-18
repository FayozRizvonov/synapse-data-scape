import numpy as np
from src.logger import get_logger

logger = get_logger(__name__)


def compute_roi(bundle, contrib):
    """
    Compute business-correct ROI.

    If revenue exists:
        ROI = revenue_contribution / spend

    If revenue not provided:
        ROI = volume_contribution / spend
    """

    if "X_spend" not in bundle:
        logger.warning("No spend data found. ROI disabled.")
        return None

    X_spend = bundle["X_spend"]
    contribution_volume = contrib["contribution"]
    media = bundle["indexes"]["media"]

    Y_revenue = bundle.get("Y_revenue")
    Y_volume = bundle["Y"]

    results = {
        "national": {},
        "local": {}
    }

    # --------------------------------------------------
    # Revenue per unit calculation
    # --------------------------------------------------

    if Y_revenue is not None:

        total_revenue = Y_revenue.sum()
        total_volume = Y_volume.sum()

        if total_volume > 0:
            revenue_per_unit = total_revenue / total_volume
        else:
            revenue_per_unit = 0.0

        logger.info(
            f"ROI computed using REVENUE | "
            f"Revenue per unit = {revenue_per_unit:.4f}"
        )

    else:

        revenue_per_unit = None
        logger.info("ROI computed using model KPI (volume-based)")

    # --------------------------------------------------
    # National ROI
    # --------------------------------------------------

    total_contrib_volume = contribution_volume.sum(axis=(0, 1, 2))
    total_spend = X_spend.sum(axis=(0, 1, 2))

    # Prevent negative noise contributions
    total_contrib_volume = np.maximum(total_contrib_volume, 0)

    if revenue_per_unit is not None:
        total_contrib_value = total_contrib_volume * revenue_per_unit
    else:
        total_contrib_value = total_contrib_volume

    national_roi = np.divide(
        total_contrib_value,
        total_spend,
        out=np.full_like(total_contrib_value, np.nan),
        where=total_spend > 0
    )

    # Convert to clean floats for downstream export
    for i, m in enumerate(media):
        results["national"][m] = float(national_roi[i])

    # Store revenue per unit for marginal ROI module
    bundle["revenue_per_unit"] = revenue_per_unit

    logger.info("ROI computation completed")

    return results
