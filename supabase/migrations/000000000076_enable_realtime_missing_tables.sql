-- Enable realtime for missing tables (check if tables exist first)
DO $$
DECLARE
  table_name text;
BEGIN
  -- Add each table individually to avoid errors if table doesn't exist
  FOREACH table_name IN ARRAY ARRAY[
    'cajas_chicas',
    'erp_cotizaciones_negocio',  -- corrected from cotizaciones_negocio
    'erp_ajustes_estacionales_actividad',
    'erp_aplicacion_escalas',
    'erp_archivos_tipo',
    'erp_calculos_proyecto',
    'erp_categorias_renglones',
    'erp_comparaciones_calculos',
    'erp_cumplimiento_normativo',
    'erp_departamentos_gt',
    'erp_dosificaciones_concreto',
    'erp_empresas',
    'erp_escalas_produccion',
    'erp_estacionalidad',
    'erp_historial_aplicacion_reglas',
    'erp_municipios_gt',
    'erp_muro_likes',
    'erp_normativa_departamental',
    'erp_normativas_departamentales',
    'erp_precios_acero',
    'erp_proyecto_miembros',
    'erp_referencias_acero',
    'erp_reglas_factores',
    'erp_snapshots_estado_calculo',
    'erp_solicitudes',
    'erp_usuarios'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', table_name);
    EXCEPTION
      WHEN undefined_table OR duplicate_object THEN
        -- Table doesn't exist or already in publication, skip
        NULL;
    END;
  END LOOP;
END $$;
