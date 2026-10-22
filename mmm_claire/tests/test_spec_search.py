import numpy as np
import pandas as pd
import pytest

from src.search.search import (
    Evaluation,
    RollingOriginReferee,
    SingleHoldoutReferee,
    plan_search_split,
    search_specification,
    selection_independence,
)
from src.validation.backtest import aggregate
from src.search.spec import ModelSpec, apply_to_bundle, default_harmonics, neighbours
from src.validation.holdout import split_bundle

CONTROLS = ["comp1", "ex_1", "ex_2"]


# ---------------------------------------------------------------------------
# ModelSpec
# ---------------------------------------------------------------------------

def test_default_matches_the_hardcoded_model():
    """The default spec must describe what the model did before it was configurable."""
    assert default_harmonics("weekly") == 2
    assert default_harmonics("monthly") == 1

    weekly = ModelSpec.default(CONTROLS, "weekly")
    assert weekly.controls == tuple(CONTROLS)
    assert weekly.seasonality_harmonics == 2
    assert weekly.trend is True
    assert weekly.is_default(CONTROLS, "weekly")

    monthly = ModelSpec.default(CONTROLS, "monthly")
    assert monthly.seasonality_harmonics == 1
    assert monthly.is_default(CONTROLS, "monthly")
    assert not monthly.is_default(CONTROLS, "weekly")


def test_spec_roundtrips_through_dict():
    s = ModelSpec(controls=("a", "b"), seasonality_harmonics=2, trend=False)
    assert ModelSpec.from_dict(s.to_dict()) == s


def test_spec_is_hashable_and_comparable():
    a = ModelSpec(("x",), 1, True)
    b = ModelSpec(("x",), 1, True)
    assert a == b and len({a, b}) == 1


def test_param_hint_counts_what_the_spec_adds():
    # intercept + trend + 2*harmonics + controls
    assert ModelSpec(("a", "b"), 1, True).n_params_hint == 1 + 1 + 2 + 2
    assert ModelSpec((), 0, False).n_params_hint == 1


# ---------------------------------------------------------------------------
# neighbours
# ---------------------------------------------------------------------------

def test_neighbours_change_exactly_one_thing():
    spec = ModelSpec(tuple(CONTROLS), 1, True)
    for n in neighbours(spec, CONTROLS):
        diffs = sum([
            n.controls != spec.controls,
            n.seasonality_harmonics != spec.seasonality_harmonics,
            n.trend != spec.trend,
        ])
        assert diffs == 1, f"{n} differs from {spec} in {diffs} ways"


def test_neighbours_never_include_the_incumbent_and_are_unique():
    spec = ModelSpec(tuple(CONTROLS), 1, True)
    ns = neighbours(spec, CONTROLS)
    assert spec not in ns
    assert len(ns) == len(set(ns))


def test_neighbours_respect_harmonic_bounds():
    assert all(n.seasonality_harmonics >= 0
               for n in neighbours(ModelSpec((), 0, True), CONTROLS))
    assert all(n.seasonality_harmonics <= 2
               for n in neighbours(ModelSpec((), 2, True), CONTROLS))


def test_dropping_and_restoring_a_control_preserves_order():
    spec = ModelSpec(("comp1", "ex_2"), 1, True)
    restored = [n for n in neighbours(spec, CONTROLS) if "ex_1" in n.controls]
    assert restored, "adding a dropped control back should be a neighbour"
    # order follows all_controls, not insertion order
    assert restored[0].controls == ("comp1", "ex_1", "ex_2")


# ---------------------------------------------------------------------------
# apply_to_bundle
# ---------------------------------------------------------------------------

def make_bundle(T=12, K=3):
    rng = np.random.default_rng(0)
    y = rng.normal(100, 10, size=(T, 1, 1))
    return {
        "Y": y, "Y_scaled": y, "Y_revenue": None,
        "X_media": rng.uniform(0, 10, size=(T, 1, 1, 2)),
        "X_control": rng.uniform(0, 1, size=(T, 1, 1, K)),
        "y_mean": 0.0, "y_std": 1.0,
        "media_info": pd.DataFrame({"variable": ["m0", "m1"]}),
        "coords": {"time": list(range(T)), "region": ["n"], "sub_brand": ["b"],
                   "media": ["m0", "m1"], "control": CONTROLS[:K]},
        "shapes": {"T": T, "G": 1, "SB": 1, "C": 2, "K": K},
    }


