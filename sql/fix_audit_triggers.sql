-- ERP CONSTRUSMART - Auditoría de acciones críticas
-- Ejecutar en Supabase SQL Editor (migración real, sin secrets)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

CREATE POLICY "erp_auditoria_admin_read"
  ON public.erp_auditoria FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente')
  ));

CREATE OR REPLACE FUNCTION public.fn_log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.erp_auditoria (usuario_id, accion, tabla, registro_id, datos)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old', row_to_json(OLD),
      'new', row_to_json(NEW)
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_proyectos ON erp_proyectos;
CREATE TRIGGER trg_audit_proyectos
  AFTER INSERT OR UPDATE OR DELETE ON erp_proyectos
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_audit();

DROP TRIGGER IF EXISTS trg_audit_presupuestos ON erp_presupuestos;
CREATE TRIGGER trg_audit_presupuestos
  AFTER INSERT OR UPDATE OR DELETE ON erp_presupuestos
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_audit();

DROP TRIGGER IF EXISTS trg_audit_movimientos ON erp_movimientos;
CREATE TRIGGER trg_audit_movimientos
  AFTER INSERT OR UPDATE OR DELETE ON erp_movimientos
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_audit();

DROP TRIGGER IF EXISTS trg_audit_materiales ON erp_materiales;
CREATE TRIGGER trg_audit_materiales
  AFTER INSERT OR UPDATE OR DELETE ON erp_materiales
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_audit();

DROP TRIGGER IF EXISTS trg_audit_empleados ON erp_empleados;
CREATE TRIGGER trg_audit_empleados
  AFTER INSERT OR UPDATE OR DELETE ON erp_empleados
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_audit();
