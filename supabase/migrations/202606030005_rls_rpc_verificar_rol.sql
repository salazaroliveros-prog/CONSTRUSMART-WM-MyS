-- CONSTRUSMART ERP - RPC verificar_rol_usuario
-- Requerido por src/lib/security.ts getServerRole()
-- Ejecutar DESPUÉS de las políticas RLS

-- RPC para verificación server-side del rol (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.verificar_rol_usuario()
RETURNS TABLE (
  user_id uuid,
  rol text,
  nombre text,
  authenticated boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.rol,
    p.nombre,
    true as authenticated
  FROM public.profiles p
  WHERE p.id = auth.uid();
END;
$$;

-- Permisos para que usuarios autenticados ejecuten la RPC
GRANT EXECUTE ON FUNCTION public.verificar_rol_usuario() TO authenticated;

-- Índice para performance en queries por auth.uid()
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON public.profiles(id);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas que no lo tienen
DO $$
DECLARE
  tab text;
BEGIN
  FOR tab IN 
    SELECT tablename FROM pg_tables 
    WHERE tablename IN (
      'erp_proyectos', 'erp_movimientos', 'erp_empleados', 
      'erp_materiales', 'erp_ordenes_compra', 'erp_proveedores',
      'erp_eventos_calendario', 'erp_bitacora', 'erp_seguimiento',
      'erp_renglones', 'erp_insumos', 'erp_sub_renglones',
      'erp_presupuestos', 'erp_vales_salida', 'cajas_chicas',
      'activos_herramientas', 'cuadro_comparativo_proveedores',
      'cotizaciones', 'anticipos', 'amortizaciones', 'pagos_proveedores',
      'ventas_paquetes', 'centros_costo'
    )
  LOOP
    EXECUTE format('
      CREATE TRIGGER update_%I_updated_at 
      BEFORE UPDATE ON %I 
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
      tab, tab
    );
  END LOOP;
END $$;