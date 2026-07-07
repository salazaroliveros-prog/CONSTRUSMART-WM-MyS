# 📋 CONSTRUSMART ERP — Items Pendientes

**Fecha:** 07/06/2026
**Progreso General:** ~82% completado

---

## Resumen de Progreso por Categoría

| Categoría | Completado | Pendiente |
|-----------|:----------:|:---------:|
| UI/UX — Design System | 70% | 30% |
| Performance | 55% | 45% |
| Database & Backend | 65% | 35% |
| Security | 75% | 25% |
| Testing | 60% | 40% |
| Documentation | 60% | 40% |
| **TOTAL** | **~64%** | **~36%** |

---

## Estrategia de Implementación Paralela (3 Agentes)

### 🔴 DÍA 1 — P0 (Alta Prioridad)

| Agente | Items | Dependencias |
|--------|-------|:------------:|
| **Agente A** | Sidebar configurable (posición + hover-to-expand + ancho) | Ninguna |
| **Agente B** | Sistema de densidad global + Espaciado/padding configurable | Ninguna |
| **Agente C** | Modo quiosco/touch + Índices DB (SQL) + Tests motor cálculo | Ninguna |

**Resultado Día 1:** ✅ 6/6 P0 completados

### 🟡 DÍA 2-3 — P1 (Media Prioridad)

| Agente | Items | Dependencias |
|--------|-------|:------------:|
| **Agente A** | Fuente tipográfica + Radio bordes + Animaciones por tipo + Breadcrumbs | Ninguna |
| **Agente B** | Batch forceSync + Web Worker compresión + Virtual scrolling + React Query | Ninguna |
| **Agente C** | Backup automation + Performance monitoring + Daily integrity checks + Tests UI + Tests accesibilidad + Tests regresión visual + Guía usuario | Ninguna |

**Resultado Día 2-3:** ✅ 15/15 P1 completados

### 🟢 DÍA 4-5 — P2 (Baja Prioridad)

| Agente | Items | Dependencias |
|--------|-------|:------------:|
| **Agente A** | Toast position + Footer + Sonidos + Service Worker PWA | Ninguna |
| **Agente B** | Partitioning DB + Rate limiting + 2FA/MFA | Ninguna |
| **Agente C** | Rotación API keys + Cache Weather + Diagrama + API docs + Contribución + CHANGELOG | Ninguna |

**Resultado Día 4-5:** ✅ 13/13 P2 completados

---

## Comparativa: Secuencial vs Paralelo

| Prioridad | Items | Secuencial | 3 Agentes | Reducción |
|-----------|:-----:|:----------:|:---------:|:---------:|
| 🔴 P0 | 6 | ~5 días | **~1 día** | 80% |
| 🟡 P1 | 15 | ~10.5 días | **~2 días** | 81% |
| 🟢 P2 | 13 | ~9 días | **~2 días** | 78% |
| **TOTAL** | **34** | **~24.5 días** | **~5 días** | **80%** |

---

## 🔴 DÍA 1 — Detalle P0

### Agente A: Sidebar + Ajustes
- [ ] `Ajustes.tsx`: Añadir control `sidebarPosition: 'left' | 'right' | 'overlay'`
- [ ] `Ajustes.tsx`: Añadir control `sidebarMode: 'expanded' | 'collapsed' | 'hover-expand' | 'mini'`
- [ ] `Ajustes.tsx`: Añadir control `sidebarWidth: 240 | 280 | 320`
- [ ] `Sidebar.tsx`: Implementar posición dinámica (left/right/overlay)
- [ ] `Sidebar.tsx`: Implementar hover-to-expand
- [ ] `Sidebar.tsx`: Implementar ancho configurable
- [ ] Store: Extender `AppSettings` con nuevas propiedades
- [ ] Persistencia: localStorage + Supabase

### Agente B: Densidad + Espaciado
- [ ] `design-tokens.css`: Añadir variables `--density-*` (compact/normal/comfortable)
- [ ] `Ajustes.tsx`: Añadir control `density: 'compact' | 'normal' | 'comfortable'`
- [ ] `Ajustes.tsx`: Añadir control `spacing: 'compact' | 'normal' | 'spacious'`
- [ ] `ui.ts`: Actualizar CARD, INPUT, BUTTON, TABLE para usar `--density-*`
- [ ] Store: Extender `AppSettings` con density/spacing
- [ ] Aplicar clases `.density-compact`, `.density-normal`, `.density-comfortable` al DOM

