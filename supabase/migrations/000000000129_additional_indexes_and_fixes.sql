-- ============================================================
-- MIGRACIÓN 129: Índices adicionales + correcciones DB-App
-- Objetivo:
--   1. Índices faltantes detectados por auditoría (FKs sin índice,
--      columnas de búsqueda frecuente no indexadas)
--   2. Alias fecha_hora en erp_audit_log (columna real: changed_at)
--   3. Índices en tablas de catálogo geográfico
--   4. Índices GIN para campos JSONB frecuentemente consultados
--   5. Índices parciales para queries de estado activo/pendiente
-- Estrategia: 100% idempotente — CREATE INDEX IF NOT EXISTS
-- ============================================================

-- ============================================================
-- SECCIÓN 1: erp_audit_log — alias changed_at para compatibilidad
-- El código App usa 'changed_at' (correcto), pero migración 127
-- intentó usar 'fecha_hora'. Agregar índice con nombre correcto.
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='erp_audit_log' AND column_name='changed_at') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_audit_log_changed_at') THEN
      CREATE INDEX idx_erp_audit_log_changed_at ON public.erp_audit_log(changed_at DESC);
      RAISE NOTICE 'Created idx_erp_audit_log_changed_at';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_audit_log_table_name_changed') THEN
      CREATE INDEX idx_erp_audit_log_table_name_changed ON public.erp_audit_log(table_name, changed_at DESC);
      RAISE NOTICE 'Created idx_erp_audit_log_table_name_changed';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_audit_log_changed_by') THEN
      CREATE INDEX idx_erp_audit_log_changed_by ON public.erp_audit_log(changed_by, changed_at DESC)
        WHERE changed_by IS NOT NULL;
      RAISE NOTICE 'Created idx_erp_audit_log_changed_by';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_audit_log_action') THEN
      CREATE INDEX idx_erp_audit_log_action ON public.erp_audit_log(action, changed_at DESC);
      RAISE NOTICE 'Created idx_erp_audit_log_action';
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECCIÓN 2: erp_departamentos_gt / erp_municipios_gt
-- Tablas de catálogo geográfico — índices en codigo y nombre
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_erp_departamentos_gt_codigo
  ON public.erp_departamentos_gt(codigo);

CREATE INDEX IF NOT EXISTS idx_erp_departamentos_gt_nombre
  ON public.erp_departamentos_gt(nombre);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='erp_municipios_gt' AND column_name='departamento_codigo') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_municipios_gt_depto') THEN
      CREATE INDEX idx_erp_municipios_gt_depto ON public.erp_municipios_gt(departamento_codigo);
    END IF;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='erp_municipios_gt' AND column_name='departamento') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_municipios_gt_depto') THEN
      CREATE INDEX idx_erp_municipios_gt_depto ON public.erp_municipios_gt(departamento);
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_erp_municipios_gt_codigo
  ON public.erp_municipios_gt(codigo);

CREATE INDEX IF NOT EXISTS idx_erp_municipios_gt_nombre
  ON public.erp_municipios_gt(nombre);

