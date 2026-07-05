-- Migration: Create erp_proyecto_weather table for weather data persistence
-- This table stores weather and environmental conditions data for each project

-- Create the table
CREATE TABLE IF NOT EXISTS erp_proyecto_weather (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  
  -- Weather data from OpenWeatherMap API
  weather_data JSONB NOT NULL DEFAULT '{}',
  
  -- Calculated impact metrics
  impact JSONB NOT NULL DEFAULT '{}',
  
  -- Construction-specific metrics
  construction_metrics JSONB NOT NULL DEFAULT '{}',
  
  -- Scheduling windows (7-day forecast)
  scheduling_windows JSONB NOT NULL DEFAULT '[]',
  
  -- Historical impact data
  historical_impact JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_proyecto_weather UNIQUE (proyecto_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_proyecto_weather_proyecto_id ON erp_proyecto_weather(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_proyecto_weather_last_updated ON erp_proyecto_weather(last_updated DESC);

-- Enable RLS
ALTER TABLE erp_proyecto_weather ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to read weather data
CREATE POLICY "Allow authenticated read" ON erp_proyecto_weather
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert weather data
CREATE POLICY "Allow authenticated insert" ON erp_proyecto_weather
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update weather data
CREATE POLICY "Allow authenticated update" ON erp_proyecto_weather
  FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete weather data
CREATE POLICY "Allow authenticated delete" ON erp_proyecto_weather
  FOR DELETE
  TO authenticated
  USING (true);

-- Enable realtime for weather data
ALTER PUBLICATION supabase_realtime ADD TABLE erp_proyecto_weather;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_proyecto_weather_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_proyecto_weather_updated_at
  BEFORE UPDATE ON erp_proyecto_weather
  FOR EACH ROW
  EXECUTE FUNCTION update_proyecto_weather_updated_at();

-- Add audit trigger
CREATE TRIGGER trigger_audit_proyecto_weather
  AFTER INSERT OR UPDATE OR DELETE ON erp_proyecto_weather
  FOR EACH ROW
  EXECUTE FUNCTION audit_log();

-- Comment
COMMENT ON TABLE erp_proyecto_weather IS 'Weather and environmental conditions data for construction projects';
COMMENT ON COLUMN erp_proyecto_weather.weather_data IS 'Raw weather data from OpenWeatherMap API including current conditions and forecast';
COMMENT ON COLUMN erp_proyecto_weather.impact IS 'Calculated weather impact analysis (level, score, factors, recommendations)';
COMMENT ON COLUMN erp_proyecto_weather.construction_metrics IS 'Construction-specific metrics (concrete curing, workforce safety, equipment operation, material protection)';
COMMENT ON COLUMN erp_proyecto_weather.scheduling_windows IS '7-day scheduling windows with suitability scores and recommended activities';
COMMENT ON COLUMN erp_proyecto_weather.historical_impact IS 'Historical weather impact analysis and correlation with project delays';
