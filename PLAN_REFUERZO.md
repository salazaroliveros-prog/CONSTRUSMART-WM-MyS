# Plan de Refuerzo — Correcciones Inmediatas

> Auditoría completa del código fuente el 2026-06-02.
> 25 hallazgos clasificados por severidad. Este documento detalla paso a paso cómo corregir cada uno.
>
> **ESTADO ACTUAL (05/06/2026):** ✅ Todos los Fix 1-16 han sido implementados y verificados. Build exitoso, 76/76 tests pasando. Este documento se mantiene como referencia histórica de las correcciones realizadas.

---

## 🔴 LOTE 1 — Bugs Activos en Runtime

### Fix 1: Unificar `subrenglones` → `subRenglones`

**Problema:** `types.ts:60` define `subRenglones` (R mayúscula) pero `Presupuestos.tsx` usa `subrenglones` (r minúscula) en 18 lugares. En runtime, `r.subrenglones` siempre es `undefined` porque el campo real se llama `subRenglones`.

**Archivos:** `src/erp/screens/Presupuestos.tsx`, `src/erp/screens/Seguimiento.tsx`

**Acción:** Reemplazar todas las ocurrencias de `subrenglones` por `subRenglones`.

```bash
# Verificar todas las ocurrencias actuales
rg -n 'subrenglones' src/
```

En `Presupuestos.tsx` — cambiar en:
- Línea 102: `subrenglones: []` → `subRenglones: []`
- Línea 106: `subrenglones: []` → `subRenglones: []`
- Línea 116: `subrenglones:` → `subRenglones:`
- Línea 117: `subrenglones` → `subRenglones` (2 veces)
- Línea 174: `subrenglones` → `subRenglones` (2 veces)
- Línea 175: `subrenglones` → `subRenglones` (2 veces)
- Línea 176: `subrenglones:` → `subRenglones:`
- Línea 181: `subrenglones` → `subRenglones` (2 veces)
- Línea 182: `subrenglones` → `subRenglones` (2 veces)
- Línea 197: `subrenglones` → `subRenglones`
- Línea 198: `subrenglones` → `subRenglones`
- Línea 474: `subrenglones` → `subRenglones` (2 veces)
- Línea 476: `subrenglones` → `subRenglones` (2 veces)

En `Seguimiento.tsx` — línea 88: `subrenglones` → `subRenglones`

En `GanttChart.tsx` — línea 15: la interface local también debe usar `subRenglones` para consistencia.

**Verificación:**
```bash
npx tsc --noEmit --strict
# No debe haber errores relacionados con 'subrenglones' o 'subRenglones'
```

---

### Fix 2: Importar `Proyecto` en `Proyectos.tsx`

**Problema:** `Proyectos.tsx:111` usa el tipo `Proyecto` en `openEdit(p: Proyecto)` pero no lo importa.

**Archivo:** `src/erp/screens/Proyectos.tsx`

**Acción:** Agregar `Proyecto` al import de types.

```typescript
// Línea 6 — ANTES:
import { Tipologia } from '../types';

// Línea 6 — DESPUÉS:
import { Tipologia, Proyecto } from '../types';
```

---

### Fix 3: Migrar Presupuestos a la Mutation Queue

**Problema:** `store.tsx:667-716` — `addPresupuesto`, `updatePresupuesto`, `deletePresupuesto` llaman a Supabase directamente sin pasar por `enqueueMutation`. Datos creados offline se pierden.

**Archivo:** `src/erp/store.tsx`

**Acción:** Reemplazar los 3 métodos para que usen `enqueueMutation` como el resto del store.

