
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  Pill, 
  DollarSign, 
  Target, 
  BarChart3, 
  Calendar 
} from 'lucide-react';

export interface MetricCard {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  comparison: string;
  description: string;
  icon: string;
  category: 'key' | 'situation' | 'scenario';
  section: string;
  keywords: string[];
  details?: {
    description: string;
    breakdown: Array<{ label: string; value: string }>;
  };
  chartData?: {
    type: 'bar' | 'line' | 'pie';
    valueKey?: string; // defaults to 'revenue'
    data: Array<{ name: string; [key: string]: number }>; 
  };
}

// The `situation` cards that used to live here have been removed. They are now derived in
// the database by `get_pharma_sm_metrics_merged` from monthly volume x price and the channel
// spend/ROI split, and reached through `usePharmaSmDashboardMetrics`.
//
// They were removed rather than corrected because the duplication was the defect. This file
// is the assistant's last-resort fallback, and while `get_pharma_sm_metrics_merged` did not
// exist it was silently serving every answer -- so the assistant reported a $20.8M total
// with a breakdown of Q1 $18.2M + Q2 $21.3M ($39.5M), beside a dashboard showing $21.3M for
// the same metric. A fallback copy of figures that are supposed to reconcile will always
// drift away from them; the assistant now says it cannot reach the metrics instead.
export const metricsKnowledgeBase: MetricCard[] = [
  // Key Metrics
  {
    id: 'revenue',
    title: 'QoQ Revenue Growth',
    value: '6.4%',
    change: '+30.1%',
    changeType: 'positive',
    comparison: 'vs last quarter',
    description: 'Driven by stroke clinic uptake and AFib adherence',
    icon: 'TrendingUp',
    category: 'key',
    section: 'pharma-sm',
    keywords: ['revenue', 'growth', 'quarter', 'qoq', 'sales'],
    details: {
      description: 'Quarterly revenue growth showing strong upward momentum',
      breakdown: [
        { label: 'Q1 Growth', value: '6.2%' },
        { label: 'Q2 Growth', value: '8.7%' },
        { label: 'Target', value: '7.5%' },
        { label: 'Variance', value: '+1.2%' }
      ]
    },
    chartData: {
      type: 'line',
      valueKey: 'value',
      data: [
        { name: 'Q1', value: 62 },
        { name: 'Q2', value: 87 },
        { name: 'Q3', value: 75 },
        { name: 'Q4', value: 95 }
      ]
    }
  },
  {
    id: 'prescriptions',
    title: 'Patient Share / Prescriptions',
    value: '32.8%',
    change: '+7.4%',
    changeType: 'positive',
    comparison: 'vs last quarter',
    description: 'Strong acquisition in South region',
    icon: 'Users',
    category: 'key',
    section: 'pharma-sm',
    keywords: ['prescriptions', 'patient', 'share', 'acquisition', 'retention'],
    details: {
      description: 'Patient market share demonstrating strong acquisition',
      breakdown: [
        { label: 'New Patients', value: '12.4%' },
        { label: 'Retained Patients', value: '21.8%' },
        { label: 'Market Share', value: '34.2%' },
        { label: 'Growth Rate', value: '+8.6%' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'New', revenue: 124 },
        { name: 'Retained', revenue: 218 },
        { name: 'Total', revenue: 342 }
      ]
    }
  },
  {
    id: 'sample-ratio',
    title: 'Sample-to-Script Ratio',
    value: '1.7x',
    change: '+18.2%',
    changeType: 'positive',
    comparison: 'vs last quarter',
    description: 'Improved sampling in stroke clinics',
    icon: 'Pill',
    category: 'key',
    section: 'pharma-sm',
    keywords: ['sample', 'script', 'conversion', 'ratio', 'efficiency'],
    details: {
      description: 'Sample to prescription conversion showing excellent efficiency',
      breakdown: [
        { label: 'Samples Distributed', value: '45,200' },
        { label: 'Scripts Generated', value: '25,100' },
        { label: 'Conversion Rate', value: '55.5%' },
        { label: 'Industry Average', value: '42.3%' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Samples', revenue: 452 },
        { name: 'Scripts', revenue: 251 },
        { name: 'Ratio', revenue: 180 }
      ]
    }
  },
  {
    id: 'roi',
    title: 'Promotion ROI',
    value: '2.6x',
    change: '+20.5%',
    changeType: 'positive',
    comparison: 'vs last quarter',
    description: 'Excellent digital and phone channel efficiency',
    icon: 'DollarSign',
    category: 'key',
    section: 'pharma-sm',
    keywords: ['rebate', 'roi', 'spend', 'return', 'investment'],
    details: {
      description: 'Rebate program showing outstanding return on investment',
      breakdown: [
        { label: 'Rebate Spend', value: '$2.1M' },
        { label: 'Revenue Generated', value: '$9.0M' },
        { label: 'ROI Multiple', value: '4.3x' },
        { label: 'Cost Efficiency', value: '23.3%' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Spend', revenue: 21 },
        { name: 'Return', revenue: 90 },
        { name: 'Net', revenue: 69 }
      ]
    }
  },
  {
    id: 'payer-access',
    title: 'Payer Access Score',
    value: '85.6',
    change: '+10.2%',
    changeType: 'positive',
    comparison: 'vs last quarter',
    description: 'Strong formulary positioning',
    icon: 'Target',
    category: 'key',
    section: 'pharma-sm',
    keywords: ['market', 'access', 'score', 'positioning', 'coverage'],
    details: {
      description: 'Market access score indicating strong positioning',
      breakdown: [
        { label: 'Formulary Coverage', value: '92%' },
        { label: 'Prior Auth Rate', value: '18%' },
        { label: 'Step Therapy', value: '12%' },
        { label: 'Overall Score', value: '87.3' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Coverage', revenue: 92 },
        { name: 'Access', revenue: 87 },
        { name: 'Score', revenue: 87 }
      ]
    }
  }
];

// Helper functions
export const findMetricByQuery = (query: string): MetricCard | undefined => {
  const lowerQuery = query.toLowerCase();
  return metricsKnowledgeBase.find(metric => 
    metric.keywords.some(keyword => lowerQuery.includes(keyword.toLowerCase())) ||
    lowerQuery.includes(metric.title.toLowerCase())
  );
};

export const getMetricById = (id: string): MetricCard | undefined => {
  return metricsKnowledgeBase.find(metric => metric.id === id);
};

export const getMetricsByCategory = (category: 'key' | 'situation' | 'scenario'): MetricCard[] => {
  return metricsKnowledgeBase.filter(metric => metric.category === category);
};

// `getTopPerformingChannels`, `getRegionalPerformance`, `getMarketingRecommendations` and
// `getScenarioComparisons` were removed. They were hand-authored copies of figures that the
// database now owns -- scenarios in particular live in `demo_dashboard_data` and are read by
// ScenarioComparison -- but nothing consumed them: `useAIAssistant` exposed each one on its
// context as `getTopChannels` / `getRegionalData` / `getRecommendations` / `getScenarios`,
// and no component ever destructured any of them. They were deleted rather than pointed at
// Supabase because wiring unreachable API surface to a live source buys nothing, and a
// second copy of reconciled figures only drifts.
//
// Note the assistant still has no scenario figures: the `kb` payload carries metric cards
// only, and the orchestrator replaces it with pharma situation metrics server-side
// (supabase/functions/_shared/tenant-brain.ts). Giving the assistant scenarios is an
// orchestrator change, not a frontend one.
