-- CONSTRUSMART ERP - Migración unificada (RLS + RPC)
-- Ejecutar TODO este archivo en Supabase SQL Editor para resolver errores 500

-- ============================================================
-- PARTE 1: RPC verificar_rol_usuario (si no existe)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE p.proname = 'verificar_rol_usuario' AND n.nspname = 'public'
  ) THEN
    CREATE FUNCTION public.verificar_rol_usuario()
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
    GRANT EXECUTE ON FUNCTION public.verificar_rol_usuario() TO authenticated;
  END IF;
END $$;

-- ============================================================
-- PARTE 2: POLÍTICAS RLS (DROP + CREATE)
-- Requiere: tablas existen y tienen RLS habilitado
-- ============================================================

-- PROFILES
DROP POLICY IF EXISTS "profiles_read_self_admin_gerente" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_read_self_admin_gerente"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.rol IN ('Administrador','Gerente')
  ));
CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- ERP_PROYECTOS
DROP POLICY IF EXISTS "erp_proyectos_select" ON erp_proyectos;
DROP POLICY IF EXISTS "erp_proyectos_insert" ON erp_proyectos;
DROP POLICY IF EXISTS "erp_proyectos_update" ON erp_proyectos;
DROP POLICY IF EXISTS "erp_proyectos_delete" ON erp_proyectos;
CREATE POLICY "erp_proyectos_select" ON erp_proyectos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')) OR auth.uid() = created_by);
CREATE POLICY "erp_proyectos_insert" ON erp_proyectos FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));
CREATE POLICY "erp_proyectos_update" ON erp_proyectos FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));
CREATE POLICY "erp_proyectos_delete" ON erp_proyectos FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente')));

-- ERP_MOVIMIENTOS
DROP POLICY IF EXISTS "erp_movimientos_select" ON erp_movimientos;
DROP POLICY IF EXISTS "erp_movimientos_write" ON erp_movimientos;
CREATE POLICY "erp_movimientos_select" ON erp_movimientos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')) OR auth.uid() = created_by);
CREATE POLICY "erp_movimientos_write" ON erp_movimientos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));

-- ERP_EMPLEADOS
DROP POLICY IF EXISTS "erp_empleados_select" ON erp_empleados;
DROP POLICY IF EXISTS "erp_empleados_write" ON erp_empleados;
CREATE POLICY "erp_empleados_select" ON erp_empleados FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')) OR auth.uid() = created_by);
CREATE POLICY "erp_empleados_write" ON erp_empleados FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));

-- ERP_MATERIALES
DROP POLICY IF EXISTS "erp_materiales_select" ON erp_materiales;
DROP POLICY IF EXISTS "erp_materiales_write" ON erp_materiales;
CREATE POLICY "erp_materiales_select" ON erp_materiales FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')) OR auth.uid() = created_by);
CREATE POLICY "erp_materiales_write" ON erp_materiales FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero')));

-- ERP_ORDENES_COMPRA
DROP POLICY IF EXISTS "erp_ordenes_compra_select" ON erp_ordenes_compra;
DROP POLICY IF EXISTS "erp_ordenes_compra_write" ON erp_ordenes_compra;
CREATE POLICY "erp_ordenes_compra_select" ON erp_ordenes_compra FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero')) OR auth.uid() = created_by);
CREATE POLICY "erp_ordenes_compra_write" ON erp_ordenes_compra FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras')));

-- ERP_PROVEEDORES
DROP POLICY IF EXISTS "erp_proveedores_select" ON erp_proveedores;
DROP POLICY IF EXISTS "erp_proveedores_write" ON erp_proveedores;
CREATE POLICY "erp_proveedores_select" ON erp_proveedores FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero')));
CREATE POLICY "erp_proveedores_write" ON erp_proveedores FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras')));

-- ERP_EVENTOS_CALENDARIO
DROP POLICY IF EXISTS "erp_eventos_calendario_select" ON erp_eventos_calendario;
DROP POLICY IF EXISTS "erp_eventos_calendario_write" ON erp_eventos_calendario;
CREATE POLICY "erp_eventos_calendario_select" ON erp_eventos_calendario FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')) OR auth.uid() = created_by);
CREATE POLICY "erp_eventos_calendario_write" ON erp_eventos_calendario FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));

