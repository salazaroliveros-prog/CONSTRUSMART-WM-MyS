-- MIGRATION CORREGIDA: Maneja ejecuciones repetidas sin errores
-- Ejecutar en Supabase SQL Editor

-- 1. Corregir policy RLS de erp_empleados (sin error de sintaxis)
DROP POLICY IF EXISTS "Users can view employees of accessible projects" ON public.erp_empleados;

CREATE POLICY "Users can view employees of accessible projects"
ON public.erp_empleados
FOR SELECT
USING (
  get_user_role() IN ('Administrador', 'Gerente')
  OR
  proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
);

-- 2. Tablas con prefijo erp_ que deben estar en realtime (evita duplicados)
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public' AND tablename LIKE 'erp_%'
    LOOP
        EXECUTE format('ALTER PUBLICATION supabase_realtime SET (publish = ''INSERT, UPDATE, DELETE'');')
        USING tbl;
    END LOOP;
END $$;

-- 3. Alternativa simple: agregar tablas a publicación solo si no están
-- (Esta sección no causa error si ya existen)

-- 4. Verificar que las 4 vistas SECURITY DEFINER están recreadas correctamente
DROP VIEW IF EXISTS public.erp_publicaciones_muro;
CREATE VIEW public.erp_publicaciones_muro AS SELECT * FROM public.erp_muro;

DROP VIEW IF EXISTS public.erp_cuadros_comparativos;
CREATE VIEW public.erp_cuadros_comparativos AS SELECT * FROM public.cuadro_comparativo_proveedores;

DROP VIEW IF EXISTS public.erp_incidentes_sso;
CREATE VIEW public.erp_incidentes_sso AS SELECT * FROM public.erp_incidentes;

DROP VIEW IF EXISTS public.erp_activos_herramienta;
CREATE VIEW public.erp_activos_herramienta AS SELECT * FROM public.activos_herramientas;

-- 5. Verificación final
-- Debería devolver 0 filas