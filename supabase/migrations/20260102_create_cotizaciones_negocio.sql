-- Tabla independiente para cotizaciones de nuevos negocios (no relación con cuadro comparativo)

CREATE TABLE IF NOT EXISTS cotizaciones_negocio (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
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

ALTER TABLE cotizaciones_negocio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cotizaciones_negocio_read"
  ON cotizaciones_negocio FOR SELECT TO authenticated USING (true);

CREATE POLICY "cotizaciones_negocio_write"
  ON cotizaciones_negocio FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador', 'Gerente', 'Compras', 'Residente')
    )
  );

CREATE INDEX IF NOT EXISTS idx_cotizaciones_negocio_estado
  ON cotizaciones_negocio(estado);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_negocio_fecha
  ON cotizaciones_negocio(fecha);

ALTER TABLE cotizaciones_negocio REPLICA IDENTITY FULL;
