import pandas as pd
from src.logger import get_logger

logger = get_logger(__name__)

def validate_data(data, info):
    logger.info("Validating data.csv rules")

    # date format
    try:
        pd.to_datetime(data["date"], format="%Y-%m-%d")
    except Exception:
        raise ValueError("Date must be in YYYY-MM-DD format")

    # variable existence
    missing_vars = set(data["variable"]) - set(info["variable"])
    if missing_vars:
        raise ValueError(f"Variables in data.csv not found in info.csv: {missing_vars}")

    # -------------------------------------------------
    # Identify KPI variables (volume/revenue)
    # -------------------------------------------------

    kpi_volume = info.loc[info["type"] == "kpi_volume", "variable"].tolist()
    kpi_revenue = info.loc[info["type"] == "kpi_revenue", "variable"].tolist()

    if kpi_volume:
        kpi_var = kpi_volume[0]
    elif kpi_revenue:
        kpi_var = kpi_revenue[0]
    else:
        raise ValueError("No KPI defined in info.csv")

    if kpi_var not in data["variable"].unique():
        raise ValueError(f"KPI variable '{kpi_var}' not found in data.csv")


    logger.info("data.csv validation passed")
