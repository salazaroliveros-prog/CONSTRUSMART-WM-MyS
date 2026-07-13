-- ============================================================
-- MIGRACIÓN 069: Anon Access for Initial Load
-- ============================================================
-- El frontend carga datos sin autenticación usando key anon.
-- Estos GRANTS y políticas permiten que el anon pueda leer
-- tablas críticas para el dashboard inicial.
-- ============================================================

-- erp_notificaciones table might not exist - skip operations on it
-- These can be re-enabled if/when the table is created

-- Grant SELECT on tables to anon role (required for RLS to work with anon)
-- erp_proyectos: tabla principal para dashboard
GRANT SELECT ON TABLE erp_proyectos TO anon;

DROP POLICY IF EXISTS "proyectos_anon_read" ON erp_proyectos;
CREATE POLICY "proyectos_anon_read" ON erp_proyectos FOR SELECT TO anon USING (true);

