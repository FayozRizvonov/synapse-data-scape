import numpy as np
import pandas as pd
import pytest
import xarray as xr

from src.validation.backtest import (
    aggregate,
    backtest_spec,
    decisive,
    paired_gain,
    plan_origins,
)


# ---------------------------------------------------------------------------
# fixtures
# ---------------------------------------------------------------------------

def make_bundle(T=24, G=1, SB=1, C=2, K=1, seed=0):
    rng = np.random.default_rng(seed)
    y = rng.normal(100, 10, size=(T, G, SB))
    return {
        "Y": y,
        "Y_scaled": (y - y.mean()) / y.std(),
        "Y_revenue": None,
        "X_media": rng.uniform(0, 10, size=(T, G, SB, C)),
        "X_media_scaled": rng.uniform(0, 1, size=(T, G, SB, C)),
        "X_control": rng.uniform(0, 1, size=(T, G, SB, K)),
        "y_mean": float(y.mean()),
        "y_std": float(y.std()),
        "media_info": pd.DataFrame({"variable": [f"m{i}" for i in range(C)]}),
        "coords": {
            "time": list(pd.date_range("2023-01-01", periods=T, freq="MS")),
            "region": ["national"], "sub_brand": ["b"],
        },
        "indexes": {"time": list(range(T)), "region": ["national"], "sub_brand": ["b"]},
        "shapes": {"T": T, "G": G, "SB": SB, "C": C, "K": K},
        "model_frequency": "monthly",
        "original_frequency": "monthly",
    }


def make_trace(C=2, K=1, chains=2, draws=6, seed=1):
    """A posterior carrying every variable the forward pass and the referee read."""
    rng = np.random.default_rng(seed)
    s = (chains, draws)

    def scalar(lo=0.0, hi=0.1):
        return (("chain", "draw"), rng.uniform(lo, hi, size=s))

    def vec(n, dim):
        return ((dim, "chain", "draw"), rng.uniform(0.1, 0.5, size=(n,) + s))

    post = xr.Dataset(
        {
            "intercept": scalar(),
            "beta_trend": scalar(),
            "seasonality_sin": scalar(),
            "seasonality_cos": scalar(),
            "sigma": scalar(0.2, 0.4),
            "theta_media": vec(C, "media"),
            "gamma_media": vec(C, "media"),
            "beta_media": vec(C, "media"),
            "beta_control": vec(K, "control"),
        },
        coords={
            "chain": np.arange(chains), "draw": np.arange(draws),
            "media": [f"m{i}" for i in range(C)],
            "control": [f"c{i}" for i in range(K)],
        },
    )

    class Trace:
        posterior = post

    return Trace()


def run_backtest(T=24, n_origins=4, horizon=1, **kw):
    b = make_bundle(T=T)
    plan = plan_origins(T, n_origins, horizon)
    assert plan["feasible"], plan["reason"]
    return plan, backtest_spec(
        b, lambda bundle: make_trace(), origins=plan["origins"], horizon=horizon,
        model_frequency="monthly", max_draws=12, verify=False, **kw
    )


def fake_points(errors_by_origin, naive_err=10.0, y=100.0):
    """
    Build a points payload directly, so the paired maths can be tested on known errors.
    `errors_by_origin` maps origin -> list of (y - pred) for that origin.
    """
    out = []
    for o, errs in errors_by_origin.items():
        for i, e in enumerate(errs):
            out.append({
                "origin": o, "t": o + i, "step": i + 1, "g": 0, "sb": 0,
                "period": f"p{o}-{i}", "y": y, "pred": y - e,
                "naive": y - naive_err, "in_mu_90": True, "in_pred_90": True,
            })
    return {"points": out}


# ---------------------------------------------------------------------------
# plan_origins
# ---------------------------------------------------------------------------

def test_plan_covers_the_most_recent_history():
    """12 origins at horizon 1 on the dovato shape: train on 21..32, forecast 22..33."""
    plan = plan_origins(33, 12, 1)
    assert plan["feasible"] is True
    assert plan["origins"] == list(range(21, 33))
    assert plan["min_train"] == 17
    assert plan["n_fits_per_spec"] == 12


def test_plan_leaves_the_last_horizon_periods_to_forecast():
    plan = plan_origins(33, 4, 3)
    assert plan["origins"][-1] == 30          # trains on 30, forecasts 31/32/33
    assert plan["origins"][-1] + 3 == 33


def test_plan_refuses_origins_that_starve_the_earliest_model():
    plan = plan_origins(33, 20, 1)            # earliest would train on 13 of 33
    assert plan["feasible"] is False
    assert "under the 17 minimum" in plan["reason"]
    assert plan["origins"] == []


