// CLAIRE AI Backend Integration Hook for Existing UI Components
import { useState, useCallback, useEffect } from 'react';
import {
  claireAIClient,
  type CLAIREAIResponse,
  type JobStatus,
} from '../integrations/claire-ai/client';

export interface UseClaireAIBackendState {
  isLoading: boolean;
  error: string | null;
  data: any | null;
  isConnected: boolean;
  /** Latest status of an in-flight training job, or null when none is running. */
  jobStatus: JobStatus | null;
}

export interface UseClaireAIBackend {
  // State
  isLoading: boolean;
  error: string | null;
  data: any | null;
  isConnected: boolean;
  jobStatus: JobStatus | null;
  
  // Backend Actions
  healthCheck: () => Promise<CLAIREAIResponse>;
  /** Enqueues training and resolves when the job finishes (minutes). */
  trainModel: (
    projectId?: string | number,
    opts?: { onProgress?: (status: JobStatus) => void; signal?: AbortSignal }
  ) => Promise<CLAIREAIResponse>;
  optimizeBudget: (projectId: string | number, budget: number, scenarioType?: 'tmb' | 'tsv') => Promise<CLAIREAIResponse>;
  optimizeSalesForce: (projectId: string | number, config: any) => Promise<CLAIREAIResponse>;
  generateInsights: (projectId: string | number, language?: 'en' | 'ru') => Promise<CLAIREAIResponse>;
  processPrompt: (projectId: string | number, prompt: string) => Promise<CLAIREAIResponse>;
  
  // Data Integration
  getMetricsData: () => any;
  getChartData: () => any;
  getOptimizationResults: () => any;
  getInsightsData: () => any;
  
  // Utilities
  clearError: () => void;
  clearData: () => void;
  refreshData: () => void;
}

// Static data fallbacks for when backend is not available
const STATIC_METRICS_DATA = {
  revenue: {
    value: '8.7%',
    change: '+40.3%',
    changeType: 'positive' as const,
    comparison: 'vs. last quarter'
  },
  prescriptions: {
    value: '34.2%',
    change: '+8.6%',
    changeType: 'positive' as const,
    comparison: 'vs. last quarter'
  },
  sampleRatio: {
    value: '1.8x',
    change: '+20.0%',
    changeType: 'positive' as const,
    comparison: 'vs. last quarter'
  },
  channels: {
    total: 10,
    baseContribution: '78%',
    topChannel: 'F2F calls',
    growthTrend: '+47%'
  }
};

const STATIC_CHART_DATA = [
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
  { date: '10/23', actual: 66273, predicted: 68760.02 }
];

