"""
Specification search, judged out-of-sample.

The loop is deliberately boring: propose one-step changes to the current specification,
fit each, score it on periods the model never saw, keep the best, repeat until nothing
improves. No specification is ever judged by how well it fits the data it was trained on,
because that is the score a search will exploit — it rewards adding parameters, and on
33 observations there is plenty of room to add parameters that explain nothing.

What it optimises is `skill_vs_naive`: how much better the model forecasts held-out
periods than simply predicting the training mean. A specification that cannot beat a
constant is rejected no matter how good its in-sample r2 looks.

The one guard against the search fooling itself is a **minimum improvement**: a candidate
must beat the incumbent by `min_improvement`, not merely tie it. Holdout scores on a
handful of periods are noisy, and without a threshold the search wanders through
statistically indistinguishable specifications, stopping on whichever one the round
budget happened to end on — an artifact that then looks like a finding.

A tie therefore keeps the incumbent. An earlier version also moved to the simpler of two
tied specifications, which seemed principled and was not: each tie licensed another step,
so on flat ground the search stripped the model down round after round and the answer
depended on how many rounds it was allowed. Requiring a real improvement already delivers
parsimony — a more complex specification has to earn its complexity — without the drift.

Cost is the real constraint: every candidate is a full MCMC fit. The search samples at
reduced draws, then refits the winner properly.

One thing the search must never be given is the periods its winner will later be judged
on. `plan_search_split` and `selection_independence` below exist for that; the argument is
with them.
"""

from __future__ import annotations

import math
import time
from dataclasses import dataclass
from typing import Callable, Dict, List, Optional, Sequence

from src.logger import get_logger
from src.search.spec import ModelSpec, apply_to_bundle, neighbours
from src.validation.backtest import backtest_spec, paired_gain
from src.validation.backtest import decisive as backtest_decisive
from src.validation.holdout import score_holdout, split_bundle, verify_forward_model

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# keeping the reported holdout out of the search's hands
# ---------------------------------------------------------------------------

# The search's own holdout must not be more than a third of what the search can see.
# Below that the scores it selects on are noisier than the quantity it is trying to
# improve, and the winner is whichever candidate the noise favoured.
MIN_SEARCH_TRAIN_RATIO = 2


def plan_search_split(n_total: int, n_report: int, n_search: int) -> dict:
    """
    Decide whether the search can run without seeing the periods that will be reported
    as its winner's out-of-sample evidence.

    The search chooses a specification by maximising `skill_vs_naive` on held-out
    periods. If those are the same periods later reported as that specification's
    holdout evidence, the reported number is the maximum over however many candidates
    were tried — not an estimate of how the model forecasts. The approval gate binds on
    that number, so it has to mean what it says.

    The fix is two windows. The last `n_report` periods are withheld from the search
    entirely and are what `holdout_metrics` reports. The search gets its own holdout of
    `n_search` periods carved out of what remains, and selects on that.

    Returns a plan; when `feasible` is false, `reason` says why. The caller is expected
    to skip the search rather than fall back to sharing one window — a contaminated
    score is worse than no search, because it looks like evidence.
    """
    n_search_train = n_total - n_report - n_search

    if n_report <= 0:
        reason = "no periods are reserved for reporting (MMM_HOLDOUT_PERIODS is 0)"
    elif n_search <= 0:
        reason = "the search has no holdout to select on (MMM_SEARCH_HOLDOUT_PERIODS is 0)"
    elif n_search_train < MIN_SEARCH_TRAIN_RATIO * n_search:
        reason = (
            f"T={n_total} cannot carry two holdout windows: reserving {n_report} periods "
            f"for reporting and {n_search} for selection leaves {n_search_train} to train "
            f"on, under the {MIN_SEARCH_TRAIN_RATIO}x minimum "
            f"({MIN_SEARCH_TRAIN_RATIO * n_search}). Lower MMM_SEARCH_HOLDOUT_PERIODS or "
            "MMM_HOLDOUT_PERIODS, or do not search on a series this short."
        )
    else:
        reason = None

    return {
        "feasible": reason is None,
        "reason": reason,
        "n_total": int(n_total),
        "n_report": int(n_report),
        "n_search_holdout": int(n_search),
        "n_search_train": int(n_search_train),
    }


