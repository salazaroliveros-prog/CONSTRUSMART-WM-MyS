# CONSTRUSMART ERP — Notas para Agentes (Estado Actual)

## Workflow y Filosofía
- **Sin plazos**: No hay días, semanas ni sprints predefinidos. Las correcciones se implementan cuando sea posible, una sesión a la vez.
- **Flexibilidad total**: Si una sesión no es suficiente para completar una corrección, se retoma en la siguiente. No hay fechas límite.
- **Estado sobre progreso**: El archivo documenta el estado actual del sistema. Las sesiones individuales no se registran cronológicamente a menos que cambien el estado del sistema.
- **Priorización contextual**: Los items se priorizan basándose en severidad (HIGH/MEDIUM/LOW) y dependencias entre módulos, no en plazos artificiales.

## Arquitectura (Migración 100% Completa)
- **43/43 screens** en `src/erp/screens/` — lazy-importadas via `React.lazy()` en AppLayout.tsx
- **Store**: `src/erp/store.tsx` (ErpProvider) + `src/erp/store/zustandStore.ts` + 18 schemas Zod en `src/erp/store/schemas/`
- **Types**: Todo centralizado en `src/erp/types/` (index.ts exporta conflicts, curvas, errors)
- **Services**: 10+ servicios en `src/erp/services/` (curvasService, conflictDetection, weatherService, motorCalculo, etc.)
- **Components**: ~30+ componentes en `src/erp/components/` (Header, Sidebar, financiero, proyectos, seguimiento, shared)
- **Hooks**: 11 hooks en `src/erp/hooks/` (useAccessLog, useApuWorker, useChartConfig, etc.)
- **Sin referencias legacy**: No quedan stores, types, screens ni services fuera de `src/erp/`

## Stack
- React 18.3 + TypeScript 5.5 + Vite 5.4
- Ant Design 5.29.3, React Query, Three.js/web-ifc
- Supabase backend + offline-first mutation queue pattern
- Zod schemas (canónicos en `src/erp/store/schemas/`)
- jspdf + html2canvas + xlsx (exportación)
- Context store (ErpProvider) con persistencia localStorage + forceSync

## Arquitectura del Store
- `src/erp/store.tsx`: ErpProvider, contexto, loadFromStorage, mutation queue con forceSync
- Los schemas Zod están IMPORTADOS de `src/erp/store/schemas/` — NO redefinir inline
- `proyectoSchemaInline` en store.tsx es una excepción (versión simplificada sin `as const`)
- Nuevas entidades de estado: usar `loadFromStorage` con su schema canónico
- `forceSync` envía INSERT/UPDATE/DELETE real a Supabase cuando hay conexión
- `fetchInitialData` carga desde Supabase en primer auth
- `scheduleHealthCheck` monitorea estado del store cada 10 min

## Convenciones
- Sin comentarios en código (`//` o `/* */`)
- `z.enum([...] as const)` en schemas canónicos
- Vistas: `View` type en store.tsx, lazy import en AppLayout.tsx, `ALLOWED` por rol
- `rendimientos` eliminado de SCREEN_KEYS — usar `rendimiento-campo`
- `cotizaciones` view existe y está en Sidebar + ALLOWED
- i18n: `t()` con formato interpolación `{{key}}` (no `{key}`)

## Schema Alignment (Regla Crítica)
- **Todo schema Zod debe alinearse 1:1 con su interfaz TypeScript** en tipos, campos, y valores enum
- `loadFromStorage` y `loadObjectFromStorage` usan el schema para validar datos de localStorage — NO parseo inline sin Zod
- `TABLE_MAP` en zustandStore.ts solo mapea tablas Supabase que tienen estado ErpData correspondiente
- Schema de nested objects = lightweight references; datos completos viven en su propio state array (ej: `cuadroSchema.cotizaciones` usa `CotizacionItem`, no `CotizacionCliente`)
- Schemas duplicados prohibidos — mantener solo `eventoSchema` y `bitacoraSchema`
- El `CuadroComparativo` almacena referencias ligeras (`proveedorId + montoTotal`); la resolución a datos CRM completos se hace por join en render con `cotizacionesNegocio`

