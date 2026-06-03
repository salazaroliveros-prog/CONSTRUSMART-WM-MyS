-- CONSTRUSMART ERP - Políticas RLS granulares por rol
-- Depende de: supabase/migrations/202606030001_rls_complete_coverage.sql
-- Ejecutar después de crear tablas y antes de usar la app en producción.

-- Helpers
-- Un rol puede ser: Administrador, Gerente, Residente, Compras, Bodeguero, usuario
-- Usamos el campo rol de public.profiles.

-- ============================================================
-- PROFILES
-- ============================================================
DROP POLICY IF EXISTS "profiles_read_self_admin_gerente" ON public.profiles;
CREATE POLICY "profiles_read_self_admin_gerente"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.id = auth.uid() AND p2.rol IN ('Administrador','Gerente')
    )
  );

DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- ============================================================
-- ERP_PROYECTOS
-- ============================================================
DROP POLICY IF EXISTS "erp_proyectos_select" ON erp_proyectos;
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

DROP POLICY IF EXISTS "erp_proyectos_insert" ON erp_proyectos;
CREATE POLICY "erp_proyectos_insert"
  ON erp_proyectos FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

DROP POLICY IF EXISTS "erp_proyectos_update" ON erp_proyectos;
CREATE POLICY "erp_proyectos_update"
  ON erp_proyectos FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

DROP POLICY IF EXISTS "erp_proyectos_delete" ON erp_proyectos;
CREATE POLICY "erp_proyectos_delete"
  ON erp_proyectos FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente')
    )
  );

-- ============================================================
-- ERP_MOVIMIENTOS
-- ============================================================
DROP POLICY IF EXISTS "erp_movimientos_select" ON erp_movimientos;
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

DROP POLICY IF EXISTS "erp_movimientos_write" ON erp_movimientos;
CREATE POLICY "erp_movimientos_write"
  ON erp_movimientos FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

-- ============================================================
-- ERP_EMPLEADOS
-- ============================================================
DROP POLICY IF EXISTS "erp_empleados_select" ON erp_empleados;
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

DROP POLICY IF EXISTS "erp_empleados_write" ON erp_empleados;
CREATE POLICY "erp_empleados_write"
  ON erp_empleados FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

-- ============================================================
-- ERP_MATERIALES
-- ============================================================
DROP POLICY IF EXISTS "erp_materiales_select" ON erp_materiales;
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

DROP POLICY IF EXISTS "erp_materiales_write" ON erp_materiales;
CREATE POLICY "erp_materiales_write"
  ON erp_materiales FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero')
    )
  );

-- ============================================================
-- ERP_ORDENES_COMPRA
-- ============================================================
DROP POLICY IF EXISTS "erp_ordenes_compra_select" ON erp_ordenes_compra;
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

DROP POLICY IF EXISTS "erp_ordenes_compra_write" ON erp_ordenes_compra;
CREATE POLICY "erp_ordenes_compra_write"
  ON erp_ordenes_compra FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras')
    )
  );

-- ============================================================
-- ERP_PROVEEDORES
-- ============================================================
DROP POLICY IF EXISTS "erp_proveedores_select" ON erp_proveedores;
CREATE POLICY "erp_proveedores_select"
  ON erp_proveedores FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero')
    )
  );

DROP POLICY IF EXISTS "erp_proveedores_write" ON erp_proveedores;
CREATE POLICY "erp_proveedores_write"
  ON erp_proveedores FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras')
    )
  );

-- ============================================================
-- ERP_EVENTOS_CALENDARIO
-- ============================================================
DROP POLICY IF EXISTS "erp_eventos_calendario_select" ON erp_eventos_calendario;
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

DROP POLICY IF EXISTS "erp_eventos_calendario_write" ON erp_eventos_calendario;
CREATE POLICY "erp_eventos_calendario_write"
  ON erp_eventos_calendario FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

-- ============================================================
-- ERP_BITACORA
-- ============================================================
DROP POLICY IF EXISTS "erp_bitacora_select" ON erp_bitacora;
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

DROP POLICY IF EXISTS "erp_bitacora_write" ON erp_bitacora;
CREATE POLICY "erp_bitacora_write"
  ON erp_bitacora FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

