-- ══════════════════════════════════════════════════════════════
-- Migración consolidada: Aplica TODAS las correcciones pendientes
-- Usa DO $$ blocks para evitar errores por duplicados
-- ══════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- PARTE 1: RLS POLICIES (con protección contra duplicados)
-- ══════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin/Gerente can manage all materials') THEN
    CREATE POLICY "Admin/Gerente can manage all materials" ON erp_materiales
      FOR ALL USING (public.get_user_role() IN ('Administrador', 'Gerente'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view materials') THEN
    CREATE POLICY "Users can view materials" ON erp_materiales
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin/Gerente/Compras can manage orders') THEN
    CREATE POLICY "Admin/Gerente/Compras can manage orders" ON erp_ordenes_compra
      FOR ALL USING (public.get_user_role() IN ('Administrador', 'Gerente', 'Compras'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Bodeguero can view orders') THEN
    CREATE POLICY "Bodeguero can view orders" ON erp_ordenes_compra
      FOR SELECT USING (public.get_user_role() = 'Bodeguero');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin/Gerente/Compras can manage suppliers') THEN
    CREATE POLICY "Admin/Gerente/Compras can manage suppliers" ON erp_proveedores
      FOR ALL USING (public.get_user_role() IN ('Administrador', 'Gerente', 'Compras'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view suppliers') THEN
    CREATE POLICY "Users can view suppliers" ON erp_proveedores
      FOR SELECT USING (true);
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- PARTE 2: CREAR TABLAS FALTANTES
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS erp_notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL DEFAULT 'general',
  titulo TEXT NOT NULL DEFAULT '',
  mensaje TEXT NOT NULL DEFAULT '',
  proyecto_id UUID REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  referencia_id TEXT,
  leido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE erp_notificaciones ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS erp_planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL DEFAULT '',
  disciplina TEXT NOT NULL DEFAULT 'arquitectura',
  version TEXT NOT NULL DEFAULT '1.0',
  estado TEXT NOT NULL DEFAULT 'borrador',
  archivo_url TEXT NOT NULL DEFAULT '',
  subido_por TEXT NOT NULL DEFAULT '',
  fecha_subida DATE NOT NULL DEFAULT CURRENT_DATE,
  revision INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE erp_planos ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS erp_rfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  numero TEXT NOT NULL DEFAULT '',
  titulo TEXT NOT NULL DEFAULT '',
  descripcion TEXT NOT NULL DEFAULT '',
  solicitante TEXT NOT NULL DEFAULT '',
  destino TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'abierto',
  fecha_solicitud DATE NOT NULL DEFAULT CURRENT_DATE,
  respuesta TEXT,
  fecha_respuesta DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE erp_rfis ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS erp_submittals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL DEFAULT '',
  categoria TEXT NOT NULL DEFAULT 'otro',
  proveedor TEXT NOT NULL DEFAULT '',
  fecha_envio DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE erp_submittals ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS erp_seguimiento_evm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  avance_fisico NUMERIC(5,2) NOT NULL DEFAULT 0,
  avance_financiero NUMERIC(5,2) NOT NULL DEFAULT 0,
  costo_planeado NUMERIC(12,2) NOT NULL DEFAULT 0,
  costo_real NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_planeado NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_ganado NUMERIC(12,2) NOT NULL DEFAULT 0,
  cv NUMERIC(12,2),
  sv NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE erp_seguimiento_evm ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════
-- PARTE 3: VISTAS DE COMPATIBILIDAD
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW erp_activos_herramienta AS SELECT * FROM activos_herramientas;
CREATE OR REPLACE VIEW erp_cuadros_comparativos AS SELECT * FROM cuadro_comparativo_proveedores;
CREATE OR REPLACE VIEW erp_publicaciones_muro AS SELECT * FROM erp_muro;
CREATE OR REPLACE VIEW erp_incidentes_sso AS SELECT * FROM erp_incidentes;

-- ══════════════════════════════════════════════════════════════
-- PARTE 4: RLS PARA TABLAS NUEVAS
-- ══════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notificaciones_select') THEN
    CREATE POLICY "notificaciones_select" ON erp_notificaciones FOR SELECT TO authenticated
      USING (created_by = auth.uid() OR public.get_user_role() IN ('Administrador','Gerente'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notificaciones_insert') THEN
    CREATE POLICY "notificaciones_insert" ON erp_notificaciones FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notificaciones_update') THEN
    CREATE POLICY "notificaciones_update" ON erp_notificaciones FOR UPDATE TO authenticated
      USING (created_by = auth.uid() OR public.get_user_role() IN ('Administrador','Gerente'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'planos_select') THEN
    CREATE POLICY "planos_select" ON erp_planos FOR SELECT TO authenticated
      USING (proyecto_id = ANY(public.get_accessible_proyectos()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'planos_write') THEN
    CREATE POLICY "planos_write" ON erp_planos FOR ALL TO authenticated
      USING (public.get_user_role() IN ('Administrador','Gerente','Residente'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rfis_select') THEN
    CREATE POLICY "rfis_select" ON erp_rfis FOR SELECT TO authenticated
      USING (proyecto_id = ANY(public.get_accessible_proyectos()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rfis_write') THEN
    CREATE POLICY "rfis_write" ON erp_rfis FOR ALL TO authenticated
      USING (public.get_user_role() IN ('Administrador','Gerente','Residente'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'submittals_select') THEN
    CREATE POLICY "submittals_select" ON erp_submittals FOR SELECT TO authenticated
      USING (proyecto_id = ANY(public.get_accessible_proyectos()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'submittals_write') THEN
    CREATE POLICY "submittals_write" ON erp_submittals FOR ALL TO authenticated
      USING (public.get_user_role() IN ('Administrador','Gerente'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'seguimiento_evm_select') THEN
    CREATE POLICY "seguimiento_evm_select" ON erp_seguimiento_evm FOR SELECT TO authenticated
      USING (proyecto_id = ANY(public.get_accessible_proyectos()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'seguimiento_evm_write') THEN
    CREATE POLICY "seguimiento_evm_write" ON erp_seguimiento_evm FOR ALL TO authenticated
      USING (public.get_user_role() IN ('Administrador','Gerente','Residente'));
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- PARTE 5: PUBLICACIÓN REALTIME + REPLICA IDENTITY
-- ══════════════════════════════════════════════════════════════

DO $$
DECLARE
  tablas TEXT[] := ARRAY[
    'erp_notificaciones', 'erp_planos', 'erp_rfis', 'erp_submittals',
    'erp_seguimiento_evm', 'profiles', 'logs_sistema', 'erp_licitaciones',
    'erp_hitos', 'erp_riesgos', 'erp_incidentes', 'erp_pruebas_laboratorio',
    'erp_no_conformidades', 'erp_liberaciones_partida',
    'activos_herramientas', 'cuadro_comparativo_proveedores',
    'cotizaciones', 'anticipos', 'amortizaciones', 'pagos_proveedores',
    'ventas_paquetes', 'centros_costo', 'destajos', 'cajas_chicas',
    'cotizaciones_negocio'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tablas
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS %I', t);
      EXECUTE format('ALTER TABLE IF EXISTS %I REPLICA IDENTITY FULL', t);
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Tabla % no existe, se omite', t;
    END;
  END LOOP;
END $$;

-- ══════════════════════════════════════════════════════════════
-- PARTE 6: ÍNDICES
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON erp_notificaciones(created_by);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leido ON erp_notificaciones(leido);
CREATE INDEX IF NOT EXISTS idx_notificaciones_created ON erp_notificaciones(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_planos_proyecto ON erp_planos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_rfis_proyecto ON erp_rfis(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_submittals_proyecto ON erp_submittals(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_seguimiento_evm_proyecto ON erp_seguimiento_evm(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_seguimiento_evm_fecha ON erp_seguimiento_evm(fecha);

-- ══════════════════════════════════════════════════════════════
-- PARTE 7: VERIFICACIÓN
-- ══════════════════════════════════════════════════════════════

SELECT 'REALTIME_TABLAS' as reporte, schemaname, tablename 
FROM pg_publication_tables WHERE publicationname = 'supabase_realtime' ORDER BY tablename;