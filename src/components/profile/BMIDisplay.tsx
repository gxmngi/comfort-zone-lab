import { cn } from '@/lib/utils';
import { calculateBMI, getBMICategory } from '@/hooks/useProfile';
import { Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BMIDisplayProps {
  weightKg: number | null;
  heightCm: number | null;
  className?: string;
  showLabel?: boolean;
}

export function BMIDisplay({ weightKg, heightCm, className, showLabel = true }: BMIDisplayProps) {
  const bmi = calculateBMI(weightKg, heightCm);
  const category = getBMICategory(bmi);

  const colorClasses: Record<string, string> = {
    underweight: 'bg-bmi-underweight text-white',
    normal: 'bg-bmi-normal text-white',
    overweight: 'bg-bmi-overweight text-white',
  };

  if (!bmi || !category) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <Scale className="h-4 w-4" />
        <span className="text-sm">Enter weight and height to calculate BMI</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showLabel && <Scale className="h-5 w-5 text-primary" />}
      <div className="flex items-center gap-2">
        <span className="text-2xl font-display font-bold">{bmi.toFixed(1)}</span>
        <Badge className={cn("font-medium", colorClasses[category.color])}>
          {category.label}
        </Badge>
      </div>
    </div>
  );
}

export function BMICard({ weightKg, heightCm }: { weightKg: number | null; heightCm: number | null }) {
  const bmi = calculateBMI(weightKg, heightCm);
  const category = getBMICategory(bmi);

  return (
    <div className="medical-card">
      <div className="flex items-center gap-2 mb-4">
        <Scale className="h-5 w-5 text-primary" />
        <h3 className="font-display font-semibold text-lg">Body Mass Index</h3>
      </div>

      {bmi && category ? (
        <>
          <div className="flex items-center justify-center py-6">
            <div className="text-center">
              <div className="text-5xl font-display font-bold mb-2">{bmi.toFixed(1)}</div>
              <Badge 
                className={cn(
                  "text-sm px-4 py-1",
                  category.color === 'underweight' && 'bg-bmi-underweight text-white',
                  category.color === 'normal' && 'bg-bmi-normal text-white',
                  category.color === 'overweight' && 'bg-bmi-overweight text-white'
                )}
              >
                {category.label}
              </Badge>
            </div>
          </div>

          {/* BMI Scale with Indicator */}
          <div className="mt-4">
            <div className="relative">
              {/* Calculate position based on which third of the bar */}
              {(() => {
                let position: number;
                if (bmi < 18.5) {
                  // Underweight section (0-33.33%): map 15-18.5 to 0-33.33%
                  position = ((bmi - 15) / 3.5) * 33.33;
                } else if (bmi <= 24.9) {
                  // Normal section (33.33-66.66%): map 18.5-24.9 to 33.33-66.66%
                  position = 33.33 + ((bmi - 18.5) / 6.4) * 33.33;
                } else {
                  // Overweight section (66.66-100%): map 24.9-35 to 66.66-100%
                  position = 66.66 + ((bmi - 24.9) / 10.1) * 33.34;
                }
                position = Math.min(100, Math.max(0, position));
                
                return (
                  <>
                    {/* Indicator Arrow */}
                    <div 
                      className="absolute -top-2 transform -translate-x-1/2 flex flex-col items-center z-10"
                      style={{ left: `${position}%` }}
                    >
                      <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-foreground" />
                    </div>
                    
                    {/* Scale Bar */}
                    <div className="flex h-3 rounded-full overflow-hidden mt-2">
                      <div className="flex-1 bg-bmi-underweight" />
                      <div className="flex-1 bg-bmi-normal" />
                      <div className="flex-1 bg-bmi-overweight" />
                    </div>
                    
                    {/* Indicator Dot on Bar */}
                    <div 
                      className="absolute top-2 w-3 h-3 bg-foreground rounded-full border-2 border-background transform -translate-x-1/2 shadow-md"
                      style={{ left: `${position}%` }}
                    />
                  </>
                );
              })()}
            </div>
            
            <div className="flex justify-between mt-3 text-xs text-muted-foreground">
              <span>Under 18.5</span>
              <span>18.5 - 24.9</span>
              <span>Over 24.9</span>
            </div>
          </div>

          <div className="mt-6 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Formula:</strong> BMI = weight(kg) / height(m)²
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {weightKg}kg / ({(heightCm! / 100).toFixed(2)}m)² = {bmi.toFixed(2)}
            </p>
          </div>
        </>
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          <Scale className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Enter your weight and height in your profile to calculate BMI</p>
        </div>
      )}
    </div>
  );
}