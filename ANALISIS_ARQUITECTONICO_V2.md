# CONSTRUSMART ERP — Análisis Arquitectónico V2 (Granular)

**Fecha:** 2026-07-17  
**Commit auditado:** `ca95540`

---

## 1. State Management — Gaps Detectados

### 1.1 TABLE_MAP — Formato Invertido ❌

| Aspecto | Doc V1 (líneas 1110-1120) | Realidad (table-mappings.ts) |
|---------|---------------------------|------------------------------|
| Formato clave | `proyectos: 'erp_proyectos'` (alias → tabla) | `erp_proyectos:'proyectos'` (tabla → alias) |
| Dirección | **key-first** (nombre app → DB) | **invertido** (DB → nombre app) |
| Conteo | "50+ mapeos" | 32 entradas |

**Severidad: ALTA** — La documentación describe un lookup que mapea alias de app a nombres de tabla DB, pero el código real mapea nombres DB a alias de app. Cualquier código que dependa del formato documentado fallaría.

### 1.2 ESTADO_COLORS — Incompleto ⚠️

| Aspecto | Doc V1 (líneas 1147-1153) | Realidad (utils.ts líneas 93-155) |
|---------|---------------------------|-----------------------------------|
| Entradas mostradas | 3 (activo, inactivo, pendiente) | 30 entradas en 8 categorías |
| Propiedades por entrada | 3: `bg`, `border`, `text` | **4**: `bg`, `border`, `text`, `icon` |
| Categorías | No mencionadas | `ESTADO_PROYECTO`, `ESTADO_PAGO`, `ESTADO_RIESGO`, `ESTADO_NC`, `ESTADO_OC`, `ESTADO_HITO`, `ESTADO_ACTIVO`, `ESTADO_LICITACION` |

**Severidad: MEDIA** — La documentación subestima significativamente la riqueza del sistema de colores. Faltan 27 entradas y la propiedad `icon`.

### 1.3 Schema Zod — Discrepancias Críticas ❌

| Campo | Doc V1 | Realidad (proyectoSchema) |
|-------|--------|--------------------------|
| `nombre` | `z.string().min(1)` | `z.string()` (sin `.min(1)`) |
| `cliente` | `z.string().min(1)` | `z.string().default('')` |
| `estado` | 5 valores (incluye `'anulado'`) | 4 valores (sin `'anulado'`) |
| `etapaObra` | `z.enum(['cimentacion','estructura','mamposteria','acabados','instalaciones'])` | **NO EXISTE** — el campo real es `etapa` con valores `['planificacion','diseno','preconstruccion','construccion','cierre']` |
| `createdAt` | `z.string()` | `z.string().default('')` |
| `updatedAt` | `z.string()` | `z.string().default('')` |

**Severidad: CRÍTICA** — El schema documentado NO coincide con el real. El campo `etapaObra` no existe; el real es `etapa`. Los valores de `estado` difieren. Las validaciones `.min(1)` no existen.

### 1.4 Conteo de Schemas — Inflado ❌

| Afirmación | Doc V1 | Realidad |
|------------|--------|----------|
| "18 schemas Zod canónicos" | ✅ | 18 archivos en `src/erp/store/schemas/` |

**✅ El conteo de 18 schemas es correcto**, pero los schemas individuales tienen campos que no coinciden con la documentación.

---

## 2. Lazy Loading — Gaps

### 2.1 Conteo de Screens ❌

| Afirmación | Doc V1 | Realidad (AppLayout.tsx) |
|------------|--------|--------------------------|
| "43 screens lazy-loaded" | ✅ | **42 screens** |

**Severidad: BAJA** — Diferencia de 1 screen. Posiblemente una screen fue eliminada o renombrada durante el desarrollo.

### 2.2 Screens Faltantes en Documentación

