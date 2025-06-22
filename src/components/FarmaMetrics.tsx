import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Calendar
} from 'lucide-react';
import SituationDetailModal from './SituationDetailModal';
import ScenarioComparison from './ScenarioComparison';
import AnimatedNumber from './AnimatedNumber';
import Simulation from './Simulation';

interface MetricCard {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  comparison: string;
  icon: React.ElementType;
  category: 'key' | 'situation';
  details?: {
    description: string;
    breakdown: Array<{ label: string; value: string; }>;
  };
}

const FarmaMetrics = () => {
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
      icon: TrendingUp,
      category: 'key',
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
      icon: Users,
      category: 'key',
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
      icon: Pill,
      category: 'key',
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
      icon: DollarSign,
      category: 'key',
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
      icon: Target,
      category: 'key',
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
      id: 'base-sales',
      title: 'Base Sales',
      value: '$12.0M',
      change: '+93.14%',
      changeType: 'positive',
      comparison: 'Revenue Attribution',
      icon: Activity,
      category: 'situation',
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
      id: 'seasonality',
      title: 'Seasonality',
      value: '$1.2M',
      change: '+6.86%',
      changeType: 'positive',
      comparison: 'Revenue Attribution',
      icon: Calendar,
      category: 'situation',
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
      icon: TrendingUp,
      category: 'situation',
      details: {
        description: 'Long-term growth trend and market direction',
        breakdown: [
          { label: 'Growth Momentum', value: '12% YoY' },
          { label: 'Market Share Trend', value: '+0.8%' },
          { label: 'Category Growth', value: '4.2%' }
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
      icon: BarChart3,
      category: 'situation',
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
      icon: Activity,
      category: 'situation',
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
      icon: Target,
      category: 'situation',
      details: {
        description: 'Website engagement and visitor exchange program performance',
        breakdown: [
          { label: 'Recommended Spend', value: '$630K' },
          { label: 'Optimal Frequency', value: '11/month' },
          { label: 'Response Lag', value: '4 weeks' }
        ]
      }
    },
    {
      id: 'brand-alert',
      title: 'Medscape HiV Brand Alert',
      value: '$0.7M',
      change: '+1.8x',
      changeType: 'positive',
      comparison: 'ROI',
      icon: Pill,
      category: 'situation',
      details: {
        description: 'Medical professional platform brand awareness campaigns',
        breakdown: [
          { label: 'Recommended Spend', value: '$350K' },
          { label: 'Target Reach', value: '15K HCPs' },
          { label: 'Engagement Rate', value: '24%' }
        ]
      }
    },
    {
      id: 'ola-attendees',
      title: 'OLA Attendees',
      value: '$0.4M',
      change: '+1.4x',
      changeType: 'positive',
      comparison: 'ROI',
      icon: Users,
      category: 'situation',
      details: {
        description: 'Online Learning Activities and educational events impact',
        breakdown: [
          { label: 'Recommended Spend', value: '$250K' },
          { label: 'Event Attendees', value: '2.8K' },
          { label: 'Conversion Rate', value: '18%' }
        ]
      }
    },
    {
      id: 'ooh-dovato',
      title: 'OOH Pharma',
      value: '$0.6M',
      change: '+1.6x',
      changeType: 'positive',
      comparison: 'ROI',
      icon: BarChart3,
      category: 'situation',
      details: {
        description: 'Out-of-home advertising and traditional media impact',
        breakdown: [
          { label: 'Recommended Spend', value: '$320K' },
          { label: 'Impressions', value: '8.2M' },
          { label: 'Reach', value: '65%' }
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
      icon: DollarSign,
      category: 'situation',
      details: {
        description: 'Direct sales calls and phone-based engagement programs',
        breakdown: [
          { label: 'Recommended Spend', value: '$480K' },
          { label: 'Call Volume', value: '12.4K' },
          { label: 'Conversion Rate', value: '32%' }
        ]
      }
    },
    {
      id: 'veeva-emails',
      title: 'Veeva Emails',
      value: '$0.8M',
      change: '+1.9x',
      changeType: 'positive',
      comparison: 'ROI',
      icon: Activity,
      category: 'situation',
      details: {
        description: 'Email marketing campaigns through Veeva platform',
        breakdown: [
          { label: 'Recommended Spend', value: '$360K' },
          { label: 'Open Rate', value: '42%' },
          { label: 'Click Rate', value: '18%' }
        ]
      }
    },
    {
      id: 'web-virtual-calls',
      title: 'Web Virtual Calls ABC',
      value: '$1.1M',
      change: '+2.2x',
      changeType: 'positive',
      comparison: 'ROI',
      icon: Target,
      category: 'situation',
      details: {
        description: 'Virtual sales calls and web-based engagement platforms',
        breakdown: [
          { label: 'Recommended Spend', value: '$420K' },
          { label: 'Virtual Sessions', value: '3.2K' },
          { label: 'Attendance Rate', value: '78%' }
        ]
      }
    }
  ];

  const handleExpand = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const handleShare = (card: MetricCard) => {
    if (navigator.share) {
      navigator.share({
        title: card.title,
        text: `${card.title}: ${card.value} (${card.change} ${card.comparison})`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`${card.title}: ${card.value} (${card.change} ${card.comparison})`);
    }
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

    const cardElement = (
        <Card 
            key={card.id} 
            className="bg-card/50 backdrop-blur-sm border-white/10 flex flex-col transition-all duration-300 hover:bg-card/80 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 opacity-0"
            style={{ animation: `fade-in 0.5s ease-out ${index * 0.1}s forwards` }}
            onClick={() => handleCardClick(card)}
        >
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                  <card.icon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="w-8 h-8 text-white/60 hover:text-white" onClick={(e) => { e.stopPropagation(); handleShare(card); }}>
                  <Share className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-white/60 hover:text-white" onClick={(e) => { e.stopPropagation(); handleDownload(card); }}>
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-white/60 hover:text-white" onClick={(e) => { e.stopPropagation(); handleCardClick(card); }}>
                  {card.category === 'key' ? (isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : <Expand className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <AnimatedNumber 
                    value={parseValue(card.value)}
                    className="text-3xl font-bold text-foreground"
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
                    className="mb-1 bg-primary/10 text-primary border-primary/20"
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
                
                <p className="text-sm text-muted-foreground">{card.comparison}</p>
                
                {isExpanded && card.details && (
                  <div className="mt-6 p-4 rounded-xl bg-background/20 border border-primary/10">
                    <p className="text-sm text-muted-foreground mb-4">{card.details.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {card.details.breakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-background/10">
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                          <span className="font-semibold text-foreground">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
        </Card>
    );

    if (card.category === 'situation') {
        return cardElement;
    }
    
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
          <h2 className="text-2xl font-bold text-foreground text-glow">{title}</h2>
          {hasMoreCards && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!isExpanded)}
              className="flex items-center gap-2 hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
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
                     <div className="grid gap-6 transition-all duration-500 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
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
              className="flex items-center gap-2 hover:bg-primary/10 border-primary/20 text-muted-foreground hover:text-foreground transition-all"
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
    <div className="p-6 space-y-8 max-w-full">
      {/* Header */}
      <div className="text-center space-y-4 pt-16">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <Stethoscope className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground text-glow">Farma S&M Analytics</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Advanced pharmaceutical sales and marketing analytics dashboard with real-time metrics and insights
        </p>
      </div>

      {/* Key Metrics */}
      {renderMetricRow(keyMetrics, keyMetricsExpanded, setKeyMetricsExpanded, "Key Metrics")}
      
      {/* Situation Metrics */}
      {renderMetricRow(situationMetrics, situationMetricsExpanded, setSituationMetricsExpanded, "Situation (now)")}

      <ScenarioComparison />

      <Simulation />

      <SituationDetailModal
        card={selectedCard}
        open={!!selectedCard}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCard(null);
          }
        }}
      >
        {/* The trigger is now the card itself, so this can be empty */}
        <div/>
      </SituationDetailModal>
    </div>
  );
};

export default FarmaMetrics; 