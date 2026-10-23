# Should an LLM propose model specifications?

**Scope:** evaluation of replacing `search/spec.py`'s hand-written neighbourhood with LLM-proposed
specifications, for `mmm_claire/` on main as of 2026-10-22.
**Deliverable:** recommendation + scoped plan. No implementation.

---

## Recommendation

**No — not as the driver of the specification search. Yes, in one narrow non-selecting role, and
only after the referee is fixed.**

The proposal assumes the bottleneck is the *proposer*: that better specifications exist and the
hand-written neighbourhood cannot reach them. On the data this platform actually has, the
bottleneck is the *referee*. `skill_vs_naive` scored on 6 trailing monthly periods at
G=SB=1 is 6 numbers. Its sampling standard deviation is roughly **0.26** — against a
`min_improvement` threshold of **0.01**, i.e. 0.04 of one standard deviation.

An LLM proposer's only mechanical effect on this system is to raise the number of candidates
scored on those same 6 numbers. Selection bias in the reported winner grows with the candidate
count. So the change makes the system's single weakest link weaker, in exchange for reaching
specifications the referee cannot evaluate anyway.

The honest reading of the existing result is uncomfortable and should be faced before any
expansion is designed:

| | skill_vs_naive | coverage_90 |
|---|---|---|
| default `controls=[comp1,ex_1,ex_2] harmonics=1 trend=on` | +0.0621 | 0.50 |
| winner `controls=[ex_1,ex_2] harmonics=2 trend=on` | +0.2294 | 0.83 |
| **observed gain** | **+0.1673** | |

