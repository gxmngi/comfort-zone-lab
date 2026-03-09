import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  date: string;
  time: string;
  department: string;
  location: string;
  note: string | null;
  status: string;
  created_at: string;
  // Joined fields
  patient?: { first_name: string | null; last_name: string | null };
  doctor?: { first_name: string | null; last_name: string | null };
}

export function useAppointments() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    if (!user || !profile) return;

    setLoading(true);

    // Depending on role, we fetch appointments where the user is either the doctor or patient
    const roleColumn = profile.role === 'doctor' ? 'doctor_id' : 'patient_id';

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patient_id(first_name, last_name),
        doctor:doctor_id(first_name, last_name)
      `)
      .eq(roleColumn, profile.id)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
    } else {
      // Data format casting since we used a join
      setAppointments(data as unknown as Appointment[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  const addAppointment = async (
    appointmentData: Omit<Appointment, 'id' | 'created_at' | 'status' | 'patient' | 'doctor'>
  ) => {
    if (!profile || profile.role !== 'doctor') {
      return { error: new Error('Unauthorized') };
    }

    const { error } = await supabase
      .from('appointments')
      .insert({
        ...appointmentData,
        status: 'upcoming'
      });

    if (!error) {
      await fetchAppointments(); // Refetch
    }
    return { error };
  };

  return { appointments, loading, addAppointment, refetch: fetchAppointments };
}
