from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]

DATA_DIR = BASE_DIR / "data"

DATA_FILE = DATA_DIR / "data.csv"
INFO_FILE = DATA_DIR / "info.csv"
SPEND_FILE = DATA_DIR / "spend.csv"

REQUIRED_DATA_COLUMNS = {
    "date", "region", "sub_brand", "variable", "value"
}

REQUIRED_INFO_COLUMNS = {
    "variable", "type", "subtype", "variation_level", "expected_sign"
}

ALLOWED_TYPES = {"kpi_volume","kpi_revenue", "media", "control"}
ALLOWED_VARIATION_LEVELS = {
    "global", "geo", "sub_brand", "geo_sub_brand"
}
ALLOWED_EXPECTED_SIGNS = {"positive", "negative", "free", "na"}
