
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

export const getTopPerformingChannels = () => [
  { channel: 'Phone Calls ABC', roi: '2.5x', spend: '$520K', performance: 'Top performer' },
  { channel: 'Digital Pharma Video', roi: '2.4x', spend: '$500K', performance: 'Best digital channel' },
  { channel: 'Web Virtual Calls ABC', roi: '2.2x', spend: '$410K', performance: 'Strong virtual performance' },
  { channel: 'Digital Pharma Display', roi: '2.1x', spend: '$430K', performance: 'Good digital performance' },
  { channel: 'Veeva Emails', roi: '1.9x', spend: '$420K', performance: 'Good email performance' }
];

export const getRegionalPerformance = () => [
  { region: 'South Region', performance: '85% rep call coverage, +6% script lift', target: '80%', gap: '+5%' },
  { region: 'Central Region', performance: '62% coverage, −3% script lift', target: '75%', gap: '-13%' },
  { region: 'North Region', performance: '58% coverage, flat script trend', target: '70%', gap: '-12%' }
];

export const getMarketingRecommendations = (): MetricCard[] => [
  {
    id: 'f2f-east-region',
    title: 'Increase F2F Calls in East Region',
    value: 'High Impact',
    change: 'β=2.34',
    changeType: 'positive',
    comparison: 'ROI Coefficient',
    description: 'Highest ROI region for F2F calls',
    icon: 'Target',
    category: 'scenario',
    section: 'recommendations',
    keywords: ['f2f', 'east', 'region', 'high impact'],
    details: {
      description: 'East region shows highest potential for F2F call optimization',
      breakdown: [
        { label: 'Current Coverage', value: '45%' },
        { label: 'Target Coverage', value: '75%' },
        { label: 'Expected ROI', value: '2.34x' },
        { label: 'Investment Required', value: '$250K' }
      ]
    }
  }
];

export const getScenarioComparisons = (): MetricCard[] => [
  {
    id: 'scenario-baseline',
    title: 'Baseline Scenario',
    value: '$21.3M',
    change: '2.7x',
    changeType: 'positive',
    comparison: 'ROI',
    description: 'Current plan projection',
    icon: 'BarChart3',
    category: 'scenario',
    section: 'scenarios',
    keywords: ['baseline', 'current', 'plan'],
    details: {
      description: 'Baseline scenario based on current marketing plan',
      breakdown: [
        { label: 'Media Spend', value: '$1.20M' },
        { label: 'Projected Sales', value: '$21.3M' },
        { label: 'Incremental ROI', value: '2.7x' },
        { label: 'Profit Margin', value: '18%' }
      ]
    }
  },
  {
    id: 'scenario-optimistic',
    title: 'Optimistic Scenario',
    value: '$24.5M',
    change: '2.9x',
    changeType: 'positive',
    comparison: 'ROI',
    description: 'Optimistic growth projection with 15% spend increase',
    icon: 'TrendingUp',
    category: 'scenario',
    section: 'scenarios',
    keywords: ['optimistic', 'growth', 'increase'],
    details: {
      description: 'Optimistic scenario with increased marketing investment',
      breakdown: [
        { label: 'Media Spend', value: '$1.38M (+15%)' },
        { label: 'Projected Sales', value: '$24.5M' },
        { label: 'Incremental ROI', value: '2.9x' },
        { label: 'Profit Margin', value: '21%' }
      ]
    }
  },
  {
    id: 'scenario-pessimistic',
    title: 'Pessimistic Scenario',
    value: '$19.17M',
    change: '2.4x',
    changeType: 'negative',
    comparison: 'ROI',
    description: 'Conservative projection with 10% spend reduction',
    icon: 'TrendingDown',
    category: 'scenario',
    section: 'scenarios',
    keywords: ['pessimistic', 'conservative', 'reduction'],
    details: {
      description: 'Conservative scenario with reduced marketing spend',
      breakdown: [
        { label: 'Media Spend', value: '$1.08M (-10%)' },
        { label: 'Projected Sales', value: '$19.17M' },
        { label: 'Incremental ROI', value: '2.4x' },
        { label: 'Profit Margin', value: '15%' }
      ]
    }
  }
];