def test_plan_refuses_a_single_origin():
    """One origin leaves nothing to resample, so no interval can be formed."""
    plan = plan_origins(33, 1, 1)
    assert plan["feasible"] is False
    assert "resample over" in plan["reason"]


def test_plan_respects_an_explicit_min_train():
    assert plan_origins(33, 20, 1, min_train=10)["feasible"] is True
    assert plan_origins(33, 20, 1, min_train=25)["feasible"] is False


# ---------------------------------------------------------------------------
# backtest_spec
# ---------------------------------------------------------------------------

def test_every_origin_contributes_its_own_forecasts():
    plan, r = run_backtest(T=24, n_origins=4, horizon=1)
    assert r["n_origins"] == 4
    assert r["n_points"] == 4                      # 4 origins x horizon 1 x G x SB
    assert [p["origin"] for p in r["points"]] == plan["origins"]
    assert len(r["per_origin"]) == 4


def test_points_are_uniquely_keyed_so_they_can_be_paired():
    _, r = run_backtest(T=24, n_origins=5, horizon=2)
    keys = [(p["origin"], p["t"], p["g"], p["sb"]) for p in r["points"]]
    assert len(keys) == len(set(keys))
    assert r["n_points"] == 10                     # 5 origins x horizon 2


def test_the_forecast_window_follows_the_origin():
    _, r = run_backtest(T=24, n_origins=3, horizon=2)
    for p in r["points"]:
        assert p["t"] == p["origin"] + p["step"] - 1
        assert p["t"] >= p["origin"], "a forecast must be of a period after training"


def test_each_origin_is_scored_against_what_it_could_have_known():
    """The naive baseline expands with the training window, so it differs per origin."""
    _, r = run_backtest(T=24, n_origins=4, horizon=1)
    naives = {p["origin"]: p["naive"] for p in r["points"]}
    assert len(set(naives.values())) > 1, "the naive baseline never moved"


def test_multiple_cells_are_scored_separately():
    b = make_bundle(T=20, G=2, SB=2)
    plan = plan_origins(20, 3, 1)
    r = backtest_spec(b, lambda x: make_trace(), origins=plan["origins"], horizon=1,
                      model_frequency="monthly", max_draws=8, verify=False)
    assert r["n_points"] == 3 * 1 * 2 * 2
    assert {(p["g"], p["sb"]) for p in r["points"]} == {(0, 0), (0, 1), (1, 0), (1, 1)}


def test_an_unmirrored_forward_model_makes_the_backtest_untrustworthy():
    """Same safety net as the single holdout: a mismatch must not be scored quietly."""
    b = make_bundle(T=20)
    plan = plan_origins(20, 3, 1)
    r = backtest_spec(b, lambda x: make_trace(), origins=plan["origins"], horizon=1,
                      model_frequency="monthly", max_draws=8, verify=False)
    assert r["trustworthy"] is True              # verify skipped -> nothing contradicted

    # a trace with a `mu` that disagrees with the NumPy pass fails the check
    def fit_with_bad_mu(bundle):
        tr = make_trace()
        T_tr = bundle["shapes"]["T"]
        tr.posterior["mu"] = (
            ("time", "region", "sub_brand", "chain", "draw"),
            np.zeros((T_tr, 1, 1, 2, 6)),
        )
        return tr

    r2 = backtest_spec(b, fit_with_bad_mu, origins=plan["origins"], horizon=1,
                       model_frequency="monthly", max_draws=8, verify=True)
    assert r2["trustworthy"] is False
    assert r2["forward_model_max_abs_diff"] > 0


# ---------------------------------------------------------------------------
# aggregate
# ---------------------------------------------------------------------------

def test_a_perfect_forecaster_scores_perfect_skill():
    r = aggregate(fake_points({1: [0.0, 0.0], 2: [0.0]})["points"])
    assert r["rmse"] == pytest.approx(0.0)
    assert r["skill_vs_naive"] == pytest.approx(1.0)


def test_matching_the_naive_forecaster_scores_zero_skill():
    r = aggregate(fake_points({1: [10.0], 2: [10.0]}, naive_err=10.0)["points"])
    assert r["skill_vs_naive"] == pytest.approx(0.0)


def test_being_worse_than_the_mean_scores_negative_skill():
    r = aggregate(fake_points({1: [25.0], 2: [25.0]}, naive_err=10.0)["points"])
    assert r["skill_vs_naive"] < 0


def test_aggregate_of_nothing_does_not_raise():
    r = aggregate([])
    assert r["n_points"] == 0 and np.isnan(r["rmse"])


# ---------------------------------------------------------------------------
# paired_gain — the point of the exercise
# ---------------------------------------------------------------------------

