import pandas as pd
from src.logger import get_logger

logger = get_logger(__name__)

def load_spend(spend_file):
    logger.info("Loading spend.csv")
    df = pd.read_csv(spend_file)

    required_cols = {"date", "media", "spend"}
    if not required_cols.issubset(df.columns):
        raise ValueError(
            "spend.csv must contain at least: date, media, spend"
        )

    # Optional columns
    if "region" not in df.columns:
        df["region"] = None
    if "sub_brand" not in df.columns:
        df["sub_brand"] = None

    df["date"] = pd.to_datetime(df["date"])
    df["spend"] = df["spend"].astype(float)

    logger.info("Spend data loaded successfully")
    return df