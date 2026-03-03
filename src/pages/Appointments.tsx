import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CalendarCheck, Clock, MapPin, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ── Mock Data ────────────────────────────────────────────────────────────────
const mockAppointments = [
  {
    id: '1',
    date: '2026-03-04',
    time: '09:00',
    doctor: 'พญ. สมศรี ใจดี',
    department: 'อายุรกรรม',
    location: 'ห้องตรวจ 201',
    status: 'upcoming' as const,
    note: 'ตรวจสุขภาพประจำปี',
  },
  {
    id: '2',
    date: '2026-03-10',
    time: '13:30',
    doctor: 'นพ. วิชัย สุขสม',
    department: 'โรคภูมิแพ้',
    location: 'ห้องตรวจ 305',
    status: 'upcoming' as const,
    note: 'ติดตามอาการแพ้ฝุ่น',
  },
  {
    id: '3',
    date: '2026-02-20',
    time: '10:00',
    doctor: 'พญ. สมศรี ใจดี',
    department: 'อายุรกรรม',
    location: 'ห้องตรวจ 201',
    status: 'completed' as const,
    note: 'ตรวจผลเลือด',
  },
  {
    id: '4',
    date: '2026-02-05',
    time: '14:00',
    doctor: 'นพ. ประเสริฐ มั่นคง',
    department: 'เวชศาสตร์ฟื้นฟู',
    location: 'ห้องตรวจ 102',
    status: 'completed' as const,
    note: 'ปรึกษาการดูแลสุขภาพ',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const statusConfig = {
  upcoming: { label: 'นัดหมาย', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'เสร็จสิ้น', className: 'bg-gray-100 text-gray-500' },
};

// ── Component ────────────────────────────────────────────────────────────────
export default function Appointments() {
  const upcoming = mockAppointments.filter((a) => a.status === 'upcoming');
  const completed = mockAppointments.filter((a) => a.status === 'completed');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-primary" />
            ตารางนัดหมาย
          </h1>
          <p className="text-muted-foreground">Appointment Schedule</p>
        </div>

        {/* Upcoming */}
        <section>
          <h2 className="text-lg font-semibold mb-3">นัดหมายที่กำลังจะถึง</h2>
          {upcoming.length === 0 ? (
            <p className="text-muted-foreground text-sm">ไม่มีนัดหมาย</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((appt) => (
                <AppointmentCard key={appt.id} appointment={appt} />
              ))}
            </div>
          )}
        </section>

        {/* Past */}
        <section>
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">ประวัตินัดหมาย</h2>
          <div className="space-y-3">
            {completed.map((appt) => (
              <AppointmentCard key={appt.id} appointment={appt} />
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
function AppointmentCard({ appointment: a }: { appointment: (typeof mockAppointments)[number] }) {
  const isUpcoming = a.status === 'upcoming';
  const config = statusConfig[a.status];

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
          <span className="font-medium">{a.note}</span>
          <Badge variant="secondary" className={config.className}>{config.label}</Badge>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{a.doctor}</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{a.time} น.</span>
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{a.location}</span>
        </div>
        <div className="text-xs text-muted-foreground">{a.department} · {formatDate(a.date)}</div>
      </div>
    </div>
  );
}
