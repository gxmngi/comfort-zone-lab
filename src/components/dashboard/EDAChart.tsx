import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { EDADataPoint } from '@/utils/mockData';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EDAChartProps {
  data: any[];
  className?: string;
}

export function EDAChart({ data, className }: EDAChartProps) {
  const latestTonic = data.length > 0 ? data[data.length - 1].tonic : 0;
  const latestPhasic = data.length > 0 ? data[data.length - 1].phasic : 0;

  return (
    <div className={cn("medical-card overflow-hidden flex flex-col", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent" />
          <h3 className="font-display font-semibold text-lg">EDA Signal Decomposition</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-chart-tonic" />
            <span className="text-xs text-muted-foreground">Tonic (SCL)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-chart-phasic" />
            <span className="text-xs text-muted-foreground">Phasic (SCR)</span>
          </div>
        </div>
      </div>

      {/* Current Values */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Tonic Level (SCL)</div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-display font-bold text-chart-tonic">
              {latestTonic.toFixed(3)}
            </span>
            <span className="text-xs text-muted-foreground">μS</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Baseline arousal</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Phasic Activity (SCR)</div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-display font-bold text-chart-phasic">
              {latestPhasic.toFixed(3)}
            </span>
            <span className="text-xs text-muted-foreground">μS</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Stimulus response</p>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              yAxisId="tonic"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              width={40}
              domain={['auto', 'auto']}
            />
            <YAxis 
              yAxisId="phasic"
              orientation="right"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              width={40}
              domain={[0, 'auto']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: number, name: string) => [
                `${value.toFixed(3)} μS`,
                name === 'tonic' ? 'Tonic (SCL)' : 'Phasic (SCR)'
              ]}
            />
            <defs>
              <linearGradient id="tonicStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="85%" stopColor="hsl(var(--chart-tonic))" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(var(--chart-tonic))" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="tonicFillGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="85%" stopColor="hsl(var(--chart-tonic))" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(var(--chart-tonic))" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="phasicGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="85%" stopColor="hsl(var(--chart-phasic))" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(var(--chart-phasic))" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <Area
              yAxisId="tonic"
              type="monotone"
              dataKey="tonic"
              stroke="url(#tonicStrokeGradient)"
              fill="url(#tonicFillGradient)"
              strokeWidth={2}
              name="tonic"
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-in-out"
            />
            <Line
              yAxisId="phasic"
              type="monotone"
              dataKey="phasic"
              stroke="url(#phasicGradient)"
              strokeWidth={2}
              dot={false}
              name="phasic"
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-in-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}