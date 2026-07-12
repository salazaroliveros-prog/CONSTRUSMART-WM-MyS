-- Crear tabla erp_cotizaciones_negocio si no existe (con prefijo correcto)
CREATE TABLE IF NOT EXISTS erp_cotizaciones_negocio (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo text NOT NULL DEFAULT 'construccion',
  numero text DEFAULT '',
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento date,
  cliente_nombre text NOT NULL DEFAULT '',
  cliente_nit text,
  cliente_telefono text,
  cliente_email text,
  cliente_direccion text,
  descripcion text DEFAULT '',
  alcance text DEFAULT '',
  renglones jsonb DEFAULT '[]'::jsonb,
  costo_directo_total numeric(12,2) NOT NULL DEFAULT 0,
  precio_venta_total numeric(12,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'borrador',
  notas text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE erp_cotizaciones_negocio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cotizaciones_negocio_access" ON erp_cotizaciones_negocio
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND rol IN ('Administrador', 'Gerente', 'Residente', 'Compras')
    )
  );

CREATE INDEX IF NOT EXISTS idx_erp_cotizaciones_negocio_estado
  ON erp_cotizaciones_negocio(estado);

CREATE INDEX IF NOT EXISTS idx_erp_cotizaciones_negocio_fecha
  ON erp_cotizaciones_negocio(fecha);

ALTER TABLE erp_cotizaciones_negocio REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'erp_cotizaciones_negocio'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_cotizaciones_negocio;
  END IF;
END $$;
