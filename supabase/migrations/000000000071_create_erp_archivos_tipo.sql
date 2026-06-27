-- Migration 071: Create erp_archivos_tipo table
-- This table stores file types used in requests
CREATE TABLE IF NOT EXISTS erp_archivos_tipo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  extension TEXT NOT NULL,
  creat_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS policies for erp_archivos_tipo
ALTER TABLE erp_archivos_tipo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "archivos_tipo_select" ON erp_archivos_tipo FOR SELECT TO authenticated USING (true);
CREATE POLICY "archivos_tipo_insert" ON erp_archivos_tipo FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "archivos_tipo_update" ON erp_archivos_tipo FOR UPDATE TO authenticated USING (true);
CREATE POLICY "archivos_tipo_delete" ON erp_archivos_tipo FOR DELETE TO authenticated USING (true);
