-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 24: Performance Indexes + Triggers
-- Fecha: 2026-06-13
--
-- 1. Índices de rendimiento para consultas frecuentes
-- 2. Triggers updated_at para todas las tablas
-- 3. Trigger de auditoría para tablas críticas
-- 4. Estadísticas de tablas para query planner
-- ============================================================

-- ============================================================
-- 1. ÍNDICES DE RENDIMIENTO
-- ============================================================

-- erp_proyectos: filtros por estado, created_by, fechas
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON public.erp_proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_proyectos_created_by ON public.erp_proyectos(created_by);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado_created ON public.erp_proyectos(estado, created_by);
CREATE INDEX IF NOT EXISTS idx_proyectos_fecha_inicio ON public.erp_proyectos(fecha_inicio);

-- erp_materiales: filtros por bodega, categoría, stock bajo
CREATE INDEX IF NOT EXISTS idx_materiales_bodega ON public.erp_materiales(bodega);
CREATE INDEX IF NOT EXISTS idx_materiales_categoria ON public.erp_materiales(categoria);
CREATE INDEX IF NOT EXISTS idx_materiales_stock_bajo ON public.erp_materiales(stock) WHERE stock <= COALESCE(stock_minimo, 0);
CREATE INDEX IF NOT EXISTS idx_materiales_nombre ON public.erp_materiales USING gin(to_tsvector('spanish', nombre));

