
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatInterfaceProps {
  isExpanded: boolean;
  onCollapse: () => void;
  initialQuestion?: string;
}

const ChatInterface = ({ isExpanded, onCollapse, initialQuestion }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [neuralLoad, setNeuralLoad] = useState(23);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuestion && messages.length === 0) {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: initialQuestion,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages([userMessage]);
      simulateAIResponse(initialQuestion);
    }
  }, [initialQuestion]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const simulateAIResponse = async (question: string) => {
    setIsTyping(true);
    setNeuralLoad(Math.floor(Math.random() * 50) + 20);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const responses = [
      "Analyzing your request... Based on the data patterns I'm seeing, I recommend focusing on optimizing your Q2 working capital through automated inventory management and predictive cash flow modeling.",
      "Processing pharmaceutical compliance data... I've identified 3 critical supply chain risks: supplier diversification gaps, regulatory compliance bottlenecks, and demand forecasting accuracy issues.",
      "IT incident analysis complete... To improve resolution by 20%, implement automated ticket categorization, predictive maintenance alerts, and cross-team knowledge sharing protocols."
    ];
    
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: responses[Math.floor(Math.random() * responses.length)],
      sender: 'ai',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);
    setNeuralLoad(Math.floor(Math.random() * 30) + 10);
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    await simulateAIResponse(currentMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isExpanded) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-4xl h-[80vh] bg-card/50 backdrop-blur-lg border border-border/50 rounded-2xl glow-effect animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary pulse-glow" />
            </div>
            <div>
              <h3 className="font-semibold">Trigma AI Assistant</h3>
              <p className="text-sm text-muted-foreground">Neural Load: {neuralLoad}%</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={onCollapse}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4" style={{ height: 'calc(100% - 180px)' }}>
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
              <div className={`flex-1 ${message.sender === 'user' ? 'text-right' : ''}`}>
                <div
                  className={`inline-block p-4 rounded-2xl max-w-[80%] ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted/50 border border-border/50'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
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
              placeholder="Введите ваш вопрос о бизнес-аналитике..."
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
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isTyping}
                className="bg-primary hover:bg-primary/80 text-primary-foreground px-6"
              >
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
