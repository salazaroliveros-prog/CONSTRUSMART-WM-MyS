# GAP ANALYSIS COMPLETO — CONSTRUSMART ERP
## Estado Actual vs Documentación .md

**Fecha:** 07/06/2026 (actualizado 13/07/2026)
**Tests:** 846/846 pass (26 archivos)
**TypeScript:** 0 errores
**Build:** Exitoso
**Deploy:** Producción activa en Vercel

**Nota:** Actualizado el 13/07/2026 — Gap Analysis completo de 197 archivos .md vs código. Verificados items de Estrategia Fase 1–3: 11/15 implementados (batch forceSync, Web Worker, React Query SWR, Service Worker, indexes, backup, monitoring, rate limiting en forceSync, integrity checks, calc engine tests). Items pendientes reales confirmados por código: BigNumber, branded types Zod, virtual scrolling (Bodega/Movs), Math.fround, table partitioning, 2FA/MFA, rate limiting APIs externas, Weather alerts/umbrales/comparación/calendario. Connection pooler marcado como N/A (app frontend sin backend Node.js propio). AGENTS.md, TODO_PENDIENTE.md, GAP_ANALYSIS_COMPLETO.md actualizados.

---

## 1. UI/UX — Design System & Visual Consistency

### ✅ IMPLEMENTADO

| Item | Evidencia |
|------|-----------|
| design-tokens.css con variables CSS | `src/styles/design-tokens.css` — colores, sombras, elevación, tipografía, espaciados, motion |
| 5 temas visuales (Ant Design, Dark Pro, Material 3, Glassmorphism, Neomorphism) | `src/lib/themes.ts` — integrado en AppLayout.tsx |
| Sistema de elevación (5 niveles) | `design-tokens.css` — `--elevation-1` a `--elevation-5` |
| Animaciones (PageTransition, AnimatedCounter, AnimatedCheckIcon, FadeInStagger) | `src/components/Animations.tsx` |
| ElevatedCard component | `src/components/ui/elevated-card.tsx` |
| FloatingLabelInput component | `src/components/ui/floating-label-input.tsx` |
| Skeleton loading en 38/38 screens | `src/components/SkeletonScreens.tsx` |
| Ajustes.tsx con control de tema, fuente, animaciones, idioma, moneda | `src/erp/screens/Ajustes.tsx` |
| Sidebar con posiciones y modos | `src/erp/components/Sidebar.tsx` |
| QuickActionsFab (FAB flotante) | `src/erp/components/QuickActionsFab.tsx` |
| BottomNavigation para móvil | `src/erp/components/BottomNavigation.tsx` |
| SyncIndicator | `src/erp/components/SyncIndicator.tsx` |
| Responsive design (useResponsive hook) | Implementado en múltiples screens |
| aria-labels en botones icon-only | 97+ aria-labels en todas las screens |
| Focus visible rings | Todos los elementos interactivos |
| Dark mode contrast ratios (WCAG AA) | Colores con variantes `dark:` |

### ❌ PENDIENTE / PARCIAL

| Item | Prioridad | Estado Actual |
|------|-----------|---------------|
| **Posición del sidebar configurable** (izquierda/derecha/overlay) | P0 | ✅ IMPLEMENTADO (Radio.Group en Ajustes.tsx) |
| **Modo hover-to-expand** en sidebar colapsado | P0 | ✅ IMPLEMENTADO (Radio.Group en Ajustes.tsx) |
| **Fuente tipográfica seleccionable** (Inter, Roboto, Open Sans, etc.) | P1 | ✅ IMPLEMENTADO (5 opciones en Ajustes.tsx) |
| **Espaciado/padding global** configurable | P0 | ✅ IMPLEMENTADO (compacto/normal/amplio en Ajustes.tsx) |
| **Radio de bordes global** configurable | P1 | ✅ IMPLEMENTADO (5 niveles en Ajustes.tsx) |
| **Densidad de tabla** (compact/normal/comfortable) | P0 | ✅ IMPLEMENTADO (3 opciones en Ajustes.tsx) |
| **Animaciones por tipo** (fade, slide, scale, none) | P1 | ✅ IMPLEMENTADO (4 tipos en Ajustes.tsx) |
| **Breadcrumbs on/off** | P1 | ✅ IMPLEMENTADO (Switch en Ajustes.tsx) |
| **Posición de notificaciones toast** configurable | P2 | ✅ IMPLEMENTADO (sonner.tsx lee toastPosition del store, control en Ajustes tab Notificaciones) |
| **Modo quiosco/touch** para tablets | P0 | ✅ IMPLEMENTADO (Switch en Ajustes.tsx) |
| **Footer on/off** | P2 | ✅ IMPLEMENTADO (Switch en Ajustes.tsx) |
| **Sonidos de notificación** | P2 | ✅ IMPLEMENTADO (useNotificationSound hook — Web Audio API, beep al llegar notificación nueva) |
| **COLOR_* string literals** en CRM.tsx, PlantillasProyectos.tsx | HIGH | ✅ Verificado — no existen en código actual |
| **hover:COLOR_DANGER** en Bodega.tsx | HIGH | ✅ Verificado — no existe en código actual |
| **Clases gray hardcoded** en Notificaciones.tsx | MEDIUM | ✅ CORREGIDO 12/07/2026 — reemplazadas por design tokens |
| **window.confirm()** reemplazado por Modal.confirm | HIGH | ✅ COMPLETADO (13 reemplazados) |
| **Inline field validation errors** | HIGH | ✅ COMPLETADO (20+ screens) |

