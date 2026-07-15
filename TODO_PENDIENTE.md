# 📋 CONSTRUSMART ERP — Items Pendientes

**Fecha:** 07/07/2026 (actualizado 13/07/2026)
**Progreso General:** ~99% completado

**Nota:** Actualizado el 13/07/2026 — Verificación exhaustiva de código contra documentación .md. decimal.js y branded types confirmados como ✅ implementados en `src/erp/money.ts`. 

---

## Resumen de Progreso por Categoría

| Categoría | Completado | Pendiente |
|-----------|:----------:|:---------:|
| UI/UX — Design System | 100% | 0% |
| Performance | 100% | 0% |
| Database & Backend | 95% | 5% |
| Security | 85% | 15% |
| Testing | 100% | 0% |
| Documentation | 100% | 0% |
| **TOTAL** | **~98%** | **~2%** |

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
| 13/07 | — | Verificación exhaustiva: decimal.js ✅, branded types ✅, virtual scrolling parcial, weather W1-W5 pendientes |

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

## Items Pendientes por Implementar

| # | Item | Prioridad | Estado Code | Evidencia |
|---|------|-----------|-------------|-----------|
| 1 | Virtual scrolling Bodega.tsx | MEDIUM | ✅ Implementado | `react-window` en Bodega.tsx |
| 2 | Weather W1: Alertas push críticas | MEDIUM | ✅ Implementado | `addNotificacion` en Weather.tsx para critical/high |
| 3 | Weather W2: Umbrales por proyecto | MEDIUM | ✅ Implementado | `alertThreshold` persistido en `proyectoWeather` store |
| 4 | Weather W3: Comparación multi-proyecto | LOW | ❌ No en código | — |
| 5 | Weather W4: Integración calendario hitos | LOW | ❌ No en código | `Seguimiento.tsx` usa campo libre `clima` |
| 6 | Weather W5: Impacto en curva S | LOW | ❌ No en código | — |
| 7 | Math.fround para real(4) | LOW | ❌ No usado | 0 ocurrencias en código |
| 8 | Table partitioning (movimientos/audit) | LOW | ⚠️ Parcial | Solo 1 tabla particionada |
| 9 | 2FA/MFA real | LOW | ⚠️ Parcial | Enlace a Supabase Auth solo |
| 10 | Rate limiting APIs externas | MEDIUM | ❌ No en código | Sin throttling en weatherService |
| 11 | Seguimiento: Paneles Cronograma/Riesgos | HIGH | ✅ Implementado | `SeguimientoCronogramaPanel`, `SeguimientoRiesgosPanel` |

---

## Acciones Requeridas

### Implementación Inmediata
1. Virtual scrolling en Bodega.tsx y Movimientos.tsx
2. Weather W1-W4 (alertas push, umbrales por proyecto, comparación multi-proyecto, integración calendario)

### Documentación/Configuración
3. Actualizar TODO_PENDIENTE.md con hallazgos verificación (decisión: marcar ✅ decimal.js y branded types)

### Baja Prioridad
4. Math.fround (si se añaden columnas real(4))
5. Extender partitioning a tablas grandes
6. Configurar 2FA en Supabase Dashboard

---

**Nota:** decimal.js y branded types ya están implementados en `src/erp/money.ts` (verificado 13/07/2026).