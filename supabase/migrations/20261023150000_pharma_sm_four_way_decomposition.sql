-- Make total sales = base + seasonality + trend + incremental, as the demo always intended.
--
-- get_pharma_sm_metrics_merged modelled the decomposition as NESTED: base contained
-- seasonality and trend, and total = base + incremental. So the Base card reported $18.05M,
-- which already included the $0.30M seasonality and $0.50M trend reported beside it, and the
-- four cards a reader would naturally add up came to $22.10M against a $21.30M total --
-- over by exactly the $0.80M counted twice.
--
-- The intended model is FLAT: the four are siblings of one total. That is also what the
-- original dashboard array was reaching for (12.0 + 0.3 + 0.5 + 7.3 = $20.1M -- a four-way
-- sum that simply missed its target).
--
-- Base becomes the RESIDUAL rather than a figure of its own:
--
--     base = total - incremental - seasonality - trend
--
-- so the four sum to the total by construction, whatever seasonality and trend are later set
-- to. Nothing can be adjusted into disagreement.
--
--   FY2024  17.25 + 0.30 + 0.50 + 3.25 = 21.30  = SUM(volume x price)          OK
--   FY2023  16.29 + 0.28 + 0.49 + 2.97 = 20.03  = SUM(volume x price)          OK
--
-- Prior-year base is derived the same way, so base's YoY (+5.9%) is derived too, and
-- prior_year.base_m is dropped from pharma_sm_components: a stored 17.06 that nothing reads
-- is just a figure waiting to be believed.
--
-- Side note on an objection raised and withdrawn: a seasonal component nets to zero across a
-- full year, so "seasonality contributed $0.30M" is incoherent when seasonality sits INSIDE
-- base. Under the flat model it is a sibling contribution to the total and the objection does
-- not apply. The nesting was the problem, not the figure.
--
-- Patched in place rather than re-pasting ~300 lines of function body; every fragment is
-- asserted present, so this fails loudly instead of silently half-applying.

