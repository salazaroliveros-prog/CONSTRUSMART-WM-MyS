-- Fix: only enable RLS and create policies if tables exist
-- Resolves: ERROR 42P01 relation "erp_backup_config" does not exist

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'erp_cotizaciones_negocio') THEN
    ALTER TABLE erp_cotizaciones_negocio ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS cotizaciones_negocio_read_all ON erp_cotizaciones_negocio;
    DROP POLICY IF EXISTS cotizaciones_negocio_insert_auth ON erp_cotizaciones_negocio;
    DROP POLICY IF EXISTS cotizaciones_negocio_update_auth ON erp_cotizaciones_negocio;
    DROP POLICY IF EXISTS cotizaciones_negocio_delete_admin ON erp_cotizaciones_negocio;

    CREATE POLICY cotizaciones_negocio_read_all ON erp_cotizaciones_negocio FOR SELECT TO authenticated USING (true);
    CREATE POLICY cotizaciones_negocio_insert_auth ON erp_cotizaciones_negocio FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY cotizaciones_negocio_update_auth ON erp_cotizaciones_negocio FOR UPDATE TO authenticated USING (true);

    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'erp_usuarios') THEN
      CREATE POLICY cotizaciones_negocio_delete_admin ON erp_cotizaciones_negocio FOR DELETE TO authenticated USING (auth.uid() IN (SELECT id FROM erp_usuarios WHERE rol = 'admin'));
    ELSE
      CREATE POLICY cotizaciones_negocio_delete_admin ON erp_cotizaciones_negocio FOR DELETE TO authenticated USING (true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'erp_backup_config') THEN
    ALTER TABLE erp_backup_config ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS backup_config_admin_all ON erp_backup_config;

    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'erp_usuarios') THEN
      CREATE POLICY backup_config_admin_all ON erp_backup_config FOR ALL TO authenticated USING (auth.uid() IN (SELECT id FROM erp_usuarios WHERE rol = 'admin'));
    ELSE
      CREATE POLICY backup_config_admin_all ON erp_backup_config FOR ALL TO authenticated USING (true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'erp_monitoring_config') THEN
    ALTER TABLE erp_monitoring_config ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS monitoring_config_admin_all ON erp_monitoring_config;

    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'erp_usuarios') THEN
      CREATE POLICY monitoring_config_admin_all ON erp_monitoring_config FOR ALL TO authenticated USING (auth.uid() IN (SELECT id FROM erp_usuarios WHERE rol = 'admin'));
    ELSE
      CREATE POLICY monitoring_config_admin_all ON erp_monitoring_config FOR ALL TO authenticated USING (true);
    END IF;
  END IF;
END $$;
