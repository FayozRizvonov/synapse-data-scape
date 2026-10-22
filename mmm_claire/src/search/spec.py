"""
Model specifications — the things a search is allowed to vary.

Until now the specification was fixed in code: every control in info.csv was included,
seasonality was one harmonic for monthly data and two for weekly, and a linear trend was
always on. Those are modelling choices, not facts, and on 33 observations against ~31
free parameters they are not obviously the right ones.

A `ModelSpec` makes them explicit so a search can propose alternatives and the holdout
can judge them.

**The default spec must reproduce the existing model exactly.** PyMC consumes random
draws in the order variables are declared, so a specification that is mathematically
identical but declared differently samples differently. `pymc_mmm.build_pymc_model`
therefore keeps the original block verbatim for the default and only takes the
generalised path when a spec actually differs — see `ModelSpec.is_default`.
"""

from __future__ import annotations

from dataclasses import dataclass, replace
from typing import Iterable, List, Optional, Sequence, Tuple


def default_harmonics(model_frequency: str) -> int:
    """What the hardcoded model used: 2 harmonics weekly, 1 monthly."""
    return 2 if model_frequency == "weekly" else 1


@dataclass(frozen=True)
class ModelSpec:
    """One candidate specification. Frozen so it can be a dict key and logged safely."""

    controls: Tuple[str, ...]
    seasonality_harmonics: int
    trend: bool

    # ---------------------------------------------------------------- building

    @staticmethod
    def default(all_controls: Sequence[str], model_frequency: str) -> "ModelSpec":
        return ModelSpec(
            controls=tuple(all_controls),
            seasonality_harmonics=default_harmonics(model_frequency),
            trend=True,
        )

    def is_default(self, all_controls: Sequence[str], model_frequency: str) -> bool:
        return self == ModelSpec.default(all_controls, model_frequency)

    # ---------------------------------------------------------------- describing

    @property
    def n_params_hint(self) -> int:
        """
        Rough count of the free parameters this spec adds beyond the media block —
        used only to break ties toward the simpler model.
        """
        n = 1  # intercept
        n += 1 if self.trend else 0
        n += 2 * self.seasonality_harmonics
        n += len(self.controls)
        return n

    def label(self) -> str:
        ctrl = ",".join(self.controls) if self.controls else "none"
        return (
            f"controls=[{ctrl}] harmonics={self.seasonality_harmonics} "
            f"trend={'on' if self.trend else 'off'}"
        )

    def to_dict(self) -> dict:
        return {
            "controls": list(self.controls),
            "seasonality_harmonics": self.seasonality_harmonics,
            "trend": self.trend,
        }

    @staticmethod
    def from_dict(d: dict) -> "ModelSpec":
        return ModelSpec(
            controls=tuple(d.get("controls", ())),
            seasonality_harmonics=int(d.get("seasonality_harmonics", 1)),
            trend=bool(d.get("trend", True)),
        )


# ---------------------------------------------------------------------------
# candidate generation
# ---------------------------------------------------------------------------

MAX_HARMONICS = 2


def neighbours(spec: ModelSpec, all_controls: Sequence[str]) -> List[ModelSpec]:
    """
    One-step moves from a specification.

    A stepwise neighbourhood rather than the full product: the full space is
    2^K x 3 x 2, which on real client data (K can be 10+) is thousands of MCMC fits.
    Each move changes exactly one thing, so when a move wins you know what caused it.
    """
    out: List[ModelSpec] = []

    # drop a control / add one back
    for c in all_controls:
        if c in spec.controls:
            out.append(replace(spec, controls=tuple(x for x in spec.controls if x != c)))
        else:
            kept = tuple(x for x in all_controls if x in spec.controls or x == c)
            out.append(replace(spec, controls=kept))

    # fewer / more seasonal harmonics
    if spec.seasonality_harmonics > 0:
        out.append(replace(spec, seasonality_harmonics=spec.seasonality_harmonics - 1))
    if spec.seasonality_harmonics < MAX_HARMONICS:
        out.append(replace(spec, seasonality_harmonics=spec.seasonality_harmonics + 1))

    # trend on/off
    out.append(replace(spec, trend=not spec.trend))

    # de-duplicate while keeping order stable, and never propose the incumbent
    seen = {spec}
    unique: List[ModelSpec] = []
    for s in out:
        if s not in seen:
            seen.add(s)
            unique.append(s)
    return unique


def apply_to_bundle(bundle: dict, spec: ModelSpec) -> dict:
    """
    Return a shallow copy of `bundle` restricted to the spec's controls, with the spec
    attached for `build_pymc_model` to read.

    Control selection needs no model change at all — `beta_control` is sized by the
    control dimension, so slicing the tensor is enough.
    """
    import numpy as np

    all_controls = list(bundle["coords"].get("control", []))
    keep = [i for i, c in enumerate(all_controls) if c in spec.controls]

    out = dict(bundle)
    out["spec"] = spec

    if all_controls and len(keep) != len(all_controls):
        X = bundle["X_control"]
        out["X_control"] = (
            X[:, :, :, keep] if keep else np.zeros(X.shape[:3] + (0,), dtype=X.dtype)
        )
        out["coords"] = dict(bundle["coords"])
        out["coords"]["control"] = [all_controls[i] for i in keep]
        out["shapes"] = dict(bundle["shapes"])
        out["shapes"]["K"] = len(keep)

    return out
