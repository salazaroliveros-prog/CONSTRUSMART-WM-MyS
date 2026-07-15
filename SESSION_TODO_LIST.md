# CONSTRUSMART ERP - Lista de Tareas Pendientes

Esta lista contiene tareas pendientes identificadas durante las sesiones de desarrollo.

**Última actualización:** 12/07/2026 - Sesión completa de correcciones e implementaciones

## 📋 Sesión 12/07/2026: Correcciones, Tests, DevOps y Docs

### ✅ Completado en Esta Sesión

**Performance:**
- ✅ Paginación `EntradasAlmacenOC.tsx` (usePagination + PaginationBar)
- ✅ APU Web Worker (`workers/apu-calc.worker.ts` + `useApuWorker` hook)

**Database & Backend:**
- ✅ Daily integrity check RPC (migración 096 + `useDailyIntegrityCheck` hook)
- ✅ Auditoría de accesos (migración 097 `erp_access_log` + `useAccessLog` hook)
- ✅ Performance monitoring (migración 098 + `usePerformanceMetrics` + tab Administracion.tsx)

**Testing (+116 tests, total 846):**
- ✅ `themes.test.tsx` — 55 tests
- ✅ `design-tokens.test.tsx` — 61 tests (entorno node)
- ✅ `e2e/visual-regression.spec.ts` — Playwright toHaveScreenshot (8 desktop + 3 mobile)

**DevOps:**
- ✅ `.github/workflows/weekly-backup.yml` — pg_dump semanal
- ✅ `.github/workflows/lighthouse-ci.yml` + `.lighthouserc.json`

**Documentación:**
- ✅ `docs/WEATHER_ARCHITECTURE.md` — 4 diagramas Mermaid
- ✅ `docs/CHANGELOG.md` — actualizado
- ✅ `TODO_PENDIENTE.md` — actualizado (~99%)
- ✅ `GAP_ANALYSIS_COMPLETO.md` — actualizado (846 tests)
- ✅ `docs/DEPLOYMENT_CHECKLIST.md` — actualizado

---

## 📋 Sesión Anterior: Weather & Environmental Conditions Dashboard

### ✅ Completado

**Weather Dashboard Module:**
- ✅ Accessibility (WCAG AA compliant): aria-labels, roles, keyboard navigation
- ✅ Error handling with caching and retry mechanisms
- ✅ Skeleton loading component (SkeletonWeather)
- ✅ Supabase persistence (erp_proyecto_weather table)
- ✅ Dashboard integration (WeatherWidget component)
- ✅ Dark mode color consistency
- ✅ PDF/Excel export functionality
- ✅ SQL migration executed and verified
- ✅ Tests unitarios pasando (30/30 tests en weather.test.ts)
- ✅ Build exitoso con módulo Weather incluido
- ✅ Cache de pronóstico 7 días
- ✅ Debounce en autorefresh
- ✅ Diagrama de arquitectura (`docs/WEATHER_ARCHITECTURE.md`)

---

## 🚧 Tareas Pendientes

### 🔴 Alta Prioridad

#### 1. Configuración de Service Role Key para Scripts
**Estado:** Credenciales no disponibles en .env.local
**Tareas:**
- [ ] Obtener service role key desde Supabase Dashboard → Settings → API
- [ ] Agregar VITE_SUPABASE_SERVICE_ROLE_KEY a .env.local
- [ ] Probar ejecución de `npm run migrate:weather`
- [ ] Probar ejecución de `npm run verify:weather`

**Dependencias:** Acceso a Supabase Dashboard

---

### 🟡 Media Prioridad

#### 2. Mejoras en el Módulo Weather
- [x] Gráficos históricos de clima (temperatura, precipitación) — `Weather.tsx` `WeatherHistoryChart` ✅
- [x] Alertas push para condiciones climáticas críticas — `addNotificacion` en Weather.tsx para critical/high ✅
- [x] Umbrales personalizados por proyecto — `alertThreshold` persistido en `proyectoWeather` store ✅
- [x] Historial de datos climáticos guardados — persistencia Supabase `erp_proyecto_weather` ✅
- [ ] Comparación de clima entre múltiples proyectos — NO en código
- [ ] Integración con calendario de hitos — NO en código (clima en Seguimiento es solo campo libre de bitácora)
- [x] Métricas de eficiencia (días trabajables vs días perdidos) — `DashboardPredictivo.tsx` (workableDays/lostDays) ✅

#### 3. Integraciones pendientes
- [x] Dashboard predictivo: integración con datos climáticos — ✅ (`IMPACTO CLIMÁTICO`)
- [ ] Seguimiento: impacto climático en curva S — NO en código (weather-service no integrado a curva S)
- [x] Riesgos: riesgos climáticos automáticos basados en pronóstico — ✅ (`Riesgos.tsx`)

---

### 🟢 Baja Prioridad

#### 4. Internacionalización Weather
- [x] Verificar strings del módulo Weather en i18n — CORREGIDO: duplicado de clave `"weather"` eliminado en ambos archivos (27 keys resueltas)
- [x] Traducciones faltantes en en.json / es.json — 5 keys KPI añadidas a `en.json`

#### 5. DevOps restante
- [ ] Rate limiting para llamadas a API de clima
- [ ] Configurar retención de datos históricos de clima

#### 6. Seguridad (infraestructura)
- [ ] 2FA / MFA real (requiere Supabase Auth config)
- [ ] Partitioning en tablas grandes (requiere acceso DB directo)
- [ ] Rate limiting para APIs externas (weather, etc.)
- [x] Connection pooler — N/A para frontend (app sin backend Node.js propio; usa PostgREST/REST API)

---

## 🎯 Próxima Sesión Recomendada

**Prioridad:** Mejoras Weather restantes + ítems de infraestructura (ver `docs/INCONSISTENCIAS_PENDIENTES.md`)

1. Comparación de clima entre múltiples proyectos (Weather W3)
2. Integración de impacto climático en curva S (Seguimiento) (Weather W5)
3. Ítems de infraestructura pendientes: partitioning (tablas grandes), rate limiting API externa, 2FA/MFA
   - Nota: connection pooler no aplica (app frontend sin backend Node.js propio; usa PostgREST/REST API)

---

**Última actualización:** 2026-07-12 (tareas Weather 1-4 verificadas en código; i18n duplicado corregido)
**Tests:** 846/846 ✅
**TypeScript:** 0 errores ✅
**Build:** Exitoso ✅
