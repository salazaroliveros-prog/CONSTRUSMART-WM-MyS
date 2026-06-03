-- ============================================================
-- CONSTRUSMART ERP - Alineación de esquema y políticas RLS
-- Este archivo corrige las inconsistencias entre el esquema
-- descrito y la aplicación, y completa la cobertura de RLS.
-- ============================================================

-- ============================================================
-- PARTE 1: CORRECCIONES DE ESQUEMA
-- ============================================================

-- profiles: asegurar columnas requeridas
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS empresa_id uuid;

-- erp_proyectos: asegurar presupuesto_actual_id
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS presupuesto_actual_id uuid;

-- erp_proyectos: ampliar estados permitidos
ALTER TABLE erp_proyectos DROP CONSTRAINT IF EXISTS erp_proyectos_estado_check;
ALTER TABLE erp_proyectos ADD CONSTRAINT erp_proyectos_estado_check
  CHECK (estado = ANY (ARRAY['planeacion','ejecucion','pausado','finalizado']));

-- erp_ordenes_compra: agregar proyecto_id faltante
ALTER TABLE erp_ordenes_compra ADD COLUMN IF NOT EXISTS proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE SET NULL;

-- erp_ordenes_compra: ampliar estados permitidos
ALTER TABLE erp_ordenes_compra DROP CONSTRAINT IF EXISTS erp_ordenes_compra_estado_check;
ALTER TABLE erp_ordenes_compra ADD CONSTRAINT erp_ordenes_compra_estado_check
  CHECK (estado = ANY (ARRAY['borrador','pendiente','aprobado','rechazado','recibida','cancelada']));

-- erp_proveedores: agregar columnas faltantes
ALTER TABLE erp_proveedores ADD COLUMN IF NOT EXISTS telefono text;
ALTER TABLE erp_proveedores ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE erp_proveedores ADD COLUMN IF NOT EXISTS categoria text;

-- erp_empleados: ampliar tipos permitidos
ALTER TABLE erp_empleados DROP CONSTRAINT IF EXISTS erp_empleados_tipo_check;
ALTER TABLE erp_empleados ADD CONSTRAINT erp_empleados_tipo_check
  CHECK (tipo = ANY (ARRAY['planilla','destajo','administrativo','operativo']));

-- erp_movimientos: ampliar tipos y categorías
ALTER TABLE erp_movimientos DROP CONSTRAINT IF EXISTS erp_movimientos_tipo_check;
ALTER TABLE erp_movimientos ADD CONSTRAINT erp_movimientos_tipo_check
  CHECK (tipo = ANY (ARRAY['ingreso','gasto','egreso']));

ALTER TABLE erp_movimientos DROP CONSTRAINT IF EXISTS erp_movimientos_categoria_check;
ALTER TABLE erp_movimientos ADD CONSTRAINT erp_movimientos_categoria_check
  CHECK (categoria = ANY (ARRAY[
    'materiales','mano_obra','equipo','subcontrato',
    'administracion','transporte','imprevistos','marketing',
    'licencias','seguros','otros'
  ]));

-- erp_eventos_calendario: compatibilizar valores
ALTER TABLE erp_eventos_calendario DROP CONSTRAINT IF EXISTS erp_eventos_calendario_tipo_check;
ALTER TABLE erp_eventos_calendario ADD CONSTRAINT erp_eventos_calendario_tipo_check
  CHECK (tipo = ANY (ARRAY['Recordatorio','Actividad','Reunión','Visita','reunion','inspeccion','entrega','pago','otros']));

-- ============================================================
-- PARTE 2: POLÍTICAS RLS UNIFICADAS
-- ============================================================

-- ----------------------------
-- PROFILES
-- ----------------------------
DROP POLICY IF EXISTS "profiles_read_self_admin_gerente" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;

CREATE POLICY "profiles_read_self_admin_gerente"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.id = auth.uid()
        AND p2.rol IN ('Administrador','Gerente')
    )
  );

CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- ----------------------------
-- ERP_PROYECTOS
-- ----------------------------
DROP POLICY IF EXISTS "erp_proyectos_select" ON erp_proyectos;
DROP POLICY IF EXISTS "erp_proyectos_insert" ON erp_proyectos;
DROP POLICY IF EXISTS "erp_proyectos_update" ON erp_proyectos;
DROP POLICY IF EXISTS "erp_proyectos_delete" ON erp_proyectos;

CREATE POLICY "erp_proyectos_select"
  ON erp_proyectos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')
    )
    OR auth.uid() = created_by
  );

