import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';
import { metricsKnowledgeBase, MetricCard, getTopPerformingChannels, getRegionalPerformance, getMarketingRecommendations, getScenarioComparisons } from '@/data/metricsKnowledgeBase';
import { useAuth } from '@/contexts/AuthContext';
import { loadMergedPharmaMetrics, metricCardsToCompactKbPayload } from '@/lib/pharmaSmMetrics';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

// Share the client's resolved config rather than re-reading import.meta.env:
// these variables are not set in Vercel, so reading them here produced
// `undefined` in production — every Edge Function call became
// fetch("undefined/functions/v1/...") with an undefined apikey.
const SUPABASE_ANON_KEY = SUPABASE_PUBLISHABLE_KEY;

/** Call an Edge Function URL directly with SSE streaming support. */
async function invokeStream(functionName: string, body: unknown, accessToken: string): Promise<Response> {
  return fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  action?: 'show_card' | 'show_chart' | 'navigate';
  metricId?: string;
  metric?: MetricCard;
  report?: AIReport;
  card?: MetricCard;
  responseType?: 'text' | 'report' | 'card';
}

interface AIResponse {
  text: string;
  action?: 'show_card' | 'show_chart' | 'navigate';
  metric?: MetricCard;
  details?: {
    section?: string;
    metricId?: string;
  };
  report?: AIReport;
  card?: MetricCard;
  responseType?: 'text' | 'report' | 'card';
}

interface AIReport {
  sections: ReportSection[];
}

interface ReportSection {
  title: string;
  short: string;
  full: {
    snapshot: string[];
    chart: {
      type: 'bar' | 'line' | 'pie';
      x: { label: string };
      y: { label: string };
      series: Array<{ name: string; data: number[] }>;
      style: { colors: string[]; height: number };
    };
    recommendations: string[];
  };
}

interface AIAssistantContextType {
  messages: Message[];
  lastAIResponse: AIResponse | null;
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string, opts?: { chatId?: string; titleHint?: string }) => Promise<{ chatId?: string }>;
  clearChat: () => void;
  getTopChannels: () => Array<{ channel: string; roi: string; spend: string; performance: string; }>;
  getRegionalData: () => Array<{ region: string; performance: string; target: string; gap: string; }>;
  getRecommendations: () => MetricCard[];
  getScenarios: () => MetricCard[];
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

