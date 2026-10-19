import sys
sys.path.insert(0, "/Users/fayozrizvonov/clairefinal/synapse-data-scape/mmm_claire")

from src.optimizer import budget_allocator as ba
from src.optimizer import scenarios as sc

# Two channels. A saturates early (cheap wins), B keeps paying off.
rows = []
for m, pts in {
    "A": [(100, 0), (200, 600), (300, 700), (400, 720)],   # steep then flat
    "B": [(100, 0), (200, 200), (300, 500), (400, 900)],   # accelerating
}.items():
    for s, ir in pts:
        rows.append({"media": m, "spend": s, "roi": ir / s, "contribution": ir})

curves = ba.build_curves(rows)
current = {"A": 300.0, "B": 100.0}      # over-invested in A, starving B
BASE = 10_000.0

out = sc.build_scenarios(curves, current, BASE)

print("=== scenario names ===")
print("  ", [r["scenario"] for r in out["summary"]])
assert [r["scenario"] for r in out["summary"]] == [
    "current", "budget_-20", "budget_-10", "optimal", "budget_+10", "budget_+20"
], out["summary"]

print("\n=== summary ===")
for r in out["summary"]:
    print(f"  {r['scenario']:<12} budget={r['total_budget']:>8.0f}  "
          f"sales={r['predicted_sales']:>10.1f}  lift={r['sales_lift']:>+8.1f} "
          f"({r['sales_lift_pct']:>+5.1f}%)  {r['binding_limit']}")

cur = next(r for r in out["summary"] if r["scenario"] == "current")
opt = next(r for r in out["summary"] if r["scenario"] == "optimal")

# current is the reference
assert cur["sales_lift"] == 0.0
assert cur["total_budget"] == 400.0

# optimal spends the same money and must not do worse than current
assert abs(opt["total_budget"] - cur["total_budget"]) < 1e-6, (opt, cur)
assert opt["predicted_sales"] >= cur["predicted_sales"], "optimal worse than current!"
print(f"\n  ✓ optimal uses the same budget ({opt['total_budget']:.0f}) and is not worse")

# more budget never predicts less revenue
by = {r["scenario"]: r for r in out["summary"]}
order = ["budget_-20", "budget_-10", "optimal", "budget_+10", "budget_+20"]
sales = [by[s]["predicted_sales"] for s in order]
assert sales == sorted(sales), f"non-monotonic in budget: {list(zip(order, sales))}"
print("  ✓ predicted sales is monotonic in budget")

# allocations rows exist for every scenario
scen_in_alloc = {r["scenario"] for r in out["allocations"]}
assert scen_in_alloc == set(by) | {"current"}, scen_in_alloc
print(f"  ✓ allocation rows for all {len(scen_in_alloc)} scenarios "
      f"({len(out['allocations'])} rows)")

# the headline: same money, better split
gain = sc.reallocation_gain(out)
print(f"\n=== reallocation gain (same {gain['same_budget']:.0f} budget) ===")
print(f"  current {gain['current_sales']:.1f} -> optimal {gain['optimal_sales']:.1f}"
      f"  = {gain['gain']:+.1f} ({gain['gain_pct']:+.1f}%)")
assert gain["gain"] >= 0

# edge cases
assert sc.build_scenarios({}, {}, 0.0)["summary"] == []
print("\n  ✓ empty curves handled")
assert sc.scenario_name(0.8) == "budget_-20"
assert sc.scenario_name(1.0) == "optimal"
assert sc.scenario_name(1.2) == "budget_+20"
print("  ✓ scenario naming matches the spec")

print("\nALL ASSERTIONS PASSED")
