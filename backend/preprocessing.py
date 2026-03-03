"""
Signal preprocessing utilities for EDA and PPG data.
Converts raw sensor readings into features the LightGBM model expects:
  - EDA_Tonic_STD  (z-score normalized tonic component of EDA)
  - HRV_MedianNN   (median NN-interval from PPG peaks)
"""

import numpy as np
from typing import List, Tuple, Optional


# ──────────────────────────────────────────────────────────────────────
# EDA Preprocessing
# ──────────────────────────────────────────────────────────────────────

def decompose_eda(eda_values: List[float], sampling_rate: int = 1) -> Tuple[np.ndarray, np.ndarray]:
    """
    Decompose raw EDA signal into tonic (SCL) and phasic (SCR) components.
    Uses a simple low-pass filter approach for robustness.
    
    Returns: (tonic, phasic) arrays
    """
    eda = np.array(eda_values, dtype=float)

    if len(eda) < 5:
        # Not enough data — return raw as tonic, zeros as phasic
        return eda, np.zeros_like(eda)

    try:
        import neurokit2 as nk
        # NeuroKit2 provides robust EDA decomposition
        signals, _ = nk.eda_process(eda, sampling_rate=sampling_rate)
        tonic = signals["EDA_Tonic"].values
        phasic = signals["EDA_Phasic"].values
    except Exception:
        # Fallback: simple moving average as tonic
        window = max(3, len(eda) // 4)
        kernel = np.ones(window) / window
        tonic = np.convolve(eda, kernel, mode="same")
        phasic = eda - tonic

    return tonic, phasic


def compute_eda_tonic_std(eda_values: List[float], sampling_rate: int = 1) -> List[float]:
    """
    Compute z-score normalized EDA Tonic (EDA_Tonic_STD) for each data point.
    
    This matches the EDA_Tonic_STD column in the training data.
    """
    tonic, _ = decompose_eda(eda_values, sampling_rate)

    mean = np.mean(tonic)
    std = np.std(tonic)

    if std < 1e-10:
        # Constant signal → z-score is zero
        return [0.0] * len(tonic)

    tonic_std = (tonic - mean) / std
    return tonic_std.tolist()


# ──────────────────────────────────────────────────────────────────────
# PPG / HRV Preprocessing
# ──────────────────────────────────────────────────────────────────────

def compute_hrv_median_nn(ppg_values: List[float], sampling_rate: int = 1) -> Optional[float]:
    """
    Estimate HRV MedianNN from raw PPG signal.

    Steps:
      1. Detect peaks in PPG
      2. Compute NN intervals (peak-to-peak in ms)
      3. Return the median NN interval
    
    Returns: median NN in milliseconds, or None if insufficient peaks.
    """
    ppg = np.array(ppg_values, dtype=float)

    if len(ppg) < 5:
        return None

    try:
        import neurokit2 as nk
        # Clean + find peaks
        ppg_clean = nk.ppg_clean(ppg, sampling_rate=sampling_rate)
        info = nk.ppg_findpeaks(ppg_clean, sampling_rate=sampling_rate)
        peak_indices = info.get("PPG_Peaks", [])
    except Exception:
        # Fallback: simple peak detection
        peak_indices = _simple_peak_detection(ppg)

    if len(peak_indices) < 2:
        return None

    # Compute NN intervals in milliseconds
    peak_indices = np.sort(peak_indices)
    nn_intervals = np.diff(peak_indices) * (1000.0 / sampling_rate)

    # Filter out physiologically impossible intervals (< 300ms or > 2000ms)
    nn_intervals = nn_intervals[(nn_intervals >= 300) & (nn_intervals <= 2000)]

    if len(nn_intervals) == 0:
        return None

    return float(np.median(nn_intervals))


def _simple_peak_detection(signal: np.ndarray) -> List[int]:
    """Simple peak detection fallback using local maxima."""
    peaks = []
    for i in range(1, len(signal) - 1):
        if signal[i] > signal[i - 1] and signal[i] > signal[i + 1]:
            peaks.append(i)
    return peaks


# ──────────────────────────────────────────────────────────────────────
# Combined Feature Extraction
# ──────────────────────────────────────────────────────────────────────

def extract_features(
    eda_values: List[float],
    ppg_values: List[float],
    bmi: float,
    sampling_rate: int = 1,
) -> dict:
    """
    Extract all features needed for the LightGBM model from raw sensor data.
    
    Returns dict with:
      - BMI: float
      - EDA_Tonic_STD: float (mean of z-scored tonic for this window)
      - HRV_MedianNN: float (median NN interval in ms)
      - per_second: list of dicts with per-second EDA_Tonic_STD values
    """
    # 1. EDA → Tonic STD
    eda_tonic_std_list = compute_eda_tonic_std(eda_values, sampling_rate)
    eda_tonic_std_mean = float(np.mean(eda_tonic_std_list)) if eda_tonic_std_list else 0.0

    # 2. PPG → HRV MedianNN
    hrv_median_nn = compute_hrv_median_nn(ppg_values, sampling_rate)

    return {
        "BMI": bmi,
        "EDA_Tonic_STD": eda_tonic_std_mean,
        "HRV_MedianNN": hrv_median_nn,
        "per_second_eda_tonic_std": eda_tonic_std_list,
    }
