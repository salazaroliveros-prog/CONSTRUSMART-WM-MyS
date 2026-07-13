# Schema Alignment Audit Report

**Generated:** 2026-07-13T09:39:41.491Z

## Executive Summary

This report compares three sources of truth:
1. **Remote Supabase DB** (live schema)
2. **Local migrations** (SQL files)
3. **App Zod schemas** (TypeScript files)

### Statistics

| Metric | Count |
|--------|-------|
| Remote tables | 74 |
| Remote columns | 1000 |
| Remote constraints | 959 |
| Remote check constraints | 762 |
| Remote enum types | 12 |
| Remote enum values | 48 |
| Remote indexes | 331 |
| Migration files | 96 |
| Migration tables | 84 |
| App schema entities | 66 |

## 1. Table Alignment

### Common Tables (64)

| Remote Table | Migration Table | Remote Cols | Migration Cols | Status |
|--------------|-----------------|------------|----------------|--------|
| erp_access_log | erp_access_log | 8 | 8 | ✅ |
| erp_activos | erp_activos | 23 | 17 | ⚠️ |
| erp_app_config | erp_app_config | 14 | 14 | ✅ |
| erp_archivos_tipo | erp_archivos_tipo | 6 | 6 | ✅ |
| erp_auditoria | erp_auditoria | 9 | 9 | ⚠️ |
| erp_avances | erp_avances | 13 | 13 | ⚠️ |
| erp_backup_config | erp_backup_config | 12 | 12 | ✅ |
| erp_bitacora | erp_bitacora | 15 | 11 | ⚠️ |
| erp_cajas_chicas | cajas_chicas | 16 | 16 | ✅ |
| erp_centros_costo | erp_centros_costo | 9 | 9 | ✅ |
| erp_cotizaciones_negocio | erp_cotizaciones_negocio | 19 | 19 | ✅ |
| erp_cuadros | erp_cuadros | 16 | 11 | ⚠️ |
| erp_cuentas_cobrar | erp_cuentas_cobrar | 14 | 14 | ✅ |
| erp_cuentas_pagar | erp_cuentas_pagar | 14 | 15 | ⚠️ |
| erp_departamentos_gt | erp_departamentos_gt | 15 | 15 | ✅ |
| erp_destajos | erp_destajos | 12 | 12 | ✅ |
| erp_dosificaciones_concreto | erp_dosificaciones_concreto | 15 | 14 | ⚠️ |
| erp_empleados | erp_empleados | 13 | 11 | ⚠️ |
| erp_empresas | erp_empresas | 9 | 9 | ✅ |
| erp_error_log | erp_error_log | 24 | 24 | ✅ |
| erp_escalas_produccion | erp_escalas_produccion | 12 | 15 | ⚠️ |
| erp_estacionalidad | erp_estacionalidad | 11 | 10 | ⚠️ |
| erp_eventos_calendario | erp_eventos_calendario | 11 | 11 | ⚠️ |
| erp_historial_aplicacion_reglas | erp_historial_aplicacion_reglas | 11 | 11 | ⚠️ |
| erp_hitos | erp_hitos | 13 | 15 | ⚠️ |
| erp_incidentes | erp_incidentes | 17 | 10 | ⚠️ |
| erp_insumos | erp_insumos | 10 | 10 | ✅ |
| erp_insumos_base | erp_insumos_base | 8 | 10 | ⚠️ |
| erp_liberaciones_partida | erp_liberaciones_partida | 14 | 9 | ⚠️ |
| erp_licitaciones | erp_licitaciones | 13 | 11 | ⚠️ |
| erp_logs_sistema | logs_sistema | 10 | 10 | ✅ |
| erp_materiales | erp_materiales | 17 | 13 | ⚠️ |
| erp_monitoring_config | erp_monitoring_config | 15 | 15 | ✅ |
| erp_movimientos | erp_movimientos | 21 | 13 | ⚠️ |
| erp_municipios_gt | erp_municipios_gt | 12 | 12 | ✅ |
| erp_muro | erp_muro | 13 | 6 | ⚠️ |
| erp_no_conformidades | erp_no_conformidades | 14 | 8 | ⚠️ |
| erp_normativa_departamental | erp_normativa_departamental | 14 | 14 | ✅ |
| erp_notificaciones | erp_notificaciones | 10 | 8 | ⚠️ |
| erp_ordenes_cambio | erp_ordenes_cambio | 14 | 17 | ⚠️ |
| erp_ordenes_compra | erp_ordenes_compra | 14 | 13 | ⚠️ |
| erp_pagos_proveedor | erp_pagos_proveedor | 9 | 9 | ✅ |
| erp_parametros_climaticos | erp_parametros_climaticos | 19 | 19 | ⚠️ |
| erp_parametros_movimiento_tierra | erp_parametros_movimiento_tierra | 16 | 16 | ⚠️ |
| erp_parametros_muros_contencion | erp_parametros_muros_contencion | 15 | 15 | ✅ |
| erp_parametros_pavimentos | erp_parametros_pavimentos | 14 | 14 | ✅ |
| erp_parametros_redes_infraestructura | erp_parametros_redes_infraestructura | 12 | 12 | ✅ |
| erp_planos | erp_planos | 17 | 11 | ⚠️ |
| erp_plantillas_proyectos | erp_plantillas_proyectos | 21 | 16 | ⚠️ |
| erp_precios_acero | erp_precios_acero | 10 | 10 | ✅ |
| erp_presupuestos | erp_presupuestos | 16 | 16 | ✅ |
| erp_proveedores | erp_proveedores | 11 | 8 | ⚠️ |
| erp_proyecto_miembros | erp_proyecto_miembros | 6 | 7 | ⚠️ |
| erp_proyecto_weather | erp_proyecto_weather | 11 | 10 | ⚠️ |
| erp_proyectos | erp_proyectos | 50 | 50 | ✅ |
| erp_pruebas_laboratorio | erp_pruebas_laboratorio | 12 | 10 | ⚠️ |
| erp_publicaciones_muro | erp_publicaciones_muro | 11 | 11 | ✅ |
| erp_recepciones | erp_recepciones | 8 | 8 | ✅ |
| erp_referencias_acero | erp_referencias_acero | 13 | 13 | ✅ |
| erp_reglas_factores | erp_reglas_factores | 17 | 17 | ✅ |
| erp_rendimientos_cuadrilla | erp_rendimientos_cuadrilla | 8 | 8 | ✅ |
| erp_renglones | erp_renglones | 14 | 14 | ✅ |
| erp_rfis | erp_rfis | 19 | 10 | ⚠️ |
| erp_riesgos | erp_riesgos | 3 | 18 | ⚠️ |

### Tables Only in Remote (10)

- **erp_ajustes_estacionales_actividad** (10 columns): id, estacionalidad_id, tipo_actividad, factor_especifico, impacto_duracion, recomendaciones, medidas_mitigacion, activo, created_at, updated_at
- **erp_aplicacion_escalas** (18 columns): id, proyecto_id, escala_id, tamano_proyecto, presupuesto_estimado, cantidad_renglones, factor_economia_aplicado, factor_administracion_aplicado, factor_imprevistos_aplicado, factor_logistica_aplicado...
- **erp_calculos_proyecto** (16 columns): id, proyecto_id, tipo_calculo, fecha_calculo, usuario_id, parametros, resultados, version_calculo, origen_calculo, observaciones...
- **erp_categorias_renglones** (7 columns): id, categoria, tipologia, subcategoria, descripcion, activo, created_at
- **erp_comentarios_muro** (6 columns): id, publicacion_id, usuario_id, contenido, created_at, updated_at
- **erp_comparaciones_calculos** (11 columns): id, calculo_base_id, calculo_comparado_id, fecha_comparacion, diferencias, tipo_cambio, magnitud_cambio, porcentaje_cambio, aceptado, motivo_rechazo...
- **erp_cumplimiento_normativo** (13 columns): id, proyecto_id, norma_id, estado_cumplimiento, fecha_verificacion, responsable_verificacion, evidencias_cumplimiento, observaciones, requiere_acciones_correctivas, acciones_correctivas...
- **erp_error_log_recent** (14 columns): id, error_code, error_message, error_type, severity, component, function_name, proyecto_id, proyecto_nombre, user_id...
- **erp_error_log_stats** (6 columns): error_type, severity, error_count, unresolved_count, first_occurrence, last_occurrence
- **erp_incidentes_sso** (17 columns): id, proyecto_id, tipo, fecha, hora, descripcion, afectados, testigos, acciones_inmediatas, reportado_por...

### Tables Only in Migrations (18)

- **profiles** (5 columns): id, nombre, rol, user_metadata, created_at
- **erp_seguimiento** (14 columns): id, proyecto_id, fecha, avance_fisico, avance_financiero, costo_planeado, costo_real, valor_planeado, valor_ganado, cv...
- **erp_sub_renglones** (10 columns): id, renglon_id, nombre_material, unidad, cantidad_unitaria, precio_unitario, total, created_by, created_at, updated_at
- **erp_vales_salida** (10 columns): id, proyecto_id, items, solicitante, responsable, fecha, observaciones, created_by, created_at, updated_at
- **activos_herramientas** (16 columns): id, nombre, codigo_inventario, tipo, marca, modelo, numero_serie, valor_adquisicion, estado, ubicacion...
- **cuadro_comparativo_proveedores** (10 columns): id, proyecto_id, solicitud, fecha_solicitud, fecha_cierre, estado, adjudicado_a, observaciones, created_by, created_at
- **cotizaciones** (9 columns): id, cuadro_id, proveedor_id, monto_total, plazo_entrega, condiciones_pago, validez_oferta, seleccionada, created_at
- **anticipos** (12 columns): id, proyecto_id, monto_total, saldo_pendiente, tipo, beneficiario, concepto, fecha_entrega, fecha_ultima_amortizacion, estado...
- **amortizaciones** (7 columns): id, anticipo_id, monto, fecha, referencia, created_by, created_at
- **pagos_proveedores** (12 columns): id, proyecto_id, proveedor_id, monto, concepto, fecha_emision, fecha_vencimiento, fecha_pago, estado, factura_url...
- **ventas_paquetes** (14 columns): id, proyecto_id, tipo, identificador, precio_venta, precio_contrato, estado, cliente, fecha_reserva, fecha_venta...
- **recepciones_almacen** (9 columns): id, oc_id, fecha, cantidad_recibida, cantidad_oc, diferencia, material, proveedor, created_at
- **erp_usuarios** (5 columns): id, email, nombre, rol, created_at
- **erp_subtipologias** (13 columns): id, tipologia, subtipo, descripcion, factor_costo, factor_rendimiento, caracteristicas, normas_especiales, requisitos_especiales, activo...
- **erp_muro_likes** (4 columns): id, publicacion_id, user_id, created_at
- **erp_audit_log** (9 columns): id, table_name, record_id, action, old_data, new_data, changed_by, changed_at, changed_fields
- **erp_solicitudes** (9 columns): id, proyecto_id, tipo_trabajo, descripcion, estado, fecha_solicitud, fecha_resolucion, created_at, updated_at
- **erp_submittals** (11 columns): id, proyecto_id, titulo, descripcion, tipo, estado, enviado_por, revisado_por, fecha_revision, created_at...

