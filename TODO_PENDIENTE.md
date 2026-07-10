# 📋 CONSTRUSMART ERP — Items Pendientes

**Fecha:** 07/07/2026 (actualizado 10/07/2026)
**Progreso General:** ~95% completado

**Nota:** Actualizado el 10/07/2026 - items de diseño UI/UX marcados como completados tras verificación en Ajustes.tsx

---

## Resumen de Progreso por Categoría

| Categoría | Completado | Pendiente |
|-----------|:----------:|:---------:|
| UI/UX — Design System | 100% | 0% |
| Performance | 85% | 15% |
| Database & Backend | 90% | 10% |
| Security | 85% | 15% |
| Testing | 85% | 15% |
| Documentation | 90% | 10% |
| **TOTAL** | **~95%** | **~5%** |

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

## Items de SESSION_TODO_LIST.md (no incluidos en plan original)

Estos items son específicos del módulo Weather y mejoras generales:

### 🔴 Alta Prioridad
- [ ] Testing del módulo Weather en producción (probar refresh, export, widget, persistencia Supabase)
- [ ] Configurar VITE_SUPABASE_SERVICE_ROLE_KEY en .env.local

### 🟡 Media Prioridad
- [ ] Weather: gráficos históricos de clima
- [ ] Weather: alertas push para condiciones críticas
- [ ] Weather: umbrales personalizados por proyecto
- [ ] Weather: historial de datos guardados
- [ ] Weather: comparación entre múltiples proyectos
- [ ] Weather: integración con calendario de hitos
- [ ] Weather: métricas de eficiencia (días trabajables vs perdidos)
- [ ] Performance: cache de pronóstico 7 días, debounce, paginación

### 🟢 Baja Prioridad
- [ ] Diagrama de arquitectura del módulo Weather
- [ ] i18n completo del módulo Weather
- [ ] Reportes técnicos: más formatos, plantillas personalizables
- [ ] Dashboard predictivo: integración con datos climáticos
- [ ] Seguimiento: impacto climático en curva S
- [ ] Riesgos: riesgos climáticos automáticos
- [ ] DevOps: backup automático, CI/CD, rate limiting API clima