import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, User } from 'lucide-react';
import ChatInput from './ChatInput';
import ChatMetricCard from './ChatMetricCard';
import { useAIAssistant, Message } from '@/hooks/useAIAssistant';
import { MetricCard } from '@/data/metricsKnowledgeBase';

interface ChatViewProps {
  onClose: () => void;
  isSidebarCollapsed?: boolean;
  onNavigateToSection?: (section: string) => void;
}

// Utility: Format AI message content (remove **, add emoji, beautify)
function formatAIMessage(text: string): string {
  // Remove markdown bold (**)
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '$1');
  // Add emoji for bullet points and key sections
  formatted = formatted.replace(/- ([^\n]+)/g, '• $1');
  formatted = formatted.replace(/Key insight:/gi, '🔑 Key insight:');
  formatted = formatted.replace(/revenue/gi, '💰 revenue');
  formatted = formatted.replace(/ROI/gi, '📈 ROI');
  // Add more beautification as needed
  return formatted;
}

const ChatView: React.FC<ChatViewProps> = ({ 
  onClose, 
  isSidebarCollapsed,
  onNavigateToSection 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage, clearChat } = useAIAssistant();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleClose = () => {
    clearChat();
    onClose();
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    await sendMessage(message);
  };

  const handleGoToCard = (metricId: string, section: string) => {
    // Navigate to the section first
    if (onNavigateToSection) {
      onNavigateToSection(section);
    }
    
    // Then highlight the specific card
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
    // Navigate to the section and expand the card
    const message = messages.find(m => m.metricId === metricId);
    if (message?.metric) {
      const section = message.metric.section;
      if (onNavigateToSection) {
        onNavigateToSection(section);
      }
      
      setTimeout(() => {
        const cardElement = document.getElementById(metricId);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Trigger expand on the card
          const expandButton = cardElement.querySelector('[data-expand-button]');
          if (expandButton) {
            (expandButton as HTMLElement).click();
          }
        }
      }, 500);
    }
  };

  const handleToggleCardExpand = (metricId: string) => {
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
    const isUser = message.sender === 'user';
    // Format AI message content
    const content = message.sender === 'ai' ? formatAIMessage(message.content) : message.content;
    return (
      <div key={message.id} className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`flex gap-4 items-start ${isUser ? 'flex-row-reverse' : ''}`}>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
            isUser 
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500' 
              : 'p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30'
          }`}>
            {message.sender === 'ai' ? (
              <img src="/images/gsisai_logo.png" alt="GSIS AI Logo" className="w-5 h-5 object-contain" />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          <div className={`max-w-[75%] p-4 shadow-lg backdrop-blur-[2px] bg-white/5 border border-white/10 text-white 
            ${isUser ? 'rounded-2xl rounded-tr-none' : 'rounded-2xl rounded-tl-none'}`}>
            <p className="text-sm whitespace-pre-wrap">{content}</p>
            {/* Action buttons for navigation */}
            {message.action && message.metricId && !message.metric && (
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGoToCard(message.metricId!, message.metric?.section || '')}
                  className="mt-2 border-white/20 text-white hover:bg-white/10"
                >
                  {message.action === 'show_card' ? 'Show Card' : message.action === 'show_chart' ? 'Show Chart' : 'Navigate'}
                </Button>
              </div>
            )}
          </div>
        </div>
        {/* Card always as a separate block under the text */}
        {message.metric && (
          <div className="mt-2 ml-14">
            <ChatMetricCard
              metric={message.metric}
              onGoToCard={handleGoToCard}
              onShowChart={handleShowChart}
              isExpanded={expandedCards.has(message.metric.id)}
              onToggleExpand={() => handleToggleCardExpand(message.metric.id)}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`fixed top-0 right-0 bottom-0 z-40 flex flex-col animate-scale-in-center p-6 pt-20 backdrop-blur-[2px] bg-black/50 transition-all duration-300`
        + (isSidebarCollapsed ? ' left-16' : ' left-64')}
      style={{ pointerEvents: 'auto' }}
    >
      
      {/* Header */}
      <div className="flex-shrink-0 text-center w-full max-w-4xl mx-auto">
          <div className="inline-block p-3 rounded-xl mb-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
              <img src="/images/gsisai_logo.png" alt="GSIS AI Logo" className="w-8 h-8 object-contain" />
          </div>
          <h2 className="text-3xl font-bold text-white">Good to See You!</h2>
          <p className="text-white/70 mt-2">How Can I be of Assistance?</p>
          <p className="text-xs text-white/40 mt-1">I'm available 24/7 for you, ask me anything.</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 max-w-4xl mx-auto w-full pb-28">
        {messages.map(renderMessage)}
        
        {isLoading && (
          <div className="flex gap-4 items-start">
            <div className="w-9 h-9 rounded-full p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
               <img src="/images/gsisai_logo.png" alt="GSIS AI Logo" className="w-5 h-5 object-contain" />
            </div>
             <div className="max-w-[75%] p-4 rounded-2xl backdrop-blur-[2px] bg-white/5 border border-white/10 text-white rounded-bl-none">
               <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
               </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input is now the separate component */}
      <ChatInput 
        onSendMessage={handleSendMessage} 
        isSidebarCollapsed={isSidebarCollapsed} 
        isLoading={isLoading}
      />

      {/* Close Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-4 right-4 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200" 
        onClick={handleClose}
      >
          <X className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default ChatView; 