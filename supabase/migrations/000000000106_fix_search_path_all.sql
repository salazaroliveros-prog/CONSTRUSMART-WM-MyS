-- ============================================================================
-- MIGRACIÓN: Fix search_path mutable en todas las funciones públicas
-- Usa DO block dinámico para evitar errores en funciones que no existen
-- ============================================================================

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN 
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname NOT IN ('exec_sql', 'exec_sql_returning')
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public', r.proname, r.args);
    EXCEPTION WHEN undefined_function THEN
      NULL;
    END;
  END LOOP;
END $$;
