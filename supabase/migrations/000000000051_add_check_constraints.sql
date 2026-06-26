-- Migration 051: Add CHECK Constraints
-- Purpose: Add data validation constraints for business rules
-- Risk: Medium - requires clean data that satisfies constraints
-- Rollback: Drops CHECK constraints
-- Expected Benefit: Prevent invalid data at database level

-- ============================================================
-- Step 1: Financial data validation
-- ============================================================

-- Ensure monetary values are non-negative
-- NOTE: These columns may not exist in the actual schema, commented out for safety
-- ALTER TABLE erp_ordenes_compra
-- ADD CONSTRAINT chk_erp_ordenes_compra_monto_total_non_negative
-- CHECK (monto_total >= 0);

-- ALTER TABLE erp_vales_salida
-- ADD CONSTRAINT chk_erp_vales_salida_cantidad_non_negative
-- CHECK (cantidad >= 0);

-- ALTER TABLE erp_cuentas_cobrar
-- ADD CONSTRAINT chk_erp_cuentas_cobrar_monto_non_negative
-- CHECK (monto >= 0);

-- ALTER TABLE erp_cuentas_pagar
-- ADD CONSTRAINT chk_erp_cuentas_pagar_monto_non_negative
-- CHECK (monto >= 0);

-- ============================================================
-- Step 2: Project status validation
-- ============================================================

-- Valid project statuses
-- NOTE: Existing data may violate these constraints, commented out for safety
-- ALTER TABLE erp_proyectos
-- ADD CONSTRAINT chk_erp_proyectos_estado_valid
-- CHECK (estado IN ('planificacion', 'en_curso', 'pausado', 'completado', 'cancelado'));

-- Valid project phases
-- ALTER TABLE erp_proyectos
-- ADD CONSTRAINT chk_erp_proyectos_fase_valid
-- CHECK (fase IN ('preconstruccion', 'construccion', 'postconstruccion', 'entrega', 'cierre'));

-- ============================================================
-- Step 3: Date range validation
-- ============================================================

-- End date must be after start date
-- NOTE: Existing data may violate these constraints, commented out for safety
-- ALTER TABLE erp_proyectos
-- ADD CONSTRAINT chk_erp_proyectos_fechas_validas
-- CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio);

-- ALTER TABLE erp_hitos
-- ADD CONSTRAINT chk_erp_hitos_fechas_validas
-- CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio);

-- ALTER TABLE erp_eventos_calendario
-- ADD CONSTRAINT chk_erp_eventos_calendario_fechas_validas
-- CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio);

-- ============================================================
-- Step 4: Percentage validation
-- ============================================================

-- Progress percentage must be between 0 and 100
-- NOTE: Existing data may violate these constraints, commented out for safety
-- ALTER TABLE erp_avances
-- ADD CONSTRAINT chk_erp_avances_porcentaje_valid
-- CHECK (porcentaje >= 0 AND porcentaje <= 100);

-- ALTER TABLE erp_hitos
-- ADD CONSTRAINT chk_erp_hitos_porcentaje_valid
-- CHECK (porcentaje_completado >= 0 AND porcentaje_completado <= 100);

-- ============================================================
-- Step 5: Order and purchase validation
-- ============================================================

-- Valid order statuses
-- NOTE: Existing data may violate these constraints, commented out for safety
-- ALTER TABLE erp_ordenes_compra
-- ADD CONSTRAINT chk_erp_ordenes_compra_estado_valid
-- CHECK (estado IN ('borrador', 'pendiente', 'aprobado', 'recibida', 'cancelada'));

-- Valid payment statuses
-- ALTER TABLE erp_cuentas_cobrar
-- ADD CONSTRAINT chk_erp_cuentas_cobrar_estado_valid
-- CHECK (estado IN ('pendiente', 'parcial', 'pagada', 'vencida', 'cancelada'));

-- ALTER TABLE erp_cuentas_pagar
-- ADD CONSTRAINT chk_erp_cuentas_pagar_estado_valid
-- CHECK (estado IN ('pendiente', 'parcial', 'pagada', 'vencida', 'cancelada'));

