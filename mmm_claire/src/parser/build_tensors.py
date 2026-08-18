import numpy as np
import pandas as pd
from collections import defaultdict
from src.logger import get_logger

logger = get_logger(__name__)


def build_tensors(data: pd.DataFrame, info: pd.DataFrame) -> dict:

    logger.info("Building tensors from validated data")

    # -------------------------------------------------
    # 1. Build index mappings
    # -------------------------------------------------

    dates = sorted(pd.to_datetime(data["date"]).unique())
    regions = sorted(data["region"].unique())
    sub_brands = sorted(data["sub_brand"].unique())

    time_to_idx = {d: i for i, d in enumerate(dates)}
    geo_to_idx = {g: i for i, g in enumerate(regions)}
    sub_brand_to_idx = {s: i for i, s in enumerate(sub_brands)}

    T = len(dates)
    G = len(regions)
    SB = len(sub_brands)

    logger.info(f"Time points: {T}, Regions: {G}, Sub-brands: {SB}")

    # -------------------------------------------------
    # 2. KPI Detection (Dual KPI Support)
    # -------------------------------------------------

    kpi_volume = info.loc[info["type"] == "kpi_volume", "variable"].tolist()
    kpi_revenue = info.loc[info["type"] == "kpi_revenue", "variable"].tolist()

    if len(kpi_volume) > 1 or len(kpi_revenue) > 1:
        raise ValueError("Only one kpi_volume and one kpi_revenue allowed.")

    if kpi_volume and kpi_revenue:
        kpi_model_var = kpi_volume[0]
        kpi_roi_var = kpi_revenue[0]
        kpi_mode = "dual"
        logger.info(
            f"KPI mode: DUAL | Model KPI={kpi_model_var} | ROI KPI={kpi_roi_var}"
        )

    elif kpi_volume:
        kpi_model_var = kpi_volume[0]
        kpi_roi_var = kpi_volume[0]
        kpi_mode = "single_volume"
        logger.info(
            f"KPI mode: SINGLE | Using {kpi_model_var} for both modeling and ROI"
        )

    elif kpi_revenue:
        kpi_model_var = kpi_revenue[0]
        kpi_roi_var = kpi_revenue[0]
        kpi_mode = "single_revenue"
        logger.info(
            f"KPI mode: SINGLE | Using {kpi_model_var} for both modeling and ROI"
        )

    else:
        raise ValueError(
            "No KPI defined. Please specify kpi_volume or kpi_revenue."
        )

    # -------------------------------------------------
    # Media & control variables
    # -------------------------------------------------

    media_vars = (
        info.loc[info["type"] == "media", "variable"]
        .sort_values()
        .tolist()
    )

    control_vars = (
        info.loc[info["type"] == "control", "variable"]
        .sort_values()
        .tolist()
    )

    C = len(media_vars)
    K = len(control_vars)

    media_to_idx = {v: i for i, v in enumerate(media_vars)}
    control_to_idx = {v: i for i, v in enumerate(control_vars)}

    logger.info(f"Media variables ({C}): {media_vars}")
    logger.info(f"Control variables ({K}): {control_vars}")
    logger.info(f"KPI variable (model): {kpi_model_var}")

    # -------------------------------------------------
    # Media info alignment
    # -------------------------------------------------

    media_info = (
        info.loc[info["type"] == "media", ["variable", "subtype", "expected_sign"]]
        .set_index("variable")
        .loc[media_vars]
        .reset_index()
    )

    assert media_info["variable"].tolist() == media_vars

    # -------------------------------------------------
    # 3. Initialize tensors
    # -------------------------------------------------

    Y = np.zeros((T, G, SB), dtype=float)

    # 🔥 NEW: Revenue tensor only if dual mode
    Y_revenue = (
        np.zeros((T, G, SB), dtype=float)
        if kpi_mode == "dual"
        else None
    )

    X_media = np.zeros((T, G, SB, C), dtype=float)
    X_control = np.zeros((T, G, SB, K), dtype=float)

    # -------------------------------------------------
    # 4. Populate tensors
    # -------------------------------------------------

    for row in data.itertuples(index=False):

        row_date = pd.to_datetime(row.date)
        t = time_to_idx[row_date]
        g = geo_to_idx[row.region]
        sb = sub_brand_to_idx[row.sub_brand]

        var = row.variable
        val = row.value

        if var == kpi_model_var:
            Y[t, g, sb] = val

        # 🔥 NEW: revenue stored separately
        elif kpi_mode == "dual" and var == kpi_roi_var:
            Y_revenue[t, g, sb] = val

        elif var in media_to_idx:
            X_media[t, g, sb, media_to_idx[var]] = val

        elif var in control_to_idx:
            X_control[t, g, sb, control_to_idx[var]] = val

    logger.info("Tensor population completed")

    # -------------------------------------------------
    # 5. KPI scaling (ONLY model KPI scaled)
    # -------------------------------------------------

    y_mean = Y.mean()
    y_std = Y.std()

    if y_std == 0:
        raise ValueError("KPI has zero variance")

    Y_scaled = (Y - y_mean) / y_std

    # -------------------------------------------------
    # Media scaling
    # -------------------------------------------------

    media_mean = X_media.mean(axis=(0, 1, 2))
    media_std = np.clip(X_media.std(axis=(0, 1, 2)), 1e-6, None)

    X_media_scaled = (X_media - media_mean) / media_std
    # -------------------------------------------------
    # PyMC coords (for dimensioned model)
    # -------------------------------------------------

    coords = {
        "time": dates,
        "region": regions,
        "sub_brand": sub_brands,
        "media": media_vars,
        "control": control_vars,
    }
    # -------------------------------------------------
    # Output dictionary
    # -------------------------------------------------

    output = {
        "Y": Y,
        "Y_scaled": Y_scaled,
        "Y_revenue": Y_revenue,  # 🔥 critical
        "y_mean": y_mean,
        "y_std": y_std,
        "kpi_model": kpi_model_var,
        "kpi_roi": kpi_roi_var,
        "kpi_mode": kpi_mode,
        "X_media": X_media,
        "X_media_scaled": X_media_scaled,
        "media_mean": media_mean,
        "media_std": media_std,
        "X_control": X_control,
        "media_info": media_info,
        "coords": coords,
        "indexes": {
            "time": dates,
            "region": regions,
            "sub_brand": sub_brands,
            "media": media_vars,
            "control": control_vars,
        },
        "mappings": {
            "time_to_idx": time_to_idx,
            "geo_to_idx": geo_to_idx,
            "sub_brand_to_idx": sub_brand_to_idx,
            "media_to_idx": media_to_idx,
            "control_to_idx": control_to_idx,
        },
        "shapes": {
            "T": T,
            "G": G,
            "SB": SB,
            "C": C,
            "K": K,
        }
    }

    logger.info("Tensors built successfully")

    return output

