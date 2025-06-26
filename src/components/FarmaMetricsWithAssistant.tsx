import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ParticleBackground from '@/components/ParticleBackground';
import { FeatureCard } from '@/components/FeatureCard';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Users,
  Pill,
  DollarSign,
  Target,
  Stethoscope,
  Calendar,
  BarChart3,
  Mail
} from 'lucide-react';
import SituationDetailModal from './SituationDetailModal';
import ScenarioComparison from './ScenarioComparison';
import Simulation from './Simulation';
import CampaignManagement from './CampaignManagement';
import { BauhausBorder } from '@/components/ui/bauhaus-border';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Local interface for our component that extends the base MetricCard
interface LocalMetricCard {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  comparison: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  category: 'key' | 'situation';
  section: 'key-metrics' | 'situation' | 'scenario-comparison';
  description: string;
  details?: {
    description: string;
    breakdown: Array<{ label: string; value: string; }>;
  };
}

// Convert LocalMetricCard to the expected MetricCard type for the modal
const convertToMetricCard = (localCard: LocalMetricCard) => {
  return {
    ...localCard,
    icon: localCard.icon.name || 'Activity', // Convert React component to string
    description: localCard.description
  };
};

const FarmaMetricsWithAssistant = () => {
  const [keyMetricsExpanded, setKeyMetricsExpanded] = useState(false);
  const [situationMetricsExpanded, setSituationMetricsExpanded] = useState(false);
  const [selectedCard, setSelectedCard] = useState<LocalMetricCard | null>(null);

  const keyMetrics: LocalMetricCard[] = [
    {
      id: 'revenue',
      title: 'QoQ Revenue Growth',
      value: '8.7%',
      change: '+40.3%',
      changeType: 'positive',
      comparison: 'vs. last quarter',
      icon: TrendingUp,
      category: 'key',
      section: 'key-metrics',
      description: 'Quarterly revenue growth showing strong upward trend',
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
      section: 'key-metrics',
      description: 'Market share of prescriptions and patient coverage',
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
      section: 'key-metrics',
      description: 'Efficiency of sample distribution to prescription conversion',
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
      section: 'key-metrics',
      description: 'Return on investment for rebate spending programs',
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
      section: 'key-metrics',
      description: 'Overall market accessibility and penetration score',
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

  const situationMetrics: LocalMetricCard[] = [
    {
      id: 'total-sales',
      title: 'Total Sales',
      value: '$21.3M',
      change: '+85.2%',
      changeType: 'positive',
      comparison: 'Total Revenue',
      icon: DollarSign,
      category: 'situation',
      section: 'situation',
      description: 'Total sales revenue including all attributions for the current period.',
      details: {
        description: 'Total sales revenue including all attributions for the current period.',
        breakdown: [
          { label: 'All Channels', value: '$21.3M' },
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
      icon: Activity,
      category: 'situation',
      section: 'situation',
      description: 'This base sales component represents the baseline revenue that would occur without any marketing efforts in the marketing mix model.',
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
      value: '$1.0M',
      change: '+18.2%',
      changeType: 'positive',
      comparison: 'Incremental Revenue',
      icon: BarChart3,
      category: 'situation',
      section: 'situation',
      description: 'Revenue generated above the baseline due to marketing activities.',
      details: {
        description: 'Revenue generated above the baseline due to marketing activities.',
        breakdown: [
          { label: 'Marketing Impact', value: '$0.8M' },
          { label: 'Other Factors', value: '$0.2M' }
        ]
      }
    },
    {
      id: 'promotional-spend',
      title: 'Promotional Spend',
      value: '$0.7M',
      change: '+12.5%',
      changeType: 'positive',
      comparison: 'Total Promotional Budget',
      icon: BarChart3,
      category: 'situation',
      section: 'situation',
      description: 'Total spend on promotional activities for the current period.',
      details: {
        description: 'Total spend on promotional activities for the current period.',
        breakdown: [
          { label: 'Digital', value: '$0.3M' },
          { label: 'Field Force', value: '$0.3M' },
          { label: 'Events', value: '$0.1M' }
        ]
      }
    },
    {
      id: 'roi',
      title: 'ROI',
      value: '1.0x',
      change: '+21.7%',
      changeType: 'positive',
      comparison: 'Return on Investment',
      icon: TrendingUp,
      category: 'situation',
      section: 'situation',
      description: 'Overall return on investment for all marketing and sales activities.',
      details: {
        description: 'Overall return on investment for all marketing and sales activities.',
        breakdown: [
          { label: 'Total Revenue', value: '$21.3M' },
          { label: 'Total Spend', value: '$0.7M' },
          { label: 'ROI', value: '1.0x' }
        ]
      }
    },
    {
      id: 'seasonality',
      title: 'Seasonality',
      value: '$0.3M',
      change: '+6.86%',
      changeType: 'positive',
      comparison: 'Revenue Attribution',
      icon: Calendar,
      category: 'situation',
      section: 'situation',
      description: 'Seasonal revenue patterns and cyclical business variations',
      details: {
        description: 'Seasonal revenue patterns and cyclical business variations',
        breakdown: [
          { label: 'Q1 Seasonal Impact', value: '$0.1M' },
          { label: 'Q2 Seasonal Impact', value: '$0.1M' },
          { label: 'Q3 Seasonal Impact', value: '$0.1M' }
        ]
      }
    },
    {
      id: 'trend',
      title: 'Trend',
      value: '$0.5M',
      change: '+2.1%',
      changeType: 'positive',
      comparison: 'Revenue Attribution',
      icon: TrendingUp,
      category: 'situation',
      section: 'situation',
      description: 'Long-term growth trend in pharmaceutical sales performance',
      details: {
        description: 'Long-term growth trend in pharmaceutical sales performance',
        breakdown: [
          { label: 'Annual Growth Rate', value: '8.4%' },
          { label: 'Market Expansion', value: '12.2%' },
          { label: 'Product Adoption', value: '15.7%' }
        ]
      }
    },
    {
      id: 'f2f-calls',
      title: 'F2F Calls',
      value: '$4.0M',
      change: '+7.5%',
      changeType: 'positive',
      comparison: 'Revenue Attribution',
      icon: Users,
      category: 'situation',
      section: 'situation',
      description: 'Revenue attributed to face-to-face sales calls.',
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
      value: '$0.6M',
      change: '+5.2%',
      changeType: 'positive',
      comparison: 'Revenue Attribution',
      icon: Stethoscope,
      category: 'situation',
      section: 'situation',
      description: 'Revenue attributed to web-based virtual sales calls.',
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
      value: '$0.5M',
      change: '+3.9%',
      changeType: 'positive',
      comparison: 'Revenue Attribution',
      icon: Calendar,
      category: 'situation',
      section: 'situation',
      description: 'Revenue generated from symposium events and conferences.',
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
      value: '$0.3M',
      change: '+2.7%',
      changeType: 'positive',
      comparison: 'Revenue Attribution',
      icon: Mail,
      category: 'situation',
      section: 'situation',
      description: 'Revenue attributed to Salesforce Marketing Cloud email campaigns.',
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
      title: 'Promotion Impact',
      value: '$0.4M',
      change: '+15.3%',
      changeType: 'positive',
      comparison: 'Revenue Attribution',
      icon: BarChart3,
      category: 'situation',
      section: 'situation',
      description: 'Direct impact of promotional activities on revenue generation',
      details: {
        description: 'Direct impact of promotional activities on revenue generation',
        breakdown: [
          { label: 'Digital Marketing', value: '$0.2M' },
          { label: 'Field Force', value: '$0.15M' },
          { label: 'Events & Conferences', value: '$0.05M' }
        ]
      }
    },
    {
      id: 'page-visit-exchange',
      title: 'Page Visit Exchange',
      value: '$0.5M',
      change: '+15.2%',
      changeType: 'positive',
      comparison: 'Revenue Attribution',
      icon: BarChart3,
      category: 'situation',
      section: 'situation',
      description: 'Revenue attributed to page visit exchange marketing activities',
      details: {
        description: 'Revenue attributed to page visit exchange marketing activities',
        breakdown: [
          { label: 'Page Visits', value: '2.4M' },
          { label: 'Conversion Rate', value: '3.2%' },
          { label: 'Avg. Order Value', value: '$275' }
        ]
      }
    },
    {
      id: 'digital-display',
      title: 'Digital Display',
      value: '$0.6M',
      change: '+22.4%',
      changeType: 'positive',
      comparison: 'Revenue Attribution',
      icon: BarChart3,
      category: 'situation',
      section: 'situation',
      description: 'Revenue generated from digital display advertising campaigns',
      details: {
        description: 'Revenue generated from digital display advertising campaigns',
        breakdown: [
          { label: 'Impressions', value: '45.2M' },
          { label: 'Click Rate', value: '1.8%' },
          { label: 'CTR Impact', value: '+0.3%' }
        ]
      }
    },
    {
      id: 'digital-video',
      title: 'Digital Video',
      value: '$0.4M',
      change: '+18.7%',
      changeType: 'positive',
      comparison: 'Revenue Attribution',
      icon: BarChart3,
      category: 'situation',
      section: 'situation',
      description: 'Revenue attributed to digital video marketing campaigns',
      details: {
        description: 'Revenue attributed to digital video marketing campaigns',
        breakdown: [
          { label: 'Video Views', value: '8.7M' },
          { label: 'Completion Rate', value: '67%' },
          { label: 'Engagement Score', value: '8.9/10' }
        ]
      }
    }
  ];

  const handleCardClick = (card: LocalMetricCard) => {
    if (card.category === 'situation') {
      setSelectedCard(card);
    }
  };

  const renderMetricSection = (metrics: LocalMetricCard[], isExpanded: boolean, setExpanded: (expanded: boolean) => void, title: string, hideShowMoreButton = false) => {
    const defaultCards = 4;
    const visibleCards = isExpanded ? metrics.length : defaultCards;
    const hasMoreCards = metrics.length > defaultCards;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-glow">{title}</h2>
          {hasMoreCards && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!isExpanded)}
              className="flex items-center gap-2 hover:bg-white/10 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <span className="text-sm">
                {isExpanded ? 'Hide' : `Show All (${metrics.length})`}
              </span>
              {isExpanded ? (
                <TrendingUp className="w-4 h-4 transition-transform duration-300" />
              ) : (
                <TrendingDown className="w-4 h-4 transition-transform duration-300" />
              )}
            </Button>
          )}
        </div>
        
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isExpanded ? 'max-h-none' : ''
        }`}>
          <div className="grid gap-6 transition-all duration-500 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {metrics.slice(0, visibleCards).map((card, index) => (
              <FeatureCard
                key={card.id}
                id={card.id}
                feature={{
                  title: card.title,
                  icon: card.icon,
                  description: card.description,
                  value: card.value,
                  change: card.change,
                  changeType: card.changeType,
                  comparison: card.comparison,
                  category: card.category
                }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 dark:shadow-none shadow-lg shadow-gray-200/50"
                onClick={() => handleCardClick(card)}
                style={{ animation: `fade-in 0.5s ease-out ${index * 0.1}s forwards` }}
              />
            ))}
          </div>
        </div>
        
        {hasMoreCards && !isExpanded && !hideShowMoreButton && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => setExpanded(true)}
              className="flex items-center gap-2 hover:bg-white/10 border-white/30 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-all"
            >
              <span>Show {metrics.length - defaultCards} more cards</span>
              <TrendingDown className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-black">
      {/* Particle Background */}
      <ParticleBackground />
      
      <div className="relative z-10 p-6 space-y-8 max-w-full">
        {/* Header */}
        <div className="text-center space-y-4 pt-16">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-xl bg-white/10 border border-white/30">
              <Stethoscope className="w-8 h-8 text-gray-900 dark:text-white" />
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
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: High Impact */}
            <BauhausBorder
              accentColor="var(--recommendation-high)"
              borderRadius="1.25em"
              borderWidth="2px"
              backgroundColor={'var(--recommendation-bg)'}
              className="h-full"
            >
              <Card className="bg-transparent border-0 shadow-lg shadow-gray-200/50 dark:shadow-none flex flex-col h-full relative overflow-hidden">
                {/* Grid Pattern Background */}
                <div className="pointer-events-none absolute inset-0 z-0">
                  <svg width="100%" height="100%" className="opacity-40" style={{minHeight: 180}} aria-hidden="true">
                    <defs>
                      <pattern id="grid1" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M0 20V0H20" fill="none" stroke="var(--recommendation-grid)" strokeOpacity="0.07" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid1)" />
                  </svg>
                </div>
                <CardHeader className="flex flex-row items-start justify-between pb-2 z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-red-100/40 dark:bg-red-500/10 border border-red-300/30 dark:border-red-500/30">
                      <TrendingUp className="w-5 h-5 text-red-500 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                      Increase F2F Calls in East Region
                    </CardTitle>
                  </div>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">High Impact</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 dark:text-white/80">F2F calls in East region have highest ROI 2.34x. Increasing by 15% could drive ~35 additional sales per period.</p>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">ROI Focus</Badge>
                  </div>
                </CardContent>
              </Card>
            </BauhausBorder>
            {/* Card 2: Medium Impact */}
            <BauhausBorder
              accentColor="var(--recommendation-medium)"
              borderRadius="1.25em"
              borderWidth="2px"
              backgroundColor={'var(--recommendation-bg)'}
              className="h-full"
            >
              <Card className="bg-transparent border-0 shadow-lg shadow-gray-200/50 dark:shadow-none flex flex-col h-full relative overflow-hidden">
                {/* Grid Pattern Background */}
                <div className="pointer-events-none absolute inset-0 z-0">
                  <svg width="100%" height="100%" className="opacity-40" style={{minHeight: 180}} aria-hidden="true">
                    <defs>
                      <pattern id="grid2" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M0 20V0H20" fill="none" stroke="var(--recommendation-grid)" strokeOpacity="0.07" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid2)" />
                  </svg>
                </div>
                <CardHeader className="flex flex-row items-start justify-between pb-2 z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-yellow-100/40 dark:bg-yellow-500/10 border border-yellow-300/30 dark:border-yellow-500/30">
                      <BarChart3 className="w-5 h-5 text-yellow-400 dark:text-yellow-400" />
                    </div>
                    <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                      Reallocate Display Budget
                    </CardTitle>
                  </div>
                  <Badge className="bg-yellow-400/20 text-yellow-400 border-yellow-500/30">Medium Impact</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 dark:text-white/80">Display clicks have lowest impact 0.12x  Shift 20% of display budget to higher-impact phone calls.</p>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">ROI Focus</Badge>
                  </div>
                </CardContent>
              </Card>
            </BauhausBorder>
            {/* Card 3: Low Impact */}
            <BauhausBorder
              accentColor="var(--recommendation-low)"
              borderRadius="1.25em"
              borderWidth="2px"
              backgroundColor={'var(--recommendation-bg)'}
              className="h-full"
            >
              <Card className="bg-transparent border-0 shadow-lg shadow-gray-200/50 dark:shadow-none flex flex-col h-full relative overflow-hidden">
                {/* Grid Pattern Background */}
                <div className="pointer-events-none absolute inset-0 z-0">
                  <svg width="100%" height="100%" className="opacity-40" style={{minHeight: 180}} aria-hidden="true">
                    <defs>
                      <pattern id="grid3" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M0 20V0H20" fill="none" stroke="var(--recommendation-grid)" strokeOpacity="0.07" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid3)" />
                  </svg>
                </div>
                <CardHeader className="flex flex-row items-start justify-between pb-2 z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-green-100/40 dark:bg-green-500/10 border border-green-300/30 dark:border-green-500/30">
                      <Calendar className="w-5 h-5 text-green-400 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                      Seasonal Campaign Boost
                    </CardTitle>
                  </div>
                  <Badge className="bg-green-400/20 text-green-400 border-green-500/30">Low Impact</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 dark:text-white/80">Strong seasonal patterns detected. Increase Q4 marketing efforts by 25% to capitalize on peak demand.</p>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">ROI Focus</Badge>
                  </div>
                </CardContent>
              </Card>
            </BauhausBorder>
          </div>
        </div>

        {/* Key Metrics */}
        {renderMetricSection(keyMetrics, keyMetricsExpanded, setKeyMetricsExpanded, "Key Metrics", true)}
        
        {/* Situation Metrics */}
        {renderMetricSection(situationMetrics, situationMetricsExpanded, setSituationMetricsExpanded, "Current", true)}

        <ScenarioComparison />

        <Simulation />

        <CampaignManagement />

        <SituationDetailModal
          card={selectedCard ? convertToMetricCard(selectedCard) : null}
          open={!!selectedCard}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedCard(null);
            }
          }}
        >
          <div/>
        </SituationDetailModal>
      </div>
    </div>
  );
};

export default FarmaMetricsWithAssistant; 