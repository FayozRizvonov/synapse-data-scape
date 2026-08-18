"""
Budget allocation over the PyMC5 marginal-ROI response curves.

The pipeline's `marginal_roi_curves` output holds, per media channel, a grid of
40 spend points spanning 0.2x-2.0x current spend.  For each point it records
`roi`, defined as

    roi(s) = incremental_revenue(s) / s

where `incremental_revenue(s)` is total modelled revenue with that channel
scaled to spend `s`, minus revenue at the current allocation.  So the absolute
objective is recovered exactly as `incremental_revenue(s) = roi(s) * s`.

Channel effects enter the model additively — `(X_sat * beta).sum(axis=3)` in
src/model/marginal_roi.py — so total revenue for an arbitrary allocation is

    baseline_revenue + sum_c incremental_revenue_c(s_c)

That separability is what makes this a tractable allocation problem rather than
a re-fit.  Adstock is within-channel, so it does not break it.

Allocation is greedy on the discrete grid: repeatedly take whichever channel's
next spend step buys the most incremental revenue per unit spent.  For a
separable concave objective this is optimal, and saturation curves are concave
by construction; steps that lose money are never taken.

Everything here is pure — no DB, no I/O — so it can be tested directly.
"""
from typing import Dict, Iterable, List, Mapping, Optional, Sequence, Tuple

# (spend, incremental_revenue) ascending by spend
Curve = List[Tuple[float, float]]

# Optimizer design doc: effective_mroi = mroi * stability_weight.  Channels
# whose ROI posterior is wide get discounted so the allocator does not chase
# returns the model is not confident in.
STABILITY_WEIGHTS = {"stable": 1.0, "moderate": 0.8, "unstable": 0.5}
DEFAULT_STABILITY_WEIGHT = 1.0


def build_stability(roi_rows: Iterable[Mapping]) -> Dict[str, str]:
    """Map media -> roi_stability flag from the `roi` output."""
    out: Dict[str, str] = {}
    for row in roi_rows or []:
        if not isinstance(row, Mapping):
            continue
        media, flag = row.get("media"), row.get("roi_stability")
        if media is not None and flag:
            out[str(media)] = str(flag).strip().lower()
    return out


def _stability_weight(media: str, stability: Optional[Mapping[str, str]]) -> float:
    """
    Weight for a channel's marginal ROI.

    An unknown or missing flag is not penalised — absent evidence should not
    quietly reshape an allocation — but an explicitly bad flag is.
    """
    if not stability:
        return DEFAULT_STABILITY_WEIGHT
    return STABILITY_WEIGHTS.get(
        str(stability.get(media, "")).strip().lower(), DEFAULT_STABILITY_WEIGHT
    )


def resolve_bounds(
    constraint,
    current_spend: Optional[float],
) -> Optional[Tuple[float, float]]:
    """
    Normalise a channel constraint to an absolute (min, max) spend window.

    Accepts the documented constraint vocabulary —

        min_ratio / max_ratio   relative to the channel's current spend
        fixed_spend             lock the channel at a value
        min_spend / max_spend   absolute bounds

    — as a mapping, and also the plain ``[min, max]`` pair.  Ratio rules are
    ignored when current spend is unknown, since they are meaningless without
    a reference point.
    """
    if constraint is None:
        return None

    # Plain [min, max]
    if isinstance(constraint, (list, tuple)):
        if len(constraint) != 2:
            return None
        try:
            return float(constraint[0]), float(constraint[1])
        except (TypeError, ValueError):
            return None

    if not isinstance(constraint, Mapping):
        return None

    def _num(key):
        try:
            value = constraint.get(key)
            return None if value is None else float(value)
        except (TypeError, ValueError):
            return None

    fixed = _num("fixed_spend")
    if fixed is not None:
        return fixed, fixed

    lo, hi = _num("min_spend"), _num("max_spend")

    if current_spend:
        min_ratio, max_ratio = _num("min_ratio"), _num("max_ratio")
        if min_ratio is not None:
            lo = max(lo, current_spend * min_ratio) if lo is not None else current_spend * min_ratio
        if max_ratio is not None:
            hi = min(hi, current_spend * max_ratio) if hi is not None else current_spend * max_ratio

    if lo is None and hi is None:
        return None
    return (lo if lo is not None else 0.0,
            hi if hi is not None else float("inf"))


