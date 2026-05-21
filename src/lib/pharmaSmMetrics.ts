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
  if (error || !data?.length) return [];
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
