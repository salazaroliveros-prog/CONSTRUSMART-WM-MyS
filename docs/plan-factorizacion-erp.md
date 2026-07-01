# Plan de Factorización y Reorganización Estructural — ERP CONSTRUSMART

## Objetivo
Reducir la fragmentación del ERP integrando módulos con alta redundancia funcional, manteniendo la lógica de negocio completa y alineada con Supabase.

## Decisiones principales aprobadas

| # | Entidad origen | Entidad destino | Qué se integra | Impacto en UI |
|---|----------------|-----------------|----------------|---------------|
| 1 | PlantillasProyectos | Proyectos | Selección/creación desde plantilla, clonación y versionado | Sección/pestaña en Proyectos; mantiene flujos existentes |
| 2 | BasePrecios | APUAvanzado | Catálogo `insumosBase`, filtros, conversión/unidad, import/export CSV | Tab/base de referencia dentro de APUAvanzado |
| 3 | Cotizaciones | Presupuestos | Cotizaciones como fase temprana antes de generar presupuesto | Wizard/flujo interno en Presupuestos |
| 4 | CuentasCobrar / CuentasPagar | Financiero | Cuentas por cobrar y pagar como subvistas de movimientos financieros | Tabs en Financiero: General / Por Cobrar / Por Pagar |
| 5 | EntradasAlmacenOC | Bodega | Recepciones y entradas a almacén como operación de bodega | Tab/modal dentro de Bodega |
| 6 | ProveedorAnalytics | LogisticaCompras | Analytics de proveedores como sección de compras/logística | Tab en Logística: Órdenes, Entradas, Proveedores, Analytics |
| 7 | Auditoria | Administracion | Logs y filtros avanzados de auditoría integrados a admin | Sección expandible en Administración |

## Nueva estructura propuesta de navegación

```
PRINCIPAL
- Dashboard
- Proyectos
  - Proyectos (lista, detalle, edición)
  - Plantillas (sección integrada)
- CRM / Licitaciones
- Cotizaciones
  - Cotizaciones como paso previo del presupuesto

PLANIFICACIÓN
- Presupuestos
  - Crear desde cotización/APU
  - Cotizaciones (fase integrada)
  - Historial
- APU Avanzado
  - Análisis de precios unitarios
  - Insumos base / Base de precios integrada
- Hitos
- Riesgos
- Plantillas (movido a Proyectos)

EJECUCIÓN / CAMPO
- Seguimiento de Obra
  - EVM + Curvas S + Gantt
  - Bitácora diaria
  - CRUD de avances
- Rendimiento de Campo
- SSO / Calidad
- Órdenes de Cambio
- Gestión Documental
- Visor BIM
- Muro de Obra

INVENTARIO / SUMINISTRO
- Bodega / Materiales
  - Inventario
  - Entradas de almacén (integrado)
- Logística / Compras
  - Órdenes de compra
  - Proveedores
  - Proveedor Analytics (integrado)
- Activos / Herramientas
- Cuadros

RRHH
- Recursos Humanos
- Planilla por Destajos

FINANZAS
- Financiero / Caja
  - Movimientos generales
  - Cuentas por Cobrar (tab)
  - Cuentas por Pagar (tab)
  - Impuestos

ANÁLISIS / BI
- BI Predictivo
- Exportación Inteligente

SISTEMA
- Notificaciones
- Administración
  - Auditoría integrada
- Ajustes
- Error Log
```

## Impacto en Supabase

### 4.1 Plantillas → Proyectos
- Tablas: `erp_plantillas_proyectos` se mantiene; se accede desde Proyectos.
- RLS: sin cambios.
- Store/Zustand: mantener carga de `plantillas`.

### 4.2 BasePrecios → APUAvanzado
- Tablas: `erp_insumos_base` se mantiene; pasa a ser catálogo dentro de APUAvanzado.
- RLS: sin cambios.
- Store/Zustand: `insumosBase` permanece.

### 4.3 Cotizaciones → Presupuestos
- Tablas: `erp_cotizaciones_negocio` se mantiene, con relación a `erp_presupuestos`.
- RLS: sin cambios.
- UI: Cotizaciones deja de ser módulo separado.

### 4.4 CuentasCobrar/Pagar → Financiero
- Tablas: `erp_cuentas_cobrar`, `erp_cuentas_pagar`, `erp_movimientos` sin cambios.
- RLS: verificar `hasSupabase` policies por tabla; solo cambia UI.
- Vista posible: vistas `vw_*` pueden volverse obsoletas; opción: renombrar a `obs_*_2026` o deprecar.

### 4.5 EntradasAlmacenOC → Bodega
- Tablas: `recepciones_almacen`, `erp_vales_salida`, `erp_materiales` sin cambios.
- RLS: sin cambios.
- Realtime: mantener suscripciones actuales.

### 4.6 ProveedorAnalytics → LogisticaCompras
- Tablas: `erp_proveedores`, `erp_ordenes_compra`, `erp_pagos_proveedor` sin cambios.
- RLS: sin cambios.
- Analytics: migrar cálculos de pantalla a componente interno.

### 4.7 Auditoria → Administracion
- Tablas: `erp_audit_log` sin cambios.
- RLS: sin cambios.
- Acceso: se mantiene; solo cambia la navegación.

## Checklist de implementación

- [ ] Confirmar eliminación de rutas y vistas del sidebar correspondientes a los módulos integrados.
- [ ] Ajustar `View` y `ALL_VIEWS` en `store.tsx`.
- [ ] Ajustar `getViewsByRole()` en `security.ts` si aplica.
- [ ] Crear secciones/tabs internas en:
  - [ ] Proyectos: Plantillas
  - [ ] APUAvanzado: BasePrecios
  - [ ] Presupuestos: Cotizaciones
  - [ ] Financiero: CuentasCobrar / CuentasPagar
  - [ ] Bodega: EntradasAlmacen
  - [ ] LogisticaCompras: ProveedorAnalytics
  - [ ] Administracion: Auditoria
- [ ] Revisar dependencias de stores/components y mover shared components.
- [ ] Ejecutar lint / typecheck / build.
- [ ] Ejecutar tests.
- [ ] Pushear documentación.
- [ ] Validar Supabase: tablas/vistas/funciones/RLS sin cambios.

## Riesgos
- Pérdida de discoverabilidad: usuarios conocen módulos por nombre.
- Datos históricos deben preservarse intactos.
- Compatibilidad con roles/permisos.
- Pruebas de humo luego de mover flujos.

## Mitigaciones
- Tooltips/documentación de la nueva ubicación.
- No eliminar tablas ni datos históricos por ahora.
- Validar `getViewsByRole()` y allowedViews.
- Ejecutar tests y build previos al merge.