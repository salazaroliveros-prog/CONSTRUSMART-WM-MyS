ALTER TABLE erp_licitaciones ADD COLUMN IF NOT EXISTS proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE erp_licitaciones;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
