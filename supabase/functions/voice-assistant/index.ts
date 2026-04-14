import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
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

VOICE RESPONSE FORMAT REQUIREMENTS:

When responding to voice queries, you MUST provide responses in this EXACT format:

answer: [detailed AI response with analysis]
card: [JSON for metric card if needed, otherwise empty]

Examples:

🧠 User asks: "Show me QoQ Revenue Growth"

Your response:
answer: QoQ Revenue Growth Analysis: Xarelto's quarterly revenue growth is 6.4%, a 30.1% improvement over last quarter. Growth is driven by increased uptake in stroke clinics and a 9.2% rise in AFib patient adherence. Key drivers include stroke clinic prescriptions up 12% via targeted symposiums, South region outperformed with 82% rep coverage, and digital video content yielded 4.8x ROI. Strategic insights suggest expanding webinar series for stroke prevention awareness, addressing payer rejections in Central region, and leveraging South region's hybrid rep-digital model.
card: {"action": "show_card", "metric_id": "revenue"}

🧠 User asks: "Tell me about Total Sales performance"

Your response:
answer: Total Sales Performance Overview: Xarelto's total sales reached 20.8 million dollars, representing 82.4% of total revenue. Strong performance reflects high demand in stroke prevention and AFib indications. Performance breakdown shows base sales 11.5 million dollars, incremental revenue from marketing 2.3 million, seasonal factors 1.1 million, and market trend 700 thousand dollars. Business impact shows we're exceeding quarterly targets by 5.8%, marketing ROI at 2.6x above industry average, with opportunity to optimize Central region coverage.
card: {"action": "show_card", "metric_id": "total-sales"}

🧠 User asks: "How are we doing overall?"

Your response:
answer: Overall Performance Summary: Xarelto is performing exceptionally well across all key metrics. Revenue growth is at 6.4% with strong 30.1% quarter-over-quarter improvement. Patient acquisition is solid at 32.8% market share with 7.4% growth. Sample-to-script conversion is excellent at 1.7x ratio. Marketing ROI is outstanding at 2.6x return, and payer access score is strong at 85.6 points. All indicators show positive momentum particularly in stroke prevention and AFib treatment segments.
card: 