def test_apply_slices_controls_and_updates_shapes():
    b = make_bundle()
    out = apply_to_bundle(b, ModelSpec(("ex_2",), 1, True))

    assert out["X_control"].shape == (12, 1, 1, 1)
    assert out["coords"]["control"] == ["ex_2"]
    assert out["shapes"]["K"] == 1
    # the slice is the right column
    np.testing.assert_array_equal(out["X_control"][:, :, :, 0], b["X_control"][:, :, :, 2])


def test_apply_does_not_mutate_the_original():
    b = make_bundle()
    apply_to_bundle(b, ModelSpec(("ex_2",), 1, True))
    assert b["X_control"].shape == (12, 1, 1, 3)
    assert b["coords"]["control"] == CONTROLS
    assert b["shapes"]["K"] == 3


def test_apply_handles_dropping_every_control():
    out = apply_to_bundle(make_bundle(), ModelSpec((), 1, True))
    assert out["X_control"].shape == (12, 1, 1, 0)
    assert out["shapes"]["K"] == 0


def test_apply_with_all_controls_leaves_the_tensor_alone():
    b = make_bundle()
    out = apply_to_bundle(b, ModelSpec(tuple(CONTROLS), 1, True))
    assert out["X_control"] is b["X_control"]
    assert out["spec"].controls == tuple(CONTROLS)


# ---------------------------------------------------------------------------
# the search loop (no MCMC — the fit is injected)
# ---------------------------------------------------------------------------

def run_with_scores(scores, **kw):
    """
    Drive the search with a lookup from spec label -> skill. Anything not listed
    scores 0. `fit` is a stub because evaluate_spec is monkeypatched.
    """
    b = make_bundle()

    def fake_evaluate(spec, bundle_full, n_holdout, model_frequency, fit):
        return Evaluation(
            spec=spec, skill=scores.get(spec.label(), 0.0), rmse=1.0, r2=0.1,
            coverage_90=0.9, trustworthy=True,
        )

    import src.search.search as mod
    original = mod.evaluate_spec
    mod.evaluate_spec = fake_evaluate
    try:
        return search_specification(
            b, fit=lambda x: None, n_holdout=3, model_frequency="monthly", **kw
        )
    finally:
        mod.evaluate_spec = original


def test_search_keeps_the_default_when_nothing_improves():
    r = run_with_scores({})
    assert r["kept_default"] is True
    assert r["winner"] == ModelSpec.default(CONTROLS, "monthly").to_dict()
    assert r["improvement"] == pytest.approx(0.0)


def test_search_moves_to_a_clearly_better_spec():
    better = ModelSpec(("comp1", "ex_2"), 1, True)       # one step: drop ex_1
    r = run_with_scores({better.label(): 0.5})
    assert r["kept_default"] is False
    assert r["winner"] == better.to_dict()
    assert r["winner_skill"] == pytest.approx(0.5)
    assert r["improvement"] == pytest.approx(0.5)


def test_noise_sized_gains_are_not_chased():
    """A gain under min_improvement with no simplicity benefit must not move the search."""
    equal_size = ModelSpec(tuple(CONTROLS), 2, True)      # same control count, +harmonic
    r = run_with_scores({equal_size.label(): 0.005}, min_improvement=0.01)
    assert r["kept_default"] is True


def test_a_tie_keeps_the_incumbent():
    """
    A tie is not evidence. An earlier version moved to the simpler of two tied specs,
    which let every tie license another step — on flat ground the search walked to the
    minimal model and the answer depended on the round budget.
    """
    simpler = ModelSpec(("comp1", "ex_2"), 1, True)       # fewer controls, same score
    r = run_with_scores({simpler.label(): 0.0}, min_improvement=0.01)
    assert r["kept_default"] is True
    assert r["winner"] == ModelSpec.default(CONTROLS, "monthly").to_dict()


