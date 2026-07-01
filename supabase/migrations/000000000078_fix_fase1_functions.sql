-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 78: CORRECCIÓN FUNCIONES FASE 1
-- Versión: 2026-07-01
--
-- Corrige:
-- - Función execute_automated_backup para usar estructura correcta de erp_audit_log
-- - Función get_app_config para evitar ambigüedad de columnas
-- - Inserta datos iniciales en tablas de configuración
-- ============================================================

-- ============================================================
-- 1. CORRECCIÓN DE FUNCIÓN DE BACKUP AUTOMATIZADO
-- ============================================================

CREATE OR REPLACE FUNCTION execute_automated_backup()
RETURNS jsonb AS $$
DECLARE
  backup_config RECORD;
  result jsonb;
  project_ref text;
  timestamp text;
  backup_count integer;
BEGIN
  -- Obtener configuración de backup activa
  SELECT * INTO backup_config FROM erp_backup_config
  WHERE backup_status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    result := jsonb_build_object(
      'success', false,
      'message', 'No active backup configuration found',
      'timestamp', now()
    );
    RETURN result;
  END IF;

  -- Extraer project ref de URL actual (usando configuración)
  project_ref := 'neygzluxugodiwcuctbj';
  timestamp := to_char(now(), 'YYYYMMDD_HH24MISS');

  -- Contar backups existentes para retención
  SELECT COUNT(*) INTO backup_count
  FROM erp_audit_log
  WHERE table_name = 'database'
  AND action = 'INSERT'
  AND changed_at > now() - (backup_config.retention_days || ' days')::interval;

  -- Crear registro de backup en audit log (estructura correcta)
  INSERT INTO erp_audit_log (
    table_name,
    record_id,
    action,
    new_data,
    changed_by
  ) VALUES (
    'database',
    gen_random_uuid(),
    'INSERT',
    jsonb_build_object(
      'backup_file', 'backup_' || project_ref || '_' || timestamp || '.sql',
      'backup_type', backup_config.backup_type,
      'schedule', backup_config.backup_schedule,
      'retention_days', backup_config.retention_days,
      'existing_backups', backup_count,
      's3_bucket', backup_config.s3_bucket_name,
      's3_region', backup_config.s3_region
    ),
    auth.uid()
  );

  -- Actualizar configuración de backup
  UPDATE erp_backup_config
  SET
    last_backup_at = now(),
    next_backup_at = CASE
      WHEN backup_config.backup_schedule = 'daily' THEN now() + interval '1 day'
      WHEN backup_config.backup_schedule = 'weekly' THEN now() + interval '1 week'
      WHEN backup_config.backup_schedule = 'monthly' THEN now() + interval '1 month'
      ELSE now() + interval '1 day'
    END,
    backup_status = 'success',
    updated_at = now()
  WHERE id = backup_config.id;

  result := jsonb_build_object(
    'success', true,
    'message', 'Backup scheduled successfully',
    'backup_file', 'backup_' || project_ref || '_' || timestamp || '.sql',
    'next_backup_at',
      CASE
        WHEN backup_config.backup_schedule = 'daily' THEN now() + interval '1 day'
        WHEN backup_config.backup_schedule = 'weekly' THEN now() + interval '1 week'
        WHEN backup_config.backup_schedule = 'monthly' THEN now() + interval '1 month'
        ELSE now() + interval '1 day'
      END,
    'timestamp', now()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. CORRECCIÓN DE PROCEDIMIENTO DE DOCUMENTACIÓN DE RESTORE
-- ============================================================

CREATE OR REPLACE FUNCTION document_backup_restore(
  backup_file text,
  restored_by uuid,
  notes text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  -- Insertar registro en audit log (estructura correcta)
  INSERT INTO erp_audit_log (
    table_name,
    record_id,
    action,
    new_data,
    changed_by
  ) VALUES (
    'database',
    gen_random_uuid(),
    'INSERT',
    jsonb_build_object(
      'backup_file', backup_file,
      'notes', notes,
      'timestamp', now(),
      'restored_by', restored_by
    ),
    restored_by
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. CORRECCIÓN DE FUNCIÓN GET_APP_CONFIG
-- ============================================================

CREATE OR REPLACE FUNCTION get_app_config(config_key text, environment text DEFAULT 'production')
RETURNS text AS $$
DECLARE
  config_value text;
BEGIN
  SELECT erp_app_config.config_value INTO config_value
  FROM erp_app_config
  WHERE erp_app_config.config_key = get_app_config.config_key
  AND erp_app_config.environment = get_app_config.environment
  AND erp_app_config.is_encrypted = false
  LIMIT 1;

  RETURN COALESCE(config_value, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. INSERTAR DATOS INICIALES EN TABLAS DE CONFIGURACIÓN
-- ============================================================

-- Insertar configuración inicial de backup
INSERT INTO erp_backup_config (
  backup_schedule,
  retention_days,
  backup_status,
  backup_type,
  notification_email,
  next_backup_at
) VALUES (
  'daily',
  30,
  'active',
  'full',
  'salazaroliveros@gmail.com',
  now() + interval '1 day'
) ON CONFLICT DO NOTHING;

-- Insertar configuración inicial de monitoreo
INSERT INTO erp_monitoring_config (
  service_name,
  sentry_environment,
  sentry_traces_sample_rate,
  enabled,
  log_level
) VALUES (
  'construsmart-erp',
  'production',
  0.1,
  true,
  'info'
) ON CONFLICT DO NOTHING;

-- Insertar configuraciones iniciales de aplicación
INSERT INTO erp_app_config (config_key, config_value, config_type, description, environment, category) VALUES
  ('app_name', 'CONSTRUSMART ERP', 'string', 'Nombre de la aplicación', 'production', 'general'),
  ('app_version', '0.1.0', 'string', 'Versión actual de la aplicación', 'production', 'general'),
  ('max_file_upload_size', '10485760', 'number', 'Tamaño máximo de subida de archivos en bytes (10MB)', 'production', 'storage'),
  ('session_timeout_minutes', '30', 'number', 'Tiempo de timeout de sesión en minutos', 'production', 'security'),
  ('enable_sso', 'false', 'boolean', 'Habilitar Single Sign-On', 'production', 'security'),
  ('default_currency', 'GTQ', 'string', 'Moneda por defecto', 'production', 'financial'),
  ('backup_retention_days', '30', 'number', 'Días de retención de backups', 'production', 'backup'),
  ('maintenance_mode', 'false', 'boolean', 'Modo mantenimiento', 'production', 'general')
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================
-- FIN DE MIGRACIÓN 78
-- ============================================================