def build_spend_tensor(spend_df, bundle):
    """
    Build X_spend tensor aligned with X_media tensor.
    Revenue must come from data.csv, NOT spend.csv.
    """

    media_vars = bundle["indexes"]["media"]

    T = bundle["shapes"]["T"]
    G = bundle["shapes"]["G"]
    SB = bundle["shapes"]["SB"]
    C = bundle["shapes"]["C"]

    time_to_idx = bundle["mappings"]["time_to_idx"]
    geo_to_idx = bundle["mappings"]["geo_to_idx"]
    sb_to_idx = bundle["mappings"]["sub_brand_to_idx"]
    media_to_idx = bundle["mappings"]["media_to_idx"]

    X_spend = np.zeros((T, G, SB, C))

    # --------------------------------------------------
    # Validate spend media alignment
    # --------------------------------------------------

    unknown_media = set(spend_df["media"]) - set(media_vars)
    if unknown_media:
        logger.warning(f"Spend contains unknown media: {unknown_media}")

    # --------------------------------------------------
    # Populate spend tensor
    # --------------------------------------------------

    for row in spend_df.itertuples(index=False):

        if row.media not in media_to_idx:
            continue

        row_date = pd.to_datetime(row.date)
        if row_date not in time_to_idx:
            continue

        t = time_to_idx[row_date]
        c = media_to_idx[row.media]

        # Region handling
        if G > 1:
            if row.region not in geo_to_idx:
                continue
            g = geo_to_idx[row.region]
        else:
            g = 0

        # Sub-brand handling
        if SB > 1:
            if row.sub_brand not in sb_to_idx:
                continue
            sb = sb_to_idx[row.sub_brand]
        else:
            sb = 0

        X_spend[t, g, sb, c] += row.spend

    bundle["X_spend"] = X_spend

    # --------------------------------------------------
    # Diagnostics
    # --------------------------------------------------

    total_spend = X_spend.sum(axis=(0, 1, 2))

    zero_spend_media = [
        media_vars[i]
        for i in range(C)
        if total_spend[i] == 0
    ]

    if zero_spend_media:
        logger.warning(f"Media with zero spend: {zero_spend_media}")

    logger.info(f"Total spend tensor sum: {X_spend.sum()}")
    logger.info(f"Spend per media: {total_spend}")

    return bundle
