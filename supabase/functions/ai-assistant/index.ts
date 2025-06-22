
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const metricsContext = `
You are GSIS AI Assistant, the future of business intelligence for pharmaceutical analytics. 
You have comprehensive knowledge of all business metrics and data in our Farma S&M Analytics dashboard.

AVAILABLE METRICS:
Key Metrics:
- QoQ Revenue Growth: 8.7% (+40.3% vs last quarter)
- Patient Share / Prescriptions: 34.2% (+8.6% vs last quarter) 
- Sample-to-Script Ratio: 1.8x (+20.0% vs last quarter)
- Rebate Spend vs ROI: 4.3x (+16.2% vs last quarter)
- Market Access Score: 87.3 (+12.1% vs last quarter)

Situation Metrics:
- Base Sales: $12.0M (+93.14% Revenue Attribution)
- Seasonality: $1.2M (+6.86% Revenue Attribution)
- Trend: $0.8M (+2.1% Revenue Attribution)
- Digital Pharma Display: $0.9M (+2.1x ROI)
- Digital Pharma Video: $1.2M (+2.4x ROI)
- Page Visit ViV Exchange: $0.5M (+1.8x ROI)
- Medscape HiV Brand Alert: $0.7M (+1.8x ROI)
- OLA Attendees: $0.4M (+1.4x ROI)
- OOH Pharma: $0.6M (+1.6x ROI)
- Phone Calls ABC: $1.3M (+2.5x ROI)
- Veeva Emails: $0.8M (+1.9x ROI)
- Web Virtual Calls ABC: $1.1M (+2.2x ROI)

INSTRUCTIONS:
1. When users ask about specific metrics, provide detailed information
2. If they want to see a card, respond with: {"action": "show_card", "metric_id": "metric-id"}
3. If they want to see a chart, respond with: {"action": "show_chart", "metric_id": "metric-id"}
4. Always be helpful and provide insights about the data
5. Respond in Russian if the user writes in Russian
6. You can analyze trends, provide recommendations, and explain metric relationships

EXAMPLES:
User: "Как дела с Base Sales?"
Response: "Base Sales показывает отличные результаты! Текущее значение составляет $12.0M с впечатляющим ростом +93.14% по Revenue Attribution. Это базовая выручка без маркетинговых усилий. {"action": "show_card", "metric_id": "base-sales"}"

User: "Show me Digital Display chart"
Response: "Digital Pharma Display campaign is performing well with $0.9M revenue and 2.1x ROI. Here's the detailed chart: {"action": "show_chart", "metric_id": "digital-display"}"
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    
    console.log('Received message:', message);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: metricsContext
          },
          { 
            role: 'user', 
            content: message 
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    const data = await response.json();
    console.log('OpenAI response:', data);
    
    const assistantMessage = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      response: assistantMessage,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: 'Извините, произошла ошибка. Попробуйте снова.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
