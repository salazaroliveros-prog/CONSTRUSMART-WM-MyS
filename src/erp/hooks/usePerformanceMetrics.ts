import { useState, useCallback } from 'react';
import { supabase, hasSupabase } from '@/lib/supabase';

export interface SlowQuery {
  query_preview: string;
  calls: number;
  mean_ms: number;
  total_sec: number;
}

export interface TableSize {
  table_name: string;
  total_size: string;
  live_rows: number;
}

export interface PerformanceMetrics {
  checked_at: string;
  slow_queries: SlowQuery[];
  table_sizes: TableSize[];
}

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!hasSupabase) { setError('Supabase no disponible'); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('fn_get_performance_metrics');
      if (rpcError) throw rpcError;
      setMetrics(data as PerformanceMetrics);
    } catch (e: any) {
      setError(e.message ?? 'Error al obtener métricas');
    } finally {
      setLoading(false);
    }
  }, []);

  return { metrics, loading, error, fetch };
}
