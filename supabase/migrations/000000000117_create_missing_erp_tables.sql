-- Migration 117: Create missing ERP tables
-- Creates tables that were missing from production database
-- Tables: erp_publicaciones_muro, erp_bodega, erp_documentos, erp_recepciones_almacen, erp_permisos, erp_checklist, erp_configuracion

-- 1. Create erp_publicaciones_muro (the correct table for Muro)
CREATE TABLE IF NOT EXISTS public.erp_publicaciones_muro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL DEFAULT 'actualizacion',
  contenido TEXT NOT NULL,
  Likes INTEGER DEFAULT 0,
  comentarios JSONB DEFAULT '[]'::jsonb,
  archivos JSONB DEFAULT '[]'::jsonb,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.erp_publicaciones_muro ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "publicaciones_select" ON public.erp_publicaciones_muro;
DROP POLICY IF EXISTS "publicaciones_insert" ON public.erp_publicaciones_muro;
DROP POLICY IF EXISTS "publicaciones_update" ON public.erp_publicaciones_muro;
DROP POLICY IF EXISTS "publicaciones_delete" ON public.erp_publicaciones_muro;

CREATE POLICY "publicaciones_select" ON public.erp_publicaciones_muro
  FOR SELECT TO authenticated
  USING (
    proyecto_id IN (
      SELECT id FROM public.erp_proyectos WHERE created_by = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente')
    )
  );

CREATE POLICY "publicaciones_insert" ON public.erp_publicaciones_muro
  FOR INSERT TO authenticated
  WITH CHECK (
    proyecto_id IN (
      SELECT id FROM public.erp_proyectos WHERE created_by = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente')
    )
  );

CREATE POLICY "publicaciones_update" ON public.erp_publicaciones_muro
  FOR UPDATE TO authenticated
  USING (
    autor_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente')
    )
  )
  WITH CHECK (
    autor_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente')
    )
  );

CREATE POLICY "publicaciones_delete" ON public.erp_publicaciones_muro
  FOR DELETE TO authenticated
  USING (
    autor_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_publicaciones_muro TO authenticated;
GRANT ALL ON public.erp_publicaciones_muro TO service_role;

CREATE INDEX IF NOT EXISTS idx_erp_publicaciones_muro_proyecto ON public.erp_publicaciones_muro(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_publicaciones_muro_autor ON public.erp_publicaciones_muro(autor_id);
CREATE INDEX IF NOT EXISTS idx_erp_publicaciones_muro_created ON public.erp_publicaciones_muro(created_at DESC);

-- RPC functions for the muro
CREATE OR REPLACE FUNCTION append_comentario_muro(pub_id UUID, comentario JSONB)
RETURNS void AS $$
BEGIN
  UPDATE public.erp_publicaciones_muro
  SET comentarios = comentarios || jsonb_build_array(comentario)
  WHERE id = pub_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_likes_muro(pub_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.erp_publicaciones_muro
  SET Likes = COALESCE(Likes, 0) + 1
  WHERE id = pub_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION append_comentario_muro TO service_role;
GRANT EXECUTE ON FUNCTION increment_likes_muro TO service_role;

-- 2. Create erp_bodega
CREATE TABLE IF NOT EXISTS public.erp_bodega (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.erp_materiales(id) ON DELETE SET NULL,
  cantidad_actual NUMERIC DEFAULT 0,
  cantidad_minima NUMERIC DEFAULT 0,
  unidad TEXT NOT NULL,
  ubicacion TEXT,
  estado TEXT DEFAULT 'disponible',
  lote TEXT,
  fecha_entrada DATE,
  fecha_caducidad DATE,
  proveedor_id UUID,
  costo_unitario NUMERIC DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.erp_bodega ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bodega_select" ON public.erp_bodega;
DROP POLICY IF EXISTS "bodega_insert" ON public.erp_bodega;
DROP POLICY IF EXISTS "bodega_update" ON public.erp_bodega;
DROP POLICY IF EXISTS "bodega_delete" ON public.erp_bodega;

CREATE POLICY "bodega_select" ON public.erp_bodega
  FOR SELECT TO authenticated
  USING (
    proyecto_id IN (
      SELECT id FROM public.erp_proyectos WHERE created_by = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente')
    )
  );

CREATE POLICY "bodega_insert" ON public.erp_bodega
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente')
    )
  );

CREATE POLICY "bodega_update" ON public.erp_bodega
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente')
    )
  );

