-- SEED_PATIENT.sql
-- Run this in Supabase SQL Editor to create a FAKE PATIENT

-- Note: We cannot create a real "Auth User" easily via SQL (requires internal Supabase API),
-- BUT we can trick the 'profiles' table to check the UI.

INSERT INTO public.profiles (id, user_id, email, role, first_name, last_name, phone, gender, date_of_birth)
VALUES (
  gen_random_uuid(),           -- Fake ID
  gen_random_uuid(),           -- Fake User ID
  'patient_test@demo.com',     -- Email
  'user',                      -- ROLE: USER (Crucial!)
  'Somchai',                   -- First Name
  'Deejai',                    -- Last Name
  '081-234-5678',
  'Male',
  '1995-05-20'
);

-- Insert another one
INSERT INTO public.profiles (id, user_id, email, role, first_name, last_name, phone, gender, date_of_birth)
VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  'anna_student@demo.com',
  'user',
  'Anna',
  'Wong',
  '099-999-9999',
  'Female',
  '2002-11-15'
);
