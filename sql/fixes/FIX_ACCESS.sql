-- FIX SCRIPT: NON-RECURSIVE RLS POLICIES
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Reset RLS to be clean
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Doctors can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;

-- 3. Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING ( auth.uid() = id );

-- 4. Policy: Doctors can view ALL profiles
-- IMPORTANT: We use auth.jwt() to check metadata instead of querying the table itself.
-- This prevents "Infinite Recursion" where the database gets stuck checking if you have permission to check permissions.
CREATE POLICY "Doctors can view all profiles"
ON profiles FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'doctor'
);

-- 5. (Fallback) If the top one fails because metadata isn't set, allow explicit ID check via a SECURITY DEFINER function
-- But users should have metadata if they signed up correctly.