def selection_independence(spec_search: Optional[dict]) -> dict:
    """
    Were the periods the holdout reports on withheld from the specification search?

    Only `True` buys the reported `skill_vs_naive` its usual meaning. Every other answer
    says the number is a selected maximum, and the approval gate reads this verdict
    rather than inferring it.
    """
    if spec_search is None:
        return {
            "selection_independent": True,
            "selection_note": (
                "no specification search ran; the specification was not chosen by any score"
            ),
        }

    if spec_search.get("error"):
        return {
            "selection_independent": True,
            "selection_note": (
                "the specification search did not run "
                f"({spec_search['error']}); the default specification was used"
            ),
        }

    if spec_search.get("kept_default", False):
        return {
            "selection_independent": True,
            "selection_note": (
                "the search kept the default specification, so the reported score is that "
                "specification's own score and not the best of the candidates tried"
            ),
        }

    if spec_search.get("evaluation_reserved", False):
        return {
            "selection_independent": True,
            "selection_note": (
                "the search selected on earlier periods; the periods reported here were "
                "withheld from it"
            ),
        }

    return {
        "selection_independent": False,
        "selection_note": (
            "the specification was selected by maximising skill on the periods reported "
            "here, so this score is the maximum over the candidates tried and not "
            "out-of-sample evidence"
        ),
    }


@dataclass
class Evaluation:
    """What the search learned about one candidate."""

    spec: ModelSpec
    skill: Optional[float]
    rmse: Optional[float]
    r2: Optional[float]
    coverage_90: Optional[float]
    trustworthy: bool
    error: Optional[str] = None
    seconds: float = 0.0
    # Referee-specific evidence. The rolling-origin referee puts its per-origin scores
    # and its per-point forecasts here; the per-point forecasts are what make a paired
    # comparison possible, and they are dropped from `to_dict` because the recorded
    # history does not need a row per forecast per candidate.
    detail: Optional[dict] = None
    # How this candidate compared with the incumbent it was judged against.
    comparison: Optional[dict] = None

    def to_dict(self) -> dict:
        out = {
            "spec": self.spec.to_dict(),
            "label": self.spec.label(),
            "skill_vs_naive": self.skill,
            "rmse": self.rmse,
            "r2_vs_train_mean": self.r2,
            "coverage_90": self.coverage_90,
            "trustworthy": self.trustworthy,
            "error": self.error,
            "seconds": round(self.seconds, 1),
        }
        if self.detail is not None:
            out["detail"] = {k: v for k, v in self.detail.items() if k != "points"}
        if self.comparison is not None:
            out["vs_incumbent"] = self.comparison
        return out

    @property
    def usable(self) -> bool:
        if self.error is not None or not self.trustworthy or self.skill is None:
            return False
        # A nan score is not a score. `skill_vs_naive` is nan whenever the naive
        # baseline had no variance to beat, and nan loses every comparison silently
        # rather than visibly.
        return not math.isnan(float(self.skill))