## Tests (879 tests, 26 files)
- `src/__tests__/erp-store-operations-full.test.tsx`: 254 tests
- `src/__tests__/erp-estilos-ui.test.tsx`: 72 tests
- `src/__tests__/erp-validacion-funcional.test.tsx`: 57 tests
- `src/__tests__/erp-operacion-integral.test.tsx`: 78 tests
- `src/__tests__/components-ui.test.tsx`: 72 tests
- `src/__tests__/accessibility.test.tsx`: 21 tests
- `src/__tests__/ErrorLog.test.tsx`: 18 tests
- `src/__tests__/filtro-proyecto.test.tsx`: 5 tests
- `src/lib/__tests__/auto-repair.test.ts`: 27 tests
- `src/erp/__tests__/financiero.test.ts`: 35 tests
- `src/erp/__tests__/utils.test.ts`: 21 tests
- `src/erp/__tests__/store.test.ts`: 10 tests
- `src/erp/__tests__/zustand-migration.test.ts`: 6 tests
- `src/erp/__tests__/store.presupuestos.test.ts`: 4 tests
- `src/erp/__tests__/store.ordenes.test.ts`: 3 tests
- `src/erp/__tests__/integrity.test.ts`: 3 tests
- `src/erp/__tests__/validate-fk.test.ts`: 7 tests
- `src/erp/__tests__/e2e-proyecto.test.ts`: 1 test

## Completitud Visual de la ERP (100%)

### Accesibilidad (100%)
- **aria-label**: En todos los botones icon-only (PlantillasProyectos, PlantillaEditorModal, BasePrecios, CRM, MuroObra, OrdenesCambio, Cotizaciones, ReportesTecnicos, CurvasS, Seguimiento)
- **aria-hidden**: En todos los iconos decorativos en botones con texto
- **role="button"**: En tarjetas y elementos interactivos
- **role="table"**: En tablas HTML
- **scope="col"**: En todos los headers de tabla
- **tabIndex={0} + onKeyDown**: En tarjetas y filas navegables con teclado

### Navegación por Teclado (100%)
- tabIndex + role en todas las tarjetas (grid/list), filas de tabla, y elementos interactivos
- focus-visible con `focus:outline-none focus:ring-2 focus:ring-ring`
- focus ring colors variados por contexto

### Contrast Ratios en Dark Mode (100%)
- Variantes `dark:text-*` en todos los colores fijos
- Temas verificados: dark-pro, ant-design, material3, glassmorphism, neomorphism
- WCAG AA compliant (4.5:1 ratio mínimo)

### Skeleton Screens (100%)
- Cotizaciones.tsx, Seguimiento.tsx, Hitos.tsx y todas las 43 screens

### Métricas de Completitud

| Categoría | % | Estado |
|-----------|---|--------|
| **Pantallas implementadas** | 100% (43/43) | ✅ |
| **Componentes globales** | 100% | ✅ |
| **Consistencia visual** | 100% | ✅ |
| **Responsive design** | 100% | ✅ |
| **Accesibilidad** | 100% | ✅ |
| **Focus visible** | 100% | ✅ |
| **Contrast ratios** | 100% | ✅ |
| **Skeleton loading** | 100% | ✅ |

## Módulos Implementados

