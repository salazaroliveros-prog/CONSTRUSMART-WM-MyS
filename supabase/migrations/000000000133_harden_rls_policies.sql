-- Migración 133: endurecer políticas RLS problemáticas
-- Corrige políticas permisivas/incorrectas detectadas en auditoría manual

-- ============================================================
-- 1. erp_publicaciones_muro: eliminar políticas con OR true (bug crítico)
-- ============================================================

DROP POLICY IF EXISTS "Users can delete own publicaciones" ON public.erp_publicaciones_muro;
DROP POLICY IF EXISTS "Users can read own proyecto publicaciones" ON public.erp_publicaciones_muro;
DROP POLICY IF EXISTS "Users can update own publicaciones" ON public.erp_publicaciones_muro;

-- ============================================================
-- 2. erp_proyecto_weather: endurecer SELECT (era {public} true)
-- ============================================================

DROP POLICY IF EXISTS "Users can read own proyecto weather" ON public.erp_proyecto_weather;

CREATE POLICY "proyecto_weather_read_owner" ON public.erp_proyecto_weather
  FOR SELECT TO authenticated
  USING (
    proyecto_id IN (
      SELECT erp_proyectos.id
      FROM erp_proyectos
      WHERE erp_proyectos.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol = ANY (ARRAY['Administrador'::text, 'Gerente'::text])
    )
  );

-- ============================================================
-- 3. erp_reglas_factores: endurecer escritura (era {public} authenticated)
-- ============================================================

DROP POLICY IF EXISTS "reglas_factor_escritura_admins" ON public.erp_reglas_factores;

CREATE POLICY "reglas_factor_write_admin" ON public.erp_reglas_factores
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol = ANY (ARRAY['Administrador'::text, 'Gerente'::text])
    )
  );

CREATE POLICY "reglas_factor_update_admin" ON public.erp_reglas_factores
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol = ANY (ARRAY['Administrador'::text, 'Gerente'::text])
    )
  );

-- Mantener reglas_factor_lectura_autenticados y reglas_factores_read_all
-- (lectura abierta a autenticados es aceptable para datos de referencia)

-- ============================================================
-- 4. erp_plantillas_proyectos: endurecer INSERT/UPDATE (era {public} authenticated)
-- ============================================================

DROP POLICY IF EXISTS "plantillas_insert_own" ON public.erp_plantillas_proyectos;
DROP POLICY IF EXISTS "plantillas_update_own" ON public.erp_plantillas_proyectos;

CREATE POLICY "plantillas_insert_admin" ON public.erp_plantillas_proyectos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol = ANY (ARRAY['Administrador'::text, 'Gerente'::text])
    )
  );

CREATE POLICY "plantillas_update_admin" ON public.erp_plantillas_proyectos
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol = ANY (ARRAY['Administrador'::text, 'Gerente'::text])
    )
  );

-- Eliminar plantillas_delete_admin (hardcodeo de email) y reemplazar por política de rol
DROP POLICY IF EXISTS "plantillas_delete_admin" ON public.erp_plantillas_proyectos;

CREATE POLICY "plantillas_delete_admin" ON public.erp_plantillas_proyectos
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.rol = ANY (ARRAY['Administrador'::text, 'Gerente'::text])
    )
  );