def evaluate_spec(
    spec: ModelSpec,
    bundle_full: dict,
    n_holdout: int,
    model_frequency: str,
    fit: Callable[[dict], object],
) -> Evaluation:
    """
    Fit one specification on the training periods and score it on the holdout.

    `fit` takes a bundle and returns a trace; injecting it keeps this module free of
    the sampler and makes the loop testable without MCMC.
    """
    started = time.time()

    try:
        train_full, split_info = split_bundle(bundle_full, n_holdout)

        train = apply_to_bundle(train_full, spec)
        train["original_frequency"] = bundle_full.get("original_frequency")
        train["model_frequency"] = model_frequency

        scored_on = apply_to_bundle(bundle_full, spec)
        scored_on["model_frequency"] = model_frequency

        trace = fit(train)

        check = verify_forward_model(trace, train, model_frequency)
        metrics = score_holdout(trace, scored_on, split_info, model_frequency)

        return Evaluation(
            spec=spec,
            skill=metrics.get("skill_vs_naive"),
            rmse=metrics.get("rmse"),
            r2=metrics.get("r2_vs_train_mean"),
            coverage_90=metrics.get("coverage_90"),
            trustworthy=bool(check.get("matches")),
            seconds=time.time() - started,
        )

    except Exception as exc:  # noqa: BLE001 - a bad candidate must not end the search
        logger.warning(f"Candidate rejected ({spec.label()}): {type(exc).__name__}: {exc}")
        return Evaluation(
            spec=spec, skill=None, rmse=None, r2=None, coverage_90=None,
            trustworthy=False, error=f"{type(exc).__name__}: {exc}",
            seconds=time.time() - started,
        )


# ---------------------------------------------------------------------------
# referees — how one candidate is scored, and how two are compared
# ---------------------------------------------------------------------------
#
# The loop below does not care how a candidate is judged, only whether a comparison was
# decisive. That split exists because the two referees answer the comparison question
# very differently: one subtracts two numbers and checks the difference against a fixed
# threshold, the other forms an interval around the difference and asks whether it clears
# zero. The second can say "I cannot tell", which is the answer most often true on 33
# monthly observations and the one the first cannot express.


class SingleHoldoutReferee:
    """
    One fit per candidate, scored on one trailing window, compared with a threshold.

    The original referee, kept as the default so existing behaviour is unchanged. Its
    limitation is not fixable by tuning: on the dovato shape its score has a sampling sd
    of about 0.26, so the 0.01 threshold is 0.04 of one standard deviation. It stops the
    search random-walking across ties, which is what it was built for, and it cannot
    distinguish a real gain from a lucky one.
    """

    name = "single_holdout"

    def __init__(self, bundle_full, fit, *, n_holdout, model_frequency,
                 min_improvement=0.01):
        self.bundle_full = bundle_full
        self.fit = fit
        self.n_holdout = n_holdout
        self.model_frequency = model_frequency
        self.min_improvement = min_improvement

    def evaluate(self, spec: ModelSpec) -> Evaluation:
        # Resolved from module globals at call time, so tests can substitute it.
        return evaluate_spec(
            spec, self.bundle_full, self.n_holdout, self.model_frequency, self.fit
        )

    def compare(self, incumbent: Evaluation, candidate: Evaluation) -> dict:
        if incumbent.skill is None or candidate.skill is None:
            return {"gain": None, "demonstrated": None, "reason": "a score is missing"}
        return {
            "gain": candidate.skill - incumbent.skill,
            # This referee has one number per candidate and no way to put an interval
            # around their difference. Not "no" — unknown.
            "demonstrated": None,
            "min_improvement": self.min_improvement,
            "basis": "two scores from one holdout window, subtracted",
        }

    def decisive(self, comparison: dict) -> bool:
        gain = comparison.get("gain")
        return gain is not None and gain > self.min_improvement

    def describe(self) -> dict:
        return {
            "referee": self.name,
            "n_holdout": self.n_holdout,
            "min_improvement": self.min_improvement,
            "n_fits_per_candidate": 1,
            "decision_rule": "gain > min_improvement",
            "caveat": (
                "a single window cannot bound the noise on its own score, so a gain "
                "below that noise is indistinguishable from selection"
            ),
        }


