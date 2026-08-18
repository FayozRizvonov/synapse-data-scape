import pandas as pd
import numpy as np
from src.logger import get_logger

logger = get_logger(__name__)


def detect_frequency(data):

    dates = pd.to_datetime(data["date"]).sort_values().unique()

    if len(dates) < 2:
        return "unknown"

    diffs = pd.Series(dates).diff().dropna().dt.days

    median_gap = diffs.median()

    if median_gap <= 8:
        return "weekly"
    else:
        return "monthly"


def harmonic_week_split(month_value, weeks):

    idx = np.arange(weeks)

    weights = 1 + 0.3 * np.sin(2 * np.pi * idx / weeks)

    weights = weights / weights.sum()

    return month_value * weights


def expand_month_to_weeks(date):

    month_start = pd.to_datetime(date)

    week_dates = pd.date_range(
        start=month_start,
        periods=4,
        freq="W"
    )

    return week_dates


def convert_monthly_to_weekly(data):

    logger.info("Checking if monthly to weekly conversion required")

    freq = detect_frequency(data)

    if freq == "weekly":

        logger.info("Weekly data detected. No conversion required.")

        data["model_frequency"] = "weekly"

        return data, "weekly", "weekly"

    logger.info("Monthly data detected. Converting to weekly.")

    rows = []

    grouped = data.groupby(
        ["date", "region", "sub_brand", "variable"]
    )["value"].sum().reset_index()

    for r in grouped.itertuples():

        weeks = expand_month_to_weeks(r.date)

        weekly_vals = harmonic_week_split(r.value, len(weeks))

        for w, v in zip(weeks, weekly_vals):

            rows.append({
                "date": w,
                "region": r.region,
                "sub_brand": r.sub_brand,
                "variable": r.variable,
                "value": v
            })

    weekly_df = pd.DataFrame(rows)

    # ---------------------------------------------------
    # Reconciliation Check (CRITICAL ENTERPRISE SAFETY)
    # ---------------------------------------------------

    orig = data.groupby(["variable"])["value"].sum().sort_index()
    new = weekly_df.groupby(["variable"])["value"].sum().sort_index()

    if not np.allclose(orig.values, new.values, atol=1e-6):

        logger.error("Monthly to Weekly reconciliation failed!")

        logger.error(f"Original totals:\n{orig}")
        logger.error(f"Weekly totals:\n{new}")

        raise ValueError(
            "Monthly to weekly conversion changed totals. "
            "Aborting for safety."
        )

    logger.info("Reconciliation check passed: monthly totals preserved.")

    logger.info("Monthly to weekly conversion completed")

    return weekly_df, "monthly", "weekly"
