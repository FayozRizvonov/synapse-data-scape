# CLAIRE AI — Synapse Data Scape

## What This Project Is
CLAIRE AI is an autonomous AI-powered **Marketing Mix Modeling (MMM)** platform for pharmaceutical and CPG companies. It helps optimize marketing budgets using time-varying coefficient models (Orbit-ML DLT/KTR), Bayesian priors, and pharma-specific elasticity constraints. The platform includes a conversational AI interface, voice input, scenario comparison, and bilingual (EN/RU) insights generation.

This is the **demo version** of the **Trigma.ai platform**.

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
- Core AI agent: `claire_ai_agent.py` (PharmaMMMAgent class)
- Orbit-ML (DLT/KTR models) with linear regression fallback
- Supabase Python SDK for database operations (`supabase_client.py`)

### Database
- Supabase (PostgreSQL) with Row Level Security (RLS) for multi-tenancy
- Real-time subscriptions for chat and metrics
- Storage bucket `rawdata` for CSV datasets
- Key tables: `mmm_models`, `model_outputs`, `ui_key_metrics`, `chats`, `messages`, `company_members`, `member_permissions`, `user_roles`

## Project Structure

```
synapse-data-scape/
├── claire_ai_agent.py      # Core PharmaMMMAgent — modeling, optimization, insights
├── claire_ai_api.py        # FastAPI REST endpoints
├── supabase_client.py      # Supabase DB operations
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

## Key Backend Classes
- **`PharmaMMMAgent`** (`claire_ai_agent.py`): Main orchestrator — data ingestion, model training, budget optimization, insights generation
- **`ChannelDetector`**: Auto-detects marketing channels and maps pharma elasticity ranges
- **`OptimizerEngine`**: ROI calculation, response curves, budget allocation
- **`SupabaseMMMClient`** (`supabase_client.py`): All DB operations

## API Endpoints (backend on port 8000)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/model/train` | POST | Train MMM model |
| `/optimize/scenario` | POST | Budget optimization (TMB/TSV) |
| `/optimize/sales-force` | POST | Sales force optimization |
| `/insights/generate` | POST | Generate EN/RU insights |
| `/agent/process` | POST | Natural language prompt processing |
| `/projects/{id}/status` | GET | Project status |
| `/data/upload` | POST | Upload CSV dataset |

## Running the Project

### Frontend only
```bash
npm run dev
```

### Frontend + Backend together
```bash
npm run dev:all
```

### Backend only
```bash
.venv/bin/python -m uvicorn claire_ai_api:app --host 0.0.0.0 --port 8000
```
> Note: On Windows the script path is `.venv\Scripts\python.exe`

## Environment Variables
Copy `env_template.txt` to `.env`. Key variables:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — frontend Supabase
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — backend Supabase
- `OPENAI_API_KEY` — optional, for advanced AI features
- `DEFAULT_MODEL_TYPE` — `DLT`, `KTR`, or `LINEAR`

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
- **Fallbacks**: Orbit-ML falls back to linear regression if unavailable. Always handle gracefully.
- **Logging**: Use `loguru` logger, not `print`.
- **Configs**: Use dataclasses (`ModelConfig`, `OptimizationConfig`) for typed configuration.

### ML/Analytics
- Channel elasticity ranges are pharma-specific — don't change without business justification.
- Model types: `DLT` (default), `KTR`, `LINEAR` (fallback only)
- Optimization scenarios: `TMB` (Total Media Budget), `TSV` (Total Sales Value)
- Adstock transformation is applied before modeling — check `UtilityEngine._apply_adstock()`

## Supabase Project
- Project ref: `thpnkluejymycxmiavjp`
- Region: AWS eu-central-1
- RLS is enabled — all queries are tenant-scoped via `company_id`

## Design System
- Dark mode primary with glassmorphism (frosted glass, neon accents)
- Brand colors: cyan (#06b6d4), blue (#3b82f6), purple (#8b5cf6)
- Bauhaus-inspired card variants available (`bauhaus-card.tsx`, `bauhaus-border.tsx`)
- Animations via Framer Motion — keep consistent with existing patterns
