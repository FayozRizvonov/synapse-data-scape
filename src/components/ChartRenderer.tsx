import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

export type ChartRendererType = 'bar' | 'line' | 'pie' | 'scatter';

export interface ChartRendererSeries {
  name: string;
  dataKey: string;
  color?: string;
}

export interface ChartRendererProps {
  type: ChartRendererType;
  data: Array<Record<string, number | string>>;
  xKey?: string;
  series?: ChartRendererSeries[];
  colors?: string[];
  height?: number; // container height in px
  compact?: boolean; // reduce paddings and axis to save space
  className?: string;
}

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EF4444', // red
  '#14B8A6', // teal
  '#F472B6', // pink
];

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  type,
  data,
  xKey = 'name',
  series = [{ name: 'Value', dataKey: 'value' }],
  colors = DEFAULT_COLORS,
  height = 220,
  compact = true,
  className,
}) => {
  const chartConfig = Object.fromEntries(
    series.map((s, idx) => [s.dataKey, { label: s.name, color: s.color || colors[idx % colors.length] }])
  );

  return (
    <ChartContainer
      config={chartConfig}
      className={cn('w-full', className)}
      style={{ height }}
    >
      {type === 'bar' && (
        <BarChart data={data} margin={{ top: compact ? 4 : 16, right: 8, left: 8, bottom: compact ? 4 : 12 }}>
          {!compact && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} tickMargin={6} />
          <YAxis width={compact ? 28 : 40} tick={{ fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
          <ChartLegend content={<ChartLegendContent />} />
          {series.map((s) => (
            <Bar key={s.dataKey} dataKey={s.dataKey} name={s.name} fill={`var(--color-${s.dataKey})`} radius={[6,6,0,0]} />
          ))}
        </BarChart>
      )}
      {type === 'line' && (
        <LineChart data={data} margin={{ top: compact ? 4 : 16, right: 8, left: 8, bottom: compact ? 4 : 12 }}>
          {!compact && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} tickMargin={6} />
          <YAxis width={compact ? 28 : 40} tick={{ fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} cursor={{ stroke: 'hsl(var(--muted))' }} />
          <ChartLegend content={<ChartLegendContent />} />
          {series.map((s) => (
            <Line key={s.dataKey} type="monotone" dataKey={s.dataKey} name={s.name} stroke={`var(--color-${s.dataKey})`} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      )}
      {type === 'pie' && (
        <PieChart margin={{ top: 4, bottom: 4 }}>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Pie
            data={data}
            dataKey={series[0]?.dataKey || 'value'}
            nameKey={xKey}
            innerRadius={50}
            outerRadius={70}
            paddingAngle={3}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={String(index)} fill={colors[index % colors.length]} />
            ))}
          </Pie>
        </PieChart>
      )}
      {type === 'scatter' && (
        <ScatterChart margin={{ top: compact ? 4 : 16, right: 8, left: 8, bottom: compact ? 4 : 12 }}>
          {!compact && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis dataKey={series[0]?.dataKey || 'value'} width={compact ? 28 : 40} tick={{ fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} cursor={{ stroke: 'hsl(var(--muted))' }} />
          <Scatter data={data} fill={colors[0]} />
        </ScatterChart>
      )}
    </ChartContainer>
  );
};

// Heuristic auto-type selection
export function inferChartType(input: {
  seriesCount: number;
  pointsPerSeries: number;
  hasCategories?: boolean;
  isShareOrComposition?: boolean;
  isCorrelation?: boolean;
}): ChartRendererType {
  const { seriesCount, pointsPerSeries, hasCategories, isShareOrComposition, isCorrelation } = input;

  if (isCorrelation) return 'scatter';
  if (isShareOrComposition && seriesCount === 1 && pointsPerSeries <= 8) return 'pie';
  if (pointsPerSeries > 12) return 'line';
  if (seriesCount > 2 && pointsPerSeries <= 8) return 'bar';
  if (hasCategories && pointsPerSeries <= 12) return 'bar';
  return 'line';
}

export default ChartRenderer;


