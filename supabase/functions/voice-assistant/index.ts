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
- QoQ Revenue Growth (id: revenue): 8.7% (+40.3% vs last quarter)
- Patient Share / Prescriptions (id: prescriptions): 34.2% (+8.6% vs last quarter) 
- Sample-to-Script Ratio (id: sample-ratio): 1.8x (+20.0% vs last quarter)
- Rebate Spend vs ROI (id: roi): 4.3x (+16.2% vs last quarter)
- Market Access Score (id: market-access): 87.3 (+12.1% vs last quarter)

Situation Metrics:
- Base Sales (id: base-sales): $12.0M (+93.14% Revenue Attribution)
- Seasonality (id: seasonality): $1.2M (+6.86% Revenue Attribution)
- Trend (id: trend): $0.8M (+2.1% Revenue Attribution)
- Digital Pharma Display (id: digital-display): $0.9M (+2.1x ROI)
- Digital Pharma Video (id: digital-video): $1.2M (+2.4x ROI)
- Page Visit ViV Exchange (id: page-visit-exchange): $0.5M (+1.8x ROI)
- Medscape HiV Brand Alert (id: medscape-alert): $0.7M (+1.8x ROI)
- OLA Attendees (id: ola-attendees): $0.4M (+1.4x ROI)
- OOH Pharma (id: ooh-pharma): $0.6M (+1.6x ROI)
- Phone Calls ABC (id: phone-calls): $1.3M (+2.5x ROI)
- Veeva Emails (id: veeva-emails): $0.8M (+1.9x ROI)
- Web Virtual Calls ABC (id: web-virtual-calls): $1.1M (+2.2x ROI)

INSTRUCTIONS:
1. When users ask about specific metrics, provide detailed information and ALWAYS include the metric card
2. If they want to see a card, respond with: {"action": "show_card", "metric_id": "metric-id"}
3. If they want to see a chart, respond with: {"action": "show_chart", "metric_id": "metric-id"}
4. Always be helpful and provide insights about the data
5. Respond in English - this is the primary language for the voice assistant
6. You can analyze trends, provide recommendations, and explain metric relationships
7. When users ask for "more information" or "details", show the expanded card with charts
8. Always include relevant metric cards when discussing performance, trends, or specific channels
9. Keep responses conversational and natural for voice interaction
10. Avoid repeating information that was already mentioned in the conversation
11. Be concise but informative for voice responses
12. Use professional but friendly tone

EXAMPLES:
User: "How are Base Sales performing?"
Response: "Base Sales is showing excellent results! The current value is $12.0M with an impressive +93.14% Revenue Attribution growth. This represents baseline revenue without marketing efforts, indicating strong market positioning for the product. {"action": "show_card", "metric_id": "base-sales"}"

User: "Show me Digital Display chart"
Response: "Digital Pharma Display campaign is performing well with $0.9M revenue and 2.1x ROI. The campaign shows strong efficiency in digital advertising with optimal frequency of 8/month and 2-week response lag. {"action": "show_chart", "metric_id": "digital-display"}"

User: "Tell me about revenue growth"
Response: "QoQ Revenue Growth is showing excellent momentum! Current growth stands at 8.7%, which is 40.3% higher than last quarter. This indicates strong strategy execution and marketing effectiveness. Growth is driven by a combination of factors: improved market access, effective digital campaigns, and strong sales force performance. {"action": "show_card", "metric_id": "revenue"}"

User: "Show me Phone Calls chart"
Response: "Phone Calls ABC demonstrates outstanding results with $1.3M revenue and 2.5x ROI. This is one of our most effective campaigns! Recommended spend is $520K with optimal frequency of 15/month and quick response lag of 1 week. {"action": "show_chart", "metric_id": "phone-calls"}"

User: "What's the current situation with digital campaigns?"
Response: "Digital campaigns are performing excellently! Digital Pharma Video leads with $1.2M revenue and 2.4x ROI, followed by Digital Pharma Display with $0.9M and 2.1x ROI. Page Visit ViV Exchange shows $0.5M with 1.8x ROI. All campaigns demonstrate above-average efficiency. {"action": "show_card", "metric_id": "digital-video"}"

User: "Give me more information about Base Sales"
Response: "Of course! Base Sales represents baseline revenue without marketing efforts in the marketing mix model. Current value of $12.0M with +93.14% growth shows strong market positioning. Confidence Interval is 85%, P-value 0.01, indicating statistical significance. Data covers 2019-2023 period. {"action": "show_card", "metric_id": "base-sales"}"
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioData, audioFormat = 'webm' } = await req.json();
    
    console.log('Received voice request, audio format:', audioFormat);

    // 1. Транскрипция аудио через OpenAI Whisper
    const formData = new FormData();
    formData.append('file', new Blob([audioData], { type: `audio/${audioFormat}` }), `audio.${audioFormat}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'json');
    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData
    });

    if (!transcriptionResponse.ok) {
      throw new Error(`Whisper API error: ${transcriptionResponse.statusText}`);
    }

    const transcriptionData = await transcriptionResponse.json();
    const transcript = transcriptionData.text;
    
    console.log('Transcription:', transcript);

    // 2. Отправка текста в GPT-4o
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: transcript 
          }
        ],
        temperature: 0.5,
        max_tokens: 800
      }),
    });

    if (!chatResponse.ok) {
      throw new Error(`Chat API error: ${chatResponse.statusText}`);
    }

    const chatData = await chatResponse.json();
    const assistantMessage = chatData.choices[0].message.content;
    
    console.log('AI Response:', assistantMessage);

    // 3. Синтез речи через OpenAI TTS с голосом Ash
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        input: `<speak><break time='200ms'/>${assistantMessage}<break time='500ms'/></speak>`,
        voice: 'ash',
        response_format: 'mp3',
        speed: 1.1
      }),
    });

    if (!ttsResponse.ok) {
      throw new Error(`TTS API error: ${ttsResponse.statusText}`);
    }

    const audioBlob = await ttsResponse.blob();
    const audioArrayBuffer = await audioBlob.arrayBuffer();
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioArrayBuffer)));

    return new Response(JSON.stringify({ 
      transcript,
      response: assistantMessage,
      audio: audioBase64,
      audioFormat: 'mp3',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in voice-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      transcript: '',
      response: 'Sorry, there was an error processing your voice request.',
      audio: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 