# CLAIRE AI — Synapse Data Scape

## What This Project Is
CLAIRE AI is an autonomous AI-powered **Marketing Mix Modeling (MMM)** platform for pharmaceutical and CPG companies. It helps optimize marketing budgets using a hierarchical Bayesian MMM (PyMC5) with geometric adstock, Hill saturation, and pharma-specific elasticity constraints. The platform includes a conversational AI interface, voice input, scenario comparison, and bilingual (EN/RU) insights generation.

This is the **demo version** of the **Trigma.ai platform**.

## Migration status — retiring Orbit-ML
**Direction: move off Orbit-ML entirely.** Training already has; the rest has not.

| Path | Engine | Status |
|---|---|---|
| `/model/train`, `/model/retrain`, `/jobs/{id}/status` | **PyMC5** (`mmm_claire/`, async on Celery) | ✅ migrated |
| `/optimize/scenario` | **PyMC5** (`src/optimizer/budget_allocator.py`) | ✅ migrated |
| `/insights/generate` | **PyMC5** (reads `mmm_model_outputs`) | ✅ migrated |
| `/optimize/sales-force` | stub — echoes its inputs, computes nothing | ⛔ to build |
| `/agent/process` | Orbit-ML via `PharmaMMMAgent` | ⛔ retire (Claude replaces the NL router) |

Until those three are ported, `orbit-ml` stays in `requirements.txt` and `claire_ai_agent.py`
remains live — **don't delete either yet**. Treat everything Orbit-backed as legacy: fix bugs, but
build new modeling work in `mmm_claire/`.

## Strategic Direction — Claude Enterprise Connector
**Committed direction (2026-06-19):** Expose CLAIRE / Trigma.ai *inside Claude* so clients already on
Claude Enterprise/Team can run MMM modeling & optimization from the conversation, instead of a separate web app.
- **Distribution:** org-level **Connector = Remote MCP Server** (multi-tenant, IT-provisioned). Not Desktop ext / public directory.
- **Sequencing:** straight to production build; de-risk via a Week 1–2 production "walking skeleton" (one tool end-to-end), no throwaway POC.
- **Architecture:** Claude (NL layer) → CLAIRE MCP server (OAuth 2.1, token→`company_id`) → existing FastAPI → training via Celery/PyMC5, optimize+insights via `PharmaMMMAgent`/Orbit-ML → Supabase RLS. MCP tools map ≈1:1 to existing endpoints; retire `/agent/process` (Claude replaces the NL router).
- **#1 blocker:** FastAPI has **no auth layer** today (scoped only by `project_id` + service role + RLS) — must add OAuth + tenant enforcement.
- **Critical path:** (1) OAuth/SSO provider (recommend WorkOS/Auth0), (2) API auth + tenant scoping. ~~(3) async job pattern~~ — delivered 2026-08-18 (Celery + Redis, `job_id` + polling).
- **Timeline:** ~12–16 wks to GA; first live in-Claude demo ~wk 5–6. Compliance (SOC2/DPA, eu-central-1 residency) is the likely long pole — run parallel from Phase 0.
- **Full roadmap:** `docs/claude-connector-roadmap.md`.

## Tech Stack

### Frontend
- React 18 + TypeScript + Vite (SWC)
- Tailwind CSS with custom theme variables (`src/styles/theme-variables.css`)
- Radix UI + Shadcn component patterns (`src/components/ui/`)
- TanStack React Query v5 for data fetching
- Framer Motion for animations, Recharts + Visx for charts, Three.js for 3D
- React Hook Form + Zod for forms

### Backend
- Python FastAPI (`claire_ai_api.py`) on port 8000
- **Modeling (current):** PyMC5 hierarchical Bayesian MMM in `mmm_claire/`, run asynchronously by a
  **Celery** worker with **Redis** as broker + result backend
- **Legacy:** `claire_ai_agent.py` (`PharmaMMMAgent`) on Orbit-ML with a linear-regression fallback —
  still serves optimize/insights/agent; see *Migration status* above
- Supabase Python SDK for DB access — `mmm_claire/src/database/` for the PyMC5 path,
  root `supabase_client.py` for the legacy path

> Two Python environments: the FastAPI app runs on `.venv` (Python 3.11); the Celery worker needs
> the conda env `mmm_cl` (Python 3.10 + PyMC 5.25), because PyMC/pytensor need conda-forge builds.

