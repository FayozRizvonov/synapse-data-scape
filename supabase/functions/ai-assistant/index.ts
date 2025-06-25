
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const metricsContext = `
You are GSIS AI Assistant, an advanced business intelligence system for pharmaceutical analytics. You provide structured, actionable insights based on comprehensive data analysis.

AVAILABLE DATA SECTIONS:

1. KEY METRICS:
- QoQ Revenue Growth: 8.7% (+40.3% vs last quarter) - Strong growth driven by new respiratory product line
- Patient Share / Prescriptions: 34.2% (+8.6% vs last quarter) - Strong patient acquisition and retention
- Sample-to-Script Ratio: 1.8x (+20.0% vs last quarter) - Excellent conversion efficiency
- Rebate Spend vs ROI: 4.3x (+16.2% vs last quarter) - Outstanding rebate program efficiency
- Market Access Score: 87.3 (+12.1% vs last quarter) - Strong market access positioning

2. CURRENT SITUATION (Situation (now)):
- Total Sales: $21.3M (+85.2% Total Revenue) - Outstanding total sales performance
- Base Sales: $12.0M (+93.14% Revenue Attribution) - Strong baseline revenue without marketing efforts
- Incremental: $2.5M (+18.2% Incremental Revenue) - Strong marketing-driven revenue growth
- Promotional Spend: $3.7M (+12.5% Total Promotional Budget) - Well-balanced promotional spend allocation
- ROI: 5.3x (+21.7% Return on Investment) - Excellent overall ROI performance
- Seasonality: $1.2M (+6.86% Revenue Attribution) - Clear seasonal patterns identified
- Trend: $0.8M (+2.1% Revenue Attribution) - Strong upward market trend

3. CHANNEL PERFORMANCE:
- F2F Calls: $1.1M (+7.5% Revenue Attribution) - F2F rep engagement saw 12% decline
- Web Virtual Calls: $0.9M (+5.2% Revenue Attribution) - Strong virtual call performance
- Symposium: $0.7M (+3.9% Revenue Attribution) - Good symposium performance
- SFMC Emails: $0.5M (+2.7% Revenue Attribution) - Email ROI = 3.4x (↑ driven by targeted disease awareness campaign)
- Promotion: $2.1M (+15.3% Revenue Attribution) - Strong promotional impact

RESPONSE FORMAT REQUIREMENTS:

You MUST respond in the exact format shown in the examples below. Use emojis, structured sections, and actionable insights:

🧠 Prompt 1: "What are the key insights for PharmaNova in Q2?"

AI Agent Response:

✅ Sales Growth: PharmaNova's Q2 revenue grew by 7.2% QoQ, primarily driven by higher uptake of the new respiratory product line.

🔍 Underperforming Region: The Northern region underperformed, contributing only 14% to national sales vs. a 20% target.

📉 Lagging Channel: F2F rep engagement saw a 12% decline, impacting prescription lift in Tier 2 cities.

💡 Recommendation: Reallocate 15% of digital spend to re-engage physicians in underperforming regions with targeted video content. Introduce hybrid rep-digital programs to improve HCP access.

INSTRUCTIONS:
1. ALWAYS use the structured format with emojis and clear sections
2. Provide specific data points and percentages
3. Include actionable recommendations
4. Show relevant metric cards when discussing specific metrics
5. Use the exact response format from the examples above
6. Be concise but comprehensive
7. Focus on actionable insights and business impact
8. When showing cards, use: {"action": "show_card", "metric_id": "metric-id"}
9. When showing charts, use: {"action": "show_chart", "metric_id": "metric-id"}
`;

serve(async (req) => {
  console.log('Received request:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      headers: corsHeaders,
      status: 200 
    });
  }

  try {
    console.log('Processing request...');
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    const requestBody = await req.json();
    const { message } = requestBody;
    
    console.log('Received message:', message);

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

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');
    
    const assistantMessage = data.choices[0].message.content;

    const result = { 
      response: assistantMessage,
      timestamp: new Date().toISOString()
    };

    console.log('Sending response back to client');
    
    return new Response(JSON.stringify(result), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 200
    });
    
  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    
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
