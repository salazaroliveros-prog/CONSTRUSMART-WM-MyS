# Auditoría CONSTRUSMART ERP — Hallazgos y Puntos de Inserción

> Archivo generado el 2026-07-21. Diseñado para que agentes autónomos puedan continuar correcciones sesión a sesión.

---

## Índice de Prioridades

| # | Severidad | Hallazgo | Archivo | Línea |
|---|-----------|----------|---------|-------|
| 1 | 🔴 CRÍTICO | Truncamiento 0-100 en Charts.tsx (datos financieros inválidos) | `src/erp/components/Charts.tsx:101,108` | [Ver](#1-crítico-chartstsx-truncamiento-0-100) |
| 2 | 🔴 CRÍTICO | Placeholder `[Gráfico comparativo]` en SeguimientoAnalysisPanel | `src/erp/components/seguimiento/SeguimientoAnalysisPanel.tsx:164-168` | [Ver](#2-crítico-seguimientoanalysispanel-placeholder) |
| 3 | 🔴 CRÍTICO | `updateProyectoWeather` sin enqueueMutation (nunca sync a Supabase) | `src/erp/zustandStore.ts:2060` | [Ver](#3-crítico-updateproyectoweather-sin-mutation-queue) |
| 4 | 🔴 CRÍTICO | 3 screens con datos fuera del store (sin Zod, sin sync) | Múltiple | [Ver](#4-crítico-datos-locales-fuera-del-store) |
| 5 | 🔴 CRÍTICO | 100+ colores sin variante `dark:*` (APUAvanzado el peor) | Múltiple | [Ver](#5-crítico-colores-sin-dark-mode) |
| 6 | 🟡 ALTO | 31/43 screens sin skeleton loading | Múltiple | [Ver](#6-alto-skeletons-faltantes) |
| 7 | 🟡 ALTO | 11 modales sin `animate-in fade-in` | Múltiple | [Ver](#7-alto-modales-sin-animación) |
| 8 | 🟡 ALTO | 20+ focus rings hardcodeados vs `focus-visible:ring-ring` | Múltiple | [Ver](#8-alto-focus-rings-hardcodeados) |
| 9 | 🟡 ALTO | 5 patrones distintos de botones | Múltiple | [Ver](#9-alto-patrones-de-botones-inconsistentes) |
| 10 | 🟡 ALTO | Presupuestos.tsx sin gráficos (screen financiera clave) | `src/erp/screens/Presupuestos.tsx` | [Ver](#10-alto-presupuestostsx-sin-gráficos) |
| 11 | 🟡 ALTO | Hitos.tsx sin visualización de cumplimiento | `src/erp/screens/Hitos.tsx` | [Ver](#11-alto-hitostsx-sin-visualización) |
| 12 | 🟡 ALTO | RendimientoCampo.tsx sin gráficos de rendimiento | `src/erp/screens/RendimientoCampo.tsx` | [Ver](#12-alto-rendimientocampotsx-sin-gráficos) |
| 13 | 🟡 ALTO | Dashboard.tsx — 7+ KPIs faltantes | `src/erp/screens/Dashboard.tsx` | [Ver](#13-alto-dashboardtsx-kpis-faltantes) |
| 14 | 🔵 BAJO | `marcarTodasLeidas` bypassa enqueueMutation | `src/erp/zustandStore.ts:1495` | [Ver](#14-bajo-marcartodasleidas-sin-enqueuemutation) |
| 15 | 🔵 BAJO | Doble persistencia de `appSettings` | `src/erp/zustandStore.ts:655` + `store.tsx:709` | [Ver](#15-bajo-doble-persistencia-appsettings) |
| 16 | 🔵 BAJO | Dashboard.tsx `Progress value={100}` sin métrica real | `src/erp/screens/Dashboard.tsx:422` | [Ver](#16-bajo-progress-value100-sin-métrica) |
| 17 | 🔵 BAJO | `Gauge` importado pero no usado en 2 screens | `src/erp/screens/ProfitabilityAnalytics.tsx:7`, `SeguimientoAnalysisPanel.tsx:2` | [Ver](#17-bajo-gauge-importado-no-usado) |
| 18 | 🔵 BAJO | 3 modales sin `role="dialog" aria-modal="true"` | Activos, PlanillaDestajos, ResourceConflicts | [Ver](#18-bajo-modales-sin-role-dialog) |
| 19 | 🔵 BAJO | 2 sistemas de tema activos simultáneamente | `src/components/theme-provider.tsx` + `src/lib/theme-manager.ts` | [Ver](#19-bajo-dos-sistemas-de-tema) |

---

## 1. 🔴 CRÍTICO: Charts.tsx truncamiento 0-100

**Archivo:** `src/erp/components/Charts.tsx`

### Puntos de inserción exactos

**Línea 101 — LineChart:**
```typescript
// ACTUAL (dañino — trunca valores financieros):
const clean = series.map(s => ({ ...s, data: s.data.filter((v): v is number => Number.isFinite(v)).map(v => Math.max(0, Math.min(100, v))) }));

// CORREGIDO:
const clean = series.map(s => ({ ...s, data: s.data.filter((v): v is number => Number.isFinite(v)) }));
```

**Línea 108 — LineChart (función y):**
```typescript
// ACTUAL:
const nv = Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;

// CORREGIDO:
const nv = Number.isFinite(v) ? Math.max(0, v) : 0;
```

**Línea 268 — BarChart:**
```typescript
// ACTUAL:
const value = Math.max(0, Number.isFinite(d.value) ? d.value : 0);

// CORREGIDO (ya está bien, pero verificar que el max no trunque):
// Ya usa Math.max(...data.map(d => d.value), 1) basado en el valor real
// No necesita cambio.
```

### Impacto
- Todos los gráficos LineChart del sistema mostraban valores incorrectos si >100
- Afecta: Dashboard (financiero), Bodega (inventario), RRHH (planilla), Profitability, CurvasS
- **Este fix es prioritario porque invalida datos financieros**

---

## 2. 🔴 CRÍTICO: SeguimientoAnalysisPanel placeholder

**Archivo:** `src/erp/components/seguimiento/SeguimientoAnalysisPanel.tsx`

### Punto de inserción exacto

**Líneas 2 y 159-192:**
```typescript
// LINEA 2 — Agregar import de BarChart:
import { LineChart, Gauge, BarChart } from '../Charts';

// LINEAS 159-192 — Reemplazar placeholder con BarChart real:
{/* Gráfico Físico vs Financiero */}
<div className="border-t border-border/50 pt-4">
  <h4 className="text-sm font-medium text-foreground mb-3">Físico vs Financiero</h4>
  <div className="grid grid-cols-3 gap-4">
    <div className="col-span-2">
      <BarChart
        data={[
          { label: 'Físico', value: fisica, color: 'hsl(var(--primary))' },
          { label: 'Financiero', value: financiero, color: '#f59e0b' },
        ]}
        height={160}
        palette="default"
      />
    </div>
    {/* Leyenda (mantener igual) */}
    ...
  </div>
</div>
```

### Nota
- `Gauge` import en línea 2 NO se usa en ninguna parte del componente — se puede eliminar de ese import

---

## 3. 🔴 CRÍTICO: updateProyectoWeather sin mutation queue

**Archivo:** `src/erp/zustandStore.ts`

### Punto de inserción exacto (aproximadamente línea 2060)

Buscar `updateProyectoWeather` en el archivo. La función debe modificarse para agregar:

```typescript
updateProyectoWeather: (data) => set((state) => {
  const existing = state.proyectoWeather || [];
  const idx = existing.findIndex(w => w.proyectoId === data.proyectoId);
  const updated = idx >= 0
    ? existing.map((w, i) => i === idx ? { ...w, ...data } : w)
    : [...existing, data as any];
  
  // Agregar mutation para sync
  get().enqueueMutation('updateProyectoWeather', data);
  
  return { proyectoWeather: updated };
}),
```

### Impacto
- Datos climáticos solo existen localmente
- `MUTATION_TABLE_MAP` ya tiene `updateProyectoWeather: 'erp_proyecto_weather'` pero la función nunca lo usa

---

## 4. 🔴 CRÍTICO: Datos locales fuera del store

### 4a. Administracion.tsx

**Archivo:** `src/erp/screens/Administracion.tsx`

**Problema:** Usa `localStorage.setItem/getItem` directo para `centrosCosto` y `auditLog`.

**Solución existente en store:**
- `centroCostoSchema` existe en `src/erp/store/schemas/`
- `addCentroCosto`, `updateCentroCosto`, `deleteCentroCosto` existen en `zustandStore.ts`
- Migrar para usar `useErp()` → `ctx.centrosCosto`, `ctx.addCentroCosto()`, etc.
- Eliminar toda persistencia directa a localStorage

### 4b. ComercialFinanzas.tsx

**Archivo:** `src/erp/screens/ComercialFinanzas.tsx`

**Problema:** Usa `localStorage.setItem/getItem` directo para `anticipos` y `cajasChicas`.

**Solución existente en store:**
- `anticipoSchema` y `cajaChicaSchema` existen en schemas
- Limpiar datos locales, migrar al store

### 4c. RendimientoCampo.tsx

**Archivo:** `src/erp/screens/RendimientoCampo.tsx`

**Problema:** Usa `localStorage.setItem('wm_erp_rendimiento_campo', ...)` directo.

**Solución:**
- No existe schema específico para rendimiento campo (verificar si se debe crear)
- Migrar al store o al menos agregar validación Zod local

---

## 5. 🔴 CRÍTICO: Colores sin dark mode

### 5a. APUAvanzado.tsx — 30+ cards sin dark variant

**Archivo:** `src/erp/screens/APUAvanzado.tsx`

**Patrón problemático (ejemplo línea 486):**
```tsx
className="bg-orange-50 border-orange-100 rounded-xl p-4"
```

**Corrección:**
```tsx
className="bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/50 rounded-xl p-4"
```

**Búsqueda:** Todas las ocurrencias de `bg-(orange|blue|amber|cyan|purple|emerald|green|red)-50` en el archivo.
Aprox. 30+ ocurrencias entre líneas 486-711.

### 5b. BasePrecios.tsx — Badges sin dark

**Archivo:** `src/erp/screens/BasePrecios.tsx`

**Línea 215:** `bg-blue-50 text-blue-600` → `bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400`
**Línea 232:** `bg-emerald-50 text-emerald-600` / `bg-red-50 text-red-600` → agregar `dark:` variants

### 5c. CRM.tsx — Estados sin dark

**Archivo:** `src/erp/screens/CRM.tsx`

**Línea 27:** `bg-blue-50 border-blue-300 text-blue-600`
**Línea 28:** `bg-emerald-50 border-emerald-300 text-emerald-600`

### 5d. Activos.tsx — Botones hardcodeados

**Archivo:** `src/erp/screens/Activos.tsx`

**Línea 76:** `bg-indigo-500 text-white` → `bg-primary text-primary-foreground`
**Línea 176:** `bg-indigo-500 text-white` → `bg-primary text-primary-foreground`

### 5e. Presupuestos.tsx — Botón hardcodeado

**Archivo:** `src/erp/screens/Presupuestos.tsx`

**Línea 136:** `bg-blue-500 text-white` → `bg-primary text-primary-foreground`
**Línea 209:** `bg-blue-600 text-white` → `bg-primary text-primary-foreground`

### 5f. Weather.tsx — Botones con colores fijos

**Archivo:** `src/erp/screens/Weather.tsx`

**Línea 399:** `bg-blue-50 text-blue-600 hover:bg-blue-100 focus:ring-blue-400`
**Línea 424:** `bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-400`

### 5g. Notificaciones.tsx — Filtros sin dark

**Archivo:** `src/erp/screens/Notificaciones.tsx`

**Línea 104:** `bg-indigo-50 text-indigo-700 hover:bg-indigo-100`

---

## 6. 🟡 ALTO: Skeletons faltantes

31 screens sin skeleton loading. Lista completa:

| Screen | Sin Skeleton | Prioridad |
|--------|-------------|-----------|
| Presupuestos.tsx | Sí | ALTA (screen financiera) |
| Hitos.tsx | Sí | ALTA (datos de cumplimiento) |
| RendimientoCampo.tsx | Sí | ALTA |
| Activos.tsx | Sí | MEDIA |
| APUAvanzado.tsx | Sí | MEDIA |
| Auditoria.tsx | Sí | MEDIA |
| BasePrecios.tsx | Sí | MEDIA |
| Bodega.tsx | Sí | MEDIA |
| CalidadCumplimiento.tsx | Sí | MEDIA |
| ComercialFinanzas.tsx | Sí | MEDIA |
| Cotizaciones.tsx | Sí | MEDIA |
| CRM.tsx | Sí | MEDIA |
| Cuadros.tsx | Sí | MEDIA |
| CurvasS.tsx | Sí | MEDIA |
| DashboardPredictivo.tsx | Sí | MEDIA |
| EntradasAlmacenOC.tsx | Sí | BAJA |
| ErrorLog.tsx | Sí | BAJA |
| ExportacionInteligente.tsx | Sí | BAJA |
| GestionDocumental.tsx | Sí | BAJA |
| Impuestos.tsx | Sí | BAJA |
| LogisticaCompras.tsx | Sí | BAJA |
| MuroObra.tsx | Sí | BAJA |
| Notificaciones.tsx | Sí | BAJA |
| OrdenesCambio.tsx | Sí | BAJA |
| PlanillaDestajos.tsx | Sí | BAJA |
| PlantillasProyectos.tsx | Sí | BAJA |
| Proyectos.tsx | Sí | BAJA |
| Riesgos.tsx | Sí | BAJA |
| RRHH.tsx | Sí | BAJA |
| SSOCalidad.tsx | Sí | BAJA |
| Weather.tsx | Sí | BAJA |
| Ajustes.tsx | Sí | BAJA |

**Patrón a implementar (insertar al inicio del return de cada screen):**
```tsx
if (loading) {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
```

**Nota:** Algunas screens (Dashboard, Login, etc.) ya tienen skeleton — seguir ese mismo patrón.

---

## 7. 🟡 ALTO: Modales sin animación de entrada

11 modales sin `animate-in fade-in duration-200`. Lista:

| Screen | Sin animación | Prioridad |
|--------|--------------|-----------|
| Activos.tsx | Sí | ALTA |
| ComercialFinanzas.tsx | Sí | ALTA |
| Administracion.tsx | Sí | ALTA |
| CuentasCobrar.tsx | Sí | MEDIA |
| CuentasPagar.tsx | Sí | MEDIA |
| EntradasAlmacenOC.tsx | Sí | MEDIA |
| LogisticaCompras.tsx (×2) | Sí | MEDIA |
| PlanillaDestajos.tsx | Sí | MEDIA |
| Presupuestos.tsx | Sí | MEDIA |
| ResourceConflicts.tsx | Sí | BAJA |
| RendimientoCampo.tsx | Sí | BAJA |

**Patrón a aplicar (insertar en className del div contenedor del modal):**
```tsx
className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200"
```

---

## 8. 🟡 ALTO: Focus rings hardcodeados

20+ elementos usan `focus-visible:ring-COLOR-400` en vez de `focus-visible:ring-ring`.

**Archivos afectados:**
- `Bodega.tsx:299,304,340` → `focus-visible:ring-emerald-400` / `focus-visible:ring-red-400`
- `Cuadros.tsx:223` → `focus-visible:ring-red-400`
- `CuentasCobrar.tsx:197` → `focus-visible:ring-emerald-400`
- `CuentasPagar.tsx:199` → `focus-visible:ring-emerald-400`
- `Cotizaciones.tsx:283` → `focus-visible:ring-red-400`
- `MuroObra.tsx:117,120,139` → `focus-visible:ring-red-400` / `focus-visible:ring-blue-400`
- `Presupuestos.tsx:209` → `focus-visible:ring-blue-400`
- `Weather.tsx` (múltiple) → `focus:ring-blue-400`
- `EntradasAlmacenOC.tsx:148` → `focus-visible:ring-blue-400`
- `EntradasAlmacenOC.tsx:195` → `focus-visible:ring-emerald-400`
- `PlantillasProyectos.tsx:1148` → `focus-visible:ring-blue-400`
- `SSOCalidad.tsx:406` → `focus:ring-amber-400`

**Corrección genérica:** Reemplazar `focus-visible:ring-COLOR-400` con `focus-visible:ring-ring`

---

## 9. 🟡 ALTO: Patrones de botones inconsistentes

### Patrones detectados

| Patrón | Screens |
|--------|---------|
| `bg-primary text-primary-foreground hover:bg-primary/90` | Ajustes, Bodega, PlantillasProyectos, etc. **(RECOMENDADO)** |
| `bg-indigo-500 text-white hover:bg-indigo-600` | Activos (×2) |
| `bg-teal-500 text-white` | BasePrecios (importar CSV) |
| `bg-slate-800 text-white` | BasePrecios (exportar CSV) |
| `bg-indigo-500 text-white` | BasePrecios |
| `bg-emerald-500 text-white` | BasePrecios (agregar) |
| `bg-violet-500 text-white` | CRM |
| `bg-blue-600 text-white` | MuroObra (×2), Presupuestos |
| `bg-blue-500 text-white` | Presupuestos, Weather |
| `bg-info hover:bg-info/90 text-info-foreground` | GestionDocumental, Administracion |
| `bg-success text-success-foreground` | ComercialFinanzas |

**Corrección:** Unificar TODOS al patrón `bg-primary text-primary-foreground hover:bg-primary/90`
Altura unificada: `h-10 px-4 py-2`

---

## 10. 🟡 ALTO: Presupuestos.tsx sin gráficos

**Archivo:** `src/erp/screens/Presupuestos.tsx`

**Hallazgo:** Screen financiera clave con 0 gráficos. Solo CRUD en tabla.

**Implementación sugerida:**
```tsx
// Después del título y antes de la tabla, agregar:
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
  <BarChart data={presupuestosData} height={200} palette="default" />
  <Donut data={tipologiaData} height={200} palette="cool" />
</div>
```

Donde `presupuestosData` mapea `presupuestos` del store a `{label: proyecto.nombre, value: proyecto.monto}` y `tipologiaData` agrupa por `categoria`.

---

## 11. 🟡 ALTO: Hitos.tsx sin visualización

**Archivo:** `src/erp/screens/Hitos.tsx`

**Hallazgo:** Sin gráfico de cumplimiento — solo lista con checkboxes.

**Implementación sugerida:**
```tsx
// KPIs arriba de la lista:
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <KPICard title="Total hitos" value={hitos.length} icon={Target} />
  <KPICard title="Completados" value={completados} icon={CheckCircle} />
  <KPICard title="Vencidos" value={vencidos} icon={AlertTriangle} />
  <KPICard title="% Cumplimiento" value={`${pctCompletado}%`} icon={TrendingUp} />
</div>

// Donut de cumplimiento antes de la tabla:
<Donut data={cumplimientoData} height={180} />
```

---

## 12. 🟡 ALTO: RendimientoCampo.tsx sin gráficos

**Archivo:** `src/erp/screens/RendimientoCampo.tsx`

**Implementación sugerida:**
```tsx
// KPIs de rendimiento
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <KPICard title="Registros" value={rendimientos.length} ... />
  <KPICard title="Rendimiento Promedio" value={promedio + ' m²/día'} ... />
  <KPICard title="Cuadrillas" value={cuadrillas} ... />
</div>

// BarChart de rendimiento por actividad
<BarChart data={rendimientoPorActividad} height={200} palette="default" />
```

---

## 13. 🟡 ALTO: Dashboard.tsx KPIs faltantes

**Archivo:** `src/erp/screens/Dashboard.tsx`

**KPIs actuales:** Proyectos totales, Cartera (Q), Utilidad, Margen Promedio

**KPIs a agregar** (datos existen en store):
1. Proyectos en riesgo (de `riesgos`)
2. Órdenes de cambio pendientes (de `ordenesCambio`)
3. Costo total ejecutado (de `movimientos`)
4. Materiales críticos (de `materiales`)
5. Empleados activos (de `empleados`)
6. Hitos vencidos (de `hitos`)
7. Flujo de caja neto (de cuentas cobrar - cuentas pagar)

**Implementación:**
```tsx
// Agregar al grid existente de KPIs:
<KPICard title="En Riesgo" value={proyectosEnRiesgo} icon={AlertTriangle} variant="danger" />
<KPICard title="OC Pendientes" value={ocPendientes} icon={FileText} variant="warning" />
<KPICard title="Empleados" value={empleadosActivos} icon={Users} variant="info" />
<KPICard title="Flujo Neto" value={fmtQ(flujoNeto)} icon={Wallet} variant={flujoNeto >= 0 ? 'success' : 'danger'} />
```

---

## 14. 🔵 BAJO: marcarTodasLeidas sin enqueueMutation

**Archivo:** `src/erp/zustandStore.ts:1495`

**Problema:** Construye mutations manualmente con `setMutationQueue` en lugar de `enqueueMutation`.

**Corrección:**
```typescript
// Reemplazar setMutationQueue con:
notificaciones.forEach(n => {
  if (!n.leida) {
    get().enqueueMutation('updateNotificacion', { id: n.id, leida: true });
  }
});
```

---

## 15. 🔵 BAJO: Doble persistencia appSettings

**Archivos:** `src/erp/zustandStore.ts:655` + `src/erp/store.tsx:709`

**Problema:** `setAppSettings` guarda con `localStorage.setItem` directo SIN compresión/encryption. El persistence cycle en `store.tsx` también guarda appSettings CON compresión + encryption.

**Corrección:** En `zustandStore.ts:655`, eliminar el `localStorage.setItem` directo de `setAppSettings` — dejar que el persistence cycle de `store.tsx` maneje la persistencia.

---

## 16. 🔵 BAJO: Progress value={100} sin métrica

**Archivo:** `src/erp/screens/Dashboard.tsx:422`

**Problema:** `Progress value={100}` para empleados es marcador sin sentido.

**Corrección:** Reemplazar con valor real o eliminar el Progress si no hay métrica relevante para el total de empleados.

---

## 17. 🔵 BAJO: Gauge importado no usado

**Archivos:**
- `src/erp/screens/ProfitabilityAnalytics.tsx:7`
- `src/erp/components/seguimiento/SeguimientoAnalysisPanel.tsx:2`

**Corrección:** Eliminar `Gauge` de los imports donde no se usa.

---

## 18. 🔵 BAJO: Modales sin role dialog

**Archivos:**
- `src/erp/screens/Activos.tsx` — modal sin `role="dialog" aria-modal="true"`
- `src/erp/screens/PlanillaDestajos.tsx` — modal sin atributos
- `src/erp/screens/ResourceConflicts.tsx` — modal sin atributos

**Corrección:** Agregar `role="dialog" aria-modal="true"` al div contenedor del modal.

---

## 19. 🔵 BAJO: Dos sistemas de tema

**Archivos:**
- `src/components/theme-provider.tsx` (light/dark/system hook)
- `src/lib/theme-manager.ts` (5 temas: ant-design, dark-pro, material3, glassmorphism, neomorphism)

**Problema:** Dos sistemas de tema activos simultáneamente. La clase `dark` de theme-provider puede interferir con `dark-pro` de theme-manager.

**Posible corrección (requiere análisis más profundo):**
- Evaluar cuál sistema es el "principal"
- Si se usa theme-manager como fuente de verdad, theme-provider debería delegar en él
- Si se usa theme-provider, theme-manager debe ajustarse para no sobrescribir

---

## Estado de Correcciones — Sesión 4 (2026-07-22)

### Completados en Sesión 4 (✅) — +6 fixes (total: 45)

| # | Fix | Archivos |
|---|-----|----------|
| 40 | Dark mode text colors en APUAvanzado.tsx | `APUAvanzado.tsx` |
| 41 | BasePrecios.tsx badges — verificado con dark mode | `BasePrecios.tsx` |
| 42 | CRM.tsx estados — verificado con dark mode | `CRM.tsx` |
| 43 | Activos.tsx botones — verificado con dark mode | `Activos.tsx` |
| 44 | Notificaciones.tsx unread indicator dark mode | `Notificaciones.tsx` |
| 45 | Focus rings — verificado todos usan focus-visible:ring-ring | Múltiple screens |

---

## Estado de Correcciones — Sesión 3 (2026-07-21)

### Completados en Sesión 3 (✅) — +6 fixes (total: 39)

| # | Fix | Archivos |
|---|-----|----------|
| 33 | Charts.tsx truncamiento 0-100 — verificado corregido | `Charts.tsx` |
| 34 | SeguimientoAnalysisPanel placeholder — verificado corregido | `SeguimientoAnalysisPanel.tsx` |
| 35 | updateProyectoWeather sin enqueueMutation — verificado corregido | `zustandStore.ts` |
| 36 | Colores sin dark mode en Weather.tsx KPIs | `Weather.tsx` |
| 37 | Botón selector gráfico → bg-primary | `Weather.tsx` |
| 38 | Skeletons verificados en múltiples screens | Activos, Auditoria, ErrorLog, DashboardPredictivo, GestionDocumental, Impuestos, LogisticaCompras, MuroObra |
| 39 | Animación de modales verificada | ComercialFinanzas, Administracion, CuentasCobrar, CuentasPagar, EntradasAlmacenOC, PlanillaDestajos, Presupuestos, ResourceConflicts, RendimientoCampo, LogisticaCompras |

### Completados en Sesión 2 (✅) — +12 fixes (total: 33)

| # | Fix | Archivos |
|---|-----|----------|
| 20 | Administracion.tsx — centrosCosto migrado al store (addCentroCosto/updateCentroCosto/deleteCentroCosto) | `Administracion.tsx` |
| 21 | Administracion.tsx — auditLog con validación Zod | `Administracion.tsx` |
| 22 | ComercialFinanzas.tsx — anticipos/cajasChicas con validación Zod | `ComercialFinanzas.tsx` |
| 23 | RendimientoCampo.tsx — rendimientos con validación Zod | `RendimientoCampo.tsx` |
| 24 | Skeletons agregados a 8 screens prioritarias | Presupuestos, Hitos, RendimientoCampo, Bodega, CurvasS, CRM, Cotizaciones, BasePrecios |
| 25 | Presupuestos.tsx — KPIs (Total, Monto, Tipologías) | `Presupuestos.tsx` |
| 26 | Hitos.tsx — KPIs (Total, Completados, Pendientes, % Cumplimiento) | `Hitos.tsx` |
| 27 | Financiero.tsx — Donut de gastos por categoría | `Financiero.tsx` |
| 28 | Dashboard.tsx — 4 KPIs nuevos (En Riesgo, OC Pendientes, Empleados, Flujo Neto) | `Dashboard.tsx` |
| 29 | border-red-400 → border-red-500 unificado en errores | Bodega, Cuadros, EntradasAlmacenOC, Hitos |
| 30 | SSOCalidad.tsx — border-red-200 → border-border | `SSOCalidad.tsx` |
| 31 | Botones unificados a bg-primary | GestionDocumental, ComercialFinanzas, MuroObra |
| 32 | rounded-xl/rounded-2xx → rounded-lg en skeletons | 5 archivos (Profitability, ProveedorAnalytics, ResourceConflicts, VisorBIM, Administracion) |

---

## Estado de Correcciones — Sesión 2 (2026-07-21)

### Completados en Sesión 2 (✅) — +12 fixes (total: 33)

| # | Fix | Archivos |
|---|-----|----------|
| 20 | Administracion.tsx — centrosCosto migrado al store (addCentroCosto/updateCentroCosto/deleteCentroCosto) | `Administracion.tsx` |
| 21 | Administracion.tsx — auditLog con validación Zod | `Administracion.tsx` |
| 22 | ComercialFinanzas.tsx — anticipos/cajasChicas con validación Zod | `ComercialFinanzas.tsx` |
| 23 | RendimientoCampo.tsx — rendimientos con validación Zod | `RendimientoCampo.tsx` |
| 24 | Skeletons agregados a 8 screens prioritarias | Presupuestos, Hitos, RendimientoCampo, Bodega, CurvasS, CRM, Cotizaciones, BasePrecios |
| 25 | Presupuestos.tsx — KPIs (Total, Monto, Tipologías) | `Presupuestos.tsx` |
| 26 | Hitos.tsx — KPIs (Total, Completados, Pendientes, % Cumplimiento) | `Hitos.tsx` |
| 27 | Financiero.tsx — Donut de gastos por categoría | `Financiero.tsx` |
| 28 | Dashboard.tsx — 4 KPIs nuevos (En Riesgo, OC Pendientes, Empleados, Flujo Neto) | `Dashboard.tsx` |
| 29 | border-red-400 → border-red-500 unificado en errores | Bodega, Cuadros, EntradasAlmacenOC, Hitos |
| 30 | SSOCalidad.tsx — border-red-200 → border-border | `SSOCalidad.tsx` |
| 31 | Botones unificados a bg-primary | GestionDocumental, ComercialFinanzas, MuroObra |
| 32 | rounded-xl/rounded-2xx → rounded-lg en skeletons | 5 archivos (Profitability, ProveedorAnalytics, ResourceConflicts, VisorBIM, Administracion) |

### Pendientes para próxima sesión

| # | Severidad | Hallazgo | Archivo |
|---|-----------|----------|---------|
| — | 🔴 CRÍTICO | updateProyectoWeather sin enqueueMutation | `zustandStore.ts` |
| — | 🔴 CRÍTICO | 3 screens con datos fuera del store | Múltiple |
| — | 🔴 CRÍTICO | 100+ colores sin dark mode | Múltiple |
| — | 🟡 ALTO | 31 screens sin skeleton loading | Múltiple |
| — | 🟡 ALTO | 11 modales sin `animate-in fade-in` | Múltiple |
| — | 🟡 ALTO | 20+ focus rings hardcodeados | Múltiple |
| — | 🟡 ALTO | 5 patrones de botones inconsistentes | Múltiple |
| — | 🟡 ALTO | Presupuestos.tsx sin gráficos | `Presupuestos.tsx` |
| — | 🟡 ALTO | Hitos.tsx sin visualización | `Hitos.tsx` |
| — | 🟡 ALTO | RendimientoCampo.tsx sin gráficos | `RendimientoCampo.tsx` |
| — | 🟡 ALTO | Dashboard.tsx KPIs faltantes | `Dashboard.tsx` |
| — | 🔵 BAJO | marcarTodasLeidas sin enqueueMutation | `zustandStore.ts` |
| — | 🔵 BAJO | Doble persistencia appSettings | `zustandStore.ts` + `store.tsx` |
| — | 🔵 BAJO | Progress value={100} sin métrica | `Dashboard.tsx` |
| — | 🔵 BAJO | Gauge importado no usado | ProfitabilityAnalytics.tsx |
| — | 🔵 BAJO | Modales sin role dialog | Activos, PlanillaDestajos, ResourceConflicts |
| — | 🔵 BAJO | Dos sistemas de tema | `theme-provider.tsx` + `theme-manager.ts` |

### Pantallas Pendientes por Corregir (Orden sugerido)

| Screen | Prioridad | Issues Detectados |
|--------|-----------|-------------------|
| **CRÍTICAS** | | |
| APUAvanzado.tsx | ALTA | 30+ colores sin dark mode |
| BasePrecios.tsx | ALTA | Badges sin dark, botones hardcodeados |
| CRM.tsx | ALTA | Estados sin dark |
| **ALTAS** | | |
| Presupuestos.tsx | ALTA | Sin skeleton, sin gráficos, botones hardcodeados |
| Hitos.tsx | ALTA | Sin skeleton, sin visualización de cumplimiento |
| RendimientoCampo.tsx | ALTA | Sin skeleton, sin gráficos |
| Dashboard.tsx | ALTA | KPIs faltantes, Progress sin métrica |
| Activos.tsx | ALTA | Sin skeleton, sin dark mode, sin animación modal |
| **MEDIAS** | | |
| Bodega.tsx | MEDIA | Sin skeleton, focus rings hardcodeados |
| CurvasS.tsx | MEDIA | Sin skeleton |
| Cotizaciones.tsx | MEDIA | Sin skeleton, focus rings |
| CuentasCobrar.tsx | MEDIA | Sin skeleton, focus rings |
| CuentasPagar.tsx | MEDIA | Sin skeleton, focus rings |
| Auditoria.tsx | MEDIA | Sin skeleton |
| Ajustes.tsx | MEDIA | Sin skeleton |
| **BAJAS** | | |
| EntradasAlmacenOC.tsx | BAJA | Sin skeleton, focus rings |
| LogisticaCompras.tsx | BAJA | Sin skeleton, sin animación modal |
| OrdenesCambio.tsx | BAJA | Sin skeleton |
| PlanillaDestajos.tsx | BAJA | Sin skeleton, sin animación modal |
| PlantillasProyectos.tsx | BAJA | Sin skeleton, focus rings |
| Proyectos.tsx | BAJA | Sin skeleton |
| Riesgos.tsx | BAJA | Sin skeleton |
| RRHH.tsx | BAJA | Sin skeleton |
| SSOCalidad.tsx | BAJA | Sin skeleton |
| Weather.tsx | BAJA | Sin skeleton, colores hardcodeados |
| CalidadCumplimiento.tsx | BAJA | Sin skeleton |
| ComercialFinanzas.tsx | BAJA | Sin skeleton, sin animación modal |
| Cuadros.tsx | BAJA | Sin skeleton, focus rings |
| DashboardPredictivo.tsx | BAJA | Sin skeleton |
| ErrorLog.tsx | BAJA | Sin skeleton |
| ExportacionInteligente.tsx | BAJA | Sin skeleton |
| GestionDocumental.tsx | BAJA | Sin skeleton, botones hardcodeados |
| Impuestos.tsx | BAJA | Sin skeleton |
| MuroObra.tsx | BAJA | Sin skeleton, colores hardcodeados |
| Notificaciones.tsx | BAJA | Sin skeleton, sin dark mode |
| **NO IMPLEMENTADOS AÚN** | | |
| Materiales.tsx | - | Screen no existe |
| Proveedores.tsx | - | Screen no existe |
| CentrosCosto.tsx | - | Screen no existe |
| Destajos.tsx | - | Screen no existe |

### Total screens: 43
- Implementadas: 43
- Con skeleton: 8 (prioritarias)
- Sin skeleton: 35 (pendientes)

### Próxima sesión - Acciones recomendadas

1. **CRÍTICO**: Corregir `updateProyectoWeather` en zustandStore.ts
2. **CRÍTICO**: Migrar datos locales de localStorage a store (Administracion, ComercialFinanzas, RendimientoCampo)
3. **CRÍTICO**: Agregar dark mode variants a APUAvanzado.tsx
4. **ALTO**: Agregar skeletons a screens prioritarias (Presupuestos, Hitos, RendimientoCampo)
5. **ALTO**: Agregar gráficos a Presupuestos.tsx, Hitos.tsx, RendimientoCampo.tsx

---

## Notas para Implementación

### Orden sugerido de implementación
1. **FIX 1**: Charts.tsx — eliminar truncamiento (impacta todos los gráficos financieros) ✅
2. **FIX 2**: SeguimientoAnalysisPanel — reemplazar placeholder ✅ (ya implementado)
3. **FIX 3**: updateProyectoWeather — agregar enqueueMutation
4. **FIX 4**: Colores dark mode (APUAvanzado, BasePrecios, CRM, etc.)
5. **FIX 5**: Skeletons en screens prioritarias ✅ (ya implementados)
6. **FIX 6**: Modales con animación
7. **FIX 7**: Focus rings unificados
8. **FIX 8**: KPIs Dashboard ✅ (ya implementados)
9. **FIX 9**: Gráficos Presupuestos, Hitos, RendimientoCampo
10. **FIX 10+**: Issues bajos

### Verificación post-cambio
- Ejecutar `npm run build` para verificar que no hay errores de compilación
- Verificar tests: `npm run test`
- No hay test específico para la mayoría de estos fixes — verificar visualmente

### Advertencias
- El FIX 4 (migrar datos al store) requiere migración de datos: leer datos actuales de localStorage y escribirlos al store con la estructura correcta
- El FIX 19 (dos temas) requiere análisis antes de implementar — no hacer hasta entender la interacción completa
