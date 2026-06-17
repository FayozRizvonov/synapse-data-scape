from src.config import (
    REQUIRED_DATA_COLUMNS,
    REQUIRED_INFO_COLUMNS
)
from src.logger import get_logger

logger = get_logger(__name__)

def validate_schema(data, info):
    logger.info("Validating CSV schemas")

    missing_data_cols = REQUIRED_DATA_COLUMNS - set(data.columns)
    if missing_data_cols:
        raise ValueError(f"Missing columns in data.csv: {missing_data_cols}")

    missing_info_cols = REQUIRED_INFO_COLUMNS - set(info.columns)
    if missing_info_cols:
        raise ValueError(f"Missing columns in info.csv: {missing_info_cols}")

    logger.info("Schema validation passed")
