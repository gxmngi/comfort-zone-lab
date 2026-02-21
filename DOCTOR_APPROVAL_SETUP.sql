-- Run this in Supabase SQL Editor
-- Complete setup: doctor_status, trigger, is_doctor(), AND RLS policies

-- ============================================
-- 1. Add doctor_status column if not exists
-- ============================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS doctor_status TEXT DEFAULT NULL;

-- ============================================
-- 2. Update trigger to save role + doctor_status on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email, role, doctor_status)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'role', 'user'),
    CASE 
      WHEN new.raw_user_meta_data ->> 'role' = 'doctor' THEN 'pending'
      ELSE NULL
    END
  );
  RETURN new;
END;
$$;

-- ============================================
-- 3. Fix is_doctor() function  
--    Check BOTH user_id and id columns to handle 
--    profiles created by different trigger versions
-- ============================================
CREATE OR REPLACE FUNCTION public.is_doctor()
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

-- ============================================
-- 4. Reset & recreate ALL RLS policies
--    Also check both user_id and id for own-profile
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "view_own_profile" ON profiles;
DROP POLICY IF EXISTS "view_all_profiles_as_doctor" ON profiles;
DROP POLICY IF EXISTS "Emergency Doctor Access" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Rule 1: Everyone can see their OWN profile (check both columns)
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING ( auth.uid() = user_id OR auth.uid() = id );

-- Rule 2: APPROVED Doctors can see ALL profiles
CREATE POLICY "Doctors can view all profiles"
ON profiles FOR SELECT
USING ( is_doctor() );

-- Rule 3: Users can create their own profile
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK ( auth.uid() = user_id OR auth.uid() = id );

-- Rule 4: Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING ( auth.uid() = user_id OR auth.uid() = id );

-- ============================================
-- 5. DEBUG: Check your doctor profile
--    Run this separately after the above to verify
-- ============================================
-- SELECT id, user_id, email, role, doctor_status FROM profiles WHERE role = 'doctor';
