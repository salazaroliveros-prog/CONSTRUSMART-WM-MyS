-- ============================================================
-- MIGRACIÓN 070: Daily Integrity Check RPC
-- ============================================================
-- Crea una función SECURITY DEFINER que audita:
--   - Huérfanos por FK (hitos, avances, riesgos, publicaciones, notificaciones)
--   - Campos NULL peligrosos (proyectos.estado)
--   - Movimientos sin proyecto_id
-- Uso exclusivo: service_role / postgres
-- ============================================================

CREATE OR REPLACE FUNCTION public.daily_integrity_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
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
$$;

GRANT EXECUTE ON FUNCTION public.daily_integrity_check() TO service_role;
GRANT EXECUTE ON FUNCTION public.daily_integrity_check() TO postgres;

-- Register migration
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
SELECT '000000000070', 'daily_integrity_check', ARRAY[
  'Created daily_integrity_check RPC for orphan and NULL checks'
]
WHERE NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '000000000070');
