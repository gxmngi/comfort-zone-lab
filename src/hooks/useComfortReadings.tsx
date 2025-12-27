import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ComfortReading {
  id: string;
  user_id: string;
  comfort_level: number;
  lf_power: number | null;
  hf_power: number | null;
  lf_hf_ratio: number | null;
  eda_tonic: number | null;
  eda_phasic: number | null;
  heart_rate: number | null;
  recorded_at: string;
  created_at: string;
}

export function useComfortReadings() {
  const { user } = useAuth();
  const [readings, setReadings] = useState<ComfortReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReadings();
    } else {
      setReadings([]);
      setLoading(false);
    }
  }, [user]);

  const fetchReadings = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('comfort_readings')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching readings:', error);
    } else {
      setReadings(data || []);
    }
    setLoading(false);
  };

  const addReading = async (reading: Omit<ComfortReading, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('comfort_readings')
      .insert({
        ...reading,
        user_id: user.id,
      });

    if (!error) {
      await fetchReadings();
    }
    return { error };
  };

  return { readings, loading, addReading, refetch: fetchReadings };
}