-- POLICY_RESET.sql
-- Run this in Supabase SQL Editor to UNBLOCK access

-- 1. Re-create the check function (just in case)
CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor');
END;
$$;

-- 2. Reset Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Emergency Doctor Access" ON profiles;

-- 3. Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING ( auth.uid() = id );

-- 4. Policy: Doctors can view EVERYONE
-- We add a "Backup Check" using your email, just in case the ID link is broken.
CREATE POLICY "Doctors can view all profiles" 
ON profiles FOR SELECT 
USING ( 
  is_doctor() 
  OR 
  auth.jwt() ->> 'email' = 'doctor1@gmail.com' 
);
