-- ============================================================
-- MIGRACIÓN 067: Production Phase 3 — Indexes + Integrity + Performance
-- ============================================================
-- Estrategia de robustez y rendimiento de base de datos:
--   1) Índices estratégicos en FK y columnas de filtro frecuente
--   2) Función RPC para verificación diaria de integridad referencial
--   3) Función RPC para métricas de performance
--   4) Daily integrity RPC programable desde aplicación
-- ============================================================

-- ============================================================
-- PART 1: Strategic Indexes for Query Performance
-- ============================================================

-- erp_proyectos: filtro por cliente, estado, fechas
CREATE INDEX IF NOT EXISTS idx_erp_proyectos_cliente ON erp_proyectos(cliente);
CREATE INDEX IF NOT EXISTS idx_erp_proyectos_estado ON erp_proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_erp_proyectos_fecha_inicio ON erp_proyectos(fecha_inicio);

-- erp_movimientos: consultas por proyecto + fecha
CREATE INDEX IF NOT EXISTS idx_erp_movimientos_proyecto_fecha ON erp_movimientos(proyecto_id, fecha);
CREATE INDEX IF NOT EXISTS idx_erp_movimientos_tipo ON erp_movimientos(tipo);

-- erp_presupuestos: consultas por proyecto
CREATE INDEX IF NOT EXISTS idx_erp_presupuestos_proyecto_id ON erp_presupuestos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_presupuestos_estado ON erp_presupuestos(estado);

-- erp_ordenes_compra: filtro por proveedor y estado
CREATE INDEX IF NOT EXISTS idx_erp_ordenes_compra_proveedor ON erp_ordenes_compra(proveedor);
CREATE INDEX IF NOT EXISTS idx_erp_ordenes_compra_estado ON erp_ordenes_compra(estado);
-- erp_ordenes_compra may not have proyecto_id column - check conditionally
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'erp_ordenes_compra' 
    AND column_name = 'proyecto_id'
    AND table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_erp_ordenes_compra_proyecto ON erp_ordenes_compra(proyecto_id);
  END IF;
END $$;