CRITICAL RULES:
1. ALWAYS start with "answer:" followed by your detailed analysis
2. ALWAYS end with "card:" followed by JSON if showing a metric card, or empty if no card
3. Keep audio responses conversational and natural
4. Include specific numbers and percentages
5. Provide actionable insights
6. Use clear, professional language suitable for speech
7. No emojis or special formatting in the answer section (voice will speak this)
8. Make responses informative but concise for voice delivery
`;

serve(async (req) => {
  console.log('=== Voice Assistant Function Called ===');
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
    console.log('Processing voice request...');
    
    if (!openAIApiKey) {
      console.error('❌ OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }
    console.log('✅ OpenAI API key found');

    // Normalize API key for safe use in HTTP headers
    const authHeaderValue = `Bearer ${String(openAIApiKey).trim()}`;

    const requestBody = await req.json();
    console.log('📨 Received voice request body keys:', Object.keys(requestBody));
    
    const { audioData, audioFormat = 'webm' } = requestBody;
    
    if (!audioData) {
      console.error('❌ No audio data provided');
      throw new Error('No audio data provided');
    }
    
    console.log('🎵 Audio data length:', audioData.length);
    console.log('🎵 Audio format:', audioFormat);

    // 1. Audio transcription via OpenAI Whisper
    console.log('🎤 Step 1: Transcribing audio with Whisper...');
    
    // Validate and decode base64 audio data
    let binaryData: Uint8Array;
    try {
      // Basic validation
      if (!audioData || typeof audioData !== 'string') {
        throw new Error('No audio data provided or invalid format');
      }
      
      // Clean the base64 string (remove whitespace/newlines)
      const cleanedAudioData = audioData.replace(/[^A-Za-z0-9+/=]/g, '');
      
      // Check for valid base64 characters and padding
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanedAudioData)) {
        throw new Error('Invalid base64 characters detected');
      }
      
      // Check size limit (base64 is ~4/3 of original size)
      const estimatedSize = (cleanedAudioData.length * 3) / 4;
      if (estimatedSize > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Audio file too large (max 10MB)');
      }
      
      console.log('🔍 Audio data validation:', {
        originalLength: audioData.length,
        cleanedLength: cleanedAudioData.length,
        estimatedSizeBytes: estimatedSize
      });
      
      // Decode base64 to binary
      const binaryString = atob(cleanedAudioData);
      const length = binaryString.length;
      binaryData = new Uint8Array(length);
      
      // Convert to Uint8Array
      for (let i = 0; i < length; i++) {
        binaryData[i] = binaryString.charCodeAt(i);
      }
      
      console.log('✅ Binary data decoded, length:', binaryData.length);
    } catch (error) {
      console.error('❌ Error decoding base64 audio:', error);
      console.error('❌ Audio data sample (first 100 chars):', audioData.substring(0, 100));
      throw new Error(`Invalid base64 audio data: ${error.message}`);
    }
    
    const inputAudioBlob = new Blob([binaryData], { type: `audio/${audioFormat}` });
    console.log('🎵 Audio blob size:', inputAudioBlob.size);
    
    if (inputAudioBlob.size === 0) {
      console.error('❌ Empty audio blob');
      throw new Error('Empty audio blob');
    }
    
    // Map audio formats to proper file extensions for Whisper
    const formatToExtension: { [key: string]: string } = {
      'webm': 'webm',
      'wav': 'wav', 
      'mp4': 'm4a',
      'mpeg': 'mp3',
      'm4a': 'm4a',
      'mp3': 'mp3'
    };
    
    const fileExtension = formatToExtension[audioFormat] || audioFormat;
    console.log('🎵 Using file extension for Whisper:', fileExtension);
    
    const formData = new FormData();
    formData.append('file', inputAudioBlob, `audio.${fileExtension}`);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'json');
    formData.append('temperature', '0.0');
    
    // Whisper prompt for better pharmaceutical context recognition
    const whisperPrompt = 'This is a business analytics discussion about pharmaceutical metrics, revenue, sales, performance data, QoQ growth, market access scores, prescriptions, sample-to-script ratios, ROI, rebate spend, total sales, base sales, incremental revenue, promotional spend, seasonality trends, F2F calls, virtual calls, phone calls, digital display, digital video channels.';
    formData.append('prompt', whisperPrompt);
    
    console.log('📡 Calling Whisper API...');
    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': authHeaderValue,
      },
      body: formData
    });

    console.log('📡 Whisper API response status:', transcriptionResponse.status);
    
    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('❌ Whisper API error:', transcriptionResponse.status, errorText);
      throw new Error(`Whisper API error: ${transcriptionResponse.status}`);
    }

    const transcriptionData = await transcriptionResponse.json();
    console.log('✅ Whisper transcription result:', transcriptionData);
    
    const transcript = transcriptionData.text?.trim();
    if (!transcript || transcript.length < 2 || transcript === '.' || transcript === ',' || transcript === '?') {
      console.error('❌ Empty or invalid transcript from Whisper:', transcript);
      console.log('📊 Audio processing details:', {
        originalSize: inputAudioBlob.size,
        audioFormat: audioFormat,
        transcriptLength: transcript?.length || 0,
        transcriptContent: transcript || 'empty'
      });
      
      // Return ready response with audio when speech is not recognized
      const fallbackText = "I couldn't understand your speech. Please speak more clearly and check that your microphone is working properly.";
      
      console.log('🔊 Generating fallback TTS audio...');
      const fallbackTtsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': authHeaderValue,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1-hd',
          voice: 'ash',
          input: fallbackText,
          response_format: 'mp3'
        }),
      });

      if (fallbackTtsResponse.ok) {
        const fallbackAudioBuffer = await fallbackTtsResponse.arrayBuffer();
        
        // Use Deno base64 encoding
        const fallbackAudioArray = new Uint8Array(fallbackAudioBuffer);
        const fallbackAudioBase64 = base64Encode(fallbackAudioArray);
        
        const fallbackResult = {
          transcript: transcript || '',
          answer: fallbackText,
          card: null,
          audio: fallbackAudioBase64,
          timestamp: new Date().toISOString()
        };
        
        return new Response(JSON.stringify(fallbackResult), {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
          status: 200
        });
      } else {
        throw new Error('No speech detected and TTS failed');
      }
    }

    console.log('🎤 Transcript:', transcript);

    // 2. Processing via GPT-4o
    console.log('🤖 Step 2: Processing with GPT-4o...');
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': authHeaderValue,
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
        temperature: 0.7,
        max_tokens: 1200
      }),
    });

    console.log('📡 GPT-4o response status:', chatResponse.status);
    
    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('❌ GPT-4o API error:', chatResponse.status, errorText);
      throw new Error(`GPT-4o API error: ${chatResponse.status}`);
    }

    const chatData = await chatResponse.json();
    console.log('✅ GPT-4o response received');
    console.log('🤖 AI response:', chatData.choices[0].message.content);
    
    const aiResponse = chatData.choices[0].message.content;
    
    // 3. Parsing AI response
    console.log('📝 Step 3: Parsing AI response...');
    const answerMatch = aiResponse.match(/answer:\s*(.*?)(?=card:|$)/s);
    const cardMatch = aiResponse.match(/card:\s*(.*?)$/s);
    
    const answerText = answerMatch ? answerMatch[1].trim() : aiResponse;
    const cardText = cardMatch ? cardMatch[1].trim() : '';
    
    console.log('📝 Parsed answer:', answerText);
    console.log('📝 Parsed card:', cardText);
    
    let cardData = null;
    if (cardText && cardText !== '') {
      try {
        cardData = JSON.parse(cardText);
        console.log('✅ Parsed card JSON:', cardData);
      } catch (error) {
        console.warn('⚠️ Failed to parse card JSON:', error);
      }
    }

    // 4. Audio generation via TTS
    console.log('🔊 Step 4: Generating audio with TTS...');
    
    // Limit text length for TTS (4096 characters - OpenAI limit)
    const maxTtsLength = 4000;
    const ttsText = answerText.length > maxTtsLength 
      ? answerText.substring(0, maxTtsLength) + '...'
      : answerText;
    
    console.log('🔊 TTS text length:', ttsText.length);
    
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': authHeaderValue,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        voice: 'ash',
        input: ttsText,
        response_format: 'mp3'
      }),
    });

    console.log('📡 TTS response status:', ttsResponse.status);
    
    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('❌ TTS API error:', ttsResponse.status, errorText);
      throw new Error(`TTS API error: ${ttsResponse.status}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    
            // Use built-in Deno functions for base64 encoding
    const audioArray = new Uint8Array(audioBuffer);
    const audioBase64 = base64Encode(audioArray);
    
    console.log('✅ Generated audio length:', audioBase64.length);
    console.log('✅ Audio base64 sample (first 100 chars):', audioBase64.substring(0, 100));

    // Validate audio base64 before sending
    if (!audioBase64 || audioBase64.length === 0) {
      console.error('❌ Empty audio base64 generated');
      throw new Error('Failed to generate audio');
    }

    // 5. Forming final response
    const result = {
      transcript,
      answer: answerText,
      card: cardData,
      audio: audioBase64,
      timestamp: new Date().toISOString()
    };

    console.log('📤 Sending final response:', {
      transcript: result.transcript,
      answerLength: result.answer.length,
      hasCard: !!result.card,
      audioLength: result.audio.length,
      timestamp: result.timestamp
    });
    
    return new Response(JSON.stringify(result), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 200
    });
    
  } catch (error) {
    console.error('❌ Error in voice-assistant function:', error);
    console.error('❌ Error stack:', error.stack);
    
    const errorResponse = { 
      error: error.message || 'Unknown error occurred',
      transcript: '',
      answer: 'Sorry, an error occurred. Please try again.',
      card: null,
      audio: '', // Empty string instead of null
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