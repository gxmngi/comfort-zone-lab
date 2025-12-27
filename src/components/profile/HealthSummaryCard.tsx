import { Activity, Droplets, AlertCircle, CheckCircle, Shield } from 'lucide-react';

interface HealthSummaryCardProps {
  bloodType: string | null;
  hasDustAllergy: boolean;
  hasAllergies: boolean;
  hasMedicalConditions: boolean;
}

export function HealthSummaryCard({ bloodType, hasDustAllergy, hasAllergies, hasMedicalConditions }: HealthSummaryCardProps) {
  const healthChecks = [
    {
      label: 'Blood Type Recorded',
      status: !!bloodType,
      icon: Droplets,
    },
    {
      label: 'Allergy Information',
      status: hasAllergies || hasDustAllergy,
      icon: AlertCircle,
    },
    {
      label: 'Medical Conditions Documented',
      status: hasMedicalConditions,
      icon: Activity,
    },
  ];

  const completedChecks = healthChecks.filter(check => check.status).length;
  const completionPercentage = Math.round((completedChecks / healthChecks.length) * 100);

  return (
    <div className="medical-card">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-semibold text-lg">Health Summary</h3>
          <p className="text-xs text-muted-foreground">Profile Completeness</p>
        </div>
        {/* Compact Progress Ring */}
        <div className="relative">
          <svg className="h-14 w-14 transform -rotate-90">
            <circle
              className="text-muted/20"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
              r="24"
              cx="28"
              cy="28"
            />
            <circle
              className="text-primary transition-all duration-500"
              strokeWidth="4"
              strokeDasharray={`${completionPercentage * 1.51} 151`}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="24"
              cx="28"
              cy="28"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold">{completionPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Compact Health Checks */}
      <div className="space-y-2">
        {healthChecks.map((check, index) => (
          <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
            <div className={`p-1 rounded-full ${check.status ? 'bg-medical-success/10' : 'bg-muted'}`}>
              {check.status ? (
                <CheckCircle className="h-3.5 w-3.5 text-medical-success" />
              ) : (
                <check.icon className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
            <span className={`text-sm ${check.status ? 'text-foreground' : 'text-muted-foreground'}`}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
