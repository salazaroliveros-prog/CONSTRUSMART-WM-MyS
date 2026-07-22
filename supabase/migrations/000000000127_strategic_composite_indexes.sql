-- ============================================================
-- MIGRACIÓN 127: Índices compuestos estratégicos (idempotente)
-- Objetivo: Acelerar queries frecuentes de la app ERP
-- Estrategia: 100% defensivo — verifica columnas antes de crear
-- ============================================================

DO $$
DECLARE
  _exists boolean;
BEGIN

  -- ============================================================
  -- 1. erp_proyectos
  -- ============================================================

  -- estado + tipologia
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_proyectos_estado_tipologia') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='estado')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='tipologia') THEN
      CREATE INDEX idx_erp_proyectos_estado_tipologia ON erp_proyectos(estado, tipologia);
      RAISE NOTICE 'Created idx_erp_proyectos_estado_tipologia';
    END IF;
  END IF;

  -- estado + fecha_inicio
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_proyectos_estado_fecha_inicio') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='estado')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='fecha_inicio') THEN
      CREATE INDEX idx_erp_proyectos_estado_fecha_inicio ON erp_proyectos(estado, fecha_inicio);
      RAISE NOTICE 'Created idx_erp_proyectos_estado_fecha_inicio';
    END IF;
  END IF;

  -- cliente + estado
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_proyectos_cliente_estado') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='cliente')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_proyectos' AND column_name='estado') THEN
      CREATE INDEX idx_erp_proyectos_cliente_estado ON erp_proyectos(cliente, estado);
      RAISE NOTICE 'Created idx_erp_proyectos_cliente_estado';
    END IF;
  END IF;

  -- ============================================================
  -- 2. erp_movimientos
  -- ============================================================

  -- proyecto_id + tipo + fecha
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_movimientos_proyecto_tipo_fecha') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_movimientos' AND column_name='proyecto_id')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_movimientos' AND column_name='tipo')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_movimientos' AND column_name='fecha') THEN
      CREATE INDEX idx_erp_movimientos_proyecto_tipo_fecha ON erp_movimientos(proyecto_id, tipo, fecha DESC);
      RAISE NOTICE 'Created idx_erp_movimientos_proyecto_tipo_fecha';
    END IF;
  END IF;

  -- tipo + fecha (global sin proyecto)
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_movimientos_tipo_fecha') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_movimientos' AND column_name='tipo')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_movimientos' AND column_name='fecha') THEN
      CREATE INDEX idx_erp_movimientos_tipo_fecha ON erp_movimientos(tipo, fecha DESC);
      RAISE NOTICE 'Created idx_erp_movimientos_tipo_fecha';
    END IF;
  END IF;

  -- índice parcial egresos
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_movimientos_egresos') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_movimientos' AND column_name='tipo')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_movimientos' AND column_name='proyecto_id')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_movimientos' AND column_name='fecha') THEN
      CREATE INDEX idx_erp_movimientos_egresos ON erp_movimientos(proyecto_id, fecha DESC) WHERE tipo = 'egreso';
      RAISE NOTICE 'Created idx_erp_movimientos_egresos';
    END IF;
  END IF;

  -- ============================================================
  -- 3. erp_presupuestos
  -- ============================================================

  -- proyecto_id + estado
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_presupuestos_proyecto_estado') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_presupuestos' AND column_name='proyecto_id')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_presupuestos' AND column_name='estado') THEN
      CREATE INDEX idx_erp_presupuestos_proyecto_estado ON erp_presupuestos(proyecto_id, estado);
      RAISE NOTICE 'Created idx_erp_presupuestos_proyecto_estado';
    END IF;
  END IF;

  -- proyecto_id + version_presupuesto
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_presupuestos_proyecto_version') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_presupuestos' AND column_name='proyecto_id')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_presupuestos' AND column_name='version_presupuesto') THEN
      CREATE INDEX idx_erp_presupuestos_proyecto_version ON erp_presupuestos(proyecto_id, version_presupuesto DESC);
      RAISE NOTICE 'Created idx_erp_presupuestos_proyecto_version';
    END IF;
  END IF;

  -- ============================================================
  -- 4. erp_hitos
  -- ============================================================

  -- proyecto_id + estado (siempre disponibles)
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_hitos_proyecto_estado') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_hitos' AND column_name='proyecto_id')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_hitos' AND column_name='estado') THEN
      CREATE INDEX idx_erp_hitos_proyecto_estado ON erp_hitos(proyecto_id, estado);
      RAISE NOTICE 'Created idx_erp_hitos_proyecto_estado';
    END IF;
  END IF;

  -- proyecto_id + estado + fecha_fin (si existe)
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_hitos_proyecto_estado_fecha') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_hitos' AND column_name='proyecto_id')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_hitos' AND column_name='estado')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_hitos' AND column_name='fecha_fin') THEN
      CREATE INDEX idx_erp_hitos_proyecto_estado_fecha ON erp_hitos(proyecto_id, estado, fecha_fin);
      RAISE NOTICE 'Created idx_erp_hitos_proyecto_estado_fecha (fecha_fin)';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_hitos' AND column_name='proyecto_id')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_hitos' AND column_name='estado')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_hitos' AND column_name='fecha') THEN
      CREATE INDEX idx_erp_hitos_proyecto_estado_fecha ON erp_hitos(proyecto_id, estado, fecha);
      RAISE NOTICE 'Created idx_erp_hitos_proyecto_estado_fecha (fecha)';
    END IF;
  END IF;

  -- ============================================================
  -- 5. erp_materiales
  -- ============================================================

  -- proyecto_id + columna de stock (nombre varía según migración)
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_materiales_proyecto_stock') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_materiales' AND column_name='proyecto_id')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_materiales' AND column_name='stock_actual') THEN
      CREATE INDEX idx_erp_materiales_proyecto_stock ON erp_materiales(proyecto_id, stock_actual);
      RAISE NOTICE 'Created idx_erp_materiales_proyecto_stock';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_materiales' AND column_name='proyecto_id')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_materiales' AND column_name='cantidad') THEN
      CREATE INDEX idx_erp_materiales_proyecto_stock ON erp_materiales(proyecto_id, cantidad);
      RAISE NOTICE 'Created idx_erp_materiales_proyecto_stock (cantidad)';
    END IF;
  END IF;

  -- ============================================================
  -- 6. erp_ordenes_compra
  -- ============================================================

  -- proyecto_id + estado + fecha
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_ordenes_compra_proyecto_estado_fecha') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_ordenes_compra' AND column_name='proyecto_id')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_ordenes_compra' AND column_name='estado')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_ordenes_compra' AND column_name='fecha') THEN
      CREATE INDEX idx_erp_ordenes_compra_proyecto_estado_fecha ON erp_ordenes_compra(proyecto_id, estado, fecha DESC);
      RAISE NOTICE 'Created idx_erp_ordenes_compra_proyecto_estado_fecha';
    END IF;
  END IF;

  -- índice parcial pendientes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_ordenes_compra_pendientes') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_ordenes_compra' AND column_name='estado')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_ordenes_compra' AND column_name='proyecto_id') THEN
      CREATE INDEX idx_erp_ordenes_compra_pendientes ON erp_ordenes_compra(proyecto_id) WHERE estado IN ('borrador', 'aprobacion');
      RAISE NOTICE 'Created idx_erp_ordenes_compra_pendientes';
    END IF;
  END IF;

  -- ============================================================
  -- 7. erp_empleados
  -- ============================================================

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_empleados_proyecto_activo') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_empleados' AND column_name='proyecto_id')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_empleados' AND column_name='activo') THEN
      CREATE INDEX idx_erp_empleados_proyecto_activo ON erp_empleados(proyecto_id, activo);
      RAISE NOTICE 'Created idx_erp_empleados_proyecto_activo';
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_empleados_cargo_proyecto') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_empleados' AND column_name='cargo')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_empleados' AND column_name='proyecto_id') THEN
      CREATE INDEX idx_erp_empleados_cargo_proyecto ON erp_empleados(cargo, proyecto_id);
      RAISE NOTICE 'Created idx_erp_empleados_cargo_proyecto';
    END IF;
  END IF;

  -- ============================================================
  -- 8. erp_riesgos
  -- ============================================================

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_riesgos_proyecto_prob_impacto') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_riesgos' AND column_name='proyecto_id')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_riesgos' AND column_name='probabilidad')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_riesgos' AND column_name='impacto') THEN
      CREATE INDEX idx_erp_riesgos_proyecto_prob_impacto ON erp_riesgos(proyecto_id, probabilidad, impacto);
      RAISE NOTICE 'Created idx_erp_riesgos_proyecto_prob_impacto';
    END IF;
  END IF;

  -- ============================================================
  -- 9. erp_seguimiento
  -- ============================================================

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_seguimiento_proyecto_fecha') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_seguimiento')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_seguimiento' AND column_name='proyecto_id')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_seguimiento' AND column_name='fecha') THEN
      CREATE INDEX idx_erp_seguimiento_proyecto_fecha ON erp_seguimiento(proyecto_id, fecha DESC);
      RAISE NOTICE 'Created idx_erp_seguimiento_proyecto_fecha';
    END IF;
  END IF;

  -- ============================================================
  -- 10. erp_audit_log / erp_auditoria
  -- ============================================================

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_audit_log_tabla_fecha') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_audit_log')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_audit_log' AND column_name='tabla')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_audit_log' AND column_name='fecha_hora') THEN
      CREATE INDEX idx_erp_audit_log_tabla_fecha ON erp_audit_log(tabla, fecha_hora DESC);
      RAISE NOTICE 'Created idx_erp_audit_log_tabla_fecha';
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_audit_log_usuario_fecha') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_audit_log')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_audit_log' AND column_name='usuario_id')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_audit_log' AND column_name='fecha_hora') THEN
      CREATE INDEX idx_erp_audit_log_usuario_fecha ON erp_audit_log(usuario_id, fecha_hora DESC);
      RAISE NOTICE 'Created idx_erp_audit_log_usuario_fecha';
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_auditoria_tabla_fecha') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_auditoria')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_auditoria' AND column_name='tabla')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_auditoria' AND column_name='fecha_hora') THEN
      CREATE INDEX idx_erp_auditoria_tabla_fecha ON erp_auditoria(tabla, fecha_hora DESC);
      RAISE NOTICE 'Created idx_erp_auditoria_tabla_fecha';
    END IF;
  END IF;

  -- ============================================================
  -- 11. erp_notificaciones
  -- ============================================================

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_notificaciones_usuario_leido') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_notificaciones')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_notificaciones' AND column_name='leido')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_notificaciones' AND column_name='created_at') THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_notificaciones' AND column_name='usuario_id') THEN
        CREATE INDEX idx_erp_notificaciones_usuario_leido ON erp_notificaciones(usuario_id, leido, created_at DESC);
        RAISE NOTICE 'Created idx_erp_notificaciones_usuario_leido';
      ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_notificaciones' AND column_name='proyecto_id') THEN
        CREATE INDEX idx_erp_notificaciones_usuario_leido ON erp_notificaciones(proyecto_id, leido, created_at DESC);
        RAISE NOTICE 'Created idx_erp_notificaciones_usuario_leido (proyecto_id fallback)';
      END IF;
    END IF;
  END IF;

  -- ============================================================
  -- 12. erp_cuentas_cobrar / erp_cuentas_pagar
  -- ============================================================

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_cuentas_cobrar_vencimiento_estado') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_cuentas_cobrar' AND column_name='estado') THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_cuentas_cobrar' AND column_name='fecha_vencimiento') THEN
        CREATE INDEX idx_erp_cuentas_cobrar_vencimiento_estado ON erp_cuentas_cobrar(fecha_vencimiento, estado);
        RAISE NOTICE 'Created idx_erp_cuentas_cobrar_vencimiento_estado';
      ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_cuentas_cobrar' AND column_name='fecha_limite') THEN
        CREATE INDEX idx_erp_cuentas_cobrar_vencimiento_estado ON erp_cuentas_cobrar(fecha_limite, estado);
        RAISE NOTICE 'Created idx_erp_cuentas_cobrar_vencimiento_estado (fecha_limite)';
      END IF;
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_cuentas_pagar_vencimiento_estado') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_cuentas_pagar' AND column_name='estado') THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_cuentas_pagar' AND column_name='fecha_vencimiento') THEN
        CREATE INDEX idx_erp_cuentas_pagar_vencimiento_estado ON erp_cuentas_pagar(fecha_vencimiento, estado);
        RAISE NOTICE 'Created idx_erp_cuentas_pagar_vencimiento_estado';
      ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_cuentas_pagar' AND column_name='fecha_limite') THEN
        CREATE INDEX idx_erp_cuentas_pagar_vencimiento_estado ON erp_cuentas_pagar(fecha_limite, estado);
        RAISE NOTICE 'Created idx_erp_cuentas_pagar_vencimiento_estado (fecha_limite)';
      END IF;
    END IF;
  END IF;

  -- ============================================================
  -- 13. erp_ordenes_cambio
  -- ============================================================

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_ordenes_cambio_proyecto_estado') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_ordenes_cambio' AND column_name='proyecto_id')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_ordenes_cambio' AND column_name='estado') THEN
      CREATE INDEX idx_erp_ordenes_cambio_proyecto_estado ON erp_ordenes_cambio(proyecto_id, estado);
      RAISE NOTICE 'Created idx_erp_ordenes_cambio_proyecto_estado';
    END IF;
  END IF;

  -- ============================================================
  -- 14. erp_avances
  -- ============================================================

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_avances_proyecto_fecha') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_avances' AND column_name='proyecto_id')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_avances' AND column_name='fecha') THEN
      CREATE INDEX idx_erp_avances_proyecto_fecha ON erp_avances(proyecto_id, fecha DESC);
      RAISE NOTICE 'Created idx_erp_avances_proyecto_fecha';
    END IF;
  END IF;

  -- ============================================================
  -- 15. erp_error_log
  -- ============================================================

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_error_log_severity_created') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_error_log')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_error_log' AND column_name='severity')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_error_log' AND column_name='created_at') THEN
      CREATE INDEX idx_erp_error_log_severity_created ON erp_error_log(severity, created_at DESC);
      RAISE NOTICE 'Created idx_erp_error_log_severity_created';
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_erp_error_log_resolved_created') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_error_log')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_error_log' AND column_name='resolved')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_error_log' AND column_name='created_at') THEN
      CREATE INDEX idx_erp_error_log_resolved_created ON erp_error_log(resolved, created_at DESC);
      RAISE NOTICE 'Created idx_erp_error_log_resolved_created';
    END IF;
  END IF;

END $$;
