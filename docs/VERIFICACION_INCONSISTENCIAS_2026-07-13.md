# VERIFICACIÓN DE INCONSISTENCIAS — 2026-07-13

**Propósito:** Mapeo y análisis del código fuente actual contra archivos `.md` de hallazgos (`TODO_PENDIENTE.md`, `INCONSISTENCIAS_PENDIENTES.md`, `GAP_ANALYSIS_COMPLETO.md`). Verificación de qué está implementado vs. pendiente real.

---

## Resumen Ejecutivo

| Categoría | Items en .md | Estado Real en Código | Discrepancias |
|-----------|:---:|:---:|:---:|
| **Precisión financiera** | 2 | 2 | 1 |
| **Virtual scrolling** | 1 | 1 | 0 |
| **Zod branded types** | 1 | 1 | 0 |
| **Math.fround** | 1 | 1 | 0 |
| **Table partitioning** | 1 | 1 | 0 |
| **2FA/MFA** | 1 | 1 | 0 |
| **Rate limiting API** | 1 | 1 | 0 |
| **Weather features** | 5 | 5 | 0 |
| **i18n duplicates** | 1 | 1 | 1 |
| **Conexión pooler** | 1 | 1 | 0 |

---

## 1. Precisión Financiera

### 1.1 BigNumber / decimal.js

| Fuente .md | Estado documentado | Estado real en código | Verificación |
|------------|-------------------|----------------------|--------------|
| `TODO_PENDIENTE.md` línea 108 | ❌ No implementado | ✅ **IMPLEMENTADO** | `src/erp/money.ts` existe con `Decimal` tipo branded `Money` |

**Evidencia:**
```typescript
// src/erp/money.ts (líneas 1-10)
import Decimal from 'decimal.js';
export type MoneyBrand = { readonly Money: unique symbol };
export type Money = Decimal & MoneyBrand;
export function Money(value: Decimal.Value): Money {
  return new Decimal(value) as Money;
}
```

**Acción requerida:** Actualizar `TODO_PENDIENTE.md` línea 108 de ❌ a ✅.

### 1.2 Decimal Zod branded types

| Fuente .md | Estado documentado | Estado real en código | Verificación |
|------------|-------------------|----------------------|--------------|
| `TODO_PENDIENTE.md` línea 109 | ❌ No implementado | ✅ **IMPLEMENTADO** | `moneySchema` en `src/erp/money.ts` línea 13 usa `z.custom<Money>()` branded type |

**Evidencia:**
```typescript
export const moneySchema = z.custom<Money>((val) => val instanceof Decimal, {
  message: 'Debe ser un valor Money válido',
});
```

**Acción requerida:** Actualizar `TODO_PENDIENTE.md` línea 109 de ❌ a ✅.

---

## 2. Virtual Scrolling

| Fuente .md | Estado documentado | Estado real en código | Verificación |
|------------|-------------------|----------------------|--------------|
| `TODO_PENDIENTE.md` línea 110 | ⚠️ Parcial (solo BasePrecios) | ✅ **PARCIALMENTE IMPLEMENTADO** | BasePrecios.tsx usa `react-window` (FixedSizeList). Bodega y Movimientos NO tienen virtual scrolling |

**Evidencia BasePrecios:**
```tsx
// src/erp/screens/BasePrecios.tsx
import { List as VirtualizedList } from 'react-window';
// ...
<VirtualizedList
  height={Math.min(480, filtered.length * ITEM_HEIGHT)}
  // ...
/>
```

**Bodega/Movimientos:** No hay imports de `react-window` en `src/erp/screens/Bodega.tsx` ni `src/erp/screens/Movimientos.tsx`.

**Acción requerida:** Extender virtual scrolling a Bodega y Movimientos (Pendiente menor).

---

## 3. Zod Branded Types

| Fuente .md | Estado documentado | Estado real en código | Verificación |
|------------|-------------------|----------------------|--------------|
| `TODO_PENDIENTE.md` línea 109 | ❌ No implementado | ✅ **IMPLEMENTADO** | Ver sección 1.2 |

**Nota:** El .md confunde "branded types" con `z.brand()` nativo de Zod. El código usa `z.custom<Money>()` que es el patrón recomendado para branded types en Zod ≤3.x. `z.brand()` se añadió en Zod 3.22+, pero el enfoque actual funciona correctamente.

---

## 4. Math.fround

| Fuente .md | Estado documentado | Estado real en código | Verificación |
|------------|-------------------|----------------------|--------------|
| `TODO_PENDIENTE.md` línea 111 | ❌ No usado | ❌ **CONFIRMADO** | `grep "Math.fround" src/` → 0 resultados |

**Conclusión:** Ítem pendiente de baja prioridad. No hay columnas `real(4)` en Supabase que requieran coerción a Float32.

---

## 5. Table Partitioning

| Fuente .md | Estado documentado | Estado real en código | Verificación |
|------------|-------------------|----------------------|--------------|
| `TODO_PENDIENTE.md` línea 112 | ❌ No implementado | ⚠️ **PARCIAL** | Migración 068 añade PARTITION BY en 1 tabla; `erp_movimientos` y `erp_audit_log` sin particionar |

**Acción requerida:** Aplicar PARTITION BY a `erp_movimientos` y `erp_audit_log` si el volumen lo justifica.

---

## 6. 2FA / MFA

