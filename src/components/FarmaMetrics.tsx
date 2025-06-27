import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ParticleBackground from '@/components/ParticleBackground';
import { 
  TrendingUp, 
  TrendingDown, 
  Share, 
  Download, 
  Expand, 
  ChevronUp,
  ChevronDown,
  Activity,
  Users,
  Pill,
  DollarSign,
  BarChart3,
  Target,
  Stethoscope,
  Calendar,
  Mail
} from 'lucide-react';
import SituationDetailModal from './SituationDetailModal';
import ScenarioComparison from './ScenarioComparison';
import AnimatedNumber from './AnimatedNumber';
import Simulation from './Simulation';
import CampaignManagement from './CampaignManagement';
import SOJMContainer from './SOJMContainer';
import { useTheme } from '@/hooks/useTheme';
import { BauhausBorder } from './ui/bauhaus-border';

interface MetricCard {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  comparison: string;
  icon: string;
  category: 'key' | 'situation';
  section: 'key-metrics' | 'situation' | 'scenario-comparison';
  details?: {
    description: string;
    breakdown: Array<{ label: string; value: string; }>;
  };
}

const FarmaMetrics = () => {
  const { theme } = useTheme();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [keyMetricsExpanded, setKeyMetricsExpanded] = useState(false);
  const [situationMetricsExpanded, setSituationMetricsExpanded] = useState(false);
  const [selectedCard, setSelectedCard] = useState<MetricCard | null>(null);

  // Helper to parse value for AnimatedNumber
  const parseValue = (valueStr: string) => {
    return parseFloat(valueStr.replace(/[$,%xM+]/g, ''));
  };

  const keyMetrics: MetricCard[] = [
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
    }
  ];

  const situationMetrics: MetricCard[] = [
    {
      id: 'total-sales',
      title: 'Total Sales',
      value: '$19.5M',
      change: '+85.2%',
      changeType: 'positive',
      comparison: 'Total Revenue',
      icon: 'DollarSign',
      category: 'situation',
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
      }
    },
    {
      id: 'roi',
      title: 'ROI',
      value: '5.3x',
      change: '+21.7%',
      changeType: 'positive',
      comparison: 'Return on Investment',
      icon: 'TrendingUp',
      category: 'situation',
      section: 'situation',
      details: {
        description: 'Overall return on investment for all marketing and sales activities.',
        breakdown: [
          { label: 'Total Revenue', value: '$19.5M' },
          { label: 'Total Spend', value: '$3.7M' },
          { label: 'ROI', value: '5.3x' }
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
        description: 'Long-term market trend and growth patterns',
        breakdown: [
          { label: 'Market Growth', value: '3.2%' },
          { label: 'Competitive Impact', value: '-1.1%' },
          { label: 'Net Trend', value: '+2.1%' }
        ]
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
      }
    },
    {
      id: 'web-virtual-calls',
      title: 'WEB Virtual Calls',
      value: '$0.9M',
      change: '+5.2%',
      changeType: 'positive',
      comparison: 'Revenue Attribution',
      icon: 'Stethoscope',
      category: 'situation',
      section: 'situation',
      details: {
        description: 'Revenue attributed to web-based virtual sales calls.',
        breakdown: [
          { label: 'Virtual Calls', value: '2,100' },
          { label: 'Engagement Rate', value: '9.8%' }
        ]
      }
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
      }
    }
  ];

  const handleExpand = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const handleShare = (card: MetricCard) => {
    console.log('Sharing:', card.title);
  };

  const handleDownload = (card: MetricCard) => {
    console.log('Downloading:', card.title);
  };

  const handleCardClick = (card: MetricCard) => {
    if (card.category === 'situation') {
      setSelectedCard(card);
    } else {
      setExpandedCard(expandedCard === card.id ? null : card.id);
    }
  };

  const renderCard = (card: MetricCard, index: number) => {
    const isExpanded = expandedCard === card.id;

    // Icon mapping
    const iconMap: { [key: string]: React.ElementType } = {
      TrendingUp,
      TrendingDown,
      Activity,
      Users,
      Pill,
      DollarSign,
      BarChart3,
      Target,
      Calendar,
      Mail
    };

    const IconComponent = iconMap[card.icon] || Activity;

    // Цвет обводки для Key и Situation
    const accentColor = card.category === 'key' ? '#156ef6' : '#24d200';
    const borderRadius = '1.25em';
    const borderWidth = '2px';
    const backgroundColor = theme === 'dark' 
      ? 'rgba(30, 41, 59, 0.9)' 
      : 'rgba(255, 255, 255, 0.9)';

    const cardElement = (
      <BauhausBorder
        key={card.id}
        accentColor={accentColor}
        borderRadius={borderRadius}
        borderWidth={borderWidth}
        backgroundColor={backgroundColor}
        className="h-full"
      >
        <Card 
          id={card.id}
          className="bg-transparent border-0 shadow-none flex flex-col transition-all duration-300 hover:-translate-y-1 h-full"
          style={{ animation: `fade-in 0.5s ease-out ${index * 0.1}s forwards` }}
          onClick={() => handleCardClick(card)}
        >
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-blue/20 dark:bg-gradient-cyan/20 border border-blue-500/30 dark:border-cyan-500/30">
                <IconComponent className="w-5 h-5 text-blue-600 dark:text-cyan-500" />
              </div>
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                {card.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-slate-800/50" onClick={(e) => { e.stopPropagation(); handleShare(card); }}>
                <Share className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-slate-800/50" onClick={(e) => { e.stopPropagation(); handleDownload(card); }}>
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-slate-800/50" onClick={(e) => { e.stopPropagation(); handleCardClick(card); }} data-expand-button>
                {card.category === 'key' ? (isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : <Expand className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <AnimatedNumber 
                  value={parseValue(card.value)}
                  className="text-3xl font-bold text-gray-900 dark:text-white"
                  formatter={(val) => {
                      const original = card.value;
                      if (original.includes('M')) return `$${(val).toFixed(1)}M`;
                      if (original.includes('%')) return `${val.toFixed(1)}%`;
                      if (original.includes('x')) return `${val.toFixed(1)}x`;
                      return val.toFixed(0);
                  }}
                />
                <Badge 
                  variant={card.changeType === 'positive' ? 'default' : 'destructive'}
                  className="mb-1 bg-gradient-green/20 dark:bg-gradient-cyan/20 text-green-600 dark:text-cyan-400 border-green-500/30 dark:border-cyan-500/30"
                >
                  {card.changeType === 'positive' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  <AnimatedNumber 
                    value={parseValue(card.change)}
                    formatter={(val) => {
                        const original = card.change;
                        if (original.includes('%')) return `+${val.toFixed(1)}%`;
                        return `+${val.toFixed(1)}`;
                    }}
                  />
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-slate-400">{card.comparison}</p>
              
              {isExpanded && card.details && (
                <div className="mt-6 p-4 rounded-xl bg-gradient-card/50 border border-gray-200/50 dark:border-slate-700/50">
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">{card.details.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {card.details.breakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-gradient-card/30 border border-gray-200/30 dark:border-slate-700/30">
                        <span className="text-sm text-gray-600 dark:text-slate-400">{item.label}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </BauhausBorder>
    );

    return cardElement;
  };

  const renderMetricRow = (metrics: MetricCard[], isExpanded: boolean, setExpanded: (expanded: boolean) => void, title: string) => {
    const isKeyMetrics = title === "Key Metrics";
    const defaultCards = 4; // 4 cards for both Key Metrics and Situation
    const visibleCards = isExpanded ? metrics.length : defaultCards;
    const hasMoreCards = metrics.length > defaultCards;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-glow">{title}</h2>
          {hasMoreCards && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!isExpanded)}
              className="flex items-center gap-2 hover:bg-gradient-blue/10 dark:hover:bg-gradient-cyan/10 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <span className="text-sm">
                {isExpanded ? 'Hide' : `Show All (${metrics.length})`}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 transition-transform duration-300" />
              ) : (
                <ChevronDown className="w-4 h-4 transition-transform duration-300" />
              )}
            </Button>
          )}
        </div>
        
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isExpanded ? 'max-h-none' : ''
        }`}>
                     <div className="grid gap-6 transition-all duration-500 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-4">
            {metrics.slice(0, visibleCards).map((card, index) => 
              renderCard(card, index)
            )}
          </div>
        </div>
        
        {hasMoreCards && !isExpanded && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => setExpanded(true)}
              className="flex items-center gap-2 hover:bg-gradient-blue/10 dark:hover:bg-gradient-cyan/10 border-blue-500/30 dark:border-cyan-500/30 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-all"
            >
              <span>Show {metrics.length - defaultCards} more cards</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-gradient-main">
      {/* Particle Background */}
      <ParticleBackground />
      
      <div className="relative z-10 p-6 space-y-8 max-w-full">
        {/* Header */}
        <div className="text-center space-y-4 pt-16">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-blue/20 dark:bg-gradient-cyan/20 border border-blue-500/30 dark:border-cyan-500/30">
              <Stethoscope className="w-8 h-8 text-blue-600 dark:text-cyan-500" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white text-glow">Pharma S&M Augmented Analytics</h1>
          </div>
          <p className="text-gray-600 dark:text-white/70 max-w-2xl mx-auto">
            Advanced pharmaceutical sales and marketing analytics dashboard with real-time metrics and insights
          </p>
        </div>

        {/* Marketing Optimization Recommendations */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-glow">Marketing Optimization Recommendations</h2>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-4">
            {/* Card 1: High Impact */}
            <BauhausBorder
              accentColor="#f87171"
              borderRadius="1.25em"
              borderWidth="2px"
              backgroundColor={theme === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)'}
              className="h-full"
            >
              <Card className="bg-transparent border-0 shadow-none flex flex-col h-full">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-red-100/40 dark:bg-red-500/10 border border-red-300/30 dark:border-red-500/30">
                      <TrendingUp className="w-5 h-5 text-red-500 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                      Increase F2F Calls in East Region
                    </CardTitle>
                  </div>
                  <Badge className="bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30">High Impact</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-slate-400">F2F calls in East region have highest ROI (β=2.34). Increasing by 15% could drive ~35 additional sales per period.</p>
                    <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30 no-hover-dark">ROI Focus</Badge>
                  </div>
                </CardContent>
              </Card>
            </BauhausBorder>
            {/* Card 2: Medium Impact */}
            <BauhausBorder
              accentColor="#fde047"
              borderRadius="1.25em"
              borderWidth="2px"
              backgroundColor={theme === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)'}
              className="h-full"
            >
              <Card className="bg-transparent border-0 shadow-none flex flex-col h-full">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-yellow-100/40 dark:bg-yellow-500/10 border border-yellow-300/30 dark:border-yellow-500/30">
                      <BarChart3 className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                    </div>
                    <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                      Reallocate Display Budget
                    </CardTitle>
                  </div>
                  <Badge className="bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">Medium Impact</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-slate-400">Display clicks have lowest impact (β=0.12). Shift 20% of display budget to higher-impact phone calls.</p>
                    <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30 no-hover-dark">ROI Focus</Badge>
                  </div>
                </CardContent>
              </Card>
            </BauhausBorder>
            {/* Card 3: Low Impact */}
            <BauhausBorder
              accentColor="#4ade80"
              borderRadius="1.25em"
              borderWidth="2px"
              backgroundColor={theme === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)'}
              className="h-full"
            >
              <Card className="bg-transparent border-0 shadow-none flex flex-col h-full">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-green-100/40 dark:bg-green-500/10 border border-green-300/30 dark:border-green-500/30">
                      <Calendar className="w-5 h-5 text-green-500 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                      Seasonal Campaign Boost
                    </CardTitle>
                  </div>
                  <Badge className="bg-green-400/20 text-green-700 dark:text-green-400 border-green-500/30">Low Impact</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-slate-400">Strong seasonal patterns detected. Increase Q4 marketing efforts by 25% to capitalize on peak demand.</p>
                    <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30 no-hover-dark">ROI Focus</Badge>
                  </div>
                </CardContent>
              </Card>
            </BauhausBorder>
          </div>
        </div>

        {/* Key Metrics */}
        {renderMetricRow(keyMetrics, keyMetricsExpanded, setKeyMetricsExpanded, "Key Metrics")}
        
        {/* Situation Metrics */}
        {renderMetricRow(situationMetrics, situationMetricsExpanded, setSituationMetricsExpanded, "Current")}

        <ScenarioComparison />

        <Simulation />

        <CampaignManagement />

        <SOJMContainer />

        {/* Situation Detail Modal */}
        {selectedCard && (
          <SituationDetailModal
            card={selectedCard}
            open={!!selectedCard}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedCard(null);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default FarmaMetrics;
