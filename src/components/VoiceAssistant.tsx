import React, { useEffect, useCallback } from 'react';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { VoiceButton, VoiceVisualizer } from './VoiceVisualizer';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceAssistantProps {
  className?: string;
  showTranscript?: boolean;
  autoSpeak?: boolean;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  className,
  showTranscript = true,
  autoSpeak = true
}) => {
  const {
    isListening,
    isTranscribing,
    isProcessing,
    isPlaying,
    status,
    transcript,
    response,
    error,
    isVoiceModalOpen,
    startListening,
    stopListening,
    stopAudio,
    shutdown,
    openVoiceModal,
    closeVoiceModal
  } = useVoiceAssistant();

  const { lastAIResponse } = useAIAssistant();

  // Cleanup при размонтировании компонента
  useEffect(() => {
    return () => {
      // При размонтировании компонента полностью отключаем голосовой ассистент
      shutdown();
    };
  }, [shutdown]);

  const handleToggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      // Stop audio playback before starting recording
      if (isPlaying) {
        stopAudio();
      }
      startListening();
    }
  }, [isListening, isPlaying, startListening, stopListening, stopAudio]);

  const handleStopAudio = useCallback(() => {
    stopAudio();
  }, [stopAudio]);

  const clearError = useCallback(() => {
    // Can be implemented in the hook if needed
  }, []);

  const isSupported = typeof window !== 'undefined' && 
    navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia;

  if (!isSupported) {
    return (
      <Alert className="mb-4 backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-xl">
        <AlertDescription className="text-slate-800 dark:text-white/70">
          Your browser doesn't support voice recording. 
          Please use a modern browser (Chrome, Edge, Safari).
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main voice assistant container with glass effect */}
      <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
        {/* Main voice assistant button */}
        <div className="flex items-center justify-center mb-4">
          <VoiceButton
            isListening={isListening}
            isSpeaking={isPlaying}
            isProcessing={isProcessing || isTranscribing}
            onToggle={handleToggleListening}
            disabled={!isSupported}
            className="w-16 h-16"
          />
        </div>

        {/* State visualization */}
        <VoiceVisualizer
          isListening={isListening}
          isSpeaking={isPlaying}
          isProcessing={isProcessing || isTranscribing}
          className="justify-center mb-4"
        />

        {/* Voice mode indicator */}
        {isListening && (
          <div className="text-center mb-4">
            <div className="inline-flex items-center px-4 py-2 rounded-full backdrop-blur-[2px] bg-white/5 border border-cyan-500/30 dark:border-cyan-400/30 text-cyan-600 dark:text-cyan-400 text-sm shadow-md hover:bg-white/10 transition-all duration-300">
              <Mic className="w-4 h-4 mr-2" />
              Voice mode active
            </div>
          </div>
        )}

        {/* Stop speaking button */}
        {isPlaying && (
          <div className="flex justify-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleStopAudio}
              className="flex items-center space-x-2 backdrop-blur-[2px] bg-white/5 border border-white/10 text-slate-800 dark:text-white/70 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-md"
            >
              <MicOff className="w-4 h-4" />
              <span>Stop speaking</span>
            </Button>
          </div>
        )}
      </div>

      {/* Transcript (if enabled) */}
      {showTranscript && transcript && (
        <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-800 dark:text-white/70">
              Recognized text:
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Clear transcript
                // This can be added to the hook, but for now leave it as is
              }}
              className="text-slate-600 dark:text-white/40 hover:text-slate-800 dark:hover:text-white/70 transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-slate-900 dark:text-white">
            {transcript}
          </p>
        </div>
      )}

      {/* Errors */}
      {error && (
        <Alert variant="destructive" className="backdrop-blur-[2px] bg-white/5 border border-red-500/30 dark:border-red-400/30 rounded-xl shadow-md">
          <AlertDescription className="flex items-center justify-between">
            <span className="text-red-600 dark:text-red-400">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="h-auto p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}


    </div>
  );
};

// Compact version for embedding in other components
export const VoiceAssistantCompact: React.FC<{
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
}> = ({ className, size = 'md', theme }) => {
  const {
    isListening,
    isTranscribing,
    isProcessing,
    isPlaying,
    status,
    transcript,
    response,
    error,
    isVoiceModalOpen,
    startListening,
    stopListening,
    stopAudio,
    shutdown,
    openVoiceModal,
    closeVoiceModal
  } = useVoiceAssistant();

  const { lastAIResponse } = useAIAssistant();

  const handleToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      if (isPlaying) {
        stopAudio();
      }
      startListening();
    }
  }, [isListening, isPlaying, startListening, stopListening, stopAudio]);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const isSupported = typeof window !== 'undefined' && 
    navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia;

  return (
    <div className={cn("flex items-center justify-center backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-md", className)}>
      <VoiceButton
        isListening={isListening}
        isSpeaking={isPlaying}
        isProcessing={isProcessing || isTranscribing}
        onToggle={handleToggle}
        disabled={!isSupported}
        className={sizeClasses[size]}
        theme={theme}
      />
    </div>
  );
};

// Check if voice recording is supported
const isSupported = typeof window !== 'undefined' && 
  navigator.mediaDevices && 
  navigator.mediaDevices.getUserMedia; 