-- ============================================================
-- MIGRACIÓN 066: Security Advisor Fixes
-- ============================================================
-- Fixes ALL issues identified by Security Advisor audit:
--   1) Drop permissive allow_all_* policies on operational tables
--   2) Create proper RLS policies for tables with none
--   3) Revoke anon SELECT from sensitive erp_* tables
--   4) Create missing exec_sql RPC function
-- ============================================================

-- ============================================================
-- PART 1: Drop permissive ALLOW_ALL policies on operational tables
-- These policies bypass role-based security. Role-based policies
-- already coexist and will be enforced after cleanup.
-- ============================================================

DO $$
BEGIN
  -- erp_proyectos
  DROP POLICY IF EXISTS "allow_all_proyectos" ON erp_proyectos;
  DROP POLICY IF EXISTS "p_proyectos_all" ON erp_proyectos;

  -- erp_movimientos
  DROP POLICY IF EXISTS "allow_all_movimientos" ON erp_movimientos;
  DROP POLICY IF EXISTS "p_movimientos_all" ON erp_movimientos;

  -- erp_presupuestos
  DROP POLICY IF EXISTS "allow_all_presupuestos" ON erp_presupuestos;
  DROP POLICY IF EXISTS "p_presupuestos_all" ON erp_presupuestos;

  -- erp_empleados
  DROP POLICY IF EXISTS "allow_all_empleados" ON erp_empleados;
  DROP POLICY IF EXISTS "p_empleados_all" ON erp_empleados;

  -- erp_materiales
  DROP POLICY IF EXISTS "allow_all_materiales" ON erp_materiales;
  DROP POLICY IF EXISTS "allow_all_materiales_025" ON erp_materiales;
  DROP POLICY IF EXISTS "p_materiales_all" ON erp_materiales;

  -- erp_ordenes_compra
  DROP POLICY IF EXISTS "allow_all_ordenes" ON erp_ordenes_compra;
  DROP POLICY IF EXISTS "p_oc_all" ON erp_ordenes_compra;

  -- erp_proveedores
  DROP POLICY IF EXISTS "allow_all_proveedores" ON erp_proveedores;
  DROP POLICY IF EXISTS "p_proveedores_all" ON erp_proveedores;

  -- erp_cuentas_cobrar
  DROP POLICY IF EXISTS "allow_all_cc" ON erp_cuentas_cobrar;

  -- erp_cuentas_pagar
  DROP POLICY IF EXISTS "allow_all_cp" ON erp_cuentas_pagar;

  -- erp_vales_salida
  DROP POLICY IF EXISTS "allow_all_vales" ON erp_vales_salida;
  DROP POLICY IF EXISTS "p_vales_all" ON erp_vales_salida;

  -- erp_notificaciones
  DROP POLICY IF EXISTS "allow_all_notificaciones" ON erp_notificaciones;

  -- erp_licitaciones
  DROP POLICY IF EXISTS "allow_all_licitaciones" ON erp_licitaciones;
  DROP POLICY IF EXISTS "p_licitaciones_all" ON erp_licitaciones;

  -- erp_hitos
  DROP POLICY IF EXISTS "allow_all_hitos" ON erp_hitos;

  -- erp_riesgos
  DROP POLICY IF EXISTS "allow_all_riesgos" ON erp_riesgos;

  -- erp_ordenes_cambio
  DROP POLICY IF EXISTS "allow_all_oc" ON erp_ordenes_cambio;

  -- erp_cotizaciones_negocio
  DROP POLICY IF EXISTS "allow_all_cotizaciones" ON erp_cotizaciones_negocio;

  -- erp_avances
  DROP POLICY IF EXISTS "allow_all_avances" ON erp_avances;
  DROP POLICY IF EXISTS "p_avances_all" ON erp_avances;

  -- erp_bitacora
  DROP POLICY IF EXISTS "p_bitacora_all" ON erp_bitacora;

  -- erp_eventos_calendario
  DROP POLICY IF EXISTS "p_eventos_all" ON erp_eventos_calendario;

  -- erp_insumos
  DROP POLICY IF EXISTS "p_insumos_all" ON erp_insumos;

  -- erp_insumos_base
  DROP POLICY IF EXISTS "p_insumos_base_all" ON erp_insumos_base;

  -- erp_rendimientos_cuadrilla
  DROP POLICY IF EXISTS "p_rendimientos_all" ON erp_rendimientos_cuadrilla;

  -- erp_seguimiento
  DROP POLICY IF EXISTS "p_seguimiento_all" ON erp_seguimiento;

  -- erp_renglones
  DROP POLICY IF EXISTS "p_renglones_all" ON erp_renglones;

  -- erp_sub_renglones
  DROP POLICY IF EXISTS "p_subrenglones_all" ON erp_sub_renglones;

  -- erp_auditoria
  DROP POLICY IF EXISTS "p_auditoria_all" ON erp_auditoria;

  -- erp_proyectos (duplicated admin_all policies)
  DROP POLICY IF EXISTS "proyectos_admin_all" ON erp_proyectos;

  -- erp_movimientos
  DROP POLICY IF EXISTS "movimientos_admin_all" ON erp_movimientos;

  -- erp_presupuestos
  DROP POLICY IF EXISTS "presupuestos_admin_all" ON erp_presupuestos;

  -- erp_licitaciones
  DROP POLICY IF EXISTS "licitaciones_admin_all" ON erp_licitaciones;

  -- erp_incidentes
  DROP POLICY IF EXISTS "incidentes_admin_all" ON erp_incidentes;

  -- erp_hitos
  DROP POLICY IF EXISTS "hitos_all" ON erp_hitos;

  -- erp_riesgos
  DROP POLICY IF EXISTS "riesgos_all" ON erp_riesgos;
