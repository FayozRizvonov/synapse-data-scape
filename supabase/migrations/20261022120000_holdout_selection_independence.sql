-- Stop the approval gate binding on a selected maximum.
--
-- THE DEFECT. When MMM_SPEC_SEARCH chose a specification, run_mmm_pipeline reassigned
-- the bundle to the winner and then called run_holdout_validation on it — which split
-- off the SAME trailing periods the search had just maximised skill over. So
-- holdout_metrics.skill_vs_naive for a searched model was the best of however many
-- candidates were tried, not an estimate of out-of-sample performance. This function
-- then blocked on `skill_vs_naive <= 0` reading exactly that number: shown the maximum
-- of ~15-20 draws and treating it as one draw.
--
-- How much that inflates by, on the 33-month dovato shape (6 holdout observations at
-- G=SB=1, sd of the skill estimator ~0.26): +0.22 to +0.41 depending on how correlated
-- the candidates' errors are. The documented winner's +0.167 gain over the default sits
-- at or below what selecting the best of that many identical candidates produces.
-- See docs/llm-spec-proposal-evaluation.md.
--
-- THE FIX, in two halves. The pipeline now hands the search a series that stops short of
-- the reported window, so the search selects on its own earlier holdout and never sees
-- the periods it will be judged on (src/search/search.py plan_search_split); when the
-- series is too short to carry both windows it skips the search rather than sharing one.
-- It records the verdict next to the scores as holdout_metrics.selection_independent.
--
-- This half makes the gate read that verdict instead of assuming it, and refuse when a
-- search chose the specification but nothing establishes the reported periods were kept
-- back. Consistent with the rest of this gate: absent evidence is not passing evidence.
--
-- Legacy rows are untouched. A model with holdout evidence and no spec_search output —
-- every holdout model written so far, since MMM_SPEC_SEARCH defaults to off — has no
-- selection to be contaminated by and is judged exactly as before.

create or replace function public.mmm_model_gate_status(model_uuid uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_config      jsonb;
  v_gov         jsonb;
  v_holdout     jsonb;
  v_search      jsonb;
  v_blockers    text[] := array[]::text[];
  v_skill       numeric;
  v_independent text;
begin
  select model_config into v_config from public.mmm_models where id = model_uuid;

  if not found then
    return jsonb_build_object('exists', false);
  end if;

  v_gov := v_config -> 'governance';

  -- Most recent holdout evidence for this model, if out-of-sample validation ran.
  select output_data into v_holdout
    from public.mmm_model_outputs
   where model_id = model_uuid
     and output_type = 'holdout_metrics'
   order by generated_at desc
   limit 1;

  -- Did a specification search choose this model's form, and on what?
  select output_data into v_search
    from public.mmm_model_outputs
   where model_id = model_uuid
     and output_type = 'spec_search'
   order by generated_at desc
   limit 1;

  -- Convergence evidence is mandatory. Absent evidence is not passing evidence.
  if v_gov is null or v_gov = 'null'::jsonb or v_gov = '{}'::jsonb then
    v_blockers := array_append(v_blockers, 'no convergence evidence (model_config.governance is absent)');
  elsif coalesce(v_gov ->> 'passed', 'false') <> 'true' then
    v_blockers := array_append(v_blockers, format(
      'governance gate failed (max_rhat=%s, min_ess=%s, divergences=%s)',
      coalesce(v_gov ->> 'max_rhat', '?'),
      coalesce(v_gov ->> 'min_ess', '?'),
      coalesce(v_gov ->> 'n_divergences', '?')
    ));
  end if;

  -- Out-of-sample evidence is optional (MMM_HOLDOUT_PERIODS defaults to 0), but when
  -- it exists it is binding.
  if v_holdout is not null then
    if coalesce(v_holdout ->> 'trustworthy', 'false') <> 'true' then
      v_blockers := array_append(v_blockers, 'holdout scores are not trustworthy (the NumPy forward model no longer mirrors pymc_mmm.py)');
    end if;

    -- Binding on a score the model's own form was selected by would be circular, so
    -- establish independence before reading the score at all.
    v_independent := v_holdout ->> 'selection_independent';

    if v_independent = 'false' then
      v_blockers := array_append(v_blockers, format(
        'holdout evidence is not independent of model selection: %s',
        coalesce(v_holdout ->> 'selection_note',
                 'the specification was selected on the periods reported here')
      ));
    elsif v_search is not null
      and coalesce(v_search ->> 'kept_default', 'true') <> 'true'
      and coalesce(v_independent, 'unknown') <> 'true'
    then
      v_blockers := array_append(v_blockers,
        'a specification search chose this model''s form but the holdout does not record '
        'whether the reported periods were withheld from it; treat skill_vs_naive as a '
        'selected maximum (re-run on a pipeline that records selection_independent)');
    end if;

    begin
      v_skill := (v_holdout ->> 'skill_vs_naive')::numeric;
    exception when others then
      v_skill := null;
    end;

    if v_skill is null then
      v_blockers := array_append(v_blockers, 'holdout evidence present but skill_vs_naive is missing');
    elsif v_skill <= 0 then
      v_blockers := array_append(v_blockers, format(
        'model does not beat predicting the training mean out-of-sample (skill_vs_naive=%s)',
        v_skill
      ));
    end if;
  end if;

  return jsonb_build_object(
    'exists',                true,
    'can_approve',           cardinality(v_blockers) = 0,
    'blockers',              to_jsonb(v_blockers),
    'governance',            v_gov,
    'holdout',               v_holdout,
    'holdout_present',       v_holdout is not null,
    'spec_search_present',   v_search is not null,
    'selection_independent', v_independent
  );
end;
$function$;

comment on function public.mmm_model_gate_status(uuid) is
  'Read-only: would approve_mmm_model accept this model, and if not, why. Refuses '
  'holdout evidence that is not independent of how the specification was chosen, '
  'because the gate binds on skill_vs_naive and a searched spec maximises it. '
  'Changes nothing.';
