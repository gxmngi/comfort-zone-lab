-- RUN THIS SQL IN YOUR SUPABASE SQL EDITOR

-- 1. Add 'role' column to profiles table IF NOT EXISTS
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- 2. Update the constraint to allow only specific values
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS role_check;

ALTER TABLE profiles 
ADD CONSTRAINT role_check CHECK (role IN ('user', 'doctor'));

-- 3. CRITICAL: Update the handle_new_user function to copy 'role' from metadata
-- This ensures that when you sign up with a role, it gets saved to your profile!
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'role', 'user')
  );
  RETURN new;
END;
$$;
