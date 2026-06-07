-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 6: FIX RLS POLICIES 500 ERROR
-- Versión: 2026-07-06
--
-- Corrige el error 500 en consultas a erp_empleados y otras
-- tablas causado por:
--   1. get_user_role() lee de jwt.user_metadata en vez de profiles.rol
--   2. get_accessible_proyectos() para Residente hace JOIN incorrecto
--      (e.id = auth.uid() pero e.id NO es el auth.uid())
--   3. Políticas duplicadas/conflictuosas entre migraciones 1 y 2
-- ============================================================

-- ============================================================
-- 1. CORREGIR FUNCIÓN get_user_role()
--    Lee el rol REAL desde public.profiles, no de JWT metadata
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT rol FROM public.profiles WHERE id = auth.uid()),
    'usuario'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- 2. CORREGIR FUNCIÓN get_accessible_proyectos()
--    Para Residente: usa created_by en lugar de JOIN incorrecto
--    Para Compras: usa created_by en ordenes_compra
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_accessible_proyectos()
RETURNS SETOF uuid AS $$
  DECLARE
    user_rol TEXT := public.get_user_role();
  BEGIN
    -- Admin y Gerente ven TODOS los proyectos
    IF user_rol IN ('Administrador', 'Gerente') THEN
      RETURN QUERY SELECT id FROM erp_proyectos;
    -- Residente: proyectos donde es created_by O está asignado
    ELSIF user_rol = 'Residente' THEN
      RETURN QUERY SELECT p.id FROM erp_proyectos p
        WHERE p.created_by = auth.uid()
        OR p.id IN (
          SELECT e.proyecto_id FROM erp_empleados e
          WHERE e.created_by = auth.uid()
        );
    -- Compras: proyectos con órdenes de compra creadas por él
    ELSIF user_rol = 'Compras' THEN
      RETURN QUERY SELECT DISTINCT o.proyecto_id FROM erp_ordenes_compra o
        WHERE o.created_by = auth.uid();
    -- Bodeguero/otros: proyectos donde ha creado vales o movimientos
    ELSIF user_rol = 'Bodeguero' THEN
      RETURN QUERY SELECT DISTINCT v.proyecto_id FROM erp_vales_salida v
        WHERE v.created_by = auth.uid();
    ELSE
      RETURN QUERY SELECT id FROM erp_proyectos WHERE false;
    END IF;
  END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- 3. ELIMINAR POLÍTICAS CONFLICTUOSAS DE MIGRACIÓN 2 (RLS)
--    para reemplazarlas con versiones corregidas
-- ============================================================

-- Limpiar políticas viejas de la migración 2
DROP POLICY IF EXISTS "Admin/Gerente can manage all projects" ON erp_proyectos;
DROP POLICY IF EXISTS "Users can view accessible projects" ON erp_proyectos;
DROP POLICY IF EXISTS "Admin/Gerente can manage all movements" ON erp_movimientos;
DROP POLICY IF EXISTS "Users can view movements of accessible projects" ON erp_movimientos;
DROP POLICY IF EXISTS "Admin/Gerente can manage all budgets" ON erp_presupuestos;
DROP POLICY IF EXISTS "Users can view budgets of accessible projects" ON erp_presupuestos;
DROP POLICY IF EXISTS "Admin/Gerente can manage all employees" ON erp_empleados;
DROP POLICY IF EXISTS "Users can view employees of accessible projects" ON erp_empleados;
DROP POLICY IF EXISTS "Admin/Gerente can manage all events" ON erp_eventos_calendario;
DROP POLICY IF EXISTS "Users can view events of accessible projects" ON erp_eventos_calendario;
DROP POLICY IF EXISTS "Admin/Gerente can manage all bitacora" ON erp_bitacora;
DROP POLICY IF EXISTS "Users can view bitacora of accessible projects" ON erp_bitacora;
DROP POLICY IF EXISTS "Admin/Gerente can manage all licitaciones" ON erp_licitaciones;
DROP POLICY IF EXISTS "Admin/Gerente can manage all incidents" ON erp_incidentes;
DROP POLICY IF EXISTS "Users can view incidents of accessible projects" ON erp_incidentes;

-- ============================================================
-- 4. NUEVAS POLÍTICAS CORREGIDAS (unificadas)
-- ============================================================

-- erp_proyectos: Admin/Gerente ALL, resto SELECT según proyectos accesibles
CREATE POLICY "proyectos_admin_all" ON erp_proyectos
  FOR ALL TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente')
  );

CREATE POLICY "proyectos_select" ON erp_proyectos
  FOR SELECT TO authenticated USING (
    id IN (SELECT * FROM public.get_accessible_proyectos())
  );

-- erp_movimientos: Admin/Gerente/Residente ALL, resto SELECT
CREATE POLICY "movimientos_admin_all" ON erp_movimientos
  FOR ALL TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente', 'Residente')
  );

CREATE POLICY "movimientos_select" ON erp_movimientos
  FOR SELECT TO authenticated USING (
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

-- erp_presupuestos: Admin/Gerente/Residente ALL, resto SELECT
CREATE POLICY "presupuestos_admin_all" ON erp_presupuestos
  FOR ALL TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente', 'Residente')
  );

CREATE POLICY "presupuestos_select" ON erp_presupuestos
  FOR SELECT TO authenticated USING (
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

-- erp_empleados: Admin/Gerente ALL, Residente ALL si es creador, resto SELECT
CREATE POLICY "empleados_admin_all" ON erp_empleados
  FOR ALL TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente')
  );

CREATE POLICY "empleados_select" ON erp_empleados
  FOR SELECT TO authenticated USING (
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

-- erp_empleados: Residente puede gestionar empleados de sus proyectos
CREATE POLICY "empleados_residente_all" ON erp_empleados
  FOR ALL TO authenticated USING (
    public.get_user_role() = 'Residente'
    AND proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

-- erp_eventos_calendario: Admin/Gerente/Residente ALL, resto SELECT
CREATE POLICY "eventos_admin_all" ON erp_eventos_calendario
  FOR ALL TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente', 'Residente')
  );

CREATE POLICY "eventos_select" ON erp_eventos_calendario
  FOR SELECT TO authenticated USING (
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

-- erp_bitacora: Admin/Gerente/Residente ALL, resto SELECT
CREATE POLICY "bitacora_admin_all" ON erp_bitacora
  FOR ALL TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente', 'Residente')
  );

CREATE POLICY "bitacora_select" ON erp_bitacora
  FOR SELECT TO authenticated USING (
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

-- erp_licitaciones: Admin/Gerente ALL, resto SELECT
CREATE POLICY "licitaciones_admin_all" ON erp_licitaciones
  FOR ALL TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente')
  );

CREATE POLICY "licitaciones_select" ON erp_licitaciones
  FOR SELECT TO authenticated USING (true);

-- erp_incidentes: Admin/Gerente/Residente ALL, resto SELECT proyecto
CREATE POLICY "incidentes_admin_all" ON erp_incidentes
  FOR ALL TO authenticated USING (
    public.get_user_role() IN ('Administrador', 'Gerente', 'Residente')
  );

CREATE POLICY "incidentes_select" ON erp_incidentes
  FOR SELECT TO authenticated USING (
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

-- ============================================================
-- FIN MIGRACIÓN 6
-- ============================================================