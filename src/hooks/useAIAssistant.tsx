import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { metricsKnowledgeBase, findMetricByQuery, MetricCard } from '@/data/metricsKnowledgeBase';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  action?: 'show_card' | 'show_chart' | 'navigate';
  metricId?: string;
  metric?: MetricCard;
}

interface AIResponse {
  text: string;
  action?: 'show_card' | 'show_chart' | 'navigate';
  metric?: MetricCard;
  details?: {
    section?: string;
    metricId?: string;
  }
}

interface AIAssistantContextType {
  messages: Message[];
  lastAIResponse: AIResponse | null;
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;
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
      const lowerCaseMessage = message.toLowerCase();
      
      let aiResponse: AIResponse;

      // Check for navigation commands
      if (lowerCaseMessage.includes('pharma') || lowerCaseMessage.includes('analytics')) {
        aiResponse = {
          text: `Navigating to Pharma S&M Analytics section.`,
          action: 'navigate',
          details: {
            section: 'pharma-sm'
          }
        };
      } else {
        // Call Supabase Edge Function
        const { data, error: supabaseError } = await supabase.functions.invoke('ai-assistant', {
          body: { message }
        });

        if (supabaseError) {
          throw new Error(supabaseError.message);
        }
        
        const responseText = data.response || 'Sorry, unable to get a response.';
        
        // Parse JSON action from response
        let action: AIResponse['action'];
        let metric: MetricCard | undefined;
        let metricId: string | undefined;
        
        try {
          const actionMatch = responseText.match(/\{"action":\s*"(show_card|show_chart)",\s*"metric_id":\s*"([^"]+)"\}/);
          if (actionMatch) {
            action = actionMatch[1] as 'show_card' | 'show_chart';
            metricId = actionMatch[2];
            metric = metricsKnowledgeBase.find(m => m.id === metricId);
          }
        } catch (parseError) {
          console.warn('Failed to parse action from response:', parseError);
        }

        // If no action found in JSON, search by keywords
        if (!action && !metric) {
          const foundMetric = findMetricByQuery(message);
          if (foundMetric) {
            metric = foundMetric;
            action = message.toLowerCase().includes('chart') || message.toLowerCase().includes('graph')
              ? 'show_chart'
              : 'show_card';
          }
        }

        // Clean text from JSON
        const cleanText = responseText.replace(/\{"action":[^}]+\}/, '').trim();

        aiResponse = {
          text: cleanText,
          action,
          metric,
          details: metricId ? { metricId } : undefined
        };
      }

      setLastAIResponse(aiResponse);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.text,
        sender: 'ai',
        action: aiResponse.action,
        metricId: aiResponse.details?.metricId,
        metric: aiResponse.metric
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while contacting AI';
      setError(errorMessage);
      
      const errorMessageContent = 'Sorry, an error occurred. Please try again.';
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
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setLastAIResponse(null);
  }, []);

  const value = {
    sendMessage,
    messages,
    lastAIResponse,
    clearChat,
    isLoading,
    error
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
