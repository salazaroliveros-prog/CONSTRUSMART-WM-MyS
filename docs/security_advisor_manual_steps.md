# Security Advisor - Pasos Manuales en Supabase Dashboard

## 1) SQL Editor
- Ir a: https://supabase.com/dashboard/project/neygzluxugodiwcuctbj/editor

## 2) Opcional: get_slow_queries() sin pg_stat_statements
```sql
CREATE OR REPLACE FUNCTION public.get_slow_queries()
RETURNS TABLE (
  query text,
  calls bigint,
  total_time numeric,
  mean_time numeric,
  rows bigint
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = 'public'
AS $$
  SELECT query,
         COUNT(*) FILTER (WHERE state = 'active')::bigint AS calls,
         EXTRACT(EPOCH FROM (now() - query_start)) * 1000 AS total_time,
         EXTRACT(EPOCH FROM (now() - query_start)) * 1000 AS mean_time,
         COUNT(*)::bigint AS rows
  FROM pg_stat_activity
  WHERE query NOT LIKE '%pg_stat_statements%'
    AND state = 'active'
  GROUP BY query
  ORDER BY mean_time DESC
  LIMIT 50
$$;
```

Nota: Si aparece `relation "pg_stat_statements" does not exist`, deja esta función tal cual. No habilites `pg_stat_statements` solo para este advisor.

## 3) Ejecutar get_table_sizes()
```sql
DROP FUNCTION IF EXISTS public.get_table_sizes();

CREATE FUNCTION public.get_table_sizes()
RETURNS TABLE (
  table_name text,
  row_count bigint,
  total_size text,
  table_size text,
  index_size text
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = 'public'
AS $$
  SELECT t.relname::text,
         c.reltuples::bigint,
         pg_size_pretty(pg_total_relation_size(t.oid)),
         pg_size_pretty(pg_relation_size(t.oid)),
         pg_size_pretty(pg_indexes_size(t.oid))
  FROM pg_stat_user_tables s
  JOIN pg_class t ON t.oid = s.relid
  JOIN pg_class c ON c.oid = t.oid
  WHERE s.schemaname = 'public'
  ORDER BY pg_total_relation_size(t.oid) DESC
$$;
```

## 4) Verificar extensiones
- Settings → Database → Extensions → `pg_stat_statements`

## 5) Si persiste error: usar SECURITY DEFINER
```sql
CREATE OR REPLACE FUNCTION public.get_slow_queries()
RETURNS TABLE (...)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$ ... $$;

REVOKE EXECUTE ON FUNCTION public.get_slow_queries() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_slow_queries() TO authenticated;
```

## 6) MFA/leaked password
- Auth → Password Security → Enable leaked password protection
- Auth → MFA → Enable TOTP or Phone MFA

## 7) Validar
- Volver a Security Advisor y confirmar que los warnings bajaron.