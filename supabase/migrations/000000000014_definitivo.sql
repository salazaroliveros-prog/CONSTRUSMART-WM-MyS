-- MIGRACIÓN DEFINITIVA: arregla todo sin errores de ejecución múltiple
-- Ejecutar UNA sola vez en Supabase SQL Editor -- tabla por tabla

-- 1. VERIFICAR que las tablas fuente existen
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('erp_muro','cuadro_comparativo_proveedores','erp_incidentes',
                     'activos_herramientas','erp_empleados','erp_proyectos');

-- 2. RECREAR LAS 4 VISTAS SECURITY DEFINER (sin SECURITY DEFINER) -- 
DROP VIEW IF EXISTS public.erp_publicaciones_muro CASCADE;
CREATE VIEW public.erp_publicaciones_muro AS SELECT * FROM public.erp_muro;

DROP VIEW IF EXISTS public.erp_cuadros_comparativos CASCADE;
CREATE VIEW public.erp_cuadros_comparativos AS SELECT * FROM public.cuadro_comparativo_proveedores;

DROP VIEW IF EXISTS public.erp_incidentes_sso CASCADE;
CREATE VIEW public.erp_incidentes_sso AS SELECT * FROM public.erp_incidentes;

DROP VIEW IF EXISTS public.erp_activos_herramienta CASCADE;
CREATE VIEW public.erp_activos_herramienta AS SELECT * FROM public.activos_herramientas;

-- 3. CORRIGIR RLS EN erp_empleados (sin error de sintaxis de comillas)
DROP POLICY IF EXISTS "Users can view employees of accessible projects" ON public.erp_empleados;

CREATE POLICY "Users can view employees of accessible projects"
ON public.erp_empleados
FOR SELECT
USING (
  get_user_role() IN ('Administrador', 'Gerente')
  OR
  proyecto_id IN (SELECT unnest(get_accessible_proyectos()))
);

-- 4. Verificar que NO quedan vistas con SECURITY DEFINER
SELECT 
  c.relname AS view_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'v'
  AND pg_get_viewdef(c.oid) ILIKE '%security definer%';
-- Esta query DEBE RETORNAR 0 filas