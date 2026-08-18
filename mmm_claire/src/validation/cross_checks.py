from src.logger import get_logger

logger = get_logger(__name__)

def validate_variation_levels(data, info):
    logger.info("Validating variation_level consistency")

    for _, row in info.iterrows():
        var = row["variable"]
        level = row["variation_level"]

        df = data[data["variable"] == var]

        if level == "global":
            if df.groupby("date")["value"].nunique().max() > 1:
                raise ValueError(f"{var} violates global variation rule")

        if level == "geo":
            if df.groupby(["date", "region"])["value"].nunique().max() > 1:
                raise ValueError(f"{var} violates geo variation rule")

        if level == "sub_brand":
            if df.groupby(["date", "sub_brand"])["value"].nunique().max() > 1:
                raise ValueError(f"{var} violates sub_brand variation rule")

    logger.info("Variation-level checks passed")
