# Changelog

## [Unreleased] — 2026-07-12

### 🔧 Performance & Workers
- **Paginación historial** — `usePagination` hook + `PaginationBar` aplicados en `EntradasAlmacenOC.tsx` y `Notificaciones.tsx`
- **APU Web Worker** — `src/workers/apu-calc.worker.ts` calcula subtotal, costoDirecto, precioVenta y totalMateriales en background thread; `src/erp/hooks/useApuWorker.ts` con fallback síncrono

### 🗄️ Database & Backend
- **Daily integrity check RPC** — migración 096: `fn_daily_integrity_check()` verifica 4 tipos de inconsistencias FK; `useDailyIntegrityCheck` hook (1x/día para admins, 10s delay)
- **Auditoría de accesos** — migración 097: tabla `erp_access_log` con RLS (insert propio, select solo admins); `useAccessLog` hook registra SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED
- **Performance monitoring** — migración 098: vista `v_slow_queries` + RPC `fn_get_performance_metrics`; `usePerformanceMetrics` hook; tab "Rendimiento DB" en `Administracion.tsx`

### 🧪 Testing (+116 tests, total 846)
- **themes.test.tsx** — 55 tests: THEMES, PRIMARY_COLORS, initializeTheme, applyThemeToDocument, syncAnimationsSetting, syncAllVisualSettings
- **design-tokens.test.tsx** — 61 tests (entorno node): elevation (11), motion (14), typography (18), spacing (9), density (5), sidebar (2), integridad (3)
- **visual-regression.spec.ts** — Playwright toHaveScreenshot: 8 pantallas desktop + 3 mobile, animaciones deshabilitadas, maxDiffPixelRatio 2%

### 🚀 DevOps & CI/CD
- **Backup automation** — `.github/workflows/weekly-backup.yml`: pg_dump cada domingo 02:00 UTC, comprime a .gz, artifact 30 días, workflow_dispatch manual
- **Lighthouse CI** — `.github/workflows/lighthouse-ci.yml` en PRs a main; `.lighthouserc.json`: perf ≥70, a11y ≥90, best-practices ≥80, LCP ≤5s, TBT ≤500ms, CLS ≤0.1

### 📚 Documentación
- **WEATHER_ARCHITECTURE.md** — 4 diagramas Mermaid: flujo de datos, estrategia de caché, secuencia auto-refresh, schema Supabase
- **GAP_ANALYSIS_COMPLETO.md** — actualizado con 846 tests y todos los items completados
- **TODO_PENDIENTE.md** — progreso actualizado a ~99%
- **SESSION_TODO_LIST.md** — items completados marcados

---

## [2026-07-07]

### 🎨 UI/UX Refactorización Integral

- **Design System**: Variables semánticas unificadas en `design-tokens.css`, clases body para density/sidebar/touch
- **Tarjetas**: Nuevo componente `ElevatedCard` con sistema de elevación 1-5
- **Animaciones**: `Animations.tsx` con 8 componentes (PageTransition, AnimatedCounter, StaggerChildren, FadeIn, ScaleIn, SlideInRight, PulseDot, SkeletonCard, LoadingSpinner)
- **Temas**: 5 temas en `themes.ts` (Ant Design, Dark Pro, Material 3, Glassmorphism, Neomorphism)
- **Sidebar**: Configurable en posición (left/right/overlay), modo (expanded/collapsed/hover-expand/mini), ancho
- **Densidad**: Sistema global compact/normal/comfortable con CSS variables
- **Táctil**: Media query `@media (pointer: coarse)` + clase `.touch-mode`
- **Ajustes**: Controles para animationType, breadcrumbs, footer, touchMode
- **Backup**: Script `scripts/backup.cjs` para exportar/importar respaldos
- **Tests**: `components-ui.test.tsx` con 8 tests para ElevatedCard, FloatingLabelInput, PageTransition
- **Docs**: `GUIA_TEMAS.md` con guía completa de personalización
- **DB**: Migration 067 con índices estratégicos para performance
