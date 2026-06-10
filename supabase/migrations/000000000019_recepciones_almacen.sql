-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 19: Tabla recepciones_almacen
-- Versión: 2026-06-10
--
-- Crea la tabla para persistir recepciones de almacén
-- ============================================================

CREATE TABLE IF NOT EXISTS recepciones_almacen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oc_id TEXT NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  cantidad_recibida NUMERIC NOT NULL CHECK (cantidad_recibida > 0),
  cantidad_oc NUMERIC NOT NULL CHECK (cantidad_oc > 0),
  diferencia NUMERIC NOT NULL DEFAULT 0,
  material TEXT NOT NULL,
  proveedor TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE recepciones_almacen ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recepciones_almacen' AND policyname = 'Todos pueden leer recepciones_almacen') THEN
    CREATE POLICY "Todos pueden leer recepciones_almacen" ON recepciones_almacen FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recepciones_almacen' AND policyname = 'Usuarios autenticados pueden insertar recepciones_almacen') THEN
    CREATE POLICY "Usuarios autenticados pueden insertar recepciones_almacen" ON recepciones_almacen FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recepciones_almacen' AND policyname = 'Usuarios autenticados pueden eliminar recepciones_almacen') THEN
    CREATE POLICY "Usuarios autenticados pueden eliminar recepciones_almacen" ON recepciones_almacen FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Realtime
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'recepciones_almacen') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE recepciones_almacen;
  END IF;
END $$;
