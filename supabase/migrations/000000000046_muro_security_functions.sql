-- Improved Muro Functions with Security Validation
-- This migration enhances the security of muro (social wall) functions

-- 1. Create table to track likes (prevent duplicate likes)
CREATE TABLE IF NOT EXISTS erp_muro_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  publicacion_id UUID NOT NULL REFERENCES erp_muro(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(publicacion_id, user_id)
);

-- Enable RLS on erp_muro_likes
ALTER TABLE erp_muro_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own likes
DROP POLICY IF EXISTS "Users can view own likes" ON erp_muro_likes;
CREATE POLICY "Users can view own likes"
  ON erp_muro_likes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own likes
DROP POLICY IF EXISTS "Users can insert own likes" ON erp_muro_likes;
CREATE POLICY "Users can insert own likes"
  ON erp_muro_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own likes
DROP POLICY IF EXISTS "Users can delete own likes" ON erp_muro_likes;
CREATE POLICY "Users can delete own likes"
  ON erp_muro_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Drop existing functions to recreate with improved security
DROP FUNCTION IF EXISTS public.append_comentario_muro(p_publicacion_id uuid, p_comentario jsonb);
DROP FUNCTION IF EXISTS public.increment_likes_muro(p_publicacion_id uuid);

-- 3. Create improved append_comentario_muro with user validation
CREATE OR REPLACE FUNCTION public.append_comentario_muro(p_publicacion_id uuid, p_comentario jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_proyecto_id UUID;
  v_accessible_projects UUID[];
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuario no autenticado');
  END IF;

  SELECT ARRAY(SELECT id FROM public.get_accessible_proyectos()) INTO v_accessible_projects;

  SELECT proyecto_id INTO v_proyecto_id FROM erp_muro WHERE id = p_publicacion_id;

  IF v_proyecto_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Publicación no encontrada');
  END IF;

  IF NOT (v_proyecto_id = ANY(v_accessible_projects)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'No tiene permiso para comentar en esta publicación');
  END IF;

  UPDATE erp_muro
  SET comentarios = array_append(COALESCE(comentarios, '{}'), p_comentario),
      updated_at = now()
  WHERE id = p_publicacion_id;

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- 4. Create improved increment_likes_muro with duplicate prevention
CREATE OR REPLACE FUNCTION public.increment_likes_muro(p_publicacion_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_proyecto_id UUID;
  v_accessible_projects UUID[];
  v_already_liked BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuario no autenticado');
  END IF;

  SELECT ARRAY(SELECT id FROM public.get_accessible_proyectos()) INTO v_accessible_projects;

  SELECT proyecto_id INTO v_proyecto_id FROM erp_muro WHERE id = p_publicacion_id;

  IF v_proyecto_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Publicación no encontrada');
  END IF;

  IF NOT (v_proyecto_id = ANY(v_accessible_projects)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'No tiene permiso para dar like a esta publicación');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM erp_muro_likes
    WHERE publicacion_id = p_publicacion_id AND user_id = auth.uid()
  ) INTO v_already_liked;

  IF v_already_liked THEN
    DELETE FROM erp_muro_likes
    WHERE publicacion_id = p_publicacion_id AND user_id = auth.uid();

    UPDATE erp_muro
    SET likes = GREATEST(COALESCE(likes, 0) - 1, 0),
        updated_at = now()
    WHERE id = p_publicacion_id;

    RETURN jsonb_build_object('success', true, 'action', 'unliked');
  ELSE
    INSERT INTO erp_muro_likes (publicacion_id, user_id)
    VALUES (p_publicacion_id, auth.uid());

    UPDATE erp_muro
    SET likes = COALESCE(likes, 0) + 1,
        updated_at = now()
    WHERE id = p_publicacion_id;

    RETURN jsonb_build_object('success', true, 'action', 'liked');
  END IF;
END;
$function$;

-- 5. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.append_comentario_muro(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_likes_muro(uuid) TO authenticated;

-- 6. Add comments for documentation
COMMENT ON FUNCTION public.append_comentario_muro IS 'Appends a comment to a muro publication with user and project access validation';
COMMENT ON FUNCTION public.increment_likes_muro IS 'Toggles like on a muro publication with duplicate prevention and project access validation';
COMMENT ON TABLE erp_muro_likes IS 'Tracks user likes on muro publications to prevent duplicate likes';
