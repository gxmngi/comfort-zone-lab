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

          {/* BMI Scale */}
          <div className="mt-4">
            <div className="flex h-3 rounded-full overflow-hidden">
              <div className="flex-1 bg-bmi-underweight" />
              <div className="flex-1 bg-bmi-normal" />
              <div className="flex-1 bg-bmi-overweight" />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Under 18.5</span>
              <span>18.5 - 24.9</span>
              <span>Over 24.9</span>
            </div>
            {/* Indicator */}
            <div className="relative mt-2">
              <div 
                className="absolute w-2 h-2 bg-foreground rounded-full transform -translate-x-1/2"
                style={{ 
                  left: `${Math.min(100, Math.max(0, ((bmi - 15) / 20) * 100))}%`,
                  top: '-20px'
                }}
              />
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