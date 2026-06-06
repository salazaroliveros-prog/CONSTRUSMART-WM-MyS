-- ============================================================
-- TABLAS FALTANTES - ERP CONSTRUSMART
-- Fecha: 2026-06-07
-- ============================================================

-- 1. erp_renglones - Líneas del presupuesto
CREATE TABLE IF NOT EXISTS erp_renglones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  presupuesto_id UUID NOT NULL REFERENCES erp_presupuestos(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  unidad TEXT NOT NULL,
  tipologia TEXT NOT NULL,
  cantidad NUMERIC NOT NULL DEFAULT 0,
  rendimiento_cuadrilla NUMERIC NOT NULL DEFAULT 0,
  costo_materiales NUMERIC NOT NULL DEFAULT 0,
  costo_mano_obra NUMERIC NOT NULL DEFAULT 0,
  costo_equipo NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC GENERATED ALWAYS AS (
    cantidad * (costo_materiales + costo_mano_obra + costo_equipo)
  ) STORED,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(presupuesto_id, codigo)
);

-- 2. erp_insumos - Insumos por renglón
CREATE TABLE IF NOT EXISTS erp_insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  renglon_id UUID NOT NULL REFERENCES erp_renglones(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  unidad TEXT NOT NULL,
  cantidad NUMERIC NOT NULL DEFAULT 0,
  precio NUMERIC NOT NULL DEFAULT 0,
  rendimiento NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC GENERATED ALWAYS AS (cantidad * precio) STORED,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. erp_sub_renglones - Sub-renglones de materiales
CREATE TABLE IF NOT EXISTS erp_sub_renglones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  renglon_id UUID NOT NULL REFERENCES erp_renglones(id) ON DELETE CASCADE,
  nombre_material TEXT NOT NULL,
  unidad TEXT NOT NULL,
  cantidad_unitaria NUMERIC NOT NULL DEFAULT 0,
  precio_unitario NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC GENERATED ALWAYS AS (
    cantidad_unitaria * precio_unitario
  ) STORED,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================

CREATE INDEX idx_renglones_proyecto_id ON erp_renglones(proyecto_id);
CREATE INDEX idx_renglones_presupuesto_id ON erp_renglones(presupuesto_id);
CREATE INDEX idx_insumos_renglon_id ON erp_insumos(renglon_id);
CREATE INDEX idx_sub_renglones_renglon_id ON erp_sub_renglones(renglon_id);

-- ============================================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================================

-- Habilitar RLS en las 3 tablas
ALTER TABLE erp_renglones ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_sub_renglones ENABLE ROW LEVEL SECURITY;

-- erp_renglones - Políticas
CREATE POLICY "Usuarios autenticados pueden leer renglones" ON erp_renglones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuario creador o admin puede modificar renglon" ON erp_renglones
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR auth.jwt() ->> 'rol' = 'Administrador')
  WITH CHECK (created_by = auth.uid() OR auth.jwt() ->> 'rol' = 'Administrador');

CREATE POLICY "Usuario puede insertar renglones" ON erp_renglones
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden eliminar" ON erp_renglones
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR auth.jwt() ->> 'rol' = 'Administrador');

-- erp_insumos - Políticas
CREATE POLICY "Usuarios autenticados pueden leer insumos" ON erp_insumos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuario creador o admin puede modificar insumo" ON erp_insumos
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR auth.jwt() ->> 'rol' = 'Administrador')
  WITH CHECK (created_by = auth.uid() OR auth.jwt() ->> 'rol' = 'Administrador');

CREATE POLICY "Usuario puede insertar insumos" ON erp_insumos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden eliminar" ON erp_insumos
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR auth.jwt() ->> 'rol' = 'Administrador');

-- erp_sub_renglones - Políticas
CREATE POLICY "Usuarios autenticados pueden leer sub_renglones" ON erp_sub_renglones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuario creador o admin puede modificar sub_renglon" ON erp_sub_renglones
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR auth.jwt() ->> 'rol' = 'Administrador')
  WITH CHECK (created_by = auth.uid() OR auth.jwt() ->> 'rol' = 'Administrador');

CREATE POLICY "Usuario puede insertar sub_renglones" ON erp_sub_renglones
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden eliminar" ON erp_sub_renglones
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR auth.jwt() ->> 'rol' = 'Administrador');

-- ============================================================
-- TRIGGERS PARA AUDITORÍA Y TIMESTAMPS
-- ============================================================

-- Trigger para updated_at en erp_renglones
CREATE OR REPLACE FUNCTION update_erp_renglones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_erp_renglones_updated_at
BEFORE UPDATE ON erp_renglones
FOR EACH ROW
EXECUTE FUNCTION update_erp_renglones_updated_at();

-- Trigger para updated_at en erp_insumos
CREATE OR REPLACE FUNCTION update_erp_insumos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_erp_insumos_updated_at
BEFORE UPDATE ON erp_insumos
FOR EACH ROW
EXECUTE FUNCTION update_erp_insumos_updated_at();

-- Trigger para updated_at en erp_sub_renglones
CREATE OR REPLACE FUNCTION update_erp_sub_renglones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_erp_sub_renglones_updated_at
BEFORE UPDATE ON erp_sub_renglones
FOR EACH ROW
EXECUTE FUNCTION update_erp_sub_renglones_updated_at();

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================

-- Contar registros en las 3 tablas
SELECT 
  'erp_renglones' as tabla,
  COUNT(*) as total_registros
FROM erp_renglones
UNION ALL
SELECT 
  'erp_insumos' as tabla,
  COUNT(*) as total_registros
FROM erp_insumos
UNION ALL
SELECT 
  'erp_sub_renglones' as tabla,
  COUNT(*) as total_registros
FROM erp_sub_renglones;
