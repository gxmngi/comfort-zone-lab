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
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-display font-semibold text-lg">Health Summary</h3>
      </div>

      {/* Progress Ring */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <svg className="h-24 w-24 transform -rotate-90">
            <circle
              className="text-muted/20"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="48"
              cy="48"
            />
            <circle
              className="text-primary transition-all duration-500"
              strokeWidth="8"
              strokeDasharray={`${completionPercentage * 2.51} 251`}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="48"
              cy="48"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold">{completionPercentage}%</span>
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mb-4">
        Profile Completeness
      </p>

      {/* Health Checks */}
      <div className="space-y-3">
        {healthChecks.map((check, index) => (
          <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
            <div className={`p-1.5 rounded-full ${check.status ? 'bg-medical-success/10' : 'bg-muted'}`}>
              {check.status ? (
                <CheckCircle className="h-4 w-4 text-medical-success" />
              ) : (
                <check.icon className="h-4 w-4 text-muted-foreground" />
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