CREATE POLICY "bodega_delete" ON public.erp_bodega
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_bodega TO authenticated;
GRANT ALL ON public.erp_bodega TO service_role;

CREATE INDEX IF NOT EXISTS idx_erp_bodega_proyecto ON public.erp_bodega(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_bodega_material ON public.erp_bodega(material_id);

-- 3. Create erp_documentos
CREATE TABLE IF NOT EXISTS public.erp_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  categoria TEXT,
  url TEXT NOT NULL,
  tamano NUMERIC,
  subido_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  version TEXT DEFAULT '1.0',
  estado TEXT DEFAULT 'activo',
  etiquetas JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  fecha_vencimiento DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.erp_documentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documentos_select" ON public.erp_documentos;
DROP POLICY IF EXISTS "documentos_insert" ON public.erp_documentos;
DROP POLICY IF EXISTS "documentos_update" ON public.erp_documentos;
DROP POLICY IF EXISTS "documentos_delete" ON public.erp_documentos;

CREATE POLICY "documentos_select" ON public.erp_documentos
  FOR SELECT TO authenticated
  USING (
    proyecto_id IN (
      SELECT id FROM public.erp_proyectos WHERE created_by = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente')
    )
  );

CREATE POLICY "documentos_insert" ON public.erp_documentos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente')
    )
  );

CREATE POLICY "documentos_update" ON public.erp_documentos
  FOR UPDATE TO authenticated
  USING (
    subido_por = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente')
    )
  )
  WITH CHECK (
    subido_por = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente')
    )
  );

CREATE POLICY "documentos_delete" ON public.erp_documentos
  FOR DELETE TO authenticated
  USING (
    subido_por = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_documentos TO authenticated;
GRANT ALL ON public.erp_documentos TO service_role;

CREATE INDEX IF NOT EXISTS idx_erp_documentos_proyecto ON public.erp_documentos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_documentos_tipo ON public.erp_documentos(tipo);

-- 4. Create erp_recepciones_almacen
CREATE TABLE IF NOT EXISTS public.erp_recepciones_almacen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  orden_compra_id UUID REFERENCES public.erp_ordenes_compra(id) ON DELETE SET NULL,
  proveedor_id UUID NOT NULL,
  fecha_recepcion DATE NOT NULL,
  recibido_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  estado TEXT DEFAULT 'completa',
  notas TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.erp_recepciones_almacen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recepciones_select" ON public.erp_recepciones_almacen;
DROP POLICY IF EXISTS "recepciones_insert" ON public.erp_recepciones_almacen;
DROP POLICY IF EXISTS "recepciones_update" ON public.erp_recepciones_almacen;
DROP POLICY IF EXISTS "recepciones_delete" ON public.erp_recepciones_almacen;

CREATE POLICY "recepciones_select" ON public.erp_recepciones_almacen
  FOR SELECT TO authenticated
  USING (
    proyecto_id IN (
      SELECT id FROM public.erp_proyectos WHERE created_by = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente')
    )
  );

CREATE POLICY "recepciones_insert" ON public.erp_recepciones_almacen
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente')
    )
  );

CREATE POLICY "recepciones_update" ON public.erp_recepciones_almacen
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente')
    )
  );

CREATE POLICY "recepciones_delete" ON public.erp_recepciones_almacen
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_recepciones_almacen TO authenticated;
GRANT ALL ON public.erp_recepciones_almacen TO service_role;

CREATE INDEX IF NOT EXISTS idx_erp_recepciones_almacen_proyecto ON public.erp_recepciones_almacen(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_recepciones_almacen_orden ON public.erp_recepciones_almacen(orden_compra_id);

-- 5. Create erp_permisos
CREATE TABLE IF NOT EXISTS public.erp_permisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto_id UUID REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  rol TEXT NOT NULL,
  permisos JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(usuario_id, proyecto_id)
);

ALTER TABLE public.erp_permisos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "permisos_select" ON public.erp_permisos;
DROP POLICY IF EXISTS "permisos_insert" ON public.erp_permisos;
DROP POLICY IF EXISTS "permisos_update" ON public.erp_permisos;
DROP POLICY IF EXISTS "permisos_delete" ON public.erp_permisos;

CREATE POLICY "permisos_select" ON public.erp_permisos
  FOR SELECT TO authenticated
  USING (
    usuario_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador'
    )
  );

CREATE POLICY "permisos_insert" ON public.erp_permisos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador'
    )
  );

