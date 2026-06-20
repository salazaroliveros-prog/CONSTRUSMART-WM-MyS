-- ============================================================
-- MOTOR DE CÁLCULO AVANZADO - FASE 5 - ID-01
-- SISTEMA DE REGLAS DE APLICACIÓN DE FACTORES
-- ============================================================

-- Tabla de reglas de aplicación de factores
CREATE TABLE IF NOT EXISTS erp_reglas_factores (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  tipo_factor text NOT NULL CHECK (tipo_factor IN ('zona','tipologia','escalas','estacional','climatico','normativa','sobrecosto')),
  prioridad integer NOT NULL DEFAULT 0 CHECK (prioridad >= 0 AND prioridad <= 100),
  condicion jsonb NOT NULL,
  factor_aplicacion numeric(5,3) NOT NULL CHECK (factor_aplicacion > 0),
  operador text NOT NULL CHECK (operador IN ('multiplicar','sumar','restar','porcentaje')),
  ambito text NOT NULL CHECK (ambito IN ('global','departamento','municipio','proyecto','renglon')),
  departamento_id text,
  municipio_id text,
  tipologia text,
  activo boolean DEFAULT true,
  fecha_inicio date,
  fecha_fin date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX idx_reglas_factores_tipo ON erp_reglas_factores(tipo_factor, activo);
CREATE INDEX idx_reglas_factores_prioridad ON erp_reglas_factores(prioridad DESC, activo);
CREATE INDEX idx_reglas_factores_ambito ON erp_reglas_factores(ambito, departamento_id, municipio_id);
CREATE INDEX idx_reglas_factores_tipologia ON erp_reglas_factores(tipologia);
CREATE INDEX idx_reglas_factores_fechas ON erp_reglas_factores(fecha_inicio, fecha_fin);

-- Tabla de historial de aplicación de reglas
CREATE TABLE IF NOT EXISTS erp_historial_aplicacion_reglas (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id text,
  renglon_id text,
  regla_id uuid NOT NULL REFERENCES erp_reglas_factores(id),
  valor_original numeric(12,2),
  valor_aplicado numeric(12,2),
  factor_aplicado numeric(5,3),
  contexto_aplicacion jsonb,
  usuario_id text,
  fecha_aplicacion timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX idx_historial_reglas_proyecto ON erp_historial_aplicacion_reglas(proyecto_id, fecha_aplicacion DESC);
CREATE INDEX idx_historial_reglas_renglon ON erp_historial_aplicacion_reglas(renglon_id);
CREATE INDEX idx_historial_reglas_regla ON erp_historial_aplicacion_reglas(regla_id);
CREATE INDEX idx_historial_reglas_fecha ON erp_historial_aplicacion_reglas(fecha_aplicacion DESC);

-- Función para aplicar reglas de factores
CREATE OR REPLACE FUNCTION aplicar_reglas_factor(
  p_valor numeric,
  p_tipo_factor text,
  p_contexto jsonb DEFAULT '{}'::jsonb,
  p_proyecto_id text DEFAULT NULL,
  p_renglon_id text DEFAULT NULL,
  p_usuario_id text DEFAULT NULL
)
RETURNS TABLE(
  valor_final numeric,
  reglas_aplicadas jsonb,
  factor_total numeric
) AS $$
DECLARE
  v_reglas RECORD;
  v_factor_acumulado numeric := 1.0;
  v_valor_actual numeric := p_valor;
  v_reglas_aplicadas jsonb := '[]'::jsonb;
  v_condicion_cumplida boolean;
BEGIN
  -- Obtener reglas activas ordenadas por prioridad
  FOR v_reglas IN 
    SELECT * FROM erp_reglas_factores 
    WHERE tipo_factor = p_tipo_factor 
      AND activo = true
      AND (fecha_inicio IS NULL OR fecha_inicio <= CURRENT_DATE)
      AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
    ORDER BY prioridad DESC
  LOOP
    -- Evaluar condición de la regla
    v_condicion_cumplida := evaluar_condicion_regla(v_reglas.condicion, p_contexto);
    
    IF v_condicion_cumplida THEN
      -- Aplicar factor según operador
      CASE v_reglas.operador
        WHEN 'multiplicar' THEN
          v_valor_actual := v_valor_actual * v_reglas.factor_aplicacion;
          v_factor_acumulado := v_factor_acumulado * v_reglas.factor_aplicacion;
        WHEN 'sumar' THEN
          v_valor_actual := v_valor_actual + v_reglas.factor_aplicacion;
        WHEN 'restar' THEN
          v_valor_actual := v_valor_actual - v_reglas.factor_aplicacion;
        WHEN 'porcentaje' THEN
          v_valor_actual := v_valor_actual * (1 + v_reglas.factor_aplicacion / 100);
          v_factor_acumulado := v_factor_acumulado * (1 + v_reglas.factor_aplicacion / 100);
      END CASE;
      
      -- Registrar regla aplicada
      v_reglas_aplicadas := v_reglas_aplicadas || jsonb_build_object(
        'regla_id', v_reglas.id,
        'nombre', v_reglas.nombre,
        'factor', v_reglas.factor_aplicacion,
        'operador', v_reglas.operador,
        'prioridad', v_reglas.prioridad
      );
      
      -- Registrar en historial
      INSERT INTO erp_historial_aplicacion_reglas (
        proyecto_id, renglon_id, regla_id, valor_original, 
        valor_aplicado, factor_aplicado, contexto_aplicacion, usuario_id
      ) VALUES (
        p_proyecto_id, p_renglon_id, v_reglas.id, p_valor,
        v_valor_actual, v_reglas.factor_aplicacion, p_contexto, p_usuario_id
      );
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_valor_actual, v_reglas_aplicadas, v_factor_acumulado;
END;
$$ LANGUAGE plpgsql;

-- Función auxiliar para evaluar condiciones
CREATE OR REPLACE FUNCTION evaluar_condicion_regla(
  p_condicion jsonb,
  p_contexto jsonb
)
RETURNS boolean AS $$
DECLARE
  v_cond_key text;
  v_cond_value jsonb;
  v_context_value jsonb;
  v_result boolean := true;
BEGIN
  -- Si no hay condición, se cumple
  IF p_condicion IS NULL OR jsonb_typeof(p_condicion) = 'null' THEN
    RETURN true;
  END IF;
  
  -- Evaluar cada condición
  FOR v_cond_key, v_cond_value IN SELECT * FROM jsonb_each(p_condicion) LOOP
    v_context_value := p_contexto->v_cond_key;
    
    -- Si el campo no existe en contexto, no se cumple
    IF v_context_value IS NULL THEN
      RETURN false;
    END IF;
    
    -- Evaluar según tipo de condición
    IF jsonb_typeof(v_cond_value) = 'object' THEN
      -- Condición con operador
      IF v_cond_value ? 'operador' AND v_cond_value ? 'valor' THEN
        CASE v_cond_value->>'operador'
          WHEN 'igual' THEN
            IF v_context_value #>> '{}' != (v_cond_value->>'valor') THEN
              v_result := false;
            END IF;
          WHEN 'mayor' THEN
            IF (v_context_value #>> '{}')::numeric <= (v_cond_value->>'valor')::numeric THEN
              v_result := false;
            END IF;
          WHEN 'menor' THEN
            IF (v_context_value #>> '{}')::numeric >= (v_cond_value->>'valor')::numeric THEN
              v_result := false;
            END IF;
          WHEN 'contiene' THEN
            IF v_context_value #>> '{}' NOT LIKE '%' || (v_cond_value->>'valor') || '%' THEN
              v_result := false;
            END IF;
          WHEN 'en' THEN
            IF NOT (v_context_value #>> '{}') = ANY(string_to_array(v_cond_value->>'valor', ',')) THEN
              v_result := false;
            END IF;
        END IF;
      ELSE
        -- Igualdad directa
        IF v_context_value != v_cond_value THEN
          v_result := false;
        END IF;
      END IF;
    END IF;
    
    -- Si alguna condición no se cumple, retornar false inmediatamente
    IF NOT v_result THEN
      RETURN false;
    END IF;
  END LOOP;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_updated_at_reglas()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_updated_at_reglas
  BEFORE UPDATE ON erp_reglas_factores
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at_reglas();

-- RLS Policies
ALTER TABLE erp_reglas_factores ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_historial_aplicacion_reglas ENABLE ROW LEVEL SECURITY;

-- Policy para reglas: lectura para todos autenticados, escritura solo administradores
CREATE POLICY "reglas_factor_lectura_autenticados" 
  ON erp_reglas_factores FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "reglas_factor_escritura_admins" 
  ON erp_reglas_factores FOR ALL 
  USING (auth.role() = 'authenticated');

-- Policy para historial: lectura autenticados, escritura autenticados
CREATE POLICY "historial_reglas_lectura_autenticados" 
  ON erp_historial_aplicacion_reglas FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "historial_reglas_escritura_autenticados" 
  ON erp_historial_aplicacion_reglas FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Seed data: reglas de ejemplo
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito) VALUES
-- Reglas de zona
('Factor Zona Guatemala', 'Factor base para zona metropolitana Guatemala', 'zona', 10, '{"departamento": "Guatemala"}'::jsonb, 1.0, 'multiplicar', 'departamento'),
('Factor Zona Quetzaltenango', 'Factor para altitudes mayores de 2000msnm', 'zona', 10, '{"departamento": "Quetzaltenango", "altitud": {"operador": "mayor", "valor": "2000"}}'::jsonb, 1.12, 'multiplicar', 'departamento'),
('Factor Zona Escuintla', 'Factor para zona industrial y caliente', 'zona', 10, '{"departamento": "Escuintla"}'::jsonb, 1.08, 'multiplicar', 'departamento'),

-- Reglas de tipología
('Factor Tipología Residencial', 'Factor base para proyectos residenciales', 'tipologia', 20, '{"tipologia": "residencial"}'::jsonb, 1.0, 'multiplicar', 'global'),
('Factor Tipología Comercial', 'Factor para proyectos comerciales', 'tipologia', 20, '{"tipologia": "comercial"}'::jsonb, 1.15, 'multiplicar', 'global'),
('Factor Tipología Industrial', 'Factor para proyectos industriales complejos', 'tipologia', 20, '{"tipologia": "industrial"}'::jsonb, 1.35, 'multiplicar', 'global'),

-- Reglas de sobrecosto
('Sobrecosto Estandar', 'Factor de sobrecosto estandar (32%)', 'sobrecosto', 30, '{}'::jsonb, 1.32, 'multiplicar', 'global'),

-- Reglas climáticas
('Factor Clima Frío', 'Ajuste por clima frío (>2000msnm)', 'climatico', 15, '{"altitud": {"operador": "mayor", "valor": "2000"}}'::jsonb, 1.05, 'multiplicar', 'departamento'),
('Factor Clima Caliente', 'Ajuste por clima caliente (<500msnm)', 'climatico', 15, '{"altitud": {"operador": "menor", "valor": "500"}}'::jsonb, 1.03, 'multiplicar', 'departamento');

-- Comentario de documentación
COMMENT ON TABLE erp_reglas_factores IS 'Sistema de reglas jerárquico para aplicación automática de factores en cálculos de presupuesto';
COMMENT ON TABLE erp_historial_aplicacion_reglas IS 'Historial de aplicación de reglas para auditoría y trazabilidad';
COMMENT ON FUNCTION aplicar_reglas_factor IS 'Función principal para aplicar reglas de factores según contexto y prioridad';
COMMENT ON FUNCTION evaluar_condicion_regla IS 'Función auxiliar para evaluar condiciones JSONB complejas';
