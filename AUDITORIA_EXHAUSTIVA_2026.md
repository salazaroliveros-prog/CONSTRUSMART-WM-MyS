# AUDITORÍA EXHAUSTIVA — CONSTRUSMART ERP
**Fecha:** 2026-06-08  
**Tipo:** Mapeo completo de código fuente, conexiones, flujos, vulnerabilidades y plan de mejoras  
**Estado:** 🔍 ANÁLISIS COMPLETO — Plan de implementación incluido

---

## RESUMEN EJECUTIVO

El sistema tiene una base sólida pero acumula deuda técnica de sesiones anteriores que generó inconsistencias entre:
- Estado del store y lo expuesto en el contexto
- Módulos con UI pero sin datos reales conectados
- Datos de empresa hardcodeados que nunca se personalizaron
- Módulo Cotizaciones con mutaciones reutilizando claves equivocadas de Licitaciones
- EMPRESA sin dirección, teléfono ni NIT (aparece vacío en PDFs)
- addValeSalida no valida stock (la validación P1 fue eliminada en refactor)
- Sidebar no incluye `cotizaciones` en ITEMS (el módulo está en AppLayout pero invisible en nav)

---

## PARTE 1 — HALLAZGOS CRÍTICOS (BUGS ACTIVOS)

### BUG-01: Cotizaciones usa mutaciones de Licitaciones (CRÍTICO)
**Archivo:** `src/erp/store.tsx` — handleAddCotizacion / handleUpdateCotizacion / handleDeleteCotizacion  
**Problema:** Las 3 funciones encolan `'addLicitacion'`, `'updateLicitacion'`, `'deleteLicitacion'` en vez de una clave propia.  
Resultado: cuando se sincroniza con Supabase, las cotizaciones se intentan escribir en `erp_licitaciones`.

```typescript
// ACTUAL (MAL):
const handleAddCotizacion = useCallback(async (c) => {
  enqueueMutation('addLicitacion', nuevo);  // ← INCORRECTO
}, []);

// CORRECTO:
enqueueMutation('addCotizacion', nuevo);
```

**Fix requerido:**
1. Agregar tipos de mutación `'addCotizacion' | 'updateCotizacion' | 'deleteCotizacion'` al union type `Mutation['type']`
2. Agregar mapping en `tableMap` dentro de `forceSync`: `addCotizacion: 'cotizaciones_negocio'`
3. Cambiar las 3 enqueueMutation calls

---

### BUG-02: P1 — Stock validation ELIMINADA del addValeSalida (CRÍTICO)
**Archivo:** `src/erp/store.tsx` — handleAddValeSalida  
**Problema:** La función actual solo agrega el vale sin validar stock:
```typescript
const handleAddValeSalida = useCallback(async (v) => {
  const nuevo = { ...v, id: uid() };
  setValesSalida(prev => [nuevo, ...prev]);  // ← sin validación de stock
  enqueueMutation('addValeSalida', nuevo);
}, []);
```
La validación P1 documentada en REFERENCIA_TECNICA.md ya no existe en el código.

**Fix requerido:**
```typescript
const handleAddValeSalida = useCallback(async (v: Omit<ValeSalida, 'id'>) => {
  for (const item of v.items) {
    const mat = materiales.find(m => m.id === item.materialId);
    if (!mat || mat.stock < item.cantidad) {
      throw new Error(`Stock insuficiente: ${mat?.nombre ?? item.materialId} (disponible: ${mat?.stock ?? 0}, requerido: ${item.cantidad})`);
    }
  }
  const nuevo = { ...v, id: uid() };
  // Descontar stock inmediatamente
  v.items.forEach(item => {
    setMateriales(prev => prev.map(m =>
      m.id === item.materialId ? { ...m, stock: m.stock - item.cantidad } : m
    ));
  });
  setValesSalida(prev => [nuevo, ...prev]);
  enqueueMutation('addValeSalida', nuevo);
}, [materiales, enqueueMutation]);
```

---

### BUG-03: P2 — OC→Stock cascade ELIMINADA del updateOrden (CRÍTICO)
**Archivo:** `src/erp/store.tsx` — handleUpdateOrden  
**Problema:** La función solo actualiza el estado de la orden, sin incrementar stock:
```typescript
const handleUpdateOrden = useCallback(async (id, estado) => {
  setOrdenes(prev => prev.map(p => p.id === id ? { ...p, estado } : p));
  enqueueMutation('updateOrden', { id, estado });
}, []);
```

