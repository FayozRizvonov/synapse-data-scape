import type { SupabaseClient } from '@supabase/supabase-js';
import type { MetricCard } from '@/data/metricsKnowledgeBase';

type MergedRow = { metric_key: string; card: MetricCard; sort_order: number };

export async function loadMergedPharmaMetrics(
  supabase: SupabaseClient,
  companyId: string | null,
  brandId: string | null = null,
): Promise<MetricCard[]> {
  const { data, error } = await supabase.rpc('get_pharma_sm_metrics_merged', {
    p_company_id: companyId,
    p_brand_id: brandId,
  });
  // A real failure has to throw. This used to fold errors into the same empty array as "no
  // rows", so when the function was missing from the database entirely every caller treated
  // it as an empty result and silently fell back to hardcoded numbers.
  if (error) {
    throw new Error(error.message ?? 'get_pharma_sm_metrics_merged failed');
  }
  if (!data?.length) return [];
  return (data as MergedRow[])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => r.card);
}

export function metricCardsToCompactKbPayload(metrics: MetricCard[]) {
  return metrics.map(
    ({
      id,
      title,
      value,
      change,
      changeType,
      comparison,
      description,
      details,
      chartData,
      keywords,
      category,
    }) => ({
      id,
      title,
      value,
      change,
      changeType,
      comparison,
      description,
      details,
      chartData,
      keywords,
      category,
    }),
  );
}
