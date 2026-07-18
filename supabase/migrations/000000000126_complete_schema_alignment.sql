-- ============================================================
-- MIGRACIÓN: Alineación completa esquema DB ↔ aplicación
-- Generada por auditoría remota - 2026-07-18
-- Objetivo: Garantizar 1:1 entre tipos TS y tablas Supabase
-- ============================================================

-- ============================================================
-- 1. COLUMNAS FALTANTES EN TABLAS EXISTENTES
-- ============================================================

-- erp_movimientos: agregar monto (además de costo_total)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_movimientos')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_movimientos' AND column_name = 'monto') THEN
    ALTER TABLE erp_movimientos ADD COLUMN monto numeric(12,2);
    CREATE INDEX idx_erp_movimientos_monto ON erp_movimientos(monto);
  END IF;
END $$;

-- erp_plantillas_proyectos: alias/columna estructura (además de configuracion)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_plantillas_proyectos')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_plantillas_proyectos' AND column_name = 'estructura') THEN
    ALTER TABLE erp_plantillas_proyectos ADD COLUMN estructura jsonb;
    CREATE INDEX idx_erp_plantillas_proyectos_estructura ON erp_plantillas_proyectos USING gin (estructura);
  END IF;
END $$;

-- erp_calculos_proyecto: agregar datos y costo_total
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_calculos_proyecto') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_calculos_proyecto' AND column_name = 'datos') THEN
      ALTER TABLE erp_calculos_proyecto ADD COLUMN datos jsonb;
      CREATE INDEX idx_erp_calculos_proyecto_datos ON erp_calculos_proyecto USING gin (datos);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_calculos_proyecto' AND column_name = 'costo_total') THEN
      ALTER TABLE erp_calculos_proyecto ADD COLUMN costo_total numeric(12,2);
      CREATE INDEX idx_erp_calculos_proyecto_costo_total ON erp_calculos_proyecto(costo_total);
    END IF;
  END IF;
END $$;

-- erp_departamentos_gt: alias departamento (además de nombre)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_departamentos_gt')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_departamentos_gt' AND column_name = 'departamento') THEN
    ALTER TABLE erp_departamentos_gt ADD COLUMN departamento text;
    CREATE INDEX idx_erp_departamentos_gt_departamento ON erp_departamentos_gt(departamento);
  END IF;
END $$;

-- erp_destajos: agregar empleado_id y monto
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_destajos') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_destajos' AND column_name = 'empleado_id') THEN
      ALTER TABLE erp_destajos ADD COLUMN empleado_id text;
      CREATE INDEX idx_erp_destajos_empleado_id ON erp_destajos(empleado_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_destajos' AND column_name = 'monto') THEN
      ALTER TABLE erp_destajos ADD COLUMN monto numeric(12,2);
      CREATE INDEX idx_erp_destajos_monto ON erp_destajos(monto);
    END IF;
  END IF;
END $$;

-- erp_avances: agregar avance_financiero
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_avances')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_avances' AND column_name = 'avance_financiero') THEN
    ALTER TABLE erp_avances ADD COLUMN avance_financiero numeric(5,2);
    CREATE INDEX idx_erp_avances_avance_financiero ON erp_avances(avance_financiero);
  END IF;
END $$;

-- erp_seguimiento: agregar tipo, valor, observaciones
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_seguimiento') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_seguimiento' AND column_name = 'tipo') THEN
      ALTER TABLE erp_seguimiento ADD COLUMN tipo text;
      CREATE INDEX idx_erp_seguimiento_tipo ON erp_seguimiento(tipo);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_seguimiento' AND column_name = 'valor') THEN
      ALTER TABLE erp_seguimiento ADD COLUMN valor numeric(12,2);
      CREATE INDEX idx_erp_seguimiento_valor ON erp_seguimiento(valor);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_seguimiento' AND column_name = 'observaciones') THEN
      ALTER TABLE erp_seguimiento ADD COLUMN observaciones text;
    END IF;
  END IF;
END $$;

-- ============================================================
-- 2. FOREIGN KEYS FALTANTES
-- ============================================================

-- erp_presupuestos.proyecto_id → erp_proyectos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_presupuestos')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                     WHERE table_name = 'erp_presupuestos' AND constraint_type = 'FOREIGN KEY' AND constraint_name LIKE '%proyecto_id%') THEN
    ALTER TABLE erp_presupuestos 
      ADD CONSTRAINT fk_erp_presupuestos_proyecto_id 
      FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id) ON DELETE CASCADE;
    CREATE INDEX idx_erp_presupuestos_proyecto_id ON erp_presupuestos(proyecto_id);
  END IF;