```typescript
// ANTES (~línea 667):
const addPresupuesto = useCallback(async (p: Omit<Presupuesto, 'id'>) => {
  const newPresupuesto: Presupuesto = { ...p, id: uid() };
  if (isOnline) {
    const { error } = await supabase.from('erp_presupuestos').insert([newPresupuesto]);
    if (error) { console.error('Error:', error); return; }
  }
  setPresupuestos(s => [...s, newPresupuesto]);
  try { await updateProyecto(p.proyectoId, { presupuestoActualId: newPresupuesto.id, presupuestoTotal: newPresupuesto.totalCalculado }); }
  catch (err) { console.error('Error actualizando proyecto:', err); }
  saveToStorage(STORAGE_KEY + '_presupuestos', presupuestos);
}, [presupuestos, updateProyecto, isOnline]);

// DESPUÉS:
const addPresupuesto = useCallback(async (p: Omit<Presupuesto, 'id'>) => {
  const newPresupuesto: Presupuesto = { ...p, id: uid() };
  enqueueMutation({ type: 'addPresupuesto', payload: newPresupuesto, timestamp: Date.now() });
  setPresupuestos(s => [...s, newPresupuesto]);
  try { await updateProyecto(p.proyectoId, { presupuestoActualId: newPresupuesto.id, presupuestoTotal: newPresupuesto.totalCalculado }); }
  catch (err) { console.error('Error actualizando proyecto:', err); }
  saveToStorage(STORAGE_KEY + '_presupuestos', [...presupuestos, newPresupuesto]);
}, [presupuestos, updateProyecto, enqueueMutation]);
```

Hacer lo mismo para `updatePresupuesto` y `deletePresupuesto`.

Luego agregar los casos en `processQueue` (~línea 414):

```typescript
// Agregar dentro de processQueue, después del case 'addLicitacion':
case 'addPresupuesto': {
  const { error } = await supabase.from('erp_presupuestos').insert([m.payload]);
  if (error) throw error;
  break;
}
case 'updatePresupuesto': {
  const { error } = await supabase.from('erp_presupuestos').update(m.payload).eq('id', (m.payload as any).id);
  if (error) throw error;
  break;
}
case 'deletePresupuesto': {
  const { error } = await supabase.from('erp_presupuestos').delete().eq('id', m.payload);
  if (error) throw error;
  break;
}
```

Y agregar los tipos al union type `Mutation['type']` (~línea 23):

```typescript
// Agregar al tipo:
| 'addPresupuesto'
| 'updatePresupuesto'
| 'deletePresupuesto'
```

**Verificación:**
```bash
npx tsc --noEmit
# Sin errores
```

---

### Fix 4: Agregar casos de Avances y Licitaciones en processQueue

**Problema:** `addAvance`/`deleteAvance` no existen como tipos en `Mutation` (línea 822-832), y las mutaciones de licitaciones se encolan pero `processQueue` no tiene casos para ejecutarlas.

**Archivo:** `src/erp/store.tsx`

**Acción:** Agregar los tipos faltantes y los casos en processQueue.

```typescript
// En el tipo Mutation (~línea 23), agregar:
| 'addAvance'
| 'deleteAvance'

// En processQueue (~línea 414), agregar:
case 'addAvance': {
  const { error } = await supabase.from('erp_avances').insert([m.payload]);
  if (error) throw error;
  break;
}
case 'deleteAvance': {
  const { error } = await supabase.from('erp_avances').delete().eq('id', m.payload);
  if (error) throw error;
  break;
}
case 'addLicitacion': {
  const { error } = await supabase.from('erp_licitaciones').insert([m.payload]);
  if (error) throw error;
  break;
}
case 'updateLicitacion': {
  const { error } = await supabase.from('erp_licitaciones').update(m.payload).eq('id', (m.payload as any).id);
  if (error) throw error;
  break;
}
case 'deleteLicitacion': {
  const { error } = await supabase.from('erp_licitaciones').delete().eq('id', m.payload);
  if (error) throw error;
  break;
}
```

---

### Fix 5: Fix Race Condition en processQueue

**Problema:** `store.tsx:397` — la mutación se elimina de la cola antes de que Supabase responda.

**Archivo:** `src/erp/store.tsx`

**Acción:** Mover `setMutationQueue(rest)` dentro del `try` después del `await`, no antes.

