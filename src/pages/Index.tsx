import React, { useState } from 'react';
import AnimatedBackground from '@/components/AnimatedBackground';
import Sidebar from '@/components/Sidebar';
import FarmaMetricsWithAssistant from '@/components/FarmaMetricsWithAssistant';
import ChatInput from '@/components/ChatInput';
import ChatView from '@/components/ChatView';
import { Bot } from 'lucide-react';

const Index = () => {
  const [activeSection, setActiveSection] = useState('ai-insights');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSendMessage = (message: string) => {
    setInitialMessage(message);
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setInitialMessage('');
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'pharma-sm':
        return <FarmaMetricsWithAssistant />;
      case 'ai-insights':
      default:
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-center">
                 <div className="inline-block bg-primary/10 p-5 rounded-2xl mb-6">
                    <img src="/images/gsisai_logo.png" alt="GSIS AI Logo" className="w-16 h-16 object-contain" />
                </div>
                <h1 className="text-5xl font-bold text-white">GSIS AI Assistant</h1>
                <p className="text-white/60 mt-4 text-xl max-w-2xl">
                    Welcome to the future of business intelligence. Ask me anything about your data.
                </p>
            </div>
        );
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 flex min-h-screen">
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
        
        <main className={`flex-1 relative transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'ml-16' : 'ml-64'
        } ${isChatOpen ? 'blur-md' : ''}`}>
          {renderContent()}
        </main>
      </div>

      {!isChatOpen && (
        <ChatInput onSendMessage={handleSendMessage} isSidebarCollapsed={isSidebarCollapsed} />
      )}

      {isChatOpen && (
        <ChatView 
          initialMessage={initialMessage} 
          onClose={handleCloseChat} 
          isSidebarCollapsed={isSidebarCollapsed} 
        />
      )}

      {/* Floating Tech Elements */}
      <div className="fixed top-20 right-20 w-4 h-4 rounded-full bg-primary/30 pulse-glow z-5"></div>
      <div className="fixed bottom-32 left-80 w-3 h-3 rounded-full bg-primary/20 pulse-glow z-5" style={{ animationDelay: '1s' }}></div>
      <div className="fixed top-1/2 right-1/3 w-2 h-2 rounded-full bg-primary/40 pulse-glow z-5" style={{ animationDelay: '2s' }}></div>
    </div>
  );
};

export default Index;
