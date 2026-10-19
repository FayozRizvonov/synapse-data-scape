import numpy as np
import pandas as pd

from src.preprocessing.monthly_to_weekly import (
    aggregate_to_monthly,
    convert_monthly_to_weekly,
    detect_frequency,
    harmonic_week_split,
    resolve_model_frequency,
)


def _monthly_frame(periods=33, value=100.0):
    dates = pd.date_range("2023-01-01", periods=periods, freq="MS")
    return pd.DataFrame({
        "date": dates,
        "region": "national",
        "sub_brand": "dovato",
        "variable": "volume",
        "value": value,
    })


def _weekly_frame(periods=52, value=25.0):
    dates = pd.date_range("2023-01-01", periods=periods, freq="W")
    return pd.DataFrame({
        "date": dates,
        "region": "national",
        "sub_brand": "dovato",
        "variable": "volume",
        "value": value,
    })


def test_monthly_stays_monthly_by_default():
    """The default must not upsample — that is the whole point of the fix."""
    df = _monthly_frame()
    out, original, model = resolve_model_frequency(df)

    assert (original, model) == ("monthly", "monthly")
    assert len(out) == len(df)
    assert out["date"].nunique() == 33


def test_weekly_passes_through():
    out, original, model = resolve_model_frequency(_weekly_frame())
    assert (original, model) == ("weekly", "weekly")


def test_upsampling_is_opt_in():
    out, original, model = resolve_model_frequency(_monthly_frame(), upsample=True)
    assert (original, model) == ("monthly", "weekly")
    assert len(out) == 33 * 4


def test_env_flag_enables_upsampling(monkeypatch):
    monkeypatch.setenv("MMM_UPSAMPLE_MONTHLY", "1")
    _, _, model = resolve_model_frequency(_monthly_frame())
    assert model == "weekly"

    monkeypatch.setenv("MMM_UPSAMPLE_MONTHLY", "0")
    _, _, model = resolve_model_frequency(_monthly_frame())
    assert model == "monthly"


def test_harmonic_split_is_the_sawtooth_we_rejected():
    """
    Documents why upsampling is off by default: the legacy split injects a
    deterministic +/-30% within-month pattern into every variable.
    """
    w = harmonic_week_split(1.0, 4)

    assert np.isclose(w.sum(), 1.0)
    np.testing.assert_allclose(w, [0.25, 0.325, 0.25, 0.175])
    # week 2 is +30% of flat, week 4 is -30%
    assert np.isclose(w[1] / 0.25 - 1, 0.30)
    assert np.isclose(w[3] / 0.25 - 1, -0.30)


def test_upsampling_preserves_totals():
    df = _monthly_frame()
    out, _, _ = convert_monthly_to_weekly(df)
    assert np.isclose(out["value"].sum(), df["value"].sum())


def test_aggregate_to_monthly_preserves_totals_and_collapses_dates():
    df = _weekly_frame()
    agg = aggregate_to_monthly(df)

    assert np.isclose(agg["value"].sum(), df["value"].sum())
    assert len(agg) < len(df)
    assert (agg["date"].dt.day == 1).all()


def test_detect_frequency():
    assert detect_frequency(_monthly_frame()) == "monthly"
    assert detect_frequency(_weekly_frame()) == "weekly"
    assert detect_frequency(_monthly_frame(periods=1)) == "unknown"


def test_single_date_does_not_upsample():
    _, original, model = resolve_model_frequency(_monthly_frame(periods=1))
    assert model == "monthly"
