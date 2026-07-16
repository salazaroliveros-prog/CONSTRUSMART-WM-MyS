-- ============================================================================
-- MIGRACIÓN: Security Advisor fixes - Supabase Linter
-- Corrige: security_definer_view, rls_disabled_in_public, rls_enabled_no_policy
-- ============================================================================

-- 1. FIX: security_definer_view en public.erp_muro
-- erp_muro fue renombrado a erp_publicaciones_muro, eliminamos si existe como tabla vieja
DROP TABLE IF EXISTS public.erp_muro CASCADE;

-- 2. FIX: rls_disabled_in_public en public.test_sync_schema
-- Tabla de prueba/sync, la eliminamos para limpiar
DROP TABLE IF EXISTS public.test_sync_schema CASCADE;

-- 3. FIX: rls_enabled_no_policy en final_dept_count y final_muni_count
-- Creamos políticas públicas de SELECT (datos agregados sin sensibilidad)
-- Solo si las tablas existen (son tablas de referencia geográfica)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'final_dept_count' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow public read" ON public.final_dept_count;
    CREATE POLICY "Allow public read" ON public.final_dept_count FOR SELECT TO public USING (true);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'final_muni_count' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Allow public read" ON public.final_muni_count;
    CREATE POLICY "Allow public read" ON public.final_muni_count FOR SELECT TO public USING (true);
  END IF;
END $$;
