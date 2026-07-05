-- Migration: Add history column to erp_proyecto_weather
-- This stores daily weather snapshots for the history chart

ALTER TABLE erp_proyecto_weather
ADD COLUMN IF NOT EXISTS history JSONB NOT NULL DEFAULT '[]';

COMMENT ON COLUMN erp_proyecto_weather.history IS 'Daily weather history snapshots for chart display (last 60 entries)';
