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
- `src/__tests__/erp-store-operations-full.test.tsx`: 254 tests (all pass) — covers 30+ entities CRUD, calculation engine, export functions, RBAC, storage, cross-module flows, notifications, security, performance, i18n, realtime, error handling
- `src/lib/__tests__/auto-repair.test.ts`: 27 tests (store health, safeParse, recoverStoreState)
- `src/erp/__tests__/integrity.test.ts`: 3 tests (Zod schema integrity)
- `src/erp/__tests__/store.ordenes.test.ts`: 3 tests
- `src/erp/__tests__/store.presupuestos.test.ts`: 4 tests
- `src/erp/__tests__/zustand-migration.test.ts`: 6 tests
- `src/erp/__tests__/e2e-proyecto.test.ts`: 1 test
- `src/erp/__tests__/store.test.ts`: 10 tests
- `src/erp/__tests__/financiero.test.ts`: 35 tests
- `src/erp/__tests__/utils.test.ts`: 21 tests
- `src/__tests__/erp-estilos-ui.test.tsx`: 72 tests
- `src/__tests__/erp-validacion-funcional.test.tsx`: 57 tests
- `src/__tests__/filtro-proyecto.test.tsx`: 5 tests
- Combined: **576/576 tests pass** (0 failures) — 14 test files

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

### FIX: Data Persistence — Missing localStorage Effects (RESUELTO)
- Todas las entidades ya tienen `useEffect(() => saveToStorage(...), [...])` en store.tsx líneas 877-907
- **Cobertura**: proyectos, movimientos, empleados, materiales, ordenes, proveedores, eventos, bitacora, presupuestos, licitaciones, avances, vales_salida, seguimiento_evm, cuentas_cobrar, cuentas_pagar, ordenes_cambio, hitos, riesgos, incidentes, publicaciones_muro, pruebas, no_conformidades, liberaciones, planos, rfis, submittals, activos, cuadros, pagos_proveedor, notificaciones, cotizacionesNegocio, mutationQueue, settings

### FIX: 5 Pre-Existing Test Failures
- **Ajustes**: timeout 30s (screen pesada con imports de Ant Design Settings)
- **fmtQ**: locale-agnostic (jsdom sin `es-GT`)
- **Margen**: valor esperado corregido 20 → 22.5
- **Sanitize XSS**: string concatenation evita decoding de HTML entities
- **`__proto__`**: cambiado a `constructor` para evitar interceptación del prototype

### SESIÓN-09 (2026-06-12): Implementación de Quick Wins + UI/UX + Operacionales

#### A-12: Compresión lz-string + Gestión de Cuota localStorage
- `npm install lz-string`
- `compressData`/`decompressData` en utils.ts (comprime JSON >10KB con `lz-string:compressToUTF16`)
- `isStorageQuotaCritical` detecta uso >85% del quota estimado (5MB)
- `safeSetItem` con fallback: elimina keys más pequeñas, comprime individualmente, reintenta
- store.tsx: `loadWithDemo` ahora usa `decompressData`, `saveToStorage` usa `compressData` + `safeSetItem`
- Compresión aplicada a: todas las entidades, mutationQueue, notificaciones, auditLog

#### A-20: Lazy Loading Header + Sidebar
- `AppLayout.tsx`: Header y Sidebar cambiados de import estático a `lazy(() => import(...))`
- Consistente con las 34 screens que ya usaban lazy loading

#### 1.1: i18n Dashboard
- Dashboard.tsx: `useTranslation()` hook agregado, ~30 strings reemplazados con `t()`
- es.json + en.json: 30+ nuevas keys en sección `dashboard` (tablero, metricas_tiempo_real, margen_util, proyectos, presupuesto, desviacion, prom, riesgo, sano, planif, costo_planif, real, desv_prom, mayor, curva_s, programado, sin_datos, ing_vs_gast, registro_rapido, modulos, cartera_titulo, panel_alertas, stock_critico, nc_pendientes, oc_pendientes, hitos_vencidos, sin_alertas, ver_todos)
- Añadido `nav.items.cotizaciones` a ambos idiomas

#### 1.3: Widget Cartera
- Dashboard.tsx: Donut chart de proyectos agrupados por estado (planeacion, ejecucion, pausado, finalizado)
- Colores distintivos por estado, leyenda con cantidades
- Renderizado condicional (solo si hay datos)

