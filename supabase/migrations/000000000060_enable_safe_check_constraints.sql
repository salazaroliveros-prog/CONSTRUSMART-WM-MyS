-- Migration 058: Enable Safe CHECK Constraints
-- Purpose: Enable CHECK constraints only for columns that exist and have no data violations
-- Risk: Low - only enabling constraints that passed validation
-- Rollback: Drops CHECK constraints

-- ============================================================
-- Step 1: Fix proyecto estado data (must be before constraint)
-- ============================================================

UPDATE erp_proyectos
SET estado = 'planificacion'
WHERE estado = 'planeacion';

-- ============================================================
-- Step 2: Project status validation (Safe - data corrected)
-- ============================================================

ALTER TABLE erp_proyectos
ADD CONSTRAINT chk_erp_proyectos_estado_valid
CHECK (estado IN ('planificacion', 'en_curso', 'pausado', 'completado', 'cancelado'));

-- ============================================================
-- Step 3: Quality and safety status validation (Safe - no violations)
-- ============================================================

ALTER TABLE erp_no_conformidades
ADD CONSTRAINT chk_erp_no_conformidades_estado_valid
CHECK (estado IN ('abierta', 'en_progreso', 'resuelta', 'cerrada', 'rechazada'));

-- ============================================================
-- Step 4: Change management status validation (Safe - no violations)
-- ============================================================

ALTER TABLE erp_ordenes_cambio
ADD CONSTRAINT chk_erp_ordenes_cambio_estado_valid
CHECK (estado IN ('solicitado', 'revisado', 'aprobado', 'rechazado', 'implementado'));

ALTER TABLE erp_rfis
ADD CONSTRAINT chk_erp_rfis_estado_valid
CHECK (estado IN ('borrador', 'enviado', 'respondido', 'cerrado'));

ALTER TABLE erp_submittals
ADD CONSTRAINT chk_erp_submittals_estado_valid
CHECK (estado IN ('preparado', 'enviado', 'en_revision', 'aprobado', 'rechazado', 'remitido'));

-- ============================================================
-- Step 5: Asset status validation (Safe - no violations)
-- ============================================================

ALTER TABLE erp_activos
ADD CONSTRAINT chk_erp_activos_estado_valid
CHECK (estado IN ('activo', 'en_mantenimiento', 'inactivo', 'dado_de_baja'));

-- ============================================================
-- Step 6: Budget status validation (Safe - no violations)
-- ============================================================

ALTER TABLE erp_presupuestos
ADD CONSTRAINT chk_erp_presupuestos_estado_valid
CHECK (estado IN ('borrador', 'aprobado', 'en_ejecucion', 'cerrado'));

-- ============================================================
-- COMPLETADO
-- Only constraints that passed validation are enabled
-- ============================================================