La documentación no lista las 42/43 screens individualmente. Las screens reales son:
1. Dashboard, Proyectos, Presupuestos, Seguimiento, Financiero, RRHH, Bodega, CRM, APUAvanzado, BasePrecios, MuroObra, OrdenesCambio, Notificaciones, SSOCalidad, GestionDocumental, VisorBIM, DashboardPredictivo, ExportacionInteligente, LogisticaCompras, RendimientoCampo, ComercialFinanzas, Administracion, PlanillaDestajos, Impuestos, EntradasAlmacen, Ajustes, Hitos, Riesgos, CuentasCobrar, CuentasPagar, Cotizaciones, PlantillasProyectos, ProveedorAnalytics, ErrorLog, Activos, Cuadros, ProfitabilityAnalytics, Weather, ResourceConflicts, CalidadCumplimiento, Auditoria, CurvasS

---

## 3. RBAC — Verificación

### 3.1 VIEWS_BY_ROLE

| Rol | Doc V1 | Realidad |
|-----|--------|----------|
| `administrador` | `ALL_VIEWS` | ✅ |
| `gerente` | 11 vistas | ⚠️ No verificado exactamente |
| `supervisor` | 5 vistas | ⚠️ No verificado exactamente |
| `operador` | 4 vistas | ⚠️ No verificado exactamente |
| `visitante` | `['dashboard']` | ⚠️ No verificado exactamente |

**Severidad: MEDIA** — La documentación lista vistas específicas para cada rol pero no se pudo verificar contra el código real de `getViewsByRole`.

---

## 4. Mutation Queue — Gaps

### 4.1 MUTATION_TABLE_MAP

| Afirmación | Doc V1 | Realidad |
|------------|--------|----------|
| "180+ mapeos de mutación" | ✅ | **~100 mapeos** en store.tsx líneas 131-185 |

**Severidad: MEDIA** — Inflado en ~80%. El conteo real es ~100 operaciones CRUD mapeadas.

### 4.2 Token Bucket

| Afirmación | Doc V1 | Realidad |
|------------|--------|----------|
| `maxTokens: 10` | ✅ | `maxTokens: 10` |
| `refillRate: 5` | ✅ | `refillRate: 5` |
| Implementación | `tokenBucketRef` | ✅ |

**✅ Coincide exactamente.**

---

## 5. Realtime Subscriptions

| Afirmación | Doc V1 | Realidad |
|------------|--------|----------|
| "28 canales de suscripción" | ✅ | 28 canales en store.tsx |

**✅ Coincide.**

---

## 6. Sistema de Compresión

| Afirmación | Doc V1 | Realidad |
|------------|--------|----------|
| Umbral 10KB | ✅ | `COMPRESSION_THRESHOLD = 10240` |
| Prefijo 'lz:' | ✅ | `'lz:' + LZString.compressToUTF16(json)` |
| Web Worker | ✅ | `src/workers/compression.worker.ts` |

**✅ Coincide exactamente.**

---

## 7. Resumen de Gaps Arquitectónicos

| Categoría | Severidad | Hallazgo |
|-----------|-----------|----------|
| TABLE_MAP formato | 🔴 ALTA | Documentación invertida (alias→tabla vs tabla→alias) |
| Schema proyectoSchema | 🔴 CRÍTICA | `etapaObra` no existe, `estado` valores incorrectos, validaciones faltantes |
| Conteo screens | 🟡 MEDIA | 42 real vs 43 documentado |
| Conteo hooks | 🟡 MEDIA | 6 real vs 11 documentado |
| MUTATION_TABLE_MAP conteo | 🟡 MEDIA | ~100 real vs "180+" documentado |
| ESTADO_COLORS | 🟢 BAJA | Subestimado (30 entradas reales vs 3 mostradas) |
| Token Bucket | ✅ | Coincide exactamente |
| Realtime channels | ✅ | 28 canales, coincide |
| Compresión | ✅ | Coincide exactamente |

---

## 8. Conclusiones

1. **El schema Zod documentado para Proyecto está desactualizado** — contiene un campo (`etapaObra`) que no existe y valores de `estado` incorrectos. Esto es el gap más crítico.
2. **TABLE_MAP está documentado al revés** — la dirección del mapeo es opuesta a la realidad.
3. **Conteos inflados** — hooks (11→6), screens (43→42), mutation mappings (180+→~100).
4. **ESTADO_COLORS subestimado** — la documentación muestra solo 3 de 30 entradas.
5. **Infraestructura core correcta** — Token bucket, compresión, realtime channels están documentados correctamente.