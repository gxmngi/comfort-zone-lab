// Generate realistic simulated HRV and EDA data

export interface HRVDataPoint {
  time: string;
  lf: number;
  hf: number;
  lfHfRatio: number;
}

export interface EDADataPoint {
  time: string;
  tonic: number;
  phasic: number;
}

// Generate time labels for the last N minutes
function generateTimeLabels(count: number, intervalSeconds: number = 5): string[] {
  const labels: string[] = [];
  const now = new Date();
  
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * intervalSeconds * 1000);
    labels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }
  
  return labels;
}

// Generate realistic HRV frequency domain data
export function generateHRVData(count: number = 30): HRVDataPoint[] {
  const times = generateTimeLabels(count);
  const data: HRVDataPoint[] = [];
  
  let lfBase = 800 + Math.random() * 400; // ms²
  let hfBase = 400 + Math.random() * 200; // ms²
  
  for (let i = 0; i < count; i++) {
    // Add some natural variation
    const lfVariation = (Math.random() - 0.5) * 100;
    const hfVariation = (Math.random() - 0.5) * 50;
    
    // Slow drift in baseline
    lfBase += (Math.random() - 0.5) * 20;
    hfBase += (Math.random() - 0.5) * 10;
    
    // Keep within realistic bounds
    lfBase = Math.max(400, Math.min(1500, lfBase));
    hfBase = Math.max(200, Math.min(800, hfBase));
    
    const lf = lfBase + lfVariation;
    const hf = hfBase + hfVariation;
    
    data.push({
      time: times[i],
      lf: Math.round(lf * 100) / 100,
      hf: Math.round(hf * 100) / 100,
      lfHfRatio: Math.round((lf / hf) * 100) / 100,
    });
  }
  
  return data;
}

// Generate realistic EDA signal decomposition data
export function generateEDAData(count: number = 30): EDADataPoint[] {
  const times = generateTimeLabels(count);
  const data: EDADataPoint[] = [];
  
  let tonicBase = 2 + Math.random() * 3; // μS (microsiemens)
  
  for (let i = 0; i < count; i++) {
    // Tonic component - slow moving baseline
    const tonicDrift = (Math.random() - 0.5) * 0.1;
    tonicBase += tonicDrift;
    tonicBase = Math.max(0.5, Math.min(8, tonicBase));
    
    // Phasic component - occasional spikes (SCR)
    let phasic = 0;
    if (Math.random() > 0.85) {
      // Generate a spike
      phasic = 0.5 + Math.random() * 2;
    } else if (Math.random() > 0.7) {
      // Small response
      phasic = 0.1 + Math.random() * 0.4;
    }
    
    data.push({
      time: times[i],
      tonic: Math.round(tonicBase * 1000) / 1000,
      phasic: Math.round(phasic * 1000) / 1000,
    });
  }
  
  return data;
}

// Simulate ML comfort level prediction based on HRV/EDA data
export function predictComfortLevel(hrvData: HRVDataPoint[], edaData: EDADataPoint[]): number {
  if (hrvData.length === 0 || edaData.length === 0) return 3;
  
  const latestHRV = hrvData[hrvData.length - 1];
  const recentEDA = edaData.slice(-5);
  
  // Simple heuristic for comfort prediction
  // Higher HF power and lower LF/HF ratio = more relaxed
  // Lower phasic activity = more comfortable
  
  const lfHfRatio = latestHRV.lfHfRatio;
  const avgPhasic = recentEDA.reduce((sum, d) => sum + d.phasic, 0) / recentEDA.length;
  
  let score = 3; // Start neutral
  
  // LF/HF ratio influence
  if (lfHfRatio < 1.5) score += 1;
  else if (lfHfRatio < 2.5) score += 0.5;
  else if (lfHfRatio > 4) score -= 1;
  else if (lfHfRatio > 3) score -= 0.5;
  
  // Phasic activity influence
  if (avgPhasic < 0.2) score += 0.5;
  else if (avgPhasic > 1) score -= 0.5;
  else if (avgPhasic > 1.5) score -= 1;
  
  // Add some randomness for realism
  score += (Math.random() - 0.5) * 0.5;
  
  // Clamp to 1-5
  return Math.max(1, Math.min(5, Math.round(score)));
}

// Get comfort level details
export function getComfortDetails(level: number): { label: string; description: string } {
  const details: Record<number, { label: string; description: string }> = {
    1: { label: 'Very Uncomfortable', description: 'High stress indicators detected' },
    2: { label: 'Uncomfortable', description: 'Elevated stress response' },
    3: { label: 'Neutral', description: 'Balanced physiological state' },
    4: { label: 'Comfortable', description: 'Relaxed state detected' },
    5: { label: 'Very Comfortable', description: 'Optimal relaxation state' },
  };
  return details[level] || details[3];
}