```typescript
// ANTES (~línea 395-400):
const [current, ...rest] = queue;
setMutationQueue(rest);  // ← Se elimina ANTES de ejecutar
try {
  await executeMutation(current);
  // ...
} catch (err) {
  setMutationQueue(queue);  // Re-encola
}

// DESPUÉS:
const [current, ...rest] = queue;
try {
  await executeMutation(current);
  setMutationQueue(rest);  // ← Se elimina DESPUÉS de ejecutar con éxito
  // ...
} catch (err) {
  // No se modifica la cola — el reintento natural la mantiene
}
```

---

### Fix 6: Corregir Coordenadas en Proyectos

**Problema:** `Proyectos.tsx:87-88` genera coordenadas aleatorias. Los proyectos no tienen ubicación real.

**Archivo:** `src/erp/screens/Proyectos.tsx`

**Acción:** Agregar campos `lat`/`lng` opcionales al formulario de proyecto y eliminarlos de la seed.

```typescript
// En el schema Zod (~línea 15), agregar:
lat: z.coerce.number().optional(),
lng: z.coerce.number().optional(),

// En el formulario, agregar campos de lat/lng o un mapa para seleccionar ubicación
// ... o dejar el valor por defecto como null/undefined

// En la seed data (data.ts), quitar Math.random() y usar null
```

---

## 🟠 LOTE 2 — UX Robusta y Prevención de Pérdida

### Fix 7: Error Boundary Global

**Archivo:** Crear `src/components/ErrorBoundary.tsx`

```tsx
import React from 'react';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Algo salió mal</h1>
            <p className="text-slate-500 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="bg-orange-500 text-white px-6 py-2 rounded-xl"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

Envolver en `AppLayout.tsx`:
```tsx
import { ErrorBoundary } from '../components/ErrorBoundary';
// ...
<ErrorBoundary>{currentScreen}</ErrorBoundary>
```

---

### Fix 8: Lazy Loading para todas las Screens

**Archivo:** `src/components/AppLayout.tsx`

**Antes:** 27 imports estáticos. **Después:** todos con `React.lazy()`.

```tsx
// PATRÓN — repetir para cada screen:
const Dashboard = React.lazy(() => import('../erp/screens/Dashboard'));
const Proyectos = React.lazy(() => import('../erp/screens/Proyectos'));
// ... etc

// Envolver currentScreen en Suspense:
<Suspense fallback={
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
  </div>
}>
  {currentScreen}
</Suspense>
```

---

### Fix 9: Agregar `plugins` en `vite.config.ts`

**Archivo:** `vite.config.ts`

```typescript
import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode: _mode }) => ({
  plugins: [react()],  // ← AGREGAR ESTO
  base: "/",
  server: {
    host: "::",
    port: 8080,
  },
  // ... resto igual
}));
```

---

## 🟡 LOTE 3 — Consistencia de Tipos y Datos

### Fix 10: Sincronizar `CATEGORIA_LABEL` con tipo `Categoria`

**Archivo:** `src/erp/utils.ts`

```typescript
// Hacer que CATEGORIA_LABEL tenga EXACTAMENTE las mismas keys que Categoria
export const CATEGORIA_LABEL: Record<Categoria, string> = {
  materiales: 'Materiales',
  mano_obra: 'Mano de Obra',
  equipo: 'Equipo',
  subcontrato: 'Subcontrato',
  administracion: 'Administración',
  transporte: 'Transporte',
  imprevistos: 'Imprevistos',
  marketing: 'Marketing',
  licencias: 'Licencias',
  seguros: 'Seguros',
  otros: 'Otros',
};
```

### Fix 11: Hacer `saveToStorage` resiliente

**Archivo:** `src/erp/store.tsx`

```typescript
// Línea 137 — ANTES:
const saveToStorage = (key: string, data: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
};

