-- CONSTRUSMART ERP - Delta de seguridad y esquema
-- Objetivo: llevar la base actual al estado requerido por la app.
-- Ejecutar en Supabase SQL Editor en el orden indicado.

-- ============================================================
-- 1) Políticas RLS unificadas
--    Se borran políticas previas (si existen) para evitar conflictos.
-- ============================================================

-- PROFILES
DROP POLICY IF EXISTS "profiles_read_self_admin_gerente" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_read_self_admin_gerente"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.rol IN ('Administrador','Gerente'))
  );
CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- ERP_PROYECTOS
DROP POLICY IF EXISTS "erp_proyectos_select" ON erp_proyectos;
DROP POLICY IF EXISTS "erp_proyectos_insert" ON erp_proyectos;
DROP POLICY IF EXISTS "erp_proyectos_update" ON erp_proyectos;
DROP POLICY IF EXISTS "erp_proyectos_delete" ON erp_proyectos;
CREATE POLICY "erp_proyectos_select"
  ON erp_proyectos FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero'))
    OR auth.uid() = created_by
  );
CREATE POLICY "erp_proyectos_insert"
  ON erp_proyectos FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Residente'))
  );
CREATE POLICY "erp_proyectos_update"
  ON erp_proyectos FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Residente'))
  );
CREATE POLICY "erp_proyectos_delete"
  ON erp_proyectos FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente'))
  );

-- ERP_MOVIMIENTOS
DROP POLICY IF EXISTS "erp_movimientos_select" ON erp_movimientos;
DROP POLICY IF EXISTS "erp_movimientos_write" ON erp_movimientos;
CREATE POLICY "erp_movimientos_select"
  ON erp_movimientos FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero'))
    OR auth.uid() = created_by
  );
CREATE POLICY "erp_movimientos_write"
  ON erp_movimientos FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Residente'))
  );

-- ERP_EMPLEADOS
DROP POLICY IF EXISTS "erp_empleados_select" ON erp_empleados;
DROP POLICY IF EXISTS "erp_empleados_write" ON erp_empleados;
CREATE POLICY "erp_empleados_select"
  ON erp_empleados FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Residente'))
    OR auth.uid() = created_by
  );
CREATE POLICY "erp_empleados_write"
  ON erp_empleados FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Residente'))
  );

-- ERP_MATERIALES
DROP POLICY IF EXISTS "erp_materiales_select" ON erp_materiales;
DROP POLICY IF EXISTS "erp_materiales_write" ON erp_materiales;
CREATE POLICY "erp_materiales_select"
  ON erp_materiales FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero'))
    OR auth.uid() = created_by
  );
CREATE POLICY "erp_materiales_write"
  ON erp_materiales FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero'))
  );

-- ERP_ORDENES_COMPRA
DROP POLICY IF EXISTS "erp_ordenes_compra_select" ON erp_ordenes_compra;
DROP POLICY IF EXISTS "erp_ordenes_compra_write" ON erp_ordenes_compra;
CREATE POLICY "erp_ordenes_compra_select"
  ON erp_ordenes_compra FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero'))
    OR auth.uid() = created_by
  );
CREATE POLICY "erp_ordenes_compra_write"
  ON erp_ordenes_compra FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Compras'))
  );

-- ERP_PROVEEDORES
DROP POLICY IF EXISTS "erp_proveedores_select" ON erp_proveedores;
DROP POLICY IF EXISTS "erp_proveedores_write" ON erp_proveedores;
CREATE POLICY "erp_proveedores_select"
  ON erp_proveedores FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero'))
  );
CREATE POLICY "erp_proveedores_write"
  ON erp_proveedores FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Compras'))
  );

-- ERP_EVENTOS_CALENDARIO
DROP POLICY IF EXISTS "erp_eventos_calendario_select" ON erp_eventos_calendario;
DROP POLICY IF EXISTS "erp_eventos_calendario_write" ON erp_eventos_calendario;
CREATE POLICY "erp_eventos_calendario_select"
  ON erp_eventos_calendario FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Residente'))
    OR auth.uid() = created_by
  );