-- ============================================================
-- ERP_SEGUIMIENTO
-- ============================================================
DROP POLICY IF EXISTS "erp_seguimiento_select" ON erp_seguimiento;
CREATE POLICY "erp_seguimiento_select"
  ON erp_seguimiento FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente')
    )
  );

DROP POLICY IF EXISTS "erp_seguimiento_write" ON erp_seguimiento;
CREATE POLICY "erp_seguimiento_write"
  ON erp_seguimiento FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente')
    )
  );

-- ============================================================
-- ERP_RENGLONES / ERP_INSUMOS / ERP_SUB_RENGLONES
-- ============================================================
DROP POLICY IF EXISTS "erp_renglones_select" ON erp_renglones;
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

DROP POLICY IF EXISTS "erp_renglones_write" ON erp_renglones;
CREATE POLICY "erp_renglones_write"
  ON erp_renglones FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

DROP POLICY IF EXISTS "erp_insumos_select" ON erp_insumos;
CREATE POLICY "erp_insumos_select"
  ON erp_insumos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')
    )
  );

DROP POLICY IF EXISTS "erp_insumos_write" ON erp_insumos;
CREATE POLICY "erp_insumos_write"
  ON erp_insumos FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

DROP POLICY IF EXISTS "erp_sub_renglones_select" ON erp_sub_renglones;
CREATE POLICY "erp_sub_renglones_select"
  ON erp_sub_renglones FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')
    )
  );

DROP POLICY IF EXISTS "erp_sub_renglones_write" ON erp_sub_renglones;
CREATE POLICY "erp_sub_renglones_write"
  ON erp_sub_renglones FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

-- ============================================================
-- ERP_PRESUPUESTOS
-- ============================================================
DROP POLICY IF EXISTS "erp_presupuestos_select" ON erp_presupuestos;
CREATE POLICY "erp_presupuestos_select"
  ON erp_presupuestos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')
    )
  );

DROP POLICY IF EXISTS "erp_presupuestos_write" ON erp_presupuestos;
CREATE POLICY "erp_presupuestos_write"
  ON erp_presupuestos FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

-- ============================================================
-- LOGS_SISTEMA
-- ============================================================
DROP POLICY IF EXISTS "logs_sistema_select" ON logs_sistema;
CREATE POLICY "logs_sistema_select"
  ON logs_sistema FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente')
    )
  );

DROP POLICY IF EXISTS "logs_sistema_insert" ON logs_sistema;
CREATE POLICY "logs_sistema_insert"
  ON logs_sistema FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================
-- ERP_AUDITORIA
-- ============================================================
DROP POLICY IF EXISTS "erp_auditoria_select" ON public.erp_auditoria;
CREATE POLICY "erp_auditoria_select"
  ON public.erp_auditoria FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente')
    )
  );

-- ============================================================
-- DESTAJOS / CAJAS_CHICAS / ACTIVOS_HERRAMIENTAS
-- ============================================================
DROP POLICY IF EXISTS "destajos_select" ON destajos;
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

DROP POLICY IF EXISTS "destajos_write" ON destajos;
CREATE POLICY "destajos_write"
  ON destajos FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente')
    )
  );

DROP POLICY IF EXISTS "cajas_chicas_select" ON cajas_chicas;
CREATE POLICY "cajas_chicas_select"
  ON cajas_chicas FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero','Residente')
    )
  );

DROP POLICY IF EXISTS "cajas_chicas_write" ON cajas_chicas;
CREATE POLICY "cajas_chicas_write"
  ON cajas_chicas FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras','Residente')
    )
  );

DROP POLICY IF EXISTS "activos_herramientas_select" ON activos_herramientas;
CREATE POLICY "activos_herramientas_select"
  ON activos_herramientas FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero','Residente')
    )
  );

DROP POLICY IF EXISTS "activos_herramientas_write" ON activos_herramientas;
CREATE POLICY "activos_herramientas_write"
  ON activos_herramientas FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero')
    )
  );

