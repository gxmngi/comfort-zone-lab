import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw, LogOut, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function PendingApproval() {
  const { signOut, user, loading: authLoading } = useAuth();
  const { profile, refetch, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  // Auto-redirect when status changes to approved
  useEffect(() => {
    if (authLoading || profileLoading || !user) return;
    
    if (profile?.doctor_status === 'approved') {
      navigate('/doctor-menu');
    }
  }, [profile?.doctor_status, user, authLoading, profileLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const displayName = profile?.first_name && profile?.last_name
    ? `Dr. ${profile.first_name} ${profile.last_name}`
    : 'Doctor';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/10 ring-2 ring-amber-500/20">
          <Clock className="h-12 w-12 text-amber-500 animate-pulse" />
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          รอการอนุมัติ
        </h1>
        <p className="text-lg text-muted-foreground mb-2">
          Pending Approval
        </p>

        {/* Card */}
        <div className="medical-card mt-6">
          <div className="flex items-center gap-3 mb-4 justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="font-medium text-foreground">{displayName}</span>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            บัญชี Doctor ของคุณได้รับการลงทะเบียนเรียบร้อยแล้ว แต่ยังอยู่ในขั้นตอน
            <strong className="text-amber-500"> รอการอนุมัติ </strong>
            จากทีมผู้ดูแลระบบ กรุณารอสักครู่
          </p>

          <p className="text-muted-foreground text-xs leading-relaxed mb-6">
            Your Doctor account has been registered but is currently 
            <strong className="text-amber-500"> pending approval </strong>
            from the system administrator. Please wait for confirmation.
          </p>

          <div className="h-px w-full bg-border mb-6" />

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleRefresh}
              className="w-full"
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'กำลังตรวจสอบ...' : 'ตรวจสอบสถานะ'}
            </Button>

            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              ออกจากระบบ
            </Button>
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-xs text-muted-foreground mt-6">
          หากมีข้อสงสัย กรุณาติดต่อทีมผู้ดูแลระบบ
        </p>
      </div>
    </div>
  );
}
