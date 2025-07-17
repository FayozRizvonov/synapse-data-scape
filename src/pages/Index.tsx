import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import FarmaMetricsWithAssistant from '@/components/FarmaMetricsWithAssistant';
import ChatInput from '@/components/ChatInput';
import ChatView from '@/components/ChatView';
import Settings from '@/components/Settings';
import ParticleBackground from '@/components/ParticleBackground';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare,
  BarChart3,
  Zap,
  Target,
  Activity,
  Heart
} from 'lucide-react';
import FinanceMetrics from '@/components/FinanceMetrics';
import { GlowCard } from '@/components/ui/spotlight-card';

const Index = () => {
  const [activeSection, setActiveSection] = useState('ai-insights');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const { sendMessage, isLoading, lastAIResponse, clearChat } = useAIAssistant();

  useEffect(() => {
    if (lastAIResponse) {
      setIsChatOpen(true);
    }
  }, [lastAIResponse]);

  const handleSendMessage = async (message: string) => {
    await sendMessage(message);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    clearChat();
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleNavigateToSection = (section: string) => {
    let targetSection = 'ai-insights';
    
    switch (section) {
      case 'pharma-sm':
        targetSection = 'pharma-sm';
        break;
      case 'key-metrics':
        targetSection = 'pharma-sm';
        break;
      case 'situation':
        targetSection = 'pharma-sm';
        break;
      case 'scenario-comparison':
        targetSection = 'pharma-sm';
        break;
      case 'color-palette':
        targetSection = 'color-palette';
        break;
      case 'settings':
        targetSection = 'settings';
        break;
      case 'finance':
        targetSection = 'finance';
        break;
      default:
        targetSection = 'ai-insights';
    }
    
    setActiveSection(targetSection);
  };

  const renderWelcomeContent = () => (
    <div className="relative p-6 space-y-8 max-w-full min-h-screen">
      {/* Header */}
      <div className="relative z-10 text-center space-y-4 pt-16">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="rounded-xl overflow-hidden">
            <img src="/images/claire_logo.png" alt="CLAIRE Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-gray-900 dark:text-white">CLAIRE AI</h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-white/70 font-light max-w-2xl mx-auto">
          CLAIRE AI — Commercial Life Science AI recommendation engine. It helps you analyze data,
          make informed decisions and optimize business processes with advanced AI capabilities.
        </p>
      </div>

      {/* Features Grid */}
      <div className="relative z-10 grid grid-cols-3 gap-4 max-w-5xl mx-auto justify-center items-start">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="group"
        >
          <GlowCard className="cursor-pointer" glowColor="blue">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI Assistant</h3>
            <p className="text-sm text-gray-500 dark:text-white/60 mb-4">
              Ask questions about your data and get instant answers with intelligent visualization.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-white/40 uppercase tracking-wide">
                Chat
              </span>
            </div>
          </GlowCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="group"
        >
          <GlowCard className="cursor-pointer" glowColor="blue">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Pharma S&M Analytics</h3>
            <p className="text-sm text-gray-500 dark:text-white/60 mb-4">
              Advanced analytics for the pharmaceutical industry with comprehensive key metrics.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-white/40 uppercase tracking-wide">
                Analytics
              </span>
            </div>
          </GlowCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="group"
        >
          <GlowCard className="cursor-pointer" glowColor="blue">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Real-time Data</h3>
            <p className="text-sm text-gray-500 dark:text-white/60 mb-4">
              Real-time data updates and insights for making operational decisions.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-white/40 uppercase tracking-wide">
                Live
              </span>
            </div>
          </GlowCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="group"
        >
          <GlowCard className="cursor-pointer" glowColor="blue">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                <Target className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Predictive Analytics</h3>
            <p className="text-sm text-gray-500 dark:text-white/60 mb-4">
              Advanced predictive models to forecast trends and optimize strategies.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-white/40 uppercase tracking-wide">
                Predict
              </span>
            </div>
          </GlowCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="group"
        >
          <GlowCard className="cursor-pointer" glowColor="blue">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Performance Monitoring</h3>
            <p className="text-sm text-gray-500 dark:text-white/60 mb-4">
              Comprehensive monitoring and reporting of business performance metrics.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-white/40 uppercase tracking-wide">
                Monitor
              </span>
            </div>
          </GlowCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="group"
        >
          <GlowCard className="cursor-pointer" glowColor="blue">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                <Heart className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Smart Recommendations</h3>
            <p className="text-sm text-gray-500 dark:text-white/60 mb-4">
              AI-powered recommendations to optimize your business strategies and decisions.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-white/40 uppercase tracking-wide">
                Smart
              </span>
            </div>
          </GlowCard>
        </motion.div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'pharma-sm':
        return <FarmaMetricsWithAssistant />;
      case 'finance':
        return <FinanceMetrics />;
      case 'color-palette':
        return <Settings />;
      case 'settings':
        return <Settings />;
      case 'ai-insights':
      default:
        return renderWelcomeContent();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Particle Background */}
      <ParticleBackground />
      
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

      <ChatInput 
        onSendMessage={handleSendMessage} 
        isSidebarCollapsed={isSidebarCollapsed} 
        isLoading={isLoading}
        onNavigateToSection={handleNavigateToSection}
      />

      {isChatOpen && (
        <ChatView 
          onClose={handleCloseChat} 
          isSidebarCollapsed={isSidebarCollapsed}
          onNavigateToSection={handleNavigateToSection}
        />
      )}
    </div>
  );
};

export default Index;
