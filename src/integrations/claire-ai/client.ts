// CLAIRE AI API Client for Frontend Integration
import { supabase } from '../supabase/client';

export interface CLAIREAIResponse<T = any> {
  status: 'success' | 'error' | 'warning' | 'info' | 'healthy';
  message: string;
  data?: T;
  error?: string;
}

export interface ModelTrainingRequest {
  project_id: number;
  data_path?: string;
  model_config?: {
    model_type: 'DLT' | 'KTR' | 'LINEAR';
    seasonality?: number;
    regressor_col?: string[];
  };
}

export interface ModelTrainingResponse {
  model_metrics: {
    r_squared: number;
    mape: number;
    coefficients: Record<string, number>;
  };
  detected_channels: Record<string, string[]>;
  elasticity_norms: Record<string, [number, number]>;
}

export interface OptimizationRequest {
  project_id: number;
  scenario_type: 'tmb' | 'tsv';
  total_budget?: number;
  target_sales?: number;
  channel_constraints?: Record<string, [number, number]>;
}

export interface OptimizationResponse {
  scenario_type: string;
  total_budget?: number;
  allocation: Record<string, number>;
  roi: Record<string, number>;
  response_curves: Record<string, [number, number][]>;
  expected_sales: number;
}

export interface InsightsRequest {
  project_id: number;
  language?: 'en' | 'ru';
}

export interface InsightsResponse {
  model_performance: {
    r_squared: number;
    mape: number;
  };
  top_performing_channels: [string, number][];
  recommendations: string[];
  language: string;
}

export interface AgentPromptRequest {
  project_id: number;
  prompt: string;
}

export interface ProjectStatusResponse {
  project_id: number;
  status: 'idle' | 'training' | 'optimizing' | 'error';
  last_updated: string;
  model_metrics?: ModelTrainingResponse['model_metrics'];
}

class CLAIREAIClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_CLAIRE_AI_API_URL || 'http://localhost:8000';
    this.apiKey = import.meta.env.VITE_CLAIRE_AI_API_KEY || '';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<CLAIREAIResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('CLAIRE AI API Error:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: error instanceof Error ? error.message : undefined,
      };
    }
  }

  // Health check
  async healthCheck(): Promise<CLAIREAIResponse> {
    return this.request('/health');
  }

  // Model training
  async trainModel(request: ModelTrainingRequest): Promise<CLAIREAIResponse<ModelTrainingResponse>> {
    return this.request('/model/train', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Budget optimization
  async optimizeBudget(request: OptimizationRequest): Promise<CLAIREAIResponse<OptimizationResponse>> {
    return this.request('/optimize/scenario', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Generate insights
  async generateInsights(request: InsightsRequest): Promise<CLAIREAIResponse<InsightsResponse>> {
    return this.request('/insights/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Process natural language prompt
  async processPrompt(request: AgentPromptRequest): Promise<CLAIREAIResponse> {
    return this.request('/agent/process', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Get project status
  async getProjectStatus(projectId: number): Promise<CLAIREAIResponse<ProjectStatusResponse>> {
    return this.request(`/projects/${projectId}/status`);
  }

  // Upload data file
  async uploadData(projectId: number, file: File): Promise<CLAIREAIResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', projectId.toString());

      const response = await fetch(`${this.baseUrl}/data/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Data upload error:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  // Get available data sources
  async getDataSources(projectId: number): Promise<CLAIREAIResponse<string[]>> {
    return this.request(`/data/sources/${projectId}`);
  }

  // Connect to data source
  async connectDataSource(projectId: number, sourcePath: string): Promise<CLAIREAIResponse> {
    return this.request('/data/connect', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        source_path: sourcePath,
      }),
    });
  }
}

// Export singleton instance
export const claireAIClient = new CLAIREAIClient();
