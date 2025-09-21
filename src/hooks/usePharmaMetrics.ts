import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RoiCard {
  id: string;
  title: string;
  roi_ratio: string;
  roi_percentage: string;
  incremental_revenue?: string;
  total_cost?: string;
  efficiency: 'High' | 'Medium' | 'Low';
  change?: string;
  changeType?: 'positive' | 'negative';
  activity_level?: string;
}

export interface MetricCard {
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
}

type OutputsRow = {
  id: string;
  output_type: string;
  output_data: any;
  generated_at: string;
};

const CHANNEL_TITLES: Record<string, string> = {
  'clm_call': 'CLM Calls',
  'phone_call': 'Phone Calls',
  'webinar': 'Webinars',
  'mass_email': 'Mass Email',
  'email_1to1': '1:1 Email',
  'digital_display': 'Digital Display',
  'digital_video': 'Digital Video',
  'medscape_banner': 'Medscape Banner',
};

function toEfficiency(roi: number): 'High' | 'Medium' | 'Low' {
  if (roi >= 20) return 'High';
  if (roi >= 10) return 'Medium';
  return 'Low';
}

export function usePharmaMetrics(params: { projectId: string; period?: string; autoRefresh?: boolean; refreshInterval?: number; }) {
  const { projectId, autoRefresh = true, refreshInterval = 60000 } = params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<OutputsRow | null>(null);
  const [uiRow, setUiRow] = useState<any | null>(null);

  const fetchLatest = async () => {
    try {
      setLoading(true);
      setError(null);
      // outputs for model-driven sections
      const { data, error } = await supabase
        .from('mmm_model_outputs')
        .select('id, output_type, output_data, generated_at')
        .eq('project_id', projectId)
        .eq('output_type', 'outputs')
        .order('generated_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      setRow((data && data.length > 0 ? data[0] : null) as any);
      // UI-friendly key metrics snapshot
      const { data: uiData, error: uiErr } = await supabase
        .from('mmm_ui_key_metrics')
        .select('*')
        .eq('project_id', projectId)
        .order('generated_at', { ascending: false })
        .limit(1);
      if (uiErr) throw uiErr;
      setUiRow(uiData && uiData[0] ? uiData[0] : null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatest();
    if (!autoRefresh) return;
    const id = setInterval(fetchLatest, refreshInterval);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const modelMetrics = useMemo(() => {
    const r2 = row?.output_data?.model_metrics?.r_squared ?? null;
    const mape = row?.output_data?.model_metrics?.mape ?? null;
    return { r2, mape };
  }, [row]);

  const roiAnalysis: RoiCard[] = useMemo(() => {
    const roiObj: Record<string, number> = row?.output_data?.roi ?? {};
    return Object.entries(roiObj)
      .filter(([k]) => CHANNEL_TITLES[k])
      .sort((a, b) => b[1] - a[1])
      .map(([id, roi]) => ({
        id,
        title: CHANNEL_TITLES[id] ?? id,
        roi_ratio: roi.toFixed(2),
        roi_percentage: `${(roi * 100).toFixed(1)}%`,
        efficiency: toEfficiency(roi),
        change: '',
        changeType: 'positive',
      }));
  }, [row]);

  const keyMetrics: MetricCard[] = useMemo(() => {
    // Include all ROI channels as Key Metrics (sorted desc in roiAnalysis)
    return roiAnalysis.map((r) => ({
      id: r.id,
      title: r.title,
      value: r.roi_ratio + 'x',
      change: r.efficiency === 'High' ? '+ High' : r.efficiency === 'Medium' ? '≈ Medium' : '~ Low',
      changeType: r.efficiency === 'Low' ? 'negative' : 'positive',
      comparison: 'ROI by channel',
      icon: 'BarChart3',
      category: 'key',
      section: 'key-metrics',
      description: 'Live ROI from MMM outputs',
    }));
  }, [roiAnalysis]);

  // UI Key Metrics from dataset snapshot
  const uiKeyMetrics: MetricCard[] = useMemo(() => {
    if (!uiRow) return [];
    const fmt = (n: number, digits = 0) =>
      Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: digits }) : '—';
    const percent = (n: number) => (Number.isFinite(n) ? `${n.toFixed(1)}%` : '—');
    const mk = (id: string, title: string, value: string, icon: string, comparison = ''): MetricCard => ({
      id, title, value, change: '', changeType: 'positive', comparison, icon, category: 'key', section: 'key-metrics', description: ''
    });
    const cards: MetricCard[] = [];
    if (uiRow.patient_share != null) {
      cards.push(mk('patient-share', 'Patient Share / Prescriptions', percent(Number(uiRow.patient_share)), 'Users', 'vs. last quarter'));
    }
    if (uiRow.sample_to_script_ratio != null) {
      cards.push(mk('sample-ratio', 'Sample-to-Script Ratio', `${Number(uiRow.sample_to_script_ratio).toFixed(1)}x`, 'Pill', 'vs. last quarter'));
    }
    if (uiRow.roi != null) {
      cards.push(mk('roi', 'Rebate Spend vs ROI', `${Number(uiRow.roi).toFixed(1)}x`, 'DollarSign', 'vs. last quarter'));
    }
    if (uiRow.market_access_score != null) {
      cards.push(mk('market-access', 'Market Access Score', fmt(Number(uiRow.market_access_score), 1), 'Target', 'vs. last quarter'));
    }
    if (uiRow.webvirtual_call != null || uiRow.phone_call != null) {
      const v = Number(uiRow.webvirtual_call ?? uiRow.phone_call ?? 0);
      cards.push(mk('phone-web-calls', 'Phone Web Calls', fmt(v), 'Phone', `${uiRow.webvirtual_call_cost ? `$${fmt(Number(uiRow.webvirtual_call_cost)/1000)}K cost` : ''}`));
    }
    if (uiRow.digital_display != null) {
      cards.push(mk('digital-dtc-company', 'Digital DTC Company', fmt(Number(uiRow.digital_display)), 'Monitor', `${uiRow.digital_display_cost ? `$${fmt(Number(uiRow.digital_display_cost)/1000)}K cost` : ''}`));
    }
    if (uiRow.f2f_call != null || uiRow.clm_call != null) {
      const v = Number(uiRow.f2f_call ?? uiRow.clm_call ?? 0);
      cards.push(mk('f2f-calls-new', 'F2F Calls', fmt(v), 'HeartHandshake', `${uiRow.f2f_call_cost ? `$${fmt(Number(uiRow.f2f_call_cost)/1000)}K cost` : ''}`));
    }
    if (uiRow.mass_email != null) {
      cards.push(mk('mass-email', 'Mass Email', fmt(Number(uiRow.mass_email)), 'Mail', `${uiRow.mass_email_cost ? `$${fmt(Number(uiRow.mass_email_cost)/1000)}K cost` : ''}`));
    }
    if (uiRow.medscape_banner != null) {
      cards.push(mk('medscape-banner', 'Medscape Banner', fmt(Number(uiRow.medscape_banner)), 'FileText', `${uiRow.medscape_banner_cost ? `$${fmt(Number(uiRow.medscape_banner_cost)/1000)}K cost` : ''}`));
    }
    return cards;
  }, [uiRow]);

  return {
    loading,
    error,
    keyMetrics, // model-driven key metrics (kept for completeness)
    uiKeyMetrics, // dataset-driven key metrics for the UI
    situationMetrics: [] as MetricCard[],
    modelOutputs: row?.output_data ?? null,
    roiAnalysis,
    promotionalImpact: [] as any[],
    salesVolumeData: [] as any[],
    salesBreakdownData: [] as any[],
    refreshData: fetchLatest,
    setPeriod: (_: string) => {},
  };
}

export function useModelPerformanceStats(params: { projectId: string }) {
  const { projectId } = params;
  const [rSquared, setR2] = useState(0);
  const [mape, setMape] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from('mmm_model_outputs')
          .select('output_data, generated_at')
          .eq('project_id', projectId)
          .eq('output_type', 'outputs')
          .order('generated_at', { ascending: false })
          .limit(1);
        if (error) throw error;
        const row = (data && data[0]) as any;
        const r2 = row?.output_data?.model_metrics?.r_squared ?? 0;
        const m = row?.output_data?.model_metrics?.mape ?? 0;
        setR2(r2);
        setMape(m);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  return { rSquared, adjRSquared: rSquared, mape, durbinWatson: 0, aic: 0, bic: 0, loading, error };
}


