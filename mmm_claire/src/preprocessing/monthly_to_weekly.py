"""
Frequency resolution for the modeling pipeline.

The model fits whatever frequency the client's data arrives in. Monthly data stays
monthly; upsampling to weekly is opt-in and off by default.

Why: upsampling adds no information. `harmonic_week_split` below spreads each monthly
value over 4 weeks with weights ``1 + 0.3*sin(2*pi*i/4)`` -> ``[0.250, 0.325, 0.250,
0.175]``, i.e. a deterministic +/-30% sawtooth applied in identical phase to the KPI,
every media channel and every control. Measured on the 33-month dovato dataset
(2026-10-11), that artifact was 42.5% of weekly target variance, and a model with *zero*
media effects scored weekly r2 = 1.000 against it. Reported weekly r2 was 0.398 while
the same predictions aggregated back to monthly scored 0.052. It also quadrupled the row
count (33 -> 132), understating posterior sd by ~2x and letting the R-hat/ESS governance
gates pass on fabricated data volume.
"""

import os

import pandas as pd
import numpy as np

from src.logger import get_logger

logger = get_logger(__name__)


def _env_flag(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


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


def resolve_model_frequency(data, upsample=None):
    """
    Decide the frequency the model will fit and return the data at that frequency.

    Returns ``(data, original_frequency, model_frequency)``.

    By default monthly data is returned untouched and modelled monthly. Set
    ``upsample=True`` (or ``MMM_UPSAMPLE_MONTHLY=1``) to restore the legacy
    monthly->weekly expansion; see this module's docstring for why you should not.
    """

    if upsample is None:
        upsample = _env_flag("MMM_UPSAMPLE_MONTHLY", False)

    freq = detect_frequency(data)

    if freq == "weekly":
        logger.info("Weekly data detected. Modeling weekly.")
        data = data.copy()
        data["model_frequency"] = "weekly"
        return data, "weekly", "weekly"

    if freq == "unknown":
        logger.warning(
            "Could not determine data frequency (fewer than 2 distinct dates). "
            "Treating it as monthly and modeling at that frequency."
        )
        return data, "monthly", "monthly"

    if not upsample:
        logger.info(
            "Monthly data detected. Modeling at native monthly frequency "
            "(no synthetic weekly expansion)."
        )
        return data, "monthly", "monthly"

    logger.warning(
        "MMM_UPSAMPLE_MONTHLY is set: expanding monthly data to weekly with the "
        "harmonic split. This fabricates a +/-30% within-month sawtooth in every "
        "variable and inflates r2 and posterior precision. Fit metrics from this run "
        "are not comparable to native-frequency runs."
    )

    return convert_monthly_to_weekly(data)


def aggregate_to_monthly(data):
    """
    Sum a long-format frame (``date, region, sub_brand, variable, value``) up to month
    starts. Downsampling loses no information, unlike the upsampling below.
    """

    df = data.copy()
    df["date"] = pd.to_datetime(df["date"]).dt.to_period("M").dt.to_timestamp()

    keys = [c for c in ("date", "region", "sub_brand", "variable") if c in df.columns]

    agg = (
        df.groupby(keys, as_index=False, dropna=False)["value"]
        .sum()
    )

    before, after = df["value"].sum(), agg["value"].sum()
    if not np.isclose(before, after, rtol=1e-9, atol=1e-6):
        raise ValueError(
            f"Monthly aggregation changed totals ({before} -> {after}). Aborting."
        )

    return agg


def harmonic_week_split(month_value, weeks):
    """
    Legacy within-month split. Fabricates a +/-30% sawtooth -- see module docstring.
    """

    idx = np.arange(weeks)

    weights = 1 + 0.3 * np.sin(2 * np.pi * idx / weeks)

    weights = weights / weights.sum()

    return month_value * weights


def expand_month_to_weeks(date):
    """
    Legacy date expansion. Always emits 4 weeks regardless of month length, so a
    33-month span becomes 132 weeks instead of the real 143 and the dates drift off
    the calendar (12 of 131 consecutive gaps are 14 days, not 7).
    """

    month_start = pd.to_datetime(date)

    week_dates = pd.date_range(
        start=month_start,
        periods=4,
        freq="W"
    )

    return week_dates


def convert_monthly_to_weekly(data):
    """
    Legacy monthly -> weekly expansion. Retained so a run can be reproduced for
    comparison; not reached unless upsampling is explicitly requested. Prefer
    :func:`resolve_model_frequency`.
    """

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
