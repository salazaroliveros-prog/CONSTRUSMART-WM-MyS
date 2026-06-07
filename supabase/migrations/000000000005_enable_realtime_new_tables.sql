-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 5: ACTIVAR REALTIME
-- Versión: 2026-07-06
--
-- Publica todas las tablas nuevas en la publicación
-- supabase_realtime para que funcionen los subscriptions
-- en vivo desde el frontend.
-- ============================================================

-- Publicar tablas nuevas en supabase_realtime
ALTER PUBLICATION supabase_realtime ADD TABLE erp_insumos_base;
ALTER PUBLICATION supabase_realtime ADD TABLE erp_rendimientos_cuadrilla;
ALTER PUBLICATION supabase_realtime ADD TABLE erp_auditoria;
ALTER PUBLICATION supabase_realtime ADD TABLE erp_licitaciones;
ALTER PUBLICATION supabase_realtime ADD TABLE erp_hitos;
ALTER PUBLICATION supabase_realtime ADD TABLE erp_riesgos;
ALTER PUBLICATION supabase_realtime ADD TABLE erp_cuentas_cobrar;
ALTER PUBLICATION supabase_realtime ADD TABLE erp_cuentas_pagar;
ALTER PUBLICATION supabase_realtime ADD TABLE erp_ordenes_cambio;
ALTER PUBLICATION supabase_realtime ADD TABLE erp_muro;
ALTER PUBLICATION supabase_realtime ADD TABLE erp_incidentes;
ALTER PUBLICATION supabase_realtime ADD TABLE erp_pruebas_laboratorio;
ALTER PUBLICATION supabase_realtime ADD TABLE erp_no_conformidades;
ALTER PUBLICATION supabase_realtime ADD TABLE erp_liberaciones_partida;

-- ============================================================
-- FIN MIGRACIÓN 5
-- ============================================================