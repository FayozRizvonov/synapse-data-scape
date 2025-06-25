import { useState, useCallback, useRef, useEffect } from 'react';
import { useAIAssistant } from './useAIAssistant';
import { supabase } from '@/integrations/supabase/client';

// Types for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    webkitAudioContext?: typeof AudioContext;
  }
}

export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
  isVoiceMode: boolean;
}

export const useVoiceAssistant = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    transcript: '',
    error: null,
    isVoiceMode: false,
  });

  const { sendMessage, lastAIResponse } = useAIAssistant();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Track last spoken message
  const lastSpokenMessageRef = useRef<string>('');
  const lastAIResponseAtVoiceModeActivationRef = useRef<string | null>(null);

  // Web Speech API initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US'; // Set to English

        recognitionRef.current.onstart = () => {
          setVoiceState(prev => ({ ...prev, isListening: true, error: null }));
        };

        recognitionRef.current.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          setVoiceState(prev => ({
            ...prev,
            transcript: finalTranscript + interimTranscript
          }));

          // If there is a final result, send it
          if (finalTranscript.trim()) {
            handleVoiceMessage(finalTranscript.trim());
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setVoiceState(prev => ({
            ...prev,
            isListening: false,
            error: `Speech recognition error: ${event.error}`
          }));
        };

        recognitionRef.current.onend = () => {
          setVoiceState(prev => ({ ...prev, isListening: false }));
        };
      }

      // Speech Synthesis
      synthesisRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current && utteranceRef.current) {
        synthesisRef.current.cancel();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Reset voice mode on initialization
  useEffect(() => {
    setVoiceState(prev => ({ 
      ...prev, 
      isVoiceMode: false,
      isListening: false,
      isSpeaking: false,
      isProcessing: false,
      transcript: '',
      error: null
    }));
  }, []);

  const handleVoiceMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    setVoiceState(prev => ({ ...prev, isProcessing: true, transcript: '' }));

    try {
      // Use existing sendMessage for text requests
      await sendMessage(message);
    } catch (error) {
      setVoiceState(prev => ({
        ...prev,
        error: 'Error processing message'
      }));
    } finally {
      setVoiceState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [sendMessage]);

  // New function for handling audio through Edge Function
  const handleAudioMessage = useCallback(async (audioBlob: Blob) => {
    setVoiceState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Convert Blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64Audio = btoa(String.fromCharCode(...uint8Array));

      // Send to voice-assistant Edge Function
      const { data, error } = await supabase.functions.invoke('voice-assistant', {
        body: {
          audioData: base64Audio,
          audioFormat: audioBlob.type.split('/')[1] || 'webm'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.transcript) {
        setVoiceState(prev => ({ ...prev, transcript: data.transcript }));
      }

      if (data.response) {
        // Send response to chat
        await sendMessage(data.response);
      }

      if (data.audio) {
        // Play audio response
        playAudioFromBase64(data.audio);
      }

    } catch (error) {
      console.error('Voice processing error:', error);
      setVoiceState(prev => ({
        ...prev,
        error: 'Error processing voice request'
      }));
    } finally {
      setVoiceState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [sendMessage]);

  const playAudioFromBase64 = useCallback((base64Audio: string) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioData = atob(base64Audio);
      const audioArray = new Uint8Array(audioData.length);
      
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }

      audioContext.decodeAudioData(audioArray.buffer, (buffer) => {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        
        setVoiceState(prev => ({ ...prev, isSpeaking: true }));
        
        source.onended = () => {
          setVoiceState(prev => ({ ...prev, isSpeaking: false }));
        };
        
        source.start(0);
      });
    } catch (error) {
      console.error('Audio playback error:', error);
      setVoiceState(prev => ({ ...prev, isSpeaking: false }));
    }
  }, []);

  const startListening = useCallback(async () => {
    if (recognitionRef.current && !voiceState.isListening) {
      try {
        // Request access to microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Set up MediaRecorder for recording audio
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await handleAudioMessage(audioBlob);
        };

        // Start recording
        mediaRecorderRef.current.start();
        
        // Start speech recognition
        recognitionRef.current.start();
      } catch (error) {
        setVoiceState(prev => ({
          ...prev,
          error: 'Failed to access microphone'
        }));
      }
    }
  }, [voiceState.isListening, handleAudioMessage]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && voiceState.isListening) {
      recognitionRef.current.stop();
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [voiceState.isListening]);

  const speak = useCallback((text: string) => {
    if (!synthesisRef.current) return;

    // Additional check: speak only in voice mode
    if (!voiceState.isVoiceMode) {
      console.log('Voice mode not active, skipping speech');
      return;
    }

    // Check if we've already spoken this message
    if (lastSpokenMessageRef.current === text) {
      console.log('Message already spoken, skipping...');
      return;
    }

    // Stop previous playback
    synthesisRef.current.cancel();

    utteranceRef.current = new SpeechSynthesisUtterance(text);
    utteranceRef.current.lang = 'en-US'; // Set to English
    utteranceRef.current.rate = 0.9; // Slightly slower for better understanding
    utteranceRef.current.pitch = 0.8; // Lower voice (male)
    utteranceRef.current.volume = 1.0; // Full volume

    // Try to find a male voice
    const voices = synthesisRef.current.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.includes('en') && 
      (voice.name.includes('Google') || voice.name.includes('Natural') || voice.name.includes('Premium')) &&
      voice.name.toLowerCase().includes('male')
    ) || voices.find(voice => 
      voice.lang.includes('en') && 
      (voice.name.includes('Google') || voice.name.includes('Natural') || voice.name.includes('Premium'))
    );
    
    if (preferredVoice) {
      utteranceRef.current.voice = preferredVoice;
    }

    utteranceRef.current.onstart = () => {
      setVoiceState(prev => ({ ...prev, isSpeaking: true }));
      lastSpokenMessageRef.current = text; // Remember spoken message
    };

    utteranceRef.current.onend = () => {
      setVoiceState(prev => ({ ...prev, isSpeaking: false }));
    };

    utteranceRef.current.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setVoiceState(prev => ({
        ...prev,
        isSpeaking: false,
        error: 'Error during speech synthesis'
      }));
    };

    synthesisRef.current.speak(utteranceRef.current);
  }, [voiceState.isVoiceMode]);

  const stopSpeaking = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setVoiceState(prev => ({ ...prev, isSpeaking: false }));
    }
  }, []);

  const clearError = useCallback(() => {
    setVoiceState(prev => ({ ...prev, error: null }));
  }, []);

  // Function to activate voice mode
  const activateVoiceMode = useCallback(() => {
    setVoiceState(prev => ({ ...prev, isVoiceMode: true }));
    // Remember last message at activation
    lastAIResponseAtVoiceModeActivationRef.current = lastAIResponse?.text || null;
  }, [lastAIResponse]);

  // Function to deactivate voice mode
  const deactivateVoiceMode = useCallback(() => {
    setVoiceState(prev => ({ 
      ...prev, 
      isVoiceMode: false,
      isListening: false,
      isSpeaking: false,
      isProcessing: false,
      transcript: ''
    }));
    // Stop all processes
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Automatic playback only in voice mode
  useEffect(() => {
    if (
      voiceState.isVoiceMode &&
      lastAIResponse?.text &&
      !voiceState.isSpeaking &&
      lastAIResponse.text !== lastAIResponseAtVoiceModeActivationRef.current // Only if new message
    ) {
      const timer = setTimeout(() => {
        speak(lastAIResponse.text);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [lastAIResponse, voiceState.isVoiceMode, voiceState.isSpeaking, speak]);

  return {
    voiceState,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    clearError,
    activateVoiceMode,
    deactivateVoiceMode,
  };
}; 