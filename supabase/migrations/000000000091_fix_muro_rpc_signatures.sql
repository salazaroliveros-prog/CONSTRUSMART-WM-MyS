DROP FUNCTION IF EXISTS append_comentario_muro(UUID, JSONB) CASCADE;
DROP FUNCTION IF EXISTS increment_likes_muro(UUID) CASCADE;

CREATE OR REPLACE FUNCTION append_comentario_muro(pub_id UUID, comentario JSONB)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE erp_muro
  SET comentarios = COALESCE(comentarios, '[]'::jsonb) || jsonb_build_array(comentario)
  WHERE id = pub_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_likes_muro(pub_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE erp_muro
  SET likes = COALESCE(likes, 0) + 1
  WHERE id = pub_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION append_comentario_muro(UUID, JSONB) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION increment_likes_muro(UUID) FROM anon, authenticated;
