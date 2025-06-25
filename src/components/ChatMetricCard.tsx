import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface ChatMetricCardProps {
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

const ChatMetricCard: React.FC<ChatMetricCardProps> = ({ 
  metric, 
  onGoToCard, 
  onShowChart, 
  isExpanded = false,
  onToggleExpand 
}) => {
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

  return (
    <Card className="backdrop-blur-[2px] bg-white/5 border border-white/10 transition-all duration-300 hover:bg-white/10 hover:border-white/20 max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
              <IconComponent className="w-5 h-5 text-cyan-400" />
            </div>
            <CardTitle className="text-sm font-medium text-white">
              {metric.title}
            </CardTitle>
          </div>
          <Badge variant="outline" className="bg-white/10 text-white/70 border-white/20">
            {metric.category === 'key' ? 'KEY' : metric.category === 'situation' ? 'SITUATION' : 'SCENARIO'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Value */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
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
          </div>
          <div className="flex items-center justify-center gap-2 mt-1">
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
            <span className="text-xs text-gray-400 dark:text-white/40">
              {metric.comparison}
            </span>
          </div>
        </div>

        {/* Description */}
        {metric.details?.description && (
          <div className="text-sm text-gray-500 dark:text-white/60">
            {metric.details.description}
          </div>
        )}

        {/* Expandable Details */}
        {metric.details?.breakdown && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="w-full justify-between text-xs text-white/60 hover:text-white hover:bg-white/10"
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
                    <span className="text-gray-400 dark:text-white/40">{item.label}:</span>
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
            <div className="text-sm font-medium mb-2 text-white">Data Chart</div>
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
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onGoToCard(metric.id, metric.section)}
            className="flex-1 text-xs border-white/20 text-white hover:bg-white/10"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View Card
          </Button>
          {metric.chartData && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShowChart(metric.id)}
              className="flex-1 text-xs border-white/20 text-white hover:bg-white/10"
            >
              <BarChartIcon className="w-3 h-3 mr-1" />
              Show Chart
            </Button>
          )}
        </div>

        {/* Additional Actions */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="flex-1 text-xs text-white/60 hover:text-white hover:bg-white/10"
          >
            <Share className="w-3 h-3 mr-1" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="flex-1 text-xs text-white/60 hover:text-white hover:bg-white/10"
          >
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatMetricCard;
