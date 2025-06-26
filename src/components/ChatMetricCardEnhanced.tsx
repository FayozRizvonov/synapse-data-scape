import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BauhausBorder } from './ui/bauhaus-border';
import { useTheme } from '@/hooks/useTheme';
import { 
  Share, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  Pill, 
  DollarSign, 
  Target, 
  BarChart3, 
  Calendar,
  Download,
  BarChart as BarChartIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';
import { MetricCard } from '@/data/metricsKnowledgeBase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';

interface ChatMetricCardEnhancedProps {
  metric: MetricCard;
  onGoToCard: (metricId: string, section: string) => void;
  onShowChart: (metricId: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const iconMap = {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Pill,
  DollarSign,
  Target,
  BarChart3,
  Calendar
};

const ChatMetricCardEnhanced: React.FC<ChatMetricCardEnhancedProps> = ({ 
  metric, 
  onGoToCard, 
  onShowChart, 
  isExpanded = false,
  onToggleExpand 
}) => {
  const { theme } = useTheme();
  const IconComponent = iconMap[metric.icon as keyof typeof iconMap] || Activity;

  const parseValue = (valueStr: string) => {
    return parseFloat(valueStr.replace(/[$,%xM+]/g, ''));
  };

  const handleShare = () => {
    const shareText = `${metric.title}: ${metric.value} (${metric.change} ${metric.comparison})`;
    if (navigator.share) {
      navigator.share({
        title: metric.title,
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  const handleDownload = () => {
    const data = {
      title: metric.title,
      value: metric.value,
      change: metric.change,
      comparison: metric.comparison,
      description: metric.details?.description,
      breakdown: metric.details?.breakdown
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metric.id}-data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Настройки для Key Metrics
  const isKeyMetric = metric.category === 'key';
  const borderWidth = isKeyMetric ? '4px' : '2px';
  const accentColor = isKeyMetric ? '#24d200' : '#156ef6';
  const backgroundColor = theme === 'dark' ? '#151419' : '#fff';

  return (
    <div className="p-2 max-w-md backdrop-blur-[2px] bg-white/5 border border-white/10 rounded-2xl">
      <BauhausBorder
        borderRadius="1.25em"
        borderWidth={borderWidth}
        accentColor={accentColor}
        backgroundColor={backgroundColor}
        className="transition-all duration-300 hover:scale-105"
      >
        <div className="relative overflow-hidden p-6">
          {/* Grid Pattern Background */}
          <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
            <div className="from-foreground/5 to-foreground/1 absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] opacity-100">
              <GridPattern
                width={20}
                height={20}
                x="-12"
                y="4"
                squares={genRandomPattern()}
                className="fill-foreground/5 stroke-foreground/25 absolute inset-0 h-full w-full mix-blend-overlay"
              />
            </div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <IconComponent className="text-foreground/75 size-6" strokeWidth={1} aria-hidden />
              <div>
                <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                  {metric.title}
                </h3>
                <Badge variant="outline" className="text-xs bg-white/10 text-white/70 border-white/20 mt-1">
                  {metric.category === 'key' ? 'KEY' : metric.category === 'situation' ? 'SITUATION' : 'SCENARIO'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Main Value */}
          <div className="mt-4 flex items-end gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              <AnimatedNumber 
                value={parseValue(metric.value)}
                formatter={(val) => {
                  const original = metric.value;
                  if (original.includes('M')) return `$${(val).toFixed(1)}M`;
                  if (original.includes('%')) return `${val.toFixed(1)}%`;
                  if (original.includes('x')) return `${val.toFixed(1)}x`;
                  return val.toFixed(0);
                }}
              />
            </span>
            {metric.change && (
              <div className="flex items-center gap-1">
                {metric.changeType === 'positive' ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-sm font-medium ${
                  metric.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {metric.change}
                </span>
              </div>
            )}
          </div>

          {/* Comparison */}
          {metric.comparison && (
            <p className="text-xs text-gray-700 dark:text-slate-400 mt-1">{metric.comparison}</p>
          )}

          {/* Description */}
          <p className="relative z-20 mt-2 text-xs font-light text-gray-700 dark:text-slate-400">
            {metric.description}
          </p>

          {/* Expandable Details */}
          {metric.details?.breakdown && (
            <div className="mt-4 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
                className="w-full justify-between text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span>Details</span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
              
              {isExpanded && (
                <div className="space-y-2 animate-fade-in-up">
                  {metric.details.breakdown.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-400 dark:text-gray-500">{item.label}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chart Data */}
          {isExpanded && metric.chartData && (
            <div className="mt-4 animate-fade-in-up">
              <div className="text-sm font-medium mb-2 text-gray-900 dark:text-white">Data Chart</div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metric.chartData.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--chart-axis)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--chart-axis)', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--chart-tooltip-bg)',
                        borderColor: 'var(--chart-primary)',
                        color: 'var(--chart-tooltip-text)',
                        fontSize: 12,
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                      }}
                    />
                    <Bar dataKey="revenue" fill="var(--chart-primary)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGoToCard(metric.id, metric.section)}
              className="flex-1 text-xs border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              View Card
            </Button>
            {metric.chartData && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onShowChart(metric.id)}
                className="flex-1 text-xs border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <BarChartIcon className="w-3 h-3 mr-1" />
                Show Chart
              </Button>
            )}
          </div>

          {/* Additional Actions */}
          <div className="flex gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="flex-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
            >
              <Share className="w-3 h-3 mr-1" />
              Share
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="flex-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </BauhausBorder>
    </div>
  );
};

// Grid Pattern Component
function GridPattern({
  width,
  height,
  x,
  y,
  squares,
  ...props
}: React.ComponentProps<'svg'> & { width: number; height: number; x: string; y: string; squares?: number[][] }) {
  const patternId = React.useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern id={patternId} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([x, y], index) => (
            <rect strokeWidth="0" key={index} width={width + 1} height={height + 1} x={x * width} y={y * height} />
          ))}
        </svg>
      )}
    </svg>
  );
}

function genRandomPattern(length?: number): number[][] {
  length = length ?? 5;
  return Array.from({ length }, () => [
    Math.floor(Math.random() * 4) + 7, // random x between 7 and 10
    Math.floor(Math.random() * 6) + 1, // random y between 1 and 6
  ]);
}

export default ChatMetricCardEnhanced; 