do $patch$
declare
  src    text;
  pairs  text[][] := array[
    -- 1. base becomes the residual
    array[
      $o$    f.total_m - f.media_m                                           as base_m,$o$,
      $n$    f.total_m - f.media_m - f.seas_m - f.trend_m                    as base_m,$n$
    ],
    -- 2. prior-year base likewise, read straight from the payload so no sibling refs
    array[
      $o$    ((select p from components) -> 'prior_year' ->> 'base_m')::numeric        as prior_base_m,$o$,
      $n$    (((select p from components) -> 'prior_year' ->> 'total_m')::numeric
      - ((select p from components) -> 'prior_year' ->> 'media_m')::numeric
      - ((select p from components) -> 'prior_year' ->> 'seasonality_m')::numeric
      - ((select p from components) -> 'prior_year' ->> 'trend_m')::numeric)  as prior_base_m,$n$
    ],
    -- 3. base card: say what it now means
    array[
      $o$    'description','Sales that would have occurred without promotional activity. Derived as total minus incremental.',$o$,
      $n$    'description','Sales that would have occurred without promotional activity, seasonal swing or underlying growth. The residual of the four-way split.',$n$
    ],
    array[
      $o$      'description','Base = total sales - incremental (media-driven) sales. Seasonality and trend are components of base, not additions to it.',$o$,
      $n$      'description','Total sales = base + seasonality + trend + incremental. Base is the residual, so the four always sum to the total.',$n$
    ],
    -- 4. base card breakdown: carry the whole identity, so it can be checked on the card
    array[
      $o$        jsonb_build_object('label','Underlying Demand','value','$' || to_char(round(d.base_m - d.seas_m - d.trend_m,2),'FM999990.00') || 'M'),
        jsonb_build_object('label','Seasonality','value','$' || to_char(round(d.seas_m,2),'FM999990.00') || 'M'),
        jsonb_build_object('label','Trend','value','$' || to_char(round(d.trend_m,2),'FM999990.00') || 'M'),
        jsonb_build_object('label','Base Total','value','$' || to_char(round(d.base_m,2),'FM999990.00') || 'M'),
        jsonb_build_object('label','Share of Sales','value', to_char(round(d.base_m/d.total_m*100,1),'FM999990.0') || '%'))),$o$,
      $n$        jsonb_build_object('label','Base','value','$' || to_char(round(d.base_m,2),'FM999990.00') || 'M'),
        jsonb_build_object('label','Seasonality','value','$' || to_char(round(d.seas_m,2),'FM999990.00') || 'M'),
        jsonb_build_object('label','Trend','value','$' || to_char(round(d.trend_m,2),'FM999990.00') || 'M'),
        jsonb_build_object('label','Incremental','value','$' || to_char(round(d.media_m,2),'FM999990.00') || 'M'),
        jsonb_build_object('label','Total Sales','value','$' || to_char(round(d.base_m + d.seas_m + d.trend_m + d.media_m,2),'FM999990.00') || 'M'),
        jsonb_build_object('label','Share of Sales','value', to_char(round(d.base_m/d.total_m*100,1),'FM999990.0') || '%'))),$n$
    ],
    -- 5. base card chart: all four components, not two
    array[
      $o$      jsonb_build_object('name','Base','revenue', round(d.base_m,2)),
      jsonb_build_object('name','Incremental','revenue', round(d.media_m,2))))$o$,
      $n$      jsonb_build_object('name','Base','revenue', round(d.base_m,2)),
      jsonb_build_object('name','Seasonality','revenue', round(d.seas_m,2)),
      jsonb_build_object('name','Trend','revenue', round(d.trend_m,2)),
      jsonb_build_object('name','Incremental','revenue', round(d.media_m,2))))$n$
    ],
    -- 6. seasonality and trend are siblings of base, not parts of it (both cards)
    array[
      $o$      'description','A component of base sales, not an addition to it.',$o$,
      $n$      'description','One of the four components of total sales: base + seasonality + trend + incremental.',$n$
    ],
    array[
      $o$        jsonb_build_object('label','Share of Base','value', to_char(round(d.seas_m/d.base_m*100,1),'FM999990.0') || '%'),$o$,
      $n$        jsonb_build_object('label','Share of Sales','value', to_char(round(d.seas_m/d.total_m*100,1),'FM999990.0') || '%'),$n$
    ],
    array[
      $o$        jsonb_build_object('label','Share of Base','value', to_char(round(d.trend_m/d.base_m*100,1),'FM999990.0') || '%'),$o$,
      $n$        jsonb_build_object('label','Share of Sales','value', to_char(round(d.trend_m/d.total_m*100,1),'FM999990.0') || '%'),$n$
    ],
    array[
      $o$    'description','The portion of base sales explained by seasonal demand patterns.',$o$,
      $n$    'description','The portion of total sales explained by seasonal demand patterns.',$n$
    ],
    array[
      $o$    'description','The portion of base sales explained by the underlying growth trend.',$o$,
      $n$    'description','The portion of total sales explained by the underlying growth trend.',$n$
    ]
  ];
  pair   text[];
begin
  select pg_get_functiondef(p.oid) into src
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'get_pharma_sm_metrics_merged';

  if src is null then
    raise exception 'get_pharma_sm_metrics_merged not found';
  end if;

  foreach pair slice 1 in array pairs loop
    if position(pair[1] in src) = 0 then
      raise exception 'fragment not found, refusing to half-apply: %',
        left(pair[1], 80);
    end if;
    src := replace(src, pair[1], pair[2]);
  end loop;

  execute src;
end
$patch$;

-- prior_year.base_m is now derived; drop it so a stale copy cannot be read as fact.
update public.demo_dashboard_data
   set payload = jsonb_set(
                   payload #- '{prior_year,base_m}',
                   '{note}',
                   '"Total sales = base + seasonality + trend + incremental. Base is the residual, derived in get_pharma_sm_metrics_merged, so the four always sum to the total. Seasonality and trend are the only stored figures here; prior-year base is derived the same way as current."'::jsonb
                 ),
       updated_at = now()
 where key = 'pharma_sm_components';
