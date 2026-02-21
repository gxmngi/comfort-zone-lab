import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ComfortStatus } from '@/components/dashboard/ComfortStatus';
import { HRVChart } from '@/components/dashboard/HRVChart';
import { EDAChart } from '@/components/dashboard/EDAChart';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { RecommendationsCard } from '@/components/dashboard/RecommendationsCard';
import { useProfile } from '@/hooks/useProfile';
import { generateHRVData, generateEDAData, predictComfortLevel, HRVDataPoint, EDADataPoint } from '@/utils/mockData';
import { Clock } from 'lucide-react';
import { useEmotibit } from '@/hooks/useEmotibit';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const { profile } = useProfile();
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patientProfile, setPatientProfile] = useState<any>(null);
  
  // Checking if the user is a simple "user" role (patient) to show simplified view
  // If viewing a patient (patientId present), we assume doctor view (full view), unless specifically requested otherwise.
  // BUT, if profile.role is user, they shouldn't see patientId route anyway typically.
  const isSimpleView = profile?.role === 'user' && !patientId;

  // Redirect doctor to patient list if no patientId is provided
  useEffect(() => {
    if (profile?.role === 'doctor' && !patientId) {
      navigate('/doctor/patient-list', { replace: true });
    }
  }, [profile, patientId, navigate]);

  // Fetch Patient Profile if patientId exists
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
  
  // Real-time Emotibit Data
  const { status: emotibitStatus, data: emotibitData, edaHistory, ppgHistory, hrvHistory } = useEmotibit();

  const [hrvData, setHrvData] = useState<HRVDataPoint[]>([]);
  const [edaData, setEdaData] = useState<EDADataPoint[]>([]);
  const [comfortLevel, setComfortLevel] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock - updates every second
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Use real data if connected, otherwise mock
  const isEmotibitConnected = emotibitStatus === 'CONNECTED';

  // Mock data logic (Only run if NOT connected)
  useEffect(() => {
    if (isEmotibitConnected) return;

    const initialHRV = generateHRVData(30);
    const initialEDA = generateEDAData(30);
    setHrvData(initialHRV);
    setEdaData(initialEDA);

    const dataInterval = setInterval(() => {
      setHrvData(prev => [...prev.slice(1), generateHRVData(1)[0]]);
      setEdaData(prev => [...prev.slice(1), generateEDAData(1)[0]]);
    }, 3000);

    return () => clearInterval(dataInterval);
  }, [isEmotibitConnected]);

  // Comfort Level Logic — uses REAL sensor data when Emotibit is connected
  // Falls back to mock-data-based prediction when disconnected
  useEffect(() => {
    const comfortInterval = setInterval(() => {
      if (isEmotibitConnected) {
        // Use real sensor data for prediction
        const realHrvForPrediction = hrvHistory.length > 0
          ? hrvHistory.map(h => ({ time: h.time, lf: h.lf, hf: h.hf, lfHfRatio: h.lfHfRatio }))
          : hrvData;
        const realEdaForPrediction = edaHistory.length > 0
          ? edaHistory.map(e => ({ time: e.time, tonic: e.tonic, phasic: e.phasic }))
          : edaData;
        setComfortLevel(predictComfortLevel(realHrvForPrediction, realEdaForPrediction));
      } else {
        // Mock mode: predict from generated mock data
        setComfortLevel(predictComfortLevel(hrvData, edaData));
      }
    }, 3000);

    return () => clearInterval(comfortInterval);
  }, [isEmotibitConnected, hrvHistory, edaHistory, hrvData, edaData]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const latestHRV: { lf: number; hf: number } = isEmotibitConnected 
    ? (emotibitData.HRV || { lf: 0, hf: 0 }) 
    : (hrvData[hrvData.length - 1] || { lf: 0, hf: 0 });
    
  const latestEDA: { tonic: number } = isEmotibitConnected 
    ? { tonic: emotibitData.EDA || 0 } 
    : (edaData[edaData.length - 1] || { tonic: 0 });

  const displayHeartRate = isEmotibitConnected ? (emotibitData.HR || 0) : 65 + Math.random() * 15;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Live Clock */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-display text-2xl font-bold">
               {patientId && patientProfile 
                  ? `Dashboard: ${patientProfile.first_name} ${patientProfile.last_name}`
                  : "Dashboard"}
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">{patientId ? "Viewing patient real-time data" : "Real-time physiological monitoring"}</p>
              {isEmotibitConnected ? (
                 <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Emotibit Linked</span>
              ) : (
                 <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-medium">Simulation Mode</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
            <Clock className="h-4 w-4 text-primary" />
            <div className="text-right">
              <div className="font-mono text-lg font-semibold">{formatTime(currentTime)}</div>
              <div className="text-xs text-muted-foreground">{formatDate(currentTime)}</div>
            </div>
          </div>
        </div>

        <QuickStats 
           heartRate={displayHeartRate} 
           lfPower={latestHRV.lf} 
           hfPower={latestHRV.hf} 
           edaTonic={latestEDA.tonic} 
           simpleMode={isSimpleView}
        />
        
        {/* Two-column layout: Left = Comfort Focus, Right = Physiological Data */}
        <div className={`grid gap-6 items-stretch ${isSimpleView ? 'grid-cols-1' : 'lg:grid-cols-[2fr_3fr]'}`}>
          {/* Left Column: Comfort Focus (narrower) */}
          <div className={isSimpleView ? "grid gap-6 md:grid-cols-2" : "flex flex-col gap-6"}>
            <ComfortStatus level={comfortLevel} className="flex-1" />
            <RecommendationsCard comfortLevel={comfortLevel} hasDustAllergy={profile?.dust_allergy ?? false} className="flex-1" />
          </div>
          
          {/* Right Column: Physiological Data (wider) - HIDDEN in Simple View */}
          {!isSimpleView && (
            <div className="flex flex-col gap-6">
                <HRVChart 
                data={isEmotibitConnected ? hrvHistory : hrvData} 
                className="flex-1 min-h-[280px]" 
                />
                <EDAChart 
                data={isEmotibitConnected ? edaHistory : edaData} 
                className="flex-1 min-h-[280px]" 
                />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
