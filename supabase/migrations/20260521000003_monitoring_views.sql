-- Milestone 6: Monitoring views over agent_invocations.
-- These power the admin dashboard + alerting queries.

-- 1) Hourly error rate per modality (last 24 h)
create or replace view public.v_invocation_error_rate_hourly as
select
  date_trunc('hour', created_at)                       as hour,
  modality,
  count(*)                                              as total,
  count(*) filter (where status = 'error')              as errors,
  round(
    100.0 * count(*) filter (where status = 'error')
    / nullif(count(*), 0), 2
  )                                                     as error_pct
from public.agent_invocations
where created_at >= now() - interval '24 hours'
group by 1, 2
order by 1 desc, 2;

-- 2) Latency percentiles per function (last 7 days)
create or replace view public.v_invocation_latency_p50_p95 as
select
  function_name,
  modality,
  count(*)                                              as total_calls,
  round(avg(latency_ms))                                as avg_ms,
  percentile_cont(0.5) within group (order by latency_ms)  as p50_ms,
  percentile_cont(0.95) within group (order by latency_ms) as p95_ms,
  round(avg(ttft_ms))                                   as avg_ttft_ms
from public.agent_invocations
where
  created_at >= now() - interval '7 days'
  and latency_ms is not null
group by 1, 2
order by 3 desc;

-- 3) Daily token spend (last 30 days)
create or replace view public.v_daily_token_spend as
select
  date_trunc('day', created_at)   as day,
  modality,
  sum(total_tokens)               as tokens,
  count(*)                        as calls,
  round(avg(total_tokens))        as avg_tokens_per_call
from public.agent_invocations
where created_at >= now() - interval '30 days'
group by 1, 2
order by 1 desc, 2;

-- 4) Recent errors (last 100, for alerting triage)
create or replace view public.v_recent_errors as
select
  id,
  created_at,
  correlation_id,
  user_id,
  company_id,
  modality,
  function_name,
  model_name,
  error_code,
  error_message,
  latency_ms
from public.agent_invocations
where status = 'error'
order by created_at desc
limit 100;

-- Grant read access to authenticated users (admin dashboard reads these)
grant select on public.v_invocation_error_rate_hourly  to authenticated;
grant select on public.v_invocation_latency_p50_p95    to authenticated;
grant select on public.v_daily_token_spend             to authenticated;
grant select on public.v_recent_errors                 to authenticated;