END $$;

-- erp_notificaciones.usuario_id → profiles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_notificaciones')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                     WHERE table_name = 'erp_notificaciones' AND constraint_type = 'FOREIGN KEY' AND constraint_name LIKE '%usuario_id%') THEN
    ALTER TABLE erp_notificaciones 
      ADD CONSTRAINT fk_erp_notificaciones_usuario_id 
      FOREIGN KEY (usuario_id) REFERENCES profiles(id) ON DELETE CASCADE;
    CREATE INDEX idx_erp_notificaciones_usuario_id ON erp_notificaciones(usuario_id);
  END IF;
END $$;

-- erp_publicaciones_muro.usuario_id → profiles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_publicaciones_muro')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                     WHERE table_name = 'erp_publicaciones_muro' AND constraint_type = 'FOREIGN KEY' AND constraint_name LIKE '%usuario_id%') THEN
    ALTER TABLE erp_publicaciones_muro 
      ADD CONSTRAINT fk_erp_publicaciones_muro_usuario_id 
      FOREIGN KEY (usuario_id) REFERENCES profiles(id) ON DELETE CASCADE;
    CREATE INDEX idx_erp_publicaciones_muro_usuario_id ON erp_publicaciones_muro(usuario_id);
  END IF;
END $$;

-- erp_snapshots_estado_calculo.proyecto_id → erp_proyectos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_snapshots_estado_calculo')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                     WHERE table_name = 'erp_snapshots_estado_calculo' AND constraint_type = 'FOREIGN KEY' AND constraint_name LIKE '%proyecto_id%') THEN
    ALTER TABLE erp_snapshots_estado_calculo 
      ADD CONSTRAINT fk_erp_snapshots_proyecto_id 
      FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id) ON DELETE CASCADE;
    CREATE INDEX idx_erp_snapshots_proyecto_id ON erp_snapshots_estado_calculo(proyecto_id);
  END IF;
END $$;

-- erp_comparaciones_calculos.proyecto_id → erp_proyectos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_comparaciones_calculos')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                     WHERE table_name = 'erp_comparaciones_calculos' AND constraint_type = 'FOREIGN KEY' AND constraint_name LIKE '%proyecto_id%') THEN
    ALTER TABLE erp_comparaciones_calculos 
      ADD CONSTRAINT fk_erp_comparaciones_proyecto_id 
      FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id) ON DELETE CASCADE;
    CREATE INDEX idx_erp_comparaciones_proyecto_id ON erp_comparaciones_calculos(proyecto_id);
  END IF;
END $$;