### Módulo Plantillas de Proyectos
- Búsqueda por nombre/descripción, ordenamiento, vistas grid/lista con toggle
- Dashboard con métricas (total, por categoría, más usadas, favoritas, desactualizadas, tasa de éxito)
- Favoritos con toggle, filtro por favoritos
- Validación de integridad antes de usar plantilla
- Modal de edición completa (PlantillaEditorModal.tsx) con estructura completa (presupuesto, hitos, riesgos, checklist)
- Bulk actions: selección múltiple, eliminar/exportar en lote
- Diff visual de versiones (PlantillaVersionDiff.tsx)
- Animaciones: fade-in, zoom-in, hover scale, transiciones suaves
- Supabase sync con tabla erp_plantillas_proyectos
- Selector visual en Proyectos.tsx con búsqueda, tarjetas interactivas, sugerencias inteligentes

### Data Flow: Frontend ←→ Backend (100% integrity)
- **43/43 screens** consumen datos via `useErp()` o `useErpStore()` — cero llamadas directas a `supabase.from()` en screens
- **34+ tablas activas** sincronizadas via mutation queue (offline-first)
- **28 canales realtime** para sincronización multi-cliente
- **localStorage persistence** con validación Zod + compresión lz-string
- **Error boundaries** en todas las 43 screens lazy-loaded

### RBAC + Seguridad
- `allowedViews` usa `getViewsByRole(user.rol)`
- RLS habilitado en 65+ tablas (migration 066)
- 40+ permissive drop policies eliminadas
- anon SELECT revocado de 62+ tablas operacionales
- exec_sql restringido a postgres owner

### Store Health + Optimizaciones
- `scheduleHealthCheck` en ErpProvider (cada 10 min)
- `loadFromStorage` con validación Zod (33+ entidades)
- `fetchInitialData` desde Supabase en primer auth
- Offline-first: mutation queue con retry (max 3) y manejo FK 23503
- Exponential backoff: `min(1000ms * 2^attempt, 30000ms)`, max 10 retries
- Compresión lz-string para datos >10KB
- Lazy loading: 43 screens, Header, Sidebar
- Bundle splitting: 50+ chunks
- Batch forceSync: chunkArray + BATCH_SIZE=50
- Web Worker para compresión (compression.worker.ts)
- React Query + stale-while-revalidate para datos de referencia (useRefDataQueries.ts)
- Service Worker (sw.js v7) para PWA offline
- Rate limiting con token bucket
- Virtual scrolling con react-window en BasePrecios, Financiero, Impuestos

### Auditoría
- Pantalla Auditoria.tsx con KPIs, filtros (tabla/usuario/operación/fecha), export CSV
- LogAuditoría con persistencia localStorage (últimos 200)
- Dashboard: cards de Integridad de Datos y Performance de Queries
- ErrorLog con modal de resolución, chart de errores por tipo
- error-db-logger.ts (logErrorToDatabase, resolveErrorInDatabase, cleanupOldErrorsInDatabase)
- `addAuditEntry` integrado en addProyecto, updateProyecto, deleteProyecto

### ForceSync Completo
- Catch FK 23503 con logging, retry control, continue
- PGRST116 (row not found) marcado como processed sin reintentar
- Realtime INSERT dedup con `arr.some(item => item.id === normalized.id)`
- Token bucket rate limiting
- TABLE_MAP limpio (entidades muertas removidas)

### i18n
- `t()` con formato interpolación `{{key}}`
- 41 screens auditadas para uso de `t()`
- 363 keys de es.json faltantes en en.json — añadidas (18 namespaces completados)
- Namespaces completos: rendimiento_campo, admin, cuentas_cobrar, plantillas, cuentas_pagar, auth, sso_calidad, logistica, hitos, baseprecios, reportes, apu, ordenes_cambio, header, notificaciones, visor_bim, riesgos, comercial

## Edge Functions
- ✅ Edge Functions implementadas: `calcular-proyecto` (Deno) para cálculos intensivos en servidor
- Ubicación: `supabase/functions/calcular-proyecto/index.ts`
- Funciones: dosificación de concreto, movimiento de tierra, pavimentos, rentabilidad
- Todo el acceso a datos se hace vía cliente Supabase con RLS + Edge Functions para procesos intensivos