## 2. Per-Table Column Mismatches

### erp_activos

**Columns only in remote DB (6):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| fecha_compra | date | YES | none |
| costo | numeric | YES | 0 |
| vida_util | integer | YES | none |
| proveedor_id | uuid | YES | none |
| proveedor_nombre | text | YES | none |
| observaciones | text | YES | none |

### erp_auditoria

**Columns only in remote DB (5):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| accion | text | NO | none |
| datos | jsonb | YES | none |
| ip | text | YES | none |
| user_agent | text | YES | none |
| creado_en | timestamp with time zone | NO | now() |

**Columns only in migrations (5):**

| Column | Migration Type |
|--------|---------------|
| operacion | text |
| datos_anteriores | jsonb |
| datos_nuevos | jsonb |
| ip_address | text |
| created_at | timestamptz |

### erp_avances

**Columns only in remote DB (5):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| presupuesto_id | uuid | YES | none |
| foto | text | YES | none |
| latitud | double precision | YES | none |
| longitud | double precision | YES | none |
| notas | text | YES | none |

**Columns only in migrations (5):**

| Column | Migration Type |
|--------|---------------|
| unidad | text |
| foto_url | text |
| geolocation | text |
| observaciones | text |
| updated_at | timestamptz |

### erp_bitacora

**Columns only in remote DB (4):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| latitud | double precision | YES | none |
| longitud | double precision | YES | none |
| fotos | jsonb | YES | none |
| firma | text | YES | none |

### erp_cuadros

**Columns only in remote DB (5):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| nombre | text | NO | none |
| descripcion | text | YES | none |
| archivo_url | text | YES | none |
| tipo | text | YES | none |
| cotizaciones | jsonb | YES | none |

### erp_cuentas_pagar

**Columns only in migrations (1):**

| Column | Migration Type |
|--------|---------------|
| proveedor_id | uuid |

### erp_dosificaciones_concreto

**Columns only in remote DB (1):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| tamaño_agregado | text | NO | none |

### erp_empleados

**Columns only in remote DB (2):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| activo | boolean | YES | true |
| telefono | text | YES | none |

### erp_escalas_produccion

**Columns only in migrations (3):**

| Column | Migration Type |
|--------|---------------|
| codigo_departamento | text |
| nombre | text |
| factor | numeric |

### erp_estacionalidad

**Columns only in remote DB (1):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| factor_rango_climatico | numeric | YES | 1.0 |

### erp_eventos_calendario

**Type mismatches (1):**

| Column | DB Type | Migration Type |
|--------|---------|---------------|
| hora | time without time zone | time |

### erp_historial_aplicacion_reglas

**Type mismatches (1):**

| Column | DB Type | Migration Type |
|--------|---------|---------------|
| proyecto_id | uuid | text |

### erp_hitos

**Columns only in remote DB (1):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| depends_on | text | YES | none |

**Columns only in migrations (3):**

| Column | Migration Type |
|--------|---------------|
| fecha_planificada | date |
| fecha_real | date |
| depende_de | UUID |

### erp_incidentes

**Columns only in remote DB (9):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| tipo | text | NO | none |
| hora | time without time zone | YES | none |
| afectados | text | NO | none |
| testigos | text | YES | none |
| acciones_inmediatas | text | YES | none |
| reportado_por | text | NO | none |
| latitud | double precision | YES | none |
| longitud | double precision | YES | none |
| fotos | ARRAY | YES | none |

**Columns only in migrations (2):**

| Column | Migration Type |
|--------|---------------|
| empleado_id | uuid |
| severidad | text |

### erp_insumos_base

**Columns only in remote DB (3):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| precio_referencia | numeric | NO | 0 |
| rubro | text | NO | none |
| fecha_actualizacion | date | NO | CURRENT_DATE |

**Columns only in migrations (5):**

| Column | Migration Type |
|--------|---------------|
| codigo | text |
| costo_base | numeric(10,2) |
| created_by | uuid |
| created_at | timestamptz |
| updated_at | timestamptz |

### erp_liberaciones_partida

**Columns only in remote DB (7):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| renglon_id | uuid | YES | none |
| renglon_nombre | text | NO | none |
| fecha_solicitud | date | NO | none |
| solicitante | text | NO | none |
| supervisor | text | NO | none |
| checklist_aprobado | boolean | YES | false |
| observaciones | text | YES | none |

**Columns only in migrations (2):**

| Column | Migration Type |
|--------|---------------|
| partida | text |
| liberado_por | uuid |

### erp_licitaciones

**Columns only in remote DB (7):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| nombre | text | NO | none |
| cliente | text | NO | none |
| monto | numeric | NO | 0 |
| fecha_limite | date | NO | none |
| documentos | jsonb | NO | '[]'::jsonb |
| notas | text | YES | none |
| probabilidad | integer | YES | 50 |

**Columns only in migrations (5):**

| Column | Migration Type |
|--------|---------------|
| numero | text |
| proveedor_id | uuid |
| monto_total | numeric(12,2) |
| fecha_envio | date |
| fecha_recepcion | date |

### erp_materiales

**Columns only in remote DB (4):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| categoria | text | YES | 'general'::text |
| cantidad_presupuestada | numeric | YES | 0 |
| costo_presupuestado | numeric | YES | 0 |
| proyecto_ids | ARRAY | YES | '{}'::text[] |

### erp_movimientos

**Columns only in remote DB (8):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| proveedor_nit | text | YES | none |
| forma_pago | text | YES | none |
| referencia_bancaria | text | YES | none |
| retencion_isr | numeric | YES | 0 |
| retencion_iva | numeric | YES | 0 |
| notas | text | YES | none |
| factura | text | YES | none |
| proveedor | text | YES | none |

### erp_muro

**Columns only in remote DB (8):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| autor | text | NO | none |
| autor_avatar | text | YES | none |
| fotos | ARRAY | YES | ARRAY[]::text[] |
| documento | jsonb | YES | none |
| likes | integer | YES | 0 |
| comentarios | jsonb | YES | '[]'::jsonb |
| created_by | uuid | YES | none |
| updated_at | timestamp with time zone | NO | now() |

**Columns only in migrations (1):**

| Column | Migration Type |
|--------|---------------|
| usuario_id | uuid |

### erp_no_conformidades

**Columns only in remote DB (7):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| codigo | text | NO | none |
| categoria | text | NO | none |
| fecha_deteccion | date | NO | none |
| detectado_por | text | NO | none |
| plan_accion | text | YES | none |
| responsable_cierre | text | YES | none |
| fecha_cierre | date | YES | none |

**Columns only in migrations (1):**

| Column | Migration Type |
|--------|---------------|
| severidad | text |

### erp_notificaciones

**Columns only in remote DB (3):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| referencia_id | text | YES | none |
| leido | boolean | NO | false |
| created_by | uuid | YES | none |

**Columns only in migrations (1):**

| Column | Migration Type |
|--------|---------------|
| leida | BOOLEAN |

**Type mismatches (1):**

| Column | DB Type | Migration Type |
|--------|---------|---------------|
| proyecto_id | uuid | TEXT |

### erp_ordenes_cambio

**Columns only in migrations (3):**

| Column | Migration Type |
|--------|---------------|
| numero | text |
| motivo | text |
| costo_impacto | numeric(12,2) |

**Type mismatches (2):**

| Column | DB Type | Migration Type |
|--------|---------|---------------|
| impacto_plazo | numeric | INTEGER |
| aprobador | uuid | TEXT |

### erp_ordenes_compra

**Columns only in remote DB (1):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| proyecto_id | uuid | NO | none |

### erp_parametros_climaticos

**Type mismatches (1):**

| Column | DB Type | Migration Type |
|--------|---------|---------------|
| meses_criticos | ARRAY | text |

### erp_parametros_movimiento_tierra

**Type mismatches (1):**

| Column | DB Type | Migration Type |
|--------|---------|---------------|
| equipo_requerido | ARRAY | text |

### erp_planos

**Columns only in remote DB (7):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| tipo | text | NO | none |
| fecha_revision | date | YES | none |
| observaciones | text | YES | none |
| created_by | uuid | YES | none |
| subido_por | text | YES | none |
| fecha_subida | date | YES | none |
| revision | integer | YES | none |

**Columns only in migrations (1):**

| Column | Migration Type |
|--------|---------------|
| fecha_emision | date |

### erp_plantillas_proyectos

**Columns only in remote DB (12):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| proyecto_origen_id | text | YES | none |
| cliente_id | text | YES | none |
| cliente_nombre | text | YES | none |
| activa | boolean | NO | true |
| configuracion | jsonb | YES | none |
| estructura_presupuesto | jsonb | YES | '[]'::jsonb |
| hitos_template | jsonb | YES | '[]'::jsonb |
| riesgos_template | jsonb | YES | '[]'::jsonb |
| checklist_calidad | jsonb | YES | '[]'::jsonb |
| usos_count | integer | NO | 0 |
| metricas | jsonb | YES | none |
| creado_por | text | YES | none |

**Columns only in migrations (7):**

| Column | Migration Type |
|--------|---------------|
| proyecto_id | UUID |
| tipologia | TEXT |
| estructura | JSONB |
| metadata | JSONB |
| uso_count | INTEGER |
| tasa_exito | NUMERIC(5,2) |
| ultimo_uso | TIMESTAMPTZ |

**Type mismatches (1):**

| Column | DB Type | Migration Type |
|--------|---------|---------------|
| id | text | UUID |

### erp_proveedores

**Columns only in remote DB (3):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| telefono | text | YES | none |
| email | text | YES | none |
| categoria | text | YES | none |

### erp_proyecto_miembros

**Columns only in migrations (1):**

| Column | Migration Type |
|--------|---------------|
| Assignado_por | uuid |

### erp_proyecto_weather

**Columns only in remote DB (1):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| historical_impact | jsonb | NO | '{}'::jsonb |

### erp_pruebas_laboratorio

**Columns only in remote DB (6):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| tipo | text | NO | none |
| descripcion | text | NO | none |
| fecha_muestra | date | NO | none |
| fecha_resultado | date | YES | none |
| responsable | text | NO | none |
| observaciones | text | YES | none |

**Columns only in migrations (4):**