def build_curves(rows: Iterable[Mapping]) -> Dict[str, Curve]:
    """
    Turn `marginal_roi_curves` rows into {media: [(spend, incremental_revenue)]}.

    Rows are the persisted records: {media, spend, contribution, roi}.
    """
    by_media: Dict[str, Curve] = {}

    for row in rows or []:
        if not isinstance(row, Mapping):
            continue
        media = row.get("media")
        if media is None:
            continue
        try:
            spend = float(row["spend"])
            roi = float(row["roi"])
        except (KeyError, TypeError, ValueError):
            continue
        # roi is defined against absolute spend, so this inverts exactly.
        by_media.setdefault(str(media), []).append((spend, roi * spend))

    for curve in by_media.values():
        curve.sort(key=lambda p: p[0])

    return by_media


def _interpolate(curve: Curve, spend: float) -> Tuple[float, float]:
    """
    Incremental revenue at an arbitrary spend, linearly between grid points.

    The response curve is continuous, so a requested spend that falls between
    grid points should be evaluated there rather than snapped to a neighbour —
    otherwise `fixed_spend` silently returns a different number than asked for.
    Outside the modelled range the nearest endpoint is used.
    """
    if spend <= curve[0][0]:
        return curve[0]
    if spend >= curve[-1][0]:
        return curve[-1]

    for (s0, r0), (s1, r1) in zip(curve, curve[1:]):
        if s0 <= spend <= s1:
            if s1 == s0:
                return (spend, r0)
            frac = (spend - s0) / (s1 - s0)
            return (spend, r0 + frac * (r1 - r0))
    return curve[-1]


def _feasible_points(curve: Curve, bounds: Optional[Sequence[float]]) -> Curve:
    """Restrict a curve to a [min, max] spend window, never returning empty."""
    if not curve:
        return []
    if not bounds:
        return list(curve)

    lo, hi = float(bounds[0]), float(bounds[1])
    if lo > hi:
        lo, hi = hi, lo

    # A locked channel (fixed_spend, or min==max) must land on exactly the
    # requested figure, so evaluate the curve there instead of snapping.
    if lo == hi:
        return [_interpolate(curve, lo)]

    points = [p for p in curve if lo <= p[0] <= hi]

    # Pin the window edges so a bound between grid points is still honoured
    # exactly rather than rounded inward.
    if lo > curve[0][0] and (not points or points[0][0] > lo):
        points.insert(0, _interpolate(curve, lo))
    if hi < curve[-1][0] and (not points or points[-1][0] < hi):
        points.append(_interpolate(curve, hi))

    return points or [_interpolate(curve, min(max(curve[0][0], lo), curve[-1][0]))]


