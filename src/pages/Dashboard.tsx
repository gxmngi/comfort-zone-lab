import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ComfortStatus } from '@/components/dashboard/ComfortStatus';
import { HRVChart } from '@/components/dashboard/HRVChart';
import { EDAChart } from '@/components/dashboard/EDAChart';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { RecommendationsCard } from '@/components/dashboard/RecommendationsCard';
import { useProfile } from '@/hooks/useProfile';
import { generateHRVData, generateEDAData, predictComfortLevel, HRVDataPoint, EDADataPoint } from '@/utils/mockData';

export default function Dashboard() {
  const { profile } = useProfile();
  const [hrvData, setHrvData] = useState<HRVDataPoint[]>([]);
  const [edaData, setEdaData] = useState<EDADataPoint[]>([]);
  const [comfortLevel, setComfortLevel] = useState(3);

  useEffect(() => {
    const initialHRV = generateHRVData(30);
    const initialEDA = generateEDAData(30);
    setHrvData(initialHRV);
    setEdaData(initialEDA);
    setComfortLevel(predictComfortLevel(initialHRV, initialEDA));

    const interval = setInterval(() => {
      setHrvData(prev => {
        const newData = [...prev.slice(1), generateHRVData(1)[0]];
        setTimeout(() => setComfortLevel(predictComfortLevel(newData, edaData)), 0);
        return newData;
      });
      setEdaData(prev => [...prev.slice(1), generateEDAData(1)[0]]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const latestHRV = hrvData[hrvData.length - 1] || { lf: 0, hf: 0 };
  const latestEDA = edaData[edaData.length - 1] || { tonic: 0 };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="font-display text-2xl font-bold">Dashboard</h1><p className="text-muted-foreground">Real-time physiological monitoring</p></div>
        <QuickStats heartRate={65 + Math.random() * 15} lfPower={latestHRV.lf} hfPower={latestHRV.hf} edaTonic={latestEDA.tonic} />
        <div className="grid lg:grid-cols-3 gap-6">
          <ComfortStatus level={comfortLevel} className="lg:col-span-1" />
          <HRVChart data={hrvData} className="lg:col-span-2" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <EDAChart data={edaData} />
          <RecommendationsCard comfortLevel={comfortLevel} hasDustAllergy={profile?.dust_allergy ?? false} />
        </div>
      </div>
    </DashboardLayout>
  );
}