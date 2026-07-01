-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 84: LIMPIEZA DE DATOS DUPLICADOS
-- Versión: 2026-07-01
--
-- Limpia datos duplicados en tablas de configuración
-- Deja solo el registro más reciente de cada tipo
-- ============================================================

-- Limpiar erp_backup_config (dejar solo el más reciente)
DELETE FROM erp_backup_config
WHERE id NOT IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
    FROM erp_backup_config
  ) sub
  WHERE rn = 1
);

-- Limpiar erp_monitoring_config (dejar solo el más reciente)
DELETE FROM erp_monitoring_config
WHERE id NOT IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
    FROM erp_monitoring_config
  ) sub
  WHERE rn = 1
);

-- Limpiar erp_app_config (dejar solo el más reciente de cada config_key)
DELETE FROM erp_app_config
WHERE id NOT IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY config_key ORDER BY created_at DESC) as rn
    FROM erp_app_config
  ) sub
  WHERE rn = 1
);

-- ============================================================
-- FIN DE MIGRACIÓN 84
-- ============================================================
