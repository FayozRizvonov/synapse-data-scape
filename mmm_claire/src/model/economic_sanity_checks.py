import numpy as np
from src.logger import get_logger

logger = get_logger(__name__)


def run_economic_sanity_checks(bundle, contrib):

    """
    Enterprise economic plausibility checks.

    This module DOES NOT stop the model.
    It logs warnings when results look economically unrealistic.

    Checks performed:
    1. ROI explosion
    2. Contribution dominance
    3. Spend vs contribution imbalance
    """

    if "X_spend" not in bundle:
        logger.warning("Economic checks skipped (no spend data)")
        return

    X_spend = bundle["X_spend"]
    media = bundle["indexes"]["media"]

    contributions = contrib["contribution"]

    # ------------------------------------------
    # Aggregate totals
    # ------------------------------------------

    total_spend = X_spend.sum(axis=(0,1,2))
    total_contrib = contributions.sum(axis=(0,1,2))

    total_kpi = bundle["Y"].sum()

    revenue_per_unit = bundle.get("revenue_per_unit", None)

    if revenue_per_unit is not None:
        contrib_value = total_contrib * revenue_per_unit
    else:
        contrib_value = total_contrib

    roi = contrib_value / (total_spend + 1e-8)

    # ------------------------------------------
    # Check 1: ROI explosion
    # ------------------------------------------

    for i, m in enumerate(media):

        if roi[i] > 20:

            logger.warning(
                f"[SANITY CHECK] Very high ROI detected for {m}: {roi[i]:.2f}"
            )

    # ------------------------------------------
    # Check 2: Contribution dominance
    # ------------------------------------------

    contrib_share = total_contrib / (total_kpi + 1e-8)

    for i, m in enumerate(media):

        if contrib_share[i] > 0.60:

            logger.warning(
                f"[SANITY CHECK] {m} explains {contrib_share[i]*100:.1f}% of KPI — unusually high"
            )

    # ------------------------------------------
    # Check 3: Spend vs contribution mismatch
    # ------------------------------------------

    spend_share = total_spend / (total_spend.sum() + 1e-8)

    for i, m in enumerate(media):

        if spend_share[i] < 0.01 and contrib_share[i] > 0.10:

            logger.warning(
                f"[SANITY CHECK] {m} contributes {contrib_share[i]*100:.1f}% "
                f"but receives only {spend_share[i]*100:.1f}% of spend"
            )

    logger.info("Economic sanity checks completed")
