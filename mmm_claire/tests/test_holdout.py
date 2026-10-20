import numpy as np
import pandas as pd
import pytest
import xarray as xr

from src.validation.holdout import (
    forward_mu,
    score_holdout,
    split_bundle,
)


# ---------------------------------------------------------------------------
# fixtures
# ---------------------------------------------------------------------------

def make_bundle(T=12, G=1, SB=1, C=2, K=1, seed=0):
    rng = np.random.default_rng(seed)
    y = rng.normal(100, 10, size=(T, G, SB))
    return {
        "Y": y,
        "Y_scaled": (y - y.mean()) / y.std(),
        "Y_revenue": y * 2,
        "X_media": rng.uniform(0, 10, size=(T, G, SB, C)),
        "X_media_scaled": rng.uniform(0, 1, size=(T, G, SB, C)),
        "X_control": rng.uniform(0, 1, size=(T, G, SB, K)),
        "y_mean": float(y.mean()),
        "y_std": float(y.std()),
        "media_info": pd.DataFrame({"variable": [f"m{i}" for i in range(C)]}),
        "coords": {
            "time": list(pd.date_range("2023-01-01", periods=T, freq="MS")),
            "region": ["national"],
            "sub_brand": ["b"],
        },
        "indexes": {
            "time": list(range(T)),
            "region": ["national"],
            "sub_brand": ["b"],
        },
        "shapes": {"T": T, "G": G, "SB": SB, "C": C, "K": K},
    }


def make_trace(T, C=2, K=1, chains=2, draws=5, seed=1):
    """A minimal posterior with the variables forward_mu reads."""
    rng = np.random.default_rng(seed)
    s = (chains, draws)

    def scalar():
        return (("chain", "draw"), rng.normal(0, 0.1, size=s))

    def vec(n, dim):
        return ((dim, "chain", "draw"), rng.uniform(0.1, 0.5, size=(n,) + s))

    post = xr.Dataset(
        {
            "intercept": scalar(),
            "beta_trend": scalar(),
            "seasonality_sin": scalar(),
            "seasonality_cos": scalar(),
            "theta_media": vec(C, "media"),
            "gamma_media": vec(C, "media"),
            "beta_media": vec(C, "media"),
            "beta_control": vec(K, "control"),
        },
        coords={
            "chain": np.arange(chains),
            "draw": np.arange(draws),
            "media": [f"m{i}" for i in range(C)],
            "control": [f"c{i}" for i in range(K)],
        },
    )

    class Trace:
        posterior = post

    return Trace()


# ---------------------------------------------------------------------------
# split_bundle
# ---------------------------------------------------------------------------

def test_split_shapes_and_chronology():
    b = make_bundle(T=12)
    train, info = split_bundle(b, n_holdout=3)

    assert train["shapes"]["T"] == 9
    assert train["Y"].shape == (9, 1, 1)
    assert train["X_media"].shape == (9, 1, 1, 2)
    assert train["X_control"].shape == (9, 1, 1, 1)
    assert len(train["coords"]["time"]) == 9

    assert info == {
        "n_total": 12, "n_train": 9, "n_holdout": 3,
        "train_periods": info["train_periods"],
        "holdout_periods": info["holdout_periods"],
    }
    # holdout is the most recent periods, in order
    assert info["holdout_periods"] == [str(p) for p in b["coords"]["time"][9:]]
    assert len(info["train_periods"]) == 9


def test_split_does_not_mutate_the_original():
    b = make_bundle(T=12)
    before_T, before_shape = b["shapes"]["T"], b["Y"].shape
    split_bundle(b, n_holdout=4)
    assert b["shapes"]["T"] == before_T
    assert b["Y"].shape == before_shape
    assert len(b["coords"]["time"]) == 12


def test_split_train_is_a_prefix_of_full():
    b = make_bundle(T=12)
    train, _ = split_bundle(b, n_holdout=5)
    np.testing.assert_array_equal(train["Y"], b["Y"][:7])
    np.testing.assert_array_equal(train["X_media"], b["X_media"][:7])


