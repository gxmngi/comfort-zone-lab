import { useState, useEffect, useRef } from 'react';

// Data types based on Emotibit output
export interface EmotibitData {
  PPG: { red: number; ir: number; green: number } | null;
  EDA: number | null;
  HR: number | null;     // Heart Rate
  TEMP: number | null;   // Temperature
  SCR: { amp: number; freq: number; ris: number } | null; // Skin Conductance Response
  HRV: { lf: number; hf: number; lfHfRatio: number } | null; // From lsl-bridge.py FFT
}

const INITIAL_DATA: EmotibitData = {
  PPG: null, EDA: null, HR: null, TEMP: null, SCR: null, HRV: null,
};

const WS_URL = 'ws://localhost:3001';
const RECONNECT_DELAY = 3000;
const UI_UPDATE_INTERVAL = 33; // ~30 FPS
const MAX_EDA_HISTORY = 50;
const MAX_PPG_HISTORY = 200;
const MAX_HRV_HISTORY = 50;

/** Extract a single numeric value from WS message data (handles both array and scalar) */
function extractNumber(values: unknown): number {
  if (Array.isArray(values)) return Number(values[0]) || 0;
  if (typeof values === 'number') return values;
  return 0;
}

export function useEmotibit() {
  const [status, setStatus] = useState<'DISCONNECTED' | 'CONNECTED'>('DISCONNECTED');

  // State for UI rendering (updated at throttled rate)
  const [data, setData] = useState<EmotibitData>(INITIAL_DATA);
  const [edaHistory, setEdaHistory] = useState<{ time: string; tonic: number; phasic: number }[]>([]);
  const [ppgHistory, setPpgHistory] = useState<{ time: string; value: number }[]>([]);
  const [hrvHistory, setHrvHistory] = useState<{ time: string; lf: number; hf: number; lfHfRatio: number }[]>([]);

  // Refs for high-frequency data buffering (avoids re-renders on every message)
  const wsRef = useRef<WebSocket | null>(null);
  const latestDataRef = useRef<EmotibitData>({ ...INITIAL_DATA });

  const edaBufferRef = useRef<{ time: string; tonic: number; phasic: number }[]>([]);
  const ppgBufferRef = useRef<{ time: string; value: number }[]>([]);
  const hrvBufferRef = useRef<{ time: string; lf: number; hf: number; lfHfRatio: number }[]>([]);

  // Track whether component is still mounted (fixes reconnection leak)
  const isMountedRef = useRef(true);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    // ----- Data Buffering (runs on every WS message — fast) -----
    const bufferData = (message: { tag: string; data: unknown }) => {
      const { tag, data: values } = message;
      const next = { ...latestDataRef.current };
      const nowStr = new Date().toLocaleTimeString();

      switch (tag) {
        case 'EDA': {
          // Raw EDA value ≈ Skin Conductance Level (Tonic) for short-term monitoring
          // True decomposition would require cvxEDA or similar algorithm
          const edaVal = extractNumber(values);
          next.EDA = edaVal;
          edaBufferRef.current.push({
            time: nowStr,
            tonic: edaVal,
            phasic: next.SCR?.amp || 0,
          });
          if (edaBufferRef.current.length > MAX_EDA_HISTORY) edaBufferRef.current.shift();
          break;
        }

        case 'PPG:GRN': {
          const val = extractNumber(values);
          next.PPG = { ...next.PPG!, green: val };
          ppgBufferRef.current.push({ time: nowStr, value: val });
          if (ppgBufferRef.current.length > MAX_PPG_HISTORY) ppgBufferRef.current.shift();
          break;
        }

        case 'PPG:RED': {
          next.PPG = { ...next.PPG!, red: extractNumber(values) };
          break;
        }

        case 'PPG:IR': {
          next.PPG = { ...next.PPG!, ir: extractNumber(values) };
          break;
        }

        case 'HR': {
          next.HR = extractNumber(values);
          break;
        }

        case 'TEMP':
        case 'THERM': {
          next.TEMP = extractNumber(values);
          break;
        }

        case 'SCR:AMP': {
          next.SCR = { ...next.SCR!, amp: extractNumber(values) };
          break;
        }

        case 'SCR:FREQ': {
          next.SCR = { ...next.SCR!, freq: extractNumber(values) };
          break;
        }

        case 'HRV': {
          // lsl-bridge.py sends HRV as object: { rmssd, lf, hf, lf_hf_ratio }
          // emotibit-bridge.js does NOT send HRV at all
          if (typeof values === 'object' && values !== null && !Array.isArray(values)) {
            const hrvObj = values as Record<string, number>;
            next.HRV = {
              lf: hrvObj.lf || 0,
              hf: hrvObj.hf || 0,
              lfHfRatio: hrvObj.lf_hf_ratio || 0,
            };
            hrvBufferRef.current.push({
              time: nowStr,
              lf: hrvObj.lf || 0,
              hf: hrvObj.hf || 0,
              lfHfRatio: hrvObj.lf_hf_ratio || 0,
            });
            if (hrvBufferRef.current.length > MAX_HRV_HISTORY) hrvBufferRef.current.shift();
          }
          break;
        }
      }

      latestDataRef.current = next;
    };

    // ----- WebSocket Connection -----
    const connect = () => {
      // Don't reconnect if component is unmounted
      if (!isMountedRef.current) return;

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Connected to Emotibit Bridge');
        if (isMountedRef.current) setStatus('CONNECTED');
      };

      ws.onclose = () => {
        console.log('❌ Disconnected from Emotibit Bridge');
        if (isMountedRef.current) {
          setStatus('DISCONNECTED');
          // Only reconnect if still mounted
          reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'DATA') {
            bufferData(message);
          }
        } catch (e) {
          console.error('Error parsing WS message', e);
        }
      };
    };

    // ----- UI Update Loop (Throttled — 30 FPS) -----
    const intervalId = setInterval(() => {
      setData({ ...latestDataRef.current });
      setEdaHistory([...edaBufferRef.current]);
      setPpgHistory([...ppgBufferRef.current]);
      setHrvHistory([...hrvBufferRef.current]);
    }, UI_UPDATE_INTERVAL);

    connect();

    // ----- Cleanup -----
    return () => {
      isMountedRef.current = false;

      // Clear reconnection timer
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      // Close WebSocket without triggering reconnect
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      clearInterval(intervalId);
    };
  }, []);

  return {
    status,
    data,
    edaHistory,
    ppgHistory,
    hrvHistory,
  };
}