### Database
- Supabase (PostgreSQL) with Row Level Security (RLS) for multi-tenancy
- Real-time subscriptions for chat and metrics
- Storage bucket `rawdata` for CSV datasets (uploads land at `mmm/{project_id}/{data,info,spend}.csv`)
- Key tables: `mmm_runs` (async job tracking), `mmm_models`, `mmm_model_outputs`, `mmm_ui_key_metrics`, `chats`, `messages`, `company_members`, `member_permissions`, `user_roles`

> **`project_id` is a `uuid` and must be a real `brands.id`.** All three of `mmm_models`,
> `mmm_model_outputs` and `mmm_runs` type it as `uuid`, and `mmm_runs.project_id` is a foreign key
> to `brands(id)` (`on delete restrict`). The API rejects a non-UUID with 422 and an unknown
> project with 404. Until 2026-08-18 `mmm_runs.project_id` was `text`, which let a bogus id pass
> job creation and fail only after a full training run.

## Project Structure

```
synapse-data-scape/
├── claire_ai_api.py        # FastAPI REST endpoints
├── claire_ai_agent.py      # LEGACY PharmaMMMAgent (Orbit-ML) — optimize, insights, NL router
├── supabase_client.py      # LEGACY Supabase client used by claire_ai_agent.py
├── mmm_claire/             # PyMC5 MMM backend (current modeling path)
│   ├── run_mmm_pipeline.py #   pipeline entry point — returns the 12 output types
│   ├── environment.yml     #   conda spec for the `mmm_cl` worker env
│   ├── data/               #   sample data.csv / info.csv / spend.csv
│   └── src/
│       ├── workers/        #   celery_app.py, model_worker.py (async job execution)
│       ├── database/       #   supabase_client, run_depository, dataset_repository
│       ├── model/          #   pymc_mmm, adstock, saturation, sampling, stability_controller
│       ├── parser/         #   build_tensors.py
│       ├── preprocessing/  #   monthly_to_weekly.py
│       └── validation/     #   schema / data / info checks
├── src/
│   ├── pages/              # Full-screen route components
│   ├── components/         # UI components (ui/ = primitives, rest = features)
│   ├── hooks/              # Custom React hooks (useAIAssistant, useVoiceAssistant, etc.)
│   ├── contexts/           # AuthContext (auth, roles, permissions)
│   ├── integrations/       # API clients (claire-ai/, supabase/)
│   ├── data/               # Static data (metricsKnowledgeBase.ts)
│   ├── constants/          # Branding, logos
│   └── styles/             # Global CSS, theme variables
├── supabase/               # DB migrations and config
├── scripts/                # Bootstrap and utility scripts
└── public/                 # Static assets
```

## Key Pages
| Page | Route | Purpose |
|------|-------|---------|
| `Index.tsx` | `/` | Main dashboard — AI chat, metrics, insights |
| `Auth.tsx` | `/auth` | Login / signup |
| `ClaireAdminControl.tsx` | `/admin` | Admin panel — team, roles, permissions |
| `ClaireLandingModern.tsx` | `/landing` | Onboarding/landing |

## Key Backend Modules

### PyMC5 path (current)
- **`run_pipeline()`** (`mmm_claire/run_mmm_pipeline.py`): Full pipeline — validate → build tensors →
  sample → 12 output types. Returns DataFrames plus `_meta` (`stability_level`, `detected_channels`).
- **`run_mmm_pipeline_task`** (`src/workers/model_worker.py`): Celery task. Downloads the dataset from
  Storage, runs the pipeline, persists results, moves `mmm_runs` through its status transitions.
- **`stability_controller`** (`src/model/`): Escalates draws/levels until the model is stable
  (4 levels × 3 draw escalations).
- **`src/database/supabase_client.py`**: Writes `mmm_models` / `mmm_model_outputs`.

### Legacy Orbit path (to be ported)
- **`PharmaMMMAgent`** (`claire_ai_agent.py`): Deterministic orchestrator (no LLM) — still backs
  optimization and insights
- **`ChannelDetector`**: Keyword-based channel classification + pharma elasticity ranges.
  The PyMC5 path does **not** use this — it groups channels from the `subtype` column of `info.csv`.
