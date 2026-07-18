# ERP CONSTRUSMART — Gestión Constructora Integral

ERP web para gestión constructora con módulos de proyectos, presupuestos APU, finanzas, RRHH, bodega, seguimiento EVM, CRM, logística y más.

**Deploy:** https://construsmart-wm2026.vercel.app/

---

## Estado del Proyecto (Julio 2026)

| Métrica | Valor |
|---------|-------|
| Screens implementadas | **43/43 (100%)** |
| Tests | **1029/1030 (99.9%)** — 33+ archivos |
| Accesibilidad WCAG | AA Compliant (100%) |
| Temas visuales | 8 temas implementados |
| Store Zustand | 33+ entidades sincronizadas |
| Realtime | 57 tablas habilitadas |
| RLS | 52/52 tablas con políticas |
| Migraciones DB | 000001 → 000124 (124 aplicadas) |
| Build | 0 errores |
| Deploy | Vercel automático |

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18.3 + TypeScript 5.5 + Vite 8.1 |
| UI | Ant Design 5.29 + Tailwind CSS 3.4 + shadcn/ui (48 primitivas Radix UI) |
| Estado | Context Store (ErpProvider) + Zustand 5 |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Validación | Zod 3.23 + react-hook-form |
| Exportación | jsPDF + html2canvas + xlsx |
| 3D/BIM | Three.js + web-ifc |
| Gráficos | Recharts + chart.js |
| Mapas | Leaflet + markercluster |
| Virtualización | react-window |
| Offline | Service Worker (PWA) + lz-string |
| Testing | Vitest + Testing Library + Playwright + axe-core |
| CI/CD | GitHub Actions + Vercel |

---

## Configuración Rápida

```bash
# 1. Clonar e instalar
npm install

# 2. Variables de entorno (.env)
VITE_SUPABASE_URL=https://neygzluxugodiwcuctbj.supabase.co
VITE_SUPABASE_KEY=<anon_key>

# 3. Iniciar dev
npm run dev   # http://localhost:8080

# 4. Build producción
npm run build
```

### Google OAuth

Supabase Dashboard → Authentication → URL Configuration:
- **Site URL:** `http://localhost:8080`
- **Redirect URLs:** `http://localhost:8080/**`, `https://construsmart-wm2026.vercel.app/**`

Google Cloud Console → OAuth 2.0 Client ID:
- **Authorized JavaScript origins:** `http://localhost:8080`, `https://construsmart-wm2026.vercel.app`
- **Authorized redirect URI:** `https://neygzluxugodiwcuctbj.supabase.co/auth/v1/callback?provider=google`

### Migraciones SQL

```bash
supabase migration up          # Aplicar migraciones locales
supabase db push               # Push a Supabase remoto
```

Las migraciones están en `supabase/migrations/` (124 archivos, 000000000001 → 000000000124).

---

## Arquitectura

### Relación 1:N — Proyecto ↔ Presupuestos

```
erp_proyectos                      erp_presupuestos
┌──────────────────┐              ┌──────────────────────┐
│ id (PK)          │──┐           │ id (PK)              │
│ nombre           │  │           │ proyecto_id (FK)     │←┘
│ cliente          │  └───────────│ tipologia            │
│ tipologia        │  1:N         │ renglones (JSONB)    │
│ presupuestoActualId (FK)──┐     │ total_calculado      │
│ presupuestoTotal   │      │     │ estado               │
│ estado             │      │     │ version_presupuesto  │
└────────────────────┘      │     │ UNIQUE(proyecto_id,  │
                            │     │   version)           │
                            │     └──────────────────────┘
                            │
                            └──── Referencia al presupuesto activo
```

### Store/Context Pattern

```
ErpProvider (Root State) ── zustandStore (State + Actions)
├─ 33+ entidades (proyectos, presupuestos, movimientos, etc.)
├─ selectedProyectoId — vinculación proyecto→presupuesto
├─ Mutation Queue (offline-first con retry exponencial)
├─ forceSync → INSERT/UPDATE/DELETE a Supabase
├─ fetchInitialData → carga desde Supabase en primer auth
└─ scheduleHealthCheck → monitorea estado del store cada 10 min
```