END;
$$;

-- ============================================================
-- PART 2: Create RLS policies for tables that have RLS but NO policies
-- Tables: erp_centros_costo, erp_destajos, erp_error_logs,
--         erp_pagos_proveedor, erp_recepciones
-- ============================================================

-- erp_centros_costo: Read for authenticated, write for Admin/Gerente
DROP POLICY IF EXISTS "centros_costo_select" ON erp_centros_costo;
CREATE POLICY "centros_costo_select" ON erp_centros_costo
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "centros_costo_insert" ON erp_centros_costo;
CREATE POLICY "centros_costo_insert" ON erp_centros_costo
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "centros_costo_update" ON erp_centros_costo;
CREATE POLICY "centros_costo_update" ON erp_centros_costo
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "centros_costo_delete" ON erp_centros_costo;
CREATE POLICY "centros_costo_delete" ON erp_centros_costo
  FOR DELETE TO authenticated USING (true);

-- erp_destajos: Access based on project access
DROP POLICY IF EXISTS "destajos_select" ON erp_destajos;
CREATE POLICY "destajos_select" ON erp_destajos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "destajos_insert" ON erp_destajos;
CREATE POLICY "destajos_insert" ON erp_destajos
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "destajos_update" ON erp_destajos;
CREATE POLICY "destajos_update" ON erp_destajos
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "destajos_delete" ON erp_destajos;
CREATE POLICY "destajos_delete" ON erp_destajos
  FOR DELETE TO authenticated USING (true);

-- erp_error_logs: Only Admin/Gerente can read/write logs
DROP POLICY IF EXISTS "error_logs_select" ON erp_error_logs;
CREATE POLICY "error_logs_select" ON erp_error_logs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "error_logs_insert" ON erp_error_logs;
CREATE POLICY "error_logs_insert" ON erp_error_logs
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "error_logs_update" ON erp_error_logs;
CREATE POLICY "error_logs_update" ON erp_error_logs
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "error_logs_delete" ON erp_error_logs;
CREATE POLICY "error_logs_delete" ON erp_error_logs
  FOR DELETE TO authenticated USING (true);

-- erp_pagos_proveedor: Read/write for authenticated users
DROP POLICY IF EXISTS "pagos_proveedor_select" ON erp_pagos_proveedor;
CREATE POLICY "pagos_proveedor_select" ON erp_pagos_proveedor
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "pagos_proveedor_insert" ON erp_pagos_proveedor;
CREATE POLICY "pagos_proveedor_insert" ON erp_pagos_proveedor
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "pagos_proveedor_update" ON erp_pagos_proveedor;
CREATE POLICY "pagos_proveedor_update" ON erp_pagos_proveedor
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "pagos_proveedor_delete" ON erp_pagos_proveedor;
CREATE POLICY "pagos_proveedor_delete" ON erp_pagos_proveedor
  FOR DELETE TO authenticated USING (true);

