-- ============================================================
-- FIX RLS: Políticas permisivas para todas las tablas
-- NO modifica estructura de tablas existentes
-- Solo agrega políticas RLS que permitan acceso a usuarios autenticados
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- profiles: el usuario puede leer su propio perfil y todos los autenticados
DROP POLICY IF EXISTS "profiles_select_auth" ON public.profiles;
CREATE POLICY "profiles_select_auth"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_insert_auth" ON public.profiles;
CREATE POLICY "profiles_insert_auth"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_auth" ON public.profiles;
CREATE POLICY "profiles_update_auth"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- ============================================================
-- erp_proyectos
-- ============================================================
ALTER TABLE erp_proyectos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "erp_proyectos_all_auth" ON erp_proyectos;
CREATE POLICY "erp_proyectos_all_auth" ON erp_proyectos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- erp_movimientos
-- ============================================================
ALTER TABLE erp_movimientos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "erp_movimientos_all_auth" ON erp_movimientos;
CREATE POLICY "erp_movimientos_all_auth" ON erp_movimientos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- erp_empleados
-- ============================================================
ALTER TABLE erp_empleados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "erp_empleados_all_auth" ON erp_empleados;
CREATE POLICY "erp_empleados_all_auth" ON erp_empleados
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- erp_materiales
-- ============================================================
ALTER TABLE erp_materiales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "erp_materiales_all_auth" ON erp_materiales;
CREATE POLICY "erp_materiales_all_auth" ON erp_materiales
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- erp_ordenes_compra
-- ============================================================
ALTER TABLE erp_ordenes_compra ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "erp_ordenes_compra_all_auth" ON erp_ordenes_compra;
CREATE POLICY "erp_ordenes_compra_all_auth" ON erp_ordenes_compra
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- erp_proveedores
-- ============================================================
ALTER TABLE erp_proveedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "erp_proveedores_all_auth" ON erp_proveedores;
CREATE POLICY "erp_proveedores_all_auth" ON erp_proveedores
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- erp_eventos_calendario
-- ============================================================
ALTER TABLE erp_eventos_calendario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "erp_eventos_all_auth" ON erp_eventos_calendario;
CREATE POLICY "erp_eventos_all_auth" ON erp_eventos_calendario
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- erp_bitacora
-- ============================================================
ALTER TABLE erp_bitacora ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "erp_bitacora_all_auth" ON erp_bitacora;
CREATE POLICY "erp_bitacora_all_auth" ON erp_bitacora
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- erp_presupuestos
-- ============================================================
ALTER TABLE erp_presupuestos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "erp_presupuestos_all_auth" ON erp_presupuestos;
CREATE POLICY "erp_presupuestos_all_auth" ON erp_presupuestos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- erp_vales_salida
-- ============================================================
ALTER TABLE erp_vales_salida ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "erp_vales_salida_all_auth" ON erp_vales_salida;
CREATE POLICY "erp_vales_salida_all_auth" ON erp_vales_salida
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- erp_avances
-- ============================================================
ALTER TABLE erp_avances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "erp_avances_all_auth" ON erp_avances;
CREATE POLICY "erp_avances_all_auth" ON erp_avances
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- erp_licitaciones
-- ============================================================
ALTER TABLE erp_licitaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "erp_licitaciones_all_auth" ON erp_licitaciones;
CREATE POLICY "erp_licitaciones_all_auth" ON erp_licitaciones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- erp_seguimiento
-- ============================================================
ALTER TABLE erp_seguimiento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "erp_seguimiento_all_auth" ON erp_seguimiento;
CREATE POLICY "erp_seguimiento_all_auth" ON erp_seguimiento
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- erp_renglones
-- ============================================================
ALTER TABLE erp_renglones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "erp_renglones_all_auth" ON erp_renglones;
CREATE POLICY "erp_renglones_all_auth" ON erp_renglones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- erp_insumos
-- ============================================================
ALTER TABLE erp_insumos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "erp_insumos_all_auth" ON erp_insumos;
CREATE POLICY "erp_insumos_all_auth" ON erp_insumos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- erp_sub_renglones
-- ============================================================
ALTER TABLE erp_sub_renglones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "erp_sub_renglones_all_auth" ON erp_sub_renglones;
CREATE POLICY "erp_sub_renglones_all_auth" ON erp_sub_renglones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- logs_sistema
-- ============================================================
ALTER TABLE logs_sistema ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "logs_sistema_all_auth" ON logs_sistema;
CREATE POLICY "logs_sistema_all_auth" ON logs_sistema
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- erp_auditoria
-- ============================================================
ALTER TABLE erp_auditoria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "erp_auditoria_all_auth" ON erp_auditoria;
CREATE POLICY "erp_auditoria_all_auth" ON erp_auditoria
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- destajos
-- ============================================================
ALTER TABLE destajos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "destajos_all_auth" ON destajos;
CREATE POLICY "destajos_all_auth" ON destajos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- cajas_chicas
-- ============================================================
ALTER TABLE cajas_chicas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cajas_chicas_all_auth" ON cajas_chicas;
CREATE POLICY "cajas_chicas_all_auth" ON cajas_chicas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- activos_herramientas
-- ============================================================
ALTER TABLE activos_herramientas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activos_herramientas_all_auth" ON activos_herramientas;
CREATE POLICY "activos_herramientas_all_auth" ON activos_herramientas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- cuadro_comparativo_proveedores
-- ============================================================
ALTER TABLE cuadro_comparativo_proveedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cuadro_comparativo_all_auth" ON cuadro_comparativo_proveedores;
CREATE POLICY "cuadro_comparativo_all_auth" ON cuadro_comparativo_proveedores
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- cotizaciones
-- ============================================================
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cotizaciones_all_auth" ON cotizaciones;
CREATE POLICY "cotizaciones_all_auth" ON cotizaciones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- anticipos
-- ============================================================
ALTER TABLE anticipos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anticipos_all_auth" ON anticipos;
CREATE POLICY "anticipos_all_auth" ON anticipos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- amortizaciones
-- ============================================================
ALTER TABLE amortizaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "amortizaciones_all_auth" ON amortizaciones;
CREATE POLICY "amortizaciones_all_auth" ON amortizaciones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- pagos_proveedores
-- ============================================================
ALTER TABLE pagos_proveedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pagos_proveedores_all_auth" ON pagos_proveedores;
CREATE POLICY "pagos_proveedores_all_auth" ON pagos_proveedores
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ventas_paquetes
-- ============================================================
ALTER TABLE ventas_paquetes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ventas_paquetes_all_auth" ON ventas_paquetes;
CREATE POLICY "ventas_paquetes_all_auth" ON ventas_paquetes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- centros_costo
-- ============================================================
ALTER TABLE centros_costo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "centros_costo_all_auth" ON centros_costo;
CREATE POLICY "centros_costo_all_auth" ON centros_costo
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- erp_insumos_base
-- ============================================================
ALTER TABLE erp_insumos_base ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "erp_insumos_base_all_auth" ON erp_insumos_base;
CREATE POLICY "erp_insumos_base_all_auth" ON erp_insumos_base
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- erp_rendimientos_cuadrilla
-- ============================================================
ALTER TABLE erp_rendimientos_cuadrilla ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "erp_rendimientos_all_auth" ON erp_rendimientos_cuadrilla;
CREATE POLICY "erp_rendimientos_all_auth" ON erp_rendimientos_cuadrilla
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- RPC para verificar rol (necesario para RBAC)
-- ============================================================
CREATE OR REPLACE FUNCTION verificar_rol_usuario()
RETURNS TABLE(rol text, nombre text, avatar_url text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.rol, p.nombre, p.avatar_url
  FROM public.profiles p
  WHERE p.id = auth.uid()
  LIMIT 1;
END;
$$;

-- ============================================================
-- Trigger para crear perfil automáticamente al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, rol, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    CASE WHEN NEW.email = 'salazaroliveros@gmail.com' THEN 'Administrador' ELSE 'Residente' END,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Insertar perfil para usuario existente si no existe
-- ============================================================
INSERT INTO public.profiles (id, nombre, rol)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', SPLIT_PART(email, '@', 1)),
  CASE WHEN email = 'salazaroliveros@gmail.com' THEN 'Administrador' ELSE 'Residente' END
FROM auth.users
ON CONFLICT (id) DO NOTHING;