| Column | Migration Type |
|--------|---------------|
| muestra | text |
| tipo_prueba | text |
| fecha_muestreo | date |
| estado | text |

### erp_rfis

**Columns only in remote DB (11):**

| Column | DB Type | Nullable | Default |
|--------|---------|----------|---------|
| numero | text | NO | none |
| remitente | text | NO | none |
| destinatario | text | NO | none |
| fecha_envio | timestamp with time zone | YES | now() |
| fecha_respuesta_esperada | date | YES | none |
| respuesta | text | YES | none |
| prioridad | text | YES | 'normal'::text |
| created_by | uuid | YES | none |
| solicitante | text | YES | none |
| destino | text | YES | none |
| fecha_solicitud | timestamp with time zone | YES | none |

**Columns only in migrations (2):**

| Column | Migration Type |
|--------|---------------|
| solicitado_por | uuid |
| respondido_por | uuid |

### erp_riesgos

**Columns only in migrations (15):**

| Column | Migration Type |
|--------|---------------|
| categoria | text |
| descripcion | TEXT |
| probabilidad | INTEGER |
| impacto | INTEGER |
| estado | TEXT |
| created_by | uuid |
| created_at | TIMESTAMPTZ |
| updated_at | timestamptz |
| tipo | TEXT |
| nivel | TEXT |
| plan_mitigacion | TEXT |
| plan_contingencia | TEXT |
| responsable | TEXT |
| fecha_identificacion | DATE |
| costo_soporte | NUMERIC |

## 3. Enum Alignment

### DB Enum Types (12)

- **estado_activo**: disponible, asignado, mantenimiento, baja
- **estado_anticipo**: activo, amortizado, cancelado
- **estado_caja**: pendiente, aprobada, rechazada
- **estado_cuadro**: abierto, cerrado, adjudicado
- **estado_licitacion**: activa, ganada, perdida, cancelada
- **estado_orden**: borrador, pendiente, aprobado, rechazado, recibida, cancelada
- **estado_pago**: pendiente, pagado, vencido, cancelado
- **estado_presupuesto**: borrador, aprobado, revisado, rechazado
- **estado_proyecto**: planeacion, ejecucion, pausado, finalizado
- **estado_venta**: disponible, reservado, vendido, entregado
- **tipo_activo**: herramienta, equipo, vehiculo, accesorio
- **tipo_caja**: materiales, herramientas, transporte, comidas, otros

### Migration CHECK-based Enums (35 found)

- `rol = ANY (ARRAY['Administrador','Gerente','Residente','Compras','Bodeguero','usuario']` (000000000001_full_schema_base_and_policies.sql)
- `tipologia = ANY (ARRAY['residencial','comercial','industrial','civil','publica']` (000000000001_full_schema_base_and_policies.sql)
- `estado = ANY (ARRAY['planeacion','ejecucion','finalizado','pausado']` (000000000001_full_schema_base_and_policies.sql)
- `tipo = ANY (ARRAY['ingreso','gasto']` (000000000001_full_schema_base_and_policies.sql)
- `tipo = ANY (ARRAY['planilla','destajo']` (000000000001_full_schema_base_and_policies.sql)
- `estado = ANY (ARRAY['borrador','pendiente','aprobado','rechazado','recibida']` (000000000001_full_schema_base_and_policies.sql)
- `tipo = ANY (ARRAY['Recordatorio','Actividad','Reunión','Visita']` (000000000001_full_schema_base_and_policies.sql)
- `tipo = ANY (ARRAY['material','mano_obra','equipo','subcontrato']` (000000000001_full_schema_base_and_policies.sql)
- `tipo_obra = ANY (ARRAY['nueva','remodelacion','ampliacion']` (000000000003_sync_app_fields.sql)
- `moneda = ANY (ARRAY['GTQ','USD']` (000000000003_sync_app_fields.sql)
- `etapa = ANY (ARRAY['planificacion','diseno','preconstruccion','construccion','cierre']` (000000000003_sync_app_fields.sql)
- `forma_pago = ANY (ARRAY['efectivo','transferencia','cheque','tarjeta','otro']` (000000000003_sync_app_fields.sql)
- `estado = ANY (ARRAY['borrador','enviada','recibida','rechazada','aceptada']` (000000000004_complete_missing_tables_and_policies.sql)
- `estado = ANY (ARRAY['pendiente','en_proceso','completado','retrasado']` (000000000004_complete_missing_tables_and_policies.sql)
- `probabilidad = ANY (ARRAY['baja','media','alta']` (000000000004_complete_missing_tables_and_policies.sql)
- `impacto = ANY (ARRAY['bajo','medio','alto']` (000000000004_complete_missing_tables_and_policies.sql)
- `estado = ANY (ARRAY['abierto','mitigado','cerrado']` (000000000004_complete_missing_tables_and_policies.sql)
- `estado = ANY (ARRAY['pendiente','pagada','vencida']` (000000000004_complete_missing_tables_and_policies.sql)
- `estado = ANY (ARRAY['pendiente','pagada','vencida']` (000000000004_complete_missing_tables_and_policies.sql)
- `estado = ANY (ARRAY['solicitada','aprobada','rechazada','implementada']` (000000000004_complete_missing_tables_and_policies.sql)
- `tipo = ANY (ARRAY['publicacion','comentario','like']` (000000000004_complete_missing_tables_and_policies.sql)
- `severidad = ANY (ARRAY['leve','moderada','grave']` (000000000004_complete_missing_tables_and_policies.sql)
- `estado = ANY (ARRAY['abierto','en_proceso','cerrado']` (000000000004_complete_missing_tables_and_policies.sql)
- `estado = ANY (ARRAY['pendiente','en_proceso','completada']` (000000000004_complete_missing_tables_and_policies.sql)
- `severidad = ANY (ARRAY['leve','moderada','grave']` (000000000004_complete_missing_tables_and_policies.sql)
- `estado = ANY (ARRAY['abierta','en_proceso','cerrada']` (000000000004_complete_missing_tables_and_policies.sql)
- `estado = ANY (ARRAY['pendiente','aprobada','rechazada']` (000000000004_complete_missing_tables_and_policies.sql)
- `rol = ANY (ARRAY['lectura','escritura','admin_proyecto']` (000000000022_proyecto_miembros_rls.sql)
- `rol = ANY (ARRAY['Administrador','Gerente','Residente','Compras','Bodeguero']` (000000000023_rls_consolidado.sql)
- `rol = ANY (ARRAY['lectura','escritura','admin_proyecto']` (000000000023_rls_consolidado.sql)

*... and 5 more*

## 4. Index Alignment

| Category | Count |
|----------|-------|
| Remote indexes | 331 |
| Migration indexes | 178 |
| Only in remote | 219 |
| Only in migrations | 66 |

### Indexes Only in Remote (219)

- amortizaciones_pkey
- anticipos_pkey
- cajas_chicas_pkey
- cotizaciones_negocio_pkey
- destajos_pkey
- erp_access_log_pkey
- erp_activos_pkey
- erp_ajustes_estacionales_actividad_pkey
- erp_aplicacion_escalas_pkey
- erp_app_config_config_key_key
- erp_app_config_pkey
- erp_archivos_tipo_pkey
- erp_auditoria_pkey
- erp_avances_pkey
- erp_backup_config_pkey
- erp_bitacora_pkey
- erp_calculos_proyecto_pkey
- erp_categorias_renglones_pkey
- erp_centros_costo_codigo_key
- erp_centros_costo_pkey
- erp_comentarios_muro_pkey
- erp_comparaciones_calculos_pkey
- erp_cotizaciones_negocio_pkey
- erp_cuadros_pkey
- erp_cuentas_cobrar_pkey
- erp_cuentas_pagar_pkey
- erp_cumplimiento_normativo_pkey
- erp_departamentos_gt_pkey
- erp_destajos_pkey
- erp_dosificaciones_concreto_pkey
- ... and 189 more

### Indexes Only in Migrations (66)

- idx_erp_movimientos_proyecto
- idx_erp_empleados_proyecto
- idx_erp_eventos_proyecto
- idx_erp_bitacora_proyecto
- idx_erp_seguimiento_proyecto
- idx_erp_renglones_proyecto
- idx_erp_presupuestos_proyecto
- idx_erp_vales_salida_proyecto
- idx_erp_avances_proyecto
- idx_activos_estado
- idx_activos_proyecto
- idx_cuadro_estado
- idx_cotizaciones_cuadro
- idx_pagos_vencimiento
- idx_pagos_estado
- idx_pagos_proveedor
- idx_ventas_proyecto
- idx_ventas_estado
- idx_centros_costo_proyecto
- idx_proyectos_estado
- idx_cuentas_cobrar_proyecto
- idx_cuentas_pagar_proyecto
- idx_ordenes_cambio_proyecto
- idx_hitos_proyecto
- idx_riesgos_proyecto
- IF
- idx_reglas_factores_tipologia
- idx_reglas_factores_fechas
- idx_historial_reglas_renglon
- idx_historial_reglas_regla
- ... and 36 more

## 5. App Zod Schema vs DB Alignment

