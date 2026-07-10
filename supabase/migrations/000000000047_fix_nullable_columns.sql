-- Migration 047: Fix Critical Nullable Columns (idempotent)
-- All ALTER TABLE statements wrapped in DO blocks with existence checks

-- Phase 1: Fix critical ID columns (skip views)
DO $$
DECLARE
  _tbl text;
  _tbls text[] := ARRAY['erp_activos_herramienta','erp_cuadros_comparativos','erp_incidentes_sso','erp_publicaciones_muro'];
BEGIN
  FOREACH _tbl IN ARRAY _tbls LOOP
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = _tbl AND relkind = 'r') THEN
      EXECUTE format('ALTER TABLE %I ALTER COLUMN id SET NOT NULL', _tbl);
    END IF;
  END LOOP;
END $$;

-- Phase 2: Fix proyecto_id columns (skip views, skip if column missing)
DO $$
DECLARE
  _tbl text;
  _tbls text[] := ARRAY['erp_activos','erp_cuadros','erp_cuentas_cobrar','erp_cuentas_pagar','erp_eventos_calendario','erp_hitos','erp_incidentes','erp_liberaciones_partida','erp_licitaciones','erp_muro','erp_no_conformidades','erp_notificaciones','erp_ordenes_cambio','erp_ordenes_compra','erp_planos','erp_presupuestos','erp_pruebas_laboratorio','erp_rfis','erp_riesgos','erp_seguimiento','erp_submittals','erp_vales_salida'];
BEGIN
  FOREACH _tbl IN ARRAY _tbls LOOP
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = _tbl AND relkind = 'r') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = _tbl AND column_name = 'proyecto_id') THEN
      EXECUTE format('ALTER TABLE %I ALTER COLUMN proyecto_id SET NOT NULL', _tbl);
    END IF;
  END LOOP;
END $$;

-- Phase 3: Fix created_at columns with default values
DO $$
DECLARE
  _tbl text;
  _tbls text[] := ARRAY['erp_auditoria','erp_categorias_materiales','erp_configuracion_avance','erp_contactos_proveedor','erp_empresas','erp_estados_orden','erp_insumos_base','erp_parametros_sistema','erp_partidas_cotizadas','erp_plantillas_proyectos','erp_porcentajes_avance','erp_proveedores','erp_rol_usuario','erp_subtipologias','erp_tipologias','erp_usuarios'];
BEGIN
  FOREACH _tbl IN ARRAY _tbls LOOP
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = _tbl AND relkind = 'r') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = _tbl AND column_name = 'created_at') THEN
      EXECUTE format('UPDATE %I SET created_at = NOW() WHERE created_at IS NULL', _tbl);
      EXECUTE format('ALTER TABLE %I ALTER COLUMN created_at SET NOT NULL', _tbl);
      EXECUTE format('ALTER TABLE %I ALTER COLUMN created_at SET DEFAULT NOW()', _tbl);
    END IF;
  END LOOP;
END $$;

-- Phase 4: Fix updated_at columns with default values
DO $$
DECLARE
  _tbl text;
  _tbls text[] := ARRAY['erp_auditoria','erp_categorias_materiales','erp_configuracion_avance','erp_contactos_proveedor','erp_empresas','erp_estados_orden','erp_insumos_base','erp_parametros_sistema','erp_partidas_cotizadas','erp_plantillas_proyectos','erp_porcentajes_avance','erp_proveedores','erp_rol_usuario','erp_subtipologias','erp_tipologias','erp_usuarios'];
BEGIN
  FOREACH _tbl IN ARRAY _tbls LOOP
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = _tbl AND relkind = 'r') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = _tbl AND column_name = 'updated_at') THEN
      EXECUTE format('UPDATE %I SET updated_at = NOW() WHERE updated_at IS NULL', _tbl);
      EXECUTE format('ALTER TABLE %I ALTER COLUMN updated_at SET NOT NULL', _tbl);
      EXECUTE format('ALTER TABLE %I ALTER COLUMN updated_at SET DEFAULT NOW()', _tbl);
    END IF;
  END LOOP;
END $$;

-- Rollback function (kept for compatibility)
CREATE OR REPLACE FUNCTION rollback_047_fix_nullable_columns()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE NOTICE 'Rollback not implemented for idempotent migration 047';
END;
$$;