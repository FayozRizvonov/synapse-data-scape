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
    voiceState,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    clearError,
    activateVoiceMode,
    deactivateVoiceMode
  } = useVoiceAssistant();

  const { lastAIResponse } = useAIAssistant();

  const handleToggleListening = useCallback(() => {
    if (voiceState.isListening) {
      stopListening();
      deactivateVoiceMode(); // Deactivate voice mode when stopping
    } else {
      // Stop speaking before starting recording
      if (voiceState.isSpeaking) {
        stopSpeaking();
      }
      activateVoiceMode(); // Activate voice mode when starting recording
      startListening();
    }
  }, [voiceState.isListening, voiceState.isSpeaking, startListening, stopListening, stopSpeaking, activateVoiceMode, deactivateVoiceMode]);

  const handleStopSpeaking = useCallback(() => {
    stopSpeaking();
  }, [stopSpeaking]);

  const isSupported = typeof window !== 'undefined' && 
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  if (!isSupported) {
    return (
      <Alert className="mb-4">
        <AlertDescription>
          Your browser doesn't support speech recognition. 
          Please use a modern browser (Chrome, Edge, Safari).
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main voice assistant button */}
      <div className="flex items-center justify-center">
        <VoiceButton
          isListening={voiceState.isListening}
          isSpeaking={voiceState.isSpeaking}
          isProcessing={voiceState.isProcessing}
          onToggle={handleToggleListening}
          disabled={!isSupported}
          className="w-16 h-16"
        />
      </div>

      {/* State visualization */}
      <VoiceVisualizer
        isListening={voiceState.isListening}
        isSpeaking={voiceState.isSpeaking}
        isProcessing={voiceState.isProcessing}
        className="justify-center"
      />

      {/* Voice mode indicator */}
      {voiceState.isVoiceMode && (
        <div className="text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-blue/20 border border-blue-500/30 text-blue-200 text-sm backdrop-blur-xl">
            <Mic className="w-4 h-4 mr-2" />
            Voice mode active
          </div>
        </div>
      )}

      {/* Transcript (if enabled) */}
      {showTranscript && voiceState.transcript && (
        <div className="p-4 bg-gradient-card rounded-lg border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">
              Recognized text:
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Clear transcript
                // This can be added to the hook, but for now leave it as is
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-slate-200">
            {voiceState.transcript}
          </p>
        </div>
      )}

      {/* Stop speaking button */}
      {voiceState.isSpeaking && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleStopSpeaking}
            className="flex items-center space-x-2 border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <MicOff className="w-4 h-4" />
            <span>Stop speaking</span>
          </Button>
        </div>
      )}

      {/* Errors */}
      {voiceState.error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{voiceState.error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="h-auto p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      {!voiceState.isListening && !voiceState.isSpeaking && !voiceState.isProcessing && (
        <div className="text-center text-sm text-slate-400">
          <p>Click the microphone to start voice conversation</p>
          <p className="mt-1">Speak clearly and naturally</p>
        </div>
      )}
    </div>
  );
};

// Compact version for embedding in other components
export const VoiceAssistantCompact: React.FC<{
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ className, size = 'md' }) => {
  const {
    voiceState,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    clearError,
    activateVoiceMode,
    deactivateVoiceMode
  } = useVoiceAssistant();

  const { lastAIResponse } = useAIAssistant();

  const handleToggle = useCallback(() => {
    if (voiceState.isListening) {
      stopListening();
      deactivateVoiceMode(); // Deactivate voice mode when stopping
    } else {
      if (voiceState.isSpeaking) {
        stopSpeaking();
      }
      activateVoiceMode(); // Activate voice mode when starting recording
      startListening();
    }
  }, [voiceState.isListening, voiceState.isSpeaking, startListening, stopListening, stopSpeaking, activateVoiceMode, deactivateVoiceMode]);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <VoiceButton
        isListening={voiceState.isListening}
        isSpeaking={voiceState.isSpeaking}
        isProcessing={voiceState.isProcessing}
        onToggle={handleToggle}
        disabled={!isSupported}
        className={sizeClasses[size]}
      />
    </div>
  );
};

// Check if speech recognition is supported
const isSupported = typeof window !== 'undefined' && 
  (window.SpeechRecognition || window.webkitSpeechRecognition); 