-- ============================================================
-- SECCIÓN 3: erp_proyectos — índices adicionales
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_erp_proyectos_created_at
  ON public.erp_proyectos(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_erp_proyectos_updated_at
  ON public.erp_proyectos(updated_at DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='erp_proyectos' AND column_name='factor_sobrecosto') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_proyectos_nombre_trgm') THEN
      BEGIN
        CREATE EXTENSION IF NOT EXISTS pg_trgm;
        CREATE INDEX idx_erp_proyectos_nombre_trgm ON public.erp_proyectos USING gin(nombre gin_trgm_ops);
        RAISE NOTICE 'Created trigram index on erp_proyectos.nombre';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'pg_trgm no disponible, saltando trigram index';
      END;
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECCIÓN 4: erp_movimientos — índices para cash flow y reportes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_erp_movimientos_created_at
  ON public.erp_movimientos(created_at DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='erp_movimientos' AND column_name='monto') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_movimientos_ingresos') THEN
      CREATE INDEX idx_erp_movimientos_ingresos
        ON public.erp_movimientos(proyecto_id, fecha DESC)
        WHERE tipo = 'ingreso';
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECCIÓN 5: erp_error_log — índices para dashboard de errores
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='erp_error_log' AND column_name='resolved') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_error_log_unresolved') THEN
      CREATE INDEX idx_erp_error_log_unresolved
        ON public.erp_error_log(created_at DESC)
        WHERE resolved = false;
      RAISE NOTICE 'Created idx_erp_error_log_unresolved';
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECCIÓN 6: erp_empleados — índices adicionales para RRHH
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='erp_empleados' AND column_name='nombre') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_empleados_nombre_trgm') THEN
      BEGIN
        CREATE INDEX idx_erp_empleados_nombre_trgm ON public.erp_empleados USING gin(nombre gin_trgm_ops);
        RAISE NOTICE 'Created trigram index on erp_empleados.nombre';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Trigram index en empleados no disponible';
      END;
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='erp_empleados' AND column_name='created_at') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_empleados_created_at') THEN
      CREATE INDEX idx_erp_empleados_created_at ON public.erp_empleados(created_at DESC);
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECCIÓN 7: erp_presupuestos — índices JSONB para renglones
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='erp_presupuestos' AND column_name='renglones') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_presupuestos_renglones_gin') THEN
      CREATE INDEX idx_erp_presupuestos_renglones_gin
        ON public.erp_presupuestos USING gin(renglones)
        WHERE renglones IS NOT NULL;
      RAISE NOTICE 'Created GIN index on erp_presupuestos.renglones';
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='erp_presupuestos' AND column_name='created_at') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_presupuestos_created_at') THEN
      CREATE INDEX idx_erp_presupuestos_created_at ON public.erp_presupuestos(created_at DESC);
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECCIÓN 8: erp_notificaciones — índice por usuario (si aplica)
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='erp_notificaciones' AND column_name='tipo') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_notificaciones_tipo_created') THEN
      CREATE INDEX idx_erp_notificaciones_tipo_created
        ON public.erp_notificaciones(tipo, created_at DESC)
        WHERE tipo IS NOT NULL;
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECCIÓN 9: erp_cotizaciones_negocio (CRM pipeline)
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='erp_cotizaciones_negocio') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_cotizaciones_negocio_estado') THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_cotizaciones_negocio' AND column_name='estado') THEN
        CREATE INDEX idx_erp_cotizaciones_negocio_estado ON public.erp_cotizaciones_negocio(estado);
      END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_cotizaciones_negocio_proyecto') THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_cotizaciones_negocio' AND column_name='proyecto_id') THEN
        CREATE INDEX idx_erp_cotizaciones_negocio_proyecto ON public.erp_cotizaciones_negocio(proyecto_id);
      END IF;
    END IF;
  END IF;
END $$;

