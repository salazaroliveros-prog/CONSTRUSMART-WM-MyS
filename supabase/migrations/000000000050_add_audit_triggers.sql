-- Migration 050: Add Audit Triggers
-- Purpose: Create audit trail for critical table changes
-- Risk: Low - triggers are non-destructive
-- Rollback: Drops triggers and audit tables
-- Expected Benefit: Complete audit trail for compliance and debugging

-- ============================================================
-- Step 1: Create audit table
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_fields TEXT[]
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_erp_audit_log_table_name ON erp_audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_erp_audit_log_record_id ON erp_audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_erp_audit_log_action ON erp_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_erp_audit_log_changed_by ON erp_audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_erp_audit_log_changed_at ON erp_audit_log(changed_at DESC);

-- RLS for audit log
ALTER TABLE erp_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_read_all" ON erp_audit_log
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "audit_log_insert_system" ON erp_audit_log
FOR INSERT TO authenticated
WITH CHECK (true);

-- ============================================================
-- Step 2: Create audit trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO erp_audit_log (table_name, record_id, action, old_data, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), auth.uid());
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO erp_audit_log (table_name, record_id, action, old_data, new_data, changed_by, changed_fields)
    VALUES (
      TG_TABLE_NAME,
      NEW.id,
      'UPDATE',
      row_to_json(OLD),
      row_to_json(NEW),
      auth.uid(),
      array(SELECT key FROM jsonb_object_keys(row_to_json(NEW)::jsonb) WHERE row_to_json(NEW)::jsonb->>key IS DISTINCT FROM row_to_json(OLD)::jsonb->>key)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO erp_audit_log (table_name, record_id, action, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Step 3: Add audit triggers to critical tables
-- ============================================================

-- Financial tables
DROP TRIGGER IF EXISTS audit_erp_ordenes_compra ON erp_ordenes_compra;
CREATE TRIGGER audit_erp_ordenes_compra
AFTER INSERT OR UPDATE OR DELETE ON erp_ordenes_compra
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_erp_vales_salida ON erp_vales_salida;
CREATE TRIGGER audit_erp_vales_salida
AFTER INSERT OR UPDATE OR DELETE ON erp_vales_salida
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_erp_cuentas_cobrar ON erp_cuentas_cobrar;
CREATE TRIGGER audit_erp_cuentas_cobrar
AFTER INSERT OR UPDATE OR DELETE ON erp_cuentas_cobrar
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_erp_cuentas_pagar ON erp_cuentas_pagar;
CREATE TRIGGER audit_erp_cuentas_pagar
AFTER INSERT OR UPDATE OR DELETE ON erp_cuentas_pagar
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Project configuration tables
DROP TRIGGER IF EXISTS audit_erp_proyectos ON erp_proyectos;
CREATE TRIGGER audit_erp_proyectos
AFTER INSERT OR UPDATE OR DELETE ON erp_proyectos
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_erp_presupuestos ON erp_presupuestos;
CREATE TRIGGER audit_erp_presupuestos
AFTER INSERT OR UPDATE OR DELETE ON erp_presupuestos
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_erp_renglones ON erp_renglones;
CREATE TRIGGER audit_erp_renglones
AFTER INSERT OR UPDATE OR DELETE ON erp_renglones
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- User activity tables
DROP TRIGGER IF EXISTS audit_erp_muro ON erp_muro;
CREATE TRIGGER audit_erp_muro
AFTER INSERT OR UPDATE OR DELETE ON erp_muro
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_erp_muro_likes ON erp_muro_likes;
CREATE TRIGGER audit_erp_muro_likes
AFTER INSERT OR UPDATE OR DELETE ON erp_muro_likes
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Quality and safety tables
DROP TRIGGER IF EXISTS audit_erp_no_conformidades ON erp_no_conformidades;
CREATE TRIGGER audit_erp_no_conformidades
AFTER INSERT OR UPDATE OR DELETE ON erp_no_conformidades
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_erp_incidentes ON erp_incidentes;
CREATE TRIGGER audit_erp_incidentes
AFTER INSERT OR UPDATE OR DELETE ON erp_incidentes
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- NOTE: erp_licencias table does not exist in the database
-- DROP TRIGGER IF EXISTS audit_erp_licencias ON erp_licencias;
-- CREATE TRIGGER audit_erp_licencias
-- AFTER INSERT OR UPDATE OR DELETE ON erp_licencias
-- FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Change management tables
DROP TRIGGER IF EXISTS audit_erp_ordenes_cambio ON erp_ordenes_cambio;
CREATE TRIGGER audit_erp_ordenes_cambio
AFTER INSERT OR UPDATE OR DELETE ON erp_ordenes_cambio
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_erp_rfis ON erp_rfis;
CREATE TRIGGER audit_erp_rfis
AFTER INSERT OR UPDATE OR DELETE ON erp_rfis
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_erp_submittals ON erp_submittals;
CREATE TRIGGER audit_erp_submittals
AFTER INSERT OR UPDATE OR DELETE ON erp_submittals
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Inventory tables
DROP TRIGGER IF EXISTS audit_erp_activos ON erp_activos;
CREATE TRIGGER audit_erp_activos
AFTER INSERT OR UPDATE OR DELETE ON erp_activos
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_erp_materiales ON erp_materiales;
CREATE TRIGGER audit_erp_materiales
AFTER INSERT OR UPDATE OR DELETE ON erp_materiales
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================
-- Step 4: Create audit log view for easy querying
-- ============================================================

CREATE OR REPLACE VIEW erp_audit_log_summary AS
SELECT
  al.id,
  al.table_name,
  al.record_id,
  al.action,
  al.changed_at,
  al.changed_by,
  au.email AS changed_by_email,
  al.changed_fields,
  CASE
    WHEN al.action = 'INSERT' THEN al.new_data->>'nombre'
    WHEN al.action = 'UPDATE' THEN COALESCE(al.new_data->>'nombre', al.old_data->>'nombre')
    WHEN al.action = 'DELETE' THEN al.old_data->>'nombre'
    ELSE NULL
  END AS record_name
FROM erp_audit_log al
LEFT JOIN auth.users au ON al.changed_by = au.id
ORDER BY al.changed_at DESC;

-- ============================================================
-- COMPLETADO
-- ============================================================
