-- Milestone 1: Versioned migrations for conversations (chats) + messages
-- These tables may already exist in the DB; this migration is idempotent.

-- 1) Conversations table (was: chats)
create table if not exists public.chats (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  title       text        not null default 'New chat',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.chats enable row level security;

create policy if not exists chats_select_owner
  on public.chats for select to authenticated
  using (user_id = auth.uid());

create policy if not exists chats_insert_owner
  on public.chats for insert to authenticated
  with check (user_id = auth.uid());

create policy if not exists chats_update_owner
  on public.chats for update to authenticated
  using (user_id = auth.uid());

create policy if not exists chats_delete_owner
  on public.chats for delete to authenticated
  using (user_id = auth.uid());

-- Auto-update updated_at on any row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists chats_set_updated_at on public.chats;
create trigger chats_set_updated_at
  before update on public.chats
  for each row execute function public.set_updated_at();


-- 2) Messages table
create table if not exists public.messages (
  id          uuid        primary key default gen_random_uuid(),
  chat_id     uuid        not null references public.chats(id) on delete cascade,
  sender      text        not null check (sender in ('user', 'ai')),
  content     text        not null,
  structured  jsonb,
  created_at  timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Users can only access messages for their own chats
create policy if not exists messages_select_owner
  on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
        and chats.user_id = auth.uid()
    )
  );

create policy if not exists messages_insert_owner
  on public.messages for insert to authenticated
  with check (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
        and chats.user_id = auth.uid()
    )
  );

create policy if not exists messages_delete_owner
  on public.messages for delete to authenticated
  using (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
        and chats.user_id = auth.uid()
    )
  );

-- Indexes for common query patterns
create index if not exists messages_chat_id_created_at_idx
  on public.messages (chat_id, created_at asc);