-- erp_cotizaciones (tabla separada para cuadros comparativos)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='erp_cotizaciones') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_cotizaciones_proyecto') THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_cotizaciones' AND column_name='proyecto_id') THEN
        CREATE INDEX idx_erp_cotizaciones_proyecto ON public.erp_cotizaciones(proyecto_id);
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECCIÓN 10: erp_activos — índices adicionales
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='erp_activos' AND column_name='estado') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_activos_estado') THEN
      CREATE INDEX idx_erp_activos_estado ON public.erp_activos(estado);
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='erp_activos' AND column_name='proyecto_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_activos_proyecto') THEN
      CREATE INDEX idx_erp_activos_proyecto ON public.erp_activos(proyecto_id);
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECCIÓN 11: erp_destajos — índices para planilla
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='erp_destajos' AND column_name='proyecto_id')
  AND EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='erp_destajos' AND column_name='fecha') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_destajos_proyecto_fecha') THEN
      CREATE INDEX idx_erp_destajos_proyecto_fecha ON public.erp_destajos(proyecto_id, fecha DESC);
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='erp_destajos' AND column_name='cuadrilla') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_destajos_cuadrilla') THEN
      CREATE INDEX idx_erp_destajos_cuadrilla ON public.erp_destajos(cuadrilla)
        WHERE cuadrilla IS NOT NULL;
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECCIÓN 12: erp_recepciones — índices para entradas almacén
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='erp_recepciones' AND column_name='oc_id')
  OR EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='erp_recepciones' AND column_name='orden_compra_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_recepciones_oc') THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_recepciones' AND column_name='oc_id') THEN
        CREATE INDEX idx_erp_recepciones_oc ON public.erp_recepciones(oc_id);
      ELSE
        CREATE INDEX idx_erp_recepciones_oc ON public.erp_recepciones(orden_compra_id);
      END IF;
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='erp_recepciones' AND column_name='fecha') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_recepciones_fecha') THEN
      CREATE INDEX idx_erp_recepciones_fecha ON public.erp_recepciones(fecha DESC);
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECCIÓN 13: erp_avances — índices adicionales
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='erp_avances' AND column_name='created_at') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_avances_created_at') THEN
      CREATE INDEX idx_erp_avances_created_at ON public.erp_avances(created_at DESC);
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECCIÓN 14: erp_seguimiento — índice de EVM
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='erp_seguimiento') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_seguimiento' AND column_name='created_at') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_seguimiento_created_at') THEN
        CREATE INDEX idx_erp_seguimiento_created_at ON public.erp_seguimiento(created_at DESC);
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECCIÓN 15: erp_amortizaciones — si existe
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='erp_amortizaciones') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_amortizaciones' AND column_name='anticipo_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_amortizaciones_anticipo') THEN
        CREATE INDEX idx_erp_amortizaciones_anticipo ON public.erp_amortizaciones(anticipo_id);
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECCIÓN 16: erp_licitaciones
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='erp_licitaciones') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_licitaciones' AND column_name='proyecto_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_licitaciones_proyecto') THEN
        CREATE INDEX idx_erp_licitaciones_proyecto ON public.erp_licitaciones(proyecto_id);
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_licitaciones' AND column_name='estado') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_licitaciones_estado') THEN
        CREATE INDEX idx_erp_licitaciones_estado ON public.erp_licitaciones(estado);
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECCIÓN 17: erp_no_conformidades — índices para calidad
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='erp_no_conformidades') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_no_conformidades' AND column_name='proyecto_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_no_conformidades_proyecto') THEN
        CREATE INDEX idx_erp_no_conformidades_proyecto ON public.erp_no_conformidades(proyecto_id);
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_no_conformidades' AND column_name='estado') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_no_conformidades_estado') THEN
        CREATE INDEX idx_erp_no_conformidades_estado ON public.erp_no_conformidades(estado)
          WHERE estado NOT IN ('cerrada', 'cancelada');
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECCIÓN 18: Tablas de cálculo parametrizado
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='erp_reglas_factores') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_reglas_factores' AND column_name='activo') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_reglas_factores_activo') THEN
        CREATE INDEX idx_erp_reglas_factores_activo ON public.erp_reglas_factores(activo) WHERE activo = true;
      END IF;
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='erp_escalas_produccion') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_escalas_produccion' AND column_name='activo') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_escalas_produccion_activo') THEN
        CREATE INDEX idx_erp_escalas_produccion_activo ON public.erp_escalas_produccion(activo) WHERE activo = true;
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECCIÓN 19: erp_api_keys — índice para lookup activas
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='erp_api_keys') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_api_keys' AND column_name='activa') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_api_keys_activa_partial') THEN
        CREATE INDEX idx_erp_api_keys_activa_partial ON public.erp_api_keys(ultimo_uso DESC)
          WHERE activa = true;
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECCIÓN 20: erp_crm_pipeline / erp_plantillas_proyectos
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='erp_crm_pipeline') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_crm_pipeline' AND column_name='etapa') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_crm_pipeline_etapa') THEN
        CREATE INDEX idx_erp_crm_pipeline_etapa ON public.erp_crm_pipeline(etapa);
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_crm_pipeline' AND column_name='created_at') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_crm_pipeline_created_at') THEN
        CREATE INDEX idx_erp_crm_pipeline_created_at ON public.erp_crm_pipeline(created_at DESC);
      END IF;
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='erp_plantillas_proyectos') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_plantillas_proyectos' AND column_name='categoria') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_plantillas_categoria') THEN
        CREATE INDEX idx_erp_plantillas_categoria ON public.erp_plantillas_proyectos(categoria);
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='erp_plantillas_proyectos' AND column_name='activa') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_erp_plantillas_activa') THEN
        CREATE INDEX idx_erp_plantillas_activa ON public.erp_plantillas_proyectos(activa) WHERE activa = true;
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECCIÓN 21: Índices para acceso por created_at en tablas
--             principales sin índice temporal
-- ============================================================

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'erp_proveedores','erp_hitos','erp_riesgos','erp_ordenes_cambio',
    'erp_cuentas_cobrar','erp_cuentas_pagar','erp_materiales',
    'erp_activos','erp_documentos','erp_checklist'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=tbl)
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=tbl AND column_name='created_at')
    AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename=tbl AND indexname='idx_' || tbl || '_created_at') THEN
      EXECUTE format('CREATE INDEX idx_%I_created_at ON public.%I(created_at DESC)', tbl, tbl);
      RAISE NOTICE 'Created created_at index on %', tbl;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- VERIFICACIÓN FINAL: Contar índices creados
-- ============================================================

DO $$
DECLARE total_indexes integer;
BEGIN
  SELECT count(*) INTO total_indexes
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename LIKE 'erp_%';
  RAISE NOTICE 'Total índices en tablas ERP: %', total_indexes;
END $$;
