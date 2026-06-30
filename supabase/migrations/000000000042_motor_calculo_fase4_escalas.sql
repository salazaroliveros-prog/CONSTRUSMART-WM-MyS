-- ============================================================
-- MOTOR DE CÁLCULO AVANZADO - FASE 4 - AT-02
-- SISTEMA DE ESCALAS DE PRODUCCIÓN
-- ============================================================

-- Tabla de aplicación de escalas a proyectos
CREATE TABLE IF NOT EXISTS erp_aplicacion_escalas (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id text NOT NULL,
  escala_id uuid NOT NULL REFERENCES erp_escalas_produccion(id),
  
  -- Datos del proyecto al momento de aplicación
  tamano_proyecto numeric(10,2),
  presupuesto_estimado numeric(15,2),
  cantidad_renglones integer,
  
  -- Factores aplicados
  factor_economia_aplicado numeric(5,3),
  factor_administracion_aplicado numeric(5,3),
  factor_imprevistos_aplicado numeric(5,3),
  factor_logistica_aplicado numeric(5,3),
  factor_financiero_aplicado numeric(5,3),
  factor_total numeric(5,3),
  
  -- Resultados
  costo_ajustado numeric(15,2),
  ahorro_estimado numeric(15,2),
  
  -- Metadatos
  usuario_aplicacion text,
  fecha_aplicacion timestamptz DEFAULT now() NOT NULL,
  observaciones text,
  
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Migración: agregar columnas faltantes a tabla existente si faltan
ALTER TABLE erp_escalas_produccion ADD COLUMN IF NOT EXISTS subtipo_proyecto text;
ALTER TABLE erp_escalas_produccion ADD COLUMN IF NOT EXISTS factor_logistica numeric(5,3) DEFAULT 1.0;
ALTER TABLE erp_escalas_produccion ADD COLUMN IF NOT EXISTS factor_financiero numeric(5,3) DEFAULT 1.0;
ALTER TABLE erp_escalas_produccion ADD COLUMN IF NOT EXISTS justificacion_tecnica text;
ALTER TABLE erp_escalas_produccion ADD COLUMN IF NOT EXISTS referencia_mercado text;

-- Índices
CREATE INDEX IF NOT EXISTS idx_escalas_tipo ON erp_escalas_produccion(tipo_proyecto, subtipo_proyecto);
CREATE INDEX IF NOT EXISTS idx_escalas_rango ON erp_escalas_produccion(rango_tamano);
CREATE INDEX IF NOT EXISTS idx_escalas_tamano ON erp_escalas_produccion(tamano_minimo, tamano_maximo);
CREATE INDEX IF NOT EXISTS idx_escalas_activo ON erp_escalas_produccion(activo);

-- Índices
CREATE INDEX idx_aplicacion_escalas_proyecto ON erp_aplicacion_escalas(proyecto_id);
CREATE INDEX idx_aplicacion_escalas_escala ON erp_aplicacion_escalas(escala_id);
CREATE INDEX idx_aplicacion_escalas_fecha ON erp_aplicacion_escalas(fecha_aplicacion DESC);

-- Función para determinar escala de producción
CREATE OR REPLACE FUNCTION determinar_escala_produccion(
  p_tipo_proyecto text,
  p_tamano_proyecto numeric,
  p_subtipo_proyecto text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  rango_tamano text,
  factor_economia numeric,
  factor_administracion numeric,
  factor_imprevistos numeric,
  factor_logistica numeric,
  factor_financiero numeric,
  factor_total numeric
) AS $$
DECLARE
  v_escala RECORD;
BEGIN
  SELECT * INTO v_escala FROM erp_escalas_produccion
  WHERE tipo_proyecto = p_tipo_proyecto
    AND (p_subtipo_proyecto IS NULL OR subtipo_proyecto = p_subtipo_proyecto)
    AND activo = true
    AND (tamano_minimo IS NULL OR p_tamano_proyecto >= tamano_minimo)
    AND (tamano_maximo IS NULL OR p_tamano_proyecto <= tamano_maximo)
  ORDER BY 
    CASE 
      WHEN rango_tamano = 'pequeno' THEN 1
      WHEN rango_tamano = 'mediano' THEN 2
      WHEN rango_tamano = 'grande' THEN 3
      WHEN rango_tamano = 'muy_grande' THEN 4
      WHEN rango_tamano = 'mega' THEN 5
      ELSE 6
    END ASC
  LIMIT 1;
  
  -- Calcular factor total
  v_escala.factor_total := v_escala.factor_economia * v_escala.factor_administracion * 
                              v_escala.factor_imprevistos * v_escala.factor_logistica * v_escala.factor_financiero;
  
  id := v_escala.id;
  rango_tamano := v_escala.rango_tamano;
  factor_economia := v_escala.factor_economia;
  factor_administracion := v_escala.factor_administracion;
  factor_imprevistos := v_escala.factor_imprevistos;
  factor_logistica := v_escala.factor_logistica;
  factor_financiero := v_escala.factor_financiero;
  factor_total := v_escala.factor_total;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Función para aplicar factores de escala a un costo
CREATE OR REPLACE FUNCTION aplicar_factores_escala(
  p_costo_base numeric,
  p_tipo_proyecto text,
  p_tamano_proyecto numeric,
  p_subtipo_proyecto text DEFAULT NULL,
  p_presupuesto_estimado numeric DEFAULT NULL
)
RETURNS TABLE(
  costo_ajustado numeric,
  factor_economia numeric,
  factor_administracion numeric,
  factor_imprevistos numeric,
  factor_logistica numeric,
  factor_financiero numeric,
  factor_total numeric,
  ahorro_estimado numeric,
  rango_tamano text
) AS $$
DECLARE
  v_escala RECORD;
  v_costo_ajustado numeric;
  v_ahorro_estimado numeric;
BEGIN
  -- Obtener escala apropiada
  SELECT * INTO v_escala FROM determinar_escala_produccion(p_tipo_proyecto, p_tamano_proyecto, p_subtipo_proyecto);
  
  -- Aplicar factores
  v_costo_ajustado := p_costo_base * v_escala.factor_total;
  v_ahorro_estimado := p_costo_base - v_costo_ajustado;
  
  RETURN QUERY SELECT v_costo_ajustado, 
    v_escala.factor_economia, v_escala.factor_administracion, v_escala.factor_imprevistos,
    v_escala.factor_logistica, v_escala.factor_financiero, v_escala.factor_total,
    v_ahorro_estimado, v_escala.rango_tamano;
END;
$$ LANGUAGE plpgsql;

-- Seed data: escalas de producción por tipo de proyecto
-- Seed data: escalas de producción por tipo de proyecto
INSERT INTO erp_escalas_produccion (tipo_proyecto, subtipo_proyecto, rango_tamano, tamano_minimo, tamano_maximo, factor_economia, factor_administracion, factor_imprevistos, factor_logistica, factor_financiero, descripcion, justificacion_tecnica, activo) VALUES
-- Residencial
('residencial', NULL, 'pequeno', 0, 150, 1.15, 1.20, 1.25, 1.10, 1.05, 'Viviendas individuales pequeñas', 'Deseconomía de escala por proyectos pequeños', true),
('residencial', NULL, 'mediano', 150, 500, 1.0, 1.0, 1.0, 1.0, 1.0, 'Viviendas individuales medianas y condominios pequeños', 'Escala óptima sin ajustes significativos', true),
('residencial', NULL, 'grande', 500, 2000, 0.92, 0.95, 0.90, 0.95, 0.98, 'Condominios medianos y grandes', 'Economías de escala por volumen', true),
('residencial', NULL, 'muy_grande', 2000, 10000, 0.85, 0.90, 0.85, 0.90, 0.95, 'Condominios grandes y desarrollos residenciales', 'Economías de escala significativas', true),

-- Residencial específicos
('residencial', 'unifamiliar', 'pequeno', 0, 100, 1.20, 1.25, 1.30, 1.15, 1.10, 'Vivienda unifamiliar pequeña', 'Mayor sobrecargo administrativo proporcional', true),
('residencial', 'unifamiliar', 'mediano', 100, 300, 1.05, 1.10, 1.10, 1.05, 1.05, 'Vivienda unifamiliar mediana', 'Ajustes moderados', true),
('residencial', 'unifamiliar', 'grande', 300, 800, 0.95, 1.0, 0.95, 1.0, 1.0, 'Vivienda unifamiliar grande', 'Ligeras economías de escala', true),

('residencial', 'condominio', 'pequeno', 100, 300, 1.10, 1.10, 1.15, 1.05, 1.05, 'Condominio pequeño', 'Sobrecargo por infraestructura compartida', true),
('residencial', 'condominio', 'mediano', 300, 800, 0.90, 0.90, 0.90, 0.95, 0.95, 'Condominio mediano', 'Economías por infraestructura compartida', true),
('residencial', 'condominio', 'grande', 800, 2000, 0.80, 0.85, 0.80, 0.90, 0.90, 'Condominio grande', 'Economías significativas por volumen', true),

-- Comercial
('comercial', NULL, 'pequeno', 0, 200, 1.20, 1.15, 1.20, 1.10, 1.10, 'Locales comerciales pequeños', 'Deseconomía por falta de escala', true),
('comercial', NULL, 'mediano', 200, 1000, 1.0, 1.0, 1.0, 1.0, 1.0, 'Locales comerciales y oficinas medianas', 'Escala óptima', true),
('comercial', NULL, 'grande', 1000, 5000, 0.88, 0.90, 0.85, 0.92, 0.95, 'Centros comerciales y oficinas grandes', 'Economías significativas', true),
('comercial', NULL, 'muy_grande', 5000, 20000, 0.80, 0.85, 0.80, 0.88, 0.90, 'Desarrollos comerciales masivos', 'Economías máximas por escala', true),

-- Comercial específicos
('comercial', 'retail', 'pequeno', 50, 150, 1.15, 1.10, 1.15, 1.05, 1.05, 'Retail pequeño', 'Formato estandarizado permite eficiencia', true),
('comercial', 'retail', 'mediano', 150, 500, 0.95, 0.95, 0.95, 0.95, 0.95, 'Retail mediano', 'Buenas economías por formato', true),
('comercial', 'retail', 'grande', 500, 2000, 0.85, 0.90, 0.85, 0.88, 0.92, 'Retail grande', 'Economías por cadena de suministro', true),

('comercial', 'oficina', 'pequeno', 100, 500, 1.10, 1.10, 1.10, 1.05, 1.05, 'Oficina pequeña', 'Sobrecargo proporcional fijo', true),
('comercial', 'oficina', 'mediano', 500, 2000, 0.95, 0.95, 0.95, 0.92, 0.95, 'Oficina mediana', 'Eficiencias por gestión centralizada', true),
('comercial', 'oficina', 'grande', 2000, 10000, 0.80, 0.85, 0.80, 0.85, 0.90, 'Oficina grande/corporativo', 'Economías por escala corporativa', true),

-- Industrial
('industrial', NULL, 'pequeno', 0, 500, 1.25, 1.20, 1.25, 1.15, 1.15, 'Industrial liviano', 'Deseconomías por falta de especialización', true),
('industrial', NULL, 'mediano', 500, 2000, 1.0, 1.0, 1.0, 1.0, 1.0, 'Industrial mediano', 'Escala equilibrada', true),
('industrial', NULL, 'grande', 2000, 10000, 0.85, 0.88, 0.82, 0.90, 0.92, 'Industrial grande', 'Economías por especialización y volumen', true),
('industrial', NULL, 'muy_grande', 10000, 50000, 0.78, 0.82, 0.78, 0.85, 0.88, 'Industrial mega/planta', 'Economías máximas por optimización de procesos', true),

-- Industrial específicos
('industrial', 'bodega', 'pequeno', 200, 1000, 1.10, 1.10, 1.10, 1.05, 1.05, 'Bodega logística pequeña', 'Menos eficiente por falta de automatización', true),
('industrial', 'bodega', 'mediano', 1000, 5000, 0.90, 0.92, 0.88, 0.95, 0.95, 'Bodega logística mediana', 'Eficiencias por automatización parcial', true),
('industrial', 'bodega', 'grande', 5000, 20000, 0.82, 0.85, 0.80, 0.88, 0.90, 'Bodega logística grande/CDC', 'Economías por automatización avanzada', true),

('industrial', 'planta', 'pequeno', 300, 1500, 1.20, 1.15, 1.20, 1.15, 1.15, 'Planta manufacturera pequeña', 'Sobrecargo por falta de optimización', true),
('industrial', 'planta', 'mediano', 1500, 5000, 0.95, 0.95, 0.95, 0.92, 0.95, 'Planta manufacturera mediana', 'Eficiencias por optimización de procesos', true),
('industrial', 'planta', 'grande', 5000, 20000, 0.80, 0.85, 0.78, 0.85, 0.88, 'Planta manufacturera grande', 'Economías por optimización avanzada y automatización', true),

-- Civil
('civil', NULL, 'pequeno', 0, 1000, 1.30, 1.25, 1.30, 1.20, 1.20, 'Obras civiles pequeñas', 'Deseconomías por falta de equipos especializados', true),
('civil', NULL, 'mediano', 1000, 5000, 1.0, 1.0, 1.0, 1.0, 1.0, 'Obras civiles medianas', 'Escala equilibrada para equipos especializados', true),
('civil', NULL, 'grande', 5000, 20000, 0.85, 0.90, 0.85, 0.88, 0.92, 'Obras civiles grandes', 'Economías por equipos especializados y logística', true),
('civil', NULL, 'muy_grande', 20000, 100000, 0.80, 0.85, 0.80, 0.82, 0.85, 'Infraestructura masiva', 'Economías máximas por optimización de procesos', true),

-- Pública
('publica', NULL, 'pequeno', 0, 500, 1.25, 1.20, 1.25, 1.15, 1.15, 'Edificios públicos pequeños', 'Sobrecargo por protocolos administrativos', true),
('publica', NULL, 'mediano', 500, 2000, 1.0, 1.0, 1.0, 1.0, 1.0, 'Edificios públicos medianos', 'Escala estándar gubernamental', true),
('publica', NULL, 'grande', 2000, 10000, 0.88, 0.90, 0.85, 0.92, 0.95, 'Edificios públicos grandes', 'Eficiencias por estandarización gubernamental', true),
('publica', NULL, 'muy_grande', 10000, 50000, 0.82, 0.85, 0.82, 0.88, 0.90, 'Complejos gubernamentales masivos', 'Economías por procesos estandarizados', true);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_updated_at_escalas()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_updated_at_escalas
  BEFORE UPDATE ON erp_escalas_produccion
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at_escalas();

CREATE TRIGGER trigger_actualizar_updated_at_aplicacion
  BEFORE UPDATE ON erp_aplicacion_escalas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at_aplicacion();

-- RLS Policies
ALTER TABLE erp_escalas_produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_aplicacion_escalas ENABLE ROW LEVEL SECURITY;

-- Policies para escalas de producción
CREATE POLICY "escalas_lectura_autenticados" 
  ON erp_escalas_produccion FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "escalas_escritura_autenticados" 
  ON erp_escalas_produccion FOR ALL 
  USING (auth.role() = 'authenticated');

-- Policies para aplicación de escalas
CREATE POLICY "aplicacion_lectura_autenticados" 
  ON erp_aplicacion_escalas FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "aplicacion_escritura_autenticados" 
  ON erp_aplicacion_escalas FOR ALL 
  USING (auth.role() = 'authenticated');

-- Comentarios de documentación
COMMENT ON TABLE erp_escalas_produccion IS 'Factores de ajuste por escala de producción para diferentes tipos de proyectos';
COMMENT ON TABLE erp_aplicacion_escalas IS 'Historial de aplicación de factores de escala a proyectos específicos';
COMMENT ON FUNCTION determinar_escala_produccion IS 'Función para determinar la escala de producción apropiada según tamaño y tipo de proyecto';
COMMENT ON FUNCTION aplicar_factores_escala IS 'Función para aplicar factores de escala a costos de proyecto';