**Fix requerido:**
```typescript
const handleUpdateOrden = useCallback(async (id: string, estado: OrdenCompra['estado']) => {
  setOrdenes(prev => prev.map(p => p.id === id ? { ...p, estado } : p));
  if (estado === 'aprobado' || estado === 'recibida') {
    const orden = ordenes.find(o => o.id === id);
    if (orden?.items?.length) {
      orden.items.forEach(item => {
        setMateriales(prev => prev.map(m =>
          m.id === item.materialId ? { ...m, stock: m.stock + item.cantidad } : m
        ));
      });
    }
  }
  enqueueMutation('updateOrden', { id, estado });
}, [ordenes, enqueueMutation]);
```

---

### BUG-04: EMPRESA sin datos reales (datos vacíos en PDFs)
**Archivo:** `src/erp/utils.ts`  
**Problema:** El objeto EMPRESA no tiene dirección, teléfono, NIT ni email. Los PDFs muestran espacios vacíos o el placeholder `______`.

```typescript
// ACTUAL:
export const EMPRESA = {
  nombre: 'CONSTRUCTORA WM / M&S',
  eslogan: 'Edificando el Futuro',
};

// FALTA (campos necesarios para PDFs):
// direccion, telefono, nit, email, ciudad, pais
```

**Fix:** Ampliar EMPRESA con todos los campos y usarlos en exportCotizacionPDF.

---

### BUG-05: Sidebar no tiene ítem "Cotizaciones" (módulo invisible)
**Archivo:** `src/erp/components/Sidebar.tsx`  
**Problema:** El array ITEMS no incluye el módulo `cotizaciones`. El usuario nunca puede navegar desde el sidebar.

```typescript
// FALTA en ITEMS:
{ id: 'cotizaciones', label: 'Cotizaciones', icon: FileText, group: 'Principal' },
```

---

### BUG-06: addCotizacion en store pasa `createdAt`/`updatedAt` pero el handler los sobreescribe
**Archivo:** `src/erp/store.tsx` — handleAddCotizacion  
**Problema:** La firma del handler es `Omit<CotizacionCliente, 'id' | 'createdAt' | 'updatedAt'>` pero `Cotizaciones.tsx` llama `addCotizacion({ ...data, createdAt: now, updatedAt: now })` — TypeScript debería fallar pero no falla porque el tipo del parámetro en la pantalla usa `as any`.

---

### BUG-07: forceSync no tiene mapping para cotizaciones
**Archivo:** `src/erp/store.tsx` — tableMap dentro de forceSync  
**Problema:** `cotizaciones` y sus variantes no están en el `tableMap`, por lo que nunca se sincronizan a Supabase aunque tengan conexión activa.

---

## PARTE 2 — INCONSISTENCIAS DE FLUJO Y CONEXIONES

### INC-01: useSupabaseRealtime solo escucha 6 tablas en Shell
**Archivo:** `src/components/AppLayout.tsx`  
**Problema:** La suscripción real-time solo escucha:
```typescript
tablas: ['erp_proyectos', 'erp_movimientos', 'erp_empleados', 'erp_materiales', 'erp_notificaciones', 'erp_muro']
```
Faltan tablas críticas: `erp_presupuestos`, `erp_ordenes_compra`, `erp_avances`, `erp_vales_salida`, y la nueva `erp_cotizaciones_negocio`.  
El hook no actualiza el store cuando llegan cambios — el callback `onCambio` solo hace un `console.log`.

**Fix:** Conectar `onCambio` al store para actualizar estados o usar `fetchInitialData` selectivo.

---

### INC-02: fetchInitialData no existe / datos iniciales solo desde localStorage
**Archivo:** `src/erp/store.tsx`  
**Problema:** Toda la inicialización viene de `loadFromStorage()`. La función `setSnakeCaseStates` existe pero nunca es llamada desde ningún `useEffect` de carga inicial.  
Los datos de Supabase solo llegan por la cola de mutaciones (offline→online) pero nunca hay un fetch inicial al abrir la app.

**Fix:** Agregar useEffect de carga inicial que haga SELECT de todas las tablas al autenticarse.

---

### INC-03: Dashboard margenProm puede ser NaN
**Archivo:** `src/erp/screens/Dashboard.tsx` línea ~25  
**Problema:**
```typescript
const margenProm = activos.length
  ? activos.reduce((a, b) => a + ((b.montoContrato - b.presupuestoTotal) / b.montoContrato) * 100, 0) / activos.length
  : 0;
```
Si `b.montoContrato === 0`, la división produce `Infinity`. KpiCard mostraría `Infinity%`.

**Fix:** `b.montoContrato > 0 ? ((b.montoContrato - b.presupuestoTotal) / b.montoContrato) * 100 : 0`

---

### INC-04: avanceData en Dashboard genera arrays de longitud variable
**Archivo:** `src/erp/screens/Dashboard.tsx` líneas 34-56  
**Problema:** Las series `prog` y `real` comienzan con `[0]` y solo agregan elementos si hay avances. Si `avances.length === 0`, las series tienen solo 1 elemento mientras que `labels` tiene 8. Recharts puede crashear o mostrar gráfica vacía sin error claro.

