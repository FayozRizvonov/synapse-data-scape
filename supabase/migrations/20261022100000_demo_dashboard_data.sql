-- Move the demo's scenario figures out of the frontend bundle and into the database.
--
-- ScenarioComparison.tsx held 121 hardcoded numbers with no backend call. Because
-- nothing forced them to agree, they didn't:
--
--   * Total Spend read $265K; the real quarterly spend is $1.2M
--   * the bar chart showed Sales as 1200 while the table showed 21.3M — two scales
--   * Total Sales baseline was '21.3' with no unit, beside '24.5M'
--   * the current spend split summed to 99%, drawn as a pie chart
--   * Overall ROI (2.7x) was neither sales/spend (4.53) nor the spend-weighted
--     average of the per-channel ROIs (2.575)
--   * the 4th channel was "Other" in the split and "Web Virtual Calls" in the table
--
-- The figures are now reconciled on one story and seeded here. They are presentation
-- data for the client demo, deliberately NOT in mmm_model_outputs: those are real model
-- outputs and hand-authored demo numbers sitting beside them would eventually be read as
-- model results.
--
-- The story (Option C, agreed 2026-10-22): ROI is INCREMENTAL — media-driven sales per
-- dollar of media spend — so total = base + media, where media = spend x incremental ROI.
-- That keeps every headline the demo already used (21.3 / 24.5 / 19.17, 2.7 / 2.9 / 2.4),
-- corrects the spend to $1.2M, and puts media at 13.5-16.3% of sales, which is credible
-- for pharma. Channel ROIs were nudged by <=0.2 so they weight to the overall ROI.

create table if not exists public.demo_dashboard_data (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null,
  key         text not null,
  payload     jsonb not null,
  updated_at  timestamptz not null default now(),
  unique (project_id, key)
);

comment on table public.demo_dashboard_data is
  'Hand-authored presentation data for the client demo, keyed by project and section. '
  'NOT model output — see mmm_model_outputs for that.';

alter table public.demo_dashboard_data enable row level security;

-- The demo dashboard reads anonymously, exactly as it does for mmm_model_outputs.
-- These are illustrative figures with nothing confidential in them.
drop policy if exists demo_dashboard_data_select_public on public.demo_dashboard_data;
create policy demo_dashboard_data_select_public
  on public.demo_dashboard_data
  for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- seed
-- ---------------------------------------------------------------------------

insert into public.demo_dashboard_data (project_id, key, payload) values
('550e8400-e29b-41d4-a716-446655440000', 'scenario_comparison', '{
  "currency": "USD",
  "unit": "millions",
  "roi_basis": "incremental",
  "roi_label": "Incremental ROI",
  "note": "Incremental ROI is media-driven sales per dollar of media spend. Total sales = base (non-media) + media-driven.",
  "scenarios": [
    {"key": "baseline",    "label": "Baseline",    "sort": 1,
     "total_sales_m": 21.30, "base_sales_m": 18.06, "media_sales_m": 3.24,
     "total_spend_m": 1.20, "incremental_roi": 2.7, "profit_margin_pct": 18,
     "channel_roi": {"SF Calls": 2.5, "Digital": 3.3, "1-to-1 Email": 2.2, "Web Virtual Calls": 2.6}},
    {"key": "optimistic",  "label": "Optimistic",  "sort": 2,
     "total_sales_m": 24.50, "base_sales_m": 20.50, "media_sales_m": 4.00,
     "total_spend_m": 1.38, "incremental_roi": 2.9, "profit_margin_pct": 21,
     "channel_roi": {"SF Calls": 2.6, "Digital": 3.5, "1-to-1 Email": 2.3, "Web Virtual Calls": 2.9}},
    {"key": "pessimistic", "label": "Pessimistic", "sort": 3,
     "total_sales_m": 19.17, "base_sales_m": 16.58, "media_sales_m": 2.59,
     "total_spend_m": 1.08, "incremental_roi": 2.4, "profit_margin_pct": 15,
     "channel_roi": {"SF Calls": 2.2, "Digital": 3.0, "1-to-1 Email": 2.0, "Web Virtual Calls": 2.1}}
  ]
}'::jsonb),

