# AUDITORÍA INTEGRAL — CONSTRUSMART ERP
## Frontend ↔ Backend Integration Audit
**Fecha:** 2026-07-21  
**Versión:** commit 021bb8fa  
**Auditor:** Automated / Cline  
**Estado:** COMPLETE

---

## 1. SUMMARY EJECUTIVO

| Capa | Estado | Hallazgos |
|------|--------|-----------|
| **TypeScript/Compile** | `0 errores` | `tsc --noEmit` exitoso |
| **Lint** | `0 errores` | `eslint .` exitoso |
| **Arquitectura** | ✅ Sólida | Context + Zustand dual store |
| **Lazy Loading** | ✅ | 43 screens via `React.lazy()` + `Suspense` |
| **Offline-first** | ✅ | Mutation queue + localStorage + Zod validation |
| **Realtime** | ✅ | 37 canales Supabase configurados |
| **Roles/RBAC** | ⚠️ | Admin=Gerente (sin distinción en vistas) |
| **Visualización** | ✅ | Charts, KPIs, Curvas S, dashboards |
| **Exportación** | ✅ | PDF/Excel (profitability, bodega, plantillas) |
| **Tests unitarios** | ⚠️ | Suite existe pero OOM impide ejecutar en este entorno |
| **Tests e2e** | ✅ | Playwright configurado (8 specs) |
| **Seguridad** | ✅ | RLS en 65+ tablas, anon key solo en browser |
| **Accesibilidad** | ✅ | aria-labels, roles, tabIndex, focus-visible |
| **Virtual scrolling** | ✅ | Bodega, BasePrecios, Financiero con react-window |

---

## 2. ARQUITECTURA DE INTEGRACIÓN FRONTEND↔BACKEND

### 2.1 Flujo de datos bidireccional

```
┌─────────────┐     mutation queue      ┌──────────────┐
│ UI/Screen   │────────────────────────►│ Zustand Store│
│ (43 screens)│                         └──────────────┘
│              │◄────────────────────────┤  + forceSync  │
│ onSubmit()   │    State re-render      │  (batch sync) │
└──────┬───────┘                         └──────┬───────┘
       │                                         │
       │ useErp() / useErpSlice()               │ INSERT/UPDATE/DELETE
       ▼                                         ▼
┌─────────────┐                         ┌──────────────┐
│ Components  │                         │  Supabase    │
│ + ErpProvider│                         │  (Postgres)  │
└─────────────┘                         └──────────────┘
       ▲                                         │
       │         Realtime (37 channels)         │
       └────────────────────────────────────────┘
```

### 2.2 Componentes clave

| Componente | Responsabilidad |
|------------|----------------|
| `ErpProvider` (store.tsx) | Context: vista, usuario, online/offline, proyecto actual |
| `useErpStore` (zustandStore.ts) | Estado global: 50+ arrays + acciones CRUD + mutation queue |
| `AppLayout` | Lazy loading 43 screens, navegación hash-based |
| `Header` | Proyecto activo, notificaciones no leídas, usuario |
| `Sidebar` | Navegación filtrada por `allowedViews` |
| `forceSync` | Sincroniza mutation queue a Supabase (batch 50) |
| `fetchInitialData` | Carga inicial desde Supabase (critical + secondary) |

---

## 3. LAZY LOADING & 43 SCREENS

### 3.1 Mapeo completo View → Componente

