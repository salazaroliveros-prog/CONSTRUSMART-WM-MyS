-- =============================================================
-- SCRIPT SQL PARA EJECUTAR EN SUPABASE SQL EDITOR
-- SOLO CAMBIOS NECESARIOS - NO RECREA TABLAS EXISTENTES
-- Basado en el esquema actual de Supabase
-- =============================================================
-- Fecha: 06/03/2026
-- =============================================================

-- =============================================================
-- 1. AGREGAR COLUMNA empresa_id A profiles (si no existe)
-- =============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS empresa_id uuid;

-- =============================================================
-- 2. HABILITAR ROW LEVEL SECURITY EN TODAS LAS TABLAS
-- =============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_eventos_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_bitacora ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_seguimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_renglones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_sub_renglones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_vales_salida ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destajos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cajas_chicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activos_herramientas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuadro_comparativo_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anticipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amortizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas_paquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centros_costo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_insumos_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_rendimientos_cuadrilla ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- 3. POLITICAS RLS PARA profiles
-- =============================================================
-- Los usuarios solo ven su propio perfil (admins ven todos)
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() OR (
      SELECT rol FROM public.profiles WHERE id = auth.uid()
    ) IN ('Administrador', 'Gerente')
  );

-- Solo el propio usuario puede modificar su perfil
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- =============================================================
-- 4. POLITICAS RLS PARA erp_proyectos
-- =============================================================
DROP POLICY IF EXISTS proyectos_select ON public.erp_proyectos;
CREATE POLICY proyectos_select ON public.erp_proyectos
  FOR SELECT TO authenticated
  USING (true);

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

DROP POLICY IF EXISTS proyectos_update ON public.erp_proyectos;
CREATE POLICY proyectos_update ON public.erp_proyectos
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Residente')
    )
  );

DROP POLICY IF EXISTS proyectos_delete ON public.erp_proyectos;
CREATE POLICY proyectos_delete ON public.erp_proyectos
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol = 'Administrador'
    )
  );

-- =============================================================
-- 5. POLITICAS RLS PARA erp_presupuestos
-- =============================================================
DROP POLICY IF EXISTS presupuestos_select ON public.erp_presupuestos;
DROP POLICY IF EXISTS logs_sistema_select ON public.erp_presupuestos;
DROP POLICY IF EXISTS logs_sistema_create ON public.erp_presupuestos;
DROP POLICY IF EXISTS logs_sistema_update ON public.erp_presupuestos;
DROP POLICY IF EXISTS logs_sistema_delete ON public.erp_presupuestos;

CREATE POLICY presupuestos_select ON public.erp_presupuestos
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY presupuestos_insert ON public.erp_presupuestos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente')
    )
  );

CREATE POLICY presupuestos_update ON public.erp_presupuestos
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Residente')
    )
  );

CREATE POLICY presupuestos_delete ON public.erp_presupuestos
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol = 'Administrador'
    )
  );

-- =============================================================
-- 6. POLITICAS RLS PARA erp_materiales
-- =============================================================
DROP POLICY IF EXISTS materiales_select ON public.erp_materiales;
CREATE POLICY materiales_select ON public.erp_materiales
  FOR SELECT TO authenticated
  USING (true);

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

DROP POLICY IF EXISTS materiales_delete ON public.erp_materiales;
CREATE POLICY materiales_delete ON public.erp_materiales
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol = 'Administrador'
    )
  );

-- =============================================================
-- 7. POLITICAS RLS PARA TABLAS DE LECTURA GENERAL
-- (Cualquier authenticated puede leer, escribir segun rol)
-- =============================================================

-- erp_movimientos
DROP POLICY IF EXISTS movimientos_select ON public.erp_movimientos;
CREATE POLICY movimientos_select ON public.erp_movimientos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS movimientos_insert ON public.erp_movimientos;
CREATE POLICY movimientos_insert ON public.erp_movimientos FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS movimientos_delete ON public.erp_movimientos;
CREATE POLICY movimientos_delete ON public.erp_movimientos FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol = 'Administrador')
);

-- erp_empleados
DROP POLICY IF EXISTS empleados_select ON public.erp_empleados;
CREATE POLICY empleados_select ON public.erp_empleados FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS empleados_insert ON public.erp_empleados;
CREATE POLICY empleados_insert ON public.erp_empleados FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS empleados_update ON public.erp_empleados;
CREATE POLICY empleados_update ON public.erp_empleados FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS empleados_delete ON public.erp_empleados;
CREATE POLICY empleados_delete ON public.erp_empleados FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol = 'Administrador')
);

