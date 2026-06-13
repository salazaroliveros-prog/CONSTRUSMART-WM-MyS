-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 23: RLS Consolidado
-- Fecha: 2026-06-13
--
-- Reemplaza las migraciones 001-022 con políticas unificadas.
-- Ejecutar en producción después de 022 (proyecto_miembros_rls)
-- ============================================================

-- ============================================================
-- 1. FUNCIÓN AUXILIAR: get_current_user_role()
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
BEGIN
  SELECT rol FROM public.erp_usuarios WHERE id = auth.uid() INTO _role;
  RETURN COALESCE(_role, 'Residente');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;

-- ============================================================
-- 2. FUNCIÓN AUXILIAR: get_accessible_proyectos()
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_accessible_proyectos()
RETURNS TABLE(id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id FROM public.erp_proyectos p
  WHERE public.get_current_user_role() = 'Administrador'
  UNION ALL
  SELECT p.id FROM public.erp_proyectos p
  WHERE public.get_current_user_role() IN ('Gerente', 'Residente', 'Compras', 'Bodeguero')
    AND p.created_by = auth.uid()
  UNION ALL
  SELECT e.proyecto_id FROM public.erp_empleados e
  WHERE public.get_current_user_role() = 'Residente'
    AND e.created_by = auth.uid()
  UNION ALL
  SELECT pm.proyecto_id FROM public.erp_proyecto_miembros pm
  WHERE pm.user_id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_accessible_proyectos() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_accessible_proyectos() TO authenticated;

-- ============================================================
-- 3. TABLA: erp_usuarios (si no existe)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.erp_usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  nombre text,
  rol text NOT NULL DEFAULT 'Residente' CHECK (rol = ANY (ARRAY['Administrador','Gerente','Residente','Compras','Bodeguero'])),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios_self_read" ON public.erp_usuarios;
CREATE POLICY "usuarios_self_read" ON public.erp_usuarios
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "usuarios_admin_manage" ON public.erp_usuarios;
CREATE POLICY "usuarios_admin_manage" ON public.erp_usuarios
  FOR ALL TO authenticated
  USING (public.get_current_user_role() = 'Administrador')
  WITH CHECK (public.get_current_user_role() = 'Administrador');

-- ============================================================
-- 4. TABLA: erp_proyecto_miembros (si no existe)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.erp_proyecto_miembros (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol text NOT NULL DEFAULT 'lectura' CHECK (rol = ANY (ARRAY['lectura','escritura','admin_proyecto'])),
  Assignado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(proyecto_id, user_id)
);

ALTER TABLE public.erp_proyecto_miembros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_miembros" ON public.erp_proyecto_miembros;
CREATE POLICY "admin_manage_miembros" ON public.erp_proyecto_miembros
  FOR ALL TO authenticated
  USING (public.get_current_user_role() = 'Administrador')
  WITH CHECK (public.get_current_user_role() = 'Administrador');

DROP POLICY IF EXISTS "self_read_miembro" ON public.erp_proyecto_miembros;
CREATE POLICY "self_read_miembro" ON public.erp_proyecto_miembros
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 5. RPC: asignar_miembro_proyecto
-- ============================================================
CREATE OR REPLACE FUNCTION public.asignar_miembro_proyecto(
  p_proyecto_id uuid,
  p_user_id uuid,
  p_rol text DEFAULT 'lectura'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.get_current_user_role() != 'Administrador' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo Administrador puede asignar miembros');
  END IF;
  INSERT INTO public.erp_proyecto_miembros (proyecto_id, user_id, rol, asignado_por)
  VALUES (p_proyecto_id, p_user_id, p_rol, auth.uid())
  ON CONFLICT (proyecto_id, user_id)
  DO UPDATE SET rol = p_rol, asignado_por = auth.uid();
  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.asignar_miembro_proyecto TO authenticated;

-- ============================================================
-- 6. RPC: remover_miembro_proyecto
-- ============================================================
CREATE OR REPLACE FUNCTION public.remover_miembro_proyecto(
  p_proyecto_id uuid,
  p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.get_current_user_role() != 'Administrador' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo Administrador puede remover miembros');
  END IF;
  DELETE FROM public.erp_proyecto_miembros WHERE proyecto_id = p_proyecto_id AND user_id = p_user_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.remover_miembro_proyecto TO authenticated;

-- ============================================================
-- 7. RPC: descontar_stock_vale (atomicidad con SELECT ... FOR UPDATE)
-- ============================================================
CREATE OR REPLACE FUNCTION public.descontar_stock_vale(
  p_items JSONB,
  p_vale_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_material_id UUID;
  v_cantidad NUMERIC;
  v_stock_actual NUMERIC;
  v_result JSONB;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_material_id := (v_item->>'materialId')::UUID;
    v_cantidad := (v_item->>'cantidad')::NUMERIC;
    IF v_material_id IS NULL OR v_cantidad IS NULL THEN
      RAISE EXCEPTION 'Item inválido: materialId o cantidad faltante';
    END IF;
    SELECT stock INTO v_stock_actual FROM erp_materiales WHERE id = v_material_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Material no encontrado: %', v_material_id; END IF;
    IF v_stock_actual < v_cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente para material %: disponible %, requerido %', v_material_id, v_stock_actual, v_cantidad;
    END IF;
    UPDATE erp_materiales SET stock = stock - v_cantidad, updated_at = now() WHERE id = v_material_id;
  END LOOP;
  v_result := jsonb_build_object('success', true, 'message', 'Stock descontado exitosamente');
  IF p_vale_id IS NOT NULL THEN v_result := v_result || jsonb_build_object('valeId', p_vale_id); END IF;
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'detail', COALESCE(SQLSTATE, ''));
END;
$$;

GRANT EXECUTE ON FUNCTION public.descontar_stock_vale TO authenticated;

-- ============================================================
-- 8. RPC: incrementar_stock_oc (atomicidad con SELECT ... FOR UPDATE)
-- ============================================================
CREATE OR REPLACE FUNCTION public.incrementar_stock_oc(
  p_items JSONB,
  p_oc_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_material_id UUID;
  v_cantidad NUMERIC;
  v_result JSONB;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_material_id := (v_item->>'materialId')::UUID;
    v_cantidad := (v_item->>'cantidad')::NUMERIC;
    IF v_material_id IS NULL OR v_cantidad IS NULL THEN
      RAISE EXCEPTION 'Item inválido: materialId o cantidad faltante';
    END IF;
    PERFORM FROM erp_materiales WHERE id = v_material_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Material no encontrado: %', v_material_id; END IF;
    UPDATE erp_materiales SET stock = stock + v_cantidad, updated_at = now() WHERE id = v_material_id;
  END LOOP;
  v_result := jsonb_build_object('success', true, 'message', 'Stock incrementado exitosamente');
  IF p_oc_id IS NOT NULL THEN v_result := v_result || jsonb_build_object('ocId', p_oc_id); END IF;
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'detail', COALESCE(SQLSTATE, ''));
END;
$$;

GRANT EXECUTE ON FUNCTION public.incrementar_stock_oc TO authenticated;

-- ============================================================
-- 9. RPC: verificar_stock_vale
-- ============================================================
CREATE OR REPLACE FUNCTION public.verificar_stock_vale(
  p_items JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_material_id UUID;
  v_cantidad NUMERIC;
  v_stock_actual NUMERIC;
  v_insuficientes JSONB := '[]'::JSONB;
  v_result JSONB;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_material_id := (v_item->>'materialId')::UUID;
    v_cantidad := (v_item->>'cantidad')::NUMERIC;
    SELECT stock INTO v_stock_actual FROM erp_materiales WHERE id = v_material_id;
    IF v_stock_actual < v_cantidad THEN
      v_insuficientes := v_insuficientes || jsonb_build_object('materialId', v_material_id, 'disponible', v_stock_actual, 'requerido', v_cantidad);
    END IF;
  END LOOP;
  v_result := jsonb_build_object('success', jsonb_array_length(v_insuficientes) = 0, 'insuficientes', v_insuficientes);
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verificar_stock_vale TO authenticated;

-- ============================================================
-- 10. RPC: append_comentario_muro (para JSONB array)
-- ============================================================
DROP FUNCTION IF EXISTS public.append_comentario_muro(uuid, jsonb) CASCADE;
CREATE FUNCTION public.append_comentario_muro(
  p_publicacion_id uuid,
  p_comentario jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE erp_publicaciones_muro
  SET comentarios = array_append(COALESCE(comentarios, '{}'), p_comentario)
  WHERE id = p_publicacion_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.append_comentario_muro TO authenticated;

-- ============================================================
-- 11. RPC: increment_likes_muro
-- ============================================================
DROP FUNCTION IF EXISTS public.increment_likes_muro(uuid) CASCADE;
CREATE FUNCTION public.increment_likes_muro(
  p_publicacion_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE erp_publicaciones_muro SET likes = COALESCE(likes, 0) + 1 WHERE id = p_publicacion_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_likes_muro TO authenticated;

-- ============================================================
-- 12. RLS POLICIES: erp_proyectos
-- ============================================================
ALTER TABLE public.erp_proyectos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "proyectos_access" ON public.erp_proyectos;
CREATE POLICY "proyectos_access" ON public.erp_proyectos
  FOR SELECT TO authenticated
  USING (public.get_current_user_role() = 'Administrador'
    OR created_by = auth.uid()
    OR id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))));

DROP POLICY IF EXISTS "proyectos_insert" ON public.erp_proyectos;
CREATE POLICY "proyectos_insert" ON public.erp_proyectos
  FOR INSERT TO authenticated
  WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));

DROP POLICY IF EXISTS "proyectos_update" ON public.erp_proyectos;
CREATE POLICY "proyectos_update" ON public.erp_proyectos
  FOR UPDATE TO authenticated
  USING (public.get_current_user_role() IN ('Administrador','Gerente','Residente')
    AND id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))))
  WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Residente')
    AND id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))));

