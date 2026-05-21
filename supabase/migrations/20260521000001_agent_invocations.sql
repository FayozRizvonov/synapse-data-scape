-- Milestone 1: agent_invocations — logs every AI model call
-- Captures: modality, model, tokens, latency, errors, correlation IDs.

create table if not exists public.agent_invocations (
  id               uuid        primary key default gen_random_uuid(),

  -- Correlation
  correlation_id   uuid        not null default gen_random_uuid(),
  chat_id          uuid        references public.chats(id) on delete set null,
  message_id       uuid        references public.messages(id) on delete set null,

  -- Who + tenant scoping
  user_id          uuid        not null references auth.users(id) on delete cascade,
  company_id       uuid        references public.companies(id) on delete set null,
  brand_id         uuid,

  -- What was called
  modality         text        not null check (modality in ('chat', 'voice')),
  function_name    text        not null,  -- e.g. 'ai-assistant', 'voice-assistant', 'orchestrator'
  model_name       text,                  -- e.g. 'gpt-4o', 'whisper-1', 'tts-1'
  persona          text,                  -- user role at time of call

  -- Outcome
  status           text        not null default 'success'
                               check (status in ('success', 'error', 'timeout')),
  error_code       text,
  error_message    text,

  -- Token usage
  input_tokens     integer,
  output_tokens    integer,
  total_tokens     integer generated always as (
                     coalesce(input_tokens, 0) + coalesce(output_tokens, 0)
                   ) stored,

  -- Latency
  latency_ms       integer,               -- total end-to-end ms
  ttft_ms          integer,               -- time-to-first-token (streaming only)

  -- Payload refs (store refs, not full payloads, to keep the table lean)
  request_ref      jsonb,                 -- small metadata only (e.g. message length, kb_size)
  response_ref     jsonb,                 -- small metadata only (e.g. response length, had_card)

  created_at       timestamptz not null default now()
);

alter table public.agent_invocations enable row level security;

-- Users can read their own invocation logs
create policy if not exists agent_invocations_select_owner
  on public.agent_invocations for select to authenticated
  using (user_id = auth.uid());

-- Company admins can read all logs for their company
create policy if not exists agent_invocations_select_admin
  on public.agent_invocations for select to authenticated
  using (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = agent_invocations.company_id
        and cm.user_id = auth.uid()
        and cm.role = 'admin'
    )
  );

-- Only Edge Functions (service role) insert invocation logs — no client inserts
create policy if not exists agent_invocations_insert_service
  on public.agent_invocations for insert to service_role
  with check (true);

-- Indexes for analytics queries
create index if not exists agent_invocations_user_id_idx
  on public.agent_invocations (user_id, created_at desc);

create index if not exists agent_invocations_company_id_idx
  on public.agent_invocations (company_id, created_at desc);

create index if not exists agent_invocations_correlation_id_idx
  on public.agent_invocations (correlation_id);

create index if not exists agent_invocations_modality_status_idx
  on public.agent_invocations (modality, status, created_at desc);
