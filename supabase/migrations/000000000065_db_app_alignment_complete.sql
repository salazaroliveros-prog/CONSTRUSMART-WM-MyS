-- ============================================================
-- MIGRACIÓN 065: Alineación Completa DB ↔ App
-- ============================================================
-- Fecha: 2026-06-26
-- Propósito: Corregir TODAS las inconsistencias entre la DB y el
-- código TypeScript detectadas en auditoría integral.
-- ============================================================

-- 1) FIX: ALTER PUBLICATION con DO block (IF NOT EXISTS no es válido)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_destajos') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_destajos;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_recepciones') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_recepciones;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_pagos_proveedor') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_pagos_proveedor;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_centros_costo') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_centros_costo;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_error_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_error_logs;
  END IF;
END;
$$;

-- 2) FIX: Añadir created_at/updated_at a erp_presupuestos (app envía estos campos via forceSync)
ALTER TABLE erp_presupuestos ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now() NOT NULL;
ALTER TABLE erp_presupuestos ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL;

-- 3) FIX: Estado CHECK constraint duplicado en erp_presupuestos (quitar el desactualizado)
ALTER TABLE erp_presupuestos DROP CONSTRAINT IF EXISTS chk_erp_presupuestos_estado_valid;

-- 4) FIX: RLS para tablas que aún no lo tienen habilitado
ALTER TABLE erp_snapshots_estado_calculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_cumplimiento_normativo ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_ajustes_estacionales_actividad ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_aplicacion_escalas ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_historial_aplicacion_reglas ENABLE ROW LEVEL SECURITY;

-- 5) FIX: Políticas RLS para tablas sin políticas (usando DO blocks para evitar IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_snapshots_estado_calculo' AND policyname = 'snapshots_lectura_autenticados') THEN
    CREATE POLICY snapshots_lectura_autenticados ON erp_snapshots_estado_calculo
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_snapshots_estado_calculo' AND policyname = 'snapshots_escritura_autenticados') THEN
    CREATE POLICY snapshots_escritura_autenticados ON erp_snapshots_estado_calculo
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_cumplimiento_normativo' AND policyname = 'cumplimiento_read_all') THEN
    CREATE POLICY cumplimiento_read_all ON erp_cumplimiento_normativo
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_cumplimiento_normativo' AND policyname = 'cumplimiento_write_roles') THEN
    CREATE POLICY cumplimiento_write_roles ON erp_cumplimiento_normativo
      FOR ALL TO authenticated
      USING ((get_current_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text, 'Residente'::text])))
      WITH CHECK ((get_current_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text, 'Residente'::text])));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_ajustes_estacionales_actividad' AND policyname = 'ajustes_estacionales_read_all') THEN
    CREATE POLICY ajustes_estacionales_read_all ON erp_ajustes_estacionales_actividad
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_ajustes_estacionales_actividad' AND policyname = 'ajustes_estacionales_write_roles') THEN
    CREATE POLICY ajustes_estacionales_write_roles ON erp_ajustes_estacionales_actividad
      FOR ALL TO authenticated
      USING ((get_current_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text])))
      WITH CHECK ((get_current_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text])));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_aplicacion_escalas' AND policyname = 'aplicacion_escalas_read_all') THEN
    CREATE POLICY aplicacion_escalas_read_all ON erp_aplicacion_escalas
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_aplicacion_escalas' AND policyname = 'aplicacion_escalas_write_roles') THEN
    CREATE POLICY aplicacion_escalas_write_roles ON erp_aplicacion_escalas
      FOR ALL TO authenticated
      USING ((get_current_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text])))
      WITH CHECK ((get_current_user_role() = ANY (ARRAY['Administrador'::text, 'Gerente'::text])));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_historial_aplicacion_reglas' AND policyname = 'historial_reglas_read_all') THEN
    CREATE POLICY historial_reglas_read_all ON erp_historial_aplicacion_reglas
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_historial_aplicacion_reglas' AND policyname = 'historial_reglas_insert_all') THEN
    CREATE POLICY historial_reglas_insert_all ON erp_historial_aplicacion_reglas
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END;
$$;

-- 6) FIX: Realtime para tablas operacionales que faltan
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_subtipologias') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_subtipologias;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_plantillas_proyectos') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_plantillas_proyectos;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_parametros_climaticos') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_parametros_climaticos;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_parametros_movimiento_tierra') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_parametros_movimiento_tierra;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_parametros_pavimentos') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_parametros_pavimentos;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_parametros_redes_infraestructura') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_parametros_redes_infraestructura;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_parametros_muros_contencion') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_parametros_muros_contencion;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_error_log') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_error_log;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_audit_log') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_audit_log;
  END IF;
END;
$$;
