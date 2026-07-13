-- ============================================================
-- MIGRACIÓN 075: Fix Proyecto Delete Policies (FIXED)
-- ============================================================
-- Corrige errores de eliminación de proyectos:
--   1) Asegura que la política DELETE permita eliminación por administradores
--   2) Agrega políticas DELETE explícitas para tablas relacionadas
--   3) Maneja properly foreign key constraints
-- ============================================================

-- ============================================================
-- PART 1: Fix erp_proyectos DELETE policy
-- ============================================================

-- Eliminar políticas antiguas de DELETE en erp_proyectos
DROP POLICY IF EXISTS "proyectos_delete" ON erp_proyectos;
DROP POLICY IF EXISTS "erp_proyectos_write" ON erp_proyectos;
DROP POLICY IF EXISTS "allow_all_proyectos" ON erp_proyectos;

-- Crear política DELETE clara para administradores
CREATE POLICY "proyectos_delete" ON erp_proyectos
  FOR DELETE TO authenticated
  USING (public.get_current_user_role() = 'Administrador');

-- ============================================================
-- PART 2: Ensure DELETE policies exist for related tables
-- ============================================================

-- Tablas con ON DELETE CASCADE - no necesitan políticas DELETE especiales
-- ya que PostgreSQL maneja la cascada a nivel de constraint

-- Tablas con ON DELETE SET NULL - necesitan políticas DELETE explícitas
-- para permitir que el FK se ponga en NULL cuando se elimina el proyecto

-- erp_movimientos
DROP POLICY IF EXISTS "movimientos_delete" ON erp_movimientos;
CREATE POLICY "movimientos_delete" ON erp_movimientos
  FOR DELETE TO authenticated
  USING (public.get_current_user_role() = 'Administrador'
    OR proyecto_id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))));

-- erp_licitaciones
DROP POLICY IF EXISTS "licitaciones_delete" ON erp_licitaciones;
CREATE POLICY "licitaciones_delete" ON erp_licitaciones
  FOR DELETE TO authenticated
  USING (public.get_current_user_role() = 'Administrador'
    OR proyecto_id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))));

-- erp_cuentas_cobrar
DROP POLICY IF EXISTS "cuentas_cobrar_delete" ON erp_cuentas_cobrar;
CREATE POLICY "cuentas_cobrar_delete" ON erp_cuentas_cobrar
  FOR DELETE TO authenticated
  USING (public.get_current_user_role() = 'Administrador'
    OR proyecto_id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))));

-- erp_cuentas_pagar
DROP POLICY IF EXISTS "cuentas_pagar_delete" ON erp_cuentas_pagar;
CREATE POLICY "cuentas_pagar_delete" ON erp_cuentas_pagar
  FOR DELETE TO authenticated
  USING (public.get_current_user_role() = 'Administrador'
    OR proyecto_id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))));

-- erp_ordenes_compra (conditional - only if proyecto_id exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='erp_ordenes_compra' AND column_name='proyecto_id') THEN
    DROP POLICY IF EXISTS "ordenes_compra_delete" ON erp_ordenes_compra;
    EXECUTE 'CREATE POLICY "ordenes_compra_delete" ON erp_ordenes_compra
      FOR DELETE TO authenticated
      USING (public.get_current_user_role() = ''Administrador''
        OR proyecto_id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))))';
  END IF;
END $$;

-- erp_vales_salida
DROP POLICY IF EXISTS "vales_salida_delete" ON erp_vales_salida;
CREATE POLICY "vales_salida_delete" ON erp_vales_salida
  FOR DELETE TO authenticated
  USING (public.get_current_user_role() = 'Administrador'
    OR proyecto_id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))));

-- erp_activos (conditional - only if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_activos') THEN
    DROP POLICY IF EXISTS "activos_delete" ON erp_activos;
    EXECUTE 'CREATE POLICY "activos_delete" ON erp_activos
      FOR DELETE TO authenticated
      USING (public.get_current_user_role() = ''Administrador''
        OR proyecto_id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))))';
  END IF;