-- erp_ordenes_compra
DROP POLICY IF EXISTS oc_select ON public.erp_ordenes_compra;
CREATE POLICY oc_select ON public.erp_ordenes_compra FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS oc_insert ON public.erp_ordenes_compra;
CREATE POLICY oc_insert ON public.erp_ordenes_compra FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS oc_update ON public.erp_ordenes_compra;
CREATE POLICY oc_update ON public.erp_ordenes_compra FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS oc_delete ON public.erp_ordenes_compra;
CREATE POLICY oc_delete ON public.erp_ordenes_compra FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol = 'Administrador')
);

-- erp_proveedores
DROP POLICY IF EXISTS proveedores_select ON public.erp_proveedores;
CREATE POLICY proveedores_select ON public.erp_proveedores FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS proveedores_insert ON public.erp_proveedores;
CREATE POLICY proveedores_insert ON public.erp_proveedores FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS proveedores_update ON public.erp_proveedores;
CREATE POLICY proveedores_update ON public.erp_proveedores FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS proveedores_delete ON public.erp_proveedores;
CREATE POLICY proveedores_delete ON public.erp_proveedores FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol = 'Administrador')
);

-- erp_eventos_calendario
DROP POLICY IF EXISTS eventos_select ON public.erp_eventos_calendario;
CREATE POLICY eventos_select ON public.erp_eventos_calendario FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS eventos_insert ON public.erp_eventos_calendario;
CREATE POLICY eventos_insert ON public.erp_eventos_calendario FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS eventos_update ON public.erp_eventos_calendario;
CREATE POLICY eventos_update ON public.erp_eventos_calendario FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS eventos_delete ON public.erp_eventos_calendario;
CREATE POLICY eventos_delete ON public.erp_eventos_calendario FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol = 'Administrador')
);

-- erp_bitacora
DROP POLICY IF EXISTS bitacora_select ON public.erp_bitacora;
CREATE POLICY bitacora_select ON public.erp_bitacora FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS bitacora_insert ON public.erp_bitacora;
CREATE POLICY bitacora_insert ON public.erp_bitacora FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS bitacora_update ON public.erp_bitacora;
CREATE POLICY bitacora_update ON public.erp_bitacora FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS bitacora_delete ON public.erp_bitacora;
CREATE POLICY bitacora_delete ON public.erp_bitacora FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol = 'Administrador')
);

-- erp_seguimiento
DROP POLICY IF EXISTS seguimiento_select ON public.erp_seguimiento;
CREATE POLICY seguimiento_select ON public.erp_seguimiento FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS seguimiento_insert ON public.erp_seguimiento;
CREATE POLICY seguimiento_insert ON public.erp_seguimiento FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS seguimiento_update ON public.erp_seguimiento;
CREATE POLICY seguimiento_update ON public.erp_seguimiento FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS seguimiento_delete ON public.erp_seguimiento;
CREATE POLICY seguimiento_delete ON public.erp_seguimiento FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol = 'Administrador')
);

-- erp_renglones
DROP POLICY IF EXISTS renglones_select ON public.erp_renglones;
CREATE POLICY renglones_select ON public.erp_renglones FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS renglones_insert ON public.erp_renglones;
CREATE POLICY renglones_insert ON public.erp_renglones FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS renglones_update ON public.erp_renglones;
CREATE POLICY renglones_update ON public.erp_renglones FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS renglones_delete ON public.erp_renglones;
CREATE POLICY renglones_delete ON public.erp_renglones FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol = 'Administrador')
);

-- erp_insumos
DROP POLICY IF EXISTS insumos_select ON public.erp_insumos;
CREATE POLICY insumos_select ON public.erp_insumos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS insumos_insert ON public.erp_insumos;
CREATE POLICY insumos_insert ON public.erp_insumos FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS insumos_update ON public.erp_insumos;
CREATE POLICY insumos_update ON public.erp_insumos FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS insumos_delete ON public.erp_insumos;
CREATE POLICY insumos_delete ON public.erp_insumos FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol = 'Administrador')
);