---

## 2. Performance

### ✅ IMPLEMENTADO

| Item | Evidencia |
|------|-----------|
| Lazy loading en 38 screens | `React.lazy(() => import(...))` en AppLayout.tsx |
| Lazy loading en Header y Sidebar | `React.lazy` en AppLayout.tsx |
| Compresión lz-string para localStorage | `compressData`/`decompressData` en utils.ts |
| Mutation queue con retry (max 3) | store.tsx forceSync |
| Exponential backoff | `min(1000ms * 2^attempt, 30000ms)` |
| Bundle splitting (50+ chunks) | Vite config |
| Chunk optimizado (antd separado) | vite.config.ts |

### ❌ PENDIENTE

| Item | Prioridad | Estado Actual |
|------|-----------|---------------|
| **Batch forceSync** (agrupar mutations del mismo tipo) | MEDIUM | ✅ IMPLEMENTADO (Map agrupado en store.tsx) |
| **Web Worker para compresión** | MEDIUM | ✅ IMPLEMENTADO (workers/compression.worker.ts) |
| **Virtual scrolling** con react-window | MEDIUM | ✅ IMPLEMENTADO (useVirtualList hook + BasePrecios.tsx, umbral 50 filas) |
| **React Query + stale-while-revalidate** para datos de referencia | MEDIUM | ✅ IMPLEMENTADO (useRefDataQueries.ts — useInsumosBaseQuery, useMaterialesQuery, useProveedoresQuery; staleTime 5min, gcTime 30min; aplicado en BasePrecios + Bodega) |
| **Service Worker** para PWA offline | MEDIUM | ✅ IMPLEMENTADO (sw.js v7 — 3 cachés diferenciados, límites de tamaño, estrategias por tipo de recurso, auto-update con skipWaiting) |
| **Cache de pronóstico 7 días** (Weather) | LOW | ✅ IMPLEMENTADO (getCachedForecast/setCachedForecast con TTL 7d en weatherService.ts) |
| **Debounce en autorefresh** (Weather) | LOW | ✅ IMPLEMENTADO (debounce 500ms + setInterval 30min en Weather.tsx) |
| **Paginación/lazy loading para historial** | LOW | ✅ IMPLEMENTADO (usePagination hook + PaginationBar — aplicado en Notificaciones.tsx y EntradasAlmacenOC.tsx) |
| **Web Workers para cálculos pesados** | LOW | ✅ IMPLEMENTADO (workers/apu-calc.worker.ts — cálculo APU en background thread) |

---

## 3. Database & Backend

### ✅ IMPLEMENTADO

| Item | Evidencia |
|------|-----------|
| RLS habilitado en 65+ tablas | migration 066 |
| 40+ permissive drop policies eliminadas | migration 066 |
| anon SELECT revocado de 62+ tablas | migration 066 |
| exec_sql restringido a postgres owner | migration 066 |
| Migration tracking vía supabase_migrations | 66 migraciones aplicadas |
| Índices estratégicos en FK | migration existente |
| RPC functions (append_comentario_muro, increment_likes_muro, log_error) | migrations |
| Realtime en 28 tablas | migrations |

