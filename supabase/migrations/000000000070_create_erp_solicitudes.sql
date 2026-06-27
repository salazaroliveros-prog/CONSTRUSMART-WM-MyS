-- Migration 070: Create erp_solicitudes table
-- This table stores request records used by the frontend
CREATE TABLE IF NOT EXISTS erp_solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  tipo_trabajo TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT now(),
  fecha_resolucion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS policies for erp_solicitudes (authenticated users)
ALTER TABLE erp_solicitudes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "solicitudes_select" ON erp_solicitudes FOR SELECT TO authenticated USING (true);
CREATE POLICY "solicitudes_insert" ON erp_solicitudes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "solicitudes_update" ON erp_solicitudes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "solicitudes_delete" ON erp_solicitudes FOR DELETE TO authenticated USING (true);
