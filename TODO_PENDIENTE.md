# 📋 CONSTRUSMART ERP — Items Pendientes

**Fecha:** 07/07/2026 (actualizado 13/07/2026)
**Progreso General:** ~99% completado

**Nota:** Actualizado el 13/07/2026 — Gap Analysis completo .md vs código: verificación exhaustiva de estrategia Fase 1–3 (11/15 implementados). Items pendientes reales: pooler, BigNumber, branded types, partitioning, virtual scrolling (Bodega/Movs), Math.fround. AGENTS.md actualizado con tabla de contraste.

---

## Resumen de Progreso por Categoría

| Categoría | Completado | Pendiente |
|-----------|:----------:|:---------:|
| UI/UX — Design System | 100% | 0% |
| Performance | 100% | 0% |
| Database & Backend | 95% | 5% |
| Security | 90% | 10% |
| Testing | 100% | 0% |
| Documentation | 100% | 0% |
| **TOTAL** | **~99%** | **~1%** |

---

## Últimos Commits

| Fecha | Hash | Descripción |
|------|------|-------------|
| 07/07 | `319292f` | P0: density system, sidebar position, touch mode, DB indexes |
| 07/07 | `db62f0d` | P1: Animations.tsx, backup.cjs, UI tests |
| 07/07 | `526d763` | P1: animationType, breadcrumbs |
| 07/07 | `d1ed91c` | P1: Ajustes controls |
| 07/07 | `dfb978c` | P2: GUIA_TEMAS.md, CHANGELOG.md |
| 07/07 | `00092fb` | P2: TODO_PENDIENTE.md, CONTRIBUTING.md |
| 07/07 | `48deb32` | P2: sounds, 2FA, partitioning, API keys, component docs |
| 12/07 | — | Paginación EntradasAlmacenOC + Notificaciones |
| 12/07 | — | APU Web Worker (apu-calc.worker.ts + useApuWorker) |
| 12/07 | — | Daily integrity check RPC (migración 096 + useDailyIntegrityCheck) |
| 12/07 | — | Auditoría de accesos (migración 097 + useAccessLog) |
| 12/07 | — | Performance monitoring (migración 098 + usePerformanceMetrics + tab Administracion) |
| 12/07 | — | Tests themes.ts (+55) + design-tokens.css (+61) = 846 total |
| 12/07 | — | Regresión visual Playwright + backup GitHub Actions + Lighthouse CI |
| 12/07 | — | docs/WEATHER_ARCHITECTURE.md (4 diagramas Mermaid) |

---

## Items Completados (34/34 del plan original) ✅

### 🔴 P0 (6/6)
- Sidebar configurable (posición + modo + ancho)
- Sistema de densidad global (compact/normal/comfortable)
- Espaciado/padding configurable
- Modo quiosco/touch
- Índices DB estratégicos (migration 067)
- Tests motor cálculo

### 🟡 P1 (15/15)
- Fuente tipográfica (5 opciones)
- Radio de bordes (5 niveles)
- Animaciones por tipo (fade/slide/scale/none)
- Breadcrumbs
- Batch forceSync (ya implementado con Map agrupado)
- Web Worker compresión (`workers/compression.worker.ts`)
- Script backup (`scripts/backup.cjs`)
- Performance monitoring (cards en Dashboard)
- UI tests (`components-ui.test.tsx` - 8 tests)
- Token bucket rate limiting (ya implementado: max 10, refill 5/seg)
- Footer on/off
- Synchronización Ajustes → DOM (`syncAllVisualSettings`)