export const AIAssistantProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastAIResponse, setLastAIResponse] = useState<AIResponse | null>(null);
  const { userRole, user, companyId } = useAuth();
  const useStreaming = useFeatureFlag('streaming_orchestrator');

  const sendMessage = useCallback(async (message: string, opts?: { chatId?: string; titleHint?: string }): Promise<{ chatId?: string }> => {
    setIsLoading(true);
    setError(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
    };
    setMessages(prev => [...prev, userMessage]);

    // Ensure chat exists and store user message
    let chatId = opts?.chatId;
    try {
      const fromAny = (supabase as unknown as { from: (t: string) => any }).from;

      // Ensure we have an authenticated user id for RLS
      let authUserId = user?.id as string | undefined;
      if (!authUserId) {
        const { data } = await supabase.auth.getSession();
        authUserId = data.session?.user?.id as string | undefined;
      }

      if (!chatId && authUserId) {
        const { data: created } = await fromAny('chats')
          .insert({ title: opts?.titleHint || (message.slice(0, 60) || 'New chat'), user_id: authUserId })
          .select('id')
          .single();
        chatId = (created as { id?: string } | undefined)?.id;
      }

      if (chatId && authUserId) {
        await fromAny('messages').insert({ chat_id: chatId, sender: 'user', content: message });
      }
    } catch (_) {
      // Best-effort: UI will still work even if persistence fails
      console.warn('Chat persistence (user message) failed');
    }

    try {
      console.log('Sending message to AI assistant:', message);

      let activeKb: MetricCard[] = metricsKnowledgeBase;
      try {
        const merged = await loadMergedPharmaMetrics(supabase, companyId ?? null, null);
        if (merged.length > 0) activeKb = merged;
      } catch (_) {
        /* keep bundled KB */
      }

      const compactKb = metricCardsToCompactKbPayload(activeKb);

      // Include recent chat history to reduce repetition and improve relevance
      const historyPayload = messages.slice(-8).map(m => ({
        role: m.sender === 'ai' ? 'assistant' : 'user',
        content: m.content
      }));
      
      const correlationId = crypto.randomUUID();

      // Insert a placeholder message (content fills in as tokens arrive, or all at once for non-streaming)
      const streamingMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: streamingMsgId, content: '', sender: 'ai' }]);

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token ?? SUPABASE_ANON_KEY;

      const requestBody = {
        correlation_id: correlationId,
        modality: 'chat',
        message,
        kb: compactKb,
        history: historyPayload,
        persona: userRole,
        chat_id: chatId,
      };

      let fullResponseText = '';

      if (useStreaming) {
        // ── Streaming path (feature flag: streaming_orchestrator) ──────────
        let streamOk = false;
        try {
          const streamRes = await invokeStream('orchestrator-stream', requestBody, accessToken);
          if (!streamRes.ok || !streamRes.body) throw new Error(`Stream failed: ${streamRes.status}`);

          const reader = streamRes.body.getReader();
          const decoder = new TextDecoder();
          let sseBuffer = '';
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              sseBuffer += decoder.decode(value, { stream: true });
              const lines = sseBuffer.split('\n');
              sseBuffer = lines.pop() ?? '';
              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const raw = line.slice(6).trim();
                if (raw === '[DONE]') break;
                let evt: any;
                try { evt = JSON.parse(raw); } catch (_) { continue; }
                if (evt.type === 'token' && evt.delta) {
                  fullResponseText += evt.delta;
                  setMessages(prev => prev.map(m =>
                    m.id === streamingMsgId ? { ...m, content: fullResponseText } : m
                  ));
                } else if (evt.type === 'error') {
                  throw new Error(evt.message ?? 'Stream error');
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
          streamOk = true;
        } catch (streamErr) {
          console.warn('⚠️ Streaming failed, falling back to non-streaming orchestrator:', streamErr);
        }

        if (!streamOk) {
          // ── Fallback 1: non-streaming orchestrator ──────────────────────
          const { data, error: fnErr } = await supabase.functions.invoke('orchestrator', { body: requestBody });
          if (fnErr) throw fnErr;
          fullResponseText = (data as any)?.response ?? '';
          setMessages(prev => prev.map(m =>
            m.id === streamingMsgId ? { ...m, content: fullResponseText } : m
          ));
        }
      } else {
        // ── Non-streaming path (default / flag off) ─────────────────────
        let orchOk = false;
        try {
          const { data, error: fnErr } = await supabase.functions.invoke('orchestrator', { body: requestBody });
          if (fnErr) throw fnErr;
          fullResponseText = (data as any)?.response ?? '';
          orchOk = true;
        } catch (orchErr) {
          console.warn('⚠️ Orchestrator failed, falling back to legacy ai-assistant:', orchErr);
        }

        if (!orchOk) {
          // ── Fallback 2: legacy ai-assistant (safe revert) ───────────────
          const { data, error: legacyErr } = await supabase.functions.invoke('ai-assistant', {
            body: { message, kb: compactKb, history: historyPayload, persona: userRole, chat_id: chatId },
          });
          if (legacyErr) throw legacyErr;
          fullResponseText = (data as any)?.response ?? '';
        }

        setMessages(prev => prev.map(m =>
          m.id === streamingMsgId ? { ...m, content: fullResponseText } : m
        ));
      }

      const responseText = fullResponseText || 'Sorry, could not get a response.';
      
      // Try to parse the new JSON response format
      let report: AIReport | undefined;
      let card: MetricCard | undefined;
      let responseType: 'text' | 'report' | 'card';
      let cleanText = responseText;

      try {
        // Look for JSON structure in the response - be more flexible
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          let jsonString = jsonMatch[0];
          
          // Try to fix common JSON issues
          jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
          
          // Fix incomplete JSON
          if (!jsonString.endsWith('}')) {
            const openBraces = (jsonString.match(/\{/g) || []).length;
            const closeBraces = (jsonString.match(/\}/g) || []).length;
            const openBrackets = (jsonString.match(/\[/g) || []).length;
            const closeBrackets = (jsonString.match(/\]/g) || []).length;
            
            for (let i = closeBrackets; i < openBrackets; i++) {
              jsonString += ']';
            }
            for (let i = closeBraces; i < openBraces; i++) {
              jsonString += '}';
            }
          }
          
          console.log('Attempting to parse JSON:', jsonString.substring(0, 200) + '...');
          const parsed = JSON.parse(jsonString);
          
          // Determine response type
          if (parsed.type === 'text') {
            responseType = 'text';
            cleanText = parsed.content || parsed.text || 'Hello! How can I help you today?';
            console.log('✅ Parsed text response:', cleanText);
          } else if (parsed.type === 'card' && parsed.card) {
            responseType = 'card';
            // Prefer AI-provided card fields but merge with KB defaults for styling and metadata
            try {
              const candidateId: string | undefined = parsed.card.id || parsed.card.metricId;
              const kbMetric = candidateId ? activeKb.find(m => m.id === candidateId) : undefined;
              if (kbMetric) {
                card = {
                  ...kbMetric,
                  ...parsed.card,
                  // Prefer AI chartData if provided; fall back to KB
                  chartData: parsed.card.chartData || kbMetric.chartData
                } as MetricCard;
              } else {
                card = parsed.card as MetricCard;
              }
            } catch (_) {
              card = parsed.card as MetricCard;
            }
            cleanText = parsed.text || 'Here is the detailed information:';
          } else if (parsed.type === 'report' && (parsed.report?.sections || parsed.sections || parsed["Simulation Results"] || parsed["Ranked Playbook"])) {
            responseType = 'report';
            cleanText = parsed.text || 'Analysis complete. Please review the detailed sections below.';

            // Normalize alternative shapes into our canonical { report: { sections: [...] } }
            const normalized = (() => {
              // 1) Already in canonical structure
              if (parsed.report?.sections && Array.isArray(parsed.report.sections)) {
                return parsed.report as AIReport;
              }
              // 2) Some models may return { sections: [...] }
              if (Array.isArray((parsed as any).sections)) {
                return { sections: (parsed as any).sections } as AIReport;
              }
              // 3) Persona-specific minimal object: keys like "Simulation Results" and "Ranked Playbook"
              const simResults: string[] | undefined = (parsed as any)["Simulation Results"] || (parsed as any)["simulation_results"]; 
              const playbook: string[] | undefined = (parsed as any)["Ranked Playbook"] || (parsed as any)["ranked_playbook"] || (parsed as any).recommendations;
              if (simResults || playbook) {
                const snapshot = Array.isArray(simResults) && simResults.length > 0 ? simResults.slice(0, 2) : [
                  'Scenario analysis available. Values normalized for display.'
                ];
                const recommendations = Array.isArray(playbook) && playbook.length > 0 ? playbook.slice(0, 3) : [
                  'Prioritize highest-ROI lever based on latest model outputs.'
                ];
                const fallbackChart = {
                  type: 'bar' as const,
                  x: { label: 'Scenario' },
                  y: { label: 'Impact' },
                  series: [
                    { name: 'Base', data: [0] },
                    { name: 'Scenario', data: [0] },
                  ],
                  style: { colors: ['#3B82F6', '#10B981'], height: 220 }
                };
                return {
                  sections: [
                    {
                      title: (parsed as any).title || 'Scenario Simulation',
                      short: snapshot[0] || 'Scenario comparison and recommended plays.',
                      full: {
                        snapshot,
                        chart: ((parsed as any).chart && (parsed as any).chart.type && (parsed as any).chart.series) ? (parsed as any).chart : fallbackChart,
                        recommendations,
                      }
                    }
                  ]
                } as AIReport;
              }
              return undefined;
            })();

            if (normalized && Array.isArray(normalized.sections) && normalized.sections.length >= 1) {
              report = normalized;
              const stripped = responseText.replace(jsonString, '').trim();
              cleanText = parsed.text || stripped || 'Analysis complete. Please review the detailed sections below.';
              console.log('✅ Normalized report structure with', normalized.sections.length, 'sections');
            } else if (parsed.report?.sections) {
              // Validate canonical structure
              const isValidStructure = parsed.report.sections.every((section: ReportSection) => 
                section.title && section.short && section.full && Array.isArray(section.full.snapshot) && section.full.chart && Array.isArray(section.full.recommendations)
              );
              if (isValidStructure) {
                report = parsed.report;
                const stripped = responseText.replace(jsonString, '').trim();
                cleanText = parsed.text || stripped || 'Analysis complete. Please review the detailed sections below.';
                console.log('✅ Successfully parsed report with', parsed.report.sections.length, 'sections');
              } else {
                console.warn('Invalid report structure received from AI');
                throw new Error('Invalid report structure. Please regenerate the response.');
              }
            } else {
              console.warn('Report not present after normalization');
              throw new Error('Report must contain sections. Please regenerate the response.');
            }
          } else if (!parsed.type) {
            // Heuristic: model returned a bare card-like object
            const looksLikeCard = (parsed.title && (parsed.value || parsed.chartData)) || parsed.card;
            const cardPayload = parsed.card || parsed;
            if (looksLikeCard) {
              responseType = 'card';
              try {
                const candidateId: string | undefined = cardPayload.id || cardPayload.metricId;
                const kbMetric = candidateId ? activeKb.find(m => m.id === candidateId) : undefined;
                if (kbMetric) {
                  card = {
                    ...kbMetric,
                    ...cardPayload,
                    chartData: cardPayload.chartData || kbMetric.chartData,
                  } as MetricCard;
                } else {
                  card = cardPayload as MetricCard;
                }
              } catch (_) {
                card = cardPayload as MetricCard;
              }
              cleanText = parsed.text || 'Here is the detailed information:';
            }
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse JSON report from response:', parseError);
        
        // Try to extract partial data from incomplete JSON
        if (parseError instanceof Error && parseError.message.includes('Unexpected end')) {
          console.log('Attempting to extract partial data from incomplete JSON...');
          
          // First, try to extract simple text response
          const textMatch = responseText.match(/"type":\s*"text"[^}]*"content":\s*"([^"]+)"/);
          if (textMatch) {
            responseType = 'text';
            cleanText = textMatch[1];
            console.log('✅ Extracted text from incomplete JSON:', cleanText);
          } else {
            // Try to find complete sections in the incomplete JSON
            const sectionMatches = responseText.match(/"title":\s*"([^"]+)"/g);
            if (sectionMatches && sectionMatches.length > 0) {
              console.log(`Found ${sectionMatches.length} potential sections, attempting to create partial report`);
              
              // Create a minimal valid report with available data
              const partialReport = {
                sections: sectionMatches.slice(0, 3).map((match, index) => {
                  const title = match.match(/"title":\s*"([^"]+)"/)?.[1] || `Section ${index + 1}`;
                  return {
                    title,
                    short: `Analysis for ${title.toLowerCase()}`,
                    full: {
                      snapshot: [`Data analysis for ${title.toLowerCase()} shows positive trends`],
                      chart: {
                        type: "bar",
                        x: { label: "Period" },
                        y: { label: "Value" },
                        series: [{ name: "Performance", data: [10, 15, 20, 25] }],
                        style: { colors: ["#3B82F6"], height: 300 }
                      },
                      recommendations: [`Continue monitoring ${title.toLowerCase()} performance`]
                    }
                  };
                })
              };
              
              report = partialReport;
              cleanText = 'Partial analysis completed. Some data may be incomplete due to response limits.';
              console.log('✅ Created partial report from incomplete JSON');
            }
          }
        }
        
        // If it's a validation error, we should request regeneration
        if (parseError instanceof Error && parseError.message.includes('regenerate')) {
          throw parseError;
        }
        
        // Additional check for simple text responses that might be malformed JSON
        if (responseText.includes('"type": "text"') && responseText.includes('"content":')) {
          const contentMatch = responseText.match(/"content":\s*"([^"]+)"/);
          if (contentMatch) {
            responseType = 'text';
            cleanText = contentMatch[1];
            console.log('✅ Extracted text from malformed JSON:', cleanText);
          }
        }
        
        // Fallback to old parsing logic only when no typed response identified
        if (!report && !responseType) {
          if (!responseText.includes('{') && !responseText.includes('[')) {
            responseType = 'text';
            cleanText = responseText.trim();
            console.log('✅ Treating as simple text response:', cleanText);
          } else {
            cleanText = responseText;
          }
        }
      }

      // Legacy parsing for backward compatibility (if no report found)
      let action: AIResponse['action'];
      let metric: MetricCard | undefined;
      let metricId: string | undefined;

      // Only run legacy parsing when no typed response was identified above
      if (!report && !responseType) {
        try {
          // Step 1: try to find complete JSON block (may have line breaks)
          const jsonBlockMatch = responseText.match(/\{[\s\S]*?\}/);
          if (jsonBlockMatch) {
            const jsonString = jsonBlockMatch[0]
              .replace(/\n/g, ' ')
              .replace(/'/g, '"');

            try {
              const parsed = JSON.parse(jsonString);
              if (parsed.action && parsed.metric_id) {
                action = parsed.action as 'show_card' | 'show_chart';
                metricId = parsed.metric_id as string;
              } else if (parsed.action && parsed.metricId) {
                action = parsed.action as 'show_card' | 'show_chart';
                metricId = parsed.metricId as string;
              }
            } catch (_) {
              // JSON.parse failed, let's try regex
            }
          }

          // Step 2: if previous method didn't work — fallback to extended regex
          if (!action || !metricId) {
            const patterns = [
              /\{[^}]*"action"\s*:\s*"?(show_card|show_chart)"?[^}]*"metric_id"\s*:\s*"?([a-zA-Z0-9_-]+)"?[^}]*\}/i,
              /\{[^}]*"action"\s*:\s*"?(show_card|show_chart)"?[^}]*"metricId"\s*:\s*"?([a-zA-Z0-9_-]+)"?[^}]*\}/i
            ];
            for (const pattern of patterns) {
              const match = responseText.match(pattern);
              if (match) {
                action = match[1] as 'show_card' | 'show_chart';
                metricId = match[2];
                break;
              }
            }
          }

          if (metricId) {
            metric = activeKb.find(m => m.id === metricId);
          }

        } catch (parseError) {
          console.warn('Failed to parse action from response:', parseError);
        }

        // Clean text from JSON and formatting artifacts
        cleanText = responseText
          .replace(/\{"action":[^}]+\}/g, '')
          .replace(/\*\*/g, '')
          .replace(/\*([^*]+)\*/g, '$1')
          .replace(/^\*+\s*/gm, '• ')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        
        // Legacy path implies text type
        responseType = 'text';
      }

      const aiResponse: AIResponse = {
        text: cleanText,
        action,
        metric,
        details: metricId ? { metricId } : undefined,
        report,
        card,
        responseType: responseType || 'text'
      };

      setLastAIResponse(aiResponse);

      console.log('Finalising AI message:', {
        hasReport: !!aiResponse.report,
        reportSections: aiResponse.report?.sections?.length || 0,
        content: aiResponse.text.substring(0, 100) + '...'
      });

      // Update the streaming placeholder with the fully-parsed structured message
      setMessages(prev => prev.map(m =>
        m.id === streamingMsgId
          ? {
              ...m,
              content: aiResponse.text,
              action: aiResponse.action,
              metricId: aiResponse.details?.metricId,
              metric: aiResponse.metric,
              report: aiResponse.report,
              card: aiResponse.card,
              responseType: aiResponse.responseType,
            }
          : m
      ));

      // Persist AI reply
      try {
        const fromAny = (supabase as unknown as { from: (t: string) => any }).from;
        if (chatId) {
          await fromAny('messages').insert({
            chat_id: chatId,
            sender: 'ai',
            content: aiResponse.text,
            structured: {
              responseType: aiResponse.responseType,
              report: aiResponse.report,
              card: aiResponse.card,
              action: aiResponse.action,
              metricId: aiResponse.details?.metricId,
            }
          });
        }
      } catch (_) {
        console.warn('Chat persistence (AI message) failed');
      }

    } catch (err) {
      console.error('Error in sendMessage:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      
      const errorMessageContent = `Sorry, an error occurred: ${errorMessage}. Please try again.`;
      const errorAIMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: errorMessageContent,
        sender: 'ai',
      };
      setMessages(prev => [...prev, errorAIMessage]);
      
      setLastAIResponse({ text: errorMessageContent });

    } finally {
      setIsLoading(false);
    }
    return { chatId };
  }, [messages, userRole, user?.id, companyId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setLastAIResponse(null);
    setError(null);
  }, []);

  const getTopChannels = useCallback(() => {
    return getTopPerformingChannels();
  }, []);

  const getRegionalData = useCallback(() => {
    return getRegionalPerformance();
  }, []);

  const getRecommendations = useCallback(() => {
    return getMarketingRecommendations();
  }, []);

  const getScenarios = useCallback(() => {
    return getScenarioComparisons();
  }, []);

  const value = {
    sendMessage,
    messages,
    lastAIResponse,
    clearChat,
    isLoading,
    error,
    getTopChannels,
    getRegionalData,
    getRecommendations,
    getScenarios
  };

  return (
    <AIAssistantContext.Provider value={value}>
      {children}
    </AIAssistantContext.Provider>
  );
};

export const useAIAssistant = () => {
  const context = useContext(AIAssistantContext);
  if (context === undefined) {
    throw new Error('useAIAssistant must be used within an AIAssistantProvider');
  }
  return context;
};
