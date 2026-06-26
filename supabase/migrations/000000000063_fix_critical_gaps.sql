-- Migration 063: Fix Critical Gaps
-- Purpose: Create missing tables, RPCs, fix naming mismatches
-- Risk: Medium - creates new tables + RPCs, does not modify existing data
-- Rollback: See ROLLBACK section at bottom
-- Expected Benefit: Eliminates runtime errors from missing relations

-- ============================================================
-- Step 1: Create erp_plantillas_proyectos table
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_plantillas_proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipologia TEXT,
  categoria TEXT,
  favorita BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  version_historial JSONB DEFAULT '[]'::jsonb,
  estructura JSONB DEFAULT '{}'::jsonb NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  uso_count INTEGER DEFAULT 0,
  tasa_exito NUMERIC(5,2),
  ultimo_uso TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erp_plantillas_nombre ON erp_plantillas_proyectos(nombre);
CREATE INDEX IF NOT EXISTS idx_erp_plantillas_categoria ON erp_plantillas_proyectos(categoria);
CREATE INDEX IF NOT EXISTS idx_erp_plantillas_favorita ON erp_plantillas_proyectos(favorita) WHERE favorita = TRUE;
CREATE INDEX IF NOT EXISTS idx_erp_plantillas_proyecto_id ON erp_plantillas_proyectos(proyecto_id);

ALTER TABLE erp_plantillas_proyectos ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Usuarios autenticados pueden leer plantillas"
  ON erp_plantillas_proyectos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Usuarios autenticados pueden insertar plantillas"
  ON erp_plantillas_proyectos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Usuarios autenticados pueden actualizar plantillas"
  ON erp_plantillas_proyectos FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Usuarios autenticados pueden eliminar plantillas"
  ON erp_plantillas_proyectos FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- Step 2: Fix erp_error_logs naming mismatch
-- The code references 'erp_error_logs' but table is 'erp_error_log'
-- We create a view + triggers for backward compatibility
-- ============================================================

CREATE OR REPLACE VIEW erp_error_logs AS
  SELECT * FROM erp_error_log;

CREATE OR REPLACE FUNCTION erp_error_logs_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO erp_error_log (
    id, error_code, error_message, error_stack, error_type, severity,
    component, function_name, line_number, user_id, proyecto_id,
    request_id, request_method, request_path, request_params, request_headers,
    user_agent, ip_address, context, resolved, resolved_at, resolved_by,
    resolution_notes, created_at
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()), NEW.error_code, NEW.error_message,
    NEW.error_stack, NEW.error_type, COALESCE(NEW.severity, 'error'),
    NEW.component, NEW.function_name, NEW.line_number, NEW.user_id, NEW.proyecto_id,
    NEW.request_id, NEW.request_method, NEW.request_path, NEW.request_params,
    NEW.request_headers, NEW.user_agent, NEW.ip_address, NEW.context,
    COALESCE(NEW.resolved, FALSE), NEW.resolved_at, NEW.resolved_by,
    NEW.resolution_notes, COALESCE(NEW.created_at, NOW())
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION erp_error_logs_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE erp_error_log SET
    error_code = NEW.error_code,
    error_message = NEW.error_message,
    error_stack = NEW.error_stack,
    error_type = NEW.error_type,
    severity = NEW.severity,
    component = NEW.component,
    function_name = NEW.function_name,
    line_number = NEW.line_number,
    user_id = NEW.user_id,
    proyecto_id = NEW.proyecto_id,
    request_id = NEW.request_id,
    request_method = NEW.request_method,
    request_path = NEW.request_path,
    request_params = NEW.request_params,
    request_headers = NEW.request_headers,
    user_agent = NEW.user_agent,
    ip_address = NEW.ip_address,
    context = NEW.context,
    resolved = NEW.resolved,
    resolved_at = NEW.resolved_at,
    resolved_by = NEW.resolved_by,
    resolution_notes = NEW.resolution_notes
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION erp_error_logs_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM erp_error_log WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_erp_error_logs_insert ON erp_error_logs;
CREATE INSTEAD OF INSERT ON erp_error_logs
  FOR EACH ROW EXECUTE FUNCTION erp_error_logs_insert();

DROP TRIGGER IF EXISTS trg_erp_error_logs_update ON erp_error_logs;
CREATE INSTEAD OF UPDATE ON erp_error_logs
  FOR EACH ROW EXECUTE FUNCTION erp_error_logs_update();

DROP TRIGGER IF EXISTS trg_erp_error_logs_delete ON erp_error_logs;
CREATE INSTEAD OF DELETE ON erp_error_logs
  FOR EACH ROW EXECUTE FUNCTION erp_error_logs_delete();

-- RLS on the view uses the underlying table's RLS
ALTER VIEW erp_error_logs SET (security_barrier = true);

-- ============================================================
-- Step 3: Create exec_sql RPC for admin scripts (SECURITY DEFINER)
-- Restricted to service_role only for safety
-- ============================================================

CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

REVOKE EXECUTE ON FUNCTION exec_sql(TEXT) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION exec_sql(TEXT) FROM public;
-- Only service_role (for scripts) and superadmin can use this
ALTER FUNCTION exec_sql(TEXT) OWNER TO postgres;

COMMENT ON FUNCTION exec_sql(TEXT) IS 'Ejecuta SQL arbitrario (solo service_role/admin). NO llamar desde el frontend.';

-- ============================================================
-- Step 4: Add erp_plantillas_proyectos to realtime publication
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'erp_plantillas_proyectos'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE erp_plantillas_proyectos;
    END IF;
  END IF;
END;
$$;

-- ============================================================
-- Rollback instructions:
--   DROP VIEW IF EXISTS erp_error_logs CASCADE;
--   DROP FUNCTION IF EXISTS erp_error_logs_insert() CASCADE;
--   DROP FUNCTION IF EXISTS erp_error_logs_update() CASCADE;
--   DROP FUNCTION IF EXISTS erp_error_logs_delete() CASCADE;
--   DROP FUNCTION IF EXISTS exec_sql(TEXT) CASCADE;
--   DROP TABLE IF EXISTS erp_plantillas_proyectos CASCADE;
-- ============================================================
