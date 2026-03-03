import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { HRVDataPoint } from '@/utils/mockData';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HRVDataItem {
  time: string;
  lf?: number;
  hf?: number;
  lfHfRatio?: number;
}

interface HRVChartProps {
  data: HRVDataItem[];
  className?: string;
}

export function HRVChart({ data, className }: HRVChartProps) {
  // Safe access for latest calculated ratio
  const latestRatio = data.length > 0 && 'lfHfRatio' in data[data.length - 1] 
    ? data[data.length - 1].lfHfRatio ?? 0
    : 0;

  return (
    <div className={cn("medical-card overflow-hidden flex flex-col", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">HRV Frequency Domain</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-chart-lf" />
            <span className="text-xs text-muted-foreground">LF (ms²)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-chart-hf" />
            <span className="text-xs text-muted-foreground">HF (ms²)</span>
          </div>
        </div>
      </div>

      {/* LF/HF Ratio Gauge */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex-shrink-0">
          <div className="text-xs text-muted-foreground mb-1">LF/HF Ratio</div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-display font-bold text-chart-ratio">
              {latestRatio.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-chart-ratio transition-all duration-500"
              style={{ width: `${Math.min(100, (latestRatio / 5) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">Parasympathetic</span>
            <span className="text-xs text-muted-foreground">Sympathetic</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <defs>
              <linearGradient id="lfGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="85%" stopColor="hsl(var(--chart-lf))" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(var(--chart-lf))" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="hfGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="85%" stopColor="hsl(var(--chart-hf))" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(var(--chart-hf))" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <Line 
              type="monotone" 
              dataKey="lf" 
              stroke="url(#lfGradient)" 
              strokeWidth={2}
              dot={false}
              name="LF Power"
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-in-out"
            />
            <Line 
              type="monotone" 
              dataKey="hf" 
              stroke="url(#hfGradient)" 
              strokeWidth={2}
              dot={false}
              name="HF Power"
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-in-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}