"""
Parameter-recovery harness.

Generates data from known parameters, fits the production model to it, and asks a
question no amount of in-sample r2 can answer: does the posterior find the coefficients
that actually produced the data?

Run it:

    cd mmm_claire
    $CONDA_PREFIX/envs/mmm_cl/bin/python tests/recovery/run_recovery.py --media-scale raw
    $CONDA_PREFIX/envs/mmm_cl/bin/python tests/recovery/run_recovery.py --media-scale mean

`raw` reproduces the production preprocessing exactly. `mean` changes one thing — media
divided by its own mean — and nothing else. Comparing the two isolates the effect of
media scaling on identifiability from everything else in the model.

Deliberately calls `build_pymc_model` + `sample_model` directly rather than
`run_stable_model`. The stability controller escalates draws and then tightens priors
until its diagnostics pass; tightening priors during a recovery test would confound the
measurement, because a tighter prior improves R-hat while making the posterior *less*
informative about the truth. Level 0 is what production uses on a clean first attempt,
so that is what is measured here, with R-hat / ESS / divergences reported so we can also
see whether production would have escalated.

Three things decide the verdict, and they are reported separately because they fail
separately:

  coverage   share of parameters whose true value lands inside the posterior 90%
             interval. The nominal rate is 0.90, so a couple of misses across ~25
             parameters is expected; a collapse to near zero is not.
  bias       (posterior mean - truth) / posterior sd. Around +-1 is noise. A parameter
             sitting 5 sd from its true value with a *narrow* interval is the worst
             case: confidently wrong.
  sampling   max R-hat, min ESS, divergences. These say whether the sampler explored
             the posterior, which is a precondition for reading anything else.

A parameter can be unrecoverable for two very different reasons, and the `signal_kept`
column separates them: either the data carries no information about it (a regressor
flattened into a constant), or the sampler failed to find it. Only the second is a
sampling problem.
"""

from __future__ import annotations

import argparse
import json
import sys
import warnings
from pathlib import Path

# Run from the mmm_claire root (python tests/recovery/run_recovery.py), so put the
# package root on sys.path before importing src.*
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

import numpy as np  # noqa: E402

warnings.filterwarnings("ignore", category=FutureWarning)

from tests.recovery.synthetic import generate, fitted_truth  # noqa: E402


# ---------------------------------------------------------------------------
# posterior extraction
# ---------------------------------------------------------------------------

def _samples(post, name: str) -> np.ndarray:
    """
    Flatten chain+draw for one variable into ``(sample, ...)``.

    `theta_media` and `gamma_media` are declared as Deterministics without `dims`, so
    they carry generated dim names rather than the `media` coord even though their
    underlying raws are dimensioned. Indexing positionally (and relying on the model
    building them from `dims="media"` variables, which fixes the order) is therefore the
    only option that works for all of them.
    """
    da = post[name]
    stacked = da.stack(sample=("chain", "draw"))
    arr = stacked.values
    # stack() appends the new axis last; move it to the front.
    return np.moveaxis(arr, -1, 0)


def collect(post, media: list, controls: list) -> dict:
    """
    Map parameter label -> draws, aligned to the model's coord order.

    Takes the xarray group itself (``trace.posterior`` or ``idata.prior``) so the same
    extraction serves both, and the prior/posterior comparison cannot drift apart.
    """
    out = {}

    for name in ("intercept", "beta_trend", "seasonality_sin", "seasonality_cos", "sigma"):
        if name in post:
            out[name] = _samples(post, name).ravel()

    for name, labels in (
        ("beta_media", media),
        ("theta_media", media),
        ("gamma_media", media),
        ("beta_control", controls),
    ):
        if name not in post:
            continue
        arr = _samples(post, name)
        arr = arr.reshape(arr.shape[0], -1)
        if arr.shape[1] != len(labels):
            raise RuntimeError(
                f"{name} has {arr.shape[1]} columns but {len(labels)} coords "
                f"{labels} — alignment would be wrong, refusing to guess."
            )
        for i, lab in enumerate(labels):
            out[f"{name}[{lab}]"] = arr[:, i]

    return out


# ---------------------------------------------------------------------------
# reporting
# ---------------------------------------------------------------------------

GROUPS = (
    ("base + trend + seasonality", ("intercept", "beta_trend", "seasonality_", "sigma")),
    ("controls / event dummies",   ("beta_control[",)),
    ("media response (beta)",      ("beta_media[",)),
    ("carryover (theta)",          ("theta_media[",)),
    ("saturation (gamma)",         ("gamma_media[",)),
)


def _group_of(label: str) -> str:
    for name, prefixes in GROUPS:
        if any(label.startswith(p) for p in prefixes):
            return name
    return "other"


