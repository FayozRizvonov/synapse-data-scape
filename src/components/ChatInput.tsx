import React, { useState, useEffect, useRef } from 'react';
import { Paperclip, ArrowUp, Mic } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { VoiceAssistantCompact } from './VoiceAssistant';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isSidebarCollapsed?: boolean;
  isLoading?: boolean;
}

const PLACEHOLDERS = [
  'Ask GSIS AI or specify a section...',
  'How can I help you today?',
  'Upload a file or start a voice query',
  'What is the best way to learn React?',
  'Summarize this article',
];

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isSidebarCollapsed,
  isLoading
}) => {
  const [message, setMessage] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { voiceState } = useVoiceAssistant();

  // Cycle placeholder text when input is inactive
  useEffect(() => {
    if (isActive || message) return;
    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, [isActive, message]);

  // Close input when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        if (!message) setIsActive(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [message]);

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message.trim());
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const containerVariants = {
    collapsed: {
      height: 68,
      boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
      transition: { stiffness: 120, damping: 18 },
    },
    expanded: {
      height: 128,
      boxShadow: '0 8px 32px 0 rgba(0,0,0,0.16)',
      transition: { stiffness: 120, damping: 18 },
    },
  };

  const placeholderContainerVariants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.025 } },
    exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
  };

  const letterVariants = {
    initial: {
      opacity: 0,
      filter: 'blur(12px)',
      y: 10,
    },
    animate: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        opacity: { duration: 0.25 },
        filter: { duration: 0.4 },
        y: { stiffness: 80, damping: 20 },
      },
    },
    exit: {
      opacity: 0,
      filter: 'blur(12px)',
      y: -10,
      transition: {
        opacity: { duration: 0.2 },
        filter: { duration: 0.3 },
        y: { stiffness: 80, damping: 20 },
      },
    },
  };

  return (
    <div className={`fixed bottom-5 right-0 px-4 z-50 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'left-16' : 'left-64'}`}>
      <motion.div
        ref={wrapperRef}
        className="w-full max-w-2xl mx-auto"
        variants={containerVariants}
        animate={isActive || message ? 'expanded' : 'collapsed'}
        initial="collapsed"
        style={{ overflow: 'hidden', borderRadius: 32 }}
        onClick={() => setIsActive(true)}
      >
        <div className="flex flex-col items-stretch w-full h-full">
          {/* Input Row */}
          <div className="flex items-center gap-2 p-3 rounded-full backdrop-blur-[2px] bg-white/5 border border-white/10 max-w-2xl w-full">
            <button
              className="p-3 rounded-full hover:bg-white/10 transition text-white/70 hover:text-white"
              title="Attach file"
              type="button"
              tabIndex={-1}
            >
              <Paperclip size={20} />
            </button>
            {/* Text Input & Placeholder */}
            <div className="relative flex-1">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 border-0 outline-0 rounded-md py-2 text-base bg-transparent w-full font-normal text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40"
                style={{ position: 'relative', zIndex: 1 }}
                onFocus={() => setIsActive(true)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <div className="absolute left-0 top-0 w-full h-full pointer-events-none flex items-center px-3 py-2">
                <AnimatePresence mode="wait">
                  {showPlaceholder && !isActive && !message && (
                    <motion.span
                      key={placeholderIndex}
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 select-none pointer-events-none"
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        zIndex: 0,
                      }}
                      variants={placeholderContainerVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {PLACEHOLDERS[placeholderIndex]
                        .split('')
                        .map((char, i) => (
                          <motion.span
                            key={i}
                            variants={letterVariants}
                            style={{ display: 'inline-block' }}
                          >
                            {char === ' ' ? '\u00A0' : char}
                          </motion.span>
                        ))}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="flex items-center">
              <VoiceAssistantCompact size="sm" />
            </div>
            <button
              className="flex items-center gap-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white p-3 rounded-full font-medium justify-center ml-2 shadow-lg transition-all duration-200"
              title="Send"
              type="button"
              tabIndex={-1}
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              style={{ minWidth: 44, minHeight: 44 }}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              ) : (
                <ArrowUp size={18} />
              )}
            </button>
          </div>
          {/* Voice mode indicator */}
          {voiceState.isVoiceMode && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
              <div className="inline-flex items-center px-3 py-1 rounded-full backdrop-blur-[2px] bg-white/5 border border-white/10 text-white text-sm shadow-lg">
                <Mic className="w-4 h-4 mr-2" />
                Voice mode active
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ChatInput; 