import pandas as pd
from src.config import DATA_FILE, INFO_FILE
from src.logger import get_logger

logger = get_logger(__name__)


def load_data(data_path=None, info_path=None):
    """
    Load data.csv and info.csv.

    Parameters
    ----------
    data_path : str | Path | None
        Override path for data.csv.  Defaults to DATA_FILE from config.
    info_path : str | Path | None
        Override path for info.csv.  Defaults to INFO_FILE from config.
    """
    _data_path = data_path or DATA_FILE
    _info_path = info_path or INFO_FILE

    logger.info(f"Loading data from {_data_path}")
    data = pd.read_csv(_data_path)

    logger.info(f"Loading info from {_info_path}")
    info = pd.read_csv(_info_path)

    return data, info
