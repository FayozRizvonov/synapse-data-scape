# Roadmap — Trigma.ai / CLAIRE inside Claude (Enterprise Connector)

> **Status:** Committed direction for product planning. Owner: TBD. Last updated: 2026-08-18.
>
> *2026-08-18 — compute core updated:* training moved from Orbit-ML to a **PyMC5 pipeline running
> async on Celery + Redis**. Orbit-ML still backs `/optimize`, `/insights` and `/agent/process`, so
> it is not yet retired. The async job pattern below (a Phase 1 blocker) is now **built and
> verified end-to-end**.

## Goal

Many clients already use Claude (Claude Enterprise / Team). Rather than sending them to a
separate CLAIRE web app, expose the CLAIRE / Trigma.ai MMM platform **inside Claude** so an
analyst can stay in the conversation — e.g. *"optimize my Q3 detailing budget for product X"* —
and CLAIRE runs the modeling/optimization on our infra and returns results in-conversation.

## Decisions locked

- **Distribution surface:** Enterprise/Team **Connector** (org-level remote MCP server added by
  client IT; multi-tenant; centrally managed). Not Desktop extension, not public directory (for now).
- **Sequencing:** Go **straight to production build** (no throwaway POC). De-risking is folded into
  a Week 1–2 production "walking skeleton" — one real tool end-to-end — not a separate prototype.

## Architecture

```
Client's Claude (Enterprise / Team)
      │  natural language
      ▼
CLAIRE Connector  =  Remote MCP Server     ← OAuth 2.1, per-tenant token → company_id
      │  typed tool calls
      ▼
Existing FastAPI (claire_ai_api.py)        ← ADD auth middleware + tenant scoping
      │
      ├─ training ──▶ Celery + Redis ──▶ PyMC5 MMM pipeline   ← async; job_id + polling
      │
      └─ optimize / insights ──▶ PharmaMMMAgent + OptimizerEngine (Orbit-ML)
      │
      ▼
Supabase (RLS per company_id)
```

Claude becomes the natural-language layer. Note: today `claire_ai_agent.py` has **no LLM** —
`PharmaMMMAgent.run(prompt)` is a deterministic router over pandas + Orbit-ML. The
`/agent/process` NL router can be **retired** once Claude fronts the tools.

### MCP tools → existing endpoints (≈1:1)

| MCP tool | Backs onto |
|---|---|
| `claire_train_model` | `/model/train` (wrap in async job pattern) |
| `claire_optimize_scenario` (TMB/TSV) | `/optimize/scenario` |
| `claire_optimize_sales_force` | `/optimize/sales-force` |
| `claire_generate_insights` (en/ru) | `/insights/generate` |
| `claire_get_model_status` / `_latest` | `/projects/{id}/status`, `/models/{id}/latest` |
| `claire_list_scenarios` | `/scenarios/{id}/optimization`, `/scenarios/{id}/sales-force` |
| `claire_upload_data` | `/data/upload` |
| `claire_approve_model` (role-gated) | `/models/{id}/approve` |

Pair the connector with a **CLAIRE Skill** that teaches Claude how to use the tools and interpret
pharma elasticities / adstock, so output reads like an expert analyst.

## Requirements / gaps

### Blockers (must-have)
- **Auth & multi-tenancy on the API** — current grep shows *no* `Depends`/`Bearer`/token checks;
  scoping is only `project_id` + Supabase service role + RLS. Add OAuth 2.1 token validation,
  `token → company_id` mapping, and tenant enforcement at the API layer.
- **MCP server** — new component; Python `FastMCP` wraps the FastAPI. Tool schemas + Claude-tuned
  descriptions + error handling.
- ~~**Async job pattern**~~ — **DONE (2026-08-18).** `POST /model/train` enqueues a Celery task and
  returns `job_id` immediately; `GET /jobs/{job_id}/status` polls `mmm_runs`
  (`queued → running → done | failed`). Verified end-to-end. Remaining work is only to surface it
  as MCP tools (`claire_train_model` → `claire_get_model_status`).
- **Result rendering** — Claude is conversational. Response curves/charts return as images
  (reuse `html-to-image` / matplotlib) or structured tables + deep-links to the web app.

### Enterprise readiness
- Production hosting (containerized, TLS, autoscale — PyMC5 sampling is CPU-heavy; see
  "PyMC5 cost profile" below before sizing).
