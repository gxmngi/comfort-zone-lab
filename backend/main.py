"""
FastAPI backend for Comfort Zone Lab
Serves the LightGBM comfort prediction model.

Endpoints:
  POST /predict    – Predict comfort from raw EDA/PPG sensor data
  GET  /health     – Health check
"""

import os
import pickle
from typing import List, Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from preprocessing import extract_features

# ─── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

FEATURES_PATH = os.path.join(MODELS_DIR, "features.pkl")
SCALER_PATH = os.path.join(MODELS_DIR, "my_scaler.pkl")
MODEL_PATH = os.path.join(MODELS_DIR, "lgbm_model.pkl")

# ─── Load model artefacts at startup ────────────────────────────────────────────
try:
    with open(FEATURES_PATH, "rb") as f:
        FEATURES: list = pickle.load(f)

    SCALER = joblib.load(SCALER_PATH)
    MODEL = joblib.load(MODEL_PATH)
    MODEL_LOADED = True
    print(f"✅ Model loaded successfully. Features: {FEATURES}")
except Exception as e:
    MODEL_LOADED = False
    FEATURES = ["BMI", "EDA_Tonic_STD", "HRV_MedianNN"]
    SCALER = None
    MODEL = None
    print(f"⚠️  Could not load model files: {e}")
    print(f"   Expected files in: {MODELS_DIR}")
    print(f"   → features.pkl, my_scaler.pkl, lgbm_model.pkl")

# ─── FastAPI App ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Comfort Zone Lab – Prediction API",
    description="LightGBM-based thermal comfort prediction from EDA & PPG sensors",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",        # local dev
        "http://localhost:3000",        # local dev alt
        "http://localhost:8080",        # local dev standard
        "https://comfort-zone-lab.vercel.app",  # production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response schemas ─────────────────────────────────────────────────

class PredictRequest(BaseModel):
    bmi: float = Field(..., description="Body Mass Index of the user")
    eda_readings: List[float] = Field(
        ...,
        description="Raw EDA values (microsiemens) – last N seconds",
        min_length=3,
    )
    ppg_readings: List[float] = Field(
        ...,
        description="Raw PPG values – last N seconds",
        min_length=3,
    )
    sampling_rate: int = Field(
        default=1,
        description="Sampling rate in Hz (1 = one sample per second from Firebase)",
    )


class PredictionDetail(BaseModel):
    eda_tonic_std: float
    hrv_median_nn: Optional[float]
    prediction: int
    probability: float


class PredictResponse(BaseModel):
    prediction: int = Field(..., description="0 = สบาย (Comfortable), 1 = ไม่สบาย (Uncomfortable)")
    probability: float = Field(..., description="Probability of class 1 (uncomfortable), 0–1")
    comfort_status: str = Field(..., description="สบาย or ไม่สบาย")
    eda_tonic_std: float
    hrv_median_nn: Optional[float]
    model_loaded: bool
    details: Optional[PredictionDetail] = None


# ─── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_loaded": MODEL_LOADED,
        "features": FEATURES,
    }


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    """
    Predicts comfort level from raw EDA and PPG sensor data.

    Flow:
      1. Preprocess EDA → EDA_Tonic_STD
      2. Preprocess PPG → HRV_MedianNN
      3. Assemble features [BMI, EDA_Tonic_STD, HRV_MedianNN]
      4. Scale with trained scaler
      5. Predict with LightGBM model
    """
    if not MODEL_LOADED:
        raise HTTPException(
            status_code=503,
            detail="Model files not loaded. Place .pkl files in backend/models/",
        )

    # ── 1 & 2. Extract features from raw data ──
    feat = extract_features(
        eda_values=req.eda_readings,
        ppg_values=req.ppg_readings,
        bmi=req.bmi,
        sampling_rate=req.sampling_rate,
    )

    eda_tonic_std = feat["EDA_Tonic_STD"]
    hrv_median_nn = feat["HRV_MedianNN"]

    # If HRV could not be computed, use a default (660 ms ≈ 91 bpm)
    if hrv_median_nn is None:
        hrv_median_nn = 660.0

    # ── 3. Assemble feature vector ──
    feature_dict = {
        "BMI": req.bmi,
        "EDA_Tonic_STD": eda_tonic_std,
        "HRV_MedianNN": hrv_median_nn,
    }

    # Create DataFrame in the exact column order the model expects
    X_input = pd.DataFrame([feature_dict])[FEATURES]

    # ── 4. Scale ──
    X_scaled = SCALER.transform(X_input)

    # ── 5. Predict ──
    prediction = int(MODEL.predict(X_scaled)[0])
    probability = float(MODEL.predict_proba(X_scaled)[0, 1])

    comfort_status = "ไม่สบาย" if prediction == 1 else "สบาย"

    return PredictResponse(
        prediction=prediction,
        probability=round(probability, 4),
        comfort_status=comfort_status,
        eda_tonic_std=round(eda_tonic_std, 6),
        hrv_median_nn=round(hrv_median_nn, 2),
        model_loaded=MODEL_LOADED,
        details=PredictionDetail(
            eda_tonic_std=round(eda_tonic_std, 6),
            hrv_median_nn=round(hrv_median_nn, 2),
            prediction=prediction,
            probability=round(probability, 4),
        ),
    )


# ─── Run directly ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