class RollingOriginReferee:
    """
    Expanding-window origins per candidate, compared point by point with a bootstrap
    interval over origins.

    Every candidate is scored on the same (origin, period) forecasts, so the comparison
    is paired: the shared difficulty of the periods cancels, leaving the difference
    between the specifications. A candidate wins only when the interval on that
    difference clears zero — see `validation.backtest.decisive`.

    Costs one MCMC fit per origin per candidate. That is the trade: resolution is bought
    with evaluation points, and it cannot be bought with candidates.
    """

    name = "rolling_origin"

    def __init__(self, bundle_full, fit, *, plan, model_frequency,
                 min_improvement=0.01, max_draws=500, n_boot=2000, seed=0):
        self.bundle_full = bundle_full
        self.fit = fit
        self.plan = plan
        self.model_frequency = model_frequency
        self.min_improvement = min_improvement
        self.max_draws = max_draws
        self.n_boot = n_boot
        self.seed = seed

    def evaluate(self, spec: ModelSpec) -> Evaluation:
        started = time.time()
        try:
            scored = apply_to_bundle(self.bundle_full, spec)
            scored["model_frequency"] = self.model_frequency
            scored["original_frequency"] = self.bundle_full.get("original_frequency")

            result = backtest_spec(
                scored,
                self.fit,
                origins=self.plan["origins"],
                horizon=self.plan["horizon"],
                model_frequency=self.model_frequency,
                max_draws=self.max_draws,
                seed=self.seed,
            )

            return Evaluation(
                spec=spec,
                skill=result["skill_vs_naive"],
                rmse=result["rmse"],
                r2=None,
                # The predictive interval, which includes observation noise — not the
                # narrower mu interval `holdout.score_holdout` reports. Both are in
                # `detail`.
                coverage_90=result["coverage_90_predictive"],
                trustworthy=bool(result["trustworthy"]),
                detail=result,
                seconds=time.time() - started,
            )

        except Exception as exc:  # noqa: BLE001 - a bad candidate must not end the search
            logger.warning(
                f"Candidate rejected ({spec.label()}): {type(exc).__name__}: {exc}"
            )
            return Evaluation(
                spec=spec, skill=None, rmse=None, r2=None, coverage_90=None,
                trustworthy=False, error=f"{type(exc).__name__}: {exc}",
                seconds=time.time() - started,
            )

    def compare(self, incumbent: Evaluation, candidate: Evaluation) -> dict:
        if incumbent.detail is None or candidate.detail is None:
            return {"gain": None, "demonstrated": None,
                    "reason": "a candidate has no backtest to pair against"}
        return paired_gain(
            incumbent.detail, candidate.detail, n_boot=self.n_boot, seed=self.seed
        )

    def decisive(self, comparison: dict) -> bool:
        return backtest_decisive(comparison, self.min_improvement)

    def describe(self) -> dict:
        return {
            "referee": self.name,
            "origins": self.plan["origins"],
            "horizon": self.plan["horizon"],
            "min_train": self.plan["min_train"],
            "min_improvement": self.min_improvement,
            "n_fits_per_candidate": len(self.plan["origins"]),
            "n_boot": self.n_boot,
            "decision_rule": (
                "the 90% bootstrap interval on the paired gain clears zero AND the gain "
                "exceeds min_improvement"
            ),
            "paired_on": "identical (origin, period, geo, sub_brand) forecasts",
            "resampled_over": "origins, not points",
            "coverage_90_is": "predictive (includes sigma)",
        }


