-- Supabase RLS policies for ERP tables
-- Run this in Supabase SQL Editor

-- Enable RLS on all tables (including new tables)
ALTER TABLE erp_proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_eventos_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_bitacora ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_licitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_seguimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_avances ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_vales_salida ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_incidentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_hitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_riesgos ENABLE ROW LEVEL SECURITY;

-- New tables
ALTER TABLE destajos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cajas_chicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE activos_herramientas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuadro_comparativo_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE anticipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE amortizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_paquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE centros_costo ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_insumos_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_rendimientos_cuadrilla ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_cuentas_cobrar ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_cuentas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_ordenes_cambio ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_muro ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_pruebas_laboratorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_no_conformidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_liberaciones_partida ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_sistema ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE((auth.jwt() ->> 'user_metadata')::jsonb ->> 'rol', 'Residente');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to get user's accessible project IDs
CREATE OR REPLACE FUNCTION public.get_accessible_proyectos()
RETURNS SETOF uuid AS $$
  DECLARE
    user_rol TEXT := public.get_user_role();
  BEGIN
    IF user_rol IN ('Administrador', 'Gerente') THEN
      RETURN QUERY SELECT id FROM erp_proyectos;
    ELSIF user_rol = 'Residente' THEN
      RETURN QUERY SELECT DISTINCT p.id FROM erp_proyectos p
        JOIN erp_empleados e ON e.proyecto_id = p.id
        WHERE e.id = auth.uid();
    ELSIF user_rol = 'Compras' THEN
      RETURN QUERY SELECT DISTINCT p.id FROM erp_proyectos p
        JOIN erp_ordenes_compra o ON o.proyecto_id = p.id;
    ELSE
      RETURN QUERY SELECT id FROM erp_proyectos WHERE false;
    END IF;
  END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Policies for proyectos
DROP POLICY IF EXISTS "Admin/Gerente can manage all projects" ON erp_proyectos;
CREATE POLICY "Admin/Gerente can manage all projects" ON erp_proyectos
  FOR ALL USING (public.get_user_role() IN ('Administrador', 'Gerente'));

DROP POLICY IF EXISTS "Users can view accessible projects" ON erp_proyectos;
CREATE POLICY "Users can view accessible projects" ON erp_proyectos
  FOR SELECT USING (
    id IN (SELECT * FROM public.get_accessible_proyectos())
  );

-- Policies for movimientos
DROP POLICY IF EXISTS "Admin/Gerente can manage all movements" ON erp_movimientos;
CREATE POLICY "Admin/Gerente can manage all movements" ON erp_movimientos
  FOR ALL USING (public.get_user_role() IN ('Administrador', 'Gerente'));