| Entity | Table | App Fields | DB Columns | Missing in DB | Extra in DB | Status |
|--------|-------|-----------|------------|--------------|-------------|--------|
| accessLog | erp_access_log | 7 | 8 | 6 | 7 | ⚠️ |
| accessLog | erp_access_log | 9 | 8 | 7 | 6 | ⚠️ |
| accessLog | erp_access_log | 25 | 8 | 25 | 8 | ⚠️ |
| material | erp_materiales | 2 | 17 | 2 | 17 | ⚠️ |
| material | erp_materiales | 7 | 17 | 5 | 15 | ⚠️ |
| material | erp_materiales | 13 | 17 | 2 | 6 | ⚠️ |
| material | erp_materiales | 13 | 17 | 12 | 16 | ⚠️ |
| material | erp_materiales | 11 | 17 | 6 | 12 | ⚠️ |
| material | erp_materiales | 7 | 17 | 5 | 15 | ⚠️ |
| calculoProyecto | erp_calculos_proyecto | 6 | 16 | 2 | 12 | ⚠️ |
| calculoProyecto | erp_calculos_proyecto | 4 | 16 | 3 | 15 | ⚠️ |
| calculoProyecto | erp_calculos_proyecto | 5 | 16 | 4 | 15 | ⚠️ |
| calculoProyecto | erp_calculos_proyecto | 8 | 16 | 6 | 14 | ⚠️ |
| calculoProyecto | erp_calculos_proyecto | 6 | 16 | 5 | 15 | ⚠️ |
| calculoProyecto | erp_calculos_proyecto | 9 | 16 | 8 | 15 | ⚠️ |
| calculoProyecto | erp_calculos_proyecto | 13 | 16 | 12 | 15 | ⚠️ |
| calculoProyecto | erp_calculos_proyecto | 12 | 16 | 11 | 15 | ⚠️ |
| calculoProyecto | erp_calculos_proyecto | 8 | 16 | 7 | 15 | ⚠️ |
| calculoProyecto | erp_calculos_proyecto | 17 | 16 | 14 | 13 | ⚠️ |
| calculoProyecto | erp_calculos_proyecto | 7 | 16 | 5 | 14 | ⚠️ |
| evento | erp_eventos_calendario | 10 | 11 | 1 | 2 | ⚠️ |
| evento | erp_eventos_calendario | 21 | 11 | 17 | 7 | ⚠️ |
| avance | erp_avances | 11 | 13 | 7 | 9 | ⚠️ |
| noConformidad | erp_no_conformidades | 11 | 14 | 8 | 11 | ⚠️ |
| noConformidad | erp_no_conformidades | 9 | 14 | 6 | 11 | ⚠️ |
| noConformidad | erp_no_conformidades | 11 | 14 | 0 | 3 | ⚠️ |
| errorLog | erp_error_log | 24 | 24 | 2 | 2 | ⚠️ |
| cuentaCobrar | erp_cuentas_cobrar | 19 | 14 | 15 | 10 | ⚠️ |
| cuentaCobrar | erp_cuentas_cobrar | 11 | 14 | 0 | 3 | ⚠️ |
| cuentaCobrar | erp_cuentas_cobrar | 11 | 14 | 3 | 6 | ⚠️ |
| cuentaCobrar | erp_cuentas_cobrar | 12 | 14 | 7 | 9 | ⚠️ |
| cuentaCobrar | erp_cuentas_cobrar | 12 | 14 | 8 | 10 | ⚠️ |
| ordenCompra | erp_ordenes_compra | 17 | 14 | 14 | 11 | ⚠️ |
| ordenCompra | erp_ordenes_compra | 10 | 14 | 6 | 10 | ⚠️ |
| ordenCompra | erp_ordenes_compra | 11 | 14 | 7 | 10 | ⚠️ |
| ordenCompra | erp_ordenes_compra | 11 | 14 | 7 | 10 | ⚠️ |
| ordenCompra | erp_ordenes_compra | 11 | 14 | 8 | 11 | ⚠️ |
| ordenCompra | erp_ordenes_compra | 11 | 14 | 8 | 11 | ⚠️ |
| ordenCompra | erp_ordenes_compra | 8 | 14 | 4 | 10 | ⚠️ |
| ordenCompra | erp_ordenes_compra | 8 | 14 | 4 | 10 | ⚠️ |
| ordenCompra | erp_ordenes_compra | 11 | 14 | 7 | 10 | ⚠️ |
| plantilla | erp_plantillas_proyectos | 15 | 21 | 5 | 11 | ⚠️ |
| presupuesto | erp_presupuestos | 11 | 16 | 0 | 5 | ⚠️ |
| presupuesto | erp_presupuestos | 2 | 16 | 2 | 16 | ⚠️ |
| presupuesto | erp_presupuestos | 20 | 16 | 12 | 8 | ⚠️ |
| comparacionCalculo | erp_comparaciones_calculos | 16 | 11 | 14 | 9 | ⚠️ |
| comparacionCalculo | erp_comparaciones_calculos | 15 | 11 | 13 | 9 | ⚠️ |
| comparacionCalculo | erp_comparaciones_calculos | 15 | 11 | 13 | 9 | ⚠️ |
| comparacionCalculo | erp_comparaciones_calculos | 14 | 11 | 12 | 9 | ⚠️ |
| comparacionCalculo | erp_comparaciones_calculos | 8 | 11 | 7 | 10 | ⚠️ |
| comparacionCalculo | erp_comparaciones_calculos | 14 | 11 | 12 | 9 | ⚠️ |
| movimiento | erp_movimientos | 5 | 21 | 2 | 18 | ⚠️ |
| movimiento | erp_movimientos | 10 | 21 | 9 | 20 | ⚠️ |
| movimiento | erp_movimientos | 8 | 21 | 8 | 21 | ⚠️ |
| movimiento | erp_movimientos | 24 | 21 | 21 | 18 | ⚠️ |
| movimiento | erp_movimientos | 15 | 21 | 13 | 19 | ⚠️ |
| empleado | erp_empleados | 11 | 13 | 2 | 4 | ⚠️ |
| empleado | erp_empleados | 16 | 13 | 13 | 10 | ⚠️ |
| avance | erp_avances | 13 | 13 | 2 | 2 | ⚠️ |
| avance | erp_avances | 12 | 13 | 7 | 8 | ⚠️ |
| avance | erp_avances | 15 | 13 | 12 | 10 | ⚠️ |
| publicacionMuro | erp_publicaciones_muro | 9 | 11 | 6 | 8 | ⚠️ |
| publicacionMuro | erp_publicaciones_muro | 8 | 11 | 5 | 8 | ⚠️ |
| proyectoWeather | erp_proyecto_weather | 5 | 11 | 5 | 11 | ⚠️ |
| proyectoWeather | erp_proyecto_weather | 11 | 11 | 11 | 11 | ⚠️ |
| proyectoWeather | erp_proyecto_weather | 11 | 11 | 4 | 4 | ⚠️ |

### accessLog (erp_access_log)

**App fields not found in DB (6):**

- `proyecto_id` (app: `proyectoId`)
- `codigo` (app: `codigo`)
- `nombre` (app: `nombre`)
- `presupuesto_asignado` (app: `presupuestoAsignado`)
- `gasto_actual` (app: `gastoActual`)
- `tipo` (app: `tipo`)

**DB columns not in app schema (7):**

- `user_id`
- `email`
- `event`
- `provider`
- `ip_hint`
- `user_agent`
- `created_at`


### accessLog (erp_access_log)

**App fields not found in DB (7):**

- `usuario_id` (app: `usuarioId`)
- `usuario_nombre` (app: `usuarioNombre`)
- `accion` (app: `accion`)
- `entidad` (app: `entidad`)
- `entidad_id` (app: `entidadId`)
- `valores_anteriores` (app: `valoresAnteriores`)
- `valores_nuevos` (app: `valoresNuevos`)

**DB columns not in app schema (6):**

- `user_id`
- `email`
- `event`
- `provider`
- `ip_hint`
- `user_agent`


### accessLog (erp_access_log)

**App fields not found in DB (25):**

- `ui_mode` (app: `uiMode`)
- `app_theme` (app: `appTheme`)
- `primary_color` (app: `primaryColor`)
- `language` (app: `language`)
- `date_format` (app: `dateFormat`)
- `currency` (app: `currency`)
- `sidebar_collapsed` (app: `sidebarCollapsed`)
- `sidebar_position` (app: `sidebarPosition`)
- `sidebar_mode` (app: `sidebarMode`)
- `sidebar_width` (app: `sidebarWidth`)
- `sidebar_mini_width` (app: `sidebarMiniWidth`)
- `animations_enabled` (app: `animationsEnabled`)
- `compact_mode` (app: `compactMode`)
- `font_size` (app: `fontSize`)
- `font_family` (app: `fontFamily`)
- `border_radius` (app: `borderRadius`)
- `spacing_scale` (app: `spacingScale`)
- `density_table` (app: `densityTable`)
- `breadcrumbs_enabled` (app: `breadcrumbsEnabled`)
- `footer_enabled` (app: `footerEnabled`)
- `touch_mode` (app: `touchMode`)
- `notificaciones` (app: `notificaciones`)
- `ordenes_cambio` (app: `ordenesCambio`)
- `avances_obra` (app: `avancesObra`)
- `desviaciones` (app: `desviaciones`)

**DB columns not in app schema (8):**

- `id`
- `user_id`
- `email`
- `event`
- `provider`
- `ip_hint`
- `user_agent`
- `created_at`


### material (erp_materiales)

**App fields not found in DB (2):**

- `material_id` (app: `materialId`)
- `cantidad` (app: `cantidad`)

**DB columns not in app schema (17):**

- `id`
- `nombre`
- `unidad`
- `stock`
- `stock_minimo`
- `precio`
- `critico`
- `created_by`
- `created_at`
- `updated_at`
- `categoria`
- `bodega`
- `renglon_id`
- `cantidad_presupuestada`
- `costo_presupuestado`
- `proyecto_ids`
- `version`


### material (erp_materiales)

**App fields not found in DB (5):**

- `proyecto_id` (app: `proyectoId`)
- `fecha` (app: `fecha`)
- `items` (app: `items`)
- `observaciones` (app: `observaciones`)
- `solicitante` (app: `solicitante`)

**DB columns not in app schema (15):**

- `nombre`
- `unidad`
- `stock`
- `stock_minimo`
- `precio`
- `critico`
- `created_by`
- `created_at`
- `updated_at`
- `categoria`
- `bodega`
- `cantidad_presupuestada`
- `costo_presupuestado`
- `proyecto_ids`
- `version`


### material (erp_materiales)

**App fields not found in DB (2):**

- `proyecto_id` (app: `proyectoId`)
- `ultima_actualizacion_presupuesto` (app: `ultimaActualizacionPresupuesto`)

**DB columns not in app schema (6):**

- `critico`
- `created_by`
- `created_at`
- `updated_at`
- `bodega`
- `renglon_id`


### material (erp_materiales)

**App fields not found in DB (12):**

- `proyecto_id` (app: `proyectoId`)
- `proveedor` (app: `proveedor`)
- `material` (app: `material`)
- `cantidad` (app: `cantidad`)
- `monto` (app: `monto`)
- `fecha` (app: `fecha`)
- `estado` (app: `estado`)
- `proveedor_id` (app: `proveedorId`)
- `total` (app: `total`)
- `items` (app: `items`)
- `cantidad` (app: `cantidad`)
- `precio_unitario` (app: `precioUnitario`)

**DB columns not in app schema (16):**

- `nombre`
- `unidad`
- `stock`
- `stock_minimo`
- `precio`
- `critico`
- `created_by`
- `created_at`
- `updated_at`
- `categoria`
- `bodega`
- `renglon_id`
- `cantidad_presupuestada`
- `costo_presupuestado`
- `proyecto_ids`
- `version`


### material (erp_materiales)

**App fields not found in DB (6):**

- `proyecto_id` (app: `proyectoId`)
- `contacto` (app: `contacto`)
- `rubro` (app: `rubro`)
- `calificacion` (app: `calificacion`)
- `telefono` (app: `telefono`)
- `email` (app: `email`)

**DB columns not in app schema (12):**

- `unidad`
- `stock`
- `stock_minimo`
- `precio`
- `critico`
- `created_by`
- `bodega`
- `renglon_id`
- `cantidad_presupuestada`
- `costo_presupuestado`
- `proyecto_ids`
- `version`


