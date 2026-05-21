-- Company Brain: tenant-scoped knowledge (brand, TA, market, strategy, pricing, etc.)
-- v1: text content + domain + draft/approved; optional brand_id (no FK — brands table may be app-only in some envs)

create table if not exists public.company_brain_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  brand_id uuid,
  domain text not null check (domain in (
    'brand',
    'therapeutic_area',
    'market',
    'strategy',
    'pricing',
    'other'
  )),
  title text not null,
  content text not null,
  status text not null default 'draft' check (status in ('draft', 'approved')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_company_brain_entries_company
  on public.company_brain_entries(company_id);

create index if not exists idx_company_brain_entries_company_status
  on public.company_brain_entries(company_id, status);

drop trigger if exists trg_company_brain_entries_updated_at on public.company_brain_entries;
create trigger trg_company_brain_entries_updated_at
  before update on public.company_brain_entries
  for each row
  execute function public.update_updated_at_column();

alter table public.company_brain_entries enable row level security;

-- Members of the company can read all brain rows for that company
drop policy if exists company_brain_entries_select_member on public.company_brain_entries;
create policy company_brain_entries_select_member
on public.company_brain_entries
for select
to authenticated
using (
  exists (
    select 1 from public.company_members cm
    where cm.company_id = company_brain_entries.company_id
      and cm.user_id = auth.uid()
  )
);

-- Members can insert rows (e.g. feedback / draft knowledge)
drop policy if exists company_brain_entries_insert_member on public.company_brain_entries;
create policy company_brain_entries_insert_member
on public.company_brain_entries
for insert
to authenticated
with check (
  exists (
    select 1 from public.company_members cm
    where cm.company_id = company_brain_entries.company_id
      and cm.user_id = auth.uid()
  )
);

-- Only company admins can update (e.g. approve / edit)
drop policy if exists company_brain_entries_update_admin on public.company_brain_entries;
create policy company_brain_entries_update_admin
on public.company_brain_entries
for update
to authenticated
using (
  exists (
    select 1 from public.company_members cm
    where cm.company_id = company_brain_entries.company_id
      and cm.user_id = auth.uid()
      and cm.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.company_members cm
    where cm.company_id = company_brain_entries.company_id
      and cm.user_id = auth.uid()
      and cm.role = 'admin'
  )
);

-- Only company admins can delete
drop policy if exists company_brain_entries_delete_admin on public.company_brain_entries;
create policy company_brain_entries_delete_admin
on public.company_brain_entries
for delete
to authenticated
using (
  exists (
    select 1 from public.company_members cm
    where cm.company_id = company_brain_entries.company_id
      and cm.user_id = auth.uid()
      and cm.role = 'admin'
  )
);
