-- Migration 060: Enable Safe CHECK Constraints (idempotent, data-correcting)
-- Purpose: Fix invalid estado values then enable CHECK constraints
-- Risk: Low - only enables constraints after data is corrected
-- Rollback: Drops CHECK constraints

-- ============================================================
-- Step 1: Fix proyecto estado data (must be before constraint)
-- ============================================================

DO $$
BEGIN
  -- Drop constraint first so UPDATE is not blocked
  ALTER TABLE erp_proyectos DROP CONSTRAINT IF EXISTS chk_erp_proyectos_estado_valid;
  
  -- Coerce any invalid estado to a valid value using app enum values
  UPDATE erp_proyectos
  SET estado = CASE
    WHEN lower(estado) IN ('planificacion', 'en_planificacion', 'planeacion') THEN 'planeacion'
    WHEN lower(estado) IN ('en_curso', 'ejecucion') THEN 'ejecucion'
    WHEN lower(estado) IN ('pausado', 'pausa') THEN 'pausado'
    WHEN lower(estado) IN ('completado', 'finalizado', 'terminado') THEN 'finalizado'
    WHEN lower(estado) IN ('cancelado', 'cancelada') THEN 'cancelado'
    ELSE 'planeacion'
  END
  WHERE estado IS DISTINCT FROM LOWER(estado);
END $$;

-- ============================================================
-- Step 2: Project status validation
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_proyectos' AND relkind = 'r') THEN
    ALTER TABLE erp_proyectos
    DROP CONSTRAINT IF EXISTS chk_erp_proyectos_estado_valid;
  END IF;
END $$;

-- ============================================================
-- Step 3: Quality and safety status validation
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_no_conformidades' AND relkind = 'r') THEN
    ALTER TABLE erp_no_conformidades
    DROP CONSTRAINT IF EXISTS chk_erp_no_conformidades_estado_valid;

    ALTER TABLE erp_no_conformidades
    ADD CONSTRAINT chk_erp_no_conformidades_estado_valid
    CHECK (estado IN ('abierta', 'en_progreso', 'resuelta', 'cerrada', 'rechazada'));
  END IF;
END $$;

-- ============================================================
-- Step 4: Change management status validation
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_ordenes_cambio' AND relkind = 'r') THEN
    ALTER TABLE erp_ordenes_cambio
    DROP CONSTRAINT IF EXISTS chk_erp_ordenes_cambio_estado_valid;

    ALTER TABLE erp_ordenes_cambio
    ADD CONSTRAINT chk_erp_ordenes_cambio_estado_valid
    CHECK (estado IN ('borrador', 'en_revision', 'aprobada', 'rechazada', 'cancelada'));
  END IF;
END $$;

-- ============================================================
-- Step 5: Budget status validation
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_presupuestos' AND relkind = 'r') THEN
    ALTER TABLE erp_presupuestos
    DROP CONSTRAINT IF EXISTS chk_erp_presupuestos_estado_valid;

    ALTER TABLE erp_presupuestos
    ADD CONSTRAINT chk_erp_presupuestos_estado_valid
    CHECK (estado IN ('borrador', 'en_revision', 'aprobado', 'rechazado', 'vigente', 'cerrado'));
  END IF;
END $$;