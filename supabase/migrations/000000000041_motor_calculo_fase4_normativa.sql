-- ============================================================
-- MOTOR DE CÁLCULO AVANZADO - FASE 4 - CGN-03
-- SISTEMA DE NORMATIVA DEPARTAMENTAL
-- ============================================================

-- Tabla de normativa departamental
CREATE TABLE IF NOT EXISTS erp_normativa_departamental (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  departamento_codigo text NOT NULL CHECK (departamento_codigo IN ('GT-01','GT-02','GT-03','GT-04','GT-05','GT-06','GT-07','GT-08','GT-09','GT-10','GT-11','GT-12','GT-13','GT-14','GT-15','GT-16','GT-17','GT-18','GT-19','GT-20','GT-21','GT-22')),
  tipo_norma text NOT NULL CHECK (tipo_norma IN ('estructural','sismica','urbanistica','ambiental','electrica','sanitaria','vial','acustica')),
  codigo_norma text NOT NULL,
  nombre_norma text NOT NULL,
  descripcion text,
  ano_ultima_revision integer,
  organismo_emisor text,
  
  -- Parámetros específicos según tipo de norma
  parametros_normativos jsonb NOT NULL,
  
  -- Valores específicos por tipo
  carga_viva_minima numeric(6,2) DEFAULT NULL, -- kg/m² (para normas urbanísticas)
  coeficiente_sismico numeric(4,3) DEFAULT NULL, -- para normas sísmicas
  factor_resistencia_minima numeric(5,3) DEFAULT NULL, -- para normas estructurales
  zonificacion_climatica text DEFAULT NULL,
  restricciones_altitud numeric(6,2) DEFAULT NULL, -- msnm
  
  -- Documentación y referencias
  url_documento text,
  referencia_tecnica text,
  
  -- Estado y aplicabilidad
  activo boolean DEFAULT true,
  fecha_vigencia_inicio date,
  fecha_vigencia_fin date,
  obligatoria boolean DEFAULT true,
  ambito_aplicacion text CHECK (ambito_aplicacion IN ('nacional','departamental','municipal')),
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX idx_normativa_departamento_codigo ON erp_normativa_departamental(departamento_codigo);
CREATE INDEX idx_normativa_tipo ON erp_normativa_departamental(tipo_norma);
CREATE INDEX idx_normativa_codigo ON erp_normativa_departamental(codigo_norma);
CREATE INDEX idx_normativa_activo ON erp_normativa_departamental(activo);
CREATE INDEX idx_normativa_vigencia ON erp_normativa_departamental(fecha_vigencia_inicio, fecha_vigencia_fin);

-- Tabla de cumplimiento normativo por proyecto
CREATE TABLE IF NOT EXISTS erp_cumplimiento_normativo (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id text NOT NULL,
  norma_id uuid NOT NULL REFERENCES erp_normativa_departamental(id),
  estado_cumplimiento text CHECK (estado_cumplimiento IN ('pendiente','en_proceso','cumple','no_cumple','excepcionado')),
  fecha_verificacion date,
  responsable_verificacion text,
  evidencias_cumplimiento jsonb DEFAULT '{}'::jsonb,
  observaciones text,
  requiere_acciones_correctivas boolean DEFAULT false,
  acciones_correctivas text[],
  fecha_limite_correccion date,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX idx_cumplimiento_proyecto ON erp_cumplimiento_normativo(proyecto_id);
CREATE INDEX idx_cumplimiento_norma ON erp_cumplimiento_normativo(norma_id);
CREATE INDEX idx_cumplimiento_estado ON erp_cumplimiento_normativo(estado_cumplimiento);
CREATE INDEX idx_cumplimiento_fecha ON erp_cumplimiento_normativo(fecha_verificacion);

-- Función para obtener normativa aplicable por departamento
CREATE OR REPLACE FUNCTION obtener_normativa_departamental(
  p_departamento_codigo text,
  p_tipo_norma text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  codigo_norma text,
  nombre_norma text,
  parametros_normativos jsonb,
  carga_viva_minima numeric,
  coeficiente_sismico numeric,
  activo boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id, n.codigo_norma, n.nombre_norma, n.parametros_normativos,
    n.carga_viva_minima, n.coeficiente_sismico, n.activo
  FROM erp_normativa_departamental n
  WHERE n.departamento_codigo = p_departamento_codigo
    AND n.activo = true
    AND (n.fecha_vigencia_inicio IS NULL OR n.fecha_vigencia_inicio <= CURRENT_DATE)
    AND (n.fecha_vigencia_fin IS NULL OR n.fecha_vigencia_fin >= CURRENT_DATE)
    AND (p_tipo_norma IS NULL OR n.tipo_norma = p_tipo_norma)
  ORDER BY n.obligatoria DESC, n.ano_ultima_revision DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Función para validar cumplimiento normativo en un cálculo
CREATE OR REPLACE FUNCTION validar_cumplimiento_normativo(
  p_proyecto_id text,
  p_departamento_codigo text,
  p_tipo_calculo text,
  p_parametros_calculo jsonb
)
RETURNS TABLE(
  norma_id uuid,
  codigo_norma text,
  estado_cumplimiento text,
  alertas jsonb
) AS $$
DECLARE
  v_norma RECORD;
  v_alertas jsonb := '[]'::jsonb;
  v_estado text := 'cumple';
BEGIN
  FOR v_norma IN 
    SELECT id, codigo_norma, parametros_normativos 
    FROM erp_normativa_departamental 
    WHERE departamento_codigo = p_departamento_codigo 
      AND activo = true
  LOOP
    -- Validaciones específicas según tipo de cálculo
    IF p_tipo_calculo = 'dosificacion_concreto' THEN
      -- Validación resistencia vs normativa estructural
      IF v_norma.parametros_normativos->'resistencia_minima' IS NOT NULL THEN
        IF (p_parametros_calculo->>'resistencia')::numeric < (v_norma.parametros_normativos->>'resistencia_minima')::numeric THEN
          v_alertas := v_alertas || jsonb_build_object(
            'tipo', 'normativa',
            'mensaje', 'Resistencia de concreto insuficiente según normativa',
            'codigo_norma', v_norma.codigo_norma,
            'valor_actual', p_parametros_calculo->>'resistencia',
            'valor_requerido', v_norma.parametros_normativos->>'resistencia_minima'
          );
          v_estado := 'no_cumple';
        END IF;
      END IF;
    ELSIF p_tipo_calculo = 'pavimento' THEN
      -- Validación carga viva vs normativa urbana
      IF v_norma.carga_viva_minima IS NOT NULL THEN
        IF (p_parametros_calculo->>'carga_viva')::numeric < v_norma.carga_viva_minima THEN
          v_alertas := v_alertas || jsonb_build_object(
            'tipo', 'normativa',
            'mensaje', 'Carga viva insuficiente según normativa urbana',
            'codigo_norma', v_norma.codigo_norma,
            'valor_actual', p_parametros_calculo->>'carga_viva',
            'valor_requerido', v_norma.carga_viva_minima
          );
          v_estado := 'no_cumple';
        END IF;
      END IF;
    END IF;
    
    RETURN QUERY NEXT v_norma.id, v_norma.codigo_norma, v_estado, v_alertas;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Seed data: normativa para los principales departamentos
INSERT INTO erp_normativa_departamental (departamento_codigo, tipo_norma, codigo_norma, nombre_norma, descripcion, ano_ultima_revision, organismo_emisor, parametros_normativos, carga_viva_minima, coeficiente_sismico, factor_resistencia_minima, obligatoria, ambito_aplicacion) VALUES
-- Guatemala (GT-01)
('GT-01', 'sismica', 'AGIE-NORM-2016', 'Norma Sísmica AGIE 2016', 'Normativa sísmica para Guatemala', 2016, 'AGIE', '{"zonas": ["Zona 1", "Zona 2", "Zona 3"], "periodos": ["0.5s", "1.0s"]}'::jsonb, NULL, 0.25, 1.0, true, 'nacional'),
('GT-01', 'urbanistica', 'MUNICIPAL-GT-01-2020', 'Normativa Urbana Guatemala', 'Normativa urbana para el municipio de Guatemala', 2020, 'Municipalidad de Guatemala', '{"zonas_residenciales": ["R1", "R2", "R3"], "zonas_comerciales": ["C1", "C2"], "zonas_industriales": ["I1"]}'::jsonb, 250.00, NULL, NULL, true, 'municipal'),
('GT-01', 'estructural', 'COVENIN-1753-2008', 'Normativa Estructural', 'Normativa para diseño estructural', 2008, 'COVENIN', '{"materiales": ["concreto", "acero"], "metodos": ["LRFD", "ASD"]}'::jsonb, NULL, NULL, 1.3, true, 'nacional'),

-- Quetzaltenango (GT-09) - zona sísmica alta
('GT-09', 'sismica', 'AGIE-NORM-2016-XE', 'Norma Sísmica Quetzaltenango', 'Ajustes sísmicos por altitud >2000msnm', 2017, 'AGIE', '{"zonas": ["Zona 3"], "factor_altitud": 1.15}'::jsonb, NULL, 0.35, 1.1, true, 'departamental'),
('GT-09', 'urbanistica', 'MUNICIPAL-XE-2019', 'Normativa Urbana Xela', 'Normativa urbana específica', 2019, 'Municipalidad de Quetzaltenango', '{"zonas_residenciales": ["R1"], "zonas_historicas": ["H1"]}'::jsonb, 200.00, NULL, NULL, true, 'municipal'),

-- Escuintla (GT-05) - zona industrial
('GT-05', 'ambiental', 'MINED-AMBIENTAL-2018', 'Normativa Ambiental', 'Regulaciones ambientales zona industrial', 2018, 'MINED', '{"zonas_industriales": ["ZI-1", "ZI-2"], "emisiones_maximas": true}'::jsonb, NULL, NULL, NULL, true, 'departamental'),
('GT-05', 'urbanistica', 'MUNICIPAL-ESC-2021', 'Normativa Urbana Escuintla', 'Normativa para zona industrial', 2021, 'Municipalidad de Escuintla', '{"zonas_industriales": ["I1", "I2", "I3"]}'::jsonb, 300.00, NULL, NULL, true, 'municipal'),

-- Sololá (GT-07) - zona climática especial
('GT-07', 'ambiental', 'MINED-CLIMA-2019', 'Normativa Climática Sololá', 'Regulaciones por clima frío', 2019, 'MINED', '{"factor_curado": 1.5, "protecciones_antiheladas": true}'::jsonb, NULL, NULL, NULL, true, 'departamental'),
('GT-07', 'sismica', 'AGIE-NORM-2016-SO', 'Norma Sísmica Sololá', 'Ajustes sísmicos por condiciones locales', 2018, 'AGIE', '{"zonas": ["Zona 3"], "factor_suelo_volcanico": 1.1}'::jsonb, NULL, 0.30, 1.0, true, 'departamental'),

-- Petén (GT-16) - zona climática tropical
('GT-16', 'ambiental', 'MINED-HUMEDAD-2020', 'Normativa Humedad Petén', 'Regulaciones por clima tropical', 2020, 'MINED', '{"factor_humedad": 1.2, "protecciones_hongos": true}'::jsonb, NULL, NULL, NULL, true, 'departamental'),
('GT-16', 'sanitaria', 'MSPAS-SANITARIA-2019', 'Normativa Sanitaria Petén', 'Regulaciones sanitarias zona tropical', 2019, 'MSPAS', '{"zonas_salubres": ["S1", "S2"], "control_vectorial": true}'::jsonb, NULL, NULL, NULL, true, 'departamental');

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_updated_at_normativa()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_updated_at_normativa
  BEFORE UPDATE ON erp_normativa_departamental
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at_normativa();

CREATE TRIGGER trigger_actualizar_updated_at_cumplimiento
  BEFORE UPDATE ON erp_cumplimiento_normativo
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at_normativa();

-- RLS Policies
ALTER TABLE erp_normativa_departamental ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_cumplimiento_normativo ENABLE ROW LEVEL SECURITY;

-- Policies para normativa departamental
CREATE POLICY "normativa_lectura_autenticados" 
  ON erp_normativa_departamental FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "normativa_escritura_autenticados" 
  ON erp_normativa_departamental FOR ALL 
  USING (auth.role() = 'authenticated');

-- Policies para cumplimiento normativo
CREATE POLICY "cumplimiento_lectura_autenticados" 
  ON erp_cumplimiento_normativo FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "cumplimiento_escritura_autenticados" 
  ON erp_cumplimiento_normativo FOR ALL 
  USING (auth.role() = 'authenticated');

-- Comentarios de documentación
COMMENT ON TABLE erp_normativa_departamental IS 'Normativas técnicas específicas por departamento de Guatemala';
COMMENT ON TABLE erp_cumplimiento_normativo IS 'Registro de cumplimiento normativo por proyecto';
COMMENT ON FUNCTION obtener_normativa_departamental IS 'Función para obtener normativa aplicable por departamento y tipo';
COMMENT ON FUNCTION validar_cumplimiento_normativo IS 'Función para validar cumplimiento normativo en cálculos específicos';