# Roadmap — the auto-modeler (CLAIRE's modeling engine)

> **Status:** Audit complete, nothing implemented. Owner: TBD. Last updated: 2026-11-04.
>
> Evidence base: the parameter-recovery study at `mmm_claire/tests/recovery/FINDINGS.md`
> (run 2026-11-04), plus a read-only audit of the engine and a comparison of the March 2025
> "Auto Modeler" proposal against the current code. Findings marked **✓ verified** below were
> independently confirmed against the repository; the rest come from the audit and carry its
> confidence, not more.

## The problem in one paragraph

The engine's **base** block works — trend, seasonality, σ and all three controls recover cleanly
(7/7 coverage), and event dummies declared `type=control` in `info.csv` recover correctly, so the
mechanism for modelling tenders, launches and stock-outs is built and validated. The engine's
**media** block is not estimated at all. 19 of 26 parameters never leave their prior: all 6
`beta_media`, all 6 `theta_media`, all 6 `gamma_media`, and the intercept. θ and γ posteriors equal
their priors to three decimal places. So media contributions, channel ROI, VRR and the response
curves are **prior artifacts** — they encode the declared funnel ordering and the spend split, which
makes them close to a restatement of `spend.csv` presented as a model result.

The failure is silent, and that is the point. An OLS on 33 months with 6 channels would have failed
too, but *visibly* — vast standard errors, insignificant t-stats, a condition number nobody could
miss. The Bayesian replacement returns the prior with a narrow, confident-looking credible interval
and the dashboard prints it as a finding. Max R-hat 1.0000, zero divergences, min ESS 1324: **every
gate in the system said yes.**

Judged against the standard that matters — *a model that fits well but cannot be defended to a brand
team is a failure* — the current state fails, and not for want of architecture. The funnel hierarchy,
the saturation form, the two-window search split, the gate that blocks on missing evidence and
refuses to self-approve, the eTag-fingerprinted retrain trigger: several of these are better than
what commercial MMM vendors ship.

## Verified findings

| finding | status |
|---|---|
| Client dashboard hardcodes a Durbin–Watson of `0.63`, in red, labelled "Autocorrelation", in the **mounted** component `src/components/FarmaMetricsWithAssistant.tsx:1002` (mounted at `src/pages/Index.tsx:296`). The engine never computes Durbin–Watson — zero matches across `mmm_claire/`. | **✓ verified** |
| `mmm_claire/src/model/priors.py` defines `FUNNEL_PRIORS` (per-funnel-stage β, θ and saturation priors — the right shape for a knowledge base) and has **zero importers**. `pymc_mmm.py:210-237` hardcodes its own priors inline instead. | **✓ verified** |
| `get_prior_config` returns four keys (`beta_scale`, `theta_cap`, `gamma_cap`, `fix_alpha`); only `gamma_cap` is ever read, and only at `pymc_mmm.py:103` in the `rich_data` branch (T ≥ 120, weekly). On monthly data — the demo's path and every pharma dataset at this sample size — **all four stability levels build bit-identical models.** | **✓ verified** |
| `outputs/roi_key_points.csv` (standalone run, 2026-10-22): `optimal_economic.spend` is exactly **0.2× current** — the grid floor — for 4 of 6 channels (clm_call, email_1to1, mass_email, non_clm_call); phone_call lands at 0.43×, webinar 0.48×. **Every ROI value in the file is negative**, and `revenue` is the identical total (~5.453e7) on every row, so the mROI curve is flat and the "optimal" point is just the first grid index. | **✓ verified** |
| `roi_key_points` / `marginal_roi` are **not read by the frontend**. `TailoredPresentation.tsx:8` generates its own curves ("Utility to generate smooth diminishing curves for demonstration"). So the "cut everything to 20%" output is engine-only and does **not** reach the client. Real defect; not urgent. | **✓ verified** |
| Raw unscaled `X_media` is fed into `X/(γ+X)` with γ ≤ 2.0 (`pymc_mmm.py:112`, `:329`), leaving **0.01–1.87%** of each channel's time variation. `build_tensors.py:173` computes an `X_media_scaled` that no model, curve, contribution, ROI or effectiveness module reads. | from `FINDINGS.md` |
| θ's prior mean **equals its own cap**. `pymc_mmm.py:283` uses `Beta(2,2)` (native monthly → `low_data`) and `:281` uses `Beta(3,3)` (`monthly_constrained`, the pinned demo's path); **both have mean exactly 0.5**, and `theta_cap = 0.5`. So half the prior mass is an atom on the ceiling and the region above is a zero-gradient plateau. `E[clip(Beta(2,2),0.01,0.5)] = 0.40625`, sd `0.127` — identical to the reported posterior. The "tighter for monthly" branch tightened nothing. | **✓ verified** (branches + cap) |
| In-sample `fit_metrics.r2` **exceeded the achievable ceiling** in both recovery modes (0.738 vs 0.670; 0.776 vs 0.712). The model overfits base/trend/seasonality while media contributes nothing, so **r² rises as media gets worse**. | from `FINDINGS.md` |
| `build_governance` (`run_mmm_pipeline.py:121-159`) binds on R-hat, ESS and divergences only. A model with 19 of 26 parameters prior-only passes it perfectly. | audit |
| Absent `(date, region, sub_brand, variable)` rows become a modelled `0.0` — tensors are `np.zeros` (`build_tensors.py:113-123`) and populated row-by-row (`:129-150`) with no imputation or completeness report anywhere in `mmm_claire/src/`. | audit |

