-- =============================================================
-- FIX profiles 500 + 409
-- =============================================================

-- 1. Asegurar que la política INSERT en profiles existe y es correcta
--    (Sin esto, el INSERT desde el cliente también falla con 403)
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 2. Asegurar política SELECT sin recursión
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- 3. Trigger con ON CONFLICT para evitar 409 en re-login
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, rol, avatar_url, user_metadata)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'nombre',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    CASE
      WHEN NEW.email = 'salazaroliveros@gmail.com' THEN 'Administrador'
      ELSE 'Residente'
    END,
    COALESCE(
      NEW.raw_user_meta_data->>'picture',
      NEW.raw_user_meta_data->>'avatar_url'
    ),
    NEW.raw_user_meta_data
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar_url    = COALESCE(EXCLUDED.avatar_url,    public.profiles.avatar_url),
    user_metadata = COALESCE(EXCLUDED.user_metadata, public.profiles.user_metadata),
    nombre = CASE
      WHEN public.profiles.nombre = '' OR public.profiles.nombre IS NULL
      THEN EXCLUDED.nombre
      ELSE public.profiles.nombre
    END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Insertar perfil faltante para usuario que ya existe en auth.users
--    pero no tiene fila en profiles (causa del 500 en .single())
INSERT INTO public.profiles (id, nombre, rol, avatar_url, user_metadata)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1)),
  CASE WHEN u.email = 'salazaroliveros@gmail.com' THEN 'Administrador' ELSE 'Residente' END,
  COALESCE(u.raw_user_meta_data->>'picture', u.raw_user_meta_data->>'avatar_url'),
  u.raw_user_meta_data
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Verificar
SELECT id, nombre, rol, avatar_url IS NOT NULL AS tiene_avatar
FROM public.profiles
ORDER BY id;
