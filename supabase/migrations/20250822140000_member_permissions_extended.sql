-- Extend member_permissions with fine-grained feature access toggles
-- Safe to run multiple times thanks to IF NOT EXISTS

alter table public.member_permissions
  add column if not exists can_marketing_optimization_recommendations boolean not null default true,
  add column if not exists can_key_metrics boolean not null default true,
  add column if not exists can_channel_impact boolean not null default true,
  add column if not exists can_model_performance_stats boolean not null default true,
  add column if not exists can_sales_volume_breakdown boolean not null default true,
  add column if not exists can_scenario_comparison boolean not null default true,
  add column if not exists can_dynamic_strategy_simulator boolean not null default true,
  add column if not exists can_diminishing_return_curves boolean not null default true,
  add column if not exists can_campaign_management boolean not null default true,
  add column if not exists can_omnichannel_journey boolean not null default true;

-- Backfill NULLs to defaults for existing rows (in case columns were added without default applied historically)
update public.member_permissions set
  can_marketing_optimization_recommendations = coalesce(can_marketing_optimization_recommendations, true),
  can_key_metrics = coalesce(can_key_metrics, true),
  can_channel_impact = coalesce(can_channel_impact, true),
  can_model_performance_stats = coalesce(can_model_performance_stats, true),
  can_sales_volume_breakdown = coalesce(can_sales_volume_breakdown, true),
  can_scenario_comparison = coalesce(can_scenario_comparison, true),
  can_dynamic_strategy_simulator = coalesce(can_dynamic_strategy_simulator, true),
  can_diminishing_return_curves = coalesce(can_diminishing_return_curves, true),
  can_campaign_management = coalesce(can_campaign_management, true),
  can_omnichannel_journey = coalesce(can_omnichannel_journey, true);