Candidates share the same 6 holdout actuals, so their error vectors are correlated; the noise on a
*paired* comparison is smaller than on either score alone. Simulating that directly (fixed holdout
actuals from `data/data.csv`, errors scaled so the default's true skill is +0.0621, correlation ρ
between two specs' error vectors):

| ρ | sd(skill) | sd(paired gain) | E[max gain] K=8 | K=20 | K=40 |
|---|---|---|---|---|---|
| 0.50 | 0.263 | 0.326 | +0.317 | +0.408 | +0.464 |
| 0.80 | 0.263 | 0.227 | +0.227 | +0.295 | +0.340 |
| **0.90** | 0.264 | 0.166 | **+0.167** | +0.218 | +0.252 |
| 0.95 | 0.266 | 0.119 | +0.120 | +0.158 | +0.182 |
| 0.99 | 0.266 | 0.054 | +0.054 | +0.071 | +0.082 |

Reproduce with `.venv/bin/python -I docs/llm-spec-proposal-referee-power.py`. Every candidate in
that simulation is given *identical* true skill, so every gain in the table is pure selection on
noise. Errors are iid across the 6 periods; real residuals are serially correlated (trend plus
adstock), which lowers the effective sample size — so these figures understate the noise.

At ρ = 0.90, the expected maximum gain across 8 **statistically identical** candidates is +0.167 —
the observed gain, to three decimals. This does not prove the winner is spurious. It proves the
current evidence cannot tell the difference between "dropped a control that was hurting" and
"selected the luckiest of several coin flips".

The candidate count is in the right range for that comparison to bite. `neighbours()` yields 6
moves from the default, and the documented winner is **two** steps away (drop `comp1`, then add a
harmonic), so the search ran at least two rounds: ~10 candidates after round 2 and ~15–17 by round 3,
against the `max_fits=20` the pipeline sets. At ρ = 0.90 the expected maximum of 20 identical
candidates is +0.218, so the observed +0.167 sits at or slightly *below* what pure selection on
noise would be expected to produce. A stepwise search is not a flat maximum over exchangeable
candidates — each round re-maximises from the previous round's maximum, which if anything
accumulates bias faster than the flat case.

Coverage is the more informative of the two numbers, because it has a null: 0.9. Under correct
calibration, coverage on 6 points has sd ≈ 0.12, so 0.83 is consistent with honest uncertainty and
0.50 is about 3 sd low. The winner being better *calibrated* is weak but real corroboration. The
skill ratio has no null and is therefore the easier number to fool yourself with — and it is the one
the search optimises and the approval gate binds on.

Resolution does not improve with effort. Since sd(skill) ≈ (1 − skill)/√(2N):

| target sd on skill | holdout periods needed |
|---|---|
| 0.20 | ~11 |
| 0.10 | ~44 |
| 0.05 | ~177 |

At T = 33 and G = SB = 1 there is no configuration of this dataset that resolves a 0.05 difference.
**You cannot buy resolution with MCMC fits, and an LLM cannot propose your way out of it.**

### What to do instead

1. **Fix the referee** (no LLM): rolling-origin backtesting, paired scoring, and a holdout the
   search never selects on. Add a precheck that **refuses to search when the referee cannot see** —
   in the same spirit as `MMM_SPEC_SEARCH` refusing to run without `MMM_HOLDOUT_PERIODS`.
2. **Widen the neighbourhood by hand**, by three named moves, the most valuable of which is media
   grouping for the four small channels.
3. **Then** give an LLM one narrow role: a *pre-registered, one-shot, bounded* candidate slate with
   a written rationale per candidate, behind a strict information barrier — plus the audit narrative.
   The rationale, not the candidate, is the thing an LLM uniquely supplies and the thing a pharma
   client is actually asking for.

Do not make `ModelSpec` code-generating. Reasons under question 6 — that one is architecturally
load-bearing and the answer is clear.

---

## 1. What could an LLM propose that the fixed neighbourhood cannot?

Each candidate is scored on three independent costs, because they are genuinely independent in this
codebase: the PyTensor graph in `pymc_mmm.py`, the NumPy mirror in `holdout.py`, and the published
methodology (`mmm_claire/docs/Marketing Mix Modelling Auto-modeller Platform Detailed.pdf`
documents geometric adstock, the Hill function and Fourier seasonality as *the* method).

| Candidate | Graph change | Mirror change | Methodology doc | Resolvable at T=33? | Verdict |
|---|---|---|---|---|---|
| Channel pooling / grouping | tensor only | no | no | partly | **do by hand** |
| Pooling strength (`sigma_media`) | 1 line | no | no | partly | **do by hand** |
| Variable transformations (log/sqrt) | tensor only | no | restate | marginal | later, by hand |
| Priors from pharma domain knowledge | 1 line | no | restate | n/a — not a search target | **LLM, for human review** |
| Custom seasonality periods | yes | yes (period is hardcoded) | restate | no | no |
| Interaction terms | yes | yes | yes | no | no |
| Non-geometric adstock (delayed/Weibull) | yes | yes | yes | no | no |

**Channel pooling is the headline candidate and it is already half-built.** The funnel hierarchy
pools *prior means* by the `subtype` column of `info.csv`: `mass_email`, `email_1to1` and
`phone_call` all share `base_beta`, `webinar` and `non_clm_call` get `base_beta + delta_mid`,
`clm_call` gets the upper offset (`pymc_mmm.py:221-237`). So "pool the small channels" is not a new
structure — the two real levers are:

- **a composite regressor**: sum the four columns of `X_media` into one. Tensor-level, no graph
  change, no mirror change. But it changes what `roi.csv`, `media_contribution.csv` and
  `marginal_roi_curves.csv` report, and `budget_allocator.py` allocates per channel — a composite
  breaks per-channel allocation for those four. That trade-off is a *product* decision, not a
  search decision, and no LLM should make it inside a fit loop.
- **`sigma_media`**: today a constant keyed off `geometry_mode` (0.4 / 0.5 / 0.8), scaled per
  channel by `spend_strength = clip(√(spend/median_spend), 0.3, 2.0)`. On `mmm_claire/data/`, the
  four small channels are **3.9% of spend** (`mass_email` 1.81%, `webinar` 1.26%, `phone_call`
  0.71%, `email_1to1` 0.09%) and **14.7% of media contribution** in
  `outputs/media_contribution.csv` — so the spend-strength regulariser is already shrinking them
  hardest, and they are already punching well above their spend. (The brief's 9.2% matches neither
  measure on the committed sample data; worth reconciling which run it came from, though the weak-
  identification argument holds at any of the three figures.) Making the strength a spec field is a one-line
  graph change with no mirror cost.

Neither needs an LLM. Both are one afternoon of hand work each.

**Note on weak identification.** All media coefficients are forced positive:
`beta_media = beta_sign * softplus(beta_media_raw)` (`pymc_mmm.py:268-274`), with `beta_sign` taken
from `expected_sign` in `info.csv` — every media row is `positive`. So a credible interval can never
cross zero, and you cannot detect a null channel by looking at its interval. `email_1to1` runs
p05 137 → p95 726 and `webinar` 655 → 6039 in `outputs/coefficients.csv`: ranges of 5× and 9×,
pinned above zero by construction rather than by evidence. Anything proposing to "test whether a
channel matters" is defeated by the prior before the referee is reached.

**Priors are the one place an LLM has real comparative advantage**, and it has nothing to do with
search. At T=33 the model is prior-dominated; priors are a stated, documentable assumption; and
pharma channel semantics (what a CLM call is, why a webinar reaches fewer prescribers at higher
intensity) is exactly the knowledge the code currently encodes as three magic numbers. Two hard
constraints: CLAUDE.md states elasticity ranges are pharma-specific and must not change without
business justification — **an LLM's justification is not a business justification**, so this is a
recommendation for human review, never an automated write. And priors must be fixed *before* the
holdout is seen; a prior tuned against holdout skill is prior-hacking with extra steps.

**Custom seasonality periods are capped by two constants that must move together**:
`MAX_HARMONICS = 2` in `spec.py:92` and `MAX_SEASONAL_HARMONICS = 2` in `holdout.py:36`, with the
period itself hardcoded as 12.0/52.0 in both files. 33 monthly observations is 2.75 annual cycles;
the second harmonic is already at the edge of what that supports.

---

## 2. Validating a proposal before it costs an MCMC fit

This is the easy question, it is worth building regardless of the LLM decision, and the cheap check
is microseconds against 30–60 s per fit. A `validate_spec()` returning a list of refusal reasons:

- **Schema** — `controls ⊆ all_controls`, no duplicates, `0 ≤ harmonics ≤ MAX_HARMONICS`, `trend`
  is a bool. Catches every "doesn't compile" case for a declarative spec, which is most of the
  reason not to let the LLM emit code.
- **Nyquist / cycle count** — a harmonic k needs at least two full cycles of its own period:
  refuse when `T / period < 2k`.
- **Degrees of freedom** — `n_params_hint` vs T. This property exists at `spec.py:54` and is
  **dead code in production**: it is referenced only by `tests/test_spec_search.py` since the
  tie-break it fed was removed. Revive it here.
- **Design-matrix conditioning** — condition number of `[1, t, Fourier(k), controls]`, pure NumPy.
  Catches a trend plus a near-collinear control, which no amount of MCMC will disentangle.
- **Already-tried** — `search_specification` already does this.

One rule: **the pre-flight check rejects, it never ranks.** A cheap in-sample score used to order
candidates reintroduces exactly the in-sample selection the whole design exists to avoid.

There is already a hard backstop for structural incoherence, and it is better than it looks.
`verify_forward_model` compares the NumPy forward pass against PyMC's own `mu`, and
`Evaluation.usable` requires `trustworthy`. Any structure the NumPy mirror does not implement
produces a `mu` mismatch, fails the check, and the candidate is **skipped rather than scored**
(`search.py:201`). So structurally novel LLM proposals are *already blocked by construction* — the
work was never the proposal, it is the mirror. That is the cost nobody counts when they say "the
LLM can propose interactions".

---

## 3. Keeping the search honest

Risks in order of severity. The first is already in the code and is not LLM-specific.

**(a) The holdout was both the selection criterion and the reported evidence — fixed 2026-10-22.**
`run_mmm_pipeline.py` reassigned `bundle` to the winning spec and then called
`run_holdout_validation(bundle, …)`, which split off the *same* trailing N periods and scored them.
So `holdout_metrics.skill_vs_naive` for a searched model was a **selected maximum**, not an
independent estimate — and `approve_mmm_model` blocks on `skill_vs_naive ≤ 0` reading that number.
The gate was shown the best of K draws and treated it as one draw. At the ~15–20 candidates the
pipeline fits, the simulation above puts that inflation at +0.22 to +0.41 depending on ρ.

Now two windows: the search is handed a series stopping short of the reported periods and selects
on its own earlier window (`MMM_SEARCH_HOLDOUT_PERIODS`, default the same size), and
`plan_search_split` refuses the search outright when the series cannot carry both rather than
sharing one. `holdout_metrics.selection_independent` records the verdict and
`mmm_model_gate_status` checks it before reading the score. Note what this does *not* buy: the
reported number is now independent of the selection, but it is still a 6-point estimate with
sd ≈ 0.26 — and the search now selects having trained on 21 periods instead of 27, so the
selection itself got noisier. Honest, not resolved; the rest of Phase 0 is what resolves it.

**(b) `min_improvement` does not do the job it is credited with.** 0.01 is 0.04 sd of the
estimator. It does what its docstring claims — stops the search random-walking across ties — and
nothing more. It is not a significance filter. If candidate count K grows, the quantity that must
grow with it is the threshold or the number of evaluation points, never the proposal count alone.

**(c) The one genuinely new LLM risk: an information channel outside the referee's accounting.**
An LLM that sees `fit_metrics`, `coefficients`, or round-by-round holdout scores becomes a
selection mechanism with no K to account for. The current loop cannot cheat because it is a dumb
function of out-of-sample scores; an LLM reading results and proposing again is a search with an
unbounded neighbourhood, an unrecorded candidate count, and an unauditable selection rule. That is
strictly worse than what exists. If an LLM is used at all, the barrier is non-negotiable:

| Proposer may see | Proposer must never see |
|---|---|
| `info.csv` — variables, type, subtype, expected_sign | any `fit_metrics` / in-sample r², RMSE, MAPE |
| channel semantics, business context, brand/market notes | any holdout or `spec_search` score, from any run |
| T, frequency, cycles available, spend shares, missingness | the holdout periods' actual KPI values |
| the available spec fields and their bounds | the incumbent's score |

One shot. No feedback loop. No "propose again given these results".

**(d) `n_holdout` must stay operator-controlled.** It is, via `MMM_HOLDOUT_PERIODS`, and an LLM
must never acquire the ability to set it or to choose the split point — re-picking the holdout is
the cheapest possible cheat and the one a proposer-plus-interpreter would find first.

**(e) Prefer the metric with a null.** `coverage_90` is a binomial against a known target of 0.9
and is therefore testable; `skill_vs_naive` is a ratio with no null. Use coverage as a gate (it
already is, in effect, via the overconfidence warning) and resist the urge to optimise it, which
would burn the only honest number available.

---

## 4. Cost and budget discipline

Current cost, as the pipeline actually runs it (note `MMM_SEARCH_MAX_FITS` defaults to **20** at
`run_mmm_pipeline.py:231`; the 40 in CLAUDE.md is `search_specification`'s own signature default,
which the pipeline overrides): up to 20 search fits at `MMM_SEARCH_DRAWS=400` / 2 chains, plus the
winner's full refit, plus the holdout model's own fit. Roughly 12–20 minutes on the 33-month demo.
Cost scales as T × regions × sub_brands × media, so a real client dataset with several geographies
and sub-brands is hours, not minutes.

The budget discipline that actually works is **not** a per-candidate cap:

- **Fix K before the run and record it.** A per-fit budget caps spend while letting selection bias
  grow right up to the cap — it limits the invoice, not the error. A pre-registered slate of K ≤ 8
  bounds both.
- **Spend the compute on evaluation points, not candidates.** Rolling-origin backtesting over 10–12
  origins costs ~10× the fits per candidate and buys real resolution; 10× the candidates on one
  6-point holdout buys inflated winners. Given a fixed compute budget this is the correct trade and
  it is the opposite of what an LLM proposer encourages.
- **Refuse to search when the referee cannot see.** Compute the expected sd of the referee
  *before* any fitting — it is a closed form in the number of holdout observations
  (`n_holdout × G × SB`) — and refuse when it exceeds the improvement size you would act on. This
  is the mechanism that makes the whole feature safe on small datasets and lets it run freely on
  large ones, and it is cheap.

The statistical budget, not the compute budget, is the binding constraint. An LLM proposer spends
the compute budget to exhaust the statistical one faster.

---

## 5. Reproducibility and audit

The existing trail is the strongest part of the feature: `spec_search.history` records every
candidate with its score, `_meta.model_spec` records the winner, and
`Model Governance & Validation Framework.pdf` §16 requires input files, configuration, diagnostics
and outputs per run. "An LLM suggested it" fails §2 (Transparency: *all modelling assumptions and
transformations are documented*) and §11 (Versioning: `configuration` = modelling parameters).

What a pharma client is owed is not the winner but the *protocol*. Today the history records **what
was tried and what it scored, never why it was tried** — that is the real gap, and it is the gap an
LLM can legitimately fill. The defensible answer is: *"these six specifications were registered in
advance, for these stated reasons; all six were fitted; here are all six scores; the chosen one
leads by +X, which is within/beyond the Y we can resolve on this data."* That last clause is the
one that survives a regulator, and it requires reporting the selection-aware interval rather than
the selected maximum.

To get there, `spec_search` needs four fields it does not have: **K** (candidates registered),
**the pre-registered slate** (so the protocol is checkable after the fact), **`min_improvement` and
the holdout definition**, and **the selection-aware estimate** alongside the raw winner score.
Plus, per candidate, a `rationale` string.

Two hard requirements if an LLM is in the loop at all:

1. **The proposal is persisted as data and the run must be replayable from it with no LLM call.**
   An LLM in the live path makes every run non-reproducible, which breaks §2 Reproducibility
   outright. The slate is cached, versioned, and re-runnable; the model that produced it, the prompt
   and the sampling settings are recorded as provenance.
2. **Approval stays human.** `approve_mmm_model` already requires a signed-in admin and gives a
   service-role token 403 so automation cannot self-approve. Governance §9 Step 4 requires business
   validation with domain experts. An LLM-proposed spec must land in front of that person with its
   rationale, not behind the gate.

---

## 6. Does `ModelSpec` need to become richer — or code-generating?

**Richer: yes, modestly. Code-generating: no.** This is the question the proposal turns on, and
four independent properties of this codebase point the same way.

1. **Two forward models must agree, and the check only works because they are independent.**
   `verify_forward_model` is trustworthy precisely because `pymc_mmm.py` (PyTensor) and
   `holdout.py` (NumPy) were written separately and agree to ~1e-16. If an LLM generates both from
   one description, a shared misreading produces two agreeing wrong implementations and the check
   degrades from a semantic check to a self-consistency check. The project's most valuable
   safeguard would quietly stop guarding.
2. **Every spec dimension is paid for twice, and the price is visible in the code.**
   `MAX_HARMONICS` / `MAX_SEASONAL_HARMONICS` are two constants in two files that must move
   together; `forward_mu` reads named posterior variables (`theta_media`, `gamma_media`,
   `beta_media`, `beta_trend`, `seasonality_sin{k}`, `beta_control`) and `_seasonality` already
   carries a comment explaining that the monthly default and the searched path name things two
   different ways. Each new field adds a PyTensor branch, a NumPy mirror, a `validate_spec` rule,
   and a bit-identity test. That is the per-field price, and it is why fields should be added only
   when a *named hypothesis* needs one.
3. **Governance ties reproducibility to code version.** §11 records `model_version` = code version
   and `configuration` = modelling parameters. A declarative spec is configuration: versioned,
   diffable, re-runnable, documentable against the methodology whitepaper. Generated code is a new
   model per run with no methodology document and nothing to diff — unauditable by construction, in
   a regulated setting, for a client who will ask.
4. **The bit-identical default is already a brake.** PyMC consumes draws in declaration order, so
   `build_pymc_model` keeps the original trend and seasonality blocks verbatim and routes only
   genuinely different specs to the generalised path (`pymc_mmm.py:121-192`). Every new dimension
   doubles the branching in that function. A code generator makes the invariant unmaintainable —
   and that invariant is what currently guarantees the pinned demo model
   (`83e46e03-051f-4bb7-9854-6a0385439ee0`) does not drift.

The shape to grow toward — declarative, enumerable, bounded, validated:

```python
@dataclass(frozen=True)
class ModelSpec:
    controls: Tuple[str, ...]
    seasonality_harmonics: int
    trend: bool
    # candidates, each earning its mirror + bit-identity test:
    media_groups: Optional[Tuple[Tuple[str, ...], ...]] = None  # composite regressors
    sigma_media_scale: float = 1.0                              # pooling strength
```

Both new fields are mirror-free (`media_groups` acts on the tensor before the graph;
`sigma_media_scale` multiplies a prior sd that `forward_mu` never reads) — which is exactly why
they are the two to add first, and a useful selection rule for anything after them.

---

## Plan

Phase 0 is worth doing whether or not an LLM is ever involved; it is also the thing that tells you
whether Phase 2 is answerable. **Do not start Phase 2 before Phase 0 reports.**

### Phase 0 — fix the referee (no LLM)

1. ~~**Rolling-origin backtest.**~~ **Done 2026-10-22.** `src/validation/backtest.py`:
   expanding-window origins, every candidate scored on identical (origin, period, geo, sub-brand)
   forecasts, paired gain with a 90% bootstrap interval resampled over **origins** rather than
   points. The search's referee is now pluggable (`MMM_BACKTEST_ORIGINS` selects
   `rolling_origin`), and a candidate wins only when its interval clears zero *and* the gain
   exceeds `min_improvement` — the threshold alone could never express the first condition.
   `backtest_metrics` reports the production spec the same way, over origins chosen so every
   forecast target sits inside the window withheld from the search. Still outstanding: running it
   on the real dovato data, which is the exit criterion below and needs ~180 MCMC fits.