def search_specification(
    bundle_full: dict,
    fit: Callable[[dict], object],
    *,
    n_holdout: int,
    model_frequency: str,
    max_rounds: int = 3,
    min_improvement: float = 0.01,
    max_fits: int = 40,
    referee=None,
) -> dict:
    """
    Stepwise search from the default specification.

    Returns a record of the whole search: the winner, every candidate tried with its
    out-of-sample score, and why the search stopped. The trail matters as much as the
    answer — a specification nobody can interrogate is not evidence.
    """
    if referee is None:
        referee = SingleHoldoutReferee(
            bundle_full, fit, n_holdout=n_holdout, model_frequency=model_frequency,
            min_improvement=min_improvement,
        )

    all_controls = list(bundle_full["coords"].get("control", []))
    incumbent = ModelSpec.default(all_controls, model_frequency)

    logger.info(
        f"SPEC SEARCH | start {incumbent.label()} | referee={referee.name} | "
        f"holdout={n_holdout} max_rounds={max_rounds} max_fits={max_fits}"
    )

    history: List[Evaluation] = []
    fits = 0

    base = referee.evaluate(incumbent)
    history.append(base)
    fits += 1

    if not base.usable:
        logger.error(
            "SPEC SEARCH | the default specification could not be scored "
            f"({base.error or 'untrustworthy holdout'}); abandoning the search."
        )
        return {
            "enabled": True,
            "error": base.error or "default specification could not be scored",
            "winner": incumbent.to_dict(),
            "winner_label": incumbent.label(),
            "kept_default": True,
            "baseline_skill": None,
            "winner_skill": None,
            "improvement": None,
            "n_fits": fits,
            "stop_reason": "the default specification could not be scored",
            "n_holdout": n_holdout,
            "referee": referee.describe(),
            "history": [e.to_dict() for e in history],
        }

    best = base
    logger.info(f"SPEC SEARCH | baseline skill={best.skill:+.4f} ({incumbent.label()})")

    stop_reason = "no candidate improved on the incumbent"

    for rnd in range(1, max_rounds + 1):
        candidates = neighbours(best.spec, all_controls)
        tried = {e.spec for e in history}
        candidates = [c for c in candidates if c not in tried]

        if not candidates:
            stop_reason = "every neighbouring specification had already been tried"
            break

        logger.info(f"SPEC SEARCH | round {rnd}: {len(candidates)} candidates")

        round_best = best
        for cand in candidates:
            if fits >= max_fits:
                stop_reason = f"reached the fit budget ({max_fits})"
                break

            ev = referee.evaluate(cand)
            history.append(ev)
            fits += 1

            if not ev.usable:
                logger.info(f"SPEC SEARCH |   skip {cand.label()} — {ev.error or 'untrustworthy'}")
                continue

            comparison = referee.compare(round_best, ev)
            ev.comparison = comparison
            improved = referee.decisive(comparison)

            gain = comparison.get("gain")
            detail = ""
            if comparison.get("lo") is not None:
                detail = (
                    f" [{comparison['lo']:+.3f}, {comparison['hi']:+.3f}]"
                    f" p={comparison['p_better']:.2f}"
                )
            logger.info(
                f"SPEC SEARCH |   {cand.label()} skill={ev.skill:+.4f} "
                f"({'n/a' if gain is None else f'{gain:+.4f}'}){detail}"
                f"{' WIN' if improved else ''}"
            )

            if improved:
                round_best = ev

        # Commit whatever this round found BEFORE honouring the budget. Breaking first
        # would throw away improvements already paid for in MCMC time and report an
        # earlier, worse specification as the winner.
        improved_this_round = round_best is not best
        if improved_this_round:
            best = round_best
            logger.info(
                f"SPEC SEARCH | round {rnd} winner: {best.spec.label()} "
                f"skill={best.skill:+.4f}"
            )

        if fits >= max_fits:
            stop_reason = f"reached the fit budget ({max_fits})"
            break

        if not improved_this_round:
            stop_reason = "no candidate improved on the incumbent"
            break
    else:
        stop_reason = f"exhausted the round budget ({max_rounds})"

    improvement = best.skill - base.skill
    kept_default = best.spec == incumbent

    # The headline claim, stated the way the referee can support it. Pairing is pure
    # arithmetic over forecasts already made, so this costs no fits.
    winner_vs_baseline = None if kept_default else referee.compare(base, best)

    logger.info(
        f"SPEC SEARCH | done after {fits} fits — "
        + (
            "kept the default specification"
            if kept_default
            else f"chose {best.spec.label()} (skill {base.skill:+.4f} -> {best.skill:+.4f})"
        )
        + f"; {stop_reason}"
    )

    return {
        "enabled": True,
        "winner": best.spec.to_dict(),
        "winner_label": best.spec.label(),
        "kept_default": kept_default,
        "baseline_skill": base.skill,
        "winner_skill": best.skill,
        "improvement": improvement,
        "winner_vs_baseline": winner_vs_baseline,
        "n_fits": fits,
        "stop_reason": stop_reason,
        "n_holdout": n_holdout,
        "referee": referee.describe(),
        "history": [e.to_dict() for e in history],
    }