-- ERP_BITACORA
DROP POLICY IF EXISTS "erp_bitacora_select" ON erp_bitacora;
DROP POLICY IF EXISTS "erp_bitacora_write" ON erp_bitacora;
CREATE POLICY "erp_bitacora_select" ON erp_bitacora FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')) OR auth.uid() = created_by);
CREATE POLICY "erp_bitacora_write" ON erp_bitacora FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));

-- ERP_PRESUPUESTOS
DROP POLICY IF EXISTS "erp_presupuestos_select" ON erp_presupuestos;
DROP POLICY IF EXISTS "erp_presupuestos_write" ON erp_presupuestos;
CREATE POLICY "erp_presupuestos_select" ON erp_presupuestos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')));
CREATE POLICY "erp_presupuestos_write" ON erp_presupuestos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));

-- ERP_RENGLONES
DROP POLICY IF EXISTS "erp_renglones_select" ON erp_renglones;
DROP POLICY IF EXISTS "erp_renglones_write" ON erp_renglones;
CREATE POLICY "erp_renglones_select" ON erp_renglones FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')) OR auth.uid() = created_by);
CREATE POLICY "erp_renglones_write" ON erp_renglones FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));

-- ERP_INSUMOS
DROP POLICY IF EXISTS "erp_insumos_select" ON erp_insumos;
DROP POLICY IF EXISTS "erp_insumos_write" ON erp_insumos;
CREATE POLICY "erp_insumos_select" ON erp_insumos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')));
CREATE POLICY "erp_insumos_write" ON erp_insumos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));

-- ERP_VALES_SALIDA
DROP POLICY IF EXISTS "erp_vales_salida_select" ON erp_vales_salida;
DROP POLICY IF EXISTS "erp_vales_salida_write" ON erp_vales_salida;
CREATE POLICY "erp_vales_salida_select" ON erp_vales_salida FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')) OR auth.uid() = created_by);
CREATE POLICY "erp_vales_salida_write" ON erp_vales_salida FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')));

-- LOGS_SISTEMA
DROP POLICY IF EXISTS "logs_sistema_select" ON logs_sistema;
DROP POLICY IF EXISTS "logs_sistema_insert" ON logs_sistema;
CREATE POLICY "logs_sistema_select" ON logs_sistema FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente')));
CREATE POLICY "logs_sistema_insert" ON logs_sistema FOR INSERT TO authenticated
  WITH CHECK (true);

-- ERP_AUDITORIA
DROP POLICY IF EXISTS "erp_auditoria_select" ON public.erp_auditoria;
CREATE POLICY "erp_auditoria_select" ON public.erp_auditoria FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente')));

-- DESTAJOS
DROP POLICY IF EXISTS "destajos_select" ON destajos;
DROP POLICY IF EXISTS "destajos_write" ON destajos;
CREATE POLICY "destajos_select" ON destajos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')) OR auth.uid() = registrado_por);
CREATE POLICY "destajos_write" ON destajos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente')));

-- CAJAS_CHICAS
DROP POLICY IF EXISTS "cajas_chicas_select" ON cajas_chicas;
DROP POLICY IF EXISTS "cajas_chicas_write" ON cajas_chicas;
CREATE POLICY "cajas_chicas_select" ON cajas_chicas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero','Residente')));
CREATE POLICY "cajas_chicas_write" ON cajas_chicas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras','Residente')));

-- ACTIVOS_HERRAMIENTAS
DROP POLICY IF EXISTS "activos_herramientas_select" ON activos_herramientas;
DROP POLICY IF EXISTS "activos_herramientas_write" ON activos_herramientas;
CREATE POLICY "activos_herramientas_select" ON activos_herramientas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero','Residente')));
CREATE POLICY "activos_herramientas_write" ON activos_herramientas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras','Bodeguero')));

-- ERP_INSUMOS_BASE
DROP POLICY IF EXISTS "erp_insumos_base_select" ON erp_insumos_base;
DROP POLICY IF EXISTS "erp_insumos_base_write" ON erp_insumos_base;
CREATE POLICY "erp_insumos_base_select" ON erp_insumos_base FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Residente','Compras','Bodeguero')));
CREATE POLICY "erp_insumos_base_write" ON erp_insumos_base FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador','Gerente','Compras')));