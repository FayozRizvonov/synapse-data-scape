import React, { useState, useEffect, useRef } from 'react';
import { Paperclip, ArrowUp, Mic } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import VoiceAssistantView from './VoiceAssistantView';
import { useTheme } from '@/hooks/useTheme';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isSidebarCollapsed?: boolean;
  isLoading?: boolean;
  onNavigateToSection?: (section: string) => void;
}

const PLACEHOLDERS = [
  'Get sales insights for this quarter',
  'Show me the top performing products',
  'Compare regional analytics',
  'Recommend actions to boost revenue',
  'Upload a file or start a voice query',
];

const QUICK_SUGGESTIONS = [
  'Show key metrics',
  'Regional analysis',
  'Revenue forecast',
  'Performance trends',
  'Marketing insights'
];

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isSidebarCollapsed,
  isLoading,
  onNavigateToSection
}) => {
  const [message, setMessage] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

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

  const handleOpenVoiceAssistant = () => {
    setShowVoiceAssistant(true);
  };

  const handleCloseVoiceAssistant = () => {
    setShowVoiceAssistant(false);
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
    <>
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
                id="chat-message-input"
                name="message"
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 border-0 outline-0 rounded-md py-2 text-base bg-transparent w-full font-normal text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40"
                style={{ position: 'relative', zIndex: 1 }}
                onFocus={() => setIsActive(true)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                autoComplete="off"
              />
                <div className="absolute left-0 top-0 w-full h-full pointer-events-none flex items-center px-3 py-2">
                  <AnimatePresence mode="wait">
                    {showPlaceholder && !isActive && !message && (
                      <motion.span
                        key={placeholderIndex}
                        className="absolute left-0 top-1/2 -translate-y-1/2 text-white/60 dark:text-white/70 select-none pointer-events-none font-medium"
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          zIndex: 2,
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

              {/* Voice Assistant Button */}
              <button
                className="p-3 rounded-full hover:bg-white/10 transition text-white/70 hover:text-white"
                title="Voice Assistant"
                type="button"
                tabIndex={-1}
                onClick={handleOpenVoiceAssistant}
              >
                <Mic size={20} />
              </button>

              {/* Send Button */}
              <button
                className={`flex items-center gap-1 p-3 rounded-full font-medium justify-center ml-2 shadow-lg transition-all duration-200
                  ${theme === 'dark' ? 'bg-transparent text-white hover:bg-white/10' : 'bg-transparent text-black hover:bg-black/10'}`}
                title="Send"
                type="button"
                tabIndex={-1}
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                style={{ minWidth: 44, minHeight: 44 }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowUp size={20} />
                )}
              </button>
            </div>

            {/* Quick Suggestions Row - показывается только когда активен */}
            <AnimatePresence>
              {(isActive || message) && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 pb-3"
                >
                  <div className="flex flex-wrap gap-2 mt-2">
                    {QUICK_SUGGESTIONS.map((suggestion, index) => (
                      <motion.button
                        key={suggestion}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          setMessage(suggestion);
                          onSendMessage(suggestion);
                          setMessage('');
                        }}
                        className="px-2 py-1 text-xs rounded-full backdrop-blur-sm bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200"
                      >
                        {suggestion}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Voice Assistant Modal */}
      {showVoiceAssistant && (
        <VoiceAssistantView
          onClose={handleCloseVoiceAssistant}
          isSidebarCollapsed={isSidebarCollapsed}
          onNavigateToSection={onNavigateToSection}
        />
      )}
    </>
  );
};

export default ChatInput; 