CREATE POLICY "erp_proyectos_insert"
  ON erp_proyectos FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

CREATE POLICY "erp_proyectos_update"
  ON erp_proyectos FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

CREATE POLICY "erp_proyectos_delete"
  ON erp_proyectos FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente')
    )
  );

-- ----------------------------
-- ERP_MOVIMIENTOS
-- ----------------------------
DROP POLICY IF EXISTS "erp_movimientos_select" ON erp_movimientos;
DROP POLICY IF EXISTS "erp_movimientos_write" ON erp_movimientos;

CREATE POLICY "erp_movimientos_select"
  ON erp_movimientos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')
    )
    OR auth.uid() = created_by
  );

CREATE POLICY "erp_movimientos_write"
  ON erp_movimientos FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

-- ----------------------------
-- ERP_EMPLEADOS
-- ----------------------------
DROP POLICY IF EXISTS "erp_empleados_select" ON erp_empleados;
DROP POLICY IF EXISTS "erp_empleados_write" ON erp_empleados;

CREATE POLICY "erp_empleados_select"
  ON erp_empleados FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
    OR auth.uid() = created_by
  );

CREATE POLICY "erp_empleados_write"
  ON erp_empleados FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

-- ----------------------------
-- ERP_MATERIALES
-- ----------------------------
DROP POLICY IF EXISTS "erp_materiales_select" ON erp_materiales;
DROP POLICY IF EXISTS "erp_materiales_write" ON erp_materiales;

CREATE POLICY "erp_materiales_select"
  ON erp_materiales FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')
    )
    OR auth.uid() = created_by
  );

CREATE POLICY "erp_materiales_write"
  ON erp_materiales FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero')
    )
  );

-- ----------------------------
-- ERP_ORDENES_COMPRA
-- ----------------------------
DROP POLICY IF EXISTS "erp_ordenes_compra_select" ON erp_ordenes_compra;
DROP POLICY IF EXISTS "erp_ordenes_compra_write" ON erp_ordenes_compra;

CREATE POLICY "erp_ordenes_compra_select"
  ON erp_ordenes_compra FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero')
    )
    OR auth.uid() = created_by
  );

CREATE POLICY "erp_ordenes_compra_write"
  ON erp_ordenes_compra FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras')
    )
  );

-- ----------------------------
-- ERP_PROVEEDORES
-- ----------------------------
DROP POLICY IF EXISTS "erp_proveedores_select" ON erp_proveedores;
DROP POLICY IF EXISTS "erp_proveedores_write" ON erp_proveedores;

CREATE POLICY "erp_proveedores_select"
  ON erp_proveedores FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero')
    )
  );

CREATE POLICY "erp_proveedores_write"
  ON erp_proveedores FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras')
    )
  );

-- ----------------------------
-- ERP_EVENTOS_CALENDARIO
-- ----------------------------
DROP POLICY IF EXISTS "erp_eventos_calendario_select" ON erp_eventos_calendario;
DROP POLICY IF EXISTS "erp_eventos_calendario_write" ON erp_eventos_calendario;

CREATE POLICY "erp_eventos_calendario_select"
  ON erp_eventos_calendario FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
    OR auth.uid() = created_by
  );

CREATE POLICY "erp_eventos_calendario_write"
  ON erp_eventos_calendario FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

-- ----------------------------
-- ERP_BITACORA
-- ----------------------------
DROP POLICY IF EXISTS "erp_bitacora_select" ON erp_bitacora;
DROP POLICY IF EXISTS "erp_bitacora_write" ON erp_bitacora;

CREATE POLICY "erp_bitacora_select"
  ON erp_bitacora FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
    OR auth.uid() = created_by
  );

CREATE POLICY "erp_bitacora_write"
  ON erp_bitacora FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

-- ----------------------------
-- ERP_SEGUIMIENTO
-- ----------------------------
DROP POLICY IF EXISTS "erp_seguimiento_select" ON erp_seguimiento;
DROP POLICY IF EXISTS "erp_seguimiento_write" ON erp_seguimiento;

CREATE POLICY "erp_seguimiento_select"
  ON erp_seguimiento FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente')
    )
  );

CREATE POLICY "erp_seguimiento_write"
  ON erp_seguimiento FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente')
    )
  );

