-- Per-user permissions within a company
create table if not exists public.member_permissions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.company_members(id) on delete cascade,
  can_ai_insights boolean not null default true,
  can_pharma_sm boolean not null default true,
  can_history boolean not null default true,
  can_profile boolean not null default true,
  can_settings boolean not null default false,
  created_at timestamptz not null default now(),
  unique(member_id)
);

alter table public.member_permissions enable row level security;

-- Read own permissions
drop policy if exists member_permissions_select_self on public.member_permissions;
create policy member_permissions_select_self
on public.member_permissions
for select
to authenticated
using (
  exists (
    select 1 from public.company_members cm
    where cm.id = member_permissions.member_id
      and cm.user_id = auth.uid()
  )
);

-- Admins of the same company can read/update
drop policy if exists member_permissions_admin_rw on public.member_permissions;
create policy member_permissions_admin_rw
on public.member_permissions
for all
to authenticated
using (
  exists (
    select 1 from public.company_members admin
    join public.company_members target on target.id = member_permissions.member_id
    where admin.user_id = auth.uid()
      and admin.company_id = target.company_id
      and admin.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.company_members admin
    join public.company_members target on target.id = member_permissions.member_id
    where admin.user_id = auth.uid()
      and admin.company_id = target.company_id
      and admin.role = 'admin'
  )
);

-- Default row for each new member
create or replace function public.ensure_member_permissions()
returns trigger as $$
begin
  insert into public.member_permissions (member_id)
  values (new.id)
  on conflict (member_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_company_members_default_perms on public.company_members;
create trigger trg_company_members_default_perms
  after insert on public.company_members
  for each row execute function public.ensure_member_permissions();



