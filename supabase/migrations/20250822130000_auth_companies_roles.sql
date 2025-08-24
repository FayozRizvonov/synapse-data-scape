-- Companies and membership model + basic RLS
-- 1) Companies catalog (managed by backend/admins)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.companies enable row level security;

-- Authenticated users can read companies to pick during signup
create policy if not exists companies_select_authenticated
on public.companies
for select
to authenticated
using (true);

-- 2) Company members (user-to-company with role)
create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, company_id)
);

alter table public.company_members enable row level security;

-- Read: user can read own row; company admins can read all rows for their company
create policy if not exists company_members_select_self
on public.company_members
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.company_members cm2
    where cm2.company_id = company_members.company_id
      and cm2.user_id = auth.uid()
      and cm2.role = 'admin'
  )
);

-- Update: only admins of the same company can update
create policy if not exists company_members_update_admin
on public.company_members
for update
to authenticated
using (
  exists (
    select 1 from public.company_members cm2
    where cm2.company_id = company_members.company_id
      and cm2.user_id = auth.uid()
      and cm2.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.company_members cm2
    where cm2.company_id = company_members.company_id
      and cm2.user_id = auth.uid()
      and cm2.role = 'admin'
  )
);

-- Insert rows for members happen via trigger below (service role bypasses RLS)

-- 3) Ensure user_roles is readable by the owner to avoid 406s
alter table if exists public.user_roles enable row level security;

create policy if not exists user_roles_select_self
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());

-- 4) Trigger: on new auth user, copy metadata role and company into tables
create or replace function public.handle_new_user_with_company()
returns trigger as $$
declare
  v_role text;
  v_company uuid;
begin
  v_role := coalesce((new.raw_user_meta_data ->> 'role'), 'commercial');
  -- never allow self-assign admin on signup
  if v_role = 'admin' then
    v_role := 'commercial';
  end if;

  begin
    v_company := (new.raw_user_meta_data ->> 'company_id')::uuid;
  exception when others then
    v_company := null;
  end;

  -- optional: only insert company_members if company provided
  if v_company is not null then
    insert into public.company_members (user_id, company_id, role)
    values (new.id, v_company, v_role);
  end if;

  -- keep user_roles table for backwards compatibility
  insert into public.user_roles (user_id, role)
  values (new.id, v_role)
  on conflict (id) do nothing;

  -- profiles email copy (if profiles table exists)
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created_with_company on auth.users;
create trigger on_auth_user_created_with_company
  after insert on auth.users
  for each row execute function public.handle_new_user_with_company();



