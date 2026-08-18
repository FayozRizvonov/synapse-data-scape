def detect_model_level(bundle):
    G = bundle["shapes"]["G"]
    SB = bundle["shapes"]["SB"]

    if G == 1 and SB == 1:
        return 0
    elif (G > 1 and SB == 1) or (G == 1 and SB > 1):
        return 1
    else:
        return 2


def detect_spend_levels(bundle):
    """
    Detect spend granularity per media channel.
    """
    X_spend = bundle.get("X_spend")
    if X_spend is None:
        return {}

    levels = {}
    media_vars = bundle["indexes"]["media"]
    G = bundle["shapes"]["G"]
    SB = bundle["shapes"]["SB"]

    for i, m in enumerate(media_vars):

        spend_slice = X_spend[:, :, :, i]

        varies_geo = G > 1 and spend_slice.sum(axis=(0, 2)).std() > 0
        varies_sb = SB > 1 and spend_slice.sum(axis=(0, 1)).std() > 0

        if not varies_geo and not varies_sb:
            levels[m] = 0
        elif varies_geo ^ varies_sb:
            levels[m] = 1
        else:
            levels[m] = 2

    return levels


def compute_roi_levels(model_level, spend_levels):
    roi_levels = {}
    for m, spend_level in spend_levels.items():
        roi_levels[m] = min(model_level, spend_level)
    return roi_levels