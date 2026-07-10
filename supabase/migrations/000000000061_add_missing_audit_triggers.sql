-- Migration 061: Add Missing Audit Triggers (idempotent, table-existence guarded)
-- Purpose: Add audit triggers to tables that were missing from migration 050
-- Risk: Low - triggers are non-destructive
-- Rollback: Drops the added triggers
-- Expected Benefit: Complete audit trail for configuration and user tables

-- ============================================================
-- Step 1: Add audit triggers to configuration tables
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_empresas' AND relkind = 'r') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_erp_empresas ON erp_empresas';
    EXECUTE 'CREATE TRIGGER audit_erp_empresas AFTER INSERT OR UPDATE OR DELETE ON erp_empresas FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_insumos_base' AND relkind = 'r') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_erp_insumos_base ON erp_insumos_base';
    EXECUTE 'CREATE TRIGGER audit_erp_insumos_base AFTER INSERT OR UPDATE OR DELETE ON erp_insumos_base FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()';
  END IF;
END $$;

-- ============================================================
-- Step 2: Add audit triggers to user and notification tables
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_usuarios' AND relkind = 'r') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_erp_usuarios ON erp_usuarios';
    EXECUTE 'CREATE TRIGGER audit_erp_usuarios AFTER INSERT OR UPDATE OR DELETE ON erp_usuarios FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_notificaciones' AND relkind = 'r') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_erp_notificaciones ON erp_notificaciones';
    EXECUTE 'CREATE TRIGGER audit_erp_notificaciones AFTER INSERT OR UPDATE OR DELETE ON erp_notificaciones FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()';
  END IF;
END $$;

-- ============================================================
-- Step 3: Add audit triggers to additional critical tables
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_cotizaciones_negocio' AND relkind = 'r') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_erp_cotizaciones_negocio ON erp_cotizaciones_negocio';
    EXECUTE 'CREATE TRIGGER audit_erp_cotizaciones_negocio AFTER INSERT OR UPDATE OR DELETE ON erp_cotizaciones_negocio FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_plantillas_proyectos' AND relkind = 'r') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_erp_plantillas_proyectos ON erp_plantillas_proyectos';
    EXECUTE 'CREATE TRIGGER audit_erp_plantillas_proyectos AFTER INSERT OR UPDATE OR DELETE ON erp_plantillas_proyectos FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_avances' AND relkind = 'r') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_erp_avances ON erp_avances';
    EXECUTE 'CREATE TRIGGER audit_erp_avances AFTER INSERT OR UPDATE OR DELETE ON erp_avances FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_hitos' AND relkind = 'r') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_erp_hitos ON erp_hitos';
    EXECUTE 'CREATE TRIGGER audit_erp_hitos AFTER INSERT OR UPDATE OR DELETE ON erp_hitos FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_riesgos' AND relkind = 'r') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_erp_riesgos ON erp_riesgos';
    EXECUTE 'CREATE TRIGGER audit_erp_riesgos AFTER INSERT OR UPDATE OR DELETE ON erp_riesgos FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_planos' AND relkind = 'r') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_erp_planos ON erp_planos';
    EXECUTE 'CREATE TRIGGER audit_erp_planos AFTER INSERT OR UPDATE OR DELETE ON erp_planos FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_pruebas_laboratorio' AND relkind = 'r') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_erp_pruebas_laboratorio ON erp_pruebas_laboratorio';
    EXECUTE 'CREATE TRIGGER audit_erp_pruebas_laboratorio AFTER INSERT OR UPDATE OR DELETE ON erp_pruebas_laboratorio FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_liberaciones_partida' AND relkind = 'r') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_erp_liberaciones_partida ON erp_liberaciones_partida';
    EXECUTE 'CREATE TRIGGER audit_erp_liberaciones_partida AFTER INSERT OR UPDATE OR DELETE ON erp_liberaciones_partida FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()';
  END IF;
END $$;

-- ============================================================
-- COMPLETADO
-- ============================================================