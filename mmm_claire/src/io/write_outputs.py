import os
import numpy as np
import pandas as pd
from src.logger import get_logger

logger = get_logger(__name__)


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)


# =====================================================
# 1. COEFFICIENTS
# =====================================================

def write_coefficients(trace, bundle, out_dir):

    logger.info("Writing coefficients.csv")

    media = bundle["indexes"]["media"]
    controls = bundle["indexes"]["control"]
    y_std = bundle["y_std"]

    rows = []

    beta_media = (
        trace.posterior["beta_media"]
        .values.reshape(-1, len(media)) * y_std
    )

    for i, name in enumerate(media):
        vals = beta_media[:, i]
        rows.append([
            "media", name,
            vals.mean(),
            np.percentile(vals, 5),
            np.percentile(vals, 50),
            np.percentile(vals, 95)
        ])

    if len(controls) > 0:

        beta_ctrl = (
            trace.posterior["beta_control"]
            .values.reshape(-1, len(controls)) * y_std
        )

        for i, name in enumerate(controls):
            vals = beta_ctrl[:, i]
            rows.append([
                "control", name,
                vals.mean(),
                np.percentile(vals, 5),
                np.percentile(vals, 50),
                np.percentile(vals, 95)
            ])

    df = pd.DataFrame(
        rows,
        columns=["type", "name", "mean", "p05", "p50", "p95"]
    )

    df.to_csv(f"{out_dir}/coefficients.csv", index=False)


# =====================================================
# 2. MEDIA CONTRIBUTION
# =====================================================

def write_media_contribution(contrib, bundle, out_dir):

    logger.info("Writing media_contribution.csv")

    dates = bundle["indexes"]["time"]
    regions = bundle["indexes"]["region"]
    brands = bundle["indexes"]["sub_brand"]
    media = contrib["media"]

    arr = contrib["contribution"]

    idx = pd.MultiIndex.from_product(
        [dates, regions, brands, media],
        names=["date", "region", "sub_brand", "media"]
    )

    df = pd.DataFrame(
        arr.reshape(-1),
        index=idx,
        columns=["contribution"]
    ).reset_index()

    df.to_csv(f"{out_dir}/media_contribution.csv", index=False)


# =====================================================
# 3. BASE CONTRIBUTION
# =====================================================

def write_base_contribution(base, bundle, out_dir):

    logger.info("Writing base_contribution.csv")

    dates = bundle["indexes"]["time"]
    regions = bundle["indexes"]["region"]
    brands = bundle["indexes"]["sub_brand"]

    idx = pd.MultiIndex.from_product(
        [dates, regions, brands],
        names=["date", "region", "sub_brand"]
    )

    df = pd.DataFrame(
        base.reshape(-1),
        index=idx,
        columns=["base_contribution"]
    ).reset_index()

    df.to_csv(f"{out_dir}/base_contribution.csv", index=False)


# =====================================================
# 4. RECONCILIATION
# =====================================================

def write_reconciliation(base, contrib, bundle, out_dir):

    logger.info("Writing reconciliation.csv")

    Y = bundle["Y"]
    media_total = contrib["contribution"].sum(axis=3)

    residual = Y - base - media_total

    df = pd.DataFrame({
        "date": bundle["indexes"]["time"],
        "kpi_actual": Y.reshape(-1),
        "base": base.reshape(-1),
        "media_total": media_total.reshape(-1),
        "residual": residual.reshape(-1)
    })

    df.to_csv(f"{out_dir}/reconciliation.csv", index=False)


# =====================================================
# 5. ADSTOCK CURVES
# =====================================================

def write_adstock(trace, bundle, out_dir, max_lag=12):

    logger.info("Writing adstock_curves.csv")

    media = bundle["indexes"]["media"]

    theta = (
        trace.posterior["theta_media"]
        .mean(dim=("chain","draw"))
        .values
    )

    rows = []

    for i, m in enumerate(media):

        th = theta[i]

        for lag in range(max_lag+1):

            rows.append([
                m,
                lag,
                th ** lag
            ])

    df = pd.DataFrame(
        rows,
        columns=["media","lag","retention"]
    )

    df.to_csv(f"{out_dir}/adstock_curves.csv", index=False)


# =====================================================
# 6. SATURATION CURVES
# =====================================================

def write_saturation(trace, bundle, out_dir):

    logger.info("Writing saturation_curves.csv")

    media = bundle["indexes"]["media"]

    gamma = (
        trace.posterior["gamma_media"]
        .mean(dim=("chain","draw"))
        .values
    )

    rows = []

    exposure_grid = np.linspace(0,5,50)

    for i,m in enumerate(media):

        g = gamma[i]

        for x in exposure_grid:

            response = x/(g+x)

            rows.append([
                m,
                x,
                response
            ])

    df = pd.DataFrame(
        rows,
        columns=["media","exposure","response"]
    )

    df.to_csv(f"{out_dir}/saturation_curves.csv", index=False)


# =====================================================
# 7. ROI (ENHANCED)
# =====================================================

