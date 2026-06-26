-- Migration 047: Fix Critical Nullable Columns
-- This migration adds NOT NULL constraints to critical columns to ensure data integrity

-- Phase 1: Fix critical ID columns (should already be NOT NULL, but enforcing it)
ALTER TABLE erp_activos_herramienta ALTER COLUMN id SET NOT NULL;
ALTER TABLE erp_cuadros_comparativos ALTER COLUMN id SET NOT NULL;
ALTER TABLE erp_incidentes_sso ALTER COLUMN id SET NOT NULL;
ALTER TABLE erp_publicaciones_muro ALTER COLUMN id SET NOT NULL;

-- Phase 2: Fix proyecto_id columns in transactional tables
ALTER TABLE erp_activos ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_activos_herramienta ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_cuadros ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_cuadros_comparativos ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_cuentas_cobrar ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_cuentas_pagar ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_eventos_calendario ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_hitos ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_incidentes ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_incidentes_sso ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_liberaciones_partida ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_licitaciones ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_muro ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_no_conformidades ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_notificaciones ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_ordenes_cambio ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_ordenes_compra ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_planos ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_presupuestos ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_pruebas_laboratorio ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_publicaciones_muro ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_rfis ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_riesgos ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_seguimiento ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_submittals ALTER COLUMN proyecto_id SET NOT NULL;
ALTER TABLE erp_vales_salida ALTER COLUMN proyecto_id SET NOT NULL;

-- Phase 3: Fix created_at columns with default values
-- First, update any NULL values to NOW()
UPDATE erp_auditoria SET created_at = NOW() WHERE created_at IS NULL;
UPDATE erp_categorias_materiales SET created_at = NOW() WHERE created_at IS NULL;
UPDATE erp_configuracion_avance SET created_at = NOW() WHERE created_at IS NULL;
UPDATE erp_contactos_proveedor SET created_at = NOW() WHERE created_at IS NULL;
UPDATE erp_empresas SET created_at = NOW() WHERE created_at IS NULL;
UPDATE erp_estados_orden SET created_at = NOW() WHERE created_at IS NULL;
UPDATE erp_insumos_base SET created_at = NOW() WHERE created_at IS NULL;
UPDATE erp_parametros_sistema SET created_at = NOW() WHERE created_at IS NULL;
UPDATE erp_partidas_cotizadas SET created_at = NOW() WHERE created_at IS NULL;
UPDATE erp_plantillas_proyectos SET created_at = NOW() WHERE created_at IS NULL;
UPDATE erp_porcentajes_avance SET created_at = NOW() WHERE created_at IS NULL;
UPDATE erp_proveedores SET created_at = NOW() WHERE created_at IS NULL;
UPDATE erp_rol_usuario SET created_at = NOW() WHERE created_at IS NULL;
UPDATE erp_subtipologias SET created_at = NOW() WHERE created_at IS NULL;
UPDATE erp_tipologias SET created_at = NOW() WHERE created_at IS NULL;
UPDATE erp_usuarios SET created_at = NOW() WHERE created_at IS NULL;

-- Then add NOT NULL constraint and default
ALTER TABLE erp_auditoria ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE erp_auditoria ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE erp_categorias_materiales ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE erp_categorias_materiales ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE erp_configuracion_avance ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE erp_configuracion_avance ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE erp_contactos_proveedor ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE erp_contactos_proveedor ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE erp_empresas ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE erp_empresas ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE erp_estados_orden ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE erp_estados_orden ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE erp_insumos_base ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE erp_insumos_base ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE erp_parametros_sistema ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE erp_parametros_sistema ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE erp_partidas_cotizadas ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE erp_partidas_cotizadas ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE erp_plantillas_proyectos ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE erp_plantillas_proyectos ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE erp_porcentajes_avance ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE erp_porcentajes_avance ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE erp_proveedores ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE erp_proveedores ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE erp_rol_usuario ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE erp_rol_usuario ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE erp_subtipologias ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE erp_subtipologias ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE erp_tipologias ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE erp_tipologias ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE erp_usuarios ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE erp_usuarios ALTER COLUMN created_at SET DEFAULT NOW();

-- Phase 4: Fix updated_at columns with default values
-- First, update any NULL values to NOW()
UPDATE erp_auditoria SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE erp_categorias_materiales SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE erp_configuracion_avance SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE erp_contactos_proveedor SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE erp_empresas SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE erp_estados_orden SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE erp_insumos_base SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE erp_parametros_sistema SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE erp_partidas_cotizadas SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE erp_plantillas_proyectos SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE erp_porcentajes_avance SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE erp_proveedores SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE erp_rol_usuario SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE erp_subtipologias SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE erp_tipologias SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE erp_usuarios SET updated_at = NOW() WHERE updated_at IS NULL;

