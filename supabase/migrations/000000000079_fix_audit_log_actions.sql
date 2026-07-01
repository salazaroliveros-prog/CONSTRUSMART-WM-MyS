-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 79: CORRECCIÓN ACTIONS EN AUDIT LOG
-- Versión: 2026-07-01
--
-- Corrige:
-- - Función execute_automated_backup para usar action 'INSERT' en lugar de 'backup_created'
-- - Función document_backup_restore para usar action 'INSERT' en lugar de 'backup_restore'
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
-- FIN DE MIGRACIÓN 79
-- ============================================================
