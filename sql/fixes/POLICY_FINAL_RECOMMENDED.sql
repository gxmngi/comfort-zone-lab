-- ============================================================
-- POLICY_FINAL_RECOMMENDED.sql
-- วิเคราะห์และแก้ไข RLS Policy ทั้งหมดให้ถูกต้องและปลอดภัย
-- Run ใน Supabase SQL Editor ทีละ block หรือทั้งหมดพร้อมกัน
-- ============================================================


-- ============================================================
-- BLOCK 1: Shared Helper Function
-- is_approved_doctor() — ตรวจสอบว่า user ที่ login เป็น doctor ที่ approved แล้ว
-- ใช้ SECURITY DEFINER เพื่อ bypass RLS ในการตรวจสอบ role (ป้องกัน infinite loop)
-- รองรับทั้ง profiles.user_id และ profiles.id (แก้ปัญหา dual-column)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_approved_doctor()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE (user_id = auth.uid() OR id = auth.uid())
    AND role = 'doctor'
    AND doctor_status = 'approved'
  );
END;
$$;


-- ============================================================
-- BLOCK 2: TABLE — profiles
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ลบ policy เก่าทั้งหมด (ทำก่อนสร้างใหม่)
DROP POLICY IF EXISTS "Users can view own profile"           ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile"    ON profiles;
DROP POLICY IF EXISTS "view_own_profile"                    ON profiles;
DROP POLICY IF EXISTS "Doctors can view all profiles"       ON profiles;
DROP POLICY IF EXISTS "view_all_profiles_as_doctor"         ON profiles;
DROP POLICY IF EXISTS "Emergency Doctor Access"             ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile"  ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile"  ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile"  ON profiles;

-- [SELECT] ผู้ใช้ดูได้เฉพาะ profile ของตัวเอง
CREATE POLICY "profiles: user can view own"
ON profiles FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = id);

-- [SELECT] Doctor ที่ approved แล้ว ดู profile ของทุกคนได้
CREATE POLICY "profiles: approved doctor can view all"
ON profiles FOR SELECT
USING (is_approved_doctor());

-- [INSERT] ผู้ใช้สร้าง profile ของตัวเองได้เท่านั้น
CREATE POLICY "profiles: user can insert own"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

-- [UPDATE] ผู้ใช้แก้ไข profile ตัวเองได้
-- ⚠️ หมายเหตุ: role และ doctor_status ควรแก้ไขได้เฉพาะผ่าน admin/trigger เท่านั้น
--   แต่ใน Supabase free tier ยังไม่มี column-level security,
--   ดังนั้นให้ควบคุมจาก application layer (อย่าให้ UI แก้ role ได้)
CREATE POLICY "profiles: user can update own"
ON profiles FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = id)
WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

-- [DELETE] ผู้ใช้ลบ profile ตัวเองได้ (optional — ลบออกได้ถ้าไม่ต้องการ)
-- CREATE POLICY "profiles: user can delete own"
-- ON profiles FOR DELETE
-- USING (auth.uid() = user_id OR auth.uid() = id);


-- ============================================================
-- BLOCK 3: TABLE — comfort_readings
-- ============================================================
ALTER TABLE comfort_readings ENABLE ROW LEVEL SECURITY;

-- ลบ policy เก่าทั้งหมด
DROP POLICY IF EXISTS "Users can view their own readings"   ON comfort_readings;
DROP POLICY IF EXISTS "Users can insert their own readings" ON comfort_readings;
DROP POLICY IF EXISTS "Doctors can view all readings"       ON comfort_readings;
DROP POLICY IF EXISTS "Users can delete their own readings" ON comfort_readings;

-- [SELECT] ผู้ใช้ดู readings ของตัวเองได้
CREATE POLICY "readings: user can view own"
ON comfort_readings FOR SELECT
USING (auth.uid() = user_id);

-- [SELECT] Doctor ที่ approved ดู readings ของ patient ทุกคนได้ (สำคัญ!)
CREATE POLICY "readings: approved doctor can view all"
ON comfort_readings FOR SELECT
USING (is_approved_doctor());

-- [INSERT] ผู้ใช้บันทึก readings ของตัวเองเท่านั้น
CREATE POLICY "readings: user can insert own"
ON comfort_readings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- [DELETE] ผู้ใช้ลบ readings ของตัวเองได้
CREATE POLICY "readings: user can delete own"
ON comfort_readings FOR DELETE
USING (auth.uid() = user_id);


-- ============================================================
-- BLOCK 4: ตรวจสอบผลลัพธ์
-- Run query นี้แยกต่างหากเพื่อยืนยัน policies ที่มีอยู่
-- ============================================================
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;


-- ============================================================
-- BLOCK 5: (Optional) Doctor Approval — Admin เปลี่ยน status
-- ใช้เมื่อต้องการ approve doctor จาก SQL Editor โดยตรง
-- ============================================================
-- UPDATE profiles
-- SET doctor_status = 'approved'
-- WHERE email = 'doctor@example.com' AND role = 'doctor';
