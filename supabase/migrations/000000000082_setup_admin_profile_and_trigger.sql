-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 82: SETUP ADMIN PROFILE Y TRIGGER
-- Versión: 2026-07-01
--
-- Contiene:
-- - Trigger para crear perfil automáticamente en signup
-- - Función para asignar rol de administrador al email específico
-- - Creación de perfil para administrador principal
-- ============================================================

-- ============================================================
-- 1. FUNCIÓN PARA CREAR PERFIL AUTOMÁTICAMENTE
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, rol, user_metadata)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email,
      'Usuario'
    ),
    CASE
      WHEN NEW.email = 'salazaroliveros@gmail.com' THEN 'Administrador'
      ELSE 'usuario'
    END,
    NEW.raw_user_meta_data
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. TRIGGER PARA CREAR PERFIL EN SIGNUP
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. CREAR PERFIL DE ADMINISTRADOR PRINCIPAL
-- ============================================================

-- Primero, verificar si el usuario existe en auth.users
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Buscar el usuario por email en auth.users
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'salazaroliveros@gmail.com'
  LIMIT 1;

  -- Si el usuario existe, crear o actualizar su perfil
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, nombre, rol, user_metadata)
    VALUES (
      admin_user_id,
      'Administrador Principal',
      'Administrador',
      jsonb_build_object(
        'email', 'salazaroliveros@gmail.com',
        'is_primary_admin', true
      )
    )
    ON CONFLICT (id) DO UPDATE SET
      rol = 'Administrador',
      nombre = 'Administrador Principal',
      user_metadata = jsonb_build_object(
        'email', 'salazaroliveros@gmail.com',
        'is_primary_admin', true
      );

    RAISE NOTICE 'Perfil de administrador creado/actualizado para: %', admin_user_id;
  ELSE
    RAISE NOTICE 'Usuario salazaroliveros@gmail.com no encontrado en auth.users. Se creará perfil cuando se registre.';
  END IF;
END $$;

-- ============================================================
-- 4. FUNCIÓN PARA ASIGNAR ROL MANUALMENTE (ADMIN USE)
-- ============================================================

CREATE OR REPLACE FUNCTION public.assign_user_role(user_email text, new_rol text)
RETURNS boolean AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Validar que el rol sea válido
  IF new_rol NOT IN ('Administrador', 'Gerente', 'Residente', 'Compras', 'Bodeguero', 'usuario') THEN
    RAISE EXCEPTION 'Rol inválido: %', new_rol;
    RETURN false;
  END IF;

  -- Buscar usuario por email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado: %', user_email;
    RETURN false;
  END IF;

  -- Actualizar o crear perfil con el nuevo rol
  INSERT INTO public.profiles (id, nombre, rol, user_metadata)
  VALUES (
    user_id,
    COALESCE(
      (SELECT nombre FROM public.profiles WHERE id = user_id),
      split_part(user_email, '@', 1)
    ),
    new_rol,
    jsonb_build_object('email', user_email)
  )
  ON CONFLICT (id) DO UPDATE SET
    rol = new_rol,
    updated_at = now();

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. FUNCIÓN PARA VERIFICAR ROL DE USUARIO POR EMAIL
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role_by_email(user_email text)
RETURNS text AS $$
  SELECT COALESCE(p.rol, 'usuario')
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE u.email = user_email
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================

COMMENT ON FUNCTION public.handle_new_user() IS 'Crea automáticamente un perfil en public.profiles cuando un usuario se registra en auth.users';
COMMENT ON FUNCTION public.assign_user_role(text, text) IS 'Asigna un rol específico a un usuario por email (solo para administradores)';
COMMENT ON FUNCTION public.get_user_role_by_email(text) IS 'Retorna el rol de un usuario dado su email';

-- ============================================================
-- FIN DE MIGRACIÓN 82
-- ============================================================
