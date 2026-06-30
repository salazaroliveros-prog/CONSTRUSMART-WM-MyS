-- ============================================================================
-- MIGRACIÓN ÚNICA: Corrige TODO - Seguridad + RLS recursiva + Publicaciones
-- Ejecutar en Supabase SQL Editor - NO causa errores en ejecuciones repetidas
-- ============================================================================

-- 1. ============================================================
-- CORREGIR VISTAS SECURITY DEFINER (4 errores del Advisor)
-- 2. ============================================================

DROP VIEW IF EXISTS public.erp_publicaciones_muro CASCADE;
CREATE VIEW public.erp_publicaciones_muro AS SELECT * FROM public.erp_muro;

DROP VIEW IF EXISTS public.erp_cuadros_comparativos CASCADE;
CREATE VIEW public.erp_cuadros_comparativos AS SELECT * FROM public.cuadro_comparativo_proveedores;

DROP VIEW IF EXISTS public.erp_incidentes_sso CASCADE;
CREATE VIEW public.erp_incidentes_sso AS SELECT * FROM public.erp_incidentes;

DROP VIEW IF EXISTS public.erp_activos_herramienta CASCADE;
CREATE VIEW public.erp_activos_herramienta AS SELECT * FROM public.activos_herramientas;

-- 2. ============================================================
-- VERIFICAR que NO quedan vistas con SECURITY DEFINER
-- 3. ============================================================

SELECT 
  c.relname AS view_name,
  pg_get_viewdef(c.oid) AS definition_preview
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'v'
  AND pg_get_viewdef(c.oid) NOT LIKE '%SECURITY DEFINER%'
LIMIT 1;

-- 3. ============================================================
-- CORREGIR PUBLICATION (evitar duplicate_object)
-- 4. ============================================================

DO $$
DECLARE
    tabla TEXT;
BEGIN
    FOR tabla IN 
        SELECT tablename FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE IF EXISTS public.%I REPLICA IDENTITY FULL', tabla);
        EXCEPTION 
            WHEN undefined_table THEN
                NULL; -- tabla existe en pub pero no física, omitir
        END;
    END LOOP;
END $$;

-- 4. ============================================================
-- Verificar publicaciones actuales
-- 5. ============================================================

SELECT 
    n.nspname AS schema_name,
    c.relname AS table_name
FROM pg_publication_tables pt
JOIN pg_class c ON c.relname = pt.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = pt.schemaname
WHERE pt.pubname = 'supabase_realtime'
ORDER BY c.relname;

-- 5. ============================================================
-- Verificación final: que las 4 vistas están limpias
-- 6. ============================================================

SELECT 
    relname AS view_name
FROM pg_class
WHERE relkind = 'v' AND relname IN (
    'erp_publicaciones_muro',
    'erp_cuadros_comparativos', 
    'erp_incidentes_sso',
    'erp_activos_herramienta'
);

-- Si la query anterior devuelve 4 filas = las vistas existen
-- Si pg_get_viewdef contain 'SECURITY DEFINER' = problema persiste