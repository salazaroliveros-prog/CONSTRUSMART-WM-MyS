-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 22: Membresía por Proyecto
-- Fecha: 2026-06-13
--
-- Permite RLS granular: un usuario puede tener acceso a
-- proyectos específicos aunque su rol global no lo permita.
--
-- Tabla: erp_proyecto_miembros
-- Función actualizada: get_accessible_proyectos()
-- ============================================================

-- ============================================================
-- 1. TABLA DE MEMBRESÍA POR PROYECTO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.erp_proyecto_miembros (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id uuid NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol text NOT NULL DEFAULT 'lectura' CHECK (rol = ANY (ARRAY['lectura','escritura','admin_proyecto'])),
  asignado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(proyecto_id, user_id)
);

ALTER TABLE public.erp_proyecto_miembros ENABLE ROW LEVEL SECURITY;

-- Solo admin global puede ver/administrar membresías
DROP POLICY IF EXISTS "admin_manage_miembros" ON public.erp_proyecto_miembros;
CREATE POLICY "admin_manage_miembros" ON public.erp_proyecto_miembros
  FOR ALL TO authenticated
  USING (public.get_current_user_role() = 'Administrador')
  WITH CHECK (public.get_current_user_role() = 'Administrador');

-- Usuarios pueden ver su propia membresía
DROP POLICY IF EXISTS "self_read_miembro" ON public.erp_proyecto_miembros;
CREATE POLICY "self_read_miembro" ON public.erp_proyecto_miembros
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 2. ACTUALIZAR FUNCIÓN get_accessible_proyectos()
--    Incluye proyectos donde el usuario es miembro
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_accessible_proyectos()
RETURNS TABLE(id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Admin: todos los proyectos
  SELECT p.id FROM public.erp_proyectos p
  WHERE public.get_current_user_role() = 'Administrador'

  UNION ALL

  -- Gerente y otros roles: creados por ellos
  SELECT p.id FROM public.erp_proyectos p
  WHERE public.get_current_user_role() IN ('Gerente', 'Residente', 'Compras', 'Bodeguero')
    AND p.created_by = auth.uid()

  UNION ALL

  -- Residente: también ve proyectos donde está asignado como empleado
  SELECT e.proyecto_id FROM public.erp_empleados e
  WHERE public.get_current_user_role() = 'Residente'
    AND e.created_by = auth.uid()

  UNION ALL

  -- CUALQUIER USUARIO: ve proyectos donde es miembro
  SELECT pm.proyecto_id FROM public.erp_proyecto_miembros pm
  WHERE pm.user_id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_accessible_proyectos() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_accessible_proyectos() TO authenticated;

-- ============================================================
-- 3. POLÍTICAS RLS ACTUALIZADAS PARA TABLAS PRINCIPALES
--    (usan get_accessible_proyectos())
-- ============================================================

-- Re-crear políticas para erp_proyectos
DROP POLICY IF EXISTS "proyectos_access" ON public.erp_proyectos;
CREATE POLICY "proyectos_access" ON public.erp_proyectos
  FOR SELECT TO authenticated
  USING (public.get_current_user_role() = 'Administrador'
    OR created_by = auth.uid()
    OR id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos())))
  );

DROP POLICY IF EXISTS "proyectos_insert" ON public.erp_proyectos;
CREATE POLICY "proyectos_insert" ON public.erp_proyectos
  FOR INSERT TO authenticated
  WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Residente'));

DROP POLICY IF EXISTS "proyectos_update" ON public.erp_proyectos;
CREATE POLICY "proyectos_update" ON public.erp_proyectos
  FOR UPDATE TO authenticated
  USING (public.get_current_user_role() IN ('Administrador','Gerente','Residente')
    AND id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))))
  WITH CHECK (public.get_current_user_role() IN ('Administrador','Gerente','Residente')
    AND id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))));

DROP POLICY IF EXISTS "proyectos_delete" ON public.erp_proyectos;
CREATE POLICY "proyectos_delete" ON public.erp_proyectos
  FOR DELETE TO authenticated
  USING (public.get_current_user_role() = 'Administrador'
    AND id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))));

-- ============================================================
-- 4. FUNCIÓN AUXILIAR: asignar miembro a proyecto
-- ============================================================
CREATE OR REPLACE FUNCTION public.asignar_miembro_proyecto(
  p_proyecto_id uuid,
  p_user_id uuid,
  p_rol text DEFAULT 'lectura'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo Administrador puede asignar
  IF public.get_current_user_role() != 'Administrador' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo Administrador puede asignar miembros');
  END IF;

  INSERT INTO public.erp_proyecto_miembros (proyecto_id, user_id, rol, asignado_por)
  VALUES (p_proyecto_id, p_user_id, p_rol, auth.uid())
  ON CONFLICT (proyecto_id, user_id)
  DO UPDATE SET rol = p_rol, asignado_por = auth.uid();

  RETURN jsonb_build_object('success', true, 'message', 'Miembro asignado exitosamente');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.asignar_miembro_proyecto FROM anon;
GRANT EXECUTE ON FUNCTION public.asignar_miembro_proyecto TO authenticated;

-- ============================================================
-- 5. FUNCIÓN AUXILIAR: remover miembro de proyecto
-- ============================================================
CREATE OR REPLACE FUNCTION public.remover_miembro_proyecto(
  p_proyecto_id uuid,
  p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.get_current_user_role() != 'Administrador' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo Administrador puede remover miembros');
  END IF;

  DELETE FROM public.erp_proyecto_miembros
  WHERE proyecto_id = p_proyecto_id AND user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Miembro removido exitosamente');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.remover_miembro_proyecto FROM anon;
GRANT EXECUTE ON FUNCTION public.remover_miembro_proyecto TO authenticated;