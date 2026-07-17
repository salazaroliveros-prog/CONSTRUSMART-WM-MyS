-- Migration: API pública para integraciones externas
-- Crea funciones RPC seguras para acceso externo con autenticación JWT

-- Habilitar API key para autenticación externa
CREATE TABLE IF NOT EXISTS erp_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read'],
  empresa_id TEXT,
  activo BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  created_by TEXT
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_erp_api_keys_key_hash ON erp_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_erp_api_keys_empresa_id ON erp_api_keys(empresa_id);
CREATE INDEX IF NOT EXISTS idx_erp_api_keys_activo ON erp_api_keys(activo) WHERE activo = true;

-- Función para validar API key
CREATE OR REPLACE FUNCTION validar_api_key(p_key_hash TEXT, p_required_scope TEXT DEFAULT NULL)
RETURNS TABLE (
  valid BOOLEAN,
  empresa_id TEXT,
  scopes TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE AS valid,
    empresa_id,
    scopes
  FROM erp_api_keys
  WHERE key_hash = p_key_hash
    AND activo = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (p_required_scope IS NULL OR p_required_scope = ANY(scopes));
  
  -- Si no encuentra key, retornar false
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL, ARRAY[]::TEXT[];
  END IF;
END;
$$;

-- RPC: Obtener proyectos públicos (con API key)
CREATE OR REPLACE FUNCTION api_obtener_proyectos(
  p_api_key_hash TEXT,
  p_empresa_id TEXT DEFAULT NULL,
  p_estado TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id TEXT,
  nombre TEXT,
  cliente TEXT,
  tipologia TEXT,
  estado TEXT,
  presupuesto_total NUMERIC,
  monto_contrato NUMERIC,
  avance_fisico NUMERIC,
  avance_financiero NUMERIC,
  fecha_inicio TEXT,
  fecha_fin TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_valid BOOLEAN;
  v_empresa_id TEXT;
  v_scopes TEXT[];
BEGIN
  -- Validar API key
  SELECT valid, empresa_id, scopes INTO v_valid, v_empresa_id, v_scopes
  FROM validar_api_key(p_api_key_hash, 'read')
  LIMIT 1;
  
  IF NOT v_valid THEN
    RAISE EXCEPTION 'API key inválida o expirada';
  END IF;
  
  -- Si API key tiene empresa_id específica, usarla
  IF v_empresa_id IS NOT NULL THEN
    v_empresa_id := v_empresa_id;
  END IF;
  
  -- Actualizar last_used_at
  UPDATE erp_api_keys
  SET last_used_at = NOW()
  WHERE key_hash = p_api_key_hash;
  
  -- Retornar proyectos
  RETURN QUERY
  SELECT 
    id,
    nombre,
    cliente,
    tipologia,
    estado,
    presupuesto_total,
    monto_contrato,
    avance_fisico,
    avance_financiero,
    fecha_inicio,
    fecha_fin
  FROM erp_proyectos
  WHERE (v_empresa_id IS NULL OR v_empresa_id = empresa_id)
    AND (p_estado IS NULL OR estado = p_estado)
    AND activo = true
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- RPC: Obtener movimientos de un proyecto (con API key)
CREATE OR REPLACE FUNCTION api_obtener_movimientos_proyecto(
  p_api_key_hash TEXT,
  p_proyecto_id TEXT,
  p_tipo TEXT DEFAULT NULL,
  p_categoria TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id TEXT,
  proyecto_id TEXT,
  tipo TEXT,
  categoria TEXT,
  descripcion TEXT,
  monto NUMERIC,
  fecha TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_valid BOOLEAN;
  v_empresa_id TEXT;
  v_scopes TEXT[];
BEGIN
  -- Validar API key
  SELECT valid, empresa_id, scopes INTO v_valid, v_empresa_id, v_scopes
  FROM validar_api_key(p_api_key_hash, 'read')
  LIMIT 1;
  
  IF NOT v_valid THEN
    RAISE EXCEPTION 'API key inválida o expirada';
  END IF;
  
  -- Actualizar last_used_at
  UPDATE erp_api_keys
  SET last_used_at = NOW()
  WHERE key_hash = p_api_key_hash;
  
  -- Retornar movimientos
  RETURN QUERY
  SELECT 
    id,
    proyecto_id,
    tipo,
    categoria,
    descripcion,
    monto,
    fecha
  FROM erp_movimientos
  WHERE proyecto_id = p_proyecto_id
    AND (p_tipo IS NULL OR tipo = p_tipo)
    AND (p_categoria IS NULL OR categoria = p_categoria)
  ORDER BY fecha DESC
  LIMIT p_limit;
END;
$$;

-- RPC: Obtener KPIs de un proyecto (con API key)
CREATE OR REPLACE FUNCTION api_obtener_kpis_proyecto(
  p_api_key_hash TEXT,
  p_proyecto_id TEXT
)
RETURNS TABLE (
  presupuesto_total NUMERIC,
  costo_real NUMERIC,
  ingreso_real NUMERIC,
  utilidad_bruta NUMERIC,
  margen_bruto NUMERIC,
  variacion_presupuesto NUMERIC,
  avance_fisico NUMERIC,
  avance_financiero NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_valid BOOLEAN;
  v_empresa_id TEXT;
  v_presupuesto_total NUMERIC;
  v_costo_real NUMERIC;
  v_ingreso_real NUMERIC;
  v_utilidad_bruta NUMERIC;
  v_margen_bruto NUMERIC;
  v_variacion_presupuesto NUMERIC;
  v_avance_fisico NUMERIC;
  v_avance_financiero NUMERIC;
BEGIN
  -- Validar API key
  SELECT valid, empresa_id INTO v_valid, v_empresa_id
  FROM validar_api_key(p_api_key_hash, 'read')
  LIMIT 1;
  
  IF NOT v_valid THEN
    RAISE EXCEPTION 'API key inválida o expirada';
  END IF;
  
  -- Obtener datos del proyecto
  SELECT presupuesto_total INTO v_presupuesto_total
  FROM erp_proyectos
  WHERE id = p_proyecto_id;
  
  -- Calcular costo real
  SELECT COALESCE(SUM(monto), 0) INTO v_costo_real
  FROM erp_movimientos
  WHERE proyecto_id = p_proyecto_id AND tipo = 'gasto';
  
  -- Calcular ingreso real
  SELECT COALESCE(SUM(monto), 0) INTO v_ingreso_real
  FROM erp_movimientos
  WHERE proyecto_id = p_proyecto_id AND tipo = 'ingreso';
  
  -- Calcular métricas
  v_utilidad_bruta := v_ingreso_real - v_costo_real;
  v_margen_bruto := CASE WHEN v_ingreso_real > 0 THEN (v_utilidad_bruta / v_ingreso_real) * 100 ELSE 0 END;
  v_variacion_presupuesto := CASE WHEN v_presupuesto_total > 0 THEN ((v_costo_real - v_presupuesto_total) / v_presupuesto_total) * 100 ELSE 0 END;
  
  -- Obtener avances
  SELECT avance_fisico, avance_financiero
  INTO v_avance_fisico, v_avance_financiero
  FROM erp_proyectos
  WHERE id = p_proyecto_id;
  
  -- Si no se encontraron avances, usar 0
  IF v_avance_fisico IS NULL THEN
    v_avance_fisico := 0;
  END IF;
  IF v_avance_financiero IS NULL THEN
    v_avance_financiero := 0;
  END IF;
  
  RETURN QUERY SELECT 
    v_presupuesto_total,
    v_costo_real,
    v_ingreso_real,
    v_utilidad_bruta,
    v_margen_bruto,
    v_variacion_presupuesto,
    v_avance_fisico,
    v_avance_financiero
  LIMIT 1;
END;
$$;

-- Política RLS para API keys
ALTER TABLE erp_api_keys ENABLE ROW LEVEL SECURITY;

-- Solo administradores pueden crear API keys
CREATE POLICY "api_keys_admin_create" ON erp_api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND raw_user_meta_data->>'rol' = 'administrador'
    )
  );

-- Solo administradores pueden gestionar API keys
CREATE POLICY "api_keys_admin_all" ON erp_api_keys
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND raw_user_meta_data->>'rol' = 'administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND raw_user_meta_data->>'rol' = 'administrador'
    )
  );