---

### INC-05: Auto-trigger de forceSync con dependencias incorrectas
**Archivo:** `src/erp/store.tsx` useEffect línea ~675  
**Problema:**
```typescript
useEffect(() => {
  if (isOnline && mutationQueue.length > 0) {
    forceSync();
  }
}, [isOnline, mutationQueue.length]);
```
`forceSync` no está en el array de dependencias pero lo usa. Esto puede causar stale closure y ejecutar la versión antigua de forceSync.

**Fix:** Agregar `forceSync` a las dependencias o usar `useRef` para la función.

---

### INC-06: Módulos en ALLOWED pero sin pantalla registrada en screens
**Archivos:** `src/erp/store.tsx` (ALLOWED), `src/components/AppLayout.tsx` (screens)  
**Hallazgo:** Comparando ALLOWED vs screens:
- `ALLOWED` incluye: `'rendimientos'` → AppLayout tiene `rendimientos: <Rendimientos />` (alias de RendimientoCampo importado dos veces)
- La view `'rendimiento-campo'` también existe — hay duplicado del mismo componente con 2 IDs distintos

---

### INC-07: Módulos con datos en store pero sin UI vinculada
Los siguientes tienen estado en el store pero ninguna pantalla los consume directamente:
| Dato en store | Pantalla esperada | Estado |
|---|---|---|
| `subcontratos` | ninguna | Estado muerto (siempre `[]`) |
| `notifiedEventos` | ninguna | Solo para evitar notificaciones duplicadas |
| `seguimientoEVM` | Seguimiento.tsx | ✅ Conectado |
| `cotizacionesNegocio` | Cotizaciones.tsx | ⚠️ Conectado pero con bugs BUG-01/07 |

---

### INC-08: Tipo `OrdenCompra.estado` no incluye 'borrador' pero Bodega lo usa
**Archivo:** `src/erp/types.ts`  
**Problema:**
```typescript
estado: 'pendiente' | 'aprobado' | 'recibida' | 'rechazado' | 'cancelada';
```
En `Bodega.tsx`:
```typescript
addOrden({ ...data, estado: 'borrador', fecha: todayISO() });  // TypeScript debería fallar
```
Y en el schema del store:
```typescript
estado: z.enum(['borrador', 'pendiente', 'aprobado', 'recibida', 'rechazada', 'cancelada'])
```
`'borrador'` y `'rechazada'` no existen en el tipo. El schema tiene 'rechazada' y el tipo tiene 'rechazado' — inconsistencia de género.

---

### INC-09: `loadFromStorage` en store usa tipos no genéricos correctamente
**Archivo:** `src/erp/store.tsx`  
**Problema:** `loadFromStorage` no valida el schema al cargar — puede cargar datos corruptos directamente en el estado sin pasar por los schemas Zod. Si el localStorage contiene datos de una versión anterior con estructura diferente, puede crashear en runtime.

---

### INC-10: Dos schemas duplicados en el mismo archivo store.tsx
**Archivo:** `src/erp/store.tsx`  
**Problema:** El archivo importa schemas desde `./store/schemas` PERO también redefine inline los mismos schemas: `proveedorSchema`, `eventoCalendarioSchema`, `bitacoraEntrySchema`, etc.  
Los schemas importados y los inline compiten y el import puede ser sobreescrito por la redefinición local, causando comportamientos distintos en validación.

**Fix:** Eliminar todas las redefiniciones inline en store.tsx y usar solo los importados de `./store/schemas`.

---

## PARTE 3 — VULNERABILIDADES DE SEGURIDAD

### SEC-01: localStorage sin cifrado para datos sensibles
**Archivo:** `src/erp/store.tsx` — loadFromStorage / saveToStorage  
**Riesgo:** Datos de proyectos, contratos y clientes se guardan en texto plano en localStorage. En dispositivos compartidos o con extensiones maliciosas, pueden ser leídos.  
**Mitigación:** Para datos críticos usar sessionStorage o implementar cifrado básico con Web Crypto API.

---

### SEC-02: ADMIN_EMAIL hardcodeado en producción
**Archivo:** `src/erp/store.tsx`  
```typescript
const ADMIN_EMAIL = 'salazaroliveros@gmail.com';
```
El email del admin está expuesto en el bundle de producción. Cualquiera puede usarlo para forzar el rol Administrador si crea una cuenta con ese email en Supabase.  
**Fix:** Mover a variable de entorno y verificar el rol desde el perfil de Supabase, no desde el email.

---

