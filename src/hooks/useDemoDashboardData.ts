import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_PROJECT_ID, isValidProjectId } from '@/constants/project';

/**
 * Presentation data for the client demo, served from Supabase.
 *
 * These figures used to be hardcoded in the components that drew them, which is why
 * they disagreed with each other: nothing forced the spend split to total 100%, or the
 * bar chart's sales figure to match the table's. They now live in
 * `demo_dashboard_data`, one row per section, so there is a single place to change them
 * and a single source for every chart that shows them.
 *
 * This is deliberately NOT in `mmm_model_outputs` — those are real model outputs, and
 * hand-authored demo numbers sitting beside them would eventually be read as results.
 */

export type ScenarioKey = 'baseline' | 'optimistic' | 'pessimistic';

export interface DemoScenario {
  key: ScenarioKey;
  label: string;
  sort: number;
  total_sales_m: number;
  base_sales_m: number;
  media_sales_m: number;
  total_spend_m: number;
  incremental_roi: number;
  profit_margin_pct: number;
  channel_roi: Record<string, number>;
}

export interface ScenarioComparisonData {
  currency: string;
  unit: string;
  roi_basis: string;
  roi_label: string;
  note?: string;
  scenarios: DemoScenario[];
}

export interface SpendAllocationChannel {
  name: string;
  current_pct: number;
  optimized_pct: number;
  current_k: number;
  optimized_k: number;
}

export interface SpendAllocationData {
  currency: string;
  budget_m: number;
  note?: string;
  channels: SpendAllocationChannel[];
}

export interface SalesForecastPoint {
  name: string;
  actual: number | null;
  baseline: number;
  optimistic: number;
  pessimistic: number;
}

export interface SalesForecastData {
  unit: string;
  currency: string;
  actual_through: string;
  note?: string;
  points: SalesForecastPoint[];
}

export interface RoiForecastPoint {
  name: string;
  sf_calls: number;
  digital: number;
  email: number;
  web_virtual: number;
  overall: number;
}

export interface RoiForecastData {
  roi_basis: string;
  note?: string;
  points: RoiForecastPoint[];
}

export interface DemoDashboardData {
  scenario_comparison?: ScenarioComparisonData;
  spend_allocation?: SpendAllocationData;
  sales_forecast?: SalesForecastData;
  roi_forecast?: RoiForecastData;
}

export function useDemoDashboardData(projectId: string = DEMO_PROJECT_ID) {
  const [data, setData] = useState<DemoDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // `project_id` is a uuid column — a non-uuid makes Postgres reject the whole
      // query (22P02), which surfaces as an empty dashboard rather than an error.
      if (!isValidProjectId(projectId)) {
        setError(`Invalid project id ${JSON.stringify(projectId)} — expected a UUID`);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: rows, error: err } = await supabase
          .from('demo_dashboard_data')
          .select('key, payload')
          .eq('project_id', projectId);

        if (err) throw err;
        if (cancelled) return;

        const next: DemoDashboardData = {};
        for (const row of rows ?? []) {
          (next as Record<string, unknown>)[row.key as string] = row.payload;
        }
        setData(next);
      } catch (e) {
        if (!cancelled) setError((e as Error)?.message ?? 'Failed to load demo data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return { data, loading, error };
}
