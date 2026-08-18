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


def _feasible_points(curve: Curve, bounds: Optional[Sequence[float]]) -> Curve:
    """Restrict a curve to a [min, max] spend window, never returning empty."""
    if not curve:
        return []
    if not bounds:
        return list(curve)

    lo, hi = float(bounds[0]), float(bounds[1])
    if lo > hi:
        lo, hi = hi, lo

    points = [p for p in curve if lo <= p[0] <= hi]
    if points:
        return points

    # The window falls between grid points (or outside the modelled range):
    # fall back to the single closest point so the channel stays representable.
    target = min(max(curve[0][0], lo), curve[-1][0])
    return [min(curve, key=lambda p: abs(p[0] - target))]


def allocate(
    curves: Mapping[str, Curve],
    total_budget: Optional[float] = None,
    constraints: Optional[Mapping[str, Sequence[float]]] = None,
    target_revenue: Optional[float] = None,
) -> dict:
    """
    Allocate budget across channels.

    total_budget    — TMB: maximise incremental revenue subject to this cap.
    target_revenue  — TSV: spend as little as possible to reach this much
                      incremental revenue.  Ignored when total_budget is set.
    constraints     — {media: [min_spend, max_spend]}, clamped to the modelled
                      spend range.

    Returns allocation, per-channel roi, incremental revenue, and the
    binding limit ("budget", "target", "curve_max" or "infeasible_minimum").
    """
    feasible: Dict[str, Curve] = {}
    for media, curve in (curves or {}).items():
        pts = _feasible_points(list(curve), (constraints or {}).get(media))
        if pts:
            feasible[media] = pts

    if not feasible:
        return {
            "allocation": {},
            "incremental_revenue": {},
            "roi": {},
            "total_spend": 0.0,
            "total_incremental_revenue": 0.0,
            "binding_limit": "no_curves",
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

            ratio = gain / cost
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
