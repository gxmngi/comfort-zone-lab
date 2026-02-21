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

export function useComfortReadings(targetUserId?: string, days: number = 1) {
  const { user } = useAuth();
  const [readings, setReadings] = useState<ComfortReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial check (authentication)
    if (!user && !targetUserId) { 
        // If no auth and no target (though target usually requires auth to view), clear
        setReadings([]);
        setLoading(false);
    }
  }, [user, targetUserId]);

  const fetchReadings = async () => {
    if (!user) return;
    
    const queryUserId = targetUserId || user.id;
    
    // Calculate start date based on 'days'
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    setLoading(true);
    let query = supabase
      .from('comfort_readings')
      .select('*')
      .eq('user_id', queryUserId)
      .gte('recorded_at', startDate.toISOString()) // Filter by date range
      .order('recorded_at', { ascending: true }); // Ascending for charts

    // If viewing history (days > 1), we might want more data points, 
    // but for now let's remove the limit to get full history for the period
    // or set a higher limit.
    if (days <= 1) {
       query = query.limit(100);
    } else {
       query = query.limit(2000); // 14 days of data could be large
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching readings:', error);
    } else {
      setReadings(data || []);
    }
    setLoading(false);
  };

  // Auto-refresh when user or target changes
  useEffect(() => {
     if (targetUserId || user) {
        fetchReadings();
     }
  }, [user, targetUserId, days]);

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