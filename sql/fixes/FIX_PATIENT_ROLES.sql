-- FIX_PATIENT_ROLES.sql
-- Run this in Supabase SQL Editor

-- 1. Check how many users have NO role (NULL)
-- These are likely the patients you expect to see but are hidden.
UPDATE profiles
SET role = 'user'
WHERE role IS NULL OR role = '';

-- 2. Verify results
-- This will confirm if there are users now properly labeled as 'user'
SELECT first_name, email, role FROM profiles;
