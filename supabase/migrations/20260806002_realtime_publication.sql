-- ══════════════════════════════════════════════════════════════
-- Migración: Agregar tablas faltantes a publicación Realtime
-- Fecha: 8/6/2026
-- ══════════════════════════════════════════════════════════════

-- 1. Agregar las tablas BASE que NO están en la publicación aún
-- Las tablas de migración 1 (proyectos, movimientos, etc.) ya tienen
-- REPLICA IDENTITY y publicación en migraciones anteriores (002)
-- Solo agregamos las que faltan con IF EXISTS para evitar errores

DO $$
DECLARE
  tablas TEXT[] := ARRAY[
    'erp_planos',
    'erp_rfis',
    'erp_submittals',
    'erp_seguimiento_evm',
    'erp_usuarios',
    'pagos_proveedores',
    'erp_cotizaciones_negocio'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tablas
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
      EXECUTE format('ALTER TABLE IF EXISTS %I REPLICA IDENTITY FULL', t);
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Tabla % ya está en la publicación', t;
    WHEN undefined_table THEN
      RAISE NOTICE 'Tabla % no existe, se omite', t;
    END;
  END LOOP;
END $$;

-- 2. Verificar estado de la publicación
SELECT schemaname, tablename AS publicationname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;