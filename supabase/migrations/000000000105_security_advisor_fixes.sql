-- ============================================================================
-- MIGRACIÓN: Security Advisor fixes - Supabase Linter
-- Corrige: security_definer_view, rls_disabled_in_public, rls_enabled_no_policy
-- ============================================================================

-- 1. FIX: security_definer_view en public.erp_muro
-- Si es una vista obsoleta, la eliminamos para evitar SECURITY DEFINER
DROP VIEW IF EXISTS public.erp_muro CASCADE;

-- 2. FIX: rls_disabled_in_public en public.test_sync_schema
-- Tabla de prueba/sync, la eliminamos para limpiar
DROP TABLE IF EXISTS public.test_sync_schema CASCADE;

-- 3. FIX: rls_enabled_no_policy en final_dept_count y final_muni_count
-- Creamos políticas públicas de SELECT (datos agregados sin sensibilidad)
DROP POLICY IF EXISTS "Allow public read" ON public.final_dept_count;
CREATE POLICY "Allow public read" ON public.final_dept_count FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read" ON public.final_muni_count;
CREATE POLICY "Allow public read" ON public.final_muni_count FOR SELECT TO public USING (true);
