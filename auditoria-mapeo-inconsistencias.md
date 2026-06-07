# Auditoría de Mapeo e Inconsistencias — CONSTRUSMART ERP

> **Fecha:** 06/06/2026
> **Alcance:** Código fuente completo (src/)
> **Propósito:** Verificar enrutamiento, conexión de datos, fuentes de KPIs/gráficas y detectar módulos huérfanos o inconsistentes.

---

## RESUMEN EJECUTIVO

| Tipo | Cantidad | Severidad |
|---|---|---|
| Inconsistencias críticas (datos incorrectos) | 8 | 🔴 Alta |
| Módulos huérfanos (no conectados) | 30 | 🟡 Media |
| Duplicidad de fuentes de datos | 7 | 🟡 Media |
| Inconsistencias de tipo/cálculo | 5 | 🟠 Media |
| Problemas de arquitectura | 3 | 🔴 Alta |

---

## 1. INCONSISTENCIAS CRÍTICAS — DATOS INCORRECTOS O ENGAÑOSOS

### 🔴 1.1 — Curva S del Dashboard usa datos HARDCODEADOS

**Archivo:** `src/erp/screens/Dashboard.tsx:27-29`
**Problema:**
```typescript
const avanceData = useMemo(() => {
  const prog = [0, 12, 28, 45, 62, 78, 90, 100];
  return { prog, real: [0, 10, 24, 40, 55, 67, 79, 88] };
}, []);
```
La Curva S del Dashboard principal usa arrays estáticos idénticos para TODOS los proyectos y todos los usuarios. No refleja el avance real de ningún proyecto.

**Impacto:** La curva S del Tablero principal siempre muestra los mismos valores sin importar qué proyecto esté activo. El usuario ve datos ficticios.

**Ver también:** `src/erp/screens/antd/Dashboard.tsx:181,190` — mismo problema en versión Ant Design.

**Solución sugerida:** Calcular la curva S a partir de `seguimientoEVM[]` o `avances[]` del store, filtrada por `selectedProyectoId`.

---

### 🔴 1.2 — Proyección de Flujo de Caja en Financiero usa multiplicadores arbitrarios

**Archivo:** `src/erp/screens/Financiero.tsx:37`
**Problema:**
```typescript
const cashFlow = { ingresos: [ingresos * 0.3, ingresos * 0.55, ingresos], egresos: [gastos * 0.35, gastos * 0.6, gastos] };
```
La proyección de flujo de caja a 30/60/90 días usa multiplicadores fijos (0.3, 0.55, 0.35, 0.6). No está basada en fechas de facturas, términos de pago, ni ningún plan de pagos real.

**Impacto:** Las proyecciones financieras son engañosas y no reflejan la realidad del proyecto.

**Solución sugerida:** Reemplazar con cálculos basados en `movimientos` con fechas, agrupados por mes, o implementar un modelo de proyección configurable.

---

### 🔴 1.3 — Escala del Gauge EVM usa multiplicador arbitrario

**Archivo:** `src/erp/screens/Seguimiento.tsx:173-174`
**Problema:**
```typescript
<Gauge value={CV} max={Math.abs(CV) + EV * 0.3 + 1} label="CV (Costo)" ... />
<Gauge value={SV} max={Math.abs(SV) + EV * 0.3 + 1} label="SV (Tiempo)" ... />
```
La escala máxima del Gauge se calcula con `EV * 0.3 + 1`, un factor arbitrario. El gauge siempre se ve proporcionado aunque los valores de CV/SV sean extremos.

**Impacto:** El gauge puede mostrar visualmente que "todo está bien" cuando no lo está, o viceversa. La escala dinámica oculta la magnitud real de la desviación.

**Solución sugerida:** Usar un max fijo o basado en el presupuesto total del proyecto (ej: `proy.presupuestoTotal * 0.1`).

---

### 🔴 1.4 — Inconsistencia monto vs costoTotal entre pantallas

| Archivo | Línea | Orden de preferencia |
|---|---|---|
| `Dashboard.tsx` | 18, 33 | `monto ?? costoTotal ?? 0` |
| `Financiero.tsx` | 21, 27, 32 | `costoTotal ?? monto ?? 0` |
| `Seguimiento.tsx` | 18 | `monto ?? costoTotal ?? 0` |
| `antd/Dashboard.tsx` | ~29 | Solo usa `costoTotal` |

