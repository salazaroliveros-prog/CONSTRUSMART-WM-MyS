-- ============================================================
-- CONSTRUSMART ERP - Fix RLS Recursion (Error 500 en todas las tablas)
-- Generado: 2026-06-03
--
-- CAUSA RAÍZ:
-- Las políticas RLS en cada tabla usan subconsultas a profiles,
-- y profiles tiene políticas que también consultan profiles.
-- Esto crea RECURSIÓN INFINITA → Error 500 en todas las consultas.
--
-- SOLUCIÓN:
-- 1) Desactivar RLS en profiles (la tabla base de roles)
-- 2) Simplificar políticas para evitar subconsultas recursivas
-- 3) Usar auth.jwt() para obtener el rol directamente
-- ============================================================

-- ============================================================
-- PASO 1: Eliminar TODAS las políticas existentes que causan recursión
-- ============================================================

-- Primero eliminar políticas de profiles (son las que causan la recursión)
DROP POLICY IF EXISTS "profiles_read_self_admin_gerente" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;

-- Eliminar políticas de tablas del ERP
DROP POLICY IF EXISTS "erp_proyectos_select" ON erp_proyectos;
DROP POLICY IF EXISTS "erp_proyectos_insert" ON erp_proyectos;
DROP POLICY IF EXISTS "erp_proyectos_update" ON erp_proyectos;
DROP POLICY IF EXISTS "erp_proyectos_delete" ON erp_proyectos;

DROP POLICY IF EXISTS "erp_movimientos_select" ON erp_movimientos;
DROP POLICY IF EXISTS "erp_movimientos_write" ON erp_movimientos;

DROP POLICY IF EXISTS "erp_empleados_select" ON erp_empleados;
DROP POLICY IF EXISTS "erp_empleados_write" ON erp_empleados;

DROP POLICY IF EXISTS "erp_materiales_select" ON erp_materiales;
DROP POLICY IF EXISTS "erp_materiales_write" ON erp_materiales;

DROP POLICY IF EXISTS "erp_ordenes_compra_select" ON erp_ordenes_compra;
DROP POLICY IF EXISTS "erp_ordenes_compra_write" ON erp_ordenes_compra;

DROP POLICY IF EXISTS "erp_proveedores_select" ON erp_proveedores;
DROP POLICY IF EXISTS "erp_proveedores_write" ON erp_proveedores;

DROP POLICY IF EXISTS "erp_eventos_calendario_select" ON erp_eventos_calendario;
DROP POLICY IF EXISTS "erp_eventos_calendario_write" ON erp_eventos_calendario;

DROP POLICY IF EXISTS "erp_bitacora_select" ON erp_bitacora;
DROP POLICY IF EXISTS "erp_bitacora_write" ON erp_bitacora;

DROP POLICY IF EXISTS "erp_seguimiento_select" ON erp_seguimiento;
DROP POLICY IF EXISTS "erp_seguimiento_write" ON erp_seguimiento;

DROP POLICY IF EXISTS "erp_renglones_select" ON erp_renglones;
DROP POLICY IF EXISTS "erp_renglones_write" ON erp_renglones;

DROP POLICY IF EXISTS "erp_insumos_select" ON erp_insumos;
DROP POLICY IF EXISTS "erp_insumos_write" ON erp_insumos;

DROP POLICY IF EXISTS "erp_sub_renglones_select" ON erp_sub_renglones;
DROP POLICY IF EXISTS "erp_sub_renglones_write" ON erp_sub_renglones;

DROP POLICY IF EXISTS "erp_presupuestos_select" ON erp_presupuestos;
DROP POLICY IF EXISTS "erp_presupuestos_write" ON erp_presupuestos;

DROP POLICY IF EXISTS "logs_sistema_select" ON logs_sistema;
DROP POLICY IF EXISTS "logs_sistema_insert" ON logs_sistema;

DROP POLICY IF EXISTS "erp_auditoria_select" ON public.erp_auditoria;

