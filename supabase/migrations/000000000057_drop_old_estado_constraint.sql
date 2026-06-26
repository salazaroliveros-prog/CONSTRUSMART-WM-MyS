-- Migration 057: Drop old estado constraint to allow data correction
-- Purpose: Remove existing constraint that conflicts with valid state values
-- Risk: Low - removing constraint temporarily
-- Rollback: Re-add constraint (but we'll use the new one from migration 051)

ALTER TABLE erp_proyectos DROP CONSTRAINT IF EXISTS erp_proyectos_estado_check;
