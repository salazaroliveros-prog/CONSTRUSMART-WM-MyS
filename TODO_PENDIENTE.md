# 📋 CONSTRUSMART ERP — Items Pendientes

**Fecha:** 07/07/2026
**Progreso General:** ~90% completado

---

## Resumen de Progreso por Categoría

| Categoría | Completado | Pendiente |
|-----------|:----------:|:---------:|
| UI/UX — Design System | 100% | 0% |
| Performance | 75% | 25% |
| Database & Backend | 80% | 20% |
| Security | 80% | 20% |
| Testing | 80% | 20% |
| Documentation | 80% | 20% |
| **TOTAL** | **~90%** | **~10%** |

---

## Últimos Commits

| Fecha | Hash | Descripción |
|------|------|-------------|
| 07/07 | `319292f` | P0: density system, sidebar position, touch mode, DB indexes |
| 07/07 | `db62f0d` | P1: Animations.tsx, backup.cjs, UI tests |
| 07/07 | `526d763` | P1: animationType, breadcrumbs |
| 07/07 | `d1ed91c` | P1: Ajustes controls |
| 07/07 | `dfb978c` | P2: GUIA_TEMAS.md, CHANGELOG.md |

---

## Items Completados

### 🔴 P0 (6/6) ✅
- Sidebar configurable (posición + modo + ancho)
- Sistema de densidad global (compact/normal/comfortable)
- Espaciado/padding configurable
- Modo quiosco/touch
- Índices DB estratégicos (migration 067)
- Tests motor cálculo

### 🟡 P1 (15/15) ✅
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

### 🟢 P2 (11/13) ✅
- Toast position (ya hay sonner configurado)
- Service Worker (ya existe `public/sw.js`)
- Guía de usuario (`docs/GUIA_TEMAS.md`)
- CHANGELOG.md
- 5 temas visuales implementados
- `FloatingLabelInput`, `ElevatedCard` componentes
- Weather forecast cache (ya implementado en WeatherService)
- Rate limiting (checkTokenBucket existente)

---

## Items Pendientes (4)

- [ ] Migration SQL: Partitioning por año/mes en `erp_movimientos`, `erp_audit_log`
- [ ] `Ajustes.tsx`: Switch sonidos de notificación
- [ ] `Ajustes.tsx`: Configuración de 2FA (enlace a Supabase Auth)
- [ ] `CONTRIBUTING.md`: Guía de contribución

Estos 4 items requieren investigación adicional o cambios en Supabase/backend y pueden ejecutarse en sesiones dedicadas.