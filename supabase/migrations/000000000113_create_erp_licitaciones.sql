-- ============================================================================
-- MIGRACIÓN 113: Crear tabla erp_licitaciones
-- Fecha: 2026-07-16
-- Motivo: La tabla no existe en DB. forceSync falla silenciosamente para
--         addLicitacion/updateLicitacion/deleteLicitacion.
-- Schema fuente: src/erp/store/schemas/gestion.ts → licitacionSchema
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.erp_licitaciones (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id  uuid        NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  nombre       text        NOT NULL DEFAULT '',
  cliente      text        NOT NULL DEFAULT '',
  monto        numeric(14,2) NOT NULL DEFAULT 0,
  fecha_limite date,
  estado       text        NOT NULL DEFAULT 'activa'
    CHECK (estado IN ('activa','adjudicada','perdida','cerrada')),
  probabilidad integer     NOT NULL DEFAULT 50
    CHECK (probabilidad BETWEEN 0 AND 100),
  documentos   jsonb       NOT NULL DEFAULT '[]'::jsonb,
  notas        text,
  created_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Trigger updated_at ───────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_erp_licitaciones_updated ON public.erp_licitaciones;
CREATE TRIGGER trg_erp_licitaciones_updated
  BEFORE UPDATE ON public.erp_licitaciones
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_erp_licitaciones_proyecto
  ON public.erp_licitaciones(proyecto_id);

CREATE INDEX IF NOT EXISTS idx_erp_licitaciones_estado
  ON public.erp_licitaciones(estado);

CREATE INDEX IF NOT EXISTS idx_erp_licitaciones_created_at
  ON public.erp_licitaciones(created_at DESC);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.erp_licitaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "licitaciones_select" ON public.erp_licitaciones;
CREATE POLICY "licitaciones_select" ON public.erp_licitaciones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND rol IN ('Administrador','Gerente','Residente','Compras')
    )
  );

DROP POLICY IF EXISTS "licitaciones_insert" ON public.erp_licitaciones;
CREATE POLICY "licitaciones_insert" ON public.erp_licitaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND rol IN ('Administrador','Gerente')
    )
  );

DROP POLICY IF EXISTS "licitaciones_update" ON public.erp_licitaciones;
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

DROP POLICY IF EXISTS "licitaciones_delete" ON public.erp_licitaciones;
CREATE POLICY "licitaciones_delete" ON public.erp_licitaciones
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND rol IN ('Administrador','Gerente')
    )
  );

-- ── GRANTs para service_role y authenticated ─────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_licitaciones TO authenticated;
GRANT ALL ON public.erp_licitaciones TO service_role;

-- ── Realtime ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.erp_licitaciones;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;

-- ── Auditoría ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'fn_audit_log'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE $audit$
      DROP TRIGGER IF EXISTS trg_audit_erp_licitaciones ON public.erp_licitaciones;
      CREATE TRIGGER trg_audit_erp_licitaciones
        AFTER INSERT OR UPDATE OR DELETE ON public.erp_licitaciones
        FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
    $audit$;
  END IF;
END $$;
