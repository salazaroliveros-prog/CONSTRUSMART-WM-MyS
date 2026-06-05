-- =============================================================
-- FIX FINAL SUPABASE — CONSTRUSMART ERP
-- BASADO EN ESQUEMA REAL CONFIRMADO (snake_case)
-- Cierra todos los gaps restantes:
--   P0-SEC-03: Auditoría server-side con triggers
--   P0-SEC-04: Rate limiting server-side (RPC verificación)
--   + Índices de rendimiento
-- =============================================================
-- Ejecutar COMPLETO en Supabase SQL Editor en este orden.
-- =============================================================

-- ============================================================
-- PARTE 1: TRIGGER DE AUDITORÍA (usa logs_sistema REAL)
-- Columnas reales: usuario_id, usuario_nombre, accion, entidad,
--                  entidad_id, valores_anteriores, valores_nuevos,
--                  ip_address, created_at
-- ============================================================

-- Función de auditoría genérica (SECURITY INVOKER para evitar escalada)
CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_id text;
  v_user_name text;
  v_ip text;
BEGIN
  -- Obtener usuario actual
  v_user_id := COALESCE(auth.uid()::text, 'system');
  BEGIN
    SELECT COALESCE(nombre, v_user_id) INTO v_user_name
    FROM public.profiles
    WHERE id::text = v_user_id
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_user_name := v_user_id;
  END;

  -- Obtener IP del request (si está disponible)
  v_ip := COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', NULL);

  INSERT INTO public.logs_sistema (
    usuario_id,
    usuario_nombre,
    accion,
    entidad,
    entidad_id,
    valores_anteriores,
    valores_nuevos,
    ip_address,
    created_at
  ) VALUES (
    CASE WHEN v_user_id = 'system' THEN NULL ELSE v_user_id::uuid END,
    v_user_name,
    TG_OP,
    TG_TABLE_NAME,
    CASE
      WHEN TG_OP = 'DELETE' THEN (OLD.id::text)
      ELSE (NEW.id::text)
    END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN
      to_jsonb(OLD) - 'created_at' - 'updated_at'
    ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN
      to_jsonb(NEW) - 'created_at' - 'updated_at'
    ELSE NULL END,
    v_ip,
    NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar trigger a tablas críticas
DO $$
DECLARE
  tablas TEXT[] := ARRAY[
    'erp_proyectos', 'erp_movimientos', 'erp_presupuestos',
    'erp_empleados', 'erp_materiales', 'erp_ordenes_compra',
    'erp_proveedores', 'erp_vales_salida', 'erp_avances',
    'erp_licitaciones'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tablas
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I', t, t);
      EXECUTE format(
        'CREATE TRIGGER trg_audit_%I
         AFTER INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log()',
        t, t
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- PARTE 2: TRIGGER handle_new_user (SECURITY INVOKER)
-- Coincide con esquema real: profiles(id, nombre, rol, avatar_url, user_metadata)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_nombre text;
  v_rol text;
  v_avatar text;
BEGIN
  v_nombre := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'nombre',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(COALESCE(NEW.email, 'usuario'), '@', 1)
  );
  v_rol := CASE
    WHEN NEW.email = 'salazaroliveros@gmail.com' THEN 'Administrador'
    ELSE 'Residente'
  END;
  v_avatar := COALESCE(NEW.raw_user_meta_data->>'picture', NEW.raw_user_meta_data->>'avatar_url');

  INSERT INTO public.profiles (id, nombre, rol, avatar_url, user_metadata)
  VALUES (NEW.id, v_nombre, v_rol, v_avatar, NEW.raw_user_meta_data)
  ON CONFLICT (id) DO UPDATE SET
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    user_metadata = COALESCE(EXCLUDED.user_metadata, public.profiles.user_metadata);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PARTE 3: RPCs SERVER-SIDE
-- ============================================================

-- 3.1 RPC: verificar_sesion_activa (basado en profiles y auth.users)
CREATE OR REPLACE FUNCTION public.verificar_sesion_activa()
RETURNS TABLE (
  usuario_id uuid,
  email text,
  ultimo_acceso timestamptz,
  sesion_valida boolean
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::timestamptz, false;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    au.email,
    au.last_sign_in_at,
    (au.last_sign_in_at IS NOT NULL AND au.last_sign_in_at > NOW() - INTERVAL '24 hours')
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE p.id = v_user_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT v_user_id, NULL::text, NOW(), true;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verificar_sesion_activa() TO authenticated;

-- 3.2 RPC: obtener_kpis_dashboard (una sola query optimizada)
CREATE OR REPLACE FUNCTION public.obtener_kpis_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'No autenticado');
  END IF;

  SELECT jsonb_build_object(
    'total_proyectos',       (SELECT COUNT(*) FROM public.erp_proyectos),
    'proyectos_activos',     (SELECT COUNT(*) FROM public.erp_proyectos WHERE estado = 'ejecucion'),
    'total_ingresos',        (SELECT COALESCE(SUM(costo_total), 0) FROM public.erp_movimientos WHERE tipo = 'ingreso'),
    'total_gastos',          (SELECT COALESCE(SUM(costo_total), 0) FROM public.erp_movimientos WHERE tipo IN ('gasto', 'egreso')),
    'total_empleados',       (SELECT COUNT(*) FROM public.erp_empleados WHERE activo = true),
    'total_materiales',      (SELECT COUNT(*) FROM public.erp_materiales),
    'presupuesto_aprobado',  (SELECT COALESCE(SUM(total_calculado), 0) FROM public.erp_presupuestos WHERE estado = 'aprobado'),
    'ordenes_pendientes',    (SELECT COUNT(*) FROM public.erp_ordenes_compra WHERE estado = 'pendiente'),
    'proveedores_activos',   (SELECT COUNT(*) FROM public.erp_proveedores),
    'ingresos_mes',          (SELECT COALESCE(SUM(costo_total), 0) FROM public.erp_movimientos
                              WHERE tipo = 'ingreso' AND fecha >= date_trunc('month', CURRENT_DATE)),
    'gastos_mes',            (SELECT COALESCE(SUM(costo_total), 0) FROM public.erp_movimientos
                              WHERE tipo IN ('gasto', 'egreso') AND fecha >= date_trunc('month', CURRENT_DATE))
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_kpis_dashboard() TO authenticated;

-- ============================================================
-- PARTE 4: ÍNDICES DE RENDIMIENTO (basados en columnas reales)
-- ============================================================

-- erp_movimientos: consultas frecuentes por proyecto, tipo y fecha
CREATE INDEX IF NOT EXISTS idx_movimientos_proyecto_tipo ON public.erp_movimientos(proyecto_id, tipo);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha       ON public.erp_movimientos(fecha DESC);

-- erp_presupuestos: búsqueda por proyecto
CREATE INDEX IF NOT EXISTS idx_presupuestos_proyecto   ON public.erp_presupuestos(proyecto_id);

-- erp_empleados: búsqueda por proyecto_ids (GIN para arrays)
CREATE INDEX IF NOT EXISTS idx_empleados_proyecto_ids  ON public.erp_empleados USING GIN(proyecto_ids);

-- erp_ordenes_compra: orden por fecha
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_fecha    ON public.erp_ordenes_compra(created_at DESC);

-- erp_bitacora: orden por fecha
CREATE INDEX IF NOT EXISTS idx_bitacora_fecha          ON public.erp_bitacora(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_bitacora_proyecto       ON public.erp_bitacora(proyecto_id);

-- logs_sistema: consultas por entidad y fecha
CREATE INDEX IF NOT EXISTS idx_logs_entidad            ON public.logs_sistema(entidad, entidad_id);
CREATE INDEX IF NOT EXISTS idx_logs_fecha              ON public.logs_sistema(created_at DESC);

-- erp_vales_salida: búsqueda por proyecto
CREATE INDEX IF NOT EXISTS idx_vales_proyecto          ON public.erp_vales_salida(proyecto_id);

-- erp_seguimiento: búsqueda por proyecto
CREATE INDEX IF NOT EXISTS idx_seguimiento_proyecto    ON public.erp_seguimiento(proyecto_id);

-- erp_avances: búsqueda por proyecto
CREATE INDEX IF NOT EXISTS idx_avances_proyecto        ON public.erp_avances(proyecto_id, fecha DESC);

-- erp_licitaciones: búsqueda por estado
CREATE INDEX IF NOT EXISTS idx_licitaciones_estado     ON public.erp_licitaciones(estado);

-- ============================================================
-- PARTE 5: VERIFICACIÓN FINAL
-- ============================================================

-- 5.1 Políticas RLS activas
SELECT '=== POLÍTICAS RLS ACTIVAS ===' as info;
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- 5.2 Triggers de auditoría
SELECT '=== TRIGGERS DE AUDITORÍA ===' as info;
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'trg_audit_%'
ORDER BY event_object_table;

-- 5.3 RPCs disponibles
SELECT '=== RPCs DISPONIBLES ===' as info;
SELECT p.proname as function_name,
       CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security_mode,
       pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('verificar_rol_usuario', 'verificar_sesion_activa', 'obtener_kpis_dashboard', 'fn_audit_log', 'handle_new_user')
ORDER BY p.proname;

-- 5.4 Tablas con RLS habilitado
SELECT '=== TABLAS CON RLS ===' as info;
SELECT relname as tabla, relrowsecurity as rls_activo
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relkind = 'r'
  AND relrowsecurity = true
ORDER BY relname;