- **`OptimizerEngine`**: ROI calculation, response curves, budget allocation
- **`SupabaseMMMClient`** (`supabase_client.py`): DB operations for the legacy path

## API Endpoints (backend on port 8000)
| Endpoint | Method | Purpose | Engine |
|----------|--------|---------|--------|
| `/data/upload` | POST | Upload data/info/spend CSVs to Storage | — |
| `/model/train` | POST | **Enqueue** async training; returns `job_id` immediately | PyMC5 |
| `/model/retrain` | POST | Re-enqueue an existing project | PyMC5 |
| `/jobs/{job_id}/status` | GET | Poll job: `queued → running → done \| failed` | PyMC5 |
| `/optimize/scenario` | POST | Budget optimization (TMB/TSV) | PyMC5 |
| `/optimize/sales-force` | POST | Sales force optimization | stub |
| `/insights/generate` | POST | Generate EN/RU insights | PyMC5 |
| `/agent/process` | POST | Natural language prompt processing | Orbit (legacy) |
| `/projects/{id}/status` | GET | Project status | — |

> `/model/train` is **asynchronous** — it returns a `job_id`, not a model. Poll
> `/jobs/{job_id}/status`. A job reporting `done` means results were persisted; `failed` carries
> `error_message`.

## Running the Project

Training needs **three** processes: Redis, the Celery worker, and the API.

### 1. Redis (broker + result backend)
```bash
redis-server --port 6379          # verify: redis-cli ping -> PONG
```
> The Homebrew-bundled `/opt/homebrew/etc/redis.conf` may abort on a missing `redisbloom` module;
> plain defaults are fine for local dev.

### 2. Celery worker (conda env `mmm_cl`, NOT `.venv`)
```bash
cd mmm_claire
conda activate mmm_cl
set -a; source ../.env; set +a          # src/database/* read os.environ; they never load .env
celery -A src.workers.celery_app worker --loglevel=info --pool=solo
```
> **Use `--pool=solo`.** The default *prefork* pool runs tasks in daemonic processes, which cannot
> spawn children, so PyMC's parallel chains fall back to `cores=1` — ~3.6x slower sampling
> (~57 s vs ~205 s on the sample dataset). `sample_model` detects this and degrades rather than
> crashing; override with `MMM_SAMPLE_CORES`.
>
> Note the PyTensor compile + NUTS init phase before sampling is normally ~3.5 s but has been seen
> at ~133 s on a loaded machine — if a run looks inexplicably slow, check the gap between
> "Starting sampling" and "Multiprocess sampling" in the worker log before blaming the sampler.

### 3. Backend API
```bash
.venv/bin/python -m uvicorn claire_ai_api:app --host 0.0.0.0 --port 8000
```

### Frontend only
```bash
npm run dev
```

### One-command alternatives
```bash
npm run dev:mmm      # API + frontend + Celery worker (everything except Redis)
npm run dev:all      # API + frontend only — no worker, so training will never start
npm run worker       # Celery worker on its own
npm run api          # FastAPI on its own
```

`npm run worker` finds the `mmm_cl` conda env itself (override with `MMM_CONDA_PREFIX`), checks
Redis is reachable, exports `.env` into the worker, and applies `--pool=solo`. **Redis is the one
thing no npm script starts** — run it yourself first.

> These scripts were Windows-only until 2026-08-18 (`.venv\Scripts\python.exe` was hardcoded in
> `package.json` and `scripts/bootstrap-api.cjs`); they now resolve the interpreter per platform.

## Environment Variables
Copy `env_template.txt` to `.env`. Key variables:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — frontend Supabase
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — backend Supabase
- `OPENAI_API_KEY` — optional, for advanced AI features
- `REDIS_URL` — Celery broker + result backend (default `redis://localhost:6379/0`)
- `SUPABASE_JWT_SECRET` — verify user tokens locally instead of calling `/auth/v1/user` per request
- `MMM_SAMPLE_CORES` — optional override for PyMC sampling cores
- `MMM_UPSAMPLE_MONTHLY` — legacy monthly→weekly expansion; off by default, see *ML/Analytics*
- `MMM_SPEC_SEARCH` — search model specifications, scored out-of-sample; off by default,
  requires `MMM_HOLDOUT_PERIODS`. Tune with `MMM_SEARCH_DRAWS` / `MMM_SEARCH_CHAINS` /
  `MMM_SEARCH_ROUNDS` / `MMM_SEARCH_MAX_FITS`
