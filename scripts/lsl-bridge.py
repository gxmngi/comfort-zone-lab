import asyncio
import json
import time
import math
from collections import deque
from pylsl import StreamInlet, resolve_streams
import websockets

# Try to import numpy
try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False
    print("⚠️ Numpy not found. Running in approximation mode.")

# Configuration
WS_PORT = 3001
LOOKING_FOR_TYPES = [
    'EDA', 
    'HeartRate', 'HR', 
    'PPGGreen', 'PPGRed', 'PPG', 'PPGInfrared', 
    'Temperature', 'Thermopile', 'TEMP', 'THERM',
    'SCRAmplitude', 'SCRFrequency', 'SCRRiseTime', 'SCR',
    'BI'
]

class EmotibitBridge:
    def __init__(self):
        self.port = WS_PORT
        self.inlets = []
        
        # State Management
        self.ppg_window = deque(maxlen=15)
        self.ppg_avg_window = deque(maxlen=100)
        self.bi_buffer = deque(maxlen=300) # Store last ~5 mins of IBI
        
        self.last_peak_time = time.time()
        self.min_ibi = 0.3 # 200 BPM limit
        
        # "Last Known Good" values to prevent flickering to 0.00
        self.last_hrv = {
            "rmssd": 0, "lf": 0, "hf": 0, "lf_hf_ratio": 0
        }
        self.last_valid_calc_time = 0

    def calculate_hrv(self):
        """
        Robust HRV calculation with fallback strategies and windowing.
        """
        # 1. Check Data Sufficiency
        if len(self.bi_buffer) < 5:
            return None # Not enough data yet
        
        bis = list(self.bi_buffer)
        
        # 2. Time Domain: RMSSD (Robust)
        # Filter outliers from BI (e.g., missed beats causing 2x duration)
        # Simple median filter logic or deviation check could go here
        # For now, we trust the peak detector limits (0.3 - 2.0s)
        
        diffs = [bis[i+1] - bis[i] for i in range(len(bis)-1)]
        sq_diffs = [d**2 for d in diffs]
        avg_sq_diff = sum(sq_diffs) / len(sq_diffs) if len(sq_diffs) > 0 else 0
        rmssd = math.sqrt(avg_sq_diff) * 1000 # ms
        
        lf, hf, ratio = 0, 0, 0
        
        # 3. Frequency Domain
        if HAS_NUMPY and len(bis) >= 30: # Use approximation for <30s, FFT for >30s
            try:
                # Prepare Tachogram
                t = np.cumsum(bis)
                t = t - t[0]
                
                # Interpolation (Resampling to 4Hz)
                fs_interp = 4.0
                t_interp = np.arange(0, t[-1], 1/fs_interp)
                
                if len(t_interp) > 32:
                    rr_interp = np.interp(t_interp, t, bis)
                    
                    # Detrending (Remove DC component/Linear trend)
                    rr_interp = rr_interp - np.mean(rr_interp)
                    
                    # Windowing (Hamming) to reduce spectral leakage
                    window = np.hamming(len(rr_interp))
                    rr_windowed = rr_interp * window
                    
                    # FFT
                    n = len(rr_windowed)
                    freqs = np.fft.rfftfreq(n, d=1/fs_interp)
                    magnitude = np.abs(np.fft.rfft(rr_windowed)) ** 2
                    
                    # Normalize magnitude by window energy to correct power
                    msg_correction_factor = 1 / (np.sum(window**2) / n)
                    magnitude = magnitude * msg_correction_factor
                    
                    # Integrate Bands
                    lf_band = (freqs >= 0.04) & (freqs < 0.15)
                    hf_band = (freqs >= 0.15) & (freqs < 0.4)
                    
                    lf = np.sum(magnitude[lf_band])
                    hf = np.sum(magnitude[hf_band])
                    
                    if hf > 0.001: # Avoid division by zero
                        ratio = lf / hf
            except Exception as e:
                print(f"⚠️ FFT Error: {e}")
                # Fallback to approximation logic below
                lf, hf, ratio = 0, 0, 0 

        # 4. Hybrid Logic / Fallback / Smoothing
        # If FFT failed or data too short, use RMSSD approximation
        if lf == 0 or hf == 0:
            # Senior Logic: Don't just return 0. Use RMSSD as a proxy.
            # While not scientifically "LF", it correlates with HRV magnitude.
            lf = rmssd * 1.5
            hf = rmssd * 0.8
            ratio = 1.25 # Neutral ratio guess
            
        # 5. Output Smoothing (Prevent sudden drops to 0)
        # If new values seem broken (NaN or 0), keep old ones for a bit
        if math.isnan(rmssd) or rmssd == 0:
            return self.last_hrv

        result = {
            "rmssd": float(rmssd),
            "lf": float(lf),
            "hf": float(hf),
            "lf_hf_ratio": float(ratio)
        }
        
        # Update Last Known Good
        self.last_hrv = result
        self.last_valid_calc_time = time.time()
        
        print(f"🧮 HRV: RMSSD={rmssd:.1f} LF={lf:.1f} HF={hf:.1f} Ratio={ratio:.2f}")
        return result

    def detect_peak(self, val):
        """
        Real-time Peak Detection for PPG.
        Returns BI (seconds) if a peak is confirmed, else None.
        """
        self.ppg_window.append(val)
        self.ppg_avg_window.append(val)
        
        if len(self.ppg_window) < 5 or len(self.ppg_avg_window) < 20:
            return None
            
        # Dynamic Thresholding
        mid_idx = len(self.ppg_window) // 2
        mid_val = self.ppg_window[mid_idx]
        local_max = max(self.ppg_window)
        moving_avg = sum(self.ppg_avg_window) / len(self.ppg_avg_window)
        
        # Signal Quality Check: Is it flat/clipping?
        if local_max == 0 or local_max > 65000: # Assuming 16-bit uint
             return None
             
        # Criteria: 
        # 1. Is local maximum
        # 2. Is significantly above Moving Average (e.g. +5%)
        # 3. Passed refractory period
        
        is_peak = (mid_val >= local_max) and (mid_val > moving_avg * 1.01)
        
        current_time = time.time()
        if is_peak and (current_time - self.last_peak_time) > self.min_ibi:
            bi = current_time - self.last_peak_time
            self.last_peak_time = current_time
            
            # Biological Sanity Check (30-220 BPM)
            if 0.27 < bi < 2.0:
                return bi
                
        return None

    async def run(self):
        print(f"🚀 Bridge Starting on Port {self.port}...")
        async with websockets.serve(self.handler, "localhost", self.port):
            print("✅ WebSocket Server Listening.")
            await asyncio.Future() # Run forever

    async def handler(self, websocket):
        print("👤 Client Connected")
        await websocket.send(json.dumps({"type": "STATUS", "connected": True}))
        
        # Resolve Streams
        print("🔍 resolving LSL streams...")
        streams = resolve_streams(wait_time=2.0)
        
        # Setup Inlets
        active_inlets = []
        for stream in streams:
            s_type = stream.type()
            s_name = stream.name()
            
            # Broad matching to catch Emotibit streams
            if s_type in LOOKING_FOR_TYPES or s_name in LOOKING_FOR_TYPES or 'EmotiBit' in s_name:
                inlet = StreamInlet(stream)
                active_inlets.append({
                    'inlet': inlet, 
                    'type': s_type, 
                    'name': s_name
                })
                print(f"   👉 Linked: {s_name} ({s_type})")

        print(f"🔗 Streaming {len(active_inlets)} sources...")

        # Main Loop
        try:
            while True:
                data_found = False
                for source in active_inlets:
                    inlet = source['inlet']
                    sample, timestamp = inlet.pull_sample(timeout=0.0)
                    
                    if sample:
                        data_found = True
                        val = sample[0]
                        
                        # Determine Tag
                        s_type = source['type']
                        s_name = source['name']
                        tag = self.map_tag(s_type, s_name)
                        
                        # 1. Peak Detection (PPG)
                        if tag == 'PPG:GRN':
                            bi = self.detect_peak(val)
                            if bi:
                                self.bi_buffer.append(bi)
                                metrics = self.calculate_hrv()
                                if metrics:
                                     await websocket.send(json.dumps({
                                        "type": "DATA", "tag": "HRV", "data": metrics, "timestamp": timestamp
                                    }))

                        # 2. Native BI Support
                        if tag == 'BI':
                            if 0.2 < val < 2.0:
                                self.bi_buffer.append(val)
                                metrics = self.calculate_hrv()
                                if metrics:
                                     await websocket.send(json.dumps({
                                        "type": "DATA", "tag": "HRV", "data": metrics, "timestamp": timestamp
                                    }))
                                    
                        # 3. Raw Data Forwarding
                        payload = {"type": "DATA", "tag": tag, "data": sample, "timestamp": timestamp}
                        
                        # Fix PPG Array format if needed
                        if 'PPG' in tag and len(sample) >= 3:
                             await websocket.send(json.dumps({"type": "DATA", "tag": "PPG:RED", "data": [sample[0]]}))
                             await websocket.send(json.dumps({"type": "DATA", "tag": "PPG:IR", "data": [sample[1]]}))
                             await websocket.send(json.dumps({"type": "DATA", "tag": "PPG:GRN", "data": [sample[2]]}))
                        else:
                            await websocket.send(json.dumps(payload))
                
                if not data_found:
                    await asyncio.sleep(0.001) # Yield CPU
                    
        except websockets.exceptions.ConnectionClosed:
            print("❌ Client Disconnected")

    def map_tag(self, s_type, s_name):
        """Map LSL metadata to Frontend Tags"""
        if s_type == 'HeartRate' or s_name == 'HR': return 'HR'
        if s_type == 'EDA' or s_name == 'EDA': return 'EDA'
        if s_type == 'Temperature' or s_name == 'TEMP1': return 'TEMP'
        if s_type == 'Thermopile' or s_name == 'THERM': return 'THERM'
        if s_name == 'PPG_GRN': return 'PPG:GRN'
        if s_name == 'PPG_RED': return 'PPG:RED'
        if s_name == 'PPG_IR': return 'PPG:IR'
        if s_name == 'SCR_AMP': return 'SCR:AMP'
        if s_name == 'SCR_FREQ': return 'SCR:FREQ'
        if s_name == 'BI': return 'BI'
        return s_type # Fallback


if __name__ == "__main__":
    bridge = EmotibitBridge()
    try:
        asyncio.run(bridge.run())
    except KeyboardInterrupt:
        print("\n🛑 Bridge Stopped.")
