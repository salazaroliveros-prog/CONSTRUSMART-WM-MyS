-- CONSTRUSMART ERP - RPC verificar_rol_usuario
-- Requerido por src/lib/security.ts getServerRole()
-- La función ya existe con firma diferente - usar DROP primero

DROP FUNCTION IF EXISTS public.verificar_rol_usuario();

-- RPC para verificación server-side del rol (SECURITY DEFINER)
-- Esto NO se puede falsear desde el cliente
CREATE FUNCTION public.verificar_rol_usuario()
RETURNS TABLE (
  user_id uuid,
  rol text,
  nombre text,
  authenticated boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.rol,
    p.nombre,
    true as authenticated
  FROM public.profiles p
  WHERE p.id = auth.uid();
END;
$$;

-- Permisos para que usuarios autenticados ejecuten la RPC
GRANT EXECUTE ON FUNCTION public.verificar_rol_usuario() TO authenticated;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON public.profiles(id);