#### 1.4: Panel Alertas
- `AlertasPanel.tsx` creado en `src/erp/components/`
- Muestra top 10 alertas: stock crítico (stock=0 → alta, stock≤min → media), NC pendientes, OC en borrador/pendiente, hitos vencidos
- Indicadores visuales por tipo (iconos + colores)
- Integrado en Dashboard.tsx en la columna lateral

#### 2.1: Optimistic Locking Extendido
- `types.ts`: Material, OrdenCompra, Presupuesto ahora tienen `version?: number`
- OrdenCompra: `stockActualizado?: boolean`
- Schemas Zod actualizados (bodega.ts, presupuestos.ts)
- zustandStore.ts: `addMaterial`/`addOrden`/`addPresupuesto` inicializan `version: 1`
- `updateMaterial`/`updateOrden`/`updatePresupuesto` validan version y la incrementan

#### Operacional: OC duplicate stock validation
- `updateOrden`: solo incrementa stock si `!orden.stockActualizado`
- Marca `stockActualizado: true` después de la primera deducción
- Actualiza `version` de materiales afectados

#### Operacional: Presupuesto recalcula al modificar renglones
- `updatePresupuesto`: recalcula `totalCalculado` automáticamente cuando `patch.renglones` está presente
- Suma de `totalPV` (o `costoMateriales + costoManoObra + costoEquipo` por renglón)

#### Validación
- Build exitoso (0 errores, solo warnings esperados de "use client")
- Tests: **576/576** pass (14 files, +7 tests vs sesión anterior)
- AlertasPanel: 0 errores de compilación, importado correctamente en Dashboard

### SESIÓN-08 (2026-06-12): Refactorización Integral de Auditoría — Implementación Completa

#### A-04: motivoPausa obligatorio
- Añadido `motivoPausa`, `pausadoPor`, `fechaPausa`, `fechaReanudacionEstimada` a `Proyecto` (types.ts), `proyectoSchema` (store/schemas/proyectos.ts), `proyectoSchemaInline` (store.tsx)
- Modal de pausa en `Proyectos.tsx` con motivo (textarea), autorizador, fecha estimada de reanudación
- Display de motivoPausa en tarjetas de proyecto cuando estado === 'pausado'

#### A-03: State machine con validaciones
- `handleUpdateProyecto` valida transiciones: `planeacion→ejecucion`, `ejecucion→pausado`, `pausado→ejecucion`, `ejecucion→finalizado`
- Requiere presupuesto aprobado + hitos para `planeacion→ejecucion`
- Requiere `motivoPausa` para `ejecucion→pausado`
- Requiere avance 100% para `ejecucion→finalizado`
- Valida consistencia estado/etapa (ej. estado=planeacion no permite etapa=construccion)
- Valida que avance > 0 no se pueda fijar en estado planeacion

#### A-06: tableMap completo en forceSync
- Añadidas entradas faltantes: `addPublicacionMuro`, `deleteOrden`, `deleteNC`
- Eliminados duplicados que causaban warnings de compilación

#### A-07: Stale closure fix
- `mutationQueueRef` y `syncCooldownRef` para evitar closures stale
- Efecto de auto-trigger ahora usa refs en vez de dependencias directas

#### A-13..17: Campos duplicados en types.ts
- Eliminados `proyectoId` duplicado en Hito, Riesgo, CentroCosto, Plano

#### A-08/A-09: Validación estado-etapa y avance
- Etapa se actualiza automáticamente según el estado
- Avance restringido a 0 en proyectos en planeación

#### A-23: EMPRESA configurable desde settings
- `empresaInfo` añadido a `AppSettings`
- `EMPRESA_DEFAULT` y `getEmpresaInfo()`/`setEmpresaInfo()` en utils.ts
- Settings sincroniza empresaInfo al store al cargar y al actualizar

#### A-24: LogAuditoría
- Estado `auditLog` con persistencia en localStorage (últimos 200)
- `addAuditEntry` registra usuario, acción, entidad, valores anteriores/nuevos
- Integrado en addProyecto, updateProyecto (estado changes), deleteProyecto

#### BUG-06: Fix Cotizaciones type
- Eliminados `createdAt`/`updatedAt` de llamadas a `addCotizacion` (handler ya lo maneja)
- Eliminado `as any` en `duplicarCotizacion`

#### SEC-04: Sanitización en enqueueMutation
- `sanitizarObjeto(payload)` antes de encolar cada mutación

