-- CONSTRUSMART ERP - RPC verificación de rol server-side
-- Ejecutar en Supabase SQL Editor después del delta RLS.
-- Requiere tabla public.profiles creada.

CREATE OR REPLACE FUNCTION public.verificar_rol_usuario()
RETURNS TABLE (
  usuario_id uuid,
  rol text,
  nombre text,
  authenticated boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.rol,
    p.nombre,
    (auth.uid() IS NOT NULL) AS authenticated
  FROM public.profiles p
  WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.verificar_rol_usuario() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verificar_rol_usuario() TO authenticated;
