
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Share, ExternalLink, TrendingUp, TrendingDown, Activity, Users, Pill, DollarSign, Target, BarChart3, Calendar } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';
import { MetricCard } from '@/data/metricsKnowledgeBase';

interface ChatMetricCardProps {
  metric: MetricCard;
  onGoToCard: (metricId: string, section: string) => void;
  onShowChart: (metricId: string) => void;
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

const ChatMetricCard: React.FC<ChatMetricCardProps> = ({ metric, onGoToCard, onShowChart }) => {
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

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <IconComponent className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-sm font-medium text-foreground">
              {metric.title}
            </CardTitle>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {metric.category === 'key' ? 'KEY' : 'SITUATION'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <AnimatedNumber 
            value={parseValue(metric.value)}
            className="text-2xl font-bold text-foreground"
            formatter={(val) => {
                const original = metric.value;
                if (original.includes('M')) return `$${(val).toFixed(1)}M`;
                if (original.includes('%')) return `${val.toFixed(1)}%`;
                if (original.includes('x')) return `${val.toFixed(1)}x`;
                return val.toFixed(0);
            }}
          />
          <Badge 
            variant={metric.changeType === 'positive' ? 'default' : 'destructive'}
            className="mb-1 bg-primary/10 text-primary border-primary/20"
          >
            {metric.changeType === 'positive' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            <AnimatedNumber 
              value={parseValue(metric.change)}
              formatter={(val) => {
                  const original = metric.change;
                  if (original.includes('%')) return `+${val.toFixed(1)}%`;
                  return `+${val.toFixed(1)}`;
              }}
            />
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground">{metric.comparison}</p>
        
        {metric.details && (
          <div className="p-3 rounded-lg bg-background/20 border border-primary/10">
            <p className="text-xs text-muted-foreground mb-2">{metric.details.description}</p>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex-1 bg-background/10 border-primary/20 text-primary hover:bg-primary/10"
          >
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onGoToCard(metric.id, metric.section)}
            className="flex-1 bg-background/10 border-primary/20 text-primary hover:bg-primary/10"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Go to Card
          </Button>
          
          {metric.chartData && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShowChart(metric.id)}
              className="bg-background/10 border-primary/20 text-primary hover:bg-primary/10"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatMetricCard;
