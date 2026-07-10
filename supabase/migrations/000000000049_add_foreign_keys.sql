-- Migration 049: Add Foreign Keys (idempotent)
-- Adds FK constraints only if both tables and columns exist

-- Phase 1: Add FK for erp_subtipologias -> erp_tipologias
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_subtipologias' AND relkind = 'r')
     AND EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_tipologias' AND relkind = 'r')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_subtipologias' AND column_name = 'tipologia_id') THEN
    ALTER TABLE erp_subtipologias
    ADD CONSTRAINT fk_subtipologias_tipologia
    FOREIGN KEY (tipologia_id) REFERENCES erp_tipologias(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Phase 2: Add FK for erp_plantillas_proyectos -> erp_usuarios
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_plantillas_proyectos' AND relkind = 'r')
     AND EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_usuarios' AND relkind = 'r')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'erp_plantillas_proyectos' AND column_name = 'created_by') THEN
    ALTER TABLE erp_plantillas_proyectos
    ADD CONSTRAINT fk_plantillas_usuarios
    FOREIGN KEY (created_by) REFERENCES erp_usuarios(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Phase 3: Add FK for proyecto_id referencing erp_proyectos
DO $$
DECLARE
  _tbl text;
  _tbls text[] := ARRAY[
    'erp_activos','erp_cuadros','erp_presupuestos','erp_ordenes_compra',
    'erp_vales_salida','erp_hitos','erp_incidentes','erp_ordenes_cambio',
    'erp_planos','erp_riesgos','erp_seguimiento','erp_submittals',
    'erp_rfis','erp_pruebas_laboratorio','erp_liberaciones_partida',
    'erp_no_conformidades','erp_licitaciones','erp_muro','erp_publicaciones_muro',
    'erp_eventos_calendario','erp_cuentas_cobrar','erp_cuentas_pagar'
  ];
  _con_name text;
BEGIN
  FOREACH _tbl IN ARRAY _tbls LOOP
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = _tbl AND relkind = 'r')
       AND EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_proyectos' AND relkind = 'r')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = _tbl AND column_name = 'proyecto_id') THEN
      _con_name := 'fk_' || replace(_tbl, 'erp_', '') || '_proyecto';
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id) ON DELETE RESTRICT ON UPDATE CASCADE',
        _tbl, _con_name);
    END IF;
  END LOOP;
END $$;

-- Rollback function
CREATE OR REPLACE FUNCTION rollback_049_add_foreign_keys()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE NOTICE 'Rollback not implemented for idempotent migration 049';
END;
$$;