- Per-tenant usage metering → billing (this becomes a billable SKU).
- Audit logs, SOC2 controls, DPA / data residency (we're eu-central-1 — good for EU pharma).
- Data-ingestion story in a Claude context (attach CSV vs. registered per-tenant data source).

### Platform completion (needs dedicated gap audit)
- Retire `/agent/process` NL router (Claude replaces it).
- Error handling, rate limiting, observability across all endpoints.

## Phased plan (small team: ~2 backend, 1 infra/frontend, PM)

| Phase | Scope | Duration | Exit criteria |
|---|---|---|---|
| **0 — Design & design-partner** | Lock OAuth/SSO provider, tenancy model, compliance scope (SOC2/DPA/residency) with one named pharma client | 1–2 wks | Signed-off auth + data-flow design; design partner committed |
| **1 — Walking skeleton + hardening** | Auth middleware + `token→company_id` scoping on FastAPI; async job pattern; observability; **one tool (`claire_optimize_scenario`) live end-to-end** | 3–4 wks | A real user in Claude Enterprise runs one optimization against their tenant |
| **2 — Full connector** | Remaining MCP tools; chart-as-image rendering; CLAIRE Skill for pharma domain guidance | 3–4 wks | All endpoints exposed; outputs render as charts/tables, not JSON |
| **3 — Enterprise readiness** *(parallel w/ 2)* | Production hosting + autoscale; per-tenant metering/billing; audit logs; SOC2 controls; DPA + eu-central-1 residency posture | 3–5 wks | Pen-test passed; metering feeds billing; per-tenant audit trail |
| **4 — Pilot → GA** | Design-partner pilot; IT provisioning runbook; onboarding docs; first-cohort rollout | 2–4 wks | Design partner in production; provisioning self-serve for client IT |

- **GA: ~12–16 weeks (3–4 months).**
- **First live in-Claude demo against a real tenant: ~end of week 5–6** (the skeleton).

## Critical path (gates everything)

1. **OAuth 2.1 + SSO provider choice** (Phase 0) — recommend WorkOS or Auth0 (SSO + SCIM
   out of the box) over rolling our own on Supabase Auth. Blocks all tenant-scoped work.
2. **Auth + tenant enforcement on FastAPI** (Phase 1) — current gap; every tool inherits it.
3. ~~**Async job pattern**~~ — **delivered 2026-08-18** (Celery + Redis, `job_id` + polling).

Everything else parallelizes once the two remaining items land.

## Top risks

- **Compliance is the likely long pole.** SOC2 Type II evidence + a pharma client's security review
  can outrun 16 weeks. Run it as a parallel track from Phase 0, not a Phase 3 item.
- **Data flows through Claude.** Settle DPA/BAA language with both Anthropic (Enterprise terms) and
  the client early — pharma legal will ask.
- **PyMC5 training cost/latency under multi-tenant load** needs a real autoscale answer; don't defer.
  See below — the only numbers we have are from a single-region, single-sub-brand dataset.

## PyMC5 cost profile (measured 2026-08-18 — read before autoscale sizing)

Measured on a **local M-series Mac**, dataset: **1 region × 1 sub-brand**, 11 variables,
33 months → 132 weekly periods, 6 media channels. Stability level 0 on the first attempt every run.

A job is two phases: **PyTensor compile + NUTS init**, then **MCMC sampling**. Only the second
scales with chains, and they have very different sensitivities — size them separately.

| Worker pool | Chains | Compile + init | Sampling | Total |
|---|---|---|---|---|
| `--pool=solo` (`cores=4`, parallel) | 4 | ~3.5 s | **~57 s** | **~65 s** |
| default prefork (`cores=1`, sequential) | 4 | ~3.7 s | **~205 s** | ~208–220 s (n=5) |
| `--pool=solo` on a loaded machine | 4 | **~133 s** ⚠️ | ~56 s | ~217 s |

**Run the worker with `--pool=solo`** — ~3.6x faster sampling for free. Celery's prefork pool runs
tasks in daemonic processes, which cannot spawn children, so PyMC falls back to sequential chains.

**Compile time is the volatile part.** It is normally ~3.5 s but was measured at **133 s** on a host
under load (load avg 11.2 on 4 performance cores) — it is single-threaded C++ compilation and
degrades badly under CPU contention, enough to erase the entire benefit of parallel chains. Under
multi-tenant load this is a per-job tax, not a one-off: budget headroom for it, keep the PyTensor
compile cache warm and on fast local disk, and do not co-schedule jobs onto saturated hosts.

Caveats that make these numbers a floor, not a forecast:
- **Scale is untested.** The tensor is `T × G × SB × media`; geography and sub-brand both multiply
  the work and are effectively 1 here. Real territory-level pharma data is far larger.
- **Stability escalation is unsampled.** The controller allows 4 levels × 3 draw escalations; every
  run so far succeeded at level 0. A harder dataset costs a multiple of the above.
- **Hard ceiling exists.** `task_soft_time_limit=3600` / `task_time_limit=4200` (70 min) in
  `celery_app.py` — a large tenant dataset could hit it.
- `--pool=solo` is one job per worker process, so multi-tenant concurrency = fleet size.

**Action:** benchmark one realistic client-shaped dataset (multi-region, multi-sub-brand) before
Phase 3 sizing. That single number drives per-tenant cost, fleet size, and whether the 70-min
limit holds. No Orbit-vs-PyMC5 benchmark exists; the switch was made on modeling grounds.

## Reference: current backend (as of 2026-08-18)

- FastAPI `claire_ai_api.py` on port 8000; endpoints listed above; **no auth layer present**.
- **Training:** `POST /model/train` → Celery (Redis broker) → PyMC5 pipeline in `mmm_claire/`;
  job state in `mmm_runs`, results in `mmm_models` / `mmm_model_outputs`.
  Worker env is conda `mmm_cl` (PyMC 5.25); run it with `--pool=solo`.
- **Optimize / insights / NL router:** still the legacy `PharmaMMMAgent` (`claire_ai_agent.py`) on
  Orbit-ML — deterministic, no LLM calls. Retiring Orbit means porting these three endpoints.
- `project_id` must be a **UUID** (`mmm_models.project_id` is a `uuid` column); rejected at the API.
- Supabase project ref `thpnkluejymycxmiavjp`, AWS eu-central-1, RLS per `company_id`.
