"""
Budget scenario engine.

Answers the question a commercial team actually asks — "what happens if we
cut 20%?" — by optimising the same response curves at several budget levels
and reporting each against today's plan.

Scenarios (from the Budget Optimizer design doc):

    current      spend exactly as it is today, not optimised
    optimal      the same total budget, allocated optimally
    budget_-20   optimal allocation of 80% of today's budget
    budget_-10   90%
    budget_+10   110%
    budget_+20   120%

`current` is the reference row: it is the only scenario that is *not*
optimised, and every `sales_lift` is measured against it. That matters — the
gap between `current` and `optimal` is the value of reallocating alone, before
a single extra pound is spent, and it is usually the most persuasive number in
the set.

Everything here is pure: curves in, scenarios out. No DB, no I/O.
"""
from typing import Dict, Iterable, List, Mapping, Optional, Sequence

from . import budget_allocator as alloc

# factor -> scenario name.  1.0 is the optimised same-budget case.
DEFAULT_FACTORS: Sequence[float] = (0.8, 0.9, 1.0, 1.1, 1.2)


def scenario_name(factor: float) -> str:
    """budget_-20 / budget_-10 / optimal / budget_+10 / budget_+20."""
    if abs(factor - 1.0) < 1e-9:
        return "optimal"
    pct = round((factor - 1.0) * 100)
    return f"budget_{pct:+d}"


def _evaluate_fixed(
    curves: Mapping[str, alloc.Curve],
    spend_by_media: Mapping[str, float],
) -> Dict[str, float]:
    """
    Incremental revenue for a *given* allocation, read off each curve.

    Used for the `current` row, which is not optimised — we evaluate today's
    actual spend rather than asking the allocator for anything.
    """
    out: Dict[str, float] = {}
    for media, curve in curves.items():
        spend = float(spend_by_media.get(media, 0.0))
        if not curve:
            continue
        _, incremental = alloc._interpolate(list(curve), spend)
        out[media] = incremental
    return out


def build_scenarios(
    curves: Mapping[str, alloc.Curve],
    current_spend: Mapping[str, float],
    baseline_revenue: float,
    *,
    factors: Sequence[float] = DEFAULT_FACTORS,
    constraints: Optional[Mapping] = None,
    stability: Optional[Mapping[str, str]] = None,
) -> dict:
    """
    Build the scenario set.

    Returns
    -------
    {
      "summary": [ {scenario, total_budget, predicted_sales, sales_lift,
                    sales_lift_pct, binding_limit}, ... ],
      "allocations": [ {scenario, media, spend, incremental_revenue}, ... ],
      "current_total_budget": float,
      "baseline_revenue": float,
    }

    `summary` mirrors budget_summary.csv and `allocations` mirrors
    budget_scenarios.csv from the design doc.
    """
    if not curves:
        return {
            "summary": [],
            "allocations": [],
            "current_total_budget": 0.0,
            "baseline_revenue": float(baseline_revenue or 0.0),
        }

    baseline_revenue = float(baseline_revenue or 0.0)
    current_total = float(sum(current_spend.values())) if current_spend else 0.0

    summary: List[dict] = []
    allocations: List[dict] = []

    # --- current: today's plan, evaluated not optimised -------------------
    current_incremental = _evaluate_fixed(curves, current_spend or {})
    current_sales = baseline_revenue + sum(current_incremental.values())

    summary.append({
        "scenario": "current",
        "total_budget": current_total,
        "predicted_sales": current_sales,
        "sales_lift": 0.0,          # the reference point, by definition
        "sales_lift_pct": 0.0,
        "binding_limit": None,
    })
    for media, incremental in current_incremental.items():
        allocations.append({
            "scenario": "current",
            "media": media,
            "spend": float((current_spend or {}).get(media, 0.0)),
            "incremental_revenue": incremental,
        })

    # --- optimised scenarios ---------------------------------------------
    for factor in factors:
        budget = current_total * float(factor)
        result = alloc.allocate(
            curves,
            total_budget=budget,
            constraints=constraints,
            stability=stability,
            current_spend=current_spend,
        )
        sales = baseline_revenue + result["total_incremental_revenue"]
        lift = sales - current_sales
        name = scenario_name(factor)

        summary.append({
            "scenario": name,
            "total_budget": result["total_spend"],
            "predicted_sales": sales,
            "sales_lift": lift,
            "sales_lift_pct": (lift / current_sales * 100.0) if current_sales else 0.0,
            "binding_limit": result["binding_limit"],
        })
        for media, spend in result["allocation"].items():
            allocations.append({
                "scenario": name,
                "media": media,
                "spend": spend,
                "incremental_revenue": result["incremental_revenue"].get(media),
            })

    return {
        "summary": summary,
        "allocations": allocations,
        "current_total_budget": current_total,
        "baseline_revenue": baseline_revenue,
    }


def reallocation_gain(scenarios: dict) -> Optional[dict]:
    """
    The `optimal` vs `current` comparison — same money, better split.

    Separated out because it is the headline number: it needs no extra budget
    approval, so it is the one a commercial lead can act on alone.
    """
    rows = {r["scenario"]: r for r in scenarios.get("summary", [])}
    cur, opt = rows.get("current"), rows.get("optimal")
    if not cur or not opt:
        return None
    return {
        "same_budget": cur["total_budget"],
        "current_sales": cur["predicted_sales"],
        "optimal_sales": opt["predicted_sales"],
        "gain": opt["sales_lift"],
        "gain_pct": opt["sales_lift_pct"],
    }
