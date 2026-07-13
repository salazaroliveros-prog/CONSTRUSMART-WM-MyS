-- Fix erp_activos RLS: replace profiles references with erp_usuarios
-- Date: 2026-07-13

-- Drop existing policies that reference profiles
DROP POLICY IF EXISTS activos_read ON erp_activos;
DROP POLICY IF EXISTS activos_write ON erp_activos;
DROP POLICY IF EXISTS activos_delete ON erp_activos;

-- Recreate with erp_usuarios
CREATE POLICY activos_read ON erp_activos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY activos_write ON erp_activos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM erp_usuarios
      WHERE erp_usuarios.id = auth.uid()
        AND erp_usuarios.rol = ANY (ARRAY['Administrador'::text, 'Gerente'::text, 'Bodeguero'::text])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM erp_usuarios
      WHERE erp_usuarios.id = auth.uid()
        AND erp_usuarios.rol = ANY (ARRAY['Administrador'::text, 'Gerente'::text, 'Bodeguero'::text])
    )
  );

CREATE POLICY activos_delete ON erp_activos
  FOR DELETE
  TO authenticated
  USING (
    get_current_user_role() = 'Administrador'::text
    OR proyecto_id IN (SELECT get_accessible_proyectos())
  );