def allocate(
    curves: Mapping[str, Curve],
    total_budget: Optional[float] = None,
    constraints: Optional[Mapping] = None,
    target_revenue: Optional[float] = None,
    stability: Optional[Mapping[str, str]] = None,
    current_spend: Optional[Mapping[str, float]] = None,
) -> dict:
    """
    Allocate budget across channels.

    total_budget    — TMB: maximise incremental revenue subject to this cap.
    target_revenue  — TSV: spend as little as possible to reach this much
                      incremental revenue.  Ignored when total_budget is set.
    constraints     — {media: {...}} using min_ratio / max_ratio /
                      fixed_spend / min_spend / max_spend, or {media: [lo, hi]}.
    stability       — {media: roi_stability}; discounts a channel's marginal
                      ROI when ranking (see STABILITY_WEIGHTS).
    current_spend   — {media: spend}; required to resolve ratio constraints.

    Returns allocation, per-channel roi, incremental revenue, and the
    binding limit ("budget", "target", "curve_max" or "infeasible_minimum").
    """
    feasible: Dict[str, Curve] = {}
    for media, curve in (curves or {}).items():
        bounds = resolve_bounds(
            (constraints or {}).get(media),
            (current_spend or {}).get(media),
        )
        pts = _feasible_points(list(curve), bounds)
        if pts:
            feasible[media] = pts

    weights = {m: _stability_weight(m, stability) for m in feasible}

    if not feasible:
        return {
            "allocation": {},
            "incremental_revenue": {},
            "roi": {},
            "total_spend": 0.0,
            "total_incremental_revenue": 0.0,
            "binding_limit": "no_curves",
            "stability_weights": {},
        }

    # Start every channel at its lowest feasible spend.
    idx: Dict[str, int] = {m: 0 for m in feasible}
    spend = sum(feasible[m][0][0] for m in feasible)
    revenue = sum(feasible[m][0][1] for m in feasible)

    binding = "curve_max"

    # The floor can already exceed the budget — the curves only go down to
    # 0.2x current spend, so a very small budget is simply not representable.
    if total_budget is not None and spend > total_budget:
        scale = total_budget / spend if spend else 0.0
        return {
            "allocation": {m: feasible[m][0][0] * scale for m in feasible},
            "incremental_revenue": {},
            "roi": {},
            "total_spend": float(total_budget),
            "total_incremental_revenue": 0.0,
            "binding_limit": "infeasible_minimum",
            "minimum_representable_spend": float(spend),
            "stability_weights": weights,
        }

    while True:
        best = None  # (gain_per_unit, media, cost, gain)

        for media, pts in feasible.items():
            i = idx[media]
            if i + 1 >= len(pts):
                continue

            cost = pts[i + 1][0] - pts[i][0]
            gain = pts[i + 1][1] - pts[i][1]
            if cost <= 0 or gain <= 0:
                continue  # never buy a step that loses money
            if total_budget is not None and spend + cost > total_budget:
                continue

            # Rank on risk-adjusted marginal ROI, but bank the true gain —
            # the weight expresses confidence, not a revenue forecast.
            ratio = (gain / cost) * weights[media]
            if best is None or ratio > best[0]:
                best = (ratio, media, cost, gain)

        if best is None:
            if total_budget is not None:
                # Something was affordable but not worth buying vs. simply
                # running out of room; distinguish for the caller.
                any_steps_left = any(idx[m] + 1 < len(feasible[m]) for m in feasible)
                binding = "budget" if any_steps_left else "curve_max"
            break

        _, media, cost, gain = best
        idx[media] += 1
        spend += cost
        revenue += gain

        if target_revenue is not None and total_budget is None and revenue >= target_revenue:
            binding = "target"
            break

    allocation = {m: feasible[m][idx[m]][0] for m in feasible}
    incremental = {m: feasible[m][idx[m]][1] for m in feasible}
    roi = {
        m: (incremental[m] / allocation[m]) if allocation[m] else 0.0
        for m in feasible
    }

    return {
        "allocation": allocation,
        "incremental_revenue": incremental,
        "roi": roi,
        "total_spend": float(spend),
        "total_incremental_revenue": float(revenue),
        "binding_limit": binding,
        "stability_weights": weights,
    }


def current_allocation(roi_key_points: Iterable[Mapping]) -> Dict[str, float]:
    """Spend per channel at the `current` point, for before/after comparison."""
    out: Dict[str, float] = {}
    for row in roi_key_points or []:
        if not isinstance(row, Mapping):
            continue
        if row.get("point_type") == "current" and row.get("media") is not None:
            try:
                out[str(row["media"])] = float(row["spend"])
            except (TypeError, ValueError):
                continue
    return out


def baseline_revenue(roi_key_points: Iterable[Mapping]) -> Optional[float]:
    """
    Total modelled revenue at the current allocation.

    Every channel's `current` row carries the same total, up to grid rounding,
    so the median is used rather than any single row.
    """
    values = []
    for row in roi_key_points or []:
        if not isinstance(row, Mapping):
            continue
        if row.get("point_type") == "current":
            try:
                values.append(float(row["revenue"]))
            except (KeyError, TypeError, ValueError):
                continue
    if not values:
        return None
    values.sort()
    return values[len(values) // 2]