def test_flat_ground_does_not_walk_the_model_to_nothing():
    """Every candidate scoring identically must leave the specification where it started."""
    r = run_with_scores({}, max_rounds=5, max_fits=100)
    assert r["kept_default"] is True
    assert r["n_fits"] < 100, "the search should stop, not exhaust its budget on ties"


def test_fit_budget_is_respected_and_reported():
    r = run_with_scores({}, max_fits=3)
    assert r["n_fits"] <= 3
    assert "budget" in r["stop_reason"]


def test_history_records_every_candidate_tried():
    r = run_with_scores({})
    labels = [h["label"] for h in r["history"]]
    assert len(labels) == len(set(labels)), "a candidate was evaluated twice"
    assert ModelSpec.default(CONTROLS, "monthly").label() in labels


def test_unscoreable_default_abandons_the_search_with_a_full_payload():
    b = make_bundle()

    def broken(spec, *a, **k):
        return Evaluation(spec=spec, skill=None, rmse=None, r2=None, coverage_90=None,
                          trustworthy=False, error="boom")

    import src.search.search as mod
    original = mod.evaluate_spec
    mod.evaluate_spec = broken
    try:
        r = search_specification(b, fit=lambda x: None, n_holdout=3,
                                 model_frequency="monthly")
    finally:
        mod.evaluate_spec = original

    assert r["error"]
    # callers read these unconditionally, so they must be present on the error path too
    for key in ("winner", "winner_label", "kept_default", "n_fits", "stop_reason",
                "history"):
        assert key in r, key


def test_an_untrustworthy_candidate_is_skipped_not_selected():
    """A huge score means nothing if the forward model no longer mirrors PyMC."""
    target = ModelSpec(("comp1", "ex_2"), 1, True)
    b = make_bundle()

    def evaluate(spec, *a, **k):
        if spec == target:
            return Evaluation(spec=spec, skill=99.0, rmse=1.0, r2=1.0, coverage_90=0.9,
                              trustworthy=False)
        return Evaluation(spec=spec, skill=0.0, rmse=1.0, r2=0.1, coverage_90=0.9,
                          trustworthy=True)

    import src.search.search as mod
    original = mod.evaluate_spec
    mod.evaluate_spec = evaluate
    try:
        r = search_specification(b, fit=lambda x: None, n_holdout=3,
                                 model_frequency="monthly")
    finally:
        mod.evaluate_spec = original

    assert r["winner"] != target.to_dict()
    assert r["kept_default"] is True


# ---------------------------------------------------------------------------
# the search must not select on the periods its winner is judged on
# ---------------------------------------------------------------------------

def test_split_plan_reserves_two_windows():
    """The dovato shape: T=33, report on 6, select on 6, train on 21."""
    plan = plan_search_split(33, 6, 6)
    assert plan["feasible"] is True
    assert plan["reason"] is None
    assert (plan["n_report"], plan["n_search_holdout"], plan["n_search_train"]) == (6, 6, 21)


def test_split_plan_refuses_when_the_series_cannot_carry_both_windows():
    plan = plan_search_split(18, 6, 6)          # 6 left to train on, under 2x6
    assert plan["feasible"] is False
    assert "two holdout windows" in plan["reason"]
    assert plan["n_search_train"] == 6


@pytest.mark.parametrize("n_report,n_search", [(0, 6), (6, 0)])
def test_split_plan_refuses_a_missing_window(n_report, n_search):
    """Either window missing means one set of periods would do both jobs."""
    assert plan_search_split(33, n_report, n_search)["feasible"] is False


