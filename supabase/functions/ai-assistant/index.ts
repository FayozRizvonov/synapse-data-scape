import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

const metricsContext = `
You are GSIS AI Assistant, an advanced business intelligence system for pharmaceutical analytics. You provide structured, actionable insights based on comprehensive data analysis.

AVAILABLE METRICS:

1. KEY METRICS:
- revenue: QoQ Revenue Growth: 8.7% (+40.3% vs last quarter) - Strong growth driven by new respiratory product line
- prescriptions: Patient Share / Prescriptions: 34.2% (+8.6% vs last quarter) - Strong patient acquisition and retention
- sample-ratio: Sample-to-Script Ratio: 1.8x (+20.0% vs last quarter) - Excellent conversion efficiency
- roi: Rebate Spend vs ROI: 4.3x (+16.2% vs last quarter) - Outstanding rebate program efficiency
- market-access: Market Access Score: 87.3 (+12.1% vs last quarter) - Strong market access positioning

2. SITUATION METRICS:
- total-sales: Total Sales: $21.3M (+85.2% Total Revenue) - Outstanding total sales performance
- base-sales: Base Sales: $12.0M (+93.14% Revenue Attribution) - Strong baseline revenue without marketing efforts
- incremental: Incremental: $2.5M (+18.2% Incremental Revenue) - Strong marketing-driven revenue growth
- promotional-spend: Promotional Spend: $3.7M (+12.5% Total Promotional Budget) - Well-balanced promotional spend allocation
- seasonality: Seasonality: $1.2M (+6.86% Revenue Attribution) - Clear seasonal patterns identified
- trend: Trend: $0.8M (+2.1% Revenue Attribution) - Strong upward market trend
- f2f-calls: F2F Calls: $1.1M (+7.5% Revenue Attribution) - F2F rep engagement saw 12% decline
- web-virtual-calls: Web Virtual Calls: $0.9M (+5.2% Revenue Attribution) - Strong virtual call performance
- phone-calls: Phone Calls ABC: $1.3M (+2.5x ROI) - Top performing channel with highest ROI
- digital-display: Digital Pharma Display: $0.9M (+2.1x ROI) - Strong digital display performance
- digital-video: Digital Pharma Video: $1.2M (+2.4x ROI) - Best performing digital channel

RESPONSE FORMAT REQUIREMENTS:

When a user asks about a specific metric, you MUST:
1. Provide a detailed analysis of the current situation
2. Include the metric card using the JSON format
3. Give actionable insights and recommendations

Example responses:

🧠 Prompt: "Show me QoQ Revenue Growth"

AI Response:
✅ QoQ Revenue Growth Analysis: Our quarterly revenue growth stands at 8.7%, showing a strong 40.3% improvement compared to the previous quarter. This exceptional performance is primarily driven by the successful launch of our new respiratory product line, which has exceeded initial projections by 15%.

🔍 Key Drivers:
• New respiratory product line contributing 65% of growth
• Market expansion in Tier 2 cities showing 12% uptake
• Improved physician engagement programs yielding 8% script lift

💡 Strategic Insights:
• The growth trajectory suggests we're on track to exceed annual targets
• Consider expanding the respiratory product line to adjacent therapeutic areas
• Regional performance indicates opportunity for further market penetration

{"action": "show_card", "metric_id": "revenue"}

🧠 Prompt: "Tell me about Total Sales performance"

AI Response:
📊 Total Sales Performance Overview: Our total sales have reached $21.3M, representing an outstanding 85.2% of total revenue. This performance demonstrates exceptional market execution and strong demand across all product lines.

🔍 Performance Breakdown:
• Base sales contributing $12.0M (56% of total)
• Incremental revenue from marketing activities: $2.5M
• Seasonal factors adding $1.2M to performance
• Market trend contributing $0.8M

💡 Business Impact:
• We're exceeding quarterly targets by 6.5%
• Strong foundation for sustainable growth
• Marketing ROI at 5.3x, well above industry average

{"action": "show_card", "metric_id": "total-sales"}

INSTRUCTIONS:
1. ALWAYS provide detailed analysis when discussing specific metrics
2. Include the metric card using JSON format: {"action": "show_card", "metric_id": "metric-id"}
3. Use structured format with emojis and clear sections
4. Provide specific data points and percentages
5. Include actionable recommendations
6. Be concise but comprehensive
7. Focus on business impact and strategic insights
8. When showing charts, use: {"action": "show_chart", "metric_id": "metric-id"}
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

    const requestBody = await req.json();
    console.log('📨 Request body:', requestBody);
    const { message } = requestBody;
    
    if (!message) {
      console.error('❌ No message provided in request');
      throw new Error('No message provided');
    }
    
    console.log('📨 Received message:', message);

    console.log('🤖 Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
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
        max_tokens: 1200
      }),
    });

    console.log('📡 OpenAI response status:', response.status);
    console.log('📡 OpenAI response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenAI API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ OpenAI response received');
    console.log('📄 OpenAI response data:', data);
    
    const assistantMessage = data.choices[0].message.content;
    console.log('💬 Assistant message:', assistantMessage);

    const result = { 
      response: assistantMessage,
      timestamp: new Date().toISOString()
    };

    console.log('📤 Sending response back to client:', result);
    
    return new Response(JSON.stringify(result), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 200
    });
    
  } catch (error) {
    console.error('❌ Error in ai-assistant function:', error);
    console.error('❌ Error stack:', error.stack);
    
    const errorResponse = { 
      error: error.message || 'Unknown error occurred',
      response: 'Извините, произошла ошибка. Пожалуйста, попробуйте еще раз.',
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  }
});
