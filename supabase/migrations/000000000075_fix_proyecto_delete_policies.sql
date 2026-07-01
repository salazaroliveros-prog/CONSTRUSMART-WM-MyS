-- ============================================================
-- MIGRACIÓN 075: Fix Proyecto Delete Policies
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

-- erp_ordenes_compra
DROP POLICY IF EXISTS "ordenes_compra_delete" ON erp_ordenes_compra;
CREATE POLICY "ordenes_compra_delete" ON erp_ordenes_compra
  FOR DELETE TO authenticated
  USING (public.get_current_user_role() = 'Administrador'
    OR proyecto_id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))));

-- erp_vales_salida
DROP POLICY IF EXISTS "vales_salida_delete" ON erp_vales_salida;
CREATE POLICY "vales_salida_delete" ON erp_vales_salida
  FOR DELETE TO authenticated
  USING (public.get_current_user_role() = 'Administrador'
    OR proyecto_id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))));

-- erp_activos
DROP POLICY IF EXISTS "activos_delete" ON erp_activos;
CREATE POLICY "activos_delete" ON erp_activos
  FOR DELETE TO authenticated
  USING (public.get_current_user_role() = 'Administrador'
    OR proyecto_id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))));

-- erp_cuadros
DROP POLICY IF EXISTS "cuadros_delete" ON erp_cuadros;
CREATE POLICY "cuadros_delete" ON erp_cuadros
  FOR DELETE TO authenticated
  USING (public.get_current_user_role() = 'Administrador'
    OR proyecto_id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))));

-- erp_planos
DROP POLICY IF EXISTS "planos_delete" ON erp_planos;
CREATE POLICY "planos_delete" ON erp_planos
  FOR DELETE TO authenticated
  USING (public.get_current_user_role() = 'Administrador'
    OR proyecto_id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))));

-- erp_rfis
DROP POLICY IF EXISTS "rfis_delete" ON erp_rfis;
CREATE POLICY "rfis_delete" ON erp_rfis
  FOR DELETE TO authenticated
  USING (public.get_current_user_role() = 'Administrador'
    OR proyecto_id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))));

-- erp_submittals
DROP POLICY IF EXISTS "submittals_delete" ON erp_submittals;
CREATE POLICY "submittals_delete" ON erp_submittals
  FOR DELETE TO authenticated
  USING (public.get_current_user_role() = 'Administrador'
    OR proyecto_id IN (SELECT unnest(ARRAY(SELECT get_accessible_proyectos()))));

-- ============================================================
-- PART 3: Grant DELETE permissions on all tables
-- ============================================================

GRANT DELETE ON TABLE erp_proyectos TO authenticated;
GRANT DELETE ON TABLE erp_movimientos TO authenticated;
GRANT DELETE ON TABLE erp_licitaciones TO authenticated;
GRANT DELETE ON TABLE erp_cuentas_cobrar TO authenticated;
GRANT DELETE ON TABLE erp_cuentas_pagar TO authenticated;
GRANT DELETE ON TABLE erp_ordenes_compra TO authenticated;
GRANT DELETE ON TABLE erp_vales_salida TO authenticated;
GRANT DELETE ON TABLE erp_activos TO authenticated;
GRANT DELETE ON TABLE erp_cuadros TO authenticated;
GRANT DELETE ON TABLE erp_planos TO authenticated;
GRANT DELETE ON TABLE erp_rfis TO authenticated;
GRANT DELETE ON TABLE erp_submittals TO authenticated;
GRANT DELETE ON TABLE erp_hitos TO authenticated;
GRANT DELETE ON TABLE erp_riesgos TO authenticated;
GRANT DELETE ON TABLE erp_ordenes_cambio TO authenticated;
GRANT DELETE ON TABLE erp_publicaciones_muro TO authenticated;
GRANT DELETE ON TABLE erp_incidentes TO authenticated;
GRANT DELETE ON TABLE erp_pruebas_laboratorio TO authenticated;
GRANT DELETE ON TABLE erp_no_conformidades TO authenticated;
GRANT DELETE ON TABLE erp_liberaciones_partida TO authenticated;
GRANT DELETE ON TABLE erp_presupuestos TO authenticated;
GRANT DELETE ON TABLE erp_avances TO authenticated;
GRANT DELETE ON TABLE erp_seguimiento_evm TO authenticated;
GRANT DELETE ON TABLE erp_bitacora TO authenticated;
GRANT DELETE ON TABLE erp_destajos TO authenticated;
GRANT DELETE ON TABLE erp_recepciones TO authenticated;
GRANT DELETE ON TABLE erp_pagos_proveedor TO authenticated;
GRANT DELETE ON TABLE erp_empleados TO authenticated;
GRANT DELETE ON TABLE erp_materiales TO authenticated;
GRANT DELETE ON TABLE erp_proveedores TO authenticated;
GRANT DELETE ON TABLE erp_eventos_calendario TO authenticated;
GRANT DELETE ON TABLE erp_notificaciones TO authenticated;
GRANT DELETE ON TABLE erp_cotizaciones_negocio TO authenticated;
GRANT DELETE ON TABLE ventas_paquetes TO authenticated;
GRANT DELETE ON TABLE erp_plantillas_proyectos TO authenticated;
GRANT DELETE ON TABLE erp_centros_costo TO authenticated;
GRANT DELETE ON TABLE erp_insumos_base TO authenticated;
GRANT DELETE ON TABLE erp_reglas_factores TO authenticated;
GRANT DELETE ON TABLE erp_normativas_departamentales TO authenticated;
GRANT DELETE ON TABLE erp_escalas_produccion TO authenticated;
GRANT DELETE ON TABLE erp_estacionalidad TO authenticated;
