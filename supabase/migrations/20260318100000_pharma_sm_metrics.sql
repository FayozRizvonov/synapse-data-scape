-- Pharma S&M metric cards: global defaults (company_id null) + optional company/brand overrides

create table if not exists public.pharma_sm_metrics (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  brand_id uuid,
  metric_key text not null,
  card jsonb not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pharma_sm_metrics_scope_ok check (
    (company_id is null and brand_id is null)
    or (company_id is not null)
  ),
  constraint pharma_sm_metrics_brand_requires_company check (
    brand_id is null or company_id is not null
  )
);

create index if not exists idx_pharma_sm_metrics_company on public.pharma_sm_metrics(company_id);

drop trigger if exists trg_pharma_sm_metrics_updated_at on public.pharma_sm_metrics;
create trigger trg_pharma_sm_metrics_updated_at
  before update on public.pharma_sm_metrics
  for each row
  execute function public.update_updated_at_column();

-- Global: one row per metric_key
create unique index if not exists pharma_sm_metrics_global_uq
  on public.pharma_sm_metrics (metric_key)
  where company_id is null and brand_id is null;

-- Company-wide override (no brand)
create unique index if not exists pharma_sm_metrics_company_uq
  on public.pharma_sm_metrics (company_id, metric_key)
  where company_id is not null and brand_id is null;

-- Brand-specific override
create unique index if not exists pharma_sm_metrics_brand_uq
  on public.pharma_sm_metrics (company_id, brand_id, metric_key)
  where company_id is not null and brand_id is not null;

alter table public.pharma_sm_metrics enable row level security;

drop policy if exists pharma_sm_metrics_select_global on public.pharma_sm_metrics;
create policy pharma_sm_metrics_select_global
on public.pharma_sm_metrics
for select
to authenticated
using (company_id is null and brand_id is null);

drop policy if exists pharma_sm_metrics_select_member on public.pharma_sm_metrics;
create policy pharma_sm_metrics_select_member
on public.pharma_sm_metrics
for select
to authenticated
using (
  company_id is not null
  and exists (
    select 1 from public.company_members cm
    where cm.company_id = pharma_sm_metrics.company_id
      and cm.user_id = auth.uid()
  )
);

drop policy if exists pharma_sm_metrics_insert_admin on public.pharma_sm_metrics;
create policy pharma_sm_metrics_insert_admin
on public.pharma_sm_metrics
for insert
to authenticated
with check (
  company_id is not null
  and exists (
    select 1 from public.company_members cm
    where cm.company_id = pharma_sm_metrics.company_id
      and cm.user_id = auth.uid()
      and cm.role = 'admin'
  )
);

drop policy if exists pharma_sm_metrics_update_admin on public.pharma_sm_metrics;
create policy pharma_sm_metrics_update_admin
on public.pharma_sm_metrics
for update
to authenticated
using (
  company_id is not null
  and exists (
    select 1 from public.company_members cm
    where cm.company_id = pharma_sm_metrics.company_id
      and cm.user_id = auth.uid()
      and cm.role = 'admin'
  )
)
with check (
  company_id is not null
  and exists (
    select 1 from public.company_members cm
    where cm.company_id = pharma_sm_metrics.company_id
      and cm.user_id = auth.uid()
      and cm.role = 'admin'
  )
);

drop policy if exists pharma_sm_metrics_delete_admin on public.pharma_sm_metrics;
create policy pharma_sm_metrics_delete_admin
on public.pharma_sm_metrics
for delete
to authenticated
using (
  company_id is not null
  and exists (
    select 1 from public.company_members cm
    where cm.company_id = pharma_sm_metrics.company_id
      and cm.user_id = auth.uid()
      and cm.role = 'admin'
  )
);

-- Merge global + company + brand (brand wins, then company, then global)
create or replace function public.get_pharma_sm_metrics_merged(
  p_company_id uuid default null,
  p_brand_id uuid default null
)
returns table (metric_key text, card jsonb, sort_order int)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_company_id is not null then
    if not exists (
      select 1 from public.company_members cm
      where cm.user_id = auth.uid()
        and cm.company_id = p_company_id
    ) then
      raise exception 'not a member of this company';
    end if;
  end if;

  return query
  select distinct on (sub.mk)
    sub.mk,
    sub.crd,
    sub.srt
  from (
    select
      m.metric_key as mk,
      m.card as crd,
      m.sort_order as srt,
      case
        when m.brand_id is not null then 0
        when m.company_id is not null then 1
        else 2
      end as pref
    from public.pharma_sm_metrics m
    where
      (m.company_id is null and m.brand_id is null)
      or (
        p_company_id is not null
        and m.company_id = p_company_id
        and m.brand_id is null
      )
      or (
        p_company_id is not null
        and p_brand_id is not null
        and m.company_id = p_company_id
        and m.brand_id = p_brand_id
      )
  ) sub
  order by sub.mk, sub.pref asc;
end;
$$;

grant execute on function public.get_pharma_sm_metrics_merged(uuid, uuid) to authenticated;
