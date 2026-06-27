-- Migration 073: Fix remaining RLS for escalas_produccion and estacionalidad tables
-- These tables were missed in migration 072

-- ============================================================
-- FIX 1: erp_escalas_produccion
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_escalas_produccion (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_departamento text,
  nombre text NOT NULL,
  factor numeric DEFAULT 1.0,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE IF EXISTS erp_escalas_produccion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "escalas_select" ON erp_escalas_produccion;
CREATE POLICY "escalas_select" ON erp_escalas_produccion
  FOR SELECT TO authenticated, anon USING (true);

-- ============================================================
-- FIX 2: erp_subtipologias — asegurar RLS (puede haber sido reseteada)
-- ============================================================

ALTER TABLE IF EXISTS erp_subtipologias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subtipologias_select" ON erp_subtipologias;
CREATE POLICY "subtipologias_select" ON erp_subtipologias
  FOR SELECT TO authenticated, anon USING (true);

-- ============================================================
-- FIX 3: Buscar cualquier tabla con "estacionalidad" y darle RLS
-- ============================================================

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND (table_name ILIKE '%estac%' OR table_name ILIKE '%escala%')
  LOOP
    EXECUTE format('
      ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS %I_select ON %I;
      CREATE POLICY %I_select ON %I FOR SELECT TO authenticated, anon USING (true);
    ', tbl, tbl, tbl, tbl, tbl);
    RAISE NOTICE 'Applied RLS to table: %', tbl;
  END LOOP;
END $$;

-- ============================================================
-- Verificación
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 073 applied: RLS for escalas_produccion and estacionalidad tables';
END $$;