- `MMM_SEARCH_HOLDOUT_PERIODS` — periods the search selects on, in its **own** window
  before the reported one; defaults to `MMM_HOLDOUT_PERIODS`. Lower it when the series
  cannot carry both windows — see *Specification search*
- `MMM_SEARCH_MIN_IMPROVEMENT` — how much a candidate must gain to be worth its
  complexity (default 0.01). Necessary, never sufficient — see *Rolling-origin backtesting*
- `MMM_BACKTEST_ORIGINS` — expanding-window origins to backtest; `0` (off) by default.
  Above zero it switches the search to the **paired rolling-origin referee** and writes a
  `backtest_metrics` output. Costs **one MCMC fit per origin per candidate**
- `MMM_BACKTEST_HORIZON` — periods forecast from each origin (default 1)
- `MMM_WATCH_PROJECTS` — project uuids to watch for new data and retrain; empty (off) by
  default. `MMM_WATCH_INTERVAL_SECONDS` sets the poll interval (900)
- `MMM_HOLDOUT_PERIODS` — trailing periods to hold out for out-of-sample scoring; `0` (off)
  by default, see *Out-of-sample validation*
- `DEFAULT_MODEL_TYPE` — `DLT` / `KTR` / `LINEAR`; **legacy Orbit path only**, does not affect PyMC5

> The worker reads credentials straight from `os.environ` — `mmm_claire/src/database/*` never calls
> `load_dotenv()`, so export `.env` into the shell before starting Celery.

## Conventions & Patterns

### Frontend
- **Components**: Functional components with hooks throughout. No class components.
- **UI primitives** live in `src/components/ui/` — don't modify these directly, wrap them.
- **State**: Use `AuthContext` for auth state, React Query for server state, local state for UI state.
- **Styling**: Tailwind utility classes. Custom theme in `tailwind.config.ts`. Glassmorphism/neon aesthetic — dark mode first.
- **Path alias**: `@/` maps to `src/` (configured in `tsconfig.json` and `vite.config.ts`)
- **Forms**: React Hook Form + Zod schema validation

### Backend
- **Async throughout**: All FastAPI endpoints and DB calls are async.
- **Layered architecture**: Agent logic → API endpoints → DB client. Don't mix layers.
- **Long-running work goes on Celery**, never inline in a request. Training returns a `job_id`.
- **Never report success on an unverified write.** The `mmm_claire/src/database` helpers swallow
  errors and return `None`/`False`; check the return value and fail the job. A job marked `done`
  must mean the data landed.
- **`jsonb` columns take native dicts/lists** — the Supabase client serialises them. Calling
  `json.dumps()` first stores a JSON *string* and silently breaks every consumer.
- **Fallbacks**: the legacy Orbit path falls back to linear regression if Orbit is unavailable.
- **Logging**: Use `loguru` logger, not `print`.
- **Configs**: Use dataclasses (`ModelConfig`, `OptimizationConfig`) for typed configuration.

### ML/Analytics
- Channel elasticity ranges are pharma-specific — don't change without business justification.
- **PyMC5 (current):** hierarchical funnel model — geometric adstock, Hill saturation, and a
  funnel hierarchy (`base_beta` / `delta_mid` / `delta_upper`) taken from the `subtype` column of
  `info.csv` (`upper` / `mid` / `lower`). Channel grouping comes from that declared metadata, not
  from name-matching.
- Input contract: `data.csv` (long format: `date,region,sub_brand,variable,value`), `info.csv`
  (`variable,type,subtype,variation_level,expected_sign`), optional `spend.csv` (enables ROI).
  **The model fits the data's native frequency** — monthly input is modelled monthly.
  `MMM_UPSAMPLE_MONTHLY=1` restores the legacy monthly→weekly expansion, but don't: its
  `1 + 0.3*sin(2πi/4)` split fabricates a ±30% within-month sawtooth in *every* variable, which
  was 42.5% of weekly target variance and inflated weekly r² to 0.398 while the same predictions
  scored 0.052 on real months. It also quadrupled the row count (33→132), understating posterior
  sd ~2× so the R-hat/ESS gates passed on fabricated volume. Any `fit_metrics` r² stored before
  2026-10-19 came from that path and is not comparable.
