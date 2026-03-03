# Models Directory

## โครงสร้าง

```
models/
├── README.md          ← คุณอยู่ที่นี่
└── reference/         ← ไฟล์อ้างอิง (ไม่ถูกเรียกใช้โดยระบบจริง)
    ├── deploy.py      → โค้ดต้นแบบทำนายทีละแถวจาก CSV
    ├── deploy2.py     → โค้ดต้นแบบสรุปผลทุก 15 นาที
    └── Merged-EDA-HRV.csv → ข้อมูลตัวอย่าง EDA+HRV ที่ preprocess แล้ว (842 แถว)
```

## ไฟล์ที่ระบบใช้จริง

ไฟล์โมเดลที่ใช้จริงอยู่ที่ `backend/models/`:

- `lgbm_model.pkl` → LightGBM model ที่ train มาแล้ว
- `my_scaler.pkl` → StandardScaler สำหรับ normalize features
- `features.pkl` → รายชื่อ features: [BMI, EDA_Tonic_STD, HRV_MedianNN]

## โค้ดที่ระบบใช้จริง

- `backend/main.py` → FastAPI server ที่ให้บริการ /predict endpoint
- `backend/preprocessing.py` → Signal preprocessing (EDA → Tonic STD, PPG → HRV MedianNN)
