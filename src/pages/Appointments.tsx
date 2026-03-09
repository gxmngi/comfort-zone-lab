import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CalendarCheck, Clock, MapPin, User, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const statusConfig: Record<string, { label: string; className: string }> = {
  upcoming: { label: 'นัดหมาย', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'เสร็จสิ้น', className: 'bg-gray-100 text-gray-500' },
};

// ── Component ────────────────────────────────────────────────────────────────
export default function Appointments() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { appointments, loading, addAppointment } = useAppointments();
  const { toast } = useToast();

  const isDoctor = profile?.role === 'doctor';

  // State for Doctor Creating Appointment
  const [open, setOpen] = useState(false);
  const [patients, setPatients] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [form, setForm] = useState({
    patient_id: '',
    date: '',
    time: '',
    department: '',
    location: '',
    note: '',
  });

  // Fetch all patients for Doctor dropdown
  useEffect(() => {
    if (isDoctor && open) {
      const fetchPatients = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('role', 'user')
          .order('first_name', { ascending: true });
        
        if (data) setPatients(data);
      };
      fetchPatients();
    }
  }, [isDoctor, open]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    const { error } = await addAppointment({
      patient_id: form.patient_id,
      doctor_id: profile.id, // Profile ID is the correct foreign key
      date: form.date,
      time: form.time + ':00', // ensure time format
      department: form.department,
      location: form.location,
      note: form.note || null,
    });

    if (error) {
      toast({ title: 'Error', description: 'ไม่สามารถสร้างนัดหมายได้: ' + error.message, variant: 'destructive' });
    } else {
      toast({ title: 'สำเร็จ', description: 'สร้างนัดหมายเรียบร้อยแล้ว' });
      setOpen(false);
      setForm({ patient_id: '', date: '', time: '', department: '', location: '', note: '' });
    }
  };

  // ── Filter Upcoming vs Past ────────────────────────────────────────────────
  const now = new Date();
  
  // A dynamic check to see if an appointment has passed based on date/time.
  // We consider it "past/completed" if (appt.date + appt.time) < now.
  const processedAppointments = appointments.map(appt => {
    const apptDateTime = new Date(`${appt.date}T${appt.time}`);
    const isPast = apptDateTime < now;
    return { ...appt, 
      displayStatus: isPast ? 'completed' : 'upcoming' 
    };
  });

  const upcoming = processedAppointments.filter((a) => a.displayStatus === 'upcoming');
  const past = processedAppointments.filter((a) => a.displayStatus === 'completed');
  // Sort past appointments descending (most recent history first)
  past.sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

  if (loading) {
    return <DashboardLayout><div className="space-y-4"><Skeleton className="h-10 w-48"/><Skeleton className="h-64 w-full"/></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <CalendarCheck className="h-6 w-6 text-primary" />
              ตารางนัดหมาย
            </h1>
            <p className="text-muted-foreground">Appointment Schedule</p>
          </div>

          {/* Doctor Add Button */}
          {isDoctor && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" /> สร้างนัดหมาย
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>สร้างนัดหมายใหม่</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient">ผู้ป่วย (Patient)</Label>
                    <Select value={form.patient_id} onValueChange={(v) => setForm({...form, patient_id: v})} required>
                      <SelectTrigger><SelectValue placeholder="เลือกผู้ป่วย" /></SelectTrigger>
                      <SelectContent>
                        {patients.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">วันที่ (Date)</Label>
                      <Input id="date" type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">เวลา (Time)</Label>
                      <Input id="time" type="time" value={form.time} onChange={(e) => setForm({...form, time: e.target.value})} required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">แผนก (Department)</Label>
                    <Input id="department" placeholder="เช่น อายุรกรรม" value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">สถานที่ (Location)</Label>
                    <Input id="location" placeholder="เช่น ห้องตรวจ 201" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="note">หมายเหตุ (Note) *ตัวเลือก</Label>
                    <Input id="note" placeholder="เช่น ตรวจสุขภาพประจำปี" value={form.note} onChange={(e) => setForm({...form, note: e.target.value})} />
                  </div>

                  <Button type="submit" className="w-full mt-4">บันทึกนัดหมาย</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Upcoming */}
        <section>
          <h2 className="text-lg font-semibold mb-3">นัดหมายที่กำลังจะถึง</h2>
          {upcoming.length === 0 ? (
            <p className="text-muted-foreground text-sm border border-dashed rounded-lg p-8 text-center bg-muted/20">ไม่มีนัดหมายใหม่</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((appt) => (
                <AppointmentCard key={appt.id} appointment={appt} isDoctor={isDoctor} />
              ))}
            </div>
          )}
        </section>

        {/* Past */}
        <section>
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">ประวัตินัดหมาย</h2>
          {past.length === 0 ? (
            <p className="text-muted-foreground text-sm border border-dashed rounded-lg p-8 text-center bg-muted/20">ไม่มีประวัตินัดหมาย</p>
          ) : (
             <div className="space-y-3">
               {past.map((appt) => (
                 <AppointmentCard key={appt.id} appointment={appt} isDoctor={isDoctor} />
               ))}
             </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
function AppointmentCard({ appointment: a, isDoctor }: { appointment: Appointment & { displayStatus: string }; isDoctor: boolean }) {
  const isUpcoming = a.displayStatus === 'upcoming';
  const config = statusConfig[a.displayStatus] || statusConfig.upcoming;

  // Format time properly (remove seconds if they exist)
  const timeStr = a.time.substring(0, 5);
  
  // Decide what name to show based on role
  const targetName = isDoctor 
    ? `ผู้ป่วย: ${a.patient?.first_name || ''} ${a.patient?.last_name || ''}`
    : `พญ./นพ. ${a.doctor?.first_name || ''} ${a.doctor?.last_name || ''}`;

  return (
    <div className={`medical-card flex flex-col sm:flex-row sm:items-center gap-4 ${!isUpcoming ? 'opacity-60' : ''}`}>
      {/* Date block */}
      <div className={`flex-shrink-0 text-center rounded-lg p-3 w-20 ${isUpcoming ? 'bg-primary/10' : 'bg-muted'}`}>
        <div className={`text-2xl font-bold ${isUpcoming ? 'text-primary' : 'text-muted-foreground'}`}>
          {new Date(a.date).getDate()}
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(a.date).toLocaleDateString('th-TH', { month: 'short' })}
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{a.note || 'ไม่มีระบุหมายเหตุ'}</span>
          <Badge variant="secondary" className={config.className}>{config.label}</Badge>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1 font-medium"><User className="h-3.5 w-3.5" />{targetName}</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{timeStr} น.</span>
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{a.location}</span>
        </div>
        <div className="text-xs text-muted-foreground">{a.department} · {formatDate(a.date)}</div>
      </div>
    </div>
  );
}