### Offline-First

1. Las mutaciones se encolan en `mutationQueue` (indexedDB/localStorage)
2. `forceSync` procesa la cola cuando hay conexión
3. Exponential backoff: `min(1000ms * 2^attempt, 30000ms)`, max 10 retries
4. Catch FK 23503 con logging y retry
5. Compresión lz-string para datos >10KB
6. Service Worker (sw.js v7) para PWA offline

---

## Módulos del Sistema (43 pantallas)

| # | Módulo | Archivo | View Key |
|---|--------|---------|----------|
| 1 | Dashboard (KPIs + Curva S + Alertas) | `Dashboard.tsx` | `dashboard` |
| 2 | Proyectos (CRUD + KPI + Mapa Calor) | `Proyectos.tsx` | `proyectos` |
| 3 | Presupuestos (motor APU, vinculación) | `Presupuestos.tsx` | `presupuestos` |
| 4 | Financiero (Cash Flow real/proyectado) | `Financiero.tsx` | `financiero` |
| 5 | RRHH (empleados, FSR, asignación) | `RRHH.tsx` | `rrhh` |
| 6 | Bodega (Pareto 80/20, alertas stock) | `Bodega.tsx` | `bodega` |
| 7 | Seguimiento (EVM + Gantt + bitácora) | `Seguimiento.tsx` | `seguimiento` |
| 8 | CRM / Pipeline Kanban (5 columnas) | `CRM.tsx` | `crm` |
| 9 | Login/Registro + RBAC (5 roles) | `Login.tsx` | `login` |
| 10 | Logística/Compras | `LogisticaCompras.tsx` | `logistica` |
| 11 | Rendimiento Campo (destajos, vales) | `RendimientoCampo.tsx` | `rendimiento-campo` |
| 12 | Comercial/Finanzas (ventas, anticipos) | `ComercialFinanzas.tsx` | `comercial` |
| 13 | Administración (centros costo, auditoría) | `Administracion.tsx` | `admin` |
| 14 | GanttChart (cronograma interactivo) | `GanttChart.tsx` | `gantt` |
| 15 | APU Avanzado (motor paramétrico) | `APUAvanzado.tsx` | `apu-avanzado` |
| 16 | Base de Precios (catálogo insumos) | `BasePrecios.tsx` | `baseprecios` |
| 17 | Ajustes (design system, temas, densidad) | `Ajustes.tsx` | `ajustes` |
| 18 | Dashboard Predictivo (EAC, ETC, BI) | `DashboardPredictivo.tsx` | `dashboard-predictivo` |
| 19 | Weather (clima, impacto obra) | `Weather.tsx` | `weather` |
| 20 | Exportación Inteligente (PDF/CSV/JSON) | `ExportacionInteligente.tsx` | `exportacion` |
| 21 | Muro de Obra (feed colaborativo) | `MuroObra.tsx` | `muro-obra` |
| 22 | Hitos (milestones + calendario) | `Hitos.tsx` | `hitos` |
| 23 | Riesgos (matriz calor + mitigación) | `Riesgos.tsx` | `riesgos` |
| 24 | Notificaciones (alertas + historial) | `Notificaciones.tsx` | `notificaciones` |
| 25 | SSO / Calidad (incidentes, checklist) | `SSOCalidad.tsx` | `sso-calidad` |
| 26 | Gestión Documental (planos, RFI) | `GestionDocumental.tsx` | `gestion-documental` |
| 27 | Órdenes de Cambio (flujo aprobación) | `OrdenesCambio.tsx` | `ordenes-cambio` |
| 28 | Cuentas por Cobrar | `CuentasCobrar.tsx` | `cuentas-cobrar` |
| 29 | Cuentas por Pagar | `CuentasPagar.tsx` | `cuentas-pagar` |
| 30 | Cotizaciones (cuadro comparativo) | `Cotizaciones.tsx` | `cotizaciones` |
| 31 | Activos y Herramientas | `Activos.tsx` | `activos` |
| 32 | Entradas Almacén vs OC | `EntradasAlmacenOC.tsx` | `entradas-almacen` |
| 33 | Planilla Destajos | `PlanillaDestajos.tsx` | `planilla-destajos` |
| 34 | Plantillas de Proyectos | `PlantillasProyectos.tsx` | `plantillas` |
| 35 | Impuestos (ISR/IVA) | `Impuestos.tsx` | `impuestos` |
| 36 | Cuadros Comparativos | `Cuadros.tsx` | `cuadros` |
| 37 | Visor BIM (Three.js + web-ifc) | `VisorBIM.tsx` | `visor-bim` |
| 38 | Profitability Analytics | `ProfitabilityAnalytics.tsx` | `profitability` |
| 39 | Proveedor Analytics | `ProveedorAnalytics.tsx` | `proveedor-analytics` |
| 40 | Resource Conflicts | `ResourceConflicts.tsx` | `resource-conflicts` |
| 41 | Auditoría (logs, KPIs, export CSV) | `Auditoria.tsx` | `auditoria` |
| 42 | Calidad y Cumplimiento | `CalidadCumplimiento.tsx` | `calidad` |
| 43 | Error Log (modal resolución, charts) | `ErrorLog.tsx` | `error-log` |

