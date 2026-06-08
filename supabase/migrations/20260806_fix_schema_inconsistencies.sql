-- ══════════════════════════════════════════════════════════════
-- Migración: Corregir inconsistencias entre frontend y esquema SQL
-- Fecha: 8/6/2026
-- ══════════════════════════════════════════════════════════════

-- INCONSISTENCIAS DETECTADAS:
-- 1. Frontend usa erp_notificaciones -> NO EXISTE en BD
-- 2. Frontend usa erp_planos -> NO EXISTE en BD  
-- 3. Frontend usa erp_rfis -> NO EXISTE en BD
-- 4. Frontend usa erp_submittals -> NO EXISTE en BD
-- 5. Frontend usa erp_seguimiento_evm -> BD tiene erp_seguimiento (otra estructura)
-- 6. Frontend usa erp_activos_herramienta -> BD tiene activos_herramientas (sin prefijo)
-- 7. Frontend usa erp_cuadros_comparativos -> BD tiene cuadro_comparativo_proveedores
-- 8. Frontend usa erp_incidentes_sso -> BD tiene erp_incidentes
-- 9. Frontend usa erp_publicaciones_muro -> BD tiene erp_muro
-- 10. Publicación Realtime incompleta para tablas existentes

-- ══════════════════════════════════════════════════════════════
-- PARTE 1: CREAR TABLAS FALTANTES
-- ══════════════════════════════════════════════════════════════

-- 1.1 erp_notificaciones (usada en frontend para notificaciones push)
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

-- 1.2 erp_planos (gestión documental)
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

-- 1.3 erp_rfis (Request for Information)
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

-- 1.4 erp_submittals (Submittals de materiales/equipos)
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

-- 1.5 erp_seguimiento_evm (Earned Value Management)
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
-- PARTE 2: CREAR VISTAS DE COMPATIBILIDAD (alias para tablas existentes)
-- ══════════════════════════════════════════════════════════════

-- 2.1 erp_activos_herramienta -> vista sobre activos_herramientas
CREATE OR REPLACE VIEW erp_activos_herramienta AS
SELECT * FROM activos_herramientas;

-- 2.2 erp_cuadros_comparativos -> vista sobre cuadro_comparativo_proveedores
CREATE OR REPLACE VIEW erp_cuadros_comparativos AS
SELECT * FROM cuadro_comparativo_proveedores;

-- 2.3 erp_publicaciones_muro -> vista sobre erp_muro
CREATE OR REPLACE VIEW erp_publicaciones_muro AS
SELECT * FROM erp_muro;

-- 2.4 erp_incidentes_sso -> vista sobre erp_incidentes
CREATE OR REPLACE VIEW erp_incidentes_sso AS
SELECT * FROM erp_incidentes;

-- ══════════════════════════════════════════════════════════════
-- PARTE 3: POLÍTICAS RLS PARA TABLAS NUEVAS
-- ══════════════════════════════════════════════════════════════

-- 3.1 RLS para erp_notificaciones
CREATE POLICY "notificaciones_select" ON erp_notificaciones
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.get_user_role() IN ('Administrador','Gerente'));

CREATE POLICY "notificaciones_insert" ON erp_notificaciones
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "notificaciones_update" ON erp_notificaciones
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.get_user_role() IN ('Administrador','Gerente'));

-- 3.2 RLS para erp_planos
CREATE POLICY "planos_select" ON erp_planos
  FOR SELECT TO authenticated
  USING (proyecto_id = ANY(public.get_accessible_proyectos()));

CREATE POLICY "planos_write" ON erp_planos
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('Administrador','Gerente','Residente'));

-- 3.3 RLS para erp_rfis
CREATE POLICY "rfis_select" ON erp_rfis
  FOR SELECT TO authenticated
  USING (proyecto_id = ANY(public.get_accessible_proyectos()));

CREATE POLICY "rfis_write" ON erp_rfis
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('Administrador','Gerente','Residente'));

-- 3.4 RLS para erp_submittals
CREATE POLICY "submittals_select" ON erp_submittals
  FOR SELECT TO authenticated
  USING (proyecto_id = ANY(public.get_accessible_proyectos()));

CREATE POLICY "submittals_write" ON erp_submittals
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('Administrador','Gerente'));

-- 3.5 RLS para erp_seguimiento_evm
CREATE POLICY "seguimiento_evm_select" ON erp_seguimiento_evm
  FOR SELECT TO authenticated
  USING (proyecto_id = ANY(public.get_accessible_proyectos()));

CREATE POLICY "seguimiento_evm_write" ON erp_seguimiento_evm
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('Administrador','Gerente','Residente'));

-- ══════════════════════════════════════════════════════════════
-- PARTE 4: AGREGAR A PUBLICACIÓN REALTIME
-- ══════════════════════════════════════════════════════════════

DO $$
DECLARE
  tablas TEXT[] := ARRAY[
    'erp_notificaciones',
    'erp_planos',
    'erp_rfis',
    'erp_submittals',
    'erp_seguimiento_evm',
    'profiles',
    'logs_sistema',
    'erp_licitaciones',
    'erp_hitos',
    'erp_riesgos',
    'erp_incidentes',
    'erp_pruebas_laboratorio',
    'erp_no_conformidades',
    'erp_liberaciones_partida'
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
-- PARTE 5: ÍNDICES DE RENDIMIENTO
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
-- PARTE 6: VERIFICACIÓN FINAL
-- ══════════════════════════════════════════════════════════════

-- Listar tablas en publicación Realtime
SELECT schemaname, tablename FROM pg_publication_tables 
WHERE publicationname = 'supabase_realtime' 
ORDER BY tablename;

-- Verificar tablas con RLS activado
SELECT relname AS tabla, relrowsecurity AS rls_activado
FROM pg_class 
WHERE relname LIKE 'erp_%' AND relrowsecurity = true
ORDER BY relname;