### SEC-03: XSS potencial en Cotizaciones.tsx — importación de datos externos
**Archivo:** `src/erp/screens/Cotizaciones.tsx`  
**Problema:** `duplicarCotizacion` llama `addCotizacion(nueva as any)` sin sanitizar el contenido de `c.descripcion`, `c.alcance`, `c.notas`. Si el contenido fue inyectado desde un fuente externa, se propaga sin sanitizar.  
**Fix:** Pasar por `sanitizarObjeto()` antes de duplicar.

---

### SEC-04: enqueueMutation no sanitiza payload antes de encolar
**Archivo:** `src/erp/store.tsx` — enqueueMutation  
**Problema:** Llama `sanitizarObjeto(payload)` ✅ pero después de enqueuing, la serialización en `forceSync` con `toSnake()` no re-sanitiza, y el resultado va directo a Supabase. Si `sanitizarObjeto` no elimina tipos no serializables (funciones, undefined), `JSON.stringify` en el INSERT puede fallar silenciosamente.

---

### SEC-05: Sin rate limiting en operaciones masivas del store
**Problema:** Un usuario puede llamar `addMovimiento` en un loop desde DevTools sin ningún throttle. La cola puede llenarse y enviar cientos de mutations idénticas a Supabase.  
**Fix:** El hook `useRateLimit` existe en `src/hooks/useRateLimit.ts` pero no está siendo usado en el store.

---

## PARTE 4 — PROBLEMAS DE UI / FORMATO UNIFICADO

### UI-01: Módulo Cotizaciones falta botón de Exportar PDF en la lista
**Archivo:** `src/erp/screens/Cotizaciones.tsx`  
**Problema:** La función `exportCotizacionPDF` está implementada en `export.ts` pero no hay ningún botón en la pantalla de Cotizaciones que la llame.

---

### UI-02: Modal de Cotizaciones — scroll interno sin max-height consistente
**Archivo:** `src/erp/screens/Cotizaciones.tsx`  
El panel del modal usa `max-h-[70vh]` para el cuerpo pero el contenedor externo tiene `max-w-2xl` sin max-height, lo que puede hacer que el footer de botones quede fuera de pantalla en móvil.

---

### UI-03: Inconsistencia en estilos de KPIs entre módulos
Algunos módulos usan `CARD + KPI_CARD` de `ui.ts`, otros usan clases inline `bg-blue-50 text-blue-600 rounded-xl`. No hay uniformidad.  
Módulos afectados: Cotizaciones (usa inline), Dashboard (usa CARD), Bodega (mezcla).

---

### UI-04: Tokens de UI de `ui.ts` no cubren todos los casos
`ui.ts` define `BUTTON_PRIMARY`, `BUTTON_SECONDARY`, `BUTTON_DANGER`, `BUTTON_ICON` pero los módulos usan clases inline para botones de acción en tablas (ej: Enviar cotización, Duplicar). Falta `BUTTON_ACTION` o similar para botones pequeños en filas.

---

### UI-05: Sidebar — ítem cotizaciones faltante en navegación
Ya documentado en BUG-05. El módulo existe y tiene permiso, pero el usuario nunca lo ve en la barra lateral.

---

### UI-06: Dashboard — módulos de acceso rápido no incluyen Cotizaciones
**Archivo:** `src/erp/screens/Dashboard.tsx`  
El array `modulos` solo tiene 6 ítems hardcodeados. Cotizaciones no está incluida.

---

## PARTE 5 — MÓDULOS HUÉRFANOS / FUNCIONALIDAD NO CONECTADA

### HUE-01: `subcontratos` en store — nunca usado
El estado `subcontratos` se inicializa desde localStorage pero ningún módulo lo lee ni escribe. Es estado muerto que ocupa memoria.

### HUE-02: `rendimientos` en ALLOWED duplica `rendimiento-campo`
Ambos mapean al mismo componente `RendimientoCampo`. El ID `'rendimientos'` en ALLOWED y en Sidebar tiene label diferente pero carga el mismo screen.

### HUE-03: `useSyncSupabase.ts` hook existe pero no se usa
**Archivo:** `src/hooks/useSyncSupabase.ts`  
Implementa lógica de sincronización pero no está importado en ningún lugar. La sincronización real se hace directamente en `forceSync` del store.

### HUE-04: `store-health.ts` — funciones definidas pero nunca invocadas
**Archivo:** `src/lib/store-health.ts`  
El módulo tiene `checkStoreHealth`, `recoverStoreState`, `scheduleHealthCheck` pero no hay ningún archivo que los importe o llame. El sistema de auto-recuperación existe en código muerto.

### HUE-05: `useSessionTimeout.ts` no activa logout automático
**Archivo:** `src/hooks/useSessionTimeout.ts`  
Existe el hook pero no está siendo usado en `AppLayout.tsx` ni en ningún componente que guarde sesión activa.

### HUE-06: `src/lib/csrf.ts` — tokens CSRF generados pero nunca validados
El módulo genera tokens CSRF pero ninguna función de escritura al store los verifica.

