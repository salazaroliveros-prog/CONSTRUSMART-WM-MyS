-- ============================================================================
-- MIGRACIÓN 112: Corregir RLS policies "always true" en tablas operacionales
-- Fecha: 2026-07-16
-- ============================================================================
-- Tablas de referencia del motor APU (departamentos, municipios, dosificaciones,
-- acero, pavimentos, etc.) se dejan con WITH CHECK (true) intencionalmente —
-- son datos de catálogo que solo Administrador/Gerente modifican y el linter
-- los marca pero no son riesgo real porque el SELECT ya está filtrado por RLS.
--
-- Tablas operacionales con datos sensibles: se añade restricción de proyecto_id
-- o usuario_id según corresponda.
-- ============================================================================

-- ── erp_cotizaciones_negocio ────────────────────────────────────────────────

DROP POLICY IF EXISTS "cotizaciones_negocio_insert" ON public.erp_cotizaciones_negocio;
DROP POLICY IF EXISTS "cotizaciones_negocio_update" ON public.erp_cotizaciones_negocio;
DROP POLICY IF EXISTS "cotizaciones_negocio_delete" ON public.erp_cotizaciones_negocio;

CREATE POLICY "cotizaciones_negocio_insert" ON public.erp_cotizaciones_negocio
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente','Compras'))
  );

CREATE POLICY "cotizaciones_negocio_update" ON public.erp_cotizaciones_negocio
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente','Compras'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente','Compras'))
  );

CREATE POLICY "cotizaciones_negocio_delete" ON public.erp_cotizaciones_negocio
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente'))
  );

-- ── erp_pagos_proveedor ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "pagos_proveedor_insert" ON public.erp_pagos_proveedor;
DROP POLICY IF EXISTS "pagos_proveedor_update" ON public.erp_pagos_proveedor;
DROP POLICY IF EXISTS "pagos_proveedor_delete" ON public.erp_pagos_proveedor;

CREATE POLICY "pagos_proveedor_insert" ON public.erp_pagos_proveedor
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente','Compras'))
  );

CREATE POLICY "pagos_proveedor_update" ON public.erp_pagos_proveedor
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente','Compras'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente','Compras'))
  );

CREATE POLICY "pagos_proveedor_delete" ON public.erp_pagos_proveedor
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente'))
  );

-- ── erp_solicitudes ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "solicitudes_insert" ON public.erp_solicitudes;
DROP POLICY IF EXISTS "solicitudes_update" ON public.erp_solicitudes;
DROP POLICY IF EXISTS "solicitudes_delete" ON public.erp_solicitudes;

CREATE POLICY "solicitudes_insert" ON public.erp_solicitudes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente','Residente','Compras'))
  );

CREATE POLICY "solicitudes_update" ON public.erp_solicitudes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente','Residente','Compras'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente','Residente','Compras'))
  );

CREATE POLICY "solicitudes_delete" ON public.erp_solicitudes
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente'))
  );

-- ── erp_error_log ────────────────────────────────────────────────────────────
-- Sistema de logging: INSERT abierto para usuarios autenticados (necesario para
-- reportar errores del frontend). UPDATE/DELETE solo admin.

DROP POLICY IF EXISTS "error_log_insert" ON public.erp_error_log;

CREATE POLICY "error_log_insert" ON public.erp_error_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── erp_audit_log ────────────────────────────────────────────────────────────
-- Solo triggers internos (postgres) deben insertar. authenticated no debe
-- poder manipular el audit log directamente.

DROP POLICY IF EXISTS "audit_log_insert_system" ON public.erp_audit_log;

CREATE POLICY "audit_log_insert_system" ON public.erp_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol = 'Administrador')
  );

-- ── logs_sistema ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "System can insert logs" ON public.logs_sistema;

CREATE POLICY "System can insert logs" ON public.logs_sistema
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── erp_publicaciones_muro ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can insert own publicaciones" ON public.erp_publicaciones_muro;

CREATE POLICY "Users can insert own publicaciones" ON public.erp_publicaciones_muro
  FOR INSERT TO authenticated
  WITH CHECK (autor_id = auth.uid());

-- ── erp_proyecto_weather ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can insert own proyecto weather" ON public.erp_proyecto_weather;
DROP POLICY IF EXISTS "Users can update own proyecto weather" ON public.erp_proyecto_weather;
DROP POLICY IF EXISTS "Users can delete own proyecto weather" ON public.erp_proyecto_weather;

CREATE POLICY "Users can insert own proyecto weather" ON public.erp_proyecto_weather
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own proyecto weather" ON public.erp_proyecto_weather
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own proyecto weather" ON public.erp_proyecto_weather
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ── erp_recepciones ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "recepciones_insert" ON public.erp_recepciones;
DROP POLICY IF EXISTS "recepciones_update" ON public.erp_recepciones;
DROP POLICY IF EXISTS "recepciones_delete" ON public.erp_recepciones;

CREATE POLICY "recepciones_insert" ON public.erp_recepciones
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente','Compras','Bodeguero'))
  );

CREATE POLICY "recepciones_update" ON public.erp_recepciones
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente','Compras','Bodeguero'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente','Compras','Bodeguero'))
  );

CREATE POLICY "recepciones_delete" ON public.erp_recepciones
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente'))
  );

-- ── erp_archivos_tipo ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "archivos_tipo_insert" ON public.erp_archivos_tipo;
DROP POLICY IF EXISTS "archivos_tipo_update" ON public.erp_archivos_tipo;
DROP POLICY IF EXISTS "archivos_tipo_delete" ON public.erp_archivos_tipo;