// DESPUÉS:
const saveToStorage = (key: string, data: unknown) => {
  try {
    // Limpiar entries antiguas si hay problema de cuota
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
  } catch (e) {
    console.warn(`localStorage lleno, limpiando cachés viejas...`);
    // Limpiar solo keys con prefijo wm_ que no sean las principales
    Object.keys(localStorage)
      .filter(k => k.startsWith('wm_') && k !== STORAGE_KEY + '_proyectos')
      .forEach(k => localStorage.removeItem(k));
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch { /* si aún falla, el dato se pierde pero no explota */ }
  }
};
```

### Fix 12: Agregar validación Zod en `mapFromSnakeCase`

**Archivo:** `src/erp/store.tsx`

Crear schemas Zod para cada entidad que viene de Supabase y validar en `fetchInitialData`:

```typescript
// Ejemplo para proyectos:
const ProyectoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  cliente: z.string(),
  // ... demás campos
});

// En fetchInitialData:
const parsed = ProyectoSchema.safeParse(data);
if (!parsed.success) {
  console.warn('Proyecto inválido de Supabase:', parsed.error);
  return;  // Saltar este registro en lugar de romperse
}
```

### Fix 13: Sincronizar interfaces `types.ts` con semillas `data.ts`

Revisar y alinear estos mismatches:

| Interface | Campo en types.ts | Campo en data.ts | Acción |
|-----------|-------------------|-------------------|--------|
| `Proyecto` | (no tiene) | `lat`, `lng` | Agregar a interface como opcionales |
| `Empleado.tipo` | `'administrativo' \| 'operativo'` | `'planilla' \| 'destajo'` | Unificar a un solo estándar |
| `Material.precioUnitario` | `precioUnitario` | `precio` | Unificar a `precioUnitario` |
| `OrdenCompra` | `{ proveedorId, items[], total }` | `{ proveedor, material, cantidad, monto }` | Rediseñar interface o semillas |
| `RenglonBase` | (no tiene) | `tipologia, costoMateriales, costoManoObra, costoEquipo, insumos` | Agregar campos faltantes como opcionales |

---

## 🔵 LOTE 4 — Mantenibilidad

### Fix 14: tsconfig estricto

**Archivo:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

*Nota:* Puede generar errores nuevos. Corregirlos uno por uno.

### Fix 15: Eliminar imports no usados

| Archivo | Import | Acción |
|---------|--------|--------|
| `Dashboard.tsx` | `useMemo` (si no se usa) | Eliminar |
| `Proyectos.tsx` | `ChevronDown` | Eliminar |
| `Sidebar.tsx` | `Wrench` | Eliminar |
| `Presupuestos.tsx` | `CubicacionAutomatica`, `HistorialPresupuestosModal` | Eliminar si no se usan |

### Fix 16: Actualizar dependencias

```bash
npm install web-ifc@latest react-signature-canvas@latest
npm remove @typescript-eslint/parser  # redundante con typescript-eslint
```

---

## ✅ CHECKLIST DE VERIFICACIÓN POST-FIX

```bash
# 1. TypeScript estricto sin errores
npx tsc --noEmit --strict

# 2. Linter sin errores
npm run lint

# 3. Build exitoso
npm run build

# 4. Tests
npm run test
```

**Pruebas manuales para el Fix 1 (crítico):**
1. Abrir Presupuestos
2. Agregar un renglón
3. Expandirlo
4. Agregar un sub-renglón/material
5. Verificar que aparece en la UI y en el resumen
6. Guardar y recargar: verificar que persiste

---

## 📊 ESTIMACIÓN DE ESFUERZO

| Lote | Fixes | Tiempo estimado |
|------|-------|-----------------|
| 🔴 LOTE 1 | 6 bugs críticos | 2-3 horas |
| 🟠 LOTE 2 | 3 mejoras UX/rendimiento | 1-2 horas |
| 🟡 LOTE 3 | 4 consistencias de tipos | 1-2 horas |
| 🔵 LOTE 4 | 3 mantenibilidad | 30 min |
| **Total** | **16 correcciones** | **5-8 horas** |

---

**Orden recomendado de ejecución:** Fix 1 → Fix 2 → Fix 9 → Fix 3 → Fix 4 → Fix 5 → Fix 6 → Fix 7 → Fix 8 → Fix 10 → Fix 11 → Fix 12 → Fix 13 → Fix 14 → Fix 15 → Fix 16
