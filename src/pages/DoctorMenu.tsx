import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MenuCard } from '@/components/MenuCard';
import { 
  Users, 
  CalendarCheck, 
  Activity, 
  ClipboardList, 
  Stethoscope,
  Search,
  UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DoctorMenu() {
  const { signOut, user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const displayName = profile?.first_name && profile?.last_name 
    ? `Dr. ${profile.first_name} ${profile.last_name}`
    : user?.email ? `Dr. ${user.email}` : "Doctor";

  const doctorMenuItems = [
    { 
      title: 'รายชื่อผู้ป่วย',
      subtitle: 'Patient List', 
      icon: Users, 
      colorVariant: 'blue' as const, 
      href: '/doctor/patient-list' 
    },
    { 
      title: 'ตารางนัดหมาย',
      subtitle: 'Appointments', 
      icon: CalendarCheck, 
      colorVariant: 'teal' as const, 
      href: '#' 
    },
    { 
      title: 'สัญญาณชีพผู้ป่วย',
      subtitle: 'Patient Vitals', 
      icon: Activity, 
      colorVariant: 'pink' as const, 
      href: '#' 
    },
    { 
      title: 'เวชระเบียน',
      subtitle: 'Medical Records', 
      icon: ClipboardList, 
      colorVariant: 'orange' as const, 
      href: '#' 
    },
    { 
      title: 'การวินิจฉัย',
      subtitle: 'Diagnosis', 
      icon: Stethoscope, 
      colorVariant: 'purple' as const,
      href: '#' 
    },
    { 
      title: 'ค้นหาผู้ป่วย',
      subtitle: 'Find Patient', 
      icon: Search, 
      colorVariant: 'green' as const,
      href: '#' 
    },
    { 
      title: 'เพิ่มผู้ป่วยใหม่',
      subtitle: 'Add Patient', 
      icon: UserPlus, 
      colorVariant: 'blue' as const,
      href: '#' 
    }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header 
        userName={displayName} 
        userRole="Doctor" 
        onLogout={handleSignOut}
      />

      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          {/* Welcome Section */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-foreground">Doctor Dashboard</h2>
            <p className="mt-2 text-lg text-muted-foreground">Manage your patients and schedule</p>
            <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-primary to-header-to" />
          </div>

          {/* Menu Grid */}
          <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {doctorMenuItems.map((item, index) => (
              <MenuCard
                key={index}
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                colorVariant={item.colorVariant}
                onClick={() => {
                   if (item.href !== '#') navigate(item.href);
                }}
              />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
