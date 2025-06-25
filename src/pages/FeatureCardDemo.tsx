import React, { useState, useEffect } from 'react';
import { FeatureCard } from '@/components/FeatureCard';
import ParticleBackground from '@/components/ParticleBackground';
import { 
  TrendingUp, 
  Users,
  Pill,
  DollarSign,
  Target,
  Stethoscope,
  Calendar,
  BarChart3,
  Activity
} from 'lucide-react';

const FeatureCardDemo = () => {
  const features = [
    {
      title: 'QoQ Revenue Growth',
      icon: TrendingUp,
      description: 'Quarterly revenue growth showing strong upward trend',
      value: '8.7%',
      change: '+40.3%',
      changeType: 'positive' as const,
      comparison: 'vs. last quarter'
    },
    {
      title: 'Patient Share / Prescriptions',
      icon: Users,
      description: 'Market share of prescriptions and patient coverage',
      value: '34.2%',
      change: '+8.6%',
      changeType: 'positive' as const,
      comparison: 'vs. last quarter'
    },
    {
      title: 'Sample-to-Script Ratio',
      icon: Pill,
      description: 'Efficiency of sample distribution to prescription conversion',
      value: '1.8x',
      change: '+20.0%',
      changeType: 'positive' as const,
      comparison: 'vs. last quarter'
    },
    {
      title: 'Rebate Spend vs ROI',
      icon: DollarSign,
      description: 'Return on investment for rebate spending programs',
      value: '4.3x',
      change: '+16.2%',
      changeType: 'positive' as const,
      comparison: 'vs. last quarter'
    },
    {
      title: 'Market Access Score',
      icon: Target,
      description: 'Overall market accessibility and penetration score',
      value: '87.3',
      change: '+12.1%',
      changeType: 'positive' as const,
      comparison: 'vs. last quarter'
    },
    {
      title: 'Base Sales',
      icon: Activity,
      description: 'Baseline revenue without marketing efforts',
      value: '$12.0M',
      change: '+93.14%',
      changeType: 'positive' as const,
      comparison: 'Revenue Attribution'
    },
    {
      title: 'Seasonality',
      icon: Calendar,
      description: 'Seasonal revenue patterns and cyclical variations',
      value: '$1.2M',
      change: '+6.86%',
      changeType: 'positive' as const,
      comparison: 'Revenue Attribution'
    },
    {
      title: 'Promotion Impact',
      icon: BarChart3,
      description: 'Direct impact of promotional activities',
      value: '$2.1M',
      change: '+15.3%',
      changeType: 'positive' as const,
      comparison: 'Revenue Attribution'
    }
  ];

  return (
    <div className="relative min-h-screen bg-black">
      {/* Particle Background */}
      <ParticleBackground />
      
      <div className="relative z-10 p-6 space-y-8 max-w-full">
        {/* Header */}
        <div className="text-center space-y-4 pt-16">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-xl bg-white/10 border border-white/30">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white text-glow">Feature Cards Demo</h1>
          </div>
          <p className="text-white/70 max-w-2xl mx-auto">
            Showcasing the new grid feature cards design with random patterns and hover effects
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              feature={feature}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30"
              style={{ animation: `fade-in 0.5s ease-out ${index * 0.1}s forwards` }}
            />
          ))}
        </div>

        {/* Description */}
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">About This Design</h2>
            <p className="text-gray-600 dark:text-white/70">
              These feature cards use the shadcn grid pattern design with random geometric patterns, 
              subtle gradients, and smooth hover animations. Each card has a unique random pattern 
              that adds visual interest while maintaining consistency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureCardDemo; 