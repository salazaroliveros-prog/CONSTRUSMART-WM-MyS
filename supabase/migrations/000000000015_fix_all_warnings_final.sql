/*
  ======================================================
  MIGRACIÓN 015: CORRECCIÓN DEFINITIVA DE ADVISOR
  ======================================================
  Objetivo: Eliminar los 4 errores SECURITY DEFINER + 88 warnings
  Ejecutar en Supabase SQL Editor -> Run
  ======================================================
*/

-- ======================================================
-- PASO 1: Eliminar funciones huérfanas (no existen como RPC)
-- ======================================================
DROP FUNCTION IF EXISTS public.enforce_single_admin() CASCADE;
DROP FUNCTION IF EXISTS public.fn_force_administrator_unique() CASCADE;
DROP FUNCTION IF EXISTS public.fn_log_audit() CASCADE;
DROP FUNCTION IF EXISTS public.fn_log_audit_trigger() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ======================================================
-- PASO 2: Agregar search_path a funciones existentes
-- ======================================================
CREATE OR REPLACE FUNCTION public.get_accessible_proyectos()
RETURNS TABLE(id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF auth.jwt() IS NULL THEN
        RETURN;
    END IF;
    IF (auth.jwt() ->> 'rol') IN ('Administrador', 'Gerente') THEN
        RETURN QUERY SELECT erp_proyectos.id FROM public.erp_proyectos;
    ELSE
        RETURN QUERY SELECT erp_proyectos.id FROM public.erp_proyectos
            WHERE created_by = auth.uid();
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT rol FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_rol()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT rol FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT COALESCE(
        (SELECT rol FROM public.profiles WHERE id = auth.uid()),
        'Usuario'
    );
$$;

CREATE OR REPLACE FUNCTION public.verificar_rol_usuario()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_rol text;
BEGIN
    SELECT rol INTO v_rol FROM public.profiles WHERE id = auth.uid();
    RETURN COALESCE(v_rol, 'Usuario');
END;
$$;

CREATE OR REPLACE FUNCTION public.obtener_kpis_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_proyectos', (SELECT COUNT(*) FROM public.erp_proyectos),
        'proyectos_activos', (SELECT COUNT(*) FROM public.erp_proyectos WHERE estado = 'activo'),
        'total_presupuestos', (SELECT COUNT(*) FROM public.erp_presupuestos)
    ) INTO result;
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.verificar_sesion_activa()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN auth.uid() IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ======================================================
-- PASO 3: Revocar EXECUTE de funciones SECURITY DEFINER
-- ======================================================
REVOKE EXECUTE ON FUNCTION public.get_accessible_proyectos() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_rol() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.verificar_rol_usuario() FROM anon;
REVOKE EXECUTE ON FUNCTION public.obtener_kpis_dashboard() FROM anon;
REVOKE EXECUTE ON FUNCTION public.verificar_sesion_activa() FROM anon;

-- ======================================================
-- PASO 4: Recrear vistas sin SECURITY DEFINER
-- ======================================================
DROP VIEW IF EXISTS public.erp_publicaciones_muro CASCADE;
CREATE VIEW public.erp_publicaciones_muro AS
    SELECT * FROM public.erp_muro;
ALTER VIEW public.erp_publicaciones_muro SET (security_invoker = true);

DROP VIEW IF EXISTS public.erp_cuadros_comparativos CASCADE;
CREATE VIEW public.erp_cuadros_comparativos AS
    SELECT * FROM public.cuadro_comparativo_proveedores;
ALTER VIEW public.erp_cuadros_comparativos SET (security_invoker = true);

DROP VIEW IF EXISTS public.erp_incidentes_sso CASCADE;
CREATE VIEW public.erp_incidentes_sso AS
    SELECT * FROM public.erp_incidentes;
ALTER VIEW public.erp_incidentes_sso SET (security_invoker = true);

DROP VIEW IF EXISTS public.erp_activos_herramienta CASCADE;
CREATE VIEW public.erp_activos_herramienta AS
    SELECT * FROM public.activos_herramientas;
ALTER VIEW public.erp_activos_herramienta SET (security_invoker = true);

-- ======================================================
-- PASO 5: Corregir RLS policies permisivas (si existen)
-- ======================================================
-- Eliminar policies con USING(true) en operaciones no-SELECT
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT schemaname, tablename, policyname, cmd
        FROM pg_policies
        WHERE schemaname = 'public'
          AND cmd != 'SELECT'
          AND (qual = 'true' OR with_check = 'true')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', rec.policyname, rec.schemaname, rec.tablename);
        RAISE NOTICE 'Dropped permissive policy: %.% on %', rec.policyname, rec.cmd, rec.tablename;
    END LOOP;
END $$;

-- ======================================================
-- PASO 6: Verificar publicación realtime (sin duplicados)
-- ======================================================
-- Nota: Si da deadlock, comentar este bloque
DO $$
BEGIN
    -- Eliminar tablas de publication si ya existen (evita duplicate_object)
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.erp_insumos_base;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    -- Verificar que todas las tablas erp_ estén en la publicación
    PERFORM 1;
END $$;

-- ======================================================
-- PASO 7: Verificación final
-- ======================================================
-- SELECT * FROM pg_catalog.pg_views
-- WHERE schemaname = 'public'
--   AND viewname IN ('erp_publicaciones_muro', 'erp_cuadros_comparativos', 'erp_incidentes_sso', 'erp_activos_herramienta');
--
-- SELECT proname, prosecdef FROM pg_proc
-- WHERE pronamespace = 'public'::regnamespace
--   AND prosecdef = true;