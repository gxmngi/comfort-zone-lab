import { Heart, Battery, Thermometer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickStatsProps {
  heartRate: number;
  batteryPercent: number;
  skinTemp: number;
  className?: string;
  simpleMode?: boolean;
  isConnected?: boolean;
}

function getBatteryIcon(pct: number) {
  if (pct > 75) return '🔋';
  if (pct > 50) return '🔋';
  if (pct > 25) return '🪫';
  return '🪫';
}

function getBatteryColor(pct: number) {
  if (pct > 50) return 'text-emerald-500';
  if (pct > 25) return 'text-amber-500';
  return 'text-red-500';
}

export function QuickStats({ 
  heartRate, 
  batteryPercent, 
  skinTemp, 
  className, 
  simpleMode = false,
  isConnected = true 
}: QuickStatsProps) {
  const hrDisplay = isConnected && heartRate > 0 ? `${Math.round(heartRate)}` : '--';
  const stDisplay = isConnected && skinTemp > 0 ? skinTemp.toFixed(1) : '--.-';
  const batDisplay = isConnected && batteryPercent > 0 ? `${Math.round(batteryPercent)}` : '--';

  return (
    <div className={cn('grid gap-4 grid-cols-1 sm:grid-cols-3', className)}>
      {/* Heart Rate */}
      <div className="medical-card">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/30">
            <Heart className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Heart Rate</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-display">{hrDisplay}</span>
              <span className="text-sm text-muted-foreground">bpm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Skin Temperature */}
      <div className="medical-card">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-950/30">
            <Thermometer className="h-5 w-5 text-cyan-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Skin Temp</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-display">{stDisplay}</span>
              <span className="text-sm text-muted-foreground">°C</span>
            </div>
          </div>
        </div>
      </div>

      {/* Battery */}
      <div className="medical-card">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/30">
            <Battery className={cn('h-5 w-5', getBatteryColor(batteryPercent))} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Battery</p>
            <div className="flex items-baseline gap-1">
              <span className={cn('text-3xl font-bold font-display', getBatteryColor(batteryPercent))}>
                {batDisplay}
              </span>
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-muted mt-1.5 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700', 
                  isConnected ? getBatteryColor(batteryPercent).replace('text-', 'bg-') : 'bg-transparent'
                )}
                style={{ width: `${isConnected ? Math.min(100, batteryPercent) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}