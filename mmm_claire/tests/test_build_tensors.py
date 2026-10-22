import numpy as np
import pandas as pd
from src.io.load_data import load_data
from src.parser.build_tensors import build_tensors


def test_tensor_shapes():
    data, info = load_data()
    bundle = build_tensors(data, info)

    Y = bundle["Y"]
    X_media = bundle["X_media"]
    X_control = bundle["X_control"]
    shapes = bundle["shapes"]

    assert Y.shape == (shapes["T"], shapes["G"], shapes["SB"])
    assert X_media.shape == (shapes["T"], shapes["G"], shapes["SB"], shapes["C"])
    assert X_control.shape == (shapes["T"], shapes["G"], shapes["SB"], shapes["K"])

def test_kpi_placement():
    data, info = load_data()
    bundle = build_tensors(data, info)

    idx = bundle["mappings"]

    # Model KPI -> Y; in dual mode the ROI KPI -> Y_revenue
    targets = {bundle["kpi_model"]: bundle["Y"]}
    if bundle["kpi_mode"] == "dual":
        assert bundle["kpi_roi"] != bundle["kpi_model"]
        targets[bundle["kpi_roi"]] = bundle["Y_revenue"]
    else:
        assert bundle["Y_revenue"] is None

    for kpi_var, tensor in targets.items():
        rows = data[data["variable"] == kpi_var]
        assert len(rows) > 0, f"no rows for KPI {kpi_var}"

        expected = np.zeros_like(tensor)
        for row in rows.itertuples(index=False):
            t = idx["time_to_idx"][pd.to_datetime(row.date)]
            g = idx["geo_to_idx"][row.region]
            sb = idx["sub_brand_to_idx"][row.sub_brand]
            expected[t, g, sb] = row.value

        # Every cell matches, so the other KPI cannot have leaked in
        np.testing.assert_array_equal(tensor, expected)

def test_missing_media_are_zero():
    data, info = load_data()
    bundle = build_tensors(data, info)

    X_media = bundle["X_media"]

    # Media tensor must never contain NaN
    assert not np.isnan(X_media).any()

