/**
 * Unified API contracts for Edge Functions (ai-assistant, voice-assistant, orchestrator).
 *
 * Design rules:
 * - Server resolves tenant `company_id` from the JWT via `company_members` — do not
 *   treat client-supplied company identifiers as authoritative for authorization.
 * - `correlation_id` is generated client-side (uuid v4) so a request can be traced
 *   across frontend logs, Edge Function logs, and `agent_invocations` rows.
 */

// ---------------------------------------------------------------------------
// Shared context
// ---------------------------------------------------------------------------

/** Optional filters passed from the client (must still satisfy RLS when fetching). */
export type AgentClientContext = {
  /** When set, Company Brain rows may be filtered to this brand (uuid). */
  brand_id?: string;
};

/** Domains stored in `company_brain_entries.domain`. */
export type CompanyBrainDomain =
  | 'brand'
  | 'therapeutic_area'
  | 'market'
  | 'strategy'
  | 'pricing'
  | 'other';

export type CompanyBrainStatus = 'draft' | 'approved';

// ---------------------------------------------------------------------------
// Unified request envelope
// ---------------------------------------------------------------------------

/** Modality determines which pipeline the orchestrator routes to. */
export type AgentModality = 'chat' | 'voice';

/**
 * Unified request sent to the agent orchestrator (and transitionally to
 * ai-assistant / voice-assistant Edge Functions).
 */
export type AgentRequest = {
  /** Client-generated UUID for end-to-end tracing. */
  correlation_id: string;

  /** Routing: which pipeline to use. */
  modality: AgentModality;

  // --- Chat fields (required when modality === 'chat') ---
  /** The user's text message. */
  message?: string;
  /** Compact knowledge-base payload (pharma SM metrics). */
  kb?: unknown;
  /** Recent conversation turns for context (max 8). */
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;

  // --- Voice fields (required when modality === 'voice') ---
  /** Base64-encoded audio blob. */
  audioData?: string;
  /** Audio format of the blob (e.g. 'webm', 'mp4'). */
  audioFormat?: string;

  // --- Shared optional fields ---
  /** User's role / persona (e.g. 'gm', 'marketing_ops'). Resolved server-side from JWT when absent. */
  persona?: string;
  /** Active chat / conversation ID for persistence. */
  chat_id?: string;
  /** Optional brand filter for Company Brain rows. */
  brand_id?: string;
};

// ---------------------------------------------------------------------------
// Unified response envelope
// ---------------------------------------------------------------------------

/** Structured metric card optionally returned alongside a text response. */
export type AgentMetricCard = {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  description?: string;
  [key: string]: unknown;
};

/**
 * Unified response returned by the agent orchestrator (and transitionally by
 * ai-assistant / voice-assistant Edge Functions).
 */
export type AgentResponse = {
  /** Echoed from the request for client-side correlation. */
  correlation_id: string;

  /** Text answer (always present on success). */
  response: string;

  /** For voice: the Whisper transcript of what the user said. */
  transcript?: string;

  /** Optional structured metric card to render in the UI. */
  card?: AgentMetricCard;

  /** Optional report sections for long-form responses. */
  report?: unknown;

  /** For voice: base64-encoded MP3 audio of the spoken response. */
  audio?: string;

  /** ISO timestamp of when the response was generated. */
  timestamp: string;

  // --- Error shape (present when the call partially or fully failed) ---
  error_message?: string;
  error_debug?: {
    source: string;
    message: string;
    [key: string]: unknown;
  };
};

// ---------------------------------------------------------------------------
// Invocation log shape (mirrors agent_invocations table for client-side use)
// ---------------------------------------------------------------------------

export type AgentInvocationMeta = {
  correlation_id: string;
  modality: AgentModality;
  function_name: string;
  model_name?: string;
  latency_ms?: number;
  input_tokens?: number;
  output_tokens?: number;
  status: 'success' | 'error' | 'timeout';
  error_code?: string;
};
