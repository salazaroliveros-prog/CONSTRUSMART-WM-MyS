-- Migration 053: Error Logging Table
-- Purpose: Create centralized error logging for monitoring and debugging
-- Risk: Low - table is non-destructive
-- Rollback: Drops error logging table and related objects
-- Expected Benefit: Better error tracking, debugging, and monitoring

-- ============================================================
-- Step 1: Create error log table
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_error_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_code TEXT,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_type TEXT CHECK (error_type IN ('client', 'server', 'database', 'network', 'validation', 'auth', 'permission', 'other')),
  severity TEXT CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')) DEFAULT 'error',
  component TEXT,
  function_name TEXT,
  line_number INTEGER,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  proyecto_id UUID REFERENCES erp_proyectos(id) ON DELETE SET NULL,
  request_id TEXT,
  request_method TEXT,
  request_path TEXT,
  request_params JSONB,
  request_headers JSONB,
  user_agent TEXT,
  ip_address TEXT,
  context JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Step 2: Create indexes for error log queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_erp_error_log_error_code ON erp_error_log(error_code);
CREATE INDEX IF NOT EXISTS idx_erp_error_log_error_type ON erp_error_log(error_type);
CREATE INDEX IF NOT EXISTS idx_erp_error_log_severity ON erp_error_log(severity);
CREATE INDEX IF NOT EXISTS idx_erp_error_log_component ON erp_error_log(component);
CREATE INDEX IF NOT EXISTS idx_erp_error_log_user_id ON erp_error_log(user_id);
CREATE INDEX IF NOT EXISTS idx_erp_error_log_proyecto_id ON erp_error_log(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_error_log_created_at ON erp_error_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_erp_error_log_resolved ON erp_error_log(resolved);
CREATE INDEX IF NOT EXISTS idx_erp_error_log_request_id ON erp_error_log(request_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_erp_error_log_severity_created ON erp_error_log(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_erp_error_log_proyecto_created ON erp_error_log(proyecto_id, created_at DESC);

-- ============================================================
-- Step 3: Enable RLS and create policies
-- ============================================================

ALTER TABLE erp_error_log ENABLE ROW LEVEL SECURITY;

-- Admin can see all errors
-- NOTE: erp_proyecto_miembros uses user_id, not usuario_id
CREATE POLICY "error_log_admin_read_all" ON erp_error_log
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM erp_proyecto_miembros pm
    WHERE pm.user_id = auth.uid() AND pm.rol = 'admin'
  )
);

-- Users can see their own errors
CREATE POLICY "error_log_user_read_own" ON erp_error_log
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Users can see errors in their projects
CREATE POLICY "error_log_project_read" ON erp_error_log
FOR SELECT TO authenticated
USING (
  proyecto_id IN (
    SELECT pm.proyecto_id FROM erp_proyecto_miembros pm
    WHERE pm.user_id = auth.uid()
  )
);

-- System can insert errors
CREATE POLICY "error_log_insert" ON erp_error_log
FOR INSERT TO authenticated
WITH CHECK (true);

-- Admin can update errors (to mark as resolved)
CREATE POLICY "error_log_admin_update" ON erp_error_log
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM erp_proyecto_miembros pm
    WHERE pm.user_id = auth.uid() AND pm.rol = 'admin'
  )
);

-- ============================================================
-- Step 4: Create function to log errors
-- ============================================================

CREATE OR REPLACE FUNCTION log_error(
  p_error_message TEXT,
  p_error_code TEXT DEFAULT NULL,
  p_error_stack TEXT DEFAULT NULL,
  p_error_type TEXT DEFAULT 'other',
  p_severity TEXT DEFAULT 'error',
  p_component TEXT DEFAULT NULL,
  p_function_name TEXT DEFAULT NULL,
  p_line_number INTEGER DEFAULT NULL,
  p_proyecto_id UUID DEFAULT NULL,
  p_request_id TEXT DEFAULT NULL,
  p_request_method TEXT DEFAULT NULL,
  p_request_path TEXT DEFAULT NULL,
  p_request_params JSONB DEFAULT NULL,
  p_request_headers JSONB DEFAULT NULL,
  p_context JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_error_id UUID;
BEGIN
  INSERT INTO erp_error_log (
    error_code,
    error_message,
    error_stack,
    error_type,
    severity,
    component,
    function_name,
    line_number,
    user_id,
    proyecto_id,
    request_id,
    request_method,
    request_path,
    request_params,
    request_headers,
    context
  ) VALUES (
    p_error_code,
    p_error_message,
    p_error_stack,
    p_error_type,
    p_severity,
    p_component,
    p_function_name,
    p_line_number,
    auth.uid(),
    p_proyecto_id,
    p_request_id,
    p_request_method,
    p_request_path,
    p_request_params,
    p_request_headers,
    p_context
  )
  RETURNING id INTO v_error_id;

  RETURN v_error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Step 5: Create function to mark error as resolved
-- ============================================================

CREATE OR REPLACE FUNCTION resolve_error(
  p_error_id UUID,
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE erp_error_log
  SET
    resolved = TRUE,
    resolved_at = NOW(),
    resolved_by = auth.uid(),
    resolution_notes = p_resolution_notes
  WHERE id = p_error_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Step 6: Create view for error statistics
-- ============================================================

CREATE OR REPLACE VIEW erp_error_log_stats AS
SELECT
  error_type,
  severity,
  COUNT(*) AS error_count,
  COUNT(*) FILTER (WHERE resolved = FALSE) AS unresolved_count,
  MIN(created_at) AS first_occurrence,
  MAX(created_at) AS last_occurrence
FROM erp_error_log
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY error_type, severity
ORDER BY error_count DESC;

-- ============================================================
-- Step 7: Create view for recent errors
-- ============================================================

CREATE OR REPLACE VIEW erp_error_log_recent AS
SELECT
  el.id,
  el.error_code,
  el.error_message,
  el.error_type,
  el.severity,
  el.component,
  el.function_name,
  el.proyecto_id,
  p.nombre AS proyecto_nombre,
  el.user_id,
  au.email AS user_email,
  el.request_path,
  el.resolved,
  el.created_at
FROM erp_error_log el
LEFT JOIN erp_proyectos p ON el.proyecto_id = p.id
LEFT JOIN auth.users au ON el.user_id = au.id
WHERE el.created_at >= NOW() - INTERVAL '7 days'
ORDER BY el.created_at DESC
LIMIT 100;

-- ============================================================
-- Step 8: Create function to clean old error logs
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_old_error_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM erp_error_log
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL
  AND resolved = TRUE;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Step 9: Grant permissions
-- ============================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON erp_error_log TO authenticated;
GRANT INSERT ON erp_error_log TO authenticated;
GRANT UPDATE ON erp_error_log TO authenticated;
GRANT EXECUTE ON FUNCTION log_error TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_error TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_error_logs TO authenticated;
GRANT SELECT ON erp_error_log_stats TO authenticated;
GRANT SELECT ON erp_error_log_recent TO authenticated;

-- ============================================================
-- COMPLETADO
-- ============================================================
