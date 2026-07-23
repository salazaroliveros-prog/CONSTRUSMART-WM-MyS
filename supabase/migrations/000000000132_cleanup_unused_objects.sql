-- Migración 132: limpiar funciones residuales y tabla legacy huérfana
-- Funciones eliminadas: rollbacks residuales, transaction helpers,
--   crear_particion_*, calcular_desglose_acero, calcular_dosificacion,
--   descontar_stock_vale, incrementar_stock_oc, verificar_stock_vale,
--   release_advisory_lock, try_advisory_lock, document_backup_restore,
--   execute_automated_backup, log_deadlock_event, log_sensitive_column_access
-- Tabla legacy eliminada: erp_actividades_herramientas (legacy sin prefijo erp_ homóloga)

DROP TABLE IF EXISTS public.erp_actividades_herramientas CASCADE;

DROP FUNCTION IF EXISTS public.rollback_047_fix_nullable_columns();
DROP FUNCTION IF EXISTS public.rollback_048_add_missing_indexes();
DROP FUNCTION IF EXISTS public.rollback_049_add_foreign_keys();
DROP FUNCTION IF EXISTS public.rollback_052_column_level_security();
DROP FUNCTION IF EXISTS public.rollback_054_monitoring_functions();
DROP FUNCTION IF EXISTS public.rollback_055_fix_monitoring_functions();
DROP FUNCTION IF EXISTS public.rollback_056_deadlock_prevention();
DROP FUNCTION IF EXISTS public.begin_transaction();
DROP FUNCTION IF EXISTS public.commit_transaction();
DROP FUNCTION IF EXISTS public.rollback_transaction();
DROP FUNCTION IF EXISTS public.crear_particion_default();
DROP FUNCTION IF EXISTS public.crear_particion_mes();
DROP FUNCTION IF EXISTS public.crear_particiones_anuales();
DROP FUNCTION IF EXISTS public.calcular_desglose_acero();
DROP FUNCTION IF EXISTS public.calcular_dosificacion();
DROP FUNCTION IF EXISTS public.descontar_stock_vale();
DROP FUNCTION IF EXISTS public.incrementar_stock_oc();
DROP FUNCTION IF EXISTS public.verificar_stock_vale();
DROP FUNCTION IF EXISTS public.release_advisory_lock();
DROP FUNCTION IF EXISTS public.try_advisory_lock();
DROP FUNCTION IF EXISTS public.document_backup_restore();
DROP FUNCTION IF EXISTS public.execute_automated_backup();
DROP FUNCTION IF EXISTS public.log_deadlock_event();
DROP FUNCTION IF EXISTS public.log_sensitive_column_access();
