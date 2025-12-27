import { cn } from '@/lib/utils';
import { getComfortDetails } from '@/utils/mockData';
import { Brain } from 'lucide-react';

interface ComfortStatusProps {
  level: number;
  className?: string;
}

export function ComfortStatus({ level, className }: ComfortStatusProps) {
  const details = getComfortDetails(level);
  
  const colorClasses: Record<number, string> = {
    1: 'bg-comfort-1',
    2: 'bg-comfort-2',
    3: 'bg-comfort-3',
    4: 'bg-comfort-4',
    5: 'bg-comfort-5',
  };

  return (
    <div className={cn("medical-card", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="font-display font-semibold text-lg">ML Comfort Prediction</h3>
      </div>
      
      {/* Main Status Display */}
      <div className="flex flex-col items-center py-6">
        <div className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center text-4xl font-display font-bold text-white shadow-lg animate-pulse-glow",
          colorClasses[level]
        )}>
          {level}
        </div>
        <h4 className="mt-4 font-display font-semibold text-xl">{details.label}</h4>
        <p className="text-sm text-muted-foreground mt-1">{details.description}</p>
      </div>

      {/* 5-Level Scale */}
      <div className="mt-6">
        <div className="flex justify-between mb-2">
          <span className="text-xs text-muted-foreground">Very Uncomfortable</span>
          <span className="text-xs text-muted-foreground">Very Comfortable</span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((lvl) => (
            <div
              key={lvl}
              className={cn(
                "flex-1 h-3 rounded-full transition-all duration-300",
                lvl <= level ? colorClasses[lvl] : "bg-muted",
                lvl === level && "ring-2 ring-offset-2 ring-foreground/20"
              )}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {[1, 2, 3, 4, 5].map((lvl) => (
            <span 
              key={lvl} 
              className={cn(
                "text-xs font-medium flex-1 text-center",
                lvl === level ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {lvl}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}