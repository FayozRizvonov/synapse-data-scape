import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ParticleBackground from '@/components/ParticleBackground';
import { useClaireAIBackend } from '@/hooks/useClaireAIBackend';
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
import TailoredPresentation from './TailoredPresentation';
import CampaignManagement from './CampaignManagement';
import SOJMContainer from './SOJMContainer';
import { useTheme } from '@/hooks/useTheme';
import { usePharmaSmDashboardMetrics } from '@/hooks/usePharmaSmDashboardMetrics';
import { useModelPerformanceStats } from '@/hooks/usePharmaMetrics';
import { BauhausBorder } from './ui/bauhaus-border';
import { LineChart, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Area, ResponsiveContainer } from 'recharts';
import type { MetricCard as KBMetricCard } from '@/data/metricsKnowledgeBase';

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
  description?: string;
  keywords?: string[];
  chartData?: KBMetricCard['chartData'];
  details?: {
    description: string;
    breakdown: Array<{ label: string; value: string; }>;
  };
}

function farmaCardToKbSituationCard(c: MetricCard): KBMetricCard {
  return {
    id: c.id,
    title: c.title,
    value: c.value,
    change: c.change,
    changeType: c.changeType,
    comparison: c.comparison,
    description: c.description ?? c.details?.description ?? '',
    icon: c.icon,
    category: 'situation',
    section: 'pharma-sm',
    keywords: c.keywords ?? [],
    details: c.details,
    chartData: c.chartData,
  };
}