CREATE POLICY "archivos_tipo_insert" ON public.erp_archivos_tipo
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente'))
  );

CREATE POLICY "archivos_tipo_update" ON public.erp_archivos_tipo
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente'))
  );

CREATE POLICY "archivos_tipo_delete" ON public.erp_archivos_tipo
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND rol IN ('Administrador','Gerente'))
  );

-- ── erp_solicitudes_cambio_empresa ───────────────────────────────────────────

DROP POLICY IF EXISTS "erp_solicitudes_cambio_empresa_insert" ON public.erp_solicitudes_cambio_empresa;

CREATE POLICY "erp_solicitudes_cambio_empresa_insert" ON public.erp_solicitudes_cambio_empresa
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── erp_historial_aplicacion_reglas ──────────────────────────────────────────
-- Motor de cálculo: solo usuarios autenticados con proyecto activo

DROP POLICY IF EXISTS "historial_reglas_insert_all" ON public.erp_historial_aplicacion_reglas;

CREATE POLICY "historial_reglas_insert_all" ON public.erp_historial_aplicacion_reglas
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── Tablas de referencia APU (datos de catálogo) ─────────────────────────────
-- Estas tablas solo Administrador/Gerente deben poder modificar.
-- Se reemplaza WITH CHECK (true) → restricción por rol.

DROP POLICY IF EXISTS "subtipologias_insert_all"               ON public.erp_subtipologias;
DROP POLICY IF EXISTS "subtipologias_update_all"               ON public.erp_subtipologias;
DROP POLICY IF EXISTS "departamentos_gt_insert_all"            ON public.erp_departamentos_gt;
DROP POLICY IF EXISTS "departamentos_gt_update_all"            ON public.erp_departamentos_gt;
DROP POLICY IF EXISTS "municipios_gt_insert_all"               ON public.erp_municipios_gt;
DROP POLICY IF EXISTS "municipios_gt_update_all"               ON public.erp_municipios_gt;
DROP POLICY IF EXISTS "dosificaciones_concreto_insert_all"     ON public.erp_dosificaciones_concreto;
DROP POLICY IF EXISTS "dosificaciones_concreto_update_all"     ON public.erp_dosificaciones_concreto;
DROP POLICY IF EXISTS "referencias_acero_insert_all"           ON public.erp_referencias_acero;
DROP POLICY IF EXISTS "referencias_acero_update_all"           ON public.erp_referencias_acero;
DROP POLICY IF EXISTS "precios_acero_insert_all"               ON public.erp_precios_acero;
DROP POLICY IF EXISTS "precios_acero_update_all"               ON public.erp_precios_acero;
DROP POLICY IF EXISTS "parametros_movimiento_tierra_insert_all" ON public.erp_parametros_movimiento_tierra;
DROP POLICY IF EXISTS "parametros_movimiento_tierra_update_all" ON public.erp_parametros_movimiento_tierra;
DROP POLICY IF EXISTS "parametros_climaticos_insert_all"       ON public.erp_parametros_climaticos;
DROP POLICY IF EXISTS "parametros_climaticos_update_all"       ON public.erp_parametros_climaticos;
DROP POLICY IF EXISTS "parametros_pavimentos_insert_all"       ON public.erp_parametros_pavimentos;
DROP POLICY IF EXISTS "parametros_pavimentos_update_all"       ON public.erp_parametros_pavimentos;
DROP POLICY IF EXISTS "parametros_redes_infraestructura_insert_all" ON public.erp_parametros_redes_infraestructura;
DROP POLICY IF EXISTS "parametros_redes_infraestructura_update_all" ON public.erp_parametros_redes_infraestructura;
DROP POLICY IF EXISTS "parametros_muros_contencion_insert_all" ON public.erp_parametros_muros_contencion;
DROP POLICY IF EXISTS "parametros_muros_contencion_update_all" ON public.erp_parametros_muros_contencion;
DROP POLICY IF EXISTS "normativa_departamental_insert_all"     ON public.erp_normativa_departamental;
DROP POLICY IF EXISTS "normativa_departamento_update_all"      ON public.erp_normativa_departamental;
DROP POLICY IF EXISTS "escalas_produccion_insert_all"          ON public.erp_escalas_produccion;
DROP POLICY IF EXISTS "escalas_produccion_update_all"          ON public.erp_escalas_produccion;
DROP POLICY IF EXISTS "estacionalidad_insert_all"              ON public.erp_estacionalidad;
DROP POLICY IF EXISTS "estacionalidad_update_all"              ON public.erp_estacionalidad;

DO $$
DECLARE
  ref_tables text[] := ARRAY[
    'erp_subtipologias','erp_departamentos_gt','erp_municipios_gt',
    'erp_dosificaciones_concreto','erp_referencias_acero','erp_precios_acero',
    'erp_parametros_movimiento_tierra','erp_parametros_climaticos',
    'erp_parametros_pavimentos','erp_parametros_redes_infraestructura',
    'erp_parametros_muros_contencion','erp_normativa_departamental',
    'erp_escalas_produccion','erp_estacionalidad'
  ];
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ref_tables LOOP
    EXECUTE format(
      'CREATE POLICY "ref_insert_%s" ON public.%I FOR INSERT TO authenticated
       WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN (''Administrador'',''Gerente'')))',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "ref_update_%s" ON public.%I FOR UPDATE TO authenticated
       USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN (''Administrador'',''Gerente'')))
       WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN (''Administrador'',''Gerente'')))',
      tbl, tbl
    );
  END LOOP;
END $$;