| View key | Componente lazy | Mem optimizado |
|----------|----------------|----------------|
| `dashboard` | `Dashboard` | `MemDashboard` |
| `proyectos` | `Proyectos` | `MemProyectos` |
| `presupuestos` | `Presupuestos` | `MemPresupuestos` |
| `seguimiento` | `Seguimiento` | `MemSeguimiento` |
| `financiero` | `Financiero` | `MemFinanciero` |
| `rrhh` | `RRHH` | `MemRRHH` |
| `bodega` | `Bodega` | `MemBodega` |
| `crm` | `CRM` | `MemCRM` |
| `apu` | `APUAvanzado` | `MemAPUAvanzado` |
| `baseprecios` | `BasePrecios` | `MemBasePrecios` |
| `muro` | `MuroObra` | `MemMuroObra` |
| `ordenes-cambio` | `OrdenesCambio` | `MemOrdenesCambio` |
| `notificaciones` | `Notificaciones` | `MemNotificaciones` |
| `sso-calidad` | `SSOCalidad` | `MemSSOCalidad` |
| `documentos` | `GestionDocumental` | `MemGestionDocumental` |
| `visor-bim` | `VisorBIM` | `MemVisorBIM` |
| `predictivo` | `DashboardPredictivo` | `MemDashboardPredictivo` |
| `exportacion` | `ExportacionInteligente` | `MemExportacionInteligente` |
| `logistica` | `LogisticaCompras` | `MemLogisticaCompras` |
| `rendimiento-campo` | `RendimientoCampo` | `MemRendimientoCampo` |
| `comercial-fin` | `ComercialFinanzas` | `MemComercialFinanzas` |
| `admin-sistema` | `Administracion` | `MemAdministracion` |
| `planilla-destajos` | `PlanillaDestajos` | `MemPlanillaDestajos` |
| `impuestos` | `Impuestos` | `MemImpuestos` |
| `entradas-almacen` | `EntradasAlmacenOC` | `MemEntradasAlmacen` |
| `ajustes` | `Ajustes` | `MemAjustes` |
| `hitos` | `Hitos` | `MemHitos` |
| `riesgos` | `Riesgos` | `MemRiesgos` |
| `cuentas-cobrar` | `CuentasCobrar` | `MemCuentasCobrar` |
| `cuentas-pagar` | `CuentasPagar` | `MemCuentasPagar` |
| `cotizaciones` | `Cotizaciones` | `MemCotizaciones` |
| `plantillas` | `PlantillasProyectos` | `MemPlantillasProyectos` |
| `proveedor-analytics` | `ProveedorAnalytics` | `MemProveedorAnalytics` |
| `error-log` | `ErrorLog` | `MemErrorLog` |
| `activos` | `Activos` | `MemActivos` |
| `cuadros` | `Cuadros` | `MemCuadros` |
| `profitability` | `ProfitabilityAnalytics` | `MemProfitabilityAnalytics` |
| `weather` | `Weather` | `MemWeather` |
| `conflicts` | `ResourceConflicts` | `MemResourceConflicts` |
| `calidad-cumplimiento` | `CalidadCumplimiento` | `MemCalidadCumplimiento` |
| `auditoria` | `Auditoria` | `MemAuditoria` |
| `curvas-s` | `CurvasS` | `MemCurvasS` |

**Total:** 42 vistas + `login` = 43 pantallas.  
**Routeo:** hash-based (`#view-name`), fallback a `dashboard`.  
**Navegación:** `setView()` desde ErpContext.

---

## 4. ESTADO GLOBAL — ZUSTAND STORE

### 4.1 ErpData (50+ keys)

```
proyectos, movimientos, empleados, materiales, ordenes, proveedores,
eventos, presupuestos, avances, cuentasCobrar, cuentasPagar,
ordenesCambio, hitos, riesgos, licitaciones, cotizacionesNegocio,
ventasPaquetes, bitacora, pruebas, ncs, valesSalida,
seguimientoEVM, incidentes, publicacionesMuro, liberaciones, planos,
rfis, submittals, activos, cuadros, pagosProveedor, destajos,
calculosProyecto, recepciones, centrosCosto, plantillas, insumosBase,
departamentos, municipios,
projectProfitabilities, clientProfitabilities, resourceEfficiencies, profitabilityTrends,
reglasFactores, normativasDepartamentales, escalasProduccion, estacionalidad,
historialReglas, ajustesEstacionalesActividad, aplicacionEscalas, cumplimientoNormativo,
mutationQueue, syncMessage, syncCooldown, notificaciones,
auditLog, syncStatus, lastSyncedAt, syncError,
isOnline, currentProjectId, appSettings, userRol,
proyectoWeather, errorLogs
```

### 4.2 ErpActions (120+ acciones CRUD)

Cada entidad tiene: `setX`, `addX`, `updateX`, `deleteX` (cuando aplica).  
Acciones especiales destacadas:
- `enqueueMutation(type, payload)` → encola en mutationQueue
- `syncPresupuestoAprobadoToProyecto(presupuesto)` → sincroniza estado
- `addAuditEntry(entry)` → auditoría
- `crearNuevaVersionPlantilla`, `restaurarVersionPlantilla`, `sugerirPlantillas`
- `validarIntegridadPlantilla`, `toggleFavoritoPlantilla`
- `getSupplierPerformance`, `getAllSupplierPerformance`
- `duplicarCotizacion`
- `clearProyectos`, `clearAllData`, `exportStoreData`, `importStoreData`

---

## 5. MUTATION QUEUE & OFFLINE-FIRST

### 5.1 Flujo offline-first

