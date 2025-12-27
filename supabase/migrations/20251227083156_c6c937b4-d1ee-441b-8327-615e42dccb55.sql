-- Add dust_allergy column to profiles table
ALTER TABLE public.profiles ADD COLUMN dust_allergy boolean DEFAULT false;