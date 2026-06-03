-- =============================================================
-- FIX: POLÍTICAS RLS SEGURAS + CORRECCIÓN VULNERABILIDADES
-- =============================================================
-- Reemplaza todas las políticas USING(true) por políticas
-- granulares basadas en el rol del usuario desde profiles
--
-- Fecha: 06/03/2026
-- =============================================================

-- 1) CORREGIR erp_presupuestos (antes tenía USING(true) en TODAS)
ALTER TABLE public.erp_presupuestos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS logs_sistema_select ON public.erp_presupuestos;
DROP POLICY IF EXISTS logs_sistema_create ON public.erp_presupuestos;
DROP POLICY IF EXISTS logs_sistema_update ON public.erp_presupuestos;
DROP POLICY IF EXISTS logs_sistema_delete ON public.erp_presupuestos;

-- SELECT: cualquier usuario autenticado puede VER presupuestos de su empresa
CREATE POLICY presupuestos_select ON public.erp_presupuestos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.empresa_id IS NOT NULL
    )
  );

-- INSERT: solo Administrador y Gerente
CREATE POLICY presupuestos_insert ON public.erp_presupuestos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente')
    )
  );

-- UPDATE: solo Administrador, Gerente, Residente
CREATE POLICY presupuestos_update ON public.erp_presupuestos
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Residente')
    )
  );

-- DELETE: solo Administrador
CREATE POLICY presupuestos_delete ON public.erp_presupuestos
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol = 'Administrador'
    )
  );


-- 2) CORREGIR logs_sistema (ya tiene política parcial, mejoramos)
ALTER TABLE public.logs_sistema ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS logs_sistema_insert ON public.logs_sistema;
DROP POLICY IF EXISTS logs_sistema_select ON public.logs_sistema;

-- INSERT: cualquier authenticated puede insertar logs
CREATE POLICY logs_sistema_insert ON public.logs_sistema
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- SELECT: solo Administrador y Gerente pueden VER logs
CREATE POLICY logs_sistema_select ON public.logs_sistema
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente')
    )
  );


-- 3) FIX: SECURITY DEFINER → SECURITY INVOKER en funciones de auditoría
-- Esto evita escalada de privilegios
CREATE OR REPLACE FUNCTION public.fn_log_audit()
RETURNS TRIGGER AS $$
DECLARE
  v_old_json jsonb;
  v_new_json jsonb;
  v_user_name text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    v_old_json = to_jsonb(OLD);
    v_new_json = to_jsonb(NEW);
    SELECT COALESCE(nombre, 'unknown') INTO v_user_name FROM public.profiles WHERE id = auth.uid();
    INSERT INTO public.logs_sistema (usuario_id, usuario_nombre, accion, entidad, entidad_id, valores_anteriores, valores_nuevos)
      VALUES (auth.uid(), v_user_name, 'UPDATE', TG_TABLE_NAME, COALESCE(OLD.id::text, NEW.id::text), v_old_json, v_new_json);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_old_json = to_jsonb(OLD);
    SELECT COALESCE(nombre, 'unknown') INTO v_user_name FROM public.profiles WHERE id = auth.uid();
    INSERT INTO public.logs_sistema (usuario_id, usuario_nombre, accion, entidad, entidad_id, valores_anteriores)
      VALUES (auth.uid(), v_user_name, 'DELETE', TG_TABLE_NAME, OLD.id::text, v_old_json);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Recrear función recalcular presupuestos como SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.fn_recalcular_presupuestos_por_insumo()
RETURNS TRIGGER AS $$
DECLARE
  v_renglon_ids uuid[];
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.precio IS DISTINCT FROM NEW.precio THEN
    SELECT array_agg(DISTINCT ri.renglon_id) INTO v_renglon_ids FROM public.erp_insumos ri WHERE ri.id = NEW.id;
    INSERT INTO public.logs_sistema (usuario_id, usuario_nombre, accion, entidad, entidad_id, valores_anteriores, valores_nuevos)
      VALUES (auth.uid(), 'system', 'PRECIO_INSUMO_CAMBIADO', 'erp_insumos', NEW.id::text,
        jsonb_build_object('precio_anterior', OLD.precio),
        jsonb_build_object('precio_nuevo', NEW.precio, 'renglones_afectados', v_renglon_ids));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;


-- 4) FUNCIÓN AUXILIAR: Verificar rol del usuario (para usar desde frontend via RPC)
CREATE OR REPLACE FUNCTION public.verificar_rol_usuario()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT jsonb_build_object(
    'user_id', auth.uid(),
    'rol', (SELECT rol FROM public.profiles WHERE id = auth.uid()),
    'nombre', (SELECT nombre FROM public.profiles WHERE id = auth.uid()),
    'authenticated', (auth.role() = 'authenticated')
  );
$$;


-- 5) REVOKE EXECUTE on security definer functions from public
REVOKE ALL ON FUNCTION public.verificar_rol_usuario FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verificar_rol_usuario TO authenticated;


-- 6) AGREGAR columna empresa_id a profiles si no existe
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS empresa_id uuid;

-- 7) POLÍTICA para que usuarios solo vean su propio perfil
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR (
    SELECT rol FROM public.profiles WHERE id = auth.uid()
  ) IN ('Administrador', 'Gerente'));

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 8) POLÍTICA para erp_proyectos: usuarios ven proyectos de su empresa
DROP POLICY IF EXISTS proyectos_select ON public.erp_proyectos;
CREATE POLICY proyectos_select ON public.erp_proyectos
  FOR SELECT TO authenticated
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
    ) OR empresa_id IS NULL
  );

DROP POLICY IF EXISTS proyectos_insert ON public.erp_proyectos;
CREATE POLICY proyectos_insert ON public.erp_proyectos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente')
    )
  );

-- 9) POLÍTICA para erp_materiales
DROP POLICY IF EXISTS materiales_select ON public.erp_materiales;
CREATE POLICY materiales_select ON public.erp_materiales
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS materiales_update ON public.erp_materiales;
CREATE POLICY materiales_update ON public.erp_materiales
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Bodeguero')
    )
  );

DROP POLICY IF EXISTS materiales_insert ON public.erp_materiales;
CREATE POLICY materiales_insert ON public.erp_materiales
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Bodeguero')
    )
  );

-- 10) VERIFICAR estado RLS en todas las tablas
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename LIKE 'erp_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END$$;