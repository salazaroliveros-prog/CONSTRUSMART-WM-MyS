-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 83: CORRECCIÓN FUNCIÓN EMAIL
-- Versión: 2026-07-01
--
-- Corrige la función get_user_role_by_email que falló en migración 82
-- Re-crea la función si no existe
-- ============================================================

DROP FUNCTION IF EXISTS public.get_user_role_by_email(text);

CREATE OR REPLACE FUNCTION public.get_user_role_by_email(user_email text)
RETURNS text AS $$
  SELECT COALESCE(p.rol, 'usuario')
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE u.email = user_email
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_role_by_email(text) IS 'Retorna el rol de un usuario dado su email';

-- ============================================================
-- FIN DE MIGRACIÓN 83
-- ============================================================