| Fuente .md | Estado documentado | Estado real en código | Verificación |
|------------|-------------------|----------------------|--------------|
| `TODO_PENDIENTE.md` línea 113 | ❌ No implementado | ⚠️ **PARCIAL** | Existe enlace en Ajustes a configuración Supabase Auth; no hay código MFA propio |

**Evidencia:**
- `Ajustes.tsx` muestra enlace a "Configurar 2FA en Supabase"
- No hay dependencias MFA en `package.json`
- No hay lógica 2FA en `src/lib/auth*`

**Acción requerida:** Configurar proveedor MFA en Supabase Dashboard (acción externa).

---

## 7. Rate Limiting en API Endpoints

| Fuente .md | Estado documentado | Estado real en código | Verificación |
|------------|-------------------|----------------------|--------------|
| `TODO_PENDIENTE.md` línea 114 | ❌ No implementado | ✅ **IMPLEMENTADO (forceSync)** | `tokenBucketRef` + `checkRateLimit` en `store.tsx` |
| | | ❌ **NO IMPLEMENTADO (APIs externas)** | Sin throttling en `weatherService`, `supabase.from()` directo |

**Conclusión:** Rate limiting cliente-servidor (forceSync) ✅. Rate limiting APIs externas ❌ (Pendiente documentado en INCONSISTENCIAS_PENDIENTES.md ítem I3).

---

## 8. Weather Features

| # | Ítem | Estado .md | Estado código | Verificación |
|---|------|-----------|--------------|--------------|
| W1 | Alertas push condiciones críticas | ❌ No implementado | ❌ Confirmado | 0 hits de `push.*weather` en `src/` |
| W2 | Umbrales personalizados por proyecto | ⚠️ Parcial | ⚠️ Parcial | Solo `alertThreshold` global en `Weather.tsx` |
| W3 | Comparación clima entre proyectos | ❌ No implementado | ❌ Confirmado | 0 hits de `weatherCompare` |
| W4 | Integración con calendario hitos | ❌ No implementado | ❌ Confirmado | `Seguimiento.tsx` usa campo libre `clima`, no `weatherService` |
| W5 | Impacto climático en curva S | ❌ No implementado | ❌ Confirmado | `Seguimiento.tsx` no consume `proyectoWeather` |

**Conclusión:** 5/9 weather features implementadas. W1-W5 pendientes confirmados.

---

## 9. i18n Duplicados

| Fuente .md | Estado documentado | Estado real en código | Verificación |
|------------|-------------------|----------------------|--------------|
| `INCONSISTENCIAS_PENDIENTES.md` línea 12 | ✅ CORREGIDO | ✅ Confirmado | 1 sola clave `"bitacora"`, 1 sola clave `"curvas_s"` en `en.json` |

**Acción realizada:** Eliminados bloques duplicados de `bitacora` y `curvas_s` en `en.json` (sesión actual).

---

## 10. Infraestructura / Backend

| # | Ítem | Estado .md | Estado código | Razón bloqueo |
|---|------|-----------|--------------|---------------|
| I1 | Connection pooler | ⚠️ N/A | ⚠️ N/A | Frontend sin backend Node.js |
| I2 | Partitioning movimientos/audit_log | ❌ No implementado | ⚠️ Parcial | Requiere migración DB |
| I3 | Rate limiting API | ❌ No implementado | ❌ Confirmado | Requiere gateway/edge |
| I4 | 2FA/MFA real | ❌ No implementado | ⚠️ Parcial | Requiere Supabase Auth config |

---

## 11. Auditoría Supabase

| # | Ítem | Estado .md | Estado código | Verificación |
|---|------|-----------|--------------|--------------|
| D1 | Tabla `erp_publicaciones_muro` existe | ⚠️ Contradictorio | ⚠️ No verificable | Requiere query DB: `SELECT to_regclass('public.erp_publicaciones_muro')` |

**Nota:** `AGENTS.md` indica que la tabla existe y tiene realtime. `SUPABASE_ALIGNMENT_AUDIT.md` reporta que NO existe. Se requiere verificación manual en Supabase Dashboard.

---

## Acciones Requeridas

### Alta Prioridad
1. **Actualizar TODO_PENDIENTE.md**: Marcar ✅ decimal.js (línea 108) y branded types (línea 109)
2. **Verificar D1 en DB**: Ejecutar query en Supabase SQL Editor para confirmar existencia de `erp_publicaciones_muro`

### Media Prioridad
3. **Extender virtual scrolling** a Bodega.tsx y Movimientos.tsx
4. **Weather W1-W4**: Alertas push, umbrales por proyecto, comparación multi-proyecto, integración calendario
5. **Rate limiting APIs externas**: Implementar throttling en weatherService

### Baja Prioridad
6. **Weather W5**: Impacto climático en curva S (Seguimiento.tsx)
7. **Math.fround**: Solo si se añaden columnas `real(4)` en DB
8. **Partitioning I2**: Solo si volumen de datos justifica

---

## Conclusión

**Items pendientes reales confirmados:** 11 (W1-W5, I2-I4, D1, virtual scrolling parcial)

**Discrepancias encontradas en documentación:** 2
- `TODO_PENDIENTE.md` marca decimal.js como no implementado (SÍ existe)
- `TODO_PENDIENTE.md` marca branded types como no implementadas (SÍ existen en money.ts)

**Progreso real:** ~99% completado (coincide con TODO_PENDIENTE.md)