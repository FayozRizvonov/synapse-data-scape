-- Admin RPC to set a single permission flag safely
create or replace function public.admin_set_permission(
  p_member_id uuid,
  p_field text,
  p_value boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_sql text;
begin
  -- Ensure caller is admin of same company
  select company_id into v_company from public.company_members where id = p_member_id;
  if v_company is null then
    raise exception 'member not found';
  end if;
  if not exists (
    select 1 from public.company_members a
    where a.company_id = v_company and a.user_id = auth.uid() and a.role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;

  -- Validate field name against whitelist
  if p_field not in (
    'can_ai_insights','can_pharma_sm','can_history','can_profile','can_settings',
    'can_marketing_optimization_recommendations','can_key_metrics','can_channel_impact',
    'can_model_performance_stats','can_sales_volume_breakdown','can_scenario_comparison',
    'can_dynamic_strategy_simulator','can_diminishing_return_curves','can_campaign_management',
    'can_omnichannel_journey'
  ) then
    raise exception 'invalid field';
  end if;

  -- Ensure row exists
  insert into public.member_permissions (member_id)
  values (p_member_id)
  on conflict (member_id) do nothing;

  -- Build dynamic SQL to update the chosen column
  v_sql := format('update public.member_permissions set %I = $1 where member_id = $2', p_field);
  execute v_sql using p_value, p_member_id;
end;
$$;


