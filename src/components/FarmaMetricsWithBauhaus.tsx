import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ParticleBackground from '@/components/ParticleBackground';
import { BauhausCard } from './ui/bauhaus-card';
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
  Zap
} from 'lucide-react';
import SituationDetailModal from './SituationDetailModal';
import ScenarioComparison from './ScenarioComparison';
import AnimatedNumber from './AnimatedNumber';
import Simulation from './Simulation';
import { useTheme } from '@/hooks/useTheme';

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

const FarmaMetricsWithBauhaus = () => {
  const { theme } = useTheme();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [keyMetricsExpanded, setKeyMetricsExpanded] = useState(false);
  const [situationMetricsExpanded, setSituationMetricsExpanded] = useState(false);
  const [selectedCard, setSelectedCard] = useState<MetricCard | null>(null);
  const [activeTab, setActiveTab] = useState('bauhaus');

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

  const handleFilledButtonClick = (id: string) => {
    console.log(`Filled button clicked for ID: ${id}`);
    // Add your pharmaceutical action logic here
  };

  const handleOutlinedButtonClick = (id: string) => {
    console.log(`Outlined button clicked for ID: ${id}`);
    // Add your pharmaceutical action logic here
  };

  const handleMoreOptionsClick = (id: string) => {
    console.log(`More options dots clicked for ID: ${id}`);
    // Add your pharmaceutical action logic here
  };

  const renderBauhausCards = () => {
    // Определяем цвета в зависимости от темы
    const isDark = theme === 'dark';
    const cardBg = isDark ? '#151419' : '#f0f4fb';
    const separatorColor = isDark ? '#2F2B2A' : '#d3dce8';
    const textColorTop = isDark ? '#bfc7d5' : '#3b4252';
    const textColorMain = isDark ? '#f0f0f1' : '#111014';
    const textColorSub = isDark ? '#a0a1b3' : '#5e6473';
    const textColorProgressLabel = isDark ? '#b5b6c4' : '#454f55';
    const textColorProgressValue = isDark ? '#e7e7f7' : '#1c2541';
    const progressBarBg = isDark ? '#363636' : '#e5e7eb';
    const chronicleButtonBg = isDark ? '#fff' : '#151419';
    const chronicleButtonFg = isDark ? '#151419' : '#fff';
    const chronicleButtonHoverFg = isDark ? '#fff' : '#fff';

    return (
      <div className="w-full p-6 rounded-lg min-h-[400px] flex flex-wrap gap-6 items-center justify-center relative">
        {/* Revenue Growth Card */}
        <BauhausCard
          id="revenue-growth"
          accentColor="#156ef6"
          backgroundColor={cardBg}
          separatorColor={separatorColor}
          borderRadius="2em"
          borderWidth="2px"
          topInscription="Q4 2024 Performance"
          mainText="Revenue Growth"
          subMainText="Quarter over Quarter"
          progressBarInscription="Target Achievement:"
          progress={87.0}
          progressValue="87.0%"
          filledButtonInscription="View Details"
          outlinedButtonInscription="Export Report"
          onFilledButtonClick={handleFilledButtonClick}
          onOutlinedButtonClick={handleOutlinedButtonClick}
          onMoreOptionsClick={handleMoreOptionsClick}
          mirrored={false}
          swapButtons={false}
          textColorTop={textColorTop}
          textColorMain={textColorMain}
          textColorSub={textColorSub}
          textColorProgressLabel={textColorProgressLabel}
          textColorProgressValue={textColorProgressValue}
          progressBarBackground={progressBarBg}
          chronicleButtonBg={chronicleButtonBg}
          chronicleButtonFg={chronicleButtonFg}
          chronicleButtonHoverFg={chronicleButtonHoverFg}
        />

        {/* Patient Share Card */}
        <BauhausCard
          id="patient-share"
          accentColor="#24d200"
          backgroundColor={cardBg}
          separatorColor={separatorColor}
          borderRadius="2em"
          borderWidth="2px"
          topInscription="Market Share"
          mainText="Patient Coverage"
          subMainText="Prescription Share"
          progressBarInscription="Market Penetration:"
          progress={34.2}
          progressValue="34.2%"
          filledButtonInscription="Analyze Trends"
          outlinedButtonInscription="Patient Data"
          onFilledButtonClick={handleFilledButtonClick}
          onOutlinedButtonClick={handleOutlinedButtonClick}
          onMoreOptionsClick={handleMoreOptionsClick}
          mirrored={false}
          swapButtons={false}
          textColorTop={textColorTop}
          textColorMain={textColorMain}
          textColorSub={textColorSub}
          textColorProgressLabel={textColorProgressLabel}
          textColorProgressValue={textColorProgressValue}
          progressBarBackground={progressBarBg}
          chronicleButtonBg={chronicleButtonBg}
          chronicleButtonFg={chronicleButtonFg}
          chronicleButtonHoverFg={chronicleButtonHoverFg}
        />

        {/* ROI Card */}
        <BauhausCard
          id="roi-metrics"
          accentColor="#fc6800"
          backgroundColor={cardBg}
          separatorColor={separatorColor}
          borderRadius="2.25em"
          borderWidth="3px"
          topInscription="Investment Return"
          mainText="Rebate ROI"
          subMainText="Spend vs Revenue Generated"
          progressBarInscription="Efficiency Ratio:"
          progress={85.5}
          progressValue="4.3x"
          filledButtonInscription="Optimize Spend"
          outlinedButtonInscription="ROI Analysis"
          onFilledButtonClick={handleFilledButtonClick}
          onOutlinedButtonClick={handleOutlinedButtonClick}
          onMoreOptionsClick={handleMoreOptionsClick}
          mirrored={false}
          swapButtons={false}
          textColorTop={textColorTop}
          textColorMain={textColorMain}
          textColorSub={textColorSub}
          textColorProgressLabel={textColorProgressLabel}
          textColorProgressValue={textColorProgressValue}
          progressBarBackground={progressBarBg}
          chronicleButtonBg={chronicleButtonBg}
          chronicleButtonFg={chronicleButtonFg}
          chronicleButtonHoverFg={chronicleButtonHoverFg}
        />

        {/* Market Access Card */}
        <BauhausCard
          id="market-access"
          accentColor="#8f10f6"
          backgroundColor={cardBg}
          separatorColor={separatorColor}
          borderRadius="1em"
          borderWidth="4px"
          topInscription="Access Score"
          mainText="Market Access"
          subMainText="Formulary & Coverage"
          progressBarInscription="Accessibility:"
          progress={87.3}
          progressValue="87.3%"
          filledButtonInscription="Access Report"
          outlinedButtonInscription="Coverage Map"
          onFilledButtonClick={handleFilledButtonClick}
          onOutlinedButtonClick={handleOutlinedButtonClick}
          onMoreOptionsClick={handleMoreOptionsClick}
          mirrored={true}
          swapButtons={true}
          textColorTop={textColorTop}
          textColorMain={textColorMain}
          textColorSub={textColorSub}
          textColorProgressLabel={textColorProgressLabel}
          textColorProgressValue={textColorProgressValue}
          progressBarBackground={progressBarBg}
          chronicleButtonBg={chronicleButtonBg}
          chronicleButtonFg={chronicleButtonFg}
          chronicleButtonHoverFg={chronicleButtonHoverFg}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-main relative overflow-hidden">
      <ParticleBackground />
      
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                <Stethoscope className="w-6 h-6 text-blue-600 dark:text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Pharmaceutical Sales & Marketing</h1>
                <p className="text-muted-foreground">Advanced analytics and performance tracking</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
                <Zap className="w-3 h-3 mr-1" />
                Real-time Data
              </Badge>
              <Badge variant="secondary">KPI Tracking</Badge>
              <Badge variant="secondary">Market Analysis</Badge>
              <Badge variant="secondary">Performance Metrics</Badge>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="bauhaus" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Bauhaus Cards
              </TabsTrigger>
              <TabsTrigger value="traditional" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Traditional Metrics
              </TabsTrigger>
              <TabsTrigger value="simulation" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Simulation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bauhaus" className="space-y-6">
              <Card className="bg-gradient-card border-0 shadow-blue-lg hover:shadow-blue-xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Interactive Bauhaus Dashboard
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Modern, animated cards with dynamic borders and smooth interactions. 
                    Perfect for pharmaceutical KPI visualization.
                  </p>
                </CardHeader>
                <CardContent>
                  {renderBauhausCards()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="traditional" className="space-y-6">
              <Card className="bg-gradient-card border-0 shadow-blue-lg hover:shadow-blue-xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Traditional Metrics View
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Standard metric cards with detailed breakdowns and analysis options.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {keyMetrics.map((metric, index) => (
                      <Card key={metric.id} className="bg-gradient-card border-0 shadow-blue-md hover:shadow-blue-lg transition-all duration-300">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-foreground">
                              {metric.title}
                            </CardTitle>
                            <Badge variant={metric.changeType === 'positive' ? 'default' : 'destructive'} className="text-xs">
                              {metric.change}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-foreground mb-2">
                            <AnimatedNumber 
                              value={parseValue(metric.value)} 
                              formatter={(value) => `${value.toFixed(1)}${metric.value.includes('%') ? '%' : ''}`}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{metric.comparison}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="simulation" className="space-y-6">
              <Simulation />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      {selectedCard && (
        <SituationDetailModal
          card={selectedCard}
          open={!!selectedCard}
          onOpenChange={(open) => !open && setSelectedCard(null)}
        />
      )}
    </div>
  );
};

export default FarmaMetricsWithBauhaus; 