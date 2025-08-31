import { useState, useCallback, createContext, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { metricsKnowledgeBase, findMetricByQuery, MetricCard, getTopPerformingChannels, getRegionalPerformance, getMarketingRecommendations, getScenarioComparisons } from '@/data/metricsKnowledgeBase';

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
  sendMessage: (message: string) => Promise<void>;
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

  const sendMessage = useCallback(async (message: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      console.log('Sending message to AI assistant:', message);
      
      // Prepare a richer Pharma SM KB payload: include description and details for grounding
      const compactKb = metricsKnowledgeBase.map(({ id, title, value, change, changeType, comparison, description, details, chartData, keywords, category }) => ({
        id, title, value, change, changeType, comparison, description, details, chartData, keywords, category
      }));

      // Include recent chat history to reduce repetition and improve relevance
      const historyPayload = messages.slice(-8).map(m => ({
        role: m.sender === 'ai' ? 'assistant' : 'user',
        content: m.content
      }));
      
      const { data, error: supabaseError } = await supabase.functions.invoke('ai-assistant', {
        body: { message, kb: compactKb, history: historyPayload }
      });

      if (supabaseError) {
        console.error('Supabase function error:', supabaseError);
        throw new Error(`Function call error: ${supabaseError.message}`);
      }
      
      console.log('Response from AI assistant:', data);
      
      if (!data) {
        throw new Error('Received empty response from AI assistant');
      }

      const responseText = data.response || 'Sorry, could not get a response.';
      
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
              const kbMetric = candidateId ? metricsKnowledgeBase.find(m => m.id === candidateId) : undefined;
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
          } else if (parsed.type === 'report' && parsed.report && parsed.report.sections) {
            responseType = 'report';
            cleanText = parsed.text || 'Analysis complete. Please review the detailed sections below.';
            
            // Validate the report structure - accept 1-4 sections
            if (Array.isArray(parsed.report.sections) && parsed.report.sections.length >= 1 && parsed.report.sections.length <= 4) {
              const isValidStructure = parsed.report.sections.every((section: ReportSection) => 
                section.title && 
                section.short && 
                section.full && 
                Array.isArray(section.full.snapshot) && 
                section.full.snapshot.length >= 1 &&
                section.full.chart &&
                Array.isArray(section.full.recommendations) && 
                section.full.recommendations.length >= 1
              );
              
              if (isValidStructure) {
                report = parsed.report;
                // Prefer the explicit summary text from the JSON; otherwise try to strip JSON from response
                const stripped = responseText.replace(jsonString, '').trim();
                cleanText = parsed.text || stripped || 'Analysis complete. Please review the detailed sections below.';
                console.log('✅ Successfully parsed report with', parsed.report.sections.length, 'sections');
              } else {
                console.warn('Invalid report structure received from AI');
                // Request regeneration if structure is invalid
                throw new Error('Invalid report structure. Please regenerate the response.');
              }
            } else {
              console.warn('Report sections count is invalid');
              throw new Error('Report must contain 1-4 sections. Please regenerate the response.');
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
            metric = metricsKnowledgeBase.find(m => m.id === metricId);
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
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.text,
        sender: 'ai',
        action: aiResponse.action,
        metricId: aiResponse.details?.metricId,
        metric: aiResponse.metric,
        report: aiResponse.report,
        card: aiResponse.card,
        responseType: aiResponse.responseType
      };
      
      console.log('Creating AI message:', {
        hasReport: !!aiResponse.report,
        reportSections: aiResponse.report?.sections?.length || 0,
        content: aiResponse.text.substring(0, 100) + '...'
      });
      
      setMessages(prev => [...prev, aiMessage]);

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
  }, [messages]);

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
