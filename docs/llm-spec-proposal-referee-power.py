"""
Referee resolution for the specification search — the numbers in
docs/llm-spec-proposal-evaluation.md.

Run from the repo root:
    .venv/bin/python -I docs/llm-spec-proposal-referee-power.py

The question is not "which specification wins" but "can the referee tell them apart".
`skill_vs_naive` on the dovato demo is computed from n_holdout x G x SB = 6 x 1 x 1 = 6
numbers. This estimates the sampling noise of that statistic, and the selection bias in
reporting the best of K candidates scored on the same 6 numbers.

Model: conditional on the realised holdout actuals, specification j's prediction errors are
    e_j = (sqrt(rho) * u + sqrt(1 - rho) * v_j) * s
with u common to all specifications (they share the data, the structure and most of the
model), v_j idiosyncratic, and s set so the default specification's TRUE skill is the
+0.0621 reported in CLAUDE.md. All K candidates are given identical true skill, so every
gain the simulation reports is pure selection on noise.

Caveat: errors are taken as iid across the 6 periods. Real residuals are serially
correlated (trend + adstock), which lowers the effective sample size and makes the true
noise LARGER than reported here, not smaller. These are optimistic figures.
"""

import csv
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, os.pardir, "mmm_claire", "data", "data.csv")

N_HOLDOUT = 6          # MMM_HOLDOUT_PERIODS used on the dovato run
SKILL_TRUE = 0.0621    # CLAUDE.md, default spec
MIN_IMPROVEMENT = 0.01  # search_specification default
OBSERVED_GAIN = 0.2294 - 0.0621


def holdout_actuals(path=DATA, n_holdout=N_HOLDOUT):
    """The KPI's train/holdout split, as split_bundle() would take it (chronological)."""
    with open(path) as fh:
        rows = [r for r in csv.DictReader(fh) if r["variable"] == "volume"]
    rows.sort(key=lambda r: r["date"])
    y = np.array([float(r["value"]) for r in rows])
    return y[:-n_holdout], y[-n_holdout:]


def main(n_reps=100_000, seed=1):
    y_train, y_test = holdout_actuals()
    naive = np.sqrt(np.mean((y_test - y_train.mean()) ** 2))
    s = (1.0 - SKILL_TRUE) * naive

    print(f"T = {len(y_train) + len(y_test)}, holdout = {len(y_test)} observations (G=SB=1)")
    print(f"naive RMSE (predicting the training mean) = {naive:,.0f}")
    print(f"implied model error sd at true skill +{SKILL_TRUE} = {s:,.0f}\n")

    rng = np.random.default_rng(seed)
    k_max = 40

    header = f"{'rho':>5} {'sd(skill)':>10} {'sd(gain)':>9}"
    header += "".join(f"{f'E[max gain] K={k}':>19}" for k in (8, 20, 40))
    print(header)

    for rho in (0.50, 0.80, 0.90, 0.95, 0.99):
        u = rng.normal(0, 1, size=(n_reps, 1, N_HOLDOUT))
        v = rng.normal(0, 1, size=(n_reps, k_max + 1, N_HOLDOUT))
        err = (np.sqrt(rho) * u + np.sqrt(1 - rho) * v) * s

        skill = 1.0 - np.sqrt((err ** 2).mean(axis=2)) / naive   # (reps, K+1)
        gain = skill[:, 1:] - skill[:, :1]                        # vs the incumbent

        row = f"{rho:>5.2f} {skill[:, 0].std():>10.3f} {gain[:, 0].std():>9.3f}"
        row += "".join(f"{gain[:, :k].max(axis=1).mean():>+19.3f}" for k in (8, 20, 40))
        print(row)

    sd = skill[:, 0].std()
    print(f"\nmin_improvement = {MIN_IMPROVEMENT} = {MIN_IMPROVEMENT / sd:.2f} sd of the estimator")
    print(f"observed gain on dovato = {OBSERVED_GAIN:+.4f} — compare the E[max gain] columns")

    print("\nHoldout observations needed for a target resolution, sd ~ (1-skill)/sqrt(2N):")
    for target in (0.20, 0.10, 0.05, 0.02):
        print(f"  sd {target:.2f}  ->  N ~ {(1 - SKILL_TRUE) ** 2 / (2 * target ** 2):.0f}")


if __name__ == "__main__":
    main()