### material (erp_materiales)

**App fields not found in DB (5):**

- `contacto` (app: `contacto`)
- `rubro` (app: `rubro`)
- `calificacion` (app: `calificacion`)
- `telefono` (app: `telefono`)
- `email` (app: `email`)

**DB columns not in app schema (15):**

- `id`
- `unidad`
- `stock`
- `stock_minimo`
- `precio`
- `critico`
- `created_by`
- `created_at`
- `updated_at`
- `bodega`
- `renglon_id`
- `cantidad_presupuestada`
- `costo_presupuestado`
- `proyecto_ids`
- `version`


### calculoProyecto (erp_calculos_proyecto)

**App fields not found in DB (2):**

- `tipo_calcululo` (app: `tipoCalcululo`)
- `fecha_calcululo` (app: `fechaCalcululo`)

**DB columns not in app schema (12):**

- `tipo_calculo`
- `fecha_calculo`
- `resultados`
- `version_calculo`
- `origen_calculo`
- `observaciones`
- `validado`
- `validado_por`
- `fecha_validacion`
- `notas_validacion`
- `created_at`
- `updated_at`


### calculoProyecto (erp_calculos_proyecto)

**App fields not found in DB (3):**

- `calculo_id` (app: `calculoId`)
- `nombre` (app: `nombre`)
- `parametros_snapshot` (app: `parametrosSnapshot`)

**DB columns not in app schema (15):**

- `proyecto_id`
- `tipo_calculo`
- `fecha_calculo`
- `usuario_id`
- `parametros`
- `resultados`
- `version_calculo`
- `origen_calculo`
- `observaciones`
- `validado`
- `validado_por`
- `fecha_validacion`
- `notas_validacion`
- `created_at`
- `updated_at`


### calculoProyecto (erp_calculos_proyecto)

**App fields not found in DB (4):**

- `calculo_base_id` (app: `calculoBaseId`)
- `calculo_comparado_id` (app: `calculoComparadoId`)
- `fecha_comparacion` (app: `fechaComparacion`)
- `diferencias` (app: `diferencias`)

**DB columns not in app schema (15):**

- `proyecto_id`
- `tipo_calculo`
- `fecha_calculo`
- `usuario_id`
- `parametros`
- `resultados`
- `version_calculo`
- `origen_calculo`
- `observaciones`
- `validado`
- `validado_por`
- `fecha_validacion`
- `notas_validacion`
- `created_at`
- `updated_at`


### calculoProyecto (erp_calculos_proyecto)

**App fields not found in DB (6):**

- `renglon_id` (app: `renglon_id`)
- `regla_id` (app: `regla_id`)
- `valor_original` (app: `valor_original`)
- `valor_aplicado` (app: `valor_aplicado`)
- `factor_aplicado` (app: `factor_aplicado`)
- `contexto_aplicacion` (app: `contexto_aplicacion`)

**DB columns not in app schema (14):**

- `tipo_calculo`
- `fecha_calculo`
- `usuario_id`
- `parametros`
- `resultados`
- `version_calculo`
- `origen_calculo`
- `observaciones`
- `validado`
- `validado_por`
- `fecha_validacion`
- `notas_validacion`
- `created_at`
- `updated_at`


### calculoProyecto (erp_calculos_proyecto)

**App fields not found in DB (5):**

- `nombre` (app: `nombre`)
- `descripcion` (app: `descripcion`)
- `tipo_factor` (app: `tipo_factor`)
- `prioridad` (app: `prioridad`)
- `condicion` (app: `condicion`)

**DB columns not in app schema (15):**

- `proyecto_id`
- `tipo_calculo`
- `fecha_calculo`
- `usuario_id`
- `parametros`
- `resultados`
- `version_calculo`
- `origen_calculo`
- `observaciones`
- `validado`
- `validado_por`
- `fecha_validacion`
- `notas_validacion`
- `created_at`
- `updated_at`


### calculoProyecto (erp_calculos_proyecto)

**App fields not found in DB (8):**

- `departamento_codigo` (app: `departamento_codigo`)
- `tipo_norma` (app: `tipo_norma`)
- `codigo_norma` (app: `codigo_norma`)
- `nombre_norma` (app: `nombre_norma`)
- `descripcion` (app: `descripcion`)
- `ano_ultima_revision` (app: `ano_ultima_revision`)
- `organismo_emisor` (app: `organismo_emisor`)
- `requisitos_especificos` (app: `requisitos_especificos`)

**DB columns not in app schema (15):**

- `proyecto_id`
- `tipo_calculo`
- `fecha_calculo`
- `usuario_id`
- `parametros`
- `resultados`
- `version_calculo`
- `origen_calculo`
- `observaciones`
- `validado`
- `validado_por`
- `fecha_validacion`
- `notas_validacion`
- `created_at`
- `updated_at`


### calculoProyecto (erp_calculos_proyecto)

**App fields not found in DB (12):**

- `tipo_proyecto` (app: `tipo_proyecto`)
- `rango_tamano` (app: `rango_tamano`)
- `tamano_minimo` (app: `tamano_minimo`)
- `tamano_maximo` (app: `tamano_maximo`)
- `factor_economia` (app: `factor_economia`)
- `factor_administracion` (app: `factor_administracion`)
- `factor_imprevistos` (app: `factor_imprevistos`)
- `factor_logistica` (app: `factor_logistica`)
- `factor_financiero` (app: `factor_financiero`)
- `factor_total` (app: `factor_total`)
- `descripcion` (app: `descripcion`)
- `activo` (app: `activo`)

**DB columns not in app schema (15):**

- `proyecto_id`
- `tipo_calculo`
- `fecha_calculo`
- `usuario_id`
- `parametros`
- `resultados`
- `version_calculo`
- `origen_calculo`
- `observaciones`
- `validado`
- `validado_por`
- `fecha_validacion`
- `notas_validacion`
- `created_at`
- `updated_at`


### calculoProyecto (erp_calculos_proyecto)

**App fields not found in DB (11):**

- `departamento_codigo` (app: `departamento_codigo`)
- `mes` (app: `mes`)
- `temporada` (app: `temporada`)
- `factor_disponibilidad` (app: `factor_disponibilidad`)
- `factor_costo` (app: `factor_costo`)
- `factor_productividad` (app: `factor_productividad`)
- `factor_especifico` (app: `factor_especifico`)
- `condiciones_especiales` (app: `condiciones_especiales`)
- `restricciones_especiales` (app: `restricciones_especiales`)
- `riesgos_estacionales` (app: `riesgos_estacionales`)
- `activo` (app: `activo`)

**DB columns not in app schema (15):**

- `proyecto_id`
- `tipo_calculo`
- `fecha_calculo`
- `usuario_id`
- `parametros`
- `resultados`
- `version_calculo`
- `origen_calculo`
- `observaciones`
- `validado`
- `validado_por`
- `fecha_validacion`
- `notas_validacion`
- `created_at`
- `updated_at`


### calculoProyecto (erp_calculos_proyecto)

**App fields not found in DB (7):**

- `estacionalidad_id` (app: `estacionalidad_id`)
- `tipo_actividad` (app: `tipo_actividad`)
- `factor_especifico` (app: `factor_especifico`)
- `impacto_duracion` (app: `impacto_duracion`)
- `recomendaciones` (app: `recomendaciones`)
- `medidas_mitigacion` (app: `medidas_mitigacion`)
- `activo` (app: `activo`)

**DB columns not in app schema (15):**

- `proyecto_id`
- `tipo_calculo`
- `fecha_calculo`
- `usuario_id`
- `parametros`
- `resultados`
- `version_calculo`
- `origen_calculo`
- `observaciones`
- `validado`
- `validado_por`
- `fecha_validacion`
- `notas_validacion`
- `created_at`
- `updated_at`


### calculoProyecto (erp_calculos_proyecto)

**App fields not found in DB (14):**

- `escala_id` (app: `escala_id`)
- `tamano_proyecto` (app: `tamano_proyecto`)
- `presupuesto_estimado` (app: `presupuesto_estimado`)
- `cantidad_renglones` (app: `cantidad_renglones`)
- `factor_economia_aplicado` (app: `factor_economia_aplicado`)
- `factor_administracion_aplicado` (app: `factor_administracion_aplicado`)
- `factor_imprevistos_aplicado` (app: `factor_imprevistos_aplicado`)
- `factor_logistica_aplicado` (app: `factor_logistica_aplicado`)
- `factor_financiero_aplicado` (app: `factor_financiero_aplicado`)
- `factor_total` (app: `factor_total`)
- `costo_ajustado` (app: `costo_ajustado`)
- `ahorro_estimado` (app: `ahorro_estimado`)
- `usuario_aplicacion` (app: `usuario_aplicacion`)
- `fecha_aplicacion` (app: `fecha_aplicacion`)

**DB columns not in app schema (13):**

- `tipo_calculo`
- `fecha_calculo`
- `usuario_id`
- `parametros`
- `resultados`
- `version_calculo`
- `origen_calculo`
- `validado`
- `validado_por`
- `fecha_validacion`
- `notas_validacion`
- `created_at`
- `updated_at`


### calculoProyecto (erp_calculos_proyecto)

**App fields not found in DB (5):**

- `norma_id` (app: `norma_id`)
- `estado_cumplimiento` (app: `estado_cumplimiento`)
- `fecha_verificacion` (app: `fecha_verificacion`)
- `responsable_verificacion` (app: `responsable_verificacion`)
- `evidencias_cumplimiento` (app: `evidencias_cumplimiento`)

**DB columns not in app schema (14):**

- `tipo_calculo`
- `fecha_calculo`
- `usuario_id`
- `parametros`
- `resultados`
- `version_calculo`
- `origen_calculo`
- `observaciones`
- `validado`
- `validado_por`
- `fecha_validacion`
- `notas_validacion`
- `created_at`
- `updated_at`


### evento (erp_eventos_calendario)

**App fields not found in DB (1):**

- `participantes` (app: `participantes`)

**DB columns not in app schema (2):**

- `created_by`
- `updated_at`


### evento (erp_eventos_calendario)

**App fields not found in DB (17):**

- `clima` (app: `clima`)
- `temperatura` (app: `temperatura`)
- `humedad` (app: `humedad`)
- `viento_velocidad` (app: `vientoVelocidad`)
- `condicion_climatica` (app: `condicionClimatica`)
- `personal` (app: `personal`)
- `personal_presente` (app: `personalPresente`)
- `maquinaria` (app: `maquinaria`)
- `tareas` (app: `tareas`)
- `tareas_realizadas` (app: `tareasRealizadas`)
- `observaciones` (app: `observaciones`)
- `fotos` (app: `fotos`)
- `firma` (app: `firma`)
- `latitud` (app: `latitud`)
- `longitud` (app: `longitud`)
- `weather_data_captured` (app: `weatherDataCaptured`)
- `weather_data_timestamp` (app: `weatherDataTimestamp`)