const FarmaMetrics = () => {
  const { theme } = useTheme();
  const claireAI = useClaireAIBackend(1); // Use project ID 1
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [keyMetricsExpanded, setKeyMetricsExpanded] = useState(false);
  const [situationMetricsExpanded, setSituationMetricsExpanded] = useState(false);
  const [selectedCard, setSelectedCard] = useState<KBMetricCard | null>(null);
  const [salesVolumeAnalysisExpanded, setSalesVolumeAnalysisExpanded] = useState(false);
  const [salesVolumeBreakdownExpanded, setSalesVolumeBreakdownExpanded] = useState(false);
  const { data: dbPharma, loading: dbLoading } = usePharmaSmDashboardMetrics();
  const modelStats = useModelPerformanceStats({ projectId: '1' });

  // Helper to parse value for AnimatedNumber
  const parseValue = (valueStr: string) => {
    return parseFloat(valueStr.replace(/[$,%xM+]/g, ''));
  };

  const keyMetrics: MetricCard[] = dbPharma?.key ?? [];
  const situationMetrics: MetricCard[] = dbPharma?.situation ?? [];

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
      setSelectedCard(farmaCardToKbSituationCard(card));
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

    // Border color for Key and Situation
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
    
    // Find VRR index to split metrics for Channel Impact section
    const vrrIndex = title === "Channel Impact" ? metrics.findIndex(card => card.id === 'vrr') : -1;
    const beforeVRR = vrrIndex >= 0 ? metrics.slice(0, vrrIndex + 1) : [];
    const afterVRR = vrrIndex >= 0 ? metrics.slice(vrrIndex + 1) : [];
    
    const renderCards = (cards: MetricCard[], startIndex: number = 0) => {
      return cards.map((card, index) => 
        renderCard(card, startIndex + index)
      );
    };
    
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
          {/* Cards before and including VRR for Channel Impact */}
          {vrrIndex >= 0 && beforeVRR.length > 0 && (
            <div className="grid gap-6 transition-all duration-500 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
              {renderCards(beforeVRR.slice(0, Math.min(visibleCards, beforeVRR.length)))}
            </div>
          )}
          
          {/* Model Output section header for Channel Impact */}
          {vrrIndex >= 0 && afterVRR.length > 0 && (isExpanded || visibleCards > beforeVRR.length) && (
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-gradient-to-r from-transparent via-blue-300 dark:via-cyan-500/30 to-transparent flex-1"></div>
                <h3 className="text-lg font-semibold text-blue-700 dark:text-cyan-400 px-4 py-2 bg-gradient-blue/10 dark:bg-gradient-cyan/10 rounded-lg border border-blue-500/30 dark:border-cyan-500/30">
                  Model Output
                </h3>
                <div className="h-px bg-gradient-to-r from-transparent via-blue-300 dark:via-cyan-500/30 to-transparent flex-1"></div>
              </div>
              
              <div className="grid gap-6 transition-all duration-500 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-4">
                {renderCards(
                  afterVRR.slice(0, Math.max(0, visibleCards - beforeVRR.length)),
                  beforeVRR.length
                )}
              </div>
            </div>
          )}
          
          {/* Default rendering for Key Metrics or when VRR is not found */}
          {vrrIndex < 0 && (
            <div className="grid gap-6 transition-all duration-500 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-4">
              {renderCards(metrics.slice(0, visibleCards))}
            </div>
          )}
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
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white text-glow">Pharma S&M Augmented Analytics</h1>
              <Badge variant={claireAI.isConnected ? "default" : "secondary"} className="ml-4">
                {claireAI.isConnected ? "🟢 CLAIRE AI Connected" : "🟡 Static Data"}
              </Badge>
            </div>
          </div>
          <p className="text-gray-600 dark:text-white/70 max-w-2xl mx-auto">
            Advanced pharmaceutical sales and marketing analytics dashboard with real-time metrics and insights
          </p>
          
          {/* CLAIRE AI Backend Control Panel */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button 
              onClick={() => claireAI.trainModel()} 
              disabled={claireAI.isLoading}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {claireAI.isLoading ? 'Training...' : 'Train MMM Model'}
            </Button>
            <Button 
              onClick={() => claireAI.optimizeBudget(1, 1000000)} 
              disabled={claireAI.isLoading}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {claireAI.isLoading ? 'Optimizing...' : 'Optimize Budget'}
            </Button>
            <Button 
              onClick={() => claireAI.generateInsights(1)} 
              disabled={claireAI.isLoading}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {claireAI.isLoading ? 'Generating...' : 'Generate Insights'}
            </Button>
          </div>
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
        {dbLoading ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-glow">Key Metrics</h2>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-36 rounded-xl bg-white/10 animate-pulse" />
              ))}
            </div>
          </div>
        ) : keyMetrics.length === 0 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-glow">Key Metrics</h2>
            <p className="text-gray-500 dark:text-slate-500 text-sm">No key metrics available.</p>
          </div>
        ) : (
          renderMetricRow(keyMetrics, keyMetricsExpanded, setKeyMetricsExpanded, "Key Metrics")
        )}

        {/* Situation Metrics */}
        {dbLoading ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-glow">Channel Impact</h2>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-36 rounded-xl bg-white/10 animate-pulse" />
              ))}
            </div>
          </div>
        ) : situationMetrics.length === 0 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-glow">Channel Impact</h2>
            <p className="text-gray-500 dark:text-slate-500 text-sm">No channel impact metrics available.</p>
          </div>
        ) : (
          renderMetricRow(situationMetrics, situationMetricsExpanded, setSituationMetricsExpanded, "Channel Impact")
        )}

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
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {modelStats.loading ? (
                  <span className="inline-block w-16 h-5 rounded bg-white/10 animate-pulse" />
                ) : modelStats.mape > 0 ? (
                  `-${(modelStats.mape * 100).toFixed(1)}%`
                ) : (
                  '-8.2%'
                )}
              </div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Model Accuracy</div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {modelStats.loading ? (
                  <span className="inline-block w-16 h-5 rounded bg-white/10 animate-pulse" />
                ) : modelStats.mape > 0 ? (
                  `${((1 - modelStats.mape) * 100).toFixed(1)}%`
                ) : (
                  '91.8%'
                )}
              </div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Trend Correlation</div>
              <div className="text-lg font-semibold text-blue-600 dark:text-cyan-400">
                {modelStats.loading ? (
                  <span className="inline-block w-16 h-5 rounded bg-white/10 animate-pulse" />
                ) : modelStats.rSquared > 0 ? (
                  modelStats.rSquared.toFixed(2)
                ) : (
                  '0.97'
                )}
              </div>
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
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                      fontSize={12}
                    />
                    <YAxis 
                      stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                      fontSize={12}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                        border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{ color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}
                      formatter={(value: number, name: string) => [
                        value.toLocaleString(),
                        name,
                      ]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke={theme === 'dark' ? '#06b6d4' : '#0284c7'} 
                      strokeWidth={2}
                      dot={{ fill: theme === 'dark' ? '#06b6d4' : '#0284c7', strokeWidth: 2, r: 4 }}
                      name="Actual Sales Volume"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke={theme === 'dark' ? '#10b981' : '#059669'} 
                      strokeWidth={2}
                      dot={{ fill: theme === 'dark' ? '#10b981' : '#059669', strokeWidth: 2, r: 4 }}
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
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                      fontSize={12}
                    />
                    <YAxis 
                      stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                      fontSize={12}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                        border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{ color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}
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
                      stroke={theme === 'dark' ? '#3b82f6' : '#2563eb'}
                      fill={theme === 'dark' ? '#3b82f6' : '#2563eb'}
                      fillOpacity={0.8}
                      name="Base"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="phoneWeb_ABC" 
                      stackId="1"
                      stroke={theme === 'dark' ? '#10b981' : '#059669'}
                      fill={theme === 'dark' ? '#10b981' : '#059669'}
                      fillOpacity={0.8}
                      name="Phone/Web Calls ABC"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="f2f_ABC" 
                      stackId="1"
                      stroke={theme === 'dark' ? '#f59e0b' : '#d97706'}
                      fill={theme === 'dark' ? '#f59e0b' : '#d97706'}
                      fillOpacity={0.8}
                      name="F2F ABC"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="phoneWeb_X" 
                      stackId="1"
                      stroke={theme === 'dark' ? '#ef4444' : '#dc2626'}
                      fill={theme === 'dark' ? '#ef4444' : '#dc2626'}
                      fillOpacity={0.8}
                      name="Phone/Web Calls X"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="f2f_X" 
                      stackId="1"
                      stroke={theme === 'dark' ? '#8b5cf6' : '#7c3aed'}
                      fill={theme === 'dark' ? '#8b5cf6' : '#7c3aed'}
                      fillOpacity={0.8}
                      name="F2F X"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="digitalDTC" 
                      stackId="1"
                      stroke={theme === 'dark' ? '#06b6d4' : '#0891b2'}
                      fill={theme === 'dark' ? '#06b6d4' : '#0891b2'}
                      fillOpacity={0.8}
                      name="Digital DTC"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="medscape" 
                      stackId="1"
                      stroke={theme === 'dark' ? '#f97316' : '#ea580c'}
                      fill={theme === 'dark' ? '#f97316' : '#ea580c'}
                      fillOpacity={0.8}
                      name="Medscape"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="outOfHome" 
                      stackId="1"
                      stroke={theme === 'dark' ? '#ec4899' : '#db2777'}
                      fill={theme === 'dark' ? '#ec4899' : '#db2777'}
                      fillOpacity={0.8}
                      name="Out of Home"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="massEmail" 
                      stackId="1"
                      stroke={theme === 'dark' ? '#84cc16' : '#65a30d'}
                      fill={theme === 'dark' ? '#84cc16' : '#65a30d'}
                      fillOpacity={0.8}
                      name="Mass Email"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="internalEmail" 
                      stackId="1"
                      stroke={theme === 'dark' ? '#6366f1' : '#4f46e5'}
                      fill={theme === 'dark' ? '#6366f1' : '#4f46e5'}
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
