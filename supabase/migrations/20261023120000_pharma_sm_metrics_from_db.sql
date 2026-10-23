-- Serve the PHARMA S&M situation cards from the database instead of the frontend bundle.
--
-- `src/lib/pharmaSmMetrics.ts` has been calling `get_pharma_sm_metrics_merged` since it was
-- written, but the function was never created. `loadMergedPharmaMetrics` therefore errored on
-- every call, returned [], and both callers silently fell back to hardcoded copies:
--
--   * useAIAssistant.tsx:149  -> `metricsKnowledgeBase` (the bundled file)
--   * FarmaMetricsWithAssistant.tsx:567 -> a local `situationMetrics` array
--
-- Those two copies disagreed, which is what the assistant showed:
--
--   * assistant headline $20.8M, dashboard headline $21.3M, same metric
--   * assistant breakdown Q1 $18.2M + Q2 $21.3M = $39.5M, under a $20.8M total
--   * Q2 alone ($21.3M) larger than the total it sat under
--   * two growth rates on one card: +82.4% headline vs +17.0% in the breakdown
--   * dashboard base $12.0M + incremental $7.3M = $19.3M, not its own $21.3M total
--   * dashboard incremental $7.3M vs spend $1.2M x ROI 2.7x = $3.24M
--
-- The fix is structural, not a re-typing of the numbers. Nothing here stores a headline:
-- the cards are DERIVED from four atomic facts, so the arithmetic cannot drift again.
--
--   1. monthly volume            demo_sales_timeseries.volume_units
--   2. monthly realised price    demo_sales_timeseries.unit_price_usd
--   3. channel spend             demo_dashboard_data.spend_allocation
--   4. channel ROI               demo_dashboard_data.scenario_comparison (baseline)
--
-- Everything else follows:
--
--   total sales       = SUM(volume x price)          -- value = volume x price, per the model's
--                                                      volume KPI multiplied by product price
--   incremental       = SUM(channel spend x ROI)
--   base              = total - incremental
--   overall ROI       = incremental / spend
--   quarterly         = the same monthly rows grouped by quarter, so quarters always sum
--                       to the year
--   YoY               = current fiscal year vs the prior one, from the same rows
--
-- Seed provenance (mmm_claire/data/data.csv, the 33-month monthly series):
--
--   FY2023 is the real actuals. Its implied price is an exact ladder -- $20.00 for
--   2023-01..08 then $19.00 for 2023-09..2024-02 -- and volume x that ladder reproduces the
--   stored `sales` series to 0.0% for every quarter from 2023 Q1 to 2024 Q3. That is why the
--   price is stored per month rather than as one scalar.
--
--   From 2024-10 the source data is unusable: `sales` and `volume` stop agreeing and the
--   implied price wanders between $10.51 and $37.67 with no structure, so the last 12 months
--   of the CSV are deliberately NOT seeded. (Those months were still in the model's training
--   window, which is part of why the stored fit is only r2 0.398.)
--
--   FY2024 is the demo's current year: the real FY2023 seasonal shape at a flat $20.00,
--   scaled so volume x price is exactly $21,300,000 -- the $21.3M total already agreed and
--   reconciled across scenario_comparison, sales_forecast and roi_forecast on 2026-10-22.
--
-- Known 1-cent tension, left alone deliberately: scenario_comparison's baseline displays
-- base 18.06 / media 3.24, while deriving media from the four channels gives 3.246 -> the
-- cards show base $18.05M / incremental $3.25M. Reconciling the two means editing an agreed
-- payload, so it is flagged rather than silently changed.

-- ---------------------------------------------------------------------------
-- 1. the monthly series
-- ---------------------------------------------------------------------------

create table if not exists public.demo_sales_timeseries (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null,
  period_month   date not null,
  volume_units   numeric not null check (volume_units >= 0),
  unit_price_usd numeric not null check (unit_price_usd > 0),
  updated_at     timestamptz not null default now(),
  unique (project_id, period_month)
);

