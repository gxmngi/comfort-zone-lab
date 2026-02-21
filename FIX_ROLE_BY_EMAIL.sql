-- FIX_ROLE_BY_EMAIL.sql
-- Run this in Supabase SQL Editor

-- 1. Update the specific user 'doctor1@gmail.com' to be a doctor
-- (We use EMAIL because auth.uid() doesn't work well in the SQL Editor console)
UPDATE profiles 
SET role = 'doctor'
WHERE email = 'doctor1@gmail.com';  -- Change this if your email is different!

-- 2. Double check: Ensure all other columns usually needed for a user are there
-- (Optional, just to be safe)
UPDATE profiles
SET first_name = COALESCE(first_name, 'Doctor'), last_name = COALESCE(last_name, 'Gum')
WHERE email = 'doctor1@gmail.com' AND first_name IS NULL;
