# Rollout & QA Checklist — Orchestrator Migration

## Pre-rollout: DB migrations
- [ ] Run `20260521000000_conversations_messages.sql` — verify `chats` + `messages` tables exist with RLS
- [ ] Run `20260521000001_agent_invocations.sql` — verify `agent_invocations` table exists
- [ ] Run `20260521000002_feature_flags.sql` — verify `feature_flags` table seeded with both rows
- [ ] Run `20260521000003_monitoring_views.sql` — verify 4 views queryable by authenticated users
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is set in Edge Function secrets (needed for invocation logging)

## Pre-rollout: Edge Function deploys
- [ ] Deploy `orchestrator` — POST a test chat message, confirm `{ response: "..." }` returned
- [ ] Deploy `orchestrator-stream` — POST a test chat message, confirm SSE token stream received
- [ ] Deploy `orchestrator-stream` voice — POST base64 audio, confirm `transcript` + `audio_chunk` events arrive
- [ ] Legacy `ai-assistant` still deployed (revert target) — confirm it still responds

## Feature flag state before rollout
```
orchestrator_v2:        enabled=true,  rollout_pct=100   ← non-streaming path, everyone
streaming_orchestrator: enabled=false, rollout_pct=0     ← streaming path, nobody yet
```

## Phase 1 — Internal QA (rollout_pct = 0, test company only)
- [ ] Set `streaming_orchestrator` → `enabled=true, rollout_pct=100, company_ids=[<test_company_id>]`
- [ ] Chat: send 5 test messages, verify text streams token by token
- [ ] Chat: send a message that returns a `report` type — verify structured view renders after stream ends
- [ ] Chat: send a message that returns a `card` type — verify card renders correctly
- [ ] Voice: record a pharma question, verify transcript appears before audio plays
- [ ] Voice: verify response text streams while audio assembles
- [ ] Voice: verify audio plays after stream completes
- [ ] Check `agent_invocations` table — confirm rows written with `correlation_id`, `ttft_ms`, `latency_ms`, tokens
- [ ] Confirm `v_recent_errors` view shows no errors for the test session

## Phase 2 — 25% rollout
- [ ] Set `streaming_orchestrator` → `rollout_pct=25, company_ids=null`
- [ ] Monitor `v_invocation_error_rate_hourly` — error_pct must stay < 2%
- [ ] Monitor `v_invocation_latency_p50_p95` — p95 latency must not regress vs. baseline
- [ ] Check browser console for any SSE parsing errors (look for "Stream failed" warnings)
- [ ] Run for 24h before proceeding

## Phase 3 — 100% rollout
- [ ] Set `streaming_orchestrator` → `rollout_pct=100`
- [ ] Monitor for 48h
- [ ] Verify `v_daily_token_spend` is not unexpectedly elevated

## Revert procedure (< 5 min)
```sql
-- Disable streaming for everyone immediately:
update public.feature_flags
set enabled = false, rollout_pct = 0, updated_at = now()
where key = 'streaming_orchestrator';

-- If orchestrator itself is broken, disable orchestrator_v2 too — hooks fall back to legacy:
update public.feature_flags
set enabled = false, updated_at = now()
where key = 'orchestrator_v2';
```
Legacy `ai-assistant` and `voice-assistant` functions remain deployed and will handle traffic automatically via the fallback chain in `useAIAssistant` / `useVoiceAssistant`.

## Monitoring queries (run in Supabase SQL editor)
```sql
-- Error rate last hour
select * from v_invocation_error_rate_hourly limit 10;

-- Latency percentiles
select * from v_invocation_latency_p50_p95;

-- Token spend today
select * from v_daily_token_spend where day = current_date;

-- Recent errors
select created_at, modality, function_name, error_code, error_message
from v_recent_errors limit 20;
```
