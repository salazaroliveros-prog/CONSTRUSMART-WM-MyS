-- =============================================================
-- ELIMINAR POLÍTICAS REDUNDANTES (_read / _write / _select duplicados)
-- Las políticas _select/_insert/_update/_delete ya existen y son correctas.
-- Solo se eliminan los duplicados.
-- =============================================================

-- activos_herramientas
DROP POLICY IF EXISTS activos_read  ON public.activos_herramientas;
DROP POLICY IF EXISTS activos_write ON public.activos_herramientas;

-- amortizaciones
DROP POLICY IF EXISTS amortizaciones_read  ON public.amortizaciones;
DROP POLICY IF EXISTS amortizaciones_write ON public.amortizaciones;

-- anticipos
DROP POLICY IF EXISTS anticipos_read  ON public.anticipos;
DROP POLICY IF EXISTS anticipos_write ON public.anticipos;

-- cajas_chicas
DROP POLICY IF EXISTS cajas_chicas_read  ON public.cajas_chicas;
DROP POLICY IF EXISTS cajas_chicas_write ON public.cajas_chicas;

-- centros_costo
DROP POLICY IF EXISTS centros_costo_read  ON public.centros_costo;
DROP POLICY IF EXISTS centros_costo_write ON public.centros_costo;

-- cotizaciones
DROP POLICY IF EXISTS cotizaciones_read  ON public.cotizaciones;
DROP POLICY IF EXISTS cotizaciones_write ON public.cotizaciones;

-- cuadro_comparativo_proveedores
DROP POLICY IF EXISTS cuadro_read  ON public.cuadro_comparativo_proveedores;
DROP POLICY IF EXISTS cuadro_write ON public.cuadro_comparativo_proveedores;

-- destajos
DROP POLICY IF EXISTS destajos_read  ON public.destajos;
DROP POLICY IF EXISTS destajos_write ON public.destajos;

-- erp_insumos_base
DROP POLICY IF EXISTS insumos_base_read  ON public.erp_insumos_base;
DROP POLICY IF EXISTS insumos_base_write ON public.erp_insumos_base;

-- erp_rendimientos_cuadrilla
DROP POLICY IF EXISTS rendimientos_read  ON public.erp_rendimientos_cuadrilla;
DROP POLICY IF EXISTS rendimientos_write ON public.erp_rendimientos_cuadrilla;

-- erp_vales_salida: eliminar _read y _write (el _write tenía USING restrictivo, lo reemplazamos)
DROP POLICY IF EXISTS vales_salida_read  ON public.erp_vales_salida;
DROP POLICY IF EXISTS vales_salida_write ON public.erp_vales_salida;

-- pagos_proveedores
DROP POLICY IF EXISTS pagos_read  ON public.pagos_proveedores;
DROP POLICY IF EXISTS pagos_write ON public.pagos_proveedores;

-- ventas_paquetes
DROP POLICY IF EXISTS ventas_read  ON public.ventas_paquetes;
DROP POLICY IF EXISTS ventas_write ON public.ventas_paquetes;


-- VERIFICACIÓN: todas deben quedar en 4 políticas
SELECT tablename, COUNT(*) AS policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
