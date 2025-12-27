import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { BMICard } from '@/components/profile/BMIDisplay';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { User, Phone, Calendar, Heart, AlertCircle, Pill, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function Profile() {
  const { profile, loading } = useProfile();

  if (loading) {
    return <DashboardLayout><div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="font-display text-2xl font-bold">Profile</h1><p className="text-muted-foreground">Your health information</p></div>
          <Button asChild><Link to="/profile/edit"><Edit className="h-4 w-4 mr-2" />Edit Profile</Link></Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* General Info */}
            <div className="medical-card">
              <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2"><User className="h-5 w-5 text-primary" />General Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Full Name</p><p className="font-medium">{profile?.first_name} {profile?.last_name || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{profile?.email || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{profile?.phone || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Date of Birth</p><p className="font-medium">{profile?.date_of_birth ? format(new Date(profile.date_of_birth), 'MMM d, yyyy') : '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Gender</p><p className="font-medium">{profile?.gender || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Emergency Contact</p><p className="font-medium">{profile?.emergency_contact_name || '—'}</p></div>
              </div>
            </div>

            {/* Physical Info */}
            <div className="medical-card">
              <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Physical Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Weight</p><p className="font-medium">{profile?.weight_kg ? `${profile.weight_kg} kg` : '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Height</p><p className="font-medium">{profile?.height_cm ? `${profile.height_cm} cm` : '—'}</p></div>
              </div>
            </div>

            {/* Health Info */}
            <div className="medical-card">
              <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2"><Heart className="h-5 w-5 text-primary" />Health Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Blood Type</p><p className="font-medium">{profile?.blood_type || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Allergies</p><p className="font-medium">{profile?.allergies || '—'}</p></div>
                <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Medical Conditions</p><p className="font-medium">{profile?.medical_conditions || '—'}</p></div>
                <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Medications</p><p className="font-medium">{profile?.medications || '—'}</p></div>
              </div>
            </div>
          </div>

          <div><BMICard weightKg={profile?.weight_kg ?? null} heightCm={profile?.height_cm ?? null} /></div>
        </div>
      </div>
    </DashboardLayout>
  );
}