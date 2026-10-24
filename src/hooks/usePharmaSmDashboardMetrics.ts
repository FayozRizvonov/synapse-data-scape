import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { loadMergedPharmaMetrics } from '@/lib/pharmaSmMetrics';
import type { MetricCard } from '@/data/metricsKnowledgeBase';
import {
  pharmaSmFallbackCards,
  PHARMA_SM_FALLBACK_SNAPSHOT_DATE,
} from '@/data/pharmaSmFallback';

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

function splitCards(cards: MetricCard[]) {
  return {
    key: cards.filter((c) => c.category === 'key').map(toFarmaCard),
    situation: cards.filter((c) => c.category === 'situation').map(toFarmaCard),
  };
}

/**
 * Merged PHARMA S&M cards (global + company/brand overrides).
 *
 * Returns { data, loading, error, usedFallback }.
 *
 * `error` matters on its own: `get_pharma_sm_metrics_merged` did not exist for the whole time
 * this hook was in the tree, and because the failure was swallowed the callers quietly
 * rendered hardcoded copies instead. A fetch that fails now says so.
 *
 * On failure the cards fall back to `pharmaSmFallbackCards`, a GENERATED snapshot of the same
 * function, so a Supabase blip during a client demo shows correct figures instead of an empty
 * section. That is a deliberate trade: a stale-but-reconciled snapshot beats both an error
 * panel in front of a client and a hand-maintained copy that drifts. `usedFallback` and a
 * console warning make it observable, so the snapshot cannot pass itself off as live data.
 */
export function usePharmaSmDashboardMetrics() {
  const { companyId } = useAuth();
  const [split, setSplit] = useState<{
    key: FarmaSmCard[];
    situation: FarmaSmCard[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setUsedFallback(false);

    const applyFallback = (why: string) => {
      console.warn(
        `Pharma S&M metrics: ${why}. Falling back to the generated snapshot of ` +
          `${PHARMA_SM_FALLBACK_SNAPSHOT_DATE} — these figures are not live. ` +
          `Regenerate with: node scripts/generate-pharma-sm-fallback.mjs`,
      );
      setSplit(splitCards(pharmaSmFallbackCards));
      setUsedFallback(true);
    };

    (async () => {
      try {
        const merged = await loadMergedPharmaMetrics(supabase, companyId ?? null, null);
        if (cancelled) return;
        if (merged.length === 0) applyFallback('the query returned no rows');
        else setSplit(splitCards(merged));
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        console.error('Pharma S&M metrics fetch failed:', err);
        setError(message);
        applyFallback(`the query failed (${message})`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return { data: split, loading, error, usedFallback };
}