comment on table public.demo_sales_timeseries is
  'Monthly demo volume and realised unit price. Sales value is always derived as '
  'volume_units * unit_price_usd -- never stored -- so quarterly and annual figures '
  'cannot disagree with each other. NOT model output; see mmm_model_outputs for that.';

alter table public.demo_sales_timeseries enable row level security;

-- Read-only and anonymous, exactly as demo_dashboard_data: illustrative figures with
-- nothing confidential in them.
drop policy if exists demo_sales_timeseries_select_public on public.demo_sales_timeseries;
create policy demo_sales_timeseries_select_public
  on public.demo_sales_timeseries
  for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 2. seed
-- ---------------------------------------------------------------------------

delete from public.demo_sales_timeseries
where project_id = '550e8400-e29b-41d4-a716-446655440000';

insert into public.demo_sales_timeseries
  (project_id, period_month, volume_units, unit_price_usd)
values
  -- FY2023: real actuals, real price ladder ($20.00 through Aug, $19.00 from Sep)
  ('550e8400-e29b-41d4-a716-446655440000', '2023-01-01',  63049, 20.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2023-02-01',  58045, 20.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2023-03-01',  86211, 20.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2023-04-01',  83049, 20.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2023-05-01', 100742, 20.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2023-06-01',  72863, 20.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2023-07-01', 115414, 20.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2023-08-01',  63092, 20.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2023-09-01', 113828, 19.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2023-10-01', 117049, 19.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2023-11-01',  67789, 19.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2023-12-01',  79289, 19.00),
  -- FY2024: FY2023 seasonal shape at a flat $20.00, summing to exactly $21,300,000
  ('550e8400-e29b-41d4-a716-446655440000', '2024-01-01',  65803, 20.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2024-02-01',  60581, 20.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2024-03-01',  89977, 20.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2024-04-01',  86677, 20.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2024-05-01', 105143, 20.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2024-06-01',  76046, 20.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2024-07-01', 120456, 20.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2024-08-01',  65848, 20.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2024-09-01', 118801, 20.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2024-10-01', 122164, 20.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2024-11-01',  70751, 20.00),
  ('550e8400-e29b-41d4-a716-446655440000', '2024-12-01',  82753, 20.00);

-- Base-sales sub-components and the prior-year comparators. These are the only figures the
-- cards cannot derive from the series or the channel split, so they are stored explicitly
-- and kept internally consistent: 17.06 + 2.97 = 20.03 and 1.10 x 2.70 = 2.97.
insert into public.demo_dashboard_data (project_id, key, payload) values
('550e8400-e29b-41d4-a716-446655440000', 'pharma_sm_components', '{
  "unit": "millions",
  "currency": "USD",
  "note": "Seasonality and trend are components OF base sales, not additions to it: base = underlying + seasonality + trend.",
  "current": { "seasonality_m": 0.30, "trend_m": 0.50 },
  "prior_year": {
    "label": "FY2023",
    "total_m": 20.03,
    "base_m": 17.06,
    "media_m": 2.97,
    "spend_m": 1.10,
    "incremental_roi": 2.70,
    "seasonality_m": 0.28,
    "trend_m": 0.49
  }
}'::jsonb)
on conflict (project_id, key) do update set payload = excluded.payload, updated_at = now();

-- ---------------------------------------------------------------------------
-- 3. the function the frontend already calls
-- ---------------------------------------------------------------------------

create or replace function public.get_pharma_sm_metrics_merged(
  p_company_id uuid default null,
  p_brand_id   uuid default null
)
returns table (metric_key text, card jsonb, sort_order integer)
language sql
stable
security invoker
set search_path = public
as $fn$
with resolved as (
  -- explicit brand, else any brand of the company that has a series, else the demo project
  select coalesce(
    (select ts.project_id from demo_sales_timeseries ts where ts.project_id = p_brand_id limit 1),
    (select ts.project_id from demo_sales_timeseries ts
        join brands b on b.id = ts.project_id
       where b.company_id = p_company_id limit 1),
    '550e8400-e29b-41d4-a716-446655440000'::uuid
  ) as project_id
),
annual as (
  select extract(year from ts.period_month)::int        as fy,
         sum(ts.volume_units)                           as vol,
         sum(ts.volume_units * ts.unit_price_usd)        as val
    from resolved r
    join demo_sales_timeseries ts on ts.project_id = r.project_id
   group by 1
),
fy as (select max(fy) as cur from annual),
cur as (select a.* from annual a, fy where a.fy = fy.cur),
pri as (select a.* from annual a, fy where a.fy = fy.cur - 1),
quarters as (
  select 'Q' || extract(quarter from ts.period_month)::int as qname,
         extract(quarter from ts.period_month)::int        as qnum,
         sum(ts.volume_units * ts.unit_price_usd) / 1e6     as val_m
    from resolved r
    join demo_sales_timeseries ts on ts.project_id = r.project_id, fy
   where extract(year from ts.period_month)::int = fy.cur
   group by 1, 2
),
components as (
  select d.payload as p
    from demo_dashboard_data d, resolved r
   where d.project_id = r.project_id and d.key = 'pharma_sm_components'
),
baseline as (
  select s as p
    from demo_dashboard_data d, resolved r, jsonb_array_elements(d.payload -> 'scenarios') s
   where d.project_id = r.project_id and d.key = 'scenario_comparison'
     and s ->> 'key' = 'baseline'
),
chan as (
  select c ->> 'name'                                                   as name,
         (c ->> 'current_k')::numeric / 1000.0                          as spend_m,
         ((select p from baseline) -> 'channel_roi' ->> (c ->> 'name'))::numeric as roi
    from demo_dashboard_data d, resolved r, jsonb_array_elements(d.payload -> 'channels') c
   where d.project_id = r.project_id and d.key = 'spend_allocation'
),
chan_m as (
  select name, spend_m, roi, round(spend_m * roi, 2) as media_m from chan
),
f as (
  select
    (select val / 1e6 from cur)                            as total_m,
    (select vol       from cur)                            as total_vol,
    (select val / 1e6 from pri)                            as prior_total_m,
    (select vol       from pri)                            as prior_vol,
    (select val / nullif(vol, 0) from cur)                 as price_cur,
    (select val / nullif(vol, 0) from pri)                 as price_pri,
    (select sum(media_m) from chan_m)                      as media_m,
    (select sum(spend_m) from chan_m)                      as spend_m,
    ((select p from components) -> 'current'    ->> 'seasonality_m')::numeric as seas_m,
    ((select p from components) -> 'current'    ->> 'trend_m')::numeric       as trend_m,
    ((select p from components) -> 'prior_year' ->> 'base_m')::numeric        as prior_base_m,
    ((select p from components) -> 'prior_year' ->> 'media_m')::numeric       as prior_media_m,
    ((select p from components) -> 'prior_year' ->> 'spend_m')::numeric       as prior_spend_m,
    ((select p from components) -> 'prior_year' ->> 'seasonality_m')::numeric as prior_seas_m,
    ((select p from components) -> 'prior_year' ->> 'trend_m')::numeric       as prior_trend_m,
    (select p ->> 'label' from (select (select p from components) -> 'prior_year' as p) q) as prior_label
),
d as (
  -- every displayed quantity, derived once
  select
    f.*,
    f.total_m - f.media_m                                           as base_m,
    f.media_m / nullif(f.spend_m, 0)                                as roi_x,
    f.prior_media_m / nullif(f.prior_spend_m, 0)                    as prior_roi_x,
    -- volume response: incremental units per $1k of promotional spend
    (f.media_m * 1e6 / nullif(f.price_cur, 0)) / nullif(f.spend_m * 1e3, 0)             as vrr,
    (f.prior_media_m * 1e6 / nullif(f.price_pri, 0)) / nullif(f.prior_spend_m * 1e3, 0) as prior_vrr
  from f
),
fmtq as (
  select jsonb_agg(jsonb_build_object('name', qname, 'revenue', round(val_m, 2))
                   order by qnum) as qchart,
         jsonb_agg(jsonb_build_object('label', qname || ' Sales',
                                      'value', '$' || to_char(round(val_m, 2), 'FM999990.00') || 'M')
                   order by qnum) as qrows
    from quarters
)
select * from (
  -- 1. Total Sales
  select 'total-sales'::text, jsonb_build_object(
    'id','total-sales','title','Total Sales',
    'value','$' || to_char(round(d.total_m,1),'FM999990.0') || 'M',
    'change', case when d.total_m >= d.prior_total_m then '+' else '' end
              || to_char(round((d.total_m/d.prior_total_m - 1)*100, 1),'FM999990.0') || '%',
    'changeType', case when d.total_m >= d.prior_total_m then 'positive' else 'negative' end,
    'comparison','Total Revenue',
    'description','Sales value is volume multiplied by realised unit price. Quarters sum to the year by construction.',
    'icon','TrendingUp','category','situation','section','pharma-sm',
    'keywords', jsonb_build_array('total','sales','revenue','performance','quarterly'),
    'details', jsonb_build_object(
      'description','Volume x realised price, aggregated from the monthly series. The four quarters sum to the annual total.',
      'breakdown', fmtq.qrows
        || jsonb_build_array(
             jsonb_build_object('label','Full Year','value','$' || to_char(round(d.total_m,2),'FM999990.00') || 'M'),
             jsonb_build_object('label','Volume','value', to_char(d.total_vol,'FM999,999,999') || ' units'),
             jsonb_build_object('label','Realised Price','value','$' || to_char(round(d.price_cur,2),'FM999990.00')),
             jsonb_build_object('label', d.prior_label || ' Total','value','$' || to_char(round(d.prior_total_m,2),'FM999990.00') || 'M'))),
    'chartData', jsonb_build_object('type','bar','valueKey','revenue','data', fmtq.qchart)
  ), 1 from d, fmtq

  -- 2. Base Sales
  union all
  select 'base-sales', jsonb_build_object(
    'id','base-sales','title','Base Sales',
    'value','$' || to_char(round(d.base_m,2),'FM999990.00') || 'M',
    'change', case when d.base_m >= d.prior_base_m then '+' else '' end
              || to_char(round((d.base_m/d.prior_base_m - 1)*100, 1),'FM999990.0') || '%',
    'changeType', case when d.base_m >= d.prior_base_m then 'positive' else 'negative' end,
    'comparison','Revenue Attribution',
    'description','Sales that would have occurred without promotional activity. Derived as total minus incremental.',
    'icon','BarChart3','category','situation','section','pharma-sm',
    'keywords', jsonb_build_array('base','baseline','non-media','organic'),
    'details', jsonb_build_object(
      'description','Base = total sales - incremental (media-driven) sales. Seasonality and trend are components of base, not additions to it.',
      'breakdown', jsonb_build_array(
        jsonb_build_object('label','Underlying Demand','value','$' || to_char(round(d.base_m - d.seas_m - d.trend_m,2),'FM999990.00') || 'M'),
        jsonb_build_object('label','Seasonality','value','$' || to_char(round(d.seas_m,2),'FM999990.00') || 'M'),
        jsonb_build_object('label','Trend','value','$' || to_char(round(d.trend_m,2),'FM999990.00') || 'M'),
        jsonb_build_object('label','Base Total','value','$' || to_char(round(d.base_m,2),'FM999990.00') || 'M'),
        jsonb_build_object('label','Share of Sales','value', to_char(round(d.base_m/d.total_m*100,1),'FM999990.0') || '%'))),
    'chartData', jsonb_build_object('type','bar','valueKey','revenue','data', jsonb_build_array(
      jsonb_build_object('name','Base','revenue', round(d.base_m,2)),
      jsonb_build_object('name','Incremental','revenue', round(d.media_m,2))))
  ), 2 from d

  -- 3. Incremental
  union all
  select 'incremental', jsonb_build_object(
    'id','incremental','title','Incremental',
    'value','$' || to_char(round(d.media_m,2),'FM999990.00') || 'M',
    'change', case when d.media_m >= d.prior_media_m then '+' else '' end
              || to_char(round((d.media_m/d.prior_media_m - 1)*100, 1),'FM999990.0') || '%',
    'changeType', case when d.media_m >= d.prior_media_m then 'positive' else 'negative' end,
    'comparison','Incremental Revenue',
    'description','Media-driven sales, summed from each channel''s spend multiplied by its ROI.',
    'icon','TrendingUp','category','situation','section','pharma-sm',
    'keywords', jsonb_build_array('incremental','media','media-driven','attribution'),
    'details', jsonb_build_object(
      'description','Each channel contributes spend x its own ROI. The channel rows sum to this total.',
      'breakdown', (select jsonb_agg(jsonb_build_object(
                             'label', name,
                             'value','$' || to_char(media_m,'FM999990.00') || 'M')
                           order by media_m desc) from chan_m)
        || jsonb_build_array(
             jsonb_build_object('label','Incremental Total','value','$' || to_char(round(d.media_m,2),'FM999990.00') || 'M'),
             jsonb_build_object('label','Share of Sales','value', to_char(round(d.media_m/d.total_m*100,1),'FM999990.0') || '%'))),
    'chartData', jsonb_build_object('type','bar','valueKey','revenue','data',
      (select jsonb_agg(jsonb_build_object('name', name, 'revenue', media_m) order by media_m desc) from chan_m))
  ), 3 from d

  -- 4. Promotional Spend
  union all
  select 'promotional-spend', jsonb_build_object(
    'id','promotional-spend','title','Promotional Spend',
    'value','$' || to_char(round(d.spend_m,2),'FM999990.00') || 'M',
    'change', case when d.spend_m >= d.prior_spend_m then '+' else '' end
              || to_char(round((d.spend_m/d.prior_spend_m - 1)*100, 1),'FM999990.0') || '%',
    'changeType', case when d.spend_m >= d.prior_spend_m then 'positive' else 'negative' end,
    'comparison','Total Promotional Budget',
    'description','Total media and field investment across all promotional channels.',
    'icon','DollarSign','category','situation','section','pharma-sm',
    'keywords', jsonb_build_array('spend','budget','investment','promotional'),
    'details', jsonb_build_object(
      'description','Channel spend sums to the total promotional budget.',
      'breakdown', (select jsonb_agg(jsonb_build_object(
                             'label', name,
                             'value','$' || to_char(spend_m,'FM999990.00') || 'M')
                           order by spend_m desc) from chan_m)
        || jsonb_build_array(
             jsonb_build_object('label','Total Spend','value','$' || to_char(round(d.spend_m,2),'FM999990.00') || 'M'),
             jsonb_build_object('label','Spend as % of Sales','value', to_char(round(d.spend_m/d.total_m*100,1),'FM999990.0') || '%'))),
    'chartData', jsonb_build_object('type','pie','valueKey','revenue','data',
      (select jsonb_agg(jsonb_build_object('name', name, 'revenue', spend_m) order by spend_m desc) from chan_m))
  ), 4 from d

  -- 5. ROI
  union all
  select 'roi', jsonb_build_object(
    'id','roi','title','ROI',
    'value', to_char(round(d.roi_x,1),'FM999990.0') || 'x',
    'change', case when d.roi_x >= d.prior_roi_x then '+' else '' end
              || to_char(round((d.roi_x/d.prior_roi_x - 1)*100, 1),'FM999990.0') || '%',
    'changeType', case when d.roi_x >= d.prior_roi_x then 'positive' else 'negative' end,
    'comparison','Incremental Return on Investment',
    'description','Incremental sales per dollar of promotional spend.',
    'icon','Target','category','situation','section','pharma-sm',
    'keywords', jsonb_build_array('roi','return','efficiency','incremental'),
    'details', jsonb_build_object(
      'description','ROI is incremental sales divided by promotional spend. Total sales also includes base demand, which no spend is credited for.',
      'breakdown', jsonb_build_array(
        jsonb_build_object('label','Incremental Sales','value','$' || to_char(round(d.media_m,2),'FM999990.00') || 'M'),
        jsonb_build_object('label','Promotional Spend','value','$' || to_char(round(d.spend_m,2),'FM999990.00') || 'M'),
        jsonb_build_object('label','Incremental ROI','value', to_char(round(d.roi_x,2),'FM999990.00') || 'x'),
        jsonb_build_object('label', d.prior_label || ' ROI','value', to_char(round(d.prior_roi_x,2),'FM999990.00') || 'x'))),
    'chartData', jsonb_build_object('type','bar','valueKey','revenue','data',
      (select jsonb_agg(jsonb_build_object('name', name, 'revenue', roi) order by roi desc) from chan_m))
  ), 5 from d

  -- 6. VRR
  union all
  select 'vrr', jsonb_build_object(
    'id','vrr','title','VRR',
    'value', to_char(round(d.vrr,0),'FM999990') || ' u/$k',
    'change', case when d.vrr >= d.prior_vrr then '+' else '' end
              || to_char(round((d.vrr/d.prior_vrr - 1)*100, 1),'FM999990.0') || '%',
    'changeType', case when d.vrr >= d.prior_vrr then 'positive' else 'negative' end,
    'comparison','Volume Response Rate',
    'description','Incremental units gained per $1,000 of promotional spend.',
    'icon','Activity','category','situation','section','pharma-sm',
    'keywords', jsonb_build_array('vrr','volume','response','units','efficiency'),
    'details', jsonb_build_object(
      'description','The volume-basis counterpart to ROI. It can move the opposite way to ROI when realised price changes, because the same revenue is then worth fewer or more units.',
      'breakdown', jsonb_build_array(
        jsonb_build_object('label','Incremental Units','value', to_char(round(d.media_m*1e6/d.price_cur,0),'FM999,999,999') || ' units'),
        jsonb_build_object('label','Promotional Spend','value','$' || to_char(round(d.spend_m,2),'FM999990.00') || 'M'),
        jsonb_build_object('label','Units per $1k','value', to_char(round(d.vrr,1),'FM999990.0')),
        jsonb_build_object('label', d.prior_label || ' Units per $1k','value', to_char(round(d.prior_vrr,1),'FM999990.0')))),
    'chartData', jsonb_build_object('type','bar','valueKey','revenue','data', jsonb_build_array(
      jsonb_build_object('name', d.prior_label, 'revenue', round(d.prior_vrr,1)),
      jsonb_build_object('name','Current','revenue', round(d.vrr,1))))
  ), 6 from d

  -- 7. Seasonality
  union all
  select 'seasonality', jsonb_build_object(
    'id','seasonality','title','Seasonality',
    'value','$' || to_char(round(d.seas_m,2),'FM999990.00') || 'M',
    'change', case when d.seas_m >= d.prior_seas_m then '+' else '' end
              || to_char(round((d.seas_m/d.prior_seas_m - 1)*100, 1),'FM999990.0') || '%',
    'changeType', case when d.seas_m >= d.prior_seas_m then 'positive' else 'negative' end,
    'comparison','Revenue Attribution',
    'description','The portion of base sales explained by seasonal demand patterns.',
    'icon','Calendar','category','situation','section','pharma-sm',
    'keywords', jsonb_build_array('seasonality','seasonal','base','pattern'),
    'details', jsonb_build_object(
      'description','A component of base sales, not an addition to it.',
      'breakdown', jsonb_build_array(
        jsonb_build_object('label','Seasonality','value','$' || to_char(round(d.seas_m,2),'FM999990.00') || 'M'),
        jsonb_build_object('label','Share of Base','value', to_char(round(d.seas_m/d.base_m*100,1),'FM999990.0') || '%'),
        jsonb_build_object('label','Peak Quarter','value', (select qname from quarters order by val_m desc limit 1)),
        jsonb_build_object('label','Trough Quarter','value', (select qname from quarters order by val_m asc limit 1)))),
    'chartData', jsonb_build_object('type','line','valueKey','revenue','data', fmtq.qchart)
  ), 7 from d, fmtq

  -- 8. Trend
  union all
  select 'trend', jsonb_build_object(
    'id','trend','title','Trend',
    'value','$' || to_char(round(d.trend_m,2),'FM999990.00') || 'M',
    'change', case when d.trend_m >= d.prior_trend_m then '+' else '' end
              || to_char(round((d.trend_m/d.prior_trend_m - 1)*100, 1),'FM999990.0') || '%',
    'changeType', case when d.trend_m >= d.prior_trend_m then 'positive' else 'negative' end,
    'comparison','Revenue Attribution',
    'description','The portion of base sales explained by the underlying growth trend.',
    'icon','TrendingUp','category','situation','section','pharma-sm',
    'keywords', jsonb_build_array('trend','growth','base','underlying'),
    'details', jsonb_build_object(
      'description','A component of base sales, not an addition to it.',
      'breakdown', jsonb_build_array(
        jsonb_build_object('label','Trend','value','$' || to_char(round(d.trend_m,2),'FM999990.00') || 'M'),
        jsonb_build_object('label','Share of Base','value', to_char(round(d.trend_m/d.base_m*100,1),'FM999990.0') || '%'),
        jsonb_build_object('label','Volume Growth YoY','value', case when d.total_vol >= d.prior_vol then '+' else '' end
                           || to_char(round((d.total_vol/d.prior_vol - 1)*100,1),'FM999990.0') || '%'),
        jsonb_build_object('label','Price Growth YoY','value', case when d.price_cur >= d.price_pri then '+' else '' end
                           || to_char(round((d.price_cur/d.price_pri - 1)*100,1),'FM999990.0') || '%'))),
    'chartData', jsonb_build_object('type','line','valueKey','revenue','data', fmtq.qchart)
  ), 8 from d, fmtq

  -- 9+. one card per promotional channel, ordered by contribution
  union all
  select 'channel-' || lower(regexp_replace(c.name, '[^a-zA-Z0-9]+', '-', 'g')),
    jsonb_build_object(
      'id','channel-' || lower(regexp_replace(c.name, '[^a-zA-Z0-9]+', '-', 'g')),
      'title', c.name,
      'value','$' || to_char(c.media_m,'FM999990.00') || 'M',
      'change', case when c.roi >= (select roi_x from d) then '+' else '' end
                || to_char(round((c.roi/(select roi_x from d) - 1)*100, 1),'FM999990.0') || '%',
      'changeType', case when c.roi >= (select roi_x from d) then 'positive' else 'negative' end,
      'comparison','Revenue Attribution',
      'description', c.name || ' contributed $' || to_char(c.media_m,'FM999990.00')
                     || 'M of incremental sales on $' || to_char(c.spend_m,'FM999990.00') || 'M of spend.',
      'icon','BarChart3','category','situation','section','pharma-sm',
      'keywords', jsonb_build_array('channel','attribution', lower(c.name)),
      'details', jsonb_build_object(
        'description','Channel contribution is spend x channel ROI. The change shown is this channel''s ROI against the overall ROI.',
        'breakdown', jsonb_build_array(
          jsonb_build_object('label','Spend','value','$' || to_char(c.spend_m,'FM999990.00') || 'M'),
          jsonb_build_object('label','Channel ROI','value', to_char(c.roi,'FM999990.00') || 'x'),
          jsonb_build_object('label','Incremental Sales','value','$' || to_char(c.media_m,'FM999990.00') || 'M'),
          jsonb_build_object('label','Share of Incremental','value',
                             to_char(round(c.media_m/(select media_m from d)*100,1),'FM999990.0') || '%'))),
      'chartData', jsonb_build_object('type','bar','valueKey','revenue','data', jsonb_build_array(
        jsonb_build_object('name','Spend','revenue', c.spend_m),
        jsonb_build_object('name','Incremental','revenue', c.media_m)))
    ),
    (8 + row_number() over (order by c.media_m desc))::integer
  from chan_m c
) cards(metric_key, card, sort_order)
order by sort_order;
$fn$;

comment on function public.get_pharma_sm_metrics_merged(uuid, uuid) is
  'Builds the PHARMA S&M situation cards from demo_sales_timeseries (volume x price) and '
  'demo_dashboard_data (channel spend and ROI). Nothing is stored pre-formatted, so the '
  'headline, the quarterly breakdown and the base/incremental split cannot disagree.';

grant execute on function public.get_pharma_sm_metrics_merged(uuid, uuid) to anon, authenticated;
