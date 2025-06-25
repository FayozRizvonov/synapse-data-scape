
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
    data: Array<{ name: string; revenue: number; [key: string]: any }>;
  };
}

export const metricsKnowledgeBase: MetricCard[] = [
  // Key Metrics
  {
    id: 'revenue',
    title: 'QoQ Revenue Growth',
    value: '8.7%',
    change: '+40.3%',
    changeType: 'positive',
    comparison: 'vs last quarter',
    description: 'Strong growth driven by new respiratory product line',
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
      type: 'bar',
      data: [
        { name: 'Q1', revenue: 62 },
        { name: 'Q2', revenue: 87 },
        { name: 'Q3', revenue: 75 },
        { name: 'Q4', revenue: 95 }
      ]
    }
  },
  {
    id: 'prescriptions',
    title: 'Patient Share / Prescriptions',
    value: '34.2%',
    change: '+8.6%',
    changeType: 'positive',
    comparison: 'vs last quarter',
    description: 'Strong patient acquisition and retention',
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
    value: '1.8x',
    change: '+20.0%',
    changeType: 'positive',
    comparison: 'vs last quarter',
    description: 'Excellent conversion efficiency',
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
    title: 'Rebate Spend vs ROI',
    value: '4.3x',
    change: '+16.2%',
    changeType: 'positive',
    comparison: 'vs last quarter',
    description: 'Outstanding rebate program efficiency',
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
    id: 'market-access',
    title: 'Market Access Score',
    value: '87.3',
    change: '+12.1%',
    changeType: 'positive',
    comparison: 'vs last quarter',
    description: 'Strong market access positioning',
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
  },

  // Situation Metrics
  {
    id: 'total-sales',
    title: 'Total Sales',
    value: '$21.3M',
    change: '+85.2%',
    changeType: 'positive',
    comparison: 'Total Revenue',
    description: 'Outstanding total sales performance',
    icon: 'TrendingUp',
    category: 'situation',
    section: 'pharma-sm',
    keywords: ['total', 'sales', 'revenue', 'performance'],
    details: {
      description: 'Total sales showing outstanding performance across all channels',
      breakdown: [
        { label: 'Q1 Sales', value: '$18.2M' },
        { label: 'Q2 Sales', value: '$21.3M' },
        { label: 'Growth', value: '+17.0%' },
        { label: 'Target Achievement', value: '106.5%' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Q1', revenue: 182 },
        { name: 'Q2', revenue: 213 },
        { name: 'Target', revenue: 200 }
      ]
    }
  },
  {
    id: 'base-sales',
    title: 'Base Sales',
    value: '$12.0M',
    change: '+93.14%',
    changeType: 'positive',
    comparison: 'Revenue Attribution',
    description: 'Strong baseline revenue without marketing efforts',
    icon: 'BarChart3',
    category: 'situation',
    section: 'pharma-sm',
    keywords: ['base', 'sales', 'baseline', 'organic', 'revenue'],
    details: {
      description: 'Base sales representing organic revenue growth without promotional activities',
      breakdown: [
        { label: 'Organic Growth', value: '$8.2M' },
        { label: 'Repeat Customers', value: '$3.8M' },
        { label: 'Market Expansion', value: '$2.1M' },
        { label: 'Total Base', value: '$12.0M' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Organic', revenue: 82 },
        { name: 'Repeat', revenue: 38 },
        { name: 'Expansion', revenue: 21 }
      ]
    }
  },
  {
    id: 'incremental',
    title: 'Incremental',
    value: '$2.5M',
    change: '+18.2%',
    changeType: 'positive',
    comparison: 'Incremental Revenue',
    description: 'Strong marketing-driven revenue growth',
    icon: 'TrendingUp',
    category: 'situation',
    section: 'pharma-sm',
    keywords: ['incremental', 'marketing', 'driven', 'additional', 'revenue'],
    details: {
      description: 'Incremental revenue generated through marketing and promotional activities',
      breakdown: [
        { label: 'Digital Campaigns', value: '$1.2M' },
        { label: 'F2F Engagement', value: '$0.8M' },
        { label: 'Promotional Events', value: '$0.5M' },
        { label: 'Total Incremental', value: '$2.5M' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Digital', revenue: 12 },
        { name: 'F2F', revenue: 8 },
        { name: 'Events', revenue: 5 }
      ]
    }
  },
  {
    id: 'promotional-spend',
    title: 'Promotional Spend',
    value: '$3.7M',
    change: '+12.5%',
    changeType: 'positive',
    comparison: 'Total Promotional Budget',
    description: 'Well-balanced promotional spend allocation',
    icon: 'DollarSign',
    category: 'situation',
    section: 'pharma-sm',
    keywords: ['promotional', 'spend', 'budget', 'allocation', 'marketing'],
    details: {
      description: 'Promotional spend showing balanced allocation across channels',
      breakdown: [
        { label: 'Digital Marketing', value: '$1.5M' },
        { label: 'Field Force', value: '$1.2M' },
        { label: 'Events & Conferences', value: '$0.7M' },
        { label: 'Traditional Media', value: '$0.3M' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Digital', revenue: 15 },
        { name: 'Field', revenue: 12 },
        { name: 'Events', revenue: 7 },
        { name: 'Media', revenue: 3 }
      ]
    }
  },
  {
    id: 'seasonality',
    title: 'Seasonality',
    value: '$1.2M',
    change: '+6.86%',
    changeType: 'positive',
    comparison: 'Revenue Attribution',
    description: 'Clear seasonal patterns identified',
    icon: 'Calendar',
    category: 'situation',
    section: 'pharma-sm',
    keywords: ['seasonality', 'seasonal', 'patterns', 'cyclical', 'trends'],
    details: {
      description: 'Seasonal revenue patterns showing predictable cyclical trends',
      breakdown: [
        { label: 'Q1 Seasonal', value: '$0.8M' },
        { label: 'Q2 Seasonal', value: '$1.2M' },
        { label: 'Q3 Projected', value: '$1.5M' },
        { label: 'Q4 Projected', value: '$0.9M' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Q1', revenue: 8 },
        { name: 'Q2', revenue: 12 },
        { name: 'Q3', revenue: 15 },
        { name: 'Q4', revenue: 9 }
      ]
    }
  },
  {
    id: 'trend',
    title: 'Trend',
    value: '$0.8M',
    change: '+2.1%',
    changeType: 'positive',
    comparison: 'Revenue Attribution',
    description: 'Strong upward market trend',
    icon: 'TrendingUp',
    category: 'situation',
    section: 'pharma-sm',
    keywords: ['trend', 'market', 'upward', 'momentum', 'direction'],
    details: {
      description: 'Market trend analysis showing consistent upward momentum',
      breakdown: [
        { label: 'Monthly Trend', value: '+2.1%' },
        { label: 'Quarterly Trend', value: '+6.8%' },
        { label: 'Annual Trend', value: '+12.4%' },
        { label: 'Market Position', value: 'Leading' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Jan', revenue: 6 },
        { name: 'Feb', revenue: 7 },
        { name: 'Mar', revenue: 8 },
        { name: 'Apr', revenue: 8 }
      ]
    }
  },

  // Channel Performance Metrics
  {
    id: 'f2f-calls',
    title: 'F2F Calls',
    value: '$1.1M',
    change: '+7.5%',
    changeType: 'positive',
    comparison: 'Revenue Attribution',
    description: 'F2F rep engagement saw 12% decline',
    icon: 'Users',
    category: 'situation',
    section: 'pharma-sm',
    keywords: ['f2f', 'face to face', 'calls', 'rep', 'engagement', 'field'],
    details: {
      description: 'Face-to-face calls showing mixed performance with regional variations',
      breakdown: [
        { label: 'Total Calls', value: '2,450' },
        { label: 'Avg Call Duration', value: '18 min' },
        { label: 'Conversion Rate', value: '12.5%' },
        { label: 'Revenue per Call', value: '$449' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Calls', revenue: 2450 },
        { name: 'Conversions', value: 306 },
        { name: 'Revenue', revenue: 11 }
      ]
    }
  },
  {
    id: 'web-virtual-calls',
    title: 'Web Virtual Calls',
    value: '$0.9M',
    change: '+5.2%',
    changeType: 'positive',
    comparison: 'Revenue Attribution',
    description: 'Strong virtual call performance',
    icon: 'Activity',
    category: 'situation',
    section: 'pharma-sm',
    keywords: ['web', 'virtual', 'calls', 'online', 'digital', 'remote'],
    details: {
      description: 'Web-based virtual calls showing strong performance and engagement',
      breakdown: [
        { label: 'Total Virtual Calls', value: '1,850' },
        { label: 'Avg Session Time', value: '22 min' },
        { label: 'Engagement Rate', value: '78%' },
        { label: 'Revenue per Call', value: '$486' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Calls', revenue: 1850 },
        { name: 'Engaged', revenue: 1443 },
        { name: 'Revenue', revenue: 9 }
      ]
    }
  },
  {
    id: 'phone-calls',
    title: 'Phone Calls ABC',
    value: '$1.3M',
    change: '+2.5x',
    changeType: 'positive',
    comparison: 'ROI',
    description: 'Top performing channel with highest ROI',
    icon: 'Activity',
    category: 'situation',
    section: 'pharma-sm',
    keywords: ['phone', 'calls', 'abc', 'telephone', 'outreach', 'contact'],
    details: {
      description: 'Phone calls showing exceptional ROI and performance metrics',
      breakdown: [
        { label: 'Total Calls', value: '3,200' },
        { label: 'Connect Rate', value: '68%' },
        { label: 'Conversion Rate', value: '15.2%' },
        { label: 'Cost per Call', value: '$12' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Calls', revenue: 3200 },
        { name: 'Connected', revenue: 2176 },
        { name: 'Converted', revenue: 486 }
      ]
    }
  },
  {
    id: 'digital-display',
    title: 'Digital Pharma Display',
    value: '$0.9M',
    change: '+2.1x',
    changeType: 'positive',
    comparison: 'ROI',
    description: 'Strong digital display performance',
    icon: 'BarChart3',
    category: 'situation',
    section: 'pharma-sm',
    keywords: ['digital', 'display', 'pharma', 'advertising', 'banner', 'online'],
    details: {
      description: 'Digital display advertising showing strong performance and reach',
      breakdown: [
        { label: 'Impressions', value: '2.5M' },
        { label: 'Click-through Rate', value: '2.8%' },
        { label: 'Conversions', value: '1,420' },
        { label: 'Cost per Conversion', value: '$634' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Impressions', revenue: 2500 },
        { name: 'Clicks', revenue: 70 },
        { name: 'Conversions', revenue: 14 }
      ]
    }
  },
  {
    id: 'digital-video',
    title: 'Digital Pharma Video',
    value: '$1.2M',
    change: '+2.4x',
    changeType: 'positive',
    comparison: 'ROI',
    description: 'Best performing digital channel',
    icon: 'Activity',
    category: 'situation',
    section: 'pharma-sm',
    keywords: ['digital', 'video', 'pharma', 'streaming', 'multimedia', 'content'],
    details: {
      description: 'Digital video content delivering the best performance in digital channels',
      breakdown: [
        { label: 'Video Views', value: '850K' },
        { label: 'Engagement Rate', value: '12.5%' },
        { label: 'Completion Rate', value: '78%' },
        { label: 'Cost per View', value: '$1.41' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Views', revenue: 850 },
        { name: 'Engaged', revenue: 106 },
        { name: 'Completed', revenue: 663 }
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
        { label: 'Total Spend', value: '$265K' },
        { label: 'Projected Sales', value: '$21.3M' },
        { label: 'ROI Multiple', value: '2.7x' },
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
        { label: 'Total Spend', value: '$305K (+15%)' },
        { label: 'Projected Sales', value: '$24.5M' },
        { label: 'ROI Multiple', value: '2.9x' },
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
        { label: 'Total Spend', value: '$239K (-10%)' },
        { label: 'Projected Sales', value: '$19.17M' },
        { label: 'ROI Multiple', value: '2.4x' },
        { label: 'Profit Margin', value: '15%' }
      ]
    }
  }
];
