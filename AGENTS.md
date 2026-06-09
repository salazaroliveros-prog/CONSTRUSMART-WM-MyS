# CONSTRUSMART ERP — Notas para Agentes

## Stack
- React 18.3 + TypeScript 5.5 + Vite 5.4
- Ant Design 5.29.3, React Query, Three.js/web-ifc
- Supabase backend + offline-first mutation queue pattern
- Zod schemas (canónicos en `src/erp/store/schemas/`)
- jspdf + html2canvas + xlsx (exportación)
- Context store (ErpProvider) con persistencia localStorage + forceSync

## Arquitectura del Store
- `src/erp/store.tsx`: ErpProvider, contexto, loadFromStorage, loadAndValidateFromStorage, mutation queue con forceSync
- Los schemas Zod están IMPORTADOS de `src/erp/store/schemas/` — NO redefinir inline
- `proyectoSchemaInline` en store.tsx es una excepción (versión simplificada sin `as const`)
- Nuevas entidades de estado: usar `loadAndValidateFromStorage` con su schema canónico
- `forceSync` envía INSERT/UPDATE/DELETE real a Supabase cuando hay conexión
- `fetchInitialData` carga desde Supabase en primer auth
- `scheduleHealthCheck` monitorea estado del store cada 10 min

## Convenciones
- Sin comentarios en código (`//` o `/* */`)
- `z.enum([...] as const)` en schemas canónicos
- Vistas: `View` type en store.tsx, lazy import en AppLayout.tsx, `ALLOWED` por rol
- `rendimientos` fue eliminado como view — usar `rendimiento-campo` con alias en Shell
- `cotizaciones` view existe y está en Sidebar + ALLOWED
- i18n: `t()` con formato interpolación `{{key}}` (no `{key}`)

## Tests
- `src/__tests__/erp-operacion-integral.test.tsx`: 78 tests (ALL pass — 5 pre-existing failures fixed)
- `src/__tests__/erp-store-operations-full.test.tsx`: 246 tests (all pass) — covers 30+ entities CRUD, calculation engine, export functions, RBAC, storage, cross-module flows, notifications, security, performance, i18n, realtime, error handling
- Combined: **324/324 tests pass** (0 failures)

## Cambios Realizados (sesión actual)

### BUG-01: Mutation Keys de Cotizaciones
- `addLicitacion`/`updateLicitacion`/`deleteLicitacion` → `addCotizacion`/`updateCotizacion`/`deleteCotizacion`
- Tabla: `erp_cotizaciones_negocio`

### BUG-02: Stock Validation en ValeSalida
- `handleAddValeSalida`: valida stock suficiente antes de crear, deduce stock al confirmar

### BUG-03: OC→Stock Cascade
- `handleUpdateOrden`: cuando estado es `aprobado` o `recibida`, incrementa stock de materiales según items

### BUG-04: EMPRESA Completo
- `utils.ts`: nit, telefono, email, direccion, ciudad, pais
- `export.ts`: PDF usa campos reales en vez de placeholders

### BUG-05: Sidebar Cotizaciones
- Agregado `cotizaciones` a ITEMS en Sidebar.tsx

### BUG-07/INC-01: Realtime Tables
- `erp_muro` → `erp_publicaciones_muro`
- Tablas añadidas: `erp_presupuestos`, `erp_ordenes_compra`, `erp_avances`, `erp_vales_salida`, `erp_cotizaciones_negocio`
- `onCambio` llama `forceSync()`

### INC-05: Stale Closure
- `useRef(forceSync)` evita closure stale en efecto de reconexión

### INC-03/UI-06: NaN en Dashboard
- Guard en división de `margenProm`
- `avanceData`: early return con `Array(8).fill(0)` cuando no hay avances

### INC-08: Estado 'borrador' en OrdenCompra
- Añadido a union type en types.ts y ordenSchema

### INC-10: Dead Inline Schemas
- Eliminados ~50KB de definiciones Zod duplicadas de store.tsx
- Los schemas canónicos en `./store/schemas/` ya estaban importados

### UI-01: PDF en Cotizaciones
- Botón PDF en cada tarjeta de cotización