def report(draws: dict, prior: dict, truth: dict, meta: dict, diag: dict) -> dict:
    sig = meta["signal"]
    rows = []

    for label, s in draws.items():
        if label not in truth:
            continue
        mean, sd = float(s.mean()), float(s.std())
        lo, hi = (float(x) for x in np.percentile(s, [5, 95]))
        tv = truth[label]
        inside = bool(lo <= tv <= hi)
        z = (mean - tv) / sd if sd > 0 else float("nan")

        # Posterior contraction: how much narrower the posterior is than the prior.
        # Without this the report is actively misleading -- a parameter the data says
        # nothing about keeps its prior, and a prior wide enough to span the whole
        # admissible range CANNOT miss the truth. It scores as recovered while having
        # learned nothing. `gamma_media` does exactly that here.
        psd = float(prior[label].std()) if label in prior else float("nan")
        learned = (1.0 - sd / psd) if psd and np.isfinite(psd) and psd > 0 else float("nan")

        kept = ""
        if "[" in label and label.split("[")[0] in ("beta_media", "theta_media", "gamma_media"):
            ch = label.split("[")[1].rstrip("]")
            kept = f"{sig[ch]['signal_kept'] * 100:6.2f}%"

        rows.append({
            "group": _group_of(label), "param": label, "truth": tv,
            "mean": mean, "sd": sd, "lo": lo, "hi": hi, "prior_sd": psd,
            "learned": learned, "informative": bool(np.isfinite(learned) and learned >= 0.10),
            "inside": inside, "z": z, "kept": kept,
        })

    print()
    print("=" * 100)
    print(f"  PARAMETER RECOVERY  —  media_scale={meta['media_scale']}  "
          f"T={meta['periods']}  seed={meta['seed']}")
    print("=" * 100)
    print(f"  Achievable in-sample r2 given the noise we added : "
          f"{meta['variance_share']['r2_ceiling']:.3f}")
    print(f"  Worst pairwise corr among saturated regressors   : "
          f"{meta['max_abs_corr_saturated']:.3f}"
          f"   {'(design is fine)' if meta['max_abs_corr_saturated'] < 0.8 else '(COLLINEAR — design problem, not a model problem)'}")
    print()

    for gname, _ in GROUPS:
        grows = [r for r in rows if r["group"] == gname]
        if not grows:
            continue
        hits = sum(r["inside"] for r in grows)
        n_inf = sum(r["informative"] for r in grows)
        print(f"  {gname}   ({hits}/{len(grows)} true values inside the 90% interval; "
              f"{n_inf}/{len(grows)} informative)")
        print(f"    {'parameter':<26}{'truth':>9}{'post mean':>11}{'post sd':>9}"
              f"{'90% interval':>22}{'in':>5}{'bias(sd)':>10}{'learned':>9}{'signal':>9}")
        print("    " + "-" * 110)
        for r in sorted(grows, key=lambda r: r["param"]):
            learned = "  n/a" if not np.isfinite(r["learned"]) else f"{r['learned'] * 100:5.0f}%"
            flag = "" if r["informative"] else "  <- prior only"
            print(f"    {r['param']:<26}{r['truth']:>9.3f}{r['mean']:>11.3f}"
                  f"{r['sd']:>9.3f}   [{r['lo']:>7.3f},{r['hi']:>7.3f}]"
                  f"{'  ok' if r['inside'] else ' MISS':>5}{r['z']:>+10.1f}"
                  f"{learned:>9}{r['kept']:>9}{flag}")
        print()

    inside_all = [r["inside"] for r in rows]
    coverage = float(np.mean(inside_all)) if inside_all else float("nan")

    # Coverage restricted to parameters the data actually informed. This is the number
    # that means something: coverage over all parameters is inflated by any whose
    # posterior is still the prior, and a wide enough prior scores a free hit.
    inf_rows = [r for r in rows if r["informative"]]
    cov_inf = float(np.mean([r["inside"] for r in inf_rows])) if inf_rows else float("nan")
    prior_only = [r["param"] for r in rows if not r["informative"]]

    print("  sampling diagnostics")
    print(f"    max R-hat      {diag['max_rhat']:.4f}   "
          f"{'ok' if diag['max_rhat'] <= 1.01 else 'FAIL (chains disagree)'}")
    print(f"    min ESS bulk   {diag['min_ess']:.0f}")
    print(f"    divergences    {diag['divergences']}   "
          f"{'ok' if diag['divergences'] == 0 else 'FAIL'}")
    print(f"    in-sample r2   {diag['r2']:.3f}   (ceiling "
          f"{meta['variance_share']['r2_ceiling']:.3f})")
    print(f"    media share of fitted mu variance  {diag['media_var_share']:.4f}")
    print()

    if prior_only:
        print(f"  learned nothing from the data ({len(prior_only)}/{len(rows)}) — "
              "posterior sd within 10% of prior sd:")
        print(f"    {', '.join(prior_only)}")
        print()

    sampling_ok = diag["max_rhat"] <= 1.01 and diag["divergences"] == 0
    # The verdict binds on informative coverage, not raw coverage, and a run where
    # most parameters never left their prior is a failure however well the rest did.
    informative_share = len(inf_rows) / len(rows) if rows else 0.0
    verdict = (
        "PASS" if (sampling_ok and informative_share >= 0.60
                   and np.isfinite(cov_inf) and cov_inf >= 0.80)
        else "FAIL"
    )
    print("=" * 100)
    print(f"  VERDICT: {verdict}")
    print(f"    coverage, informed parameters only  {cov_inf:.2f}  of nominal 0.90   "
          f"({sum(r['inside'] for r in inf_rows)}/{len(inf_rows)})")
    print(f"    coverage, all parameters            {coverage:.2f}   "
          f"({sum(inside_all)}/{len(inside_all)})  <- inflated by prior-only parameters")
    print(f"    parameters informed by the data     {len(inf_rows)}/{len(rows)} "
          f"({informative_share:.0%})")
    print("=" * 100)
    print()

    return {
        "verdict": verdict,
        "coverage_informative": cov_inf,
        "coverage_all": coverage,
        "n_params": len(inside_all), "n_recovered": int(sum(inside_all)),
        "n_informative": len(inf_rows), "prior_only": prior_only,
        "diagnostics": diag,
        "rows": [{k: v for k, v in r.items() if k != "kept"} for r in rows],
    }


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--media-scale", choices=("raw", "mean"), default="raw")
    ap.add_argument("--periods", type=int, default=33,
                    help="33 matches the dovato demo dataset")
    ap.add_argument("--draws", type=int, default=1000)
    ap.add_argument("--tune", type=int, default=1000)
    ap.add_argument("--chains", type=int, default=4)
    ap.add_argument("--seed", type=int, default=20261104)
    ap.add_argument("--out", default=None,
                    help="directory for the generated dataset (default: a temp dir)")
    args = ap.parse_args()

    out_dir = Path(args.out) if args.out else (
        ROOT / "tests" / "recovery" / f"_run_{args.media_scale}_T{args.periods}"
    )

    meta = generate(out_dir, periods=args.periods,
                    media_scale=args.media_scale, seed=args.seed)

    # --- through the real pipeline front end ------------------------------
    import arviz as az
    from src.io.load_data import load_data
    from src.io.load_spend import load_spend
    from src.io.validate_schema import validate_schema
    from src.validation.validate_info import validate_info
    from src.validation.validate_data import validate_data
    from src.validation.cross_checks import validate_variation_levels
    from src.parser.build_tensors import build_tensors, build_spend_tensor
    from src.preprocessing.monthly_to_weekly import resolve_model_frequency
    from src.model.pymc_mmm import build_pymc_model
    from src.model.sample_model import sample_model

    data, info = load_data(out_dir / "data.csv", out_dir / "info.csv")
    validate_schema(data, info)
    validate_info(info)
    validate_data(data, info)
    validate_variation_levels(data, info)

    data, original_freq, model_freq = resolve_model_frequency(data)
    bundle = build_tensors(data, info)
    bundle["original_frequency"] = original_freq
    bundle["model_frequency"] = model_freq
    bundle = build_spend_tensor(load_spend(out_dir / "spend.csv"), bundle)

    print(f"\n[recovery] frequency original={original_freq} model={model_freq} "
          f"T={bundle['shapes']['T']} C={bundle['shapes']['C']}\n")

    model = build_pymc_model(bundle)

    # Prior draws first, from the same model object, so the contraction comparison is
    # against the prior this exact build uses -- the caps, the funnel and the
    # spend-share shift all move it, so a hand-derived prior would be the wrong
    # reference.
    import pymc as pm
    with model:
        prior_idata = pm.sample_prior_predictive(draws=4000, random_seed=args.seed)

    trace = sample_model(model, draws=args.draws, tune=args.tune,
                         chains=args.chains, random_seed=args.seed)

    # --- diagnostics ------------------------------------------------------
    media = list(bundle["coords"]["media"])
    controls = list(bundle["coords"]["control"])
    draws = collect(trace.posterior, media, controls)
    prior = collect(prior_idata.prior, media, controls)

    summary = az.summary(trace, var_names=["beta_media", "theta_media", "gamma_media",
                                           "beta_control", "intercept", "sigma"])
    divergences = int(trace.sample_stats["diverging"].values.sum())

    mu = _samples(trace.posterior, "mu").reshape(-1, bundle["shapes"]["T"])
    mu_hat = mu.mean(axis=0)
    y = bundle["Y_scaled"].ravel()
    ss_res = float(((y - mu_hat) ** 2).sum())
    ss_tot = float(((y - y.mean()) ** 2).sum())

    me = _samples(trace.posterior, "media_effect").reshape(-1, bundle["shapes"]["T"])
    me_hat = me.mean(axis=0)

    diag = {
        "max_rhat": float(summary["r_hat"].max()),
        "min_ess": float(summary["ess_bulk"].min()),
        "divergences": divergences,
        "r2": 1.0 - ss_res / ss_tot if ss_tot > 0 else float("nan"),
        # How much of the fitted signal media actually carries. Near zero means media
        # entered as a constant and was absorbed by the intercept, whatever its
        # coefficients say.
        "media_var_share": float(me_hat.var() / mu_hat.var()) if mu_hat.var() > 0 else 0.0,
    }

    result = report(draws, prior, fitted_truth(meta), meta, diag)
    (out_dir / "recovery_result.json").write_text(json.dumps(result, indent=2))
    print(f"[recovery] dataset + result written to {out_dir}\n")

    return 0 if result["verdict"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
