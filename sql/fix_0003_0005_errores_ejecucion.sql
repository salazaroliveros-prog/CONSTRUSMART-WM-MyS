-- ============================================================
-- CONSTRUSMART ERP - Fix errores de ejecución en migraciones 0003 y 0005
-- Generado: 2026-06-03
--
-- ERRORES REPORTADOS:
-- 1) 0003: POLICY "erp_auditoria_select" already exists
-- 2) 0005: Cannot drop fn_force_administrator_unique (trigger depends on it)
-- 3) 0005: syntax error at or near "BEGIN" (DO $$ block)
-- ============================================================

-- ============================================================
-- PASO 1: Agregar DROP en erp_auditoria_select antes de crearla
-- ============================================================
-- Ya existe la política y la tabla. Solo aseguramos que esté correcta.
DROP POLICY IF EXISTS "erp_auditoria_select" ON public.erp_auditoria;
CREATE POLICY "erp_auditoria_select"
  ON public.erp_auditoria FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('Administrador','Gerente'))
  );

-- ============================================================
-- PASO 2: Función unique administrator - DROP con CASCADE
-- ============================================================
-- El trigger depende de la función, por eso necesitamos CASCADE
-- para eliminar ambos a la vez y luego recrearlos
DROP FUNCTION IF EXISTS public.fn_force_administrator_unique() CASCADE;

CREATE OR REPLACE FUNCTION public.fn_force_administrator_unique()
RETURNS TRIGGER AS $$
DECLARE
  v_email text;
BEGIN
  IF NEW.rol = 'Administrador' THEN
    SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;
    IF v_email != 'salazaroliveros@gmail.com' THEN
      NEW.rol := 'Gerente';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_force_administrator_unique
  BEFORE INSERT OR UPDATE OF rol ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_force_administrator_unique();

-- ============================================================
-- PASO 3: RPC verificar_rol_usuario actualizado con lógica de email
-- ============================================================
DROP FUNCTION IF EXISTS public.verificar_rol_usuario() CASCADE;

CREATE OR REPLACE FUNCTION public.verificar_rol_usuario()
RETURNS TABLE (
  usuario_id uuid,
  rol text,
  nombre text,
  authenticated boolean
) AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  
  RETURN QUERY
  SELECT
    p.id,
    CASE 
      WHEN v_email = 'salazaroliveros@gmail.com' THEN 'Administrador'::text
      WHEN p.rol = 'Administrador' AND v_email != 'salazaroliveros@gmail.com' THEN 'Gerente'::text
      ELSE p.rol
    END,
    p.nombre,
    (auth.uid() IS NOT NULL) AS authenticated
  FROM public.profiles p
  WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.verificar_rol_usuario() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verificar_rol_usuario() TO authenticated;

-- ============================================================
-- PASO 4: Migrar Administradores no autorizados a Gerente
-- ============================================================
UPDATE public.profiles
SET rol = 'Gerente'
WHERE rol = 'Administrador'
  AND id IN (
    SELECT id FROM auth.users 
    WHERE email != 'salazaroliveros@gmail.com'
  );

-- ============================================================
-- PASO 5: Verificación
-- ============================================================
-- Ejecutar después:
-- SELECT * FROM public.verificar_rol_usuario();
-- SELECT * FROM pg_policies WHERE schemaname = 'public' AND policyname = 'erp_auditoria_select';