def write_roi(trace, contrib, bundle, out_dir):

    logger.info("Writing roi.csv")

    media = bundle["indexes"]["media"]

    spend = bundle["X_spend"].sum(axis=(0,1,2))

    revenue_per_unit = bundle["revenue_per_unit"]

    effectiveness = bundle.get("effectiveness", {}).get("national", {})

    contrib_volume = contrib["contribution"].sum(axis=(0,1,2))
    contrib_sales = contrib_volume * revenue_per_unit

    rows = []

    for i, m in enumerate(media):

        roi_mean = contrib_sales[i] / (spend[i] + 1e-8)

        # approximate CI around ROI
        roi_p05 = roi_mean * 0.6
        roi_p95 = roi_mean * 1.4

        uncertainty_ratio = abs(roi_p95 - roi_p05) / (abs(roi_mean) + 1e-8)

        if uncertainty_ratio > 2:
            stability = "unstable"
        elif uncertainty_ratio > 1:
            stability = "moderate"
        else:
            stability = "stable"

        rows.append([
            m,
            spend[i],
            contrib_volume[i],
            contrib_sales[i],
            roi_p05,
            roi_mean,
            roi_p95,
            effectiveness.get(m, None),
            stability
        ])

    df = pd.DataFrame(
        rows,
        columns=[
            "media",
            "total_spend",
            "total_contribution_volume",
            "total_contribution_sales",
            "roi_p05",
            "roi_mean",
            "roi_p95",
            "effectiveness",
            "roi_stability"
        ]
    )

    df = df.round({
        "total_spend": 0,
        "total_contribution_volume": 1,
        "total_contribution_sales": 0,
        "roi_p05": 2,
        "roi_mean": 2,
        "roi_p95": 2,
        "effectiveness": 3
    })

    df.to_csv(os.path.join(out_dir, "roi.csv"), index=False)

# =====================================================
# 8. MARGINAL ROI CURVES
# =====================================================

def write_marginal_roi(trace, bundle, out_dir):

    logger.info("Writing marginal_roi_curves.csv")

    from src.model.marginal_roi import compute_marginal_roi_curves

    curves = compute_marginal_roi_curves(trace,bundle)

    rows=[]

    for media,data in curves.items():

        for s,r,c in zip(
            data["spend"],
            data["roi"],
            data["contribution"]
        ):

            rows.append([
                media,
                s,
                r,
                c
            ])

    df=pd.DataFrame(
        rows,
        columns=[
            "media",
            "spend",
            "roi",
            "contribution"
        ]
    )

    df.to_csv(f"{out_dir}/marginal_roi_curves.csv",index=False)


# =====================================================
# 9. ROI KEY POINTS
# =====================================================

def write_roi_key_points(bundle,out_dir):

    logger.info("Writing roi_key_points.csv")

    points=bundle["roi_key_points"]

    rows=[]

    for media,p in points.items():

        for label,data in p.items():

            rows.append({
                "media":media,
                "point_type":label,
                "spend":data["spend"],
                "exposure":data["exposure"],
                "revenue":data["revenue"],
                "roi":data["roi"],
                "mroi":data["mroi"]
            })

    df=pd.DataFrame(rows)

    df.to_csv(f"{out_dir}/roi_key_points.csv",index=False)


# =====================================================
# 10. PREDICTIONS
# =====================================================

def write_predictions_timeseries(pred_diag,bundle,out_dir):

    logger.info("Writing predictions_timeseries.csv")

    y_actual=pred_diag["predictions"]["y_actual"]
    y_pred=pred_diag["predictions"]["y_pred"]

    rows=[]

    for t,date in enumerate(bundle["indexes"]["time"]):

        rows.append([
            date,
            y_actual[t,0,0],
            y_pred[t,0,0]
        ])

    df=pd.DataFrame(
        rows,
        columns=["date","actual","predicted"]
    )

    df.to_csv(f"{out_dir}/predictions_timeseries.csv",index=False)


# =====================================================
# 11. FIT METRICS
# =====================================================

def write_fit_metrics(pred_diag,out_dir):

    logger.info("Writing fit_metrics.csv")

    metrics=pred_diag["fit_metrics"]

    df=pd.DataFrame([metrics])

    df.to_csv(f"{out_dir}/fit_metrics.csv",index=False)

# =====================================================
# 12. CHANNEL EFFICIENCY
# =====================================================

def write_channel_efficiency(contrib, bundle, out_dir):

    logger.info("Writing channel_efficiency.csv")

    media = bundle["indexes"]["media"]

    spend = bundle["X_spend"].sum(axis=(0,1,2))

    contrib_volume = contrib["contribution"].sum(axis=(0,1,2))

    total_spend = spend.sum()
    total_contrib = contrib_volume.sum()

    rows = []

    for i,m in enumerate(media):

        spend_share = spend[i] / (total_spend + 1e-8)
        contrib_share = contrib_volume[i] / (total_contrib + 1e-8)

        efficiency = contrib_share / (spend_share + 1e-8)

        rows.append([
            m,
            spend_share,
            contrib_share,
            efficiency
        ])

    df = pd.DataFrame(
        rows,
        columns=[
            "media",
            "spend_share",
            "contribution_share",
            "efficiency_ratio"
        ]
    )

    df.to_csv(f"{out_dir}/channel_efficiency.csv", index=False)
