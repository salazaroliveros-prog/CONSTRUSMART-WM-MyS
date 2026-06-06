# ⚡ GUÍA DE IMPLEMENTACIÓN RÁPIDA
## ERP CONSTRUSMART — Copy-Paste Ready

**Objetivo:** Terminar FASE 1 en ~9 horas  
**Scope:** 4 archivos, 4 acciones críticas  
**Validación:** npm run test + build

---

## 📝 ESTRUCTURA

```
├── ACCIÓN 1: Zod en 3 pantallas (3h)
├── ACCIÓN 2: Sanitización centralizada (1h)
├── ACCIÓN 3: Fijar useEffect (3h)
└── ACCIÓN 4: Audit de rutas (2h)
```

---

## 🔧 ACCIÓN 1: AGREGAR ZOD EN 3 PANTALLAS

### Archivo 1/3: LogisticaCompras.tsx

**Ubicación:** `src/erp/screens/LogisticaCompras.tsx`

**PASO 1 — Agregar imports (línea 1-5):**
```typescript
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
```

**PASO 2 — Copiar schema (después de imports):**
```typescript
const logisticaSchema = z.object({
  proveedor: z.string().min(1, 'Proveedor requerido'),
  material: z.string().min(1, 'Material requerido'),
  cantidad: z.coerce.number().positive('Cantidad debe ser > 0'),
  monto: z.coerce.number().min(0, 'Monto válido'),
  fecha: z.string().refine(
    d => !isNaN(Date.parse(d)),
    'Fecha válida requerida'
  ),
});
type LogisticaFormData = z.infer<typeof logisticaSchema>;
```

**PASO 3 — En componente (dentro de función, después de useErp()):**
```typescript
const { register, handleSubmit, formState: { errors } } = useForm<LogisticaFormData>({
  resolver: zodResolver(logisticaSchema),
  defaultValues: {
    proveedor: '',
    material: '',
    cantidad: 0,
    monto: 0,
    fecha: '',
  }
});

const onSubmit = (data: LogisticaFormData) => {
  console.log('Valid data:', data);
  // llamar a addOrden, etc
};
```

**PASO 4 — En JSX de form (reemplazar input manual):**
```tsx
{/* Antes: <input type="text" onChange={...} /> */}
{/* Después: */}
<input {...register('proveedor')} placeholder="Proveedor" className={INPUT} />
{errors.proveedor && <p className="text-xs text-destructive">{errors.proveedor.message}</p>}

<input {...register('material')} placeholder="Material" className={INPUT} />
{errors.material && <p className="text-xs text-destructive">{errors.material.message}</p>}

<input {...register('cantidad')} type="number" placeholder="Cantidad" className={INPUT} />
{errors.cantidad && <p className="text-xs text-destructive">{errors.cantidad.message}</p>}

<input {...register('monto')} type="number" placeholder="Monto Q" className={INPUT} />
{errors.monto && <p className="text-xs text-destructive">{errors.monto.message}</p>}

<input {...register('fecha')} type="date" className={INPUT} />
{errors.fecha && <p className="text-xs text-destructive">{errors.fecha.message}</p>}
```

**PASO 5 — En submit button:**
```tsx
<button 
  type="submit" 
  onClick={handleSubmit(onSubmit)}
  className={BUTTON_PRIMARY}
>
  Guardar
</button>
```

**TEST:**
```bash
# Intentar submit sin llenar
# → Deben aparecer errores inline
```

**Tiempo:** ~20 min

---

### Archivo 2/3: SSOCalidad.tsx

**Ubicación:** `src/erp/screens/SSOCalidad.tsx`

Repetir pasos 1-5 con schema:
```typescript
const ssoSchema = z.object({
  fecha: z.string().refine(d => !isNaN(Date.parse(d)), 'Fecha válida'),
  proyecto: z.string().min(1, 'Proyecto requerido'),
  items: z.array(z.object({
    descripcion: z.string().min(1, 'Descripción requerida'),
    cumple: z.boolean(),
  })).min(1, 'Mínimo 1 item'),
  observaciones: z.string().optional(),
});
type SSOFormData = z.infer<typeof ssoSchema>;
```

**Tiempo:** ~20 min

---

### Archivo 3/3: GestionDocumental.tsx

**Ubicación:** `src/erp/screens/GestionDocumental.tsx`

Schema:
```typescript
const docSchema = z.object({
  titulo: z.string().min(1, 'Título requerido'),
  tipo: z.enum(['plano', 'rfi', 'submittal', 'otro']),
  archivo: z.string().min(1, 'Archivo requerido'),
  version: z.coerce.number().positive('Versión > 0'),
  descripcion: z.string().optional(),
});
type DocFormData = z.infer<typeof docSchema>;
```