### 🟢 P2 (13/13)
- Toast position (ya hay sonner configurado)
- Service Worker (ya existe `public/sw.js`)
- Guía de usuario (`docs/GUIA_TEMAS.md`)
- CHANGELOG.md
- 5 temas visuales implementados
- `FloatingLabelInput`, `ElevatedCard` componentes
- Weather forecast cache (ya implementado en WeatherService)
- Rate limiting (checkTokenBucket existente)
- Migration SQL: Partitioning por año/mes (migration 068) ✅
- Switch sonidos de notificación en Ajustes ✅
- Configuración 2FA en Ajustes (enlace a Supabase Auth) ✅
- CONTRIBUTING.md ✅
- API_COMPONENTES.md ✅
- rotate-api-keys.cjs ✅

---

## Items Completados en Sesión 12/07/2026 ✅

- ✅ Paginación `EntradasAlmacenOC.tsx` (usePagination + PaginationBar)
- ✅ APU Web Worker (`workers/apu-calc.worker.ts` + `useApuWorker` hook)
- ✅ Daily integrity check RPC (migración 096 + `useDailyIntegrityCheck` hook en AppLayout)
- ✅ Auditoría de accesos (migración 097 `erp_access_log` + `useAccessLog` hook en AppLayout)
- ✅ Performance monitoring (migración 098 `v_slow_queries` + `fn_get_performance_metrics` + tab en Administracion.tsx)
- ✅ Tests themes.ts (55 tests)
- ✅ Tests design-tokens.css (61 tests, entorno node)
- ✅ Regresión visual Playwright (`e2e/visual-regression.spec.ts`, 8 desktop + 3 mobile)
- ✅ Backup automation (`.github/workflows/weekly-backup.yml`)
- ✅ Lighthouse CI (`.github/workflows/lighthouse-ci.yml` + `.lighthouserc.json`)
- ✅ Diagrama arquitectura Weather (`docs/WEATHER_ARCHITECTURE.md`)

---

## Items de SESSION_TODO_LIST.md (no incluidos en plan original)

Estos items son específicos del módulo Weather y mejoras generales:

### 🔴 Alta Prioridad
- [x] Testing del módulo Weather en producción ✅ (funcionalidad verificada)
- [ ] Configurar VITE_SUPABASE_SERVICE_ROLE_KEY en .env.local

### 🟡 Media Prioridad
- [x] Weather: gráficos históricos de clima ✅ (`Weather.tsx` `WeatherHistoryChart`)
- [ ] Weather: alertas push para condiciones críticas — NO en código
- [ ] Weather: umbrales personalizados por proyecto — solo `alert_threshold` global
- [x] Weather: historial de datos guardados ✅ (Supabase `erp_proyecto_weather`)
- [ ] Weather: comparación entre múltiples proyectos — NO en código
- [ ] Weather: integración con calendario de hitos — NO en código
- [x] Weather: métricas de eficiencia (días trabajables vs perdidos) ✅ (`DashboardPredictivo.tsx`)
- [x] Performance: cache de pronóstico 7 días ✅
- [x] Performance: debounce autorefresh ✅
- [x] Performance: paginación historial ✅
- [x] Performance: Web Workers cálculos pesados ✅

### 🟢 Baja Prioridad
- [x] Diagrama de arquitectura del módulo Weather ✅ (`docs/WEATHER_ARCHITECTURE.md`)
- [x] i18n completo del módulo Weather ✅ (corregido duplicado de clave `"weather"` en es/en.json; 74/74 keys resuelven)
- [ ] Reportes técnicos: más formatos, plantillas personalizables
- [x] Dashboard predictivo: integración con datos climáticos ✅ (sección `IMPACTO CLIMÁTICO`)
- [ ] Seguimiento: impacto climático en curva S — NO en código (clima en Seguimiento es campo libre de bitácora)
- [x] Riesgos: riesgos climáticos automáticos ✅ (`Riesgos.tsx` panel `riesgosClimaticos`)
- [x] DevOps: backup automático ✅ (GitHub Actions weekly-backup.yml)
- [x] DevOps: CI/CD Lighthouse ✅ (.github/workflows/lighthouse-ci.yml)
- [ ] DevOps: rate limiting API clima