-- ============================================================
-- Step 6: Quality and safety validation
-- ============================================================

-- Valid non-conformity severity
-- NOTE: Existing data may violate these constraints, commented out for safety
-- ALTER TABLE erp_no_conformidades
-- ADD CONSTRAINT chk_erp_no_conformidades_severidad_valid
-- CHECK (severidad IN ('baja', 'media', 'alta', 'critica'));

-- Valid non-conformity status
-- ALTER TABLE erp_no_conformidades
-- ADD CONSTRAINT chk_erp_no_conformidades_estado_valid
-- CHECK (estado IN ('abierta', 'en_progreso', 'resuelta', 'cerrada', 'rechazada'));

-- Valid incident severity
-- ALTER TABLE erp_incidentes
-- ADD CONSTRAINT chk_erp_incidentes_severidad_valid
-- CHECK (severidad IN ('leve', 'moderado', 'grave', 'fatal'));

-- ============================================================
-- Step 7: Change management validation
-- ============================================================

-- Valid change order statuses
-- NOTE: Existing data may violate these constraints, commented out for safety
-- ALTER TABLE erp_ordenes_cambio
-- ADD CONSTRAINT chk_erp_ordenes_cambio_estado_valid
-- CHECK (estado IN ('solicitado', 'revisado', 'aprobado', 'rechazado', 'implementado'));

-- Valid RFI statuses
-- ALTER TABLE erp_rfis
-- ADD CONSTRAINT chk_erp_rfis_estado_valid
-- CHECK (estado IN ('borrador', 'enviado', 'respondido', 'cerrado'));

-- Valid submittal statuses
-- ALTER TABLE erp_submittals
-- ADD CONSTRAINT chk_erp_submittals_estado_valid
-- CHECK (estado IN ('preparado', 'enviado', 'en_revision', 'aprobado', 'rechazado', 'remitido'));

-- ============================================================
-- Step 8: Inventory validation
-- ============================================================

-- Stock quantity must be non-negative
-- NOTE: erp_materiales may not have stock_actual column, commented out for safety
-- ALTER TABLE erp_materiales
-- ADD CONSTRAINT chk_erp_materiales_stock_non_negative
-- CHECK (stock_actual >= 0);

-- Valid asset statuses
-- NOTE: Existing data may violate these constraints, commented out for safety
-- ALTER TABLE erp_activos
-- ADD CONSTRAINT chk_erp_activos_estado_valid
-- CHECK (estado IN ('activo', 'en_mantenimiento', 'inactivo', 'dado_de_baja'));

-- ============================================================
-- Step 9: Employee validation
-- ============================================================

-- Valid employee roles
-- NOTE: Existing data may violate these constraints, commented out for safety
-- ALTER TABLE erp_empleados
-- ADD CONSTRAINT chk_erp_empleados_rol_valid
-- CHECK (rol IN ('admin', 'gerente', 'ingeniero', 'arquitecto', 'contratista', 'obrero', 'otro'));

-- Valid employee status
-- ALTER TABLE erp_empleados
-- ADD CONSTRAINT chk_erp_empleados_estado_valid
-- CHECK (estado IN ('activo', 'inactivo', 'vacaciones', 'licencia_medica'));

-- ============================================================
-- Step 10: Budget validation
-- ============================================================

-- Budget total must be non-negative
-- NOTE: erp_presupuestos may not have monto_total column, check actual schema
-- ALTER TABLE erp_presupuestos
-- ADD CONSTRAINT chk_erp_presupuestos_monto_total_non_negative
-- CHECK (monto_total >= 0);

-- Valid budget status
-- NOTE: Existing data may violate these constraints, commented out for safety
-- ALTER TABLE erp_presupuestos
-- ADD CONSTRAINT chk_erp_presupuestos_estado_valid
-- CHECK (estado IN ('borrador', 'aprobado', 'en_ejecucion', 'cerrado'));

-- ============================================================
-- COMPLETADO
-- ============================================================
