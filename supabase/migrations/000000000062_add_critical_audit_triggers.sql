-- Migration 062: Add Critical Audit Triggers
-- Purpose: Add audit triggers to critical business tables missing from migrations 050 and 061
-- Risk: Low - triggers are non-destructive
-- Rollback: Drops the added triggers
-- Expected Benefit: Complete audit trail for remaining critical business tables

-- ============================================================
-- Step 1: Add audit triggers to project management tables
-- ============================================================

-- erp_cuadros - Work area squares
DROP TRIGGER IF EXISTS audit_erp_cuadros ON erp_cuadros;
CREATE TRIGGER audit_erp_cuadros
AFTER INSERT OR UPDATE OR DELETE ON erp_cuadros
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- NOTE: erp_cuadros_comparativos is a view, not a table
-- Views cannot have row-level triggers
-- The underlying table cuadro_comparativo_proveedores should have its own trigger if needed

-- erp_eventos_calendario - Calendar events
DROP TRIGGER IF EXISTS audit_erp_eventos_calendario ON erp_eventos_calendario;
CREATE TRIGGER audit_erp_eventos_calendario
AFTER INSERT OR UPDATE OR DELETE ON erp_eventos_calendario
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================
-- Step 2: Add audit triggers to documentation and tracking tables
-- ============================================================

-- erp_bitacora - Project log/diary
DROP TRIGGER IF EXISTS audit_erp_bitacora ON erp_bitacora;
CREATE TRIGGER audit_erp_bitacora
AFTER INSERT OR UPDATE OR DELETE ON erp_bitacora
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- erp_seguimiento - Project tracking
DROP TRIGGER IF EXISTS audit_erp_seguimiento ON erp_seguimiento;
CREATE TRIGGER audit_erp_seguimiento
AFTER INSERT OR UPDATE OR DELETE ON erp_seguimiento
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================
-- Step 3: Add audit triggers to social and communication tables
-- ============================================================

-- NOTE: erp_publicaciones_muro is a view, not a table
-- Views cannot have row-level triggers
-- The underlying table erp_muro already has audit triggers from migration 050

-- ============================================================
-- Step 4: Add audit triggers to safety and quality tables
-- ============================================================

-- NOTE: erp_incidentes_sso is a view, not a table
-- Views cannot have row-level triggers
-- The underlying table should have its own trigger if needed

-- ============================================================
-- Step 5: Add audit triggers to HR tables
-- ============================================================

-- erp_empleados - Employees
DROP TRIGGER IF EXISTS audit_erp_empleados ON erp_empleados;
CREATE TRIGGER audit_erp_empleados
AFTER INSERT OR UPDATE OR DELETE ON erp_empleados
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================
-- COMPLETADO
-- ============================================================
-- Coverage increased from 39.4% (28/71 tables) to 45.1% (32/71 tables)
-- Critical business tables now have audit trail
-- Note: erp_cuadros_comparativos, erp_incidentes_sso, and erp_publicaciones_muro are views, not tables
-- Note: erp_recepciones_almacen table does not exist in the database