## Who actually reads the model outputs

Established 2026-11-05 by tracing the consumer side; previously recorded as an open question.
**All of the following is verified**, against the code and the live database.

**Exactly one frontend file reads `mmm_model_outputs`:** `src/hooks/usePharmaMetrics.ts`, at `:80`
and `:227`. Both queries filter `.eq('output_type', 'outputs')` — a single row type — and read only
`output_data.model_metrics.{r_squared, mape, rmse}` plus a flat `roi` map.

That `'outputs'` row is not one of the pipeline's 12 types. `save_model_outputs`
(`mmm_claire/src/database/supabase_client.py:222-242`) writes it separately, and its own comment says
why: *"Legacy summary row consumed by the frontend usePharmaMetrics hook."*

**Consequence: `adstock_curves`, `saturation_curves`, `roi_key_points`, `coefficients`,
`media_contribution`, `marginal_roi_curves`, `channel_efficiency`, `predictions_timeseries`,
`base_contribution` and `reconciliation` are read by no frontend code at all.** They are written,
stored, and consumed by nothing — which is why T10 carries no demo risk, and why the
"cut every channel to 20% of spend" defect in `roi_key_points` never reached a client.

### And the dashboard is not reading the pinned model

`FarmaMetricsWithAssistant.tsx` — the mounted component (`src/pages/Index.tsx:296`) — passes
`fa95a40e-7574-47c1-9c46-85820edad19f` to both hooks (`:113`, `:129`). But the PyMC5 outputs live
under a **different project**:

| project | output types | rows each | newest |
|---|---|---|---|
| `550e8400-…-446655440000` (`DEMO_PROJECT_ID`) | all 13 PyMC5 types | 16 | **2026-10-19** |
| `11111111-2222-…-555555555555` | all 13 PyMC5 types | 1 | 2026-08-19 |
| `fa95a40e-…-85820edad19f` **(what the dashboard reads)** | `outputs`, `model_statistics` only | 3 / 1 | **2025-09-02** |

So the model-performance figures on screen come from a legacy summary row written **2025-09-02**,
fourteen months old and predating the PyMC5 engine. Its contents:

```
r_squared  0.9952623378613464      <- what the dashboard displays
mape       0.0404
roi        comp1, f2f_call, symposium_cost, rebate_spend, samples_cost,
           webinar_cost, digital_display, digital_video, ...
```

Three things follow, and each is worth more than the task it affects:

1. **The displayed r² is 0.995, not the 0.398 this repo documents for the pinned model.** Nothing on
   the dashboard is showing `83e46e03-…`'s fit.
2. **That `roi` map is incoherent as a channel list.** `comp1` is a *control* variable, and
   `*_cost` entries are spend columns, not channels — both are being presented as channels with an
   ROI. The channel names (`f2f_call`, `digital_display`, `rebate_spend`) are not the dovato
   dataset's either. **This is the likeliest source of the implausible symposium figure**
   (`symposium_cost`), rather than the spend-share prior — a conclusion the engine-side audit could
   not have reached.
3. **T5–T9 therefore move far less of the client-facing surface than their DEMO flags imply**, as
   long as the dashboard keeps reading `fa95a40e…`. That is not a reason to relax — it means the
   demo is disconnected from the engine, which is a worse problem than the flags described, and it
   makes T11 the first thing to settle rather than a formality.

Not yet determined: whether any other surface (the AI chat, voice, or `FarmaMetrics.tsx`, which does
pass `DEMO_PROJECT_ID` at `:87`) presents figures derived from the PyMC5 rows. The metric cards are a
separate path — they come from `get_pharma_sm_metrics_merged` via
`usePharmaSmDashboardMetrics`, not from `mmm_model_outputs`.

## Risk key

**DEMO** — moves stored `mmm_model_outputs` and so can shadow the pinned demo model
`83e46e03-051f-4bb7-9854-6a0385439ee0`. The dashboard reads the **newest** row by `generated_at`, so
a retrain shadows rather than replaces.

Two verification paths write **no** DB rows and are safe for everything below:
`mmm_claire/tests/recovery/run_recovery.py`, and standalone `python run_mmm_pipeline.py` (writes
`outputs/*.csv` only — the Celery worker does the persisting). `MMM_WATCH_PROJECTS` is empty by
default so the scheduler cannot fire on its own. `backups/demo-model-83e46e03.json` plus
`scripts/restore-demo-model.py --check/--restore` are in place.

**Never retrain against `DEMO_PROJECT_ID`.** Use a non-demo `brands.id` when a real DB run is needed.

## Tasks

| # | task | tier | risk | status |
|---|---|---|---|---|
| T1 | Remove the fabricated Durbin–Watson card | urgent | none | ☐ |
| T2 | Make the recovery harness able to judge the fix | 0 | none | ☐ |
| T3 | Contraction + boundary-mass diagnostics into the pipeline and gate | 0 | none* | ☐ |
| T4 | Wire or delete the dead `prior_config` channel | 0 | none | ☐ |
| T5 | Normalise media **and** weight-normalise the adstock | 1 | **DEMO** | ☐ |
| T6 | Replace clips on free parameters with bounded transforms | 1 | **DEMO** | ☐ |
| T7 | Cut media parameters from 19 to ~4 (channel grouping) | 1 | **DEMO** | ☐ |
| T8 | Fix the intercept / control location conflict | 1 | **DEMO** | ☐ |
| T9 | Remove the spend-share prior shift | 2 | **DEMO** | ☐ |
| T10 | Fix the three structurally wrong outputs | 2 | none† | ☐ |
| T11 | Decide explicitly what the demo shows | 2 | decision | ☐ |
| T12 | Build the knowledge layer | 3 | **DEMO** | ☐ |
| T13 | Give the spec search media dimensions to search over | 3 | none | ☐ |
| T14 | Delete dead code that looks like working code | 3 | none | ☐ |

