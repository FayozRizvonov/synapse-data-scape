import numpy as np
import pymc as pm
import pytensor.tensor as pt
from src.model.stability_controller import get_prior_config
from pytensor.scan import scan
from src.logger import get_logger

logger = get_logger(__name__)


def build_pymc_model(bundle, prior_config=None):

    logger.info("Building PyMC MMM model")
    if prior_config is None:
        prior_config = get_prior_config(0)

    Y = bundle["Y_scaled"]
    X_media = bundle["X_media"]
    X_control = bundle["X_control"]
    media_info = bundle["media_info"]
    coords = bundle["coords"]

    T = bundle["shapes"]["T"]
    C = bundle["shapes"]["C"]

    logger.info(f"Media dimension detected: {C}")

    # ============================================================
    # GEOMETRY MODE DETECTION (FREQUENCY AWARE)
    # ============================================================

    model_frequency = bundle.get("model_frequency", "weekly")
    original_frequency = bundle.get("original_frequency", "weekly")

    if original_frequency == "monthly" and model_frequency == "weekly":

        # Monthly dataset converted to weekly
        geometry_mode = "monthly_constrained"

    elif model_frequency == "weekly":

        if T < 60:
            geometry_mode = "low_data"
        elif T < 120:
            geometry_mode = "medium_data"
        else:
            geometry_mode = "rich_data"

    else:

        geometry_mode = "low_data"

    logger.info(
        f"Geometry mode selected: {geometry_mode} "
        f"(original={original_frequency}, model={model_frequency}, T={T})"
    )
    # ============================================================
    # SPEND-BASED ECONOMIC PRIOR SHIFT
    # ============================================================

    if "X_spend" in bundle:
        total_spend = bundle["X_spend"].sum(axis=(0, 1, 2))
        total_spend_all = total_spend.sum()

        if total_spend_all > 0:
            spend_share = total_spend / total_spend_all
        else:
            spend_share = np.ones_like(total_spend) / len(total_spend)
    else:
        spend_share = np.ones(C) / C

    spend_share_tensor = pt.as_tensor_variable(spend_share)

    if geometry_mode == "monthly_constrained":
        economic_strength = 0.8
    else:
        economic_strength = 0.6

    economic_shift_media = economic_strength * pt.log(spend_share_tensor + 1e-4)

    logger.info(f"Spend share used for prior shift: {spend_share}")

    # ============================================================
    # GEOMETRY CAPS
    # ============================================================

    if geometry_mode == "monthly_constrained":
        theta_cap = 0.5
        gamma_cap = 1.5
    elif geometry_mode == "low_data":
        theta_cap = 0.5
        gamma_cap = 2.0
    elif geometry_mode == "medium_data":
        theta_cap = 0.6
        gamma_cap = 3.0
    else:
        theta_cap = 0.75
        gamma_cap = prior_config.get("gamma_cap", 5.0)

    # ============================================================
    # MODEL
    # ============================================================

    with pm.Model(coords=coords) as model:

        y_data = pm.Data("y_data", Y)
        x_media_data = pm.Data("x_media_data", X_media)
        x_control_data = pm.Data("x_control_data", X_control)

        # --------------------------------------------------------
        # BASE + TREND (TIGHTER FOR MONTHLY)
        # --------------------------------------------------------

        intercept = pm.Normal("intercept", 0, 1)

        if geometry_mode == "monthly_constrained":
            beta_trend = pm.Normal("beta_trend", 0, 0.05)
        else:
            beta_trend = pm.Normal("beta_trend", 0, 0.1)

        trend = beta_trend * pt.arange(T)[:, None, None]

        # --------------------------------------------------------
        # SEASONALITY (frequency aware)
        # --------------------------------------------------------

        if model_frequency == "weekly":

            # Weekly seasonality (52-week cycle)
            week = pt.arange(T)

            seasonality_sin1 = pm.Normal("seasonality_sin1", 0, 0.3)
            seasonality_cos1 = pm.Normal("seasonality_cos1", 0, 0.3)

            seasonality_sin2 = pm.Normal("seasonality_sin2", 0, 0.3)
            seasonality_cos2 = pm.Normal("seasonality_cos2", 0, 0.3)

            season = (
                seasonality_sin1 * pt.sin(2 * np.pi * week / 52)
                + seasonality_cos1 * pt.cos(2 * np.pi * week / 52)
                + seasonality_sin2 * pt.sin(4 * np.pi * week / 52)
                + seasonality_cos2 * pt.cos(4 * np.pi * week / 52)
            )[:, None, None]

        else:

            # Monthly seasonality (12 month cycle)
            month = pt.arange(T)

            seasonality_sin = pm.Normal("seasonality_sin", 0, 0.3)
            seasonality_cos = pm.Normal("seasonality_cos", 0, 0.3)

            season = (
                seasonality_sin * pt.sin(2 * np.pi * month / 12)
                + seasonality_cos * pt.cos(2 * np.pi * month / 12)
            )[:, None, None]
        # --------------------------------------------------------
        # FUNNEL STRUCTURE (STRICT ORDERING)
        # --------------------------------------------------------

        subtypes = media_info["subtype"].tolist()
        subtype_labels = sorted(set(subtypes))
        subtype_to_idx = {s: i for i, s in enumerate(subtype_labels)}
        subtype_idx = np.array([subtype_to_idx[s] for s in subtypes])

        coords["subtype"] = subtype_labels
        model.add_coord("subtype", subtype_labels)

        beta_sign = pt.as_tensor_variable([
            -1.0 if sign == "negative" else 1.0
            for sign in media_info["expected_sign"]
        ])

        if geometry_mode == "monthly_constrained":
            base_beta = pm.Normal("base_beta", 0, 0.3)
            delta_mid = pm.HalfNormal("delta_mid", 0.3)
            delta_upper = pm.HalfNormal("delta_upper", 0.3)
            min_spacing = 0.1
        else:
            base_beta = pm.Normal("base_beta", 0, 0.5)
            delta_mid = pm.HalfNormal("delta_mid", 0.5)
            delta_upper = pm.HalfNormal("delta_upper", 0.5)
            min_spacing = 0.0

        beta_map = {}

        if "lower" in subtype_labels:
            beta_map["lower"] = base_beta

        if "mid" in subtype_labels:
            beta_map["mid"] = base_beta + delta_mid + min_spacing

        if "upper" in subtype_labels:
            beta_map["upper"] = (
                base_beta
                + delta_mid
                + delta_upper
                + 2 * min_spacing
            )

        beta_subtype = pt.stack([beta_map[s] for s in subtype_labels])

        # --------------------------------------------------------
        # MEDIA LEVEL SHRINKAGE
        # --------------------------------------------------------

        if geometry_mode == "monthly_constrained":
            sigma_media = 0.4
        elif geometry_mode == "low_data":
            sigma_media = 0.5
        else:
            sigma_media = 0.8

        # --------------------------------------------------------
        # Spend-based regularization (prevents tiny spend ROI explosion)
        # --------------------------------------------------------

        median_spend = np.median(total_spend + 1e-6)
        spend_strength = np.sqrt(total_spend / median_spend)

        spend_strength = np.clip(spend_strength, 0.3, 2.0)

        spend_strength_tensor = pt.as_tensor_variable(spend_strength)

        beta_media_raw = pm.Normal(
            "beta_media_raw",
            mu=beta_subtype[subtype_idx] + economic_shift_media,
            sigma=sigma_media * spend_strength_tensor,
            dims="media",
        )

        beta_positive = pt.softplus(beta_media_raw)

        beta_media = pm.Deterministic(
            "beta_media",
            beta_sign * beta_positive,
            dims="media",
        )

        # --------------------------------------------------------
        # ADSTOCK (TIGHTER FOR MONTHLY)
        # --------------------------------------------------------

        if geometry_mode == "monthly_constrained":
            theta_raw = pm.Beta("theta_media_raw", 3, 3, dims="media")
        else:
            theta_raw = pm.Beta("theta_media_raw", 2, 2, dims="media")

        theta_media = pm.Deterministic(
            "theta_media",
            pt.clip(theta_raw, 0.01, theta_cap),
        )

        def adstock_step(x_t, prev, theta):
            return x_t + theta * prev

        X_media_ad, _ = scan(
            fn=adstock_step,
            sequences=[x_media_data],
            outputs_info=pt.zeros_like(x_media_data[0]),
            non_sequences=[theta_media],
        )

        # --------------------------------------------------------
        # SATURATION (ANCHORED FOR MONTHLY)
        # --------------------------------------------------------

        if geometry_mode == "monthly_constrained":
            gamma_global = pm.Normal("gamma_global", 0.5, 0.3)
            tau_gamma = pm.HalfNormal("tau_gamma", 0.4)
        else:
            gamma_global = pm.Normal("gamma_global", 0.5, 0.6)
            tau_gamma = pm.HalfNormal("tau_gamma", 0.8)

        # Non-centered hierarchy

        gamma_offset = pm.Normal(
            "gamma_offset",
            0,
            1,
            dims="media",
        )

        gamma_media_raw = pm.Deterministic(
            "gamma_media_raw",
            gamma_global + tau_gamma * gamma_offset,
        )

        gamma_media = pm.Deterministic(
            "gamma_media",
            pt.clip(pt.softplus(gamma_media_raw), 0.3, gamma_cap),
        )
        X_safe = pt.clip(X_media_ad, 1e-6, 1e6)
        X_media_sat = X_safe / (gamma_media + X_safe)

        media_effect = pm.Deterministic(
            "media_effect",
            pt.sum(X_media_sat * beta_media, axis=3),
        )

        beta_control = pm.Normal("beta_control", 0, 0.5, dims="control")
        control_effect = pt.sum(x_control_data * beta_control, axis=3)

        base = pm.Deterministic(
            "base",
            intercept + trend + season + control_effect,
        )

        mu = pm.Deterministic("mu", base + media_effect)

        sigma = pm.HalfNormal("sigma", 0.5)

        pm.Normal("likelihood", mu=mu, sigma=sigma, observed=y_data)

    logger.info("PyMC MMM model built successfully")
    return model
