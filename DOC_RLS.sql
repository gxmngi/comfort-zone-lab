-- RUN THIS SQL TO ENABLE DOCTORS TO SEE PATIENTS

-- 1. Enable RLS on profiles if not already enabled (it usually is by default in Supabase starter)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create a policy that allows anyone with role 'doctor' to SELECT ALL rows
-- Note: We check the 'role' column of the requester's profile.
CREATE POLICY "Doctors can view all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'doctor'
  )
);

-- 3. Also ensure users can see their OWN profile (standard policy, if missing)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
);
