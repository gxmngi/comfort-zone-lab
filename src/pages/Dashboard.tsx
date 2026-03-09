import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ComfortStatus } from '@/components/dashboard/ComfortStatus';
import { EDAChart } from '@/components/dashboard/EDAChart';
import { PPGChart } from '@/components/dashboard/PPGChart';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { RecommendationsCard } from '@/components/dashboard/RecommendationsCard';
import { useProfile, calculateBMI } from '@/hooks/useProfile';
import { useFirebaseEmotibit } from '@/hooks/useFirebaseEmotibit';
import { useComfortPrediction } from '@/hooks/useComfortPrediction';
import { useComfortReadings } from '@/hooks/useComfortReadings';
import { useEvaluationLock } from '@/hooks/useEvaluationLock';
import { Clock, Brain, Wifi, WifiOff, Loader2, AlertTriangle, Lock, Play, Square } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const { profile } = useProfile();
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patientProfile, setPatientProfile] = useState<{ first_name: string; last_name: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const isSimpleView = profile?.role === 'user' && !patientId;

  // Redirect doctor to patient list if no patientId
  useEffect(() => {
    if (profile?.role === 'doctor' && !patientId) {
      navigate('/doctor/patient-list', { replace: true });
    }
  }, [profile, patientId, navigate]);

  // Fetch patient profile for doctor view
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

  // ── Firebase real-time data ──────────────────────────────────────────────
  const { isConnected, latest, edaHistory, ppgHistory } = useFirebaseEmotibit();

  // ── Calculate BMI from profile ─────────────────────────────────────────
  const userBmi = calculateBMI(profile?.weight_kg ?? null, profile?.height_cm ?? null);
  // ── Evaluation Lock ────────────────────────────────────────────────────────
  const currentProfileId = profile?.id ?? 'unknown';
  const currentProfileName = patientProfile 
    ? `${patientProfile.first_name} ${patientProfile.last_name}` 
    : profile?.first_name 
      ? `${profile.first_name} ${profile.last_name}` 
      : 'Unknown User';
      
  const { isLockedByOther, activeName, amILocked, acquireLock, releaseLock } = useEvaluationLock(currentProfileId, currentProfileName);

  const {
    prediction,
    isLoading: isPredicting,
    bufferCount,
    bufferTarget,
    error: predictionError,
    lastPredictedAt,
    backendOnline,
  } = useComfortPrediction(latest?.EDA, latest?.PPG, userBmi ?? undefined, amILocked);

  // We only start collecting data to the predictors if we are locked by ourselves
  const shouldPredict = amILocked;

  // Map prediction to comfort level: 0 (สบาย) → 2, 1 (ไม่สบาย) → 1
  // 0 = no prediction yet, 1 = uncomfortable, 2 = comfortable
  const comfortLevel = prediction ? (prediction.prediction === 0 ? 2 : 1) : 0;

  // ── Live clock ───────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Save prediction to Supabase ─────────────────────────────────────────
  const { addReading } = useComfortReadings();
  const lastSavedPrediction = useRef<string | null>(null);
  const addReadingRef = useRef(addReading);
  addReadingRef.current = addReading;
  const latestRef = useRef(latest);
  latestRef.current = latest;

  useEffect(() => {
    // Only save when we get a new prediction (check by timestamp)
    if (!prediction || !lastPredictedAt) return;
    if (lastSavedPrediction.current === lastPredictedAt) return;

    lastSavedPrediction.current = lastPredictedAt;

    addReadingRef.current({
      comfort_level: prediction.prediction === 0 ? 2 : 1,
      eda_tonic: prediction.edaTonicStd,
      eda_phasic: null,
      lf_power: null,
      hf_power: null,
      lf_hf_ratio: null,
      heart_rate: latestRef.current?.HeartRate ?? null,
      recorded_at: new Date().toISOString(),
    });
  }, [prediction, lastPredictedAt]);

  const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour12: false });
  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const heartRate  = latest?.HeartRate      ?? 0;
  const battery    = latest?.BatteryPercent  ?? 0;
  const skinTemp   = latest?.ST              ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-display text-2xl font-bold">
              {patientId && patientProfile
                ? `Dashboard: ${patientProfile.first_name} ${patientProfile.last_name}`
                : 'Dashboard'}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-muted-foreground">
                {patientId ? 'Viewing patient real-time data' : 'Real-time physiological monitoring'}
              </p>

              {/* Firebase status */}
              {isConnected ? (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  Firebase Live
                </span>
              ) : (
                <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-medium">
                  Connecting…
                </span>
              )}

              {/* Backend status */}
              {backendOnline ? (
                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                  <Brain className="h-3 w-3" /> AI Model Ready
                </span>
              ) : (
                <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                  <WifiOff className="h-3 w-3" /> AI Offline
                </span>
              )}
            </div>
          </div>

          {/* Clock */}
          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
            <Clock className="h-4 w-4 text-primary" />
            <div className="text-right">
              <div className="font-mono text-lg font-semibold">{formatTime(currentTime)}</div>
              <div className="text-xs text-muted-foreground">{formatDate(currentTime)}</div>
            </div>
          </div>
        </div>

        {/* ── Quick Stats: HR | ST | Battery ───────────────────────── */}
        <QuickStats
          heartRate={heartRate}
          batteryPercent={battery}
          skinTemp={skinTemp}
          simpleMode={isSimpleView}
          isConnected={isConnected}
        />

        {/* ── BMI missing warning ──────────────────────────────────── */}
        {!userBmi && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">กรุณากรอกน้ำหนักและส่วนสูงก่อน</p>
              <p className="text-xs text-amber-600">
                โมเดล AI ต้องใช้ค่า BMI ในการทำนาย — กรุณาไปกรอกข้อมูลที่หน้า Profile
              </p>
            </div>
            <button
              onClick={() => navigate('/profile/edit')}
              className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors flex-shrink-0"
            >
              กรอกข้อมูล
            </button>
          </div>
        )}

        {/* ── Quit early if locked by other ──────────────────────────────── */}
        {isLockedByOther && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center justify-center gap-3 text-center mb-6">
            <Lock className="h-10 w-10 text-red-500 mb-2" />
            <div>
              <p className="text-lg font-semibold text-red-800">กำลังประเมินข้อมูลซ้อนทับ</p>
              <p className="text-red-600 mt-1">
                ขณะนี้มีผู้ใช้งานอื่น ({activeName}) กำลังประเมินระดับความสบาย<br/>
                กรุณารอจนกว่าการประเมินของโปรไฟล์นั้นจะเสร็จสิ้น
              </p>
            </div>
          </div>
        )}

        {/* ── Lock Controls ──────────────────────────────────────────────── */}
        {!isLockedByOther && userBmi && isConnected && backendOnline && (
           <div className="flex justify-end my-4">
              {!amILocked ? (
                 <button
                   onClick={acquireLock}
                   className="flex items-center gap-2 px-6 py-3 font-semibold text-white bg-primary rounded-xl shadow hover:bg-primary/90 transition-all hover:scale-[1.02]"
                 >
                   <Play className="w-5 h-5" /> เริ่มการประเมินวิเคราะห์ (Start Evaluation)
                 </button>
              ) : (
                 <button
                   onClick={releaseLock}
                   className="flex items-center gap-2 px-6 py-3 font-semibold text-red-600 bg-red-100 hover:bg-red-200 border border-red-200 rounded-xl transition-all"
                 >
                   <Square className="w-5 h-5" fill="currentColor" /> จบการประเมินวิเคราะห์ (Stop Evaluation)
                 </button>
              )}
           </div>
        )}

        {/* ── Data collection progress ─────────────────────────────── */}
        {backendOnline && !prediction && isConnected && !isLockedByOther && amILocked && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-800">กำลังรวบรวมข้อมูล...</p>
              <p className="text-xs text-blue-600">
                เก็บข้อมูลแล้ว {bufferCount}/{bufferTarget} วินาที — รอครบแล้วจะทำนายอัตโนมัติ
              </p>
              <div className="mt-1.5 w-full bg-blue-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (bufferCount / bufferTarget) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Prediction error ─────────────────────────────────────── */}
        {predictionError && amILocked && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            ⚠️ Prediction error: {predictionError}
          </div>
        )}

        {/* ── Main grid ────────────────────────────────────────────── */}
        <div className={`grid gap-6 items-stretch ${isLockedByOther || !amILocked ? 'opacity-50 pointer-events-none filter grayscale' : ''} ${isSimpleView ? 'grid-cols-1' : 'lg:grid-cols-[2fr_3fr]'}`}>

          {/* Left: Comfort + Recommendations */}
          <div className={isSimpleView ? 'grid gap-6 md:grid-cols-2' : 'flex flex-col gap-6'}>
            <ComfortStatus
              level={comfortLevel}
              probability={prediction?.probability}
              isPredicting={isPredicting}
              lastPredictedAt={lastPredictedAt}
              className="flex-1"
            />
            <RecommendationsCard
              comfortLevel={comfortLevel}
              hasDustAllergy={profile?.dust_allergy ?? false}
              className="flex-1"
            />
          </div>

          {/* Right: EDA + PPG (hidden in Simple View) */}
          {!isSimpleView && (
            <div className="relative flex flex-col gap-6">
              {!isConnected && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm rounded-xl">
                  <div className="bg-card border shadow-lg rounded-full px-6 py-3 flex items-center gap-3">
                     <WifiOff className="h-5 w-5 text-muted-foreground" />
                     <span className="font-medium text-muted-foreground">กำลังรอการเชื่อมต่อข้อมูล... (Waiting for connection)</span>
                  </div>
                </div>
              )}
              <EDAChart data={edaHistory} className={`flex-1 min-h-[240px] transition-all duration-300 ${!isConnected ? 'opacity-40 blur-[2px]' : ''}`} />
              <PPGChart data={ppgHistory} className={`flex-1 min-h-[200px] transition-all duration-300 ${!isConnected ? 'opacity-40 blur-[2px]' : ''}`} />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