**DB columns not in app schema (7):**

- `hora`
- `titulo`
- `descripcion`
- `tipo`
- `completado`
- `created_by`
- `updated_at`


### avance (erp_avances)

**App fields not found in DB (7):**

- `nombre` (app: `nombre`)
- `descripcion` (app: `descripcion`)
- `tipo` (app: `tipo`)
- `estado` (app: `estado`)
- `responsable` (app: `responsable`)
- `depende_de` (app: `dependeDe`)
- `completado_en` (app: `completadoEn`)

**DB columns not in app schema (9):**

- `presupuesto_id`
- `renglon_id`
- `avance_fisico`
- `cantidad_ejecutada`
- `foto`
- `latitud`
- `longitud`
- `created_by`
- `notas`


### noConformidad (erp_no_conformidades)

**App fields not found in DB (8):**

- `renglon_id` (app: `renglonId`)
- `renglon_nombre` (app: `renglonNombre`)
- `fecha_solicitud` (app: `fechaSolicitud`)
- `fecha_liberacion` (app: `fechaLiberacion`)
- `solicitante` (app: `solicitante`)
- `supervisor` (app: `supervisor`)
- `checklist_aprobado` (app: `checklistAprobado`)
- `observaciones` (app: `observaciones`)

**DB columns not in app schema (11):**

- `codigo`
- `descripcion`
- `categoria`
- `fecha_deteccion`
- `detectado_por`
- `plan_accion`
- `responsable_cierre`
- `fecha_cierre`
- `created_by`
- `created_at`
- `updated_at`


### noConformidad (erp_no_conformidades)

**App fields not found in DB (6):**

- `tipo` (app: `tipo`)
- `fecha_muestra` (app: `fechaMuestra`)
- `fecha_resultado` (app: `fechaResultado`)
- `resultado` (app: `resultado`)
- `responsable` (app: `responsable`)
- `observaciones` (app: `observaciones`)

**DB columns not in app schema (11):**

- `codigo`
- `categoria`
- `fecha_deteccion`
- `detectado_por`
- `plan_accion`
- `responsable_cierre`
- `fecha_cierre`
- `estado`
- `created_by`
- `created_at`
- `updated_at`


### noConformidad (erp_no_conformidades)

**DB columns not in app schema (3):**

- `created_by`
- `created_at`
- `updated_at`


### errorLog (erp_error_log)

**App fields not found in DB (2):**

- `entidad` (app: `entidad`)
- `entidad_id` (app: `entidadId`)

**DB columns not in app schema (2):**

- `user_agent`
- `ip_address`


### cuentaCobrar (erp_cuentas_cobrar)

**App fields not found in DB (15):**

- `tipo` (app: `tipo`)
- `categoria` (app: `categoria`)
- `costo_total` (app: `costoTotal`)
- `costo_unitario` (app: `costoUnitario`)
- `cantidad` (app: `cantidad`)
- `unidad` (app: `unidad`)
- `descripcion` (app: `descripcion`)
- `fecha` (app: `fecha`)
- `proveedor` (app: `proveedor`)
- `proveedor_nit` (app: `proveedorNit`)
- `factura` (app: `factura`)
- `forma_pago` (app: `formaPago`)
- `referencia_bancaria` (app: `referenciaBancaria`)
- `retencion_isr` (app: `retencionIsr`)
- `retencion_iva` (app: `retencionIva`)

**DB columns not in app schema (10):**

- `cliente`
- `concepto`
- `saldo_pendiente`
- `fecha_emision`
- `fecha_vencimiento`
- `fecha_cobro`
- `estado`
- `created_by`
- `created_at`
- `updated_at`


### cuentaCobrar (erp_cuentas_cobrar)

**DB columns not in app schema (3):**

- `created_by`
- `created_at`
- `updated_at`


### cuentaCobrar (erp_cuentas_cobrar)

**App fields not found in DB (3):**

- `proveedor` (app: `proveedor`)
- `fecha_pago` (app: `fechaPago`)
- `factura_url` (app: `facturaUrl`)

**DB columns not in app schema (6):**

- `cliente`
- `fecha_cobro`
- `notas`
- `created_by`
- `created_at`
- `updated_at`


### cuentaCobrar (erp_cuentas_cobrar)

**App fields not found in DB (7):**

- `tipo` (app: `tipo`)
- `identificador` (app: `identificador`)
- `precio_venta` (app: `precioVenta`)
- `precio_contrato` (app: `precioContrato`)
- `fecha_reserva` (app: `fechaReserva`)
- `fecha_venta` (app: `fechaVenta`)
- `plan_pago` (app: `planPago`)

**DB columns not in app schema (9):**

- `concepto`
- `monto`
- `saldo_pendiente`
- `fecha_emision`
- `fecha_vencimiento`
- `fecha_cobro`
- `created_by`
- `created_at`
- `updated_at`


### cuentaCobrar (erp_cuentas_cobrar)

**App fields not found in DB (8):**

- `titulo` (app: `titulo`)
- `descripcion` (app: `descripcion`)
- `impacto_costo` (app: `impactoCosto`)
- `impacto_plazo` (app: `impactoPlazo`)
- `solicitante` (app: `solicitante`)
- `solicitante_rol` (app: `solicitanteRol`)
- `aprobador` (app: `aprobador`)
- `fecha_aprobacion` (app: `fechaAprobacion`)

**DB columns not in app schema (10):**

- `cliente`
- `concepto`
- `monto`
- `saldo_pendiente`
- `fecha_emision`
- `fecha_vencimiento`
- `fecha_cobro`
- `notas`
- `created_by`
- `updated_at`


### ordenCompra (erp_ordenes_compra)

**App fields not found in DB (14):**

- `nombre` (app: `nombre`)
- `codigo_inventario` (app: `codigoInventario`)
- `tipo` (app: `tipo`)
- `valor_adquisicion` (app: `valorAdquisicion`)
- `fecha_adquisicion` (app: `fechaAdquisicion`)
- `proveedor_id` (app: `proveedorId`)
- `proveedor_nombre` (app: `proveedorNombre`)
- `asignado_a` (app: `asignadoA`)
- `observaciones` (app: `observaciones`)
- `marca` (app: `marca`)
- `modelo` (app: `modelo`)
- `numero_serie` (app: `numeroSerie`)
- `ubicacion` (app: `ubicacion`)
- `fecha_asignacion` (app: `fechaAsignacion`)

**DB columns not in app schema (11):**

- `proveedor`
- `material`
- `cantidad`
- `monto`
- `fecha`
- `created_by`
- `created_at`
- `updated_at`
- `items`
- `version`
- `stock_actualizado`


### ordenCompra (erp_ordenes_compra)

**App fields not found in DB (6):**

- `nombre` (app: `nombre`)
- `cliente` (app: `cliente`)
- `fecha_limite` (app: `fechaLimite`)
- `probabilidad` (app: `probabilidad`)
- `documentos` (app: `documentos`)
- `url` (app: `url`)

**DB columns not in app schema (10):**

- `proveedor`
- `material`
- `cantidad`
- `fecha`
- `created_by`
- `created_at`
- `updated_at`
- `items`
- `version`
- `stock_actualizado`


### ordenCompra (erp_ordenes_compra)

**App fields not found in DB (7):**

- `proveedor_id` (app: `proveedorId`)
- `proveedor_nombre` (app: `proveedorNombre`)
- `concepto` (app: `concepto`)
- `fecha_emision` (app: `fechaEmision`)
- `fecha_vencimiento` (app: `fechaVencimiento`)
- `fecha_pago` (app: `fechaPago`)
- `factura_url` (app: `facturaUrl`)

**DB columns not in app schema (10):**

- `proveedor`
- `material`
- `cantidad`
- `fecha`
- `created_by`
- `created_at`
- `updated_at`
- `items`
- `version`
- `stock_actualizado`


### ordenCompra (erp_ordenes_compra)

**App fields not found in DB (7):**

- `nombre` (app: `nombre`)
- `disciplina` (app: `disciplina`)
- `descripcion` (app: `descripcion`)
- `archivo_url` (app: `archivoUrl`)
- `subido_por` (app: `subidoPor`)
- `fecha_subida` (app: `fechaSubida`)
- `revision` (app: `revision`)

**DB columns not in app schema (10):**

- `proveedor`
- `material`
- `cantidad`
- `monto`
- `fecha`
- `created_by`
- `created_at`
- `updated_at`
- `items`
- `stock_actualizado`


### ordenCompra (erp_ordenes_compra)

**App fields not found in DB (8):**

- `numero` (app: `numero`)
- `titulo` (app: `titulo`)
- `descripcion` (app: `descripcion`)
- `solicitante` (app: `solicitante`)
- `destino` (app: `destino`)
- `fecha_solicitud` (app: `fechaSolicitud`)
- `respuesta` (app: `respuesta`)
- `fecha_respuesta` (app: `fechaRespuesta`)

**DB columns not in app schema (11):**

- `proveedor`
- `material`
- `cantidad`
- `monto`
- `fecha`
- `created_by`
- `created_at`
- `updated_at`
- `items`
- `version`
- `stock_actualizado`


### ordenCompra (erp_ordenes_compra)

**App fields not found in DB (8):**

- `renglon_codigo` (app: `renglonCodigo`)
- `cuadrilla` (app: `cuadrilla`)
- `cantidad_ejecutada` (app: `cantidadEjecutada`)
- `unidad` (app: `unidad`)
- `horas_trabajadas` (app: `horasTrabajadas`)
- `rendimiento_real` (app: `rendimientoReal`)
- `rendimiento_teorico` (app: `rendimientoTeorico`)
- `observaciones` (app: `observaciones`)

**DB columns not in app schema (11):**

- `proveedor`
- `material`
- `cantidad`
- `monto`
- `estado`
- `created_by`
- `created_at`
- `updated_at`
- `items`
- `version`
- `stock_actualizado`


### ordenCompra (erp_ordenes_compra)

**App fields not found in DB (4):**

- `oc_id` (app: `ocId`)
- `cantidad_recibida` (app: `cantidadRecibida`)
- `cantidad_o_c` (app: `cantidadOC`)
- `diferencia` (app: `diferencia`)

**DB columns not in app schema (10):**

- `cantidad`
- `monto`
- `estado`
- `proyecto_id`
- `created_by`
- `created_at`
- `updated_at`
- `items`
- `version`
- `stock_actualizado`


### ordenCompra (erp_ordenes_compra)

**App fields not found in DB (4):**

- `titulo` (app: `titulo`)
- `descripcion` (app: `descripcion`)
- `categoria` (app: `categoria`)
- `fecha_envio` (app: `fechaEnvio`)