CREATE POLICY "erp_eventos_calendario_write"
  ON erp_eventos_calendario FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Residente'))
  );

-- ERP_BITACORA
DROP POLICY IF EXISTS "erp_bitacora_select" ON erp_bitacora;
DROP POLICY IF EXISTS "erp_bitacora_write" ON erp_bitacora;
CREATE POLICY "erp_bitacora_select"
  ON erp_bitacora FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Residente'))
    OR auth.uid() = created_by
  );
CREATE POLICY "erp_bitacora_write"
  ON erp_bitacora FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Residente'))
  );

-- ERP_SEGUIMIENTO
DROP POLICY IF EXISTS "erp_seguimiento_select" ON erp_seguimiento;
DROP POLICY IF EXISTS "erp_seguimiento_write" ON erp_seguimiento;
CREATE POLICY "erp_seguimiento_select"
  ON erp_seguimiento FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente'))
  );
CREATE POLICY "erp_seguimiento_write"
  ON erp_seguimiento FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente'))
  );

-- ERP_RENGLONES / ERP_INSUMOS / ERP_SUB_RENGLONES
DROP POLICY IF EXISTS "erp_renglones_select" ON erp_renglones;
DROP POLICY IF EXISTS "erp_renglones_write" ON erp_renglones;
DROP POLICY IF EXISTS "erp_insumos_select" ON erp_insumos;
DROP POLICY IF EXISTS "erp_insumos_write" ON erp_insumos;
DROP POLICY IF EXISTS "erp_sub_renglones_select" ON erp_sub_renglones;
DROP POLICY IF EXISTS "erp_sub_renglones_write" ON erp_sub_renglones;
CREATE POLICY "erp_renglones_select"
  ON erp_renglones FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Residente'))
    OR auth.uid() = created_by
  );
CREATE POLICY "erp_renglones_write"
  ON erp_renglones FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Residente'))
  );
CREATE POLICY "erp_insumos_select"
  ON erp_insumos FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero'))
  );
CREATE POLICY "erp_insumos_write"
  ON erp_insumos FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Residente'))
  );
CREATE POLICY "erp_sub_renglones_select"
  ON erp_sub_renglones FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero'))
  );
CREATE POLICY "erp_sub_renglones_write"
  ON erp_sub_renglones FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Residente'))
  );

-- ERP_PRESUPUESTOS (antes RLS rota)
DROP POLICY IF EXISTS "erp_presupuestos_select" ON erp_presupuestos;
DROP POLICY IF EXISTS "erp_presupuestos_write" ON erp_presupuestos;
CREATE POLICY "erp_presupuestos_select"
  ON erp_presupuestos FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero'))
  );
CREATE POLICY "erp_presupuestos_write"
  ON erp_presupuestos FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente','Residente'))
  );

-- LOGS_SISTEMA
DROP POLICY IF EXISTS "logs_sistema_select" ON logs_sistema;
DROP POLICY IF EXISTS "logs_sistema_insert" ON logs_sistema;
CREATE POLICY "logs_sistema_select"
  ON logs_sistema FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente'))
  );
CREATE POLICY "logs_sistema_insert"
  ON logs_sistema FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================
-- 2) Modificaciones de esquema mínimo (solo lo que falta)
-- ============================================================

-- profiles: columnas adicionales presentes en el esquema actual
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS empresa_id uuid;

-- erp_proyectos: columna faltante
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS presupuesto_actual_id uuid;

-- erp_proyectos: incluir 'pausado' en CHECK de estado si no existe
ALTER TABLE erp_proyectos DROP CONSTRAINT IF EXISTS erp_proyectos_estado_check;
ALTER TABLE erp_proyectos ADD CONSTRAINT erp_proyectos_estado_check
  CHECK (estado = ANY (ARRAY['planeacion','ejecucion','pausado','finalizado']));

-- erp_ordenes_compra: columna faltante
ALTER TABLE erp_ordenes_compra ADD COLUMN IF NOT EXISTS proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL;