END $$;

-- erp_cuadros (conditional - only if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_cuadros') THEN
    DROP POLICY IF EXISTS "cuadros_delete" ON erp_cuadros;
    EXECUTE 'CREATE POLICY "cuadros_delete" ON erp_cuadros
      FOR DELETE TO authenticated
      USING (public.get_current_user_role() = ''Administrador''
        OR proyecto_id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))))';
  END IF;
END $$;

-- erp_planos (conditional - only if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_planos') THEN
    DROP POLICY IF EXISTS "planos_delete" ON erp_planos;
    EXECUTE 'CREATE POLICY "planos_delete" ON erp_planos
      FOR DELETE TO authenticated
      USING (public.get_current_user_role() = ''Administrador''
        OR proyecto_id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))))';
  END IF;
END $$;

-- erp_rfis (conditional - only if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_rfis') THEN
    DROP POLICY IF EXISTS "rfis_delete" ON erp_rfis;
    EXECUTE 'CREATE POLICY "rfis_delete" ON erp_rfis
      FOR DELETE TO authenticated
      USING (public.get_current_user_role() = ''Administrador''
        OR proyecto_id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))))';
  END IF;
END $$;

-- erp_submittals (conditional - only if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_submittals') THEN
    DROP POLICY IF EXISTS "submittals_delete" ON erp_submittals;
    EXECUTE 'CREATE POLICY "submittals_delete" ON erp_submittals
      FOR DELETE TO authenticated
      USING (public.get_current_user_role() = ''Administrador''
        OR proyecto_id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))))';
  END IF;
END $$;

-- ============================================================
-- PART 3: Grant DELETE permissions on all tables (conditionally)
-- ============================================================

GRANT DELETE ON TABLE erp_proyectos TO authenticated;
GRANT DELETE ON TABLE erp_movimientos TO authenticated;
GRANT DELETE ON TABLE erp_licitaciones TO authenticated;
GRANT DELETE ON TABLE erp_cuentas_cobrar TO authenticated;
GRANT DELETE ON TABLE erp_cuentas_pagar TO authenticated;
GRANT DELETE ON TABLE erp_ordenes_compra TO authenticated;
GRANT DELETE ON TABLE erp_vales_salida TO authenticated;

-- Grant on optional tables only if they exist
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_activos') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_activos TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_cuadros') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_cuadros TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_planos') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_planos TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_rfis') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_rfis TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_submittals') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_submittals TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_hitos') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_hitos TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_riesgos') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_riesgos TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_ordenes_cambio') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_ordenes_cambio TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_publicaciones_muro') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_publicaciones_muro TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_incidentes') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_incidentes TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_pruebas_laboratorio') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_pruebas_laboratorio TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_no_conformidades') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_no_conformidades TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_liberaciones_partida') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_liberaciones_partida TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_presupuestos') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_presupuestos TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_avances') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_avances TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_seguimiento_evm') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_seguimiento_evm TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_bitacora') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_bitacora TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_destajos') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_destajos TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_recepciones') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_recepciones TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_pagos_proveedor') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_pagos_proveedor TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_empleados') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_empleados TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_materiales') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_materiales TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_proveedores') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_proveedores TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_eventos_calendario') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_eventos_calendario TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_notificaciones') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_notificaciones TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_cotizaciones_negocio') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_cotizaciones_negocio TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='ventas_paquetes') THEN
    EXECUTE 'GRANT DELETE ON TABLE ventas_paquetes TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_plantillas_proyectos') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_plantillas_proyectos TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_centros_costo') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_centros_costo TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_insumos_base') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_insumos_base TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_reglas_factores') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_reglas_factores TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_normativas_departamentales') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_normativas_departamentales TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_escalas_produccion') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_escalas_produccion TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='erp_estacionalidad') THEN
    EXECUTE 'GRANT DELETE ON TABLE erp_estacionalidad TO authenticated';
  END IF;
END $$;
