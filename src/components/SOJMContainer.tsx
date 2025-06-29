import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Tv, 
  Monitor, 
  Smartphone, 
  Search, 
  Mail, 
  Store, 
  Users, 
  Target, 
  TrendingUp,
  ArrowRight,
  ArrowDown,
  CheckCircle,
  Star,
  Heart,
  ShoppingCart,
  Phone
} from 'lucide-react';
import ProcessFlowDiagram from './ProcessFlowDiagram';

interface Persona {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

interface Touchpoint {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

interface JourneyPath {
  personaId: string;
  touchpoints: string[];
  outcome: string;
}

function hexToRgba(hex: string, alpha: number) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDark;
}

const SOJMContainer: React.FC = () => {
  const [activePersona, setActivePersona] = useState<string>('tech-savvy');
  const [showPaths, setShowPaths] = useState(false);
  const isDarkMode = useIsDarkMode();

  const personas: Persona[] = [
    {
      id: 'tech-savvy',
      name: 'Tech-Savvy Millennial',
      description: 'Digital-first, mobile-native user who researches extensively online',
      color: '#3B82F6',
      icon: <Smartphone className="w-6 h-6 text-blue-500 dark:text-cyan-400" />
    },
    {
      id: 'traditional',
      name: 'Traditional Shopper',
      description: 'Prefers in-store experiences with some digital touchpoints',
      color: '#10B981',
      icon: <Store className="w-6 h-6 text-green-500 dark:text-green-400" />
    },
    {
      id: 'hybrid',
      name: 'Hybrid Explorer',
      description: 'Combines online research with offline validation',
      color: '#F59E0B',
      icon: <Users className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
    },
    {
      id: 'premium',
      name: 'Premium Customer',
      description: 'High-value customer seeking personalized service',
      color: '#8B5CF6',
      icon: <Star className="w-6 h-6 text-purple-500 dark:text-purple-400" />
    }
  ];

  const touchpoints: Touchpoint[] = [
    { id: 'tv', name: 'TV Advertising', icon: <Tv className="w-8 h-8 text-red-500 dark:text-red-400" />, color: '#EF4444' },
    { id: 'display', name: 'Display Ads', icon: <Monitor className="w-8 h-8 text-orange-500 dark:text-orange-400" />, color: '#F97316' },
    { id: 'social', name: 'Social Media', icon: <Heart className="w-8 h-8 text-pink-500 dark:text-pink-400" />, color: '#EC4899' },
    { id: 'website', name: 'Website', icon: <Monitor className="w-8 h-8 text-blue-500 dark:text-cyan-400" />, color: '#3B82F6' },
    { id: 'search', name: 'Search', icon: <Search className="w-8 h-8 text-green-500 dark:text-green-400" />, color: '#10B981' },
    { id: 'mobile', name: 'Mobile App', icon: <Smartphone className="w-8 h-8 text-indigo-500 dark:text-cyan-400" />, color: '#6366F1' },
    { id: 'store', name: 'Physical Store', icon: <Store className="w-8 h-8 text-purple-500 dark:text-purple-400" />, color: '#8B5CF6' },
    { id: 'support', name: 'Customer Service', icon: <Phone className="w-8 h-8 text-yellow-500 dark:text-yellow-400" />, color: '#F59E0B' },
    { id: 'email', name: 'Email/SMS', icon: <Mail className="w-8 h-8 text-cyan-500 dark:text-cyan-400" />, color: '#06B6D4' }
  ];

  const journeyPaths: JourneyPath[] = [
    {
      personaId: 'tech-savvy',
      touchpoints: ['social', 'website', 'mobile', 'email'],
      outcome: 'Mobile Purchase'
    },
    {
      personaId: 'traditional',
      touchpoints: ['tv', 'store', 'support'],
      outcome: 'In-Store Purchase'
    },
    {
      personaId: 'hybrid',
      touchpoints: ['search', 'website', 'store', 'mobile'],
      outcome: 'Omnichannel Purchase'
    },
    {
      personaId: 'premium',
      touchpoints: ['display', 'website', 'support', 'store'],
      outcome: 'Premium Service'
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setShowPaths(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const getPersonaColor = (personaId: string) => {
    return personas.find(p => p.id === personaId)?.color || '#6B7280';
  };

  const getActivePath = () => {
    return journeyPaths.find(path => path.personaId === activePersona);
  };

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl p-6 transition-all">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-4">
            Omnichannel Customer Journey Framework
          </h1>
          <p className="text-lg text-slate-600 dark:text-white/70 max-w-3xl mx-auto">
            Comprehensive mapping of customer touchpoints across multiple channels and personas
          </p>
        </motion.div>
        {/* Main Framework */}
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Customer Personas - Left Side */}
          <motion.div 
            className="col-span-12 lg:col-span-3"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-600 dark:text-cyan-400" />
              Customer Personas
            </h3>
            <div className="space-y-4">
              {personas.map((persona, index) => {
                const isActive = activePersona === persona.id;
                const style = isActive && isDarkMode ? { backgroundColor: hexToRgba(persona.color, 0.15), borderColor: persona.color } : undefined;
                return (
                  <motion.div
                    key={persona.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      isActive
                        ? `border-blue-500 bg-blue-50 shadow-lg${isDarkMode ? '' : ''}`
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-cyan-700'
                    }`}
                    style={style}
                    onClick={() => setActivePersona(persona.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${persona.color}20`, color: persona.color }}
                      >
                        {persona.icon}
                      </div>
                      <h4 className="font-semibold text-slate-800 dark:text-white">{persona.name}</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-white/70">{persona.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
          {/* Process Flow Diagram - Center */}
          <div className="col-span-12 lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <ProcessFlowDiagram activePersona={activePersona} />
            </motion.div>
          </div>
          {/* Outcomes and Conversions - Right Side */}
          <motion.div
            className="col-span-12 lg:col-span-3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              Conversion Outcomes
            </h3>
            <div className="space-y-4">
              {journeyPaths.map((path, index) => {
                const persona = personas.find(p => p.id === path.personaId);
                const isActive = activePersona === path.personaId;
                return (
                  <motion.div
                    key={path.personaId}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      isActive
                        ? 'border-green-500 bg-green-50 shadow-lg dark:border-green-400 dark:bg-green-900/20'
                        : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/5'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle className={`w-5 h-5 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-white/40'}`} />
                      <h4 className="font-semibold text-slate-800 dark:text-white">{path.outcome}</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-white/70 mb-3">
                      {persona?.name}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {path.touchpoints.map((touchpointId) => {
                        const touchpoint = touchpoints.find(t => t.id === touchpointId);
                        return (
                          <span
                            key={touchpointId}
                            className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/80"
                          >
                            {touchpoint?.name}
                          </span>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SOJMContainer; 