-- erp_sub_renglones
DROP POLICY IF EXISTS subrenglones_select ON public.erp_sub_renglones;
CREATE POLICY subrenglones_select ON public.erp_sub_renglones FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS subrenglones_insert ON public.erp_sub_renglones;
CREATE POLICY subrenglones_insert ON public.erp_sub_renglones FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS subrenglones_update ON public.erp_sub_renglones;
CREATE POLICY subrenglones_update ON public.erp_sub_renglones FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS subrenglones_delete ON public.erp_sub_renglones;
CREATE POLICY subrenglones_delete ON public.erp_sub_renglones FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol = 'Administrador')
);

-- erp_vales_salida
DROP POLICY IF EXISTS vales_salida_select ON public.erp_vales_salida;
CREATE POLICY vales_salida_select ON public.erp_vales_salida FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS vales_salida_insert ON public.erp_vales_salida;
CREATE POLICY vales_salida_insert ON public.erp_vales_salida FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS vales_salida_update ON public.erp_vales_salida;
CREATE POLICY vales_salida_update ON public.erp_vales_salida FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS vales_salida_delete ON public.erp_vales_salida;
CREATE POLICY vales_salida_delete ON public.erp_vales_salida FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol = 'Administrador')
);

-- =============================================================
-- 8. POLITICAS RLS PARA logs_sistema
-- Solo Administrador y Gerente pueden ver logs
-- Cualquier authenticated puede insertar logs (para auditoria)
-- =============================================================
DROP POLICY IF EXISTS logs_sistema_insert ON public.logs_sistema;
CREATE POLICY logs_sistema_insert ON public.logs_sistema
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS logs_sistema_select ON public.logs_sistema;
CREATE POLICY logs_sistema_select ON public.logs_sistema
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente')
    )
  );

-- =============================================================
-- 9. FUNCION DE AUDITORIA (CORREGIDA - SECURITY INVOKER)
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_log_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_old_json jsonb;
  v_new_json jsonb;
  v_user_name text;
BEGIN
  SELECT COALESCE(nombre, 'unknown') INTO v_user_name FROM public.profiles WHERE id = auth.uid();

  IF TG_OP = 'UPDATE' THEN
    v_old_json = to_jsonb(OLD);
    v_new_json = to_jsonb(NEW);
    INSERT INTO public.logs_sistema (usuario_id, usuario_nombre, accion, entidad, entidad_id, valores_anteriores, valores_nuevos)
      VALUES (auth.uid(), v_user_name, 'UPDATE', TG_TABLE_NAME, COALESCE(OLD.id::text, NEW.id::text), v_old_json, v_new_json);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_old_json = to_jsonb(OLD);
    INSERT INTO public.logs_sistema (usuario_id, usuario_nombre, accion, entidad, entidad_id, valores_anteriores)
      VALUES (auth.uid(), v_user_name, 'DELETE', TG_TABLE_NAME, OLD.id::text, v_old_json);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- =============================================================
-- 10. RPC FUNCTION: verificar_rol_usuario
-- Usado por src/lib/security.ts para validacion server-side
-- =============================================================
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

REVOKE ALL ON FUNCTION public.verificar_rol_usuario FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verificar_rol_usuario TO authenticated;

-- =============================================================
-- 11. FUNCION: recalcular presupuestos por cambio de precio
-- CORREGIDA - SECURITY INVOKER
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_recalcular_presupuestos_por_insumo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
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
$$;

-- =============================================================
-- 12. CREAR TRIGGER DE AUDITORIA PARA TABLAS PRINCIPALES
-- =============================================================
-- Trigger para erp_presupuestos
DROP TRIGGER IF EXISTS trg_presupuestos_audit ON public.erp_presupuestos;
CREATE TRIGGER trg_presupuestos_audit
  AFTER UPDATE OR DELETE ON public.erp_presupuestos
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_audit();

-- Trigger para erp_proyectos
DROP TRIGGER IF EXISTS trg_proyectos_audit ON public.erp_proyectos;
CREATE TRIGGER trg_proyectos_audit
  AFTER UPDATE OR DELETE ON public.erp_proyectos
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_audit();

-- Trigger para erp_materiales (cambio de precio)
DROP TRIGGER IF EXISTS trg_insumos_recalculo ON public.erp_insumos;
CREATE TRIGGER trg_insumos_recalculo
  AFTER UPDATE OF precio ON public.erp_insumos
  FOR EACH ROW EXECUTE FUNCTION public.fn_recalcular_presupuestos_por_insumo();

-- =============================================================
-- 13. VERIFICACION FINAL
-- =============================================================
-- Ejecutar para verificar que RLS esta activo:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true ORDER BY tablename;