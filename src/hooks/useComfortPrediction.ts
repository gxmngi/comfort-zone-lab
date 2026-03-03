import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Configuration ─────────────────────────────────────────────────────────────
const BACKEND_URL = 'http://localhost:8000';
// 60s window is the minimum recommended for reliable EDA tonic decomposition
// and HRV MedianNN estimation (NeuroKit2 docs, Task Force 1996)
const BUFFER_SIZE = 60;        // Collect 60 seconds of data before predicting
const PREDICT_INTERVAL = 60;   // Re-predict every 60 seconds

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface ComfortPrediction {
  prediction: number;          // 0 = สบาย, 1 = ไม่สบาย
  probability: number;         // 0–1 probability of uncomfortable
  comfortStatus: string;       // "สบาย" or "ไม่สบาย"
  edaTonicStd: number;
  hrvMedianNn: number | null;
  modelLoaded: boolean;
}

export interface UseComfortPredictionReturn {
  /** Latest prediction result */
  prediction: ComfortPrediction | null;
  /** True while waiting for the API response */
  isLoading: boolean;
  /** Number of data points buffered so far */
  bufferCount: number;
  /** Buffer size needed before first prediction */
  bufferTarget: number;
  /** Any error from the last API call */
  error: string | null;
  /** ISO timestamp of the last successful prediction */
  lastPredictedAt: string | null;
  /** Whether the backend is reachable */
  backendOnline: boolean;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useComfortPrediction(
  edaValue: number | undefined,
  ppgValue: number | undefined,
  bmi: number | undefined,
): UseComfortPredictionReturn {
  const [prediction, setPrediction] = useState<ComfortPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPredictedAt, setLastPredictedAt] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [bufferCount, setBufferCount] = useState(0);

  const edaBuffer = useRef<number[]>([]);
  const ppgBuffer = useRef<number[]>([]);
  const lastPredictTime = useRef<number>(0);

  // ── Check backend health on mount ──
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          setBackendOnline(true);
        }
      } catch {
        setBackendOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // ── Call prediction API ──
  const callPredict = useCallback(async (eda: number[], ppg: number[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bmi,
          eda_readings: eda,
          ppg_readings: ppg,
          sampling_rate: 1,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();

      setPrediction({
        prediction: data.prediction,
        probability: data.probability,
        comfortStatus: data.comfort_status,
        edaTonicStd: data.eda_tonic_std,
        hrvMedianNn: data.hrv_median_nn,
        modelLoaded: data.model_loaded,
      });
      setLastPredictedAt(new Date().toISOString());
      setBackendOnline(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Prediction failed');
      setBackendOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, [bmi]);

  // ── Buffer incoming data + trigger prediction ──
  useEffect(() => {
    if (edaValue === undefined || ppgValue === undefined) return;

    edaBuffer.current.push(edaValue);
    ppgBuffer.current.push(ppgValue);

    // Keep buffer capped at 2× target to avoid memory growth
    if (edaBuffer.current.length > BUFFER_SIZE * 2) {
      edaBuffer.current = edaBuffer.current.slice(-BUFFER_SIZE);
      ppgBuffer.current = ppgBuffer.current.slice(-BUFFER_SIZE);
    }

    setBufferCount(edaBuffer.current.length);

    // Skip prediction if BMI is not available
    if (bmi === undefined) return;

    const now = Date.now();
    const elapsed = (now - lastPredictTime.current) / 1000;

    // Only predict when we have enough data and enough time has passed
    if (
      edaBuffer.current.length >= BUFFER_SIZE &&
      (elapsed >= PREDICT_INTERVAL || lastPredictTime.current === 0)
    ) {
      const edaSnapshot = [...edaBuffer.current.slice(-BUFFER_SIZE)];
      const ppgSnapshot = [...ppgBuffer.current.slice(-BUFFER_SIZE)];
      lastPredictTime.current = now;
      callPredict(edaSnapshot, ppgSnapshot);
    }
  }, [edaValue, ppgValue, bmi, callPredict]);

  return {
    prediction,
    isLoading,
    bufferCount,
    bufferTarget: BUFFER_SIZE,
    error,
    lastPredictedAt,
    backendOnline,
  };
}