DROP POLICY IF EXISTS "proyectos_delete" ON public.erp_proyectos;
CREATE POLICY "proyectos_delete" ON public.erp_proyectos
  FOR DELETE TO authenticated
  USING (public.get_current_user_role() = 'Administrador'
    AND id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))));

-- ============================================================
-- 13. RLS POLICIES: Todas las tablas por proyecto
-- Pattern: SELECT por proyecto_id IN (get_accessible_proyectos())
-- ============================================================

-- Helper: apply RLS policy for tables WITH proyecto_id column
DO $$
DECLARE
  _table text;
  _tables_proyecto_id text[] := ARRAY[
    'erp_movimientos', 'erp_ordenes_compra', 'erp_presupuestos', 'erp_avances',
    'erp_cuentas_cobrar', 'erp_cuentas_pagar', 'erp_ordenes_cambio',
    'erp_hitos', 'erp_riesgos', 'erp_licitaciones', 'erp_cotizaciones_negocio',
    'erp_vales_salida', 'erp_no_conformidades', 'erp_incidentes',
    'erp_publicaciones_muro', 'erp_planos', 'erp_rfis', 'erp_submittals',
    'erp_activos', 'erp_bitacora', 'erp_eventos_calendario',
    'erp_seguimiento', 'erp_liberaciones_partida', 'erp_notificaciones',
    'erp_pruebas'
  ];
