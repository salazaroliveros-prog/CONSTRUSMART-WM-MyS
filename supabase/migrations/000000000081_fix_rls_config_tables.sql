-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 81: CORRECCIÓN RLS TABLAS CONFIG
-- Versión: 2026-07-01
--
-- Corrige políticas RLS para permitir inserciones iniciales
-- ============================================================

-- Temporalmente deshabilitar RLS para insertar datos iniciales
ALTER TABLE erp_backup_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE erp_monitoring_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE erp_app_config DISABLE ROW LEVEL SECURITY;

-- Insertar datos iniciales
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

-- Rehabilitar RLS
ALTER TABLE erp_backup_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_monitoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_app_config ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FIN DE MIGRACIÓN 81
-- ============================================================
