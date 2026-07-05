-- Migration: Remove duplicate indexes across all tables
-- Each group of identical indexes keeps only one (the erp_-prefixed convention)

-- activos_herramientas
DROP INDEX IF EXISTS idx_activos_proyecto;

-- erp_activos
DROP INDEX IF EXISTS idx_erp_activos_proyecto;

-- erp_aplicacion_escalas
DROP INDEX IF EXISTS idx_aplicacion_escalas_proyecto;

-- erp_auditoria
DROP INDEX IF EXISTS idx_auditoria_creado;
DROP INDEX IF EXISTS idx_auditoria_tabla;

-- erp_avances
DROP INDEX IF EXISTS idx_avances_fecha;
DROP INDEX IF EXISTS idx_avances_proyecto_id;
DROP INDEX IF EXISTS idx_erp_avances_proyecto;

-- erp_bitacora
DROP INDEX IF EXISTS idx_bitacora_proyecto;
DROP INDEX IF EXISTS idx_bitacora_proyecto_id;
DROP INDEX IF EXISTS idx_erp_bitacora_proyecto;

-- erp_calculos_proyecto
DROP INDEX IF EXISTS idx_calculos_proyecto_proyecto;

-- erp_cotizaciones_negocio
DROP INDEX IF EXISTS idx_erp_cotizaciones_estado;

-- erp_cuadros
DROP INDEX IF EXISTS idx_erp_cuadros_proyecto;

-- erp_cuentas_cobrar
DROP INDEX IF EXISTS idx_ccobrar_estado;
DROP INDEX IF EXISTS idx_ctas_cobrar_estado;
DROP INDEX IF EXISTS idx_ctas_cobrar_vencimiento;
DROP INDEX IF EXISTS idx_ccobrar_proyecto_id;
DROP INDEX IF EXISTS idx_ctas_cobrar_proyecto;
DROP INDEX IF EXISTS idx_cuentas_cobrar_proyecto;
DROP INDEX IF EXISTS idx_cuentas_cobrar_proyecto_id;
DROP INDEX IF EXISTS idx_erp_cuentas_cobrar_proyecto;

-- erp_cuentas_pagar
DROP INDEX IF EXISTS idx_cpagar_estado;
DROP INDEX IF EXISTS idx_ctas_pagar_estado;
DROP INDEX IF EXISTS idx_ctas_pagar_vencimiento;
DROP INDEX IF EXISTS idx_cpagar_proyecto_id;
DROP INDEX IF EXISTS idx_ctas_pagar_proyecto;
DROP INDEX IF EXISTS idx_cuentas_pagar_proyecto;
DROP INDEX IF EXISTS idx_cuentas_pagar_proyecto_id;
DROP INDEX IF EXISTS idx_erp_cuentas_pagar_proyecto;

-- erp_cumplimiento_normativo
DROP INDEX IF EXISTS idx_cumplimiento_proyecto;

-- erp_empleados
DROP INDEX IF EXISTS idx_empleados_proyecto_id;
DROP INDEX IF EXISTS idx_erp_empleados_proyecto;

-- erp_escalas_produccion
DROP INDEX IF EXISTS idx_escalas_activo;
DROP INDEX IF EXISTS idx_escalas_tamano;

-- erp_eventos_calendario
DROP INDEX IF EXISTS idx_erp_eventos_proyecto;
DROP INDEX IF EXISTS idx_eventos_proyecto_id;

-- erp_hitos
DROP INDEX IF EXISTS idx_hitos_proyecto;
DROP INDEX IF EXISTS idx_hitos_proyecto_id;

-- erp_incidentes
DROP INDEX IF EXISTS idx_incidentes_estado;
DROP INDEX IF EXISTS idx_erp_incidentes_proyecto;
DROP INDEX IF EXISTS idx_incidentes_proyecto;
DROP INDEX IF EXISTS idx_incidentes_proyecto_id;

-- erp_insumos
DROP INDEX IF EXISTS idx_insumos_renglon_id;

-- erp_liberaciones_partida
DROP INDEX IF EXISTS idx_liberaciones_proyecto;
DROP INDEX IF EXISTS idx_liberaciones_proyecto_id;

