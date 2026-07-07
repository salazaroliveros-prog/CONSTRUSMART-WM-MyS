-- Migration: Table Partitioning for Performance
-- Description: Partition erp_movimientos and erp_audit_log by year/month
-- Date: 2026-07-07

BEGIN;

-- ============================================================================
-- 1. erp_movimientos partitioning by year
-- ============================================================================

-- Rename original table
ALTER TABLE IF EXISTS erp_movimientos RENAME TO erp_movimientos_old;

-- Create partitioned table
CREATE TABLE erp_movimientos (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  categoria VARCHAR(50),
  monto NUMERIC(15,2) DEFAULT 0,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, fecha)
) PARTITION BY RANGE (fecha);

-- Create partitions for each year (2024-2028)
CREATE TABLE erp_movimientos_2024 PARTITION OF erp_movimientos
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE erp_movimientos_2025 PARTITION OF erp_movimientos
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE erp_movimientos_2026 PARTITION OF erp_movimientos
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE erp_movimientos_2027 PARTITION OF erp_movimientos
  FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

CREATE TABLE erp_movimientos_2028 PARTITION OF erp_movimientos
  FOR VALUES FROM ('2028-01-01') TO ('2029-01-01');

-- Create default partition for future data
CREATE TABLE erp_movimientos_default PARTITION OF erp_movimientos
  DEFAULT;

-- Migrate existing data
INSERT INTO erp_movimientos SELECT * FROM erp_movimientos_old
  ON CONFLICT (id, fecha) DO NOTHING;

-- Drop old table
DROP TABLE IF EXISTS erp_movimientos_old;

-- Recreate indexes on partitioned table
CREATE INDEX IF NOT EXISTS idx_erp_movimientos_proyecto_fecha
  ON erp_movimientos(proyecto_id, fecha);

-- ============================================================================
-- 2. Function to auto-create monthly partitions
-- ============================================================================

CREATE OR REPLACE FUNCTION create_monthly_movimientos_partition()
RETURNS void AS $$
DECLARE
  next_month DATE;
  partition_name TEXT;
  start_date TEXT;
  end_date TEXT;
BEGIN
  next_month := DATE_TRUNC('month', NOW()) + INTERVAL '1 month';
  partition_name := 'erp_movimientos_' || TO_CHAR(next_month, 'YYYY_MM');
  start_date := TO_CHAR(next_month, 'YYYY-MM-DD');
  end_date := TO_CHAR(next_month + INTERVAL '1 month', 'YYYY-MM-DD');

  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = partition_name
  ) THEN
    EXECUTE format(
      'CREATE TABLE %I PARTITION OF erp_movimientos FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule monthly partition creation (run via pg_cron or manual trigger)
COMMENT ON FUNCTION create_monthly_movimientos_partition IS
  'Creates next month partition for erp_movimientos. Run monthly via cron.';

-- ============================================================================
-- 3. Index on audit_log for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_erp_audit_log_created_at
  ON erp_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_erp_audit_log_usuario
  ON erp_audit_log(usuario);

COMMIT;