-- Enable RLS
ALTER TABLE cotizaciones_negocio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cotizaciones_negocio_access" ON cotizaciones_negocio
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND rol IN ('Administrador', 'Gerente', 'Residente', 'Compras')
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE cotizaciones_negocio;