### ❌ PENDIENTE

| Item | Prioridad | Estado Actual |
|------|-----------|---------------|
| **Connection pooler** | — | ⚠️ N/A para frontend (app sin backend Node.js propio; usa PostgREST/REST API) |
| **Índices en columnas de filtro frecuente** (erp_proyectos(cliente), erp_movimientos(proyecto_id, fecha), erp_presupuestos(proyecto_id), erp_ordenes_compra(proveedor, estado)) | HIGH | ✅ IMPLEMENTADO (migración 092 corregida 12/07/2026) |
| **Partitioning** en tablas grandes (erp_movimientos, erp_audit_log) | LOW | ❌ No implementado |
| **Backup automation** con cron semanal | MEDIUM | ✅ IMPLEMENTADO (.github/workflows/weekly-backup.yml — pg_dump cada domingo 02:00 UTC, artifact 30 días, secrets: SUPABASE_DB_HOST + SUPABASE_DB_PASSWORD) |
| **Performance monitoring** con pg_stat_statements | MEDIUM | ✅ IMPLEMENTADO (migración 098: v_slow_queries + fn_get_performance_metrics RPC; usePerformanceMetrics hook; tab "Rendimiento DB" en Administracion.tsx) |
| **Rate limiting** en forceSync (token bucket) | LOW | ✅ IMPLEMENTADO (tokenBucketRef en store.tsx — 5 tokens iniciales, max 10, refill 5/ciclo) |
| **Daily integrity checks** RPC | MEDIUM | ✅ IMPLEMENTADO (fn_daily_integrity_check() en migración 096 + useDailyIntegrityCheck hook — corre 1x/día para admins, 10s delay post-mount) |

---

## 4. Security

### ✅ IMPLEMENTADO

| Item | Evidencia |
|------|-----------|
| RLS en 65+ tablas | migration 066 |
| Sanitización en enqueueMutation | `sanitizarObjeto(payload)` |
| ADMIN_EMAIL en env var | `import.meta.env.VITE_ADMIN_EMAIL` |
| Session timeout (30 min) | `useSessionTimeout` en Shell |
| Error boundaries en 38 screens | AppLayout.tsx |
| Content Security Policy | vercel.json |
| RBAC client-side (getViewsByRole) | Sesión 15 — vistas filtradas por rol |
| Auditoría de accesos (erp_access_log) | Migración 097 + useAccessLog hook — registra SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED |
| Rotación de API keys | scripts/rotate-api-keys.cjs |

### ❌ PENDIENTE

| Item | Prioridad | Estado Actual |
|------|-----------|---------------|
| **Rate limiting en API endpoints** | MEDIUM | ❌ No implementado |
| **2FA / MFA** | LOW | ❌ No implementado |

---

## 5. Testing

### ✅ IMPLEMENTADO

| Item | Evidencia |
|------|-----------|
| 846 tests, 26 archivos, todos pass | `npm run test` |
| Tests de store (254 tests) | `erp-store-operations-full.test.tsx` |
| Tests de operación integral (78 tests) | `erp-operacion-integral.test.tsx` |
| Tests de auto-repair (27 tests) | `auto-repair.test.ts` |
| Tests de integridad Zod (3 tests) | `integrity.test.ts` |
| Tests de financiero (35 tests) | `financiero.test.ts` |
| Tests de UI/estilos (72 tests) | `erp-estilos-ui.test.tsx` |
| Tests de validación funcional (57 tests) | `erp-validacion-funcional.test.tsx` |
| Tests de ErrorLog (18 tests) | `ErrorLog.test.tsx` |
| Tests E2E (Playwright) | `e2e/` directory |

### ❌ PENDIENTE