\* T3 is risk-free only if the gate change is additive — see the task.

† T10 was flagged **DEMO** until 2026-11-05. It is not: nothing in the frontend reads the
outputs it changes — see *Who actually reads the model outputs*.

---

### T1 — Remove the fabricated Durbin–Watson card · urgent · no demo risk

**Change.** Delete the DW tile at `src/components/FarmaMetricsWithAssistant.tsx:998-1009` (the
hardcoded `0.63` literal and its tooltip). Do the same at
`FarmaMetricsWithAssistantconnected.tsx:1489-1500` if that file is kept, where the value comes from
`usePharmaMetrics.ts:248`'s hardcoded `durbinWatson: 0` and would render `0.00`.

**Why.** This is the only item on this list currently visible to the client. The number is a
literal; the engine computes no Durbin–Watson. It is shown in red and interpreted in the tooltip as
a problem the model has. One question from a client-side analyst ends the conversation. Either
compute the statistic or remove the claim; removing is hours, computing is T10-adjacent.

**Verify.** Card gone from the mounted dashboard; `grep -ri durbin src/` returns nothing.

**Sequencing.** Immediately, independent of everything else.

---

### T2 — Make the recovery harness able to judge the fix · tier 0 · no demo risk

**Change.** In `mmm_claire/tests/recovery/synthetic.py`, raise media's share of signal variance
(currently 0.0002 raw / 0.0291 mean — the harness's own first caveat) so β recovery is a fair test.
In `run_recovery.py:85-116`, add `base_beta`, `delta_mid`, `delta_upper`, `gamma_global` and
`tau_gamma` to `collect()`. Sweep `--periods` (the flag exists) to locate the T at which media
becomes identifiable.

**Why.** Every task below is gated on "the informed-parameter count rises". The instrument must be
able to detect that first. Today the five funnel/hierarchy parameters are never collected, so
**nobody knows whether the funnel hierarchy learns anything** — "19 of 26" says nothing about them.
The `--periods` sweep is also commercially material: it determines the minimum dataset CLAIRE can
accept, and that should be known before a client is told 33 months is enough.

**Verify.** `run_recovery.py --media-scale mean` shows `media_var_share ≳ 0.2` while θ/γ stay
prior-only (they are scale-free and must not move).

**Sequencing.** First. T5–T9 are unverifiable without it.

---

### T3 — Contraction and boundary-mass diagnostics into the pipeline and the gate · tier 0

**Change.** After `run_stable_model` (`run_mmm_pipeline.py:666`), draw from the prior using the same
model object — as `run_recovery.py:320-322` already does — and compute per-parameter
`1 − sd_post/sd_prior` plus the share of draws sitting at each clip boundary. Add both to
`build_governance` (`:121-159`) and to the `fit_metrics` payload. Extend `mmm_model_gate_status`
(`supabase/migrations/20261022120000_holdout_selection_independence.sql`) to read them.

**Why.** This is the governance answer and the cheapest high-value change on the list. A model with
19 of 26 parameters prior-only currently passes the gate with a perfect score. Prior sampling costs
seconds, not an MCMC fit. It converts the central finding from a line in a markdown file into a
number stored with every model.

**Risk.** Additive is free. Making it **retroactively binding would block all 142 legacy models**,
which may be the right answer but must be chosen rather than stumbled into. Gate on *presence* of
the field and bind only for new runs.

**Verify.** Field appears in `fit_metrics`; `GET /models/{id}/gate-status` reports it; the pipeline's
numbers match the harness's for the same trace.

**Sequencing.** Parallel with T2. Must precede T5–T9 so their effect is visible in production.

---

### T4 — Wire or delete the dead `prior_config` channel · tier 0 · no demo risk

**Change.** `stability_controller.py:19-56` returns `beta_scale`, `theta_cap`, `gamma_cap`,
`fix_alpha`. Make the caps read from `prior_config` across all geometry modes, not only
`rich_data` (`pymc_mmm.py:103`) — or delete the unused keys and say so.

**Why.** CLAUDE.md describes the controller as escalating "draws/levels until the model is stable".
Half of that is fiction on monthly data: all four levels build identical models, so `run_stable_model`
can pay up to 4 levels × 3 draw escalations = **12 MCMC fits of the same model** before raising
`RuntimeError`. It is also the mechanism one would reach for to stabilise a model, and it does
nothing. Collapsing `max_levels` to 1 would cut worst-case failure cost 4×. This is the natural seam
for KB-driven priors in T12.

**Verify.** Assert `build_pymc_model(bundle, get_prior_config(0))` and `...(3)` differ on a monthly
bundle. Confirm a clean first-attempt run is byte-identical before and after.

---

### T5 — Normalise media **and** weight-normalise the adstock · tier 1 · **DEMO**

**Change.**
- `build_tensors.py:170-173` — add `media_scale = clip(X_media.mean(axis=(0,1,2)), 1e-12, None)` and
  `X_media_norm = X_media / media_scale`. Delete or rename `X_media_scaled`.
- `pymc_mmm.py:112` — feed `X_media_norm`.
- `pymc_mmm.py:290-298` — change the scan step to `x_t*(1−θ) + θ*prev`.
- **Mirror in all six consumers or the numbers silently diverge:** `holdout.py:174` and `:183-196`
  (otherwise `trustworthy` goes false and the gate blocks), `contributions.py:11-53`,
  `marginal_roi.py:11` and `:42-60`, `roi_key_points.py:14`/`:39`.
- **`effectiveness.py:18` must keep raw exposure** in its denominator — effectiveness is per unit of
  actual activity. This asymmetry is the easiest thing here to get wrong.
- Fail loudly on a channel whose mean is 0; do not divide by `1e-12`.

**Why.** Mean-centring is *not* the fix: `X_media_scaled` goes negative for roughly half of every
channel's observations, and those map to `1e-6/(γ+1e-6) ≈ 3e-6` under the clip at `pymc_mmm.py:329` —
a step function with no true zero, which also breaks `marginal_roi.py:104`'s multiplicative scaling.
Michaelis–Menten needs a strictly positive per-channel scale and a true zero.

The weight-normalisation half is independent and **not optional**: `x_ad[t] = x[t] + θ·x_ad[t−1]`
scales the level by ~`1/(1−θ)`, so even after normalising the input, `mean(x_ad)` ranges 1.0–2.0
across the θ support and γ (capped at 2.0) absorbs it. With `(1−θ)x + θ·prev`, `mean(x_ad) ≈ 1` for
every θ, which **decouples θ from γ and β**. Then `γ ∈ [0.3, 2.0]` becomes the defensible statement
"half-saturation lies between 0.3× and 2× average monthly activity" — something a brand team can
agree or disagree with — and `write_saturation`'s `linspace(0,5,50)` grid
(`write_outputs.py:202`) becomes correct instead of being 3–4 orders of magnitude from the operating
point.

**Verify.** `run_recovery.py --media-scale raw` must reproduce today's `--media-scale mean` behaviour.
`verify_forward_model` must still match to ~1e-16. Then standalone `python run_mmm_pipeline.py` on
`mmm_claire/data` and diff `outputs/*.csv` against a pre-change baseline to see the blast radius
before any DB write.

**Sequencing.** After T2–T4. **Necessary and nowhere near sufficient** — recovery proved media
parameters stay prior-only after normalisation. Doing this alone and declaring victory is the main
trap in this plan.

---

### T6 — Bounded transforms instead of clips on free parameters · tier 1 · **DEMO**

**Change.** `pymc_mmm.py:279-287` — both θ branches (`Beta(3,3)` at `:281` for
`monthly_constrained`, `Beta(2,2)` at `:283` otherwise) plus the shared
`clip(theta_raw, 0.01, theta_cap)` at `:286`. Replace with a bounded transform:
`theta_u ~ Beta(a,a)` and `theta_media = 0.01 + (theta_cap − 0.01)·theta_u`.
`pymc_mmm.py:325-328` — replace `clip(softplus(·), 0.3, gamma_cap)` with a smooth monotone map such
as `0.3 + (gamma_cap − 0.3)·sigmoid(·)`; clip is flat outside the range, so `tau_gamma` and
`gamma_offset` are unidentifiable by construction. Give `theta_media` and `gamma_media` explicit
`dims="media"` (`run_recovery.py:68-82` documents having to index positionally for want of them).

**Why.** A clip destroys the gradient and makes the reported prior mean an artefact of where the cap
sits. γ's 90% interval spans `[0.31, 2.00]` — the entire admissible range — which is why it scored a
free 6/6 on coverage in the recovery run.

**Verify.** Boundary mass (from T3) drops from ~50% toward zero; θ/γ posterior sd stops equalling
prior sd. **Honest expectation: θ and γ may still be prior-only afterwards** — this fixes the
censoring, not the 31-on-33 problem. The value is that the reported number stops being a fabrication.

**Sequencing.** After T5 (γ is meaningless until media is on a scale where γ ≤ 2 can bite), before T7.

---

### T7 — Cut media parameters from 19 to ~4 · tier 1 · **DEMO**

**Change.**
- **γ:** delete `gamma_offset` and `tau_gamma` (`pymc_mmm.py:306-323`); keep the single
  `gamma_global`. 7 → 1.
- **θ:** fix per channel from the knowledge base (T12), or pool to one per subtype. 6 → 0–3.
- **β:** make the funnel hierarchy real — `beta_media = beta_subtype[subtype_idx]`, dropping the 6
  independent `beta_media_raw` draws. 6 → 3. Alternatively keep 6 with `sigma_media` reduced to
  ~0.2 so there is genuine shrinkage.
- **Channel grouping** at the data layer — see T12. This is the same work.

**Why.** This is the binding constraint. With T=33, G=SB=1, the base block already consumes 8
parameters, and the media regressors are smooth AR series (ρ≈0.45), so the effective independent
sample in the residual is roughly `T(1−ρ)/(1+ρ) ≈ 12`. **The honest media budget is 4–8 parameters,
not 19.** The design matrix is not at fault — worst pairwise correlation among saturated regressors
was 0.54.

The funnel hierarchy as built buys **nothing**: `pymc_mmm.py:210-237` maps 3 free parameters onto 3
subtype means (zero dimension reduction), and `sigma_media` is a fixed constant (`:243-248`) rather
than a learned scale, so there is no partial pooling and `beta_media_raw` is 6 independent draws. The
`HalfNormal` deltas order the *prior means* only. Hard pooling is also the more defensible option:
"all mid-funnel channels share one response per normalised contact" is an assumption a brand team can
argue with; "we estimated 18 media parameters from 33 months" is not.

**Verify.** `run_recovery.py` — the informed-parameter count must **rise** (it exits non-zero on FAIL
and reports that count, so it can gate `pymc_mmm.py` in CI). Compare hard-pooled β against shrunk-6-β
on the same seed and choose on measured bias, not taste. Expect visible bias on individual channels
under hard pooling — the harness will quantify how much, which is the point.

**Sequencing.** After T5 and T6. Most likely task to flip the verdict to PASS.

---

### T8 — Fix the intercept / control location conflict · tier 1 · **DEMO**

**Change.** Centre the continuous controls in `build_tensors.py` (store the mean for replay), leave
binary dummies alone, and widen `intercept` at `pymc_mmm.py:119` from `Normal(0, 1)` to
`Normal(0, 5)`. Mirror the centring in `holdout.py:210-213`.

**Why.** `comp1` arrives at mean ~53.5, injecting a near-constant ~2.7 in standardised-Y units;
saturated media injects ~2.0 more; the intercept is asked to be ≈ −4.7 under a `Normal(0,1)` prior
and cannot get there (recovery measured true −4.21, posterior +4.4 sd off, prior-only). The level
mismatch has to be absorbed somewhere, and the only candidates are `beta_control[comp1]`,
`beta_trend` and the seasonal terms — **which is the mechanism behind in-sample r² exceeding the
achievable ceiling.** Centring is a pure reparameterisation under an unconstrained intercept; it
changes the fit here only because the intercept *is* constrained, which is the bug.

**Verify.** `run_recovery.py` — the intercept moves from prior-only to informed and the +4.4 sd bias
collapses. Watch `beta_control[comp1]`: if its bias *improves*, that confirms it was absorbing level.

**Sequencing.** Independent of T5–T7; can land in the same batch.

---

### T9 — Remove the spend-share prior shift · tier 2 · **DEMO**

**Change.** Delete `economic_shift_media` (`pymc_mmm.py:84`, applied at `:263`) and `spend_strength`
from the sigma (`:254-264`). Keep the funnel ordering — that is genuine analyst-declared knowledge.
Replace with (a) priors from the KB in interpretable units (T12), and (b)
`economic_sanity_checks.py` promoted from an unread log to a reported, persisted flag.

**Why.** `economic_shift_media = economic_strength · log(spend_share + 1e-4)` sets the **mean of the
β prior** from the budget split alone. On the real data that is a prior spread of 3.83 in log space —
an implied prior mean for `beta_media` of 0.0156 (email_1to1) to 1.0617 (clm_call), a **68× ratio**,
fixed before the model sees one observation. The declared funnel's own spread is 0.80, so **the spend
split is 4.8× stronger than the domain knowledge it overrides.**

Four separate problems:
1. **Circular.** Asked "why does CLAIRE say 1:1 email does nothing?", the honest answer is "because
   we barely spend on it." That then flows into contributions, ROI and the optimizer.
2. **Economically backwards.** β is response per unit of activity. Low-spend channels are typically
   *earlier* on their curve with *higher* marginal response; the shift asserts the opposite,
   monotonically.
3. **Inverts the uncertainty.** `spend_strength = clip(sqrt(total/median), 0.3, 2.0)` gives the
   smallest channel prior sd 0.15 and the largest 1.00 — **the channels we know least about get the
   most dogmatic prior.** This is the "confidently wrong: narrow intervals, far from truth" result.
4. **Freezes the gradient.** At µ = −4.16, `sigmoid(−4.16) = 0.0153`, so the likelihood gradient
   w.r.t. `beta_media_raw` is attenuated ~**65×** through the softplus at `:268`. Even with signal
   restored, low-spend channels cannot move. Independent mechanism, not in `FINDINGS.md`.

Minor but real: `holdout.py:56` documents that `X_spend` is shared by reference on a split, so the
shift is computed from the full series **including the reported holdout window**.

This is the single most indefensible thing in the engine, and it is the direct explanation for the
implausible symposium figures: domain knowledge says a symposium matters more than its spend share,
the prior says the opposite, and there is no channel through which to say so. The pinned demo's path
is worse — `monthly_constrained` uses `economic_strength = 0.8`, giving email_1to1 a shift of ≈ −5.55.

The *intent* (stop tiny-spend channels showing explosive ROI) is legitimate; the mechanism puts it in
the wrong place. ROI = contribution/spend, so shrinking β suppresses the ROI **and** the contribution,
which is the number the brand team wants. Regularise ROI with a prior on ROI or contribution share,
or flag it post hoc — do not pre-ordain β.

**Verify.** `run_recovery.py` — email_1to1 (−4.5 sd) and mass_email (−4.7 sd) should collapse toward
zero bias. The cleanest single before/after in the plan.

**Risk.** Most moves channel-level ROI and contributions, and **may make small channels look
larger** — a conversation to have before it ships. Expect the ROI-explosion warnings in
`economic_sanity_checks.py` to start firing; that is the mechanism working rather than being
pre-empted.

**Sequencing.** **After T7.** Removing the shift while 19 unidentified media parameters remain leaves
nothing holding them down, and will sample worse, not better. Order matters here.

---

### T10 — Fix the three structurally wrong outputs · tier 2 · no demo risk

**Change.**
- `write_outputs.py:150-181` (`adstock_curves`) — θ^lag at θ≈0.40 for all six channels, so the
  output is **six identical decay curves** derived from the cap collision. After T6/T7 either show
  the real curve with its posterior interval, or, if θ is fixed from the KB, label it an assumption
  rather than a finding.
- `write_outputs.py:188-223` (`saturation_curves`) — the grid becomes correct after T5. Add a marker
  for the brand's actual operating point.
- `roi_key_points.py:61-77` — add an explicit guard: when the mROI curve is flat, report "cannot
  determine" rather than the first grid point. Also reconcile `current.roi` with `roi.csv`, which
  disagree today — two different ROIs for the same channel in two outputs.
- `run_mmm_pipeline.py:698` — `base = bundle["Y"] − total_media` makes reconciliation an identity, so
  `write_reconciliation` can never fail and reports nothing. Reconcile against the model's own `base`
  deterministic instead.
- Remove the duplicated `compute_marginal_roi_curves` call (`run_mmm_pipeline.py:708` and
  `roi_key_points.py:10` each run the full 6 × 40 grid through a Python-loop adstock).

**Why.** These are what the agent will reason over and what a client would eventually see. Note the
flat-mROI guard and the ROI inconsistency are **independent bugs that survive every model fix above**.

**Verify.** Standalone `python run_mmm_pipeline.py`; `optimal_economic.spend` must no longer sit on
the grid floor, and `current.roi` must equal `roi.csv`.

**Sequencing.** After T5. The flat-mROI guard is worth landing independently.

---

### T11 — Decide explicitly what the demo shows · tier 2 · decision

**Revised 2026-11-05.** This task was written on the assumption that engine fixes would move the
demo, so the choice was "keep the pinned model or re-pin". That premise was wrong, and the real
question is less comfortable.

The dashboard does not read the PyMC5 outputs at all. It reads a legacy summary row under project
`fa95a40e…`, last written **2025-09-02**, showing **r² 0.995** and an `roi` map containing a control
variable and spend columns as if they were channels — see *Who actually reads the model outputs*. The
pinned model `83e46e03…` lives under `550e8400…` and is displayed nowhere.

So T5–T10 can proceed without moving what the client sees. That is not relief — it means **the demo
is disconnected from the engine**, which is worse than the risk originally flagged: the engine can be
fixed without the demo improving, and the demo can keep showing a 14-month-old 0.995 r² from a
different dataset however good the model becomes.

The decision is therefore:

- **(a)** Point the dashboard at `DEMO_PROJECT_ID` / `550e8400…` so it shows the real PyMC5 model.
  Honest, and immediately drops the displayed r² from 0.995 to 0.398 — which per *Out-of-sample
  validation* in CLAUDE.md is itself an upsampling artefact, so this is a decision to show a worse
  number that is still not trustworthy. Do not take it before T2–T5.
- **(b)** Keep the current wiring and present the platform explicitly as a UI/workflow demo, with the
  model figures labelled as illustrative. Defensible if stated; indefensible if a client asks what
  r² 0.995 was computed on.
- **(c)** Replace the model-performance panel with figures the engine can currently support — which
  after T3 would be contraction and informed-parameter count rather than r².

What must not happen is the status quo by default: a fabricated Durbin–Watson (T1) beside a
fourteen-month-old r² from a dataset with different channels, presented as this model's fit.

Context for whichever path: `.env` sets `MMM_UPSAMPLE_MONTHLY=1` as the reproducibility guard, so the
pinned model sits on the `monthly_constrained` path — `economic_strength = 0.8`, `gamma_cap = 1.5`,
i.e. the *stronger* prior shift.

**Sequencing. Settle this before T5 ships, and settle T1 regardless of which way it goes.**

---

### T12 — Build the knowledge layer · tier 3 · **DEMO**

This is the product. Knowledge exists in **seven** places today and exactly **one** reaches the model:

| where | what | reaches PyMC5? |
|---|---|---|
| `info.csv` → `src/config.py:15-23` | `type`, `subtype`, `variation_level`, `expected_sign` | ✅ the only live channel |
| `pymc_mmm.py:84` | `economic_strength · log(spend_share)` → β prior mean | ✅ **and it overrides judgement** |
| `pymc_mmm.py:92-103`, `:210-248` | geometry caps, `sigma_media`, `min_spacing`, every prior scale | ✅ hardcoded in model code |
| `mmm_claire/src/model/priors.py` | `FUNNEL_PRIORS` — per-stage β, θ, saturation priors | ❌ **dead code, zero importers** |
| `claire_ai_agent.py:65-111` | pharma elasticity ranges, 9 channel families | ❌ in the engine being retired |
| `Model Variables for ViiV.docx` | funnel grouping, channel aggregation, inclusion decisions | ❌ a Word file |
| `ClaireAdminControl.tsx:55` | per-channel include/exclude UI | ❌ `console.log` at `:216`, then discarded |

**`Model Variables for ViiV.docx` is the knowledge base, written by hand in Word.** Its second list
restructures the same 21 channels into groups under a `Sales Force` heading, collapsing
`F2F Calls ABC` + `F2F Calls X` → `F2F Calls` and dropping several items. Three kinds of knowledge
are encoded in it and `info.csv` can hold only one:

| knowledge | expressible today? |
|---|---|
| funnel position | **yes** — `subtype` |
| grouping / aggregation | **no.** Each variable becomes its own channel with its own β, θ, γ — which *is* the parameter-count problem |
| inclusion/exclusion and the reason | **no.** No mechanism, no rationale field |

**Channel grouping is simultaneously the knowledge-base work and the identification fix** — 21
channels at 3 parameters each is 63; eight groups is 24. That makes it the right first build, and it
is the one piece of this that was already solved by hand in August 2025.

What a KB must hold, in units a brand team can argue with:
1. **Variable identity and role** — exists.
2. **Channel grouping** — highest-impact missing item for model quality.
3. **Inclusion policy with a persisted rationale.** `force_include` (a tender dummy that must stay
   regardless of fit), `force_exclude`, and a free-text reason stored with the model. The reason is
   not documentation — it is the artefact a brand team interrogates. Today the spec search can drop
   any control (`spec.py:106-111`) with nothing able to say "not that one".
4. **Plausible elasticity ranges** by channel type × therapeutic area × market, as prior *bounds*
   that constrain or replace the spend-share shift, so domain judgement competes with financial share
   rather than losing to it silently.
5. **Carryover ranges in months** per channel type (field force 1–3 months; congress a spike with a
   tail; email ≈ 0) → θ priors or fixed θ. The most defensible place to inject knowledge, because
   with θ unidentified a knowledge-based θ is strictly better than a prior-mean θ dressed as an
   estimate.
6. **Saturation state** ("at current levels this channel is at 60–80% of its plateau") → pins γ as a
   fraction of mean activity. **The only route to an identifiable γ at T=33**, and a statement a
   brand team can agree or disagree with.
7. **A genuine "free" sign option.** `expected_sign` is binarised at `pymc_mmm.py:205-208`; `free`
   and `na` are accepted by `config.py:23` and **silently forced positive**. "Let the data decide" is
   currently unrepresentable.
8. **Event / outlier calendar** per market — launches, tenders, stock-outs, guideline changes,
   competitor entries. The mechanism is built and validated; the vocabulary is not.
9. **Economics** — net margin by sub-brand and market, and channel cost structures. Nothing exists;
   every ROI the platform reports is a **gross-revenue** return, not profit. In pharma, gross-to-net
   routinely halves it and varies by market.
10. **Market capacity** — target HCP count, max reachable frequency, call capacity → bounds on both
    the saturation curve and the optimizer's feasible region.
11. **Review bands** the agent checks a finished model against. `economic_sanity_checks.py` has three
    hardcoded, with no therapeutic-area awareness, and they only `logger.warning`.
12. **Reusable priors across engagements.** Nothing persists: every run starts from the same
    hardcoded priors. `mmm_models` / `mmm_model_outputs` store results, never the *judgements* that
    produced them.

Missing hooks: `REQUIRED_INFO_COLUMNS` (`src/config.py:15-17`) is a fixed set, so extension means
versioning the contract; `TrainRequest` (`claire_ai_api.py:114-120`) carries only `project_id`;
`ModelSpec` (`spec.py:31-36`) has no media dimension; no module aggregates media before tensor
construction; no cross-project KB storage; and nowhere records *why* a prior was chosen — though
`spec_search` already demonstrates the right audit-trail shape.

**Do not resurrect `FUNNEL_PRIORS`' current numbers on faith** — undocumented and unsourced. But
**do port `ChannelDetector`'s elasticity ranges before `claire_ai_agent.py` is retired**; they are
the only real pharma domain knowledge in the repo, and CLAUDE.md's standing instruction not to change
them without business justification currently protects a table nothing reads.

**Sequencing.** Schema and the single seam (T4) can start in parallel with tier 1. Content comes
after T7/T9 define what the model needs. **A KB that injects a defensible θ into a model that reports
θ back from its prior produces a more defensible-sounding artifact with no more information in it** —
identification first.

---

### T13 — Give the spec search media dimensions · tier 3 · no demo risk

**Change.** `search/spec.py:30-36` — `ModelSpec` varies only `controls`, `seasonality_harmonics`,
`trend`, so **the search can only vary the base block, which already works.** Add media dimensions:
θ pooled / per-subtype / fixed, γ global / per-channel, β hard-pooled / shrunk, channel inclusion.
Update `n_params_hint` (`:54-63`), which counts base parameters only.

**Why.** The search machinery is the best-engineered part of the codebase — two disjoint windows,
paired rolling-origin referee, bootstrap interval over origins, ties keep the incumbent, a recorded
audit trail — and it is pointed at the wrong half of the model. It is also where LASSO-style media
selection belongs: nothing selects media today, and every `type=media` row enters unconditionally
(`build_tensors.py:74-78`).

**Sequencing.** **After T7.** Searching media dimensions on 33 points before the parameter count is
cut just searches a space of equally unidentified models, and `plan_search_split` will often
correctly refuse to run.

---

### T14 — Delete dead code that looks like working code · tier 3 · no demo risk

`saturation.py` `hill_saturation` (unused — the model inlines Michaelis–Menten at
`pymc_mmm.py:330`), `adstock.py` `geometric_adstock` (unused — inlined at `:290-298`),
`build_tensors.py:173` `X_media_scaled`. Fix `small_data_checks.py:11-14`, which claims "Strong
priors and pooling will be enforced" at T<30 — nothing enforces anything, and at T=33 it does not
fire. Fix `marginal_roi.py:76`, which multiplies by a `revenue_per_unit` that is `None` in
single-KPI mode (dovato is dual-KPI so it is masked — any single-KPI client hits a `TypeError`), and
`roi.py:18-20`, which returns `None` with no spend after which `marginal_roi.py:16` raises
`KeyError`. Also: `posterior_predictive_check` is defined at `diagnostics.py:84-118` and **never
called**.

**Why.** `X_media_scaled` already caused one misdiagnosis — it is named like the fix and is not one.
`hill_saturation` is a trap in the other direction: switching to the Hill form adds a shape parameter
per channel, i.e. 6 more parameters at exactly the wrong moment.

**Sequencing.** With T5, so `X_media_scaled` cannot be mistaken for the normalisation fix again.

---

## Sequencing

```
T1  (urgent, standalone) ────────────────────────────────────────────►

T2 ─┐
    ├─► T5 ─► T6 ─► T7 ─► T9 ─► T10
T3 ─┤         ▲            
T4 ─┘         │     T13 (after T7)
              │
         T8 (parallel)      T12 (schema parallel; content after T7/T9)

T11 — decide BEFORE T5 ships.        T14 — with T5.
```

Two ordering constraints that are not preferences:
- **T9 after T7.** Removing the spend-share shift while 19 unidentified media parameters remain
  leaves nothing holding them down.
- **T12 content after identification.** Otherwise the KB makes the model sound defensible without
  making it informative.

## What NOT to do

- **Spend compute on sampling.** R-hat 1.0000, 0 divergences, min ESS 1324. More draws, chains,
  `target_accept`, stability levels or backtest origins buy nothing. `MMM_BACKTEST_ORIGINS=12` costs
  180 fits where the old loop paid 15, to resolve differences between equally unidentified
  specifications.
- **Tune `MMM_SEARCH_MIN_IMPROVEMENT`.** The estimator's sd is ~0.26 against a threshold of 0.01. No
  value fixes an instrument forty times coarser than the effect.
- **Expand the spec search space before T7.**
- **Switch to the Hill saturation form.** Adds 6 parameters at T=33.
- **Widen γ's prior to improve identifiability.** Its 90% interval already spans the entire
  admissible range; that is the problem, not the solution.
- **Add interaction terms yet.** `C(C−1)/2 = 15` more parameters on 33 observations. The synergy
  question ("do reps convert the digital exposure, or are we paying twice?") is the right one and the
  ViiV channel list is built for it — but it needs a longer series and one or two theory-driven
  interactions, not a full basis.
- **Add causal inference (DoWhy / CausalML) yet.** A model whose media parameters never leave their
  prior has no effect to de-confound.
- **Add SHAP.** `contributions.py:71-90` is already an exact additive attribution for this model;
  SHAP would add a second, approximate answer to a question answered exactly.
- **Re-enable `MMM_UPSAMPLE_MONTHLY` for modelling.** Documented and quantified disaster. Its use as
  a demo reproducibility guard is a different thing and should stay until T11 is decided.
- **Resurrect `FUNNEL_PRIORS` as-is.** Undocumented, unsourced numbers.
- **Infer variable roles from column names.** Deliberately rejected and rightly:
  `Digital HiiV Search` vs `Digital Dovato Video` vs `Medscape HiiV BRAND ALERT` differ in funnel
  position in ways no regex recovers, and getting it wrong changes the ordering that drives β.
- **Make the T3 gate retroactive without deciding.** It would block all 142 legacy models.

## Open questions

- **Whether the funnel hierarchy learns anything.** `run_recovery.py:85-116` never collects
  `base_beta`, `delta_mid`, `delta_upper`, `gamma_global` or `tau_gamma`, so "19 of 26" says nothing
  about them. The structural argument says it cannot (no learned `sigma_media`, so no pooling), but
  it is unmeasured. **T2 closes this for five lines.**
- **Whether θ/γ become identifiable after T5–T7, or merely stop being fabrications.** Empirical;
  only the harness can answer. Plan for "fix them from the KB and report them as assumptions".
- **The sample size at which media becomes identifiable.** `--periods` is exposed but unswept. One
  seed, one T. Commercially material — it sets the minimum dataset CLAIRE can accept.
- ~~Whether the frontend reads the outputs T10 changes.~~ **Closed 2026-11-05 — it does not.**
  See *Who actually reads the model outputs* above.
- **Whether the stored `adstock_curves` rows under `550e8400…` are in fact six identical curves.**
  Predicted by the θ cap collision but unverified — no row contents were inspected. Cheap to check,
  and it would confirm the mechanism end to end rather than by inference.
- **Whether the recovery FAIL reproduces on the pinned model.** The study is synthetic data at the
  demo's sample size, not a re-fit. Its θ/γ conclusions are scale-free and almost certainly transfer;
  the β magnitudes may not.
- **Missingness policy.** Absent rows become a modelled `0.0`. Zero is usually right for media (no
  calls happened) and usually wrong for controls and KPI. Needs a per-`type` policy and a
  completeness report — unresolved, and it moves contributions without moving any gate.
