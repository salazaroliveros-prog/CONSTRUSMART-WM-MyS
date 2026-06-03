-- 000000000002_add_erp_presupuestos_table.sql

-- Agrega la tabla erp_presupuestos para almacenar presupuestos persistentes.
CREATE TABLE IF NOT EXISTS public.erp_presupuestos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  tipologia text NOT NULL CHECK (tipologia = ANY (ARRAY['residencial','comercial','industrial','civil','publica'])),
  renglones jsonb NOT NULL DEFAULT '[]',
  total_calculado numeric(12,2) NOT NULL DEFAULT 0,
  costo_directo_total numeric(12,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado = ANY (ARRAY['borrador','aprobado','rechazado'])),
  notas text,
  version_presupuesto integer NOT NULL DEFAULT 1,
  fecha_creacion timestamptz DEFAULT now() NOT NULL,
  fecha_actualizacion timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_erp_presupuestos_proyecto ON public.erp_presupuestos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_presupuestos_estado ON public.erp_presupuestos(estado);

CREATE OR REPLACE FUNCTION public.update_erp_presupuestos_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.fecha_actualizacion = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_erp_presupuestos_timestamp ON public.erp_presupuestos;
CREATE TRIGGER trg_erp_presupuestos_timestamp
BEFORE UPDATE ON public.erp_presupuestos
FOR EACH ROW EXECUTE FUNCTION public.update_erp_presupuestos_timestamp();

ALTER TABLE public.erp_proyectos ADD COLUMN IF NOT EXISTS presupuesto_actual_id uuid;
ALTER TABLE public.erp_proyectos ADD CONSTRAINT IF NOT EXISTS erp_proyectos_presupuesto_actual_id_fkey FOREIGN KEY (presupuesto_actual_id) REFERENCES public.erp_presupuestos(id);

ALTER TABLE public.erp_presupuestos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to view presupuestos" ON public.erp_presupuestos;
CREATE POLICY "Allow authenticated users to view presupuestos" ON public.erp_presupuestos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to create presupuestos" ON public.erp_presupuestos;
CREATE POLICY "Allow authenticated users to create presupuestos" ON public.erp_presupuestos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update presupuestos" ON public.erp_presupuestos;
CREATE POLICY "Allow authenticated users to update presupuestos" ON public.erp_presupuestos FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete presupuestos" ON public.erp_presupuestos;
CREATE POLICY "Allow authenticated users to delete presupuestos" ON public.erp_presupuestos FOR DELETE USING (true);
