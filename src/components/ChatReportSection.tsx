import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Lightbulb, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import ChartRenderer, { inferChartType } from '@/components/ChartRenderer';

interface ReportSectionProps {
  section: {
    title: string;
    short: string;
    full: {
      snapshot: string[];
      chart: {
        type: 'bar' | 'line' | 'pie';
        x: { label: string };
        y: { label: string };
        series: Array<{ name: string; data: number[] }>;
        style: { colors: string[]; height: number };
      };
      recommendations: string[];
    };
  };
  index: number;
}

const ChatReportSection: React.FC<ReportSectionProps> = ({ section, index }) => {
  const formatNumericBold = (text: string) => {
    const parts = text.split(/(\$?\d+(?:\.\d+)?\s?(?:M|B|K|%|x)?)/g);
    return (
      <>
        {parts.map((p, i) => {
          const isNumber = /\$?\d+(?:\.\d+)?\s?(?:M|B|K|%|x)?/.test(p);
          return isNumber ? <strong key={i} className="font-semibold text-gray-900 dark:text-white">{p}</strong> : <span key={i}>{p}</span>;
        })}
      </>
    );
  };
  const renderChart = () => {
    const { chart } = section.full;

    // Build data matrix
    const maxLen = Math.max(...chart.series.map(s => s.data.length));
    const seriesKeys = chart.series.map((s, idx) => ({ name: s.name, key: `s${idx}` }));

    let data: Array<Record<string, number | string>> = [];
    if (chart.type === 'pie' && chart.series.length === 1) {
      // For pie: convert single series into name/value pairs
      // Prefer explicit categories if provided by the model
      const categories: string[] | undefined =
        // @ts-expect-error - optional fields may exist in AI payload
        chart.x?.categories || (chart as any).categories;
      // Fallback: infer by semantics from title
      const inferredCats = /channel/i.test(section.title)
        ? ['Phone Calls', 'Digital Video', 'Email', 'Field Reps', 'Events', 'Social']
        : undefined;
      data = chart.series[0].data.map((value, i) => ({
        name: (categories && categories[i]) || (inferredCats && inferredCats[i]) || `Item ${i + 1}`,
        value,
      }));
    } else {
      // For bar/line: combine into comparable dataset using optional categories
      // Prefer explicit categories if provided in AI payload
      const categories: string[] | undefined =
        // @ts-expect-error - optional fields may exist in AI payload
        chart.x?.categories || (chart as any).categories;
      data = Array.from({ length: maxLen }).map((_, i) => {
        const row: Record<string, number | string> = { name: categories?.[i] || `Q${i + 1}` };
        chart.series.forEach((s, idx) => {
          row[`s${idx}`] = s.data[i] ?? 0;
        });
        return row;
      });
    }

    const height = Math.min(Math.max(chart.style?.height ?? 220, 180), 260);

    const inferredType = inferChartType({
      seriesCount: chart.series.length,
      pointsPerSeries: maxLen,
      hasCategories: true,
      isShareOrComposition: chart.type === 'pie' || /share|mix|composition|distribution/i.test(section.title),
      isCorrelation: /vs|correlation|scatter/i.test(section.title),
    });

    // Respect the explicit type from AI when provided; fall back to inference
    const finalType = (chart.type as any) || inferredType;

    return (
      <div className="mt-4 p-4 bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-lg border border-white/20 dark:border-white/15 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {chart.x.label} vs {chart.y.label}
          </h4>
          <Badge variant="outline" className="text-xs flex-shrink-0 bg-white/30 dark:bg-white/10 text-gray-700 dark:text-gray-200 border-white/40 dark:border-white/20">
            {String(finalType).toUpperCase()} CHART
          </Badge>
        </div>
        <ChartRenderer
          type={finalType}
          data={data}
          xKey="name"
          series={
            chart.type === 'pie' && chart.series.length === 1
              ? [{ name: chart.series[0].name || 'Value', dataKey: 'value' }]
              : seriesKeys.map((s, idx) => ({ name: s.name, dataKey: s.key }))
          }
          colors={(chart.style && Array.isArray(chart.style.colors) ? chart.style.colors : undefined) as string[] | undefined}
          height={height}
          compact
        />
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="mb-4"
    >
      <div>
        <div className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white break-words">
                    {section.title}
                  </CardTitle>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 break-words leading-relaxed">
                  {section.short}
                </p>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="pt-0 space-y-4">
            {/* Snapshot Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-gray-700/50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  Key Insights
                </h4>
              </div>
              <div className="space-y-3">
                {section.full.snapshot.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-lg border border-white/20 dark:border-white/15 shadow-sm">
                    <div className="w-3 h-3 bg-gray-500 dark:bg-gray-300 rounded-full mt-1 flex-shrink-0 shadow-sm" />
                    <p className="text-sm text-gray-700 dark:text-gray-200 break-words leading-relaxed">
                      {formatNumericBold(point)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-white/10 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
                <h4 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                  Data Visualization
                </h4>
              </div>
              <div className="overflow-x-auto">
                {renderChart()}
              </div>
            </div>

            {/* Recommendations Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-white/10 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
                <h4 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                  Recommendations
                </h4>
              </div>
              <div className="space-y-3">
                {section.full.recommendations.map((recommendation, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-lg border border-white/20 dark:border-white/15 shadow-sm">
                    <div className="w-3 h-3 bg-gray-500 dark:bg-gray-300 rounded-full mt-1 flex-shrink-0 shadow-sm" />
                    <p className="text-sm text-gray-700 dark:text-gray-200 break-words leading-relaxed">
                      {formatNumericBold(recommendation)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ChatReportSection;