-- erp_proveedores: columnas faltantes
ALTER TABLE erp_proveedores ADD COLUMN IF NOT EXISTS telefono text;
ALTER TABLE erp_proveedores ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE erp_proveedores ADD COLUMN IF NOT EXISTS categoria text;

-- erp_empleados: ampliar tipos permitidos si hace falta
ALTER TABLE erp_empleados DROP CONSTRAINT IF EXISTS erp_empleados_tipo_check;
ALTER TABLE erp_empleados ADD CONSTRAINT erp_empleados_tipo_check
  CHECK (tipo = ANY (ARRAY['planilla','destajo','administrativo','operativo']));

-- erp_movimientos: incluir 'egreso' y categorías extendidas
ALTER TABLE erp_movimientos DROP CONSTRAINT IF EXISTS erp_movimientos_tipo_check;
ALTER TABLE erp_movimientos ADD CONSTRAINT erp_movimientos_tipo_check
  CHECK (tipo = ANY (ARRAY['ingreso','gasto','egreso']));
ALTER TABLE erp_movimientos DROP CONSTRAINT IF EXISTS erp_movimientos_categoria_check;
ALTER TABLE erp_movimientos ADD CONSTRAINT erp_movimientos_categoria_check
  CHECK (categoria = ANY (ARRAY[
    'materiales','mano_obra','equipo','subcontrato',
    'administracion','transporte','imprevistos','marketing',
    'licencias','seguros','otros'
  ]));

-- erp_ordenes_compra: incluir estados extendidos
ALTER TABLE erp_ordenes_compra DROP CONSTRAINT IF EXISTS erp_ordenes_compra_estado_check;
ALTER TABLE erp_ordenes_compra ADD CONSTRAINT erp_ordenes_compra_estado_check
  CHECK (estado = ANY (ARRAY['borrador','pendiente','aprobado','rechazado','recibida','cancelada']));

-- erp_eventos_calendario: compatibilizar valores existentes
ALTER TABLE erp_eventos_calendario DROP CONSTRAINT IF EXISTS erp_eventos_calendario_tipo_check;
ALTER TABLE erp_eventos_calendario ADD CONSTRAINT erp_eventos_calendario_tipo_check
  CHECK (tipo = ANY (ARRAY['Recordatorio','Actividad','Reunión','Visita','reunion','inspeccion','entrega','pago','otros']));

-- ============================================================
-- 3) Auditoría server-side
-- ============================================================

CREATE TABLE IF NOT EXISTS public.erp_auditoria (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accion text NOT NULL,
  tabla text NOT NULL,
  registro_id uuid,
  datos jsonb,
  ip text,
  user_agent text,
  creado_en timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.erp_auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "erp_auditoria_select"
  ON public.erp_auditoria FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente'))
  );

-- Triggers de auditoría (idempotentes)
DROP TRIGGER IF EXISTS trg_audit_proyectos ON erp_proyectos;
DROP TRIGGER IF EXISTS trg_audit_presupuestos ON erp_presupuestos;
DROP TRIGGER IF EXISTS trg_audit_movimientos ON erp_movimientos;
DROP TRIGGER IF EXISTS trg_audit_materiales ON erp_materiales;
DROP TRIGGER IF EXISTS trg_audit_empleados ON erp_empleados;

CREATE OR REPLACE FUNCTION public.fn_log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.erp_auditoria (usuario_id, accion, tabla, registro_id, datos)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_proyectos
  AFTER INSERT OR UPDATE OR DELETE ON erp_proyectos
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_audit();
CREATE TRIGGER trg_audit_presupuestos
  AFTER INSERT OR UPDATE OR DELETE ON erp_presupuestos
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_audit();
CREATE TRIGGER trg_audit_movimientos
  AFTER INSERT OR UPDATE OR DELETE ON erp_movimientos
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_audit();
CREATE TRIGGER trg_audit_materiales
  AFTER INSERT OR UPDATE OR DELETE ON erp_materiales
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_audit();
CREATE TRIGGER trg_audit_empleados
  AFTER INSERT OR UPDATE OR DELETE ON erp_empleados
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_audit();
