"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ParticleBackground from "@/components/ParticleBackground";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Users,
  Pill,
  DollarSign,
  Target,
  Brain,
  Zap,
  BarChart3,
  ArrowRight,
  ChevronRight,
  Eye,
  Download,
  Share2,
  Settings
} from 'lucide-react';

interface AIInsightsPageProps {
  className?: string;
}

interface InsightCard {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  description: string;
  icon: React.ReactNode;
  category: 'key' | 'trend' | 'prediction';
}

export const AIInsightsPage = ({ className }: AIInsightsPageProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'predictions'>('overview');
  const [selectedCard, setSelectedCard] = useState<InsightCard | null>(null);

  const insightCards: InsightCard[] = [
    {
      id: 'revenue-growth',
      title: 'Revenue Growth',
      value: '8.7%',
      change: '+40.3%',
      changeType: 'positive',
      description: 'Quarterly revenue growth showing strong upward trend with improved market penetration.',
      icon: <TrendingUp className="w-5 h-5" />,
      category: 'key'
    },
    {
      id: 'user-engagement',
      title: 'User Engagement',
      value: '34.2%',
      change: '+8.6%',
      changeType: 'positive',
      description: 'Active user engagement rate with significant improvement in session duration.',
      icon: <Users className="w-5 h-5" />,
      category: 'key'
    },
    {
      id: 'conversion-rate',
      title: 'Conversion Rate',
      value: '1.8x',
      change: '+20.0%',
      changeType: 'positive',
      description: 'Sample-to-conversion ratio showing excellent efficiency in user acquisition.',
      icon: <Target className="w-5 h-5" />,
      category: 'key'
    },
    {
      id: 'ai-accuracy',
      title: 'AI Accuracy',
      value: '94.3%',
      change: '+12.1%',
      changeType: 'positive',
      description: 'Machine learning model accuracy with continuous improvement in predictions.',
      icon: <Brain className="w-5 h-5" />,
      category: 'trend'
    },
    {
      id: 'system-performance',
      title: 'System Performance',
      value: '99.8%',
      change: '+0.5%',
      changeType: 'positive',
      description: 'Uptime and system reliability metrics showing excellent infrastructure health.',
      icon: <Activity className="w-5 h-5" />,
      category: 'trend'
    },
    {
      id: 'market-prediction',
      title: 'Market Prediction',
      value: '87.3',
      change: '+15.2%',
      changeType: 'positive',
      description: 'AI-powered market trend prediction accuracy for next quarter.',
      icon: <BarChart3 className="w-5 h-5" />,
      category: 'prediction'
    }
  ];

  const filteredCards = insightCards.filter(card => {
    if (activeTab === 'overview') return card.category === 'key';
    if (activeTab === 'trends') return card.category === 'trend';
    if (activeTab === 'predictions') return card.category === 'prediction';
    return true;
  });

  return (
    <div className={cn("flex w-[100%] flex-col min-h-screen bg-black relative", className)}>
      <div className="absolute inset-0 z-0">
        <ParticleBackground />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,1)_0%,_transparent_100%)]" />
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
      </div>
      
      {/* Content Layer */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Top navigation */}
        <MiniNavbar />

        {/* Main content container */}
        <div className="flex flex-1 flex-col lg:flex-row">
          {/* Left side (main content) */}
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="w-full mt-[150px] max-w-6xl px-6">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-8"
                >
                  {/* Header */}
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 backdrop-blur-xl">
                        <Brain className="w-8 h-8 text-cyan-400" />
                      </div>
                      <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-gray-900 dark:text-white">AI Insights Dashboard</h1>
                    </div>
                    <p className="text-xl text-gray-600 dark:text-white/70 font-light max-w-2xl mx-auto">
                      Real-time analytics and intelligent predictions powered by advanced AI algorithms
                    </p>
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex justify-center">
                    <div className="flex backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-full p-1">
                      {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'trends', label: 'Trends' },
                        { id: 'predictions', label: 'Predictions' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as 'overview' | 'trends' | 'predictions')}
                          className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            activeTab === tab.id
                              ? 'bg-white text-black shadow-lg'
                              : 'text-white/70 hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCards.map((card, index) => (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="group"
                      >
                        <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer">
                          <div className="flex items-center justify-between mb-4">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                              {card.icon}
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="p-1 rounded-full hover:bg-white/10 transition-colors">
                                <Eye className="w-4 h-4 text-white/60" />
                              </button>
                              <button className="p-1 rounded-full hover:bg-white/10 transition-colors">
                                <Download className="w-4 h-4 text-white/60" />
                              </button>
                              <button className="p-1 rounded-full hover:bg-white/10 transition-colors">
                                <Share2 className="w-4 h-4 text-white/60" />
                              </button>
                            </div>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{card.title}</h3>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</span>
                            <span className={`text-sm font-medium ${
                              card.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {card.change}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-500 dark:text-white/60 mb-4 line-clamp-2">{card.description}</p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400 dark:text-white/40 uppercase tracking-wide">
                              {card.category}
                            </span>
                            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors group-hover:translate-x-1 duration-200">
                              <ArrowRight className="w-4 h-4 text-gray-500 dark:text-white/60" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center gap-4 pt-8">
                    <motion.button 
                      className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Zap className="w-4 h-4" />
                      Generate Report
                    </motion.button>
                    <motion.button 
                      className="px-8 py-3 border border-white/20 text-white font-medium rounded-full hover:bg-white/10 transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      View All Insights
                    </motion.button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnimatedNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  return (
    <motion.a
      href={href}
      className="text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.a>
  );
};

function MiniNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="flex items-center justify-between p-6 backdrop-blur-[2px] bg-white/5 border-b border-white/10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <Brain className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">CLAIRE</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <AnimatedNavLink href="/">Dashboard</AnimatedNavLink>
        <AnimatedNavLink href="/analytics">Analytics</AnimatedNavLink>
        <AnimatedNavLink href="/insights">Insights</AnimatedNavLink>
        <AnimatedNavLink href="/reports">Reports</AnimatedNavLink>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
          <Activity className="w-5 h-5 text-gray-600 dark:text-white/70" />
        </button>
        <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
          <Users className="w-5 h-5 text-gray-600 dark:text-white/70" />
        </button>
        <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
          <Settings className="w-5 h-5 text-gray-600 dark:text-white/70" />
        </button>
      </div>

      {/* Mobile menu button */}
      <button
        className="md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        onClick={toggleMenu}
      >
        <ChevronRight className={`w-5 h-5 text-gray-600 dark:text-white/70 transition-transform ${isMenuOpen ? 'rotate-90' : ''}`} />
      </button>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-black/90 backdrop-blur-xl border-b border-white/10 md:hidden"
          >
            <div className="flex flex-col p-4 space-y-4">
              <AnimatedNavLink href="/">Dashboard</AnimatedNavLink>
              <AnimatedNavLink href="/analytics">Analytics</AnimatedNavLink>
              <AnimatedNavLink href="/insights">Insights</AnimatedNavLink>
              <AnimatedNavLink href="/reports">Reports</AnimatedNavLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
