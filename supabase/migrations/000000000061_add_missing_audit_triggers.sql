-- Migration 061: Add Missing Audit Triggers
-- Purpose: Add audit triggers to tables that were missing from migration 050
-- Risk: Low - triggers are non-destructive
-- Rollback: Drops the added triggers
-- Expected Benefit: Complete audit trail for configuration and user tables

-- ============================================================
-- Step 1: Add audit triggers to configuration tables
-- ============================================================

-- erp_empresas - Company information
DROP TRIGGER IF EXISTS audit_erp_empresas ON erp_empresas;
CREATE TRIGGER audit_erp_empresas
AFTER INSERT OR UPDATE OR DELETE ON erp_empresas
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- erp_insumos_base - Base materials reference
DROP TRIGGER IF EXISTS audit_erp_insumos_base ON erp_insumos_base;
CREATE TRIGGER audit_erp_insumos_base
AFTER INSERT OR UPDATE OR DELETE ON erp_insumos_base
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================
-- Step 2: Add audit triggers to user and notification tables
-- ============================================================

-- erp_usuarios - User management
DROP TRIGGER IF EXISTS audit_erp_usuarios ON erp_usuarios;
CREATE TRIGGER audit_erp_usuarios
AFTER INSERT OR UPDATE OR DELETE ON erp_usuarios
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- erp_notificaciones - System notifications
DROP TRIGGER IF EXISTS audit_erp_notificaciones ON erp_notificaciones;
CREATE TRIGGER audit_erp_notificaciones
AFTER INSERT OR UPDATE OR DELETE ON erp_notificaciones
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================
-- Step 3: Add audit triggers to additional critical tables
-- ============================================================

-- erp_cotizaciones_negocio - Business quotations
DROP TRIGGER IF EXISTS audit_erp_cotizaciones_negocio ON erp_cotizaciones_negocio;
CREATE TRIGGER audit_erp_cotizaciones_negocio
AFTER INSERT OR UPDATE OR DELETE ON erp_cotizaciones_negocio
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- erp_plantillas_proyectos - Project templates
DROP TRIGGER IF EXISTS audit_erp_plantillas_proyectos ON erp_plantillas_proyectos;
CREATE TRIGGER audit_erp_plantillas_proyectos
AFTER INSERT OR UPDATE OR DELETE ON erp_plantillas_proyectos
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- erp_avances - Project progress tracking
DROP TRIGGER IF EXISTS audit_erp_avances ON erp_avances;
CREATE TRIGGER audit_erp_avances
AFTER INSERT OR UPDATE OR DELETE ON erp_avances
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- erp_hitos - Project milestones
DROP TRIGGER IF EXISTS audit_erp_hitos ON erp_hitos;
CREATE TRIGGER audit_erp_hitos
AFTER INSERT OR UPDATE OR DELETE ON erp_hitos
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- erp_riesgos - Project risks
DROP TRIGGER IF EXISTS audit_erp_riesgos ON erp_riesgos;
CREATE TRIGGER audit_erp_riesgos
AFTER INSERT OR UPDATE OR DELETE ON erp_riesgos
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- erp_planos - Project drawings
DROP TRIGGER IF EXISTS audit_erp_planos ON erp_planos;
CREATE TRIGGER audit_erp_planos
AFTER INSERT OR UPDATE OR DELETE ON erp_planos
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- erp_pruebas_laboratorio - Lab tests
DROP TRIGGER IF EXISTS audit_erp_pruebas_laboratorio ON erp_pruebas_laboratorio;
CREATE TRIGGER audit_erp_pruebas_laboratorio
AFTER INSERT OR UPDATE OR DELETE ON erp_pruebas_laboratorio
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- erp_liberaciones_partida - Partie releases
DROP TRIGGER IF EXISTS audit_erp_liberaciones_partida ON erp_liberaciones_partida;
CREATE TRIGGER audit_erp_liberaciones_partida
AFTER INSERT OR UPDATE OR DELETE ON erp_liberaciones_partida
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================
-- COMPLETADO
-- ============================================================