**DB columns not in app schema (10):**

- `material`
- `cantidad`
- `monto`
- `fecha`
- `created_by`
- `created_at`
- `updated_at`
- `items`
- `version`
- `stock_actualizado`


### ordenCompra (erp_ordenes_compra)

**App fields not found in DB (7):**

- `codigo` (app: `codigo`)
- `nombre` (app: `nombre`)
- `categoria` (app: `categoria`)
- `unidad` (app: `unidad`)
- `costo_base` (app: `costo_base`)
- `rubro` (app: `rubro`)
- `activo` (app: `activo`)

**DB columns not in app schema (10):**

- `proveedor`
- `material`
- `cantidad`
- `monto`
- `estado`
- `fecha`
- `proyecto_id`
- `items`
- `version`
- `stock_actualizado`


### plantilla (erp_plantillas_proyectos)

**App fields not found in DB (5):**

- `tipo_obra` (app: `tipoObra`)
- `factor_sobrecosto` (app: `factorSobrecosto`)
- `administracion` (app: `administracion`)
- `imprevistos` (app: `imprevistos`)
- `utilidad` (app: `utilidad`)

**DB columns not in app schema (11):**

- `estructura_presupuesto`
- `hitos_template`
- `riesgos_template`
- `checklist_calidad`
- `usos_count`
- `metricas`
- `version`
- `version_historial`
- `created_at`
- `updated_at`
- `creado_por`


### presupuesto (erp_presupuestos)

**DB columns not in app schema (5):**

- `created_by`
- `updated_by`
- `version`
- `created_at`
- `updated_at`


### presupuesto (erp_presupuestos)

**App fields not found in DB (2):**

- `proyecto` (app: `proyecto`)
- `project_id` (app: `projectId`)

**DB columns not in app schema (16):**

- `id`
- `proyecto_id`
- `tipologia`
- `renglones`
- `total_calculado`
- `costo_directo_total`
- `estado`
- `notas`
- `version_presupuesto`
- `fecha_creacion`
- `fecha_actualizacion`
- `created_by`
- `updated_by`
- `version`
- `created_at`
- `updated_at`


### presupuesto (erp_presupuestos)

**App fields not found in DB (12):**

- `tipo` (app: `tipo`)
- `numero` (app: `numero`)
- `fecha` (app: `fecha`)
- `fecha_vencimiento` (app: `fechaVencimiento`)
- `cliente_nombre` (app: `clienteNombre`)
- `cliente_nit` (app: `clienteNit`)
- `cliente_telefono` (app: `clienteTelefono`)
- `cliente_email` (app: `clienteEmail`)
- `cliente_direccion` (app: `clienteDireccion`)
- `descripcion` (app: `descripcion`)
- `alcance` (app: `alcance`)
- `precio_venta_total` (app: `precioVentaTotal`)

**DB columns not in app schema (8):**

- `tipologia`
- `total_calculado`
- `version_presupuesto`
- `fecha_creacion`
- `fecha_actualizacion`
- `created_by`
- `updated_by`
- `version`


### comparacionCalculo (erp_comparaciones_calculos)

**App fields not found in DB (14):**

- `proyecto_id` (app: `proyectoId`)
- `periodo` (app: `periodo`)
- `presupuesto_total` (app: `presupuestoTotal`)
- `costo_real` (app: `costoReal`)
- `ingreso_real` (app: `ingresoReal`)
- `utilidad_bruta` (app: `utilidadBruta`)
- `margen_bruto` (app: `margenBruto`)
- `variacion_presupuesto` (app: `variacionPresupuesto`)
- `estado_rentabilidad` (app: `estadoRentabilidad`)
- `eficiencia_labor` (app: `eficienciaLabor`)
- `desperdicio_materiales` (app: `desperdicioMateriales`)
- `utilizacion_equipo` (app: `utilizacionEquipo`)
- `score_eficiencia` (app: `scoreEficiencia`)
- `updated_at` (app: `updatedAt`)

**DB columns not in app schema (9):**

- `calculo_base_id`
- `calculo_comparado_id`
- `fecha_comparacion`
- `diferencias`
- `tipo_cambio`
- `magnitud_cambio`
- `porcentaje_cambio`
- `aceptado`
- `motivo_rechazo`


### comparacionCalculo (erp_comparaciones_calculos)

**App fields not found in DB (13):**

- `cliente` (app: `cliente`)
- `cliente_nit` (app: `clienteNit`)
- `proyectos_count` (app: `proyectosCount`)
- `valor_total_contratos` (app: `valorTotalContratos`)
- `costo_total_real` (app: `costoTotalReal`)
- `utilidad_total` (app: `utilidadTotal`)
- `margen_promedio` (app: `margenPromedio`)
- `proyecto_mas_rentable` (app: `proyectoMasRentable`)
- `proyecto_menos_rentable` (app: `proyectoMenosRentable`)
- `valor_vida_cliente` (app: `valorVidaCliente`)
- `probabilidad_retencion` (app: `probabilidadRetencion`)
- `segmento` (app: `segmento`)
- `updated_at` (app: `updatedAt`)

**DB columns not in app schema (9):**

- `calculo_base_id`
- `calculo_comparado_id`
- `fecha_comparacion`
- `diferencias`
- `tipo_cambio`
- `magnitud_cambio`
- `porcentaje_cambio`
- `aceptado`
- `motivo_rechazo`


### comparacionCalculo (erp_comparaciones_calculos)

**App fields not found in DB (13):**

- `proyecto_id` (app: `proyectoId`)
- `tipo_proyeccion` (app: `tipoProyeccion`)
- `fecha_proyeccion` (app: `fechaProyeccion`)
- `fecha_base` (app: `fechaBase`)
- `valor_actual` (app: `valorActual`)
- `valor_proyectado` (app: `valorProyectado`)
- `confianza` (app: `confianza`)
- `factores_riesgo` (app: `factoresRiesgo`)
- `factores_oportunidad` (app: `factoresOportunidad`)
- `escenario_optimista` (app: `escenarioOptimista`)
- `escenario_base` (app: `escenarioBase`)
- `escenario_pesimista` (app: `escenarioPesimista`)
- `modelo_version` (app: `modeloVersion`)

**DB columns not in app schema (9):**

- `calculo_base_id`
- `calculo_comparado_id`
- `fecha_comparacion`
- `diferencias`
- `tipo_cambio`
- `magnitud_cambio`
- `porcentaje_cambio`
- `aceptado`
- `motivo_rechazo`


### comparacionCalculo (erp_comparaciones_calculos)

**App fields not found in DB (12):**

- `proyecto_id` (app: `proyectoId`)
- `tipo_recurso` (app: `tipoRecurso`)
- `costo_planeado` (app: `costoPlaneado`)
- `costo_real` (app: `costoReal`)
- `eficiencia` (app: `eficiencia`)
- `desperdicio` (app: `desperdicio`)
- `productividad` (app: `productividad`)
- `unidades_producidas` (app: `unidadesProducidas`)
- `unidades_planeadas` (app: `unidadesPlaneadas`)
- `alerta_desviacion` (app: `alertaDesviacion`)
- `umbral_alerta` (app: `umbralAlerta`)
- `updated_at` (app: `updatedAt`)

**DB columns not in app schema (9):**

- `calculo_base_id`
- `calculo_comparado_id`
- `fecha_comparacion`
- `diferencias`
- `tipo_cambio`
- `magnitud_cambio`
- `porcentaje_cambio`
- `aceptado`
- `motivo_rechazo`


### comparacionCalculo (erp_comparaciones_calculos)

**App fields not found in DB (7):**

- `periodo` (app: `periodo`)
- `tipo_analisis` (app: `tipoAnalisis`)
- `agrupador` (app: `agrupador`)
- `proyectos_activos` (app: `proyectosActivos`)
- `rentabilidad_promedio` (app: `rentabilidadPromedio`)
- `margen_promedio` (app: `margenPromedio`)
- `tendencias` (app: `tendencias`)

**DB columns not in app schema (10):**

- `calculo_base_id`
- `calculo_comparado_id`
- `fecha_comparacion`
- `diferencias`
- `tipo_cambio`
- `magnitud_cambio`
- `porcentaje_cambio`
- `aceptado`
- `motivo_rechazo`
- `created_at`


### comparacionCalculo (erp_comparaciones_calculos)

**App fields not found in DB (12):**

- `tipologia` (app: `tipologia`)
- `subtipo` (app: `subtipo`)
- `margen_historico_promedio` (app: `margenHistoricoPromedio`)
- `margen_objetivo` (app: `margenObjetivo`)
- `factor_riesgo` (app: `factorRiesgo`)
- `complejidad_promedio` (app: `complejidadPromedio`)
- `precio_sugerido_base` (app: `precioSugeridoBase`)
- `ajuste_estacional` (app: `ajusteEstacional`)
- `ajuste_demanda` (app: `ajusteDemanda`)
- `precio_optimizado` (app: `precioOptimizado`)
- `confianza_recomendacion` (app: `confianzaRecomendacion`)
- `fecha_actualizacion` (app: `fechaActualizacion`)

**DB columns not in app schema (9):**

- `calculo_base_id`
- `calculo_comparado_id`
- `fecha_comparacion`
- `diferencias`
- `tipo_cambio`
- `magnitud_cambio`
- `porcentaje_cambio`
- `aceptado`
- `motivo_rechazo`


### movimiento (erp_movimientos)

**App fields not found in DB (2):**

- `material_id` (app: `materialId`)
- `fuente` (app: `fuente`)

**DB columns not in app schema (18):**

- `id`
- `tipo`
- `descripcion`
- `unidad`
- `categoria`
- `costo_unitario`
- `costo_total`
- `created_by`
- `created_at`
- `updated_at`
- `proveedor_nit`
- `forma_pago`
- `referencia_bancaria`
- `retencion_isr`
- `retencion_iva`
- `notas`
- `factura`
- `proveedor`


### movimiento (erp_movimientos)

**App fields not found in DB (9):**

- `material_id` (app: `materialId`)
- `consumo_promedio_diario` (app: `consumoPromedioDiario`)
- `consumo_promedio_semanal` (app: `consumoPromedioSemanal`)
- `consumo_promedio_mensual` (app: `consumoPromedioMensual`)
- `variabilidad` (app: `variabilidad`)
- `tendencia` (app: `tendencia`)
- `pico_consumo_mes` (app: `picoConsumoMes`)
- `pico_consumo_cantidad` (app: `picoConsumoCantidad`)
- `ultimo_analisis` (app: `ultimoAnalisis`)

**DB columns not in app schema (20):**

