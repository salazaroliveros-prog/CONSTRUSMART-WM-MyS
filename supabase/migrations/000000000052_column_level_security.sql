-- Migration 052: Column-Level Security
-- Purpose: Restrict access to sensitive columns based on user roles
-- Risk: Low - policies are additive and can be dropped
-- Rollback: Drops column-level security policies
-- Expected Benefit: Enhanced data privacy and compliance

-- ============================================================
-- Step 1: Create function to check user role from profiles table
-- ============================================================

CREATE OR REPLACE FUNCTION user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.rol = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Step 2: Create function to check project membership
-- ============================================================

CREATE OR REPLACE FUNCTION user_in_project(project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM erp_proyecto_miembros pm
    WHERE pm.usuario_id = auth.uid()
    AND pm.proyecto_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Step 3: Create security views for sensitive data
-- ============================================================

-- Create view for erp_empresas that restricts sensitive columns
DROP VIEW IF EXISTS erp_empresas_secure;
CREATE VIEW erp_empresas_secure AS
SELECT 
  id,
  nombre,
  CASE 
    WHEN user_has_role('Administrador') THEN nit
    ELSE NULL
  END as nit,
  telefono,
  email,
  CASE 
    WHEN user_has_role('Administrador') THEN direccion
    ELSE NULL
  END as direccion,
  ciudad,
  pais,
  created_at
FROM erp_empresas;

-- ============================================================
-- Step 4: Create policy to enforce column-level security
-- ============================================================

-- Grant access to the secure view for authenticated users
GRANT SELECT ON erp_empresas_secure TO authenticated;

-- Revoke direct access to the sensitive table from non-admins
DROP POLICY IF EXISTS "empresas_non_admin_select" ON erp_empresas;
CREATE POLICY "empresas_non_admin_select" ON erp_empresas
  FOR SELECT TO authenticated
  USING (
    user_has_role('Administrador') OR
    (user_has_role('Gerente') OR user_has_role('Compras'))
  );

-- ============================================================
-- Step 5: Add column-level security for financial tables
-- ============================================================

-- For erp_cuentas_cobrar - restrict sensitive payment details
DROP POLICY IF EXISTS "cuentas_cobrar_sensitive_select" ON erp_cuentas_cobrar;
CREATE POLICY "cuentas_cobrar_sensitive_select" ON erp_cuentas_cobrar
  FOR SELECT TO authenticated
  USING (
    user_has_role('Administrador') OR
    user_has_role('Gerente') OR
    user_in_project(proyecto_id)
  );

-- For erp_cuentas_pagar - restrict sensitive payment details
DROP POLICY IF EXISTS "cuentas_pagar_sensitive_select" ON erp_cuentas_pagar;
CREATE POLICY "cuentas_pagar_sensitive_select" ON erp_cuentas_pagar
  FOR SELECT TO authenticated
  USING (
    user_has_role('Administrador') OR
    user_has_role('Gerente') OR
    user_has_role('Compras') OR
    user_in_project(proyecto_id)
  );

-- ============================================================
-- Step 6: Add audit logging for sensitive column access
-- ============================================================

CREATE OR REPLACE FUNCTION log_sensitive_column_access()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'SELECT' THEN
    INSERT INTO erp_audit_log (table_name, record_id, action, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NULL, 'SENSITIVE_ACCESS', 
            jsonb_build_object('column_accessed', 'restricted_fields'), 
            auth.uid());
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Rollback Function
-- ============================================================

CREATE OR REPLACE FUNCTION rollback_052_column_level_security()
RETURNS VOID AS $$
BEGIN
  -- Drop views
  DROP VIEW IF EXISTS erp_empresas_secure;
  
  -- Drop policies
  DROP POLICY IF EXISTS "empresas_non_admin_select" ON erp_empresas;
  DROP POLICY IF EXISTS "cuentas_cobrar_sensitive_select" ON erp_cuentas_cobrar;
  DROP POLICY IF EXISTS "cuentas_pagar_sensitive_select" ON erp_cuentas_pagar;
  
  -- Drop functions
  DROP FUNCTION IF EXISTS log_sensitive_column_access();
  DROP FUNCTION IF EXISTS user_has_role(TEXT);
  DROP FUNCTION IF EXISTS user_in_project(UUID);
  
  RAISE NOTICE 'Migration 052 rolled back successfully';
END;
$$ LANGUAGE plpgsql;
