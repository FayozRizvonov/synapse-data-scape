from src.config import (
    ALLOWED_TYPES,
    ALLOWED_VARIATION_LEVELS,
    ALLOWED_EXPECTED_SIGNS
)
from src.logger import get_logger

logger = get_logger(__name__)


def validate_info(info):
    logger.info("Validating info.csv rules")

    # --------------------------------------------------
    # 1️⃣ Basic Structural Checks
    # --------------------------------------------------

    if info["variable"].duplicated().any():
        raise ValueError("Duplicate variable names in info.csv")

    if not set(info["type"]).issubset(ALLOWED_TYPES):
        invalid = set(info["type"]) - set(ALLOWED_TYPES)
        raise ValueError(f"Invalid values found in info.type: {invalid}")

    if not set(info["variation_level"]).issubset(ALLOWED_VARIATION_LEVELS):
        raise ValueError("Invalid values found in info.variation_level")

    if not set(info["expected_sign"]).issubset(ALLOWED_EXPECTED_SIGNS):
        raise ValueError("Invalid values found in info.expected_sign")

    # --------------------------------------------------
    # 2️⃣ KPI Rules (NEW LOGIC)
    # --------------------------------------------------

    kpi_volume_count = (info["type"] == "kpi_volume").sum()
    kpi_revenue_count = (info["type"] == "kpi_revenue").sum()

    # At least one KPI must exist
    if kpi_volume_count + kpi_revenue_count == 0:
        raise ValueError(
            "At least one KPI must be defined (kpi_volume or kpi_revenue)"
        )

    # Only one of each allowed
    if kpi_volume_count > 1:
        raise ValueError("Only one kpi_volume allowed")

    if kpi_revenue_count > 1:
        raise ValueError("Only one kpi_revenue allowed")

    # --------------------------------------------------
    # 3️⃣ Enforce Media Sign Requirement
    # --------------------------------------------------

    media_rows = info[info["type"] == "media"]

    if media_rows["expected_sign"].isnull().any():
        raise ValueError("All media variables must define expected_sign")

    # --------------------------------------------------
    # 4️⃣ Logging clarity
    # --------------------------------------------------

    if kpi_volume_count == 1 and kpi_revenue_count == 1:
        logger.info(
            "KPI setup: volume used for modelling, revenue used for ROI"
        )

    elif kpi_volume_count == 1:
        logger.info(
            "KPI setup: only volume defined — used for modelling and ROI"
        )

    elif kpi_revenue_count == 1:
        logger.info(
            "KPI setup: only revenue defined — used for modelling and ROI"
        )

    logger.info("info.csv validation passed")
