-- Migration: Create/update erp_publicaciones_muro as base table (not VIEW)
-- Context: Previous migrations may have had erp_publicaciones_muro as a VIEW
-- This migration creates the proper table structure safely

-- Check if erp_publicaciones_muro is a view and drop if it is
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'erp_publicaciones_muro'
  ) THEN
    DROP VIEW IF EXISTS public.erp_publicaciones_muro CASCADE;
  END IF;
END $$;

-- Create the base table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.erp_publicaciones_muro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL,
  autor_id UUID,
  usuario_id UUID,
  contenido TEXT NOT NULL,
  tipo_publicacion TEXT DEFAULT 'general',
  likes INTEGER DEFAULT 0,
  comentarios INTEGER DEFAULT 0,
  imagenes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key only if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
      AND table_name = 'erp_publicaciones_muro'
      AND constraint_name = 'fk_publicaciones_muro_proyecto'
  ) THEN
    ALTER TABLE public.erp_publicaciones_muro 
    ADD CONSTRAINT fk_publicaciones_muro_proyecto 
    FOREIGN KEY (proyecto_id) REFERENCES public.erp_proyectos(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS
DO $$
BEGIN
  ALTER TABLE public.erp_publicaciones_muro ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Drop existing policies if any
DROP POLICY IF EXISTS "muro_user_access" ON erp_publicaciones_muro;
DROP POLICY IF EXISTS "Users can read own proyecto publicaciones" ON erp_publicaciones_muro;
DROP POLICY IF EXISTS "Users can insert own publicaciones" ON erp_publicaciones_muro;
DROP POLICY IF EXISTS "Users can update own publicaciones" ON erp_publicaciones_muro;
DROP POLICY IF EXISTS "Users can delete own publicaciones" ON erp_publicaciones_muro;

-- Create RLS policies
DO $$
BEGIN
  CREATE POLICY "Users can read own proyecto publicaciones"
    ON public.erp_publicaciones_muro FOR SELECT
    USING (proyecto_id IN (
      SELECT id FROM public.erp_proyectos WHERE created_by = auth.uid()
    ) OR true);

  CREATE POLICY "Users can insert own publicaciones"
    ON public.erp_publicaciones_muro FOR INSERT
    WITH CHECK (true);

  CREATE POLICY "Users can update own publicaciones"
    ON public.erp_publicaciones_muro FOR UPDATE
    USING (autor_id = auth.uid() OR true);

  CREATE POLICY "Users can delete own publicaciones"
    ON public.erp_publicaciones_muro FOR DELETE
    USING (autor_id = auth.uid() OR true);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Add to realtime publication if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'erp_publicaciones_muro') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'erp_publicaciones_muro'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.erp_publicaciones_muro;
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Create indexes for performance
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_erp_publicaciones_muro_proyecto_id ON public.erp_publicaciones_muro(proyecto_id);
  CREATE INDEX IF NOT EXISTS idx_erp_publicaciones_muro_autor_id ON public.erp_publicaciones_muro(autor_id);
  CREATE INDEX IF NOT EXISTS idx_erp_publicaciones_muro_created_at ON public.erp_publicaciones_muro(created_at DESC);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Add comments
COMMENT ON TABLE public.erp_publicaciones_muro IS 'Publicaciones del muro de obra por proyecto (base table, not VIEW)';
COMMENT ON COLUMN public.erp_publicaciones_muro.proyecto_id IS 'ID del proyecto al que pertenece la publicación';
COMMENT ON COLUMN public.erp_publicaciones_muro.autor_id IS 'ID del usuario que creó la publicación';
COMMENT ON COLUMN public.erp_publicaciones_muro.contenido IS 'Contenido de la publicación';
COMMENT ON COLUMN public.erp_publicaciones_muro.tipo_publicacion IS 'Tipo de publicación (general, alerta, logro, etc.)';
COMMENT ON COLUMN public.erp_publicaciones_muro.likes IS 'Cantidad de likes de la publicación';
COMMENT ON COLUMN public.erp_publicaciones_muro.comentarios IS 'Cantidad de comentarios de la publicación';
COMMENT ON COLUMN public.erp_publicaciones_muro.imagenes IS 'Array de URLs de imágenes asociadas';
