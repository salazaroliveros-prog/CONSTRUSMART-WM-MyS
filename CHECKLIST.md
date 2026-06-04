# CHECKLIST DE AUDITORÍA Y CORRECCIONES — ERP CONSTRUSMART

> Archivo vivo: marca cada issue como `✅` cuando esté corregido, `🔄` en progreso, `⬜` pendiente.
> Última actualización: 2026-06-04

---

## 🔴 CRÍTICOS (data loss, crashes, NaN propagation) — ✅ 7/7

| # | Módulo | Archivo | Issue | Estado |
|---|--------|---------|-------|--------|
| C1 | Store | store.tsx | `sanitizarTexto` no importado → ReferenceError en addNotificacion | ✅ |
| C2 | Store | store.tsx | Truncación JSON `slice(-500KB)` produce JSON inválido → pérdida permanente de datos | ✅ |
| C3 | Store | store.tsx | `processQueue` descarta mutations fallidas sin reintento → pérdida de datos | ✅ |
| C4 | Store | store.tsx | `addAvance`/`addLicitacion`/`updateLicitacion` envía camelCase a Supabase (debe usar `toSnake()`) | ✅ |
| C5 | Financiero | Financiero.tsx | `costoTotal` puede ser `undefined` → 7 accumuladores producen NaN en KPIs | ✅ |
| C6 | Almacén | EntradasAlmacenOC.tsx | OC nunca se actualiza a `'recibida'` → ciclo de vida roto | ✅ |
| C7 | Store | store.tsx, types.ts | `EventoCalendario.completado` en schema pero no en interfaz TS | ✅ |

---

## 🟠 ALTOS (cálculos incorrectos, crashes condicionales, data integrity) — ✅ 14/14

| # | Módulo | Archivo | Issue | Estado |
|---|--------|---------|-------|--------|
| H1 | Store | store.tsx | `r.id` tipado como `unknown` → comparación siempre false → renglones sobrescritos | ✅ |
| H2 | Store | store.tsx | `r.costoMateriales` tipado como `unknown` → NaN en addAvance | ✅ |
| H3 | Store | store.tsx | `verificarStockCritico`/`verificarOrdenes...` solo se ejecutan UNA vez | ✅ |
| H4 | Store | store.tsx | `'egreso'` en schema pero DB no lo permitía | ✅ |
| H5 | Store | store.tsx | Optimistic updates sin try/catch en updateProyecto | ✅ |
| H6 | Bodega | Bodega.tsx, types.ts | `'rechazado'` no existe en `OrdenCompra['estado']` | ✅ |
| H7 | Bodega | Bodega.tsx, types.ts | `p.rubro` no está en `Proveedor` → `.toLowerCase()` crash | ✅ |
| H8 | Compras | RecepcionMateriales.tsx | `items` opcional en OC → `.forEach()` en undefined | ✅ |
| H9 | Compras | useNuevosModulos.ts | `updateActivo` setea columnas no incluidas a null | ✅ |
| H10 | Financiero | Financiero.tsx | `montoContrato` undefined → NaN en cash flow | ✅ |
| H11 | Impuestos | Impuestos.tsx | Filtro ignora `'gasto'` → IVA/ISR mal calculados | ✅ |
| H12 | Financiero | CuentasCobrar/Pagar.tsx | `.sort()` muta React state directamente | ✅ |
| H13 | Impuestos | Impuestos.tsx | `fechaFin` excluye items con hora | ✅ |
| H14 | Store | store.tsx | Carga parcial de tablas crea inconsistencias | ✅ |

---

## 🟡 MEDIOS (lógica incorrecta, tipos sueltos, UX broken, rendimiento) — ✅ 30/30

| # | Módulo | Archivo | Issue | Estado |
|---|--------|---------|-------|--------|
| M1 | Store | store.tsx | Timer de 1s entre mutations → 100 mutations = 100s | ✅ |
| M2 | Store | store.tsx | `_timestamp` keys nunca escritas → GC roto | ✅ |
| M3 | Store | store.tsx | `loadFromStorage` sin try/catch → corruptos silenciosos | ✅ |
| M4 | Store | store.tsx | Cola de mutations sin warning al 90% | ✅ |
| M5 | Proyectos | Proyectos.tsx | `p.lng`/`p.lat` undefined → CSS `NaN%` en heat map | ✅ |
| M6 | Proyectos | Proyectos.tsx | `fechaFin: todayISO()` en creación → proyectos con fecha fin = hoy | ✅ |
| M7 | Proyectos | Proyectos.tsx | `as any` en estado onChange | ✅ |
| M8 | Proyectos | Proyectos.tsx | Select de estado sin default | ✅ |
| M9 | Proyectos | Proyectos.tsx | Botones "Ver" y "Editar" presupuesto idénticos | ✅ |
| M10 | Financiero | Financiero.tsx | `'egreso'` excluido de KPI totals | ✅ |
| M11 | OC/Compras | LogisticaCompras.tsx | Casts `as any` → casts tipados | ✅ |
| M12 | Bodega | Bodega.tsx | useEffect cicla con updateMaterial en deps | ✅ |
| M13 | Bodega | Bodega.tsx | Filtros de OC con onClick vacío | ✅ |
| M14 | EntradasOC | EntradasAlmacenOC.tsx | Matching "Cemento Gris" = "Cemento Blanco" | ✅ |
| M15 | EntradasOC | EntradasAlmacenOC.tsx | Semántica "Faltan X" invertida | ✅ |
| M16 | Compras | useNuevosModulos.ts | `isOnline` no reactivo | ✅ |
| M17 | Store | store.tsx | Doble unsafe cast `as Proyecto[]` | ✅ |
| M18 | Store | store.tsx | Schema produce `latitud`/`longitud` no en interface | ✅ |
| M19 | Store | store.tsx | `createContext` sin valores default | ✅ |
| M20 | Types | types.ts | `OrdenCompra.estado` falta `'rechazado'` | ✅ |
| M21 | Types | types.ts | `Proveedor` falta `rubro`/`calificacion` | ✅ |
| M22 | Types | types.ts | `Proyecto` campo `presupuesto` duplicado | ✅ |
| M23 | AvanceObra | AvanceObraModal.tsx | Sin validación de duplicados mismo renglón/mes | ✅ |
| M24 | AvanceObra | AvanceObraModal.tsx | Select usa `r.codigo` → `r.id` | ✅ |
| M25 | AppLayout | store.tsx | Modo UI no persiste en localStorage | ✅ |
| M26 | Store | store.tsx | `avanceFinancieroCalculado` dead code | ✅ |
| M27 | Financiero | Financiero.tsx | Inconsistencia en fallback de reduce | ✅ |
| M28 | Financiero | ComercialFinanzas.tsx | `proyectoId: 'p1'` hardcodeado | ✅ |
| M29 | Store | store.tsx | `enqueueMutation` retorno muerto | ✅ |
| M30 | Store | store.tsx | Mutaciones offline silenciosas | ✅ |

