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
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import SituationDetailModal from './SituationDetailModal';
import ScenarioComparison from './ScenarioComparison';
import Simulation from './Simulation';
import TailoredPresentation from './TailoredPresentation';
import CampaignManagement from './CampaignManagement';
import SOJMContainer from './SOJMContainer';
import { LineChart, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Area, ResponsiveContainer } from 'recharts';

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
  description?: string;
  keywords?: string[];
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
    description: localCard.description || 'No description available',
    keywords: localCard.keywords || []
  };
};

const FarmaMetricsWithFeatureCards = () => {
  const [keyMetricsExpanded, setKeyMetricsExpanded] = useState(false);
  const [situationMetricsExpanded, setSituationMetricsExpanded] = useState(false);
  const [selectedCard, setSelectedCard] = useState<LocalMetricCard | null>(null);
  const [salesVolumeAnalysisExpanded, setSalesVolumeAnalysisExpanded] = useState(false);
  const [salesVolumeBreakdownExpanded, setSalesVolumeBreakdownExpanded] = useState(false);

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
      keywords: ['revenue', 'growth', 'quarterly'],
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
      keywords: ['prescriptions', 'patient', 'share'],
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
      keywords: ['sample', 'script', 'conversion'],
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
      keywords: ['roi', 'rebate', 'spend'],
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
      keywords: ['market', 'access', 'score'],
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
      id: 'roi',
      title: 'ROI',
      value: '6x',
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
          { label: 'ROI', value: '6x' }
        ]
      }
    },
    {
      id: 'vrr',
      title: 'VRR',
      value: '3.6x',
      change: '+18.2%',
      changeType: 'positive',
      comparison: 'Volume Response Rate',
      icon: BarChart3,
      category: 'situation',
      section: 'situation',
      description: 'Volume Response Rate measures the effectiveness of marketing activities in driving volume increases.',
      details: {
        description: 'Volume Response Rate measures the effectiveness of marketing activities in driving volume increases.',
        breakdown: [
          { label: 'Volume Impact', value: '+18.2%' },
          { label: 'Response Rate', value: '3.6x' },
          { label: 'Efficiency Score', value: '92%' }
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
    
    // Find VRR index to split metrics for Channel Impact section
    const vrrIndex = title === "Channel Impact" ? metrics.findIndex(card => card.id === 'vrr') : -1;
    const beforeVRR = vrrIndex >= 0 ? metrics.slice(0, vrrIndex + 1) : [];
    const afterVRR = vrrIndex >= 0 ? metrics.slice(vrrIndex + 1) : [];
    
    const renderCards = (cards: LocalMetricCard[], startIndex: number = 0) => {
      return cards.map((card, index) => (
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
          className="bg-white/10 backdrop-blur-xl border border-transparent rounded-xl hover:bg-white/20"
          onClick={() => handleCardClick(card)}
          style={{ animation: `fade-in 0.5s ease-out ${(startIndex + index) * 0.1}s forwards` }}
        />
      ));
    };
    
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
          {/* Cards before and including VRR for Channel Impact */}
          {vrrIndex >= 0 && beforeVRR.length > 0 && (
            <div className="grid gap-6 transition-all duration-500 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {renderCards(beforeVRR.slice(0, Math.min(visibleCards, beforeVRR.length)))}
            </div>
          )}
          
          {/* Model Output section header for Channel Impact */}
          {vrrIndex >= 0 && afterVRR.length > 0 && (isExpanded || visibleCards > beforeVRR.length) && (
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent flex-1"></div>
                <h3 className="text-lg font-semibold text-white/80 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                  Model Output
                </h3>
                <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent flex-1"></div>
              </div>
              
              <div className="grid gap-6 transition-all duration-500 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                {renderCards(
                  afterVRR.slice(0, Math.max(0, visibleCards - beforeVRR.length)),
                  beforeVRR.length
                )}
              </div>
            </div>
          )}
          
          {/* Default rendering for Key Metrics or when VRR is not found */}
          {vrrIndex < 0 && (
            <div className="grid gap-6 transition-all duration-500 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {renderCards(metrics.slice(0, visibleCards))}
            </div>
          )}
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
        {renderMetricSection(situationMetrics, situationMetricsExpanded, setSituationMetricsExpanded, "Channel Impact", true)}

        {/* Model Performance Stats */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-glow">Model Performance Stats</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSalesVolumeAnalysisExpanded(!salesVolumeAnalysisExpanded)}
              className="flex items-center gap-2 hover:bg-gradient-blue/10 dark:hover:bg-gradient-cyan/10 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <span className="text-sm">
                {salesVolumeAnalysisExpanded ? 'Hide' : 'Show Chart'}
              </span>
              {salesVolumeAnalysisExpanded ? (
                <ChevronUp className="w-4 h-4 transition-transform duration-300" />
              ) : (
                <ChevronDown className="w-4 h-4 transition-transform duration-300" />
              )}
            </Button>
          </div>
          
          {/* Sales Volume Analysis Metrics - Always Visible */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-4">
            <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Average Error</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">-8.2%</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Model Accuracy</div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">91.8%</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Trend Correlation</div>
              <div className="text-lg font-semibold text-blue-600 dark:text-cyan-400">0.97</div>
            </div>
          </div>
          
          {/* Chart - Conditionally Visible */}
          {salesVolumeAnalysisExpanded && (
            <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-6 animate-in slide-in-from-top-4 duration-300">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sales Volume (Actual vs Predicted)</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400">Comparison of actual sales performance against model predictions over time</p>
              </div>
              
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { date: '02/20', actual: 7029, predicted: 9471.55 },
                      { date: '03/20', actual: 10377, predicted: 12375.2 },
                      { date: '04/20', actual: 9312, predicted: 9312 },
                      { date: '05/20', actual: 14277, predicted: 18426.22 },
                      { date: '06/20', actual: 20724, predicted: 21983.7 },
                      { date: '07/20', actual: 30918, predicted: 28244.63 },
                      { date: '08/20', actual: 34050, predicted: 31743.4 },
                      { date: '09/20', actual: 38067, predicted: 35519.12 },
                      { date: '10/20', actual: 42180, predicted: 40947.85 },
                      { date: '11/20', actual: 45384, predicted: 45004.51 },
                      { date: '12/20', actual: 51630, predicted: 50038.29 },
                      { date: '01/21', actual: 47616, predicted: 47902.53 },
                      { date: '02/21', actual: 39867, predicted: 39637.02 },
                      { date: '03/21', actual: 42861, predicted: 42536.09 },
                      { date: '04/21', actual: 47427, predicted: 43825.95 },
                      { date: '05/21', actual: 51633, predicted: 47494.45 },
                      { date: '06/21', actual: 52458, predicted: 50741.54 },
                      { date: '07/21', actual: 54441, predicted: 55542.83 },
                      { date: '08/21', actual: 58362, predicted: 60401.6 },
                      { date: '09/21', actual: 58554, predicted: 63384.03 },
                      { date: '10/21', actual: 66273, predicted: 68760.02 },
                      { date: '11/21', actual: 69056.57, predicted: 70882.45 },
                      { date: '12/21', actual: 73178.43, predicted: 73960.32 },
                      { date: '01/22', actual: 73073.86, predicted: 70613.55 }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={'#374151'} opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      stroke={'#9ca3af'}
                      fontSize={12}
                    />
                    <YAxis 
                      stroke={'#9ca3af'}
                      fontSize={12}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{ color: '#f3f4f6' }}
                      formatter={(value: number, name: string) => [
                        value.toLocaleString(),
                        name === 'actual' ? 'Actual Sales Volume' : 'Predicted Sales Volume'
                      ]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke={'#06b6d4'} 
                      strokeWidth={2}
                      dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                      name="Actual Sales Volume"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke={'#10b981'} 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      name="Predicted Sales Volume"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Sales Volume Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-glow">Sales Volume Breakdown</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSalesVolumeBreakdownExpanded(!salesVolumeBreakdownExpanded)}
              className="flex items-center gap-2 hover:bg-gradient-blue/10 dark:hover:bg-gradient-cyan/10 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <span className="text-sm">
                {salesVolumeBreakdownExpanded ? 'Hide' : 'Show Chart'}
              </span>
              {salesVolumeBreakdownExpanded ? (
                <ChevronUp className="w-4 h-4 transition-transform duration-300" />
              ) : (
                <ChevronDown className="w-4 h-4 transition-transform duration-300" />
              )}
            </Button>
          </div>
          
          {/* Sales Volume Breakdown Metrics - Always Visible */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-4 mb-4">
            <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Total Channels</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">10</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Base Contribution</div>
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">78%</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Top Channel</div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">F2F calls</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Growth Trend</div>
              <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">+47%</div>
            </div>
          </div>
          
          {/* Chart - Conditionally Visible */}
          {salesVolumeBreakdownExpanded && (
            <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-6 animate-in slide-in-from-top-4 duration-300">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sales Volume (Base vs Promotional Activities)</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400">Breakdown of sales volume showing base sales and contribution from various promotional channels</p>
              </div>
              
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { date: '02/20', base: 6911.35, phoneWeb_ABC: 0, f2f_ABC: 0, phoneWeb_X: 0, f2f_X: 80.56, digitalDTC: 26.48, medscape: 0, outOfHome: 0, massEmail: 0, internalEmail: 1.46 },
                      { date: '03/20', base: 10011.79, phoneWeb_ABC: 137.91, f2f_ABC: 0, phoneWeb_X: 12.58, f2f_X: 161.54, digitalDTC: 37.61, medscape: 0, outOfHome: 0, massEmail: 1.25, internalEmail: 1.23 },
                      { date: '04/20', base: 8028.31, phoneWeb_ABC: 153.67, f2f_ABC: 1003.14, phoneWeb_X: 11.32, f2f_X: 145.39, digitalDTC: 48.49, medscape: 10.7, outOfHome: 0, massEmail: 3.74, internalEmail: 0.61 },
                      { date: '05/20', base: 13184.01, phoneWeb_ABC: 266.35, f2f_ABC: 601.88, phoneWeb_X: 35.34, f2f_X: 130.85, digitalDTC: 58.04, medscape: 39.94, outOfHome: 0, massEmail: 5.54, internalEmail: 0.31 },
                      { date: '06/20', base: 19139.4, phoneWeb_ABC: 781.49, f2f_ABC: 505.88, phoneWeb_X: 82.11, f2f_X: 117.77, digitalDTC: 60.68, medscape: 59.16, outOfHome: 0, massEmail: 8.95, internalEmail: 6.19 },
                      { date: '07/20', base: 28356.33, phoneWeb_ABC: 1136.76, f2f_ABC: 737.79, phoneWeb_X: 124.2, f2f_X: 131.43, digitalDTC: 67.85, medscape: 77.47, outOfHome: 330.54, massEmail: 8.3, internalEmail: 11.47 },
                      { date: '08/20', base: 29486.48, phoneWeb_ABC: 1486.05, f2f_ABC: 804.55, phoneWeb_X: 237.54, f2f_X: 135.25, digitalDTC: 921.84, medscape: 86.57, outOfHome: 628.03, massEmail: 9.43, internalEmail: 6.68 },
                      { date: '09/20', base: 31037.69, phoneWeb_ABC: 1918.62, f2f_ABC: 1315.06, phoneWeb_X: 308.1, f2f_X: 164.12, digitalDTC: 1800.98, medscape: 94.4, outOfHome: 895.77, massEmail: 10.11, internalEmail: 4.06 },
                      { date: '10/20', base: 34796.34, phoneWeb_ABC: 2495.09, f2f_ABC: 1042.35, phoneWeb_X: 440.77, f2f_X: 173.15, digitalDTC: 1754.29, medscape: 102.97, outOfHome: 806.19, massEmail: 9.1, internalEmail: 5.39 },
                      { date: '11/20', base: 36395.05, phoneWeb_ABC: 3181.37, f2f_ABC: 896.82, phoneWeb_X: 553.89, f2f_X: 168.55, digitalDTC: 1854.93, medscape: 108.49, outOfHome: 1481.62, massEmail: 8.68, internalEmail: 13.35 },
                      { date: '12/20', base: 41993.09, phoneWeb_ABC: 3523.21, f2f_ABC: 538.09, phoneWeb_X: 617.97, f2f_X: 151.7, digitalDTC: 1804.52, medscape: 114.14, outOfHome: 2089.51, massEmail: 8.21, internalEmail: 12.53 },
                      { date: '01/21', base: 37854.75, phoneWeb_ABC: 4195.33, f2f_ABC: 322.86, phoneWeb_X: 725.95, f2f_X: 136.53, digitalDTC: 1629.49, medscape: 133.7, outOfHome: 1880.56, massEmail: 7.39, internalEmail: 8.28 },
                      { date: '02/21', base: 30015.94, phoneWeb_ABC: 4711.58, f2f_ABC: 229.9, phoneWeb_X: 797.97, f2f_X: 127.12, digitalDTC: 1472.49, medscape: 147.46, outOfHome: 1692.5, massEmail: 6.65, internalEmail: 7.35 },
                      { date: '03/21', base: 32495.82, phoneWeb_ABC: 5353.52, f2f_ABC: 373.16, phoneWeb_X: 906.81, f2f_X: 122.88, digitalDTC: 1331.12, medscape: 163.4, outOfHome: 1523.25, massEmail: 5.98, internalEmail: 13.86 },
                      { date: '04/21', base: 36845.58, phoneWeb_ABC: 5714.55, f2f_ABC: 386.75, phoneWeb_X: 891.59, f2f_X: 110.6, digitalDTC: 1203.96, medscape: 249.35, outOfHome: 1370.93, massEmail: 5.39, internalEmail: 13.04 },
                      { date: '05/21', base: 41042.29, phoneWeb_ABC: 5881.87, f2f_ABC: 304.42, phoneWeb_X: 934.47, f2f_X: 112.26, digitalDTC: 1088.91, medscape: 269.57, outOfHome: 1233.83, massEmail: 4.86, internalEmail: 14.18 },
                      { date: '06/21', base: 41423.43, phoneWeb_ABC: 6032.47, f2f_ABC: 580.72, phoneWeb_X: 954.21, f2f_X: 113.75, digitalDTC: 984.29, medscape: 286.08, outOfHome: 1110.45, massEmail: 4.38, internalEmail: 8.68 },
                      { date: '07/21', base: 43631.52, phoneWeb_ABC: 5931.59, f2f_ABC: 728.41, phoneWeb_X: 965.68, f2f_X: 123.58, digitalDTC: 892.2, medscape: 301.83, outOfHome: 999.41, massEmail: 4.7, internalEmail: 9.65 },
                      { date: '08/21', base: 46081.26, phoneWeb_ABC: 5781.7, f2f_ABC: 654.18, phoneWeb_X: 925.7, f2f_X: 111.22, digitalDTC: 1623.98, medscape: 315.02, outOfHome: 1764.26, massEmail: 5.59, internalEmail: 6.98 },
                      { date: '09/21', base: 44065.51, phoneWeb_ABC: 5784.7, f2f_ABC: 953.42, phoneWeb_X: 927.45, f2f_X: 104.34, digitalDTC: 3162.19, medscape: 308.3, outOfHome: 1668.43, massEmail: 5.12, internalEmail: 6.98 },
                      { date: '10/21', base: 50856.45, phoneWeb_ABC: 5679.05, f2f_ABC: 1332.01, phoneWeb_X: 929.02, f2f_X: 98.14, digitalDTC: 3836.03, medscape: 296.53, outOfHome: 1501.59, massEmail: 5.79, internalEmail: 5.14 },
                      { date: '11/21', base: 53581.96, phoneWeb_ABC: 5544.56, f2f_ABC: 1993.41, phoneWeb_X: 949.3, f2f_X: 143.45, digitalDTC: 3649.66, medscape: 282.38, outOfHome: 1351.43, massEmail: 5.77, internalEmail: 4.07 },
                      { date: '12/21', base: 58674.14, phoneWeb_ABC: 5196.96, f2f_ABC: 1756.97, phoneWeb_X: 892.1, f2f_X: 158.78, digitalDTC: 3508.82, medscape: 266.55, outOfHome: 1216.29, massEmail: 6.9, internalEmail: 2.21 },
                      { date: '01/22', base: 59714.51, phoneWeb_ABC: 5258.44, f2f_ABC: 1126.56, phoneWeb_X: 890.92, f2f_X: 164.11, digitalDTC: 3157.94, medscape: 239.89, outOfHome: 1094.66, massEmail: 7.53, internalEmail: 6.77 }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={'#374151'} opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      stroke={'#9ca3af'}
                      fontSize={12}
                    />
                    <YAxis 
                      stroke={'#9ca3af'}
                      fontSize={12}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{ color: '#f3f4f6' }}
                      formatter={(value: number, name: string) => [
                        value.toLocaleString(),
                        name
                      ]}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="base" 
                      stackId="1"
                      stroke={'#3b82f6'}
                      fill={'#3b82f6'}
                      fillOpacity={0.8}
                      name="Base"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="phoneWeb_ABC" 
                      stackId="1"
                      stroke={'#10b981'}
                      fill={'#10b981'}
                      fillOpacity={0.8}
                      name="Phone/Web Calls ABC"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="f2f_ABC" 
                      stackId="1"
                      stroke={'#f59e0b'}
                      fill={'#f59e0b'}
                      fillOpacity={0.8}
                      name="F2F ABC"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="phoneWeb_X" 
                      stackId="1"
                      stroke={'#ef4444'}
                      fill={'#ef4444'}
                      fillOpacity={0.8}
                      name="Phone/Web Calls X"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="f2f_X" 
                      stackId="1"
                      stroke={'#8b5cf6'}
                      fill={'#8b5cf6'}
                      fillOpacity={0.8}
                      name="F2F X"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="digitalDTC" 
                      stackId="1"
                      stroke={'#06b6d4'}
                      fill={'#06b6d4'}
                      fillOpacity={0.8}
                      name="Digital DTC"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="medscape" 
                      stackId="1"
                      stroke={'#f97316'}
                      fill={'#f97316'}
                      fillOpacity={0.8}
                      name="Medscape"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="outOfHome" 
                      stackId="1"
                      stroke={'#ec4899'}
                      fill={'#ec4899'}
                      fillOpacity={0.8}
                      name="Out of Home"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="massEmail" 
                      stackId="1"
                      stroke={'#84cc16'}
                      fill={'#84cc16'}
                      fillOpacity={0.8}
                      name="Mass Email"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="internalEmail" 
                      stackId="1"
                      stroke={'#6366f1'}
                      fill={'#6366f1'}
                      fillOpacity={0.8}
                      name="Internal Email"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        <ScenarioComparison />

        <Simulation />

        <TailoredPresentation />

        <CampaignManagement />

        <SOJMContainer />

        {/* Situation Detail Modal */}
        {selectedCard && (
          <SituationDetailModal
            card={convertToMetricCard(selectedCard)}
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

export default FarmaMetricsWithFeatureCards; 