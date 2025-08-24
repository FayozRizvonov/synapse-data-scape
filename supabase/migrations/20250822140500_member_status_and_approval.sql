-- Add membership status for approval workflow
do $$ begin
  create type public.member_status as enum ('pending','active','declined');
exception when duplicate_object then null; end $$;

alter table public.company_members
  add column if not exists status public.member_status not null default 'pending';

-- Backfill existing rows to active
update public.company_members set status = 'active' where status is null;

-- Ensure signup trigger inserts pending status
create or replace function public.handle_new_user_with_company()
returns trigger as $$
declare
  v_role text;
  v_company uuid;
begin
  v_role := coalesce((new.raw_user_meta_data ->> 'role'), 'commercial');
  if v_role = 'admin' then
    v_role := 'commercial';
  end if;

  begin
    v_company := (new.raw_user_meta_data ->> 'company_id')::uuid;
  exception when others then
    v_company := null;
  end;

  if v_company is not null then
    insert into public.company_members (user_id, company_id, role, status)
    values (new.id, v_company, v_role, 'pending');
  end if;

  insert into public.user_roles (user_id, role)
  values (new.id, v_role)
  on conflict (id) do nothing;

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

-- RPC for company admins to approve/decline a pending member and set default permissions
create or replace function public.admin_approve_member(p_member uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
begin
  -- Verify caller is admin of same company
  select company_id into v_company from public.company_members where id = p_member;
  if not exists (
    select 1 from public.company_members a
    where a.company_id = v_company and a.user_id = auth.uid() and a.role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;

  if p_approve then
    update public.company_members set status = 'active' where id = p_member;
    -- Defaults for non-admins:
    update public.member_permissions
      set
        can_ai_insights = false,
        can_pharma_sm = true,
        can_marketing_optimization_recommendations = true,
        can_channel_impact = true,
        can_scenario_comparison = true,
        can_omnichannel_journey = true
      where member_id = p_member;
  else
    update public.company_members set status = 'declined' where id = p_member;
  end if;
end;
$$;




