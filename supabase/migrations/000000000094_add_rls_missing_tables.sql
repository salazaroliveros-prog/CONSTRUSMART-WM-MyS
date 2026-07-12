-- Migration 094: RLS en tablas faltantes
-- 2026-07-09

-- 1. erp_plantillas_proyectos
ALTER TABLE erp_plantillas_proyectos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plantillas_read" ON erp_plantillas_proyectos;
DROP POLICY IF EXISTS "plantillas_insert_own" ON erp_plantillas_proyectos;
DROP POLICY IF EXISTS "plantillas_update_own" ON erp_plantillas_proyectos;
DROP POLICY IF EXISTS "plantillas_delete_admin" ON erp_plantillas_proyectos;

CREATE POLICY "plantillas_read" ON erp_plantillas_proyectos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "plantillas_insert_own" ON erp_plantillas_proyectos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "plantillas_update_own" ON erp_plantillas_proyectos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "plantillas_delete_admin" ON erp_plantillas_proyectos
  FOR DELETE USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'salazaroliveros@gmail.com'
    )
  );

-- 2. erp_comentarios_muro
ALTER TABLE erp_comentarios_muro ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comentarios_read" ON erp_comentarios_muro;
DROP POLICY IF EXISTS "comentarios_insert_own" ON erp_comentarios_muro;
DROP POLICY IF EXISTS "comentarios_update_own" ON erp_comentarios_muro;
DROP POLICY IF EXISTS "comentarios_delete_admin" ON erp_comentarios_muro;

CREATE POLICY "comentarios_read" ON erp_comentarios_muro
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "comentarios_insert_own" ON erp_comentarios_muro
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid()::text);

CREATE POLICY "comentarios_update_own" ON erp_comentarios_muro
  FOR UPDATE USING (auth.role() = 'authenticated' AND created_by = auth.uid()::text);

CREATE POLICY "comentarios_delete_admin" ON erp_comentarios_muro
  FOR DELETE USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'salazaroliveros@gmail.com'
    )
  );

-- 3. erp_ventas_paquetes
ALTER TABLE erp_ventas_paquetes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ventas_read" ON erp_ventas_paquetes;
DROP POLICY IF EXISTS "ventas_insert_auth" ON erp_ventas_paquetes;
DROP POLICY IF EXISTS "ventas_update_auth" ON erp_ventas_paquetes;
DROP POLICY IF EXISTS "ventas_delete_admin" ON erp_ventas_paquetes;

CREATE POLICY "ventas_read" ON erp_ventas_paquetes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "ventas_insert_auth" ON erp_ventas_paquetes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "ventas_update_auth" ON erp_ventas_paquetes
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "ventas_delete_admin" ON erp_ventas_paquetes
  FOR DELETE USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'salazaroliveros@gmail.com'
    )
  );

-- 4. erp_comparaciones_calculos
ALTER TABLE erp_comparaciones_calculos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comparaciones_read" ON erp_comparaciones_calculos;
DROP POLICY IF EXISTS "comparaciones_insert_auth" ON erp_comparaciones_calculos;

CREATE POLICY "comparaciones_read" ON erp_comparaciones_calculos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "comparaciones_insert_auth" ON erp_comparaciones_calculos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. Tablas de motor de cálculo (lectura autenticados, escritura admin)
-- erp_movimientos_, erp_movimientos_default, erp_backup_config, erp_monitoring_config

DO $$
BEGIN
  -- erp_movimientos_
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_movimientos_') THEN
    ALTER TABLE erp_movimientos_ ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "movimientos_extra_read" ON erp_movimientos_;
    CREATE POLICY "movimientos_extra_read" ON erp_movimientos_
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  -- erp_movimientos_default
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_movimientos_default') THEN
    ALTER TABLE erp_movimientos_default ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "movimientos_default_read" ON erp_movimientos_default;
    CREATE POLICY "movimientos_default_read" ON erp_movimientos_default
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  -- erp_backup_config
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_backup_config') THEN
    ALTER TABLE erp_backup_config ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "backup_config_admin_only" ON erp_backup_config;
    CREATE POLICY "backup_config_admin_only" ON erp_backup_config
      FOR ALL USING (
        auth.role() = 'authenticated'
        AND EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.email = 'salazaroliveros@gmail.com'
        )
      );
  END IF;

  -- erp_monitoring_config
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_monitoring_config') THEN
    ALTER TABLE erp_monitoring_config ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "monitoring_config_admin_only" ON erp_monitoring_config;
    CREATE POLICY "monitoring_config_admin_only" ON erp_monitoring_config
      FOR ALL USING (
        auth.role() = 'authenticated'
        AND EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.email = 'salazaroliveros@gmail.com'
        )
      );
  END IF;
END $$;

-- 6. Realtime para tablas nuevas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'erp_notificaciones'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_notificaciones;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'erp_plantillas_proyectos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_plantillas_proyectos;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'erp_comentarios_muro'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_comentarios_muro;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'erp_ventas_paquetes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_ventas_paquetes;
  END IF;
END $$;

-- 7. Auditoria: log de cambios
INSERT INTO erp_audit_log (tabla, operacion, id_registro, datos_anteriores, datos_nuevos, usuario_id)
SELECT 'erp_proyectos', 'MIGRATION_093', '', '', 'Migration 093: +25 columnas + erp_notificaciones', 'system'
WHERE NOT EXISTS (
  SELECT 1 FROM erp_audit_log WHERE tabla='erp_proyectos' AND operacion='MIGRATION_093'
);

INSERT INTO erp_audit_log (tabla, operacion, id_registro, datos_anteriores, datos_nuevos, usuario_id)
SELECT 'rls', 'MIGRATION_094', '', '', 'Migration 094: +RLS 8 tablas', 'system'
WHERE NOT EXISTS (
  SELECT 1 FROM erp_audit_log WHERE tabla='rls' AND operacion='MIGRATION_094'
);