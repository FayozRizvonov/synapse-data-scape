import numpy as np
from src.logger import get_logger

logger = get_logger(__name__)


def compute_effectiveness(bundle, contrib):
    """
    Compute media effectiveness:
    contribution / exposure

    Returns:
        dict with:
            - national_effectiveness
            - local_effectiveness (if applicable)
    """

    X_media = bundle["X_media"]                # (T,G,SB,C)
    contribution = contrib["contribution"]    # (T,G,SB,C)

    media = bundle["indexes"]["media"]
    G = bundle["shapes"]["G"]
    SB = bundle["shapes"]["SB"]
    model_level = bundle.get("model_level", 0)

    results = {
        "national": {},
        "local": {}
    }

    # -------------------------------------------------
    # NATIONAL EFFECTIVENESS (always computed)
    # -------------------------------------------------
    total_contrib = contribution.sum(axis=(0, 1, 2))  # (C,)
    total_exposure = X_media.sum(axis=(0, 1, 2))      # (C,)

    national_eff = np.divide(
        total_contrib,
        total_exposure,
        out=np.full_like(total_contrib, np.nan),
        where=total_exposure > 0
    )

    for i, m in enumerate(media):
        results["national"][m] = national_eff[i]

    # -------------------------------------------------
    # LOCAL EFFECTIVENESS (only if model supports it)
    # -------------------------------------------------
    if model_level > 0:

        if G > 1 and SB == 1:
            # GEO level
            contrib_geo = contribution.sum(axis=0)       # (G,1,C)
            expo_geo = X_media.sum(axis=0)               # (G,1,C)

            for g_idx, region in enumerate(bundle["indexes"]["region"]):
                for i, m in enumerate(media):
                    c_val = contrib_geo[g_idx, 0, i]
                    e_val = expo_geo[g_idx, 0, i]
                    eff = c_val / e_val if e_val > 0 else np.nan
                    results["local"][(region, m)] = eff

        elif G == 1 and SB > 1:
            # SUB-BRAND level
            contrib_sb = contribution.sum(axis=0)        # (1,SB,C)
            expo_sb = X_media.sum(axis=0)                # (1,SB,C)

            for sb_idx, sb in enumerate(bundle["indexes"]["sub_brand"]):
                for i, m in enumerate(media):
                    c_val = contrib_sb[0, sb_idx, i]
                    e_val = expo_sb[0, sb_idx, i]
                    eff = c_val / e_val if e_val > 0 else np.nan
                    results["local"][(sb, m)] = eff

        else:
            # GEO_SUB_BRAND level
            contrib_gsb = contribution.sum(axis=0)       # (G,SB,C)
            expo_gsb = X_media.sum(axis=0)               # (G,SB,C)

            for g_idx, region in enumerate(bundle["indexes"]["region"]):
                for sb_idx, sb in enumerate(bundle["indexes"]["sub_brand"]):
                    for i, m in enumerate(media):
                        c_val = contrib_gsb[g_idx, sb_idx, i]
                        e_val = expo_gsb[g_idx, sb_idx, i]
                        eff = c_val / e_val if e_val > 0 else np.nan
                        results["local"][(region, sb, m)] = eff

    logger.info("Effectiveness computation completed")
    return results