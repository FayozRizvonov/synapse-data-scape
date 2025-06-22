import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Paperclip, Mic, ArrowUp } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isSidebarCollapsed?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isSidebarCollapsed }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className={`fixed bottom-5 right-0 px-4 z-50 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'left-16' : 'left-64'}`}>
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative chat-input-glow">
          <div className="relative flex items-center bg-black/30 backdrop-blur-xl border border-white/20 rounded-full p-2 shadow-lg">
            <Button variant="ghost" size="icon" className="rounded-full text-white/70 hover:text-white">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              type="text"
              placeholder="Спросите у GSIS..."
              className="flex-1 bg-transparent border-none text-white placeholder:text-white/60 focus:ring-0 focus:outline-none px-4"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button variant="ghost" size="icon" className="rounded-full text-white/70 hover:text-white">
              <Mic className="h-5 w-5" />
            </Button>
            <Button 
              size="icon" 
              className="rounded-full bg-primary text-primary-foreground w-9 h-9 ml-2"
              onClick={handleSend}
              disabled={!message.trim()}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput; 