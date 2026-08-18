import numpy as np
from src.logger import get_logger

logger = get_logger(__name__)


def extract_media_contributions(trace, bundle):

    logger.info("Extracting posterior media contributions (DELTA METHOD)")

    X_media = bundle["X_media"]  # (T,G,SB,C)
    shapes = bundle["shapes"]
    media_names = bundle["indexes"]["media"]

    y_std = bundle["y_std"]
    y_mean = bundle["y_mean"]

    T = shapes["T"]
    G = shapes["G"]
    SB = shapes["SB"]
    C = shapes["C"]

    # --------------------------------------
    # Posterior means
    # --------------------------------------

    beta = trace.posterior["beta_media"].mean(dim=("chain","draw")).values
    theta = trace.posterior["theta_media"].mean(dim=("chain","draw")).values
    gamma = trace.posterior["gamma_media"].mean(dim=("chain","draw")).values

    base_scaled = trace.posterior["base"].mean(dim=("chain","draw")).values

    # --------------------------------------
    # Rebuild media pipeline
    # --------------------------------------

    X_ad = np.zeros_like(X_media)

    for c in range(C):
        for t in range(T):

            if t == 0:
                X_ad[t, :, :, c] = X_media[t, :, :, c]
            else:
                X_ad[t, :, :, c] = (
                    X_media[t, :, :, c]
                    + theta[c] * X_ad[t - 1, :, :, c]
                )

    eps = 1e-6
    X_safe = np.clip(X_ad, eps, 1e6)

    X_sat = X_safe / (gamma + X_safe)

    # --------------------------------------
    # Full model prediction
    # --------------------------------------

    media_effect_scaled = (X_sat * beta).sum(axis=3)

    mu_scaled_full = base_scaled + media_effect_scaled

    mu_full = mu_scaled_full * y_std + y_mean

    # --------------------------------------
    # Delta attribution
    # --------------------------------------

    contributions = np.zeros_like(X_media)

    for c in range(C):

        channel_effect_scaled = X_sat[:, :, :, c] * beta[c]

        mu_scaled_without = (
            base_scaled
            + (media_effect_scaled - channel_effect_scaled)
        )

        mu_without = mu_scaled_without * y_std + y_mean

        delta = mu_full - mu_without

        # ----------------------------------
        # Remove numerical noise
        # ----------------------------------

        delta = np.maximum(delta, 0)

        contributions[:, :, :, c] = delta

    # --------------------------------------
    # Reconciliation check
    # --------------------------------------

    total_media = contributions.sum(axis=3)

    if np.any(total_media > mu_full + 1e-6):

        logger.warning(
            "Media contributions exceed KPI slightly — applying reconciliation correction"
        )

        scale = mu_full / (total_media + 1e-8)

        contributions = contributions * scale[:, :, :, None]

    logger.info("Delta-based contribution extraction completed")

    return {
        "media": media_names,
        "contribution": contributions,
    }
