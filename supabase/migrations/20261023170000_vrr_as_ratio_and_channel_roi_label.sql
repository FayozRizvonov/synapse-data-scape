-- Two presentation fixes on the situation cards, both found by reading the rendered page.
--
-- 1. VRR. A previous change redefined it as "incremental units per $1,000 of spend", which
--    rendered as `135 u/$k`. The demo's figure is 3.6x and should stay 3.6x.
--
--    It cannot be DERIVED. At a flat realised price a volume-basis return is arithmetically
--    identical to the value-basis ROI (2.7x), so nothing in the data produces 3.6. On main it
--    was a bare literal with a breakdown of "Volume Impact +18.2% / Response Rate 3.6x /
--    Efficiency Score 92%", none of it computed from anything.
--
--    So it is stored, like seasonality and trend -- and, importantly, it sits OUTSIDE the
--    base + seasonality + trend + incremental identity, participates in no sum, and therefore
--    cannot break the reconciliation whatever value it holds.
--
-- 2. Channel cards. Their contributions were always correct and did sum:
--
--       1.35 + 1.19 + 0.40 + 0.31 = 3.25 = Incremental
--       0.54 + 0.36 + 0.18 + 0.12 = 1.20 = Promotional Spend
--
--    What was wrong was the figure printed beside the value. Every other card shows
--    year-on-year growth in that slot; the channel cards showed the channel's ROI expressed
--    as a percentage against the blended 2.7x:
--
--       SF Calls  2.50 / 2.708 - 1 = -7.7%
--       Digital   3.30 / 2.708 - 1 = +21.8%
--
--    So "SF Calls $1.35M -7.7%" read as "SF Calls declined 7.7%" when it meant "SF Calls
--    returns below average" -- two different meanings sharing one visual slot, in a section
--    titled ROI Analysis. It now shows the channel ROI itself (2.50x), which cannot be
--    misread as growth, still coloured by whether it beats the blended rate.
--
-- Patched over pg_get_functiondef with every fragment asserted present, so a drifted body
-- fails loudly rather than half-applying.

-- Payload first: the function reads vrr_x from here.
update public.demo_dashboard_data
   set payload = jsonb_set(
                   jsonb_set(payload, '{current,vrr_x}', '3.6'::jsonb, true),
                   '{prior_year,vrr_x}', '3.05'::jsonb, true
                 ),
       updated_at = now()
 where key = 'pharma_sm_components';

do $patch$
declare
  src   text;
  pairs text[][] := array[
    -- expose vrr_x / prior_vrr_x alongside the other stored components
    array[
      $o$    ((select p from components) -> 'current'    ->> 'seasonality_m')::numeric as seas_m,$o$,
      $n$    ((select p from components) -> 'current'    ->> 'seasonality_m')::numeric as seas_m,
    ((select p from components) -> 'current'    ->> 'vrr_x')::numeric         as vrr_x,
    ((select p from components) -> 'prior_year' ->> 'vrr_x')::numeric         as prior_vrr_x,$n$
    ],
    -- VRR headline back to a ratio
    array[
      $o$    'value', to_char(round(d.vrr,0),'FM999990') || ' u/$k',
    'change', case when d.vrr >= d.prior_vrr then '+' else '' end
              || to_char(round((d.vrr/d.prior_vrr - 1)*100, 1),'FM999990.0') || '%',
    'changeType', case when d.vrr >= d.prior_vrr then 'positive' else 'negative' end,$o$,
      $n$    'value', to_char(round(d.vrr_x,1),'FM999990.0') || 'x',
    'change', case when d.vrr_x >= d.prior_vrr_x then '+' else '' end
              || to_char(round((d.vrr_x/d.prior_vrr_x - 1)*100, 1),'FM999990.0') || '%',
    'changeType', case when d.vrr_x >= d.prior_vrr_x then 'positive' else 'negative' end,$n$
    ],
    array[
      $o$    'description','Incremental units gained per $1,000 of promotional spend.',$o$,
      $n$    'description','How strongly promotional activity converts into incremental volume.',$n$
    ],
    array[
      $o$      'description','The volume-basis counterpart to ROI. It can move the opposite way to ROI when realised price changes, because the same revenue is then worth fewer or more units.',
      'breakdown', jsonb_build_array(
        jsonb_build_object('label','Incremental Units','value', to_char(round(d.media_m*1e6/d.price_cur,0),'FM999,999,999') || ' units'),
        jsonb_build_object('label','Promotional Spend','value','$' || to_char(round(d.spend_m,2),'FM999990.00') || 'M'),
        jsonb_build_object('label','Units per $1k','value', to_char(round(d.vrr,1),'FM999990.0')),
        jsonb_build_object('label', d.prior_label || ' Units per $1k','value', to_char(round(d.prior_vrr,1),'FM999990.0')))),$o$,
      $n$      'description','A stored presentational figure, like seasonality and trend. It sits outside the base + seasonality + trend + incremental identity, so it participates in no sum. At a flat realised price a volume-basis return equals the value-basis ROI, so this is deliberately not derived as incremental / spend.',
      'breakdown', jsonb_build_array(
        jsonb_build_object('label','Response Rate','value', to_char(round(d.vrr_x,1),'FM999990.0') || 'x'),
        jsonb_build_object('label','Incremental Units','value', to_char(round(d.media_m*1e6/d.price_cur,0),'FM999,999,999') || ' units'),
        jsonb_build_object('label','Volume Growth YoY','value', case when d.total_vol >= d.prior_vol then '+' else '' end || to_char(round((d.total_vol/d.prior_vol - 1)*100,1),'FM999990.0') || '%'),
        jsonb_build_object('label', d.prior_label || ' Response Rate','value', to_char(round(d.prior_vrr_x,1),'FM999990.0') || 'x'))),$n$
    ],
    array[
      $o$      jsonb_build_object('name', d.prior_label, 'revenue', round(d.prior_vrr,1)),
      jsonb_build_object('name','Current','revenue', round(d.vrr,1))))$o$,
      $n$      jsonb_build_object('name', d.prior_label, 'revenue', round(d.prior_vrr_x,1)),
      jsonb_build_object('name','Current','revenue', round(d.vrr_x,1))))$n$
    ],
    -- channel cards: show the ROI multiple, not a percentage that reads as growth
    array[
      $o$'change', case when c.roi >= (select roi_x from d) then '+' else '' end || to_char(round((c.roi/(select roi_x from d) - 1)*100, 1),'FM999990.0') || '%',$o$,
      $n$'change', to_char(c.roi,'FM999990.00') || 'x',$n$
    ],
    array[
      $o$The change shown is this channel''s ROI against the overall ROI.$o$,
      $n$The figure beside the value is this channel ROI, coloured by whether it beats the blended rate.$n$
    ]
  ];
  pair text[];
begin
  select pg_get_functiondef(p.oid) into src
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'get_pharma_sm_metrics_merged';

  if src is null then
    raise exception 'get_pharma_sm_metrics_merged not found';
  end if;

  foreach pair slice 1 in array pairs loop
    if position(pair[1] in src) = 0 then
      raise exception 'fragment not found, refusing to half-apply: %', left(pair[1], 90);
    end if;
    src := replace(src, pair[1], pair[2]);
  end loop;

  execute src;
end
$patch$;