def test_the_search_never_sees_the_reserved_periods():
    """
    The whole point of the reserve: no bundle the search scores may contain a period
    that holdout_metrics will later report on.
    """
    b = make_bundle(T=24)
    n_report = 6

    search_bundle, reserved = split_bundle(b, n_report)
    withheld = set(reserved["holdout_periods"])
    assert withheld, "nothing was reserved"

    seen: set = set()

    def spy(spec, bundle_full, n_holdout, model_frequency, fit):
        seen.update(str(p) for p in bundle_full["coords"]["time"])
        assert bundle_full["shapes"]["T"] == 24 - n_report
        return Evaluation(spec=spec, skill=0.0, rmse=1.0, r2=0.1, coverage_90=0.9,
                          trustworthy=True)

    import src.search.search as mod
    original = mod.evaluate_spec
    mod.evaluate_spec = spy
    try:
        search_specification(search_bundle, fit=lambda x: None, n_holdout=4,
                             model_frequency="monthly")
    finally:
        mod.evaluate_spec = original

    assert seen, "the search scored nothing"
    assert not (seen & withheld), f"the search saw reserved periods: {seen & withheld}"


# ---------------------------------------------------------------------------
# selection_independence — what the approval gate reads
# ---------------------------------------------------------------------------

def test_no_search_means_the_holdout_is_independent():
    v = selection_independence(None)
    assert v["selection_independent"] is True
    assert "no specification search" in v["selection_note"]


def test_a_search_that_failed_leaves_the_holdout_independent():
    v = selection_independence({"enabled": True, "error": "n_holdout 40 >= T 33"})
    assert v["selection_independent"] is True


def test_keeping_the_default_leaves_the_holdout_independent():
    """The incumbent's score is its own score, not the maximum over the candidates."""
    v = selection_independence({"enabled": True, "kept_default": True})
    assert v["selection_independent"] is True


def test_a_reserved_window_makes_a_searched_spec_independent():
    v = selection_independence(
        {"enabled": True, "kept_default": False, "evaluation_reserved": True}
    )
    assert v["selection_independent"] is True
    assert "withheld" in v["selection_note"]


def test_a_shared_window_is_not_independent():
    """The defect this guards: selected on the periods reported as its evidence."""
    v = selection_independence({"enabled": True, "kept_default": False})
    assert v["selection_independent"] is False
    assert "maximum over the candidates" in v["selection_note"]


# ---------------------------------------------------------------------------
# the rolling-origin referee inside the search loop
# ---------------------------------------------------------------------------

def _detail(errors_by_origin, naive_err=10.0, y=100.0):
    """A backtest payload with known forecast errors, so pairing can be checked."""
    pts = []
    for o, errs in errors_by_origin.items():
        for i, e in enumerate(errs):
            pts.append({
                "origin": o, "t": o + i, "step": i + 1, "g": 0, "sb": 0,
                "period": f"p{o}-{i}", "y": y, "pred": y - e,
                "naive": y - naive_err, "in_mu_90": True, "in_pred_90": True,
            })
    d = aggregate(pts)
    d.update({"points": pts, "trustworthy": True, "origins": sorted(errors_by_origin),
              "horizon": 1, "per_origin": []})
    return d


class _StubRolling(RollingOriginReferee):
    """Real pairing, real decision rule, fabricated forecasts instead of MCMC."""

    def __init__(self, errors_by_label, default_errors, min_improvement=0.01):
        super().__init__(
            bundle_full=None, fit=None,
            plan={"origins": sorted(default_errors), "horizon": 1, "min_train": 0},
            model_frequency="monthly", min_improvement=min_improvement, n_boot=800,
        )
        self.errors_by_label = errors_by_label
        self.default_errors = default_errors

    def evaluate(self, spec):
        d = _detail(self.errors_by_label.get(spec.label(), self.default_errors))
        return Evaluation(spec=spec, skill=d["skill_vs_naive"], rmse=d["rmse"], r2=None,
                          coverage_90=d["coverage_90_predictive"], trustworthy=True,
                          detail=d)


# incumbent and a candidate that trade wins origin by origin: the mean favours the
# candidate, but which origins you drew decides the answer.
NOISY_BASE = {1: [9.0], 2: [1.0], 3: [9.0], 4: [1.0],
              5: [9.0], 6: [1.0], 7: [9.0], 8: [1.0]}
NOISY_CAND = {1: [1.0], 2: [9.0], 3: [1.0], 4: [9.0],
              5: [1.0], 6: [9.0], 7: [1.0], 8: [8.4]}
CLEAR_CAND = {o: [2.0] for o in NOISY_BASE}


