import React from 'react';
import { cn } from '@/lib/utils';

interface VoiceVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  className?: string;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  isListening,
  isSpeaking,
  isProcessing,
  className
}) => {
  if (!isListening && !isSpeaking && !isProcessing) {
    return null;
  }

  return (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      {/* Индикатор состояния */}
      <div className="flex items-center space-x-2">
        {/* Анимированные точки для обработки */}
        {isProcessing && (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        )}

        {/* Волны для речи */}
        {isSpeaking && (
          <div className="flex items-center space-x-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1 bg-green-500 rounded-full animate-pulse"
                style={{
                  height: `${20 + i * 8}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.6s'
                }}
              />
            ))}
          </div>
        )}

        {/* Пульсация для записи */}
        {isListening && (
          <div className="relative">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-ping" />
            <div className="absolute inset-0 w-4 h-4 bg-red-500 rounded-full" />
          </div>
        )}
      </div>

      {/* Текст состояния */}
      <span className="text-sm font-medium text-gray-300">
        {isProcessing && 'Processing...'}
        {isSpeaking && 'Speaking...'}
        {isListening && 'Listening...'}
      </span>
    </div>
  );
};

// Компонент для кнопки микрофона с анимацией
interface VoiceButtonProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  isListening,
  isSpeaking,
  isProcessing,
  onToggle,
  disabled = false,
  className
}) => {
  const isActive = isListening || isSpeaking || isProcessing;

  return (
    <button
      onClick={onToggle}
      disabled={disabled || isProcessing}
      className={cn(
        "relative flex items-center justify-center rounded-full transition-all duration-300 ease-in-out w-12 h-12",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        {
          // Состояния кнопки
          "bg-gray-800 hover:bg-gray-700": !isActive,
          "bg-red-900/20 hover:bg-red-900/30": isListening,
          "bg-green-900/20 hover:bg-green-900/30": isSpeaking,
          "bg-blue-900/20": isProcessing,
          "opacity-50 cursor-not-allowed": disabled || isProcessing,
          "cursor-pointer": !disabled && !isProcessing,
        },
        className
      )}
    >
      {/* Иконка микрофона */}
      <svg
        className={cn(
          "w-6 h-6 transition-colors duration-300",
          {
            "text-gray-300": !isActive,
            "text-red-400": isListening,
            "text-green-400": isSpeaking,
            "text-blue-400": isProcessing,
          }
        )}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {isListening ? (
          // Иконка остановки записи
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
          />
        ) : (
          // Иконка микрофона
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        )}
      </svg>

      {/* Анимированное кольцо для записи */}
      {isListening && (
        <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping" />
      )}

      {/* Анимированное кольцо для речи */}
      {isSpeaking && (
        <div className="absolute inset-0 rounded-full border-2 border-green-500 animate-pulse" />
      )}

      {/* Анимированное кольцо для обработки */}
      {isProcessing && (
        <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-spin" />
      )}
    </button>
  );
}; 