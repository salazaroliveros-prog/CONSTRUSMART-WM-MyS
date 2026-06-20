-- ============================================================
-- MIGRACIONES PENDIENTES PARA SUPABASE
-- Ejecutar en SQL Editor de Supabase
-- Proyecto: neygzluxugodiwcuctbj.supabase.co
-- ============================================================

-- Tabla 1/6: erp_reglas_factores
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

CREATE INDEX IF NOT EXISTS idx_reglas_factores_tipo ON erp_reglas_factores(tipo_factor, activo);
CREATE INDEX IF NOT EXISTS idx_reglas_factores_prioridad ON erp_reglas_factores(prioridad DESC, activo);
CREATE INDEX IF NOT EXISTS idx_reglas_factores_ambito ON erp_reglas_factores(ambito, departamento_id, municipio_id);
CREATE INDEX IF NOT EXISTS idx_reglas_factores_tipologia ON erp_reglas_factores(tipologia);
CREATE INDEX IF NOT EXISTS idx_reglas_factores_fechas ON erp_reglas_factores(fecha_inicio, fecha_fin);

-- Tabla 2/6: erp_historial_aplicacion_reglas
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

CREATE INDEX IF NOT EXISTS idx_historial_reglas_proyecto ON erp_historial_aplicacion_reglas(proyecto_id, fecha_aplicacion DESC);
CREATE INDEX IF NOT EXISTS idx_historial_reglas_renglon ON erp_historial_aplicacion_reglas(renglon_id);
CREATE INDEX IF NOT EXISTS idx_historial_reglas_regla ON erp_historial_aplicacion_reglas(regla_id);
CREATE INDEX IF NOT EXISTS idx_historial_reglas_fecha ON erp_historial_aplicacion_reglas(fecha_aplicacion DESC);