DROP POLICY IF EXISTS "destajos_select" ON destajos;
DROP POLICY IF EXISTS "destajos_write" ON destajos;

DROP POLICY IF EXISTS "cajas_chicas_select" ON cajas_chicas;
DROP POLICY IF EXISTS "cajas_chicas_write" ON cajas_chicas;

DROP POLICY IF EXISTS "activos_herramientas_select" ON activos_herramientas;
DROP POLICY IF EXISTS "activos_herramientas_write" ON activos_herramientas;

DROP POLICY IF EXISTS "cuadro_comparativo_select" ON cuadro_comparativo_proveedores;
DROP POLICY IF EXISTS "cuadro_comparativo_write" ON cuadro_comparativo_proveedores;

DROP POLICY IF EXISTS "cotizaciones_select" ON cotizaciones;
DROP POLICY IF EXISTS "cotizaciones_write" ON cotizaciones;

DROP POLICY IF EXISTS "anticipos_select" ON anticipos;
DROP POLICY IF EXISTS "anticipos_write" ON anticipos;

DROP POLICY IF EXISTS "amortizaciones_select" ON amortizaciones;
DROP POLICY IF EXISTS "amortizaciones_write" ON amortizaciones;

DROP POLICY IF EXISTS "pagos_proveedores_select" ON pagos_proveedores;
DROP POLICY IF EXISTS "pagos_proveedores_write" ON pagos_proveedores;

DROP POLICY IF EXISTS "ventas_paquetes_select" ON ventas_paquetes;
DROP POLICY IF EXISTS "ventas_paquetes_write" ON ventas_paquetes;

DROP POLICY IF EXISTS "centros_costo_select" ON centros_costo;
DROP POLICY IF EXISTS "centros_costo_write" ON centros_costo;

DROP POLICY IF EXISTS "erp_insumos_base_select" ON erp_insumos_base;
DROP POLICY IF EXISTS "erp_insumos_base_write" ON erp_insumos_base;

DROP POLICY IF EXISTS "erp_rendimientos_cuadrilla_select" ON erp_rendimientos_cuadrilla;
DROP POLICY IF EXISTS "erp_rendimientos_cuadrilla_write" ON erp_rendimientos_cuadrilla;

DROP POLICY IF EXISTS "erp_vales_salida_select" ON erp_vales_salida;
DROP POLICY IF EXISTS "erp_vales_salida_write" ON erp_vales_salida;

-- Políticas de erp_avances
DROP POLICY IF EXISTS "erp_avances_select" ON erp_avances;
DROP POLICY IF EXISTS "erp_avances_insert" ON erp_avances;
DROP POLICY IF EXISTS "erp_avances_delete" ON erp_avances;

-- Políticas de erp_licitaciones
DROP POLICY IF EXISTS "erp_licitaciones_select" ON erp_licitaciones;
DROP POLICY IF EXISTS "erp_licitaciones_insert" ON erp_licitaciones;
DROP POLICY IF EXISTS "erp_licitaciones_update" ON erp_licitaciones;
DROP POLICY IF EXISTS "erp_licitaciones_delete" ON erp_licitaciones;

-- ============================================================
-- PASO 2: Crear una función helper que NO tenga RLS
-- Esta función SECURITY DEFINER puede leer profiles sin disparar recursión
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT rol FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- PASO 3: Políticas SIMPLES en profiles (sin auto-referencia)
-- ============================================================

-- Los usuarios pueden leer su propio perfil
CREATE POLICY "profiles_select_self"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Cualquier usuario autenticado puede insertar su perfil
CREATE POLICY "profiles_insert_self"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- PASO 4: Políticas en tablas del ERP usando la función helper
-- (Evita subconsultas directas a profiles que causan recursión)
-- ============================================================

-- ERP_PROYECTOS
CREATE POLICY "erp_proyectos_select"
  ON erp_proyectos FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "erp_proyectos_insert"
  ON erp_proyectos FOR INSERT TO authenticated
  WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));

