-- ============================================================================
-- MIGRACIÓN: Fix RLS policies always true - Security Advisor
-- Elimina políticas obsoletas con USING/WITH CHECK (true)
-- ============================================================================

-- erp_licitaciones: políticas obsoletas de migration 100
DROP POLICY IF EXISTS "licitaciones_select" ON public.erp_licitaciones;
DROP POLICY IF EXISTS "licitaciones_insert" ON public.erp_licitaciones;
DROP POLICY IF EXISTS "licitaciones_update" ON public.erp_licitaciones;
DROP POLICY IF EXISTS "licitaciones_delete" ON public.erp_licitaciones;

-- erp_notificaciones: políticas obsoletas de migration 093
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer notificaciones" ON public.erp_notificaciones;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar notificaciones" ON public.erp_notificaciones;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar notificaciones" ON public.erp_notificaciones;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar notificaciones" ON public.erp_notificaciones;

-- Añadir DELETE policy faltante para erp_licitaciones (migration 103 no la creó)
DROP POLICY IF EXISTS "erp_licitaciones_delete" ON public.erp_licitaciones;
CREATE POLICY "erp_licitaciones_delete" ON public.erp_licitaciones FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);