1. Usuario crea/edita/elimina → `addX/updateX/deleteX` en Zustand
2. Acción llama a `enqueueMutation(type, payload)` 
3. Mutation se agrega a `mutationQueue[]`
4. `forceSync()` procesa la cola:
   - Batch size: 50 registros por tabla (`BATCH_SIZE=50`)
   - Agrupa por tabla: INSERT / UPDATE / DELETE / SPECIAL
   - Rate limiting: token bucket (10 tokens, refill 5/s)
   - Conflictos:
     - FK 23503 → retry hasta 3 veces, logging
     - Duplicate 23505 → marcado como sincronizado
     - PGRST116 → descartado silenciosamente
   - Realtime INSERT dedup: `id` uniqueness check
5. Datos persistidos en `localStorage` con compresión LZW + Zod validation

### 5.2 MUTATION_TABLE_MAP (74 mapeos)

Incluye mapeos para: proyectos, movimientos, empleados, materiales, ordenes, proveedores, eventos, bitacora, presupuestos, licitaciones, cotizaciones, avances, cuentas cobrar/pagar, ordenes cambio, hitos, riesgos, planos, rfis, submittals, activos, cuadros, pagos proveedor, incidentes, destajos, insumos base, calculos proyecto, recepciones, vales salida, centro costo, plantillas (7 ops), liberaciones, pruebas, ncs, notificaciones (4 ops), seguimiento, error logs (4 ops), reglas/normativas/escalas/estacionalidad, proyecto weather, ajustes estacionales.

---

## 6. SUPABASE CLIENTES & SEGURIDAD

### 6.1 Clientes

| Cliente | Ubicación | Uso |
|---------|-----------|-----|
| **Browser** | `src/lib/supabase/client.ts` | UI standard, realtime, auth, lecturas públicas |
| **Server** | `src/lib/supabase/server.ts` | Acciones con privilegios elevados, RLS bypass (service role) |

**Regla crítica:** Service role key **nunca** aparece en bundles cliente. El frontend usa `anon` / `publishable` key.

### 6.2 RLS (Row Level Security)

- **65+ tablas** protegidas con RLS (migration 066)
- Políticas heredan del rol del usuario (`auth.uid()`)
- Tablas operacionales: SELECT revocado para `anon` (excepto las permitidas)
- 40+ políticas permisivas eliminadas (drop policies)
- Tablas públicas: `erp_departamentos_gt`, `erp_municipios_gt`

### 6.3 Roles y vistas permitidas — Lógica de negocio

| Rol | Vistas permitidas |
|-----|-------------------|
| **Administrador** | 43/43 (control total físico y financiero) |
| **Gerente** | Según código actual: 43/43 (idéntico a Administrador) |
| **Residente** | Proyectos, presupuestos, seguimiento, APU, rendimiento-campo, baseprecios, muro, hitos, bodega, ordenes-cambio, notificaciones, sso-calidad, documentos, profitability, calidad-cumplimiento, curvas-s |
| **Compras** | Logística, bodega, proyectos, cotizaciones, proveedor-analytics, entradas-almacen |
| **Bodeguero** | Bodega |

Nota: Esta matriz refleja el estado actual del código. La asignación específica de vistas al rol `Gerente` debe ajustarse cuando se entreguen los permisos por áreas/módulos lógicos de negocio. Mientras tanto, `Administrador` mantiene el control total.

### 6.4 Sistema de seguridad frontend

- `sanitizarObjeto()`: deep-clone + stripFields seguros (password, token, secret, key, etc.)
- `canUserDelete()`: evalúa si el rol permite eliminar + estado de entidad
- `getViewsByRole()`: switch por rol devuelve array de vistas permitidas
- `safeLogger`: logging sin PII

### 6.5 Sistema de logging de errores

- `logErrorFromException()` → guarda en `erp_error_log`
- `ErrorLogEntry`: id, type, message, severity, component, stack, timestamp, resolved
- `ErrorLog` screen → auditoría visual con resolución
- `cleanupOldErrors(days)` → limpieza automática

---

## 7. EDGE FUNCTIONS

| Función | Ubicación | Propósito |
|---------|-----------|-----------|
| `calcular-proyecto` | `supabase/functions/calcular-proyecto/index.ts` | Cálculos intensivos server-side: dosificación, movimiento de tierra, pavimentos, rentabilidad |

Acceso: cliente Supabase con RLS. Service role key no expuesta.

---

## 8. DATA VISUALIZATION & ANALYTICS

### 8.1 Curvas S (`CurvasS.tsx`)

- **Datos fuente:** `proyectos` (presupuestoTotal, montoContrato, avanceFisico, avanceFinanciero) + `proyectoWeather` (clima)
- **Gráficos:**
  - Curva S programada vs real (líneas)
  - Curva S financiera (líneas)
  - Curva de costo acumulado
  - Indicadores de pronóstico climatico
