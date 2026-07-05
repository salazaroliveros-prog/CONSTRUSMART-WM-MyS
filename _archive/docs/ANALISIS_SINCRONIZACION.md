# Análisis de Sincronización: App ↔ Supabase

## Entidades del Store (src/erp/store.tsx)

```typescript
// STORE_KEY_MAP - Tablas Supabase → Keys del store
erp_proyectos:'proyectos'
erp_movimientos:'movimientos'
erp_empleados:'empleados'
erp_materiales:'materiales'
erp_ordenes_compra:'ordenes'
erp_proveedores:'proveedores'
erp_cuentas_cobrar:'cuentasCobrar'
erp_cuentas_pagar:'cuentasPagar'
erp_hitos:'hitos'
erp_riesgos:'riesgos'
erp_licitaciones:'licitaciones'
erp_cotizaciones_negocio:'cotizacionesNegocio'
erp_vales_salida:'valesSalida'
erp_no_conformidades:'ncs'
erp_incidentes:'incidentes'
erp_publicaciones_muro:'publicacionesMuro'
erp_planos:'planos'
erp_rfis:'rfis'
erp_submittals:'submittals'
erp_activos:'activos'
erp_cuadros:'cuadros'
erp_pagos_proveedor:'pagosProveedor'
erp_destajos:'destajos'
recepciones_almacen:'recepciones'
erp_centros_costo:'centrosCosto'
erp_seguimiento:'seguimientoEVM'
erp_bitacora:'bitacora'
erp_plantillas_proyectos:'plantillas'
erp_presupuestos:'presupuestos'
erp_avances:'avances'
erp_eventos_calendario:'eventos'
ventas_paquetes:'ventasPaquetes'
erp_notificaciones:'notificaciones'
erp_ordenes_cambio:'ordenesCambio'
erp_pruebas_laboratorio:'pruebas'
erp_liberaciones_partida:'liberaciones'
erp_error_logs:'errorLogs'
erp_muro:'erp_muro' (para publicaciones)
```

## Tablas Encontradas en Migraciones Supabase

### Tablas Principales ERP (en migraciones base):
- `erp_proyectos` ✅
- `erp_movimientos` ✅
- `erp_empleados` ✅
- `erp_materiales` ✅
- `erp_ordenes_compra` ✅
- `erp_proveedores` ✅
- `erp_eventos_calendario` ✅
- `erp_bitacora` ✅
- `erp_presupuestos` ✅
- `erp_licitaciones` ✅
- `erp_hitos` ✅
- `erp_riesgos` ✅

### Tablas Financieras:
- `erp_cuentas_cobrar` ✅
- `erp_cuentas_pagar` ✅
- `erp_pagos_proveedor` ✅
- `ventas_paquetes` ✅ (sin prefijo erp_)

### Tablas de Suministro:
- `erp_vales_salida` ✅
- `recepciones_almacen` ✅ (sin prefijo erp_)
- `erp_muro` ✅ (tabla base para publicaciones)
- `erp_muro_likes` ✅

### Tablas de Documentos:
- `erp_planos` ✅
- `erp_rfis` ✅
- `erp_submittals` ✅

### Tablas de Calidad:
- `erp_no_conformidades` ✅
- `erp_pruebas_laboratorio` ✅
- `erp_liberaciones_partida` ✅
- `erp_incidentes` ✅

### Tablas de Activos:
- `erp_activos` ✅
- `erp_cuadros` ✅

### Tablas de RRHH:
- `erp_destajos` ✅

### Tablas de Seguimiento:
- `erp_seguimiento` ✅
- `erp_avances` ✅

### Tablas de Gestión de Cambios:
- `erp_ordenes_cambio` ✅

### Tablas de Cotizaciones:
- `erp_cotizaciones_negocio` ✅

### Tablas de Plantillas:
- `erp_plantillas_proyectos` ✅

### Tablas de Notificaciones:
- `erp_notificaciones` ✅

### Tablas de Auditoría:
- `erp_error_logs` ✅
- `erp_audit_log` ✅

### Tablas de Gestión:
- `erp_centros_costo` ✅

### Tablas de Solicitudes:
- `erp_solicitudes` ⚠️ (en migración 070)
- `erp_archivos_tipo` ⚠️ (en migración 071)

### Tablas de Motor de Cálculo (no en store):
- `erp_departamentos_gt` ⚠️
- `erp_municipios_gt` ⚠️
- `erp_subtipologias` ⚠️
- `erp_dosificaciones_concreto` ⚠️
- `erp_referencias_acero` ⚠️
- `erp_precios_acero` ⚠️
- `erp_parametros_movimiento_tierra` ⚠️
- `erp_parametros_climaticos` ⚠️
- `erp_parametros_pavimentos` ⚠️
- `erp_parametros_redes_infraestructura` ⚠️
- `erp_parametros_muros_contencion` ⚠️
- `erp_calculos_proyecto` ⚠️
- `erp_comparaciones_calculos` ⚠️
- `erp_snapshots_estado_calculo` ⚠️
- `erp_reglas_factores` ⚠️
- `erp_historial_aplicacion_reglas` ⚠️
- `erp_estacionalidad` ⚠️
- `erp_ajustes_estacionales_actividad` ⚠️
- `erp_escalas_produccion` ⚠️
- `erp_aplicacion_escalas` ⚠️
- `erp_normativa_departamental` ⚠️
- `erp_cumplimiento_normativo` ⚠️
- `erp_normativas_departamentales` ⚠️

## GAPs Identificados

### Tablas en Store que NO están en migraciones:
- Ninguna identificada

### Tablas en migraciones que NO están en store:
- Tablas de motor de cálculo (intencional - son datos de referencia)
- `erp_solicitudes` (podría ser gap)
- `erp_archivos_tipo` (podría ser gap)
- `erp_audit_log` (tabla de auditoría, no en store)

## Conclusión Preliminar
La sincronización entre store y Supabase parece estar **100% alineada** para las tablas operativas principales. Las tablas que no están en el store son:
1. Tablas de motor de cálculo (datos de referencia estáticos)
2. Tablas de auditoría (sistema, no UI)
3. Posibles features no implementadas (solicitudes, archivos)