2. ~~**Separate selection from evidence.**~~ **Done 2026-10-22.** The search gets its own holdout
   window before the reported one and never sees the reported periods;
   `holdout_metrics.selection_independent` carries the verdict and `mmm_model_gate_status` refuses
   a score that is not independent of selection. Still outstanding from this item: reporting a
   **selection-aware estimate** of the winner's skill, which only becomes meaningful once step 1
   gives the paired comparison something to correct.
3. **Resolution precheck + refusal.** Compute the referee's expected sd from
   `n_holdout × G × SB` before fitting anything, record it in `spec_search`, and refuse to search
   when it exceeds the gain you would act on. The dovato demo shape should refuse; a real
   multi-geography client dataset should pass.
4. **`validate_spec()` pre-flight** per question 2, including reviving `n_params_hint`. Rejects
   only, never ranks.
5. **Widen the audit record**: K, pre-registered slate, `min_improvement`, holdout definition,
   selection-aware estimate, per-candidate `rationale`.

*Exit criterion:* re-run the dovato search under the paired referee. If no candidate's paired
interval clears zero — the likely outcome — that is the finding, and it is publishable internally:
on 33-month single-geography data no specification search, LLM-driven or not, produces evidence a
pharma client should be shown. Keep the curated default; report any search as exploratory.

