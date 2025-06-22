
export interface MetricCard {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  comparison: string;
  icon: string;
  category: 'key' | 'situation' | 'scenario';
  details?: {
    description: string;
    breakdown: Array<{ label: string; value: string; }>;
  };
  section: 'key-metrics' | 'situation' | 'scenario-comparison';
  chartData?: any;
}

export const metricsKnowledgeBase: MetricCard[] = [
  // Key Metrics
  {
    id: 'revenue',
    title: 'QoQ Revenue Growth',
    value: '8.7%',
    change: '+40.3%',
    changeType: 'positive',
    comparison: 'vs. last quarter',
    icon: 'TrendingUp',
    category: 'key',
    section: 'key-metrics',
    details: {
      description: 'Quarterly revenue growth showing strong upward trend',
      breakdown: [
        { label: 'Q1 Growth', value: '6.2%' },
        { label: 'Q2 Growth', value: '7.8%' },
        { label: 'Q3 Growth', value: '8.7%' }
      ]
    }
  },
  {
    id: 'prescriptions',
    title: 'Patient Share / Prescriptions',
    value: '34.2%',
    change: '+8.6%',
    changeType: 'positive',
    comparison: 'vs. last quarter',
    icon: 'Users',
    category: 'key',
    section: 'key-metrics',
    details: {
      description: 'Market share of prescriptions and patient coverage',
      breakdown: [
        { label: 'New Patients', value: '12.4%' },
        { label: 'Recurring', value: '21.8%' },
        { label: 'Referrals', value: '8.2%' }
      ]
    }
  },
  {
    id: 'sample-ratio',
    title: 'Sample-to-Script Ratio',
    value: '1.8x',
    change: '+20.0%',
    changeType: 'positive',
    comparison: 'vs. last quarter',
    icon: 'Pill',
    category: 'key',
    section: 'key-metrics',
    details: {
      description: 'Efficiency of sample distribution to prescription conversion',
      breakdown: [
        { label: 'Samples Distributed', value: '45.2K' },
        { label: 'Scripts Generated', value: '25.1K' },
        { label: 'Conversion Rate', value: '55.5%' }
      ]
    }
  },
  {
    id: 'roi',
    title: 'Rebate Spend vs ROI',
    value: '4.3x',
    change: '+16.2%',
    changeType: 'positive',
    comparison: 'vs. last quarter',
    icon: 'DollarSign',
    category: 'key',
    section: 'key-metrics',
    details: {
      description: 'Return on investment for rebate spending programs',
      breakdown: [
        { label: 'Total Rebates', value: '$2.4M' },
        { label: 'Revenue Generated', value: '$10.3M' },
        { label: 'Net ROI', value: '330%' }
      ]
    }
  },
  {
    id: 'market-access',
    title: 'Market Access Score',
    value: '87.3',
    change: '+12.1%',
    changeType: 'positive',
    comparison: 'vs. last quarter',
    icon: 'Target',
    category: 'key',
    section: 'key-metrics',
    details: {
      description: 'Overall market accessibility and penetration score',
      breakdown: [
        { label: 'Formulary Coverage', value: '92%' },
        { label: 'Prior Auth Rate', value: '18%' },
        { label: 'Step Therapy', value: '12%' }
      ]
    }
  },
  // Situation Metrics
  {
    id: 'base-sales',
    title: 'Base Sales',
    value: '$12.0M',
    change: '+93.14%',
    changeType: 'positive',
    comparison: 'Revenue Attribution',
    icon: 'Activity',
    category: 'situation',
    section: 'situation',
    details: {
      description: 'This base sales component represents the baseline revenue that would occur without any marketing efforts in the marketing mix model.',
      breakdown: [
        { label: 'Confidence Interval', value: '85%' },
        { label: 'P-value', value: '0.01' },
        { label: 'Historical Impact', value: '2019-2023' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'J', revenue: 210000 },
        { name: 'F', revenue: 320000 },
        { name: 'M', revenue: 380000 },
        { name: 'A', revenue: 450000 },
        { name: 'M', revenue: 520000 },
        { name: 'J', revenue: 410000 },
        { name: 'J', revenue: 350000 },
        { name: 'A', revenue: 460000 },
        { name: 'S', revenue: 490000 },
        { name: 'O', revenue: 380000 },
        { name: 'N', revenue: 310000 },
        { name: 'D', revenue: 470000 },
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
    icon: 'Calendar',
    category: 'situation',
    section: 'situation',
    details: {
      description: 'Seasonal revenue patterns and cyclical business variations',
      breakdown: [
        { label: 'Q1 Seasonal Impact', value: '$0.3M' },
        { label: 'Q2 Seasonal Impact', value: '$0.4M' },
        { label: 'Q3 Seasonal Impact', value: '$0.5M' }
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
    icon: 'BarChart3',
    category: 'situation',
    section: 'situation',
    details: {
      description: 'Digital display advertising performance and attribution',
      breakdown: [
        { label: 'Recommended Spend', value: '$400K' },
        { label: 'Optimal Frequency', value: '8/month' },
        { label: 'Response Lag', value: '2 weeks' }
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
    icon: 'Activity',
    category: 'situation',
    section: 'situation',
    details: {
      description: 'Video marketing campaign performance and effectiveness',
      breakdown: [
        { label: 'Recommended Spend', value: '$500K' },
        { label: 'Optimal Frequency', value: '12/month' },
        { label: 'Decay Rate', value: '8% monthly' }
      ]
    }
  },
  {
    id: 'page-visit-exchange',
    title: 'Page Visit ViV Exchange',
    value: '$0.5M',
    change: '+1.8x',
    changeType: 'positive',
    comparison: 'ROI',
    icon: 'Target',
    category: 'situation',
    section: 'situation',
    details: {
      description: 'Website engagement and visitor exchange program performance',
      breakdown: [
        { label: 'Recommended Spend', value: '$630K' },
        { label: 'Optimal Frequency', value: '11/month' },
        { label: 'Response Lag', value: '4 weeks' }
      ]
    }
  }
];

export const findMetricByQuery = (query: string): MetricCard | null => {
  const normalizedQuery = query.toLowerCase();
  
  // Exact matches
  const exactMatch = metricsKnowledgeBase.find(metric => 
    metric.title.toLowerCase().includes(normalizedQuery) ||
    metric.id.includes(normalizedQuery.replace(/\s+/g, '-'))
  );
  
  if (exactMatch) return exactMatch;
  
  // Keyword matches
  const keywords = normalizedQuery.split(' ');
  const keywordMatch = metricsKnowledgeBase.find(metric => 
    keywords.some(keyword => 
      metric.title.toLowerCase().includes(keyword) ||
      metric.description?.toLowerCase().includes(keyword)
    )
  );
  
  return keywordMatch || null;
};

export const getAllMetricsByCategory = (category: 'key' | 'situation' | 'scenario') => {
  return metricsKnowledgeBase.filter(metric => metric.category === category);
};
