-- FORCE_UPDATE_ONLY.sql
-- Run this in Supabase SQL Editor

-- Since the row ALREADY EXISTS (we know this from the error),
-- we just need to update it!

UPDATE profiles
SET role = 'doctor'
WHERE email = 'doctor1@gmail.com';  -- Use email to target correct user

-- Check if it worked:
-- SELECT * FROM profiles WHERE email = 'doctor1@gmail.com';