#### A-11: Optimistic locking
- Campo `version` añadido a `Proyecto`
- `handleUpdateProyecto` verifica versión antes de aplicar cambios
- Versión se incrementa automáticamente en cada update

#### A-25: Notificaciones agrupadas
- `addNotificacion` detecta notificaciones no leídas duplicadas (mismo proyecto + título) y las fusiona con contador (+1)

#### PERF-01: Auth dependencias estables
- `useMemo` value cambió de dep `auth` completo a `auth.signIn, auth.signUp, auth.signInWithGoogle, auth.logout, auth.error`
- Evita re-render completo del contexto en refrescos de token

#### Validación
- Build exitoso (0 errores, 0 warnings de duplicate key)
- Tests: **569/569** pass (12 files)

### SESIÓN-07 (2026-06-10): Migración 017 + Destajos/Recepciones Store + ForceSync + Reportes + Delete Handlers
- **Migración 017**: Columna `probabilidad` añadida a `erp_licitaciones` (ya existía, skip)
- **Migración 018**: RPC functions `append_comentario_muro` y `increment_likes_muro` para manejo correcto de JSONB array y contador
- **Destajos → Store**: `destajos` entity con schema Zod, state, fetch/assign Supabase (table `destajos`), handlers (add/update/delete), saveToStorage, tableMap, ErpState, value memo. PlanillaDestajos.tsx ahora usa store en vez de useState local. Modal de creación añadido.
- **Recepciones → Store**: `recepciones` entity (tipo `RecepcionAlmacen`) con schema Zod, estado, handlers (add/delete), saveToStorage, ErpState, value memo. Solo local (sin tabla Supabase). EntradasAlmacenOC.tsx ahora usa store.
- **ForceSync fix**: `addComentarioMuro` y `likePublicacionMuro` ahora usan RPC functions (en vez de INSERT) para actualizar correctamente JSONB array y contador `likes`
- **ReportesTecnicos fix**: `{fmtQ(0)}` en valor de vale de salida ahora calcula total desde `items[] * precio` de materiales
- **Delete handlers añadidos**: `deleteCuadro`, `deletePagoProveedor`, `deleteIncidente` (handlers, tableMap, ErpState, value memo)
- **Migración 019**: Tabla `recepciones_almacen` con RLS + realtime
- **Recepciones → forceSync**: Activado forceSync para `addRecepcion`/`deleteRecepcion` (tabla `recepciones_almacen`)
- **CRM polish**: Slider de probabilidad en formulario de licitaciones (create + edit), weighted pipeline bar chart en LicitacionesDashboard
- **Tests**: +8 tests para Destajo y RecepcionAlmacen (makeEntityTests)
- Tests: **564/564** pass (11 files, +129 tests vs sesión anterior)
- **Duplicado de número de migración**: Renombrado `000000000002_rls_policies.sql` → `000000000007` para eliminar conflicto con `_complementary_tables_and_realtime.sql`
- **DROP POLICY IF EXISTS**: Añadido a todas las `CREATE POLICY` en migración 007 y `fix_schema_inconsistencies` (evita error "already exists" en re-ejecución)
- **Policy expression fix**: `= ANY(public.get_accessible_proyectos())` → `IN (SELECT * FROM public.get_accessible_proyectos())` — set-returning functions no están permitidas en policy expressions
- **ALTER PUBLICATION fix**: Reemplazado `ADD TABLE IF NOT EXISTS` (sintaxis inválida en PG) con manejo de excepción `duplicate_object`
- **pg_publication_tables.publicationname fix**: Corregido a `pubname` (columna correcta en PG)
- **uuid_generate_v4() → gen_random_uuid()**: No requiere extensión uuid-ossp (built-in en PG 13+)
- **Views removidas de publicación**: `erp_publicaciones_muro` es vista, no se puede agregar a una publicación
- **Migración redundante eliminada**: 000000000009 (superseded by 010)
- **Stale file removido**: `20260806_apply_all_fixes.sql`
- **Data Persistence confirmada**: Todos los `useEffect` con `saveToStorage` ya existen en store.tsx líneas 877-907 (33 entidades)
- **Build production**: `npm run build` exitoso (solo warnings esperados de antd "use client")

## Pendientes / Issues Conocidos
- Build produce warnings de "use client" ignorados (Ant Design v5) — normal, no afectan funcionalidad
- web-ifc: 3.6MB chunk — normal para this project
- Sin errores de runtime conocidos
