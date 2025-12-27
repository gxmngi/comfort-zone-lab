import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useProfile, calculateBMI, getBMICategory } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BMIDisplay } from '@/components/profile/BMIDisplay';
import { User, Activity, Heart, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditProfile() {
  const { profile, loading, updateProfile } = useProfile();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', date_of_birth: '', gender: '', emergency_contact_name: '', emergency_contact_phone: '', weight_kg: '', height_cm: '', blood_type: '', allergies: '', medical_conditions: '', medications: '' });

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name || '', last_name: profile.last_name || '', phone: profile.phone || '',
        date_of_birth: profile.date_of_birth || '', gender: profile.gender || '',
        emergency_contact_name: profile.emergency_contact_name || '', emergency_contact_phone: profile.emergency_contact_phone || '',
        weight_kg: profile.weight_kg?.toString() || '', height_cm: profile.height_cm?.toString() || '',
        blood_type: profile.blood_type || '', allergies: profile.allergies || '',
        medical_conditions: profile.medical_conditions || '', medications: profile.medications || ''
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateProfile({
      ...form,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
    });
    setSaving(false);
    navigate('/profile');
  };

  const weightNum = form.weight_kg ? parseFloat(form.weight_kg) : null;
  const heightNum = form.height_cm ? parseFloat(form.height_cm) : null;

  if (loading) return <DashboardLayout><Skeleton className="h-96 w-full" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}><ArrowLeft className="h-5 w-5" /></Button>
          <div><h1 className="font-display text-2xl font-bold">Edit Profile</h1><p className="text-muted-foreground">Update your information</p></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Section */}
          <div className="medical-card">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2"><User className="h-5 w-5 text-primary" />General Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>First Name</Label><Input value={form.first_name} onChange={(e) => setForm({...form, first_name: e.target.value})} /></div>
              <div><Label>Last Name</Label><Input value={form.last_name} onChange={(e) => setForm({...form, last_name: e.target.value})} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
              <div><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={(e) => setForm({...form, date_of_birth: e.target.value})} /></div>
              <div><Label>Gender</Label><Select value={form.gender} onValueChange={(v) => setForm({...form, gender: v})}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
              <div><Label>Emergency Contact Name</Label><Input value={form.emergency_contact_name} onChange={(e) => setForm({...form, emergency_contact_name: e.target.value})} /></div>
              <div><Label>Emergency Contact Phone</Label><Input value={form.emergency_contact_phone} onChange={(e) => setForm({...form, emergency_contact_phone: e.target.value})} /></div>
            </div>
          </div>

          {/* Physical Section */}
          <div className="medical-card">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Physical Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Weight (kg)</Label><Input type="number" step="0.1" value={form.weight_kg} onChange={(e) => setForm({...form, weight_kg: e.target.value})} /></div>
              <div><Label>Height (cm)</Label><Input type="number" step="0.1" value={form.height_cm} onChange={(e) => setForm({...form, height_cm: e.target.value})} /></div>
            </div>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg"><Label className="mb-2 block">Calculated BMI</Label><BMIDisplay weightKg={weightNum} heightCm={heightNum} /></div>
          </div>

          {/* Health Section */}
          <div className="medical-card">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2"><Heart className="h-5 w-5 text-primary" />Health Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Blood Type</Label><Select value={form.blood_type} onValueChange={(v) => setForm({...form, blood_type: v})}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="A+">A+</SelectItem><SelectItem value="A-">A-</SelectItem><SelectItem value="B+">B+</SelectItem><SelectItem value="B-">B-</SelectItem><SelectItem value="AB+">AB+</SelectItem><SelectItem value="AB-">AB-</SelectItem><SelectItem value="O+">O+</SelectItem><SelectItem value="O-">O-</SelectItem></SelectContent></Select></div>
              <div><Label>Allergies</Label><Input value={form.allergies} onChange={(e) => setForm({...form, allergies: e.target.value})} placeholder="e.g., Penicillin, Peanuts" /></div>
              <div className="sm:col-span-2"><Label>Medical Conditions</Label><Textarea value={form.medical_conditions} onChange={(e) => setForm({...form, medical_conditions: e.target.value})} /></div>
              <div className="sm:col-span-2"><Label>Medications</Label><Textarea value={form.medications} onChange={(e) => setForm({...form, medications: e.target.value})} /></div>
            </div>
          </div>

          <div className="flex gap-4"><Button type="button" variant="outline" onClick={() => navigate('/profile')}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button></div>
        </form>
      </div>
    </DashboardLayout>
  );
}