---

## Funcionalidades Detalladas

### APU (Análisis de Precios Unitarios)

- 8 motores paramétricos (Fases 1-5 completas)
- Catálogo de 24 insumos base por rubro
- Factor de sobrecosto configurable por proyecto
- Cálculo: CD = materiales + MO + equipo, PV = CD × factor_sobrecosto
- Sub-renglones: desglose de materiales por renglón
- Cubicación automática: concreto, acero, mampostería, encofrado, excavación
- Histórico de precios con gráfica de tendencia (5 trimestres)
- Plantillas de sub-renglones (Concreto, Acero, Muro, Encofrado)

### Control de Campo (Móvil/PWA)

- Bitácora digital con fecha, clima, personal, maquinaria, tareas, fotos, firma electrónica, geolocalización
- Avance de obra: % físico, cantidad ejecutada, foto geolocalizada
- Control de materiales: recepción vs OC, vales de salida, conteo cíclico
- Checkpoints de calidad por actividad
- Offline-first con cola de sincronización

### Seguimiento y EVM

- Curva S programada vs real con función sigmoide
- Flujo de caja proyectado vs ejecutado (12 meses)
- Alertas predictivas: desviación >10%, proyección sobrecosto
- Valor Ganado (EVM): Variación de Costo y Tiempo (EAC = BAC/CPI)
- Gantt chart interactivo (react-resizable-panels)

### Cadena de Suministro

- Órdenes de compra con flujo de aprobación por rol
- Cuadro comparativo de proveedores con cotizaciones múltiples
- Entradas de almacén vs OC con validación de cantidades
- Vales de salida imputados a renglón específico
- Control de activos y herramientas por operador/cuadrilla
- Pareto 80/20, alertas stock crítico

### Finanzas y Comercial

- Cash Flow real/proyectado con alertas de déficit
- Cajas chicas con carga de facturas y aprobación
- Amortización de anticipos
- Pipeline de ventas (disponible/reservado/vendido/entregado)
- Programación de pagos a proveedores con alertas vencidos
- Planilla de destajos (pago semanal por volumen)
- Automatización ISR (25%) e IVA (12%)

### Seguridad y Roles (RBAC)

| Rol | Acceso |
|-----|--------|
| Administrador | Todo el sistema + auditoría |
| Gerente | Dashboard, proyectos, finanzas, informes |
| Residente | Campo, bitácora, avances, calidad |
| Compras | Bodega, órdenes de compra, proveedores |
| Bodeguero | Inventarios, vales, recepciones |

### Notificaciones en Tiempo Real

- Sistema in-app con panel + badge en Header
- Web Notification API (permiso del navegador)
- Eventos: checklist rechazado, orden de cambio, stock crítico, desviación rendimiento
- Persistencia en localStorage
- 57 tablas con realtime habilitado

### BIM / IFC

- Visor IFC con Three.js + web-ifc
- Orbitar, zoom, seccionar (clipping plane), auto rotate
- Vincular elementos BIM con renglones de presupuesto
- Comparativa avance físico: modelo BIM vs campo
- Cubicación desde modelo IFC

### Cumplimiento y Calidad