CREATE POLICY "erp_proyectos_update"
  ON erp_proyectos FOR UPDATE TO authenticated
  USING (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));

CREATE POLICY "erp_proyectos_delete"
  ON erp_proyectos FOR DELETE TO authenticated
  USING (public.get_current_user_role() IN ('Administrador','Gerente'));

-- ERP_MOVIMIENTOS
CREATE POLICY "erp_movimientos_select"
  ON erp_movimientos FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "erp_movimientos_write"
  ON erp_movimientos FOR INSERT TO authenticated
  WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));

CREATE POLICY "erp_movimientos_update"
  ON erp_movimientos FOR UPDATE TO authenticated
  USING (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));

CREATE POLICY "erp_movimientos_delete"
  ON erp_movimientos FOR DELETE TO authenticated
  USING (public.get_current_user_role() IN ('Administrador','Gerente'));

-- ERP_EMPLEADOS
CREATE POLICY "erp_empleados_select"
  ON erp_empleados FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "erp_empleados_write"
  ON erp_empleados FOR INSERT TO authenticated
  WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));

CREATE POLICY "erp_empleados_update"
  ON erp_empleados FOR UPDATE TO authenticated
  USING (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));

CREATE POLICY "erp_empleados_delete"
  ON erp_empleados FOR DELETE TO authenticated
  USING (public.get_current_user_role() IN ('Administrador','Gerente'));

-- ERP_MATERIALES
CREATE POLICY "erp_materiales_select"
  ON erp_materiales FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "erp_materiales_insert"
  ON erp_materiales FOR INSERT TO authenticated
  WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Compras','Bodeguero'));

CREATE POLICY "erp_materiales_update"
  ON erp_materiales FOR UPDATE TO authenticated
  USING (public.get_current_user_role() IN ('Administrador','Gerente','Compras','Bodeguero'));

CREATE POLICY "erp_materiales_delete"
  ON erp_materiales FOR DELETE TO authenticated
  USING (public.get_current_user_role() IN ('Administrador','Gerente'));

-- ERP_ORDENES_COMPRA
CREATE POLICY "erp_ordenes_compra_select"
  ON erp_ordenes_compra FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "erp_ordenes_compra_insert"
  ON erp_ordenes_compra FOR INSERT TO authenticated
  WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Compras'));

CREATE POLICY "erp_ordenes_compra_update"
  ON erp_ordenes_compra FOR UPDATE TO authenticated
  USING (public.get_current_user_role() IN ('Administrador','Gerente','Compras'));

CREATE POLICY "erp_ordenes_compra_delete"
  ON erp_ordenes_compra FOR DELETE TO authenticated
  USING (public.get_current_user_role() IN ('Administrador','Gerente'));

-- ERP_PROVEEDORES
CREATE POLICY "erp_proveedores_select"
  ON erp_proveedores FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "erp_proveedores_insert"
  ON erp_proveedores FOR INSERT TO authenticated
  WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Compras'));

CREATE POLICY "erp_proveedores_update"
  ON erp_proveedores FOR UPDATE TO authenticated
  USING (public.get_current_user_role() IN ('Administrador','Gerente','Compras'));

CREATE POLICY "erp_proveedores_delete"
  ON erp_proveedores FOR DELETE TO authenticated
  USING (public.get_current_user_role() IN ('Administrador','Gerente'));

-- ERP_EVENTOS_CALENDARIO / ERP_BITACORA / ERP_SEGUIMIENTO
CREATE POLICY "erp_eventos_calendario_select" ON erp_eventos_calendario FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_eventos_calendario_insert" ON erp_eventos_calendario FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));
CREATE POLICY "erp_eventos_calendario_update" ON erp_eventos_calendario FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));
CREATE POLICY "erp_eventos_calendario_delete" ON erp_eventos_calendario FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

