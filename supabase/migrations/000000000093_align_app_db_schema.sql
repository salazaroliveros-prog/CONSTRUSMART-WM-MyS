-- Migration 093: Alinear esquema DB con app
-- 2026-07-09

-- 1. Crear tabla faltante: erp_notificaciones
CREATE TABLE IF NOT EXISTS erp_notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id TEXT,
  tipo TEXT NOT NULL DEFAULT 'info',
  titulo TEXT NOT NULL,
  mensaje TEXT,
  leida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Agregar columnas faltantes a erp_proyectos
DO $$
BEGIN
  -- Campos de detalle
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='descripcion') THEN
    ALTER TABLE erp_proyectos ADD COLUMN descripcion TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='subtipo') THEN
    ALTER TABLE erp_proyectos ADD COLUMN subtipo TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='tipo_obra') THEN
    ALTER TABLE erp_proyectos ADD COLUMN tipo_obra TEXT DEFAULT 'nueva';
  END IF;

  -- Cliente detalle
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='cliente_nit') THEN
    ALTER TABLE erp_proyectos ADD COLUMN cliente_nit TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='cliente_telefono') THEN
    ALTER TABLE erp_proyectos ADD COLUMN cliente_telefono TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='cliente_email') THEN
    ALTER TABLE erp_proyectos ADD COLUMN cliente_email TEXT DEFAULT '';
  END IF;

  -- Direccion detalle
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='direccion') THEN
    ALTER TABLE erp_proyectos ADD COLUMN direccion TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='ciudad') THEN
    ALTER TABLE erp_proyectos ADD COLUMN ciudad TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='departamento') THEN
    ALTER TABLE erp_proyectos ADD COLUMN departamento TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='pais') THEN
    ALTER TABLE erp_proyectos ADD COLUMN pais TEXT DEFAULT 'Guatemala';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='codigo_postal') THEN
    ALTER TABLE erp_proyectos ADD COLUMN codigo_postal TEXT DEFAULT '';
  END IF;

  -- Dimensiones
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='area_construccion') THEN
    ALTER TABLE erp_proyectos ADD COLUMN area_construccion NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='num_pisos') THEN
    ALTER TABLE erp_proyectos ADD COLUMN num_pisos INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='plazo_semanas') THEN
    ALTER TABLE erp_proyectos ADD COLUMN plazo_semanas INTEGER DEFAULT 0;
  END IF;

  -- Responsables
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='ingeniero_residente') THEN
    ALTER TABLE erp_proyectos ADD COLUMN ingeniero_residente TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='supervisor') THEN
    ALTER TABLE erp_proyectos ADD COLUMN supervisor TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='arquitecto') THEN
    ALTER TABLE erp_proyectos ADD COLUMN arquitecto TEXT DEFAULT '';
  END IF;

  -- Documentacion
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='numero_expediente') THEN
    ALTER TABLE erp_proyectos ADD COLUMN numero_expediente TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='numero_licencia') THEN
    ALTER TABLE erp_proyectos ADD COLUMN numero_licencia TEXT DEFAULT '';
  END IF;

  -- Fechas adicionales
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='fecha_inicio_real') THEN
    ALTER TABLE erp_proyectos ADD COLUMN fecha_inicio_real DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='fecha_fin_estimada') THEN
    ALTER TABLE erp_proyectos ADD COLUMN fecha_fin_estimada DATE;
  END IF;

  -- Estado extendido
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='etapa') THEN
    ALTER TABLE erp_proyectos ADD COLUMN etapa TEXT DEFAULT 'planificacion';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='etapa_anterior') THEN
    ALTER TABLE erp_proyectos ADD COLUMN etapa_anterior TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='fecha_cambio_etapa') THEN
    ALTER TABLE erp_proyectos ADD COLUMN fecha_cambio_etapa TIMESTAMPTZ;
  END IF;

  -- Pausa
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='motivo_pausa') THEN
    ALTER TABLE erp_proyectos ADD COLUMN motivo_pausa TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='pausado_por') THEN
    ALTER TABLE erp_proyectos ADD COLUMN pausado_por TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='fecha_pausa') THEN
    ALTER TABLE erp_proyectos ADD COLUMN fecha_pausa TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='fecha_reanudacion_estimada') THEN
    ALTER TABLE erp_proyectos ADD COLUMN fecha_reanudacion_estimada DATE;
  END IF;

  -- Financiero adicional
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='margen_utilidad_objetivo') THEN
    ALTER TABLE erp_proyectos ADD COLUMN margen_utilidad_objetivo NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='moneda') THEN
    ALTER TABLE erp_proyectos ADD COLUMN moneda TEXT DEFAULT 'GTQ';
  END IF;

  -- Version optimista
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='version') THEN
    ALTER TABLE erp_proyectos ADD COLUMN version INTEGER DEFAULT 1;
  END IF;

  -- Timestamps
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='updated_at') THEN
    ALTER TABLE erp_proyectos ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- 3. RLS para erp_notificaciones
ALTER TABLE erp_notificaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios autenticados pueden leer notificaciones" ON erp_notificaciones;
CREATE POLICY "Usuarios autenticados pueden leer notificaciones" ON erp_notificaciones
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar notificaciones" ON erp_notificaciones;
CREATE POLICY "Usuarios autenticados pueden insertar notificaciones" ON erp_notificaciones
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar notificaciones" ON erp_notificaciones;
CREATE POLICY "Usuarios autenticados pueden actualizar notificaciones" ON erp_notificaciones
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar notificaciones" ON erp_notificaciones;
CREATE POLICY "Usuarios autenticados pueden eliminar notificaciones" ON erp_notificaciones
  FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Realtime para erp_notificaciones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'erp_notificaciones'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_notificaciones;
  END IF;
END $$;
