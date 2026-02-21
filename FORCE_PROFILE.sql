-- FORCE_PROFILE.sql
-- Run this in Supabase SQL Editor
-- This script finds the user by email -> and forces a profile to exist

DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- 1. Find the User ID for 'doctor1@gmail.com'
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = 'doctor1@gmail.com';

  -- 2. If user exists in Auth, but maybe not in Profiles...
  IF target_user_id IS NOT NULL THEN
    
    -- Insert or Update (Upsert) the profile
    INSERT INTO public.profiles (id, email, role, first_name, last_name)
    VALUES (
      target_user_id, 
      'doctor1@gmail.com', 
      'doctor', 
      'Doctor', 
      'Gum'
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'doctor';
    
    RAISE NOTICE 'Fixed profile for: %', target_user_id;
  ELSE
    RAISE NOTICE 'User doctor1@gmail.com not found in auth.users!';
  END IF;
END $$;
