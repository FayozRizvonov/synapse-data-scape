import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
    // Включаем автоматический режим при открытии
    console.log('🔓 Opening voice modal, enabling auto mode');
    isAutoModeRef.current = true;
    setState(prev => ({ ...prev, isVoiceModalOpen: true }));
  }, []);

  const closeVoiceModal = useCallback(() => {
    // Отключаем автоматический режим при закрытии
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
    // stopListening будет вызван позже
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
      
      // Если браузер создал AudioContext в suspended состоянии, резюмируем его
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
      
      // Тестируем получение аудио данных
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
        // Убеждаемся что состояние обновилось
        if (mediaRecorderRef.current?.state === 'recording') {
          startSilenceDetection();
        }
      }, 1000); // 1 second grace period для быстрого старта

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

  // Сохраняем ссылки на функции и состояние для использования в callback
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
    
    // Сбрасываем состояние обнаружения звука
    hasDetectedSoundRef.current = false;
    silenceStartRef.current = Date.now();

    const checkSilence = () => {
      // Проверяем MediaRecorder напрямую
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
      
      // Повышаем порог обнаружения звука для лучшего распознавания
      const soundThreshold = 15; // Увеличиваем порог с 3 до 15
      const isSound = average > soundThreshold;
      
      console.log('🎚️ Audio level:', average.toFixed(2), 'threshold:', soundThreshold, 'hasDetectedSound:', hasDetectedSoundRef.current, 'isSound:', isSound);
      
      if (isSound) {
        if (!hasDetectedSoundRef.current) {
          console.log('🗣️ Speech detected! Starting silence timer...');
          hasDetectedSoundRef.current = true;
        }
        silenceStartRef.current = Date.now(); // Сбрасываем таймер тишины
        setState(prev => ({ ...prev, status: 'speaking' }));
      } else if (hasDetectedSoundRef.current) {
        // Считаем тишину только после того как обнаружили звук
        const silenceDuration = Date.now() - silenceStartRef.current;
        console.log('🔇 Silence duration:', silenceDuration, 'ms');
        
        setState(prev => ({ ...prev, status: 'silence_detected' }));
        
        // Останавливаем запись после 2 секунд тишины
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
        // Если еще не обнаружили речь, обновляем статус
        setState(prev => ({ ...prev, status: 'listening' }));
      }
    };

    // Используем setInterval вместо requestAnimationFrame для более стабильной работы
    soundLevelIntervalRef.current = setInterval(checkSilence, 100); // Проверяем каждые 100ms
    
    // Очищаем интервал при размонтировании
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

      // Send audio to voice assistant for full processing
      console.log('🚀 Sending to voice-assistant function...');
      
      // Convert audio blob to base64 for the voice assistant
      const reader = new FileReader();
      const audioBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1]; // Remove data:audio/webm;base64, prefix
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
      
      const { data, error } = await supabase.functions.invoke('voice-assistant', {
        body: {
          audioData: audioBase64,
          audioFormat: 'webm'
        }
      });

      if (error) {
        throw new Error(error.message || 'Server error');
      }

      console.log('✅ Server response received');
      
      if (!data) {
        throw new Error('No data received from voice assistant');
      }

      if (!data.audio || data.audio === '') {
        throw new Error('No audio data in server response');
      }

      if (data.error) {
        throw new Error(`Server error: ${data.error}`);
      }
      
      setState(prev => ({ 
        ...prev, 
        isTranscribing: false,
        isProcessing: false,
        transcript: data.transcript || 'Speech not recognized',
        response: data.answer || 'No response text',
        cardData: data.card || null,
        status: 'playing'
      }));

      // Play audio response
      await playAudioResponse(data.audio);

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
        
        // Автоматически начинаем новое прослушивание после завершения ответа
        console.log('🔍 Checking auto mode:', isAutoModeRef.current);
        console.log('🔍 Start listening ref available:', !!startListeningRef.current);
        
        if (isAutoModeRef.current) {
          setTimeout(() => {
            console.log('🔄 Auto-restarting listening...');
            console.log('🔍 Final check - auto mode:', isAutoModeRef.current);
            console.log('🔍 Final check - start function:', !!startListeningRef.current);
            // Используем сохраненную функцию для рестарта
            if (startListeningRef.current) {
              startListeningRef.current();
            } else {
              console.error('❌ startListeningRef.current is null!');
            }
          }, 1000); // Небольшая пауза перед новым прослушиванием
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