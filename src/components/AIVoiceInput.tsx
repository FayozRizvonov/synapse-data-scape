"use client";

import { Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: () => void;
  visualizerBars?: number;
  isListening?: boolean;
  isProcessing?: boolean;
  isSpeaking?: boolean;
  className?: string;
}

export function AIVoiceInput({
  onStart,
  onStop,
  visualizerBars = 48,
  isListening = false,
  isProcessing = false,
  isSpeaking = false,
  className
}: AIVoiceInputProps) {
  const [time, setTime] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update timer based on listening state
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isListening) {
      onStart?.();
      intervalId = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    } else {
      onStop?.();
      setTime(0);
    }

    return () => clearInterval(intervalId);
  }, [isListening, onStart, onStop]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusText = () => {
    if (isListening) return "Listening...";
    if (isProcessing) return "Analyzing your request...";
    if (isSpeaking) return "AI is speaking...";
    return "Initializing...";
  };

  const isActive = isListening || isProcessing || isSpeaking;

  return (
    <div className={cn("w-full py-6", className)}>
      <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-4">
        {/* Main mic button with glass effect */}
        <div
          className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg",
            "backdrop-blur-[2px] bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30",
            isActive
              ? "shadow-xl scale-105 border-cyan-400/50 dark:border-cyan-400/50" 
              : "hover:scale-102"
          )}
        >
          {isProcessing ? (
            <div
              className="w-8 h-8 rounded-lg animate-spin bg-cyan-500 dark:bg-cyan-400 cursor-pointer pointer-events-auto shadow-md"
              style={{ animationDuration: "3s" }}
            />
          ) : (
            <Mic className={cn(
              "w-8 h-8 transition-all duration-300",
              isListening 
                ? "text-cyan-600 dark:text-cyan-400 animate-pulse" 
                : "text-blue-600 dark:text-cyan-400"
            )} />
          )}
        </div>

        {/* Timer with glass effect */}
        <div className="backdrop-blur-[2px] bg-white/10 border border-white/20 rounded-lg px-4 py-2 hover:bg-white/15 hover:border-white/30 transition-all duration-300 shadow-md">
          <span
            className={cn(
              "font-mono text-lg font-medium transition-all duration-300",
              isActive
                ? "text-cyan-600 dark:text-cyan-400"
                : "text-slate-700 dark:text-white/80"
            )}
          >
            {formatTime(time)}
          </span>
        </div>

        {/* Visualizer with glass container */}
        <div className="backdrop-blur-[2px] bg-white/10 border border-white/20 rounded-2xl p-4 hover:bg-white/15 hover:border-white/30 transition-all duration-300 shadow-md">
          <div className="h-6 w-72 flex items-center justify-center gap-1">
            {[...Array(visualizerBars)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1 rounded-full transition-all duration-300",
                  isListening
                    ? "bg-cyan-500/80 dark:bg-cyan-400/80 animate-pulse shadow-sm"
                    : isProcessing
                    ? "bg-blue-500/80 dark:bg-cyan-400/80 animate-pulse shadow-sm"
                    : isSpeaking
                    ? "bg-blue-600/80 dark:bg-cyan-300/80 animate-pulse shadow-sm"
                    : "bg-slate-400/60 dark:bg-white/40 h-2"
                )}
                style={
                  isActive && isClient
                    ? {
                        height: `${8 + Math.random() * 16}px`,
                        animationDelay: `${i * 0.05}s`,
                      }
                    : undefined
                }
              />
            ))}
          </div>
        </div>

        {/* Status text with glass effect */}
        <div className="backdrop-blur-[2px] bg-white/10 border border-white/20 rounded-lg px-6 py-3 hover:bg-white/15 hover:border-white/30 transition-all duration-300 shadow-md">
          <p className="text-sm font-medium text-slate-700 dark:text-white/80">
            {getStatusText()}
          </p>
        </div>
      </div>
    </div>
  );
} 