def _target():
    return ModelSpec(("comp1", "ex_2"), 1, True)       # one step: drop ex_1


def test_rolling_referee_moves_to_a_demonstrated_winner():
    ref = _StubRolling({_target().label(): CLEAR_CAND}, NOISY_BASE)
    r = search_specification(make_bundle(), fit=lambda x: None, n_holdout=3,
                             model_frequency="monthly", referee=ref)

    assert r["kept_default"] is False
    assert r["winner"] == _target().to_dict()
    assert r["winner_vs_baseline"]["demonstrated"] is True
    assert r["winner_vs_baseline"]["lo"] > 0


def test_rolling_referee_refuses_a_gain_it_cannot_demonstrate():
    """The whole point: positive on average, not distinguishable from the draw."""
    ref = _StubRolling({_target().label(): NOISY_CAND}, NOISY_BASE)
    r = search_specification(make_bundle(), fit=lambda x: None, n_holdout=3,
                             model_frequency="monthly", referee=ref)

    assert r["kept_default"] is True, "an undemonstrated gain must not win"
    assert r["winner_vs_baseline"] is None

    tried = {h["label"]: h for h in r["history"]}
    vs = tried[_target().label()]["vs_incumbent"]
    assert vs["gain"] > 0.01, "the point estimate did favour the candidate"
    assert vs["lo"] <= 0 and vs["demonstrated"] is False


def test_the_old_threshold_would_have_accepted_that_same_candidate():
    """
    Same forecasts, same point estimate, opposite verdict — this is the behaviour change.
    The threshold rule sees a gain above 0.01 and moves; the paired rule sees an interval
    through zero and stays.
    """
    base = _detail(NOISY_BASE)
    cand = _detail(NOISY_CAND)

    inc_ev = Evaluation(spec=ModelSpec((), 1, True), skill=base["skill_vs_naive"],
                        rmse=None, r2=None, coverage_90=None, trustworthy=True,
                        detail=base)
    cand_ev = Evaluation(spec=_target(), skill=cand["skill_vs_naive"], rmse=None,
                         r2=None, coverage_90=None, trustworthy=True, detail=cand)

    old = SingleHoldoutReferee(None, None, n_holdout=6, model_frequency="monthly",
                               min_improvement=0.01)
    new = _StubRolling({}, NOISY_BASE)

    old_cmp = old.compare(inc_ev, cand_ev)
    new_cmp = new.compare(inc_ev, cand_ev)

    assert old.decisive(old_cmp) is True,  "the threshold rule accepts it"
    assert new.decisive(new_cmp) is False, "the paired rule does not"
    assert old_cmp["gain"] == pytest.approx(new_cmp["gain"], abs=1e-9)
    assert old_cmp["demonstrated"] is None, "a single window cannot answer this"


def test_the_referee_records_how_it_judged():
    """A pharma client asking why the model has this form needs the protocol, not a score."""
    ref = _StubRolling({_target().label(): CLEAR_CAND}, NOISY_BASE)
    r = search_specification(make_bundle(), fit=lambda x: None, n_holdout=3,
                             model_frequency="monthly", referee=ref)

    d = r["referee"]
    assert d["referee"] == "rolling_origin"
    assert d["resampled_over"] == "origins, not points"
    assert "clears zero" in d["decision_rule"]
    assert d["n_fits_per_candidate"] == 8


def test_the_default_referee_is_still_the_single_holdout():
    """Nothing changes for callers that do not ask for the new referee."""
    r = run_with_scores({})
    assert r["referee"]["referee"] == "single_holdout"
    assert r["referee"]["n_fits_per_candidate"] == 1


def test_history_keeps_the_per_origin_evidence_but_not_every_forecast():
    """The trail has to be interrogable without storing a row per forecast per candidate."""
    ref = _StubRolling({_target().label(): CLEAR_CAND}, NOISY_BASE)
    r = search_specification(make_bundle(), fit=lambda x: None, n_holdout=3,
                             model_frequency="monthly", referee=ref)

    for h in r["history"]:
        assert "detail" in h
        assert "points" not in h["detail"], "per-forecast rows must not reach the output"
        assert h["detail"]["n_origins"] == 8
