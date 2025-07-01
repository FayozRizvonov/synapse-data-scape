import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const metricsContext = `
You are CLAIRE AI Assistant, an advanced business intelligence system for pharmaceutical analytics, specializing in Bayer's Xarelto (rivaroxaban) for cardiovascular health, including stroke prevention, atrial fibrillation (AFib), and venous thromboembolism.

AVAILABLE METRICS:

1. KEY METRICS:
- revenue: QoQ Revenue Growth: 6.4% (+30.1% vs last quarter) - Driven by stroke clinic uptake and AFib adherence
- prescriptions: Patient Share / Prescriptions: 32.8% (+7.4% vs last quarter) - Strong acquisition in South region
- sample-ratio: Sample-to-Script Ratio: 1.7x (+18.2% vs last quarter) - Improved sampling in stroke clinics
- payer-access: Payer Access Score: 85.6 (+10.2% vs last quarter) - Strong formulary positioning
- roi: Promotion ROI: 2.6x (+20.5% vs last quarter) - Excellent digital and phone channel efficiency

2. SITUATION METRICS:
- total-sales: Total Sales: $20.8M (+82.4% Total Revenue) - Strong baseline and marketing-driven growth
- base-sales: Base Sales: $11.5M (+91.2% Revenue Attribution) - Solid baseline without marketing
- incremental: Incremental Revenue: $2.3M (+17.5% Incremental Revenue) - Marketing-driven growth
- promotional-spend: Promotional Spend: $3.5M (+11.8% Total Budget) - Balanced allocation
- seasonality: Seasonality: $1.1M (+6.5% Revenue Attribution) - Q4 peak for AFib awareness
- trend: Market Trend: $0.7M (+2.0% Revenue Attribution) - Steady upward trend
- f2f-calls: F2F Calls: $1.0M (+6.8% Revenue Attribution) - Decline in Central region coverage
- web-virtual-calls: Web Virtual Calls: $1.0M (+2.3x ROI) - Strong in stroke clinics
- phone-calls: Phone Calls ABC: $1.5M (+2.6x ROI) - Top performer in cardiologist outreach
- digital-display: Digital Pharma Display: $0.6M (+1.7x ROI) - Moderate performance
- digital-video: Digital Pharma Video: $1.3M (+2.5x ROI) - Best digital channel for stroke prevention

RESPONSE FORMAT REQUIREMENTS:

When a user asks about a specific metric, you MUST:
1. Provide a detailed analysis of the current situation
2. Include the metric card using the JSON format
3. Give actionable insights and recommendations

Example responses:

🧠 Prompt: "Show me QoQ Revenue Growth"

AI Response:
✅ QoQ Revenue Growth Analysis: Xarelto's quarterly revenue growth is 6.4%, a 30.1% improvement over last quarter. Growth is driven by increased uptake in stroke clinics and a 9.2% rise in AFib patient adherence.

🔍 Key Drivers:
• Stroke clinic prescriptions up 12% via targeted symposiums
• South region outperformed with 82% rep coverage
• Digital video content yielded 4.8x ROI

💡 Strategic Insights:
• Expand webinar series for stroke prevention awareness
• Address payer rejections in Central region
• Leverage South region's hybrid rep-digital model

{"action": "show_card", "metric_id": "revenue"}

🧠 Prompt: "Tell me about Total Sales performance"

AI Response:
📊 Total Sales Performance Overview: Xarelto's total sales reached $20.8M, representing 82.4% of total revenue. Strong performance reflects high demand in stroke prevention and AFib indications.

🔍 Performance Breakdown:
• Base sales: $11.5M (55% of total)
• Incremental revenue from marketing: $2.3M
• Seasonal factors: $1.1M
• Market trend: $0.7M

💡 Business Impact:
• Exceeding quarterly targets by 5.8%
• Marketing ROI at 2.6x, above industry average
• Opportunity to optimize Central region coverage

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
    const { message } = requestBody;
    console.log('📨 Received message:', message);

    console.log('🤖 Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
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
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenAI API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ OpenAI response received');
    
    const assistantMessage = data.choices[0].message.content;
    const result = {
      response: assistantMessage,
      timestamp: new Date().toISOString()
    };

    console.log('📤 Sending response back to client');
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });

  } catch (error) {
    console.error('❌ Error in ai-assistant function:', error);
    const errorResponse = {
      error: error.message || 'Unknown error occurred',
      response: 'Sorry, an error occurred. Please try again.',
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}); 