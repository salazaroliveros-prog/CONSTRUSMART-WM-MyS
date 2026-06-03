-- ============================================================
-- CONSTRUSMART ERP - Forzar Administrador único
-- Solo salazaroliveros@gmail.com = Administrador
-- ============================================================

-- ============================================================
-- RPC CORREGIDO: verificar_rol_usuario
-- Ahora retorna 'Administrador' solo para el correo autorizado
-- ============================================================
DROP FUNCTION IF EXISTS public.verificar_rol_usuario();
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
-- FUNCIÓN: Forzar rol único de Administrador
-- Se ejecuta BEFORE INSERT/UPDATE en profiles
-- ============================================================
DROP FUNCTION IF EXISTS public.fn_force_administrator_unique();
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

-- ============================================================
-- TRIGGER: Forzar rol en profiles
-- Solo el correo autorizado puede ser Administrador
-- ============================================================
DROP TRIGGER IF EXISTS trg_force_administrator_unique ON public.profiles;

CREATE TRIGGER trg_force_administrator_unique
  BEFORE INSERT OR UPDATE OF rol ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_force_administrator_unique();

-- ============================================================
-- MIGRACIÓN: Asegurar que ningún usuario tenga rol Administrador
-- excepto el correo autorizado
-- ============================================================
UPDATE public.profiles
SET rol = 'Gerente'
WHERE rol = 'Administrador'
  AND id IN (
    SELECT id FROM auth.users 
    WHERE email != 'salazaroliveros@gmail.com'
  );

-- Verificar resultado
DO $$
DECLARE
  admin_count integer;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.rol = 'Administrador'
    AND u.email = 'salazaroliveros@gmail.com';
    
  IF admin_count = 1 THEN
    RAISE NOTICE 'OK: Un solo Administrador (salazaroliveros@gmail.com)';
  ELSE
    RAISE WARNING 'Verificar configuración de Administrador';
  END IF;
END $$;