-- ============================================================
-- CUADRO_COMPARATIVO_PROVEEDORES / COTIZACIONES
-- ============================================================
DROP POLICY IF EXISTS "cuadro_comparativo_select" ON cuadro_comparativo_proveedores;
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

DROP POLICY IF EXISTS "cuadro_comparativo_write" ON cuadro_comparativo_proveedores;
CREATE POLICY "cuadro_comparativo_write"
  ON cuadro_comparativo_proveedores FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras')
    )
  );

DROP POLICY IF EXISTS "cotizaciones_select" ON cotizaciones;
CREATE POLICY "cotizaciones_select"
  ON cotizaciones FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras')
    )
  );

DROP POLICY IF EXISTS "cotizaciones_write" ON cotizaciones;
CREATE POLICY "cotizaciones_write"
  ON cotizaciones FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras')
    )
  );

-- ============================================================
-- ANTICIPOS / AMORTIZACIONES
-- ============================================================
DROP POLICY IF EXISTS "anticipos_select" ON anticipos;
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

DROP POLICY IF EXISTS "anticipos_write" ON anticipos;
CREATE POLICY "anticipos_write"
  ON anticipos FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente')
    )
  );

DROP POLICY IF EXISTS "amortizaciones_select" ON amortizaciones;
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

DROP POLICY IF EXISTS "amortizaciones_write" ON amortizaciones;
CREATE POLICY "amortizaciones_write"
  ON amortizaciones FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente')
    )
  );

-- ============================================================
-- PAGOS_PROVEEDORES / VENTAS_PAQUETES / CENTROS_COSTO
-- ============================================================
DROP POLICY IF EXISTS "pagos_proveedores_select" ON pagos_proveedores;
CREATE POLICY "pagos_proveedores_select"
  ON pagos_proveedores FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras')
    )
  );

DROP POLICY IF EXISTS "pagos_proveedores_write" ON pagos_proveedores;
CREATE POLICY "pagos_proveedores_write"
  ON pagos_proveedores FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras')
    )
  );

DROP POLICY IF EXISTS "ventas_paquetes_select" ON ventas_paquetes;
CREATE POLICY "ventas_paquetes_select"
  ON ventas_paquetes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras','Residente','Bodeguero')
    )
  );

DROP POLICY IF EXISTS "ventas_paquetes_write" ON ventas_paquetes;
CREATE POLICY "ventas_paquetes_write"
  ON ventas_paquetes FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras','Residente')
    )
  );

DROP POLICY IF EXISTS "centros_costo_select" ON centros_costo;
CREATE POLICY "centros_costo_select"
  ON centros_costo FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')
    )
  );

DROP POLICY IF EXISTS "centros_costo_write" ON centros_costo;
CREATE POLICY "centros_costo_write"
  ON centros_costo FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente','Compras')
    )
  );

-- ============================================================
-- INSUMOS_BASE / RENDIMIENTOS_CUADRILLA / VALES_SALIDA
-- ============================================================
DROP POLICY IF EXISTS "erp_insumos_base_select" ON erp_insumos_base;
CREATE POLICY "erp_insumos_base_select"
  ON erp_insumos_base FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')
    )
  );

DROP POLICY IF EXISTS "erp_insumos_base_write" ON erp_insumos_base;
CREATE POLICY "erp_insumos_base_write"
  ON erp_insumos_base FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras')
    )
  );

DROP POLICY IF EXISTS "erp_rendimientos_cuadrilla_select" ON erp_rendimientos_cuadrilla;
CREATE POLICY "erp_rendimientos_cuadrilla_select"
  ON erp_rendimientos_cuadrilla FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')
    )
  );

DROP POLICY IF EXISTS "erp_rendimientos_cuadrilla_write" ON erp_rendimientos_cuadrilla;
CREATE POLICY "erp_rendimientos_cuadrilla_write"
  ON erp_rendimientos_cuadrilla FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Compras')
    )
  );

DROP POLICY IF EXISTS "erp_vales_salida_select" ON erp_vales_salida;
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

DROP POLICY IF EXISTS "erp_vales_salida_write" ON erp_vales_salida;
CREATE POLICY "erp_vales_salida_write"
  ON erp_vales_salida FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')
    )
  );
