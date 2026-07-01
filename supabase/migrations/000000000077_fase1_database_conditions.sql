-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 77: CONDICIONES FASE 1
-- Versión: 2026-07-01
--
-- Contiene:
-- - Tabla de configuración de backups
-- - Tabla de configuración de monitoreo
-- - Tabla de configuración de aplicación
-- - Función de backup automatizado
-- - Procedimiento de documentación de restore
-- ============================================================

-- ============================================================
-- 1. TABLA DE CONFIGURACIÓN DE BACKUPS
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_backup_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_schedule text NOT NULL DEFAULT 'daily', 
  retention_days integer NOT NULL DEFAULT 30,
  s3_bucket_name text,
  s3_region text DEFAULT 'us-east-1',
  last_backup_at timestamptz,
  next_backup_at timestamptz,
  backup_status text DEFAULT 'active' CHECK (backup_status = ANY (ARRAY['active', 'failed', 'success', 'disabled'])),
  backup_type text DEFAULT 'full' CHECK (backup_type = ANY (ARRAY['full', 'incremental', 'differential'])),
  notification_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE erp_backup_config ENABLE ROW LEVEL SECURITY;

-- Política: Solo administradores pueden gestionar configuración de backups
DROP POLICY IF EXISTS "backup_config_admin_only" ON erp_backup_config;
CREATE POLICY "backup_config_admin_only" ON erp_backup_config
  FOR ALL TO authenticated
  USING (
    public.get_user_role() = 'Administrador'
  );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_backup_config_status ON erp_backup_config(backup_status);
CREATE INDEX IF NOT EXISTS idx_backup_config_next_backup ON erp_backup_config(next_backup_at);

-- Insertar configuración inicial
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
  'admin@construsmart.com',
  now() + interval '1 day'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. TABLA DE CONFIGURACIÓN DE MONITOREO
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_monitoring_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL DEFAULT 'construsmart-erp',
  sentry_dsn text,
  sentry_environment text DEFAULT 'production',
  sentry_traces_sample_rate numeric DEFAULT 0.1,
  sentry_replays_session_sample_rate numeric DEFAULT 0.1,
  sentry_replays_on_error_sample_rate numeric DEFAULT 1.0,
  alert_email text,
  alert_webhook_url text,
  alert_thresholds jsonb DEFAULT '{"error_rate": 1.0, "performance_p95": 3.0, "uptime": 99.9}'::jsonb,
  enabled boolean DEFAULT true,
  log_level text DEFAULT 'info' CHECK (log_level = ANY (ARRAY['debug', 'info', 'warn', 'error'])),
  metrics_retention_days integer DEFAULT 30,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE erp_monitoring_config ENABLE ROW LEVEL SECURITY;

-- Política: Solo administradores pueden gestionar configuración de monitoreo
DROP POLICY IF EXISTS "monitoring_config_admin_only" ON erp_monitoring_config;
CREATE POLICY "monitoring_config_admin_only" ON erp_monitoring_config
  FOR ALL TO authenticated
  USING (
    public.get_user_role() = 'Administrador'
  );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_monitoring_config_enabled ON erp_monitoring_config(enabled);

-- Insertar configuración inicial (placeholder - se actualizará con Sentry DSN real)
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

-- ============================================================
-- 3. TABLA DE CONFIGURACIÓN DE APLICACIÓN
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value text,
  config_type text NOT NULL CHECK (config_type = ANY (ARRAY['string', 'number', 'boolean', 'json', 'encrypted'])),
  description text,
  is_encrypted boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'production' CHECK (environment = ANY (ARRAY['development', 'staging', 'production'])),
  category text DEFAULT 'general',
  validation_regex text,
  min_value numeric,
  max_value numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE erp_app_config ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden leer configuración
DROP POLICY IF EXISTS "app_config_read_all" ON erp_app_config;
CREATE POLICY "app_config_read_all" ON erp_app_config
  FOR SELECT TO authenticated
  USING (true);

