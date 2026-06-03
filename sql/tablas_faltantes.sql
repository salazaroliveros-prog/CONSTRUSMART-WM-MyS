-- =============================================================
-- CONSTRUSMART ERP - Tablas faltantes detectadas en el codigo
-- Hallazgo #10/#12: Tablas referenciadas en store.tsx que no
-- existen en la base de datos
-- =============================================================

-- 1. erp_avances - Referenciada en addAvance/deleteAvance
-- store.tsx linea ~1260: supabase.from('erp_avances').insert(...)
CREATE TABLE IF NOT EXISTS public.erp_avances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id uuid NOT NULL,
  presupuesto_id uuid,
  renglon_id uuid,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  avance_fisico numeric NOT NULL DEFAULT 0,
  cantidad_ejecutada numeric NOT NULL DEFAULT 0,
  foto text,
  latitud double precision,
  longitud double precision,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_avances
  ADD CONSTRAINT erp_avances_proyecto_id_fkey
  FOREIGN KEY (proyecto_id) REFERENCES public.erp_proyectos(id);

ALTER TABLE public.erp_avances ENABLE ROW LEVEL SECURITY;

CREATE POLICY avances_select ON public.erp_avances FOR SELECT TO authenticated USING (true);
CREATE POLICY avances_insert ON public.erp_avances FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY avances_update ON public.erp_avances FOR UPDATE TO authenticated USING (true);
CREATE POLICY avances_delete ON public.erp_avances FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.erp_avances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 2. erp_licitaciones - Referenciada en addLicitacion/updateLicitacion/deleteLicitacion
-- store.tsx linea ~1270: supabase.from('erp_licitaciones').insert(...)
CREATE TABLE IF NOT EXISTS public.erp_licitaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  cliente text NOT NULL,
  monto numeric NOT NULL DEFAULT 0,
  fecha_limite date,
  estado text NOT NULL DEFAULT 'activa',
  documentos jsonb DEFAULT '[]'::jsonb,
  notas text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_licitaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY licitaciones_select ON public.erp_licitaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY licitaciones_insert ON public.erp_licitaciones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY licitaciones_update ON public.erp_licitaciones FOR UPDATE TO authenticated USING (true);
CREATE POLICY licitaciones_delete ON public.erp_licitaciones FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.erp_licitaciones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 3. erp_auditoria - Referenciada en el SQL pero tabla no creada
CREATE TABLE IF NOT EXISTS public.erp_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid,
  usuario_nombre text NOT NULL,
  accion text NOT NULL,
  entidad text NOT NULL,
  entidad_id text,
  valores_anteriores jsonb,
  valores_nuevos jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY auditoria_select ON public.erp_auditoria FOR SELECT TO authenticated USING (true);
CREATE POLICY auditoria_insert ON public.erp_auditoria FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY auditoria_update ON public.erp_auditoria FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);
CREATE POLICY auditoria_delete ON public.erp_auditoria FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- Tabla ya creada por align_supabase_completo.sql, re-crear con IF NOT EXISTS es seguro