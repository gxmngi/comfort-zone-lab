import pandas as pd
import pickle
import joblib

# ---------------------------------------------------------
# 1. โหลดโมเดล, Scaler และตัวแปร Features
# ---------------------------------------------------------
with open('features.pkl', 'rb') as f:
    features = pickle.load(f)

scaler = joblib.load('my_scaler.pkl')
model = joblib.load('lgbm_model.pkl')

# ---------------------------------------------------------
# 2. โหลดไฟล์ข้อมูลของคุณ
# ---------------------------------------------------------
df = pd.read_csv(r"D:\webap\Merged-EDA-HRV.csv")

# --- จัดการปัญหาคอลัมน์ BMI ---
# สมมติว่าข้อมูลเซ็ตนี้เก็บมาจากผู้ใช้คนเดียวที่มีค่า BMI = 23.5 
# (คุณสามารถเปลี่ยนตัวเลขนี้เป็นค่าที่แท้จริงของผู้ใช้ได้เลย)
df['BMI'] = 19.4  

# --- จัดการปัญหาค่าว่าง (Missing Values) ---
# ทำการลบแถวที่มีค่าว่าง (NaN) ในคอลัมน์ที่โมเดลต้องใช้ออกไป
df_clean = df.dropna(subset=features).copy()

# ---------------------------------------------------------
# 3. เตรียมข้อมูลและทำนายผล
# ---------------------------------------------------------
# ดึงเฉพาะคอลัมน์ตามลำดับที่โมเดลต้องการ (BMI, EDA_Tonic_STD, HRV_MedianNN)
X_input = df_clean[features]

# ปรับสเกลข้อมูล
X_scaled = scaler.transform(X_input)

# ให้โมเดลทำนายผล
predictions = model.predict(X_scaled)
probabilities = model.predict_proba(X_scaled)[:, 1] # ความน่าจะเป็นที่จะเกิดคลาส 1

# ---------------------------------------------------------
# 4. นำผลลัพธ์มาประกอบกับข้อมูลเดิม แล้วบันทึกไฟล์ใหม่
# ---------------------------------------------------------
df_clean['Prediction'] = predictions
df_clean['Probability'] = probabilities

# แสดงตัวอย่างผลลัพธ์ 5 แถวแรก
print(df_clean[['Timestamp', 'BMI', 'EDA_Tonic_STD', 'HRV_MedianNN', 'Prediction', 'Probability']].head())

# หากต้องการบันทึกผลลัพธ์เป็นไฟล์ CSV ใหม่ สามารถใช้คำสั่งนี้ได้
df_clean.to_csv('Predicted-Merged-EDA-HRV.csv', index=False)