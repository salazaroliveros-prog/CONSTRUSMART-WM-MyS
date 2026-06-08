-- ============================================================
-- FIX: Eliminar SECURITY DEFINER de las 4 vistas reportadas
-- por Supabase Database Linter (ERROR level)
--
-- SECURITY DEFINER hace que la vista ejecute con permisos del
-- creador en lugar del usuario que consulta, lo cual es un
-- riesgo de seguridad. Al eliminarlo, las vistas usarán los
-- permisos del usuario que consulta (como es lo correcto).
-- ============================================================

-- 1. erp_publicaciones_muro → vista sobre erp_muro
DROP VIEW IF EXISTS public.erp_publicaciones_muro;
CREATE VIEW public.erp_publicaciones_muro AS
SELECT * FROM public.erp_muro;

-- 2. erp_cuadros_comparativos → vista sobre cuadro_comparativo_proveedores
DROP VIEW IF EXISTS public.erp_cuadros_comparativos;
CREATE VIEW public.erp_cuadros_comparativos AS
SELECT * FROM public.cuadro_comparativo_proveedores;

-- 3. erp_incidentes_sso → vista sobre erp_incidentes
DROP VIEW IF EXISTS public.erp_incidentes_sso;
CREATE VIEW public.erp_incidentes_sso AS
SELECT * FROM public.erp_incidentes;

-- 4. erp_activos_herramienta → vista sobre activos_herramientas
DROP VIEW IF EXISTS public.erp_activos_herramienta;
CREATE VIEW public.erp_activos_herramienta AS
SELECT * FROM public.activos_herramientas;

-- ============================================================
-- Verificar que las vistas se recrearon correctamente
-- ( Esto es solo documentación, no ejecuta nada )
-- ============================================================
-- SELECT table_name, table_type
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN (
--     'erp_publicaciones_muro',
--     'erp_cuadros_comparativos',
--     'erp_incidentes_sso',
--     'erp_activos_herramienta'
--   );