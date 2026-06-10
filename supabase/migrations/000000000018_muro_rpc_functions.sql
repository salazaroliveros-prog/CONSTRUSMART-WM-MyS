-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 18: RPC Functions para Muro
-- Versión: 2026-06-10
--
-- 1. append_comentario_muro: Agrega un comentario al JSONB
-- 2. increment_likes_muro: Incrementa contador de likes
-- ============================================================

CREATE OR REPLACE FUNCTION append_comentario_muro(pub_id UUID, comentario JSONB)
RETURNS void AS $$
BEGIN
  UPDATE erp_publicaciones_muro
  SET comentarios = comentarios || jsonb_build_array(comentario)
  WHERE id = pub_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_likes_muro(pub_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE erp_publicaciones_muro
  SET likes = COALESCE(likes, 0) + 1
  WHERE id = pub_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