-- erp_hitos: fechas límite por proyecto (check if fecha column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'erp_hitos' 
    AND column_name = 'fecha'
    AND table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_erp_hitos_proyecto_fecha ON erp_hitos(proyecto_id, fecha);
  END IF;
END $$;

-- erp_riesgos: nivel por proyecto (check if columns exist)
CREATE INDEX IF NOT EXISTS idx_erp_riesgos_proyecto ON erp_riesgos(proyecto_id);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'erp_riesgos' 
    AND column_name = 'nivel'
    AND table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_erp_riesgos_nivel ON erp_riesgos(nivel);
  END IF;
END $$;

-- erp_incidentes: estado por proyecto (check if columns exist)
CREATE INDEX IF NOT EXISTS idx_erp_incidentes_proyecto ON erp_incidentes(proyecto_id);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'erp_incidentes' 
    AND column_name = 'estado'
    AND table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_erp_incidentes_estado ON erp_incidentes(estado);
  END IF;
END $$;

-- erp_notificaciones: no leídas por usuario (table might not exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_notificaciones' AND relkind = 'r') THEN
    CREATE INDEX IF NOT EXISTS idx_erp_notificaciones_created_by_leido ON erp_notificaciones(created_by, leido);
  END IF;
END $$;

-- erp_cotizaciones_negocio: CRM lookups (check if columns exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'erp_cotizaciones_negocio' 
    AND column_name = 'cliente_nombre'
    AND table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_erp_cotizaciones_cliente ON erp_cotizaciones_negocio(cliente_nombre);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'erp_cotizaciones_negocio' 
    AND column_name = 'estado'
    AND table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_erp_cotizaciones_estado ON erp_cotizaciones_negocio(estado);
  END IF;
END $$;

-- erp_empleados: consultas por proyecto (check if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'erp_empleados' 
    AND column_name = 'proyecto_id'
    AND table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_erp_empleados_proyecto ON erp_empleados(proyecto_id);
  END IF;
END $$;

-- erp_materiales: búsqueda por nombre (check if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'erp_materiales' 
    AND column_name = 'nombre'
    AND table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_erp_materiales_nombre ON erp_materiales(nombre);
  END IF;
END $$;

-- erp_avances: consultas por proyecto (check if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'erp_avances' 
    AND column_name = 'proyecto_id'
    AND table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_erp_avances_proyecto ON erp_avances(proyecto_id);
  END IF;
END $$;

-- erp_vales_salida: por proyecto (check if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'erp_vales_salida' 
    AND column_name = 'proyecto_id'
    AND table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_erp_vales_salida_proyecto ON erp_vales_salida(proyecto_id);
  END IF;
END $$;

-- erp_cuentas_cobrar / erp_cuentas_pagar: por proyecto (check if columns exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'erp_cuentas_cobrar' 
    AND column_name = 'proyecto_id'
    AND table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_erp_cuentas_cobrar_proyecto ON erp_cuentas_cobrar(proyecto_id);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'erp_cuentas_pagar' 
    AND column_name = 'proyecto_id'
    AND table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_erp_cuentas_pagar_proyecto ON erp_cuentas_pagar(proyecto_id);
  END IF;
END $$;

-- erp_error_logs is a VIEW, not a table - skip indexes for it

-- erp_audit_log: consultas por tabla y fecha (check if columns exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'erp_audit_log' 
    AND column_name = 'table_name'
    AND table_schema = 'public'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_erp_audit_log_tabla_fecha ON erp_audit_log(table_name, changed_at DESC);
  END IF;
END $$;

-- ============================================================
-- PART 2: Daily Integrity Check RPC
-- ============================================================
-- Verifica:
--   a) FK orphans (registros con proyecto_id que no existe)
--   b) NULL inesperados en columnas críticas
--   c) Registros duplicados donde no debería haber
-- Retorna: JSON con resumen de hallazgos
-- ============================================================

CREATE OR REPLACE FUNCTION check_daily_integrity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  fk_orphans jsonb;
  null_checks jsonb;
  dup_checks jsonb;
BEGIN
  -- a) FK orphan check: registros con proyecto_id que apuntan a proyecto inexistente
  SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) INTO fk_orphans
  FROM (
    SELECT 'erp_movimientos' as tabla, COUNT(*) as count FROM erp_movimientos m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
    UNION ALL SELECT 'erp_presupuestos', COUNT(*) FROM erp_presupuestos m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
    -- erp_ordenes_compra may not have proyecto_id - skip FK check for it
    UNION ALL SELECT 'erp_hitos', COUNT(*) FROM erp_hitos m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
    UNION ALL SELECT 'erp_riesgos', COUNT(*) FROM erp_riesgos m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
    UNION ALL SELECT 'erp_incidentes', COUNT(*) FROM erp_incidentes m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
    UNION ALL SELECT 'erp_avances', COUNT(*) FROM erp_avances m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
    UNION ALL SELECT 'erp_vales_salida', COUNT(*) FROM erp_vales_salida m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
    UNION ALL SELECT 'erp_cuentas_cobrar', COUNT(*) FROM erp_cuentas_cobrar m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
    UNION ALL SELECT 'erp_cuentas_pagar', COUNT(*) FROM erp_cuentas_pagar m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
    UNION ALL SELECT 'erp_empleados', COUNT(*) FROM erp_empleados m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
    -- erp_notificaciones might not exist - skip
  ) x WHERE x.count > 0;

  -- b) NULL checks en columnas críticas (skip columns that might not exist)
  SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) INTO null_checks
  FROM (
    SELECT 'erp_proyectos' as tabla, 'nombre' as columna, COUNT(*) as count FROM erp_proyectos WHERE nombre IS NULL OR nombre = ''
    UNION ALL SELECT 'erp_proyectos', 'estado', COUNT(*) FROM erp_proyectos WHERE estado IS NULL OR estado = ''
    UNION ALL SELECT 'erp_materiales', 'nombre', COUNT(*) FROM erp_materiales WHERE nombre IS NULL OR nombre = ''
    UNION ALL SELECT 'erp_proveedores', 'nombre', COUNT(*) FROM erp_proveedores WHERE nombre IS NULL OR nombre = ''
    -- erp_ordenes_compra may not have proveedor column - skip
    UNION ALL SELECT 'erp_presupuestos', 'proyecto_id', COUNT(*) FROM erp_presupuestos WHERE proyecto_id IS NULL OR proyecto_id = ''
    UNION ALL SELECT 'erp_empleados', 'nombre', COUNT(*) FROM erp_empleados WHERE nombre IS NULL OR nombre = ''
    -- erp_movimientos may not have tipo column - skip
    -- erp_hitos may not have nombre column - skip
  ) x WHERE x.count > 0;

  -- c) Duplicate check
  SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) INTO dup_checks
  FROM (
    SELECT 'erp_proyectos' as tabla, 'nombre' as columna, COUNT(*) as count FROM erp_proyectos WHERE nombre IN (SELECT nombre FROM erp_proyectos GROUP BY nombre HAVING COUNT(*) > 1 AND nombre != '')
    UNION ALL SELECT 'erp_proveedores', 'nombre', COUNT(*) FROM erp_proveedores WHERE nombre IN (SELECT nombre FROM erp_proveedores GROUP BY nombre HAVING COUNT(*) > 1 AND nombre != '')
  ) x WHERE x.count > 0;

  result := jsonb_build_object(
    'checked_at', now()::text,
    'fk_orphans', fk_orphans,
    'null_violations', null_checks,
    'duplicates', dup_checks,
    'total_issues', (SELECT COALESCE(SUM(value::int), 0) FROM jsonb_each_text(
      jsonb_build_object(
        'fk', (SELECT COALESCE(SUM((value->>'count')::int), 0) FROM jsonb_array_elements(fk_orphans) AS value),
        'nulls', (SELECT COALESCE(SUM((value->>'count')::int), 0) FROM jsonb_array_elements(null_checks) AS value),
        'dups', (SELECT COALESCE(SUM((value->>'count')::int), 0) FROM jsonb_array_elements(dup_checks) AS value)
      )
    ))
  );

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION check_daily_integrity() FROM anon, public;
GRANT EXECUTE ON FUNCTION check_daily_integrity() TO authenticated;