**Tiempo:** ~20 min

---

**ACCIÓN 1 TOTAL:** ~1h

---

## 🛡️ ACCIÓN 2: SANITIZACIÓN CENTRALIZADA

**Ubicación:** `src/erp/store.tsx` (función `fetchInitialData`, línea ~615)

**ANTES:**
```typescript
if (p?.length) setProyectos(
  p.map(obj => mapFromSnakeCase(proyectoSchema, obj))
   .filter(Boolean) as Proyecto[]
);
```

**DESPUÉS:**
```typescript
const safeProyectos = (p ?? [])
  .map(obj => {
    const sanitized = sanitizarObjeto(obj);
    const parsed = mapFromSnakeCase(proyectoSchema, sanitized);
    return parsed;
  })
  .filter(Boolean) as Proyecto[];
if (safeProyectos.length > 0) setProyectos(safeProyectos);
```

Repetir para CADA tabla:
- erp_movimientos → movimientoSchema
- erp_empleados → empleadoSchema
- erp_materiales → materialSchema
- erp_ordenes_compra → ordenCompraSchema
- erp_proveedores → proveedorSchema
- erp_eventos_calendario → eventoCalendarioSchema
- erp_bitacora → bitacoraEntrySchema
- erp_presupuestos → presupuestoSchema

**Verificar import:** (línea 5+)
```typescript
import { sanitizarObjeto, sanitizarTexto, getServerRole } from '@/lib/security';
```

**Patrón (copiar para cada tabla):**
```typescript
if (m?.length) {
  const safeMovimientos = m
    .map(obj => mapFromSnakeCase(movimientoSchema, sanitizarObjeto(obj)))
    .filter(Boolean) as Movimiento[];
  if (safeMovimientos.length > 0) setMovimientos(safeMovimientos);
}
```

**ACCIÓN 2 TOTAL:** ~1h

---

## 🔄 ACCIÓN 3: FIJAR useEffect DEPENDENCIES

**Ubicación:** `src/erp/store.tsx` (línea 809-820)

**PASO 1 — Crear ref (después de otras refs, ~línea 780):**
```typescript
const userIdRef = useRef(user?.id);
```

**PASO 2 — Agregar efecto de tracking (antes del role check interval):**
```typescript
useEffect(() => {
  userIdRef.current = user?.id;
}, [user?.id]);
```

**PASO 3 — Reemplazar interval useEffect (línea 809):**

**ANTES:**
```typescript
useEffect(() => {
  if (!isOnline) {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    return;
  }
  if (!user?.id) return;
  const check = async () => {
    try {
      const serverRole = await getServerRole();
      if (serverRole?.rol && serverRole.rol !== lastRolRef.current) {
        lastRolRef.current = serverRole.rol as Rol;
        setUser(prev => prev ? { ...prev, rol: lastRolRef.current! } : prev);
      }
    } catch { /* silent */ }
  };
  check();
  intervalRef.current = setInterval(check, 30000);
  return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
}, [isOnline, user?.id]);  // ⚠️ PROBLEMA
```

**DESPUÉS:**
```typescript
useEffect(() => {
  if (!isOnline) {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    return;
  }
  if (!userIdRef.current) return;  // usar ref
  
  const check = async () => {
    try {
      const serverRole = await getServerRole();
      if (serverRole?.rol && serverRole.rol !== lastRolRef.current) {
        lastRolRef.current = serverRole.rol as Rol;
        setUser(prev => prev ? { ...prev, rol: lastRolRef.current! } : prev);
      }
    } catch { /* silent */ }
  };
  
  check();
  intervalRef.current = setInterval(check, 30000);
  return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
}, [isOnline]);  // ✅ FIJO — solo isOnline
```

**PASO 4 — Buscar otros useEffect problemáticos:**
```bash
# En terminal:
grep -n "useEffect" src/erp/store.tsx | head -20
```

Para cada uno: revisar que no tenga función/callback en dependencies sin stabilizar con useCallback

**Patrón para otros effects:**
```typescript
// ❌ MALO
useEffect(() => {
  fetchData();
}, [fetchData]);  // fetch cambió de referencia

// ✅ BUENO
useEffect(() => {
  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;
  // ...
}, []);  // sin deps

// O mejor:
const fetchDataMemo = useCallback(() => {
  // ...
}, []);
useEffect(() => {
  fetchDataMemo();
}, [fetchDataMemo]);
```

**ACCIÓN 3 TOTAL:** ~3h

---