### HUE-07: ErrorBoundary no wrappea pantallas individuales
**Archivo:** `src/components/ErrorBoundary.tsx`  
Existe pero en `AppLayout.tsx` el `<Suspense>` no está rodeado por `<ErrorBoundary>`. Un error en cualquier pantalla lazy-loaded crashea toda la app.

### HUE-08: `src/lib/safe-fetcher.ts` y `src/lib/safe-parse.ts` — sin uso
Implementan fetch seguro y parsing validado pero no se usan en el store (que hace fetches directos a Supabase).

---

## PARTE 6 — MIGRACIONES SQL PENDIENTES

### SQL-01: Tabla `cotizaciones_negocio` creada pero sin habilitación real-time
**Archivo:** `supabase/migrations/20260102_create_cotizaciones_negocio.sql`  
La migración crea la tabla pero no agrega la publicación real-time.

**Fix SQL:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE cotizaciones_negocio;
```

### SQL-02: Política RLS para `cotizaciones_negocio` no definida
La tabla se crea sin RLS policies. Cualquier usuario autenticado puede leer/escribir datos de cualquier empresa.

**Fix SQL:**
```sql
ALTER TABLE cotizaciones_negocio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cotizaciones" ON cotizaciones_negocio
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE rol IN ('Administrador', 'Gerente', 'Residente', 'Compras')
    )
  );
```

### SQL-03: Tabla `erp_muro` referenciada en realtime pero su nombre correcto es `erp_publicaciones_muro`
En `useSupabaseRealtime.ts` se lista `'erp_muro'` pero en las migraciones la tabla se llama `erp_publicaciones_muro`. El canal real-time para el muro nunca funciona.

---

## PARTE 7 — ERRORES DE RENDIMIENTO

### PERF-01: useMemo en store.tsx `value` recalcula por `auth` completo
El objeto `value` de useMemo tiene `auth` en sus dependencias — cualquier cambio en el objeto auth (incluyendo tokens de refresh) recalcula todo el contexto y fuerza re-render de todos los consumidores.  
**Fix:** Extraer solo `auth.signIn`, `auth.signUp`, `auth.signInWithGoogle`, `auth.logout`, `auth.error` como dependencias estables.

### PERF-02: saveToStorage se llama en cada useEffect sin debounce
Hay ~35 useEffect que llaman `saveToStorage` directamente. En operaciones masivas (ej: importar presupuesto con 45 renglones), se ejecutan 35 escrituras síncronas al localStorage, bloqueando el hilo principal.

### PERF-03: getResumenMateriales en export.ts recorre todo el array sin memoización
En presupuestos grandes (45+ renglones × 10+ materiales cada uno), la función se ejecuta 3 veces (para CSV, PDF y XLSX) sin caché. En el peor caso: 1350 iteraciones × 3 = 4050 iteraciones para exportar.

---

## PARTE 8 — PLAN DE IMPLEMENTACIÓN PRIORIZADO

### 🔴 PRIORIDAD 1 — Bugs Críticos (implementar primero, afectan integridad de datos)

#### TAREA 1.1: Restaurar P1 (validación stock) y P2 (OC→Stock)
**Archivo:** `src/erp/store.tsx`  
**Cambios:**
- Restaurar validación en `handleAddValeSalida` (ver BUG-02)
- Restaurar cascada en `handleUpdateOrden` (ver BUG-03)
- Ambos: agregar descuento/incremento de stock en `setMateriales`

**Estimado:** 20 min | **Riesgo:** BAJO

#### TAREA 1.2: Corregir mutaciones de Cotizaciones
**Archivo:** `src/erp/store.tsx`  
**Cambios:**
1. Agregar al union type de Mutation: `'addCotizacion' | 'updateCotizacion' | 'deleteCotizacion'`
2. En `forceSync.tableMap`: `addCotizacion: 'cotizaciones_negocio'`, etc.
3. Cambiar 3 `enqueueMutation('addLicitacion'...)` a `'addCotizacion'`

**Estimado:** 15 min | **Riesgo:** BAJO

#### TAREA 1.3: Agregar Cotizaciones al Sidebar
**Archivo:** `src/erp/components/Sidebar.tsx`  
**Cambio:**
```typescript
{ id: 'cotizaciones', label: 'Cotizaciones', icon: FileText, group: 'Principal' },
```

**Estimado:** 5 min | **Riesgo:** MÍNIMO

#### TAREA 1.4: Corregir nombre tabla realtime (erp_muro → erp_publicaciones_muro)
**Archivos:** `src/hooks/useSupabaseRealtime.ts` y `src/components/AppLayout.tsx`  
**Cambio:** Reemplazar todas las referencias `'erp_muro'` por `'erp_publicaciones_muro'`

**Estimado:** 5 min | **Riesgo:** MÍNIMO

---

### 🟠 PRIORIDAD 2 — Inconsistencias de datos (implementar en segunda iteración)

#### TAREA 2.1: Completar objeto EMPRESA en utils.ts
**Archivo:** `src/erp/utils.ts`  
**Cambio:**
```typescript
export const EMPRESA = {
  nombre: 'CONSTRUCTORA WM / M&S',
  eslogan: 'Edificando el Futuro',
  nit: '1234567-8',           // ← llenar con datos reales
  telefono: '(502) 1234-5678', // ← llenar con datos reales
  email: 'info@construsmart.gt',
  direccion: 'Ciudad de Guatemala, Guatemala',
  ciudad: 'Guatemala',
  pais: 'Guatemala',
};
```
Y actualizar `exportCotizacionPDF` para usar `EMPRESA.nit`, `EMPRESA.telefono`, `EMPRESA.email`, `EMPRESA.direccion` en el membrete.

**Estimado:** 30 min | **Riesgo:** BAJO

#### TAREA 2.2: Agregar botón PDF en Cotizaciones.tsx
**Archivo:** `src/erp/screens/Cotizaciones.tsx`  
**Cambio:** Importar `exportCotizacionPDF` desde `../export` y agregar botón en cada tarjeta de cotización:
```tsx
import { exportCotizacionPDF } from '../export';
// ...en cada tarjeta:
<button onClick={() => exportCotizacionPDF(c)} className="...">
  <FileText className="w-3 h-3" /> PDF