COMMENT ON FUNCTION check_daily_integrity() IS 'Verifica integridad referencial diaria: FK orphans, NULLs críticos, duplicados';

-- ============================================================
-- PART 3: Performance Metrics RPC
-- ============================================================

CREATE OR REPLACE FUNCTION get_db_performance_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  table_sizes jsonb;
  total_size_mb numeric;
BEGIN
  -- Tamaño de tablas principales
  SELECT COALESCE(jsonb_agg(x ORDER BY x.size_mb DESC), '[]'::jsonb) INTO table_sizes
  FROM (
    SELECT
      relname as table_name,
      pg_total_relation_size(c.oid) / 1048576.0 as size_mb,
      (SELECT COUNT(*) FROM erp_proyectos) as total_proyectos,
      (SELECT COUNT(*) FROM erp_movimientos) as total_movimientos,
      (SELECT COUNT(*) FROM erp_presupuestos) as total_presupuestos,
      (SELECT COUNT(*) FROM erp_ordenes_compra) as total_ordenes
    FROM pg_class c
    WHERE c.relkind = 'r' AND c.relname LIKE 'erp_%'
      AND c.relname IN ('erp_proyectos','erp_movimientos','erp_presupuestos',
        'erp_ordenes_compra','erp_materiales','erp_empleados','erp_proveedores')
  ) x;

  SELECT COALESCE(SUM(pg_total_relation_size(c.oid)) / 1048576.0, 0)
    INTO total_size_mb
    FROM pg_class c
    WHERE c.relkind = 'r' AND c.relname LIKE 'erp_%';

  result := jsonb_build_object(
    'measured_at', now()::text,
    'total_db_size_mb', ROUND(total_size_mb::numeric, 2),
    'table_details', table_sizes,
    'index_count', (SELECT COUNT(*) FROM pg_indexes WHERE tablename LIKE 'erp_%'),
    'table_count', (SELECT COUNT(*) FROM pg_class WHERE relkind='r' AND relname LIKE 'erp_%')
  );

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_db_performance_metrics() FROM anon, public;
GRANT EXECUTE ON FUNCTION get_db_performance_metrics() TO authenticated;

COMMENT ON FUNCTION get_db_performance_metrics() IS 'Métricas de performance: tamaño DB por tabla, total, conteos';