BEGIN
  FOREACH _table IN ARRAY _tables_proyecto_id
  LOOP
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = _table AND table_type = 'BASE TABLE')
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = _table AND column_name = 'proyecto_id') THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', _table);

      EXECUTE format('DROP POLICY IF EXISTS "%s_access" ON public.%I', _table, _table);
      EXECUTE format('CREATE POLICY "%s_access" ON public.%I FOR SELECT TO authenticated
        USING (public.get_current_user_role() = ''Administrador'' OR created_by = auth.uid()
        OR proyecto_id IN (SELECT * FROM public.get_accessible_proyectos()))',
        _table, _table);

      EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON public.%I', _table, _table);
      EXECUTE format('CREATE POLICY "%s_insert" ON public.%I FOR INSERT TO authenticated
        WITH CHECK (public.get_current_user_role() IN (''Administrador'',''Gerente'',''Residente'',''Compras'',''Bodeguero'')
        OR proyecto_id IN (SELECT * FROM public.get_accessible_proyectos()))',
        _table, _table);

      EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON public.%I', _table, _table);
      EXECUTE format('CREATE POLICY "%s_update" ON public.%I FOR UPDATE TO authenticated
        USING (public.get_current_user_role() IN (''Administrador'',''Gerente'',''Residente'',''Compras'',''Bodeguero'')
        OR proyecto_id IN (SELECT * FROM public.get_accessible_proyectos()))',
        _table, _table);

      EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON public.%I', _table, _table);
      EXECUTE format('CREATE POLICY "%s_delete" ON public.%I FOR DELETE TO authenticated
        USING (public.get_current_user_role() = ''Administrador''
        OR proyecto_id IN (SELECT * FROM public.get_accessible_proyectos()))',
        _table, _table);
    END IF;
  END LOOP;