- Outputs: 12 types (coefficients, contributions, ROI, marginal ROI, adstock/saturation curves,
  predictions, fit metrics, channel efficiency, …) written to `mmm_model_outputs`, one row per type.
- Sampling: 4 chains, 1000 draws / 1000 tune, `target_accept` 0.95–0.97; the stability controller
  escalates on failure. Cost scales with `T × regions × sub_brands × media`.
- **Orbit (legacy):** `DLT` (default), `KTR`, `LINEAR` (fallback only); adstock via
  `UtilityEngine._apply_adstock()`.
- Optimization scenarios: `TMB` (Total Media Budget), `TSV` (Total Sales Value)

## Authentication & tenancy (`api_auth.py`)

Every endpoint except `/` and `/health` requires a bearer token. There is **no bypass flag** — an
auth switch is exactly what ships enabled by accident.

**Accepted tokens**
- A signed-in user's **Supabase access token** (the frontend forwards `session.access_token`).
  Verified locally with `SUPABASE_JWT_SECRET` when set, otherwise introspected via
  `/auth/v1/user` (correct, but a round trip per request — set the secret in production).
- The **service-role key**, for server-to-server callers. Server-side only; never send it to a browser.

**Tenancy chain — `project_id` is a `brands.id`**
```
JWT.sub  -> company_members.user_id -> company_id   (active members only)
project  -> brands.id               -> brands.company_id
                    authorised when these intersect
```

- Unknown project → **404** (not 403), so the API never confirms ids belonging to other tenants.
- Cross-tenant attempt → **403**, logged with principal, company_ids and project.
- `/jobs/{id}/status` and `/models/{id}/approve` carry no tenant of their own — they authorise via
  the run's / model's `project_id`.

> A project **must** exist in `brands` or every call 404s. The frontend's default project
> `550e8400-…` is registered as the brand "CLAIRE Demo Project" under Capgemini for this reason.

> ⚠️ `VITE_CLAIRE_AI_API_KEY` is gone. It was a build-time constant baked into the bundle and shared
> by every user — it identified nobody. Don't reintroduce a client-side API key.

## Specification search

The specification used to be fixed in code: every control in `info.csv` included,
seasonality one harmonic monthly / two weekly, a linear trend always on. Those are
modelling choices, not facts.

`MMM_SPEC_SEARCH=1` (needs `MMM_HOLDOUT_PERIODS > 0`, and refuses to run without it)
searches one-step changes to the specification — which controls, how many seasonal
harmonics, trend on/off — fitting each candidate and scoring it on periods the model
never saw. It optimises `skill_vs_naive`, never in-sample fit, because in-sample fit is
the score a search will exploit: it rewards adding parameters, and on 33 observations
there is ample room to add parameters that explain nothing.

How a candidate is judged is the referee's business, not the loop's: `single_holdout`
(the default, one fit and a threshold) or `rolling_origin` (paired forecasts and a
bootstrap interval, via `MMM_BACKTEST_ORIGINS`). The loop only asks whether a comparison
was decisive. See *Rolling-origin backtesting* — on 33 monthly observations the second
referee can say "I cannot tell", which is usually the true answer and the one the first
cannot express.

Under the default referee a candidate must beat the incumbent by `min_improvement`
(default 0.01). **A tie keeps the incumbent.** An earlier version also moved to the simpler of two tied specs, which
seemed principled and was not — each tie licensed another step, so on flat ground the
search stripped the model down round after round and the winner depended on the round
budget rather than the evidence.

Everything tried is recorded in the `spec_search` output with its score, so a conclusion
can be interrogated rather than taken on trust. The winner is then refitted at full
sampling settings; search fits use `MMM_SEARCH_DRAWS` (400) and `MMM_SEARCH_CHAINS` (2).

### The search never sees the periods its winner is judged on

Two windows, not one. The last `MMM_HOLDOUT_PERIODS` periods are what `holdout_metrics`
reports and what the approval gate binds on, so the search is handed the series with
those periods already removed and selects on its own earlier window of
`MMM_SEARCH_HOLDOUT_PERIODS` (default: the same size). On dovato that is 33 periods →
train on 21, select on 2024-10…2025-03, report on 2025-04…2025-09.

