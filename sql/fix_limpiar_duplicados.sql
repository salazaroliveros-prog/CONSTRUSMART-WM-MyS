-- =============================================================
-- LIMPIEZA DE POLÍTICAS DUPLICADAS
-- Tablas con 6 políticas tienen las viejas granulares sobrando.
-- Solo elimina las antiguas, deja las nuevas (read/write).
-- =============================================================

-- activos_herramientas (tenía activos_read + activos_write de migración anterior)
DROP POLICY IF EXISTS activos_read  ON public.activos_herramientas;
DROP POLICY IF EXISTS activos_write ON public.activos_herramientas;
CREATE POLICY activos_read  ON public.activos_herramientas FOR SELECT TO authenticated USING (true);
CREATE POLICY activos_write ON public.activos_herramientas FOR ALL    TO authenticated USING (true);

-- amortizaciones
DROP POLICY IF EXISTS amortizaciones_read  ON public.amortizaciones;
DROP POLICY IF EXISTS amortizaciones_write ON public.amortizaciones;
CREATE POLICY amortizaciones_read  ON public.amortizaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY amortizaciones_write ON public.amortizaciones FOR ALL    TO authenticated USING (true);

-- anticipos
DROP POLICY IF EXISTS anticipos_read  ON public.anticipos;
DROP POLICY IF EXISTS anticipos_write ON public.anticipos;
CREATE POLICY anticipos_read  ON public.anticipos FOR SELECT TO authenticated USING (true);
CREATE POLICY anticipos_write ON public.anticipos FOR ALL    TO authenticated USING (true);

-- cajas_chicas
DROP POLICY IF EXISTS cajas_chicas_read  ON public.cajas_chicas;
DROP POLICY IF EXISTS cajas_chicas_write ON public.cajas_chicas;
CREATE POLICY cajas_chicas_read  ON public.cajas_chicas FOR SELECT TO authenticated USING (true);
CREATE POLICY cajas_chicas_write ON public.cajas_chicas FOR ALL    TO authenticated USING (true);

-- centros_costo
DROP POLICY IF EXISTS centros_costo_read  ON public.centros_costo;
DROP POLICY IF EXISTS centros_costo_write ON public.centros_costo;
CREATE POLICY centros_costo_read  ON public.centros_costo FOR SELECT TO authenticated USING (true);
CREATE POLICY centros_costo_write ON public.centros_costo FOR ALL    TO authenticated USING (true);

-- cotizaciones
DROP POLICY IF EXISTS cotizaciones_read  ON public.cotizaciones;
DROP POLICY IF EXISTS cotizaciones_write ON public.cotizaciones;
CREATE POLICY cotizaciones_read  ON public.cotizaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY cotizaciones_write ON public.cotizaciones FOR ALL    TO authenticated USING (true);

-- cuadro_comparativo_proveedores
DROP POLICY IF EXISTS cuadro_read  ON public.cuadro_comparativo_proveedores;
DROP POLICY IF EXISTS cuadro_write ON public.cuadro_comparativo_proveedores;
CREATE POLICY cuadro_read  ON public.cuadro_comparativo_proveedores FOR SELECT TO authenticated USING (true);
CREATE POLICY cuadro_write ON public.cuadro_comparativo_proveedores FOR ALL    TO authenticated USING (true);

-- destajos
DROP POLICY IF EXISTS destajos_read  ON public.destajos;
DROP POLICY IF EXISTS destajos_write ON public.destajos;
CREATE POLICY destajos_read  ON public.destajos FOR SELECT TO authenticated USING (true);
CREATE POLICY destajos_write ON public.destajos FOR ALL    TO authenticated USING (true);

-- erp_insumos_base
DROP POLICY IF EXISTS insumos_base_read  ON public.erp_insumos_base;
DROP POLICY IF EXISTS insumos_base_write ON public.erp_insumos_base;
CREATE POLICY insumos_base_read  ON public.erp_insumos_base FOR SELECT TO authenticated USING (true);
CREATE POLICY insumos_base_write ON public.erp_insumos_base FOR ALL    TO authenticated USING (true);

-- erp_rendimientos_cuadrilla
DROP POLICY IF EXISTS rendimientos_read  ON public.erp_rendimientos_cuadrilla;
DROP POLICY IF EXISTS rendimientos_write ON public.erp_rendimientos_cuadrilla;
CREATE POLICY rendimientos_read  ON public.erp_rendimientos_cuadrilla FOR SELECT TO authenticated USING (true);
CREATE POLICY rendimientos_write ON public.erp_rendimientos_cuadrilla FOR ALL    TO authenticated USING (true);

-- erp_vales_salida
DROP POLICY IF EXISTS vales_salida_select ON public.erp_vales_salida;
DROP POLICY IF EXISTS vales_salida_insert ON public.erp_vales_salida;
DROP POLICY IF EXISTS vales_salida_update ON public.erp_vales_salida;
DROP POLICY IF EXISTS vales_salida_delete ON public.erp_vales_salida;
CREATE POLICY vales_salida_select ON public.erp_vales_salida FOR SELECT TO authenticated USING (true);
CREATE POLICY vales_salida_insert ON public.erp_vales_salida FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY vales_salida_update ON public.erp_vales_salida FOR UPDATE TO authenticated USING (true);
CREATE POLICY vales_salida_delete ON public.erp_vales_salida FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'Administrador')
);

-- pagos_proveedores
DROP POLICY IF EXISTS pagos_read  ON public.pagos_proveedores;
DROP POLICY IF EXISTS pagos_write ON public.pagos_proveedores;
CREATE POLICY pagos_read  ON public.pagos_proveedores FOR SELECT TO authenticated USING (true);
CREATE POLICY pagos_write ON public.pagos_proveedores FOR ALL    TO authenticated USING (true);

-- ventas_paquetes
DROP POLICY IF EXISTS ventas_read  ON public.ventas_paquetes;
DROP POLICY IF EXISTS ventas_write ON public.ventas_paquetes;
CREATE POLICY ventas_read  ON public.ventas_paquetes FOR SELECT TO authenticated USING (true);
CREATE POLICY ventas_write ON public.ventas_paquetes FOR ALL    TO authenticated USING (true);


-- VERIFICACIÓN: todas deben quedar en 2 o 4 políticas
SELECT tablename, COUNT(*) AS policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
