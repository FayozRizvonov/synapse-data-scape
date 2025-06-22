
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { metricsKnowledgeBase, findMetricByQuery, MetricCard } from '@/data/metricsKnowledgeBase';

interface AIResponse {
  text: string;
  action?: 'show_card' | 'show_chart';
  metric?: MetricCard;
}

export const useAIAssistant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string): Promise<AIResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Sending message to AI:', message);
      
      const { data, error: supabaseError } = await supabase.functions.invoke('ai-assistant', {
        body: { message }
      });

      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        throw new Error(supabaseError.message);
      }

      console.log('AI response data:', data);
      
      const responseText = data.response || 'Извините, не удалось получить ответ.';
      
      // Parse for actions
      let action: 'show_card' | 'show_chart' | undefined;
      let metric: MetricCard | undefined;
      
      try {
        // Look for JSON actions in the response
        const actionMatch = responseText.match(/\{"action":\s*"(show_card|show_chart)",\s*"metric_id":\s*"([^"]+)"\}/);
        if (actionMatch) {
          action = actionMatch[1] as 'show_card' | 'show_chart';
          const metricId = actionMatch[2];
          metric = metricsKnowledgeBase.find(m => m.id === metricId);
        }
      } catch (parseError) {
        console.log('No action found in response, continuing with text only');
      }

      // If no specific action but message might be asking about a metric
      if (!action && !metric) {
        const foundMetric = findMetricByQuery(message);
        if (foundMetric) {
          metric = foundMetric;
          // Determine action based on message content
          if (message.toLowerCase().includes('chart') || message.toLowerCase().includes('график')) {
            action = 'show_chart';
          } else {
            action = 'show_card';
          }
        }
      }

      return {
        text: responseText.replace(/\{"action":[^}]+\}/, '').trim(),
        action,
        metric
      };

    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка при обращении к AI';
      setError(errorMessage);
      
      return {
        text: 'Извините, произошла ошибка. Попробуйте снова.'
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sendMessage,
    isLoading,
    error
  };
};
