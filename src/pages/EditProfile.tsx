import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useProfile, Profile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { BMIDisplay } from '@/components/profile/BMIDisplay';
import { User, Activity, Heart, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function EditProfile() {
  const { profile: myProfile, loading: myLoading, updateProfile } = useProfile();
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isEditingPatient = !!patientId;

  const [saving, setSaving] = useState(false);
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', date_of_birth: '', gender: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    weight_kg: '', height_cm: '', blood_type: '', allergies: '',
    medical_conditions: '', medications: '', dust_allergy: false,
  });

  // ── Load patient profile (doctor editing) ──────────────────────────────
  useEffect(() => {
    if (!patientId) return;
    const fetchPatientProfile = async () => {
      setPatientLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error || !data) {
        toast({ title: 'Error', description: 'ไม่พบข้อมูลผู้ป่วย', variant: 'destructive' });
        navigate(-1);
        return;
      }

      const p = data as Profile;
      setPatientName(`${p.first_name || ''} ${p.last_name || ''}`.trim());
      setForm({
        first_name: p.first_name || '', last_name: p.last_name || '',
        phone: p.phone || '', date_of_birth: p.date_of_birth || '', gender: p.gender || '',
        emergency_contact_name: p.emergency_contact_name || '',
        emergency_contact_phone: p.emergency_contact_phone || '',
        weight_kg: p.weight_kg?.toString() || '', height_cm: p.height_cm?.toString() || '',
        blood_type: p.blood_type || '', allergies: p.allergies || '',
        medical_conditions: p.medical_conditions || '', medications: p.medications || '',
        dust_allergy: p.dust_allergy || false,
      });
      setPatientLoading(false);
    };
    fetchPatientProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // ── Load own profile (self editing) ────────────────────────────────────
  useEffect(() => {
    if (patientId) return; // skip if editing patient
    if (myProfile) {
      setForm({
        first_name: myProfile.first_name || '', last_name: myProfile.last_name || '',
        phone: myProfile.phone || '', date_of_birth: myProfile.date_of_birth || '',
        gender: myProfile.gender || '',
        emergency_contact_name: myProfile.emergency_contact_name || '',
        emergency_contact_phone: myProfile.emergency_contact_phone || '',
        weight_kg: myProfile.weight_kg?.toString() || '',
        height_cm: myProfile.height_cm?.toString() || '',
        blood_type: myProfile.blood_type || '', allergies: myProfile.allergies || '',
        medical_conditions: myProfile.medical_conditions || '',
        medications: myProfile.medications || '',
        dust_allergy: myProfile.dust_allergy || false,
      });
    }
  }, [myProfile, patientId]);

  // ── Save handler ───────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // ── Validation ─────────────────────────────────────────────────────────
    if (form.date_of_birth) {
      const birthDate = new Date(form.date_of_birth);
      const today = new Date();
      if (birthDate > today) {
        toast({ title: 'ข้อมูลไม่ถูกต้อง', description: 'วันเกิดไม่สามารถเป็นวันที่ในอนาคตได้', variant: 'destructive' });
        setSaving(false);
        return;
      }
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age > 120 || age < 1) {
        toast({ title: 'ข้อมูลไม่ถูกต้อง', description: 'โปรดกรอกวันเกิดให้ถูกต้อง (อายุต้องไม่ต่ำกว่า 1 ปี และไม่เกิน 120 ปี)', variant: 'destructive' });
        setSaving(false);
        return;
      }
    }

    const phoneRegex = /^0\d{8,9}$/;

    if (form.phone && !phoneRegex.test(form.phone)) {
      toast({ title: 'ข้อมูลไม่ถูกต้อง', description: 'โปรดกรอกเบอร์โทรศัพท์ให้ถูกต้อง (ขึ้นต้นด้วย 0 และมี 9-10 หลัก โดยไม่มีขีด)', variant: 'destructive' });
      setSaving(false);
      return;
    }

    if (form.emergency_contact_phone && !phoneRegex.test(form.emergency_contact_phone)) {
      toast({ title: 'ข้อมูลไม่ถูกต้อง', description: 'โปรดกรอกเบอร์โทรติดต่อฉุกเฉินให้ถูกต้อง (ขึ้นต้นด้วย 0 และมี 9-10 หลัก โดยไม่มีขีด)', variant: 'destructive' });
      setSaving(false);
      return;
    }

    const updates = {
      first_name: form.first_name || null,
      last_name: form.last_name || null,
      phone: form.phone || null,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
      blood_type: form.blood_type || null,
      allergies: form.allergies || null,
      medical_conditions: form.medical_conditions || null,
      medications: form.medications || null,
      dust_allergy: form.dust_allergy,
    };

    if (isEditingPatient) {
      // Doctor updating patient profile
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', patientId);

      if (error) {
        toast({ title: 'Error', description: 'บันทึกไม่สำเร็จ: ' + error.message, variant: 'destructive' });
      } else {
        toast({ title: 'สำเร็จ', description: `อัปเดตข้อมูลผู้ป่วย ${patientName} เรียบร้อย` });
        navigate(`/profile/${patientId}`);
      }
    } else {
      // User updating own profile
      await updateProfile(updates);
      navigate('/profile');
    }

    setSaving(false);
  };

  // ── Back navigation ────────────────────────────────────────────────────
  const handleBack = () => {
    if (isEditingPatient) {
      navigate(`/profile/${patientId}`);
    } else {
      navigate('/profile');
    }
  };

  const weightNum = form.weight_kg ? parseFloat(form.weight_kg) : null;
  const heightNum = form.height_cm ? parseFloat(form.height_cm) : null;

  const loading = isEditingPatient ? patientLoading : myLoading;
  if (loading) return <DashboardLayout><Skeleton className="h-96 w-full" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="font-display text-2xl font-bold">
              {isEditingPatient ? `แก้ไขข้อมูล: ${patientName}` : 'Edit Profile'}
            </h1>
            <p className="text-muted-foreground">
              {isEditingPatient ? 'แก้ไขข้อมูลผู้ป่วยโดยแพทย์' : 'Update your information'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Section */}
          <div className="medical-card">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2"><User className="h-5 w-5 text-primary" />General Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>First Name</Label><Input value={form.first_name} onChange={(e) => setForm({...form, first_name: e.target.value})} /></div>
              <div><Label>Last Name</Label><Input value={form.last_name} onChange={(e) => setForm({...form, last_name: e.target.value})} /></div>
              <div><Label>Gender</Label><Select value={form.gender} onValueChange={(v) => setForm({...form, gender: v})}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
              <div><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={(e) => setForm({...form, date_of_birth: e.target.value})} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
              <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border">
                <div className="sm:col-span-2">
                  <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                    Emergency Contact
                  </h4>
                </div>
                <div>
                  <Label>Name</Label>
                  <Input value={form.emergency_contact_name} onChange={(e) => setForm({...form, emergency_contact_name: e.target.value})} placeholder="e.g. John Doe" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={form.emergency_contact_phone} onChange={(e) => setForm({...form, emergency_contact_phone: e.target.value})} placeholder="e.g. 0812345678" />
                </div>
              </div>
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
              <div className="sm:col-span-2 flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="space-y-0.5">
                  <Label htmlFor="dust-allergy" className="text-sm font-medium cursor-pointer">Dust Allergy</Label>
                  <p className="text-xs text-muted-foreground">Enable if you have dust sensitivity (used by ML model)</p>
                </div>
                <Switch id="dust-allergy" checked={form.dust_allergy} onCheckedChange={(checked) => setForm({...form, dust_allergy: checked})} />
              </div>
              <div className="sm:col-span-2"><Label>Medical Conditions</Label><Textarea value={form.medical_conditions} onChange={(e) => setForm({...form, medical_conditions: e.target.value})} /></div>
              <div className="sm:col-span-2"><Label>Medications</Label><Textarea value={form.medications} onChange={(e) => setForm({...form, medications: e.target.value})} /></div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={handleBack}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}