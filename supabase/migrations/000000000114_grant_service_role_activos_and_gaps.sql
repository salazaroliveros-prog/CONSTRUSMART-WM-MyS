-- ============================================================================
-- MIGRACIÓN 114: GRANTs faltantes para service_role + authenticated
-- Fecha: 2026-07-16
-- Motivo: erp_activos devuelve 403 en fetchInitialData porque service_role
--         no tiene permisos SELECT. Se aplican GRANTs a todas las tablas
--         operacionales que pueden tener el mismo problema.
-- ============================================================================

-- ── erp_activos (bug crítico) ─────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_activos TO authenticated;
GRANT ALL ON public.erp_activos TO service_role;

-- ── Tablas operacionales: asegurar GRANTs completos ─────────────────────────
-- Se aplica GRANT a todas las tablas erp_* para evitar 403 futuros.
-- service_role necesita ALL para funciones internas de Supabase (triggers, rpcs).

DO $$
DECLARE
  tbl text;
  tablas text[] := ARRAY[
    'erp_proyectos','erp_movimientos','erp_empleados','erp_materiales',
    'erp_ordenes_compra','erp_proveedores','erp_cuentas_cobrar','erp_cuentas_pagar',
    'erp_hitos','erp_riesgos','erp_licitaciones',
    'erp_cotizaciones_negocio','erp_vales_salida',
    'erp_no_conformidades','erp_incidentes',
    'erp_publicaciones_muro','erp_planos','erp_rfis','erp_submittals',
    'erp_activos','erp_cuadros','erp_pagos_proveedor','erp_destajos',
    'erp_recepciones','erp_centros_costo','erp_seguimiento','erp_bitacora',
    'erp_plantillas_proyectos','erp_notificaciones','erp_presupuestos',
    'erp_avances','erp_eventos_calendario','erp_ventas_paquetes',
    'erp_ordenes_cambio','erp_pruebas_laboratorio','erp_liberaciones_partida',
    'erp_error_log','erp_proyecto_weather','erp_auditoria',
    'erp_insumos_base','erp_reglas_factores','erp_normativa_departamental',
    'erp_escalas_produccion','erp_estacionalidad',
    'erp_historial_aplicacion_reglas','erp_ajustes_estacionales_actividad',
    'erp_calculos_proyecto','erp_cumplimiento_normativo',
    'erp_departamentos_gt','erp_municipios_gt','erp_archivos_tipo',
    'erp_solicitudes','erp_aplicacion_escalas',
    'erp_access_log'
  ];
BEGIN
  FOREACH tbl IN ARRAY tablas LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl);
      EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl);
    END IF;
  END LOOP;
END $$;

-- ── Tablas de referencia: solo SELECT para authenticated ───────────────────
DO $$
DECLARE
  tbl text;
  ref_tablas text[] := ARRAY[
    'erp_subtipologias','erp_dosificaciones_concreto','erp_referencias_acero',
    'erp_precios_acero','erp_parametros_movimiento_tierra','erp_parametros_climaticos',
    'erp_parametros_pavimentos','erp_parametros_redes_infraestructura',
    'erp_parametros_muros_contencion'
  ];
BEGIN
  FOREACH tbl IN ARRAY ref_tablas LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('GRANT SELECT ON public.%I TO authenticated', tbl);
      EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl);
    END IF;
  END LOOP;
END $$;

-- ── profiles: authenticated necesita SELECT propio + admin tiene ALL ────────
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- ── logs_sistema ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='logs_sistema') THEN
    EXECUTE 'GRANT SELECT, INSERT ON public.logs_sistema TO authenticated';
    EXECUTE 'GRANT ALL ON public.logs_sistema TO service_role';
  END IF;
END $$;
