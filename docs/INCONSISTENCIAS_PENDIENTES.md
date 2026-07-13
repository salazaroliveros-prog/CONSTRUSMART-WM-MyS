# INCONSISTENCIAS PENDIENTES — CONSTRUSMART ERP

**Fecha:** 2026-07-12
**Propósito:** Registro de inconsistências encontradas en los `.md` de seguimiento, validadas contra el código fuente. Lo que YA está implementado se marcó cerrado en `GAP_ANALYSIS_COMPLETO.md`, `TODO_PENDIENTE.md`, `SESSION_TODO_LIST.md` e `IMPLEMENTATION_TRACKING.md`. Este archivo lista SOLO lo que **NO está implementado** o requiere acción externa.

---

## 1. Corrección aplicada en esta sesión (ya resuelta)

| Inconsistencia | Evidencia antes | Estado |
|----------------|----------------|--------|
| **Clave `"weather"` duplicada a nivel raíz en `es.json` y `en.json`** | JSON.parse conserva el último duplicado; el segundo bloque (`titulo`-based) sombreaba el primero, dejando **27 de 74** `weather.*` usadas en código sin resolver (caían a fallback en inglés en `t()`) | ✅ CORREGIDO: eliminado el bloque duplicado; añadidas 5 keys KPI faltantes en `en.json` (`total_precip`, `workable_days`, `lost_days`, `temp_range`, `days_recorded`). Verificación: 74/74 resuelven, 0 duplicados. |
| **`IMPLEMENTATION_TRACKING.md` afirmaba "i18n duplicados: 0"** | Falso — el duplicado existía | ✅ CORREGIDO (nota añadida al doc) |

> Archivos modificados: `src/lib/i18n/es.json`, `src/lib/i18n/en.json`. No afecta TypeScript (solo JSON). `JSON.parse` validado en ambos.

---

## 2. Módulo Weather — ítems NO implementados (verificados en código)

| # | Ítem | Prioridad | Evidencia en código | Estado |
|---|------|-----------|---------------------|--------|
| W1 | Alertas push para condiciones climáticas críticas | Media | `grep "push.*weather|critical.*notif"` → 0 hits en `src/` | ❌ NO implementado |
| W2 | Umbrales de alerta personalizados por proyecto | Media | Solo existe `alertThreshold` global (`Weather.tsx`); no hay mapa `proyectoId → umbral` | ⚠️ PARCIAL (solo global) |
| W3 | Comparación de clima entre múltiples proyectos | Media | `grep "weatherCompare|compareWeather"` → 0 hits | ❌ NO implementado |
| W4 | Integración con calendario de hitos | Media | `Seguimiento.tsx` solo tiene campo libre `clima` (soleado/nublado/lluvia) en bitácora; no usa `weatherService` | ❌ NO implementado |
| W5 | Impacto climático en curva S (Seguimiento) | Baja | `Seguimiento.tsx` no consume `proyectoWeather`/`calculateWeatherImpact` | ❌ NO implementado |

**Ya implementado (cerrar en tracking):** gráficos históricos (`WeatherHistoryChart`), historial persistido (Supabase `erp_proyecto_weather`), métricas días trabajables/perdidos (`DashboardPredictivo.tsx`), integración Dashboard Predictivo, riesgos climáticos automáticos (`Riesgos.tsx`), i18n completo.

---

## 3. Infraestructura / Backend — bloqueados (requieren Supabase Dashboard o acceso DB directo)

Estos NO son verificables ni implementables desde el código fuente; dependen de configuración externa.

| # | Ítem | Prioridad | Razón de bloqueo | Estado |
|---|------|-----------|------------------|--------|
| I1 | Connection pooler | — | ⚠️ N/A para frontend (app sin backend Node.js propio; todas las queries van por PostgREST/REST API) | N/A |
| I2 | Partitioning en `erp_movimientos` / `erp_audit_log` | Baja | Requiere acceso DB directo (no hay migración aplicada) | ❌ No implementado |
| I3 | Rate limiting en API endpoints (incl. API clima) | Media/Baja | Requiere configurar edge/backend o gateway | ❌ No implementado |
| I4 | 2FA / MFA real | Baja | Requiere Supabase Auth (proveedor) configurado | ❌ No implementado (enlace solo) |

> Nota: `tokenBucketRef` en `store.tsx` SÍ limita `forceSync` (cliente), pero no es rate-limiting de API.

---

## 4. Auditoría Supabase — ítem de BD sin verificar

| # | Ítem | Estado |
|---|------|--------|
| D1 | Tabla `erp_publicaciones_muro` — `SUPABASE_ALIGNMENT_AUDIT.md` (2026-07-08) reporta que **NO EXISTE** | ⚠️ Contradictorio con `AGENTS.md`/otros docs que indican que ya está en DB + realtime. **Requiere verificación en DB** (`SELECT to_regclass('public.erp_publicaciones_muro')`). No verificable desde código. Si no existe, aplicar el SQL del audit (sección 5). |

---

## 5. Resumen

| Categoría | Cerrado esta sesión | Pendiente (acción) |
|-----------|:---:|---|
| Weather i18n (duplicado) | 1 | 0 |
| Weather features | 4 (tareas 1-4 chat) | 5 (W1-W5) |
| Infra/Backend | 0 | 4 (I1-I4) |
| BD / Supabase | 0 | 1 (D1, verificar) |

**Próximos pasos sugeridos:** W1→W4 (Weather), luego I1-I4 (infra, requiere credenciales), y verificar D1 en DB.
