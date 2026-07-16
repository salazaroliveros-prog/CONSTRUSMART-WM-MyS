-- ============================================================================
-- MIGRACIÓN 111 v2: Security Advisor — Corrección completa
-- El problema: Postgres hereda EXECUTE de PUBLIC por defecto.
-- REVOKE FROM anon/authenticated no alcanza — hay que REVOKE FROM PUBLIC.
-- Estrategia:
--   a) REVOKE EXECUTE ON ALL SD FUNCTIONS FROM PUBLIC  (cierra la brecha base)
--   b) GRANT EXECUTE TO authenticated en funciones que usuarios normales necesitan
--   c) NO GRANT a funciones admin-only (solo ejecutables como postgres/service_role)
-- ============================================================================

-- ============================================================================
-- 1. FIX: search_path en exec_sql
-- ============================================================================

ALTER FUNCTION public.exec_sql(sql text)
  SET search_path = public, extensions;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'exec_sql_returning'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.exec_sql_returning(sql_text text) SET search_path = public, extensions';
  END IF;
END $$;

-- ============================================================================
-- 2. FIX: erp_notificaciones_insert — WITH CHECK más restrictivo
-- ============================================================================

DROP POLICY IF EXISTS "erp_notificaciones_insert" ON public.erp_notificaciones;

CREATE POLICY "erp_notificaciones_insert" ON public.erp_notificaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    usuario_id IS NULL
    OR usuario_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador', 'Gerente')
    )
  );

-- ============================================================================
-- 3. REVOKE EXECUTE FROM PUBLIC en TODAS las funciones SECURITY DEFINER
-- Esto elimina el acceso por herencia de rol PUBLIC (que anon y authenticated heredan)
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
      AND p.prosecdef = true
  LOOP
    BEGIN
      EXECUTE format(
        'REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC',
        r.proname, r.args
      );
    EXCEPTION
      WHEN undefined_function THEN NULL;
      WHEN insufficient_privilege THEN NULL;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- 4. GRANT EXECUTE TO authenticated en funciones que usuarios normales necesitan
-- Estas funciones tienen SECURITY DEFINER porque necesitan bypassar RLS
-- para acceder a datos propios del usuario. Se mantiene acceso solo a authenticated.
-- ============================================================================

DO $$
DECLARE
  user_funcs text[] := ARRAY[
    'append_comentario_muro',
    'asignar_miembro_proyecto',
    'check_daily_integrity',
    'cleanup_old_error_logs',
    'descontar_stock_vale',
    'fn_daily_integrity_check',
    'fn_get_performance_metrics',
    'get_accessible_proyectos',
    'get_app_config',
    'get_current_user_role',
    'get_monitoring_config',
    'get_user_role',
    'increment_likes_muro',
    'incrementar_stock_oc',
    'log_deadlock_event',
    'log_error',
    'remover_miembro_proyecto',
    'resolve_error',
    'verificar_rol_usuario',
    'verificar_stock_vale'
  ];
  func_name text;
  r record;
BEGIN
  FOREACH func_name IN ARRAY user_funcs LOOP
    FOR r IN
      SELECT pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = func_name
    LOOP
      BEGIN
        EXECUTE format(
          'GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated',
          func_name, r.args
        );
      EXCEPTION
        WHEN undefined_function THEN NULL;
        WHEN insufficient_privilege THEN NULL;
      END;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================================
-- 5. FIX: eliminar política duplicada notificaciones_insert (WITH CHECK true)
--    creada por migración 110 — ya reemplazada por erp_notificaciones_insert
-- ============================================================================

DROP POLICY IF EXISTS "notificaciones_insert" ON public.erp_notificaciones;

-- ============================================================================
-- Resultado esperado:
--   - anon NO puede ejecutar ninguna función SD (revocado vía PUBLIC)
--   - authenticated SÍ puede ejecutar funciones de usuario normal (GRANT explícito)
--   - authenticated NO puede ejecutar funciones admin-only (sin GRANT)
--   - exec_sql solo ejecutable por postgres / service_role
-- ============================================================================