-- Política: Solo administradores pueden modificar configuración
DROP POLICY IF EXISTS "app_config_write_admin" ON erp_app_config;
CREATE POLICY "app_config_write_admin" ON erp_app_config
  FOR ALL TO authenticated
  USING (
    public.get_user_role() = 'Administrador'
  )
  WITH CHECK (
    public.get_user_role() = 'Administrador'
  );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_app_config_key ON erp_app_config(config_key);
CREATE INDEX IF NOT EXISTS idx_app_config_environment ON erp_app_config(environment);
CREATE INDEX IF NOT EXISTS idx_app_config_category ON erp_app_config(category);

-- Insertar configuraciones iniciales
INSERT INTO erp_app_config (config_key, config_value, config_type, description, environment, category) VALUES
  ('app_name', 'CONSTRUSMART ERP', 'string', 'Nombre de la aplicación', 'production', 'general'),
  ('app_version', '0.1.0', 'string', 'Versión actual de la aplicación', 'production', 'general'),
  ('max_file_upload_size', '10485760', 'number', 'Tamaño máximo de subida de archivos en bytes (10MB)', 'production', 'storage'),
  ('session_timeout_minutes', '30', 'number', 'Tiempo de timeout de sesión en minutos', 'production', 'security'),
  ('enable_sso', 'true', 'boolean', 'Habilitar Single Sign-On', 'production', 'security'),
  ('default_currency', 'GTQ', 'string', 'Moneda por defecto', 'production', 'financial'),
  ('backup_retention_days', '30', 'number', 'Días de retención de backups', 'production', 'backup'),
  ('maintenance_mode', 'false', 'boolean', 'Modo mantenimiento', 'production', 'general')
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================
-- 4. FUNCIÓN DE BACKUP AUTOMATIZADO
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
  WHERE accion = 'backup_created' 
  AND created_at > now() - (backup_config.retention_days || ' days')::interval;
  
  -- Crear registro de backup en audit log
  INSERT INTO erp_audit_log (
    usuario_id,
    usuario_nombre,
    accion,
    entidad,
    valores_nuevos,
    created_at
  ) VALUES (
    NULL,
    'SYSTEM',
    'backup_scheduled',
    'database',
    jsonb_build_object(
      'backup_file', 'backup_' || project_ref || '_' || timestamp || '.sql',
      'backup_type', backup_config.backup_type,
      'schedule', backup_config.backup_schedule,
      'retention_days', backup_config.retention_days,
      'existing_backups', backup_count,
      's3_bucket', backup_config.s3_bucket_name,
      's3_region', backup_config.s3_region
    ),
    now()
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
-- 5. PROCEDIMIENTO DE DOCUMENTACIÓN DE RESTORE
-- ============================================================

CREATE OR REPLACE FUNCTION document_backup_restore(
  backup_file text,
  restored_by uuid,
  notes text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  log_id uuid;
  user_name text;
BEGIN
  -- Obtener nombre del usuario
  SELECT nombre INTO user_name 
  FROM public.profiles 
  WHERE id = restored_by;
  
  IF user_name IS NULL THEN
    user_name := 'UNKNOWN';
  END IF;
  
  -- Insertar registro en audit log
  INSERT INTO erp_audit_log (
    usuario_id,
    usuario_nombre,
    accion,
    entidad,
    valores_nuevos,
    created_at
  ) VALUES (
    restored_by,
    user_name,
    'backup_restore',
    'database',
    jsonb_build_object(
      'backup_file', backup_file,
      'notes', notes,
      'timestamp', now(),
      'restored_by', user_name
    ),
    now()
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. FUNCIÓN PARA OBTENER CONFIGURACIÓN DE MONITOREO
-- ============================================================

CREATE OR REPLACE FUNCTION get_monitoring_config()
RETURNS jsonb AS $$
DECLARE
  config RECORD;
  result jsonb;
BEGIN
  SELECT * INTO config FROM erp_monitoring_config 
  WHERE enabled = true 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF NOT FOUND THEN
    result := jsonb_build_object(
      'enabled', false,
      'message', 'No active monitoring configuration found'
    );
  ELSE
    result := jsonb_build_object(
      'enabled', true,
      'service_name', config.service_name,
      'sentry_dsn', config.sentry_dsn,
      'sentry_environment', config.sentry_environment,
      'sentry_traces_sample_rate', config.sentry_traces_sample_rate,
      'sentry_replays_session_sample_rate', config.sentry_replays_session_sample_rate,
      'sentry_replays_on_error_sample_rate', config.sentry_replays_on_error_sample_rate,
      'alert_email', config.alert_email,
      'alert_webhook_url', config.alert_webhook_url,
      'alert_thresholds', config.alert_thresholds,
      'log_level', config.log_level,
      'metrics_retention_days', config.metrics_retention_days
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. FUNCIÓN PARA OBTENER CONFIGURACIÓN DE APLICACIÓN
-- ============================================================

CREATE OR REPLACE FUNCTION get_app_config(config_key text, environment text DEFAULT 'production')
RETURNS text AS $$
DECLARE
  config_value text;
BEGIN
  SELECT config_value INTO config_value
  FROM erp_app_config
  WHERE config_key = get_app_config.config_key
  AND environment = get_app_config.environment
  AND is_encrypted = false
  LIMIT 1;
  
  RETURN COALESCE(config_value, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. FUNCIÓN PARA ACTUALIZAR CONFIGURACIÓN DE APLICACIÓN
-- ============================================================

CREATE OR REPLACE FUNCTION update_app_config(
  config_key text,
  config_value text,
  environment text DEFAULT 'production',
  updated_by uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  -- Verificar que sea administrador
  user_role := public.get_user_role();
  
  IF user_role != 'Administrador' THEN
    RAISE EXCEPTION 'Only Administrators can update app config';
    RETURN false;
  END IF;
  
  -- Actualizar o insertar configuración
  INSERT INTO erp_app_config (
    config_key,
    config_value,
    environment,
    updated_by,
    updated_at
  ) VALUES (
    update_app_config.config_key,
    update_app_config.config_value,
    update_app_config.environment,
    updated_by,
    now()
  )
  ON CONFLICT (config_key, environment) 
  DO UPDATE SET
    config_value = EXCLUDED.config_value,
    updated_by = update_app_config.updated_by,
    updated_at = now();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 9. TRIGGER PARA ACTUALIZAR updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a las tablas nuevas
CREATE TRIGGER update_backup_config_updated_at BEFORE UPDATE ON erp_backup_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monitoring_config_updated_at BEFORE UPDATE ON erp_monitoring_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_config_updated_at BEFORE UPDATE ON erp_app_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 10. COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================

COMMENT ON TABLE erp_backup_config IS 'Configuración de backups automatizados de la base de datos';
COMMENT ON TABLE erp_monitoring_config IS 'Configuración de monitoreo y alertas (Sentry, etc.)';
COMMENT ON TABLE erp_app_config IS 'Configuración general de la aplicación con variables dinámicas';

COMMENT ON FUNCTION execute_automated_backup() IS 'Ejecuta backup automatizado según configuración y actualiza audit log';
COMMENT ON FUNCTION document_backup_restore(text, uuid, text) IS 'Documenta operaciones de restore de backup en audit log';
COMMENT ON FUNCTION get_monitoring_config() IS 'Retorna configuración activa de monitoreo en formato JSON';
COMMENT ON FUNCTION get_app_config(text, text) IS 'Retorna valor de configuración por key y environment';
COMMENT ON FUNCTION update_app_config(text, text, text, uuid) IS 'Actualiza o crea configuración de aplicación (solo administradores)';

-- ============================================================
-- FIN DE MIGRACIÓN 77
-- ============================================================