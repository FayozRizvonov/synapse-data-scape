// deno-lint-ignore-file
/**
 * CLAIRE AI — Streaming Agent Orchestrator (Milestone 5)
 *
 * Delivers two latency wins over the non-streaming orchestrator:
 *
 * CHAT  → Streams GPT-4o tokens via SSE.
 *         Time-to-first-word drops from ~5 s → ~0.5 s.
 *
 * VOICE → Three-phase SSE stream:
 *   1. Whisper transcription (blocking, ~2 s) → emits `transcript` event immediately
 *   2. GPT-4o analysis streaming → emits `token` events so response text appears in-flight
 *   3. TTS bytes streamed back as `audio_chunk` events → client plays when fully assembled
 *   Perceived latency: user sees transcript + text response while audio is still en-route.
 *
 * SSE event protocol:
 *   data: {"type":"transcript","transcript":"..."}           // voice only
 *   data: {"type":"token","delta":"..."}                     // chat + voice
 *   data: {"type":"audio_chunk","chunk":"<b64>","seq":N}     // voice only
 *   data: {"type":"done","correlation_id":"...","full":"<json_string>"}
 *   data: [DONE]
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-expect-error
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
// @ts-expect-error
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const sseHeaders = {
  ...corsHeaders,
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  "Connection": "keep-alive",
  "X-Accel-Buffering": "no",
};

// ---------------------------------------------------------------------------
// SSE helpers
// ---------------------------------------------------------------------------

function sseEvent(payload: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

function sseDone(): Uint8Array {
  return new TextEncoder().encode("data: [DONE]\n\n");
}

// ---------------------------------------------------------------------------
// Context assembly (same as non-streaming orchestrator)
// ---------------------------------------------------------------------------

interface AssembledContext {
  kbEffective: unknown;
  companyBrainMessage: string | null;
  modelOutputsCompact: unknown[] | null;
  companyId: string | null;
  userId: string | null;
  personaResolved: string;
}

async function assembleContext(req: Request, brand_id?: string, persona?: string, kb?: unknown): Promise<AssembledContext> {
  let kbEffective: unknown = kb ?? null;
  let companyBrainMessage: string | null = null;
  let modelOutputsCompact: unknown[] | null = null;
  let companyId: string | null = null;
  let userId: string | null = null;
  let personaResolved = persona ?? "";

  if (!supabaseUrl || !supabaseAnonKey) return { kbEffective, companyBrainMessage, modelOutputsCompact, companyId, userId, personaResolved };

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
    });

    const { data: authData } = await userClient.auth.getUser();
    userId = authData?.user?.id ?? null;

    if (userId) {
      companyId = await getCompanyIdForUser(userClient, userId);

      if (!personaResolved) {
        const { data: roleRow } = await userClient.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
        personaResolved = (roleRow as { role?: string } | null)?.role ?? "";
      }

      const mergedPharma = await fetchPharmaSmMetricsMergedRows(userClient, companyId, brand_id ?? null);
      if (mergedPharma.length > 0) {
        kbEffective = pharmaMergedRowsToCompactKb(mergedPharma);
      }

      if (companyId) {
        const brainRows = await fetchApprovedCompanyBrain(userClient, companyId, brand_id ?? null);
        companyBrainMessage = formatBrainSystemMessage(brainRows) || null;
      }

      const { data: outputs } = await userClient
        .from("mmm_model_outputs")
        .select("id, model_id, project_id, output_type, output_data, generated_at")
        .order("generated_at", { ascending: false })
        .limit(10);

      if (outputs?.length) {
        modelOutputsCompact = outputs.map((o: any) => ({
          id: o.id, model_id: o.model_id, project_id: o.project_id,
          output_type: o.output_type, generated_at: o.generated_at,
          output_data: (() => {
            try {
              const od = o.output_data;
              if (od && typeof od === "object" && !Array.isArray(od)) {
                const keys = Object.keys(od).slice(0, 5);
                const t: Record<string, unknown> = {};
                for (const k of keys) t[k] = od[k];
                return t;
              }
              return od;
            } catch (_) { return o.output_data; }
          })(),
        }));
      }
    }
  } catch (e: any) {
    console.warn("⚠️ Context assembly error:", e?.message);
  }

  return { kbEffective, companyBrainMessage, modelOutputsCompact, companyId, userId, personaResolved };
}

// ---------------------------------------------------------------------------
// Invocation logger
// ---------------------------------------------------------------------------

async function logInvocation(params: {
  correlationId: string; chatId?: string; userId: string | null; companyId: string | null;
  brandId?: string; modality: string; functionName: string; modelName?: string; persona?: string;
  status: "success" | "error" | "timeout"; errorCode?: string; errorMessage?: string;
  inputTokens?: number; outputTokens?: number; latencyMs?: number; ttftMs?: number;
  requestRef?: Record<string, unknown>; responseRef?: Record<string, unknown>;
}): Promise<void> {
  if (!supabaseUrl || !supabaseServiceRoleKey || !params.userId) return;
  try {
    const svc = createClient(supabaseUrl, supabaseServiceRoleKey);
    await svc.from("agent_invocations").insert({
      correlation_id: params.correlationId, chat_id: params.chatId ?? null,
      user_id: params.userId, company_id: params.companyId ?? null, brand_id: params.brandId ?? null,
      modality: params.modality, function_name: params.functionName, model_name: params.modelName ?? null,
      persona: params.persona ?? null, status: params.status,
      error_code: params.errorCode ?? null, error_message: params.errorMessage ?? null,
      input_tokens: params.inputTokens ?? null, output_tokens: params.outputTokens ?? null,
      latency_ms: params.latencyMs ?? null, ttft_ms: params.ttftMs ?? null,
      request_ref: params.requestRef ?? null, response_ref: params.responseRef ?? null,
    });
  } catch (e: any) {
    console.warn("⚠️ Invocation log error:", e?.message);
  }
}

// ---------------------------------------------------------------------------
// Chat streaming pipeline
// ---------------------------------------------------------------------------

async function streamChat(
  req: Request,
  body: any,
  ctx: AssembledContext,
  controller: ReadableStreamDefaultController,
  startTime: number,
): Promise<void> {
  const { kbEffective, companyBrainMessage, modelOutputsCompact, personaResolved } = ctx;
  const correlationId: string = body.correlation_id;
  const message: string = body.message ?? "";

  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: CHAT_SYSTEM_PROMPT },
  ];
  const personaPrompt = buildPersonaPrompt(personaResolved);
  if (personaPrompt) messages.push({ role: "system", content: personaPrompt });
  if (modelOutputsCompact?.length) {
    messages.push({ role: "system", content: "MODEL_OUTPUTS_DATASET (JSON).\n" + JSON.stringify(modelOutputsCompact).slice(0, 8000) });
  }
  if (kbEffective) {
    messages.push({ role: "system", content: "PHARMA_SM_DATASET (JSON).\n" + JSON.stringify(kbEffective).slice(0, 8000) });
  }
  if (companyBrainMessage) messages.push({ role: "system", content: companyBrainMessage });
  if (Array.isArray(body.history)) {
    for (const h of (body.history as any[]).slice(-5)) {
      messages.push({ role: h.role === "assistant" ? "assistant" : "user", content: String(h.content).slice(0, 2000) });
    }
  }
  messages.push({ role: "user", content: message });

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${String(openAIApiKey).trim()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o", messages, temperature: 0.7, stream: true }),
  });

  if (!openaiRes.ok) {
    const errText = await openaiRes.text();
    controller.enqueue(sseEvent({ type: "error", message: "GPT-4o error", code: openaiRes.status }));
    controller.enqueue(sseDone());
    controller.close();
    await logInvocation({ correlationId, chatId: body.chat_id, userId: ctx.userId, companyId: ctx.companyId, modality: "chat", functionName: "orchestrator-stream/chat", modelName: "gpt-4o", persona: personaResolved, status: "error", errorCode: String(openaiRes.status), errorMessage: errText.slice(0, 300), latencyMs: Date.now() - startTime });
    return;
  }

  // Stream tokens
  let fullContent = "";
  let ttftMs: number | undefined;
  let inputTokens: number | undefined;
  let outputTokens: number | undefined;

  const reader = openaiRes.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") break;

        let chunk: any;
        try { chunk = JSON.parse(raw); } catch (_) { continue; }

        const delta = chunk.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          if (!ttftMs) ttftMs = Date.now() - startTime;
          fullContent += delta;
          controller.enqueue(sseEvent({ type: "token", delta }));
        }

        // Usage may appear in the last chunk
        if (chunk.usage) {
          inputTokens = chunk.usage.prompt_tokens;
          outputTokens = chunk.usage.completion_tokens;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  const latencyMs = Date.now() - startTime;
  controller.enqueue(sseEvent({ type: "done", correlation_id: correlationId, full: fullContent }));
  controller.enqueue(sseDone());
  controller.close();

  await logInvocation({ correlationId, chatId: body.chat_id, userId: ctx.userId, companyId: ctx.companyId, brandId: body.brand_id, modality: "chat", functionName: "orchestrator-stream/chat", modelName: "gpt-4o", persona: personaResolved, status: "success", inputTokens, outputTokens, latencyMs, ttftMs, requestRef: { message_length: message.length }, responseRef: { response_length: fullContent.length } });
}

// ---------------------------------------------------------------------------
// Voice streaming pipeline
// ---------------------------------------------------------------------------

async function streamVoice(
  req: Request,
  body: any,
  ctx: AssembledContext,
  controller: ReadableStreamDefaultController,
  startTime: number,
): Promise<void> {
  const correlationId: string = body.correlation_id;
  const authHeaderValue = `Bearer ${String(openAIApiKey).trim()}`;

  // Decode audio
  let binaryData: Uint8Array;
  try {
    const cleaned = (body.audioData as string).replace(/[^A-Za-z0-9+/=]/g, "");
    const estimatedSize = (cleaned.length * 3) / 4;
    if (estimatedSize > 10 * 1024 * 1024) throw new Error("Audio too large");
    const s = atob(cleaned);
    binaryData = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) binaryData[i] = s.charCodeAt(i);
  } catch (e: any) {
    controller.enqueue(sseEvent({ type: "error", message: "Audio decode failed" }));
    controller.enqueue(sseDone());
    controller.close();
    return;
  }

  const audioFormat = body.audioFormat ?? "webm";
  const fmtMap: Record<string, string> = { webm: "webm", wav: "wav", mp4: "m4a", mpeg: "mp3", m4a: "m4a", mp3: "mp3" };
  const audioBlob = new Blob([binaryData], { type: `audio/${audioFormat}` });

  // Phase 1: Whisper
  const formData = new FormData();
  formData.append("file", audioBlob, `audio.${fmtMap[audioFormat] ?? audioFormat}`);
  formData.append("model", "whisper-1");
  formData.append("response_format", "json");
  formData.append("temperature", "0.0");
  formData.append("prompt", "Pharmaceutical analytics: revenue, sales, ROI, prescriptions, marketing mix, F2F calls.");

  const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: authHeaderValue },
    body: formData,
  });

  if (!whisperRes.ok) {
    controller.enqueue(sseEvent({ type: "error", message: "Whisper failed", code: whisperRes.status }));
    controller.enqueue(sseDone());
    controller.close();
    return;
  }

  const whisperData = await whisperRes.json() as any;
  const transcript: string = whisperData.text?.trim() ?? "";

  // Emit transcript immediately — first visible result for the user
  const ttftMs = Date.now() - startTime;
  controller.enqueue(sseEvent({ type: "transcript", transcript, ttft_ms: ttftMs }));

  // Fallback if no speech
  if (!transcript || transcript.length < 2) {
    const fallback = "I couldn't understand your speech. Please speak clearly and check your microphone.";
    controller.enqueue(sseEvent({ type: "token", delta: fallback }));
    // Still generate TTS for fallback
    const ttsFallback = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: authHeaderValue, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "tts-1-hd", voice: "ash", input: fallback, response_format: "mp3" }),
    });
    if (ttsFallback.ok) {
      const buf = await ttsFallback.arrayBuffer();
      controller.enqueue(sseEvent({ type: "audio_chunk", chunk: base64Encode(new Uint8Array(buf)), seq: 0 }));
    }
    controller.enqueue(sseEvent({ type: "done", correlation_id: correlationId, full: fallback }));
    controller.enqueue(sseDone());
    controller.close();
    return;
  }

  // Phase 2: GPT-4o analysis (streaming tokens)
  const { kbEffective, companyBrainMessage, personaResolved } = ctx;
  const gptMessages: Array<{ role: string; content: string }> = [
    { role: "system", content: VOICE_SYSTEM_PROMPT },
  ];
  if (kbEffective) {
    gptMessages.push({ role: "system", content: "PHARMA_SM_DATASET (JSON).\n" + JSON.stringify(kbEffective).slice(0, 12000) });
  }
  if (companyBrainMessage) gptMessages.push({ role: "system", content: companyBrainMessage });
  gptMessages.push({ role: "user", content: transcript });

  const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: authHeaderValue, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o", messages: gptMessages, temperature: 0.7, max_tokens: 1200, stream: true }),
  });

  if (!gptRes.ok) {
    controller.enqueue(sseEvent({ type: "error", message: "GPT-4o failed", code: gptRes.status }));
    controller.enqueue(sseDone());
    controller.close();
    return;
  }

  // Stream GPT tokens
  let fullAnswer = "";
  let inputTokens: number | undefined;
  let outputTokens: number | undefined;
  const gptReader = gptRes.body!.getReader();
  const gptDecoder = new TextDecoder();
  let gptBuffer = "";

  try {
    while (true) {
      const { done, value } = await gptReader.read();
      if (done) break;
      gptBuffer += gptDecoder.decode(value, { stream: true });
      const lines = gptBuffer.split("\n");
      gptBuffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") break;
        let chunk: any;
        try { chunk = JSON.parse(raw); } catch (_) { continue; }
        const delta = chunk.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          fullAnswer += delta;
          controller.enqueue(sseEvent({ type: "token", delta }));
        }
        if (chunk.usage) {
          inputTokens = chunk.usage.prompt_tokens;
          outputTokens = chunk.usage.completion_tokens;
        }
      }
    }
  } finally {
    gptReader.releaseLock();
  }

  // Parse answer text from voice format (answer: ... card: ...)
  const answerMatch = fullAnswer.match(/answer:\s*(.*?)(?=card:|$)/s);
  const cardMatch = fullAnswer.match(/card:\s*(.*?)$/s);
  const answerText = answerMatch ? answerMatch[1].trim() : fullAnswer;
  const cardText = cardMatch ? cardMatch[1].trim() : "";
  let cardData: unknown = null;
  if (cardText) { try { cardData = JSON.parse(cardText); } catch (_) { } }

  // Phase 3: TTS — stream audio chunks back
  const ttsText = answerText.length > 4000 ? answerText.slice(0, 4000) + "..." : answerText;
  const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: authHeaderValue, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "tts-1-hd", voice: "ash", input: ttsText, response_format: "mp3" }),
  });

  if (!ttsRes.ok) {
    // Return text even if TTS fails
    controller.enqueue(sseEvent({ type: "done", correlation_id: correlationId, full: answerText, card: cardData }));
    controller.enqueue(sseDone());
    controller.close();
    return;
  }

  // Stream TTS bytes in chunks (~8KB each)
  const ttsReader = ttsRes.body!.getReader();
  const CHUNK_SIZE = 8192;
  let buffer = new Uint8Array(0);
  let seq = 0;

  try {
    while (true) {
      const { done, value } = await ttsReader.read();
      if (done) {
        // Flush remaining buffer
        if (buffer.length > 0) {
          controller.enqueue(sseEvent({ type: "audio_chunk", chunk: base64Encode(buffer), seq: seq++ }));
        }
        break;
      }
      // Append new bytes to buffer
      const merged = new Uint8Array(buffer.length + value.length);
      merged.set(buffer);
      merged.set(value, buffer.length);
      buffer = merged;

      // Emit full chunks
      while (buffer.length >= CHUNK_SIZE) {
        const chunk = buffer.slice(0, CHUNK_SIZE);
        buffer = buffer.slice(CHUNK_SIZE);
        controller.enqueue(sseEvent({ type: "audio_chunk", chunk: base64Encode(chunk), seq: seq++ }));
      }
    }
  } finally {
    ttsReader.releaseLock();
  }

  const latencyMs = Date.now() - startTime;
  controller.enqueue(sseEvent({ type: "done", correlation_id: correlationId, full: answerText, card: cardData }));
  controller.enqueue(sseDone());
  controller.close();

  await logInvocation({ correlationId, chatId: body.chat_id, userId: ctx.userId, companyId: ctx.companyId, brandId: body.brand_id, modality: "voice", functionName: "orchestrator-stream/voice", modelName: "gpt-4o+whisper-1+tts-1-hd", persona: personaResolved, status: "success", inputTokens, outputTokens, latencyMs, ttftMs, requestRef: { audio_size: binaryData.length, format: audioFormat }, responseRef: { transcript_length: transcript.length, answer_length: answerText.length, audio_chunks: seq } });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders, status: 200 });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  if (!openAIApiKey) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), { status: 500, headers: corsHeaders });
  }

  let body: any;
  try {
    body = await req.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
  }

  const correlationId = body.correlation_id ?? crypto.randomUUID();
  body.correlation_id = correlationId;
  const modality: string = body.modality ?? "chat";

  if (!["chat", "voice"].includes(modality)) {
    return new Response(JSON.stringify({ error: "modality must be 'chat' or 'voice'" }), { status: 400, headers: corsHeaders });
  }

  const startTime = Date.now();

  // Clone request headers for async context assembly (body already consumed)
  const reqForContext = new Request(req.url, { headers: req.headers, method: "GET" });
  const ctx = await assembleContext(reqForContext, body.brand_id, body.persona, body.kb);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (modality === "chat") {
          await streamChat(req, body, ctx, controller, startTime);
        } else {
          await streamVoice(req, body, ctx, controller, startTime);
        }
      } catch (e: any) {
        console.error("❌ Stream error:", e?.message);
        try {
          controller.enqueue(sseEvent({ type: "error", message: e?.message ?? "Unexpected error" }));
          controller.enqueue(sseDone());
          controller.close();
        } catch (_) { /* already closed */ }
      }
    },
  });

  return new Response(stream, { headers: sseHeaders });
});
