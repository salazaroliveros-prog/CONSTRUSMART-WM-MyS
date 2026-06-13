-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 24: Performance Indexes + Triggers
-- Fecha: 2026-06-13
--
-- SOLO crea índices/triggers si la columna existe en la tabla.
-- Verificación con information_schema para evitar errores 42703.
-- ============================================================

-- Helper: crear índice solo si la columna existe
CREATE OR REPLACE FUNCTION public._create_idx_if_col(tbl text, idx text, col text, extra text DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = tbl AND column_name = col
  ) THEN
    IF extra = '' THEN
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(%I)', idx, tbl, col);
    ELSE
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(%I) %s', idx, tbl, col, extra);
    END IF;
  END IF;
END;
$$;

-- Helper: crear índice compuesto solo si ambas columnas existen
CREATE OR REPLACE FUNCTION public._create_compound_idx_if(tbl text, idx text, col1 text, col2 text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = tbl AND column_name = col1
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = tbl AND column_name = col2
  ) THEN
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(%I, %I)', idx, tbl, col1, col2);
  END IF;
END;
$$;

-- ============================================================
-- 1. AGREGAR COLUMNAS FALTANTES A erp_materiales
-- ============================================================
-- Flujo: Presupuesto → Renglones → Materiales → Bodega (por proyecto/renglón)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'erp_materiales' AND column_name = 'bodega'
  ) THEN
    ALTER TABLE public.erp_materiales ADD COLUMN bodega text DEFAULT 'General';
    COMMENT ON COLUMN public.erp_materiales.bodega IS 'Ubicación física en bodega del material';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'erp_materiales' AND column_name = 'renglon_id'
  ) THEN
    ALTER TABLE public.erp_materiales ADD COLUMN renglon_id uuid;
    COMMENT ON COLUMN public.erp_materiales.renglon_id IS 'ID del renglón de presupuesto que originó la compra';
  END IF;
END $$;

-- ============================================================
-- 2. ÍNDICES DE RENDIMIENTO (condicionales a columnas existentes)
-- ============================================================

-- erp_proyectos
SELECT public._create_idx_if_col('erp_proyectos', 'idx_proyectos_estado', 'estado');
SELECT public._create_idx_if_col('erp_proyectos', 'idx_proyectos_created_by', 'created_by');
SELECT public._create_idx_if_col('erp_proyectos', 'idx_proyectos_fecha_inicio', 'fecha_inicio');

-- erp_materiales
SELECT public._create_idx_if_col('erp_materiales', 'idx_materiales_categoria', 'categoria');
SELECT public._create_idx_if_col('erp_materiales', 'idx_materiales_bodega', 'bodega');
CREATE INDEX IF NOT EXISTS idx_materiales_stock_bajo ON public.erp_materiales(stock)
  WHERE stock <= stock_minimo;

-- erp_ordenes_compra
SELECT public._create_idx_if_col('erp_ordenes_compra', 'idx_oc_estado', 'estado');
SELECT public._create_idx_if_col('erp_ordenes_compra', 'idx_oc_proyecto_id', 'proyecto_id');
SELECT public._create_idx_if_col('erp_ordenes_compra', 'idx_oc_proveedor', 'proveedor');
SELECT public._create_compound_idx_if('erp_ordenes_compra', 'idx_oc_estado_proyecto', 'estado', 'proyecto_id');

-- erp_avances
SELECT public._create_idx_if_col('erp_avances', 'idx_avances_proyecto_id', 'proyecto_id');
SELECT public._create_idx_if_col('erp_avances', 'idx_avances_fecha', 'fecha');
SELECT public._create_compound_idx_if('erp_avances', 'idx_avances_proyecto_fecha', 'proyecto_id', 'fecha');

-- erp_vales_salida (NO tiene columna estado)
SELECT public._create_idx_if_col('erp_vales_salida', 'idx_vales_proyecto_id', 'proyecto_id');

-- erp_presupuestos
SELECT public._create_idx_if_col('erp_presupuestos', 'idx_presupuestos_proyecto_id', 'proyecto_id');
SELECT public._create_idx_if_col('erp_presupuestos', 'idx_presupuestos_estado', 'estado');

-- erp_hitos
SELECT public._create_idx_if_col('erp_hitos', 'idx_hitos_proyecto_id', 'proyecto_id');
SELECT public._create_idx_if_col('erp_hitos', 'idx_hitos_estado', 'estado');

-- erp_riesgos
SELECT public._create_idx_if_col('erp_riesgos', 'idx_riesgos_proyecto_id', 'proyecto_id');
SELECT public._create_idx_if_col('erp_riesgos', 'idx_riesgos_nivel', 'nivel');

-- erp_no_conformidades
SELECT public._create_idx_if_col('erp_no_conformidades', 'idx_nc_proyecto_id', 'proyecto_id');
SELECT public._create_idx_if_col('erp_no_conformidades', 'idx_nc_estado', 'estado');

-- erp_cuentas_pagar
SELECT public._create_idx_if_col('erp_cuentas_pagar', 'idx_cpagar_proyecto_id', 'proyecto_id');
SELECT public._create_idx_if_col('erp_cuentas_pagar', 'idx_cpagar_estado', 'estado');