## 🗺️ ACCIÓN 4: AUDIT DE RUTAS

**Ubicación:** Múltiples archivos

**PASO 1 — Verificar vistas en store.tsx (línea 47-48):**

```bash
# Ver cuántas vistas hay
grep -o "'[a-z-]*'" src/erp/store.tsx | grep -v "'id'\|'tipo'\|'estado' | sort -u | wc -l
```

Esperado: ~34 vistas

**PASO 2 — Verificar lazy imports en AppLayout.tsx:**

```typescript
// Debe haber una línea por vista:
const Dashboard = lazy(() => import('@/erp/screens/Dashboard'));
const Proyectos = lazy(() => import('@/erp/screens/Proyectos'));
const Presupuestos = lazy(() => import('@/erp/screens/Presupuestos'));
// ... etc
```

```bash
grep -c "lazy(() => import" src/components/AppLayout.tsx
# Debe ser >= 32
```

**PASO 3 — Verificar switch statement en render:**

```bash
grep -c "case '" src/components/AppLayout.tsx
# Debe coincidir con número de lazy imports
```

**PASO 4 — Si faltan vistas, crear stubs:**

Para cada vista faltante:
```typescript
// src/erp/screens/MissingView.tsx
import React from 'react';

export default function MissingView() {
  return (
    <div className="p-6">
      <h1>Vista no implementada</h1>
      <p>Esta sección está en desarrollo</p>
    </div>
  );
}
```

**PASO 5 — Agregar a AppLayout.tsx:**

```typescript
const MissingView = lazy(() => import('@/erp/screens/MissingView'));

// En switch:
case 'missing-view': return <MissingView />;
```

**PASO 6 — Verificar README.md tabla coincida:**

Tabla "Módulos del Sistema" debe tener 18 items ✅

**ACCIÓN 4 TOTAL:** ~2h

---

## ✅ VALIDACIÓN FINAL

```bash
# Compilar
npm run build
# Debe: 0 errores, 0 warnings

# Tests
npm run test
# Debe: 76/76 pasando

# Lint
npm run lint
# Debe: 0 warnings críticos

# Dev server
npm run dev
# Navigar por cada pantalla → sin errores en console
```

---

## 📋 CHECKLIST EOD VIERNES

```
ZOD VALIDATION
- [ ] LogisticaCompras.tsx + test
- [ ] SSOCalidad.tsx + test
- [ ] GestionDocumental.tsx + test

SANITIZACIÓN
- [ ] 8 tablas con sanitizarObjeto()
- [ ] Import verificado

USEEFFECT
- [ ] userIdRef creado
- [ ] Tracking effect agregado
- [ ] Role check interval arreglado
- [ ] Otros effects revisados

RUTAS
- [ ] Vistas contadas
- [ ] Lazy imports verificados
- [ ] Switch statement completo
- [ ] README.md sincronizado

BUILD & TEST
- [ ] npm run build → 0 errores
- [ ] npm run test → 76/76
- [ ] npm run lint → 0 warnings
- [ ] npm run dev → sin errores

COMMIT
- [ ] git add .
- [ ] git commit -m "fix(security+stability): add Zod validation, sanitization, fix useEffect deps"
- [ ] git push origin fix/audit-critical-phase1
```

---

## 🆘 Si Hay Problemas

### Error: "Cannot find module 'zod'"
```bash
npm install zod react-hook-form @hookform/resolvers
```

### Error: "sanitizarObjeto is not defined"
Verificar import en línea 5 de store.tsx:
```typescript
import { sanitizarObjeto, sanitizarTexto, getServerRole } from '@/lib/security';
```

### Tests fallan después de cambios
```bash
npm run test -- --watch
# Revisar cada fallo
# Probablemente types nuevos en forms
```

### "useEffect has missing dependency"
Agregar a `.eslintignore` si es falso positivo:
```
// eslint-disable-next-line react-hooks/exhaustive-deps
```

Pero PREFERIR arreglarlo de verdad usando refs/useCallback

---

## 🚀 GO LIVE CHECKLIST (Post FASE 1)

```
SECURITY
- [ ] Todos inputs validados
- [ ] Sin XSS en console
- [ ] RLS verificado en Supabase

PERFORMANCE
- [ ] DevTools Memory: no sube continuamente
- [ ] Profiler: < 20ms render time
- [ ] Scroll: 60 FPS

QUALITY
- [ ] Tests pasando
- [ ] Build sin warnings
- [ ] Lighthouse > 80
```

---

**Tiempo total:** ~9 horas
**Equipo:** 1-2 developers
**Deadline:** EOD Viernes
**Status:** ✅ Listo para implementar