-- Tabla 3/6: erp_snapshots_estado_calculo
CREATE TABLE IF NOT EXISTS erp_snapshots_estado_calculo (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  calculo_id uuid NOT NULL REFERENCES erp_calculos_proyecto(id),
  tipo_snapshot text CHECK (tipo_snapshot IN ('antes','despues','intermedio','final')),
  estado_completo jsonb NOT NULL,
  timestamp_snapshot timestamptz DEFAULT now() NOT NULL,
  descripcion_snapshot text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_snapshots_calculo ON erp_snapshots_estado_calculo(calculo_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_tipo ON erp_snapshots_estado_calculo(tipo_snapshot);
CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp ON erp_snapshots_estado_calculo(timestamp_snapshot DESC);

-- Tabla 4/6: erp_cumplimiento_normativo
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

CREATE INDEX IF NOT EXISTS idx_cumplimiento_proyecto ON erp_cumplimiento_normativo(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_cumplimiento_norma ON erp_cumplimiento_normativo(norma_id);
CREATE INDEX IF NOT EXISTS idx_cumplimiento_estado ON erp_cumplimiento_normativo(estado_cumplimiento);
CREATE INDEX IF NOT EXISTS idx_cumplimiento_fecha ON erp_cumplimiento_normativo(fecha_verificacion);

-- Tabla 5/6: erp_aplicacion_escalas
CREATE TABLE IF NOT EXISTS erp_aplicacion_escalas (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id text NOT NULL,
  escala_id uuid NOT NULL REFERENCES erp_escalas_produccion(id),
  tamano_proyecto numeric(10,2),
  presupuesto_estimado numeric(15,2),
  cantidad_renglones integer,
  factor_economia_aplicado numeric(5,3),
  factor_administracion_aplicado numeric(5,3),
  factor_imprevistos_aplicado numeric(5,3),
  factor_logistica_aplicado numeric(5,3),
  factor_financiero_aplicado numeric(5,3),
  factor_total numeric(5,3),
  costo_ajustado numeric(15,2),
  ahorro_estimado numeric(15,2),
  usuario_aplicacion text,
  fecha_aplicacion timestamptz DEFAULT now() NOT NULL,
  observaciones text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_aplicacion_escalas_proyecto ON erp_aplicacion_escalas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_aplicacion_escalas_escala ON erp_aplicacion_escalas(escala_id);
CREATE INDEX IF NOT EXISTS idx_aplicacion_escalas_fecha ON erp_aplicacion_escalas(fecha_aplicacion DESC);

-- Tabla 6/6: erp_ajustes_estacionales_actividad
CREATE TABLE IF NOT EXISTS erp_ajustes_estacionales_actividad (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  estacionalidad_id uuid NOT NULL REFERENCES erp_estacionalidad(id),
  tipo_actividad text NOT NULL CHECK (tipo_actividad IN ('cimentacion','estructura','mamposteria','acabados','instalaciones','movimiento_tierra','pavimentacion','general')),
  factor_especifico numeric(5,3) NOT NULL DEFAULT 1.0,
  impacto_duracion integer,
  recomendaciones text[],
  medidas_mitigacion text[],
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ajustes_estacionalidad ON erp_ajustes_estacionales_actividad(estacionalidad_id);
CREATE INDEX IF NOT EXISTS idx_ajustes_actividad ON erp_ajustes_estacionales_actividad(tipo_actividad);

-- Triggers para actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_updated_at_reglas()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_updated_at_reglas ON erp_reglas_factores;
CREATE TRIGGER trigger_actualizar_updated_at_reglas
  BEFORE UPDATE ON erp_reglas_factores
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at_reglas();

-- RLS Policies
ALTER TABLE erp_reglas_factores ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_historial_aplicacion_reglas ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_snapshots_estado_calculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_cumplimiento_normativo ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_aplicacion_escalas ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_ajustes_estacionales_actividad ENABLE ROW LEVEL SECURITY;

-- Policies para erp_reglas_factores
DROP POLICY IF EXISTS "reglas_factor_lectura_autenticados" ON erp_reglas_factores;
CREATE POLICY "reglas_factor_lectura_autenticados" 
  ON erp_reglas_factores FOR SELECT 
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "reglas_factor_escritura_admins" ON erp_reglas_factores;
CREATE POLICY "reglas_factor_escritura_admins" 
  ON erp_reglas_factores FOR ALL 
  USING (auth.role() = 'authenticated');

-- Policies para erp_historial_aplicacion_reglas
DROP POLICY IF EXISTS "historial_reglas_lectura_autenticados" ON erp_historial_aplicacion_reglas;
CREATE POLICY "historial_reglas_lectura_autenticados" 
  ON erp_historial_aplicacion_reglas FOR SELECT 
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "historial_reglas_escritura_autenticados" ON erp_historial_aplicacion_reglas;
CREATE POLICY "historial_reglas_escritura_autenticados" 
  ON erp_historial_aplicacion_reglas FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Policies para erp_snapshots_estado_calculo
DROP POLICY IF EXISTS "snapshots_lectura_autenticados" ON erp_snapshots_estado_calculo;
CREATE POLICY "snapshots_lectura_autenticados" 
  ON erp_snapshots_estado_calculo FOR SELECT 
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "snapshots_escritura_autenticados" ON erp_snapshots_estado_calculo;
CREATE POLICY "snapshots_escritura_autenticados" 
  ON erp_snapshots_estado_calculo FOR ALL 
  USING (auth.role() = 'authenticated');

-- Policies para erp_cumplimiento_normativo
DROP POLICY IF EXISTS "cumplimiento_lectura_autenticados" ON erp_cumplimiento_normativo;
CREATE POLICY "cumplimiento_lectura_autenticados" 
  ON erp_cumplimiento_normativo FOR SELECT 
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "cumplimiento_escritura_autenticados" ON erp_cumplimiento_normativo;
CREATE POLICY "cumplimiento_escritura_autenticados" 
  ON erp_cumplimiento_normativo FOR ALL 
  USING (auth.role() = 'authenticated');

-- Policies para erp_aplicacion_escalas
DROP POLICY IF EXISTS "aplicacion_escalas_lectura_autenticados" ON erp_aplicacion_escalas;
CREATE POLICY "aplicacion_escalas_lectura_autenticados" 
  ON erp_aplicacion_escalas FOR SELECT 
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "aplicacion_escalas_escritura_autenticados" ON erp_aplicacion_escalas;
CREATE POLICY "aplicacion_escalas_escritura_autenticados" 
  ON erp_aplicacion_escalas FOR ALL 
  USING (auth.role() = 'authenticated');

-- Policies para erp_ajustes_estacionales_actividad
DROP POLICY IF EXISTS "ajustes_lectura_autenticados" ON erp_ajustes_estacionales_actividad;
CREATE POLICY "ajustes_lectura_autenticados" 
  ON erp_ajustes_estacionales_actividad FOR SELECT 
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "ajustes_escritura_autenticados" ON erp_ajustes_estacionales_actividad;
CREATE POLICY "ajustes_escritura_autenticados" 
  ON erp_ajustes_estacionales_actividad FOR ALL 
  USING (auth.role() = 'authenticated');

-- Seed data: reglas de ejemplo (opcional - solo inserta si no existen datos)
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito)
SELECT 
  nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito
FROM (VALUES
  ('Factor Zona Guatemala', 'Factor base para zona metropolitana Guatemala', 'zona', 10, '{"departamento": "Guatemala"}'::jsonb, 1.0, 'multiplicar', 'departamento'),
  ('Factor Zona Quetzaltenango', 'Factor para altitudes mayores de 2000msnm', 'zona', 10, '{"departamento": "Quetzaltenango", "altitud": {"operador": "mayor", "valor": "2000"}}'::jsonb, 1.12, 'multiplicar', 'departamento'),
  ('Factor Zona Escuintla', 'Factor para zona industrial y caliente', 'zona', 10, '{"departamento": "Escuintla"}'::jsonb, 1.08, 'multiplicar', 'departamento'),
  ('Factor Tipología Residencial', 'Factor base para proyectos residenciales', 'tipologia', 20, '{"tipologia": "residencial"}'::jsonb, 1.0, 'multiplicar', 'global'),
  ('Factor Tipología Comercial', 'Factor para proyectos comerciales', 'tipologia', 20, '{"tipologia": "comercial"}'::jsonb, 1.15, 'multiplicar', 'global'),
  ('Factor Tipología Industrial', 'Factor para proyectos industriales complejos', 'tipologia', 20, '{"tipologia": "industrial"}'::jsonb, 1.35, 'multiplicar', 'global'),
  ('Sobrecosto Estandar', 'Factor de sobrecosto estandar (32%)', 'sobrecosto', 30, '{}'::jsonb, 1.32, 'multiplicar', 'global'),
  ('Factor Clima Frío', 'Ajuste por clima frío (>2000msnm)', 'climatico', 15, '{"altitud": {"operador": "mayor", "valor": "2000"}}'::jsonb, 1.05, 'multiplicar', 'departamento'),
  ('Factor Clima Caliente', 'Ajuste por clima caliente (<500msnm)', 'climatico', 15, '{"altitud": {"operador": "menor", "valor": "500"}}'::jsonb, 1.03, 'multiplicar', 'departamento')
) AS v(nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito)
WHERE NOT EXISTS (
  SELECT 1 FROM erp_reglas_factores 
  WHERE nombre = v.nombre
);

-- Seed data: ajustes estacionales por tipo de actividad (opcional)
-- NOTA: Este seed requiere que la tabla erp_estacionalidad tenga datos
-- Si causa problemas, omitir este bloque y agregar datos manualmente después
-- INSERT INTO erp_ajustes_estacionales_actividad (estacionalidad_id, tipo_actividad, factor_especifico, impacto_duracion, recomendaciones, medidas_mitigacion)
-- WITH tipos_actividad AS (
--   SELECT unnest(ARRAY['cimentacion','estructura','mamposteria','acabados','instalaciones','movimiento_tierra','pavimentacion','general']::text[]) as tipo_actividad
-- )
-- SELECT 
--   e.id,
--   ta.tipo_actividad,
--   CASE 
--     WHEN e.temporada = 'lluviosa' THEN 
--       CASE ta.tipo_actividad
--         WHEN 'movimiento_tierra' THEN 1.25
--         WHEN 'acabados' THEN 1.20
--         WHEN 'pavimentacion' THEN 1.18
--         WHEN 'mamposteria' THEN 1.15
--         WHEN 'cimentacion' THEN 1.10
--         ELSE 1.05
--       END
--     WHEN e.temporada = 'transicion_seca' OR e.temporada = 'transicion_lluviosa' THEN 1.03
--     ELSE 1.0
--   END,
--   CASE 
--     WHEN e.temporada = 'lluviosa' THEN 
--       CASE ta.tipo_actividad
--         WHEN 'movimiento_tierra' THEN 7
--         WHEN 'acabados' THEN 5
--         WHEN 'pavimentacion' THEN 5
--         WHEN 'mamposteria' THEN 3
--         WHEN 'cimentacion' THEN 2
--         ELSE 0
--       END
--     ELSE 0
--   END,
--   CASE 
--     WHEN e.temporada = 'lluviosa' THEN ARRAY['Programar actividades interiores', 'Cubrir materiales', 'Monitorear pronóstico', 'Tener plan de contingencia']
--     WHEN e.temporada = 'seca' AND e.departamento_codigo IN ('GT-09','GT-07') THEN ARRAY['Proteger contra heladas', 'Programar curado especial', 'Monitorear temperaturas']
--     ELSE ARRAY[]::text[]
--   END,
--   CASE 
--     WHEN e.temporada = 'lluviosa' THEN ARRAY['Toldos y cubiertas', 'Drenaje temporal', 'Bombas de achique', 'Lona impermeable']
--     WHEN e.temporada = 'seca' AND e.departamento_codigo IN ('GT-09','GT-07') THEN ARRAY['Abrasivos térmicos', 'Membranas antiheladas', 'Cubiertas nocturnas']
--     ELSE ARRAY[]::text[]
--   END
-- FROM erp_estacionalidad e
-- CROSS JOIN tipos_actividad ta
-- WHERE e.activo = true
--   AND NOT EXISTS (
--     SELECT 1 FROM erp_ajustes_estacionales_actividad 
--     WHERE estacionalidad_id = e.id 
--       AND tipo_actividad = ta.tipo_actividad
--   );