Until 2026-10-22 both jobs used the same window: the pipeline reassigned the bundle to
the winning spec and then scored the holdout on the very periods the search had just
maximised skill over. `skill_vs_naive` for a searched model was therefore the maximum
over every candidate tried, and `approve_mmm_model` read it as out-of-sample evidence —
shown the best of ~15–20 draws and treating it as one. On this data shape (6 holdout
observations at G=SB=1, estimator sd ≈ 0.26) that inflates by +0.22 to +0.41 depending on
how correlated the candidates' errors are.

`plan_search_split` refuses the search outright when the series cannot carry both windows
— the search's own training window must be at least 2× its holdout. A shared window is
worse than no search, because it produces a number that looks like evidence. Lower
`MMM_SEARCH_HOLDOUT_PERIODS` to make a short series fit.

`holdout_metrics.selection_independent` carries the verdict with the scores, and the gate
reads it rather than inferring it. It is true when no search ran, when the search failed,
when the search kept the default (the incumbent's score is its own, not a maximum), or
when the reported window was withheld.

> The result below was produced under the **old, shared-window** protocol, so the gain is
> not a clean out-of-sample estimate — the expected maximum of ~8 statistically identical
> candidates on this data is itself about +0.17. Re-run under the two-window split before
> citing it. The coverage improvement is the more trustworthy half: coverage has a known
> null (0.9), skill has none. Analysis in `docs/llm-spec-proposal-evaluation.md`.

| | skill_vs_naive | coverage_90 |
|---|---|---|
| default `controls=[comp1,ex_1,ex_2] harmonics=1 trend=on` | +0.0621 | 0.50 |
| **winner** `controls=[ex_1,ex_2] harmonics=2 trend=on` | **+0.2294** | **0.83** |

> **The default spec must stay bit-identical.** PyMC consumes random draws in declaration
> order, so a mathematically identical spec declared differently samples differently.
> `build_pymc_model` keeps the original trend and seasonality blocks verbatim and only a
> genuinely different spec reaches the generalised path. Verified: with the flag unset all
> 12 output CSVs are byte-identical to a pre-change baseline.

## Automatic retraining — triggered by data, not by the clock

Until 2026-10-22 nothing ever started a training run on its own: every model in the
database exists because a person asked for it.

`src/workers/scheduler.py` closes that. It deliberately does **not** retrain on a
schedule — a nightly retrain of an unchanged dataset burns 10–30 minutes of MCMC to
reproduce the model you already had, and buries the runs that mattered among hundreds
that did not. It watches for *new data* instead, and enqueues training only when a
project's dataset fingerprint moves.

Fingerprinting costs one Storage `list()` per project and **no downloads**: Supabase
exposes each object's `eTag`, which is the md5 of its contents (verified against
`download()` for all three dataset files). Polling every few minutes is therefore cheap.

```bash
# worker with embedded beat — one process does both
MMM_WATCH_PROJECTS=<uuid>[,<uuid>…] npm run worker:watch
```

| guard | behaviour |
|---|---|
| `MMM_WATCH_PROJECTS` empty (default) | does nothing at all — **the demo cannot be retrained by accident** |
| project seen for the first time | records a baseline, enqueues **nothing**; fires on the *next* change |
| dataset unchanged | nothing |
| a run already queued/running | deferred, fingerprint left pending so the next poll retries |
| dataset unreadable | skipped — **not** treated as unchanged, and never adopted as the baseline |
| run record could not be created | fingerprint not advanced, so the change stays pending |
| one project fails | the others still run |

The fingerprint advances **only after** work is actually queued; advancing it earlier
would remember a failure as "handled" and the change would never be retried.
`has_active_run` answers True when it cannot tell, because refusing to enqueue is the safe
failure — two PyMC5 runs on one machine is not.

Interval is `MMM_WATCH_INTERVAL_SECONDS` (default 900). The run records why it fired in
`mmm_runs.dataset_info` (`trigger: dataset_changed` plus the per-file eTags).


## Model approval — a gate that binds

`approve_mmm_model` refuses a model whose evidence says no. Before 2026-10-21 it did two
things wrong: it joined `company_members.company_id = mmm_models.project_id`, but `project_id`
is a **brands.id**, so the join never matched and approval was impossible for everyone (142
models, 0 approved, 0 approval records); and the governance verdict the pipeline computed was
read by nothing.

