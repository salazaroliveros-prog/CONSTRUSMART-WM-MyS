-- Security Fixes Migration (Simplified)
-- Priority HIGH and MEDIUM fixes based on security audit

-- 1. REVOKE ANON SELECT FROM SENSITIVE TABLES
-- ==========================================

-- Revoke SELECT from anon on financial and sensitive tables
REVOKE SELECT ON TABLE erp_ordenes_compra FROM anon;
REVOKE SELECT ON TABLE erp_cuentas_cobrar FROM anon;
REVOKE SELECT ON TABLE erp_cuentas_pagar FROM anon;
REVOKE SELECT ON TABLE erp_vales_salida FROM anon;
REVOKE SELECT ON TABLE erp_movimientos FROM anon;
REVOKE SELECT ON TABLE erp_empleados FROM anon;
REVOKE SELECT ON TABLE erp_usuarios FROM anon;
REVOKE SELECT ON TABLE erp_notificaciones FROM anon;
REVOKE SELECT ON TABLE erp_auditoria FROM anon;

-- 2. ENSURE RLS ON LOGS TABLE (if exists)
-- =======================================

-- Check if logs_sistema exists and enable RLS
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'logs_sistema') THEN
    ALTER TABLE logs_sistema ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Admins can view logs" ON logs_sistema;
    DROP POLICY IF EXISTS "System can insert logs" ON logs_sistema;
    DROP POLICY IF EXISTS "No delete on logs" ON logs_sistema;
    DROP POLICY IF EXISTS "No update on logs" ON logs_sistema;

    -- Create restrictive policies for logs
    CREATE POLICY "Admins can view logs"
      ON logs_sistema
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM erp_usuarios
          WHERE id = auth.uid() AND rol = 'Administrador'
        )
      );

    CREATE POLICY "System can insert logs"
      ON logs_sistema
      FOR INSERT
      WITH CHECK (true);

    CREATE POLICY "No delete on logs"
      ON logs_sistema
      FOR DELETE
      USING (false);

    CREATE POLICY "No update on logs"
      ON logs_sistema
      FOR UPDATE
      USING (false);
  END IF;
END $$;
