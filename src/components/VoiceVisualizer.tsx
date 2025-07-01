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
    <div className={cn("flex items-center justify-center space-x-4", className)}>
      {/* Индикатор состояния с стеклянным эффектом */}
      <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-md">
        <div className="flex items-center justify-center space-x-2">
          {/* Анимированные точки для обработки */}
          {isProcessing && (
            <div className="flex space-x-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-cyan-500 dark:bg-cyan-400 rounded-full animate-pulse shadow-md"
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
                  className="w-1.5 bg-blue-500 dark:bg-cyan-400 rounded-full animate-pulse shadow-sm"
                  style={{
                    height: `${24 + i * 8}px`,
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
              <div className="w-5 h-5 bg-cyan-500 dark:bg-cyan-400 rounded-full animate-ping shadow-lg" />
              <div className="absolute inset-0 w-5 h-5 bg-cyan-500 dark:bg-cyan-400 rounded-full shadow-md" />
            </div>
          )}
        </div>
      </div>

      {/* Текст состояния с стеклянным эффектом */}
      <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-lg px-4 py-2 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-md">
        <span className="text-sm font-medium text-slate-800 dark:text-white/70">
          {isProcessing && 'Processing...'}
          {isSpeaking && 'Speaking...'}
          {isListening && 'Listening...'}
        </span>
      </div>
    </div>
  );
};

// Компонент для кнопки микрофона с анимацией и стеклянным эффектом
interface VoiceButtonProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
  theme?: 'light' | 'dark';
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  isListening,
  isSpeaking,
  isProcessing,
  onToggle,
  disabled = false,
  className,
  theme = 'dark',
}) => {
  const isActive = isListening || isSpeaking || isProcessing;

  return (
    <button
      onClick={onToggle}
      disabled={disabled || isProcessing}
      className={cn(
        "relative flex items-center justify-center rounded-2xl transition-all duration-300 ease-in-out",
        "backdrop-blur-[2px] bg-white/5 border border-white/10 shadow-lg hover:shadow-xl",
        "focus:outline-none focus:ring-2 focus:ring-cyan-500/50 dark:focus:ring-cyan-400/50 focus:ring-offset-2",
        {
          "opacity-50 cursor-not-allowed": disabled || isProcessing,
          "cursor-pointer hover:scale-105 hover:bg-white/10 hover:border-white/20": !disabled && !isProcessing,
          "scale-110 border-cyan-400/50 dark:border-cyan-400/50": isActive,
        },
        className
      )}
    >
      {/* Иконка микрофона */}
      <svg
        className={cn(
          "w-6 h-6 transition-all duration-300",
          isListening 
            ? "text-cyan-600 dark:text-cyan-400" 
            : "text-blue-600 dark:text-cyan-400"
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
        <div className="absolute inset-0 rounded-2xl border-2 border-cyan-500/70 dark:border-cyan-400/70 animate-ping" />
      )}

      {/* Анимированное кольцо для речи */}
      {isSpeaking && (
        <div className="absolute inset-0 rounded-2xl border-2 border-blue-500/70 dark:border-cyan-400/70 animate-pulse" />
      )}

      {/* Анимированное кольцо для обработки */}
      {isProcessing && (
        <div className="absolute inset-0 rounded-2xl border-2 border-cyan-500/70 dark:border-cyan-400/70 animate-spin" />
      )}
    </button>
  );
}; 