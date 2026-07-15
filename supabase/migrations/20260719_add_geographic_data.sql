-- ============================================================
-- MIGRACIÓN: Datos Geográficos de Guatemala
-- Fecha: 2026-07-19
-- Descripción: Tablas para departamentos y municipios de Guatemala
-- ============================================================

-- Crear tabla de departamentos
CREATE TABLE IF NOT EXISTS erp_departamentos_gt (
  codigo VARCHAR(3) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  codigo_iso VARCHAR(2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de municipios
CREATE TABLE IF NOT EXISTS erp_municipios_gt (
  codigo VARCHAR(5) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  departamento_codigo VARCHAR(3) NOT NULL,
  altitud_msnm INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_municipio_departamento 
    FOREIGN KEY (departamento_codigo) 
    REFERENCES erp_departamentos_gt(codigo)
    ON DELETE CASCADE
);

-- Crear índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_municipios_departamento 
  ON erp_municipios_gt(departamento_codigo);

CREATE INDEX IF NOT EXISTS idx_municipios_nombre 
  ON erp_municipios_gt(nombre);

-- Habilitar RLS
ALTER TABLE erp_departamentos_gt ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_municipios_gt ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (lectura pública para datos de referencia)
CREATE POLICY "Departamentos lectura pública" 
  ON erp_departamentos_gt FOR SELECT 
  USING (true);

CREATE POLICY "Municipios lectura pública" 
  ON erp_municipios_gt FOR SELECT 
  USING (true);

-- Solo admins pueden insertar/actualizar/eliminar
CREATE POLICY "Departamentos solo admin insert" 
  ON erp_departamentos_gt FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM erp_configuracion 
      WHERE clave = 'admin_email' 
      AND valor = auth.email()
    )
  );

CREATE POLICY "Departamentos solo admin update" 
  ON erp_departamentos_gt FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM erp_configuracion 
      WHERE clave = 'admin_email' 
      AND valor = auth.email()
    )
  );

CREATE POLICY "Departamentos solo admin delete" 
  ON erp_departamentos_gt FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM erp_configuracion 
      WHERE clave = 'admin_email' 
      AND valor = auth.email()
    )
  );

CREATE POLICY "Municipios solo admin insert" 
  ON erp_municipios_gt FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM erp_configuracion 
      WHERE clave = 'admin_email' 
      AND valor = auth.email()
    )
  );

CREATE POLICY "Municipios solo admin update" 
  ON erp_municipios_gt FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM erp_configuracion 
      WHERE clave = 'admin_email' 
      AND valor = auth.email()
    )
  );

CREATE POLICY "Municipios solo admin delete" 
  ON erp_municipios_gt FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM erp_configuracion 
      WHERE clave = 'admin_email' 
      AND valor = auth.email()
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_departamentos_updated_at
  BEFORE UPDATE ON erp_departamentos_gt
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_municipios_updated_at
  BEFORE UPDATE ON erp_municipios_gt
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE erp_departamentos_gt;
ALTER PUBLICATION supabase_realtime ADD TABLE erp_municipios_gt;

-- Comentario en tablas
COMMENT ON TABLE erp_departamentos_gt IS 'Catálogo de departamentos de Guatemala (datos de referencia)';
COMMENT ON TABLE erp_municipios_gt IS 'Catálogo de municipios de Guatemala con altitud (datos de referencia)';
