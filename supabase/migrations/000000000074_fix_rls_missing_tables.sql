-- Migración 074: Cerrar gap de RLS en 5 tablas sin políticas
-- Tablas: erp_activos, erp_cuadros, erp_planos, erp_rfis, erp_submittals

CREATE TABLE IF NOT EXISTS erp_activos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  codigo_inventario text UNIQUE NOT NULL,
  tipo text NOT NULL,
  marca text,
  modelo text,
  numero_serie text,
  valor_adquisicion numeric(12,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'disponible',
  ubicacion text,
  asignado_a text,
  fecha_asignacion date,
  fecha_adquisicion date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_cuadros (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
  solicitud text NOT NULL,
  fecha_solicitud date NOT NULL DEFAULT CURRENT_DATE,
  fecha_cierre date,
  estado text NOT NULL DEFAULT 'abierto',
  adjudicado_a uuid REFERENCES erp_proveedores(id) ON DELETE SET NULL,
  observaciones text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_planos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  disciplina text,
  version text,
  fecha_emision date,
  estado text NOT NULL DEFAULT 'borrador',
  archivo_url text,
  revisado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_rfis (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  descripcion text,
  estado text NOT NULL DEFAULT 'abierto',
  solicitado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  respondido_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_respuesta date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_submittals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  descripcion text,
  tipo text,
  estado text NOT NULL DEFAULT 'pendiente',
  enviado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revisado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_revision date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE erp_activos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_cuadros ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_submittals ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_activos' AND policyname = 'activos_read') THEN
    CREATE POLICY "activos_read" ON erp_activos FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_activos' AND policyname = 'activos_write') THEN
    CREATE POLICY "activos_write" ON erp_activos FOR ALL TO authenticated USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Bodeguero'))
    );
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_cuadros' AND policyname = 'cuadros_read') THEN
    CREATE POLICY "cuadros_read" ON erp_cuadros FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_cuadros' AND policyname = 'cuadros_write') THEN
    CREATE POLICY "cuadros_write" ON erp_cuadros FOR ALL TO authenticated USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Compras'))
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_planos' AND policyname = 'planos_read') THEN
    CREATE POLICY "planos_read" ON erp_planos FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_planos' AND policyname = 'planos_write') THEN
    CREATE POLICY "planos_write" ON erp_planos FOR ALL TO authenticated USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_rfis' AND policyname = 'rfis_read') THEN
    CREATE POLICY "rfis_read" ON erp_rfis FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_rfis' AND policyname = 'rfis_write') THEN
    CREATE POLICY "rfis_write" ON erp_rfis FOR ALL TO authenticated USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_submittals' AND policyname = 'submittals_read') THEN
    CREATE POLICY "submittals_read" ON erp_submittals FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_submittals' AND policyname = 'submittals_write') THEN
    CREATE POLICY "submittals_write" ON erp_submittals FOR ALL TO authenticated USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente', 'Residente'))
    );
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_erp_activos_proyecto ON erp_activos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_cuadros_proyecto ON erp_cuadros(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_planos_proyecto ON erp_planos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_rfis_proyecto ON erp_rfis(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_submittals_proyecto ON erp_submittals(proyecto_id);

ALTER TABLE erp_activos REPLICA IDENTITY FULL;
ALTER TABLE erp_cuadros REPLICA IDENTITY FULL;
ALTER TABLE erp_planos REPLICA IDENTITY FULL;
ALTER TABLE erp_rfis REPLICA IDENTITY FULL;
ALTER TABLE erp_submittals REPLICA IDENTITY FULL;

INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
SELECT '000000000074', 'fix_rls_missing_tables', ARRAY[
  'Created RLS + policies for erp_activos, erp_cuadros, erp_planos, erp_rfis, erp_submittals',
  'Added indexes and replica identity for realtime'
]
WHERE NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '000000000074');