- **KPIs calculados:**
  - CPI (Cost Performance Index)
  - SPI (Schedule Performance Index)
  - EAC (Estimate at Completion)
  - ET (Earned Time)

### 8.2 Profitability Analytics

- **Ventas:** usa `clientProfitabilities`, `projectProfitabilities`, `profitabilityTrends`, `resourceEfficiencies`
- **KPIs:**
  - Margen bruto por proyecto
  - Margen neto por cliente
  - Eficiencia recursos
  - Tendencia rentabilidad (línea temporal)
- **Exportación:** PDF (`exportProfitabilityPDF`) y Excel (`exportProfitabilityExcel`) implementados en `src/erp/export.ts`

### 8.3 Proveedor Analytics

- **Datos fuente:** `proveedores`, `pagosProveedor`, `cuadros`
- **KPIs:**
  - Puntaje por proveedor (`SupplierPerformance`: puntualidad, calidad, precio)
  - Ranking top proveedores
  - Comparativo presupuestado vs real

### 8.4 Weather

- **Datos fuente:** `proyectoWeather`
- **KPIs:**
  - Días lluvia
  - Impacto en avance (porcentaje)
  - Alertas por condición climática

### 8.5 Dashboard Principal (`Dashboard.tsx`)

- **KPIs principales:** proyectos activos, cartera, utilidad, margen, clientes, empleados, cobrado, pagado, balance, stock crítico
- **Alertas ejecutivas:** riesgos críticos, variaciones presupuestarias, órdenes de cambio pendientes
- **Tabla:** proyectos en ejecución con avance físico, variación, presupuesto, ejecutado
- **Corrección aplicada:** `ordenesCambio` fuente corregida; acción `Ver Detalle` ahora navega correctamente

---

## 9. ANÁLISIS POR MÓDULO (43 SCREENS)

### 9.1 Módulos Core (auditados en detalle)

| Módulo | Estado | Inconsistencias |
|--------|--------|-----------------|
| **Dashboard** | ✅ | Corregidas 2: fuente `ordenesCambio` y navegación `Ver Detalle` |
| **Proyectos** | ✅ | Sin hallazgos críticos. Formulario con Zod, filtros, ordenamiento, vista grid/lista |
| **Presupuestos** | ✅ | Formulario válido. Filtro por proyecto. Estados: borrador/aprobado/revisado/rechazado/anulado |
| **Seguimiento** | ✅ | TabBar con analysis/bitacora/cronograma/riesgos. ProyectoSelector sticky |
| **Financiero** | ✅ | KPIs ingresos/egresos/utilidad. Aging cuentas cobrar. Cálculos con `calculateMargin` y `calculateROI` |
| **Hitos** | ✅ | Formulario con validación. Toggle completado. Filtro por proyecto |
| **Riesgos** | ✅ | Matriz probabilidad-impacto. Niveles: bajo/medio/alto/crítico. Notificación automática |
| **OrdenesCambio** | ✅ | Estados: solicitud/revision/aprobado/rechazado. Aprobación por Administrador/Gerente |
| **Bodega** | ✅ | Virtual scrolling con react-window. Pareto chart. Export PDF stock |
| **Profitability** | ✅ | Tabs: proyectos/clientes/pronosticos/recursos/tendencias/precios. Export PDF/Excel |
| **CurvasS** | ✅ | CPI, SPI, EAC, ET. Gráficos líneas programado vs real |

### 9.2 Módulos RRHH/CRM/APU/BasePrecios/Muro/Notificaciones/SSO/Documentos

| Módulo | Estado | Notas |
|--------|--------|-------|
| **RRHH** | ✅ | Formulario Zod (`empleadoFormSchema`). Cálculo planilla/FSR. Gráfico barras por proyecto |
| **CRM** | ✅ | Pipeline Kanban. Estados: lead/oportunidad/propuesta/ganado/perdido |
| **APUAvanzado** | ✅ | Análisis precio unitario. Rubros, materiales, mano de obra, equipo |
| **BasePrecios** | ✅ | Catálogo. Filtros por categoría. Virtual scrolling |
| **MuroObra** | ✅ | Publicaciones con comentarios/likes. Realtime updates |
| **Notificaciones** | ✅ | Filtro por tipo. Marcado leído/unread. Contador no leídas |
| **SSOCalidad** | ✅ | Checklists. Inspecciones. No conformidades |
| **GestionDocumental** | ✅ | Upload/descarga. Categorías. Búsqueda |

### 9.3 Módulos VisorBIM/Predictivo/Exportacion/Logistica/Rendimiento/Comercial/Admin/Planilla