export function useClaireAIBackend(projectId: string | number = "550e8400-e29b-41d4-a716-446655440000"): UseClaireAIBackend {
  const [state, setState] = useState<UseClaireAIBackendState>({
    isLoading: false,
    error: null,
    data: null,
    isConnected: false,
    jobStatus: null,
  });

  const setJobStatus = useCallback((jobStatus: JobStatus | null) => {
    setState(prev => ({ ...prev, jobStatus }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const setData = useCallback((data: any) => {
    setState(prev => ({ ...prev, data, isLoading: false, error: null }));
  }, []);

  const setConnected = useCallback((connected: boolean) => {
    setState(prev => ({ ...prev, isConnected: connected }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearData = useCallback(() => {
    setState(prev => ({ ...prev, data: null }));
  }, []);

  // Check backend connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await claireAIClient.healthCheck();
        const isConnected = response.status === 'success' || response.status === 'healthy';
        setConnected(isConnected);
        console.log('Backend connection status:', isConnected ? 'Connected' : 'Disconnected');
      } catch (error) {
        setConnected(false);
        console.warn('CLAIRE AI backend not available, using static data');
      }
    };
    
    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [setConnected]);

  // Backend Actions
  const healthCheck = useCallback(async (): Promise<CLAIREAIResponse> => {
    setLoading(true);
    try {
      const response = await claireAIClient.healthCheck();
      if (response.status === 'success' || response.status === 'healthy') {
        setConnected(true);
        setData(response);
      } else {
        setConnected(false);
        setError(response.message);
      }
      return response;
    } catch (error) {
      setConnected(false);
      const errorMessage = error instanceof Error ? error.message : 'Health check failed';
      setError(errorMessage);
      return {
        status: 'error',
        message: errorMessage,
      };
    }
  }, [setLoading, setData, setError, setConnected]);

  /**
   * Train a model and resolve only when the job finishes.
   *
   * /model/train is asynchronous — it answers 'accepted' with a job_id, not a
   * trained model. This enqueues, polls to completion, then loads the metrics
   * so callers still receive `data.model_metrics`.
   *
   * `projectId` defaults to the project this hook was created with; it must be
   * a brand id (the API rejects non-UUIDs with 422).
   */
  const trainModel = useCallback(async (
    overrideProjectId?: string | number,
    opts: { onProgress?: (status: JobStatus) => void; signal?: AbortSignal } = {}
  ): Promise<CLAIREAIResponse> => {
    if (!state.isConnected) {
      return {
        status: 'warning',
        message: 'Backend not connected, using static data',
        data: { model_metrics: { r_squared: 0.85, mape: 0.12 } }
      };
    }

    const targetProject = String(overrideProjectId ?? projectId);

    setLoading(true);
    setJobStatus(null);
    try {
      const result = await claireAIClient.trainAndWait(
        { project_id: targetProject },
        {
          signal: opts.signal,
          onProgress: (status) => {
            setJobStatus(status);
            opts.onProgress?.(status);
          },
        }
      );

      if (result.status !== 'success') {
        setError(result.message);
        return result;
      }

      // The job only reports that training finished; metrics live in the
      // model outputs, which /insights/generate reads.
      const insights = await claireAIClient.generateInsights({
        project_id: targetProject,
      });

      const merged = {
        job: result.data,
        model_metrics: insights.data?.insights?.model_metrics
          ?? insights.data?.model_metrics,
        roi: insights.data?.insights?.roi_summary,
      };
      setData(merged);

      return { status: 'success', message: 'Model trained', data: merged };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Model training failed';
      setError(errorMessage);
      return {
        status: 'error',
        message: errorMessage,
      };
    }
  }, [setLoading, setData, setError, setJobStatus, state.isConnected, projectId]);

  const optimizeBudget = useCallback(async (
    projectId: string | number, 
    budget: number, 
    scenarioType: 'tmb' | 'tsv' = 'tmb'
  ): Promise<CLAIREAIResponse> => {
    if (!state.isConnected) {
      return {
        status: 'warning',
        message: 'Backend not connected, using static optimization data',
        data: {
          allocation: {
            'non_clm_cal': budget * 0.35,
            'clm_call': budget * 0.25,
            'webinar': budget * 0.15,
            'mass_email': budget * 0.10,
            'email_1to1': budget * 0.10,
            'phone_call': budget * 0.05
          },
          expected_sales: budget * 2.5
        }
      };
    }

    setLoading(true);
    try {
      const response = await claireAIClient.optimizeBudget({
        project_id: projectId,
        scenario_type: scenarioType,
        total_budget: budget,
      });
      
      if (response.status === 'success') {
        setData(response.data);
      } else {
        setError(response.message);
      }
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Budget optimization failed';
      setError(errorMessage);
      return {
        status: 'error',
        message: errorMessage,
      };
    }
  }, [setLoading, setData, setError, state.isConnected]);

  const optimizeSalesForce = useCallback(async (
    projectId: string | number, 
    config: any
  ): Promise<CLAIREAIResponse> => {
    if (!state.isConnected) {
      return {
        status: 'warning',
        message: 'Backend not connected, using static sales force data',
        data: {
          results: {
            optimal_sales_force: 52,
            projected_revenue: 10400000,
            overall_roi: 2.8,
            model_confidence: 0.92,
            monthly_forecast: [0.8, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35]
          }
        }
      };
    }

    setLoading(true);
    try {
      const response = await claireAIClient.optimizeSalesForce({
        project_id: projectId,
        ...config
      });
      
      if (response.status === 'success') {
        setData(response.data);
      } else {
        setError(response.message);
      }
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sales force optimization failed';
      setError(errorMessage);
      return {
        status: 'error',
        message: errorMessage,
      };
    }
  }, [setLoading, setData, setError, state.isConnected]);

  const generateInsights = useCallback(async (
    projectId: string | number, 
    language: 'en' | 'ru' = 'en'
  ): Promise<CLAIREAIResponse> => {
    if (!state.isConnected) {
      return {
        status: 'warning',
        message: 'Backend not connected, using static insights',
        data: {
          recommendations: [
            'Focus investment on non-CLM calls (highest ROI channel)',
            'Consider reducing spend on phone calls (lower efficiency)',
            'Monitor webinar performance for potential optimization'
          ],
          top_performing_channels: [
            ['non_clm_cal', 2.8],
            ['clm_call', 2.1],
            ['webinar', 1.9]
          ]
        }
      };
    }

    setLoading(true);
    try {
      const response = await claireAIClient.generateInsights({
        project_id: projectId,
        language,
      });
      
      if (response.status === 'success') {
        setData(response.data);
      } else {
        setError(response.message);
      }
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Insights generation failed';
      setError(errorMessage);
      return {
        status: 'error',
        message: errorMessage,
      };
    }
  }, [setLoading, setData, setError, state.isConnected]);

  const processPrompt = useCallback(async (
    projectId: string | number, 
    prompt: string
  ): Promise<CLAIREAIResponse> => {
    if (!state.isConnected) {
      return {
        status: 'info',
        message: 'Backend not connected. Available commands: train model, optimize budget, generate insights',
      };
    }

    setLoading(true);
    try {
      const response = await claireAIClient.processPrompt({
        project_id: projectId,
        prompt,
      });
      
      if (response.status === 'success') {
        setData(response.data);
      } else {
        setError(response.message);
      }
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Prompt processing failed';
      setError(errorMessage);
      return {
        status: 'error',
        message: errorMessage,
      };
    }
  }, [setLoading, setData, setError, state.isConnected]);

  // Data Integration Methods
  const getMetricsData = useCallback(() => {
    if (state.data?.model_metrics) {
      // Use real backend data
      return {
        revenue: {
          value: `${(state.data.model_metrics.r_squared * 100).toFixed(1)}%`,
          change: state.data.model_metrics.r_squared > 0.8 ? '+40.3%' : '+20.1%',
          changeType: 'positive' as const,
          comparison: 'model accuracy'
        },
        prescriptions: {
          value: `${(state.data.model_metrics.mape * 100).toFixed(1)}%`,
          change: state.data.model_metrics.mape < 0.15 ? '+8.6%' : '-2.1%',
          changeType: state.data.model_metrics.mape < 0.15 ? 'positive' as const : 'negative' as const,
          comparison: 'prediction error'
        },
        sampleRatio: {
          value: `${Object.keys(state.data.detected_channels || {}).length}x`,
          change: '+20.0%',
          changeType: 'positive' as const,
          comparison: 'channels detected'
        },
        channels: {
          total: Object.keys(state.data.detected_channels || {}).length,
          baseContribution: '78%',
          topChannel: Object.keys(state.data.detected_channels || {})[0] || 'F2F calls',
          growthTrend: '+47%'
        }
      };
    }
    
    // Fallback to static data
    return STATIC_METRICS_DATA;
  }, [state.data]);

  const getChartData = useCallback(() => {
    // For now, return static chart data
    // In the future, this could be enhanced with real model predictions
    return STATIC_CHART_DATA;
  }, []);

  const getOptimizationResults = useCallback(() => {
    if (state.data?.allocation) {
      return {
        allocation: state.data.allocation,
        expected_sales: state.data.expected_sales,
        roi: state.data.roi
      };
    }
    
    // Fallback to static optimization data
    return {
      allocation: {
        'non_clm_cal': 350000,
        'clm_call': 250000,
        'webinar': 150000,
        'mass_email': 100000,
        'email_1to1': 100000,
        'phone_call': 50000
      },
      expected_sales: 2500000,
      roi: {
        'non_clm_cal': 2.8,
        'clm_call': 2.1,
        'webinar': 1.9,
        'mass_email': 1.5,
        'email_1to1': 1.8,
        'phone_call': 1.2
      }
    };
  }, [state.data]);

  const getInsightsData = useCallback(() => {
    if (state.data?.recommendations) {
      return {
        recommendations: state.data.recommendations,
        top_performing_channels: state.data.top_performing_channels,
        model_performance: state.data.model_performance
      };
    }
    
    // Fallback to static insights
    return {
      recommendations: [
        'Focus investment on non-CLM calls (highest ROI channel)',
        'Consider reducing spend on phone calls (lower efficiency)',
        'Monitor webinar performance for potential optimization'
      ],
      top_performing_channels: [
        ['non_clm_cal', 2.8],
        ['clm_call', 2.1],
        ['webinar', 1.9]
      ],
      model_performance: {
        r_squared: 0.85,
        mape: 0.12
      }
    };
  }, [state.data]);

  const refreshData = useCallback(() => {
    clearData();
    clearError();
    healthCheck();
  }, [clearData, clearError, healthCheck]);

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    data: state.data,
    isConnected: state.isConnected,
    jobStatus: state.jobStatus,
    
    // Backend Actions
    healthCheck,
    trainModel,
    optimizeBudget,
    optimizeSalesForce,
    generateInsights,
    processPrompt,
    
    // Data Integration
    getMetricsData,
    getChartData,
    getOptimizationResults,
    getInsightsData,
    
    // Utilities
    clearError,
    clearData,
    refreshData,
  };
}