DROP POLICY IF EXISTS "Users can view movements of accessible projects" ON erp_movimientos;
CREATE POLICY "Users can view movements of accessible projects" ON erp_movimientos
  FOR SELECT USING (
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

-- Policies for presupuestos
DROP POLICY IF EXISTS "Admin/Gerente can manage all budgets" ON erp_presupuestos;
CREATE POLICY "Admin/Gerente can manage all budgets" ON erp_presupuestos
  FOR ALL USING (public.get_user_role() IN ('Administrador', 'Gerente'));

DROP POLICY IF EXISTS "Users can view budgets of accessible projects" ON erp_presupuestos;
CREATE POLICY "Users can view budgets of accessible projects" ON erp_presupuestos
  FOR SELECT USING (
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

-- Policies for empleados
DROP POLICY IF EXISTS "Admin/Gerente can manage all employees" ON erp_empleados;
CREATE POLICY "Admin/Gerente can manage all employees" ON erp_empleados
  FOR ALL USING (public.get_user_role() IN ('Administrador', 'Gerente'));

DROP POLICY IF EXISTS "Users can view employees of accessible projects" ON erp_empleados;
CREATE POLICY "Users can view employees of accessible projects" ON erp_empleados
  FOR SELECT USING (
    id IN (
      SELECT e.id FROM erp_empleados e
      JOIN erp_proyectos p ON e.proyecto_id = p.id
      WHERE p.id IN (SELECT * FROM public.get_accessible_proyectos())
    )
  );

-- Policies for materiales
DROP POLICY IF EXISTS "Admin/Gerente can manage all materials" ON erp_materiales;
CREATE POLICY "Admin/Gerente can manage all materials" ON erp_materiales
  FOR ALL USING (public.get_user_role() IN ('Administrador', 'Gerente'));

DROP POLICY IF EXISTS "Users can view materials" ON erp_materiales;
CREATE POLICY "Users can view materials" ON erp_materiales
  FOR SELECT USING (public.get_user_role() IS NOT NULL);

-- Policies for ordenes_compra
DROP POLICY IF EXISTS "Admin/Gerente/Compras can manage orders" ON erp_ordenes_compra;
CREATE POLICY "Admin/Gerente/Compras can manage orders" ON erp_ordenes_compra
  FOR ALL USING (public.get_user_role() IN ('Administrador', 'Gerente', 'Compras'));

DROP POLICY IF EXISTS "Bodeguero can view orders" ON erp_ordenes_compra;
CREATE POLICY "Bodeguero can view orders" ON erp_ordenes_compra
  FOR SELECT USING (public.get_user_role() = 'Bodeguero');

-- Policies for proveedores
DROP POLICY IF EXISTS "Admin/Gerente/Compras can manage suppliers" ON erp_proveedores;
CREATE POLICY "Admin/Gerente/Compras can manage suppliers" ON erp_proveedores
  FOR ALL USING (public.get_user_role() IN ('Administrador', 'Gerente', 'Compras'));

DROP POLICY IF EXISTS "Users can view suppliers" ON erp_proveedores;
CREATE POLICY "Users can view suppliers" ON erp_proveedores
  FOR SELECT USING (public.get_user_role() IS NOT NULL);

-- Policies for eventos_calendario
DROP POLICY IF EXISTS "Admin/Gerente can manage all events" ON erp_eventos_calendario;
CREATE POLICY "Admin/Gerente can manage all events" ON erp_eventos_calendario
  FOR ALL USING (public.get_user_role() IN ('Administrador', 'Gerente'));

DROP POLICY IF EXISTS "Users can view events of accessible projects" ON erp_eventos_calendario;
CREATE POLICY "Users can view events of accessible projects" ON erp_eventos_calendario
  FOR SELECT USING (
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

-- Policies for bitacora
DROP POLICY IF EXISTS "Admin/Gerente can manage all bitacora" ON erp_bitacora;
CREATE POLICY "Admin/Gerente can manage all bitacora" ON erp_bitacora
  FOR ALL USING (public.get_user_role() IN ('Administrador', 'Gerente'));

DROP POLICY IF EXISTS "Users can view bitacora of accessible projects" ON erp_bitacora;
CREATE POLICY "Users can view bitacora of accessible projects" ON erp_bitacora
  FOR SELECT USING (
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

-- Policies for licitaciones
DROP POLICY IF EXISTS "Admin/Gerente can manage all licitaciones" ON erp_licitaciones;
CREATE POLICY "Admin/Gerente can manage all licitaciones" ON erp_licitaciones
  FOR ALL USING (public.get_user_role() IN ('Administrador', 'Gerente'));

DROP POLICY IF EXISTS "Users can view licitaciones" ON erp_licitaciones;
CREATE POLICY "Users can view licitaciones" ON erp_licitaciones
  FOR SELECT USING (public.get_user_role() IS NOT NULL);

-- Policies for incidentes
DROP POLICY IF EXISTS "Admin/Gerente can manage all incidents" ON erp_incidentes;
CREATE POLICY "Admin/Gerente can manage all incidents" ON erp_incidentes
  FOR ALL USING (public.get_user_role() IN ('Administrador', 'Gerente'));

DROP POLICY IF EXISTS "Users can view incidents of accessible projects" ON erp_incidentes;
CREATE POLICY "Users can view incidents of accessible projects" ON erp_incidentes
  FOR SELECT USING (
    proyecto_id IN (SELECT * FROM public.get_accessible_proyectos())
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;