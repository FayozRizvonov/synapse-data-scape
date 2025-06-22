import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Bot, User, X } from 'lucide-react';
import ChatMetricCard from './ChatMetricCard';
import SituationDetailModal from './SituationDetailModal';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { MetricCard } from '@/data/metricsKnowledgeBase';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  metric?: MetricCard;
  action?: 'show_card' | 'show_chart';
}

interface ChatInterfaceProps {
  isExpanded: boolean;
  onCollapse: () => void;
  initialQuestion?: string;
  onNavigateToSection?: (section: string) => void;
}

const ChatInterface = ({ isExpanded, onCollapse, initialQuestion, onNavigateToSection }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [neuralLoad, setNeuralLoad] = useState(23);
  const [selectedCard, setSelectedCard] = useState<MetricCard | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { sendMessage, isLoading } = useAIAssistant();

  useEffect(() => {
    if (initialQuestion && messages.length === 0) {
      handleSendMessage(initialQuestion);
    }
  }, [initialQuestion]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || currentMessage;
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setNeuralLoad(Math.floor(Math.random() * 50) + 40);

    try {
      const aiResponse = await sendMessage(text);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.text,
        sender: 'ai',
        timestamp: new Date(),
        metric: aiResponse.metric,
        action: aiResponse.action
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setNeuralLoad(Math.floor(Math.random() * 30) + 15);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Извините, произошла ошибка. Попробуйте снова.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleGoToCard = (metricId: string, section: string) => {
    if (onNavigateToSection) {
      if (section === 'key-metrics' || section === 'situation') {
        onNavigateToSection('pharma-sm');
      }
    }
    
    // Scroll to the specific card
    setTimeout(() => {
      const cardElement = document.getElementById(metricId);
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        cardElement.classList.add('highlight-card');
        setTimeout(() => cardElement.classList.remove('highlight-card'), 3000);
      }
    }, 500);
  };

  const handleShowChart = (metricId: string) => {
    const metric = messages.find(m => m.metric?.id === metricId)?.metric;
    if (metric) {
      setSelectedCard(metric);
    }
  };

  return (
    <div className={`transition-all duration-500 ease-out overflow-hidden ${
      isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
    }`}>
      <div className="max-w-4xl mx-auto bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl glow-effect animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary pulse-glow" />
            </div>
            <div>
              <h3 className="font-semibold">GSIS AI Assistant</h3>
              <p className="text-sm text-muted-foreground">Neural Load: {neuralLoad}%</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={onCollapse}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[400px]">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 animate-slide-in-right ${
                message.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                {message.sender === 'ai' ? (
                  <Bot className="w-4 h-4 text-primary" />
                ) : (
                  <User className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <div className={`flex-1 space-y-3 ${message.sender === 'user' ? 'text-right' : ''}`}>
                <div
                  className={`inline-block p-4 rounded-2xl max-w-[80%] ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted/50 border border-border/50'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
                
                {/* Show metric card if present */}
                {message.metric && message.sender === 'ai' && (
                  <div className="max-w-[80%]">
                    <ChatMetricCard 
                      metric={message.metric}
                      onGoToCard={handleGoToCard}
                      onShowChart={handleShowChart}
                    />
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary pulse-glow" />
              </div>
              <div className="bg-muted/50 border border-border/50 p-4 rounded-2xl">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-border/50">
          <div className="bg-muted/30 rounded-2xl border border-border/50 p-4">
            <Textarea
              placeholder="Спросите о любой метрике или попросите показать данные..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[60px] bg-transparent border-none resize-none focus:ring-0 focus:outline-none"
            />
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Paperclip className="w-4 h-4" />
                </Button>
              </div>
              <Button
                onClick={() => handleSendMessage()}
                disabled={!currentMessage.trim() || isLoading}
                className="bg-primary hover:bg-primary/80 text-primary-foreground px-6"
              >
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Modal */}
      <SituationDetailModal
        card={selectedCard}
        open={!!selectedCard}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCard(null);
          }
        }}
      >
        <div/>
      </SituationDetailModal>
    </div>
  );
};

export default ChatInterface;
