import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Message, useAIAssistant } from '@/hooks/useAIAssistant';

import ChatMetricCardEnhanced from './ChatMetricCardEnhanced';
import { 
  User, 
  Bot, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BarChart3,
  Users,
  Calendar,
  DollarSign,
  ArrowRight,
  ExternalLink,
  X,
  Mic
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatViewProps {
  className?: string;
  onClose?: () => void;
  isSidebarCollapsed?: boolean;
  onNavigateToSection?: (section: string) => void;
}



const ChatView: React.FC<ChatViewProps> = ({ 
  className, 
  onClose, 
  isSidebarCollapsed = false,
  onNavigateToSection
}) => {
  const { messages, isLoading, lastAIResponse, sendMessage } = useAIAssistant();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());


  // Debug logging for messages
  useEffect(() => {
    console.log('ChatView messages updated:', {
      totalMessages: messages.length,
      hasMessages: messages.length > 0
    });
    
    // Add test message if no messages exist (for debugging)
    if (messages.length === 0 && process.env.NODE_ENV === 'development') {
      console.log('No messages found - this is expected for initial state');
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatAIResponse = (content: string) => {
    // Разбиваем текст на строки
    const lines = content.split('\n');
    const formattedLines = lines.map((line, index) => {
      // Обрабатываем эмодзи и заголовки
      if (line.includes('✅') || line.includes('🔍') || line.includes('📉') || line.includes('💡')) {
        return (
          <div key={index} className="flex items-start gap-2 mb-2">
            <span className="text-lg">{line.split(' ')[0]}</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {line.split(' ').slice(1).join(' ')}
            </span>
          </div>
        );
      }
      
      // Обрабатываем списки с эмодзи
      if (line.includes('📊') || line.includes('🚶‍♂') || line.includes('💡') || line.includes('🔥') || line.includes('⚡') || line.includes('📈')) {
        return (
          <div key={index} className="flex items-start gap-2 mb-3">
            <span className="text-lg mt-1">{line.split(' ')[0]}</span>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 dark:text-white mb-2">
                {line.split(' ').slice(1).join(' ')}
              </div>
            </div>
          </div>
        );
      }
      
      // Обрабатываем элементы списка
      if (line.trim().startsWith('•')) {
        return (
          <div key={index} className="flex items-start gap-2 ml-4 mb-1">
            <span className="text-gray-500 dark:text-gray-400 mt-1">•</span>
            <span className="text-gray-700 dark:text-gray-300">{line.substring(1).trim()}</span>
          </div>
        );
      }
      
      // Обрабатываем разделители
      if (line.includes('⸻')) {
        return <hr key={index} className="my-4 border-gray-200 dark:border-gray-700" />;
      }
      
      // Обрабатываем предупреждения и рекомендации
      if (line.includes('🚨') || line.includes('❗') || line.includes('⚠')) {
        return (
          <div key={index} className="flex items-start gap-2 mb-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <span className="text-red-700 dark:text-red-300">{line}</span>
          </div>
        );
      }
      
      if (line.includes('✅') || line.includes('🎯')) {
        return (
          <div key={index} className="flex items-start gap-2 mb-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-green-700 dark:text-green-300">{line}</span>
          </div>
        );
      }
      
      if (line.includes('💡') || line.includes('🎯')) {
        return (
          <div key={index} className="flex items-start gap-2 mb-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <span className="text-blue-700 dark:text-blue-300">{line}</span>
          </div>
        );
      }
      
      // Обычный текст
      if (line.trim()) {
        return (
          <div key={index} className="mb-2 text-gray-700 dark:text-gray-300">
            {line}
          </div>
        );
      }
      
      return null;
    });

    return formattedLines;
  };

  const handleGoToCard = (metricId: string, section: string) => {
    if (onNavigateToSection) {
      onNavigateToSection(section);
    }
    console.log(`Navigate to card: ${metricId} in section: ${section}`);
  };

  const handleShowChart = (metricId: string) => {
    console.log(`Show chart for metric: ${metricId}`);
  };

  const handleToggleExpand = (metricId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(metricId)) {
        newSet.delete(metricId);
      } else {
        newSet.add(metricId);
      }
      return newSet;
    });
  };

  const renderMessage = (message: Message) => {
    const isAI = message.sender === 'ai';
    
    // Don't render empty messages
    if (!message.content.trim() && !message.metric && !message.action) {
      return null;
    }
    
    return (
      <React.Fragment key={message.id}>
      <div
        className={cn(
          "flex gap-3 mb-4",
          isAI ? "justify-start" : "justify-end"
        )}
      >
        {isAI && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
        )}
        
        <div className={cn(
          "flex-1 max-w-[80%]",
          isAI ? "order-2" : "order-1"
        )}>
          <Card className={cn(
            "backdrop-blur-[2px] bg-white/5 border border-white/10",
            isAI 
              ? "hover:bg-white/10 hover:border-white/20" 
              : "hover:bg-white/10 hover:border-white/20"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isAI ? 'CLAIRE AI Assistant' : 'You'}
                </span>
                {isAI && (
                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-600 dark:border-blue-600 dark:text-blue-400">
                    AI
                  </Badge>
                )}
              </div>
              
              <div className="text-base leading-relaxed">
                {isAI ? formatAIResponse(message.content) : message.content}
              </div>
              
              {/* карточка удалена из этого контейнера */}
              
              {message.action && message.metricId && !(message.action === 'show_card' && message.metric) && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    onClick={() => {
                      if (onNavigateToSection && message.action === 'show_card') {
                        onNavigateToSection('pharma-sm');
                      }
                      console.log(`Show ${message.action} for metric: ${message.metricId}`);
                    }}
                  >
                    {message.action === 'show_card' ? (
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
              )}
            </CardContent>
          </Card>
        </div>
        
        {!isAI && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-gray-500 to-slate-500 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {isAI && message.metric && (
        <div className="flex gap-3 mb-4 justify-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 max-w-[80%]">
            <ChatMetricCardEnhanced
              metric={message.metric}
              onGoToCard={handleGoToCard}
              onShowChart={handleShowChart}
              isExpanded={expandedCards.has(message.metric.id)}
              onToggleExpand={() => handleToggleExpand(message.metric.id)}
            />
          </div>
        </div>
      )}

      </React.Fragment>
    );
  };

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 flex flex-col backdrop-blur-md",
      isSidebarCollapsed ? "ml-16" : "ml-64",
      "transition-colors duration-300",
      "bg-transparent",
      "dark:bg-transparent"
    )}>
      {/* Header with close button */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 backdrop-blur-sm bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            CLAIRE AI Assistant
          </h2>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>
      {/* Chat container with scroll */}
      <div className={cn("flex-1 flex flex-col", className)} style={{ height: '85vh', maxHeight: '85vh', minHeight: '450px' }}>
        <div className="flex-1 overflow-y-auto">
          <ScrollArea className="flex-1 p-4" ref={scrollRef} style={{ height: '100%' }}>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Welcome to CLAIRE AI Assistant
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    Ask me about your pharmaceutical analytics data, marketing performance, 
                    regional insights, or scenario comparisons. I can help you understand 
                    key metrics and provide actionable recommendations.
                  </p>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Key Insights</span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        "What are the key insights for Q2?"
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">Channel Performance</span>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        "Show me the best performing channels"
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Regional Analysis</span>
                      </div>
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        "What's the regional performance?"
                      </p>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Lightbulb className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Recommendations</span>
                      </div>
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        "Show me marketing recommendations"
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                messages.map(renderMessage).filter(Boolean)
              )}
              {isLoading && (
                <div className="flex gap-3 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 max-w-[80%]">
                    <Card className="backdrop-blur-[2px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            CLAIRE AI Assistant
                          </span>
                          <Badge variant="outline" className="text-xs border-blue-300 text-blue-600 dark:border-blue-600 dark:text-blue-400">
                            AI
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Analyzing your data...
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default ChatView; 