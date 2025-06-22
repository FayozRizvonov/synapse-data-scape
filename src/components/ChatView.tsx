import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, User } from 'lucide-react';
import ChatInput from './ChatInput';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
}

interface ChatViewProps {
  initialMessage: string;
  onClose: () => void;
  isSidebarCollapsed?: boolean;
}

const ChatView: React.FC<ChatViewProps> = ({ initialMessage, onClose, isSidebarCollapsed }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const simulateAIResponse = async (question: string) => {
    setIsTyping(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: `Это симуляция ответа на ваш вопрос: "${question}". Настоящая логика обработки еще не реализована.`,
      sender: 'ai',
    };
    
    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);
  };

  useEffect(() => {
    if (initialMessage) {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: initialMessage,
        sender: 'user',
      };
      setMessages([userMessage]);
      simulateAIResponse(initialMessage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
    };

    setMessages(prev => [...prev, userMessage]);
    await simulateAIResponse(message);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-lg z-40 flex flex-col animate-fade-in p-6 pt-20">
      
      {/* Header */}
      <div className="flex-shrink-0 text-center w-full max-w-4xl mx-auto">
          <div className="inline-block bg-primary/10 p-3 rounded-xl mb-4">
              <img src="/images/gsisai_logo.png" alt="GSIS AI Logo" className="w-8 h-8 object-contain" />
          </div>
          <h2 className="text-3xl font-bold text-white">Good to See You!</h2>
          <p className="text-white/60 mt-2">How Can I be an Assistance?</p>
          <p className="text-xs text-white/40 mt-1">I'm available 24/7 for you, ask me anything.</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-6 min-h-0 w-full max-w-4xl mx-auto py-8">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-4 items-start ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${message.sender === 'user' ? 'bg-blue-500/20' : 'bg-primary/20'}`}>
              {message.sender === 'ai' ? (
                <img src="/images/gsisai_logo.png" alt="GSIS AI Logo" className="w-5 h-5 object-contain" />
              ) : (
                <User className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <div className={`max-w-[75%] p-4 rounded-2xl ${
              message.sender === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-zinc-800 text-white/90 rounded-bl-none'
            }`}>
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex gap-4 items-start">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
               <img src="/images/gsisai_logo.png" alt="GSIS AI Logo" className="w-5 h-5 object-contain" />
            </div>
             <div className="max-w-[75%] p-4 rounded-2xl bg-zinc-800 text-white/90 rounded-bl-none">
               <div className="flex items-center gap-2">
                  <span className="typing-indicator"></span>
                  <span className="typing-indicator" style={{animationDelay: '0.2s'}}></span>
                  <span className="typing-indicator" style={{animationDelay: '0.4s'}}></span>
               </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input is now the separate component */}
      <ChatInput onSendMessage={handleSendMessage} isSidebarCollapsed={isSidebarCollapsed} />

      {/* Close Button */}
      <Button variant="ghost" size="icon" className="absolute top-4 right-4 rounded-full text-white/60 hover:text-white" onClick={onClose}>
          <X className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default ChatView; 