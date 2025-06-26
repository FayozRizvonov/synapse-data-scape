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
  BarChart3
} from 'lucide-react';
import SituationDetailModal from './SituationDetailModal';
import ScenarioComparison from './ScenarioComparison';
import Simulation from './Simulation';
import CampaignManagement from './CampaignManagement';

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

const FarmaMetricsWithFeatureCards = () => {
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
      id: 'seasonality',
      title: 'Seasonality',
      value: '$1.2M',
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
      id: 'promotion',
      title: 'Promotion Impact',
      value: '$2.1M',
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
          { label: 'Digital Marketing', value: '$0.8M' },
          { label: 'Field Force', value: '$1.1M' },
          { label: 'Events & Conferences', value: '$0.2M' }
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
          <h2 className="text-2xl font-bold text-white text-glow">{title}</h2>
          {hasMoreCards && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!isExpanded)}
              className="flex items-center gap-2 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
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
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30"
                onClick={() => handleCardClick(card)}
                style={{ animation: `fade-in 0.5s ease-out ${index * 0.1}s forwards` }}
              />
            ))}
          </div>
        </div>
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
          <p className="text-white/70 max-w-2xl mx-auto">
            Advanced pharmaceutical sales and marketing analytics dashboard with real-time metrics and insights
          </p>
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

export default FarmaMetricsWithFeatureCards; 