ORIGINS_8 = {o: [0.0] for o in range(1, 9)}


def test_a_consistently_better_candidate_is_demonstrated():
    inc = fake_points({o: [8.0] for o in ORIGINS_8})
    can = fake_points({o: [2.0] for o in ORIGINS_8})
    g = paired_gain(inc, can, n_boot=500)
    assert g["paired"] is True
    assert g["gain"] > 0
    assert g["lo"] > 0, "a uniform improvement should clear zero"
    assert g["demonstrated"] is True
    assert g["p_better"] == pytest.approx(1.0)


def test_an_identical_candidate_gains_nothing():
    inc = fake_points({o: [5.0] for o in ORIGINS_8})
    g = paired_gain(inc, fake_points({o: [5.0] for o in ORIGINS_8}), n_boot=500)
    assert g["gain"] == pytest.approx(0.0)
    assert g["demonstrated"] is False


def test_a_candidate_that_only_wins_on_some_origins_is_not_demonstrated():
    """
    The case the old threshold could not see: a gain that averages positive but is not
    distinguishable from which origins happened to be drawn.
    """
    inc = fake_points({1: [9.0], 2: [1.0], 3: [9.0], 4: [1.0],
                       5: [9.0], 6: [1.0], 7: [9.0], 8: [1.0]})
    can = fake_points({1: [1.0], 2: [9.0], 3: [1.0], 4: [9.0],
                       5: [1.0], 6: [9.0], 7: [1.0], 8: [8.4]})
    g = paired_gain(inc, can, n_boot=1000)
    assert g["gain"] > 0, "the point estimate does favour the candidate"
    assert g["lo"] <= 0, "but it is not demonstrated"
    assert g["demonstrated"] is False


def test_a_worse_candidate_has_a_negative_gain():
    inc = fake_points({o: [2.0] for o in ORIGINS_8})
    can = fake_points({o: [8.0] for o in ORIGINS_8})
    g = paired_gain(inc, can, n_boot=500)
    assert g["gain"] < 0 and g["demonstrated"] is False


def test_unequal_evaluation_points_are_refused_not_approximated():
    inc = fake_points({1: [1.0], 2: [1.0], 3: [1.0]})
    can = fake_points({1: [1.0], 2: [1.0]})
    g = paired_gain(inc, can)
    assert g["paired"] is False
    assert "identical origins" in g["reason"]


def test_an_empty_backtest_cannot_be_paired():
    assert paired_gain({"points": []}, fake_points({1: [1.0]}))["paired"] is False


def test_the_interval_is_resampled_over_origins_not_points():
    """
    Points within an origin share a fitted model, so they are not independent draws.
    Bootstrapping over them would report a far narrower interval than over origins; with
    many points per origin and only a few origins, the origin-level interval must stay
    wide.
    """
    inc = fake_points({1: [9.0] * 20, 2: [1.0] * 20, 3: [9.0] * 20, 4: [1.0] * 20})
    can = fake_points({1: [1.0] * 20, 2: [9.0] * 20, 3: [1.0] * 20, 4: [9.0] * 20})
    g = paired_gain(inc, can, n_boot=1000)
    assert g["n_origins"] == 4 and g["n_points"] == 80
    assert g["sd"] > 0.05, "resampling 80 points instead of 4 origins would collapse this"


def test_more_origins_narrow_the_interval():
    """Resolution the single-holdout referee could not buy at any candidate count."""
    def spread(n):
        inc = fake_points({o: [6.0 if o % 2 else 4.0] for o in range(1, n + 1)})
        can = fake_points({o: [4.0 if o % 2 else 6.0] for o in range(1, n + 1)})
        return paired_gain(inc, can, n_boot=1500, seed=3)["sd"]

    assert spread(24) < spread(6)


# ---------------------------------------------------------------------------
# decisive — the search's decision rule
# ---------------------------------------------------------------------------

def test_a_demonstrated_gain_above_the_threshold_is_decisive():
    assert decisive({"paired": True, "lo": 0.05, "gain": 0.20}, 0.01) is True


def test_a_gain_whose_interval_straddles_zero_is_not_decisive():
    assert decisive({"paired": True, "lo": -0.02, "gain": 0.20}, 0.01) is False


def test_a_demonstrated_but_negligible_gain_is_not_decisive():
    """Clearing noise is necessary, not sufficient — complexity still has to earn itself."""
    assert decisive({"paired": True, "lo": 0.001, "gain": 0.004}, 0.01) is False


def test_an_unpaired_comparison_is_never_decisive():
    assert decisive({"paired": False, "reason": "mismatched"}, 0.0) is False
