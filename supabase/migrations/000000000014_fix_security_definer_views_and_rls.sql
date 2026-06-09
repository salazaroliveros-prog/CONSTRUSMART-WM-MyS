-- Fix linter + RLS recursion: ejecutar TODO en Supabase SQL Editor
-- 1) Recrear vistas sin SECURITY DEFINER
DROP VIEW IF EXISTS public.erp_publicaciones_muro;
CREATE VIEW public.erp_publicaciones_muro AS SELECT * FROM public.erp_muro;

DROP VIEW IF EXISTS public.erp_cuadros_comparativos;
CREATE VIEW public.erp_cuadros_comparativos AS SELECT * FROM public.cuadro_comparativo_proveedores;

DROP VIEW IF EXISTS public.erp_incidentes_sso;
CREATE VIEW public.erp_incidentes_sso AS SELECT * FROM public.erp_incidentes;

DROP VIEW IF EXISTS public.erp_activos_herramienta;
CREATE VIEW public.erp_activos_herramienta AS SELECT * FROM public.activos_herramientas;

-- 2) Corregir recursión RLS en erp_empleados
DROP POLICY IF EXISTS "Users can view employees of accessible projects" ON erp_empleados;

CREATE POLICY "Users can view employees of accessible projects" ON erp_empleados
  FOR SELECT USING (
    public.get_user_role() IN ('Administrador', 'Gerente')
    OR
    proyecto_id IN (SELECT id FROM erp_proyectos WHERE id IN (SELECT * FROM public.get_accessible_proyectos()))
  );
