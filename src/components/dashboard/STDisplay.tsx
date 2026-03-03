import { Thermometer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface STDisplayProps {
  value: number;
  className?: string;
}

function getTempStatus(temp: number): {
  label: string;
  color: string;
  bg: string;
  bar: string;
} {
  if (temp <= 0) return { label: 'No Data', color: 'text-muted-foreground', bg: 'bg-muted/50', bar: 'bg-muted' };
  if (temp < 35)  return { label: 'Low',     color: 'text-blue-500',         bg: 'bg-blue-50 dark:bg-blue-950/30', bar: 'bg-blue-500' };
  if (temp <= 37) return { label: 'Normal',  color: 'text-emerald-500',      bg: 'bg-emerald-50 dark:bg-emerald-950/30', bar: 'bg-emerald-500' };
  if (temp <= 38) return { label: 'Warm',    color: 'text-amber-500',        bg: 'bg-amber-50 dark:bg-amber-950/30', bar: 'bg-amber-500' };
  return               { label: 'High',     color: 'text-red-500',          bg: 'bg-red-50 dark:bg-red-950/30', bar: 'bg-red-500' };
}

// Map temperature to a 0–100% bar fill (range: 30°C → 42°C)
function tempToPercent(temp: number): number {
  const MIN = 30, MAX = 42;
  return Math.min(100, Math.max(0, ((temp - MIN) / (MAX - MIN)) * 100));
}

export function STDisplay({ value, className }: STDisplayProps) {
  const status = getTempStatus(value);
  const fillPct = tempToPercent(value);

  return (
    <div className={cn('medical-card', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Thermometer className={cn('h-5 w-5', status.color)} />
        <h3 className="font-display font-semibold text-lg">Skin Temperature</h3>
        <span className={cn('ml-auto text-xs font-medium px-2 py-0.5 rounded-full', status.color, status.bg)}>
          {status.label}
        </span>
      </div>

      {/* Big number */}
      <div className="flex items-baseline gap-1 mb-3">
        <span className={cn('text-4xl font-bold font-display', status.color)}>
          {value > 0 ? value.toFixed(2) : '--.-'}
        </span>
        <span className="text-lg text-muted-foreground">°C</span>
      </div>

      {/* Temperature bar (30°C → 42°C) */}
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', status.bar)}
          style={{ width: `${fillPct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>30°C</span>
        <span>36°C</span>
        <span>42°C</span>
      </div>
    </div>
  );
}
