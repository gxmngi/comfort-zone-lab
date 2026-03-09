import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useComfortReadings } from '@/hooks/useComfortReadings';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getComfortDetails } from '@/utils/mockData';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

// Mock data for demonstration when no readings exist
// Generate 30 days of mock data for demonstration
const generateMockReadings = () => {
  const readings = [];
  const now = new Date();
  const daysToGenerate = 30;
  
  for (let i = 0; i < daysToGenerate * 24; i++) { // Hourly readings for 30 days
    const time = new Date(now.getTime() - i * 60 * 60 * 1000); // Backwards from now
    const isSleepTime = time.getHours() >= 23 || time.getHours() < 6;
    
    // Base values vary by time of day
    const baseHR = isSleepTime ? 55 : 75;
    const baseTonic = isSleepTime ? 1.5 : 3.5;
    
    // Add some random variation
    const variation = Math.random();
    
    // Comfort level logic (mostly comfortable, occasional stress)
    const comfortLevel = Math.random() > 0.85 ? 1 : 2;
    
    readings.push({
      id: `mock-${i}`,
      recorded_at: time.toISOString(),
      comfort_level: comfortLevel,
      lf_power: (Math.random() * 500) + 300,
      hf_power: (Math.random() * 400) + 200,
      lf_hf_ratio: (Math.random() * 2) + 0.5,
      eda_tonic: baseTonic + (variation * 0.5),
      eda_phasic: Math.random() * 0.5,
    });
  }
  return readings;
};

const mockReadings = generateMockReadings();

export default function History() {
  const { user } = useAuth();
  const { patientId } = useParams<{ patientId: string }>();
  const [patientProfile, setPatientProfile] = useState<{ first_name: string; last_name: string } | null>(null);

  // If patientId is present, we are viewing as a doctor
  const isDoctorView = !!patientId;

  // Fetch Patient Profile if in Doctor View
  useEffect(() => {
    if (patientId) {
      const fetchPatient = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', patientId)
          .single();
        if (data) setPatientProfile(data);
      };
      fetchPatient();
    }
  }, [patientId]);

  // Fetch readings: 
  // - If Doctor View: fetch for patientId, 14 days
  // - If Patient View: fetch for self (default), 100 limit (default in hook/component logic? hook handles logic now)
  //   Actually, we updated hook to default to 1 day if not specified? No, let's check hook usage.
  //   We want full history for patient view too? The original code had no limit or 100 limit. 
  //   Let's pass '14' for doctor view to get 14 days. For patient, maybe default/undefined to get standard behavior? 
  //   Checking hook... Hook defaults to 1 day. Original History page showed "Past comfort predictions". 
  //   Let's request 30 days for patient view to be safe/useful, and 14 for doctor as requested.
  
  const { readings: dbReadings, loading } = useComfortReadings(patientId, isDoctorView ? 30 : 30);

  // Use mock data if no database readings exist
  const rawReadings = dbReadings.length > 0 ? dbReadings : mockReadings;
  
  // Sort by most recent first
  const readings = [...rawReadings].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );

  const getComfortBadgeClass = (level: number) => {
    const classes: Record<number, string> = { 1: 'bg-comfort-1', 2: 'bg-comfort-2' };
    return classes[level] || 'bg-comfort-2';
  };

  if (loading) return <DashboardLayout><div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 w-full" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">
            {isDoctorView 
              ? `History: ${patientProfile?.first_name || 'Loading...'} ${patientProfile?.last_name || ''}`
              : "History"}
          </h1>
          <p className="text-muted-foreground">
            {isDoctorView 
              ? "Viewing last 30 days of patient data" 
              : "Past comfort predictions for clinical tracking"}
          </p>
        </div>

        <div className="medical-card overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Time</TableHead>
                <TableHead>Comfort Level</TableHead>
                
                {(isDoctorView || user?.email === 'doctor1@gmail.com') && (
                  <>
                    <TableHead className="hidden md:table-cell">LF (ms²)</TableHead>
                    <TableHead className="hidden md:table-cell">HF (ms²)</TableHead>
                    <TableHead className="hidden lg:table-cell">LF/HF</TableHead>
                    <TableHead className="hidden lg:table-cell">EDA Tonic</TableHead>
                    <TableHead className="hidden lg:table-cell">EDA Phasic</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {readings.map((reading) => (
                <TableRow key={reading.id}>
                  <TableCell>{format(new Date(reading.recorded_at), 'MMM d, yyyy HH:mm')}</TableCell>
                  <TableCell>
                    <Badge className={`${getComfortBadgeClass(reading.comfort_level)} text-white`}>
                      {getComfortDetails(reading.comfort_level).label}
                    </Badge>
                  </TableCell>
                  
                  {(isDoctorView || user?.email === 'doctor1@gmail.com') && (
                    <>
                      <TableCell className="hidden md:table-cell">{reading.lf_power?.toFixed(2) || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">{reading.hf_power?.toFixed(2) || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{reading.lf_hf_ratio?.toFixed(2) || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{reading.eda_tonic?.toFixed(3) || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{reading.eda_phasic?.toFixed(3) || '—'}</TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
