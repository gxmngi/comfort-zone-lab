import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EDAChartProps {
  data: { time: string; value: number }[];
  className?: string;
}

export function EDAChart({ data, className }: EDAChartProps) {
  const latest  = data.length > 0 ? data[data.length - 1].value : 0;
  const values  = data.map(d => d.value);
  const minVal  = values.length > 0 ? Math.min(...values) : 0;
  const maxVal  = values.length > 0 ? Math.max(...values) : 0;
  const avgVal  = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  // Pad Y-axis so the line isn't squished at top/bottom
  const range   = maxVal - minVal || 0.001;
  const yMin    = Math.max(0, minVal - range * 0.2);
  const yMax    = maxVal + range * 0.2;

  // Format small numbers nicely (5 sig. figures)
  const fmt = (v: number) => {
    if (v === 0) return '0';
    if (Math.abs(v) < 0.001) return v.toExponential(2);
    return v.toPrecision(4);
  };

  return (
    <div className={cn('medical-card overflow-hidden flex flex-col', className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          <h3 className="font-display font-semibold text-lg">EDA Signal</h3>
        </div>


      </div>

      {/* ── Mini stats row ── */}
      <div className="flex gap-3 mb-3">
        <span className="text-xs text-muted-foreground">
          Min: <span className="font-mono text-foreground">{fmt(minVal)}</span>
        </span>
        <span className="text-xs text-muted-foreground">
          Max: <span className="font-mono text-foreground">{fmt(maxVal)}</span>
        </span>
        <span className="text-xs text-muted-foreground">
          Samples: <span className="font-mono text-foreground">{data.length}</span>
        </span>
      </div>

      {/* ── Chart ── */}
      <div className="flex-1 min-h-0" style={{ minHeight: 170 }}>
        {data.length < 2 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Waiting for data…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 12, left: 4, bottom: 5 }}>
              <defs>
                <linearGradient id="edaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#facc15" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#facc15" stopOpacity={0.03} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />

              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />

              <YAxis
                domain={[yMin, yMax]}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                width={62}
                tickFormatter={fmt}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(v: number) => [`${v.toFixed(5)} μS`, 'EDA']}
                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
              />

              {/* Average reference line */}
              {avgVal > 0 && (
                <ReferenceLine
                  y={avgVal}
                  stroke="#facc15"
                  strokeDasharray="5 3"
                  strokeOpacity={0.5}
                  label={{ value: 'avg', position: 'insideTopRight', fontSize: 10, fill: '#facc15' }}
                />
              )}

              <Area
                type="monotone"
                dataKey="value"
                stroke="#facc15"
                strokeWidth={2.5}
                fill="url(#edaFill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: '#facc15' }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}