---

## 🟢 BAJOS (dead code, estilo, imports, mejoras) — ✅ 20/20

| # | Módulo | Archivo | Issue | Estado |
|---|--------|---------|-------|--------|
| L1 | Store | store.tsx | Imports sin usar: `Riesgo`, `CuentaCobrar`, `CuentaPagar`, `Hito` | ✅ |
| L2 | Store | store.tsx | Parámetro `_rol` confunde al lector | ✅ |
| L3 | Store | store.tsx | Guard de datos vacíos no atrapa arrays/objetos | ✅ |
| L4 | Proyectos | Proyectos.tsx | `estadoColor` tipa `estado: string` → `Proyecto['estado']` | ✅ |
| L5 | Proyectos | Proyectos.tsx | URL Unsplash sin fallback | ✅ |
| L6 | Proyectos | Proyectos.tsx | `<div>` extra envolviendo Skeleton | ✅ |
| L7 | Financiero | Financiero.tsx | `keyof typeof` lookup puede devolver undefined | ✅ |
| L8 | Impuestos | Impuestos.tsx | Usa `categoria` raw en vez de `CATEGORIA_LABEL` | ✅ |
| L9 | Financiero | ComercialFinanzas.tsx | Función `uid` nunca usada | ✅ |
| L10 | Financiero | ComercialFinanzas.tsx | `updateAnticipo` destructureada nunca usada | ✅ |
| L11 | Financiero | ComercialFinanzas.tsx | `document.getElementById` en vez de React ref | ✅ |
| L12 | Financiero | CuentasCobrar/Pagar.tsx | Estado `'parcial'` vencido no marcado | ✅ |
| L13 | Financiero | CuentasCobrar/Pagar.tsx | `monto=0` limpia input | ✅ |
| L14 | Logística | LogisticaCompras.tsx | Import `supabase` sin usar | ✅ |
| L15 | Logística | LogisticaCompras.tsx | `verificarExplosionMateriales` nunca usada | ✅ |
| L16 | EntradasOC | EntradasAlmacenOC.tsx | Variable `recepcionKey` nunca usada | ✅ |
| L17 | EntradasOC | EntradasAlmacenOC.tsx | `JSON.parse` en cuerpo del componente (no memoizado) | ✅ |
| L18 | RecepMateriales | RecepcionMateriales.tsx | `total` opcional → muestra Q 0.00 | ✅ |
| L19 | Store | store.tsx | Email `salazaroliveros@gmail.com` hardcodeado | ✅ |
| L20 | Store | store.tsx | Ruta `/logo.png` hardcodeada | ✅ |

---

## 📊 RESUMEN

| Severidad | Total | Corregidos | Pendientes |
|-----------|-------|------------|------------|
| 🔴 CRÍTICO | 7 | **7** (✅100%) | **0** |
| 🟠 ALTO | 14 | **14** (✅100%) | **0** |
| 🟡 MEDIO | 30 | **30** (✅100%) | **0** |
| 🟢 BAJO | 20 | **20** (✅100%) | **0** |
| **TOTAL** | **71** | **71** (✅**100%**) | **0** |

---

## LOG DE IMPLEMENTACIÓN

| Fecha | # Issues | Hitos |
|-------|----------|-------|
| 2026-06-04 (sesión 1) | — | Cascade subRenglones, cascade AvanceObra, per-project factors, safety net save |
| 2026-06-04 (sesión 2) | C1-C7, H1-H13, M1-M2, M5-M10, M14-M15, M20-M22, M24, M27 | Store críticos, NaN en Financiero, Almacén/OC, Proyectos |
| 2026-06-04 (sesión 3) | H14, M3-M4, M11-M13, M16-M19, M23, M25-M26, M28-M30, L1-L20 | Resto de medios, todos los bajos — **100% completado** |
