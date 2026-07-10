-- Migration 048: Add Missing Indexes (idempotent)
-- Creates indexes on frequently queried columns, skipping if table/column doesn't exist

-- Phase 1: Create indexes on proyecto_id for transactional tables
DO $$
DECLARE
  _tbl text;
  _col text;
  _idx text;
  _sql text;
  _pairs text[] := ARRAY[
    'erp_activos,proyecto_id',
    'erp_activos_herramienta,proyecto_id',
    'erp_cuadros,proyecto_id',
    'erp_cuadros_comparativos,proyecto_id',
    'erp_cuentas_cobrar,proyecto_id',
    'erp_cuentas_pagar,proyecto_id',
    'erp_eventos_calendario,proyecto_id',
    'erp_hitos,proyecto_id',
    'erp_incidentes,proyecto_id',
    'erp_incidentes_sso,proyecto_id',
    'erp_liberaciones_partida,proyecto_id',
    'erp_licitaciones,proyecto_id',
    'erp_muro,proyecto_id',
    'erp_no_conformidades,proyecto_id',
    'erp_notificaciones,proyecto_id',
    'erp_ordenes_cambio,proyecto_id',
    'erp_ordenes_compra,proyecto_id',
    'erp_planos,proyecto_id',
    'erp_presupuestos,proyecto_id',
    'erp_pruebas_laboratorio,proyecto_id',
    'erp_publicaciones_muro,proyecto_id',
    'erp_rfis,proyecto_id',
    'erp_riesgos,proyecto_id',
    'erp_seguimiento,proyecto_id',
    'erp_submittals,proyecto_id',
    'erp_vales_salida,proyecto_id'
  ];
BEGIN
  FOREACH _sql IN ARRAY _pairs LOOP
    _tbl := split_part(_sql, ',', 1);
    _col := split_part(_sql, ',', 2);
    _idx := 'idx_' || replace(_tbl, 'erp_', 'erp_') || '_' || _col;
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = _tbl AND relkind = 'r')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = _tbl AND column_name = _col) THEN
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(%I)', _idx, _tbl, _col);
    END IF;
  END LOOP;
END $$;

-- Phase 2: Create indexes on created_by for audit trails
DO $$
DECLARE
  _tbl text;
  _pairs text[] := ARRAY[
    'erp_activos','erp_activos_herramienta','erp_avances','erp_cuadros',
    'erp_cuadros_comparativos','erp_cuentas_cobrar','erp_cuentas_pagar',
    'erp_eventos_calendario','erp_hitos','erp_incidentes','erp_incidentes_sso',
    'erp_liberaciones_partida','erp_licitaciones','erp_muro',
    'erp_no_conformidades','erp_ordenes_cambio','erp_planos','erp_presupuestos',
    'erp_pruebas_laboratorio','erp_publicaciones_muro','erp_rendimientos_cuadrilla',
    'erp_rfis','erp_riesgos','erp_seguimiento','erp_submittals','erp_vales_salida'
  ];
BEGIN
  FOREACH _tbl IN ARRAY _pairs LOOP
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = _tbl AND relkind = 'r')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = _tbl AND column_name = 'created_by') THEN
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(created_by)', 'idx_' || _tbl || '_created_by', _tbl);
    END IF;
  END LOOP;
END $$;

-- Phase 3: Create composite indexes for common query patterns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_cuadros' AND relkind = 'r')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_cuadros' AND column_name = 'proyecto_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_cuadros' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_erp_cuadros_proyecto_created ON erp_cuadros(proyecto_id, created_at DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_presupuestos' AND relkind = 'r')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_presupuestos' AND column_name = 'proyecto_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_presupuestos' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_erp_presupuestos_proyecto_created ON erp_presupuestos(proyecto_id, created_at DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_ordenes_compra' AND relkind = 'r')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_ordenes_compra' AND column_name = 'proyecto_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_ordenes_compra' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_erp_ordenes_compra_proyecto_created ON erp_ordenes_compra(proyecto_id, created_at DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_ordenes_compra' AND relkind = 'r')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_ordenes_compra' AND column_name = 'proyecto_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_ordenes_compra' AND column_name = 'estado') THEN
    CREATE INDEX IF NOT EXISTS idx_erp_ordenes_compra_proyecto_estado ON erp_ordenes_compra(proyecto_id, estado);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_vales_salida' AND relkind = 'r')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_vales_salida' AND column_name = 'proyecto_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_vales_salida' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_erp_vales_salida_proyecto_created ON erp_vales_salida(proyecto_id, created_at DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_vales_salida' AND relkind = 'r')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_vales_salida' AND column_name = 'proyecto_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_vales_salida' AND column_name = 'estado') THEN
    CREATE INDEX IF NOT EXISTS idx_erp_vales_salida_proyecto_estado ON erp_vales_salida(proyecto_id, estado);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_incidentes' AND relkind = 'r')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_incidentes' AND column_name = 'proyecto_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_incidentes' AND column_name = 'estado') THEN
    CREATE INDEX IF NOT EXISTS idx_erp_incidentes_proyecto_estado ON erp_incidentes(proyecto_id, estado);
  END IF;
END $$;

-- Rollback function
CREATE OR REPLACE FUNCTION rollback_048_add_missing_indexes()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE NOTICE 'Rollback not implemented for idempotent migration 048';
END;
$$;