| Item | Prioridad | Estado Actual |
|------|-----------|---------------|
| **Tests para motor de cálculo** (análisis de costos, APU) | HIGH | ✅ IMPLEMENTADO (src/erp/__tests__/apu-motor.test.ts — 49 tests) |
| **Tests para nuevos componentes UI** (ElevatedCard, FloatingLabelInput, Animations) | MEDIUM | ✅ IMPLEMENTADO (components-ui.test.tsx — 79 tests) |
| **Tests para temas** (themes.ts) | MEDIUM | ✅ IMPLEMENTADO (themes.test.tsx — 55 tests: THEMES, PRIMARY_COLORS, initializeTheme, applyThemeToDocument, syncAnimationsSetting, syncAllVisualSettings) |
| **Tests para design-tokens.css** | LOW | ✅ IMPLEMENTADO (design-tokens.test.tsx — 61 tests: elevation, motion, typography, spacing, density, sidebar, file integrity; entorno node) |
| **Tests de regresión visual** (Playwright screenshot) | MEDIUM | ✅ IMPLEMENTADO (e2e/visual-regression.spec.ts — toHaveScreenshot para 8 pantallas desktop + 3 mobile; playwright.config.ts actualizado con snapshotDir y maxDiffPixelRatio 2%) |
| **Tests de accesibilidad** (axe-core) | MEDIUM | ✅ IMPLEMENTADO (accessibility.test.tsx — 24 tests, vitest-axe) |
| **Tests de rendimiento** (Lighthouse CI) | LOW | ✅ IMPLEMENTADO (.github/workflows/lighthouse-ci.yml + .lighthouserc.json — thresholds: perf 70, a11y 90, best-practices 80) |
| **Tests para temas** (themes.ts) | MEDIUM | ✅ IMPLEMENTADO (themes.test.tsx — 55 tests) |
| **Tests para design-tokens.css** | LOW | ✅ IMPLEMENTADO (design-tokens.test.tsx — 61 tests, entorno node) |

---

## 6. Documentation

### ✅ IMPLEMENTADO

| Item | Evidencia |
|------|-----------|
| USER_GUIDE_ERROR_LOG.md | `_archive/reports/` |
| TROUBLESHOOTING_GUIDE.md | `_archive/docs/` |
| DEPLOYMENT_NOTES.md | `_archive/docs/` |
| ROLLBACK_PLAN.md | `_archive/docs/` |
| POST_DEPLOYMENT_MONITORING.md | `_archive/docs/` |
| BACKUP_RESTORATION_GUIDE.md | `_archive/docs/` |
| AGENTS.md (notas para agentes) | Raíz del proyecto |
| README.md | Raíz del proyecto |

### ❌ PENDIENTE

| Item | Prioridad | Estado Actual |
|------|-----------|---------------|
| **Diagrama de arquitectura del módulo Weather** | LOW | ✅ IMPLEMENTADO (docs/WEATHER_ARCHITECTURE.md — diagramas Mermaid: flujo datos, estrategia caché, auto-refresh, schema Supabase) |
| **Guía de usuario para temas y personalización** | MEDIUM | ✅ IMPLEMENTADO (docs/GUIA_TEMAS.md) |
| **Documentación de API de componentes UI** | LOW | ✅ IMPLEMENTADO (docs/API_COMPONENTES.md) |
| **Guía de contribución** | LOW | ✅ IMPLEMENTADO (CONTRIBUTING.md) |
| **CHANGELOG.md** | LOW | ✅ IMPLEMENTADO (docs/CHANGELOG.md) |

---

## 7. Refactorización de Pantallas (plan-unificacion-uiux.md Fase 8)

### Estado por pantalla

| Pantalla | Prioridad | Estado |
|----------|-----------|--------|
| Proyectos.tsx | P0 | ✅ Parcial (usa CARD, INPUT, BUTTON unificados) |
| Presupuestos.tsx | P0 | ✅ Parcial |
| Seguimiento.tsx | P0 | ✅ Parcial |
| Financiero.tsx | P0 | ✅ Parcial |
| Bodega.tsx | P0 | ✅ Verificado — sin CSS inválido |
| Dashboard.tsx | P1 | ✅ Rediseñado con cards y KPIs |
| APUAvanzado.tsx | P1 | ✅ Rediseñado con tabs y glassmorphism |
| Notificaciones.tsx | P1 | ✅ CORREGIDO 12/07/2026 — design tokens aplicados |
| Logística | P1 | ⚠️ Pendiente de auditoría |
| RRHH | P1 | ⚠️ Pendiente de auditoría |
| CRM | P1 | ✅ Verificado — sin COLOR_* string literals |
| Resto (28 screens) | P2 | ⚠️ Pendiente de auditoría |

---

## 8. Resumen de Prioridades

### 🔴 ALTA PRIORIDAD (P0) — Implementar inmediatamente

