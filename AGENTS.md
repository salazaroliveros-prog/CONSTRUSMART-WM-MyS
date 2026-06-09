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

### Otros
- `deleteNC` mutation type añadido
- Vitest config: environment 'jsdom', test include ampliado
- SQL migration 009: RLS + realtime para cotizaciones_negocio

## Pendientes / Issues Conocidos
- SQL migration 009 referencia `cotizaciones_negocio` sin prefijo `erp_` — verificar nombre real de tabla en Supabase
- Build produce warnings de chunks grandes (web-ifc: 3.6MB) — normal para this project
- Tests: 73/78 passed, 5 pre-existing failures (Ajustes timeout, fmtQ locale, margen math, sanitizarTexto jsdom, `__proto__` proto handling)
- Dashboard `avanceData` usa `selectedProyectoId` para filtrar avances por proyecto — verificar
