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
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Callable, Dict, List, Optional, Sequence

from src.logger import get_logger
from src.search.spec import ModelSpec, apply_to_bundle, neighbours
from src.validation.holdout import score_holdout, split_bundle, verify_forward_model

logger = get_logger(__name__)


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

    def to_dict(self) -> dict:
        return {
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

    @property
    def usable(self) -> bool:
        return self.error is None and self.trustworthy and self.skill is not None


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


def search_specification(
    bundle_full: dict,
    fit: Callable[[dict], object],
    *,
    n_holdout: int,
    model_frequency: str,
    max_rounds: int = 3,
    min_improvement: float = 0.01,
    max_fits: int = 40,
) -> dict:
    """
    Stepwise search from the default specification.

    Returns a record of the whole search: the winner, every candidate tried with its
    out-of-sample score, and why the search stopped. The trail matters as much as the
    answer — a specification nobody can interrogate is not evidence.
    """
    all_controls = list(bundle_full["coords"].get("control", []))
    incumbent = ModelSpec.default(all_controls, model_frequency)

    logger.info(
        f"SPEC SEARCH | start {incumbent.label()} | "
        f"holdout={n_holdout} max_rounds={max_rounds} max_fits={max_fits}"
    )

    history: List[Evaluation] = []
    fits = 0

    base = evaluate_spec(incumbent, bundle_full, n_holdout, model_frequency, fit)
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

            ev = evaluate_spec(cand, bundle_full, n_holdout, model_frequency, fit)
            history.append(ev)
            fits += 1

            if not ev.usable:
                logger.info(f"SPEC SEARCH |   skip {cand.label()} — {ev.error or 'untrustworthy'}")
                continue

            delta = ev.skill - round_best.skill
            improved = delta > min_improvement

            logger.info(
                f"SPEC SEARCH |   {cand.label()} skill={ev.skill:+.4f} "
                f"({delta:+.4f}){' WIN' if improved else ''}"
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
        "n_fits": fits,
        "stop_reason": stop_reason,
        "n_holdout": n_holdout,
        "history": [e.to_dict() for e in history],
    }