1. ~~Corregir COLOR_* string literals~~ ✅ Verificado — no existen en código actual
2. ~~Corregir hover:COLOR_DANGER~~ ✅ Verificado — no existe en código actual
3. ~~Posición del sidebar configurable~~ en Ajustes ✅ COMPLETADO
4. ~~Modo hover-to-expand~~ en sidebar colapsado ✅ COMPLETADO
5. ~~Espaciado/padding global~~ configurable ✅ COMPLETADO
6. ~~Densidad de tabla~~ (compact/normal/comfortable) ✅ COMPLETADO
7. ~~Modo quiosco/touch~~ para tablets ✅ COMPLETADO
8. ~~Índices DB en columnas de filtro frecuente~~ ✅ COMPLETADO (migración 092)
9. ~~Tests para motor de cálculo~~ (APU, costos) ✅ COMPLETADO (49 tests — apu-motor.test.ts)

### 🟡 MEDIA PRIORIDAD (P1)

1. ~~Fuente tipográfica seleccionable~~ ✅ COMPLETADO
2. ~~Radio de bordes global~~ configurable ✅ COMPLETADO
3. ~~Animaciones por tipo~~ (slide, scale, none) ✅ COMPLETADO
4. ~~Breadcrumbs on/off~~ ✅ COMPLETADO
5. ~~Batch forceSync~~ ✅ COMPLETADO
6. ~~Web Worker para compresión~~ ✅ COMPLETADO
7. ~~Virtual scrolling~~ con react-window ✅ COMPLETADO (useVirtualList hook + BasePrecios)
8. ~~**React Query + SWR** para datos de referencia~~ ✅ COMPLETADO
9. ~~**Paginación/lazy loading para historial**~~ ✅ COMPLETADO (usePagination + PaginationBar en Notificaciones + EntradasAlmacenOC)
10. ~~**Web Workers para cálculos pesados**~~ ✅ COMPLETADO (apu-calc.worker.ts + useApuWorker hook)
12. ~~Tests para componentes UI nuevos~~ ✅ COMPLETADO (79 tests — components-ui.test.tsx)
13. **Tests de regresión visual**
14. ~~Tests de accesibilidad~~ (axe-core) ✅ COMPLETADO (24 tests — accessibility.test.tsx)
15. ~~Guía de usuario para temas~~ ✅ COMPLETADO

### 🟢 BAJA PRIORIDAD (P2)

1. ~~**Posición de notificaciones toast** configurable~~ ✅ IMPLEMENTADO
2. ~~Footer on/off~~ ✅ COMPLETADO
3. ~~**Sonidos de notificación**~~ ✅ IMPLEMENTADO
4. **Partitioning** en tablas grandes
5. **Rate limiting** (token bucket)
6. **2FA / MFA**
7. ~~Rotación de API keys~~ ✅ COMPLETADO
8. ~~**Service Worker** optimizado~~ ✅ COMPLETADO
9. **Cache de pronóstico Weather**
10. **Diagrama de arquitectura Weather**
11. ~~Documentación de API de componentes~~ ✅ COMPLETADO
12. ~~Guía de contribución~~ ✅ COMPLETADO
13. ~~CHANGELOG.md~~ ✅ COMPLETADO

---

## 9. Archivos .md que requieren actualización

| Archivo | Acción Requerida |
|---------|------------------|
| `IMPLEMENTATION_CHECKLIST.md` | ✅ Ya está actualizado (100% COMPLETADO) |
| `SESSION_TODO_LIST.md` | ✅ Actualizado 12/07/2026 |
| `TODO_PENDIENTE.md` | ✅ Actualizado 12/07/2026 |
| `docs/CHANGELOG.md` | ✅ Actualizado 12/07/2026 |
| `docs/DEPLOYMENT_CHECKLIST.md` | ✅ Actualizado 12/07/2026 |
| `SCHEMA_CHANGE_ANALYSIS.md` | ✅ Ya está actualizado (Sesión 13) |
| `SCHEMA_IMPACT_ANALYSIS.md` | ✅ Ya está actualizado (Sesión 13) |
| `plan-unificacion-uiux.md` | ⚠️ Histórico — no requiere actualización activa |
| `ROADMAP.md` | ⚠️ Histórico — no requiere actualización activa |
| `ROADMAP_CONTINUACION.md` | ⚠️ Histórico — no requiere actualización activa |
| Resto de archivos históricos | ⚠️ Archivos de sesiones pasadas — no requieren actualización |