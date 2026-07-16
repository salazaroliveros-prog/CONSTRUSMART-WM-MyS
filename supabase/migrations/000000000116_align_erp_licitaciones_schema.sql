-- ============================================================================
-- MIGRACIÓN 116: Alinear erp_licitaciones DB con licitacionSchema (app)
-- Fecha: 2026-07-16
-- Motivo: La tabla existente tiene columnas con nombres distintos al schema
--         Zod del app. Se añaden las columnas esperadas por el app, se migran
--         los datos de columnas legacy, y se corrigen constraints y policies.
--
-- DB actual            → App schema (licitacionSchema)
-- descripcion          → nombre
-- comentarios          → notas
-- fecha_creacion       → created_at (ya existe)
-- fecha_cierre         → fecha_limite (date, no timestamptz)
-- monto_estimado       → (sin equivalente directo, se mantiene)
-- estado 'pendiente'   → estado IN ('activa','adjudicada','perdida','cerrada')
-- ============================================================================

-- ── 1. Añadir columnas que espera el app (sin eliminar las legacy) ────────────
ALTER TABLE public.erp_licitaciones
  ADD COLUMN IF NOT EXISTS nombre        text          NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS fecha_limite  date,
  ADD COLUMN IF NOT EXISTS documentos    jsonb         NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notas         text;

-- ── 2. Migrar datos de columnas legacy a las nuevas ──────────────────────────
-- descripcion → nombre (si nombre está vacío)
UPDATE public.erp_licitaciones
  SET nombre = COALESCE(descripcion, '')
  WHERE nombre = '' AND descripcion IS NOT NULL AND descripcion != '';

-- comentarios → notas (si notas está NULL) - Solo si la columna comentarios existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'erp_licitaciones' 
    AND table_schema = 'public' 
    AND column_name = 'comentarios'
  ) THEN
    UPDATE public.erp_licitaciones
    SET notas = comentarios
    WHERE notas IS NULL AND comentarios IS NOT NULL AND comentarios != '';
  END IF;
END $$;

-- fecha_cierre (timestamptz) → fecha_limite (date) - Solo si la columna fecha_cierre existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'erp_licitaciones' 
    AND table_schema = 'public' 
    AND column_name = 'fecha_cierre'
  ) THEN
    UPDATE public.erp_licitaciones
    SET fecha_limite = fecha_cierre::date
    WHERE fecha_limite IS NULL AND fecha_cierre IS NOT NULL;
  END IF;
END $$;

-- ── 3. Corregir estado CHECK constraint ──────────────────────────────────────
-- Primero migrar valores legacy al nuevo enum
UPDATE public.erp_licitaciones
  SET estado = 'activa'
  WHERE estado NOT IN ('activa','adjudicada','perdida','cerrada');

-- Eliminar constraint anterior si existe y crear el correcto
ALTER TABLE public.erp_licitaciones
  DROP CONSTRAINT IF EXISTS erp_licitaciones_estado_check;

ALTER TABLE public.erp_licitaciones
  ADD CONSTRAINT erp_licitaciones_estado_check
    CHECK (estado IN ('activa','adjudicada','perdida','cerrada'));

-- Cambiar default de estado a 'activa'
ALTER TABLE public.erp_licitaciones
  ALTER COLUMN estado SET DEFAULT 'activa';

-- ── 4. Asegurar NOT NULL en columnas críticas ─────────────────────────────────
UPDATE public.erp_licitaciones SET cliente = '' WHERE cliente IS NULL;
UPDATE public.erp_licitaciones SET monto   = 0  WHERE monto IS NULL;

ALTER TABLE public.erp_licitaciones
  ALTER COLUMN proyecto_id SET NOT NULL,
  ALTER COLUMN cliente     SET NOT NULL,
  ALTER COLUMN cliente     SET DEFAULT '',
  ALTER COLUMN monto       SET NOT NULL,
  ALTER COLUMN monto       SET DEFAULT 0,
  ALTER COLUMN probabilidad SET NOT NULL,
  ALTER COLUMN probabilidad SET DEFAULT 50;

-- ── 5. Limpiar policies duplicadas ───────────────────────────────────────────
-- Hay 2 conjuntos de policies: erp_licitaciones_* y licitaciones_*
-- Eliminar las más restrictivas (erp_licitaciones_select solo permite Admin+Gerente)
-- Mantener las licitaciones_* que permiten también Residente y Compras para SELECT

DROP POLICY IF EXISTS "erp_licitaciones_select" ON public.erp_licitaciones;
DROP POLICY IF EXISTS "erp_licitaciones_insert" ON public.erp_licitaciones;
DROP POLICY IF EXISTS "erp_licitaciones_update" ON public.erp_licitaciones;
DROP POLICY IF EXISTS "erp_licitaciones_delete" ON public.erp_licitaciones;

-- Recrear licitaciones_* con WITH CHECK completo en UPDATE
DROP POLICY IF EXISTS "licitaciones_select" ON public.erp_licitaciones;
DROP POLICY IF EXISTS "licitaciones_insert" ON public.erp_licitaciones;
DROP POLICY IF EXISTS "licitaciones_update" ON public.erp_licitaciones;
DROP POLICY IF EXISTS "licitaciones_delete" ON public.erp_licitaciones;

CREATE POLICY "licitaciones_select" ON public.erp_licitaciones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND rol IN ('Administrador','Gerente','Residente','Compras')
    )
  );

CREATE POLICY "licitaciones_insert" ON public.erp_licitaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND rol IN ('Administrador','Gerente')
    )
  );

CREATE POLICY "licitaciones_update" ON public.erp_licitaciones
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND rol IN ('Administrador','Gerente')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND rol IN ('Administrador','Gerente')
    )
  );

CREATE POLICY "licitaciones_delete" ON public.erp_licitaciones
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND rol IN ('Administrador','Gerente')
    )
  );

-- ── 6. Índice para nueva columna nombre ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_erp_licitaciones_nombre
  ON public.erp_licitaciones(nombre);

-- ── 7. GRANTs (reafirmar) ─────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_licitaciones TO authenticated;
GRANT ALL ON public.erp_licitaciones TO service_role;
