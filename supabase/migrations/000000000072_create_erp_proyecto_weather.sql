-- Migration: Create erp_proyecto_weather table for Weather Dashboard module
-- Stores weather data, impact analysis, construction metrics per project

CREATE TABLE IF NOT EXISTS erp_proyecto_weather (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  weather_data JSONB,
  impact JSONB,
  construction_metrics JSONB,
  scheduling_windows JSONB,
  history JSONB NOT NULL DEFAULT '[]',
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(proyecto_id)
);

ALTER TABLE erp_proyecto_weather ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own proyecto weather" ON erp_proyecto_weather;
CREATE POLICY "Users can read own proyecto weather"
  ON erp_proyecto_weather FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own proyecto weather" ON erp_proyecto_weather;
CREATE POLICY "Users can insert own proyecto weather"
  ON erp_proyecto_weather FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own proyecto weather" ON erp_proyecto_weather;
CREATE POLICY "Users can update own proyecto weather"
  ON erp_proyecto_weather FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own proyecto weather" ON erp_proyecto_weather;
CREATE POLICY "Users can delete own proyecto weather"
  ON erp_proyecto_weather FOR DELETE
  USING (true);

COMMENT ON TABLE erp_proyecto_weather IS 'Weather data and construction impact metrics per project';
COMMENT ON COLUMN erp_proyecto_weather.weather_data IS 'Current weather + 7-day forecast from OpenWeatherMap';
COMMENT ON COLUMN erp_proyecto_weather.impact IS 'Calculated weather impact score, level, factors, and recommendations';
COMMENT ON COLUMN erp_proyecto_weather.construction_metrics IS 'Concrete curing, equipment, workforce safety, material protection metrics';
COMMENT ON COLUMN erp_proyecto_weather.scheduling_windows IS 'Daily scheduling suitability windows for construction activities';
COMMENT ON COLUMN erp_proyecto_weather.history IS 'Daily weather history snapshots for chart display (last 60 entries)';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'erp_proyecto_weather'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_proyecto_weather;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_erp_proyecto_weather_proyecto_id ON erp_proyecto_weather(proyecto_id);
