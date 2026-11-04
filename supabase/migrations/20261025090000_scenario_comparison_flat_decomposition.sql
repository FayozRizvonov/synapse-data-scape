-- Bring scenario_comparison onto the same flat decomposition as the situation cards.
--
-- The cards were switched to total = base + seasonality + trend + incremental. This payload
-- still held the older NESTED split, where base absorbed seasonality and trend, so the word
-- "base" meant two different quantities in two places:
--
--   situation cards        base $17.25M   (+ seasonality 0.30 + trend 0.50 + incremental 3.25)
--   scenario_comparison    base $18.06M   (seasonality and trend folded in)
--
-- Nothing renders these two fields today -- ScenarioComparison draws only total_sales_m,
-- total_spend_m, incremental_roi and profit_margin_pct -- so this was never visible. But
-- `base_sales_m` and `media_sales_m` are declared on DemoScenario in useDemoDashboardData.ts,
-- which invites the next person to render them, and they would have drawn a base that
-- contradicts the card beside it. Same reason prior_year.base_m was dropped earlier: a stored
-- number nothing reads is a number waiting to be believed.
--
-- Seasonality and trend are held constant across the three scenarios on purpose. The
-- scenarios differ by media investment; changing the media plan does not change the seasonal
-- shape of demand or the underlying growth trend, so only base and media move.
--
--   baseline      17.25 + 0.30 + 0.50 + 3.25 = 21.30
--   optimistic    19.70 + 0.30 + 0.50 + 4.00 = 24.50
--   pessimistic   15.78 + 0.30 + 0.50 + 2.59 = 19.17
--
-- Baseline media is 3.25 rather than 3.24 so it matches the cards, which derive it as the sum
-- of the four channel contributions (each spend x its own ROI). Displayed ROI is unchanged:
-- 3.25 / 1.20 = 2.71, which prints 2.7x, and the card's own breakdown shows 2.71x, so
-- spend x ROI still reconciles at the precision shown. Optimistic and pessimistic have no
-- per-channel spend split stored, so their media stays spend x ROI exactly.

update public.demo_dashboard_data d
   set payload = jsonb_set(
         jsonb_set(
           d.payload,
           '{scenarios}',
           (select jsonb_agg(
                     s || jsonb_build_object(
                       'base_sales_m',  to_jsonb(v.base),
                       'media_sales_m', to_jsonb(v.media),
                       'seasonality_m', to_jsonb(0.30::numeric),
                       'trend_m',       to_jsonb(0.50::numeric)
                     )
                     order by (s->>'sort')::int)
              from jsonb_array_elements(d.payload->'scenarios') s
              join (values ('baseline',    17.25::numeric, 3.25::numeric),
                           ('optimistic',  19.70::numeric, 4.00::numeric),
                           ('pessimistic', 15.78::numeric, 2.59::numeric)
                   ) as v(k, base, media) on v.k = s->>'key')
         ),
         '{note}',
         '"Total sales = base + seasonality + trend + incremental, the same decomposition the situation cards use. Incremental ROI is media-driven sales per dollar of media spend. Seasonality and trend are held constant across scenarios: the scenarios vary media investment, which does not change the seasonal shape of demand or the underlying trend."'::jsonb
       ),
       updated_at = now()
 where d.key = 'scenario_comparison';
