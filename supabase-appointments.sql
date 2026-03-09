-- Run this script in your Supabase SQL Editor

CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  time time without time zone NOT NULL,
  department text NOT NULL,
  location text NOT NULL,
  note text NULL,
  status text NOT NULL DEFAULT 'upcoming'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT appointments_pkey PRIMARY KEY (id)
);

-- Turn on Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own appointments (as patient or doctor)
CREATE POLICY "Users can view their own appointments" 
ON public.appointments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE (profiles.id = appointments.patient_id OR profiles.id = appointments.doctor_id)
      AND profiles.user_id = auth.uid()
  )
);

-- Policy: Only doctors can insert appointments
CREATE POLICY "Doctors can insert appointments" 
ON public.appointments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = doctor_id 
      AND profiles.user_id = auth.uid() 
      AND profiles.role = 'doctor'
  )
);

-- Policy: Only doctors can update appointments
CREATE POLICY "Doctors can update appointments" 
ON public.appointments FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = doctor_id 
      AND profiles.user_id = auth.uid() 
      AND profiles.role = 'doctor'
  )
);

-- Policy: Only doctors can delete appointments
CREATE POLICY "Doctors can delete appointments" 
ON public.appointments FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = doctor_id 
      AND profiles.user_id = auth.uid() 
      AND profiles.role = 'doctor'
  )
);