**Problema:** Cada pantalla usa un orden de preferencia distinto entre `monto` y `costoTotal`. Los totales de ingresos/gastos **pueden diferir** entre pantallas para los mismos datos.

**Impacto:** Un movimiento registrado con `monto=100` y `costoTotal=null` dará Q100 en Dashboard/Seguimiento pero Q0 en Financiero/antd.

**Solución sugerida:** Unificar criterio en todo el código. Sugerencia: `(monto ?? costoTotal ?? 0)` en todas partes, y documentar que `monto` es el campo canónico.

---

### 🔴 1.5 — Seed Data cargada como datos reales

**Archivo:** `src/erp/data.ts` — contiene:
- `SEED_PROYECTOS` (8 proyectos ficticios con montos de Q4.85M)
- `SEED_MOVIMIENTOS` (8 transacciones ficticias)
- `SEED_EMPLEADOS` (7 empleados ficticios)
- `SEED_MATERIALES` (8 materiales ficticios)
- `SEED_OC` (3 órdenes de compra ficticias)
- `SEED_PROVEEDORES` (5 proveedores ficticios)
- `SEED_INSUMOS_BASE` (24 insumos ficticios)
- `SEED_RENDIMIENTOS` (15 rendimientos ficticios)
- `generarRenglones()` (45 renglones de actividad ficticios)

**Carga en:** `src/erp/store.tsx:562-567` — `loadFromStorage(key, SEED_*)` — si localStorage está vacío, se cargan los seeds.

**Impacto:** Usuarios nuevos ven proyectos como "Residencial Las Cumbres" y "Centro Comercial Plaza Norte" con montos ficticios en todos los KPIs, gráficas y dashboards. Esto persiste hasta que se sobrescriban manualmente.

**Solución sugerida:** No cargar seed data automáticamente. Solo cargar si el usuario explícitamente selecciona "Cargar datos demo" o si hay un flag de desarrollo.

---

### 🔴 1.6 — SSR/Calidad KPIs hardcodeados en GenericAntdScreen

**Archivo:** `src/erp/screens/antd/GenericAntdScreen.tsx:420-424`
**Problema:**
```typescript
value={45}  // días sin accidentes
value="12"  // checklists OK
value="8"   // pruebas realizadas
value="3"   // NC abiertas
```
Estos KPIs son valores fijos que nunca cambian.

**Impacto:** Los indicadores de SSO y Calidad siempre muestran los mismos valores, independientemente de los datos reales.

**Solución sugerida:** Leer desde `localStorage` (claves `wm_sso_*`) o desde la store.

---

### 🔴 1.7 — CRM seed data insertada en useEffect

**Archivo:** `src/erp/screens/CRM.tsx:64-70`
**Problema:**
```typescript
useEffect(() => {
  if (licitaciones.length === 0) {
    addLicitacion({ ... });
  }
}, []);
```
Si no hay licitaciones, se insertan 3 demo automáticamente.

**Impacto:** Datos demo persisten en el store y en Supabase.

**Solución sugerida:** Mover a un botón "Cargar demo" o eliminarlo.

---

### 🔴 1.8 — `avanceFinanciero` del proyecto vs calculado de movimientos

**Archivo:** `src/erp/store.tsx:1312-1320` y `Dashboard.tsx:24`
**Problema:**
- Dashboard usa `proyecto.avanceFinanciero` directamente.
- Store tiene `avanceFinancieroCalculado` que lo computa desde `movimientos`.
- **Pueden diferir** si se actualiza el campo manualmente sin movimientos correspondientes.

**Impacto:** El dashboard puede mostrar desviaciones incorrectas.

**Solución sugerida:** Usar siempre el valor calculado de movimientos, o agregar un flag `avanceFinancieroManual`.

---

## 2. MÓDULOS HUÉRFANOS — NO CONECTADOS A NINGÚN ROUTER/SCREEN

### 🟡 2.1 — Screens Ant Design huérfanas (5 archivos)