-- ----------------------------
-- ERP_RENGLONES / ERP_INSUMOS / ERP_SUB_RENGLONES
-- ----------------------------
DROP POLICY IF EXISTS "erp_renglones_select" ON erp_renglones;
DROP POLICY IF EXISTS "erp_renglones_write" ON erp_renglones;
DROP POLICY IF EXISTS "erp_insumos_select" ON erp_insumos;
DROP POLICY IF EXISTS "erp_insumos_write" ON erp_insumos;
DROP POLICY IF EXISTS "erp_sub_renglones_select" ON erp_sub_renglones;
DROP POLICY IF EXISTS "erp_sub_renglones_write" ON erp_sub_renglones;

CREATE POLICY "erp_renglones_select"
  ON erp_renglones FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
    OR auth.uid() = created_by
  );

CREATE POLICY "erp_renglones_write"
  ON erp_renglones FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

CREATE POLICY "erp_insumos_select"
  ON erp_insumos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')
    )
  );

CREATE POLICY "erp_insumos_write"
  ON erp_insumos FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

CREATE POLICY "erp_sub_renglones_select"
  ON erp_sub_renglones FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')
    )
  );

CREATE POLICY "erp_sub_renglones_write"
  ON erp_sub_renglones FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

-- ----------------------------
-- ERP_PRESUPUESTOS
-- ----------------------------
DROP POLICY IF EXISTS "erp_presupuestos_select" ON erp_presupuestos;
DROP POLICY IF EXISTS "erp_presupuestos_write" ON erp_presupuestos;

CREATE POLICY "erp_presupuestos_select"
  ON erp_presupuestos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')
    )
  );

CREATE POLICY "erp_presupuestos_write"
  ON erp_presupuestos FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

-- ----------------------------
-- LOGS_SISTEMA
-- ----------------------------
DROP POLICY IF EXISTS "logs_sistema_select" ON logs_sistema;
DROP POLICY IF EXISTS "logs_sistema_insert" ON logs_sistema;

CREATE POLICY "logs_sistema_select"
  ON logs_sistema FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente')
    )
  );

CREATE POLICY "logs_sistema_insert"
  ON logs_sistema FOR INSERT TO authenticated
  WITH CHECK (true);

-- ----------------------------
-- ERP_AUDITORIA
-- ----------------------------
DROP POLICY IF EXISTS "erp_auditoria_select" ON public.erp_auditoria;
DROP POLICY IF EXISTS "erp_auditoria_insert" ON public.erp_auditoria;

CREATE POLICY "erp_auditoria_select"
  ON public.erp_auditoria FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente')
    )
  );

CREATE POLICY "erp_auditoria_insert"
  ON public.erp_auditoria FOR INSERT TO authenticated
  WITH CHECK (true);

-- ----------------------------
-- DESTAJOS
-- ----------------------------
DROP POLICY IF EXISTS "destajos_select" ON destajos;
DROP POLICY IF EXISTS "destajos_write" ON destajos;

CREATE POLICY "destajos_select"
  ON destajos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
    OR auth.uid() = registrado_por
  );

CREATE POLICY "destajos_write"
  ON destajos FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

-- ----------------------------
-- CAJAS_CHICAS
-- ----------------------------
DROP POLICY IF EXISTS "cajas_chicas_select" ON cajas_chicas;
DROP POLICY IF EXISTS "cajas_chicas_write" ON cajas_chicas;

CREATE POLICY "cajas_chicas_select"
  ON cajas_chicas FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero','Residente')
    )
  );

CREATE POLICY "cajas_chicas_write"
  ON cajas_chicas FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras','Residente')
    )
  );

-- ----------------------------
-- ACTIVOS_HERRAMIENTAS
-- ----------------------------
DROP POLICY IF EXISTS "activos_herramientas_select" ON activos_herramientas;
DROP POLICY IF EXISTS "activos_herramientas_write" ON activos_herramientas;

CREATE POLICY "activos_herramientas_select"
  ON activos_herramientas FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero','Residente')
    )
  );

CREATE POLICY "activos_herramientas_write"
  ON activos_herramientas FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero')
    )
  );

-- ----------------------------
-- CUADRO_COMPARATIVO_PROVEEDORES
-- ----------------------------
DROP POLICY IF EXISTS "cuadro_comparativo_select" ON cuadro_comparativo_proveedores;
DROP POLICY IF EXISTS "cuadro_comparativo_write" ON cuadro_comparativo_proveedores;

CREATE POLICY "cuadro_comparativo_select"
  ON cuadro_comparativo_proveedores FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras')
    )
    OR auth.uid() = created_by
  );

CREATE POLICY "cuadro_comparativo_write"
  ON cuadro_comparativo_proveedores FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras')
    )
  );

