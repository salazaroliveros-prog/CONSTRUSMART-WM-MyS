-- ============================================================================
-- MIGRACIÓN 110: Restaurar políticas RLS eliminadas en erp_notificaciones
-- y corregir acceso a erp_activos (403 en producción)
-- La migración 108 eliminó todas las policies de erp_notificaciones
-- sin reponerlas, dejando la tabla inaccesible.
-- ============================================================================

-- ── erp_notificaciones ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "notificaciones_select"  ON public.erp_notificaciones;
DROP POLICY IF EXISTS "notificaciones_insert"  ON public.erp_notificaciones;
DROP POLICY IF EXISTS "notificaciones_update"  ON public.erp_notificaciones;
DROP POLICY IF EXISTS "notificaciones_delete"  ON public.erp_notificaciones;

CREATE POLICY "notificaciones_select" ON public.erp_notificaciones
  FOR SELECT TO authenticated
  USING (
    usuario_id = auth.uid()
    OR usuario_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador', 'Gerente')
    )
  );

CREATE POLICY "notificaciones_insert" ON public.erp_notificaciones
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "notificaciones_update" ON public.erp_notificaciones
  FOR UPDATE TO authenticated
  USING (
    usuario_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador', 'Gerente')
    )
  );

CREATE POLICY "notificaciones_delete" ON public.erp_notificaciones
  FOR DELETE TO authenticated
  USING (
    usuario_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador', 'Gerente')
    )
  );

-- ── erp_activos (403 → authenticated con RLS permisivo por rol) ────────────

DROP POLICY IF EXISTS "activos_select"  ON public.erp_activos;
DROP POLICY IF EXISTS "activos_insert"  ON public.erp_activos;
DROP POLICY IF EXISTS "activos_update"  ON public.erp_activos;
DROP POLICY IF EXISTS "activos_delete"  ON public.erp_activos;

CREATE POLICY "activos_select" ON public.erp_activos
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "activos_insert" ON public.erp_activos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador', 'Gerente', 'Compras', 'Bodeguero')
    )
  );

CREATE POLICY "activos_update" ON public.erp_activos
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador', 'Gerente', 'Compras', 'Bodeguero')
    )
  );

CREATE POLICY "activos_delete" ON public.erp_activos
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol IN ('Administrador', 'Gerente')
    )
  );
