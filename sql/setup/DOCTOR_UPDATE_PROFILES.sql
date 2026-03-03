-- =====================================================================
-- Allow approved doctors to UPDATE any user/patient profile
-- Run this in Supabase SQL Editor
-- =====================================================================

-- Drop if exists (safe to re-run)
DROP POLICY IF EXISTS "Doctors can update patient profiles" ON public.profiles;

-- Create policy: approved doctors can update non-doctor profiles
CREATE POLICY "Doctors can update patient profiles"
ON public.profiles
FOR UPDATE
USING (
  -- The current user must be an approved doctor
  EXISTS (
    SELECT 1 FROM public.profiles AS doctor
    WHERE doctor.user_id = auth.uid()
      AND doctor.role = 'doctor'
      AND doctor.doctor_status = 'approved'
  )
)
WITH CHECK (
  -- Doctors can only update non-doctor profiles (prevent doctor editing other doctors)
  role IS DISTINCT FROM 'doctor'
);