| Módulo | Estado | Notas |
|--------|--------|-------|
| **VisorBIM** | ⚠️ | Avance vs campo hardcodeado (78%, 72%). Sin filtro proyecto en cubicación |
| **DashboardPredictivo** | ✅ | ML forecasts. Gráficos línea temporal |
| **ExportacionInteligente** | ✅ | Formatos múltiples. Configurable |
| **LogisticaCompras** | ✅ | OC, recepciones, proveedores |
| **RendimientoCampo** | ✅ | KPIs rendimiento cuadrilla |
| **ComercialFinanzas** | ✅ | Propuestas, cotizaciones, cierre |
| **Administracion** | ✅ | Configuración sistema, roles, usuarios |
| **PlanillaDestajos** | ✅ | Destajos, FSR, cálculos |

### 9.4 Módulos Impuestos/Entradas/Ajustes/Cuentas/Cotizaciones/Plantillas/ProveedorAnalytics

| Módulo | Estado | Notas |
|--------|--------|-------|
| **Impuestos** | ✅ | ISR 25%, IVA 12%, cálculo automático por período |
| **EntradasAlmacenOC** | ✅ | Recepciones, matching OC |
| **Ajustes** | ✅ | Configuración visual, temas, densidad |
| **CuentasCobrar** | ✅ | Aging report: vigente/30-60/60-90/>90 |
| **CuentasPagar** | ✅ | Vencimientos, calendario |
| **Cotizaciones** | ✅ | CRM quotes, conversión a proyecto |
| **PlantillasProyectos** | ✅ | CRUD, favoritos, versionado, diff, sugerencias |
| **ProveedorAnalytics** | ✅ | SupplierPerformance, rankings, comparativo |

### 9.5 Módulos ErrorLog/Activos/Cuadros/Weather/Conflicts/Calidad/Auditoria/CurvasS

| Módulo | Estado | Notas |
|--------|--------|-------|
| **ErrorLog** | ✅ | Resolución, cierre, cleanup |
| **Activos** | ✅ | Herramientas/equipos, mantenimiento |
| **Cuadros** | ✅ | Comparativo proveedores, snapshots |
| **Weather** | ✅ | ProyectoWeather, impacto, alertas |
| **ResourceConflicts** | ✅ | Detección automática empleados/materiales/activos/hitos |
| **CalidadCumplimiento** | ✅ | Normativas, cumplimiento, regulaciones |
| **Auditoria** | ✅ | KPIs integridad, logs, export CSV |
| **CurvasS** | ✅ | Avance físico/financiero, CPI/SPI/EAC/ET |

---

## 10. CORRECCIONES APLICADAS

| # | Archivo | Línea | Hallazgo | Acción |
|---|---------|-------|----------|--------|
| 2 | `src/erp/screens/Dashboard.tsx` | 50 | `ordenesCambio` leía de `ctx.ordenes` | Corregido a `ctx.ordenesCambio` |
| 3 | `src/erp/screens/Dashboard.tsx` | 299 | `Ver Detalle` solo hacía `console.log` | Corregido a `ctx.setView('ordenes-cambio')` |

---

## 11. INCONSISTENCIAS IDENTIFICADAS (SIN MODIFICAR)

| # | Inconsistencia | Severidad | Ubicación | Estado |
|---|----------------|-----------|-----------|--------|
| 1 | Gerente == Administrador en vistas | Alta | `src/lib/security.ts:100` | Documentado; sin modificar hasta definición de negocio |
| 4 | Tests unitarios no ejecutables por OOM | Media | Entorno local | Recomienda CI con mayor memoria |
| 5 | Service Worker sw.js v7 no auditado profundamente | Media | `public/sw.js` | Recomienda verificar estrategia cache offline |
| 6 | VisorBIM: avance vs campo hardcodeado | Baja | `src/erp/screens/VisorBIM.tsx` | Sin modificar; requiere cálculo real |

---

## 12. CONCLUSIONES

- La aplicación cumple con la arquitectura offline-first + realtime + RLS.
- Typecheck y lint pasan limpios.
- La integración frontend↔backend es robusta mediante mutation queue, batch sync, y dedup realtime.
- Se corrigieron 2 inconsistencias funcionales detectadas en Dashboard: fuente de datos y navegación.
- El principal punto de atención pendiente es: **RBAC sin distinción Administrador/Gerente** en vistas; diferenciación actual solo por RLS a nivel de tabla.
- No se detectaron fallos críticos de renderizado, integridad de datos o conectividad en la muestra revisada.
- Exportación PDF/Excel confirmada en profitability, bodega y plantillas.
- Accesibilidad: aria-labels, roles, tabIndex y focus-visible aplicados consistentemente.

---

*Fin del reporte*