# Arquitectura y Analisis Integral — CONSTRUSMART ERP

## 1. Mapa estructural

### 1.1 Capas
- `src/App.tsx` → enrutamiento/lazy layout
- `src/erp/ErpProvider.tsx` → contexto global (`user`, `currentProjectId`, `currentProject`, `allowedViews`)
- `src/erp/zustandStore.ts` → store nucleo CRUD + `forceSync`
- `src/erp/store.tsx` → `useErp`, `fetchInitialData`, `mutationQueue`, persistencia `localStorage`, `scheduleHealthCheck`
- `src/erp/types.ts` + `src/erp/store/schemas/*` → contratos + validacion runtime
- `src/erp/screens/*` + `src/erp/components/*` → UI por modulo
- `src/lib/supabase/*` → cliente Supabase + RPC + seguridad
- `supabase/migrations/*` → esquema DB, RLS, realtime
- `public/sw.js` → offline/PWA

### 1.2 Estado actual
- 33+ entidades en store
- Offline: `mutationQueue` + `localStorage` + `forceSync`
- Realtime: 28 canales por tabla habilitada
- RBAC: `getViewsByRole(user.rol)` → `allowedViews`

## 2. Analisis de integraciones

### 2.1 Proyectos como eje central
`currentProjectId` ya existe pero varias pantallas filtran con `proyectoFilter` local. Recomendacion: normalizar `currentProjectId` como fuente unica y derivar listas desde ahi.

### 2.2 Presupuestos ↔ EVM
`SeguimientoEVM` y `Presupuesto.renglones` estan desacoplados. Optimizar: sincronizar `valorPlaneado`, `valorGanado`, `cv`, `sv` a nivel presupuesto antes de renderizar.

### 2.3 Bodega ↔ OC ↔ ValeSalida
Cascada parcial OC→stock y ValeSalida→stock. Falta unificacion en `services/` o `utils/` para evitar buffers locales inconsistentes.

### 2.4 Motor de calculo
`services/motorCalculo.ts`, `reglasFactores.ts`, `normativaDepartamental.ts`, `escalasProduccion.ts`, `estacionalidad.ts` tienen logica duplicada. Recomendado: unificar en un solo servicio Zustand-safe con fallback offline.

## 3. Refactorizacion y optimizacion

### 3.1 Schemas
- Eliminar schemas duplicados inline; mantener solo imports canonicos.
- Asegurar `createdAt/updatedAt` en entidades omitidas.

### 3.2 Store
- `ErpProvider` debe exponer solo lo necesario; reducir `useMemo` dependencies.
- Unificar handler names frente a rutas API/RPC reales.

### 3.3 Tablas y mappings
- `TABLE_MAP` y `MUTATION_TABLE_MAP` deben reflejar 1:1 tablas y acciones.

## 4. Mejoras UX/UI

### 4.1 Flujo por etapa
Usar `APP_STAGES` para: habilitar/ocultar modulos segun etapa real, mostrar progreso visual etapa→modulos permitidos.

### 4.2 Filtros globales
Reemplazar `ProyectoFilter` por selector de `currentProjectId` cuando exista contexto.

### 4.3 Estados vacios y skeletons
Estandarizar contenedor, titulo, KPIs skeleton, contenido skeleton en pantallas sin cobertura.

## 5. Mejoras funcionales

### 5.1 KPIs predictivos
Integrar `services/profitabilityAnalytics.ts` con `DashboardPredictivo` y `ProfitabilityAnalytics`.

### 5.2 Alertas
`AlertasPanel.tsx` resuelve stock critico, NC, OC, hitos vencidos. Empujarlo a `Dashboard` como card oficial y reusarlo en `Notificaciones`.

### 5.3 Exportacion
`export.ts` soporta xlsx/pdf. Optimizar agrupacion por proyecto/etapa para entrega a cliente.

## 6. Priorizacion recomendada
1. Integrar `currentProjectId` en todos los filtros.
2. Unificar servicios de motor de calculo y normalizar offline.
3. Validar skeletons y states vacios en pantallas pendientes.
4. Consolidar integracion Proyectos↔Presupuestos↔EVM.
5. Extender `AlertasPanel` a mas modulos.

## 7. Riesgos y mitigacion
- Cambios en store pueden romper `forceSync`: manejar con migrations/test-first.
- Agregar `APP_STAGES` en UI requiere validar datos legacy.
- Modificar rutas realtime requiere migraciones compatibles.