-- Then add NOT NULL constraint and default
ALTER TABLE erp_auditoria ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE erp_auditoria ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE erp_categorias_materiales ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE erp_categorias_materiales ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE erp_configuracion_avance ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE erp_configuracion_avance ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE erp_contactos_proveedor ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE erp_contactos_proveedor ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE erp_empresas ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE erp_empresas ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE erp_estados_orden ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE erp_estados_orden ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE erp_insumos_base ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE erp_insumos_base ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE erp_parametros_sistema ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE erp_parametros_sistema ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE erp_partidas_cotizadas ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE erp_partidas_cotizadas ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE erp_plantillas_proyectos ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE erp_plantillas_proyectos ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE erp_porcentajes_avance ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE erp_porcentajes_avance ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE erp_proveedores ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE erp_proveedores ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE erp_rol_usuario ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE erp_rol_usuario ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE erp_subtipologias ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE erp_subtipologias ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE erp_tipologias ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE erp_tipologias ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE erp_usuarios ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE erp_usuarios ALTER COLUMN updated_at SET DEFAULT NOW();

-- Rollback function
CREATE OR REPLACE FUNCTION rollback_047_fix_nullable_columns()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Remove NOT NULL constraints (this will also remove defaults)
  ALTER TABLE erp_activos_herramienta ALTER COLUMN id DROP NOT NULL;
  ALTER TABLE erp_cuadros_comparativos ALTER COLUMN id DROP NOT NULL;
  ALTER TABLE erp_incidentes_sso ALTER COLUMN id DROP NOT NULL;
  ALTER TABLE erp_publicaciones_muro ALTER COLUMN id DROP NOT NULL;

  ALTER TABLE erp_activos ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_activos_herramienta ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_cuadros ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_cuadros_comparativos ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_cuentas_cobrar ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_cuentas_pagar ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_eventos_calendario ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_hitos ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_incidentes ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_incidentes_sso ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_liberaciones_partida ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_licitaciones ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_muro ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_no_conformidades ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_notificaciones ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_ordenes_cambio ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_ordenes_compra ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_planos ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_presupuestos ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_pruebas_laboratorio ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_publicaciones_muro ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_rfis ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_riesgos ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_seguimiento ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_submittals ALTER COLUMN proyecto_id DROP NOT NULL;
  ALTER TABLE erp_vales_salida ALTER COLUMN proyecto_id DROP NOT NULL;

  ALTER TABLE erp_auditoria ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE erp_auditoria ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE erp_auditoria ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE erp_auditoria ALTER COLUMN updated_at DROP DEFAULT;

  ALTER TABLE erp_categorias_materiales ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE erp_categorias_materiales ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE erp_categorias_materiales ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE erp_categorias_materiales ALTER COLUMN updated_at DROP DEFAULT;

  ALTER TABLE erp_configuracion_avance ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE erp_configuracion_avance ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE erp_configuracion_avance ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE erp_configuracion_avance ALTER COLUMN updated_at DROP DEFAULT;

  ALTER TABLE erp_contactos_proveedor ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE erp_contactos_proveedor ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE erp_contactos_proveedor ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE erp_contactos_proveedor ALTER COLUMN updated_at DROP DEFAULT;

  ALTER TABLE erp_empresas ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE erp_empresas ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE erp_empresas ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE erp_empresas ALTER COLUMN updated_at DROP DEFAULT;

  ALTER TABLE erp_estados_orden ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE erp_estados_orden ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE erp_estados_orden ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE erp_estados_orden ALTER COLUMN updated_at DROP DEFAULT;

  ALTER TABLE erp_insumos_base ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE erp_insumos_base ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE erp_insumos_base ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE erp_insumos_base ALTER COLUMN updated_at DROP DEFAULT;

  ALTER TABLE erp_parametros_sistema ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE erp_parametros_sistema ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE erp_parametros_sistema ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE erp_parametros_sistema ALTER COLUMN updated_at DROP DEFAULT;

  ALTER TABLE erp_partidas_cotizadas ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE erp_partidas_cotizadas ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE erp_partidas_cotizadas ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE erp_partidas_cotizadas ALTER COLUMN updated_at DROP DEFAULT;

  ALTER TABLE erp_plantillas_proyectos ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE erp_plantillas_proyectos ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE erp_plantillas_proyectos ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE erp_plantillas_proyectos ALTER COLUMN updated_at DROP DEFAULT;

  ALTER TABLE erp_porcentajes_avance ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE erp_porcentajes_avance ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE erp_porcentajes_avance ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE erp_porcentajes_avance ALTER COLUMN updated_at DROP DEFAULT;

  ALTER TABLE erp_proveedores ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE erp_proveedores ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE erp_proveedores ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE erp_proveedores ALTER COLUMN updated_at DROP DEFAULT;

  ALTER TABLE erp_rol_usuario ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE erp_rol_usuario ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE erp_rol_usuario ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE erp_rol_usuario ALTER COLUMN updated_at DROP DEFAULT;

  ALTER TABLE erp_subtipologias ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE erp_subtipologias ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE erp_subtipologias ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE erp_subtipologias ALTER COLUMN updated_at DROP DEFAULT;

  ALTER TABLE erp_tipologias ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE erp_tipologias ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE erp_tipologias ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE erp_tipologias ALTER COLUMN updated_at DROP DEFAULT;

  ALTER TABLE erp_usuarios ALTER COLUMN created_at DROP NOT NULL;
  ALTER TABLE erp_usuarios ALTER COLUMN created_at DROP DEFAULT;
  ALTER TABLE erp_usuarios ALTER COLUMN updated_at DROP NOT NULL;
  ALTER TABLE erp_usuarios ALTER COLUMN updated_at DROP DEFAULT;
END;
$$;