('550e8400-e29b-41d4-a716-446655440000', 'spend_allocation', '{
  "currency": "USD",
  "budget_m": 1.20,
  "note": "Same budget, reallocated — this is the optimisation story.",
  "channels": [
    {"name": "SF Calls",          "current_pct": 45, "optimized_pct": 50, "current_k": 540, "optimized_k": 600},
    {"name": "Digital",           "current_pct": 30, "optimized_pct": 33, "current_k": 360, "optimized_k": 396},
    {"name": "1-to-1 Email",      "current_pct": 15, "optimized_pct": 10, "current_k": 180, "optimized_k": 120},
    {"name": "Web Virtual Calls", "current_pct": 10, "optimized_pct": 7,  "current_k": 120, "optimized_k": 84}
  ]
}'::jsonb),

('550e8400-e29b-41d4-a716-446655440000', 'sales_forecast', '{
  "unit": "millions",
  "currency": "USD",
  "note": "Actuals stop at Jun; forecasts run Jul-Dec. Previously actuals continued past Jun and fell below the June value, so the line visibly collapsed mid-chart.",
  "actual_through": "Jun",
  "points": [
    {"name": "Jan", "actual": 12.0, "baseline": 12.5, "optimistic": 12.5, "pessimistic": 12.5},
    {"name": "Feb", "actual": 13.0, "baseline": 14.0, "optimistic": 14.0, "pessimistic": 14.0},
    {"name": "Mar", "actual": 14.0, "baseline": 15.5, "optimistic": 15.5, "pessimistic": 15.5},
    {"name": "Apr", "actual": 15.0, "baseline": 16.5, "optimistic": 16.5, "pessimistic": 16.5},
    {"name": "May", "actual": 16.0, "baseline": 17.0, "optimistic": 17.0, "pessimistic": 17.0},
    {"name": "Jun", "actual": 17.0, "baseline": 17.5, "optimistic": 17.5, "pessimistic": 17.5},
    {"name": "Jul", "actual": null, "baseline": 18.0, "optimistic": 20.5, "pessimistic": 17.2},
    {"name": "Aug", "actual": null, "baseline": 18.5, "optimistic": 21.5, "pessimistic": 17.0},
    {"name": "Sep", "actual": null, "baseline": 19.0, "optimistic": 22.5, "pessimistic": 16.8},
    {"name": "Oct", "actual": null, "baseline": 19.5, "optimistic": 23.5, "pessimistic": 16.5},
    {"name": "Nov", "actual": null, "baseline": 20.0, "optimistic": 24.5, "pessimistic": 16.2},
    {"name": "Dec", "actual": null, "baseline": 20.5, "optimistic": 25.5, "pessimistic": 15.9}
  ]
}'::jsonb),

('550e8400-e29b-41d4-a716-446655440000', 'roi_forecast', '{
  "roi_basis": "incremental",
  "note": "Jul matches the Baseline scenario incremental ROI of 2.7x.",
  "points": [
    {"name": "Jul", "sf_calls": 2.5, "digital": 3.3, "email": 2.2, "web_virtual": 2.6, "overall": 2.7},
    {"name": "Aug", "sf_calls": 2.5, "digital": 3.4, "email": 2.2, "web_virtual": 2.6, "overall": 2.8},
    {"name": "Sep", "sf_calls": 2.6, "digital": 3.4, "email": 2.3, "web_virtual": 2.7, "overall": 2.8},
    {"name": "Oct", "sf_calls": 2.6, "digital": 3.5, "email": 2.3, "web_virtual": 2.7, "overall": 2.9},
    {"name": "Nov", "sf_calls": 2.7, "digital": 3.5, "email": 2.4, "web_virtual": 2.8, "overall": 3.0},
    {"name": "Dec", "sf_calls": 2.7, "digital": 3.6, "email": 2.4, "web_virtual": 2.8, "overall": 3.0}
  ]
}'::jsonb)

on conflict (project_id, key) do update
  set payload = excluded.payload,
      updated_at = now();