-- erp_cuentas_cobrar
SELECT public._create_idx_if_col('erp_cuentas_cobrar', 'idx_ccobrar_proyecto_id', 'proyecto_id');
SELECT public._create_idx_if_col('erp_cuentas_cobrar', 'idx_ccobrar_estado', 'estado');

-- erp_notificaciones
SELECT public._create_idx_if_col('erp_notificaciones', 'idx_notif_user_unread', 'user_id');

-- erp_empleados (NO tiene columna estado)
SELECT public._create_idx_if_col('erp_empleados', 'idx_empleados_cargo', 'cargo');

-- erp_licitaciones
SELECT public._create_idx_if_col('erp_licitaciones', 'idx_licitaciones_estado', 'estado');
SELECT public._create_idx_if_col('erp_licitaciones', 'idx_licitaciones_probabilidad', 'probabilidad');

-- erp_cotizaciones_negocio
SELECT public._create_idx_if_col('erp_cotizaciones_negocio', 'idx_cotizaciones_proyecto', 'proyecto_id');

-- erp_ordenes_cambio
SELECT public._create_idx_if_col('erp_ordenes_cambio', 'idx_ocambio_proyecto', 'proyecto_id');
SELECT public._create_idx_if_col('erp_ordenes_cambio', 'idx_ocambio_estado', 'estado');

-- erp_incidentes
SELECT public._create_idx_if_col('erp_incidentes', 'idx_incidentes_proyecto', 'proyecto_id');
SELECT public._create_idx_if_col('erp_incidentes', 'idx_incidentes_gravedad', 'gravedad');

-- erp_activos
SELECT public._create_idx_if_col('erp_activos', 'idx_activos_proyecto', 'proyecto_id');
SELECT public._create_idx_if_col('erp_activos', 'idx_activos_estado', 'estado');

-- erp_bitacora (NO tiene columna estado)
SELECT public._create_idx_if_col('erp_bitacora', 'idx_bitacora_proyecto', 'proyecto_id');
SELECT public._create_idx_if_col('erp_bitacora', 'idx_bitacora_fecha', 'fecha');

-- erp_planos
SELECT public._create_idx_if_col('erp_planos', 'idx_planos_proyecto', 'proyecto_id');
SELECT public._create_idx_if_col('erp_planos', 'idx_planos_estado', 'estado');

-- erp_rfis
SELECT public._create_idx_if_col('erp_rfis', 'idx_rfis_proyecto', 'proyecto_id');
SELECT public._create_idx_if_col('erp_rfis', 'idx_rfis_estado', 'estado');

-- erp_submittals
SELECT public._create_idx_if_col('erp_submittals', 'idx_submittals_proyecto', 'proyecto_id');
SELECT public._create_idx_if_col('erp_submittals', 'idx_submittals_estado', 'estado');

-- erp_proyecto_miembros
SELECT public._create_idx_if_col('erp_proyecto_miembros', 'idx_miembros_user', 'user_id');
SELECT public._create_idx_if_col('erp_proyecto_miembros', 'idx_miembros_proyecto', 'proyecto_id');

-- erp_usuarios
SELECT public._create_idx_if_col('erp_usuarios', 'idx_usuarios_email', 'email');

-- ============================================================
-- 3. TRIGGER updated_at (solo si columna updated_at existe)
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  _table text;
  _tables text[] := ARRAY[
    'erp_proyectos', 'erp_movimientos', 'erp_empleados', 'erp_materiales',
    'erp_ordenes_compra', 'erp_proveedores', 'erp_eventos_calendario',
    'erp_bitacora', 'erp_seguimiento', 'erp_renglones', 'erp_insumos',
    'erp_sub_renglones', 'erp_presupuestos', 'erp_vales_salida', 'erp_avances',
    'erp_hitos', 'erp_riesgos', 'erp_no_conformidades', 'erp_incidentes',
    'erp_activos', 'erp_planos', 'erp_rfis', 'erp_submittals',
    'erp_ordenes_cambio', 'erp_cuentas_cobrar', 'erp_cuentas_pagar',
    'erp_licitaciones', 'erp_cotizaciones_negocio', 'erp_notificaciones'
  ];
BEGIN
  FOREACH _table IN ARRAY _tables
  LOOP
    IF EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = _table AND table_type = 'BASE TABLE'
    ) AND EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = _table AND column_name = 'updated_at'
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'public' AND c.relname = _table AND t.tgname = 'trigger_set_updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
        _table
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 4. ANALYZE
-- ============================================================

DO $$
DECLARE
  _table text;
  _tables text[] := ARRAY[
    'erp_proyectos', 'erp_materiales', 'erp_ordenes_compra', 'erp_presupuestos',
    'erp_avances', 'erp_vales_salida', 'erp_hitos', 'erp_riesgos',
    'erp_no_conformidades', 'erp_incidentes', 'erp_empleados'
  ];
BEGIN
  FOREACH _table IN ARRAY _tables
  LOOP
    IF EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = _table AND table_type = 'BASE TABLE'
    ) THEN
      EXECUTE format('ANALYZE public.%I', _table);
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 5. LIMPIEZA: eliminar helpers
-- ============================================================
DROP FUNCTION IF EXISTS public._create_idx_if_col;
DROP FUNCTION IF EXISTS public._create_compound_idx_if;