| Archivo | Componente | Estado |
|---|---|---|
| `src/erp/screens/antd/Dashboard.tsx` | `AntDashboard` | ❌ Nunca importado |
| `src/erp/screens/antd/Proyectos.tsx` | `AntProyectos` | ❌ Nunca importado |
| `src/erp/screens/antd/CRM.tsx` | `AntCRM` | ❌ Nunca importado |
| `src/erp/screens/antd/Financiero.tsx` | `AntFinanciero` | ❌ Nunca importado |
| `src/erp/screens/antd/GenericAntdScreen.tsx` | `GenericAntdScreen` | ❌ Nunca importado |

**Observación:** Existe un `uiMode` en `localStorage` (`'shadcn' | 'antd'`), pero ningún código lo lee para alternar entre los sets de screens. Las screens Ant Design están completamente desconectadas del enrutamiento.

---

### 🟡 2.2 — Componentes ERP huérfanos (15 archivos)

| Archivo | Componente | Estado |
|---|---|---|
| `src/erp/components/AvanceObraModal.tsx` | `AvanceObraModal` | ❌ Nunca importado |
| `src/erp/components/CajasChicasWidget.tsx` | `CajasChicasWidget` | ❌ Nunca importado |
| `src/erp/components/ChecklistCalidad.tsx` | `ChecklistCalidad` | ❌ Nunca importado |
| `src/erp/components/ConteoCiclico.tsx` | `ConteoCiclico` | ❌ Nunca importado |
| `src/erp/components/CriticalRenglonAlert.tsx` | `CriticalRenglonAlert` | ❌ Nunca importado |
| `src/erp/components/CubicacionAutomatica.tsx` | `CubicacionAutomatica` | ❌ Nunca importado |
| `src/erp/components/EnhancedGantt.tsx` | `EnhancedGantt` | ❌ Nunca importado |
| `src/erp/components/GanttChart.tsx` | `GanttChart` | ❌ Nunca importado |
| `src/erp/components/HistorialPresupuestosModal.tsx` | `HistorialPresupuestosModal` | ❌ Nunca importado |
| `src/erp/components/KitsMateriales.tsx` | `KitsMateriales` | ❌ Nunca importado |
| `src/erp/components/LicitacionesDashboard.tsx` | `LicitacionesDashboard` | ❌ Nunca importado |
| `src/erp/components/PertGanttChart.tsx` | `PertGanttChart` | ❌ Nunca importado |
| `src/erp/components/PresupuestoCard.tsx` | `PresupuestoCard` | ❌ Nunca importado |
| `src/erp/components/RecepcionMateriales.tsx` | `RecepcionMateriales` | ❌ Nunca importado |
| `src/erp/components/ValeSalidaModal.tsx` | `ValeSalidaModal` | ❌ Nunca importado |

**Nota:** ChecklistCalidad importa SignaturePad, RecepcionMateriales importa QRScanner, ConteoCiclico importa QRScanner. Las dependencias internas existen pero el padre no se usa.

---

### 🟡 2.3 — UI componentes ERP huérfanos (3 archivos)

| Archivo | Componente | Estado |
|---|---|---|
| `src/erp/components/ui/UIButton.tsx` | `UIButton` | ❌ Nunca importado |
| `src/erp/components/ui/UICard.tsx` | `UICard` | ❌ Nunca importado |
| `src/erp/components/ui/UITable.tsx` | `UITable` | ❌ Nunca importado |

---

### 🟡 2.4 — Otros archivos huérfanos

| Archivo | Tipo | Estado |
|---|---|---|
| `src/erp/hooks/useNuevosModulos.ts` | Hook | ❌ Nunca importado |
| `src/erp/layouts/AntLayout.tsx` | Layout | ❌ Nunca importado |
| `src/erp/store/schemas.ts` | Store (Zod) | Código duplicado de store.tsx |
| `src/erp/store/storage.ts` | Store (utils) | Código duplicado de store.tsx |
| `src/erp/store/queue.ts` | Store (queue) | Código duplicado de store.tsx |
| `src/contexts/` | Directorio | ❌ Vacío |
| `src/functions/crm-dispatcher/` | Directorio | ❌ Vacío |

**Total módulos huérfanos: 30**

---

## 3. DUPLICIDAD DE FUENTES DE DATOS

### 🟠 3.1 — Datos duplicados en localStorage con distintas claves