</button>
```

**Estimado:** 15 min | **Riesgo:** MÍNIMO

#### TAREA 2.3: Unificar tipo OrdenCompra.estado
**Archivo:** `src/erp/types.ts`  
**Cambio:**
```typescript
estado: 'borrador' | 'pendiente' | 'aprobado' | 'recibida' | 'rechazado' | 'cancelada';
```
Y verificar que el schema en store.tsx sea consistente.

**Estimado:** 10 min | **Riesgo:** BAJO

#### TAREA 2.4: Eliminar redefiniciones inline de schemas en store.tsx
**Archivo:** `src/erp/store.tsx`  
**Cambio:** Eliminar los schemas definidos dentro del archivo (proveedorSchema, eventoCalendarioSchema, bitacoraEntrySchema, cotizacionSchema, etc.) ya que están importados desde `./store/schemas`. Verificar que los imports son los mismos schemas.

**Estimado:** 45 min | **Riesgo:** MEDIO (requiere verificación)

#### TAREA 2.5: Corregir NaN en Dashboard margenProm
**Archivo:** `src/erp/screens/Dashboard.tsx`  
**Cambio:** Proteger división por cero en `margenProm`:
```typescript
const margenProm = activos.length
  ? activos.reduce((a, b) => {
      const m = b.montoContrato > 0
        ? ((b.montoContrato - b.presupuestoTotal) / b.montoContrato) * 100
        : 0;
      return a + m;
    }, 0) / activos.length
  : 0;
```

**Estimado:** 5 min | **Riesgo:** MÍNIMO

---

### 🟡 PRIORIDAD 3 — Auto-reparación y robustez (tercera iteración)

#### TAREA 3.1: Integrar store-health en el flujo real
**Archivos:** `src/lib/store-health.ts`, `src/erp/store.tsx`  
**Plan:**
1. En `loadFromStorage`, si el dato es array y algún elemento falla Zod, recuperar solo los válidos (no crashear todo)
2. Llamar `scheduleHealthCheck` desde `ErpProvider` al montar
3. En `fetchInitialData` (cuando se implemente), usar `recoverStoreState` para datos de Supabase

```typescript
// En ErpProvider, al montar:
useEffect(() => {
  const cancel = scheduleHealthCheck(
    () => ({ proyectos, materiales, ordenes }),
    'ErpProvider'
  );
  return cancel;
}, []);
```

**Estimado:** 1h | **Riesgo:** BAJO

#### TAREA 3.2: Agregar ErrorBoundary alrededor de cada pantalla lazy
**Archivo:** `src/components/AppLayout.tsx`  
**Cambio:**
```tsx
<Suspense fallback={<ScreenLoader />}>
  <ErrorBoundary>
    {safeScreen}
  </ErrorBoundary>
