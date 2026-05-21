import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ParticleBackground from '@/components/ParticleBackground';
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
  Mail,
  Phone,
  Monitor,
  HeartHandshake,
  FileText,
  ChevronDown,
  ChevronUp,
  Expand,
  Share,
  Download,
  RefreshCw
} from 'lucide-react';
import SituationDetailModal from './SituationDetailModal';
import ScenarioComparison from './ScenarioComparison';
import Simulation from './Simulation';
import TailoredPresentation from './TailoredPresentation';
import CampaignManagement from './CampaignManagement';
import SOJMContainer from './SOJMContainer';
import { BauhausBorder } from '@/components/ui/bauhaus-border';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AnimatedNumber from './AnimatedNumber';
import { useTheme } from '@/hooks/useTheme';
import { LineChart, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Area, ResponsiveContainer } from 'recharts';
import { VoiceAssistant } from './VoiceAssistant';
import ChatView from './ChatView';
import { usePharmaMetrics, useModelPerformanceStats, MetricCard } from '@/hooks/usePharmaMetrics';

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
    description: localCard.description,
    keywords: [] // Add empty keywords array to satisfy MetricCard interface
  };
};

const FarmaMetricsWithAssistant = () => {
  const { permissions, isCompanyAdmin } = useAuth();
  const { theme } = useTheme();
  const [keyMetricsExpanded, setKeyMetricsExpanded] = useState(false);
  const [situationMetricsExpanded, setSituationMetricsExpanded] = useState(false);
  const [selectedCard, setSelectedCard] = useState<LocalMetricCard | null>(null);
  const [salesVolumeAnalysisExpanded, setSalesVolumeAnalysisExpanded] = useState(false);
  const [salesVolumeBreakdownExpanded, setSalesVolumeBreakdownExpanded] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('2022-2024');
  const [selectedBreakdownPeriod, setSelectedBreakdownPeriod] = useState('2022-2024');

  // Use dynamic data hooks
  const {
    keyMetrics: dynamicKeyMetrics,
    situationMetrics: dynamicSituationMetrics,
    modelOutputs: dynamicModelOutputs,
    roiAnalysis: dynamicROIAnalysis,
    promotionalImpact: dynamicPromotionalImpact,
    salesVolumeData: dynamicSalesVolumeData,
    salesBreakdownData: dynamicSalesBreakdownData,
    loading: metricsLoading,
    error: metricsError,
    refreshData,
    setPeriod
  } = usePharmaMetrics({
    projectId: "fa95a40e-7574-47c1-9c46-85820edad19f",
    period: selectedPeriod,
    autoRefresh: true,
    refreshInterval: 60000 // 1 minute
  });

  const {
    rSquared,
    adjRSquared,
    mape,
    durbinWatson,
    aic,
    bic,
    loading: statsLoading,
    error: statsError
  } = useModelPerformanceStats({
    projectId: "fa95a40e-7574-47c1-9c46-85820edad19f"
  });

  // Helper function to get icon for metric
  const getIconForMetric = (metricId: string) => {
    const iconMap: { [key: string]: React.ComponentType<React.SVGProps<SVGSVGElement>> } = {
      'revenue': TrendingUp,
      'prescriptions': Users,
      'sample-ratio': Pill,
      'roi': DollarSign,
      'market-access': Target,
      'phone-web-calls': Phone,
      'digital-dtc-company': Monitor,
      'f2f-calls-new': HeartHandshake,
      'mass-email': Mail,
      'medscape-banner': FileText,
      'total-sales': DollarSign,
      'base-sales': Activity,
      'incremental': BarChart3,
      'promotional-spend': BarChart3,
      'vrr': BarChart3,
      'seasonality': Calendar,
      'trend': TrendingUp,
      'f2f-calls': Users,
      'web-virtual-calls': Stethoscope,
      'symposium': Calendar,
      'sfmc-emails': Mail
    };
    return iconMap[metricId] || Activity;
  };

  // Function to get data based on selected period - now uses dynamic data
  const getSalesVolumeData = () => {
    // Use dynamic data if available, otherwise fallback to static data
    if (dynamicSalesVolumeData && dynamicSalesVolumeData.length > 0) {
      return dynamicSalesVolumeData;
    }
    
    // Fallback static data
    return [
      { date: '02/22', actual: 7029, predicted: 9471.55 },
      { date: '03/22', actual: 10377, predicted: 12375.2 },
      { date: '04/22', actual: 9312, predicted: 9312 },
      { date: '05/22', actual: 14277, predicted: 18426.22 },
      { date: '06/22', actual: 20724, predicted: 21983.7 },
      { date: '07/22', actual: 30918, predicted: 28244.63 },
      { date: '08/22', actual: 34050, predicted: 31743.4 },
      { date: '09/22', actual: 38067, predicted: 35519.12 },
      { date: '10/22', actual: 42180, predicted: 40947.85 },
      { date: '11/22', actual: 45384, predicted: 45004.51 },
      { date: '12/22', actual: 51630, predicted: 50038.29 },
      { date: '01/23', actual: 47616, predicted: 47902.53 },
      { date: '02/23', actual: 39867, predicted: 39637.02 },
      { date: '03/23', actual: 42861, predicted: 42536.09 },
      { date: '04/23', actual: 47427, predicted: 43825.95 },
      { date: '05/23', actual: 51633, predicted: 47494.45 },
      { date: '06/23', actual: 52458, predicted: 50741.54 },
      { date: '07/23', actual: 54441, predicted: 55542.83 },
      { date: '08/23', actual: 58362, predicted: 60401.6 },
      { date: '09/23', actual: 58554, predicted: 63384.03 },
      { date: '10/23', actual: 66273, predicted: 68760.02 },
      { date: '11/23', actual: 69056.57, predicted: 70882.45 },
      { date: '12/23', actual: 73178.43, predicted: 73960.32 },
      { date: '01/24', actual: 73073.86, predicted: 70613.55 }
    ];
  };

  // Removed prototype history helper (no inline expansion)

  // Function to get breakdown chart data based on selected period - now uses dynamic data
  const getSalesVolumeBreakdownData = () => {
    // Use dynamic data if available, otherwise fallback to static data
    if (dynamicSalesBreakdownData && dynamicSalesBreakdownData.length > 0) {
      return dynamicSalesBreakdownData;
    }
    
    // Fallback static data
    return [
      { date: '02/22', base: 6911.35, phoneWeb_ABC: 0, f2f_ABC: 0, phoneWeb_X: 0, f2f_X: 80.56, digitalDTC: 26.48, medscape: 0, outOfHome: 0, massEmail: 0, internalEmail: 1.46 },
      { date: '03/22', base: 10011.79, phoneWeb_ABC: 137.91, f2f_ABC: 0, phoneWeb_X: 12.58, f2f_X: 161.54, digitalDTC: 37.61, medscape: 0, outOfHome: 0, massEmail: 1.25, internalEmail: 1.23 },
      { date: '04/22', base: 8028.31, phoneWeb_ABC: 153.67, f2f_ABC: 1003.14, phoneWeb_X: 11.32, f2f_X: 145.39, digitalDTC: 48.49, medscape: 10.7, outOfHome: 0, massEmail: 3.74, internalEmail: 0.61 },
      { date: '05/22', base: 13184.01, phoneWeb_ABC: 266.35, f2f_ABC: 601.88, phoneWeb_X: 35.34, f2f_X: 130.85, digitalDTC: 58.04, medscape: 39.94, outOfHome: 0, massEmail: 5.54, internalEmail: 0.31 },
      { date: '06/22', base: 19139.4, phoneWeb_ABC: 781.49, f2f_ABC: 505.88, phoneWeb_X: 82.11, f2f_X: 117.77, digitalDTC: 60.68, medscape: 59.16, outOfHome: 0, massEmail: 8.95, internalEmail: 6.19 },
      { date: '07/22', base: 28356.33, phoneWeb_ABC: 1136.76, f2f_ABC: 737.79, phoneWeb_X: 124.2, f2f_X: 131.43, digitalDTC: 67.85, medscape: 77.47, outOfHome: 330.54, massEmail: 8.3, internalEmail: 11.47 },
      { date: '08/22', base: 29486.48, phoneWeb_ABC: 1486.05, f2f_ABC: 804.55, phoneWeb_X: 237.54, f2f_X: 135.25, digitalDTC: 921.84, medscape: 86.57, outOfHome: 628.03, massEmail: 9.43, internalEmail: 6.68 },
      { date: '09/22', base: 31037.69, phoneWeb_ABC: 1918.62, f2f_ABC: 1315.06, phoneWeb_X: 308.1, f2f_X: 164.12, digitalDTC: 1800.98, medscape: 94.4, outOfHome: 895.77, massEmail: 10.11, internalEmail: 4.06 },
      { date: '10/22', base: 34796.34, phoneWeb_ABC: 2495.09, f2f_ABC: 1042.35, phoneWeb_X: 440.77, f2f_X: 173.15, digitalDTC: 1754.29, medscape: 102.97, outOfHome: 806.19, massEmail: 9.1, internalEmail: 5.39 },
      { date: '11/22', base: 36395.05, phoneWeb_ABC: 3181.37, f2f_ABC: 896.82, phoneWeb_X: 553.89, f2f_X: 168.55, digitalDTC: 1854.93, medscape: 108.49, outOfHome: 1481.62, massEmail: 8.68, internalEmail: 13.35 },
      { date: '12/22', base: 41993.09, phoneWeb_ABC: 3523.21, f2f_ABC: 538.09, phoneWeb_X: 617.97, f2f_X: 151.7, digitalDTC: 1804.52, medscape: 114.14, outOfHome: 2089.51, massEmail: 8.21, internalEmail: 12.53 },
      { date: '01/23', base: 37854.75, phoneWeb_ABC: 4195.33, f2f_ABC: 322.86, phoneWeb_X: 725.95, f2f_X: 136.53, digitalDTC: 1629.49, medscape: 133.7, outOfHome: 1880.56, massEmail: 7.39, internalEmail: 8.28 },
      { date: '02/23', base: 30015.94, phoneWeb_ABC: 4711.58, f2f_ABC: 229.9, phoneWeb_X: 797.97, f2f_X: 127.12, digitalDTC: 1472.49, medscape: 147.46, outOfHome: 1692.5, massEmail: 6.65, internalEmail: 7.35 },
      { date: '03/23', base: 32495.82, phoneWeb_ABC: 5353.52, f2f_ABC: 373.16, phoneWeb_X: 906.81, f2f_X: 122.88, digitalDTC: 1331.12, medscape: 163.4, outOfHome: 1523.25, massEmail: 5.98, internalEmail: 13.86 },
      { date: '04/23', base: 36845.58, phoneWeb_ABC: 5714.55, f2f_ABC: 386.75, phoneWeb_X: 891.59, f2f_X: 110.6, digitalDTC: 1203.96, medscape: 249.35, outOfHome: 1370.93, massEmail: 5.39, internalEmail: 13.04 },
      { date: '05/23', base: 41042.29, phoneWeb_ABC: 5881.87, f2f_ABC: 304.42, phoneWeb_X: 934.47, f2f_X: 112.26, digitalDTC: 1088.91, medscape: 269.57, outOfHome: 1233.83, massEmail: 4.86, internalEmail: 14.18 },
      { date: '06/23', base: 41423.43, phoneWeb_ABC: 6032.47, f2f_ABC: 580.72, phoneWeb_X: 954.21, f2f_X: 113.75, digitalDTC: 984.29, medscape: 286.08, outOfHome: 1110.45, massEmail: 4.38, internalEmail: 8.68 },
      { date: '07/23', base: 43631.52, phoneWeb_ABC: 5931.59, f2f_ABC: 728.41, phoneWeb_X: 965.68, f2f_X: 123.58, digitalDTC: 892.2, medscape: 301.83, outOfHome: 999.41, massEmail: 4.7, internalEmail: 9.65 },
      { date: '08/23', base: 46081.26, phoneWeb_ABC: 5781.7, f2f_ABC: 654.18, phoneWeb_X: 925.7, f2f_X: 111.22, digitalDTC: 1623.98, medscape: 315.02, outOfHome: 1764.26, massEmail: 5.59, internalEmail: 6.98 },
      { date: '09/23', base: 44065.51, phoneWeb_ABC: 5784.7, f2f_ABC: 953.42, phoneWeb_X: 927.45, f2f_X: 104.34, digitalDTC: 3162.19, medscape: 308.3, outOfHome: 1668.43, massEmail: 5.12, internalEmail: 6.98 },
      { date: '10/23', base: 50856.45, phoneWeb_ABC: 5679.05, f2f_ABC: 1332.01, phoneWeb_X: 929.02, f2f_X: 98.14, digitalDTC: 3836.03, medscape: 296.53, outOfHome: 1501.59, massEmail: 5.79, internalEmail: 5.14 },
      { date: '11/23', base: 53581.96, phoneWeb_ABC: 5544.56, f2f_ABC: 1993.41, phoneWeb_X: 949.3, f2f_X: 143.45, digitalDTC: 3649.66, medscape: 282.38, outOfHome: 1351.43, massEmail: 5.77, internalEmail: 4.07 },
      { date: '12/23', base: 58674.14, phoneWeb_ABC: 5196.96, f2f_ABC: 1756.97, phoneWeb_X: 892.1, f2f_X: 158.78, digitalDTC: 3508.82, medscape: 266.55, outOfHome: 1216.29, massEmail: 6.9, internalEmail: 2.21 },
      { date: '01/24', base: 59714.51, phoneWeb_ABC: 5258.44, f2f_ABC: 1126.56, phoneWeb_X: 890.92, f2f_X: 164.11, digitalDTC: 3157.94, medscape: 239.89, outOfHome: 1094.66, massEmail: 7.53, internalEmail: 6.77 }
    ];
  };

  // Use dynamic metrics if available, otherwise fallback to static data
  const keyMetrics: LocalMetricCard[] = dynamicKeyMetrics.length > 0 ? dynamicKeyMetrics.map((metric: MetricCard) => ({
    ...metric,
    description: metric.description ?? '',
    icon: getIconForMetric(metric.id),
    category: 'key' as const,
    section: 'key-metrics' as const
  })) : [
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
    },
    {
      id: 'phone-web-calls',
      title: 'Phone Web Calls',
      value: '1,355',
      change: '+15.2%',
      changeType: 'positive',
      comparison: '$98.2K cost',
      icon: Phone,
      category: 'key',
      section: 'key-metrics',
      description: 'Phone and web-based customer outreach campaigns',
      details: {
        description: 'Phone and web-based customer outreach campaigns',
        breakdown: [
          { label: 'Total Calls', value: '1,355' },
          { label: 'Campaign Cost', value: '$98.2K' },
          { label: 'Cost per Call', value: '$72.47' },
          { label: 'Success Rate', value: '68.3%' }
        ]
      }
    },
    {
      id: 'digital-dtc-company',
      title: 'Digital DTC Compaign',
      value: '476,405',
      change: '+22.8%',
      changeType: 'positive',
      comparison: '$674.6K cost',
      icon: Monitor,
      category: 'key',
      section: 'key-metrics',
      description: 'Digital direct-to-consumer campaign clicks',
      details: {
        description: 'Digital direct-to-consumer campaign clicks',
        breakdown: [
          { label: 'Total Clicks', value: '476,405' },
          { label: 'Campaign Cost', value: '$674.6K' },
          { label: 'Cost per Click', value: '$1.42' },
          { label: 'Click-through Rate', value: '3.8%' }
        ]
      }
    },
    {
      id: 'f2f-calls-new',
      title: 'F2F Calls',
      value: '508',
      change: '-5.3%',
      changeType: 'negative',
      comparison: '$73.7K cost',
      icon: HeartHandshake,
      category: 'key',
      section: 'key-metrics',
      description: 'Face-to-face sales representative visits',
      details: {
        description: 'Face-to-face sales representative visits',
        breakdown: [
          { label: 'Total Visits', value: '508' },
          { label: 'Campaign Cost', value: '$73.7K' },
          { label: 'Cost per Visit', value: '$145.08' },
          { label: 'Conversion Rate', value: '42.1%' }
        ]
      }
    },
    {
      id: 'mass-email',
      title: 'Mass Email',
      value: '8,072',
      change: '+31.4%',
      changeType: 'positive',
      comparison: '$8K cost',
      icon: Mail,
      category: 'key',
      section: 'key-metrics',
      description: 'Mass email campaign opens',
      details: {
        description: 'Mass email campaign opens',
        breakdown: [
          { label: 'Total Opens', value: '8,072' },
          { label: 'Campaign Cost', value: '$8K' },
          { label: 'Cost per Open', value: '$0.99' },
          { label: 'Open Rate', value: '24.7%' }
        ]
      }
    },
    {
      id: 'medscape-banner',
      title: 'Medscape Banner',
      value: '431,508',
      change: '+18.9%',
      changeType: 'positive',
      comparison: '$163.9K cost',
      icon: FileText,
      category: 'key',
      section: 'key-metrics',
      description: 'Medscape banner advertisement clicks',
      details: {
        description: 'Medscape banner advertisement clicks',
        breakdown: [
          { label: 'Total Clicks', value: '431,508' },
          { label: 'Campaign Cost', value: '$163.9K' },
          { label: 'Cost per Click', value: '$0.38' },
          { label: 'Impression Rate', value: '2.1%' }
        ]
      }
    }
  ];

  // Debug: Log the dynamic situation metrics
  console.log('dynamicSituationMetrics:', dynamicSituationMetrics);
  console.log('dynamicSituationMetrics length:', dynamicSituationMetrics.length);
  
  const situationMetrics: LocalMetricCard[] = dynamicSituationMetrics.length > 0 ? dynamicSituationMetrics.map((metric: MetricCard) => ({
    ...metric,
    description: metric.description ?? '',
    icon: getIconForMetric(metric.id),
    category: 'situation' as const,
    section: 'situation' as const
  })) : [
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
      description: 'This base sales component represents the baseline revenue that would occur without any promotional efforts',
      details: {
        description: 'This base sales component represents the baseline revenue that would occur without any promotional efforts',
        breakdown: [
          { label: 'Confidence Interval', value: '85%' },
          { label: 'P-value', value: '0.01' },
          { label: 'Historical Impact', value: '2019-2023' }
        ]
      }
    },
    {
      id: 'incremental',
      title: 'Incremental Sales',
      value: '$7.3M',
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
          { label: 'Marketing Impact', value: '$6.8M' },
          { label: 'Other Factors', value: '$0.5M' }
        ]
      }
    },
    {
      id: 'promotional-spend',
      title: 'Promotional Spend',
      value: '$1.2M',
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
          { label: 'Digital', value: '$0.6M' },
          { label: 'Field Force', value: '$0.5M' },
          { label: 'Events', value: '$0.1M' }
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
      description: 'Volume response rate - this is raw activity divided by contribution of the same activity from the model to describe number of prescription per activity.',
      details: {
        description: 'Volume response rate - this is raw activity divided by contribution of the same activity from the model to describe number of prescription per activity.',
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
      title: 'Web Virtual Calls',
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
      id: 'mass-email',
      title: 'Mass Email',
      value: '$0.4M',
      change: '+15.3%',
      changeType: 'positive',
      comparison: 'Revenue Attribution',
      icon: Mail,
      category: 'situation',
      section: 'situation',
      description: 'Direct impact of mass email campaigns on revenue generation',
      details: {
        description: 'Direct impact of mass email campaigns on revenue generation',
        breakdown: [
          { label: 'Emails Sent', value: '120,000' },
          { label: 'Open Rate', value: '24.7%' },
          { label: 'Revenue per Email', value: '$3.33' }
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
    // Show more cards initially for Key Metrics since we now have 25 metrics
    const defaultCards = title === "Key Metrics" ? 8 : 4;
    const visibleCards = isExpanded ? metrics.length : defaultCards;
    const hasMoreCards = metrics.length > defaultCards;
    
    // Grouping: Show ROI + VRR + Seasonality + Trend before the divider (Channel Impact),
    // and keep the rest under Model Output
    const headIds = new Set(['roi', 'vrr', 'seasonality', 'trend']);
    const beforeVRR = metrics.filter(card => headIds.has(card.id));
    const afterVRR = metrics.filter(card => !headIds.has(card.id));
    
    const renderCard = (card: LocalMetricCard, index: number) => {
      
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
        Mail,
        Phone,
        Monitor,
        HeartHandshake,
        FileText
      };

      // Get icon component - handle both string names and React components
      let IconComponent: React.ElementType = Activity;
      if (typeof card.icon === 'string') {
        IconComponent = iconMap[card.icon] || Activity;
      } else if (card.icon && typeof card.icon === 'function') {
        IconComponent = card.icon as React.ElementType;
      }

      // Border color for Key and Situation
      const accentColor = card.category === 'key' ? '#156ef6' : '#24d200';
      const borderRadius = '1.25em';
      const borderWidth = '2px';
      const backgroundColor = theme === 'dark' 
        ? 'rgba(30, 41, 59, 0.9)' 
        : 'rgba(255, 255, 255, 0.9)';
      // Removed prototype expansion for this component

      return (
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
                <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-slate-800/50">
                  <Share className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-slate-800/50">
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-slate-800/50">
                  {card.category === 'key' ? <ChevronDown className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {card.value}
                  </div>
                  <Badge 
                    variant={card.changeType === 'positive' ? 'default' : 'destructive'}
                    className="mb-1 bg-gradient-green/20 dark:bg-gradient-cyan/20 text-green-600 dark:text-cyan-400 border-green-500/30 dark:border-cyan-500/30"
                  >
                    {card.changeType === 'positive' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {card.change}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-slate-400">{card.comparison}</p>

                {/* Prototype expansion removed */}
              </div>
            </CardContent>
          </Card>
        </BauhausBorder>
      );
    };

    const renderCards = (cards: LocalMetricCard[], startIndex: number = 0) => {
      return cards.map((card, index) => 
        renderCard(card, startIndex + index)
      );
    };
    
    return (
      <div className="space-y-6">
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
          {/* Cards before and including VRR */}
          {beforeVRR.length > 0 && (
            <div className="grid gap-6 transition-all duration-500 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
              {renderCards(beforeVRR.slice(0, Math.min(visibleCards, beforeVRR.length)))}
            </div>
          )}
          
          {/* Model Output section header */}
          {afterVRR.length > 0 && (isExpanded || visibleCards > beforeVRR.length) && (
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
          
          {/* Fallback when grouping yields no head cards */}
          {beforeVRR.length === 0 && (
            <div className="grid gap-6 transition-all duration-500 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-4">
              {renderCards(metrics.slice(0, visibleCards))}
            </div>
          )}
        </div>
        
        {hasMoreCards && !isExpanded && !hideShowMoreButton && (
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

  // Show loading state
  if (metricsLoading) {
    return (
      <div className="relative min-h-screen bg-black flex items-center justify-center">
        <ParticleBackground />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading pharma metrics...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (metricsError) {
    return (
      <div className="relative min-h-screen bg-black flex items-center justify-center">
        <ParticleBackground />
        <div className="relative z-10 text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <p className="text-white text-lg mb-4">Error loading metrics: {metricsError}</p>
          <Button onClick={refreshData} className="bg-blue-600 hover:bg-blue-700">
            Retry
          </Button>
        </div>
      </div>
    );
  }

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
          
          {/* Data Status */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${metricsLoading ? 'bg-yellow-400' : metricsError ? 'bg-red-400' : 'bg-green-400'}`}></div>
              <span className="text-gray-600 dark:text-white/70">
                {metricsLoading ? 'Loading...' : metricsError ? 'Error' : 'Connected'}
              </span>
            </div>
            {!metricsLoading && !metricsError && (
              <Button 
                onClick={refreshData} 
                variant="outline" 
                size="sm"
                className="text-gray-600 dark:text-white/70 border-gray-300 dark:border-white/30 hover:bg-white/10"
              >
                Refresh Data
              </Button>
            )}
            {!metricsLoading && !metricsError && (
              <span className="text-xs text-gray-500 dark:text-white/50">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Marketing Optimization Recommendations */}
        {(isCompanyAdmin || permissions?.can_marketing_optimization_recommendations) && (
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
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 no-hover-dark">ROI Focus</Badge>
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
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 no-hover-dark">ROI Focus</Badge>
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
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 no-hover-dark">ROI Focus</Badge>
                  </div>
                </CardContent>
              </Card>
            </BauhausBorder>
          </div>
        </div>
        )}

        {/* Key Metrics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-glow">Key Metrics</h2>
            <div className="flex items-center gap-4">
              {/* Period Selector */}
              <Select value={selectedPeriod} onValueChange={(value) => {
                setSelectedPeriod(value);
                setPeriod(value);
              }}>
                <SelectTrigger className="w-32 bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2022-2024">2022-2024</SelectItem>
                  <SelectItem value="2021-2023">2021-2023</SelectItem>
                  <SelectItem value="2020-2022">2020-2022</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Data Source Badge */}
              <Badge variant="outline" className="bg-green-500/20 border-green-500/30 text-green-400">
                🟢 Live Data from CSV
              </Badge>
              
              {/* Metrics Count */}
              <span className="text-sm text-gray-500 dark:text-white/50">
                ({dynamicKeyMetrics.length > 0 ? dynamicKeyMetrics.length : keyMetrics.length} metrics)
              </span>
              
              {/* Refresh Button */}
              <Button
                onClick={refreshData}
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          
          {renderMetricSection(keyMetrics, keyMetricsExpanded, setKeyMetricsExpanded, "Key Metrics", true)}
        </div>

        {/* Model Summary */}
        {situationMetrics && situationMetrics.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-glow">Model Summary</h2>
              <button
                onClick={() => setSituationMetricsExpanded(!situationMetricsExpanded)}
                className="text-sm text-blue-500 hover:text-blue-400 transition-colors"
              >
                {situationMetricsExpanded ? 'Show Less' : 'Show All (6)'}
              </button>
            </div>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {situationMetrics.slice(0, situationMetricsExpanded ? situationMetrics.length : 6).map((metric) => (
                <div
                  key={metric.id}
                  className="relative group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  style={{
                    borderRight: '2px solid #10b981',
                    borderBottom: '2px solid #10b981'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30">
                      {React.createElement(getIconForMetric(metric.id), { className: "w-6 h-6 text-green-400" })}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-500">
                        {metric.value}
                      </div>
                      <div className={`text-sm font-medium ${
                        metric.changeType === 'positive'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {metric.change}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {metric.title}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-white/70 mb-3">
                    {metric.description}
                  </p>

                  <div className="text-xs text-gray-500 dark:text-white/50">
                    {metric.comparison}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ROI Analysis */}
        {dynamicROIAnalysis && dynamicROIAnalysis.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-glow">ROI Analysis</h2>
            </div>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {dynamicROIAnalysis.map((roi) => (
                <div
                  key={roi.id}
                  className="relative group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  style={{
                    borderRight: '2px solid #10b981',
                    borderBottom: '2px solid #10b981'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30">
                      {React.createElement(getIconForMetric(roi.id), { className: "w-6 h-6 text-green-400" })}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-500">
                        {roi.roi_percentage}
                      </div>
                      <div className={`text-sm font-medium ${
                        roi.changeType === 'positive'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {roi.change}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {roi.title}
                  </h3>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-white/70">ROI Ratio:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{roi.roi_ratio}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-white/70">Revenue:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{roi.incremental_revenue}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-white/70">Cost:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{roi.total_cost}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-white/70">Efficiency:</span>
                      <span className={`font-medium ${
                        roi.efficiency === 'High' ? 'text-green-600 dark:text-green-400' :
                        roi.efficiency === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {roi.efficiency}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-white/50">
                    Activity Level: {roi.activity_level}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ROI Analysis */}
        {dynamicROIAnalysis && dynamicROIAnalysis.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-glow">ROI Analysis</h2>
            </div>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {dynamicROIAnalysis.map((roi) => (
                <div
                  key={roi.id}
                  className="relative group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30">
                      {React.createElement(getIconForMetric(roi.id), { className: "w-6 h-6 text-green-400" })}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {roi.roi_percentage}
                      </div>
                      <div className={`text-sm font-medium ${
                        roi.changeType === 'positive' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {roi.change}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {roi.title}
                  </h3>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-white/70">ROI Ratio:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{roi.roi_ratio}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-white/70">Revenue:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{roi.incremental_revenue}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-white/70">Cost:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{roi.total_cost}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-white/70">Efficiency:</span>
                      <span className={`font-medium ${
                        roi.efficiency === 'High' ? 'text-green-600 dark:text-green-400' :
                        roi.efficiency === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {roi.efficiency}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-white/50">
                    Activity Level: {roi.activity_level}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Promotional Impact Analysis */}
        {dynamicPromotionalImpact && dynamicPromotionalImpact.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-glow">Promotional Impact Analysis</h2>
            </div>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {dynamicPromotionalImpact.map((impact) => (
                <div
                  key={impact.id}
                  className="relative group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30">
                      {React.createElement(getIconForMetric(impact.id), { className: "w-6 h-6 text-purple-400" })}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {impact.incremental_sales}
                      </div>
                      <div className={`text-sm font-medium ${
                        impact.changeType === 'positive' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {impact.change}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {impact.title}
                  </h3>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-white/70">Share of Voice:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{impact.share_of_voice}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-white/70">Impact Level:</span>
                      <span className={`font-medium ${
                        impact.impact_level === 'High' ? 'text-green-600 dark:text-green-400' :
                        impact.impact_level === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {impact.impact_level}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-white/70">Category:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{impact.category}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-white/70">Change:</span>
                      <span className={`font-medium ${
                        impact.changeType === 'positive' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {impact.change_percentage}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-white/50">
                    {impact.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
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
          
          {/* Model Performance Stats Metrics - Always Visible */}
          <TooltipProvider>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-6 mb-4">
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10 cursor-help transition-colors hover:bg-white/10">
                    <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">R²</div>
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {statsLoading ? '...' : `${(rSquared * 100).toFixed(2)}%`}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">Overall model fit</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-white/5 border border-white/10 backdrop-blur-sm text-gray-900 dark:text-white">
                  <p className="max-w-xs">Coefficient of determination - shows what proportion of the variance in the dependent variable is explained by the model. 97.55% indicates very high model quality.</p>
                </TooltipContent>
              </UITooltip>
              
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10 cursor-help transition-colors hover:bg-white/10">
                    <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Adj R²</div>
                    <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                      {statsLoading ? '...' : `${(adjRSquared * 100).toFixed(1)}%`}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">Adjusted for predictors</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-white/5 border border-white/10 backdrop-blur-sm text-gray-900 dark:text-white">
                  <p className="max-w-xs">Adjusted R² accounts for the number of predictors in the model. Low values may indicate overfitting or excess variables.</p>
                </TooltipContent>
              </UITooltip>
              
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10 cursor-help transition-colors hover:bg-white/10">
                    <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">MAPE</div>
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {statsLoading ? '...' : `${(mape * 100).toFixed(2)}%`}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">Prediction accuracy</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-white/5 border border-white/10 backdrop-blur-sm text-gray-900 dark:text-white">
                  <p className="max-w-xs">Mean Absolute Percentage Error. 3.01% is an excellent result, indicating high accuracy of model predictions.</p>
                </TooltipContent>
              </UITooltip>
              
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10 cursor-help transition-colors hover:bg-white/10">
                    <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">DW</div>
                    <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                      {statsLoading ? '...' : durbinWatson.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">Autocorrelation</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-white/5 border border-white/10 backdrop-blur-sm text-gray-900 dark:text-white">
                  <p className="max-w-xs">Durbin-Watson statistic tests for autocorrelation in residuals. Value of 0.63 indicates positive autocorrelation (normal range: 1.5-2.5).</p>
                </TooltipContent>
              </UITooltip>
              
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10 cursor-help transition-colors hover:bg-white/10">
                    <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">AIC</div>
                    <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                      {statsLoading ? '...' : aic.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">Model comparison</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-white/5 border border-white/10 backdrop-blur-sm text-gray-900 dark:text-white">
                  <p className="max-w-xs">Akaike Information Criterion for model comparison. Lower values indicate better models when accounting for complexity.</p>
                </TooltipContent>
              </UITooltip>
              
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10 cursor-help transition-colors hover:bg-white/10">
                    <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">BIC</div>
                    <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                      {statsLoading ? '...' : bic.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">Model comparison</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-white/5 border border-white/10 backdrop-blur-sm text-gray-900 dark:text-white">
                  <p className="max-w-xs">Bayesian Information Criterion. More strictly penalizes complex models compared to AIC. Used for optimal model selection.</p>
                </TooltipContent>
              </UITooltip>
            </div>
          </TooltipProvider>
          
          {/* Chart - Conditionally Visible */}
          {salesVolumeAnalysisExpanded && (
            <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-6 animate-in slide-in-from-top-4 duration-300">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Volume (Actual vs Predicted)</h3>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-32 h-8 bg-white/10 border-white/20 text-gray-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="2022-2024" className="text-white hover:bg-gray-700">2022-2024</SelectItem>
                      <SelectItem value="2021-2023" className="text-white hover:bg-gray-700">2021-2023</SelectItem>
                      <SelectItem value="2020-2022" className="text-white hover:bg-gray-700">2020-2022</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400">Comparison of actual sales performance against model predictions over time</p>
              </div>
              
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={getSalesVolumeData()}
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
                        name,
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
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Volume (Base vs Promotional Activities)</h3>
                  <Select value={selectedBreakdownPeriod} onValueChange={setSelectedBreakdownPeriod}>
                    <SelectTrigger className="w-32 h-8 bg-white/10 border-white/20 text-gray-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="2022-2024" className="text-white hover:bg-gray-700">2022-2024</SelectItem>
                      <SelectItem value="2021-2023" className="text-white hover:bg-gray-700">2021-2023</SelectItem>
                      <SelectItem value="2020-2022" className="text-white hover:bg-gray-700">2020-2022</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400">Breakdown of sales volume showing base sales and contribution from various promotional channels</p>
              </div>
              
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={getSalesVolumeBreakdownData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="gradientBase" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#1e40af" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="gradientPhoneWebABC" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#047857" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="gradientF2FABC" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#d97706" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="gradientPhoneWebX" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#dc2626" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="gradientF2FX" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="gradientDigitalDTC" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#0891b2" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="gradientMedscape" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#ea580c" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="gradientOutOfHome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#db2777" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="gradientMassEmail" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#84cc16" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#65a30d" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="gradientInternalEmail" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
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
                      fill="url(#gradientBase)"
                      fillOpacity={1}
                      name="Base"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="phoneWeb_ABC" 
                      stackId="1"
                      stroke={'#10b981'}
                      fill="url(#gradientPhoneWebABC)"
                      fillOpacity={1}
                      name="Phone/Web Calls ABC"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="f2f_ABC" 
                      stackId="1"
                      stroke={'#f59e0b'}
                      fill="url(#gradientF2FABC)"
                      fillOpacity={1}
                      name="F2F ABC"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="phoneWeb_X" 
                      stackId="1"
                      stroke={'#ef4444'}
                      fill="url(#gradientPhoneWebX)"
                      fillOpacity={1}
                      name="Phone/Web Calls X"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="f2f_X" 
                      stackId="1"
                      stroke={'#8b5cf6'}
                      fill="url(#gradientF2FX)"
                      fillOpacity={1}
                      name="F2F X"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="digitalDTC" 
                      stackId="1"
                      stroke={'#06b6d4'}
                      fill="url(#gradientDigitalDTC)"
                      fillOpacity={1}
                      name="Digital DTC"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="medscape" 
                      stackId="1"
                      stroke={'#f97316'}
                      fill="url(#gradientMedscape)"
                      fillOpacity={1}
                      name="Medscape"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="outOfHome" 
                      stackId="1"
                      stroke={'#ec4899'}
                      fill="url(#gradientOutOfHome)"
                      fillOpacity={1}
                      name="Out of Home"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="massEmail" 
                      stackId="1"
                      stroke={'#84cc16'}
                      fill="url(#gradientMassEmail)"
                      fillOpacity={1}
                      name="Mass Email"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="internalEmail" 
                      stackId="1"
                      stroke={'#6366f1'}
                      fill="url(#gradientInternalEmail)"
                      fillOpacity={1}
                      name="Internal Email"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {(isCompanyAdmin || permissions?.can_scenario_comparison) && <ScenarioComparison />}

        <Simulation />

        <TailoredPresentation />

        {(isCompanyAdmin || permissions?.can_campaign_management) && <CampaignManagement />}

        {(isCompanyAdmin || permissions?.can_omnichannel_journey) && <SOJMContainer />}

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