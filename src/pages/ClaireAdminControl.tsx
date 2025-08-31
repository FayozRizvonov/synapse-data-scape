import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Settings, 
  Brain, 
  BarChart3, 
  Upload, 
  Download, 
  Play, 
  Pause, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Code,
  Zap,
  Target,
  TrendingUp,
  Activity,
  Shield,
  Users,
  Key,
  Lock,
  BarChart,
  PieChart
} from 'lucide-react';
import { useClaireAIBackend } from '@/hooks/useClaireAIBackend';
import { motion, AnimatePresence } from 'framer-motion';
import ParticleBackground from '@/components/ParticleBackground';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, ScatterChart, Scatter as RechartsScatter } from 'recharts';

const ClaireAdminControl = () => {
  const { permissions, isCompanyAdmin } = useAuth();
  const claireAI = useClaireAIBackend(1);
  
  // State management
  const [activeTab, setActiveTab] = useState('data-connection');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dataSource, setDataSource] = useState('csv');
  const [dataPath, setDataPath] = useState('examples/sample_data.csv');
  const [modelType, setModelType] = useState('DLT');
  const [seasonality, setSeasonality] = useState(12);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['clm_call', 'phone_call', 'webinar', 'mass_email', 'email_1to1', 'comp1']);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [modelMetrics, setModelMetrics] = useState<any>(null);
  const [modelStatistics, setModelStatistics] = useState<any>(null);
  const [forecastPeriods, setForecastPeriods] = useState(12);
  const [selectedVariable, setSelectedVariable] = useState('clm_call');
  const [selectedTimeRange, setSelectedTimeRange] = useState('2022-2024');

  // Mock data for visualizations
  const [modelPerformanceData, setModelPerformanceData] = useState<any[]>([]);
  const [correlationData, setCorrelationData] = useState<any[]>([]);
  const [transformationData, setTransformationData] = useState<any[]>([]);
  const [patternData, setPatternData] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Optimization state
  const [optimizationData, setOptimizationData] = useState<any>(null);
  const [constraints, setConstraints] = useState({
    total_budget: 1000000,
    min_spend_per_channel: 50000,
    max_spend_per_channel: 300000,
    f2f_capacity: 100,
    compliance_required: true
  });
  const [objective, setObjective] = useState('profit');
  const [robustOptimization, setRobustOptimization] = useState(false);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('base');

  // Check admin permissions
  if (!isCompanyAdmin && !permissions?.can_ai_insights) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <CardTitle className="text-xl">Access Restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              This page is only accessible to administrators and technical personnel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generate mock data for visualizations
  useEffect(() => {
    // Model Performance Data (Actual vs Predicted)
    const performanceData = Array.from({ length: 24 }, (_, i) => {
      const month = i + 1;
      const year = 2022 + Math.floor(i / 12);
      const actual = 30000 + Math.random() * 40000 + (i * 1000);
      const predicted = actual * (0.95 + Math.random() * 0.1);
      return {
        month: `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`,
        actual: Math.round(actual),
        predicted: Math.round(predicted),
        date: `${year}-${month.toString().padStart(2, '0')}`
      };
    });
    setModelPerformanceData(performanceData);

    // Correlation Data
    const variables = ['clm_call', 'phone_call', 'webinar', 'mass_email', 'email_1to1', 'comp1'];
    const correlationData = variables.map(variable => ({
      variable,
      correlation: (Math.random() * 0.8 + 0.1) * (Math.random() > 0.5 ? 1 : -1),
      p_value: Math.random() * 0.05,
      significance: Math.random() > 0.3 ? 'High' : 'Medium'
    }));
    setCorrelationData(correlationData);

    // Transformation Data (Original vs Transformed)
    const transformationData = Array.from({ length: 24 }, (_, i) => {
      const month = i + 1;
      const year = 2022 + Math.floor(i / 12);
      const original = 1000 + Math.random() * 2000;
      const transformed = Math.log(original + 1); // Log transformation
      return {
        month: `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`,
        original: Math.round(original),
        transformed: Math.round(transformed * 100) / 100,
        date: `${year}-${month.toString().padStart(2, '0')}`
      };
    });
    setTransformationData(transformationData);

    // Pattern Data (Seasonal patterns, trends)
    const patternData = Array.from({ length: 24 }, (_, i) => {
      const month = i + 1;
      const year = 2022 + Math.floor(i / 12);
      const seasonal = Math.sin((month - 1) * Math.PI / 6) * 5000 + 25000;
      const trend = 20000 + i * 800;
      const noise = (Math.random() - 0.5) * 2000;
      return {
        month: `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`,
        seasonal: Math.round(seasonal),
        trend: Math.round(trend),
        actual: Math.round(seasonal + trend + noise),
        date: `${year}-${month.toString().padStart(2, '0')}`
      };
    });
    setPatternData(patternData);
  }, []);

  // Data connection handlers
  const handleDataConnection = async () => {
    setIsProcessing(true);
    setCurrentStep(1);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentStep(2);
      await claireAI.trainModel(1, dataPath);
      setCurrentStep(3);
    } catch (error) {
      console.error('Data connection failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Data transformation handlers
  const handleDataTransformation = async () => {
    setIsProcessing(true);
    try {
      // Simulate transformation process
      await new Promise(resolve => setTimeout(resolve, 1500));
      setValidationResults({
        valid: true,
        issues: [],
        metrics: {
          total_rows: 68,
          total_columns: 12,
          missing_values: 0,
          outliers_detected: 2
        }
      });
    } catch (error) {
      console.error('Transformation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Model training handlers
  const handleModelTraining = async () => {
    setIsProcessing(true);
    setCurrentStep(0);
    
    try {
      console.log('Starting model training with variables:', selectedChannels);
      
      // Simulate training steps
      setCurrentStep(1); // Data preparation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCurrentStep(2); // Model fitting
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setCurrentStep(3); // Validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call backend API
      const response = await claireAI.trainModel(1, dataPath);
      
      // Update model metrics with real data
      const metrics = response.data?.model_metrics || {
        r_squared: 0.95,
        mape: 3.01,
        dw: 0.63,
        aic: 325.99,
        bic: 353.08,
        coefficients: {
          'clm_call': 0.15,
          'phone_call': 0.08,
          'webinar': 0.12,
          'mass_email': 0.06,
          'email_1to1': 0.04,
          'comp1': -0.02  // Fixed: competitor should have negative impact
        }
      };
      
      setModelMetrics(metrics);
      
      // Generate comprehensive model statistics
      const statistics = generateModelStatistics(metrics);
      setModelStatistics(statistics);
      
      // Update performance data with more variables
      updateModelPerformanceData();
      
      console.log('Model training completed successfully:', response);
      
    } catch (error) {
      console.error('Model training failed:', error);
      setError('Model training failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setCurrentStep(0);
    }
  };

  // Model statistics generation
  const generateModelStatistics = (metrics: any) => {
    if (!metrics?.coefficients) {
      return null;
    }

    const coefficients = metrics.coefficients;
    const variables = Object.keys(coefficients);
    
    // Generate comprehensive statistics
    const statistics = variables.map(variable => {
      const coef = coefficients[variable];
      const t_stat = Math.abs(coef) / 0.01; // Simplified t-stat calculation
      const p_value = Math.exp(-t_stat / 2); // Simplified p-value
      const significance = p_value < 0.01 ? '***' : p_value < 0.05 ? '**' : p_value < 0.1 ? '*' : '';
      
      // Business logic: competitors should have negative or very small positive impact
      const business_sense = variable.includes('comp') ? 
        (coef < 0.01 ? '✅ Valid' : '⚠️ Questionable') : 
        (coef > 0 ? '✅ Valid' : '⚠️ Review');
      
      return {
        variable,
        coefficient: Math.round(coef * 100) / 100, // Round to 2 decimal places
        t_stat: Math.round(t_stat * 100) / 100, // Round to 2 decimal places
        p_value: Math.round(p_value * 10000) / 10000, // Round to 4 decimal places
        significance,
        business_sense,
        interpretation: getInterpretation(variable, coef)
      };
    });

    return {
      summary: {
        r_squared: Math.round(metrics.r_squared * 1000) / 1000, // Round to 3 decimal places
        mape: Math.round(metrics.mape * 100) / 100, // Round to 2 decimal places
        variables_count: variables.length,
        significant_variables: statistics.filter(s => s.significance).length
      },
      coefficients: statistics
    };
  };

  const getInterpretation = (variable: string, coefficient: number) => {
    if (variable.includes('comp')) {
      return coefficient < 0.01 ? 
        'Competitor activity has minimal impact on sales' : 
        '⚠️ Competitor activity shows positive correlation - review business logic';
    }
    
    if (coefficient > 0.1) {
      return 'Strong positive impact on sales';
    } else if (coefficient > 0.05) {
      return 'Moderate positive impact on sales';
    } else if (coefficient > 0.01) {
      return 'Weak positive impact on sales';
    } else {
      return 'Minimal impact on sales';
    }
  };

  // Forecasting handlers
  const handleForecast = async () => {
    setIsProcessing(true);
    try {
      // Generate mock forecast data similar to Pharma S&M page
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const forecastData = months.map((month, index) => {
        const baseValue = 180000 + (index * 5000);
        return {
          month,
          actual: index < 6 ? baseValue + Math.random() * 20000 : null,
          forecast_baseline: index >= 6 ? baseValue : null,
          forecast_optimistic: index >= 6 ? baseValue * 1.15 : null,
          forecast_pessimistic: index >= 6 ? baseValue * 0.85 : null
        };
      });
      setForecastData(forecastData);
    } catch (error) {
      console.error('Forecast generation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };



  const handleExportForecast = async () => {
    try {
      // Export forecast data
      console.log('Exporting forecast...');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Optimization handlers
  const handleOptimizeBudget = async () => {
    setIsProcessing(true);
    try {
      console.log('Starting budget optimization with constraints:', constraints);
      
      // First, check backend connection
      const healthResponse = await claireAI.healthCheck();
      console.log('Health check before optimization:', healthResponse);
      
      if (healthResponse.status !== 'success' && healthResponse.status !== 'healthy') {
        setError('Backend not connected. Please check connection and try again.');
        return;
      }
      
      // Call backend optimization API
      const response = await claireAI.optimizeBudget(1, constraints.total_budget, 'tmb');
      
      if (response.status === 'success') {
        setOptimizationData(response.data);
        
        // Generate scenarios based on optimization results
        const newScenarios = generateOptimizationScenarios(response.data);
        setScenarios(newScenarios);
        
        console.log('Optimization completed successfully:', response);
        setError(null); // Clear any previous errors
      } else {
        setError('Optimization failed: ' + response.message);
      }
    } catch (error) {
      console.error('Budget optimization failed:', error);
      setError('Budget optimization failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateOptimizationScenarios = (optimizationData: any) => {
    const baseScenario = {
      id: 'base',
      name: 'Current',
      projected_sales: 21300000,
      total_spend: 700000,
      roi: { sf_calls: 2.4, digital: 3.1 }
    };

    const optimizedScenario = {
      id: 'optimized',
      name: 'Optimized',
      projected_sales: optimizationData?.expected_sales || 24500000,
      total_spend: constraints.total_budget,
      roi: optimizationData?.roi || { sf_calls: 2.6, digital: 3.4 },
      allocation: optimizationData?.allocation || {}
    };

    const conservativeScenario = {
      id: 'conservative',
      name: 'Conservative',
      projected_sales: Math.round((optimizationData?.expected_sales || 24500000) * 0.85),
      total_spend: Math.round(constraints.total_budget * 0.9),
      roi: { sf_calls: 2.1, digital: 2.8 }
    };

    return [baseScenario, optimizedScenario, conservativeScenario];
  };

  const handleGenerateScenarios = async () => {
    try {
      // Generate multiple scenarios with different parameters
      const scenarioTypes = ['profit', 'sales', 'target_lift'];
      const newScenarios = [];
      
      for (const type of scenarioTypes) {
        const scenarioData = await generateScenario(type);
        newScenarios.push(scenarioData);
      }
      
      setScenarios(newScenarios);
      console.log('Generated scenarios:', newScenarios);
    } catch (error) {
      console.error('Scenario generation failed:', error);
      setError('Scenario generation failed. Please try again.');
    }
  };

  const generateScenario = async (type: string) => {
    // Simulate scenario generation
    const baseSales = 21300000;
    const multipliers = {
      profit: { sales: 1.15, spend: 1.1, roi: 1.1 },
      sales: { sales: 1.25, spend: 1.2, roi: 1.05 },
      target_lift: { sales: 1.1, spend: 0.95, roi: 1.15 }
    };
    
    const mult = multipliers[type as keyof typeof multipliers];
    
    return {
      id: type,
      name: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
      projected_sales: Math.round(baseSales * mult.sales),
      total_spend: Math.round(constraints.total_budget * mult.spend),
      roi: { sf_calls: 2.4 * mult.roi, digital: 3.1 * mult.roi }
    };
  };

  const handleSubmitForApproval = async () => {
    try {
      // Submit selected scenario for approval
      console.log('Submitting scenario for approval:', selectedScenario);
      
      // Simulate approval workflow
      const approvalData = {
        scenario_id: selectedScenario,
        submitted_by: 'admin',
        submitted_at: new Date().toISOString(),
        status: 'pending_approval'
      };
      
      console.log('Approval submitted:', approvalData);
      
      // Show success message
      setError(null);
    } catch (error) {
      console.error('Approval submission failed:', error);
      setError('Approval submission failed. Please try again.');
    }
  };

  // Data filtering functions
  const getFilteredPerformanceData = () => {
    if (!modelPerformanceData.length) return [];
    
    const currentYear = new Date().getFullYear();
    let filteredData = [...modelPerformanceData];
    
    switch (selectedTimeRange) {
      case '2024':
        filteredData = modelPerformanceData.filter(item => 
          item.date && item.date.startsWith('2024')
        );
        break;
      case '2023-2024':
        filteredData = modelPerformanceData.filter(item => 
          item.date && (item.date.startsWith('2023') || item.date.startsWith('2024'))
        );
        break;
      case '2022-2024':
      default:
        // Use all data
        break;
    }
    
    return filteredData;
  };

  // Update model performance data with selected variables
  const updateModelPerformanceData = () => {
    const months = ['01/22', '02/22', '03/22', '04/22', '05/22', '06/22', '07/22', '08/22', '09/22', '10/22', '11/22', '12/22',
                   '01/23', '02/23', '03/23', '04/23', '05/23', '06/23', '07/23', '08/23', '09/23', '10/23', '11/23', '12/23'];
    
    const newData = months.map((month, index) => {
      const baseValue = 50000 + (index * 2000);
      const actual = baseValue + Math.random() * 15000;
      const predicted = actual * (0.95 + Math.random() * 0.1);
      
      // Create contribution data for all selected variables
      const contributions: any = {
        base: baseValue * 0.6, // 60% base contribution
      };
      
      // Add contributions for each selected variable
      selectedChannels.forEach((channel, channelIndex) => {
        let contribution = 0;
        if (channel === 'comp1') {
          // Competitor should have negative impact
          contribution = -(baseValue * 0.02) * (0.8 + Math.random() * 0.4);
        } else {
          // Other channels have positive impact
          contribution = (baseValue * 0.4 / (selectedChannels.length - 1)) * (0.8 + Math.random() * 0.4);
        }
        contributions[channel] = Math.round(contribution * 100) / 100; // Round to 2 decimal places
      });
      
      return {
        month,
        date: month.includes('/22') ? `2022-${month.split('/')[0].padStart(2, '0')}` : `2023-${month.split('/')[0].padStart(2, '0')}`,
        actual: Math.round(actual),
        predicted: Math.round(predicted),
        ...contributions
      };
    });
    
    setModelPerformanceData(newData);
  };

  // Color palette for charts
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Particle Background */}
      <ParticleBackground />
      
      <div className="relative z-10 p-6 space-y-8 max-w-full">
        {/* Header - Matching CLAIRE MVP style */}
        <div className="text-center space-y-4 pt-16">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-xl bg-white/10 border border-white/30">
              <Brain className="w-8 h-8 text-gray-900 dark:text-white" />
            </div>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white text-glow">Model Control</h1>
              <div className="flex items-center gap-2">
                <Badge variant={claireAI.isConnected ? "default" : "secondary"}>
                  {claireAI.isConnected ? "🟢 Backend Connected" : "🔴 Backend Disconnected"}
                </Badge>
                <Button
                  onClick={async () => {
                    try {
                      const response = await claireAI.healthCheck();
                      console.log('Health check response:', response);
                      if (response.status === 'success') {
                        console.log('✅ Backend connection successful!');
                      } else {
                        console.log('❌ Backend connection failed:', response.message);
                      }
                    } catch (error) {
                      console.error('Health check failed:', error);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Test Connection
                </Button>
              </div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-white/70 max-w-2xl mx-auto">
            Advanced model training, visualization, and analysis console for CLAIRE AI MMM platform
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="grid w-full grid-cols-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <TabsTrigger value="data-connection" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Data Connection
              </TabsTrigger>
              <TabsTrigger value="transformation" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Transformation
              </TabsTrigger>
              <TabsTrigger value="variables" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Variables
              </TabsTrigger>
              <TabsTrigger value="training" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Training
              </TabsTrigger>
              <TabsTrigger value="versioning" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Versioning
              </TabsTrigger>
              <TabsTrigger value="model-performance" className="flex items-center gap-2">
                <LineChart className="w-4 h-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="optimization" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Optimization
              </TabsTrigger>
              <TabsTrigger value="forecasting" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Forecasting
              </TabsTrigger>
            </TabsList>

            {/* Data Connection Tab */}
            <TabsContent value="data-connection" className="space-y-6">
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Data Source Connection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="dataSource">Data Source Type</Label>
                        <Select value={dataSource} onValueChange={setDataSource}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="csv">CSV File</SelectItem>
                            <SelectItem value="excel">Excel File</SelectItem>
                            <SelectItem value="database">Database</SelectItem>
                            <SelectItem value="api">API Endpoint</SelectItem>
                            <SelectItem value="cloud">Cloud Storage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="dataPath">Data Path / Connection String</Label>
                        <Input
                          id="dataPath"
                          value={dataPath}
                          onChange={(e) => setDataPath(e.target.value)}
                          placeholder="Enter file path or connection string"
                          className="bg-white/50 dark:bg-gray-800/50"
                        />
                      </div>

                      <Button 
                        onClick={handleDataConnection}
                        disabled={isProcessing}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Connect to Data Source
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Connection Status</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">Backend Status</span>
                          <Badge variant={claireAI.isConnected ? "default" : "secondary"}>
                            {claireAI.isConnected ? "Connected" : "Disconnected"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">Data Loaded</span>
                          <Badge variant="outline">Ready</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">Channels Detected</span>
                          <Badge variant="outline">6 Channels</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isProcessing && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Connection Progress</span>
                        <span>{Math.round((currentStep / 3) * 100)}%</span>
                      </div>
                      <Progress value={(currentStep / 3) * 100} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Transformation Tab */}
            <TabsContent value="transformation" className="space-y-6">
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Data Transformation & Validation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Transformation Options</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="cleanData" defaultChecked />
                          <Label htmlFor="cleanData">Clean missing values</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="detectOutliers" defaultChecked />
                          <Label htmlFor="detectOutliers">Detect outliers</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="applyAdstock" defaultChecked />
                          <Label htmlFor="applyAdstock">Apply adstock transformation</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="normalizeData" />
                          <Label htmlFor="normalizeData">Normalize data</Label>
                        </div>
                      </div>

                      <Button 
                        onClick={handleDataTransformation}
                        disabled={isProcessing}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Transforming...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Transform Data
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Validation Results</h3>
                      {validationResults ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <span className="text-sm">Data Quality</span>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Valid
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="font-medium">Total Rows</div>
                              <div>{validationResults.metrics?.total_rows || 0}</div>
                            </div>
                            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="font-medium">Total Columns</div>
                              <div>{validationResults.metrics?.total_columns || 0}</div>
                            </div>
                            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="font-medium">Missing Values</div>
                              <div>{validationResults.metrics?.missing_values || 0}</div>
                            </div>
                            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="font-medium">Outliers</div>
                              <div>{validationResults.metrics?.outliers_detected || 0}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center text-gray-500">
                          Run transformation to see results
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Variable Selection Tab */}
            <TabsContent value="variables" className="space-y-6">
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Variable Selection & Feature Engineering
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Detected Channels</h3>
                      <div className="space-y-2">
                        {['clm_call', 'phone_call', 'webinar', 'mass_email', 'email_1to1', 'comp1'].map((channel) => (
                          <div key={channel} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={channel}
                                checked={selectedChannels.includes(channel)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedChannels([...selectedChannels, channel]);
                                  } else {
                                    setSelectedChannels(selectedChannels.filter(c => c !== channel));
                                  }
                                }}
                              />
                              <Label htmlFor={channel} className="font-medium">{channel}</Label>
                            </div>
                            <Badge variant="outline">Auto-detected</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Feature Engineering</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="seasonality" defaultChecked />
                          <Label htmlFor="seasonality">Add seasonality features</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="trends" defaultChecked />
                          <Label htmlFor="trends">Add trend features</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="interactions" />
                          <Label htmlFor="interactions">Add interaction terms</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="lags" defaultChecked />
                          <Label htmlFor="lags">Add lag features</Label>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Selected Variables: {selectedChannels.length}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                          {selectedChannels.join(', ')}
                        </div>
                      </div>

                      <Button 
                        onClick={handleModelTraining}
                        disabled={isProcessing || selectedChannels.length === 0}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Training Model...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 mr-2" />
                            Train Model with Selected Variables
                          </>
                        )}
                      </Button>

                      {/* Training Progress */}
                      {isProcessing && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Training Progress</span>
                            <span>{Math.round((currentStep / 3) * 100)}%</span>
                          </div>
                          <Progress value={(currentStep / 3) * 100} />
                          <div className="text-xs text-gray-500">
                            {currentStep === 1 && "Preparing data..."}
                            {currentStep === 2 && "Fitting model..."}
                            {currentStep === 3 && "Validating results..."}
                          </div>
                        </div>
                      )}

                      {/* Training Success Message */}
                      {modelMetrics && !isProcessing && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="text-sm font-medium text-green-800 dark:text-green-200">
                            ✅ Model Trained Successfully
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-300 mt-1">
                            R²: {modelMetrics.r_squared ? Math.round(modelMetrics.r_squared * 1000) / 1000 : '0.950'}, MAPE: {modelMetrics.mape ? Math.round(modelMetrics.mape * 100) / 100 : '3.01'}%
                          </div>
                        </div>
                      )}

                      {/* Model Statistics Table */}
                      {modelStatistics && !isProcessing && (
                        <div className="mt-4 space-y-4">
                          <h4 className="font-semibold text-sm">Model Statistics & Coefficients</h4>
                          
                          {/* Summary Stats */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                              <div className="font-medium">R²</div>
                              <div>{modelStatistics.summary.r_squared}</div>
                            </div>
                            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                              <div className="font-medium">MAPE</div>
                              <div>{modelStatistics.summary.mape}%</div>
                            </div>
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                              <div className="font-medium">Variables</div>
                              <div>{modelStatistics.summary.variables_count}</div>
                            </div>
                            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                              <div className="font-medium">Significant</div>
                              <div>{modelStatistics.summary.significant_variables}</div>
                            </div>
                          </div>

                          {/* Coefficients Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg">
                              <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                  <th className="p-2 text-left">Variable</th>
                                  <th className="p-2 text-center">Coefficient</th>
                                  <th className="p-2 text-center">T-Stat</th>
                                  <th className="p-2 text-center">P-Value</th>
                                  <th className="p-2 text-center">Significance</th>
                                  <th className="p-2 text-center">Business Sense</th>
                                  <th className="p-2 text-left">Interpretation</th>
                                </tr>
                              </thead>
                              <tbody>
                                {modelStatistics.coefficients.map((coef: any, index: number) => (
                                  <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                                    <td className="p-2 font-medium">{coef.variable}</td>
                                    <td className="p-2 text-center">
                                      <span className={coef.coefficient > 0 ? 'text-green-600' : 'text-red-600'}>
                                        {coef.coefficient}
                                      </span>
                                    </td>
                                    <td className="p-2 text-center">{coef.t_stat}</td>
                                    <td className="p-2 text-center">{coef.p_value}</td>
                                    <td className="p-2 text-center font-bold">{coef.significance}</td>
                                    <td className="p-2 text-center">
                                      <span className={coef.business_sense.includes('✅') ? 'text-green-600' : 'text-yellow-600'}>
                                        {coef.business_sense}
                                      </span>
                                    </td>
                                    <td className="p-2 text-xs">{coef.interpretation}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Model Versioning Tab */}
            <TabsContent value="versioning" className="space-y-6">
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Model Versioning & Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Model Versions</h3>
                      <div className="space-y-2">
                        {[
                          { version: 'v1.2.0', date: '2025-08-30', status: 'active', performance: '95.2%' },
                          { version: 'v1.1.5', date: '2025-08-25', status: 'archived', performance: '94.8%' },
                          { version: 'v1.1.0', date: '2025-08-20', status: 'archived', performance: '93.1%' },
                          { version: 'v1.0.0', date: '2025-08-15', status: 'archived', performance: '91.5%' }
                        ].map((model) => (
                          <div key={model.version} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <div className="font-medium">{model.version}</div>
                              <div className="text-sm text-gray-500">{model.date}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                                {model.status}
                              </Badge>
                              <span className="text-sm font-medium">{model.performance}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Version Management</h3>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Export Current Model
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Upload className="w-4 h-4 mr-2" />
                          Import Model Version
                        </Button>
                        <Button variant="outline" className="w-full">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Rollback to Previous Version
                        </Button>
                      </div>

                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Current Version: v1.2.0
                        </div>
                        <div className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                          Last updated: 2025-08-30 19:24
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Model Performance Tab */}
            <TabsContent value="model-performance" className="space-y-6">
              {/* Model Performance Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'R²', value: '97.55%', color: 'bg-green-500' },
                  { label: 'Adj R²', value: '43.7%', color: 'bg-blue-500' },
                  { label: 'MAPE', value: '3.01%', color: 'bg-purple-500' },
                  { label: 'DW', value: '0.63', color: 'bg-orange-500' },
                  { label: 'AIC', value: '325.99', color: 'bg-red-500' },
                  { label: 'BIC', value: '353.08', color: 'bg-cyan-500' }
                ].map((metric, index) => (
                  <Card key={index} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                    <CardContent className="p-4 text-center">
                      <div className={`w-3 h-3 rounded-full ${metric.color} mx-auto mb-2`}></div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Actual vs Predicted Chart */}
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LineChart className="w-5 h-5" />
                      Sales Volume (Actual vs Predicted)
                    </div>
                    <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2022-2024">2022-2024</SelectItem>
                        <SelectItem value="2023-2024">2023-2024</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Comparison of actual sales performance against model predictions over time
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getFilteredPerformanceData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#6B7280"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="#6B7280"
                          fontSize={12}
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(17, 24, 39, 0.9)',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                          formatter={(value: any, name: string) => [
                            `${value.toLocaleString()}`,
                            name === 'actual' ? 'Actual Sales Volume' : 'Predicted Sales Volume'
                          ]}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="actual" 
                          stroke="#10B981" 
                          strokeWidth={3}
                          dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                          name="Actual Sales Volume"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="predicted" 
                          stroke="#3B82F6" 
                          strokeWidth={3}
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                          name="Predicted Sales Volume"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Model Contribution Breakdown */}
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Sales Volume Breakdown
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Breakdown of sales volume showing base sales and contribution from various promotional channels
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Total Channels', value: selectedChannels.length.toString(), color: 'text-blue-600' },
                      { label: 'Base Contribution', value: '60%', color: 'text-green-600' },
                      { label: 'Top Channel', value: selectedChannels[0]?.replace('_', ' ').toUpperCase() || 'CLM CALL', color: 'text-purple-600' },
                      { label: 'Growth Trend', value: '+47%', color: 'text-orange-600' }
                    ].map((stat, index) => (
                      <div key={index} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={modelPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#6B7280"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="#6B7280"
                          fontSize={12}
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(17, 24, 39, 0.9)',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="base" 
                          stackId="1"
                          stroke="#1E40AF" 
                          fill="#3B82F6" 
                          fillOpacity={0.8}
                          name="Base"
                        />
                        {selectedChannels.map((channel, index) => (
                          <Area 
                            key={channel}
                            type="monotone" 
                            dataKey={channel} 
                            stackId="1"
                            stroke={colors[index % colors.length]} 
                            fill={colors[index % colors.length]}
                            fillOpacity={0.8}
                            name={channel.replace('_', ' ').toUpperCase()}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Patterns Tab */}
            <TabsContent value="data-patterns" className="space-y-6">
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="w-5 h-5" />
                    Data Patterns Analysis
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Analysis of seasonal patterns, trends, and data distributions
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={patternData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#6B7280"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="#6B7280"
                          fontSize={12}
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(17, 24, 39, 0.9)',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="seasonal" 
                          stroke="#8B5CF6" 
                          strokeWidth={2}
                          name="Seasonal Pattern"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="trend" 
                          stroke="#F59E0B" 
                          strokeWidth={2}
                          name="Trend"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="actual" 
                          stroke="#EF4444" 
                          strokeWidth={3}
                          name="Actual Data"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Correlations Tab */}
            <TabsContent value="correlations" className="space-y-6">
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                                   <CardTitle className="flex items-center gap-2">
                   <BarChart className="w-5 h-5" />
                   Variable Correlations with Sales
                 </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Correlation analysis between marketing variables and sales performance
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <Label htmlFor="variableSelect">Select Variable</Label>
                    <Select value={selectedVariable} onValueChange={setSelectedVariable}>
                      <SelectTrigger className="w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clm_call">CLM Calls</SelectItem>
                        <SelectItem value="phone_call">Phone Calls</SelectItem>
                        <SelectItem value="webinar">Webinars</SelectItem>
                        <SelectItem value="mass_email">Mass Email</SelectItem>
                        <SelectItem value="email_1to1">1-to-1 Email</SelectItem>
                        <SelectItem value="comp1">Competitor Activity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Correlation Bar Chart */}
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={correlationData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="variable" 
                            stroke="#6B7280"
                            fontSize={12}
                          />
                          <YAxis 
                            stroke="#6B7280"
                            fontSize={12}
                            domain={[-1, 1]}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(17, 24, 39, 0.9)',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#F9FAFB'
                            }}
                          />
                                                     <Bar 
                             dataKey="correlation" 
                             fill="#3B82F6"
                             radius={[4, 4, 0, 0]}
                           />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Scatter Plot */}
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            type="number" 
                            dataKey="correlation" 
                            name="Correlation"
                            stroke="#6B7280"
                            domain={[-1, 1]}
                          />
                          <YAxis 
                            type="number" 
                            dataKey="p_value" 
                            name="P-Value"
                            stroke="#6B7280"
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(17, 24, 39, 0.9)',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#F9FAFB'
                            }}
                          />
                          <RechartsScatter 
                            data={correlationData} 
                            fill="#3B82F6"
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transformations Tab */}
            <TabsContent value="transformations" className="space-y-6">
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Variable Transformations
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Comparison of original variables vs transformed variables (log, adstock, etc.)
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={transformationData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#6B7280"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="#6B7280"
                          fontSize={12}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(17, 24, 39, 0.9)',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="original" 
                          stroke="#EF4444" 
                          strokeWidth={3}
                          dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                          name="Original Variable"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="transformed" 
                          stroke="#10B981" 
                          strokeWidth={3}
                          dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                          name="Transformed Variable"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Training Tab */}
            <TabsContent value="training" className="space-y-6">
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Model Training & Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="modelType">Model Type</Label>
                        <Select value={modelType} onValueChange={setModelType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DLT">DLT (Dynamic Linear Trend)</SelectItem>
                            <SelectItem value="KTR">KTR (Kernel Time Regression)</SelectItem>
                            <SelectItem value="LINEAR">Linear Regression</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="seasonality">Seasonality Periods</Label>
                        <Input
                          id="seasonality"
                          type="number"
                          value={seasonality}
                          onChange={(e) => setSeasonality(parseInt(e.target.value))}
                          min="1"
                          max="52"
                          className="bg-white/50 dark:bg-gray-800/50"
                        />
                      </div>

                      <Button 
                        onClick={handleModelTraining}
                        disabled={isProcessing}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Training Model...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Train Model
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Model Performance</h3>
                      {modelMetrics ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                              <div className="text-sm font-medium text-green-800 dark:text-green-200">R² Score</div>
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {(modelMetrics.r_squared * 100).toFixed(1)}%
                              </div>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                              <div className="text-sm font-medium text-blue-800 dark:text-blue-200">MAPE</div>
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {modelMetrics.mape.toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center text-gray-500">
                          Train model to see performance metrics
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Optimization Tab */}
            <TabsContent value="optimization" className="space-y-6">
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Optimization Workspace
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure constraints, objectives, and generate optimization scenarios
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Constraint Templates */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Constraint Templates</h3>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="totalBudget">Total Budget ($)</Label>
                          <Input
                            id="totalBudget"
                            type="number"
                            value={constraints.total_budget}
                            onChange={(e) => setConstraints(prev => ({ ...prev, total_budget: parseInt(e.target.value) }))}
                            className="bg-white/50 dark:bg-gray-800/50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="minSpend">Min Spend per Channel ($)</Label>
                          <Input
                            id="minSpend"
                            type="number"
                            value={constraints.min_spend_per_channel}
                            onChange={(e) => setConstraints(prev => ({ ...prev, min_spend_per_channel: parseInt(e.target.value) }))}
                            className="bg-white/50 dark:bg-gray-800/50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="maxSpend">Max Spend per Channel ($)</Label>
                          <Input
                            id="maxSpend"
                            type="number"
                            value={constraints.max_spend_per_channel}
                            onChange={(e) => setConstraints(prev => ({ ...prev, max_spend_per_channel: parseInt(e.target.value) }))}
                            className="bg-white/50 dark:bg-gray-800/50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="f2fCapacity">F2F Capacity (Calls)</Label>
                          <Input
                            id="f2fCapacity"
                            type="number"
                            value={constraints.f2f_capacity}
                            onChange={(e) => setConstraints(prev => ({ ...prev, f2f_capacity: parseInt(e.target.value) }))}
                            className="bg-white/50 dark:bg-gray-800/50"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="compliance"
                            checked={constraints.compliance_required}
                            onChange={(e) => setConstraints(prev => ({ ...prev, compliance_required: e.target.checked }))}
                          />
                          <Label htmlFor="compliance">Compliance Required</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Objective Presets</h3>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="objective">Optimization Objective</Label>
                          <Select value={objective} onValueChange={setObjective}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="profit">Maximize Profit</SelectItem>
                              <SelectItem value="sales">Maximize Sales</SelectItem>
                              <SelectItem value="target_lift">Target Lift @ Min Budget</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="robust"
                            checked={robustOptimization}
                            onChange={(e) => setRobustOptimization(e.target.checked)}
                          />
                          <Label htmlFor="robust">Robust Optimization (Posterior Sampling)</Label>
                        </div>

                        <div className="space-y-2">
                          <Button 
                            onClick={handleOptimizeBudget}
                            disabled={isProcessing}
                            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                          >
                            {isProcessing ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Optimizing...
                              </>
                            ) : (
                              <>
                                <Target className="w-4 h-4 mr-2" />
                                Run Optimization
                              </>
                            )}
                          </Button>
                          
                          <Button 
                            onClick={handleGenerateScenarios}
                            variant="outline"
                            className="w-full"
                          >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Generate Scenarios
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scenario Ledger */}
                  {scenarios.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold">Scenario Ledger</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {scenarios.map((scenario) => (
                          <Card 
                            key={scenario.id}
                            className={`cursor-pointer transition-all ${
                              selectedScenario === scenario.id 
                                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                            onClick={() => setSelectedScenario(scenario.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">{scenario.name}</span>
                                <Badge variant={selectedScenario === scenario.id ? "default" : "outline"}>
                                  {selectedScenario === scenario.id ? "Selected" : "Click to Select"}
                                </Badge>
                              </div>
                              <div className="text-2xl font-bold">
                                ${(scenario.projected_sales / 1000000).toFixed(1)}M
                              </div>
                              <div className="text-xs text-gray-500 mb-2">Projected Sales</div>
                              <div className="space-y-1">
                                <div className="text-xs">
                                  Spend: ${(scenario.total_spend / 1000).toFixed(0)}k
                                </div>
                                <div className="text-xs">
                                  SF ROI: {scenario.roi.sf_calls.toFixed(1)}x
                                </div>
                                <div className="text-xs">
                                  Digital ROI: {scenario.roi.digital.toFixed(1)}x
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Selected: {scenarios.find(s => s.id === selectedScenario)?.name || 'None'}
                        </div>
                        <Button 
                          onClick={handleSubmitForApproval}
                          disabled={!selectedScenario}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Submit for Approval
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Optimization Results */}
                  {optimizationData && (
                    <div className="space-y-4">
                      <h3 className="font-semibold">Optimization Results</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                          <CardContent className="p-4">
                            <div className="text-sm font-medium text-green-800 dark:text-green-200">
                              Expected Sales
                            </div>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              ${(optimizationData.expected_sales / 1000000).toFixed(1)}M
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                          <CardContent className="p-4">
                            <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              Budget Allocation
                            </div>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              ${(constraints.total_budget / 1000).toFixed(0)}k
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Forecasting Tab */}
            <TabsContent value="forecasting" className="space-y-6">
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Sales Forecasting & Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Scenario Comparison Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">$ Current</span>
                          <Badge variant="outline" className="text-xs">
                            ${(scenarios.find(s => s.id === 'base')?.total_spend || 700000) / 1000}k Spend
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          ${(scenarios.find(s => s.id === 'base')?.projected_sales || 21300000) / 1000000}M
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">Projected Sales</div>
                        <div className="mt-2 space-y-1">
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            SF Calls ROI: {scenarios.find(s => s.id === 'base')?.roi.sf_calls || 2.4}x
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            Digital ROI: {scenarios.find(s => s.id === 'base')?.roi.digital || 3.1}x
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">Optimistic</span>
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                            +{Math.round(((constraints.total_budget - (scenarios.find(s => s.id === 'base')?.total_spend || 700000)) / (scenarios.find(s => s.id === 'base')?.total_spend || 700000)) * 100)}% Spend
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                          ${(scenarios.find(s => s.id === 'optimized')?.projected_sales || 24500000) / 1000000}M
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">Projected Sales</div>
                        <div className="mt-2 space-y-1">
                          <div className="text-xs text-green-600 dark:text-green-400">
                            SF Calls ROI: {scenarios.find(s => s.id === 'optimized')?.roi.sf_calls || 2.6}x
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            Digital ROI: {scenarios.find(s => s.id === 'optimized')?.roi.digital || 3.4}x
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-red-700 dark:text-red-300">Pessimistic</span>
                          <Badge variant="outline" className="text-xs bg-red-100 text-red-800">
                            -{Math.round(((scenarios.find(s => s.id === 'base')?.total_spend || 700000) - (scenarios.find(s => s.id === 'conservative')?.total_spend || 630000)) / (scenarios.find(s => s.id === 'base')?.total_spend || 700000) * 100)}% Spend
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                          ${(scenarios.find(s => s.id === 'conservative')?.projected_sales || 19170000) / 1000000}M
                        </div>
                        <div className="text-xs text-red-600 dark:text-red-400">Projected Sales</div>
                        <div className="mt-2 space-y-1">
                          <div className="text-xs text-red-600 dark:text-red-400">
                            SF Calls ROI: {scenarios.find(s => s.id === 'conservative')?.roi.sf_calls || 2.1}x
                          </div>
                          <div className="text-xs text-red-600 dark:text-red-400">
                            Digital ROI: {scenarios.find(s => s.id === 'conservative')?.roi.digital || 2.8}x
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Forecast Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="forecastPeriods">Forecast Periods (Months)</Label>
                        <Input
                          id="forecastPeriods"
                          type="number"
                          value={forecastPeriods}
                          onChange={(e) => setForecastPeriods(parseInt(e.target.value))}
                          min="1"
                          max="24"
                          className="bg-white/50 dark:bg-gray-800/50"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="totalBudget">Total Budget ($)</Label>
                        <Input
                          id="totalBudget"
                          type="number"
                          placeholder="1000000"
                          className="bg-white/50 dark:bg-gray-800/50"
                        />
                      </div>

                      <Button 
                        onClick={handleForecast}
                        disabled={isProcessing}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Generating Forecast...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Generate Forecast
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Forecast Summary</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">Forecast Period</span>
                          <Badge variant="outline">{forecastPeriods} months</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">Expected Growth</span>
                          <Badge variant="default">+15.2%</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">Confidence Interval</span>
                          <Badge variant="outline">±5.3%</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Optimization Actions</h3>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full" onClick={handleOptimizeBudget}>
                          <Target className="w-4 h-4 mr-2" />
                          Optimize Budget Allocation
                        </Button>
                        <Button variant="outline" className="w-full" onClick={handleGenerateScenarios}>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Generate Scenarios
                        </Button>
                        <Button variant="outline" className="w-full" onClick={handleExportForecast}>
                          <Download className="w-4 h-4 mr-2" />
                          Export Forecast
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Sales Forecast Chart */}
                  <div className="mt-6">
                    <h3 className="font-semibold mb-4">Sales Forecast</h3>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={forecastData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="month" 
                            stroke="#6B7280"
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            stroke="#6B7280"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `${(value / 1000000).toFixed(2)}M`}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px'
                            }}
                            formatter={(value: any) => [`${(value / 1000000).toFixed(2)}M`, '']}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="actual" 
                            stroke="#8B5CF6" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                            name="Actual Sales"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="forecast_baseline" 
                            stroke="#10B981" 
                            strokeWidth={2}
                            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                            name="Forecast (Baseline)"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="forecast_optimistic" 
                            stroke="#3B82F6" 
                            strokeWidth={2}
                            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                            name="Forecast (Optimistic)"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="forecast_pessimistic" 
                            stroke="#EF4444" 
                            strokeWidth={2}
                            dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                            name="Forecast (Pessimistic)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Error Display */}
          {(claireAI.error || error) && (
            <Alert className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{claireAI.error || error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClaireAdminControl;