- `id`
- `tipo`
- `descripcion`
- `cantidad`
- `unidad`
- `categoria`
- `costo_unitario`
- `costo_total`
- `fecha`
- `created_by`
- `created_at`
- `updated_at`
- `proveedor_nit`
- `forma_pago`
- `referencia_bancaria`
- `retencion_isr`
- `retencion_iva`
- `notas`
- `factura`
- `proveedor`


### movimiento (erp_movimientos)

**App fields not found in DB (8):**

- `proveedor_id` (app: `proveedorId`)
- `material_id` (app: `materialId`)
- `lead_time_promedio` (app: `leadTimePromedio`)
- `lead_time_minimo` (app: `leadTimeMinimo`)
- `lead_time_maximo` (app: `leadTimeMaximo`)
- `confiabilidad` (app: `confiabilidad`)
- `total_ordenes` (app: `totalOrdenes`)
- `ultima_actualizacion` (app: `ultimaActualizacion`)

**DB columns not in app schema (21):**

- `id`
- `tipo`
- `proyecto_id`
- `descripcion`
- `cantidad`
- `unidad`
- `categoria`
- `costo_unitario`
- `costo_total`
- `fecha`
- `created_by`
- `created_at`
- `updated_at`
- `proveedor_nit`
- `forma_pago`
- `referencia_bancaria`
- `retencion_isr`
- `retencion_iva`
- `notas`
- `factura`
- `proveedor`


### movimiento (erp_movimientos)

**App fields not found in DB (21):**

- `material_id` (app: `materialId`)
- `material_nombre` (app: `materialNombre`)
- `proyecto_nombre` (app: `proyectoNombre`)
- `stock_actual` (app: `stockActual`)
- `stock_minimo` (app: `stockMinimo`)
- `stock_maximo` (app: `stockMaximo`)
- `punto_reorden` (app: `puntoReorden`)
- `cantidad_sugerida` (app: `cantidadSugerida`)
- `urgencia` (app: `urgencia`)
- `prioridad` (app: `prioridad`)
- `fecha_estimada_agotamiento` (app: `fechaEstimadaAgotamiento`)
- `lead_time_dias` (app: `leadTimeDias`)
- `costo_total_estimado` (app: `costoTotalEstimado`)
- `proveedor_sugerido_id` (app: `proveedorSugeridoId`)
- `proveedor_sugerido_nombre` (app: `proveedorSugeridoNombre`)
- `justificacion` (app: `justificacion`)
- `ahorro_potencial` (app: `ahorroPotencial`)
- `estado` (app: `estado`)
- `fecha_sugerencia` (app: `fechaSugerencia`)
- `fecha_revision` (app: `fechaRevision`)
- `revisado_por` (app: `revisadoPor`)

**DB columns not in app schema (18):**

- `tipo`
- `descripcion`
- `cantidad`
- `unidad`
- `categoria`
- `costo_unitario`
- `costo_total`
- `fecha`
- `created_by`
- `created_at`
- `updated_at`
- `proveedor_nit`
- `forma_pago`
- `referencia_bancaria`
- `retencion_isr`
- `retencion_iva`
- `factura`
- `proveedor`


### movimiento (erp_movimientos)

**App fields not found in DB (13):**

- `material_id` (app: `materialId`)
- `habilitado` (app: `habilitado`)
- `metodo_calculo` (app: `metodoCalculo`)
- `stock_seguridad_dias` (app: `stockSeguridadDias`)
- `stock_maximo_multiplo` (app: `stockMaximoMultiplo`)
- `umbral_urgencia_critica` (app: `umbralUrgenciaCritica`)
- `umbral_urgencia_alta` (app: `umbralUrgenciaAlta`)
- `umbral_urgencia_media` (app: `umbralUrgenciaMedia`)
- `costo_ordenamiento` (app: `costoOrdenamiento`)
- `costo_almacenamiento` (app: `costoAlmacenamiento`)
- `autoaprobar_urgencia_critica` (app: `autoaprobarUrgenciaCritica`)
- `proveedor_preferido_id` (app: `proveedorPreferidoId`)
- `ultima_actualizacion` (app: `ultimaActualizacion`)

**DB columns not in app schema (19):**

- `tipo`
- `descripcion`
- `cantidad`
- `unidad`
- `categoria`
- `costo_unitario`
- `costo_total`
- `fecha`
- `created_by`
- `created_at`
- `updated_at`
- `proveedor_nit`
- `forma_pago`
- `referencia_bancaria`
- `retencion_isr`
- `retencion_iva`
- `notas`
- `factura`
- `proveedor`


### empleado (erp_empleados)

**App fields not found in DB (2):**

- `proyecto_ids` (app: `proyectoIds`)
- `fecha_asignacion` (app: `fechaAsignacion`)

**DB columns not in app schema (4):**

- `created_by`
- `created_at`
- `updated_at`
- `avatar_url`


### empleado (erp_empleados)

**App fields not found in DB (13):**

- `fecha` (app: `fecha`)
- `hora` (app: `hora`)
- `descripcion` (app: `descripcion`)
- `afectados` (app: `afectados`)
- `testigos` (app: `testigos`)
- `acciones_inmediatas` (app: `accionesInmediatas`)
- `reportado_por` (app: `reportadoPor`)
- `latitud` (app: `latitud`)
- `longitud` (app: `longitud`)
- `lat` (app: `lat`)
- `lng` (app: `lng`)
- `fotos` (app: `fotos`)
- `estado` (app: `estado`)

**DB columns not in app schema (10):**

- `nombre`
- `puesto`
- `salario_diario`
- `dias_trabajados`
- `created_by`
- `created_at`
- `updated_at`
- `avatar_url`
- `activo`
- `telefono`


### avance (erp_avances)

**App fields not found in DB (2):**

- `renglon_codigo` (app: `renglonCodigo`)
- `renglon_nombre` (app: `renglonNombre`)

**DB columns not in app schema (2):**

- `created_by`
- `created_at`


### avance (erp_avances)

**App fields not found in DB (7):**

- `avance_financiero` (app: `avanceFinanciero`)
- `costo_planeado` (app: `costoPlaneado`)
- `costo_real` (app: `costoReal`)
- `valor_planeado` (app: `valorPlaneado`)
- `valor_ganado` (app: `valorGanado`)
- `cv` (app: `cv`)
- `sv` (app: `sv`)

**DB columns not in app schema (8):**

- `presupuesto_id`
- `renglon_id`
- `cantidad_ejecutada`
- `foto`
- `latitud`
- `longitud`
- `created_by`
- `notas`


### avance (erp_avances)

**App fields not found in DB (12):**

- `nombre` (app: `nombre`)
- `descripcion` (app: `descripcion`)
- `tipo` (app: `tipo`)
- `probabilidad` (app: `probabilidad`)
- `impacto` (app: `impacto`)
- `nivel` (app: `nivel`)
- `plan_mitigacion` (app: `planMitigacion`)
- `plan_contingencia` (app: `planContingencia`)
- `responsable` (app: `responsable`)
- `fecha_identificacion` (app: `fechaIdentificacion`)
- `estado` (app: `estado`)
- `costo_soporte` (app: `costoSoporte`)

**DB columns not in app schema (10):**

- `presupuesto_id`
- `renglon_id`
- `fecha`
- `avance_fisico`
- `cantidad_ejecutada`
- `foto`
- `latitud`
- `longitud`
- `created_by`
- `notas`


### publicacionMuro (erp_publicaciones_muro)

**App fields not found in DB (6):**

- `autor` (app: `autor`)
- `autor_avatar` (app: `autorAvatar`)
- `tipo` (app: `tipo`)
- `fotos` (app: `fotos`)
- `documento` (app: `documento`)
- `url` (app: `url`)

**DB columns not in app schema (8):**

- `autor_id`
- `usuario_id`
- `tipo_publicacion`
- `likes`
- `comentarios`
- `imagenes`
- `created_at`
- `updated_at`


### publicacionMuro (erp_publicaciones_muro)

**App fields not found in DB (5):**

- `tipo` (app: `tipo`)
- `titulo` (app: `titulo`)
- `mensaje` (app: `mensaje`)
- `referencia_id` (app: `referenciaId`)
- `leido` (app: `leido`)

**DB columns not in app schema (8):**

- `autor_id`
- `usuario_id`
- `contenido`
- `tipo_publicacion`
- `likes`
- `comentarios`
- `imagenes`
- `updated_at`


### proyectoWeather (erp_proyecto_weather)

**App fields not found in DB (5):**

- `forecast` (app: `forecast`)
- `location` (app: `location`)
- `lat` (app: `lat`)
- `lon` (app: `lon`)
- `fetched_at` (app: `fetched_at`)

**DB columns not in app schema (11):**

- `id`
- `proyecto_id`
- `weather_data`
- `impact`
- `construction_metrics`
- `scheduling_windows`
- `historical_impact`
- `last_updated`
- `created_at`
- `updated_at`
- `history`


### proyectoWeather (erp_proyecto_weather)

**App fields not found in DB (11):**

- `date` (app: `date`)
- `temp` (app: `temp`)
- `temp_min` (app: `tempMin`)
- `temp_max` (app: `tempMax`)
- `humidity` (app: `humidity`)
- `wind_speed` (app: `windSpeed`)
- `condition` (app: `condition`)
- `icon` (app: `icon`)
- `precipitation` (app: `precipitation`)
- `impact_score` (app: `impactScore`)
- `impact_level` (app: `impactLevel`)

**DB columns not in app schema (11):**

- `id`
- `proyecto_id`
- `weather_data`
- `impact`
- `construction_metrics`
- `scheduling_windows`
- `historical_impact`
- `last_updated`
- `created_at`
- `updated_at`
- `history`


### proyectoWeather (erp_proyecto_weather)

**App fields not found in DB (4):**

- `enabled` (app: `enabled`)
- `auto_refresh` (app: `autoRefresh`)
- `refresh_interval` (app: `refreshInterval`)
- `alert_threshold` (app: `alertThreshold`)

**DB columns not in app schema (4):**

- `weather_data`
- `impact`
- `construction_metrics`
- `historical_impact`

## 6. Recommendations

### Critical

1. **Tables only in remote**: Verify if these need migration definitions
2. **Tables only in migrations**: Run migrations on remote DB to create missing tables
3. **Column type mismatches**: Align DB types with migration definitions
4. **Missing columns**: Add missing columns to remote DB via ALTER TABLE

### Medium Priority

1. **Enum alignment**: Ensure CHECK constraints match app Zod enums
2. **App-only fields**: Document fields that exist only in app state
3. **Index coverage**: Add missing indexes to migrations for performance

### Low Priority

1. **Naming consistency**: Standardize table/column names across migrations
2. **Default values**: Align DB defaults with app defaults
3. **Nullable fields**: Review nullable vs optional mismatches

---

*Report generated by automated schema alignment audit*
