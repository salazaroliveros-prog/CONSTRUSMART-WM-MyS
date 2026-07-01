CREATE OR REPLACE FUNCTION public.check_daily_integrity()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  fk_orphans jsonb;
  null_checks jsonb;
  dup_checks jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) INTO fk_orphans
  FROM (
    SELECT 'erp_movimientos' as tabla, COUNT(*) as count FROM erp_movimientos m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
    UNION ALL SELECT 'erp_presupuestos', COUNT(*) FROM erp_presupuestos m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
    UNION ALL SELECT 'erp_ordenes_compra', COUNT(*) FROM erp_ordenes_compra m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
    UNION ALL SELECT 'erp_hitos', COUNT(*) FROM erp_hitos m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
    UNION ALL SELECT 'erp_riesgos', COUNT(*) FROM erp_riesgos m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
    UNION ALL SELECT 'erp_incidentes', COUNT(*) FROM erp_incidentes m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
    UNION ALL SELECT 'erp_avances', COUNT(*) FROM erp_avances m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
    UNION ALL SELECT 'erp_vales_salida', COUNT(*) FROM erp_vales_salida m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
    UNION ALL SELECT 'erp_cuentas_cobrar', COUNT(*) FROM erp_cuentas_cobrar m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
    UNION ALL SELECT 'erp_cuentas_pagar', COUNT(*) FROM erp_cuentas_pagar m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
    UNION ALL SELECT 'erp_empleados', COUNT(*) FROM erp_empleados m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
    UNION ALL SELECT 'erp_notificaciones', COUNT(*) FROM erp_notificaciones m WHERE NOT EXISTS (SELECT 1 FROM erp_proyectos p WHERE p.id = m.proyecto_id) AND m.proyecto_id IS NOT NULL
  ) x WHERE x.count > 0;

  SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) INTO null_checks
  FROM (
    SELECT 'erp_proyectos' as tabla, 'nombre' as columna, COUNT(*) as count FROM erp_proyectos WHERE nombre IS NULL OR nombre = ''
    UNION ALL SELECT 'erp_proyectos', 'estado', COUNT(*) FROM erp_proyectos WHERE estado IS NULL OR estado = ''
    UNION ALL SELECT 'erp_materiales', 'nombre', COUNT(*) FROM erp_materiales WHERE nombre IS NULL OR nombre = ''
    UNION ALL SELECT 'erp_proveedores', 'nombre', COUNT(*) FROM erp_proveedores WHERE nombre IS NULL OR nombre = ''
    UNION ALL SELECT 'erp_ordenes_compra', 'proveedor', COUNT(*) FROM erp_ordenes_compra WHERE proveedor IS NULL OR proveedor = ''
    UNION ALL SELECT 'erp_presupuestos', 'proyecto_id', COUNT(*) FROM erp_presupuestos WHERE proyecto_id IS NULL OR proyecto_id = ''
    UNION ALL SELECT 'erp_empleados', 'nombre', COUNT(*) FROM erp_empleados WHERE nombre IS NULL OR nombre = ''
    UNION ALL SELECT 'erp_movimientos', 'tipo', COUNT(*) FROM erp_movimientos WHERE tipo IS NULL OR tipo = ''
    UNION ALL SELECT 'erp_hitos', 'nombre', COUNT(*) FROM erp_hitos WHERE nombre IS NULL OR nombre = ''
  ) x WHERE x.count > 0;

  SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) INTO dup_checks
  FROM (
    SELECT 'erp_proyectos' as tabla, 'nombre' as columna, COUNT(*) as count FROM erp_proyectos WHERE nombre IN (SELECT nombre FROM erp_proyectos GROUP BY nombre HAVING COUNT(*) > 1 AND nombre != '')
    UNION ALL SELECT 'erp_proveedores', 'nombre', COUNT(*) FROM erp_proveedores WHERE nombre IN (SELECT nombre FROM erp_proveedores GROUP BY nombre HAVING COUNT(*) > 1 AND nombre != '')
  ) x WHERE x.count > 0;

  result := jsonb_build_object(
    'checked_at', now()::text,
    'fk_orphans', fk_orphans,
    'null_violations', null_checks,
    'duplicates', dup_checks,
    'total_issues', (SELECT COALESCE(SUM(value::int), 0) FROM jsonb_each_text(
      jsonb_build_object(
        'fk', (SELECT COALESCE(SUM((value->>'count')::int), 0) FROM jsonb_array_elements(fk_orphans) AS value),
        'nulls', (SELECT COALESCE(SUM((value->>'count')::int), 0) FROM jsonb_array_elements(null_checks) AS value),
        'dups', (SELECT COALESCE(SUM((value->>'count')::int), 0) FROM jsonb_array_elements(dup_checks) AS value)
      )
    ))
  );

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.daily_integrity_check()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  orphan_hitos int;
  orphan_avances int;
  orphan_riesgos int;
  orphan_publicaciones int;
  orphan_notificaciones int;
  missing_proyecto_id int;
  null_estado_proyectos int;
  now_ts timestamptz;
BEGIN
  now_ts := now();

  SELECT count(*) INTO orphan_hitos FROM erp_hitos WHERE proyecto_id IS NULL;
  SELECT count(*) INTO orphan_avances FROM erp_avances WHERE proyecto_id IS NULL;
  SELECT count(*) INTO orphan_riesgos FROM erp_riesgos WHERE proyecto_id IS NULL;
  SELECT count(*) INTO orphan_publicaciones FROM erp_publicaciones_muro WHERE proyecto_id IS NULL;
  SELECT count(*) INTO orphan_notificaciones FROM erp_notificaciones WHERE proyecto_id IS NULL;
  SELECT count(*) INTO missing_proyecto_id FROM erp_movimientos WHERE proyecto_id IS NULL;
  SELECT count(*) INTO null_estado_proyectos FROM erp_proyectos WHERE estado IS NULL;

  RETURN jsonb_build_object(
    'timestamp', now_ts,
    'orphans', jsonb_build_object(
      'hitos', orphan_hitos,
      'avances', orphan_avances,
      'riesgos', orphan_riesgos,
      'publicaciones_muro', orphan_publicaciones,
      'notificaciones', orphan_notificaciones,
      'movimientos_sin_proyecto', missing_proyecto_id
    ),
    'nulls', jsonb_build_object(
      'proyectos_estado_null', null_estado_proyectos
    )
  );
END;
$function$;
