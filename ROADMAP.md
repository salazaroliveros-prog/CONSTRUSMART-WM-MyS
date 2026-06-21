# CONSTRUSMART ERP — ROADMAP DE IMPLEMENTACIÓN

## Estado Actual
- **Store**: Zustand + Context (offline-first con cola de mutaciones)
- **Tests**: 619 unitarios pasando (0 fallos, 15 archivos)
- **Entidades**: 33+ en store, 30+ schemas Zod canónicos
- **Build**: 0 errores, 0 warnings
- **Compresión**: lz-string integrado en persistencia localStorage
- **Alertas**: Panel de alertas con stock crítico, NC, OC, hitos vencidos
- **Cartera**: Widget donut de proyectos por estado en Dashboard
- **i18n**: Dashboard migrado a `t()` (internacionalización completa)

## Implementado (Sesiones 01-09)

| Item | Descripción |
|---|---|
| A-03 | State machine con validaciones de transición |
| A-04 | motivoPausa obligatorio + modal |
| A-06 | tableMap completo en forceSync |
| A-07 | Stale closure fix (useRef) |
| A-08/A-09 | Validación estado/etapa + avance restringido |
| A-10 | toSnake/toCamel con manejo de anidamiento (deep + cycle-safe) |
| A-11 | Optimistic locking versión en Proyecto |
| A-12 | Compresión lz-string + gestión de cuota localStorage |
| A-13..17 | Campos duplicados eliminados en types.ts |
| A-18 | fetchInitialData desde Supabase con Promise.allSettled |
| A-20 | Lazy loading Header + Sidebar |
| A-23 | EMPRESA configurable desde settings |
| A-24 | addAuditEntry + persistencia + UI en Administracion |
| A-25 | Notificaciones agrupadas (dedup + contador) |
| BUG-01..06 | Varios fixes operacionales |
| UI-01 | PDF en Cotizaciones |
| SEC-04 | Sanitización en enqueueMutation |
| PERF-01 | Auth dependencias estables |
| SQL | 19 migraciones, RLS, realtime, RPC functions |
| Store | Persistencia localStorage (33 entidades + compresión), forceSync |
| i18n | Dashboard completamente traducido con t() |
| Cartera | Widget donut de proyectos por estado en Dashboard |
| Alertas | Panel AlertasPanel con stock crítico, NC pendientes, OC pendientes, hitos vencidos |
| Presupuesto | Recalculo automático de total al modificar renglones |
| OC Stock | Flag stockActualizado evita doble deducción en OC |

---

## Pendientes por Implementar

### FASE 0 — Quick Wins (Alta Prioridad)

| # | Item | Archivos | Esfuerzo | Status |
|---|---|---|---|---|
| 0.5 | **A-01**: Eliminar dead code Redux (`src/store.ts`) + migrar hooks | `src/store.ts`, 13 hooks | 3h | ✅ |

### FASE 1 — UI/UX (Prioridad Media)

| # | Item | Archivos | Esfuerzo | Status |
|---|---|---|---|---|
| 1.1 | **i18n Dashboard**: Migrar strings hardcodeados a `t()` | `Dashboard.tsx` | 2h | ✅ |
| 1.2 | **A-20**: Lazy loading Header + Sidebar | `AppLayout.tsx` | 1h | ✅ |
| 1.3 | **Widget Cartera**: Donut/counts de proyectos por estado | `Dashboard.tsx` | 3h | ✅ |
| 1.4 | **Panel Alertas**: Stock crítico, NC, OC, hitos vencidos | `AlertasPanel.tsx` | 3h | ✅ |
| 1.5 | **Compact Calendar**: Reemplazar calendario full-size | `Dashboard.tsx` | 2h | ✅ |

### FASE 2 — Data Layer (Prioridad Media)

| # | Item | Archivos | Esfuerzo | Status |
|---|---|---|---|---|
| 2.1 | **Optimistic locking**: Extender a Materiales, Órdenes, Presupuestos | `zustandStore.ts`, `types.ts` | 3h | ✅ |
| 2.2 | **IndexedDB fallback** para localStorage lleno | `lib/persistence.ts` | 4h | ✅ |
| 2.3 | **toSnake/toCamel automático genérico** | `utils.ts` | 2h | ✅ (auto-wired in enqueueMutation) |

### FASE 3 — Arquitectura (Prioridad Baja)

| # | Item | Archivos | Esfuerzo | Status |
|---|---|---|---|---|
| 3.1 | **Store slices**: Separar zustandStore en dominios | `store/slices/` | 6h | ✅ |
| 3.2 | **State machine engine**: `proyectoStateMachine.ts` formal | `engine/` | 4h | ✅ |
| 3.3 | **Archivado automático**: Proyectos finalizados > 6 meses | `lib/archivar.ts` | 2h | ✅ |

### FASE 4 — Seguridad y Operaciones (Prioridad Baja)

| # | Item | Archivos | Esfuerzo | Status |
|---|---|---|---|---|
| 4.1 | **RLS consolidado**: 1 migración que reemplace las 22 actuales | `migración 023` | 4h | ✅ |
| 4.2 | **Notificaciones push**: Service Worker + Realtime | `sw.js` + `useNotifications.ts` | 6h | ✅ |
| 4.3 | **Backup automático**: Exportación diaria programada | `lib/backup.ts` | 3h | ✅ |

### FASE 5 — Tests (Prioridad Baja)

| # | Item | Archivos | Esfuerzo | Status |
|---|---|---|---|---|
| 5.1 | **Tests concurrencia**: Edición simultánea mismo proyecto | `concurrency.test.ts` (33 tests) | 3h | ✅ |
| 5.2 | **Tests sync offline**: Offline → reconexión → consistencia | `erp-store-operations-full` (10 tests) | 4h | ✅ |
| 5.3 | **E2E Playwright**: 5 flujos críticos | `e2e/erp-flujos-criticos.spec.ts` (10 tests) | 8h | ✅ |

---

## Operacionales No Abordados

| Problema | Riesgo | Solución Propuesta |
|---|---|---|
| Stock double-dispatch en vales simultáneos | 🔴 Alto | ✅ Migración 021: 3 RPCs con SELECT FOR UPDATE |
| OC duplicados: suman stock sin validar | 🟡 Medio | Flag `stockActualizado` en OC + optimistic locking — ✅ |
| Presupuesto no recalcula al modificar renglones | 🟡 Medio | Recalcular total automático en `updatePresupuesto` — ✅ |
| Stock double-dispatch en vales simultáneos | 🔴 Alto | RPC Supabase con `SELECT ... FOR UPDATE` |
| RLS por rol global, no por membresía proyecto | 🔴 Alto | ✅ Migración 022 + 023: tabla miembros + RLS consolidado |
