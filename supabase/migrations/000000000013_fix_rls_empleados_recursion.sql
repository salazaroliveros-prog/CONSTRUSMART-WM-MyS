-- Fix RLS infinite recursion in erp_empleados
-- Run in Supabase SQL Editor

DROP POLICY IF EXISTS "Users can view employees of accessible projects" ON erp_empleados;

CREATE POLICY "Users can view employees of accessible projects" ON erp_empleados
  FOR SELECT USING (
    public.get_user_role() IN ('Administrador', 'Gerente')
    OR
    proyecto_id IN (SELECT id FROM erp_proyectos WHERE id IN (SELECT * FROM public.get_accessible_proyectos()))
  );