-- erp_licitaciones
DROP INDEX IF EXISTS idx_licitaciones_estado;

-- erp_movimientos
DROP INDEX IF EXISTS idx_erp_movimientos_proyecto;
DROP INDEX IF EXISTS idx_movimientos_proyecto_id;

-- erp_muro
DROP INDEX IF EXISTS idx_muro_proyecto;
DROP INDEX IF EXISTS idx_muro_proyecto_id;

-- erp_no_conformidades
DROP INDEX IF EXISTS idx_nc_estado;
DROP INDEX IF EXISTS idx_nc_proyecto_id;
DROP INDEX IF EXISTS idx_no_conformidades_proyecto;
DROP INDEX IF EXISTS idx_no_conformidades_proyecto_id;

-- erp_normativa_departamental
DROP INDEX IF EXISTS idx_normativa_activo;

-- erp_ordenes_cambio
DROP INDEX IF EXISTS idx_ocambio_estado;
DROP INDEX IF EXISTS idx_ocambio_proyecto;
DROP INDEX IF EXISTS idx_ordenes_cambio_proyecto;
DROP INDEX IF EXISTS idx_ordenes_cambio_proyecto_id;

-- erp_ordenes_compra
DROP INDEX IF EXISTS idx_oc_estado;
DROP INDEX IF EXISTS idx_ordenes_estado;
DROP INDEX IF EXISTS idx_oc_proveedor;
DROP INDEX IF EXISTS idx_erp_ordenes_compra_proyecto;
DROP INDEX IF EXISTS idx_oc_proyecto_id;
DROP INDEX IF EXISTS idx_ordenes_proyecto_id;

-- erp_planos
DROP INDEX IF EXISTS idx_erp_planos_proyecto;
DROP INDEX IF EXISTS idx_planos_proyecto;

-- erp_presupuestos
DROP INDEX IF EXISTS idx_presupuestos_estado;
DROP INDEX IF EXISTS idx_erp_presupuestos_proyecto;
DROP INDEX IF EXISTS idx_presupuestos_proyecto;
DROP INDEX IF EXISTS idx_presupuestos_proyecto_id;

-- erp_proyecto_miembros
DROP INDEX IF EXISTS idx_miembros_proyecto;

-- erp_proyectos
DROP INDEX IF EXISTS idx_proyectos_created_by;
DROP INDEX IF EXISTS idx_proyectos_estado;
DROP INDEX IF EXISTS idx_proyectos_fecha_inicio;

-- erp_pruebas_laboratorio
DROP INDEX IF EXISTS idx_pruebas_proyecto;
DROP INDEX IF EXISTS idx_pruebas_proyecto_id;

-- erp_renglones
DROP INDEX IF EXISTS idx_erp_renglones_proyecto;
DROP INDEX IF EXISTS idx_renglones_proyecto_id;

-- erp_rfis
DROP INDEX IF EXISTS idx_erp_rfis_proyecto;
DROP INDEX IF EXISTS idx_rfis_proyecto;

-- erp_riesgos
DROP INDEX IF EXISTS idx_riesgos_nivel;
DROP INDEX IF EXISTS idx_erp_riesgos_proyecto;
DROP INDEX IF EXISTS idx_riesgos_proyecto;
DROP INDEX IF EXISTS idx_riesgos_proyecto_id;

-- erp_seguimiento
DROP INDEX IF EXISTS idx_erp_seguimiento_proyecto;

-- erp_seguimiento_evm
DROP INDEX IF EXISTS idx_seguimiento_evm_proyecto;

-- erp_sub_renglones
DROP INDEX IF EXISTS idx_sub_renglones_renglon_id;

-- erp_submittals
DROP INDEX IF EXISTS idx_erp_submittals_proyecto;
DROP INDEX IF EXISTS idx_submittals_proyecto;

-- erp_vales_salida
DROP INDEX IF EXISTS idx_erp_vales_salida_proyecto;
DROP INDEX IF EXISTS idx_vales_proyecto;
DROP INDEX IF EXISTS idx_vales_proyecto_id;

-- logs_sistema
DROP INDEX IF EXISTS idx_logs_entidad;
