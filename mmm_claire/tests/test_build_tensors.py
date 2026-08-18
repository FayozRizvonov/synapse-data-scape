import numpy as np
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

    Y = bundle["Y"]
    idx = bundle["mappings"]

    sample = data.iloc[0]

    if sample["variable"] == info.loc[info["type"] == "kpi", "variable"].iloc[0]:
        t = idx["time_to_idx"][sample["date"]]
        g = idx["geo_to_idx"][sample["region"]]
        sb = idx["sub_brand_to_idx"][sample["sub_brand"]]

        assert Y[t, g, sb] == sample["value"]

def test_missing_media_are_zero():
    data, info = load_data()
    bundle = build_tensors(data, info)

    X_media = bundle["X_media"]

    # Media tensor must never contain NaN
    assert not np.isnan(X_media).any()

