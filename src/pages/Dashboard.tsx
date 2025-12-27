import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ComfortStatus } from '@/components/dashboard/ComfortStatus';
import { HRVChart } from '@/components/dashboard/HRVChart';
import { EDAChart } from '@/components/dashboard/EDAChart';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { RecommendationsCard } from '@/components/dashboard/RecommendationsCard';
import { useProfile } from '@/hooks/useProfile';
import { generateHRVData, generateEDAData, HRVDataPoint, EDADataPoint } from '@/utils/mockData';
import { Clock } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useProfile();
  const [hrvData, setHrvData] = useState<HRVDataPoint[]>([]);
  const [edaData, setEdaData] = useState<EDADataPoint[]>([]);
  const [comfortLevel, setComfortLevel] = useState(1);
  const [comfortDirection, setComfortDirection] = useState<'up' | 'down'>('up');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock - updates every second
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    const initialHRV = generateHRVData(30);
    const initialEDA = generateEDAData(30);
    setHrvData(initialHRV);
    setEdaData(initialEDA);

    // Update HRV/EDA data every 3 seconds
    const dataInterval = setInterval(() => {
      setHrvData(prev => [...prev.slice(1), generateHRVData(1)[0]]);
      setEdaData(prev => [...prev.slice(1), generateEDAData(1)[0]]);
    }, 3000);

    // Comfort level ping-pong: 1→2→3→4→5→4→3→2→1→... every 5 seconds
    const comfortInterval = setInterval(() => {
      setComfortLevel(prev => {
        if (prev === 5) {
          setComfortDirection('down');
          return 4;
        } else if (prev === 1) {
          setComfortDirection('up');
          return 2;
        }
        return comfortDirection === 'up' ? prev + 1 : prev - 1;
      });
    }, 5000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(comfortInterval);
    };
  }, [comfortDirection]);

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

  const latestHRV = hrvData[hrvData.length - 1] || { lf: 0, hf: 0 };
  const latestEDA = edaData[edaData.length - 1] || { tonic: 0 };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Live Clock */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-display text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Real-time physiological monitoring</p>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
            <Clock className="h-4 w-4 text-primary" />
            <div className="text-right">
              <div className="font-mono text-lg font-semibold">{formatTime(currentTime)}</div>
              <div className="text-xs text-muted-foreground">{formatDate(currentTime)}</div>
            </div>
          </div>
        </div>

        <QuickStats heartRate={65 + Math.random() * 15} lfPower={latestHRV.lf} hfPower={latestHRV.hf} edaTonic={latestEDA.tonic} />
        
        {/* Two-column layout: Left = Comfort Focus, Right = Physiological Data */}
        <div className="grid lg:grid-cols-[2fr_3fr] gap-6">
          {/* Left Column: Comfort Focus (narrower) */}
          <div className="flex flex-col gap-6">
            <ComfortStatus level={comfortLevel} className="h-[280px]" />
            <RecommendationsCard comfortLevel={comfortLevel} hasDustAllergy={profile?.dust_allergy ?? false} className="flex-1 min-h-[280px]" />
          </div>
          
          {/* Right Column: Physiological Data (wider) */}
          <div className="flex flex-col gap-6">
            <HRVChart data={hrvData} className="h-[280px] overflow-hidden" />
            <EDAChart data={edaData} className="h-[280px] overflow-hidden" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