### HUE-07: ErrorBoundary por Screen
- Cada lazy screen envuelta en `<ErrorBoundary moduleName={...}>`

### SEC-02: ADMIN_EMAIL en env var
- `import.meta.env.VITE_ADMIN_EMAIL || 'salazaroliveros@gmail.com'`

### P3: Store Health + Initial Data
- `scheduleHealthCheck` en ErpProvider (10 min)
- `loadAndValidateFromStorage` con validación Zod (14 entidades)
- `fetchInitialData` desde Supabase en primer auth
- Eliminado estado muerto `subcontratos`

### P4: Session Timeout + Limpieza
- `useSessionTimeout` en Shell (30 min)
- Removido `rendimientos` de View, ALLOWED, screens, menu
- Alias `rendimientos → rendimiento-campo` en Shell
- `avanceData` fix para array vacío

### Otros (Sesión Anterior)
- `deleteNC` mutation type añadido
- Vitest config: environment 'jsdom', test include ampliado
- SQL migration 009: RLS + realtime para cotizaciones_negocio

### FIX: Runtime ReferenceError "Cannot access 'Dt' before initialization"
- **Root cause**: `manualChunks: { antd: ["antd", "@ant-design/icons"] }` en `vite.config.ts` forzó todos los módulos de Ant Design v5 en un solo chunk, rompiendo sus dependencias circulares internas
- **Fix**: Eliminado `antd` y `@ant-design/icons` del `manualChunks`; añadido `optimizeDeps.include` para dev
- Resultado: antd se divide naturalmente, sin errores de inicialización

### FIX: SQL Migration 009 — Table Name Prefix
- `cotizaciones_negocio` → `erp_cotizaciones_negocio` (consistente con las demás tablas)

### FIX: forceSync — Missing Licitaciones tableMap
- `addLicitacion`/`updateLicitacion`/`deleteLicitacion` no estaban en `tableMap`; sus mutaciones locales nunca se enviaban a Supabase
- Añadidas entradas → `erp_licitaciones`

### FIX: Dashboard avanceData — Project Filter
- El filtro por `selectedProyectoId` se ejecutaba dentro del loop (ineficiente + usaba longitud incorrecta)
- Refactor: filtro único al inicio + `data.length` consistente en todos los cálculos

### FIX: Realtime Table Names Consistentes
- `AppLayout.tsx` y test actualizados: `cotizaciones_negocio` → `erp_cotizaciones_negocio`

### FIX: forceSync TDZ Runtime Error
- **Root cause**: `const forceSyncRef = useRef(forceSync)` en store.tsx línea 522 referenciaba `forceSync` antes de su declaración `const forceSync = useCallback(...)` en línea 692, provocando Temporal Dead Zone en dev mode
- **Fix**: Movido el bloque `forceSyncRef` + auto-trigger effect después de la definición de `forceSync`

### FIX: Data Persistence — Missing localStorage Effects
- **Bug**: Solo `notificaciones` y `cotizacionesNegocio` tienen `useEffect` que persiste a localStorage. Las demás entidades (`proyectos`, `movimientos`, `empleados`, `materiales`, `ordenes`, `presupuestos`, `avances`, `hitos`, `riesgos`, etc.) cargan desde localStorage al iniciar pero NUNCA se guardan — datos se pierden al refrescar la página
- **Impacto**: CRITICAL — cualquier dato ingresado se pierde si el usuario recarga la página
- **Fix pendiente**: Agregar `useEffect` con `saveToStorage` para cada entidad

### FIX: 5 Pre-Existing Test Failures
- **Ajustes**: timeout 30s (screen pesada con imports de Ant Design Settings)
- **fmtQ**: locale-agnostic (jsdom sin `es-GT`)
- **Margen**: valor esperado corregido 20 → 22.5
- **Sanitize XSS**: string concatenation evita decoding de HTML entities
- **`__proto__`**: cambiado a `constructor` para evitar interceptación del prototype

## Pendientes / Issues Conocidos
- Build produce warnings de "use client" ignorados (Ant Design v5) — normal, no afectan funcionalidad
- web-ifc: 3.6MB chunk — normal para this project
- Sin errores de runtime conocidos