CREATE POLICY "permisos_update" ON public.erp_permisos
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador'
    )
  );

CREATE POLICY "permisos_delete" ON public.erp_permisos
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador'
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_permisos TO authenticated;
GRANT ALL ON public.erp_permisos TO service_role;

CREATE INDEX IF NOT EXISTS idx_erp_permisos_usuario ON public.erp_permisos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_erp_permisos_proyecto ON public.erp_permisos(proyecto_id);

-- 6. Create erp_checklist
CREATE TABLE IF NOT EXISTS public.erp_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  hito_id UUID REFERENCES public.erp_hitos(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  estado TEXT DEFAULT 'pendiente',
  asignado_a UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_limite DATE,
  fecha_completado TIMESTAMPTZ,
  completado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.erp_checklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checklist_select" ON public.erp_checklist;
DROP POLICY IF EXISTS "checklist_insert" ON public.erp_checklist;
DROP POLICY IF EXISTS "checklist_update" ON public.erp_checklist;
DROP POLICY IF EXISTS "checklist_delete" ON public.erp_checklist;

CREATE POLICY "checklist_select" ON public.erp_checklist
  FOR SELECT TO authenticated
  USING (
    proyecto_id IN (
      SELECT id FROM public.erp_proyectos WHERE created_by = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente')
    )
  );

CREATE POLICY "checklist_insert" ON public.erp_checklist
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente')
    )
  );

CREATE POLICY "checklist_update" ON public.erp_checklist
  FOR UPDATE TO authenticated
  USING (
    asignado_a = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente')
    )
  )
  WITH CHECK (
    asignado_a = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente','Residente')
    )
  );

CREATE POLICY "checklist_delete" ON public.erp_checklist
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_checklist TO authenticated;
GRANT ALL ON public.erp_checklist TO service_role;

CREATE INDEX IF NOT EXISTS idx_erp_checklist_proyecto ON public.erp_checklist(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_checklist_hito ON public.erp_checklist(hito_id);
CREATE INDEX IF NOT EXISTS idx_erp_checklist_asignado ON public.erp_checklist(asignado_a);

-- 7. Create erp_configuracion
CREATE TABLE IF NOT EXISTS public.erp_configuracion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  clave TEXT NOT NULL,
  valor JSONB NOT NULL DEFAULT '{}'::jsonb,
  tipo TEXT DEFAULT 'general',
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(proyecto_id, clave)
);

ALTER TABLE public.erp_configuracion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "configuracion_select" ON public.erp_configuracion;
DROP POLICY IF EXISTS "configuracion_insert" ON public.erp_configuracion;
DROP POLICY IF EXISTS "configuracion_update" ON public.erp_configuracion;
DROP POLICY IF EXISTS "configuracion_delete" ON public.erp_configuracion;

CREATE POLICY "configuracion_select" ON public.erp_configuracion
  FOR SELECT TO authenticated
  USING (
    proyecto_id IN (
      SELECT id FROM public.erp_proyectos WHERE created_by = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente')
    )
  );

CREATE POLICY "configuracion_insert" ON public.erp_configuracion
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente')
    )
  );

CREATE POLICY "configuracion_update" ON public.erp_configuracion
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente')
    )
  );

CREATE POLICY "configuracion_delete" ON public.erp_configuracion
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('Administrador','Gerente')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_configuracion TO authenticated;
GRANT ALL ON public.erp_configuracion TO service_role;

CREATE INDEX IF NOT EXISTS idx_erp_configuracion_proyecto ON public.erp_configuracion(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_configuracion_clave ON public.erp_configuracion(clave);

-- Enable realtime for new tables (if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'erp_publicaciones_muro'
  ) THEN
    alter publication supabase_realtime add table public.erp_publicaciones_muro;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'erp_bodega'
  ) THEN
    alter publication supabase_realtime add table public.erp_bodega;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'erp_documentos'
  ) THEN
    alter publication supabase_realtime add table public.erp_documentos;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'erp_recepciones_almacen'
  ) THEN
    alter publication supabase_realtime add table public.erp_recepciones_almacen;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'erp_permisos'
  ) THEN
    alter publication supabase_realtime add table public.erp_permisos;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'erp_checklist'
  ) THEN
    alter publication supabase_realtime add table public.erp_checklist;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'erp_configuracion'
  ) THEN
    alter publication supabase_realtime add table public.erp_configuracion;
  END IF;
END $$;