- SSO: Reporte incidentes, checklist diario (11 items), estadísticas días sin accidentes
- Control calidad: pruebas laboratorio (concreto, suelos, acero), NC → plan → cierre
- Gestión documental: planos por disciplina+versión, RFI, Submittals

### Plantillas de Proyectos

- Dashboard con métricas (total, por categoría, más usadas, favoritas)
- Modal de edición completa (presupuesto, hitos, riesgos, checklist)
- Bulk actions: selección múltiple, eliminar/exportar en lote
- Diff visual de versiones (PlantillaVersionDiff.tsx)
- Selector visual en Proyectos.tsx con sugerencias inteligentes

### Weather

- Clima actual + pronóstico 7 días
- Persistencia en Supabase
- Widget en Dashboard
- Export PDF/Excel
- Impacto en obra por condiciones climáticas

### Auditoría

- Pantalla Auditoria.tsx con KPIs, filtros (tabla/usuario/operación/fecha)
- LogAuditoría con persistencia localStorage (últimos 200)
- Dashboard: cards de Integridad de Datos y Performance de Queries
- ErrorLog con modal de resolución, chart de errores por tipo
- `addAuditEntry` integrado en addProyecto/updateProyecto/deleteProyecto
- error-db-logger.ts (logErrorToDatabase, resolveErrorInDatabase, cleanupOldErrorsInDatabase)

### Dashboard Predictivo y BI

- Proyección costo final (EAC = BAC/CPI)
- Estimación fecha finalización basada en rendimiento actual
- Riesgos: actividades con mayor desviación histórica
- Exportación inteligente: reportes automáticos semanales, formatos JSON/CSV/PDF

---

## Estructura del Proyecto

```
src/
├── __tests__/              # 17 tests globales
├── components/             # Componentes compartidos
│   ├── ui/                 # 48 primitivas shadcn/ui
│   ├── AppLayout.tsx       # Layout principal con 43 lazy screens
│   ├── ErrorBoundary.tsx
│   ├── SkeletonScreens.tsx
│   └── SyncStatusBadge.tsx
├── erp/
│   ├── __tests__/          # 13 tests específicos ERP
│   ├── components/         # 27+ componentes ERP
│   │   ├── financiero/
│   │   ├── proyectos/      # 16 componentes
│   │   ├── seguimiento/    # 7 componentes
│   │   └── shared/         # 7 componentes
│   ├── hooks/              # 11 hooks
│   ├── screens/            # 43 screens (lazy-loaded)
│   ├── services/           # 11 servicios
│   ├── store/              # Estado (schemas/ + zustandStore.ts)
│   │   └── schemas/        # 19 schemas Zod canónicos
│   ├── store.tsx           # ErpProvider, contexto, loadFromStorage, forceSync
│   ├── types/              # Types + extensiones
│   ├── utils/              # calculations, colors, reordering
│   └── data/               # Catálogos presupuestos
├── hooks/                  # 6 hooks globales
├── lib/                    # Utilidades (i18n, themes, supabase, etc.)
│   ├── i18n/               # es.json (~950 keys) + en.json (~950 keys)
│   ├── __tests__/          # 3 tests
│   ├── theme-manager.ts    # 8 temas + sync visual settings
│   └── decimalUtils.ts     # Decimal.js precision BigDecimal
├── middleware/              # rateLimit.ts
├── styles/                 # design-tokens, themes, responsive
└── workers/                # apu-calc.worker + compression.worker

supabase/
├── migrations/             # 124 migraciones SQL
├── functions/              # Edge Function: calcular-proyecto (Deno)
├── seed_data/              # departamentos_gt + municipios_gt
└── config.toml
```

---

## Tests (33+ archivos, 1029/1030 pasando)

