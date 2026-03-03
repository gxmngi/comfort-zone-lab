import { useState, useEffect, useRef } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';

// ─── Constants ────────────────────────────────────────────────────────────────
const DEVICE_ID = 'MD-V5-0000804';
const FB_PATH_1S = `Device/Inpatient/${DEVICE_ID}/1s`;
const MAX_HISTORY = 60; // keep last 60 data points for graphs

/** If no new data arrives within this many ms, mark as disconnected */
const STALE_THRESHOLD_MS = 5_000;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface FirebaseEmotibitSnapshot {
  BatteryPercent: number;
  EDA: number;
  HeartRate: number;
  PPG: number;
  ST: number;
}

export type EDAPoint = { time: string; value: number };
export type PPGPoint = { time: string; value: number };

export interface UseFirebaseEmotibitReturn {
  isConnected: boolean;
  latest: FirebaseEmotibitSnapshot | null;
  edaHistory: EDAPoint[];
  ppgHistory: PPGPoint[];
  deviceId: string;
}

const DEFAULT_SNAPSHOT: FirebaseEmotibitSnapshot = {
  BatteryPercent: 0,
  EDA: 0,
  HeartRate: 0,
  PPG: 0,
  ST: 0,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useFirebaseEmotibit(): UseFirebaseEmotibitReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [latest, setLatest] = useState<FirebaseEmotibitSnapshot | null>(null);
  const [edaHistory, setEdaHistory] = useState<EDAPoint[]>([]);
  const [ppgHistory, setPpgHistory] = useState<PPGPoint[]>([]);

  const edaHistoryRef = useRef<EDAPoint[]>([]);
  const ppgHistoryRef = useRef<PPGPoint[]>([]);

  // Track the last time Firebase sent NEW data
  const lastUpdateRef = useRef<number>(0);

  // ── Stale-detection watchdog ──────────────────────────────────────────────
  // Periodically check if data is too old → mark as disconnected
  useEffect(() => {
    const watchdog = setInterval(() => {
      if (lastUpdateRef.current === 0) return; // haven't received anything yet
      const age = Date.now() - lastUpdateRef.current;
      if (age > STALE_THRESHOLD_MS) {
        setIsConnected(false);
      }
    }, 2_000); // check every 2 seconds

    return () => clearInterval(watchdog);
  }, []);

  // ── Firebase listener ─────────────────────────────────────────────────────
  useEffect(() => {
    const dbRef = ref(database, FB_PATH_1S);

    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setIsConnected(false);
          return;
        }

        const raw = snapshot.val();
        const timeStr = new Date().toLocaleTimeString('th-TH', { hour12: false });

        // ── Freshness check ──────────────────────────────────────────────
        // If the Firebase node has a Timestamp field, use it.
        // Otherwise fall back to tracking wall-clock time of the JS callback.
        let dataTimestamp: number | null = null;

        if (raw.Timestamp) {
          // Firebase stores epoch ms or ISO string
          const t = typeof raw.Timestamp === 'number'
            ? raw.Timestamp
            : new Date(raw.Timestamp).getTime();
          if (!isNaN(t)) dataTimestamp = t;
        }

        const now = Date.now();
        const age = dataTimestamp ? now - dataTimestamp : 0;

        // If the data has a timestamp and it's older than our threshold, ignore it
        if (dataTimestamp && age > STALE_THRESHOLD_MS) {
          setIsConnected(false);
          return;
        }

        // Mark fresh
        lastUpdateRef.current = now;

        const data: FirebaseEmotibitSnapshot = {
          BatteryPercent: raw.BatteryPercent ?? DEFAULT_SNAPSHOT.BatteryPercent,
          EDA: raw.EDA ?? DEFAULT_SNAPSHOT.EDA,
          HeartRate: raw.HeartRate ?? DEFAULT_SNAPSHOT.HeartRate,
          PPG: raw.PPG ?? DEFAULT_SNAPSHOT.PPG,
          ST: raw.ST ?? DEFAULT_SNAPSHOT.ST,
        };

        setLatest(data);
        setIsConnected(true);

        // Buffer EDA history for graph (raw value)
        edaHistoryRef.current = [
          ...edaHistoryRef.current,
          { time: timeStr, value: data.EDA },
        ].slice(-MAX_HISTORY);
        setEdaHistory([...edaHistoryRef.current]);

        // Buffer PPG history for graph
        ppgHistoryRef.current = [
          ...ppgHistoryRef.current,
          { time: timeStr, value: data.PPG },
        ].slice(-MAX_HISTORY);
        setPpgHistory([...ppgHistoryRef.current]);
      },
      (error) => {
        console.error('Firebase read error:', error);
        setIsConnected(false);
      }
    );

    return () => {
      off(dbRef);
    };
  }, []);

  return { isConnected, latest, edaHistory, ppgHistory, deviceId: DEVICE_ID };
}
