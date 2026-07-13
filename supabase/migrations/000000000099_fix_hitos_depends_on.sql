-- Migration 099: No-op / idempotent
-- Nota: la columna `depends_on` no está presente en la tabla actual `erp_hitos`.
-- Esta migración solo corrigía el tipo/nombre de esa columna; como no existe,
-- se marca como no-op para no bloquear migraciones posteriores.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'erp_hitos'
      AND column_name = 'depends_on'
  ) THEN
    ALTER TABLE erp_hitos
      ALTER COLUMN depends_on TYPE jsonb
      USING CASE
        WHEN depends_on IS NULL THEN NULL
        WHEN depends_on = '' THEN '[]'::jsonb
        ELSE depends_on::jsonb
      END;

    ALTER TABLE erp_hitos RENAME COLUMN depends_on TO depende_de;
  END IF;
END $$;
