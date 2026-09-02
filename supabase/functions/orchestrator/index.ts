// deno-lint-ignore-file
/**
 * CLAIRE AI — Agent Orchestrator (non-streaming, Milestone 2)
 *
 * Single entry point for both chat and voice modalities.
 * Responsibilities:
 *   1. Validate unified AgentRequest
 *   2. Resolve tenant (company_id) from JWT via RLS-safe Supabase client
 *   3. Assemble shared context: Pharma SM KB + Company Brain + model outputs + conversation history
 *   4. Route to chat pipeline (GPT-4o JSON) or voice pipeline (Whisper → GPT-4o → TTS)
 *   5. Write invocation log to agent_invocations (service role)
 *   6. Return unified AgentResponse
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-expect-error - Deno remote import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error - Deno remote import
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
// @ts-expect-error - Deno remote import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getPublishableKey, getSecretKey } from "../_shared/supabase-keys.ts";
import {
  fetchApprovedCompanyBrain,
  fetchPharmaSmMetricsMergedRows,
  formatBrainSystemMessage,
  getCompanyIdForUser,
  pharmaMergedRowsToCompactKb,
} from "../_shared/tenant-brain.ts";
import {
  buildPersonaPrompt,
  CHAT_SYSTEM_PROMPT,
  VOICE_SYSTEM_PROMPT,
} from "../_shared/prompts.ts";

declare const Deno: { env: { get: (key: string) => string | undefined } };

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = getPublishableKey();
const supabaseServiceRoleKey = getSecretKey();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---------------------------------------------------------------------------
// Types (mirrors src/types/agent-contract.ts for runtime use)
// ---------------------------------------------------------------------------

type AgentModality = "chat" | "voice";

interface AgentRequest {
  correlation_id: string;
  modality: AgentModality;
  // chat
  message?: string;
  kb?: unknown;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  // voice
  audioData?: string;
  audioFormat?: string;
  // shared
  persona?: string;
  chat_id?: string;
  brand_id?: string;
}

interface AgentResponse {
  correlation_id: string;
  response: string;
  transcript?: string;
  card?: unknown;
  report?: unknown;
  audio?: string;
  timestamp: string;
  error_message?: string;
  error_debug?: { source: string; message: string; [key: string]: unknown };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function errorResponse(correlationId: string, source: string, message: string, debug?: Record<string, unknown>): Response {
  const body: AgentResponse = {
    correlation_id: correlationId,
    response: "",
    timestamp: new Date().toISOString(),
    error_message: message,
    error_debug: { source, message, ...debug },
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonResponse(body: AgentResponse): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Context assembly (shared between chat and voice)
// ---------------------------------------------------------------------------

interface AssembledContext {
  kbEffective: unknown;
  companyBrainMessage: string | null;
  modelOutputsCompact: unknown[] | null;
  companyId: string | null;
  userId: string | null;
  personaResolved: string;
}

async function assembleContext(
  req: Request,
  reqBody: AgentRequest,
): Promise<AssembledContext> {
  let kbEffective: unknown = reqBody.kb ?? null;
  let companyBrainMessage: string | null = null;
  let modelOutputsCompact: unknown[] | null = null;
  let companyId: string | null = null;
  let userId: string | null = null;
  let personaResolved = reqBody.persona ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ Supabase not configured; skipping DB context");
    return { kbEffective, companyBrainMessage, modelOutputsCompact, companyId, userId, personaResolved };
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
    });

    // Resolve user
    const { data: authData } = await userClient.auth.getUser();
    userId = authData?.user?.id ?? null;

    if (userId) {
      // Resolve tenant
      companyId = await getCompanyIdForUser(userClient, userId);

      // Resolve persona from user role if not supplied
      if (!personaResolved && userId) {
        const { data: roleRow } = await userClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();
        personaResolved = (roleRow as { role?: string } | null)?.role ?? "";
      }

      // Pharma SM KB (overrides client-supplied kb)
      const mergedPharma = await fetchPharmaSmMetricsMergedRows(
        userClient,
        companyId,
        reqBody.brand_id ?? null,
      );
      if (mergedPharma.length > 0) {
        kbEffective = pharmaMergedRowsToCompactKb(mergedPharma);
        console.log(`📊 Pharma SM: ${mergedPharma.length} metrics`);
      }

      // Company Brain
      if (companyId) {
        const brainRows = await fetchApprovedCompanyBrain(
          userClient,
          companyId,
          reqBody.brand_id ?? null,
        );
        companyBrainMessage = formatBrainSystemMessage(brainRows) || null;
        if (companyBrainMessage) {
          console.log(`🧠 Company Brain: ${brainRows.length} entries`);
        }
      }

      // Model outputs (latest 10)
      const { data: outputs, error: outputsErr } = await userClient
        .from("mmm_model_outputs")
        .select("id, model_id, project_id, output_type, output_data, generated_at")
        .order("generated_at", { ascending: false })
        .limit(10);
      if (outputsErr) {
        console.warn("⚠️ model_outputs fetch failed:", outputsErr.message);
      } else if (outputs?.length) {
        modelOutputsCompact = outputs.map((o: any) => ({
          id: o.id,
          model_id: o.model_id,
          project_id: o.project_id,
          output_type: o.output_type,
          generated_at: o.generated_at,
          output_data: (() => {
            try {
              const od = o.output_data;
              if (od && typeof od === "object" && !Array.isArray(od)) {
                const keys = Object.keys(od).slice(0, 5);
                const trimmed: Record<string, unknown> = {};
                for (const k of keys) trimmed[k] = od[k];
                return trimmed;
              }
              return od;
            } catch (_) {
              return o.output_data;
            }
          })(),
        }));
        console.log(`✅ Model outputs: ${outputs.length} rows`);
      }
    }
  } catch (e: any) {
    console.warn("⚠️ Context assembly error:", e?.message ?? e);
  }

  return { kbEffective, companyBrainMessage, modelOutputsCompact, companyId, userId, personaResolved };
}

// ---------------------------------------------------------------------------
// Invocation logger
// ---------------------------------------------------------------------------

async function logInvocation(params: {
  correlationId: string;
  chatId?: string;
  userId: string | null;
  companyId: string | null;
  brandId?: string;
  modality: AgentModality;
  functionName: string;
  modelName?: string;
  persona?: string;
  status: "success" | "error" | "timeout";
  errorCode?: string;
  errorMessage?: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  requestRef?: Record<string, unknown>;
  responseRef?: Record<string, unknown>;
}): Promise<void> {
  if (!supabaseUrl || !supabaseServiceRoleKey || !params.userId) return;
  try {
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { error } = await serviceClient.from("agent_invocations").insert({
      correlation_id: params.correlationId,
      chat_id: params.chatId ?? null,
      user_id: params.userId,
      company_id: params.companyId ?? null,
      brand_id: params.brandId ?? null,
      modality: params.modality,
      function_name: params.functionName,
      model_name: params.modelName ?? null,
      persona: params.persona ?? null,
      status: params.status,
      error_code: params.errorCode ?? null,
      error_message: params.errorMessage ?? null,
      input_tokens: params.inputTokens ?? null,
      output_tokens: params.outputTokens ?? null,
      latency_ms: params.latencyMs ?? null,
      request_ref: params.requestRef ?? null,
      response_ref: params.responseRef ?? null,
    });
    if (error) console.warn("⚠️ Invocation log insert failed:", error.message);
    else console.log("📋 Invocation logged:", params.correlationId);
  } catch (e: any) {
    console.warn("⚠️ Invocation logging error:", e?.message ?? e);
  }
}

// ---------------------------------------------------------------------------
// Chat pipeline
// ---------------------------------------------------------------------------

async function runChatPipeline(
  req: Request,
  reqBody: AgentRequest,
  ctx: AssembledContext,
  startTime: number,
): Promise<AgentResponse> {
  const { kbEffective, companyBrainMessage, modelOutputsCompact, personaResolved } = ctx;

  if (!reqBody.message?.trim()) {
    return {
      correlation_id: reqBody.correlation_id,
      response: "",
      timestamp: new Date().toISOString(),
      error_message: "Message is required for chat modality",
      error_debug: { source: "validation", message: "Empty message" },
    };
  }

  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: CHAT_SYSTEM_PROMPT },
  ];

  const personaPrompt = buildPersonaPrompt(personaResolved);
  if (personaPrompt) messages.push({ role: "system", content: personaPrompt });

  if (modelOutputsCompact?.length) {
    messages.push({
      role: "system",
      content: "MODEL_OUTPUTS_DATASET (JSON). Use to ground insights and recommendations.\n" +
        JSON.stringify(modelOutputsCompact).slice(0, 8000),
    });
  }

  if (kbEffective) {
    messages.push({
      role: "system",
      content: "PHARMA_SM_DATASET (JSON). Authoritative source for values, ids, and chart data.\n" +
        JSON.stringify(kbEffective).slice(0, 8000),
    });
  }

  if (companyBrainMessage) {
    messages.push({ role: "system", content: companyBrainMessage });
  }

  if (Array.isArray(reqBody.history)) {
    for (const h of reqBody.history.slice(-5)) {
      messages.push({
        role: h.role === "assistant" ? "assistant" : "user",
        content: typeof h.content === "string" ? h.content.slice(0, 2000) : JSON.stringify(h.content).slice(0, 2000),
      });
    }
  }

  messages.push({ role: "user", content: reqBody.message });

  console.log("🤖 Chat: calling GPT-4o...");
  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${String(openAIApiKey).trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages,
      temperature: 0.7,
    }),
  });

  const latencyMs = Date.now() - startTime;

  if (!openaiRes.ok) {
    const errText = await openaiRes.text();
    console.error("❌ OpenAI error:", openaiRes.status, errText.slice(0, 500));

    await logInvocation({
      correlationId: reqBody.correlation_id,
      chatId: reqBody.chat_id,
      userId: ctx.userId,
      companyId: ctx.companyId,
      brandId: reqBody.brand_id,
      modality: "chat",
      functionName: "orchestrator/chat",
      modelName: "gpt-4o",
      persona: personaResolved,
      status: "error",
      errorCode: String(openaiRes.status),
      errorMessage: errText.slice(0, 500),
      latencyMs,
      requestRef: { message_length: reqBody.message.length },
    });

    return {
      correlation_id: reqBody.correlation_id,
      response: "",
      timestamp: new Date().toISOString(),
      error_message: "OpenAI API error",
      error_debug: { source: "openai", httpStatus: openaiRes.status, body: errText.slice(0, 500) },
    };
  }

  const openaiData = await openaiRes.json() as any;
  const content = openaiData.choices?.[0]?.message?.content ?? "";
  const usage = openaiData.usage ?? {};

  await logInvocation({
    correlationId: reqBody.correlation_id,
    chatId: reqBody.chat_id,
    userId: ctx.userId,
    companyId: ctx.companyId,
    brandId: reqBody.brand_id,
    modality: "chat",
    functionName: "orchestrator/chat",
    modelName: "gpt-4o",
    persona: personaResolved,
    status: "success",
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    latencyMs,
    requestRef: { message_length: reqBody.message.length, has_kb: !!kbEffective, has_brain: !!companyBrainMessage },
    responseRef: { response_length: content.length },
  });

  console.log("📤 Chat: response ready, length:", content.length);

  return {
    correlation_id: reqBody.correlation_id,
    response: content,
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Voice pipeline
// ---------------------------------------------------------------------------

async function runVoicePipeline(
  req: Request,
  reqBody: AgentRequest,
  ctx: AssembledContext,
  startTime: number,
): Promise<AgentResponse> {
  const { kbEffective, companyBrainMessage, personaResolved } = ctx;
  const authHeaderValue = `Bearer ${String(openAIApiKey).trim()}`;

  if (!reqBody.audioData) {
    return {
      correlation_id: reqBody.correlation_id,
      response: "",
      timestamp: new Date().toISOString(),
      error_message: "audioData is required for voice modality",
      error_debug: { source: "validation", message: "Missing audioData" },
    };
  }

  // Step 1: Decode base64 audio
  let binaryData: Uint8Array;
  try {
    const cleaned = reqBody.audioData.replace(/[^A-Za-z0-9+/=]/g, "");
    const estimatedSize = (cleaned.length * 3) / 4;
    if (estimatedSize > 10 * 1024 * 1024) throw new Error("Audio file too large (max 10MB)");
    const binaryString = atob(cleaned);
    binaryData = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      binaryData[i] = binaryString.charCodeAt(i);
    }
  } catch (e: any) {
    await logInvocation({
      correlationId: reqBody.correlation_id,
      userId: ctx.userId,
      companyId: ctx.companyId,
      modality: "voice",
      functionName: "orchestrator/voice",
      status: "error",
      errorCode: "AUDIO_DECODE",
      errorMessage: e.message,
      latencyMs: Date.now() - startTime,
    });
    return {
      correlation_id: reqBody.correlation_id,
      response: "",
      timestamp: new Date().toISOString(),
      error_message: "Invalid audio data",
      error_debug: { source: "audio-decode", message: e.message },
    };
  }

  const audioFormat = reqBody.audioFormat ?? "webm";
  const formatMap: Record<string, string> = { webm: "webm", wav: "wav", mp4: "m4a", mpeg: "mp3", m4a: "m4a", mp3: "mp3" };
  const fileExt = formatMap[audioFormat] ?? audioFormat;
  const audioBlob = new Blob([binaryData], { type: `audio/${audioFormat}` });

  // Step 2: Whisper transcription
  console.log("🎤 Voice: transcribing with Whisper...");
  const formData = new FormData();
  formData.append("file", audioBlob, `audio.${fileExt}`);
  formData.append("model", "whisper-1");
  formData.append("response_format", "json");
  formData.append("temperature", "0.0");
  formData.append("prompt", "Pharmaceutical analytics discussion: revenue, sales, prescriptions, ROI, F2F calls, digital video, virtual calls, marketing mix, market access.");

  const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: authHeaderValue },
    body: formData,
  });

  if (!whisperRes.ok) {
    const errText = await whisperRes.text();
    await logInvocation({
      correlationId: reqBody.correlation_id,
      userId: ctx.userId,
      companyId: ctx.companyId,
      modality: "voice",
      functionName: "orchestrator/voice",
      modelName: "whisper-1",
      status: "error",
      errorCode: String(whisperRes.status),
      errorMessage: errText.slice(0, 300),
      latencyMs: Date.now() - startTime,
    });
    return {
      correlation_id: reqBody.correlation_id,
      response: "",
      timestamp: new Date().toISOString(),
      error_message: "Whisper transcription failed",
      error_debug: { source: "whisper", httpStatus: whisperRes.status },
    };
  }

  const whisperData = await whisperRes.json() as any;
  const transcript = whisperData.text?.trim() ?? "";

  // Fallback TTS if transcript is empty
  if (!transcript || transcript.length < 2) {
    const fallbackText = "I couldn't understand your speech. Please speak clearly and check your microphone.";
    const ttsFallback = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: authHeaderValue, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "tts-1-hd", voice: "ash", input: fallbackText, response_format: "mp3" }),
    });
    let fallbackAudio = "";
    if (ttsFallback.ok) {
      const buf = await ttsFallback.arrayBuffer();
      fallbackAudio = base64Encode(new Uint8Array(buf));
    }
    await logInvocation({
      correlationId: reqBody.correlation_id,
      userId: ctx.userId,
      companyId: ctx.companyId,
      modality: "voice",
      functionName: "orchestrator/voice",
      modelName: "whisper-1",
      status: "error",
      errorCode: "EMPTY_TRANSCRIPT",
      errorMessage: "No speech detected",
      latencyMs: Date.now() - startTime,
    });
    return {
      correlation_id: reqBody.correlation_id,
      response: fallbackText,
      transcript: "",
      audio: fallbackAudio,
      timestamp: new Date().toISOString(),
    };
  }

  console.log("🎤 Transcript:", transcript);

  // Step 3: GPT-4o analysis
  const gptMessages: Array<{ role: string; content: string }> = [
    { role: "system", content: VOICE_SYSTEM_PROMPT },
  ];
  if (kbEffective) {
    gptMessages.push({
      role: "system",
      content: "PHARMA_SM_DATASET (JSON). Authoritative ids and values for metric cards and spoken numbers.\n" +
        JSON.stringify(kbEffective).slice(0, 12000),
    });
  }
  if (companyBrainMessage) {
    gptMessages.push({ role: "system", content: companyBrainMessage });
  }
  gptMessages.push({ role: "user", content: transcript });

  console.log("🤖 Voice: calling GPT-4o...");
  const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: authHeaderValue, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o", messages: gptMessages, temperature: 0.7, max_tokens: 1200 }),
  });

  if (!gptRes.ok) {
    const errText = await gptRes.text();
    await logInvocation({
      correlationId: reqBody.correlation_id,
      userId: ctx.userId,
      companyId: ctx.companyId,
      modality: "voice",
      functionName: "orchestrator/voice",
      modelName: "gpt-4o",
      status: "error",
      errorCode: String(gptRes.status),
      errorMessage: errText.slice(0, 300),
      latencyMs: Date.now() - startTime,
    });
    return {
      correlation_id: reqBody.correlation_id,
      response: "",
      transcript,
      timestamp: new Date().toISOString(),
      error_message: "GPT-4o analysis failed",
      error_debug: { source: "gpt4o", httpStatus: gptRes.status },
    };
  }

  const gptData = await gptRes.json() as any;
  const aiResponse = gptData.choices?.[0]?.message?.content ?? "";
  const gptUsage = gptData.usage ?? {};

  // Parse answer/card from voice response format
  const answerMatch = aiResponse.match(/answer:\s*(.*?)(?=card:|$)/s);
  const cardMatch = aiResponse.match(/card:\s*(.*?)$/s);
  const answerText = answerMatch ? answerMatch[1].trim() : aiResponse;
  const cardText = cardMatch ? cardMatch[1].trim() : "";
  let cardData: unknown = null;
  if (cardText) {
    try { cardData = JSON.parse(cardText); } catch (_) { /* ignore */ }
  }

  // Step 4: TTS
  console.log("🔊 Voice: generating TTS audio...");
  const ttsText = answerText.length > 4000 ? answerText.slice(0, 4000) + "..." : answerText;
  const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: authHeaderValue, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "tts-1-hd", voice: "ash", input: ttsText, response_format: "mp3" }),
  });

  if (!ttsRes.ok) {
    await logInvocation({
      correlationId: reqBody.correlation_id,
      userId: ctx.userId,
      companyId: ctx.companyId,
      modality: "voice",
      functionName: "orchestrator/voice",
      modelName: "tts-1-hd",
      status: "error",
      errorCode: String(ttsRes.status),
      errorMessage: "TTS generation failed",
      latencyMs: Date.now() - startTime,
    });
    return {
      correlation_id: reqBody.correlation_id,
      response: answerText,
      transcript,
      card: cardData,
      timestamp: new Date().toISOString(),
      error_message: "TTS audio generation failed",
      error_debug: { source: "tts", httpStatus: ttsRes.status },
    };
  }

  const audioBuffer = await ttsRes.arrayBuffer();
  const audioBase64 = base64Encode(new Uint8Array(audioBuffer));
  const latencyMs = Date.now() - startTime;

  await logInvocation({
    correlationId: reqBody.correlation_id,
    chatId: reqBody.chat_id,
    userId: ctx.userId,
    companyId: ctx.companyId,
    brandId: reqBody.brand_id,
    modality: "voice",
    functionName: "orchestrator/voice",
    modelName: "gpt-4o+whisper-1+tts-1-hd",
    persona: personaResolved,
    status: "success",
    inputTokens: gptUsage.prompt_tokens,
    outputTokens: gptUsage.completion_tokens,
    latencyMs,
    requestRef: { audio_size: binaryData.length, format: audioFormat },
    responseRef: { transcript_length: transcript.length, answer_length: answerText.length, has_card: !!cardData },
  });

  console.log("📤 Voice: response ready, audio length:", audioBase64.length);

  return {
    correlation_id: reqBody.correlation_id,
    response: answerText,
    transcript,
    card: cardData,
    audio: audioBase64,
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  console.log("=== Orchestrator called ===", req.method);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
  }

  const startTime = Date.now();
  let correlationId = "";

  try {
    if (!openAIApiKey) throw new Error("OPENAI_API_KEY not configured");

    // Parse request
    let reqBody: AgentRequest;
    try {
      const text = await req.text();
      reqBody = JSON.parse(text);
    } catch (e: any) {
      return errorResponse("unknown", "parse", "Invalid JSON body", { detail: e.message });
    }

    correlationId = reqBody.correlation_id ?? crypto.randomUUID();
    reqBody.correlation_id = correlationId;

    console.log("📨 correlation_id:", correlationId, "modality:", reqBody.modality);

    // Validate modality
    if (!reqBody.modality || !["chat", "voice"].includes(reqBody.modality)) {
      return errorResponse(correlationId, "validation", "modality must be 'chat' or 'voice'");
    }

    // Assemble shared context
    const ctx = await assembleContext(req, reqBody);

    // Route
    let result: AgentResponse;
    if (reqBody.modality === "chat") {
      result = await runChatPipeline(req, reqBody, ctx, startTime);
    } else {
      result = await runVoicePipeline(req, reqBody, ctx, startTime);
    }

    return jsonResponse(result);

  } catch (e: any) {
    console.error("❌ Orchestrator unhandled error:", e?.message ?? e);
    return errorResponse(correlationId || "unknown", "orchestrator", e?.message ?? "Unexpected error");
  }
});