| Dato | Clave antigua (legacy) | Clave nueva (useNuevosModulos) |
|---|---|---|
| Destajos | `wm_destajos` | `wm_nuevos_modulos_destajos` |
| Capturas rendimiento | `wm_capturas` | `wm_nuevos_modulos_capturas_rend` |
| Vales renglón | `wm_vales_renglon` | `wm_nuevos_modulos_vales_renglon` |
| Activos herramientas | `wm_activos` | `wm_nuevos_modulos_activos` |
| Cuadros comparativos | `wm_cuadros` | `wm_nuevos_modulos_cuadros` |
| Pagos proveedores | `wm_pagos` | `wm_nuevos_modulos_pagos` |
| Plantillas subrenglón | `wm_plantillas` | `wm_nuevos_modulos_plantillas_sub` |

**Problema:** Los datos legacy se manejan directamente en los screens (`PlanillaDestajos.tsx`, `RendimientoCampo.tsx`, `LogisticaCompras.tsx`) con su propia lógica CRUD. `useNuevosModulos` gestiona los mismos tipos de datos pero con un hook separado y no conectado a ningún screen. **Nunca se sincronizan**, por lo que pueden divergir.

**Impacto:** Si el hook `useNuevosModulos` se activa en el futuro, los datos legacy no se migrarán automáticamente. Habrá pérdida o duplicación de datos.

---

### 🟠 3.2 — React Query inicializado pero no usado

**Archivo:** `src/App.tsx:16`
**Problema:** `QueryClientProvider` envuelve la app, pero `@tanstack/react-query` **no se usa en ningún lado**. Toda la data fetching va por `ErpProvider`.

**Impacto:** Dependencia innecesaria, bundle extra ~5KB.

---

## 4. INCONSISTENCIAS DE TIPO/CÁLCULO

### 🟠 4.1 — Tipo `RendimientoCampo` vs `rendimiento-campo` duplicado en sidebar

**Archivo:** `src/erp/components/Sidebar.tsx`
**Problema:**
```typescript
{ id: 'rendimiento-campo', label: 'Rendimiento Campo', group: 'Ejecucion' },
{ id: 'rendimientos', label: 'Rendimientos', group: 'Ejecucion' },
```
Ambos apuntan al **mismo componente** `RendimientoCampo.tsx`. Es confuso para el usuario.

**Solución sugerida:** Unificar en un solo ítem o crear un screen separado para `Rendimientos` (si era la intención original).

---

### 🟠 4.2 — Export name mismatch en 3 screens

| Archivo | Exporta como | Se importa como |
|---|---|---|
| `Hitos.tsx` | `HitosScreen` | `Hitos` |
| `CuentasCobrar.tsx` | `CuentasCobrarScreen` | `CuentasCobrar` |
| `CuentasPagar.tsx` | `CuentasPagarScreen` | `CuentasPagar` |

**Impacto:** Funciona por el default export, pero es inconsistente con el resto de screens.

---

### 🟠 4.3 — `monto` vs `costoTotal` en tipos `Movimiento`

**Archivo:** `src/erp/types.ts:136-137`
```typescript
monto?: number;
costoTotal?: number;
```
Ambos son opcionales y no hay validación de que al menos uno esté presente. No hay documentación de cuál es el campo canónico.

---

### 🟠 4.4 — `RendimientoCampo.tsx` genera datos mock aleatorios

**Archivo:** `src/erp/screens/RendimientoCampo.tsx:63-64, 118-121`
```typescript
// "Registrar Destajo" — crea datos con Math.round(Math.random() * 20 + 5)
// "Capturar" — crea datos con Math.round(Math.random() * 25 + 5)
```
Datos aleatorios insertados como si fueran reales. Sin advertencia al usuario.

---

### 🟠 4.5 — Screens con datos solo en localStorage sin sync a Supabase

| Screen | Clave localStorage |
|---|---|
| `PlanillaDestajos.tsx` | `wm_destajos` |
| `Riesgos.tsx` | `wm_riesgos` (inferido) |
| `Hitos.tsx` | `wm_hitos` (inferido) |
| `SSOCalidad.tsx` | `wm_sso_incidentes`, `wm_sso_pruebas`, `wm_sso_nc`, `wm_sso_liberaciones` |
| `GestionDocumental.tsx` | `wm_planos`, `wm_rfis`, `wm_subcontratos`, `wm_versiones` |

