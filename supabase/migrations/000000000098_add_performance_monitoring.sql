-- Migration: Performance monitoring via pg_stat_statements
-- NOTA: pg_stat_statements debe estar habilitado en postgresql.conf
-- En Supabase se habilita desde Dashboard → Database → Extensions

-- Habilitar extensión (requiere superuser en Supabase — ejecutar desde SQL Editor)
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Vista de consultas lentas (top 20 por tiempo total)
CREATE OR REPLACE VIEW public.v_slow_queries AS
SELECT
  LEFT(query, 200)                                    AS query_preview,
  calls,
  ROUND((total_exec_time / 1000)::numeric, 2)         AS total_sec,
  ROUND((mean_exec_time)::numeric, 2)                 AS mean_ms,
  ROUND((max_exec_time)::numeric, 2)                  AS max_ms,
  ROUND((stddev_exec_time)::numeric, 2)               AS stddev_ms,
  rows
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
  AND calls > 5
ORDER BY total_exec_time DESC
LIMIT 20;

-- Solo admins pueden ver la vista
REVOKE ALL ON public.v_slow_queries FROM PUBLIC, anon;
GRANT SELECT ON public.v_slow_queries TO authenticated;

-- RPC para obtener métricas de rendimiento (accesible desde el cliente)
CREATE OR REPLACE FUNCTION public.fn_get_performance_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slow_queries jsonb;
  v_table_sizes  jsonb;
BEGIN
  -- Top 5 consultas más lentas
  BEGIN
    SELECT jsonb_agg(row_to_json(q)) INTO v_slow_queries
    FROM (
      SELECT LEFT(query, 150) AS query_preview, calls,
             ROUND((mean_exec_time)::numeric, 2) AS mean_ms,
             ROUND((total_exec_time / 1000)::numeric, 2) AS total_sec
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%' AND calls > 5
      ORDER BY total_exec_time DESC LIMIT 5
    ) q;
  EXCEPTION WHEN OTHERS THEN
    v_slow_queries := '[]'::jsonb;
  END;

  -- Tamaño de tablas principales
  SELECT jsonb_agg(row_to_json(t)) INTO v_table_sizes
  FROM (
    SELECT relname AS table_name,
           pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
           n_live_tup AS live_rows
    FROM pg_stat_user_tables
    WHERE relname LIKE 'erp_%'
    ORDER BY pg_total_relation_size(relid) DESC
    LIMIT 10
  ) t;

  RETURN jsonb_build_object(
    'checked_at',   now(),
    'slow_queries', COALESCE(v_slow_queries, '[]'::jsonb),
    'table_sizes',  COALESCE(v_table_sizes, '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_get_performance_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_get_performance_metrics() TO authenticated;
