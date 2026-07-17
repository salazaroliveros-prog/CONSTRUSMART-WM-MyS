-- Migration 120: Create erp_ventas_paquetes table (referenced by app but never created with erp_ prefix)
-- The legacy table "ventas_paquetes" exists from migration 002, but the app uses "erp_ventas_paquetes"

-- Create the table if it doesn't exist (migration 094 references it but never creates it)
CREATE TABLE IF NOT EXISTS public.erp_ventas_paquetes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'unidad',
  identificador TEXT NOT NULL,
  precio_venta NUMERIC(14,2) NOT NULL DEFAULT 0,
  precio_contrato NUMERIC(14,2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'disponible',
  cliente TEXT DEFAULT '',
  fecha_reserva TIMESTAMPTZ,
  fecha_venta TIMESTAMPTZ,
  plan_pago TEXT DEFAULT '',
  notas TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.erp_ventas_paquetes ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_erp_ventas_paquetes_proyecto ON public.erp_ventas_paquetes(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_ventas_paquetes_estado ON public.erp_ventas_paquetes(estado);

-- RLS policies (only if not already existing from migration 094)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_ventas_paquetes' AND policyname = 'ventas_read') THEN
    CREATE POLICY "ventas_read" ON public.erp_ventas_paquetes
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_ventas_paquetes' AND policyname = 'ventas_insert_auth') THEN
    CREATE POLICY "ventas_insert_auth" ON public.erp_ventas_paquetes
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_ventas_paquetes' AND policyname = 'ventas_update_auth') THEN
    CREATE POLICY "ventas_update_auth" ON public.erp_ventas_paquetes
      FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_ventas_paquetes' AND policyname = 'ventas_delete_admin') THEN
    CREATE POLICY "ventas_delete_admin" ON public.erp_ventas_paquetes
      FOR DELETE USING (
        auth.role() = 'authenticated'
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.rol IN ('admin', 'gerente')
        )
      );
  END IF;
END;
$$;

-- Grant service_role access
GRANT ALL ON public.erp_ventas_paquetes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_ventas_paquetes TO authenticated;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.erp_ventas_paquetes;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.fn_set_updated_at_erp_ventas_paquetes()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_erp_ventas_paquetes_updated ON public.erp_ventas_paquetes;
CREATE TRIGGER trg_erp_ventas_paquetes_updated
  BEFORE UPDATE ON public.erp_ventas_paquetes
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_set_updated_at_erp_ventas_paquetes();