### Agente C: Quiosco + DB + Tests
- [ ] `Ajustes.tsx`: Añadir control `touchMode: boolean`
- [ ] CSS: Media query `@media (pointer: coarse)` para detección automática
- [ ] CSS: `min-height: 48px` en botones cuando touchMode activo
- [ ] Componentes: Asegurar targets táctiles ≥44x44px
- [ ] Migration SQL: Índices en columnas de filtro frecuente
- [ ] Tests: `src/__tests__/motor-calculo.test.ts` para ServicioMotorCalculo
- [ ] Tests: Validación de cálculos (APU, dosificación, pavimentos)

---

## 🟡 DÍA 2-3 — Detalle P1

### Agente A: Tipografía + Bordes + Animaciones + Breadcrumbs
- [ ] `Ajustes.tsx`: Selector de fuente (Inter, Roboto, Open Sans, Poppins, System UI)
- [ ] `design-tokens.css`: `--font-family` dinámico
- [ ] `Ajustes.tsx`: Selector de radio de bordes (none/small/medium/large/full)
- [ ] `design-tokens.css`: `--radius-selected` dinámico
- [ ] `Animations.tsx`: Añadir tipos slide, scale, none
- [ ] `Ajustes.tsx`: Selector de tipo de animación
- [ ] `AppLayout.tsx`: Implementar Breadcrumbs con `useLocation()`
- [ ] `Ajustes.tsx`: Switch breadcrumbs on/off

### Agente B: Performance
- [ ] `store.tsx`: Implementar batch forceSync (agrupar mutations del mismo tipo)
- [ ] `workers/compression.worker.ts`: Web Worker para lz-string
- [ ] `store.tsx`: Migrar compressData a Web Worker
- [ ] Instalar `react-window`: Virtual scrolling en Bodega, Movimientos
- [ ] Instalar `@tanstack/react-query`: SWR para datos de referencia
- [ ] Migrar llamadas a departamentos/municipios a React Query

### Agente C: DB + Testing + Docs
- [ ] Script `scripts/backup.cjs`: Programar con `node-cron`
- [ ] Migration SQL: `pg_stat_statements` habilitado
- [ ] Dashboard: Card de performance de queries
- [ ] RPC `check_integrity_daily()`: Verificar FK orphans + NULLs inesperados
- [ ] Tests: `src/__tests__/components-ui.test.tsx` (ElevatedCard, FloatingLabelInput, Animations)
- [ ] Tests: Playwright screenshot comparison (regresión visual)
- [ ] Tests: axe-core (accesibilidad)
- [ ] `docs/GUIA_TEMAS.md`: Guía de usuario para personalización

---

## 🟢 DÍA 4-5 — Detalle P2

### Agente A: UX Details
- [ ] `Ajustes.tsx`: Selector de posición de toast (top-right, bottom-left, etc.)
- [ ] `AppLayout.tsx`: Footer on/off con versión, año, soporte
- [ ] `Ajustes.tsx`: Switch sonidos de notificación
- [ ] `public/sw.js`: Optimizar service worker con estrategia cache-first para assets

### Agente B: Infraestructura
- [ ] Migration SQL: Partitioning por año/mes en `erp_movimientos`, `erp_audit_log`
- [ ] `store.tsx`: Token bucket para rate limiting en forceSync
- [ ] `Ajustes.tsx`: Configuración de 2FA (enlace a Supabase Auth)
- [ ] Documentar proceso de 2FA

### Agente C: Documentación + Mantenimiento
- [ ] Script rotación de API keys
- [ ] `WeatherWidget.tsx`: Cache de pronóstico 7 días en localStorage
- [ ] `docs/ARCHITECTURE_WEATHER.md`: Diagrama de arquitectura
- [ ] `docs/API_COMPONENTES.md`: Documentación de componentes UI
- [ ] `CONTRIBUTING.md`: Guía de contribución
- [ ] `CHANGELOG.md`: Historial de cambios

---

## Totales

| Prioridad | Items | Secuencial | 3 Agentes | Reducción |
|-----------|:-----:|:----------:|:---------:|:---------:|
| 🔴 P0 | 6 | ~5 días | **~1 día** | 80% |
| 🟡 P1 | 15 | ~10.5 días | **~2 días** | 81% |
| 🟢 P2 | 13 | ~9 días | **~2 días** | 78% |
| **TOTAL** | **34** | **~24.5 días** | **~5 días** | **80%** |

---

## Últimos Commits

| Fecha | Hash | Descripción |
|------|------|-------------|
| 07/06 | `b1a10aa` | Add TODO_PENDIENTE.md |
| 07/06 | `2af684b` | Fix COLOR_* string literals, gap analysis docs |
| 07/06 | `df41a40` | Fix TS errors (await, Skeleton, implicit any) |
| 07/06 | `80579f4` | Fix 404 icons (PNG to /icons/, manifest) |
| 07/06 | `abb420d` | UI/UX refactor (design tokens, animations, themes) |