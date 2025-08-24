import React, { useState } from 'react';
import { FeatureCard } from './FeatureCard';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Percent, PieChart } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';

const financeMetrics = [
  {
    id: 'appliance-sales',
    title: 'Appliance Sales',
    value: '1,675 units',
    change: '+17%',
    changeType: 'positive' as const,
    comparison: 'above the normal range',
    icon: BarChart3,
    description: 'Appliance Sales is seeing an unusual spike.'
  },
  {
    id: 'revenue',
    title: 'Revenue',
    value: '$10.7M',
    change: '+0%',
    comparison: '',
    icon: DollarSign,
    description: 'Revenue is within the normal range.'
  },
  {
    id: 'campaign-roi',
    title: 'Campaign ROI',
    value: '379%',
    change: '+0%',
    comparison: '',
    icon: Percent,
    description: 'Campaign ROI is within the normal range.'
  }
];

const FinanceMetrics: React.FC = () => {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const defaultCards = 4;
  const visibleCards = expanded ? financeMetrics.length : defaultCards;
  const hasMoreCards = financeMetrics.length > defaultCards;

  return (
    <div className="relative min-h-screen bg-white dark:bg-black">
      <div className="relative z-10 p-6 space-y-8 max-w-full">
        {/* Header */}
        <div className="text-center space-y-4 pt-16">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-xl bg-white/10 border border-white/30">
              <DollarSign className="w-8 h-8 text-gray-900 dark:text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white text-glow">Finance Analytics</h1>
          </div>
          <p className="text-gray-600 dark:text-white/70 max-w-2xl mx-auto">
            Financial analytics dashboard with real-time metrics and insights
          </p>
        </div>
        {/* Key Metrics Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-glow">Key Metrics</h2>
            {hasMoreCards && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 hover:bg-white/10 text-gray-900 dark:text-white/70 hover:text-white transition-colors"
              >
                <span className="text-sm">
                  {expanded ? 'Hide' : `Show All (${financeMetrics.length})`}
                </span>
                {expanded ? (
                  <TrendingUp className="w-4 h-4 transition-transform duration-300" />
                ) : (
                  <BarChart3 className="w-4 h-4 transition-transform duration-300" />
                )}
              </Button>
            )}
          </div>
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${expanded ? 'max-h-none' : ''}`}> 
            <div className="grid gap-6 transition-all duration-500 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {financeMetrics.slice(0, visibleCards).map((metric, index) => (
                <FeatureCard
                  key={metric.id}
                  feature={{
                    title: metric.title,
                    icon: metric.icon,
                    description: metric.description,
                    value: metric.value,
                    change: metric.change,
                    changeType: metric.changeType,
                    comparison: metric.comparison
                  }}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30"
                  style={{ animation: `fade-in 0.5s ease-out ${index * 0.1}s forwards` }}
                />
              ))}
            </div>
          </div>
          {hasMoreCards && !expanded && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setExpanded(true)}
                className="flex items-center gap-2 hover:bg-white/10 border-white/30 text-gray-900 dark:text-white/70 hover:text-white transition-all"
              >
                <span>Show {financeMetrics.length - defaultCards} more cards</span>
                <BarChart3 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceMetrics; 