-- erp_ordenes_compra: filtros por estado, proyecto
CREATE INDEX IF NOT EXISTS idx_oc_estado ON public.erp_ordenes_compra(estado);
CREATE INDEX IF NOT EXISTS idx_oc_proyecto_id ON public.erp_ordenes_compra(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_oc_proveedor ON public.erp_ordenes_compra(proveedor);
CREATE INDEX IF NOT EXISTS idx_oc_estado_proyecto ON public.erp_ordenes_compra(estado, proyecto_id);

-- erp_avances: filtros por proyecto, fecha
CREATE INDEX IF NOT EXISTS idx_avances_proyecto_id ON public.erp_avances(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_avances_fecha ON public.erp_avances(fecha);
CREATE INDEX IF NOT EXISTS idx_avances_proyecto_fecha ON public.erp_avances(proyecto_id, fecha);

-- erp_vales_salida: filtros por proyecto, estado
CREATE INDEX IF NOT EXISTS idx_vales_proyecto_id ON public.erp_vales_salida(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_vales_estado ON public.erp_vales_salida(estado);

-- erp_presupuestos: filtros por proyecto
CREATE INDEX IF NOT EXISTS idx_presupuestos_proyecto_id ON public.erp_presupuestos(proyecto_id);

-- erp_hitos: filtros por proyecto, fecha límite
CREATE INDEX IF NOT EXISTS idx_hitos_proyecto_id ON public.erp_hitos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_hitos_fecha_limite ON public.erp_hitos(fecha_limite);
CREATE INDEX IF NOT EXISTS idx_hitos_estado ON public.erp_hitos(estado);

-- erp_riesgos: filtros por proyecto, nivel
CREATE INDEX IF NOT EXISTS idx_riesgos_proyecto_id ON public.erp_riesgos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_riesgos_nivel ON public.erp_riesgos(nivel);

-- erp_no_conformidades: filtros por proyecto, estado
CREATE INDEX IF NOT EXISTS idx_nc_proyecto_id ON public.erp_no_conformidades(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_nc_estado ON public.erp_no_conformidades(estado);

-- erp_cuentas_pagar: filtros por proyecto, estado pago
CREATE INDEX IF NOT EXISTS idx_cpagar_proyecto_id ON public.erp_cuentas_pagar(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_cpagar_estado ON public.erp_cuentas_pagar(estado_pago);

-- erp_cuentas_cobrar: filtros por proyecto, estado cobro
CREATE INDEX IF NOT EXISTS idx_ccobrar_proyecto_id ON public.erp_cuentas_cobrar(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ccobrar_estado ON public.erp_cuentas_cobrar(estado_cobro);

-- erp_notificaciones: filtros por usuario, leído
CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON public.erp_notificaciones(user_id, leida) WHERE leida = false;
CREATE INDEX IF NOT EXISTS idx_notif_created ON public.erp_notificaciones(created_at DESC);

-- erp_empleados: filtros por proyecto, cargo
CREATE INDEX IF NOT EXISTS idx_empleados_cargo ON public.erp_empleados(cargo);

-- erp_licitaciones: filtros por estado, probabilidad
CREATE INDEX IF NOT EXISTS idx_licitaciones_estado ON public.erp_licitaciones(estado);
CREATE INDEX IF NOT EXISTS idx_licitaciones_probabilidad ON public.erp_licitaciones(probabilidad);

-- erp_cotizaciones_negocio: filtros por proyecto
CREATE INDEX IF NOT EXISTS idx_cotizaciones_proyecto ON public.erp_cotizaciones_negocio(proyecto_id);

-- erp_ordenes_cambio: filtros por proyecto, estado
CREATE INDEX IF NOT EXISTS idx_ocambio_proyecto ON public.erp_ordenes_cambio(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ocambio_estado ON public.erp_ordenes_cambio(estado);

-- erp_incidentes: filtros por proyecto, gravedad
CREATE INDEX IF NOT EXISTS idx_incidentes_proyecto ON public.erp_incidentes(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_incidentes_gravedad ON public.erp_incidentes(gravedad);

-- erp_activos: filtros por proyecto, estado
CREATE INDEX IF NOT EXISTS idx_activos_proyecto ON public.erp_activos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_activos_estado ON public.erp_activos(estado);

-- erp_bitacora: filtros por proyecto, fecha
CREATE INDEX IF NOT EXISTS idx_bitacora_proyecto ON public.erp_bitacora(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_fecha ON public.erp_bitacora(fecha);

-- erp_planos: filtros por proyecto, estado
CREATE INDEX IF NOT EXISTS idx_planos_proyecto ON public.erp_planos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_planos_estado ON public.erp_planos(estado);

-- erp_rfis: filtros por proyecto, estado
CREATE INDEX IF NOT EXISTS idx_rfis_proyecto ON public.erp_rfis(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_rfis_estado ON public.erp_rfis(estado);

-- erp_submittals: filtros por proyecto, estado
CREATE INDEX IF NOT EXISTS idx_submittals_proyecto ON public.erp_submittals(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_submittals_estado ON public.erp_submittals(estado);

-- erp_proyecto_miembros: filtros por usuario
CREATE INDEX IF NOT EXISTS idx_miembros_user ON public.erp_proyecto_miembros(user_id);
CREATE INDEX IF NOT EXISTS idx_miembros_proyecto ON public.erp_proyecto_miembros(proyecto_id);

-- erp_usuarios: filtro por email
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.erp_usuarios(email);

-- ============================================================
-- 2. TRIGGER updated_at PARA TODAS LAS TABLAS
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
    'erp_proyectos', 'erp_materiales', 'erp_ordenes_compra', 'erp_presupuestos',
    'erp_avances', 'erp_vales_salida', 'erp_hitos', 'erp_riesgos',
    'erp_no_conformidades', 'erp_incidentes', 'erp_activos', 'erp_planos',
    'erp_rfis', 'erp_submittals', 'erp_bitacora', 'erp_eventos_calendario',
    'erp_ordenes_cambio', 'erp_cuentas_cobrar', 'erp_cuentas_pagar',
    'erp_licitaciones', 'erp_cotizaciones_negocio', 'erp_notificaciones',
    'erp_empleados', 'erp_materiales'
  ];
BEGIN
  FOREACH _table IN ARRAY _tables
  LOOP
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = _table AND table_type = 'BASE TABLE')
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = _table AND column_name = 'updated_at')
       AND NOT EXISTS (
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
-- 3. ESTADÍSTICAS PARA QUERY PLANNER
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
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = _table AND table_type = 'BASE TABLE') THEN
      EXECUTE format('ANALYZE public.%I', _table);
    END IF;
  END LOOP;
END $$;