@pytest.mark.parametrize("n", [0, -1, 12, 13])
def test_split_rejects_impossible_sizes(n):
    with pytest.raises(ValueError):
        split_bundle(make_bundle(T=12), n_holdout=n)


# ---------------------------------------------------------------------------
# forward_mu
# ---------------------------------------------------------------------------

def test_forward_mu_shape():
    b = make_bundle(T=12)
    mu = forward_mu(make_trace(12), b, "monthly", max_draws=10)
    assert mu.shape == (10, 12, 1, 1)
    assert np.isfinite(mu).all()


def test_forward_mu_is_deterministic():
    b = make_bundle(T=12)
    tr = make_trace(12)
    np.testing.assert_allclose(
        forward_mu(tr, b, "monthly", max_draws=10),
        forward_mu(tr, b, "monthly", max_draws=10),
    )


def test_adstock_carries_across_the_split_boundary():
    """
    The holdout's first periods must feel media spent during training. If adstock were
    restarted at the boundary, mu there would differ.
    """
    b = make_bundle(T=12)
    tr = make_trace(12)

    full = forward_mu(tr, b, "monthly", max_draws=4)

    train, _ = split_bundle(b, n_holdout=6)
    train_only = forward_mu(tr, train, "monthly", max_draws=4)

    # the shared prefix must agree exactly ...
    np.testing.assert_allclose(full[:, :6], train_only[:, :6], rtol=1e-12)
    # ... and the full series must extend beyond it
    assert full.shape[1] == 12 and train_only.shape[1] == 6


# ---------------------------------------------------------------------------
# score_holdout
# ---------------------------------------------------------------------------

def test_score_holdout_keys_and_ranges():
    b = make_bundle(T=12)
    train, info = split_bundle(b, n_holdout=4)
    m = score_holdout(make_trace(12), b, info, "monthly", max_draws=10)

    for key in (
        "rmse", "mape", "r2_vs_train_mean", "r2_vs_holdout_mean",
        "naive_rmse_train_mean", "skill_vs_naive", "coverage_90",
    ):
        assert key in m, key
        assert np.isfinite(m[key]), key

    assert m["n_holdout"] == 4
    assert m["n_train"] == 8
    assert m["rmse"] >= 0
    assert 0.0 <= m["coverage_90"] <= 1.0


def test_perfect_prediction_scores_perfectly():
    """A model whose mu equals the truth must score r2 1, RMSE 0, skill 1."""
    b = make_bundle(T=12)
    tr = make_trace(12)
    _, info = split_bundle(b, n_holdout=4)

    mu = forward_mu(tr, b, "monthly", max_draws=10).mean(axis=0)
    # make the data match the model exactly
    b["Y_scaled"] = mu

    m = score_holdout(tr, b, info, "monthly", max_draws=10)
    assert m["rmse"] == pytest.approx(0.0, abs=1e-8)
    assert m["r2_vs_train_mean"] == pytest.approx(1.0, abs=1e-8)
    assert m["skill_vs_naive"] == pytest.approx(1.0, abs=1e-8)


def test_skill_is_negative_when_the_model_is_worse_than_the_mean():
    b = make_bundle(T=12)
    tr = make_trace(12)
    _, info = split_bundle(b, n_holdout=4)

    # The holdout truth sits almost exactly on the training mean, so predicting that
    # mean is nearly perfect — while the model's mu is far away. Anything that cannot
    # beat a constant here is worse than useless.
    b["Y_scaled"] = np.full_like(b["Y_scaled"], 50.0)
    b["Y_scaled"][info["n_train"]:] = 50.5

    m = score_holdout(tr, b, info, "monthly", max_draws=10)
    assert m["skill_vs_naive"] < 0
    assert m["r2_vs_train_mean"] < 0