### Tests Unitarios Globales (`src/__tests__/`)
| Archivo | Tests | Área |
|---------|-------|------|
| `erp-store-operations-full.test.tsx` | 254 | Operaciones store |
| `erp-estilos-ui.test.tsx` | 72 | Estilos UI |
| `components-ui.test.tsx` | 72 | Componentes |
| `erp-validacion-funcional.test.tsx` | 57 | Validación funcional |
| `erp-comprehensive-system.test.tsx` | — | Sistema integral |
| `accessibility.test.tsx` | 21 | Accesibilidad axe-core |
| `ErrorLog.test.tsx` | 18 | Error log |
| `filtro-proyecto.test.tsx` | 5 | Filtro proyectos |
| `design-tokens.test.tsx` | — | Design tokens |
| `themes.test.tsx` | — | Temas |
| `theme-manager.test.tsx` | — | Theme manager |
| `erp-money.test.tsx` | — | Precisión monetaria |
| `erp-kpis-data-integrity.test.tsx` | — | KPIs integridad |
| `supabase-bilateral-sync.test.ts` | — | Sync bilateral |
| `calculation-engine.test.ts` | — | Motor cálculo |
| `db-alignment.test.tsx` | — | Alineación DB |
| `session3-comprehensive.test.tsx` | — | Tests sesión 3 |

### Tests ERP (`src/erp/__tests__/`)
| Archivo | Tests | Área |
|---------|-------|------|
| `financiero.test.ts` | 35 | Financiero |
| `utils.test.ts` | 21 | Utilidades |
| `store.test.ts` | 10 | Store |
| `validate-fk.test.ts` | 7 | FK validation |
| `zustand-migration.test.ts` | 6 | Migración Zustand |
| `store.presupuestos.test.ts` | 4 | Presupuestos store |
| `store.ordenes.test.ts` | 3 | Órdenes store |
| `integrity.test.ts` | 3 | Integridad |
| `e2e-proyecto.test.ts` | 1 | E2E proyecto |
| `apu-motor.test.ts` | — | APU motor |
| `store.sync-presupuesto.test.ts` | — | Sync presupuesto |
| `timestamps.test.ts` | — | Timestamps |
| `weather.test.ts` | — | Weather |

### Tests Librería (`src/lib/__tests__/`)
| Archivo | Tests | Área |
|---------|-------|------|
| `auto-repair.test.ts` | 27 | Auto-repair |
| `error-db-logger.test.ts` | — | Error DB logger |
| `i18n-screens.test.ts` | — | i18n screens |

### Comandos
```bash
npm run test              # Vitest (unitarios)
npm run test -- --coverage  # Con cobertura
npm run test:e2e          # Playwright E2E
npm run test:visual       # Regresión visual
```

---

## Edge Functions (Deno)

- `supabase/functions/calcular-proyecto/index.ts`
- Dosificación de concreto, movimiento de tierra, pavimentos, rentabilidad
- Acceso a datos vía cliente Supabase con RLS

---

## Base de Datos

### Tablas Principales (34+ sincronizadas)

| Tabla | Propósito |
|-------|-----------|
| `erp_proyectos` | Proyectos de construcción |
| `erp_presupuestos` | Presupuestos APU |
| `erp_movimientos` | Movimientos financieros (particionada por mes) |
| `erp_audit_log` | Logs de auditoría (particionada por mes) |
| `erp_empleados` | RRHH |
| `erp_materiales` | Bodega/inventarios |
| `erp_ordenes_compra` | Órdenes de compra |
| `erp_proveedores` | Proveedores |
| `erp_hitos` | Hitos |
| `erp_riesgos` | Riesgos |
| `erp_crm_pipeline` | CRM/Kanban |
| `erp_plantillas_proyectos` | Plantillas |
| `erp_cotizaciones` | Cotizaciones |
| `erp_cuentas_cobrar` | Cuentas por cobrar |
| `erp_cuentas_pagar` | Cuentas por pagar |
| `erp_departamentos_gt` | Departamentos Guatemala |
| `erp_municipios_gt` | Municipios Guatemala |
| `erp_api_keys` | API pública |
| `erp_error_logs` | Logs de error |
| `erp_access_log` | Logs de acceso |
| +15 más | Resto de entidades |

### Migraciones DB Aplicadas (124)