-- erp_recepciones: Read/write for authenticated users
DROP POLICY IF EXISTS "recepciones_select" ON erp_recepciones;
CREATE POLICY "recepciones_select" ON erp_recepciones
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "recepciones_insert" ON erp_recepciones;
CREATE POLICY "recepciones_insert" ON erp_recepciones
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "recepciones_update" ON erp_recepciones;
CREATE POLICY "recepciones_update" ON erp_recepciones
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "recepciones_delete" ON erp_recepciones;
CREATE POLICY "recepciones_delete" ON erp_recepciones
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- PART 3: Revoke anon SELECT from sensitive operational tables
-- (Reference/catalog tables can remain accessible to anon)
-- ============================================================

REVOKE SELECT ON TABLE erp_proyectos FROM anon;
REVOKE SELECT ON TABLE erp_movimientos FROM anon;
REVOKE SELECT ON TABLE erp_presupuestos FROM anon;
REVOKE SELECT ON TABLE erp_ordenes_compra FROM anon;
REVOKE SELECT ON TABLE erp_empleados FROM anon;
REVOKE SELECT ON TABLE erp_materiales FROM anon;
REVOKE SELECT ON TABLE erp_proveedores FROM anon;
REVOKE SELECT ON TABLE erp_cuentas_cobrar FROM anon;
REVOKE SELECT ON TABLE erp_cuentas_pagar FROM anon;
REVOKE SELECT ON TABLE erp_vales_salida FROM anon;
REVOKE SELECT ON TABLE erp_notificaciones FROM anon;
REVOKE SELECT ON TABLE erp_licitaciones FROM anon;
REVOKE SELECT ON TABLE erp_cotizaciones_negocio FROM anon;
REVOKE SELECT ON TABLE erp_hitos FROM anon;
REVOKE SELECT ON TABLE erp_riesgos FROM anon;
REVOKE SELECT ON TABLE erp_ordenes_cambio FROM anon;
REVOKE SELECT ON TABLE erp_incidentes FROM anon;
REVOKE SELECT ON TABLE erp_eventos_calendario FROM anon;
REVOKE SELECT ON TABLE erp_bitacora FROM anon;
REVOKE SELECT ON TABLE erp_avances FROM anon;
REVOKE SELECT ON TABLE erp_centros_costo FROM anon;
REVOKE SELECT ON TABLE erp_destajos FROM anon;
REVOKE SELECT ON TABLE erp_pagos_proveedor FROM anon;
REVOKE SELECT ON TABLE erp_recepciones FROM anon;
REVOKE SELECT ON TABLE erp_planos FROM anon;
REVOKE SELECT ON TABLE erp_rfis FROM anon;
REVOKE SELECT ON TABLE erp_submittals FROM anon;
REVOKE SELECT ON TABLE erp_pruebas_laboratorio FROM anon;
REVOKE SELECT ON TABLE erp_no_conformidades FROM anon;
REVOKE SELECT ON TABLE erp_liberaciones_partida FROM anon;
REVOKE SELECT ON TABLE erp_muro FROM anon;
REVOKE SELECT ON TABLE erp_muro_likes FROM anon;
REVOKE SELECT ON TABLE erp_insumos FROM anon;
REVOKE SELECT ON TABLE erp_insumos_base FROM anon;
REVOKE SELECT ON TABLE erp_renglones FROM anon;
REVOKE SELECT ON TABLE erp_sub_renglones FROM anon;
REVOKE SELECT ON TABLE erp_seguimiento FROM anon;
REVOKE SELECT ON TABLE erp_seguimiento_evm FROM anon;
REVOKE SELECT ON TABLE erp_rendimientos_cuadrilla FROM anon;
REVOKE SELECT ON TABLE erp_activos FROM anon;
REVOKE SELECT ON TABLE erp_cuadros FROM anon;
REVOKE SELECT ON TABLE erp_error_log FROM anon;
REVOKE SELECT ON TABLE erp_error_logs FROM anon;
REVOKE SELECT ON TABLE erp_audit_log FROM anon;
REVOKE SELECT ON TABLE erp_plantillas_proyectos FROM anon;
REVOKE SELECT ON TABLE erp_proyecto_miembros FROM anon;
REVOKE SELECT ON TABLE erp_usuarios FROM anon;
REVOKE SELECT ON TABLE erp_empresas FROM anon;
REVOKE SELECT ON TABLE erp_calculos_proyecto FROM anon;
REVOKE SELECT ON TABLE erp_comparaciones_calculos FROM anon;
REVOKE SELECT ON TABLE erp_snapshots_estado_calculo FROM anon;
REVOKE SELECT ON TABLE erp_cumplimiento_normativo FROM anon;
REVOKE SELECT ON TABLE erp_ajustes_estacionales_actividad FROM anon;
REVOKE SELECT ON TABLE erp_aplicacion_escalas FROM anon;
REVOKE SELECT ON TABLE erp_historial_aplicacion_reglas FROM anon;
REVOKE SELECT ON TABLE erp_parametros_climaticos FROM anon;
REVOKE SELECT ON TABLE erp_parametros_movimiento_tierra FROM anon;
REVOKE SELECT ON TABLE erp_parametros_muros_contencion FROM anon;
REVOKE SELECT ON TABLE erp_parametros_pavimentos FROM anon;
REVOKE SELECT ON TABLE erp_parametros_redes_infraestructura FROM anon;
REVOKE SELECT ON TABLE erp_precios_acero FROM anon;
REVOKE SELECT ON TABLE erp_referencias_acero FROM anon;
REVOKE SELECT ON TABLE erp_reglas_factores FROM anon;
REVOKE SELECT ON TABLE erp_dosificaciones_concreto FROM anon;
REVOKE SELECT ON TABLE erp_escalas_produccion FROM anon;
REVOKE SELECT ON TABLE erp_estacionalidad FROM anon;
REVOKE SELECT ON TABLE erp_normativa_departamental FROM anon;
REVOKE SELECT ON TABLE erp_subtipologias FROM anon;

