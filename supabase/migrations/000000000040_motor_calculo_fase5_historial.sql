-- ============================================================
-- MOTOR DE CÁLCULO AVANZADO - FASE 5 - ID-02
-- SISTEMA DE HISTORIAL DE CÁLCULOS
-- ============================================================

-- Tabla principal de cálculos registrados
CREATE TABLE IF NOT EXISTS erp_calculos_proyecto (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id text NOT NULL,
  renglon_id text,
  tipo_calculo text NOT NULL CHECK (tipo_calculo IN ('dosificacion_concreto','desglose_acero','movimiento_tierra','pavimento','red_infraestructura','muro_contencion','apu_general','costo_con_reglas')),
  version_calculo integer NOT NULL DEFAULT 1,
  
  -- Parámetros de entrada
  parametros_entrada jsonb NOT NULL,
  
  -- Resultados del cálculo
  resultado_calculado jsonb NOT NULL,
  costo_total numeric(12,2),
  costo_unitario numeric(8,2),
  
  -- Metadatos del cálculo
  motor_version text,
  usuario_id text,
  fecha_calculo timestamptz DEFAULT now() NOT NULL,
  ip_address text,
  user_agent text,
  
  -- Validación y consistencia
  validado boolean DEFAULT false,
  consistencia_check jsonb,
  alertas_generadas jsonb DEFAULT '[]'::jsonb,
  
  -- Referencias a versiones anteriores
  calculo_previo_id uuid REFERENCES erp_calculos_proyecto(id),
  es_version_actual boolean DEFAULT true,
  
  -- Observaciones y contexto
  observaciones text,
  contexto_negocio text,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX idx_calculos_proyecto_id ON erp_calculos_proyecto(proyecto_id);
CREATE INDEX idx_calculos_renglon_id ON erp_calculos_proyecto(renglon_id);
CREATE INDEX idx_calculos_tipo ON erp_calculos_proyecto(tipo_calculo);
CREATE INDEX idx_calculos_fecha ON erp_calculos_proyecto(fecha_calculo DESC);
CREATE INDEX idx_calculos_usuario ON erp_calculos_proyecto(usuario_id);
CREATE INDEX idx_calculos_version_actual ON erp_calculos_proyecto(proyecto_id, es_version_actual);
CREATE INDEX idx_calculos_previo ON erp_calculos_proyecto(calculo_previo_id);

-- Tabla de comparaciones entre cálculos
CREATE TABLE IF NOT EXISTS erp_comparaciones_calculos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  calculo_base_id uuid NOT NULL REFERENCES erp_calculos_proyecto(id),
  calculo_comparado_id uuid NOT NULL REFERENCES erp_calculos_proyecto(id),
  fecha_comparacion timestamptz DEFAULT now() NOT NULL,
  usuario_id text,
  
  -- Resultados de la comparación
  diferencias jsonb NOT NULL,
  magnitud_cambio numeric(8,2),
  porcentaje_cambio numeric(5,2),
  tipo_cambio text CHECK (tipo_cambio IN ('aumento','disminucion','sin_cambio','mixto')),
  
  -- Evaluación del cambio
  impacto_presupuestario text CHECK (impacto_presupuesto IN ('critico','alto','medio','bajo','insignificante')),
  requiere_aprobacion boolean DEFAULT false,
  aprobado boolean,
  motivo_rechazo text,
  
  -- Recomendaciones
  recomendaciones jsonb DEFAULT '[]'::jsonb,
  
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX idx_comparaciones_base ON erp_comparaciones_calculos(calculo_base_id);
CREATE INDEX idx_comparaciones_comparado ON erp_comparaciones_calculos(calculo_comparado_id);
CREATE INDEX idx_comparaciones_fecha ON erp_comparaciones_calculos(fecha_comparacion DESC);

-- Tabla de snapshots de estados completos (para auditoría profunda)
CREATE TABLE IF NOT EXISTS erp_snapshots_estado_calculo (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  calculo_id uuid NOT NULL REFERENCES erp_calculos_proyecto(id),
  tipo_snapshot text CHECK (tipo_snapshot IN ('antes','despues','intermedio','final')),
  estado_completo jsonb NOT NULL,
  timestamp_snapshot timestamptz DEFAULT now() NOT NULL,
  descripcion_snapshot text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX idx_snapshots_calculo ON erp_snapshots_estado_calculo(calculo_id);
CREATE INDEX idx_snapshots_tipo ON erp_snapshots_estado_calculo(tipo_snapshot);
CREATE INDEX idx_snapshots_timestamp ON erp_snapshots_estado_calculo(timestamp_snapshot DESC);

-- Función para registrar nuevo cálculo
CREATE OR REPLACE FUNCTION registrar_calculo(
  p_proyecto_id text,
  p_renglon_id text DEFAULT NULL,
  p_tipo_calculo text,
  p_parametros_entrada jsonb,
  p_resultado_calculado jsonb,
  p_costo_total numeric DEFAULT NULL,
  p_costo_unitario numeric DEFAULT NULL,
  p_usuario_id text DEFAULT NULL,
  p_observaciones text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_calculo_id uuid;
  v_version integer;
BEGIN
  -- Obtener última versión para este proyecto/renglon
  SELECT COALESCE(MAX(version_calculo), 0) + 1 INTO v_version
  FROM erp_calculos_proyecto
  WHERE proyecto_id = p_proyecto_id
    AND (p_renglon_id IS NULL OR renglon_id = p_renglon_id);
  
  -- Marcar versión anterior como no actual
  UPDATE erp_calculos_proyecto
  SET es_version_actual = false
  WHERE proyecto_id = p_proyecto_id
    AND (p_renglon_id IS NULL OR renglon_id = p_renglon_id)
    AND es_version_actual = true;
  
  -- Insertar nuevo cálculo
  INSERT INTO erp_calculos_proyecto (
    proyecto_id, renglon_id, tipo_calculo, version_calculo,
    parametros_entrada, resultado_calculado, costo_total, costo_unitario,
    usuario_id, observaciones, es_version_actual
  ) VALUES (
    p_proyecto_id, p_renglon_id, p_tipo_calculo, v_version,
    p_parametros_entrada, p_resultado_calculado, p_costo_total, p_costo_unitario,
    p_usuario_id, p_observaciones, true
  ) RETURNING id INTO v_calculo_id;
  
  RETURN v_calculo_id;
END;
$$ LANGUAGE plpgsql;

-- Función para comparar dos cálculos
CREATE OR REPLACE FUNCTION comparar_calculos(
  p_calculo_base_id uuid,
  p_calculo_comparado_id uuid,
  p_usuario_id text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_comparacion_id uuid;
  v_base jsonb;
  v_comparado jsonb;
  v_diferencias jsonb := '{}'::jsonb;
  v_magnitud_cambio numeric := 0;
  v_porcentaje_cambio numeric := 0;
  v_costo_base numeric := 0;
  v_costo_comparado numeric := 0;
  v_tipo_cambio text;
BEGIN
  -- Obtener datos de cálculos
  SELECT resultado_calculado, costo_total INTO v_base, v_costo_base
  FROM erp_calculos_proyecto WHERE id = p_calculo_base_id;
  
  SELECT resultado_calculado, costo_total INTO v_comparado, v_costo_comparado
  FROM erp_calculos_proyecto WHERE id = p_calculo_comparado_id;
  
  -- Calcular magnitud y porcentaje de cambio
  IF v_costo_base IS NOT NULL AND v_costo_comparado IS NOT NULL THEN
    v_magnitud_cambio := ABS(v_costo_comparado - v_costo_base);
    IF v_costo_base != 0 THEN
      v_porcentaje_cambio := ((v_costo_comparado - v_costo_base) / v_costo_base) * 100;
    END IF;
  END IF;
  
  -- Determinar tipo de cambio
  IF v_porcentaje_cambio > 0.1 THEN
    v_tipo_cambio := 'aumento';
  ELSIF v_porcentaje_cambio < -0.1 THEN
    v_tipo_cambio := 'disminucion';
  ELSE
    v_tipo_cambio := 'sin_cambio';
  END IF;
  
  -- Comparar parámetros clave
  IF v_base ? 'materiales' AND v_comparado ? 'materiales' THEN
    v_diferencias := v_diferencias || jsonb_build_object(
      'materiales',
      jsonb_build_object(
        'anterior', v_base->'materiales',
        'nuevo', v_comparado->'materiales',
        'cambio', (v_comparado->'materiales') - (v_base->'materiales')
      )
    );
  END IF;
  
  IF v_base ? 'mano_obra' AND v_comparado ? 'mano_obra' THEN
    v_diferencias := v_diferencias || jsonb_build_object(
      'mano_obra',
      jsonb_build_object(
        'anterior', v_base->'mano_obra',
        'nuevo', v_comparado->'mano_obra',
        'cambio', (v_comparado->'mano_obra') - (v_base->'mano_obra')
      )
    );
  END IF;
  
  IF v_base ? 'equipos' AND v_comparado ? 'equipos' THEN
    v_diferencias := v_diferencias || jsonb_build_object(
      'equipos',
      jsonb_build_object(
        'anterior', v_base->'equipos',
        'nuevo', v_comparado->'equipos',
        'cambio', (v_comparado->'equipos') - (v_base->'equipos')
      )
    );
  END IF;
  
  -- Evaluar impacto presupuestario
  IF ABS(v_porcentaje_cambio) > 20 THEN
    INSERT INTO v_diferencias VALUES ('impacto', 'critico');
  ELSIF ABS(v_porcentaje_cambio) > 10 THEN
    INSERT INTO v_diferencias VALUES ('impacto', 'alto');
  ELSIF ABS(v_porcentaje_cambio) > 5 THEN
    INSERT INTO v_diferencias VALUES ('impacto', 'medio');
  ELSIF ABS(v_porcentaje_cambio) > 1 THEN
    INSERT INTO v_diferencias VALUES ('impacto', 'bajo');
  ELSE
    INSERT INTO v_diferencias VALUES ('impacto', 'insignificante');
  END IF;
  
  -- Insertar comparación
  INSERT INTO erp_comparaciones_calculos (
    calculo_base_id, calculo_comparado_id, usuario_id,
    diferencias, magnitud_cambio, porcentaje_cambio, tipo_cambio
  ) VALUES (
    p_calculo_base_id, p_calculo_comparado_id, p_usuario_id,
    v_diferencias, v_magnitud_cambio, v_porcentaje_cambio, v_tipo_cambio
  ) RETURNING id INTO v_comparacion_id;
  
  RETURN v_comparacion_id;
END;
$$ LANGUAGE plpgsql;

-- Función para crear snapshot de estado
CREATE OR REPLACE FUNCTION crear_snapshot_estado(
  p_calculo_id uuid,
  p_tipo_snapshot text,
  p_estado_completo jsonb,
  p_descripcion text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_snapshot_id uuid;
BEGIN
  INSERT INTO erp_snapshots_estado_calculo (
    calculo_id, tipo_snapshot, estado_completo, descripcion_snapshot
  ) VALUES (
    p_calculo_id, p_tipo_snapshot, p_estado_completo, p_descripcion
  ) RETURNING id INTO v_snapshot_id;
  
  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_updated_at_calculos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_updated_at_calculos
  BEFORE UPDATE ON erp_calculos_proyecto
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at_calculos();

-- RLS Policies
ALTER TABLE erp_calculos_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_comparaciones_calculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_snapshots_estado_calculo ENABLE ROW LEVEL SECURITY;

-- Policies para cálculos
CREATE POLICY "calculos_lectura_autenticados" 
  ON erp_calculos_proyecto FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "calculos_escritura_autenticados" 
  ON erp_calculos_proyecto FOR ALL 
  USING (auth.role() = 'authenticated');

-- Policies para comparaciones
CREATE POLICY "comparaciones_lectura_autenticados" 
  ON erp_comparaciones_calculos FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "comparaciones_escritura_autenticados" 
  ON erp_comparaciones_calculos FOR ALL 
  USING (auth.role() = 'authenticated');

-- Policies para snapshots
CREATE POLICY "snapshots_lectura_autenticados" 
  ON erp_snapshots_estado_calculo FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "snapshots_escritura_autenticados" 
  ON erp_snapshots_estado_calculo FOR ALL 
  USING (auth.role() = 'authenticated');

-- Comentarios de documentación
COMMENT ON TABLE erp_calculos_proyecto IS 'Historial completo de cálculos del motor avanzado con trazabilidad de versiones';
COMMENT ON TABLE erp_comparaciones_calculos IS 'Comparaciones entre versiones de cálculos para análisis de cambios';
COMMENT ON TABLE erp_snapshots_estado_calculo IS 'Snapshots de estados intermedios para auditoría detallada';
COMMENT ON FUNCTION registrar_calculo IS 'Función principal para registrar nuevos cálculos con control de versiones';
COMMENT ON FUNCTION comparar_calculos IS 'Función para comparar dos cálculos y detectar diferencias significativas';
COMMENT ON FUNCTION crear_snapshot_estado IS 'Función para capturar snapshots de estado durante el proceso de cálculo';