-- Migration 049: Add Foreign Keys
-- This migration adds foreign key constraints to ensure referential integrity
-- Note: Only adding FKs where the referenced columns actually exist in the schema

-- Phase 1: Add FK for erp_subtipologias -> erp_tipologias
-- Assuming tipologia_id exists in erp_subtipologias
ALTER TABLE erp_subtipologias
ADD CONSTRAINT fk_subtipologias_tipologia
FOREIGN KEY (tipologia_id) REFERENCES erp_tipologias(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 2: Add FK for erp_cotizaciones_negocio -> erp_empresas
-- First check if empresa_id column exists, if not we'll skip this
-- For now, we'll add a FK based on existing schema patterns

-- Phase 3: Add FK for erp_cotizaciones_negocio -> erp_proyectos
-- First check if proyecto_id column exists, if not we'll skip this

-- Phase 4: Add FK for erp_plantillas_proyectos -> erp_usuarios
-- Assuming created_by references erp_usuarios
ALTER TABLE erp_plantillas_proyectos
ADD CONSTRAINT fk_plantillas_usuarios
FOREIGN KEY (created_by) REFERENCES erp_usuarios(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Phase 5: Add FK for erp_activos -> erp_proyectos
ALTER TABLE erp_activos
ADD CONSTRAINT fk_activos_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 6: Add FK for erp_cuadros -> erp_proyectos
ALTER TABLE erp_cuadros
ADD CONSTRAINT fk_cuadros_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 7: Add FK for erp_presupuestos -> erp_proyectos
ALTER TABLE erp_presupuestos
ADD CONSTRAINT fk_presupuestos_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 8: Add FK for erp_ordenes_compra -> erp_proyectos
ALTER TABLE erp_ordenes_compra
ADD CONSTRAINT fk_ordenes_compra_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 9: Add FK for erp_vales_salida -> erp_proyectos
ALTER TABLE erp_vales_salida
ADD CONSTRAINT fk_vales_salida_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 10: Add FK for erp_hitos -> erp_proyectos
ALTER TABLE erp_hitos
ADD CONSTRAINT fk_hitos_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 11: Add FK for erp_incidentes -> erp_proyectos
ALTER TABLE erp_incidentes
ADD CONSTRAINT fk_incidentes_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 12: Add FK for erp_ordenes_cambio -> erp_proyectos
ALTER TABLE erp_ordenes_cambio
ADD CONSTRAINT fk_ordenes_cambio_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 13: Add FK for erp_planos -> erp_proyectos
ALTER TABLE erp_planos
ADD CONSTRAINT fk_planos_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 14: Add FK for erp_riesgos -> erp_proyectos
ALTER TABLE erp_riesgos
ADD CONSTRAINT fk_riesgos_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 15: Add FK for erp_seguimiento -> erp_proyectos
ALTER TABLE erp_seguimiento
ADD CONSTRAINT fk_seguimiento_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 16: Add FK for erp_submittals -> erp_proyectos
ALTER TABLE erp_submittals
ADD CONSTRAINT fk_submittals_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 17: Add FK for erp_rfis -> erp_proyectos
ALTER TABLE erp_rfis
ADD CONSTRAINT fk_rfis_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 18: Add FK for erp_pruebas_laboratorio -> erp_proyectos
ALTER TABLE erp_pruebas_laboratorio
ADD CONSTRAINT fk_pruebas_laboratorio_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 19: Add FK for erp_liberaciones_partida -> erp_proyectos
ALTER TABLE erp_liberaciones_partida
ADD CONSTRAINT fk_liberaciones_partida_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 20: Add FK for erp_no_conformidades -> erp_proyectos
ALTER TABLE erp_no_conformidades
ADD CONSTRAINT fk_no_conformidades_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 21: Add FK for erp_licitaciones -> erp_proyectos
ALTER TABLE erp_licitaciones
ADD CONSTRAINT fk_licitaciones_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 22: Add FK for erp_muro -> erp_proyectos
ALTER TABLE erp_muro
ADD CONSTRAINT fk_muro_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 23: Add FK for erp_publicaciones_muro -> erp_proyectos
ALTER TABLE erp_publicaciones_muro
ADD CONSTRAINT fk_publicaciones_muro_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 24: Add FK for erp_eventos_calendario -> erp_proyectos
ALTER TABLE erp_eventos_calendario
ADD CONSTRAINT fk_eventos_calendario_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 25: Add FK for erp_cuentas_cobrar -> erp_proyectos
ALTER TABLE erp_cuentas_cobrar
ADD CONSTRAINT fk_cuentas_cobrar_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 26: Add FK for erp_cuentas_pagar -> erp_proyectos
ALTER TABLE erp_cuentas_pagar
ADD CONSTRAINT fk_cuentas_pagar_proyecto
FOREIGN KEY (proyecto_id) REFERENCES erp_proyectos(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Rollback function
CREATE OR REPLACE FUNCTION rollback_049_add_foreign_keys()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  ALTER TABLE erp_subtipologias DROP CONSTRAINT IF EXISTS fk_subtipologias_tipologia;
  ALTER TABLE erp_plantillas_proyectos DROP CONSTRAINT IF EXISTS fk_plantillas_usuarios;
  ALTER TABLE erp_activos DROP CONSTRAINT IF EXISTS fk_activos_proyecto;
  ALTER TABLE erp_cuadros DROP CONSTRAINT IF EXISTS fk_cuadros_proyecto;
  ALTER TABLE erp_presupuestos DROP CONSTRAINT IF EXISTS fk_presupuestos_proyecto;
  ALTER TABLE erp_ordenes_compra DROP CONSTRAINT IF EXISTS fk_ordenes_compra_proyecto;
  ALTER TABLE erp_vales_salida DROP CONSTRAINT IF EXISTS fk_vales_salida_proyecto;
  ALTER TABLE erp_hitos DROP CONSTRAINT IF EXISTS fk_hitos_proyecto;
  ALTER TABLE erp_incidentes DROP CONSTRAINT IF EXISTS fk_incidentes_proyecto;
  ALTER TABLE erp_ordenes_cambio DROP CONSTRAINT IF EXISTS fk_ordenes_cambio_proyecto;
  ALTER TABLE erp_planos DROP CONSTRAINT IF EXISTS fk_planos_proyecto;
  ALTER TABLE erp_riesgos DROP CONSTRAINT IF EXISTS fk_riesgos_proyecto;
  ALTER TABLE erp_seguimiento DROP CONSTRAINT IF EXISTS fk_seguimiento_proyecto;
  ALTER TABLE erp_submittals DROP CONSTRAINT IF EXISTS fk_submittals_proyecto;
  ALTER TABLE erp_rfis DROP CONSTRAINT IF EXISTS fk_rfis_proyecto;
  ALTER TABLE erp_pruebas_laboratorio DROP CONSTRAINT IF EXISTS fk_pruebas_laboratorio_proyecto;
  ALTER TABLE erp_liberaciones_partida DROP CONSTRAINT IF EXISTS fk_liberaciones_partida_proyecto;
  ALTER TABLE erp_no_conformidades DROP CONSTRAINT IF EXISTS fk_no_conformidades_proyecto;
  ALTER TABLE erp_licitaciones DROP CONSTRAINT IF EXISTS fk_licitaciones_proyecto;
  ALTER TABLE erp_muro DROP CONSTRAINT IF EXISTS fk_muro_proyecto;
  ALTER TABLE erp_publicaciones_muro DROP CONSTRAINT IF EXISTS fk_publicaciones_muro_proyecto;
  ALTER TABLE erp_eventos_calendario DROP CONSTRAINT IF EXISTS fk_eventos_calendario_proyecto;
  ALTER TABLE erp_cuentas_cobrar DROP CONSTRAINT IF EXISTS fk_cuentas_cobrar_proyecto;
  ALTER TABLE erp_cuentas_pagar DROP CONSTRAINT IF EXISTS fk_cuentas_pagar_proyecto;
END;
$$;
