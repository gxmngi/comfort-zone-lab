import { Heart, Activity, Thermometer, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickStatsProps {
  heartRate: number;
  lfPower: number;
  hfPower: number;
  edaTonic: number;
  className?: string;
}

export function QuickStats({ heartRate, lfPower, hfPower, edaTonic, className }: QuickStatsProps) {
  const stats = [
    {
      label: 'Heart Rate',
      value: `${heartRate.toFixed(0)}`,
      unit: 'bpm',
      icon: Heart,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      label: 'LF Power',
      value: `${lfPower.toFixed(0)}`,
      unit: 'ms²',
      icon: Activity,
      color: 'text-chart-lf',
      bgColor: 'bg-chart-lf/10',
    },
    {
      label: 'HF Power',
      value: `${hfPower.toFixed(0)}`,
      unit: 'ms²',
      icon: TrendingUp,
      color: 'text-chart-hf',
      bgColor: 'bg-chart-hf/10',
    },
    {
      label: 'EDA Tonic',
      value: `${edaTonic.toFixed(2)}`,
      unit: 'μS',
      icon: Thermometer,
      color: 'text-chart-tonic',
      bgColor: 'bg-chart-tonic/10',
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {stats.map((stat) => (
        <div key={stat.label} className="medical-card">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", stat.bgColor)}>
              <stat.icon className={cn("h-5 w-5", stat.color)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-display font-bold">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.unit}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}