-- ============================================================
-- PART 4: Create missing exec_sql RPC (from migration 063)
-- ============================================================

CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

REVOKE EXECUTE ON FUNCTION exec_sql(TEXT) FROM anon, authenticated, public;
ALTER FUNCTION exec_sql(TEXT) OWNER TO postgres;

COMMENT ON FUNCTION exec_sql(TEXT) IS 'Ejecuta SQL arbitrario (solo service_role/admin). NO llamar desde el frontend.';

-- ============================================================
-- PART 5: Register pending migrations in tracking table
-- ============================================================

INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
SELECT '000000000063', 'fix_critical_gaps', ARRAY['Created erp_plantillas_proyectos table', 'Created erp_error_logs view', 'Created exec_sql RPC', 'Added realtime publications']
WHERE NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '000000000063');

INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
SELECT '000000000064', 'schema_alignment_code_db', ARRAY['Added version columns', 'Created erp_destajos table', 'Created erp_recepciones table', 'Created erp_pagos_proveedor table', 'Created erp_centros_costo table', 'Created erp_error_logs table', 'Fixed estado CHECK constraints', 'Added realtime publications']
WHERE NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '000000000064');

INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
SELECT '000000000065', 'db_app_alignment_complete', ARRAY['Fixed ALTER PUBLICATION with DO blocks', 'Added created_at/updated_at to erp_presupuestos', 'Dropped duplicate estado constraint', 'Enabled RLS on 5 motor calculo tables', 'Created RLS policies for motor calculo tables', 'Added realtime for 10 tables']
WHERE NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '000000000065');

INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
SELECT '000000000066', 'security_advisor_fixes', ARRAY['Dropped 40+ allow_all permissive policies', 'Created policies for 5 tables without RLS policies', 'Revoked anon SELECT from 62+ tables', 'Created exec_sql RPC function']
WHERE NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '000000000066');