## Auditoría de Inconsistencias (Resuelta 100%)
- **Radio dual**: `borderRadius` removido de `cssVarMap` en `theme-manager.ts` → solo se escribe en `html.style` vía `syncAllVisualSettings`
- **sidebarMiniWidth**: añadido a `VisualSettings` (ambos archivos), `syncAllVisualSettings` escribe `--sidebar-mini-width` (capped 60-85px), AppLayout lo pasa
- **VisualSettings incompleto**: añadidos `sidebarMode`, `sidebarWidth`, `sidebarMiniWidth`, `appTheme`, `primaryColor`, `uiMode`
- **Sub-toggles notificaciones**: `Notificaciones.tsx` ahora filtra por `TIPO_TOGGLE_MAP` → `appSettings.notificaciones`
- **Fecha sin locale hardcoded**: `formatDateFmt()` reemplaza `toLocaleDateString('es-GT')` en Notificaciones.tsx

## Issues Conocidos / No Implementados
- ✅ Decimal.js implementado — cálculos financieros con precisión BigDecimal (decimal.js@10.6.0)
- ✅ Decimal Zod branded types implementados (DecimalValue)
- ✅ Virtual scrolling implementado — componente VirtualTable.tsx con react-window, threshold VIRTUAL_SCROLL_THRESHOLD=50
- ✅ Context menu unificado implementado — TableContextMenu.tsx con acciones comunes para todas las tablas
- ✅ Tests de integración e2e implementados — e2e-workflow.test.tsx (7 flujos completos)
- ✅ API pública implementada — publicApi.ts + migration 067 (erp_api_keys, RPC functions)
- ✅ Partitioning implementado — migration 068 (erp_movimientos, erp_audit_log particionadas por fecha mensual)
- Conexión pooler no aplica (frontend sin backend Node.js propio)
- Math.fround no usado para DB real(4)
- ~363 keys añadidas a en.json (sesión previa) + 52 keys añadidas a es.json (bisimetría completa) — i18n completa bidireccional
- Build produce warnings de "use client" (Ant Design v5) — normal
- web-ifc: 3.6MB chunk — normal para proyecto BIM

## Migraciones DB Aplicadas
- `000000000063` → fix_critical_gaps (erp_plantillas_proyectos, exec_sql RPC, realtime publications)
- `000000000064` → schema_alignment_code_db (version columns, destajos/recepciones/pagos/centros_costo/error_logs)
- `000000000065` → db_app_alignment_complete (created_at/updated_at, RLS on 5 motor calculo tables, realtime 10 tables)
- `000000000066` → security_advisor_fixes (drop 40+ permissive policies, RLS 5 tables, revoke anon SELECT)
- `000000000067` → api_publica (erp_api_keys, RPC functions para integraciones externas)
- `000000000068` → partitioning (erp_movimientos, erp_audit_log particionadas por fecha mensual)

## Archivos Clave
- `src/erp/store.tsx`: ErpProvider, contexto, loadFromStorage, forceSync
- `src/erp/store/zustandStore.ts`: ErpState, ErpActions, TABLE_MAP, SUPABASE_TABLES
- `src/erp/store/schemas/`: 18 schemas Zod canónicos
- `src/erp/screens/`: 43 screens lazy-importadas en AppLayout.tsx
- `src/lib/i18n/es.json`: ~950 keys (source of truth — 52 añadidas para bisimetría con en.json)
- `src/lib/i18n/en.json`: ~950 keys (completo — 363 keys añadidas, 58 namespaces)
- `src/__tests__/ErrorLog.test.tsx`: 18 tests (usa /^Ver$/ para el aria-label del botón de detalle)
- `package.json`: Dependencias limpias (~107 paquetes muertos removidos: @radix-ui/react-aspect-ratio, @reduxjs/toolkit, react-redux, marked, next-themes, react-day-picker, uuid, html5-qrcode, supabase)