CREATE POLICY "erp_bitacora_select" ON erp_bitacora FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_bitacora_insert" ON erp_bitacora FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));
CREATE POLICY "erp_bitacora_update" ON erp_bitacora FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));
CREATE POLICY "erp_bitacora_delete" ON erp_bitacora FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

CREATE POLICY "erp_seguimiento_select" ON erp_seguimiento FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_seguimiento_insert" ON erp_seguimiento FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente'));
CREATE POLICY "erp_seguimiento_update" ON erp_seguimiento FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));
CREATE POLICY "erp_seguimiento_delete" ON erp_seguimiento FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

-- RENGLONES / INSUMOS / SUB_RENGLONES / PRESUPUESTOS
CREATE POLICY "erp_renglones_select" ON erp_renglones FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_renglones_insert" ON erp_renglones FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));
CREATE POLICY "erp_renglones_update" ON erp_renglones FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));
CREATE POLICY "erp_renglones_delete" ON erp_renglones FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

CREATE POLICY "erp_insumos_select" ON erp_insumos FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_insumos_insert" ON erp_insumos FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));
CREATE POLICY "erp_insumos_update" ON erp_insumos FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));
CREATE POLICY "erp_insumos_delete" ON erp_insumos FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

CREATE POLICY "erp_sub_renglones_select" ON erp_sub_renglones FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_sub_renglones_insert" ON erp_sub_renglones FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));
CREATE POLICY "erp_sub_renglones_update" ON erp_sub_renglones FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));
CREATE POLICY "erp_sub_renglones_delete" ON erp_sub_renglones FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

CREATE POLICY "erp_presupuestos_select" ON erp_presupuestos FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_presupuestos_insert" ON erp_presupuestos FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));
CREATE POLICY "erp_presupuestos_update" ON erp_presupuestos FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));
CREATE POLICY "erp_presupuestos_delete" ON erp_presupuestos FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

-- LOGS / AUDITORIA
CREATE POLICY "logs_sistema_select" ON logs_sistema FOR SELECT TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));
CREATE POLICY "logs_sistema_insert" ON logs_sistema FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "erp_auditoria_select" ON public.erp_auditoria FOR SELECT TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

-- DESTAJOS
CREATE POLICY "destajos_select" ON destajos FOR SELECT TO authenticated USING (true);
CREATE POLICY "destajos_insert" ON destajos FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));
CREATE POLICY "destajos_update" ON destajos FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));
CREATE POLICY "destajos_delete" ON destajos FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

-- CAJAS_CHICAS
CREATE POLICY "cajas_chicas_select" ON cajas_chicas FOR SELECT TO authenticated USING (true);
CREATE POLICY "cajas_chicas_insert" ON cajas_chicas FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Compras','Residente'));
CREATE POLICY "cajas_chicas_update" ON cajas_chicas FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente','Compras','Residente'));
CREATE POLICY "cajas_chicas_delete" ON cajas_chicas FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

-- ACTIVOS_HERRAMIENTAS
CREATE POLICY "activos_herramientas_select" ON activos_herramientas FOR SELECT TO authenticated USING (true);
CREATE POLICY "activos_herramientas_insert" ON activos_herramientas FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Compras','Bodeguero'));
CREATE POLICY "activos_herramientas_update" ON activos_herramientas FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente','Compras','Bodeguero'));
CREATE POLICY "activos_herramientas_delete" ON activos_herramientas FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

-- CUADRO_COMPARATIVO / COTIZACIONES
CREATE POLICY "cuadro_comparativo_select" ON cuadro_comparativo_proveedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "cuadro_comparativo_insert" ON cuadro_comparativo_proveedores FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Compras'));
CREATE POLICY "cuadro_comparativo_update" ON cuadro_comparativo_proveedores FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente','Compras'));
CREATE POLICY "cuadro_comparativo_delete" ON cuadro_comparativo_proveedores FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

CREATE POLICY "cotizaciones_select" ON cotizaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "cotizaciones_insert" ON cotizaciones FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Compras'));
CREATE POLICY "cotizaciones_update" ON cotizaciones FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente','Compras'));
CREATE POLICY "cotizaciones_delete" ON cotizaciones FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

