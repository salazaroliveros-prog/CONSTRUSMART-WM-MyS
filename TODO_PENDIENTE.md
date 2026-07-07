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

## 🔴 Alta Prioridad (P0) — Requiere sesión dedicada

### 1. Sidebar configurable (posición + hover-to-expand)
**Estimado:** 1.5 días
- [ ] Posición: izquierda/derecha/overlay desde Ajustes
- [ ] Modo hover-to-expand en sidebar colapsado
- [ ] Ancho configurable (240px/280px/320px)

### 2. Sistema de densidad global
**Estimado:** 1 día
- [ ] Compact (padding reducido, fuente 13px)
- [ ] Normal (padding estándar, fuente 14px)
- [ ] Comfortable (padding amplio, fuente 15px)
- [ ] Control desde Ajustes → `density: 'compact' | 'normal' | 'comfortable'`

### 3. Modo quiosco / touch para tablets
**Estimado:** 1 día
- [ ] Botones más grandes (min-height: 48px)
- [ ] Targets táctiles de al menos 44x44px
- [ ] Gestos: swipe, pull-to-refresh
- [ ] Control desde Ajustes → `touchMode: boolean`

### 4. Espaciado/padding global configurable
**Estimado:** 0.5 día
- [ ] Escalas: compact / normal / spacious
- [ ] Aplica a padding de cards, gap, margen de secciones

### 5. Índices DB estratégicos
**Estimado:** 0.5 día
- [ ] Migration SQL con índices en:
  - `erp_proyectos(cliente_id)`
  - `erp_movimientos(proyecto_id, fecha)`
  - `erp_presupuestos(proyecto_id)`
  - `erp_ordenes_compra(proveedor_id, estado)`

### 6. Tests para motor de cálculo
**Estimado:** 0.5 día
- [ ] Tests unitarios para ServicioMotorCalculo
- [ ] Tests para validación de cálculos (APU, dosificación, pavimentos)

---

## 🟡 Media Prioridad (P1)

| Item | Estimado |
|------|:--------:|
| Fuente tipográfica seleccionable (Inter, Roboto, Open Sans) | 0.5 día |
| Radio de bordes global configurable | 0.5 día |
| Animaciones por tipo (slide, scale, none) | 0.5 día |
| Breadcrumbs on/off | 0.5 día |
| Batch forceSync (agrupar mutations) | 1 día |
| Web Worker para compresión lz-string | 1 día |
| Virtual scrolling con react-window | 1 día |
| React Query + SWR para datos de referencia | 1 día |
| Backup automation con cron semanal | 0.5 día |
| Performance monitoring (pg_stat_statements) | 1 día |
| Daily integrity checks RPC | 0.5 día |
| Tests para componentes UI nuevos | 0.5 día |
| Tests de regresión visual (Playwright) | 1 día |
| Tests de accesibilidad (axe-core) | 1 día |
| Guía de usuario para temas y personalización | 0.5 día |

---

## 🟢 Baja Prioridad (P2)

| Item | Estimado |
|------|:--------:|
| Posición de notificaciones toast configurable | 0.5 día |
| Footer on/off | 0.5 día |
| Sonidos de notificación | 0.5 día |
| Partitioning en tablas grandes | 1 día |
| Rate limiting (token bucket) | 0.5 día |
| 2FA / MFA | 2 días |
| Rotación de API keys | 0.5 día |
| Service Worker optimizado para PWA | 1 día |
| Cache de pronóstico Weather (7 días) | 0.5 día |
| Diagrama de arquitectura Weather | 0.5 día |
| Documentación de API de componentes UI | 1 día |
| Guía de contribución | 0.5 día |
| CHANGELOG.md | 0.5 día |

---

## Totales

| Prioridad | Items | Tiempo Estimado |
|-----------|:-----:|:----------------:|
| 🔴 P0 | 6 items | ~5 días |
| 🟡 P1 | 15 items | ~10.5 días |
| 🟢 P2 | 13 items | ~9 días |
| **TOTAL** | **34 items** | **~24.5 días hábiles** |

---

## Últimos Commits

| Fecha | Hash | Descripción |
|------|------|-------------|
| 07/06 | `2af684b` | Fix COLOR_* string literals, gap analysis docs |
| 07/06 | `df41a40` | Fix TS errors (await, Skeleton, implicit any) |
| 07/06 | `80579f4` | Fix 404 icons (PNG to /icons/, manifest) |
| 07/06 | `abb420d` | UI/UX refactor (design tokens, animations, themes) |