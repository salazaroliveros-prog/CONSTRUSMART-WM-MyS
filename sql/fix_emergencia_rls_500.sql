-- =============================================================
-- REPARACION DE EMERGENCIA - ERRORS 500 EN TODAS LAS TABLAS
-- =============================================================
-- Este SQL elimina TODAS las politicas RLS y crea unas minimas
-- que permitan acceso completo a usuarios autenticados.
-- Ejecutar en Supabase SQL Editor si hay errores 500.
-- =============================================================


-- PASO 1: DESHABILITAR RLS TEMPORALMENTE PARA DIAGNOSTICO
-- Si esto resuelve los 500, el problema es 100% RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_proyectos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_movimientos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_empleados DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_materiales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_ordenes_compra DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_proveedores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_eventos_calendario DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_bitacora DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_seguimiento DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_renglones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_insumos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_sub_renglones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_presupuestos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_sistema DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_vales_salida DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_insumos_base DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_rendimientos_cuadrilla DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.destajos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cajas_chicas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activos_herramientas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuadro_comparativo_proveedores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.anticipos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.amortizaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_proveedores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas_paquetes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.centros_costo DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_auditoria DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_avances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_licitaciones DISABLE ROW LEVEL SECURITY;


-- PASO 2: ELIMINAR TODAS LAS POLITICAS EXISTENTES
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT schemaname, tablename, policyname
           FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
  END LOOP;
END $$;


-- PASO 3: RE-HABILITAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_eventos_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_bitacora ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_seguimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_renglones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_sub_renglones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_vales_salida ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_insumos_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_rendimientos_cuadrilla ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destajos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cajas_chicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activos_herramientas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuadro_comparativo_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anticipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amortizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas_paquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centros_costo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_avances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_licitaciones ENABLE ROW LEVEL SECURITY;


-- PASO 4: CREAR POLITICAS MINIMAS QUE FUNCIONAN AL 100%
-- Todas las tablas: SELECT/INSERT/UPDATE/DELETE para authenticated

CREATE POLICY p_profiles_all ON public.profiles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_proyectos_all ON public.erp_proyectos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_movimientos_all ON public.erp_movimientos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_empleados_all ON public.erp_empleados
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_materiales_all ON public.erp_materiales
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_oc_all ON public.erp_ordenes_compra
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_proveedores_all ON public.erp_proveedores
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_eventos_all ON public.erp_eventos_calendario
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_bitacora_all ON public.erp_bitacora
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_seguimiento_all ON public.erp_seguimiento
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_renglones_all ON public.erp_renglones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_insumos_all ON public.erp_insumos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_subrenglones_all ON public.erp_sub_renglones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_presupuestos_all ON public.erp_presupuestos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_logs_all ON public.logs_sistema
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_vales_all ON public.erp_vales_salida
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_insumos_base_all ON public.erp_insumos_base
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_rendimientos_all ON public.erp_rendimientos_cuadrilla
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_destajos_all ON public.destajos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_cajas_all ON public.cajas_chicas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_activos_all ON public.activos_herramientas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_cuadro_all ON public.cuadro_comparativo_proveedores
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_cotizaciones_all ON public.cotizaciones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_anticipos_all ON public.anticipos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_amortizaciones_all ON public.amortizaciones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_pagos_all ON public.pagos_proveedores
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_ventas_all ON public.ventas_paquetes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_centros_all ON public.centros_costo
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_auditoria_all ON public.erp_auditoria
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_avances_all ON public.erp_avances
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY p_licitaciones_all ON public.erp_licitaciones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- PASO 5: VERIFICAR QUE RLS FUNCIONA
SELECT
  t.tablename,
  (SELECT count(*) FROM pg_policies p WHERE p.tablename = t.tablename AND p.schemaname = 'public') AS politicas
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
ORDER BY t.tablename;
