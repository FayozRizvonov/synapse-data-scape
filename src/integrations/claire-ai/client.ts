// CLAIRE AI API Client for Frontend Integration
import { supabase } from '../supabase/client';

export interface CLAIREAIResponse<T = any> {
  status: 'success' | 'error' | 'warning' | 'info' | 'healthy';
  message: string;
  data?: T;
  error?: string;
}

export interface ModelTrainingRequest {
  /** Must be a brand id (brands.id). The API rejects non-UUIDs with 422. */
  project_id: string;
}

/**
 * POST /model/train is asynchronous: it returns a job id immediately and the
 * PyMC5 pipeline runs on a Celery worker. Poll /jobs/{job_id}/status — see
 * `waitForJob`.
 */
export interface JobEnqueuedResponse {
  job_id: string;
  project_id: string;
  poll_url: string;
}

export type JobState = 'queued' | 'running' | 'done' | 'failed';

export interface JobStatus {
  job_id: string;
  project_id: string;
  status: JobState;
  created_at?: string;
  started_at?: string;
  finished_at?: string;
  stability_level?: number | null;
  model_id?: string | null;
  error_message?: string | null;
}

export interface ModelTrainingResponse {
  model_metrics: {
    r_squared: number;
    mape: number;
    rmse?: number;
  };
  /** Funnel groups from info.csv `subtype`, e.g. { upper_funnel: [...] }. */
  detected_channels?: Record<string, string[]>;
}

export interface OptimizationRequest {
  project_id: string | number;
  scenario_type: 'tmb' | 'tsv';
  total_budget?: number;
  target_sales?: number;
  channel_constraints?: Record<string, [number, number]>;
}

export interface SalesForceOptimizationRequest {
  project_id: string | number;
  target_revenue: number;
  current_sales_force: number;
  external_factors?: {
    new_competitor?: boolean;
    recession?: boolean;
  };
  cost_per_rep?: number;
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
  project_id: string | number;
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
  project_id: string | number;
  prompt: string;
}

export interface ProjectStatusResponse {
  project_id: string | number;
  status: 'idle' | 'training' | 'optimizing' | 'error';
  last_updated: string;
  model_metrics?: ModelTrainingResponse['model_metrics'];
}

class CLAIREAIClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_CLAIRE_AI_API_URL || 'http://localhost:8000';
  }

  /**
   * Bearer token for the API: the signed-in user's Supabase access token.
   *
   * This previously sent VITE_CLAIRE_AI_API_KEY — a build-time constant baked
   * into the bundle and shared by every user, which identifies nobody. The API
   * now verifies this token and scopes the request to the user's company.
   */
  private async authHeader(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<CLAIREAIResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(await this.authHeader()),
        ...options.headers,
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        // FastAPI puts the useful part in `detail` — "project_id must be a
        // UUID", "Project ... not found", "Missing bearer token". Surfacing
        // only "HTTP 422" would throw that away. Validation errors arrive as
        // a list of {loc, msg} objects.
        let detail = response.statusText;
        try {
          const body = await response.json();
          if (typeof body?.detail === 'string') {
            detail = body.detail;
          } else if (Array.isArray(body?.detail)) {
            detail = body.detail
              .map((d: any) => `${(d.loc ?? []).slice(1).join('.') || 'request'}: ${d.msg}`)
              .join('; ');
          }
        } catch {
          /* not JSON — keep statusText */
        }
        throw new Error(`HTTP ${response.status}: ${detail}`);
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

  /**
   * Enqueue a training job. Returns a job id immediately — it does NOT wait for
   * the model. Use `waitForJob`, or `trainAndWait` for both steps.
   */
  async trainModel(request: ModelTrainingRequest): Promise<CLAIREAIResponse<JobEnqueuedResponse>> {
    return this.request('/model/train', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getJobStatus(jobId: string): Promise<CLAIREAIResponse<JobStatus>> {
    return this.request(`/jobs/${encodeURIComponent(jobId)}/status`);
  }

  /**
   * Poll a job until it reaches a terminal state.
   *
   * Training is minutes-long (roughly 1-4 on the sample dataset, longer on real
   * client data), so this deliberately has a generous timeout and reports
   * progress rather than blocking silently.
   */
  async waitForJob(
    jobId: string,
    opts: {
      intervalMs?: number;
      timeoutMs?: number;
      signal?: AbortSignal;
      onProgress?: (status: JobStatus) => void;
    } = {}
  ): Promise<CLAIREAIResponse<JobStatus>> {
    const intervalMs = opts.intervalMs ?? 3000;
    // The worker's own hard limit is 70 min; give up a little before that.
    const timeoutMs = opts.timeoutMs ?? 30 * 60 * 1000;
    const startedAt = Date.now();

    for (;;) {
      if (opts.signal?.aborted) {
        return { status: 'error', message: 'Polling cancelled', data: undefined };
      }

      const res = await this.getJobStatus(jobId);
      const job = res.data;

      if (!job) {
        // A transient read failure should not abandon a job that may still be
        // running; keep polling until the timeout.
        if (Date.now() - startedAt > timeoutMs) {
          return { status: 'error', message: res.message || 'Job status unavailable' };
        }
      } else {
        opts.onProgress?.(job);

        if (job.status === 'done') {
          return { status: 'success', message: `Job ${jobId} completed`, data: job };
        }
        if (job.status === 'failed') {
          return {
            status: 'error',
            message: job.error_message || `Job ${jobId} failed`,
            data: job,
          };
        }
      }

      if (Date.now() - startedAt > timeoutMs) {
        return {
          status: 'error',
          message: `Job ${jobId} did not finish within ${Math.round(timeoutMs / 60000)} minutes`,
          data: job,
        };
      }

      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  /** Enqueue training and resolve only once the job finishes. */
  async trainAndWait(
    request: ModelTrainingRequest,
    opts: Parameters<CLAIREAIClient['waitForJob']>[1] = {}
  ): Promise<CLAIREAIResponse<JobStatus>> {
    const enqueued = await this.trainModel(request);
    const jobId = enqueued.data?.job_id;

    // The API answers 'accepted', not 'success', when a job is queued.
    if (!jobId) {
      return {
        status: 'error',
        message: enqueued.message || 'Training was not started',
        error: enqueued.error,
      };
    }
    return this.waitForJob(jobId, opts);
  }

  // Budget optimization
  async optimizeBudget(request: OptimizationRequest): Promise<CLAIREAIResponse<OptimizationResponse>> {
    return this.request('/optimize/scenario', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Sales force optimization
  async optimizeSalesForce(request: SalesForceOptimizationRequest): Promise<CLAIREAIResponse<any>> {
    return this.request('/optimize/sales-force', {
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
  async getProjectStatus(projectId: string | number): Promise<CLAIREAIResponse<ProjectStatusResponse>> {
    return this.request(`/projects/${projectId}/status`);
  }

  // Upload data file
  async uploadData(projectId: string | number, file: File): Promise<CLAIREAIResponse> {
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
  async getDataSources(projectId: string | number): Promise<CLAIREAIResponse<string[]>> {
    return this.request(`/data/sources/${projectId}`);
  }

  // Connect to data source
  async connectDataSource(projectId: string | number, sourcePath: string): Promise<CLAIREAIResponse> {
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
