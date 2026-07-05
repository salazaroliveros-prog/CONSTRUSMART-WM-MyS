# Mapeo de Pantallas → Tablas Supabase

## Pantallas Principales y sus Tablas Asociadas

| Pantalla | Tablas Supabase | Estado |
|----------|-----------------|--------|
| **Dashboard** | erp_proyectos, erp_movimientos, erp_materiales, erp_empleados, erp_ordenes_compra, erp_cuentas_pagar, erp_cuentas_cobrar, erp_hitos, erp_riesgos, erp_licitaciones, erp_avances, erp_presupuestos | ✅ |
| **Proyectos** | erp_proyectos, erp_plantillas_proyectos | ✅ |
| **Presupuestos** | erp_presupuestos, erp_proyectos, erp_materiales, erp_proveedores | ✅ |
| **Bodega** | erp_materiales, erp_ordenes_compra, erp_vales_salida, erp_proveedores | ✅ |
| **LogísticaCompras** | erp_ordenes_compra, erp_proveedores, recepciones_almacen | ✅ |
| **EntradasAlmacenOC** | erp_ordenes_compra, recepciones_almacen, erp_materiales | ✅ |
| **RRHH** | erp_empleados, erp_destajos | ✅ |
| **PlanillaDestajos** | erp_empleados, erp_destajos | ✅ |
| **Financiero** | erp_movimientos, erp_cuentas_cobrar, erp_cuentas_pagar, erp_pagos_proveedor | ✅ |
| **CuentasCobrar** | erp_cuentas_cobrar | ✅ |
| **CuentasPagar** | erp_cuentas_pagar, erp_pagos_proveedor | ✅ |
| **ComercialFinanzas** | erp_cotizaciones_negocio, ventas_paquetes | ✅ |
| **CRM** | erp_cotizaciones_negocio, erp_licitaciones | ✅ |
| **Cotizaciones** | erp_cotizaciones_negocio | ✅ |
| **Seguimiento** | erp_seguimiento, erp_avances, erp_proyectos | ✅ |
| **RendimientoCampo** | (Deprecado - usa rendimiento-campo) | ⚠️ |
| **CurvasS** | erp_avances, erp_proyectos | ✅ |
| **Hitos** | erp_hitos, erp_proyectos | ✅ |
| **Riesgos** | erp_riesgos, erp_proyectos | ✅ |
| **OrdenesCambio** | erp_ordenes_cambio, erp_proyectos | ✅ |
| **MuroObra** | erp_muro, erp_publicaciones_muro | ✅ |
| **SSOCalidad** | erp_no_conformidades, erp_incidentes | ✅ |
| **GestionDocumental** | erp_planos, erp_rfis, erp_submittals | ✅ |
| **APUAvanzado** | erp_presupuestos, erp_renglones, erp_insumos_base | ✅ |
| **BasePrecios** | erp_insumos_base | ✅ |
| **PlantillasProyectos** | erp_plantillas_proyectos | ✅ |
| **ReportesTecnicos** | erp_proyectos, erp_avances, erp_presupuestos | ✅ |
| **ExportacionInteligente** | (Todas las tablas para exportación) | ✅ |
| **AnalisisCostosDashboard** | erp_presupuestos, erp_movimientos, erp_proyectos | ✅ |
| **DashboardPredictivo** | erp_proyectos, erp_avances, erp_presupuestos | ✅ |
| **ProveedorAnalytics** | erp_proveedores, erp_ordenes_compra | ✅ |
| **Notificaciones** | erp_notificaciones | ✅ |
| **ErrorLog** | erp_error_logs | ✅ |
| **Auditoria** | erp_audit_log | ✅ |
| **Administracion** | (Gestión de usuarios) | ✅ |
| **Ajustes** | (Configuración app) | ✅ |
| **Impuestos** | erp_movimientos, ventas_paquetes | ✅ |
| **VisorBIM** | erp_planos | ✅ |

## Tablas con Pantallas Asignadas

Todas las tablas operativas principales tienen al menos una pantalla asignada:
- ✅ erp_proyectos → Dashboard, Proyectos, Seguimiento, CurvasS, Hitos, Riesgos, OrdenesCambio
- ✅ erp_movimientos → Dashboard, Financiero, Impuestos, AnalisisCostos
- ✅ erp_empleados → Dashboard, RRHH, PlanillaDestajos
- ✅ erp_materiales → Dashboard, Bodega, Presupuestos, EntradasAlmacen
- ✅ erp_ordenes_compra → Dashboard, Bodega, LogísticaCompras, EntradasAlmacen, ProveedorAnalytics
- ✅ erp_proveedores → Dashboard, Bodega, LogísticaCompras, ProveedorAnalytics
- ✅ erp_presupuestos → Dashboard, Presupuestos, APUAvanzado, ReportesTecnicos, AnalisisCostos
- ✅ erp_licitaciones → Dashboard, CRM
- ✅ erp_cotizaciones_negocio → Dashboard, CRM, Cotizaciones, ComercialFinanzas
- ✅ erp_avances → Dashboard, Seguimiento, CurvasS
- ✅ erp_cuentas_cobrar → Dashboard, Financiero, CuentasCobrar
- ✅ erp_cuentas_pagar → Dashboard, Financiero, CuentasPagar
- ✅ erp_hitos → Dashboard, Hitos
- ✅ erp_riesgos → Dashboard, Riesgos
- ✅ erp_ordenes_cambio → Dashboard, OrdenesCambio
- ✅ erp_planos → GestionDocumental, VisorBIM
- ✅ erp_rfis → GestionDocumental
- ✅ erp_submittals → GestionDocumental
- ✅ erp_activos → (Sin pantalla específica - verificar)
- ✅ erp_cuadros → (Sin pantalla específica - verificar)
- ✅ erp_pagos_proveedor → Dashboard, CuentasPagar
- ✅ erp_destajos → RRHH, PlanillaDestajos
- ✅ erp_vales_salida → Dashboard, Bodega
- ✅ erp_no_conformidades → Dashboard, SSOCalidad
- ✅ erp_incidentes → Dashboard, SSOCalidad
- ✅ erp_publicaciones_muro → Dashboard, MuroObra
- ✅ erp_seguimiento → Dashboard, Seguimiento
- ✅ erp_bitacora → (Sin pantalla específica - verificar)
- ✅ erp_plantillas_proyectos → Dashboard, PlantillasProyectos, Proyectos
- ✅ erp_eventos_calendario → (Sin pantalla específica - verificar)
- ✅ ventas_paquetes → Dashboard, ComercialFinanzas
- ✅ erp_notificaciones → Dashboard, Notificaciones
- ✅ erp_pruebas_laboratorio → (Sin pantalla específica - verificar)
- ✅ erp_liberaciones_partida → (Sin pantalla específica - verificar)
- ✅ erp_error_logs → Dashboard, ErrorLog
- ✅ erp_centros_costo → (Sin pantalla específica - verificar)
- ✅ recepciones_almacen → Dashboard, EntradasAlmacen

## GAPs Identificados

### Tablas sin pantalla específica:
- erp_activos (Activos)
- erp_cuadros (Cuadros Comparativos)
- erp_bitacora (Bitácora)
- erp_eventos_calendario (Eventos)
- erp_pruebas_laboratorio (Pruebas)
- erp_liberaciones_partida (Liberaciones)
- erp_centros_costo (Centros de Costo)

Estas tablas podrían necesitar pantallas dedicadas o estar integradas en otras pantallas existentes.