Estos datos **no tienen sync a Supabase**, a diferencia del resto del ERP. Si el usuario cambia de dispositivo o se borra localStorage, los datos se pierden.

---

## 5. PROBLEMAS DE ARQUITECTURA

### 🔴 5.1 — Navegación state-driven sin deep-linking

**Archivo:** `src/App.tsx` y `src/pages/Index.tsx`

La app usa React Router v6 pero solo tiene 2 rutas (`/` y `*`). Toda la navegación ERP es state-based mediante `view` en `ErpProvider`.

**Problemas derivados:**
- ❌ No hay deep-linking (no se puede compartir enlace a `proyectos`)
- ❌ No funciona botón "Atrás" del navegador entre módulos
- ❌ No se puede abrir un módulo específico en nueva pestaña
- ❌ Recarga la página siempre vuelve al dashboard

**Solución sugerida (largo plazo):** Migrar a URL-based routing con `useSearchParams` o rutas anidadas tipo `/app/proyectos`.

---

### 🔴 5.2 — Sin conflicto de resolución en Realtime

**Archivo:** `src/hooks/useSupabaseRealtime.ts`

Cuando llega un evento `INSERT`/`UPDATE`/`DELETE` por Realtime, se aplica directamente al estado. Si dos usuarios editan el mismo registro, **el último evento Realtime sobrescribe sin merge ni conflicto**.

**Impacto:** Posible pérdida de datos en trabajo colaborativo.

---

### 🔴 5.3 — Offline queue puede perderse

**Archivo:** `src/erp/store/queue.ts`
```typescript
const MAX_QUEUE_SIZE = 100;
```
Si la cola excede 100 operaciones, las más viejas se descartan sin advertencia.

**Impacto:** Mutaciones offline pueden perderse silenciosamente.

---

## 6. GRÁFICAS Y SUS FUENTES DE DATOS

### Verificación general

| Pantalla | Gráfica | Fuente de datos | ¿Correcta? |
|---|---|---|---|
| Dashboard | LineChart (Curva S) | `[0,12,28,45,62,78,90,100]` hardcoded | ❌ No |
| Dashboard | BarChart (Gastos) | `movimientos.filter(gasto)` agrupado | ✅ Sí |
| Dashboard | Donut (Ingresos vs Gastos) | `movimientos` | ✅ Sí |
| Financiero | AreaChart (Cash Flow) | `ingresos*0.3, ingresos*0.55` fake | ❌ No |
| Financiero | Donut (Categorías) | `movimientos.filter(gasto)` agrupado | ✅ Sí |
| Seguimiento | Gauge (CV/SV) | EVM calculado + max fake | ⚠️ Parcial |
| Seguimiento | BarChart (Físico vs Financ.) | `proyecto.avanceFisico/Financiero` | ✅ Sí |
| Bodega | BarChart (Pareto) | `materiales` ordenado | ✅ Sí |
| RRHH | BarChart (Planilla) | `empleados` filtrado | ✅ Sí |
| CurvasS | Barras (Curva S) | Sigmoid generado teórico | ⚠️ Teórico |

---

## 7. RECOMENDACIONES PRIORIZADAS

### Inmediatas (Semana 1)
1. 🔴 **Eliminar seed data automática** — No cargar SEED_* si localStorage está vacío.
2. 🔴 **Unificar `monto` vs `costoTotal`** — Elegir `monto` como canónico y estandarizar en todos los screens.
3. 🔴 **Reemplazar Curva S hardcodeada** — Calcular desde `seguimientoEVM` o `avances`.

### Corto plazo (Semana 2-3)
4. 🔴 **Reemplazar cash flow fake** — Agrupar movimientos por mes real.
5. 🟡 **Conectar screens Ant Design o eliminarlas** — Decidir si se usa `uiMode` o se borran.
6. 🟡 **Migrar datos legacy a `useNuevosModulos` o viceversa** — Eliminar duplicidad.
7. 🟠 **Unificar ítems duplicados en sidebar** (`rendimiento-campo` / `rendimientos`).

### Mediano plazo (Mes 2)
8. 🟡 **Incorporar componentes huérfanos** — Evaluar cada uno e integrarlo o eliminarlo.
9. 🔴 **Migrar a URL-based routing** — Para deep-linking y navegación con botón Atrás.
10. 🟠 **Agregar sync a Supabase para datos SSO, Hitos, Riesgos, PlanillaDestajos, Documentos**.
11. 🟡 **Implementar merge/conflicto resolution en Realtime**.