### Phase 1 — widen the neighbourhood by hand (no LLM)

6. `media_groups` — composite regressor, with the ROI/contribution/optimizer consequences decided
   explicitly and written down.
7. `sigma_media_scale` — pooling strength as a spec field.
8. For each: NumPy mirror where needed, `validate_spec` rule, and a test asserting the default spec
   still produces byte-identical outputs.

### Phase 2 — the LLM, narrow (only if Phase 0 shows resolution)

9. **One-shot pre-registered proposer.** Input: `info.csv`, channel semantics, business context,
   dataset shape. Output: K ≤ 8 specs as validated `ModelSpec` JSON, each with a rationale.
   Information barrier per question 3(c). No iteration, no feedback.
10. **Persist the slate; replay without the LLM.** Cached, versioned, provenance recorded
    (model id, prompt, sampling settings).
11. **Evaluate once** on the Phase 0 referee. Accept only on a paired gain clearing the
    selection-aware threshold for the registered K.
12. **Audit narrative.** Generate the "why does the model have this form" write-up from the
    recorded history — all candidates, all scores, the resolution caveat — for the human approver
    required by Governance §9 Step 4.

### Not doing

- Code-generating `ModelSpec`, or any LLM-authored PyMC/PyTensor.
- An LLM that reads fit output, holdout scores, or the holdout actuals.
- An LLM that proposes iteratively against scores.
- An LLM touching `MMM_HOLDOUT_PERIODS`, the split point, or `approve_mmm_model`.
- Interactions, non-geometric adstock, or custom seasonality periods at T=33 — the referee cannot
  evaluate them and the methodology whitepaper would have to be rewritten to document them.

### Where the value actually lands

Phase 0 is worth more than the LLM ever will on this data, and it is also the prerequisite for
knowing whether the LLM is worth anything. The LLM's durable contribution is **the recorded reason**
— per-candidate rationale and the audit narrative — plus **prior recommendations for human review**,
which never enter a fit loop. That is a smaller feature than "an LLM designs the model", and it is
the part that holds up in front of a pharma client.
