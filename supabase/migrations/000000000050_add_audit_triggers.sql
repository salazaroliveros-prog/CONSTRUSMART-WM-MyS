-- Migration 050: Add Audit Triggers (idempotent)
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

-- Helper to create trigger only if table exists
DO $$
DECLARE
  _tbl text;
  _tbls text[] := ARRAY[
    'erp_ordenes_compra', 'erp_vales_salida', 'erp_cuentas_cobrar', 'erp_cuentas_pagar',
    'erp_proyectos', 'erp_presupuestos', 'erp_renglones', 'erp_muro', 'erp_muro_likes',
    'erp_no_conformidades', 'erp_incidentes', 'erp_ordenes_cambio',
    'erp_rfis', 'erp_submittals', 'erp_activos', 'erp_materiales'
  ];
  _trg_name text;
BEGIN
  FOREACH _tbl IN ARRAY _tbls LOOP
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = _tbl AND relkind = 'r') THEN
      _trg_name := 'audit_' || _tbl;
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I CASCADE', _trg_name, _tbl);
      EXECUTE format('CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()', _trg_name, _tbl);
    END IF;
  END LOOP;
END $$;

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