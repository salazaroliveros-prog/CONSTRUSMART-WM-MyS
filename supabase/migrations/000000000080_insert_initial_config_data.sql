-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 80: INSERCIÓN DE DATOS INICIALES
-- Versión: 2026-07-01
--
-- Inserta datos iniciales en tablas de configuración
-- Usa SECURITY DEFINER para bypass RLS
-- ============================================================

-- ============================================================
-- 1. INSERTAR CONFIGURACIÓN INICIAL DE BACKUP
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM erp_backup_config LIMIT 1) THEN
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
    );
  END IF;
END $$;

-- ============================================================
-- 2. INSERTAR CONFIGURACIÓN INICIAL DE MONITOREO
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM erp_monitoring_config LIMIT 1) THEN
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
    );
  END IF;
END $$;

-- ============================================================
-- 3. INSERTAR CONFIGURACIONES INICIALES DE APLICACIÓN
-- ============================================================

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
-- FIN DE MIGRACIÓN 80
-- ============================================================