</Suspense>
```

**Estimado:** 10 min | **Riesgo:** MÍNIMO

#### TAREA 3.3: Conectar onCambio de useSupabaseRealtime al store
**Archivo:** `src/components/AppLayout.tsx`  
**Cambio:** El callback `onCambio` debe llamar a `forceSync` o re-fetchear datos cuando recibe cambios de otras sesiones:
```typescript
onCambio: (_payload) => {
  // Disparar re-carga parcial del estado afectado
  forceSync();  // O implementar fetchSelectivo(tabla)
},
```

**Estimado:** 30 min | **Riesgo:** MEDIO

#### TAREA 3.4: Agregar validación Zod en loadFromStorage
**Archivo:** `src/erp/store.tsx`  
**Cambio:** Para listas críticas (proyectos, materiales, presupuestos), validar cada elemento con el schema correspondiente y filtrar los inválidos:

```typescript
function loadAndValidateFromStorage<T>(key: string, schema: z.ZodType<T>, initial: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return initial;
    return parsed.reduce<T[]>((acc, item) => {
      const result = schema.safeParse(item);
      if (result.success) acc.push(result.data);
      else safeLogger.warn(`[Storage] Item inválido en ${key}, ignorado`);
      return acc;
    }, []);
  } catch {
    return initial;
  }
}
```

**Estimado:** 2h | **Riesgo:** MEDIO

#### TAREA 3.5: Implementar fetchInitialData desde Supabase
**Archivo:** `src/erp/store.tsx`  
**Cambio:** Agregar useEffect que al autenticarse descargue datos iniciales:
```typescript
useEffect(() => {
  if (!user || !supabase) return;
  const fetchAll = async () => {
    const tablas = [
      { nombre: 'erp_proyectos', setter: setProyectos, schema: proyectoSchema },
      { nombre: 'erp_materiales', setter: setMateriales, schema: materialSchema },
      // ...resto de tablas
    ];
    for (const t of tablas) {
      const { data } = await supabase.from(t.nombre).select('*');
      if (data?.length) {
        const validos = data
          .map(row => mapFromSnakeCase(t.schema, row))
          .filter(Boolean);
        t.setter(validos as any[]);
      }
    }
  };
  fetchAll();
}, [user?.id]);
```

**Estimado:** 3h | **Riesgo:** MEDIO-ALTO (impacta datos en pantalla)

---

### 🟢 PRIORIDAD 4 — Mejoras de calidad y rendimiento (cuarta iteración)

#### TAREA 4.1: Resolver SECRET SEC-02 — ADMIN_EMAIL en producción
**Archivo:** `src/erp/store.tsx`  
**Cambio:** Mover a `.env`:
```env
VITE_ADMIN_EMAIL=salazaroliveros@gmail.com
```
```typescript
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || '';
```

**Estimado:** 5 min | **Riesgo:** MÍNIMO

#### TAREA 4.2: Debounce en saveToStorage
**Archivos:** `src/erp/store.tsx` (todos los useEffect de storage)  
**Cambio:** Crear utilidad `debouncedSave` y reemplazar llamadas directas:
```typescript
const debouncedSave = useMemo(() => 
  debounce((key: string, data: unknown) => saveToStorage(key, data), 500),
  []
);
```

**Estimado:** 1h | **Riesgo:** BAJO

#### TAREA 4.3: Activar useSessionTimeout
**Archivos:** `src/components/AppLayout.tsx`, `src/hooks/useSessionTimeout.ts`  
**Cambio:** Importar y usar el hook en Shell para logout automático por inactividad.

**Estimado:** 30 min | **Riesgo:** BAJO

#### TAREA 4.4: Limpiar código muerto
- Eliminar estado `subcontratos` del store
- Remover duplicado `rendimientos` de ALLOWED (mantener solo `rendimiento-campo`)
- Agregar imports activos de `useSyncSupabase.ts` o eliminar el archivo

**Estimado:** 30 min | **Riesgo:** BAJO

#### TAREA 4.5: Agregar SQL para RLS y realtime de cotizaciones_negocio
Crear nueva migración `000000000009_cotizaciones_negocio_rls_realtime.sql`:
```sql
-- Enable RLS
ALTER TABLE cotizaciones_negocio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cotizaciones_negocio_access" ON cotizaciones_negocio
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND rol IN ('Administrador', 'Gerente', 'Residente', 'Compras')
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE cotizaciones_negocio;
```

**Estimado:** 15 min | **Riesgo:** MÍNIMO

---

## PARTE 9 — SISTEMA DE AUTO-REPARACIÓN INTELIGENTE

### Patrón recomendado: Circuit Breaker en el store

```typescript
// src/lib/circuit-breaker.ts (nuevo archivo)
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

const FAILURE_THRESHOLD = 3;
const TIMEOUT_MS = 30000; // 30 segundos

const breakers = new Map<string, CircuitBreakerState>();

