import { Leaf, AlertTriangle, Wind, Sparkles, Brain, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecommendationsCardProps {
  comfortLevel: number;
  hasDustAllergy?: boolean;
  className?: string;
}

export function RecommendationsCard({ comfortLevel, hasDustAllergy = false, className }: RecommendationsCardProps) {
  const getRecommendations = () => {
    if (comfortLevel === 0) {
      return {
        status: 'waiting',
        icon: Brain,
        title: 'Waiting for Prediction',
        recommendations: [
          'กรุณารอระบบทำนายระดับความสบายสักครู่',
          'คำแนะนำที่เหมาะสมกับคุณจะปรากฏขึ้นเมื่อมีผลการประเมินแล้ว'
        ]
      };
    }

    if (comfortLevel === 1) {
      return {
        status: 'warning',
        icon: AlertTriangle,
        title: 'Environment Improvement Needed',
        recommendations: [
          'High discomfort detected. Consider stepping out for fresh air.',
          hasDustAllergy 
            ? 'Environment improvement recommended: Please clean the area to reduce dust levels (especially for dust allergy sufferers).'
            : 'Consider improving ventilation in your current space.',
          'Take a short break to help regulate your stress levels.'
        ]
      };
    }
    
    return {
      status: 'optimal',
      icon: Sparkles,
      title: 'Optimal Environment',
      recommendations: [
        'Your current environment is optimal for your well-being.',
        'Continue maintaining these conditions for sustained comfort.'
      ]
    };
  };

  const { status, icon: Icon, title, recommendations } = getRecommendations();

  return (
    <div className={cn("medical-card", className)}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${
          status === 'warning' 
            ? 'bg-medical-alert-warning/10' 
            : 'bg-medical-success/10'
        }`}>
          <Icon className={`h-5 w-5 ${
            status === 'warning' 
              ? 'text-medical-alert-warning' 
              : 'text-medical-success'
          }`} />
        </div>
        <h3 className="font-display font-semibold text-lg">Comfort Recommendations</h3>
      </div>
      
      <div className={`p-4 rounded-lg border ${
        status === 'waiting'
          ? 'bg-muted/30 border-muted text-muted-foreground'
          : status === 'warning'
            ? 'bg-medical-alert-warning/5 border-medical-alert-warning/20'
            : 'bg-medical-success/5 border-medical-success/20'
      }`}>
        <h4 className={`font-medium mb-3 flex items-center gap-2 ${
          status === 'waiting' 
            ? 'text-muted-foreground'
            : status === 'warning' ? 'text-medical-alert-warning' : 'text-medical-success'
        }`}>
          {status === 'waiting' && <Loader2 className="h-4 w-4 animate-spin" />}
          {status === 'warning' && <Wind className="h-4 w-4" />}
          {status === 'optimal' && <Leaf className="h-4 w-4" />}
          {title}
        </h4>
        <ul className="space-y-2">
          {recommendations.map((rec, index) => (
            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-current flex-shrink-0" />
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
