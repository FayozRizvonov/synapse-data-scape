-- Fix: admin member listing should include email
-- Fix: approval should ensure permissions row exists + set expected defaults

-- 1) Replace list_company_members() to include email from profiles
drop function if exists public.list_company_members();

create or replace function public.list_company_members()
returns table (
  id uuid,
  user_id uuid,
  company_id uuid,
  role public.app_role,
  status public.member_status,
  created_at timestamptz,
  email text
)
language sql
security definer
set search_path = public
as $$
  select
    cm.id,
    cm.user_id,
    cm.company_id,
    cm.role,
    cm.status,
    cm.created_at,
    p.email
  from public.company_members cm
  left join public.profiles p on p.id = cm.user_id
  where exists (
    select 1
    from public.company_members a
    where a.company_id = cm.company_id
      and a.user_id = auth.uid()
      and a.role = 'admin'
  )
  order by cm.created_at desc;
$$;

grant execute on function public.list_company_members() to authenticated;

-- 2) Harden admin_approve_member():
-- - ensure member_permissions row exists
-- - set defaults that match the "standard user" UI expectations
create or replace function public.admin_approve_member(p_member uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
begin
  -- Verify member exists and get company
  select company_id into v_company from public.company_members where id = p_member;
  if v_company is null then
    raise exception 'member not found';
  end if;

  -- Verify caller is admin of same company
  if not exists (
    select 1 from public.company_members a
    where a.company_id = v_company and a.user_id = auth.uid() and a.role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;

  if p_approve then
    update public.company_members set status = 'active' where id = p_member;

    -- Ensure permissions row exists, then set defaults
    insert into public.member_permissions (member_id)
    values (p_member)
    on conflict (member_id) do nothing;

    update public.member_permissions
      set
        -- expected baseline access for standard users:
        can_ai_insights = true,
        can_pharma_sm = true,
        can_history = true,
        can_profile = true,
        can_settings = true,
        -- extended features:
        can_marketing_optimization_recommendations = true,
        can_key_metrics = true,
        can_channel_impact = true,
        can_model_performance_stats = true,
        can_sales_volume_breakdown = true,
        can_scenario_comparison = true,
        can_dynamic_strategy_simulator = true,
        can_diminishing_return_curves = true,
        can_campaign_management = true,
        can_omnichannel_journey = true
      where member_id = p_member;
  else
    update public.company_members set status = 'declined' where id = p_member;
  end if;
end;
$$;

grant execute on function public.admin_approve_member(uuid, boolean) to authenticated;

