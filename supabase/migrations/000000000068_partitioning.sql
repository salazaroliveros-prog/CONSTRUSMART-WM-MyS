-- Migration: Partitioning de tablas grandes
-- Particiona tablas grandes por fecha para mejorar rendimiento en datasets grandes
-- Nota: Esta migración solo agrega funciones de gestión de particiones
-- Las tablas ya existen, por lo que no se pueden particionar directamente
-- Se recomienda usar estas funciones en futuras implementaciones

-- Función para crear partición mensual
CREATE OR REPLACE FUNCTION crear_particion_mes(
  p_tabla TEXT,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_partition_name TEXT;
  v_start_date TEXT;
  v_end_date TEXT;
BEGIN
  v_partition_name := format('%s_%04d_%02d', p_tabla, p_year, p_month);
  v_start_date := format('%04d-%02d-01', p_year, p_month);
  v_end_date := (v_start_date::date + INTERVAL '1 month')::TEXT;
  
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
    v_partition_name, p_tabla, v_start_date, v_end_date
  );
  
  RAISE NOTICE 'Partición % creada', v_partition_name;
END;
$$;

-- Función para crear partición por defecto
CREATE OR REPLACE FUNCTION crear_particion_default(p_tabla TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %s_default PARTITION OF %I DEFAULT',
    p_tabla, p_tabla
  );
  
  RAISE NOTICE 'Partición default para % creada', p_tabla;
END;
$$;

-- Función para crear particiones anuales
CREATE OR REPLACE FUNCTION crear_particiones_anuales(
  p_tabla TEXT,
  p_start_year INTEGER,
  p_years_count INTEGER DEFAULT 5
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year INTEGER;
BEGIN
  FOR v_year IN p_start_year..(p_start_year + p_years_count - 1) LOOP
    PERFORM crear_particion_mes(p_tabla, v_year, 1);
    PERFORM crear_particion_mes(p_tabla, v_year, 2);
    PERFORM crear_particion_mes(p_tabla, v_year, 3);
    PERFORM crear_particion_mes(p_tabla, v_year, 4);
    PERFORM crear_particion_mes(p_tabla, v_year, 5);
    PERFORM crear_particion_mes(p_tabla, v_year, 6);
    PERFORM crear_particion_mes(p_tabla, v_year, 7);
    PERFORM crear_particion_mes(p_tabla, v_year, 8);
    PERFORM crear_particion_mes(p_tabla, v_year, 9);
    PERFORM crear_particion_mes(p_tabla, v_year, 10);
    PERFORM crear_particion_mes(p_tabla, v_year, 11);
    PERFORM crear_particion_mes(p_tabla, v_year, 12);
  END LOOP;
  
  PERFORM crear_particion_default(p_tabla);
END;
$$;

-- Índices para tablas grandes (optimización de queries)
CREATE INDEX IF NOT EXISTS idx_erp_movimientos_fecha_tipo 
  ON erp_movimientos(fecha, tipo);

CREATE INDEX IF NOT EXISTS idx_erp_movimientos_proyecto_fecha 
  ON erp_movimientos(proyecto_id, fecha);

-- Índice para erp_audit_log (si existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'erp_audit_log' 
    AND table_schema = 'public'
    AND column_name = 'tabla'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_erp_audit_log_tabla_fecha 
      ON erp_audit_log(tabla, fecha);
  END IF;
END $$;

-- Comment sobre uso futuro de particiones
COMMENT ON FUNCTION crear_particion_mes IS 'Función para crear particiones mensuales - usar solo en tablas particionadas';
COMMENT ON FUNCTION crear_particion_default IS 'Función para crear partición default - usar solo en tablas particionadas';
COMMENT ON FUNCTION crear_particiones_anuales IS 'Función para crear particiones anuales - usar solo en tablas particionadas';
