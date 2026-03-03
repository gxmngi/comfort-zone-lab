-- FIX_RLS_FINAL.sql
-- RUN THIS IN SUPABASE SQL EDITOR TO FIX "NO PATIENTS FOUND"

-- 1. Create a secure function to check if the user is a doctor
-- "SECURITY DEFINER" allows this function to bypass RLS rules to check the role safely.
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
    WHERE id = auth.uid() 
    AND role = 'doctor'
  );
END;
$$;

-- 2. Reset RLS (Start Clean)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop any old or conflicting rules
DROP POLICY IF EXISTS "Doctors can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "view_own_profile" ON profiles;
DROP POLICY IF EXISTS "view_all_profiles_as_doctor" ON profiles;

-- 4. Rule #1: Everyone can see their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING ( auth.uid() = id );

-- 5. Rule #2: Doctors can see ALL profiles
-- We use the function we created above to avoid "infinite loop" errors.
CREATE POLICY "Doctors can view all profiles"
ON profiles FOR SELECT
USING ( is_doctor() );
