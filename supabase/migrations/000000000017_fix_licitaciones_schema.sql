-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 17: CORREGIR SCHEMA LICITACIONES
-- Versión: 2026-06-10
--
-- 1. Agrega columna probabilidad a erp_licitaciones
--    La columna nombre ya existe (se usará como título desde TS)
--    La columna created_at ya existe (se usará como fechaCreación desde TS)
-- ============================================================

-- Agregar probabilidad (opcional, para pipeline ponderado en CRM)
ALTER TABLE erp_licitaciones
  ADD COLUMN IF NOT EXISTS probabilidad INTEGER DEFAULT 50 CHECK (probabilidad >= 0 AND probabilidad <= 100);
