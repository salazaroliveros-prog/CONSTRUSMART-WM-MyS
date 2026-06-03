-- ============================================================
-- ERP CONSTRUSMART - Migration 000000000007
-- 1. Add avatar_url column to profiles
-- 2. Fix handle_new_user trigger for role enforcement + avatar
-- ============================================================

-- ============================================================
-- PART 1: Add avatar_url column to profiles
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- ============================================================
-- PART 2: Recreate handle_new_user() with role enforcement
-- Only salazaroliveros@gmail.com gets Administrador
-- Everyone else defaults to Residente
-- ============================================================
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
    NEW.raw_user_meta_data->>'picture',
    NEW.raw_user_meta_data
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger (in case previous version exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PART 3: Fix existing profiles that have wrong role
-- Any existing profile with email = salazaroliveros@gmail.com
-- but rol != 'Administrador' gets fixed
-- ============================================================
UPDATE public.profiles
SET rol = 'Administrador'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'salazaroliveros@gmail.com'
)
AND rol IS DISTINCT FROM 'Administrador';

-- ============================================================
-- PART 4: Add avatar_url to existing profiles from user_metadata
-- (for users who signed up before this migration)
-- ============================================================
UPDATE public.profiles
SET avatar_url = user_metadata->>'picture'
WHERE avatar_url IS NULL
AND user_metadata IS NOT NULL
AND user_metadata->>'picture' IS NOT NULL;
