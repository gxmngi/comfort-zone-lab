import os
import pandas as pd
import pickle
import joblib

# ---------------------------------------------------------
# 1. กำหนดตำแหน่งไฟล์ให้อ้างอิงจากโฟลเดอร์ที่รันโค้ด
# ---------------------------------------------------------
base_dir = os.path.dirname(os.path.abspath(__file__))

features_path = os.path.join(base_dir, 'features.pkl')
scaler_path = os.path.join(base_dir, 'my_scaler.pkl')
model_path = os.path.join(base_dir, 'lgbm_model.pkl')
csv_path = os.path.join(base_dir, r"D:\webap\Merged-EDA-HRV.csv")

# ---------------------------------------------------------
# 2. โหลดโมเดล, Scaler และตัวแปร Features
# ---------------------------------------------------------
with open(features_path, 'rb') as f:
    features = pickle.load(f)

scaler = joblib.load(scaler_path)
model = joblib.load(model_path)

# ---------------------------------------------------------
# 3. โหลดและเตรียมข้อมูลจาก CSV
# ---------------------------------------------------------
df = pd.read_csv(csv_path)

# เติมค่า BMI สมมติ (คุณสามารถแก้ตัวเลขนี้ให้ตรงกับผู้ใช้งานจริงได้)
df['BMI'] = 23.5  

# ลบข้อมูลบรรทัดที่มีค่าว่าง (NaN) เพื่อไม่ให้โมเดล Error
df_clean = df.dropna(subset=features).copy()

# ---------------------------------------------------------
# 4. ทำนายผลข้อมูลทุกๆ วินาที
# ---------------------------------------------------------
X_input = df_clean[features]
X_scaled = scaler.transform(X_input)

# .predict_proba() จะคืนค่าความน่าจะเป็นมา 2 คอลัมน์ [โอกาสเป็น 0, โอกาสเป็น 1]
# เราใช้ [:, 1] เพื่อดึงเฉพาะ "โอกาสที่จะเกิด Class 1 (ไม่สบาย)" มาใช้งาน
probabilities_class_1 = model.predict_proba(X_scaled)[:, 1] 

# นำค่าความน่าจะเป็นเก็บลงในตาราง
df_clean['Prob_Class_1'] = probabilities_class_1

# ---------------------------------------------------------
# 5. สรุปผลทุกๆ 15 นาที (วิธี Average Probability)
# ---------------------------------------------------------
# แปลงคอลัมน์ Timestamp ให้เป็นชนิดข้อมูลเวลา (Datetime)
df_clean['Timestamp'] = pd.to_datetime(df_clean['Timestamp'])
df_time_indexed = df_clean.set_index('Timestamp')

# จัดกลุ่มข้อมูลทุกๆ 15 นาที และหา "ค่าเฉลี่ย (mean)" ของความน่าจะเป็น
summary_15min = df_time_indexed.resample('15min').agg(
    Average_Probability=('Prob_Class_1', 'mean'),
    Total_Records=('Prob_Class_1', 'count') # นับจำนวนข้อมูล (วินาที) ในช่วง 15 นาทีนั้น
)

# กรองเอาเฉพาะช่วงเวลาที่มีข้อมูลเข้ามาจริงๆ (ตัดช่วงที่ไม่มีการเก็บข้อมูลออก)
summary_15min = summary_15min[summary_15min['Total_Records'] > 0].copy()

# ฟังก์ชันตัดสินใจจากค่าเฉลี่ย
def determine_status(prob):
    # ถ้าค่าเฉลี่ยความน่าจะเป็นของ Class 1 (ไม่สบาย) มากกว่า 50% ให้ตีเป็น "ไม่สบาย"
    if prob > 0.50:
        return 'ไม่สบาย'
    else:
        return 'สบาย'

# สร้างคอลัมน์สรุปข้อความ สบาย/ไม่สบาย
summary_15min['Comfort_Status'] = summary_15min['Average_Probability'].apply(determine_status)

# จัดรูปแบบให้อ่านง่ายเป็นเปอร์เซ็นต์ (เช่น 45.20%)
summary_15min['Risk_of_Uncomfortable'] = (summary_15min['Average_Probability'] * 100).round(2).astype(str) + '%'

# ---------------------------------------------------------
# 6. แสดงผลลัพธ์
# ---------------------------------------------------------
print("\n" + "="*60)
print("สรุปผลความรู้สึกสบาย/ไม่สบาย ทุกๆ 15 นาที (วิธี Average Probability)")
print("="*60)
print(summary_15min[['Comfort_Status', 'Risk_of_Uncomfortable', 'Total_Records']])

# หากต้องการบันทึกสรุป 15 นาทีเป็นไฟล์ CSV
# summary_15min.to_csv(os.path.join(base_dir, 'Summary_15min.csv'))