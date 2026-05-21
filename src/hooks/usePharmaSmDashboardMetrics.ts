import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { loadMergedPharmaMetrics } from '@/lib/pharmaSmMetrics';
import type { MetricCard } from '@/data/metricsKnowledgeBase';

/** Subset of FarmaMetrics' local card shape: key + situation rows from Supabase. */
export type FarmaSmCard = {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  comparison: string;
  icon: string;
  category: 'key' | 'situation';
  section: 'key-metrics' | 'situation' | 'scenario-comparison';
  description?: string;
  keywords?: string[];
  chartData?: MetricCard['chartData'];
  details?: {
    description: string;
    breakdown: Array<{ label: string; value: string }>;
  };
};

function toFarmaCard(m: MetricCard): FarmaSmCard {
  const isKey = m.category === 'key';
  return {
    id: m.id,
    title: m.title,
    value: m.value,
    change: m.change,
    changeType: m.changeType,
    comparison: m.comparison,
    icon: m.icon,
    category: isKey ? 'key' : 'situation',
    section: isKey ? 'key-metrics' : 'situation',
    description: m.description,
    keywords: m.keywords,
    chartData: m.chartData,
    details: m.details ?? {
      description: m.description,
      breakdown: [],
    },
  };
}

/**
 * Merged PHARMA S&M cards (global + company/brand overrides).
 * Returns { data, loading } — data is null if DB empty or error.
 */
export function usePharmaSmDashboardMetrics() {
  const { companyId } = useAuth();
  const [split, setSplit] = useState<{
    key: FarmaSmCard[];
    situation: FarmaSmCard[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const merged = await loadMergedPharmaMetrics(supabase, companyId ?? null, null);
        if (cancelled) return;
        if (merged.length === 0) {
          setSplit(null);
        } else {
          const key = merged.filter((c) => c.category === 'key').map(toFarmaCard);
          const situation = merged
            .filter((c) => c.category === 'situation')
            .map(toFarmaCard);
          setSplit({ key, situation });
        }
      } catch {
        if (!cancelled) setSplit(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return { data: split, loading };
}
