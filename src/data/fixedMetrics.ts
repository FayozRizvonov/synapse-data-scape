export const fixedSituationMetrics = [
  {
    id: 'total-sales',
    title: 'Total Sales',
    value: '$19.5M',
    change: '+85.2%',
    changeType: 'positive' as const,
    comparison: 'Total Revenue',
    description: 'Total sales revenue including all attributions for the current period',
    keywords: ['total', 'sales', 'revenue'],
    icon: 'DollarSign',
    category: 'situation' as const,
    section: 'situation',
    details: {
      description: 'Total sales revenue including all attributions for the current period.',
      breakdown: [
        { label: 'All Channels', value: '$19.5M' },
        { label: 'Growth YoY', value: '+85.2%' },
        { label: 'Net Sales', value: '$18.7M' }
      ]
    }
  },
  {
    id: 'base-sales',
    title: 'Base Sales',
    value: '$12.0M',
    change: '+93.14%',
    changeType: 'positive' as const,
    comparison: 'Revenue Attribution',
    description: 'This base sales component represents the baseline revenue that would occur without any marketing efforts',
    keywords: ['base', 'sales', 'baseline', 'revenue'],
    icon: 'Activity',
    category: 'situation' as const,
    section: 'situation',
    details: {
      description: 'This base sales component represents the baseline revenue that would occur without any marketing efforts in the marketing mix model.',
      breakdown: [
        { label: 'Confidence Interval', value: '85%' },
        { label: 'P-value', value: '0.01' },
        { label: 'Historical Impact', value: '2019-2023' }
      ]
    }
  },
  {
    id: 'incremental',
    title: 'Incremental',
    value: '$2.5M',
    change: '+18.2%',
    changeType: 'positive' as const,
    comparison: 'Incremental Revenue',
    description: 'Revenue generated above the baseline due to marketing activities',
    keywords: ['incremental', 'marketing', 'revenue'],
    icon: 'BarChart3',
    category: 'situation' as const,
    section: 'situation',
    details: {
      description: 'Revenue generated above the baseline due to marketing activities.',
      breakdown: [
        { label: 'Digital Channels', value: '$1.5M' },
        { label: 'Traditional Media', value: '$0.8M' },
        { label: 'Events & Sampling', value: '$0.7M' },
        { label: 'Total Incremental', value: '$3.0M' }
      ]
    }
  },
  {
    id: 'promotional-spend',
    title: 'Promotional Spend',
    value: '$3.7M',
    change: '+12.5%',
    changeType: 'positive' as const,
    comparison: 'Total Promotional Budget',
    description: 'Total investment in promotional activities and marketing campaigns',
    keywords: ['promotional', 'spend', 'budget', 'marketing'],
    icon: 'DollarSign',
    category: 'situation' as const,
    section: 'situation',
    details: {
      description: 'Total investment in promotional activities and marketing campaigns.',
      breakdown: [
        { label: 'Digital Marketing', value: '$1.8M' },
        { label: 'Traditional Advertising', value: '$0.9M' },
        { label: 'Field Activities', value: '$0.7M' },
        { label: 'Events & Conferences', value: '$0.3M' }
      ]
    }
  },
  {
    id: 'seasonality',
    title: 'Seasonality',
    value: '$1.2M',
    change: '+6.86%',
    changeType: 'positive' as const,
    comparison: 'Revenue Attribution',
    description: 'Revenue variation due to seasonal patterns and trends',
    keywords: ['seasonality', 'seasonal', 'patterns', 'trends'],
    icon: 'Calendar',
    category: 'situation' as const,
    section: 'situation',
    details: {
      description: 'Revenue variation due to seasonal patterns and trends.',
      breakdown: [
        { label: 'Q1 Impact', value: '$0.8M' },
        { label: 'Q2 Impact', value: '$1.2M' },
        { label: 'Q3 Projected', value: '$1.5M' },
        { label: 'Q4 Projected', value: '$0.9M' }
      ]
    }
  },
  {
    id: 'trend',
    title: 'Trend',
    value: '$0.8M',
    change: '+2.1%',
    changeType: 'positive' as const,
    comparison: 'Revenue Attribution',
    description: 'Long-term market trends affecting revenue growth',
    keywords: ['trend', 'market', 'growth', 'momentum'],
    icon: 'TrendingUp',
    category: 'situation' as const,
    section: 'situation',
    details: {
      description: 'Long-term market trends affecting revenue growth.',
      breakdown: [
        { label: 'Market Growth', value: '$0.5M' },
        { label: 'Competitive Impact', value: '$0.2M' },
        { label: 'Economic Factors', value: '$0.1M' }
      ]
    }
  },
  {
    id: 'f2f-calls',
    title: 'F2F Calls',
    value: '$1.1M',
    change: '+7.5%',
    changeType: 'positive' as const,
    comparison: 'Revenue Attribution',
    description: 'Revenue from face-to-face sales representative calls',
    keywords: ['f2f', 'face-to-face', 'calls', 'sales', 'reps'],
    icon: 'Users',
    category: 'situation' as const,
    section: 'situation',
    details: {
      description: 'Revenue from face-to-face sales representative calls.',
      breakdown: [
        { label: 'Call Volume', value: '2,450' },
        { label: 'Conversion Rate', value: '12.3%' },
        { label: 'Avg Revenue/Call', value: '$449' }
      ]
    }
  },
  {
    id: 'web-virtual-calls',
    title: 'Web Virtual Calls',
    value: '$0.9M',
    change: '+5.2%',
    changeType: 'positive' as const,
    comparison: 'Revenue Attribution',
    description: 'Revenue from web-based virtual sales calls and presentations',
    keywords: ['web', 'virtual', 'calls', 'online', 'digital'],
    icon: 'Activity',
    category: 'situation' as const,
    section: 'situation',
    details: {
      description: 'Revenue from web-based virtual sales calls and presentations.',
      breakdown: [
        { label: 'Virtual Sessions', value: '1,850' },
        { label: 'Engagement Rate', value: '78%' },
        { label: 'Conversion Rate', value: '9.2%' }
      ]
    }
  },
  {
    id: 'phone-calls',
    title: 'Phone Calls ABC',
    value: '$1.3M',
    change: '+2.5x',
    changeType: 'positive' as const,
    comparison: 'ROI',
    description: 'Revenue from telephone-based outreach and sales calls',
    keywords: ['phone', 'calls', 'telephone', 'outreach'],
    icon: 'Activity',
    category: 'situation' as const,
    section: 'situation',
    details: {
      description: 'Revenue from telephone-based outreach and sales calls.',
      breakdown: [
        { label: 'Call Volume', value: '3,200' },
        { label: 'Connect Rate', value: '68%' },
        { label: 'Conversion Rate', value: '15.2%' }
      ]
    }
  },
  {
    id: 'digital-display',
    title: 'Digital Pharma Display',
    value: '$0.9M',
    change: '+2.1x',
    changeType: 'positive' as const,
    comparison: 'ROI',
    description: 'Revenue from digital display advertising campaigns',
    keywords: ['digital', 'display', 'advertising', 'banners'],
    icon: 'BarChart3',
    category: 'situation' as const,
    section: 'situation',
    details: {
      description: 'Revenue from digital display advertising campaigns.',
      breakdown: [
        { label: 'Impressions', value: '2.5M' },
        { label: 'Click Rate', value: '2.8%' },
        { label: 'Conversions', value: '1,420' }
      ]
    }
  }
];