**Blocking conditions** — missing evidence counts as failure, not as a pass:

| condition | blocked |
|---|---|
| no `model_config.governance` | yes — 129 of 142 existing models, all legacy |
| `governance.passed` ≠ true | yes |
| holdout present and `trustworthy` ≠ true | yes |
| holdout present and `selection_independent` = false | yes — the score is a selected maximum |
| holdout present, a non-default `spec_search`, and `selection_independent` unrecorded | yes — can't confirm the periods were withheld |
| holdout present and `skill_vs_naive` ≤ 0 | yes |
| no holdout at all | allowed — `MMM_HOLDOUT_PERIODS` defaults to 0 |

Independence is checked **before** the score is read, because binding on a number the
model's own form was selected by is circular — see *Specification search*. Legacy holdout
models are unaffected: with no `spec_search` output there was no selection to contaminate
them, and they are judged exactly as before.

Holdout evidence is optional but **binding when present**. Pass `override_reason` to approve
anyway; the override and the blockers it bypassed are recorded in `model_approvals.evidence`.

```bash
GET  /models/{model_id}/gate-status          # would it pass, and why not — changes nothing
POST /models/{model_id}/approve              # 409 + blockers when the gate refuses
POST /models/{model_id}/approve?override_reason=...
```

> Approval needs a **signed-in admin** of the model's company. A service-role token gets 403 —
> `auth.uid()` is null for it, and the DB check is deliberately a second layer behind
> `authorize_project`. Automation cannot self-approve.

## Out-of-sample validation

**Every `fit_metrics` number is in-sample.** `r2`, `mape`, `rmse` and `bayesian_r2` all describe
how well the model reproduces the periods it was fitted to. They say nothing about whether a
specification generalises, and an agent that searches specifications while scoring itself
in-sample will converge on overfitting, because that is what in-sample scoring rewards.

`MMM_HOLDOUT_PERIODS=N` (default `0`) holds out the last N periods, fits a **second** model on
the remainder, and scores it on periods it never saw. The production model still trains on
everything, so all 13 existing outputs are byte-identical to a run with the flag unset — verified.
Results land in a new `holdout_metrics` output.

Two fields qualify every number in it, and the approval gate blocks on both: `trustworthy`
(the NumPy forward pass still mirrors PyMC) and `selection_independent` (these periods were
withheld from the specification search). A score can be perfectly computed and still not be
evidence — see *Specification search*.

Read `skill_vs_naive` first: it is `1 - rmse/rmse_of_predicting_the_training_mean`. At or below
zero the model carries no out-of-sample information whatever its r² says. `coverage_90` is the
share of actuals falling inside the 90% predictive interval — well under 0.9 means the model is
overconfident. On the 33-month dovato data with `N=6`: skill `+0.065`, coverage `0.50`.

### Rolling-origin backtesting — paired, and with an interval

`MMM_HOLDOUT_PERIODS=6` gives one number from one fit, computed on **six observations**
(`n_holdout × G × SB` = 6 × 1 × 1 on dovato). The sampling sd of `skill_vs_naive` on six
points is about **0.26**, against a `min_improvement` of **0.01** — four hundredths of one
standard deviation. The search was comparing specifications with an instrument that cannot
resolve differences forty times larger than the one it claimed to detect, and no amount of
threshold tuning fixes that.

`MMM_BACKTEST_ORIGINS=N` fits once per origin instead: train on `[0, o)`, forecast
`[o, o+horizon)`, step forward. Two things follow, and the second matters more:

- **More points.** Twelve origins at horizon 1 give twelve genuine out-of-sample forecasts
  from twelve fits, each one a model forecasting a period it never saw.
- **Pairing.** Every candidate is scored on the *same* (origin, period, geo, sub-brand)
  forecasts, so the comparison is made point by point. Most of the noise in a skill score
  is shared between two specifications that saw the same data — it is the periods that
  were hard, not the specification — and differencing removes it. Unlike the unpaired
  figure, the paired noise shrinks as origins are added.

