-- Migración 134: endurecer proyecto_weather y limpiar políticas duplicadas sobrantes
-- Corrige INSERT/UPDATE/DELETE permisivos en erp_proyecto_weather
-- Elimina políticas duplicadas/intermedias innecesarias

-- ============================================================
-- 1. erp_proyecto_weather: endurecer INSERT/UPDATE/DELETE
-- ============================================================

DROP POLICY IF EXISTS "Users can delete own proyecto weather" ON public.erp_proyecto_weather;
DROP POLICY IF EXISTS "Users can insert own proyecto weather" ON public.erp_proyecto_weather;
DROP POLICY IF EXISTS "Users can update own proyecto weather" ON public.erp_proyecto_weather;

CREATE POLICY "proyecto_weather_insert_owner" ON public.erp_proyecto_weather
  FOR INSERT TO authenticated
  WITH CHECK (
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

CREATE POLICY "proyecto_weather_update_owner" ON public.erp_proyecto_weather
  FOR UPDATE TO authenticated
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

CREATE POLICY "proyecto_weather_delete_owner" ON public.erp_proyecto_weather
  FOR DELETE TO authenticated
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
-- 2. erp_publicaciones_muro: eliminar políticas duplicadas sobrantes
-- ============================================================

DROP POLICY IF EXISTS "Users can insert own publicaciones" ON public.erp_publicaciones_muro;

-- ============================================================
-- 3. erp_reglas_factores: mantener solo políticas de rol explícitas
-- ============================================================

-- reglas_factores_read_all - demasiado permisiva (true para cualquier autenticado)
-- Si las reglas deben ser visibles solo por Admin/Gerente, endurecer aquí.
-- Por ahora se mantiene abierta porque el código de cálculo la necesita.
