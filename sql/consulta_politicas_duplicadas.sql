-- Ver nombres exactos de políticas en tablas con 6 (las duplicadas)
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'activos_herramientas',
    'amortizaciones',
    'anticipos',
    'cajas_chicas',
    'centros_costo',
    'cotizaciones',
    'cuadro_comparativo_proveedores',
    'destajos',
    'erp_insumos_base',
    'erp_rendimientos_cuadrilla',
    'erp_vales_salida',
    'pagos_proveedores',
    'ventas_paquetes'
  )
ORDER BY tablename, policyname;
