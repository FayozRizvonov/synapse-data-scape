import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

// See useAIAssistant: these were read from import.meta.env, which is unset in
// Vercel, so they resolved to `undefined` in production.
const SUPABASE_ANON_KEY = SUPABASE_PUBLISHABLE_KEY;

interface CardData {
  action: string;
  metric_id: string;
}

interface VoiceAssistantState {
  isListening: boolean;
  isTranscribing: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  status: string;
  transcript: string;
  response: string;
  cardData: CardData | null;
  error: string | null;
  isVoiceModalOpen: boolean;
  isAutoMode: boolean;
}

export const useVoiceAssistant = () => {
  const useStreaming = useFeatureFlag('streaming_orchestrator');

  const [state, setState] = useState<VoiceAssistantState>({
    isListening: false,
    isTranscribing: false,
    isProcessing: false,
    isPlaying: false,
    status: 'ready',
    transcript: '',
    response: '',
    cardData: null,
    error: null,
    isVoiceModalOpen: false,
    isAutoMode: true
  });

  // Initialize auto mode as enabled by default
  useEffect(() => {
    console.log('🏁 useVoiceAssistant initialized, auto mode enabled');
    isAutoModeRef.current = true;
  }, []);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const graceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const soundLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isAutoModeRef = useRef<boolean>(true);
  const startListeningRef = useRef<() => Promise<void>>();
  const isListeningRef = useRef<boolean>(false);
  const hasDetectedSoundRef = useRef<boolean>(false);
  const silenceStartRef = useRef<number>(Date.now());

  // Enable/disable auto mode
  const enableAutoMode = useCallback(() => {
    console.log('🔓 Enabling auto mode');
    isAutoModeRef.current = true;
  }, []);

  const disableAutoMode = useCallback(() => {
    console.log('🔒 Disabling auto mode');
    isAutoModeRef.current = false;
  }, []);

  // Open/close voice modal
  const openVoiceModal = useCallback(() => {
    // Enable auto mode when opening
    console.log('🔓 Opening voice modal, enabling auto mode');
    isAutoModeRef.current = true;
    setState(prev => ({ ...prev, isVoiceModalOpen: true }));
  }, []);

  const closeVoiceModal = useCallback(() => {
    // Disable auto mode when closing
    console.log('🔒 Closing voice modal, disabling auto mode');
    isAutoModeRef.current = false;
    
    setState(prev => ({ 
      ...prev, 
      isVoiceModalOpen: false,
      status: 'ready',
      transcript: '',
      response: '',
      cardData: null,
      error: null
    }));
    // stopListening will be called later
  }, []);

  // Start voice recording
  const startListening = useCallback(async () => {
    console.log('🎤 Starting voice assistant...');

    try {
      setState(prev => ({ 
        ...prev, 
        isListening: true, 
        status: 'listening', 
        error: null,
        transcript: '',
        response: '',
        cardData: null
      }));

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      console.log('✅ Microphone access granted');

      // Setup audio analysis for silence detection
      const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioContextConstructor();
      console.log('🎙️ AudioContext state:', audioContextRef.current.state);
      
      // If browser created AudioContext in suspended state, resume it
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        console.log('🔊 AudioContext resumed, new state:', audioContextRef.current.state);
      }
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      source.connect(analyserRef.current);
      
      console.log('🔗 Audio pipeline connected');
      
      // Test audio data retrieval
      setTimeout(() => {
        if (analyserRef.current) {
          const testData = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(testData);
          const testAverage = testData.reduce((a, b) => a + b) / testData.length;
          console.log('🧪 Test audio level:', testAverage.toFixed(2));
        }
      }, 500);

      // Setup MediaRecorder with optimal settings
      const preferredFormats = ['audio/webm;codecs=opus', 'audio/webm', 'audio/wav'];
      let selectedFormat = 'audio/webm';
      
      for (const format of preferredFormats) {
        if (MediaRecorder.isTypeSupported(format)) {
          selectedFormat = format;
          break;
        }
      }



      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: selectedFormat,
        audioBitsPerSecond: 256000
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        console.log('🛑 Recording stopped');
        await processRecording();
      };

      mediaRecorderRef.current.start(250); // Collect data every 250ms

      // Start silence detection after small grace period
      graceTimeoutRef.current = setTimeout(() => {
        // Ensure state is updated
        if (mediaRecorderRef.current?.state === 'recording') {
          startSilenceDetection();
        }
      }, 1000); // 1 second grace period for quick start

    } catch (error) {
      console.error('❌ Failed to start listening:', error);
      setState(prev => ({ 
        ...prev, 
        isListening: false, 
        status: 'error',
        error: 'Failed to access microphone' 
      }));
    }
  }, []);

        // Save references to functions and state for use in callback
  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  useEffect(() => {
    isListeningRef.current = state.isListening;
  }, [state.isListening]);

  // Stop voice recording
  const stopListening = useCallback(() => {
    console.log('🛑 Stopping voice assistant...');

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (graceTimeoutRef.current) {
      clearTimeout(graceTimeoutRef.current);
      graceTimeoutRef.current = null;
    }

    if (soundLevelIntervalRef.current) {
      clearInterval(soundLevelIntervalRef.current);
      soundLevelIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setState(prev => ({ ...prev, isListening: false }));
  }, []);

  // Silence detection
  const startSilenceDetection = useCallback(() => {
    if (!analyserRef.current) return;
    
    console.log('🎙️ Starting silence detection...');

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Reset sound detection state
    hasDetectedSoundRef.current = false;
    silenceStartRef.current = Date.now();

    const checkSilence = () => {
      // Check MediaRecorder directly
      if (!analyserRef.current || !mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
        console.log('🛑 Stopping silence detection - recording stopped');
        if (soundLevelIntervalRef.current) {
          clearInterval(soundLevelIntervalRef.current);
          soundLevelIntervalRef.current = null;
        }
        return;
      }

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      
      // Increase sound detection threshold for better recognition
      const soundThreshold = 15; // Increase threshold from 3 to 15
      const isSound = average > soundThreshold;
      
      console.log('🎚️ Audio level:', average.toFixed(2), 'threshold:', soundThreshold, 'hasDetectedSound:', hasDetectedSoundRef.current, 'isSound:', isSound);
      
      if (isSound) {
        if (!hasDetectedSoundRef.current) {
          console.log('🗣️ Speech detected! Starting silence timer...');
          hasDetectedSoundRef.current = true;
        }
        silenceStartRef.current = Date.now(); // Reset silence timer
        setState(prev => ({ ...prev, status: 'speaking' }));
      } else if (hasDetectedSoundRef.current) {
        // Count silence only after we've detected sound
        const silenceDuration = Date.now() - silenceStartRef.current;
        console.log('🔇 Silence duration:', silenceDuration, 'ms');
        
        setState(prev => ({ ...prev, status: 'silence_detected' }));
        
        // Stop recording after 2 seconds of silence
        if (silenceDuration > 2000) {
          console.log('🔇 Silence threshold reached, stopping recording');
          if (soundLevelIntervalRef.current) {
            clearInterval(soundLevelIntervalRef.current);
            soundLevelIntervalRef.current = null;
          }
          stopListening();
          return;
        }
      } else {
        // If we haven't detected speech yet, update status
        setState(prev => ({ ...prev, status: 'listening' }));
      }
    };

    // Use setInterval instead of requestAnimationFrame for more stable operation
    soundLevelIntervalRef.current = setInterval(checkSilence, 100); // Check every 100ms
    
    // Clear interval on unmount
    return () => {
      if (soundLevelIntervalRef.current) {
        clearInterval(soundLevelIntervalRef.current);
        soundLevelIntervalRef.current = null;
      }
    };
  }, [stopListening]);

  // Process recorded audio
  const processRecording = useCallback(async () => {
    console.log('🔄 Processing recording...');
    
    try {
      if (audioChunksRef.current.length === 0) {
        throw new Error('No recorded audio');
      }

      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      // Validate audio size
      if (audioBlob.size < 2048) { // Minimum 2KB
        throw new Error('Audio too short. Please speak longer.');
      }

      // Skip local transcription - will get transcript from server
      setState(prev => ({ 
        ...prev, 
        isTranscribing: true, 
        status: 'transcribing'
      }));

      // Send audio — streaming or non-streaming based on feature flag
      console.log(`🚀 Sending to ${useStreaming ? 'orchestrator-stream' : 'orchestrator'}...`);

      // Convert audio blob to base64
      const fileReader = new FileReader();
      const audioBase64 = await new Promise<string>((resolve, reject) => {
        fileReader.onload = () => {
          const result = fileReader.result as string;
          resolve(result.split(',')[1]);
        };
        fileReader.onerror = reject;
        fileReader.readAsDataURL(audioBlob);
      });

      const correlationId = crypto.randomUUID();

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token ?? SUPABASE_ANON_KEY;

      const voiceRequestBody = {
        correlation_id: correlationId,
        modality: 'voice',
        audioData: audioBase64,
        audioFormat: 'webm',
      };

      let transcriptReceived = '';
      let responseText = '';
      let cardData: { action: string; metric_id: string } | null = null;
      let assembledAudio = '';

      if (useStreaming) {
        // ── Streaming path ─────────────────────────────────────────────────
        let streamOk = false;
        try {
          const streamRes = await fetch(`${SUPABASE_URL}/functions/v1/orchestrator-stream`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify(voiceRequestBody),
          });
          if (!streamRes.ok || !streamRes.body) throw new Error(`Stream failed: ${streamRes.status}`);

          const audioChunks: string[] = [];
          const sseReader = streamRes.body.getReader();
          const decoder = new TextDecoder();
          let sseBuffer = '';
          try {
            while (true) {
              const { done, value } = await sseReader.read();
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
                if (evt.type === 'transcript') {
                  transcriptReceived = evt.transcript ?? '';
                  setState(prev => ({ ...prev, isTranscribing: false, status: 'processing', transcript: transcriptReceived }));
                } else if (evt.type === 'token' && evt.delta) {
                  responseText += evt.delta;
                  setState(prev => ({ ...prev, response: responseText }));
                } else if (evt.type === 'audio_chunk' && evt.chunk) {
                  audioChunks.push(evt.chunk as string);
                } else if (evt.type === 'done') {
                  if (evt.card) cardData = evt.card as { action: string; metric_id: string };
                } else if (evt.type === 'error') {
                  throw new Error(evt.message ?? 'Stream error');
                }
              }
            }
          } finally {
            sseReader.releaseLock();
          }
          assembledAudio = audioChunks.join('');
          streamOk = true;
        } catch (streamErr) {
          console.warn('⚠️ Voice stream failed, falling back to orchestrator:', streamErr);
        }

        if (!streamOk) {
          // Fallback to non-streaming orchestrator
          const { data, error: fnErr } = await supabase.functions.invoke('orchestrator', { body: voiceRequestBody });
          if (fnErr) throw fnErr;
          transcriptReceived = (data as any)?.transcript ?? '';
          responseText = (data as any)?.response ?? '';
          cardData = (data as any)?.card ?? null;
          assembledAudio = (data as any)?.audio ?? '';
        }
      } else {
        // ── Non-streaming path (default) ───────────────────────────────────
        let orchOk = false;
        try {
          const { data, error: fnErr } = await supabase.functions.invoke('orchestrator', { body: voiceRequestBody });
          if (fnErr) throw fnErr;
          transcriptReceived = (data as any)?.transcript ?? '';
          responseText = (data as any)?.response ?? '';
          cardData = (data as any)?.card ?? null;
          assembledAudio = (data as any)?.audio ?? '';
          orchOk = true;
        } catch (orchErr) {
          console.warn('⚠️ Orchestrator failed, falling back to voice-assistant:', orchErr);
        }

        if (!orchOk) {
          // Fallback to legacy voice-assistant
          const { data, error: legacyErr } = await supabase.functions.invoke('voice-assistant', {
            body: { audioData: audioBase64, audioFormat: 'webm' },
          });
          if (legacyErr) throw legacyErr;
          transcriptReceived = (data as any)?.transcript ?? '';
          responseText = (data as any)?.answer ?? '';
          cardData = (data as any)?.card ?? null;
          assembledAudio = (data as any)?.audio ?? '';
        }
      }

      if (!assembledAudio) {
        throw new Error('No audio data received from server');
      }

      console.log('✅ Voice processing complete');

      setState(prev => ({
        ...prev,
        isTranscribing: false,
        isProcessing: false,
        transcript: transcriptReceived || 'Speech not recognized',
        response: responseText || 'No response text',
        cardData,
        status: 'playing',
      }));

      // Play assembled audio
      await playAudioResponse(assembledAudio);

    } catch (error) {
      console.error('❌ Error processing recording:', error);
      setState(prev => ({ 
        ...prev, 
        isTranscribing: false,
        isProcessing: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Processing error' 
      }));
    }
  }, []);

  // Play audio response
  const playAudioResponse = useCallback(async (audioBase64: string) => {
    try {
      console.log('🔊 Playing audio response...');
      
      setState(prev => ({ ...prev, isPlaying: true }));

      // Validate audio base64
      if (!audioBase64 || typeof audioBase64 !== 'string') {
        throw new Error('No audio data received from server');
      }

      // Clean the base64 string (remove any whitespace/newlines)
      const cleanAudioBase64 = audioBase64.replace(/[^A-Za-z0-9+/=]/g, '');
      
      if (cleanAudioBase64.length === 0) {
        throw new Error('Empty audio data');
      }

      // Validate base64 format
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanAudioBase64)) {
        throw new Error('Invalid base64 audio format');
      }

      // Convert base64 to blob
      let audioData: string;
      try {
        audioData = atob(cleanAudioBase64);
      } catch (error) {
        console.error('❌ Base64 decode error:', error);
        throw new Error('Failed to decode audio data');
      }
      
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      
      if (audioArray.length === 0) {
        throw new Error('Empty audio buffer');
      }
      
      const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
      
      if (audioBlob.size === 0) {
        throw new Error('Empty audio blob');
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        console.log('✅ Audio playback completed');
        setState(prev => ({ ...prev, isPlaying: false, status: 'completed' }));
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        
        // Automatically start new listening after response completion
        console.log('🔍 Checking auto mode:', isAutoModeRef.current);
        console.log('🔍 Start listening ref available:', !!startListeningRef.current);
        
        if (isAutoModeRef.current) {
          setTimeout(() => {
            console.log('🔄 Auto-restarting listening...');
            console.log('🔍 Final check - auto mode:', isAutoModeRef.current);
            console.log('🔍 Final check - start function:', !!startListeningRef.current);
            // Use saved function for restart
            if (startListeningRef.current) {
              startListeningRef.current();
            } else {
              console.error('❌ startListeningRef.current is null!');
            }
          }, 1000); // Small pause before new listening
        } else {
          console.log('❌ Auto mode is disabled, not restarting');
        }
      };
      
      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        setState(prev => ({ 
          ...prev, 
          isPlaying: false, 
          status: 'error',
          error: 'Audio playback error' 
        }));
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };
      
      await audio.play();
      
    } catch (error) {
      console.error('❌ Error playing audio:', error);
      setState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        status: 'error',
        error: 'Failed to play audio' 
      }));
    }
  }, []);

  // Stop audio playback
  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // Complete shutdown - stops everything
  const shutdown = useCallback(() => {
    console.log('🛑 Complete voice assistant shutdown...');
    
    // Disable auto mode first
    isAutoModeRef.current = false;
    
    // Clear all timeouts and intervals
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (graceTimeoutRef.current) {
      clearTimeout(graceTimeoutRef.current);
      graceTimeoutRef.current = null;
    }

    if (soundLevelIntervalRef.current) {
      clearInterval(soundLevelIntervalRef.current);
      soundLevelIntervalRef.current = null;
    }

    // Stop audio playback
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }

    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped track:', track.label);
      });
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Reset all state
    setState(prev => ({ 
      ...prev, 
      isListening: false,
      isTranscribing: false,
      isProcessing: false,
      isPlaying: false,
      status: 'ready',
      transcript: '',
      response: '',
      cardData: null,
      error: null
    }));

    console.log('✅ Voice assistant completely shut down');
  }, []);

  // Update closeVoiceModal to properly stop listening
  useEffect(() => {
    if (!state.isVoiceModalOpen && state.isListening) {
      stopListening();
    }
  }, [state.isVoiceModalOpen, state.isListening, stopListening]);

  return {
    ...state,
    startListening,
    stopListening,
    stopAudio,
    shutdown,
    openVoiceModal,
    closeVoiceModal,
    enableAutoMode,
    disableAutoMode
  };
}; 