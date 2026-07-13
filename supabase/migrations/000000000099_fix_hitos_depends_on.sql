-- Migration 099: Fix erp_hitos depends_on column naming and type
-- Align with app schema: dependeDe (array of strings)
-- Risk: Low - column rename + type cast, data preserved as JSONB array

-- Convert depends_on from text (JSON string) to jsonb, then rename to depende_de
ALTER TABLE erp_hitos
  ALTER COLUMN depends_on TYPE jsonb
  USING CASE
    WHEN depends_on IS NULL THEN NULL
    WHEN depends_on = '' THEN '[]'::jsonb
    ELSE depends_on::jsonb
  END;

ALTER TABLE erp_hitos RENAME COLUMN depends_on TO depende_de;
