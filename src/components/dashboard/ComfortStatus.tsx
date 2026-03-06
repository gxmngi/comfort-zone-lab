import { cn } from '@/lib/utils';
import { getComfortDetails } from '@/utils/mockData';
import { Brain, Smile, Frown, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ComfortStatusProps {
  level: number;
  probability?: number;
  isPredicting?: boolean;
  lastPredictedAt?: string | null;
  className?: string;
}

export function ComfortStatus({ level, isPredicting, lastPredictedAt, className }: ComfortStatusProps) {
  const details = getComfortDetails(level);
  const isHealthy = level === 2;
  const hasResult = level === 1 || level === 2;

  const lastTimeStr = lastPredictedAt
    ? new Date(lastPredictedAt).toLocaleTimeString('th-TH', { hour12: false })
    : null;

  const statusConfig = {
    1: {
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      icon: Frown,
      statusIcon: AlertCircle,
      gradient: 'from-red-500 to-red-600',
    },
    2: {
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      icon: Smile,
      statusIcon: CheckCircle2,
      gradient: 'from-emerald-500 to-emerald-600',
    },
  }[level] || {
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    icon: Brain,
    statusIcon: Brain,
    gradient: 'from-slate-400 to-slate-500',
  };

  const MainIcon = statusConfig.icon;
  const StatusIcon = statusConfig.statusIcon;

  return (
    <div className={cn('medical-card overflow-hidden transition-all duration-300 flex flex-col justify-between', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${statusConfig.bgColor}`}>
            <Brain className={`h-4 w-4 ${statusConfig.color}`} />
          </div>
          <h3 className="font-display font-semibold text-base">ML Comfort Prediction</h3>
        </div>
        {isPredicting && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
      </div>

      {/* Main Status Display */}
      <div className={cn('flex flex-col items-center flex-1 justify-center py-2', !hasResult && 'opacity-40')}>
        <div
          className={cn(
            'relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-500',
            hasResult ? 'hover:scale-105' : 'blur-[1.5px]',
            `bg-gradient-to-br ${statusConfig.gradient}`
          )}
        >
          <MainIcon className="w-10 h-10 text-white" />
          {hasResult && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-4 border-white flex items-center justify-center bg-white">
              <StatusIcon className={cn('w-4 h-4', statusConfig.color)} />
            </div>
          )}
        </div>

        <div className="mt-3 text-center space-y-0.5">
          {hasResult ? (
            <>
              <h4 className={cn('text-xl font-display font-bold tracking-tight', statusConfig.color)}>
                {details.label}
              </h4>
              <p className="text-xs text-muted-foreground font-medium">{details.description}</p>
            </>
          ) : (
            <>
              <h4 className="text-base font-display font-semibold text-muted-foreground">
                รอผลการทำนาย
              </h4>
              <p className="text-xs text-muted-foreground">กำลังรวบรวมข้อมูล...</p>
            </>
          )}
        </div>

        {lastTimeStr && (
          <p className="mt-2 text-[10px] text-muted-foreground">อัปเดตล่าสุด: {lastTimeStr}</p>
        )}
      </div>

      {/* Toggle */}
      <div className="mt-4 w-full">
        <div className={cn('bg-muted/30 p-1 rounded-xl flex relative', !hasResult && 'opacity-30 pointer-events-none')}>
          {hasResult && (
            <div
              className={cn(
                'absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg shadow-sm transition-all duration-500 ease-out bg-white',
                isHealthy ? 'left-[calc(50%+2px)]' : 'left-1'
              )}
            />
          )}

          <div className={cn(
            'flex-1 relative z-10 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors duration-300',
            hasResult && !isHealthy ? 'text-red-600 font-semibold' : 'text-muted-foreground'
          )}>
            <Frown className="w-3.5 h-3.5" />
            <span className="text-xs">ไม่สบาย</span>
          </div>

          <div className={cn(
            'flex-1 relative z-10 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors duration-300',
            hasResult && isHealthy ? 'text-emerald-600 font-semibold' : 'text-muted-foreground'
          )}>
            <Smile className="w-3.5 h-3.5" />
            <span className="text-xs">สบาย</span>
          </div>
        </div>
      </div>
    </div>
  );
}