So the search's decision rule is no longer a threshold on a difference. A candidate wins
only when the **90% bootstrap interval on the paired gain clears zero** *and* the gain
exceeds `MMM_SEARCH_MIN_IMPROVEMENT`. Clearing noise is necessary; complexity still has to
earn itself. The interval is resampled over **origins, not points** — forecasts from one
fitted model share that model's luck, so bootstrapping over points reports an interval
several times too narrow.

| | referee | fits per candidate | decision rule |
|---|---|---|---|
| default | `single_holdout` | 1 | gain > `min_improvement` |
| `MMM_BACKTEST_ORIGINS=N` | `rolling_origin` | N | interval clears zero **and** gain > `min_improvement` |

**Cost is the honest trade.** `MMM_SEARCH_MAX_FITS` is a budget in *fits*, so the rolling
referee divides it by the origin count to get the candidate budget; a budget that cannot
afford the default plus one candidate is **refused**, not silently shrunk. 12 origins ×
~15 candidates is 180 fits where the old loop paid 15. That buys resolution no candidate
count can: 12 paired points beats 6 unpaired ones, and 200 candidates on 6 unpaired points
beats nothing.

`backtest_metrics` reports the production specification the same way, with its origins
chosen so every forecast target falls inside the window withheld from the search — so it
is independent evidence by construction. It carries `coverage_90_predictive` (includes
`sigma`) alongside `coverage_90_mu`; the latter is what `holdout_metrics.coverage_90` has
always been, and it omits observation noise entirely, so the two are not interchangeable.

> Scoring needs a forward pass outside PyMC, because adstock is a recursive scan whose length is
> compiled into the graph. `src/validation/holdout.py` reimplements the model's deterministic
> forward computation in NumPy and carries adstock across the train/test boundary.
> `verify_forward_model()` recomputes `mu` for the training window and checks it against the
> trace's own `mu` (matches to ~1e-16). **If you change the forward model in `pymc_mmm.py`, mirror
> it in `holdout.py`** — otherwise that check fails and `holdout_metrics.trustworthy` goes false.

## Client demo — what must not drift

A pharma-brand demo (dovato, 33 months, 2023-01 → 2025-09) is being shown to a prospective
client. **The client has no Admin Panel access** — they see the dashboard, AI chat and voice only.

**What the client-facing surface actually depends on:**

| Surface | Backend |
|---|---|
| Dashboard metric cards | Supabase tables, direct |
| Model performance / ROI | Supabase `mmm_model_outputs`, direct |
| AI chat, voice | Supabase Edge Functions (`orchestrator`, `voice-assistant`) |

**Nothing the client touches goes through FastAPI** — it's needed only for training and
optimization, both Admin-only. The demo therefore runs on Supabase + Vercel alone.

**The pinned model:** `83e46e03-051f-4bb7-9854-6a0385439ee0` (trained 2026-10-16),
r² 0.398 / MAPE 0.2326 / RMSE 5225.4716. The dashboard reads the **newest**
`mmm_model_outputs` row by `generated_at`, so a retrain *shadows* this model rather than
replacing it. Two guards:

- `MMM_UPSAMPLE_MONTHLY=1` in `.env` makes an accidental retrain reproduce the fit bit-identically
- `backups/demo-model-83e46e03.json` is a full snapshot (all 13 output types + the `mmm_models` row)

```bash
python scripts/restore-demo-model.py --check     # is the demo model still the one on screen?
python scripts/restore-demo-model.py --restore   # put the snapshotted rows back
```

> `project_id` must be a UUID. `FarmaMetrics` passed `'1'` until 2026-10-19, which Postgres
> rejected with `22P02 invalid input syntax for type uuid` on every poll — the dashboard showed
> no model metrics at all rather than erroring visibly. Use `DEMO_PROJECT_ID` from
> `src/constants/project.ts`; `isValidProjectId()` now guards both query paths.

## Supabase Project
- Project ref: `thpnkluejymycxmiavjp`
- Region: AWS eu-central-1
- RLS is enabled — all queries are tenant-scoped via `company_id`

## Design System
- Dark mode primary with glassmorphism (frosted glass, neon accents)
- Brand colors: cyan (#06b6d4), blue (#3b82f6), purple (#8b5cf6)
- Bauhaus-inspired card variants available (`bauhaus-card.tsx`, `bauhaus-border.tsx`)
- Animations via Framer Motion — keep consistent with existing patterns
