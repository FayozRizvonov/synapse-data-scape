import pandas as pd

def aggregate_weekly_to_monthly(df):

    df["date"] = pd.to_datetime(df["date"])

    df["month"] = df["date"].dt.to_period("M")

    agg = df.groupby(
        ["month", "media", "point_type"],
        as_index=False
    ).sum()

    agg["date"] = agg["month"].dt.to_timestamp()

    return agg