-- Función para generar API key (hash seguro)
CREATE OR REPLACE FUNCTION generar_api_key_hash(p_name TEXT, p_empresa_id TEXT DEFAULT NULL, p_scopes TEXT[] DEFAULT ARRAY['read'], p_expires_days INTEGER DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key TEXT;
  v_key_hash TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Generar key aleatoria
  v_key := encode(sha256(random_bytes(32)), 'hex');
  v_key_hash := encode(sha256(decode(v_key, 'hex')), 'hex');
  
  -- Calcular fecha de expiración
  IF p_expires_days IS NOT NULL THEN
    v_expires_at := NOW() + (p_expires_days || ' days')::INTERVAL;
  END IF;
  
  -- Insertar API key
  INSERT INTO erp_api_keys (name, key_hash, empresa_id, scopes, expires_at, created_by)
  VALUES (p_name, v_key_hash, p_empresa_id, p_scopes, v_expires_at, auth.uid())
  RETURNING key_hash INTO v_key_hash;
  
  RETURN v_key; -- Retornar key original (solo en creación)
END;
$$;

-- Grant execute permisos
GRANT EXECUTE ON FUNCTION validar_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION api_obtener_proyectos TO authenticated;
GRANT EXECUTE ON FUNCTION api_obtener_movimientos_proyecto TO authenticated;
GRANT EXECUTE ON FUNCTION api_obtener_kpis_proyecto TO authenticated;
GRANT EXECUTE ON FUNCTION generar_api_key_hash TO authenticated;

-- Comentario de documentación
COMMENT ON TABLE erp_api_keys IS 'Almacena API keys para integraciones externas con el sistema ERP';
COMMENT ON FUNCTION api_obtener_proyectos IS 'Retorna lista de proyectos accesibles via API key (read-only)';
COMMENT ON FUNCTION api_obtener_movimientos_proyecto IS 'Retorna movimientos de un proyecto específico via API key (read-only)';
COMMENT ON FUNCTION api_obtener_kpis_proyecto IS 'Retorna KPIs financieros de un proyecto via API key (read-only)';
