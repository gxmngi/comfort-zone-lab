# Emotibit Bridge Scripts

## Which bridge should I use?

| Bridge               | Protocol                  | HRV Calculation            | Recommended? |
| -------------------- | ------------------------- | -------------------------- | ------------ |
| **`lsl-bridge.py`**  | LSL (Lab Streaming Layer) | ✅ FFT + Peak Detection    | **✅ Yes**   |
| `emotibit-bridge.js` | OSC                       | ❌ None (raw forward only) | ❌ No        |

### ✅ Recommended: `lsl-bridge.py`

This bridge reads data from Emotibit via **LSL streams**, calculates HRV (RMSSD, LF, HF, LF/HF ratio) using FFT with Hamming windowing, detects R-peaks from PPG, and sends everything to the frontend via WebSocket.

```bash
# Install dependencies
pip install pylsl websockets numpy

# Run
python scripts/lsl-bridge.py
```

### ⚠️ Legacy: `emotibit-bridge.js`

This bridge only forwards raw OSC messages. The frontend will **NOT receive HRV data** when using this bridge.

```bash
# If you must use OSC (not recommended)
npm install node-osc ws
node scripts/emotibit-bridge.js
```

## Data Flow

```
Emotibit Sensor → LSL Stream → lsl-bridge.py → WebSocket :3001 → useEmotibit.ts → Dashboard
```
