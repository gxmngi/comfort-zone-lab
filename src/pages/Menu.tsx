import {
  User,
  CalendarCheck,
  HeartPulse,
  FlaskConical,
  CalendarDays,
  Syringe,
  Phone,
  Calendar,
  Settings,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MenuCard } from "@/components/MenuCard";
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const menuItems = [
  {
    icon: User,
    title: "ข้อมูลส่วนตัว",
    subtitle: "Personal Information",
    colorVariant: "blue" as const,
    href: "/profile",
  },
  {
    icon: CalendarCheck,
    title: "นัดหมายคลินิก",
    subtitle: "Appointment",
    colorVariant: "teal" as const,
    href: "/appointments",
  },
  {
    icon: HeartPulse,
    title: "ตรวจสุขภาพ",
    subtitle: "Health Checkup",
    colorVariant: "green" as const,
    href: "/dashboard",
  },
];

export default function Menu() {
  const { signOut, user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  // Robust role check
  const role = profile?.role || user?.user_metadata?.role || 'user';

  useEffect(() => {
    if (role === 'doctor') {
      if (profile?.doctor_status === 'approved') {
        navigate('/doctor-menu');
      } else {
        navigate('/pending-approval');
      }
    }
  }, [role, profile?.doctor_status, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const displayName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : user?.email || "Guest";

  const roleLabel = role === 'doctor' ? 'Doctor' : 'Patient';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header 
        userName={displayName} 
        userRole={roleLabel} 
        onLogout={handleSignOut}
      />

      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          {/* Welcome Section */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-foreground">Welcome</h2>
            <p className="mt-2 text-lg text-muted-foreground">Khun {displayName}</p>
            <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-primary to-header-to" />
          </div>

          {/* Menu Grid */}
          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
            {menuItems.map((item, index) => (
              <MenuCard
                key={index}
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                colorVariant={item.colorVariant}
                onClick={() => {
                  if (item.href !== "#") navigate(item.href);
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