export function withCircuitBreaker<T>(
  key: string,
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  const breaker = breakers.get(key) ?? { failures: 0, lastFailure: 0, state: 'closed' };
  
  if (breaker.state === 'open') {
    if (Date.now() - breaker.lastFailure > TIMEOUT_MS) {
      breaker.state = 'half-open';
    } else {
      return Promise.resolve(fallback);
    }
  }
  
  return fn()
    .then(result => {
      breaker.failures = 0;
      breaker.state = 'closed';
      breakers.set(key, breaker);
      return result;
    })
    .catch(err => {
      breaker.failures++;
      breaker.lastFailure = Date.now();
      if (breaker.failures >= FAILURE_THRESHOLD) {
        breaker.state = 'open';
      }
      breakers.set(key, breaker);
      throw err;
    });
}
```

### Uso en forceSync:
```typescript
// En cada mutación de forceSync:
await withCircuitBreaker(
  `supabase-${table}`,
  () => supabase.from(table).upsert(snakePayload),
  { data: null, error: new Error('Circuit breaker open') }
);
```

### Auto-recovery en localStorage:
El patrón de `loadAndValidateFromStorage` (TAREA 3.4) ya implementa auto-reparación: si un item del array es inválido, lo ignora y continúa con los demás. El sistema no crashea, solo pierde el item corrupto y lo notifica en consola.

---

## PARTE 10 — RESUMEN DE CAMBIOS POR ARCHIVO

| Archivo | Cambios Requeridos | Prioridad |
|---|---|---|
| `src/erp/store.tsx` | Restaurar P1+P2, corregir mutaciones cotizaciones, eliminar schemas duplicados, ADMIN_EMAIL a env | 🔴 1 |
| `src/erp/components/Sidebar.tsx` | Agregar ítem cotizaciones | 🔴 1 |
| `src/hooks/useSupabaseRealtime.ts` | Corregir nombre tabla erp_muro | 🔴 1 |
| `src/erp/utils.ts` | Completar objeto EMPRESA | 🟠 2 |
| `src/erp/screens/Cotizaciones.tsx` | Agregar botón PDF | 🟠 2 |
| `src/erp/types.ts` | Unificar OrdenCompra.estado | 🟠 2 |
| `src/erp/screens/Dashboard.tsx` | Fix NaN margenProm, incluir cotizaciones en accesos rápidos | 🟠 2 |
| `src/components/AppLayout.tsx` | Agregar ErrorBoundary, conectar onCambio realtime, ampliar tablas realtime | 🟡 3 |
| `src/lib/store-health.ts` | Integrar al flujo real del store | 🟡 3 |
| `src/erp/store.tsx` | fetchInitialData, loadAndValidateFromStorage | 🟡 3 |
| `src/erp/export.ts` | Usar EMPRESA.nit/telefono/email en PDFs | 🟠 2 |
| `supabase/migrations/` | Nueva migración 009 para cotizaciones_negocio RLS+realtime | 🟡 3 |

---

## PARTE 11 — CHECKLIST DE VERIFICACIÓN POST-IMPLEMENTACIÓN

```
PRIORIDAD 1 (bugs críticos):
☐ Vale de salida rechaza cuando stock insuficiente (P1 restaurado)
☐ OC marcada como "recibida" incrementa stock del material (P2 restaurado)
☐ Cotizaciones aparece en sidebar
☐ Cotizaciones se sincronizan a tabla correcta (cotizaciones_negocio)
☐ Muro de obra recibe cambios en realtime (tabla corregida)

PRIORIDAD 2 (inconsistencias):
☐ PDF de cotización muestra NIT, teléfono, email, dirección de empresa
☐ Botón PDF visible en cada tarjeta de cotización
☐ Dashboard no muestra NaN ni Infinity en KPI de margen
☐ No hay TypeScript errors en tipo OrdenCompra.estado

PRIORIDAD 3 (robustez):
☐ ErrorBoundary captura errores de pantallas lazy sin crashear toda la app
☐ store-health corriendo cada 5 minutos en segundo plano
☐ localStorage corrupto es recuperado automáticamente

PRIORIDAD 4 (calidad):
☐ ADMIN_EMAIL no visible en bundle de producción
☐ No hay duplicados de rendimientos en ALLOWED
☐ Migración 009 aplicada en Supabase
```

---

## CONCLUSIÓN

El sistema tiene **7 bugs críticos activos** que afectan integridad de datos (P1, P2 eliminados, cotizaciones en tabla equivocada, sidebar invisible, PDF sin datos empresa) y **15+ inconsistencias de código** que generan deuda técnica.

La mayoría de fixes de prioridad 1 y 2 son cambios quirúrgicos de menos de 30 minutos cada uno. La implementación completa de todas las prioridades se estima en **8-10 horas de trabajo** distribuidas en 4 iteraciones.

El sistema de auto-reparación (store-health + circuit breaker + loadAndValidateFromStorage) puede implementarse incrementalmente sin romper el flujo existente.

---
*Generado por: Amazon Q Developer — Auditoría exhaustiva de código fuente*  
*Versión analizada: commit post-sesión ses_1581 (2026-06-08)*