-- ----------------------------
-- COTIZACIONES
-- ----------------------------
DROP POLICY IF EXISTS "cotizaciones_select" ON cotizaciones;
DROP POLICY IF EXISTS "cotizaciones_write" ON cotizaciones;

CREATE POLICY "cotizaciones_select"
  ON cotizaciones FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras')
    )
  );

CREATE POLICY "cotizaciones_write"
  ON cotizaciones FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras')
    )
  );

-- ----------------------------
-- ANTICIPOS
-- ----------------------------
DROP POLICY IF EXISTS "anticipos_select" ON anticipos;
DROP POLICY IF EXISTS "anticipos_write" ON anticipos;

CREATE POLICY "anticipos_select"
  ON anticipos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente')
    )
    OR auth.uid() = created_by
  );

CREATE POLICY "anticipos_write"
  ON anticipos FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente')
    )
  );

-- ----------------------------
-- AMORTIZACIONES
-- ----------------------------
DROP POLICY IF EXISTS "amortizaciones_select" ON amortizaciones;
DROP POLICY IF EXISTS "amortizaciones_write" ON amortizaciones;

CREATE POLICY "amortizaciones_select"
  ON amortizaciones FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente')
    )
    OR EXISTS (
      SELECT 1 FROM anticipos a
      WHERE a.id = amortizaciones.anticipo_id
        AND a.created_by = auth.uid()
    )
  );

CREATE POLICY "amortizaciones_write"
  ON amortizaciones FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente')
    )
  );

-- ----------------------------
-- PAGOS_PROVEEDORES
-- ----------------------------
DROP POLICY IF EXISTS "pagos_proveedores_select" ON pagos_proveedores;
DROP POLICY IF EXISTS "pagos_proveedores_write" ON pagos_proveedores;

CREATE POLICY "pagos_proveedores_select"
  ON pagos_proveedores FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras')
    )
  );

CREATE POLICY "pagos_proveedores_write"
  ON pagos_proveedores FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras')
    )
  );

-- ----------------------------
-- VENTAS_PAQUETES
-- ----------------------------
DROP POLICY IF EXISTS "ventas_paquetes_select" ON ventas_paquetes;
DROP POLICY IF EXISTS "ventas_paquetes_write" ON ventas_paquetes;

CREATE POLICY "ventas_paquetes_select"
  ON ventas_paquetes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras','Residente','Bodeguero')
    )
  );

CREATE POLICY "ventas_paquetes_write"
  ON ventas_paquetes FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras','Residente')
    )
  );

-- ----------------------------
-- CENTROS_COSTO
-- ----------------------------
DROP POLICY IF EXISTS "centros_costo_select" ON centros_costo;
DROP POLICY IF EXISTS "centros_costo_write" ON centros_costo;

CREATE POLICY "centros_costo_select"
  ON centros_costo FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')
    )
  );

CREATE POLICY "centros_costo_write"
  ON centros_costo FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente','Compras')
    )
  );

-- ----------------------------
-- ERP_INSUMOS_BASE
-- ----------------------------
DROP POLICY IF EXISTS "erp_insumos_base_select" ON erp_insumos_base;
DROP POLICY IF EXISTS "erp_insumos_base_write" ON erp_insumos_base;

CREATE POLICY "erp_insumos_base_select"
  ON erp_insumos_base FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')
    )
  );

CREATE POLICY "erp_insumos_base_write"
  ON erp_insumos_base FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras')
    )
  );

-- ----------------------------
-- ERP_RENDIMIENTOS_CUADRILLA
-- ----------------------------
DROP POLICY IF EXISTS "erp_rendimientos_cuadrilla_select" ON erp_rendimientos_cuadrilla;
DROP POLICY IF EXISTS "erp_rendimientos_cuadrilla_write" ON erp_rendimientos_cuadrilla;

CREATE POLICY "erp_rendimientos_cuadrilla_select"
  ON erp_rendimientos_cuadrilla FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')
    )
  );

CREATE POLICY "erp_rendimientos_cuadrilla_write"
  ON erp_rendimientos_cuadrilla FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras')
    )
  );

-- ----------------------------
-- ERP_VALES_SALIDA
-- ----------------------------
DROP POLICY IF EXISTS "erp_vales_salida_select" ON erp_vales_salida;
DROP POLICY IF EXISTS "erp_vales_salida_write" ON erp_vales_salida;

CREATE POLICY "erp_vales_salida_select"
  ON erp_vales_salida FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')
    )
    OR auth.uid() = created_by
  );

CREATE POLICY "erp_vales_salida_write"
  ON erp_vales_salida FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')
    )
  );
