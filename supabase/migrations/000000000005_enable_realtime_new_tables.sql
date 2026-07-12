-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 5: ACTIVAR REALTIME
-- Versión: 2026-07-06
--
-- Publica todas las tablas nuevas en la publicación
-- supabase_realtime para que funcionen los subscriptions
-- en vivo desde el frontend.
-- ============================================================

-- Publicar tablas nuevas en supabase_realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_insumos_base') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_insumos_base;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_rendimientos_cuadrilla') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_rendimientos_cuadrilla;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_auditoria') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_auditoria;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_licitaciones') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_licitaciones;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_hitos') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_hitos;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_riesgos') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_riesgos;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_cuentas_cobrar') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_cuentas_cobrar;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_cuentas_pagar') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_cuentas_pagar;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_ordenes_cambio') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_ordenes_cambio;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_muro') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_muro;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_incidentes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_incidentes;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_pruebas_laboratorio') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_pruebas_laboratorio;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_no_conformidades') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_no_conformidades;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_liberaciones_partida') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_liberaciones_partida;
  END IF;
END $$;

-- ============================================================
-- FIN MIGRACIÓN 5
-- ============================================================