| Migración | Descripción |
|-----------|-------------|
| 000001 → 000062 | Schema base, RLS, Realtime, motor cálculo, seguridad, índices, auditoría |
| 000063 | Fix critical gaps (plantillas, exec_sql RPC) |
| 000064 | Schema alignment code-db (version columns, destajos/recepciones/pagos) |
| 000065 | DB-app alignment (created_at/updated_at, RLS 5 tablas motor cálculo) |
| 000066 | Security advisor fixes (drop 40+ permissive policies, revoke anon SELECT) |
| 000067 | API pública (erp_api_keys, RPC functions) |
| 000068 | Partitioning (erp_movimientos, erp_audit_log por mes) |
| 000069 → 000124 | RLS corrections, missing tables, alignment, geographic data, cleanup |

### RLS (Row Level Security)

- 52/52 tablas con políticas RLS granulares
- 40+ políticas permisivas eliminadas (migration 066)
- anon SELECT revocado de 62+ tablas operacionales
- exec_sql RPC restringido a postgres owner
- Roles: administrador, gerente, residente, compras, bodeguero

---

## Almacenamiento y Sincronización

- **localStorage** con validación Zod + compresión lz-string
- **Mutation Queue**: offline-first con retry exponencial (max 10)
- **forceSync**: batch INSERT/UPDATE/DELETE (BATCH_SIZE=50)
- **fetchInitialData**: carga desde Supabase en primer auth
- **Realtime**: 57 tablas con suscripciones
- **Service Worker**: PWA offline (sw.js v7)
- **Rate limiting**: token bucket
- **scheduleHealthCheck**: monitoreo cada 10 min

---

## Estilos y Temas

### 8 Temas Implementados
| Tema | Variante |
|------|----------|
| Ant Design | light / dark |
| Material 3 | light / dark |
| Dark Pro | dark |
| Glassmorphism | light / dark |
| Neomorphism | light / dark |

### Design System
- Design tokens CSS en `src/styles/design-tokens.css`
- Tema variables en `src/styles/theme-variables.css`
- Theme manager en `src/lib/theme-manager.ts`
- Visual settings sincronizadas vía `syncAllVisualSettings`
- Responsive CSS en `src/styles/responsive.css`
- Accesibilidad WCAG AA (contrast ratio 4.5:1 mínimo)

---

## Scripts Disponibles

```bash
npm run dev                  # Dev server (puerto 8080)
npm run build                # Build producción
npm run typecheck            # TypeScript check
npm run lint                 # ESLint
npm run lint:fix             # ESLint auto-fix
npm run test                 # Vitest unitarios
npm run test:e2e             # Playwright E2E
npm run test:visual          # Regresión visual
npm run preview              # Preview build
npm run seed:supabase        # Seed datos reales
npm run security:audit       # Auditoría seguridad
npm run backup:create        # Backup DB
npm run backup:verify        # Verificar backup
```

---

## Issues Conocidos / Deuda Técnica

| # | Item | Estado |
|---|------|--------|
| 1 | Google OAuth verificación de dominio | Pendiente (configuración manual en GCP) |
| 2 | Overlay planos vs modelo en Visor BIM | Pendiente |
| 3 | Refresh token rotation en Supabase | Pendiente |
| 4 | Redondeo cosmético en cálculo de avance (66.67 vs 67) | Cosmético |
| 5 | Build warnings "use client" (Ant Design v5) | Normal |
| 6 | web-ifc: 3.6MB chunk | Normal para proyecto BIM |

---

## Convenciones de Desarrollo

Ver `AGENTS.md` para notas detalladas para agentes.

- **Sin comentarios** en código fuente (`//` o `/* */`)
- **Schemas Zod**: `z.enum([...] as const)`, alineados 1:1 con interfaces TypeScript
- **i18n**: `t()` con formato `{{key}}` (no `{key}`)
- **Store**: usar `loadFromStorage` con schema canónico
- **Vistas**: `View` type + lazy import + `ALLOWED` por rol
- **Decimal.js**: precisión BigDecimal para cálculos financieros

---

## Despliegue

- **Vercel**: https://construsmart-wm2026.vercel.app/
- **CI/CD**: GitHub Actions + Vercel automático
- **Backup**: GitHub Actions semanal
- **Lighthouse CI**: en PRs
- **Regresión visual**: Playwright (8 desktop + 3 mobile)

---

## Licencia

Proyecto privado — CONSTRUSMART ERP

*Última actualización: 2026-07-18*
