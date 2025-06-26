export interface MetricCard {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  comparison: string;
  icon: string;
  category: 'key' | 'situation' | 'scenario' | 'recommendation';
  description?: string;
  details?: {
    description: string;
    breakdown: Array<{ label: string; value: string; }>;
  };
  section: 'key-metrics' | 'situation' | 'scenario-comparison' | 'marketing-recommendations';
  chartData?: {
    type: string;
    data: Array<{ name: string; revenue: number; }>;
  };
  insights?: {
    performance: string;
    trend: string;
    recommendation: string;
    impact: 'high' | 'medium' | 'low';
  };
  regionalData?: Array<{
    region: string;
    performance: string;
    target: string;
    gap: string;
  }>;
  channelData?: Array<{
    channel: string;
    roi: string;
    spend: string;
    performance: string;
  }>;
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
    },
    insights: {
      performance: 'Strong growth driven by new respiratory product line',
      trend: 'Consistent upward trajectory across quarters',
      recommendation: 'Maintain momentum with focused marketing on high-performing products',
      impact: 'high'
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
    },
    insights: {
      performance: 'Strong patient acquisition and retention',
      trend: 'Growing market share in competitive landscape',
      recommendation: 'Focus on referral programs and patient education',
      impact: 'high'
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
    },
    insights: {
      performance: 'Excellent conversion efficiency',
      trend: 'Improving sample utilization',
      recommendation: 'Optimize sample targeting and follow-up processes',
      impact: 'medium'
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
    },
    insights: {
      performance: 'Outstanding rebate program efficiency',
      trend: 'Consistent ROI improvement',
      recommendation: 'Consider expanding rebate programs to underperforming regions',
      impact: 'high'
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
    },
    insights: {
      performance: 'Strong market access positioning',
      trend: 'Improving formulary coverage',
      recommendation: 'Focus on reducing prior authorization barriers',
      impact: 'medium'
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
    },
    insights: {
      performance: 'Strong baseline revenue without marketing efforts',
      trend: 'Consistent growth in base sales',
      recommendation: 'Product has strong market positioning and demand',
      impact: 'high'
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
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Q1', revenue: 300000 },
        { name: 'Q2', revenue: 400000 },
        { name: 'Q3', revenue: 500000 },
        { name: 'Q4', revenue: 450000 },
      ]
    },
    insights: {
      performance: 'Clear seasonal patterns identified',
      trend: 'Q3 shows peak seasonal demand',
      recommendation: 'Increase Q4 marketing efforts by 25% to capitalize on peak demand',
      impact: 'medium'
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
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Jan', revenue: 75000 },
        { name: 'Feb', revenue: 82000 },
        { name: 'Mar', revenue: 89000 },
        { name: 'Apr', revenue: 95000 },
        { name: 'May', revenue: 88000 },
        { name: 'Jun', revenue: 92000 },
        { name: 'Jul', revenue: 85000 },
        { name: 'Aug', revenue: 98000 },
        { name: 'Sep', revenue: 102000 },
        { name: 'Oct', revenue: 95000 },
        { name: 'Nov', revenue: 87000 },
        { name: 'Dec', revenue: 105000 },
      ]
    },
    insights: {
      performance: 'Strong digital display performance',
      trend: 'Consistent growth in digital advertising',
      recommendation: 'Optimize keyword alignment and landing page experience',
      impact: 'medium'
    },
    channelData: [
      { channel: 'Display Ads', roi: '2.1x', spend: '$400K', performance: 'Above Average' },
      { channel: 'Retargeting', roi: '1.8x', spend: '$200K', performance: 'Average' }
    ]
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
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Jan', revenue: 95000 },
        { name: 'Feb', revenue: 105000 },
        { name: 'Mar', revenue: 115000 },
        { name: 'Apr', revenue: 125000 },
        { name: 'May', revenue: 118000 },
        { name: 'Jun', revenue: 122000 },
        { name: 'Jul', revenue: 115000 },
        { name: 'Aug', revenue: 128000 },
        { name: 'Sep', revenue: 135000 },
        { name: 'Oct', revenue: 130000 },
        { name: 'Nov', revenue: 125000 },
        { name: 'Dec', revenue: 140000 },
      ]
    },
    insights: {
      performance: 'Best performing digital channel',
      trend: 'Strong growth in video engagement',
      recommendation: 'Expand video content in high-performing specialties',
      impact: 'high'
    },
    channelData: [
      { channel: 'Video Ads', roi: '2.4x', spend: '$500K', performance: 'Excellent' },
      { channel: 'Educational Content', roi: '2.8x', spend: '$300K', performance: 'Outstanding' }
    ]
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
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Jan', revenue: 40000 },
        { name: 'Feb', revenue: 45000 },
        { name: 'Mar', revenue: 50000 },
        { name: 'Apr', revenue: 55000 },
        { name: 'May', revenue: 52000 },
        { name: 'Jun', revenue: 48000 },
        { name: 'Jul', revenue: 53000 },
        { name: 'Aug', revenue: 57000 },
        { name: 'Sep', revenue: 60000 },
        { name: 'Oct', revenue: 58000 },
        { name: 'Nov', revenue: 54000 },
        { name: 'Dec', revenue: 62000 },
      ]
    },
    insights: {
      performance: 'Moderate website engagement performance',
      trend: 'Steady visitor growth',
      recommendation: 'Improve landing page conversion rates',
      impact: 'low'
    }
  },
  {
    id: 'trend',
    title: 'Trend',
    value: '$0.8M',
    change: '+2.1%',
    changeType: 'positive',
    comparison: 'Revenue Attribution',
    icon: 'TrendingUp',
    category: 'situation',
    section: 'situation',
    details: {
      description: 'Long-term trend analysis and market direction',
      breakdown: [
        { label: 'Trend Direction', value: 'Upward' },
        { label: 'Confidence Level', value: '95%' },
        { label: 'Projected Growth', value: '+15%' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Jan', revenue: 65000 },
        { name: 'Feb', revenue: 68000 },
        { name: 'Mar', revenue: 72000 },
        { name: 'Apr', revenue: 75000 },
        { name: 'May', revenue: 78000 },
        { name: 'Jun', revenue: 82000 },
        { name: 'Jul', revenue: 85000 },
        { name: 'Aug', revenue: 88000 },
        { name: 'Sep', revenue: 92000 },
        { name: 'Oct', revenue: 95000 },
        { name: 'Nov', revenue: 98000 },
        { name: 'Dec', revenue: 102000 },
      ]
    },
    insights: {
      performance: 'Strong upward market trend',
      trend: 'Consistent growth pattern',
      recommendation: 'Maintain current strategy momentum',
      impact: 'high'
    }
  },
  {
    id: 'medscape-alert',
    title: 'Medscape HiV Brand Alert',
    value: '$0.7M',
    change: '+1.8x',
    changeType: 'positive',
    comparison: 'ROI',
    icon: 'Activity',
    category: 'situation',
    section: 'situation',
    details: {
      description: 'Medscape platform brand awareness and engagement',
      breakdown: [
        { label: 'Recommended Spend', value: '$390K' },
        { label: 'Optimal Frequency', value: '6/month' },
        { label: 'Response Lag', value: '3 weeks' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Jan', revenue: 55000 },
        { name: 'Feb', revenue: 60000 },
        { name: 'Mar', revenue: 65000 },
        { name: 'Apr', revenue: 70000 },
        { name: 'May', revenue: 68000 },
        { name: 'Jun', revenue: 72000 },
        { name: 'Jul', revenue: 75000 },
        { name: 'Aug', revenue: 78000 },
        { name: 'Sep', revenue: 82000 },
        { name: 'Oct', revenue: 80000 },
        { name: 'Nov', revenue: 77000 },
        { name: 'Dec', revenue: 85000 },
      ]
    },
    insights: {
      performance: 'Good brand awareness performance',
      trend: 'Steady engagement growth',
      recommendation: 'Increase frequency to 8/month for better reach',
      impact: 'medium'
    }
  },
  {
    id: 'ola-attendees',
    title: 'OLA Attendees',
    value: '$0.4M',
    change: '+1.4x',
    changeType: 'positive',
    comparison: 'ROI',
    icon: 'Users',
    category: 'situation',
    section: 'situation',
    details: {
      description: 'OLA conference attendance and engagement metrics',
      breakdown: [
        { label: 'Recommended Spend', value: '$286K' },
        { label: 'Optimal Frequency', value: '2/year' },
        { label: 'Response Lag', value: '6 weeks' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Q1', revenue: 80000 },
        { name: 'Q2', revenue: 120000 },
        { name: 'Q3', revenue: 100000 },
        { name: 'Q4', revenue: 100000 },
      ]
    },
    insights: {
      performance: 'Moderate conference ROI',
      trend: 'Seasonal conference impact',
      recommendation: 'Focus on post-conference follow-up',
      impact: 'low'
    }
  },
  {
    id: 'ooh-pharma',
    title: 'OOH Pharma',
    value: '$0.6M',
    change: '+1.6x',
    changeType: 'positive',
    comparison: 'ROI',
    icon: 'Target',
    category: 'situation',
    section: 'situation',
    details: {
      description: 'Out-of-home pharmaceutical advertising performance',
      breakdown: [
        { label: 'Recommended Spend', value: '$375K' },
        { label: 'Optimal Frequency', value: '4/month' },
        { label: 'Response Lag', value: '5 weeks' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Jan', revenue: 45000 },
        { name: 'Feb', revenue: 50000 },
        { name: 'Mar', revenue: 55000 },
        { name: 'Apr', revenue: 60000 },
        { name: 'May', revenue: 58000 },
        { name: 'Jun', revenue: 62000 },
        { name: 'Jul', revenue: 65000 },
        { name: 'Aug', revenue: 68000 },
        { name: 'Sep', revenue: 72000 },
        { name: 'Oct', revenue: 70000 },
        { name: 'Nov', revenue: 67000 },
        { name: 'Dec', revenue: 75000 },
      ]
    },
    insights: {
      performance: 'Moderate OOH advertising performance',
      trend: 'Steady growth in outdoor advertising',
      recommendation: 'Optimize location targeting',
      impact: 'medium'
    }
  },
  {
    id: 'phone-calls',
    title: 'Phone Calls ABC',
    value: '$1.3M',
    change: '+2.5x',
    changeType: 'positive',
    comparison: 'ROI',
    icon: 'Activity',
    category: 'situation',
    section: 'situation',
    details: {
      description: 'Phone call campaign performance and conversion rates',
      breakdown: [
        { label: 'Recommended Spend', value: '$520K' },
        { label: 'Optimal Frequency', value: '15/month' },
        { label: 'Response Lag', value: '1 week' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Jan', revenue: 100000 },
        { name: 'Feb', revenue: 110000 },
        { name: 'Mar', revenue: 120000 },
        { name: 'Apr', revenue: 130000 },
        { name: 'May', revenue: 125000 },
        { name: 'Jun', revenue: 135000 },
        { name: 'Jul', revenue: 140000 },
        { name: 'Aug', revenue: 145000 },
        { name: 'Sep', revenue: 150000 },
        { name: 'Oct', revenue: 148000 },
        { name: 'Nov', revenue: 145000 },
        { name: 'Dec', revenue: 155000 },
      ]
    },
    insights: {
      performance: 'Top performing channel with highest ROI',
      trend: 'Consistent high performance',
      recommendation: 'Increase spend allocation to phone calls',
      impact: 'high'
    },
    channelData: [
      { channel: 'Inbound Calls', roi: '2.8x', spend: '$300K', performance: 'Excellent' },
      { channel: 'Outbound Calls', roi: '2.2x', spend: '$220K', performance: 'Good' }
    ]
  },
  {
    id: 'veeva-emails',
    title: 'Veeva Emails',
    value: '$0.8M',
    change: '+1.9x',
    changeType: 'positive',
    comparison: 'ROI',
    icon: 'Activity',
    category: 'situation',
    section: 'situation',
    details: {
      description: 'Veeva CRM email campaign effectiveness',
      breakdown: [
        { label: 'Recommended Spend', value: '$421K' },
        { label: 'Optimal Frequency', value: '10/month' },
        { label: 'Response Lag', value: '2 weeks' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Jan', revenue: 60000 },
        { name: 'Feb', revenue: 65000 },
        { name: 'Mar', revenue: 70000 },
        { name: 'Apr', revenue: 75000 },
        { name: 'May', revenue: 72000 },
        { name: 'Jun', revenue: 78000 },
        { name: 'Jul', revenue: 82000 },
        { name: 'Aug', revenue: 85000 },
        { name: 'Sep', revenue: 88000 },
        { name: 'Oct', revenue: 86000 },
        { name: 'Nov', revenue: 83000 },
        { name: 'Dec', revenue: 90000 },
      ]
    },
    insights: {
      performance: 'Good email campaign performance',
      trend: 'Steady email engagement',
      recommendation: 'Optimize email automation for mid-funnel engagement',
      impact: 'medium'
    },
    channelData: [
      { channel: 'Targeted Emails', roi: '2.1x', spend: '$250K', performance: 'Good' },
      { channel: 'Newsletter', roi: '1.7x', spend: '$171K', performance: 'Average' }
    ]
  },
  {
    id: 'web-virtual-calls',
    title: 'Web Virtual Calls ABC',
    value: '$1.1M',
    change: '+2.2x',
    changeType: 'positive',
    comparison: 'ROI',
    icon: 'Activity',
    category: 'situation',
    section: 'situation',
    details: {
      description: 'Virtual call center performance and digital engagement',
      breakdown: [
        { label: 'Recommended Spend', value: '$500K' },
        { label: 'Optimal Frequency', value: '12/month' },
        { label: 'Response Lag', value: '1 week' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Jan', revenue: 85000 },
        { name: 'Feb', revenue: 90000 },
        { name: 'Mar', revenue: 95000 },
        { name: 'Apr', revenue: 100000 },
        { name: 'May', revenue: 98000 },
        { name: 'Jun', revenue: 105000 },
        { name: 'Jul', revenue: 110000 },
        { name: 'Aug', revenue: 115000 },
        { name: 'Sep', revenue: 120000 },
        { name: 'Oct', revenue: 118000 },
        { name: 'Nov', revenue: 115000 },
        { name: 'Dec', revenue: 125000 },
      ]
    },
    insights: {
      performance: 'Strong virtual call performance',
      trend: 'Growing digital engagement',
      recommendation: 'Expand virtual call capacity',
      impact: 'high'
    },
    channelData: [
      { channel: 'Virtual Consultations', roi: '2.4x', spend: '$300K', performance: 'Excellent' },
      { channel: 'Web Support', roi: '2.0x', spend: '$200K', performance: 'Good' }
    ]
  },
  // Additional metrics from components
  {
    id: 'total-sales',
    title: 'Total Sales',
    value: '$21.3M',
    change: '+85.2%',
    changeType: 'positive',
    comparison: 'Total Revenue',
    icon: 'DollarSign',
    category: 'situation',
    section: 'situation',
    details: {
      description: 'Total sales revenue including all attributions for the current period.',
      breakdown: [
        { label: 'All Channels', value: '$21.3M' },
        { label: 'Growth YoY', value: '+85.2%' },
        { label: 'Net Sales', value: '$18.7M' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Q1', revenue: 4500000 },
        { name: 'Q2', revenue: 5200000 },
        { name: 'Q3', revenue: 5800000 },
        { name: 'Q4', revenue: 5800000 },
      ]
    },
    insights: {
      performance: 'Outstanding total sales performance',
      trend: 'Strong growth across all channels',
      recommendation: 'Maintain current strategy execution',
      impact: 'high'
    }
  },
  {
    id: 'incremental',
    title: 'Incremental',
    value: '$2.5M',
    change: '+18.2%',
    changeType: 'positive',
    comparison: 'Incremental Revenue',
    icon: 'BarChart3',
    category: 'situation',
    section: 'situation',
    details: {
      description: 'Revenue generated above the baseline due to marketing activities.',
      breakdown: [
        { label: 'Marketing Impact', value: '$2.0M' },
        { label: 'Other Factors', value: '$0.5M' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Q1', revenue: 550000 },
        { name: 'Q2', revenue: 620000 },
        { name: 'Q3', revenue: 680000 },
        { name: 'Q4', revenue: 650000 },
      ]
    },
    insights: {
      performance: 'Strong marketing-driven revenue growth',
      trend: 'Consistent incremental gains',
      recommendation: 'Focus on high-ROI marketing channels',
      impact: 'high'
    }
  },
  {
    id: 'promotional-spend',
    title: 'Promotional Spend',
    value: '$3.7M',
    change: '+12.5%',
    changeType: 'positive',
    comparison: 'Total Promotional Budget',
    icon: 'BarChart3',
    category: 'situation',
    section: 'situation',
    details: {
      description: 'Total spend on promotional activities for the current period.',
      breakdown: [
        { label: 'Digital', value: '$1.5M' },
        { label: 'Field Force', value: '$1.7M' },
        { label: 'Events', value: '$0.5M' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Q1', revenue: 850000 },
        { name: 'Q2', revenue: 920000 },
        { name: 'Q3', revenue: 980000 },
        { name: 'Q4', revenue: 950000 },
      ]
    },
    insights: {
      performance: 'Well-balanced promotional spend allocation',
      trend: 'Strategic spend increases',
      recommendation: 'Reallocate 15% of digital spend to re-engage physicians',
      impact: 'medium'
    }
  },
  {
    id: 'f2f-calls',
    title: 'F2F Calls',
    value: '$1.1M',
    change: '+7.5%',
    changeType: 'positive',
    comparison: 'Revenue Attribution',
    icon: 'Users',
    category: 'situation',
    section: 'situation',
    details: {
      description: 'Revenue attributed to face-to-face sales calls.',
      breakdown: [
        { label: 'Number of Calls', value: '3,200' },
        { label: 'Conversion Rate', value: '12.5%' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Q1', revenue: 250000 },
        { name: 'Q2', revenue: 280000 },
        { name: 'Q3', revenue: 300000 },
        { name: 'Q4', revenue: 270000 },
      ]
    },
    insights: {
      performance: 'F2F rep engagement saw 12% decline',
      trend: 'Declining rep productivity in some regions',
      recommendation: 'Introduce hybrid rep-digital programs to improve HCP access',
      impact: 'high'
    },
    regionalData: [
      { region: 'South', performance: '85%', target: '80%', gap: '+5%' },
      { region: 'Central', performance: '62%', target: '75%', gap: '-13%' },
      { region: 'North', performance: '58%', target: '70%', gap: '-12%' }
    ]
  },
  {
    id: 'symposium',
    title: 'Symposium',
    value: '$0.7M',
    change: '+3.9%',
    changeType: 'positive',
    comparison: 'Revenue Attribution',
    icon: 'Calendar',
    category: 'situation',
    section: 'situation',
    details: {
      description: 'Revenue generated from symposium events and conferences.',
      breakdown: [
        { label: 'Events Held', value: '8' },
        { label: 'Attendees', value: '1,200' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Q1', revenue: 150000 },
        { name: 'Q2', revenue: 180000 },
        { name: 'Q3', revenue: 200000 },
        { name: 'Q4', revenue: 170000 },
      ]
    },
    insights: {
      performance: 'Good symposium performance',
      trend: 'Steady event engagement',
      recommendation: 'Focus on post-event follow-up',
      impact: 'medium'
    }
  },
  {
    id: 'sfmc-emails',
    title: 'SFMC Emails',
    value: '$0.5M',
    change: '+2.7%',
    changeType: 'positive',
    comparison: 'Revenue Attribution',
    icon: 'Mail',
    category: 'situation',
    section: 'situation',
    details: {
      description: 'Revenue attributed to Salesforce Marketing Cloud email campaigns.',
      breakdown: [
        { label: 'Emails Sent', value: '45,000' },
        { label: 'Open Rate', value: '22.1%' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Q1', revenue: 110000 },
        { name: 'Q2', revenue: 125000 },
        { name: 'Q3', revenue: 135000 },
        { name: 'Q4', revenue: 130000 },
      ]
    },
    insights: {
      performance: 'Email ROI = 3.4x (↑ driven by targeted disease awareness campaign)',
      trend: 'Improving email effectiveness',
      recommendation: 'Invest in optimizing email automation for mid-funnel engagement',
      impact: 'medium'
    }
  },
  {
    id: 'promotion',
    title: 'Promotion',
    value: '$2.1M',
    change: '+15.3%',
    changeType: 'positive',
    comparison: 'Revenue Attribution',
    icon: 'BarChart3',
    category: 'situation',
    section: 'situation',
    details: {
      description: 'Marketing promotion impact on revenue generation',
      breakdown: [
        { label: 'Digital Marketing', value: '$0.8M' },
        { label: 'Field Force', value: '$1.1M' },
        { label: 'Events & Samples', value: '$0.2M' }
      ]
    },
    chartData: {
      type: 'bar',
      data: [
        { name: 'Q1', revenue: 480000 },
        { name: 'Q2', revenue: 520000 },
        { name: 'Q3', revenue: 560000 },
        { name: 'Q4', revenue: 540000 },
      ]
    },
    insights: {
      performance: 'Strong promotional impact',
      trend: 'Consistent promotion effectiveness',
      recommendation: 'Maintain balanced promotional mix',
      impact: 'high'
    }
  },
  // Marketing Optimization Recommendations
  {
    id: 'f2f-east-region',
    title: 'Increase F2F Calls in East Region',
    value: 'High Impact',
    change: 'β=2.34',
    changeType: 'positive',
    comparison: 'ROI Coefficient',
    icon: 'TrendingUp',
    category: 'recommendation',
    section: 'marketing-recommendations',
    details: {
      description: 'F2F calls in East region have highest ROI. Increasing by 15% could drive ~35 additional sales per period.',
      breakdown: [
        { label: 'Current ROI', value: '2.34x' },
        { label: 'Potential Increase', value: '15%' },
        { label: 'Additional Sales', value: '35/period' }
      ]
    },
    insights: {
      performance: 'Highest ROI region for F2F calls',
      trend: 'Underutilized opportunity',
      recommendation: 'Increase F2F calls by 15% in East region',
      impact: 'high'
    }
  },
  {
    id: 'digital-optimization',
    title: 'Optimize Digital Campaign Performance',
    value: 'Medium Impact',
    change: 'ROI = 2.8x',
    changeType: 'positive',
    comparison: 'Current Performance',
    icon: 'BarChart3',
    category: 'recommendation',
    section: 'marketing-recommendations',
    details: {
      description: 'Digital campaigns show strong performance but have room for optimization in keyword alignment and landing page experience.',
      breakdown: [
        { label: 'Current Digital ROI', value: '2.8x' },
        { label: 'Target ROI', value: '3.2x' },
        { label: 'Optimization Potential', value: '14%' }
      ]
    },
    insights: {
      performance: 'Good digital performance with optimization potential',
      trend: 'Steady digital growth',
      recommendation: 'Pause low-performing search campaigns and optimize landing pages',
      impact: 'medium'
    }
  },
  {
    id: 'seasonal-campaign',
    title: 'Seasonal Campaign Boost',
    value: 'Low Impact',
    change: 'Q4 Peak',
    changeType: 'positive',
    comparison: 'Seasonal Pattern',
    icon: 'Calendar',
    category: 'recommendation',
    section: 'marketing-recommendations',
    details: {
      description: 'Strong seasonal patterns detected. Increase Q4 marketing efforts by 25% to capitalize on peak demand.',
      breakdown: [
        { label: 'Q4 Seasonal Impact', value: '+25%' },
        { label: 'Peak Demand Period', value: 'Oct-Dec' },
        { label: 'Marketing Increase', value: '25%' }
      ]
    },
    insights: {
      performance: 'Clear seasonal demand patterns',
      trend: 'Q4 peak season identified',
      recommendation: 'Increase Q4 marketing efforts by 25%',
      impact: 'low'
    }
  },
  // Scenario Comparison Data
  {
    id: 'scenario-baseline',
    title: 'Baseline Scenario',
    value: '$21.3M',
    change: '2.7x',
    changeType: 'positive',
    comparison: 'Projected Sales & ROI',
    icon: 'Target',
    category: 'scenario',
    section: 'scenario-comparison',
    details: {
      description: 'Current plan projection with existing spend allocation and strategy.',
      breakdown: [
        { label: 'Total Sales', value: '$21.3M' },
        { label: 'Total Spend', value: '$265K' },
        { label: 'Overall ROI', value: '2.7x' },
        { label: 'Profit Margin', value: '18%' }
      ]
    },
    insights: {
      performance: 'Current baseline performance',
      trend: 'Stable projection',
      recommendation: 'Maintain current strategy',
      impact: 'medium'
    }
  },
  {
    id: 'scenario-optimistic',
    title: 'Optimistic Scenario',
    value: '$24.5M',
    change: '2.9x',
    changeType: 'positive',
    comparison: 'Projected Sales & ROI',
    icon: 'TrendingUp',
    category: 'scenario',
    section: 'scenario-comparison',
    details: {
      description: 'Optimistic projection with 15% spend increase and improved channel performance.',
      breakdown: [
        { label: 'Total Sales', value: '$24.5M' },
        { label: 'Total Spend', value: '$305K' },
        { label: 'Overall ROI', value: '2.9x' },
        { label: 'Profit Margin', value: '21%' }
      ]
    },
    insights: {
      performance: 'Optimistic growth projection',
      trend: 'Strong upward potential',
      recommendation: 'Consider 15% spend increase',
      impact: 'high'
    }
  },
  {
    id: 'scenario-pessimistic',
    title: 'Pessimistic Scenario',
    value: '$19.17M',
    change: '2.4x',
    changeType: 'negative',
    comparison: 'Projected Sales & ROI',
    icon: 'TrendingDown',
    category: 'scenario',
    section: 'scenario-comparison',
    details: {
      description: 'Pessimistic projection with 10% spend reduction and market challenges.',
      breakdown: [
        { label: 'Total Sales', value: '$19.17M' },
        { label: 'Total Spend', value: '$239K' },
        { label: 'Overall ROI', value: '2.4x' },
        { label: 'Profit Margin', value: '15%' }
      ]
    },
    insights: {
      performance: 'Conservative projection',
      trend: 'Risk mitigation scenario',
      recommendation: 'Avoid spend reductions',
      impact: 'high'
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
      metric.description?.toLowerCase().includes(keyword) ||
      metric.insights?.performance.toLowerCase().includes(keyword) ||
      metric.insights?.recommendation.toLowerCase().includes(keyword)
    )
  );
  
  return keywordMatch || null;
};

export const getAllMetricsByCategory = (category: 'key' | 'situation' | 'scenario' | 'recommendation') => {
  return metricsKnowledgeBase.filter(metric => metric.category === category);
};

// Новые функции для расширенного поиска
export const findMetricsByInsight = (insightType: 'performance' | 'trend' | 'recommendation') => {
  return metricsKnowledgeBase.filter(metric => metric.insights && metric.insights[insightType]);
};

export const findMetricsByImpact = (impact: 'high' | 'medium' | 'low') => {
  return metricsKnowledgeBase.filter(metric => metric.insights?.impact === impact);
};

export const findMetricsByRegion = (region: string) => {
  return metricsKnowledgeBase.filter(metric => 
    metric.regionalData?.some(regional => 
      regional.region.toLowerCase().includes(region.toLowerCase())
    )
  );
};

export const findMetricsByChannel = (channel: string) => {
  return metricsKnowledgeBase.filter(metric => 
    metric.channelData?.some(channelData => 
      channelData.channel.toLowerCase().includes(channel.toLowerCase())
    )
  );
};

export const getTopPerformingChannels = () => {
  return metricsKnowledgeBase
    .filter(metric => metric.channelData)
    .flatMap(metric => metric.channelData || [])
    .sort((a, b) => parseFloat(b.roi) - parseFloat(a.roi))
    .slice(0, 5);
};

export const getRegionalPerformance = () => {
  return metricsKnowledgeBase
    .filter(metric => metric.regionalData)
    .flatMap(metric => metric.regionalData || []);
};

export const getMarketingRecommendations = () => {
  return metricsKnowledgeBase.filter(metric => metric.category === 'recommendation');
};

export const getScenarioComparisons = () => {
  return metricsKnowledgeBase.filter(metric => metric.category === 'scenario');
};
