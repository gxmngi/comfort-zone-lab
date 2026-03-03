-- COMPLETE_FIX.sql
-- RUN THIS IN SUPABASE SQL EDITOR TO FIX EVERYTHING

-- 1. ADD THE MISSING COLUMN (Critical Step!)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- 2. FORCE YOUR USER TO BE A DOCTOR
-- This updates the profile of the user running this script (you) to be a doctor.
UPDATE profiles 
SET role = 'doctor'
WHERE id = auth.uid();

-- 3. RE-CREATE THE SECURITY FUNCTION
CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor');
END;
$$;

-- 4. RESET POLICIES (Just to be sure)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING ( auth.uid() = id );
CREATE POLICY "Doctors can view all profiles" ON profiles FOR SELECT USING ( is_doctor() );
