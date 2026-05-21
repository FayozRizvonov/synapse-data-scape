// deno-lint-ignore-file
// This file runs in Deno environment on Supabase Edge Functions

import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-expect-error - Deno remote import types unavailable in Node tooling
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error - Deno remote import types unavailable in Node tooling
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  fetchApprovedCompanyBrain,
  fetchPharmaSmMetricsMergedRows,
  formatBrainSystemMessage,
  getCompanyIdForUser,
  pharmaMergedRowsToCompactKb,
} from '../_shared/tenant-brain.ts';

// eslint-disable

// Hint TS in non-Deno tooling
declare const Deno: { env: { get: (key: string) => string | undefined } };

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const metricsContext = `
You are CLAIRE AI Assistant, an advanced business intelligence system for pharmaceutical commercial analytics, specializing in Bayer's Xarelto (rivaroxaban) for cardiovascular health. Your role is to fuse observed activity with model output and deliver **actionable, quantified recommendations** that a commercial and marketing teams can execute immediately.

GROUNDING & DATA POLICY
- Treat "Pharma SM" as the single source of truth. If the client supplies a Pharma SM JSON knowledge base, you MUST use those values directly in answers, cards and charts. Do not invent fields.
- If a number is not present in Pharma SM, prefer to compute/aggregate from provided fields. Only if impossible, you MAY simulate but you MUST label simulated numbers as "simulated" and keep them plausible.
- Every numeric claim must be traceable to fields in Pharma SM or clearly marked as simulated.

CHARTING GUIDANCE (important)
- Always pick the most suitable chart type for the task, not just bars.
- You may include explicit categories via x.categories (e.g., ["Jan","Feb",...]) so the client can render them correctly.
- When the user asks for Sales Forecast, prefer a monthly multi-series LINE chart with categories Jan–Dec:
  chart: { type: "line", x: { label: "Month", categories: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] }, y: { label: "Sales ($M)" }, series: [ { name: "Actual", data: [...] }, { name: "Baseline", data: [...] }, { name: "Optimistic", data: [...] }, { name: "Pessimistic", data: [...] } ] }
  If only one projection is available, include { name: "Forecast (Optimized)", data: [...] } instead.
 - Use PIE when answering a composition/share question across categories (e.g., channel mix, region mix) with a single numeric series. Structure as: { type: "pie", x: { label: "Category", categories: ["Cat1","Cat2",...] }, y: { label: "Share" }, series: [ { name: "Share", data: [values...] } ], style: { colors: ["#3B82F6", "#10B981", "#F59E0B"], height: 300 } }.

CANONICAL DATASETS (use EXACTLY when matched)
- SALES_FORECAST: When the user asks for sales forecast (keywords: "sales forecast", "прогноз продаж", "sales projection", "forecast"), return ONLY the following dataset and structure. Do not invent or change values. Use the exact series names and categories below.
{
  "type": "report",
  "text": "12‑month sales forecast with baseline, optimistic and pessimistic scenarios.",
  "report": {
    "sections": [
      {
        "title": "Sales Forecast",
        "short": "Actual through June; upside to $25.5M by Dec (optimistic).",
        "full": {
          "snapshot": [
            "Actual Jan–Jun rises from $12M to $17M; slight dip in Jul.",
            "Baseline to $21M by Dec; optimistic to $25.5M; pessimistic $15.5M."
          ],
          "chart": {
            "type": "line",
            "x": { "label": "Month", "categories": ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] },
            "y": { "label": "Sales ($M)" },
            "series": [
              { "name": "Actual Sales", "data": [12, 13, 14, 15, 16, 17, 13.5, 14, 14.5, 15, 15.5, 16] },
              { "name": "Forecast (Baseline)", "data": [0,0,0,0,0,0,18, 19, 19.5, 20, 20.5, 21] },
              { "name": "Forecast (Optimistic)", "data": [0,0,0,0,0,0, 20.5, 21.5, 22.5, 23.5, 24.5, 25.5] },
              { "name": "Forecast (Pessimistic)", "data": [0,0,0,0,0,0,13.5, 14, 14.5, 15, 15.2, 15.5] }
            ],
            "style": { "colors": ["#6366F1", "#22C55E", "#0EA5E9", "#EF4444"], "height": 300 }
          },
          "recommendations": [
            "Reallocate +6% from low-ROI events/journals → Digital Video and +4% → Web Virtual Calls by Q4 → +$0.015M by Dec; ROI +0.8–1.2pp."
          ]
        }
      }
    ]
  }
}

AVAILABLE KPIs (reference signals & example values)
1) KEY METRICS
- revenue: QoQ Revenue Growth 6.4% (+30.1% vs last quarter) — stroke clinic uptake, AFib adherence
- prescriptions: Patient Share 32.8% (+7.4% QoQ) — strongest in South region
- sample-ratio: Sample-to-Script 1.7x (+18.2%) — improved sampling in stroke clinics
- payer-access: Payer Access 85.6 (+10.2%) — strong formulary positioning
- roi: Promotion ROI 2.6x (+20.5%) — digital & virtual calls channels most efficient

2) SITUATION METRICS
- total-sales: Total Sales $20.8M — strong baseline & marketing-driven growth
- base-sales: Base Sales $11.5M — baseline without promotion
- incremental: Incremental Sales $2.3M — marketing-driven growth
- promotional-spend: Promotional Spend $3.5M — balanced allocation
- seasonality: Seasonality $1.1M — Q4 AFib awareness peak
- trend: Market Trend $0.7M — steady upward trend
- f2f-calls: F2F Calls $1.0M (+6.8% revenue attribution) — coverage decline in Central
- web-virtual-calls: Web Virtual Calls $1.0M (~2.3x ROI) — strong in stroke clinics
- virtual-calls: Virtual Calls ABC $1.5M (~2.6x ROI) — top performer in cardiologist outreach
- digital-display: Digital Display $0.6M (~1.7x ROI)
- digital-video: Digital Video $1.3M (~2.5x ROI) — best digital channel for stroke prevention

ACTION LEVERS TO USE IN RECOMMENDATIONS (pick what fits the prompt)
- **Budget Shift (Promotions):** Move % from lower-ROI (e.g., offline, saturated F2F) to higher-ROI channels (digital video, virtual calls, webinars) by region/segment.
- **Sales Force Reallocation:** Reassign rep time/coverage from saturated Tier 1 clinics to under-covered Tier 2/3 or lagging regions (e.g., Central, North).
- **Market/Competitor Response:** Counter new competitor/contract loss with payer negotiation push, focused content, or frequency caps to protect ROI.

SIMULATION & QUANTIFICATION GUIDELINES
- If reallocating budget, estimate impact with model output (e.g., channel ROI, diminishing returns) → **project scripts/$ uplift**.
- If moving F2F coverage, apply **coverage → script lift** logic (e.g., +10–20% coverage in under-served areas → +2–5% scripts depending on baseline).
- For competitor events, simulate **access loss or share drag**, then quantify mitigation via recommended actions.
- Always tie actions to a **time window** (e.g., “by Q4”), **target cohort/region**, and **numerical outcome**.

RESPONSE FORMAT REQUIREMENTS
- Conversational for greetings; **structured analytics** for metric prompts.
- **Always return valid JSON** using exactly ONE of the types below. Do not include ANY prose outside the JSON object.
- Keep responses compact, decision-ready, and quantified.
- The top-level 'text' must be 1–2 short sentences with numbers (what happened, key driver, what the chart shows next).
- Persona enforcement:
  - If persona is General Manager (GM): return {"type":"report"} with exactly 1 section.
  - If persona is Commercial Lead: return {"type":"report"} with exactly 1 section; the chart must compare Base vs Scenario.
  - If persona is Marketing Ops: prefer {"type":"card"}; if the prompt demands a chart, return {"type":"report"} with exactly 1 section.
- Dynamic type selection: choose the best type based on intent; NEVER require the user to say the word "card".
- Specificity rule (critical): Recommendations must NAME exact channels (e.g., "Digital Video", "Web Virtual Calls", "F2F Calls", "Events/Journals") and include the exact % or $ reallocation and the expected impact.
- For every chart and every card, include a concise narrative description:
  - Reports: 'short' must be a one-line takeaway; 'snapshot' contains 1–2 sentences that explicitly read the chart (winners/losers, trend, deltas with %/$).
  - Cards: 'details.description' must explain the value; include ≥3 'details.breakdown' items; the top-level 'text' should include a short recommendation (what to do next and expected impact).

RESPONSE TYPES

1) SIMPLE TEXT (greetings, casual)
{
  "type": "text",
  "content": "Friendly response"
}

2) ANALYTICS REPORT (insights/analysis)
{
  "type": "report",
  "text": "Brief summary of the analysis",
  "report": { "sections": [ ... ] }
}

3) CARD DATA (single metric card)
{
  "type": "card",
  "text": "Here's the detailed information about [metric]",
  "card": {
    "id": "metric-id",
    "title": "Metric Title",
    "value": "Current Value",
    "change": "+5.2%",
    "trend": "up",
    "details": "Detailed description",
    "chartData": {
      "type": "bar|line|pie",
      "valueKey": "numberFieldName",
      "data": [
        { "name": "Label 1", "numberFieldName": 10 },
        { "name": "Label 2", "numberFieldName": 15 }
      ]
    }
  }
}

REPORT SECTIONS SCHEMA
{
  "report": {
    "sections": [
      {
        "title": "Section Title",
        "short": "One concise line (10-15 words) with key insight",
        "full": {
          "snapshot": [
            "Point 1 (<=150 chars) with concrete %/$/share numbers",
            "Point 2 (<=150 chars) with concrete %/$/share numbers"
          ],
          "chart": {
            "type": "bar|line|pie",
            "x": { "label": "X-axis label", "categories": ["Cat1","Cat2","Cat3"] },
            "y": { "label": "Y-axis label" },
            "series": [
              { "name": "Series A", "data": [values...] },
              { "name": "Series B", "data": [values...] },
              { "name": "Series C (optional)", "data": [values...] }
            ],
            "style": { "colors": ["#3B82F6", "#10B981", "#F59E0B"], "height": 300 }
          },
          "recommendations": [
            "Action 1 (<=120 chars): specify lever, %/amount, target cohort/region, expected lift",
            "Action 2 (<=120 chars): specify lever, %/amount, target cohort/region, expected lift"
          ]
        }
      }
    ]
  }
}

CRITICAL RULES
1) English only.
2) **Max 2 sections** per report (prefer 1 if it answers the question).
3) Each section: **max 2 snapshot points** and **max 2 recommendations**.
4) Include a 'Forecast (Optimized)' series ONLY when the user asks for a forecast; otherwise prefer 2–4 series that best answer the question (e.g., Actual vs Baseline vs Target vs Competitor; or top vs bottom Regions/Channels; or YoY vs QoQ).
5) Recommendations must be **concrete & measurable**: cite lever (budget, F2F, competitor), %/$ shift, region/segment, and the projected outcome (scripts, share, revenue, ROI). Always name the exact channels (e.g., "Digital Video", "Web Virtual Calls") and include the % split per channel; never say just "high-ROI channels".
6) Include specific metrics and time windows (e.g., “by Q4”).
7) Avoid vague phrasing (“enhance”, “continue”) without a numeric target.
8) Refer to “model output” / “predicted impact” (do not name modeling approaches).
9) Prefer Pharma SM values. If simulated values are used, include the word "simulated" in the related snapshot.

EXAMPLES (SIMULATED/ILLUSTRATIVE)

1) Performance trends (budget shift lever; comparator series)
{
  "type": "report",
  "text": "Revenue momentum is strong; model output shows upside via targeted budget shifts.",
  "report": {
    "sections": [
      {
        "title": "Revenue & Growth Trajectory",
        "short": "Revenue +6.4% QoQ; South clinics drive outsized gain.",
        "full": {
          "snapshot": [
            "Total sales $20.8M; South patient share 32.8% (+7.4% QoQ).",
            "Digital video 2.5x ROI; F2F outreach 2.6x in cardiology."
          ],
          "chart": {
            "type": "line",
            "x": { "label": "Quarter" },
            "y": { "label": "Sales ($M)" },
            "series": [
              { "name": "Actual", "data": [18.5, 19.7, 20.8] },
              { "name": "Baseline", "data": [17.9, 18.8, 19.5] },
              { "name": "Target", "data": [19.0, 20.5, 22.0] }
            ],
            "style": { "colors": ["#3B82F6", "#10B981", "#F59E0B"], "height": 300 }
          },
          "recommendations": [
            "Shift +15% from F2F Tier1 → digital webinars South by Q4 → +4.2% scripts, +$1.5M.",
            "Increase clinic sampling +15% in high-potential zips → +5% patient share by Q4."
          ]
        }
      }
    ]
  }
}

2) ROI optimization (budget + payer/competitor lever; competitor comparator)
{
  "type": "report",
  "text": "Efficiency gains available by reallocating to higher-ROI channels and fixing payer friction.",
  "report": {
    "sections": [
      {
        "title": "ROI & Efficiency Uplift",
        "short": "Overall ROI 2.6x; optimization can lift toward 3.1x.",
        "full": {
          "snapshot": [
            "Digital 2.6x outperform F2F; Central payer drag identified.",
            "Model output shows diminishing returns in saturated Tier1 clinics."
          ],
          "chart": {
            "type": "bar",
            "x": { "label": "Quarter" },
            "y": { "label": "ROI (x)" },
            "series": [
              { "name": "Our ROI", "data": [2.1, 2.4, 2.6] },
              { "name": "Competitor ROI", "data": [1.9, 2.0, 2.2] }
            ],
            "style": { "colors": ["#3B82F6", "#EF4444"], "height": 300 }
          },
          "recommendations": [
            "Reallocate +15% from offline to digital video/virtual calls by Q4 → +18% ROI; +$2.0M.",
            "Target Central payer gap (data-driven negotiation) → +12% access → +$1.2M."
          ]
        }
      }
    ]
  }
}

3) Coverage & regional (F2F reallocation lever; top vs bottom regions)
{
  "type": "report",
  "text": "Coverage imbalance limits growth; reassigning reps can unlock Tier2 potential.",
  "report": {
    "sections": [
      {
        "title": "Regional Coverage & Script Lift",
        "short": "South leads; Central/North under-covered vs opportunity.",
        "full": {
          "snapshot": [
            "South coverage high; Central down; North lagging scripts at 18.2% share.",
            "Model output shows marginal lift declining in Tier1, rising in Tier2."
          ],
          "chart": {
            "type": "line",
            "x": { "label": "Quarter" },
            "y": { "label": "Patient Share (%)" },
            "series": [
              { "name": "South", "data": [30.5, 31.9, 33.8] },
              { "name": "Central", "data": [22.1, 21.4, 20.9] },
              { "name": "North", "data": [18.2, 18.5, 18.7] }
            ],
            "style": { "colors": ["#10B981", "#3B82F6", "#F59E0B"], "height": 300 }
          },
          "recommendations": [
            "Reassign 10–15% rep time Tier1→Tier2 in Central/North → +2–4% scripts by Q4.",
            "Add 1 virtual touch/mo to low-access clinics → +1.5% share; +$0.6M."
          ]
        }
      }
    ]
  }
}

4) Promotional mix (composition; pie)
{
  "type": "report",
  "text": "Promotional mix skews to digital; composition suggests rebalancing for ROI.",
  "report": {
    "sections": [
      {
        "title": "Promotional Spend Mix",
        "short": "Digital + Field account for ~73% of spend; events under-index.",
        "full": {
          "snapshot": [
            "Digital 41%, Field 32%, Events 19%, Media 8% (simulated).",
            "Model output: shifting +10% to digital video → +0.8–1.2pp ROI."
          ],
          "chart": {
            "type": "pie",
            "x": { "label": "Channel", "categories": ["Digital","Field","Events","Media"] },
            "y": { "label": "Spend ($K)" },
            "series": [
              { "name": "Spend", "data": [1500, 1200, 700, 300] }
            ],
            "style": { "colors": ["#3B82F6","#10B981","#F59E0B","#EF4444"], "height": 300 }
          },
          "recommendations": [
            "Shift +10% from events → digital video by Q4 → +0.9pp ROI; +$0.7M.",
            "Pilot webinars in under-covered regions → +1.5% share; +$0.5M."
          ]
        }
      }
    ]
  }
}

IMPORTANT
- Be friendly in tone, concise, and executive-ready.
- Prefer **one focused section** unless the user asks for multiple views.
- When forecasting, include a forecast series that visualizes the upside if actions are taken. Otherwise, include comparator series that directly answer the user's question.
- Recommendations must specify **lever + %/$ + target + expected lift**.

SERIES & BREAKDOWNS (guidance)
- Prefer 2–4 series aligned to the prompt. Good examples: Actual vs Baseline; Actual vs Target; Our vs Competitor; Top vs Bottom Regions; Top Channels; YoY vs QoQ.
- When a breakdown is requested (regions/channels/providers), use a bar/line with multiple series or a pie for composition. Use clear labels and categories.
- Do not default to only ["Actual","Forecast (Optimized)"] unless the user explicitly asks for a forecast.

KB FOCUS & MAPPING (very important)
- PHARMA_SM_DATASET is provided as an array of objects with fields: id, title, value, change, changeType, comparison, description, details{description, breakdown[]}, chartData{type, valueKey, data[]}, keywords[], category.
- Map the user's intent to one or more items by matching query terms to item.keywords and title. Do not invent ids, titles, or fields.
- When rendering a card, prefer the exact matching KB item; reuse its chartData when relevant. If a better chart type is necessary for the question, explain briefly in details.description and still keep the data relevant.
- When rendering a report, build charts that directly answer the prompt. Do not include unrelated KPIs. If the user asks about a specific topic, only include that topic unless they explicitly ask for multiple.

RELEVANCE & DEDUPLICATION
- Use the conversation HISTORY to avoid repeating the same section titles, recommendations, or chart angles from the last 5 turns. If repetition is unavoidable, present a new angle (different cut: region, channel, or timeframe).
- Only include metrics and charts that clearly answer the user's question. Do not output generic charts when the user asks a narrow question.
- If intent is ambiguous, return a TEXT response asking a focused clarifying question instead of guessing.

STRICT JSON OUTPUT
- Always return a single JSON object using exactly one of the defined response types (text | report | card). No extra commentary outside the JSON.
- All numeric claims must originate from PHARMA_SM_DATASET or be explicitly labeled as "simulated".

TOTAL SALES DECOMPOSITION (mandatory when applicable)
- If the insight mentions or centers on "Total Sales" (ключевые слова: "total sales", "общие продажи", "total revenue", "итого"), ALWAYS include the breakdown into "Base Sales" and "Incremental Sales" as part of the same view.
- Present them both in the narrative (snapshot) and in the chart as separate series, e.g., a stacked bar/area or side-by-side bars/lines: [Total Sales, Base Sales, Incremental Sales].
- Ensure numeric consistency: Total ≈ Base + Incremental for the period shown. If any values are simulated, mark them explicitly as "simulated".
`;
serve(async (req) => {
  console.log('=== AI Assistant Function Called ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, {
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    console.log('Processing AI request...');
    
    if (!openAIApiKey) {
      console.error('❌ OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }
    console.log('✅ OpenAI API key found');

    let requestBody: any;
    try {
      const bodyText = await req.text();
      if (!bodyText || bodyText.trim() === '') {
        throw new Error('Empty request body');
      }
      requestBody = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return new Response(JSON.stringify({
        response: '',
        error_message: 'Invalid request body',
        error_debug: {
          source: 'request-parse',
          message: (parseError as any)?.message?.toString() || 'Invalid JSON in request body'
        },
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const { message, kb, history, persona, brand_id: brandIdOpt } = requestBody as {
      message: string;
      kb?: unknown;
      history?: any[];
      persona?: string;
      /** Optional brand filter for Company Brain rows */
      brand_id?: string;
    };
    
    if (!message || typeof message !== 'string' || message.trim() === '') {
      console.error('❌ Invalid or empty message in request');
      return new Response(JSON.stringify({
        response: '',
        error_message: 'Invalid or empty message',
        error_debug: {
          source: 'request-validation',
          message: 'Message is required and must be a non-empty string'
        },
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    console.log('📨 Received message:', message);
    if (persona) {
      console.log('👤 Persona:', persona);
    }
    if (kb) {
      console.log('📚 Received Pharma SM KB payload');
    }

    let kbEffective: unknown = kb;

    // Initialize Supabase client with the caller's JWT for RLS-safe access
    let modelOutputsCompact: unknown[] | null = null;
    let companyBrainMessage: string | null = null;
    try {
      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('⚠️ Supabase URL or ANON key not configured; skipping Supabase-backed context');
      } else {
        const authHeader = req.headers.get('Authorization') || '';
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: authHeader ? { Authorization: authHeader } : {} }
        });

        const { data: authData } = await supabase.auth.getUser();
        const uid = authData?.user?.id;
        if (uid) {
          const companyId = await getCompanyIdForUser(supabase, uid);
          const mergedPharma = await fetchPharmaSmMetricsMergedRows(
            supabase,
            companyId,
            brandIdOpt ?? null,
          );
          if (mergedPharma.length > 0) {
            kbEffective = pharmaMergedRowsToCompactKb(mergedPharma);
            console.log(`📊 PHARMA_SM from database: ${mergedPharma.length} metrics`);
          }
          if (companyId) {
            const brainRows = await fetchApprovedCompanyBrain(
              supabase,
              companyId,
              brandIdOpt ?? null,
            );
            companyBrainMessage = formatBrainSystemMessage(brainRows) || null;
            if (companyBrainMessage) {
              console.log(`🧠 Company Brain: ${brainRows.length} approved entries (company ${companyId})`);
            }
          }
        }

        console.log('🔎 Fetching latest model outputs with RLS...');
        const { data: outputs, error: outputsError } = await supabase
          .from('mmm_model_outputs')
          .select('id, model_id, project_id, output_type, output_data, generated_at')
          .order('generated_at', { ascending: false })
          .limit(10); // Reduced from 20 to 10 to save tokens
        if (outputsError) {
          console.warn('⚠️ Failed to fetch model outputs:', outputsError.message);
        } else if (outputs && outputs.length > 0) {
          // Trim large payloads to keep prompt bounded
          modelOutputsCompact = outputs.map((o: any) => ({
            id: o.id,
            model_id: o.model_id,
            project_id: o.project_id,
            output_type: o.output_type,
            generated_at: o.generated_at,
            // keep only first 10 keys if huge
            output_data: (() => {
              try {
                const od = o.output_data;
                if (od && typeof od === 'object' && !Array.isArray(od)) {
                  const keys = Object.keys(od).slice(0, 5);
                  const trimmed: Record<string, unknown> = {};
                  for (const k of keys) trimmed[k] = od[k];
                  return trimmed;
                }
                return od;
              } catch (_) {
                return o.output_data;
              }
            })()
          }));
          console.log(`✅ Retrieved ${outputs.length} model output rows (compacted)`);
        } else {
          console.log('ℹ️ No model outputs available for this user');
        }
      }
    } catch (e) {
      console.warn('⚠️ Error while preparing model outputs / brain for prompt:', e?.message || e);
    }

    // Persona-specific formatting rules
    const personaContext = (() => {
      switch ((persona || '').toLowerCase()) {
        case 'gm':
        case 'general_manager':
        case 'general manager':
          return `PERSONA = GENERAL MANAGER (GM)
Objective: Quick diagnosis + top-level recovery levers.
STRICT FORMAT:
1) Executive Summary (2–3 sentences) — why it happened + headline recovery option.
2) Snapshot Chart — single chart (line or bar) showing overall performance trend (e.g., TRx by quarter, ROI dip).
3) Top 2 Recommendations — clear, quantified recovery plays with expected impact and timeline.
OUTPUT TYPE: Return a single JSON object ONLY with {"type":"report"} and exactly one section; no extra prose. The section.short must be the one-line takeaway. Provide exactly 2 recommendations.
`;          
        case 'commercial_lead':
        case 'commercial lead':
          return `PERSONA = COMMERCIAL LEAD
Objective: Scenario testing + tactical budget allocation.
STRICT FORMAT:
1) Scenario Simulation — compare Base vs Scenario in a chart (no tables). Use series names: ["Base", "Scenario"].
2) Simulation Results — 2–3 bullet points: expected TRx lift, ROI change, confidence.
3) Ranked Playbook — top 3 moves, ordered.
OUTPUT TYPE: Return a single JSON object ONLY with {"type":"report"} and exactly one section; no extra prose. Use bar or line chart with two series (Base vs Scenario). Provide exactly 3 ranked recommendations.
`;
        case 'marketing_ops':
        case 'marketing ops':
          return `PERSONA = MARKETING OPS
Objective: Content performance optimization.
STRICT FORMAT:
1) Performance Flag — underperforming sequence or channel.
2) Metric Card (1–2 KPIs) — ROI, engagement %, conversion, with red/yellow/green indicator.
3) Actionable Recommendation — proposed fix with expected lift.
4) Optional Benchmark — add if available in model outputs.
OUTPUT TYPE: Return a single JSON object ONLY — prefer {"type":"card"}; if a chart is essential, use {"type":"report"} with one section. No extra prose. Always include at least one recommendation.
`;
        default:
          return '';
      }
    })();

    console.log('🤖 Calling OpenAI API...');
    
    // Ensure API key is a valid string
    if (!openAIApiKey || typeof openAIApiKey !== 'string' || openAIApiKey.trim() === '') {
      console.error('❌ Invalid OpenAI API key');
      return new Response(JSON.stringify({
        response: '',
        error_message: 'OpenAI API key is invalid or missing',
        error_debug: {
          source: 'config',
          message: 'OPENAI_API_KEY environment variable is not set or invalid'
        },
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Create headers with proper string values
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${String(openAIApiKey).trim()}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: metricsContext
          },
          ...(personaContext ? [{ role: 'system', content: personaContext }] : []),
          ...(modelOutputsCompact ? [{
            role: 'system',
            content: 'MODEL_OUTPUTS_DATASET (JSON). Use to ground insights and recommendations. Prefer concrete numbers from this dataset when relevant.\n' +
              JSON.stringify(modelOutputsCompact).slice(0, 8000) // Reduced from 20000 to 8000 to save tokens
          }] : []),
          ...(kbEffective ? [{
            role: 'system',
            content: `PHARMA_SM_DATASET (JSON). Use as the authoritative source for values, ids, and chart data. Do not speculate beyond it unless explicitly asked.\n` +
              JSON.stringify(kbEffective).slice(0, 8000) // Reduced from 20000 to 8000 to save tokens
          }] : []),
          ...(companyBrainMessage ? [{
            role: 'system',
            content: companyBrainMessage,
          }] : []),
          ...(Array.isArray(history) ? history.slice(-5).map((h) => ({ // Reduced from -10 to -5 messages
            role: h.role === 'assistant' ? 'assistant' : 'user',
            content: typeof h.content === 'string' ? h.content : JSON.stringify(h.content).slice(0, 2000) // Reduced from 4000 to 2000 chars per message
          })) : []),
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenAI API error: ${response.status} ${response.statusText}`, errorText);
      
      // Parse error to check for rate limit
      let errorMessage = 'OpenAI API error';
      let errorDetails = errorText?.slice(0, 2000) || 'unknown';
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          const error = errorJson.error;
          if (error.type === 'rate_limit_error' || error.message?.includes('rate limit')) {
            errorMessage = 'Rate limit exceeded. Please try again in a few moments.';
            // Extract retry time if available
            const retryMatch = error.message?.match(/try again in ([\d.]+)s/i);
            if (retryMatch) {
              errorMessage += ` (Retry in ${Math.ceil(parseFloat(retryMatch[1]))} seconds)`;
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
        }
      } catch (_) {
        // If parsing fails, use default error message
      }
      
      // Return debug to client (status 200) so UI can show cause instead of generic 500
      return new Response(JSON.stringify({
        response: '',
        error_message: errorMessage,
        error_debug: {
          source: 'openai',
          httpStatus: response.status,
          statusText: response.statusText,
          body: errorDetails
        },
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    let data: any;
    try {
      const responseText = await response.text();
      console.log('📥 OpenAI raw response length:', responseText.length);
      data = JSON.parse(responseText);
      console.log('✅ OpenAI response parsed successfully');
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response as JSON:', parseError);
      return new Response(JSON.stringify({
        response: '',
        error_message: 'Failed to parse OpenAI response',
        error_debug: {
          source: 'openai-parse',
          message: (parseError as any)?.message?.toString() || 'Invalid JSON response'
        },
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    // Validate response structure
    if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('❌ Invalid OpenAI response structure:', JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({
        response: '',
        error_message: 'Invalid OpenAI response structure',
        error_debug: {
          source: 'openai-structure',
          message: 'Response missing choices array or empty'
        },
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const assistantMessage = data.choices[0]?.message?.content;
    if (!assistantMessage) {
      console.error('❌ No content in OpenAI response:', JSON.stringify(data.choices[0]).slice(0, 500));
      return new Response(JSON.stringify({
        response: '',
        error_message: 'No content in OpenAI response',
        error_debug: {
          source: 'openai-content',
          message: 'Response missing message content'
        },
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const result = {
      response: assistantMessage,
      timestamp: new Date().toISOString()
    };

    console.log('📤 Sending response back to client (length:', assistantMessage.length, ')');
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });

  } catch (error) {
    console.error('❌ Error in ai-assistant function:', error);
    return new Response(JSON.stringify({
      response: '',
      error_message: 'Edge function error',
      error_debug: { source: 'edge-function', message: (error as any)?.message?.toString()?.slice(0, 2000) },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 