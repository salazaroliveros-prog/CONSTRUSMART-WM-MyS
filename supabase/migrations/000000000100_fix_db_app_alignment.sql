-- Migration: Fix DB alignment with app requirements
-- Date: 2026-07-15
-- Fixes:
--   🔴 Create missing erp_licitaciones table
--   🔴 Grant permissions on erp_activos to service_role
--   🟡 Backward compatibility for muro -> publicaciones_muro

-- =============================================
-- FIX 1: Create missing erp_licitaciones table
-- =============================================
CREATE TABLE IF NOT EXISTS public.erp_licitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  cliente TEXT,
  monto NUMERIC DEFAULT 0,
  estado TEXT DEFAULT 'pendiente',
  probabilidad INTEGER DEFAULT 50,
  descripcion TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.erp_licitaciones ADD COLUMN IF NOT EXISTS comentarios TEXT;
ALTER TABLE public.erp_licitaciones ADD COLUMN IF NOT EXISTS fecha_cierre TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.erp_licitaciones ADD COLUMN IF NOT EXISTS monto_estimado NUMERIC DEFAULT 0;

ALTER TABLE public.erp_licitaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "licitaciones_select" ON erp_licitaciones;
DROP POLICY IF EXISTS "licitaciones_insert" ON erp_licitaciones;
DROP POLICY IF EXISTS "licitaciones_update" ON erp_licitaciones;
DROP POLICY IF EXISTS "licitaciones_delete" ON erp_licitaciones;

CREATE POLICY "licitaciones_select" ON public.erp_licitaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "licitaciones_insert" ON public.erp_licitaciones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "licitaciones_update" ON public.erp_licitaciones FOR UPDATE TO authenticated USING (true);
CREATE POLICY "licitaciones_delete" ON public.erp_licitaciones FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_licitaciones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_licitaciones TO service_role;

CREATE INDEX IF NOT EXISTS idx_erp_licitaciones_proyecto_id ON public.erp_licitaciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_licitaciones_estado ON public.erp_licitaciones(estado);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'erp_licitaciones'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.erp_licitaciones;
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- =============================================
-- FIX 2: Grant permissions on erp_activos to service_role
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_activos TO service_role;