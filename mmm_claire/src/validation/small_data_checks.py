from src.logger import get_logger

logger = get_logger(__name__)


def small_data_warnings(bundle: dict):
    T = bundle["shapes"]["T"]
    C = bundle["shapes"]["C"]
    K = bundle["shapes"]["K"]

    if T < 30:
        logger.warning(
            f"SMALL DATA MODE: Only {T} time points. "
            "Strong priors and pooling will be enforced."
        )

    if C >= T:
        logger.warning(
            f"HIGH MEDIA COUNT: {C} media variables for {T} time points."
        )

    if K > T:
        logger.warning(
            f"HIGH CONTROL COUNT: {K} controls for {T} time points."
        )
