import React, { useEffect, useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Mic, Volume2, VolumeX, Target, BarChart3, Download } from 'lucide-react';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { AIVoiceInput } from './AIVoiceInput';
import ChatMetricCardEnhanced from './ChatMetricCardEnhanced';
import { getMetricById } from '@/data/metricsKnowledgeBase';
import { cn } from '@/lib/utils';
import { downloadClosestCard } from '@/lib/exportImage';

interface VoiceAssistantViewProps {
  className?: string;
  onClose?: () => void;
  isSidebarCollapsed?: boolean;
  onNavigateToSection?: (section: string) => void;
}

const VoiceAssistantView: React.FC<VoiceAssistantViewProps> = ({
  className,
  onClose,
  isSidebarCollapsed = false,
  onNavigateToSection
}) => {
  const {
    isListening,
    isTranscribing,
    isProcessing,
    isPlaying,
    status,
    transcript,
    response,
    cardData,
    error,
    startListening,
    stopListening,
    stopAudio,
    shutdown,
    enableAutoMode,
    disableAutoMode
  } = useVoiceAssistant();

  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Автоматический старт при открытии
  useEffect(() => {
    console.log('🚀 VoiceAssistantView mounted, starting voice assistant');
    const startTimeout = setTimeout(() => {
      console.log('🔄 Starting listening after delay...');
      startListening();
    }, 500); // Небольшая задержка для плавного старта

    return () => {
      clearTimeout(startTimeout);
    };
  }, [startListening]); // Запускаем только при монтировании

  // Включаем автоматический режим при монтировании
  useEffect(() => {
    console.log('🔓 VoiceAssistantView enabling auto mode');
    enableAutoMode();
    
    return () => {
      // При размонтировании отключаем автоматический режим
      console.log('🔒 VoiceAssistantView disabling auto mode on unmount');
      disableAutoMode();
    };
  }, [enableAutoMode, disableAutoMode]);

  const handleClose = useCallback(() => {
    // Полная остановка всех процессов голосового ассистента
    shutdown();
    onClose?.();
  }, [shutdown, onClose]);

  const handleGoToCard = useCallback((metricId: string, section: string) => {
    if (onNavigateToSection) {
      onNavigateToSection(section);
    }
    console.log(`Navigate to card: ${metricId} in section: ${section}`);
  }, [onNavigateToSection]);

  const handleShowChart = useCallback((metricId: string) => {
    console.log(`Show chart for metric: ${metricId}`);
  }, []);

  const handleToggleExpand = useCallback((metricId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(metricId)) {
        newSet.delete(metricId);
      } else {
        newSet.add(metricId);
      }
      return newSet;
    });
  }, []);

  const getStatusText = () => {
    switch (status) {
      case 'initializing':
        return 'Initializing...';
      case 'listening':
        return 'Listening...';
      case 'speaking':
        return 'Detecting speech...';
      case 'silence_detected':
        return 'Processing silence...';
      case 'transcribing':
        return 'Recognizing speech...';
      case 'processing':
        return 'Analyzing your request...';
      case 'playing':
        return 'Speaking...';
      case 'completed':
        return 'Ready for next question';
      case 'error':
        return 'Error occurred';
      default:
        return 'Initializing...';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'initializing':
        return <div className="w-5 h-5 border-2 border-cyan-500 dark:border-cyan-400 border-t-transparent rounded-full animate-spin" />;
      case 'listening':
      case 'speaking':
        return <Mic className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />;
      case 'silence_detected':
        return <Mic className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
      case 'transcribing':
      case 'processing':
        return <div className="w-5 h-5 border-2 border-blue-500 dark:border-cyan-400 border-t-transparent rounded-full animate-spin" />;
      case 'playing':
        return <Volume2 className="w-5 h-5 text-blue-600 dark:text-cyan-400" />;
      case 'completed':
        return <Mic className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />;
      case 'error':
        return <Mic className="w-5 h-5 text-red-500 dark:text-red-400" />;
      default:
        return <Mic className="w-5 h-5 text-slate-500 dark:text-white/40" />;
    }
  };

  const isSupported = typeof window !== 'undefined' && 
    navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia;

  if (!isSupported) {
    return (
      <div className={cn(
        "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4",
        className
      )}>
        <Card className="w-full max-w-md backdrop-blur-[2px] bg-white/90 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-2xl shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Voice Assistant</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="text-center text-slate-700 dark:text-white/70">
              <p>Your browser doesn't support voice recording.</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-white/40">
                Use a modern browser (Chrome, Edge, Safari).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4",
      className
    )}>
      <Card className="w-full max-w-3xl backdrop-blur-[2px] bg-white/90 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-2xl shadow-2xl">
        <CardContent className="p-6">
          {/* Header with glass effect */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/50 dark:border-white/10">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">AI Voice Assistant</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* --- Two-column layout start --- */}
          <div className="flex flex-col md:flex-row gap-8">

            {/* Left column — текст и карточки */}
            <div className="flex-1 md:max-h-[70vh] overflow-y-auto space-y-4">

              {/* Transcript */}
              {transcript && (
                <div className="p-4 backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-md">
                  <div className="text-sm font-medium text-slate-700 dark:text-white/70 mb-2">
                    Recognized text:
                  </div>
                  <p className="text-slate-900 dark:text-white">
                    {transcript}
                  </p>
                </div>
              )}

              {/* AI Response */}
              {response && (
                <div className="p-4 backdrop-blur-[2px] bg-cyan-50/10 dark:bg-cyan-500/10 border border-cyan-300/30 dark:border-cyan-400/30 rounded-lg hover:bg-cyan-50/20 hover:border-cyan-300/50 transition-all duration-300 shadow-md voice-response-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
                      Assistant response:
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => downloadClosestCard(e.currentTarget as HTMLElement, 'CLAIRE_Voice_Response')}
                      className="h-7 px-2 text-cyan-700 hover:text-cyan-900 dark:text-cyan-300 dark:hover:text-cyan-100"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      PNG
                    </Button>
                  </div>
                  <p className="text-cyan-800 dark:text-cyan-100">
                    {response}
                  </p>
                </div>
              )}

              {/* Metric Card */}
              {cardData && (
                <div>
                  {(() => {
                    const metric = getMetricById(cardData.metric_id);
                    if (!metric) {
                      return (
                        <div className="p-4 backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-md">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-700 dark:text-white/70">Карточка метрики не найдена: {cardData.metric_id}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs backdrop-blur-[2px] bg-white/5 border border-cyan-300/30 dark:border-cyan-400/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50/10 dark:hover:bg-cyan-500/10 hover:border-cyan-300/50 transition-all duration-300 shadow-md"
                              onClick={() => {
                                if (onNavigateToSection && cardData.action === 'show_card') {
                                  onNavigateToSection('pharma-sm');
                                }
                                console.log(`Show ${cardData.action} for metric: ${cardData.metric_id}`);
                              }}
                            >
                              {cardData.action === 'show_card' ? (
                                <>
                                  <Target className="w-3 h-3 mr-1" />
                                  Show Card
                                </>
                              ) : (
                                <>
                                  <BarChart3 className="w-3 h-3 mr-1" />
                                  Show Chart
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <ChatMetricCardEnhanced
                        metric={metric}
                        onGoToCard={handleGoToCard}
                        onShowChart={handleShowChart}
                        isExpanded={expandedCards.has(metric.id)}
                        onToggleExpand={() => handleToggleExpand(metric.id)}
                      />
                    );
                  })()}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 backdrop-blur-[2px] bg-white/5 border border-red-500/30 dark:border-red-400/30 rounded-lg hover:bg-red-50/10 hover:border-red-500/50 transition-all duration-300 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-red-600 dark:text-red-300">{error}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.reload()}
                      className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right column — визуализация и управление микрофоном */}
            <div className="md:w-80 flex flex-col items-center space-y-6 md:self-center">

              {/* Processing Status */}
              {isTranscribing && (
                <div className="w-full p-3 backdrop-blur-[2px] bg-white/5 border border-cyan-500/30 dark:border-cyan-400/30 rounded-lg hover:bg-white/10 hover:border-cyan-500/40 transition-all duration-300 shadow-md">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-4 h-4 border-2 border-cyan-500 dark:border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-cyan-700 dark:text-cyan-300">Processing speech...</span>
                  </div>
                </div>
              )}

              {/* Voice Input */}
              <div className="w-full backdrop-blur-[2px] bg-white/5 border border-cyan-400/20 rounded-xl p-4 hover:bg-white/10 hover:border-cyan-400/40 transition-all duration-300 shadow-md overflow-hidden">
                <AIVoiceInput
                  visualizerBars={48}
                  isListening={isListening}
                  isProcessing={isTranscribing || isProcessing}
                  isSpeaking={isPlaying}
                  className=""
                />
              </div>

              {/* Stop Recording */}
              {isListening && (
                <Button
                  onClick={stopListening}
                  variant="outline"
                  size="sm"
                  className="w-full backdrop-blur-[2px] bg-white/5 border border-red-500/30 dark:border-red-400/30 text-red-600 dark:text-red-300 hover:bg-red-50/10 dark:hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-300 shadow-md"
                >
                  Stop Recording (Test)
                </Button>
              )}

              {/* Status */}
              <div className="w-full flex items-center justify-center gap-3 py-4 backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-md">
                {getStatusIcon()}
                <span className="text-lg font-medium text-slate-900 dark:text-white">
                  {getStatusText()}
                </span>
              </div>
            </div>
          </div>
          {/* --- Two-column layout end --- */}


        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceAssistantView; 