### Largo plazo (Mes 3+)
12. 🟡 **Eliminar código huérfano confirmado** — Tras evaluar cada componente.
13. 🟠 **Reemplazar React Query no usado** — O empezar a migrar data fetching a React Query.
14. 🟠 **Migrar Gauge EVM a escala fija basada en presupuesto**.

---

## 8. ANEXO: MAPA COMPLETO DE RUTAS

| View ID | Archivo Screen | ¿En Sidebar? | ¿En AppLayout? | ¿En tipos View? | ¿Orphaned? |
|---|---|---|---|---|---|
| login | `Login.tsx` | No | Sí (directo) | Sí | ❌ No |
| dashboard | `Dashboard.tsx` | Sí | Sí | Sí | ❌ No |
| proyectos | `Proyectos.tsx` | Sí | Sí | Sí | ❌ No |
| crm | `CRM.tsx` | Sí | Sí | Sí | ❌ No |
| presupuestos | `Presupuestos.tsx` | Sí | Sí | Sí | ❌ No |
| apu | `APUAvanzado.tsx` | Sí | Sí | Sí | ❌ No |
| baseprecios | `BasePrecios.tsx` | Sí | Sí | Sí | ❌ No |
| hitos | `Hitos.tsx` | Sí | Sí | Sí | ❌ No |
| riesgos | `Riesgos.tsx` | Sí | Sí | Sí | ❌ No |
| seguimiento | `Seguimiento.tsx` | Sí | Sí | Sí | ❌ No |
| curvas | `CurvasS.tsx` | Sí | Sí | Sí | ❌ No |
| rendimiento-campo | `RendimientoCampo.tsx` | Sí | Sí | Sí | ❌ No |
| rendimientos | `RendimientoCampo.tsx` (duplicado) | Sí | Sí | Sí | ❌ No |
| sso-calidad | `SSOCalidad.tsx` | Sí | Sí | Sí | ❌ No |
| muro | `MuroObra.tsx` | Sí | Sí | Sí | ❌ No |
| ordenes-cambio | `OrdenesCambio.tsx` | Sí | Sí | Sí | ❌ No |
| documentos | `GestionDocumental.tsx` | Sí | Sí | Sí | ❌ No |
| visor-bim | `VisorBIM.tsx` | Sí | Sí | Sí | ❌ No |
| bodega | `Bodega.tsx` | Sí | Sí | Sí | ❌ No |
| logistica | `LogisticaCompras.tsx` | Sí | Sí | Sí | ❌ No |
| entradas-almacen | `EntradasAlmacenOC.tsx` | Sí | Sí | Sí | ❌ No |
| rrhh | `RRHH.tsx` | Sí | Sí | Sí | ❌ No |
| planilla-destajos | `PlanillaDestajos.tsx` | Sí | Sí | Sí | ❌ No |
| financiero | `Financiero.tsx` | Sí | Sí | Sí | ❌ No |
| comercial-fin | `ComercialFinanzas.tsx` | Sí | Sí | Sí | ❌ No |
| cuentas-cobrar | `CuentasCobrar.tsx` | Sí | Sí | Sí | ❌ No |
| cuentas-pagar | `CuentasPagar.tsx` | Sí | Sí | Sí | ❌ No |
| impuestos | `Impuestos.tsx` | Sí | Sí | Sí | ❌ No |
| predictivo | `DashboardPredictivo.tsx` | Sí | Sí | Sí | ❌ No |
| exportacion | `ExportacionInteligente.tsx` | Sí | Sí | Sí | ❌ No |
| reportes | `ReportesTecnicos.tsx` | Sí | Sí | Sí | ❌ No |
| notificaciones | `Notificaciones.tsx` | Sí | Sí | Sí | ❌ No |
| admin-sistema | `Administracion.tsx` | Sí | Sí | Sí | ❌ No |
| ajustes | `Ajustes.tsx` | Sí | Sí | Sí | ❌ No |

**Total screens enrutados correctamente: 33/33** ✅
**Total screens Ant Design huérfanas: 5** ❌
**Total componentes ERP huérfanos: 15** ❌