-- ANTICIPOS / AMORTIZACIONES
CREATE POLICY "anticipos_select" ON anticipos FOR SELECT TO authenticated USING (true);
CREATE POLICY "anticipos_insert" ON anticipos FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente'));
CREATE POLICY "anticipos_update" ON anticipos FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));
CREATE POLICY "anticipos_delete" ON anticipos FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

CREATE POLICY "amortizaciones_select" ON amortizaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "amortizaciones_insert" ON amortizaciones FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente'));
CREATE POLICY "amortizaciones_update" ON amortizaciones FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));
CREATE POLICY "amortizaciones_delete" ON amortizaciones FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

-- PAGOS_PROVEEDORES / VENTAS_PAQUETES / CENTROS_COSTO
CREATE POLICY "pagos_proveedores_select" ON pagos_proveedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "pagos_proveedores_insert" ON pagos_proveedores FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Compras'));
CREATE POLICY "pagos_proveedores_update" ON pagos_proveedores FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente','Compras'));
CREATE POLICY "pagos_proveedores_delete" ON pagos_proveedores FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

CREATE POLICY "ventas_paquetes_select" ON ventas_paquetes FOR SELECT TO authenticated USING (true);
CREATE POLICY "ventas_paquetes_insert" ON ventas_paquetes FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Compras','Residente'));
CREATE POLICY "ventas_paquetes_update" ON ventas_paquetes FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente','Compras','Residente'));
CREATE POLICY "ventas_paquetes_delete" ON ventas_paquetes FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

CREATE POLICY "centros_costo_select" ON centros_costo FOR SELECT TO authenticated USING (true);
CREATE POLICY "centros_costo_insert" ON centros_costo FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Residente','Compras'));
CREATE POLICY "centros_costo_update" ON centros_costo FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente','Residente','Compras'));
CREATE POLICY "centros_costo_delete" ON centros_costo FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

-- INSUMOS_BASE / RENDIMIENTOS_CUADRILLA / VALES_SALIDA
CREATE POLICY "erp_insumos_base_select" ON erp_insumos_base FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_insumos_base_insert" ON erp_insumos_base FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Compras'));
CREATE POLICY "erp_insumos_base_update" ON erp_insumos_base FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente','Compras'));
CREATE POLICY "erp_insumos_base_delete" ON erp_insumos_base FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

CREATE POLICY "erp_rendimientos_cuadrilla_select" ON erp_rendimientos_cuadrilla FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_rendimientos_cuadrilla_insert" ON erp_rendimientos_cuadrilla FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Compras'));
CREATE POLICY "erp_rendimientos_cuadrilla_update" ON erp_rendimientos_cuadrilla FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente','Compras'));
CREATE POLICY "erp_rendimientos_cuadrilla_delete" ON erp_rendimientos_cuadrilla FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

CREATE POLICY "erp_vales_salida_select" ON erp_vales_salida FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_vales_salida_insert" ON erp_vales_salida FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Residente','Compras','Bodeguero'));
CREATE POLICY "erp_vales_salida_update" ON erp_vales_salida FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente','Residente','Compras','Bodeguero'));
CREATE POLICY "erp_vales_salida_delete" ON erp_vales_salida FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

-- ERP_AVANCES
CREATE POLICY "erp_avances_select" ON erp_avances FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_avances_insert" ON erp_avances FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));
CREATE POLICY "erp_avances_delete" ON erp_avances FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

-- ERP_LICITACIONES
CREATE POLICY "erp_licitaciones_select" ON erp_licitaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "erp_licitaciones_insert" ON erp_licitaciones FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente'));
CREATE POLICY "erp_licitaciones_update" ON erp_licitaciones FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));
CREATE POLICY "erp_licitaciones_delete" ON erp_licitaciones FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('Administrador','Gerente'));

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Ejecutar: SELECT * FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;