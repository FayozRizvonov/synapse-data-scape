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
  Phone,
  Pill,
  Megaphone
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
      color: 'var(--chart-senary)',
      icon: <Smartphone className="w-6 h-6 text-[var(--chart-senary)] dark:text-[var(--chart-primary)]" />
    },
    {
      id: 'traditional',
      name: 'Traditional Shopper',
      description: 'Prefers in-store experiences with some digital touchpoints',
      color: 'var(--chart-quinary)',
      icon: <Store className="w-6 h-6 text-[var(--chart-quinary)] dark:text-[var(--chart-quinary)]" />
    },
    {
      id: 'hybrid',
      name: 'Hybrid Explorer',
      description: 'Combines online research with offline validation',
      color: 'var(--chart-tertiary)',
      icon: <Users className="w-6 h-6 text-[var(--chart-tertiary)] dark:text-[var(--chart-tertiary)]" />
    },
    {
      id: 'premium',
      name: 'Premium Customer',
      description: 'High-value customer seeking personalized service',
      color: 'var(--chart-secondary)',
      icon: <Star className="w-6 h-6 text-[var(--chart-secondary)] dark:text-[var(--chart-secondary)]" />
    }
  ];

  const touchpoints: Touchpoint[] = [
    { id: 'samples', name: 'Samples', icon: <Pill className="w-8 h-8 text-[var(--chart-primary)]" />, color: 'var(--chart-primary)' },
    { id: 'speaker-program', name: 'Speaker Program', icon: <Megaphone className="w-8 h-8 text-[var(--chart-primary)]" />, color: 'var(--chart-primary)' },
    { id: 'tablet', name: 'Tablet', icon: <Smartphone className="w-8 h-8 text-[var(--chart-primary)]" />, color: 'var(--chart-primary)' },
    { id: 'search', name: 'Search', icon: <Search className="w-8 h-8 text-[var(--chart-primary)]" />, color: 'var(--chart-primary)' }
  ];

  const journeyPaths: JourneyPath[] = [
    {
      personaId: 'tech-savvy',
      touchpoints: ['samples', 'speaker-program', 'tablet', 'search'],
      outcome: 'Mobile Purchase'
    },
    {
      personaId: 'traditional',
      touchpoints: ['samples', 'speaker-program', 'search'],
      outcome: 'In-Store Purchase'
    },
    {
      personaId: 'hybrid',
      touchpoints: ['samples', 'tablet'],
      outcome: 'Omnichannel Purchase'
    },
    {
      personaId: 'premium',
      touchpoints: ['tablet', 'search'],
      outcome: 'Premium Service'
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setShowPaths(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const getPersonaColor = (personaId: string) => {
    return personas.find(p => p.id === personaId)?.color || 'var(--chart-primary)';
  };

  const getActivePath = () => {
    return journeyPaths.find(path => path.personaId === activePersona);
  };

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="backdrop-blur-[2px] bg-background/5 border border-border/10 rounded-2xl p-6 transition-all">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">
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
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 min-h-[120px] ${
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
                    className={`p-4 rounded-xl border-2 transition-all duration-300 min-h-[120px] ${
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
                      <h4 className="font-semibold text-slate-800 dark:text-white">{persona?.name}</h4>
                    </div>
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