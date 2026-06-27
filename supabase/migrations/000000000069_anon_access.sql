-- ============================================================
-- MIGRACIÓN 069: Anon Access for Initial Load
-- ============================================================
-- El frontend carga datos sin autenticación usando key anon.
-- Estos GRANTS y políticas permiten que el anon pueda leer
-- tablas críticas para el dashboard inicial.
-- ============================================================

-- Add missing updated_at column to erp_notificaciones
ALTER TABLE erp_notificaciones ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_trigger ON erp_notificaciones;
CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON erp_notificaciones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Grant SELECT on tables to anon role (required for RLS to work with anon)
GRANT SELECT ON TABLE erp_proyectos TO anon;
GRANT SELECT ON TABLE erp_notificaciones TO anon;

-- erp_proyectos: tabla principal para dashboard
DROP POLICY IF EXISTS "proyectos_anon_read" ON erp_proyectos;
CREATE POLICY "proyectos_anon_read" ON erp_proyectos FOR SELECT TO anon USING (true);

-- erp_notificaciones: para mostrar alertas
DROP POLICY IF EXISTS "notificaciones_anon_read" ON erp_notificaciones;
CREATE POLICY "notificaciones_anon_read" ON erp_notificaciones FOR SELECT TO anon USING (true);

-- Register migration
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
SELECT '000000000069', 'anon_access_for_initial_load', ARRAY[
  'Added updated_at column to erp_notificaciones',
  'GRANT SELECT ON erp_proyectos TO anon',
  'GRANT SELECT ON erp_notificaciones TO anon',
  'Created anon policies for initial load'
]
WHERE NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '000000000069');