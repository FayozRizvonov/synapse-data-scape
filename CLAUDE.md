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

> **`project_id` must be a UUID.** `mmm_models.project_id` and `mmm_model_outputs.project_id` are
> `uuid` columns; `mmm_runs.project_id` is `text`. A non-UUID id is now rejected at the API with 422
> — before that it passed job creation and failed only after a full training run.

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
  Monthly input is converted to weekly before modeling.
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

## Supabase Project
- Project ref: `thpnkluejymycxmiavjp`
- Region: AWS eu-central-1
- RLS is enabled — all queries are tenant-scoped via `company_id`

## Design System
- Dark mode primary with glassmorphism (frosted glass, neon accents)
- Brand colors: cyan (#06b6d4), blue (#3b82f6), purple (#8b5cf6)
- Bauhaus-inspired card variants available (`bauhaus-card.tsx`, `bauhaus-border.tsx`)
- Animations via Framer Motion — keep consistent with existing patterns