END $$;

-- Helper: apply RLS policy for tables WITHOUT proyecto_id (role-based)
DO $$
DECLARE
  _table text;
  _tables_no_proyecto text[] := ARRAY[
    'erp_materiales', 'erp_empleados'
  ];
BEGIN
  FOREACH _table IN ARRAY _tables_no_proyecto
  LOOP
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = _table AND table_type = 'BASE TABLE') THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', _table);

      EXECUTE format('DROP POLICY IF EXISTS "%s_access" ON public.%I', _table, _table);
      EXECUTE format('CREATE POLICY "%s_access" ON public.%I FOR SELECT TO authenticated
        USING (public.get_current_user_role() IN (''Administrador'',''Gerente'',''Residente'',''Compras'',''Bodeguero''))',
        _table, _table);

      EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON public.%I', _table, _table);
      EXECUTE format('CREATE POLICY "%s_insert" ON public.%I FOR INSERT TO authenticated
        WITH CHECK (public.get_current_user_role() IN (''Administrador'',''Gerente'',''Residente'',''Compras'',''Bodeguero''))',
        _table, _table);

      EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON public.%I', _table, _table);
      EXECUTE format('CREATE POLICY "%s_update" ON public.%I FOR UPDATE TO authenticated
        USING (public.get_current_user_role() IN (''Administrador'',''Gerente'',''Residente'',''Compras'',''Bodeguero''))',
        _table, _table);

      EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON public.%I', _table, _table);
      EXECUTE format('CREATE POLICY "%s_delete" ON public.%I FOR DELETE TO authenticated
        USING (public.get_current_user_role() = ''Administrador'')',
        _table, _table);
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 14. RLS POLICIES: Tablas sin proyecto_id (proveedores, etc.)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'erp_proveedores' AND table_type = 'BASE TABLE') THEN
    ALTER TABLE public.erp_proveedores ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "proveedores_access" ON public.erp_proveedores;
    CREATE POLICY "proveedores_access" ON public.erp_proveedores
      FOR ALL TO authenticated
      USING (public.get_current_user_role() IN ('Administrador','Gerente','Compras','Residente'));
  END IF;
END $$;

-- ============================================================
-- 15. FALLBACK: Si tabla no existe, crear vacía con RLS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.erp_empresas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  nit text,
  telefono text,
  email text,
  direccion text,
  ciudad text,
  pais text DEFAULT 'Guatemala',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.erp_empresas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "empresas_access" ON public.erp_empresas;
CREATE POLICY "empresas_access" ON public.erp_empresas
  FOR ALL TO authenticated
  USING (public.get_current_user_role() = 'Administrador');

-- ============================================================
-- 16. ENABLE REALTIME para tablas principales
-- ============================================================
DO $$
DECLARE
  _tbl text;
  _tables text[] := ARRAY[
    'erp_proyectos', 'erp_materiales', 'erp_ordenes_compra', 'erp_presupuestos',
    'erp_hitos', 'erp_riesgos', 'erp_avances', 'erp_vales_salida',
    'erp_cotizaciones_negocio', 'erp_notificaciones'
  ];
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH _tbl IN ARRAY _tables
    LOOP
      IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = _tbl AND table_type = 'BASE TABLE') THEN
        BEGIN
          EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', _tbl);
        EXCEPTION WHEN duplicate_object THEN
          NULL;
        END;
      END IF;
    END LOOP;
  END IF;
END $$;