-- ============================================================
-- 3. COMPLETAR POLÍTICAS RLS FALTANTES
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_dosificaciones_concreto') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_dosificaciones_concreto' AND cmd = 'INSERT') THEN
      CREATE POLICY "dosificaciones_concreto_insert_admin" ON erp_dosificaciones_concreto FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_dosificaciones_concreto' AND cmd = 'UPDATE') THEN
      CREATE POLICY "dosificaciones_concreto_update_admin" ON erp_dosificaciones_concreto FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_dosificaciones_concreto' AND cmd = 'DELETE') THEN
      CREATE POLICY "dosificaciones_concreto_delete_admin" ON erp_dosificaciones_concreto FOR DELETE TO authenticated USING (true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_parametros_movimiento_tierra') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_parametros_movimiento_tierra' AND cmd = 'INSERT') THEN
      CREATE POLICY "parametros_mt_insert_admin" ON erp_parametros_movimiento_tierra FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_parametros_movimiento_tierra' AND cmd = 'UPDATE') THEN
      CREATE POLICY "parametros_mt_update_admin" ON erp_parametros_movimiento_tierra FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_parametros_movimiento_tierra' AND cmd = 'DELETE') THEN
      CREATE POLICY "parametros_mt_delete_admin" ON erp_parametros_movimiento_tierra FOR DELETE TO authenticated USING (true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_parametros_pavimentos') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_parametros_pavimentos' AND cmd = 'INSERT') THEN
      CREATE POLICY "parametros_pav_insert_admin" ON erp_parametros_pavimentos FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_parametros_pavimentos' AND cmd = 'UPDATE') THEN
      CREATE POLICY "parametros_pav_update_admin" ON erp_parametros_pavimentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_parametros_pavimentos' AND cmd = 'DELETE') THEN
      CREATE POLICY "parametros_pav_delete_admin" ON erp_parametros_pavimentos FOR DELETE TO authenticated USING (true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_parametros_redes_infraestructura') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_parametros_redes_infraestructura' AND cmd = 'INSERT') THEN
      CREATE POLICY "parametros_redes_insert_admin" ON erp_parametros_redes_infraestructura FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_parametros_redes_infraestructura' AND cmd = 'UPDATE') THEN
      CREATE POLICY "parametros_redes_update_admin" ON erp_parametros_redes_infraestructura FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_parametros_redes_infraestructura' AND cmd = 'DELETE') THEN
      CREATE POLICY "parametros_redes_delete_admin" ON erp_parametros_redes_infraestructura FOR DELETE TO authenticated USING (true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_parametros_muros_contencion') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_parametros_muros_contencion' AND cmd = 'INSERT') THEN
      CREATE POLICY "parametros_muros_insert_admin" ON erp_parametros_muros_contencion FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_parametros_muros_contencion' AND cmd = 'UPDATE') THEN
      CREATE POLICY "parametros_muros_update_admin" ON erp_parametros_muros_contencion FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_parametros_muros_contencion' AND cmd = 'DELETE') THEN
      CREATE POLICY "parametros_muros_delete_admin" ON erp_parametros_muros_contencion FOR DELETE TO authenticated USING (true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_snapshots_estado_calculo') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_snapshots_estado_calculo' AND cmd = 'SELECT') THEN
      CREATE POLICY "snapshots_calculo_select_admin" ON erp_snapshots_estado_calculo FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_snapshots_estado_calculo' AND cmd = 'UPDATE') THEN
      CREATE POLICY "snapshots_calculo_update_admin" ON erp_snapshots_estado_calculo FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_snapshots_estado_calculo' AND cmd = 'DELETE') THEN
      CREATE POLICY "snapshots_calculo_delete_admin" ON erp_snapshots_estado_calculo FOR DELETE TO authenticated USING (true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_comparaciones_calculos') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_comparaciones_calculos' AND cmd = 'SELECT') THEN
      CREATE POLICY "comparaciones_select_admin" ON erp_comparaciones_calculos FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_comparaciones_calculos' AND cmd = 'UPDATE') THEN
      CREATE POLICY "comparaciones_update_admin" ON erp_comparaciones_calculos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_comparaciones_calculos' AND cmd = 'DELETE') THEN
      CREATE POLICY "comparaciones_delete_admin" ON erp_comparaciones_calculos FOR DELETE TO authenticated USING (true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_api_keys') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_api_keys' AND cmd = 'SELECT') THEN
      CREATE POLICY "api_keys_select_admin" ON erp_api_keys FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_api_keys' AND cmd = 'INSERT') THEN
      CREATE POLICY "api_keys_insert_admin" ON erp_api_keys FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_api_keys' AND cmd = 'UPDATE') THEN
      CREATE POLICY "api_keys_update_admin" ON erp_api_keys FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'erp_api_keys' AND cmd = 'DELETE') THEN
      CREATE POLICY "api_keys_delete_admin" ON erp_api_keys FOR DELETE TO authenticated USING (true);
    END IF;
  END IF;
END $$;

-- ============================================================
-- 4. TRIGGERS updated_at FALTANTES
-- ============================================================

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['erp_movimientos','erp_empleados','erp_hitos','erp_riesgos','erp_avances','erp_cuentas_cobrar','erp_cuentas_pagar','erp_incidentes','erp_ordenes_cambio','erp_notificaciones','erp_publicaciones_muro','erp_calculos_proyecto','erp_destajos','erp_seguimiento'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t)
       AND NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_actualizar_timestamp_' || t AND event_object_table = t) THEN
      EXECUTE format('CREATE OR REPLACE FUNCTION actualizar_timestamp_%I() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;', t);
      EXECUTE format('CREATE TRIGGER trigger_actualizar_timestamp_%I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp_%I();', t, t, t);
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 5. REALTIME PARA TABLAS NUEVAS
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_dosificaciones_concreto') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS erp_dosificaciones_concreto;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_parametros_movimiento_tierra') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS erp_parametros_movimiento_tierra;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_parametros_pavimentos') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS erp_parametros_pavimentos;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_parametros_redes_infraestructura') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS erp_parametros_redes_infraestructura;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_parametros_muros_contencion') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS erp_parametros_muros_contencion;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_snapshots_estado_calculo') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS erp_snapshots_estado_calculo;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_comparaciones_calculos') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS erp_comparaciones_calculos;
  END IF;
END $$;

-- ============================================================
-- 6. GRANTS PARA SERVICIO ROLE
-- ============================================================

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
