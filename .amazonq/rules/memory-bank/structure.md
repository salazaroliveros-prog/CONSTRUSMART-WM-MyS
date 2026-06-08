# CONSTRUSMART ERP — Project Structure

## Root Directory Layout

```
CONSTRUSMART/
├─ src/                        # Application source code
│  ├─ erp/                     # Core ERP domain (screens, store, types, hooks)
│  ├─ components/              # Shared UI components (shadcn/ui, antd wrappers, layout)
│  ├─ lib/                     # Utility libraries (supabase, i18n, security, storage)
│  ├─ hooks/                   # Global React hooks
│  ├─ pages/                   # Top-level route pages
│  ├─ styles/                  # Global CSS (themes, responsive)
│  ├─ types/                   # Global TypeScript types (supabase.ts)
│  └─ utils/                   # Utility functions (theme, responsive, WCAG)
├─ supabase/migrations/        # SQL migration files (ordered numerically)
├─ public/                     # Static assets (icons, logos, manifest, sw.js)
├─ scripts/                    # Build/utility scripts
├─ .amazonq/rules/             # Amazon Q rules and Memory Bank docs
└─ .github/workflows/          # CI/CD pipeline (Vercel deploy)
```

---

## src/erp/ — Core ERP Domain

This is the most important directory. All business logic lives here.

```
src/erp/
├─ screens/              # Full-page screen components (one per module)
│  ├─ Dashboard.tsx
│  ├─ Proyectos.tsx
│  ├─ Presupuestos.tsx
│  ├─ Financiero.tsx
│  ├─ Bodega.tsx
│  ├─ Seguimiento.tsx
│  ├─ RRHH.tsx
│  ├─ CRM.tsx
│  ├─ LogisticaCompras.tsx
│  ├─ RendimientoCampo.tsx
│  ├─ ComercialFinanzas.tsx
│  ├─ Administracion.tsx
│  ├─ Login.tsx
│  └─ ... (20+ more screens)
├─ components/           # Reusable ERP UI widgets
│  ├─ Header.tsx
│  ├─ Sidebar.tsx
│  ├─ GanttChart.tsx
│  ├─ EnhancedGantt.tsx
│  ├─ IFCViewer.tsx
│  ├─ PresupuestoCard.tsx
│  ├─ CriticalRenglonAlert.tsx
│  ├─ KpiCard.tsx
│  ├─ Charts.tsx
│  └─ ... (25+ more widgets)
├─ hooks/                # ERP-specific React hooks (Redux + Supabase selectors)
│  ├─ useErpRedux.ts     # Master hook combining all slices
│  ├─ useProyectosRedux.tsx
│  ├─ usePresupuestosRedux.tsx
│  ├─ useMaterialesRedux.tsx
│  ├─ useOrdenesRedux.tsx
│  ├─ useEmpleadosRedux.tsx
│  └─ useNotifications.ts
├─ __tests__/            # Vitest unit tests (76 tests total)
│  ├─ store.test.ts
│  ├─ store.presupuestos.test.ts
│  ├─ store.ordenes.test.ts
│  ├─ financiero.test.ts
│  ├─ integrity.test.ts
│  └─ utils.test.ts
├─ store.tsx             # Central Zustand/Context state store + Supabase sync
├─ types.ts              # All ERP domain TypeScript interfaces
├─ data.ts               # Seed/reference data (insumos, rendimientos)
├─ export.ts             # PDF/CSV export utilities
├─ utils.ts              # ERP utility functions
└─ ui.ts                 # UI helpers
```

---

## src/components/ — Shared UI Layer

```
src/components/
├─ ui/                   # shadcn/ui primitives (button, dialog, table, tabs, etc.)
├─ antd/                 # Ant Design wrapper components (AntButton, AntModal, etc.)
├─ AppLayout.tsx         # Root layout: AuthGuard + Sidebar + Header + screen router
├─ ErrorBoundary.tsx     # React error boundary
├─ ResponsiveLayout.tsx  # Responsive wrapper
├─ ResponsiveGrid.tsx    # Grid with breakpoint-aware columns
└─ theme-provider.tsx    # next-themes integration
```

---

## src/lib/ — Infrastructure & Utilities

```
src/lib/
├─ supabase.ts           # Supabase client (PKCE flow, singleton)
├─ i18n/                 # Internationalization
│  ├─ es.json            # Spanish (672+ keys)
│  ├─ en.json            # English (672+ keys)
│  └─ index.ts           # t() translation function
├─ security.ts           # XSS sanitization, input validation
├─ security-audit.ts     # Audit logging helpers
├─ storage.ts            # localStorage/IndexedDB abstraction
├─ csrf.ts               # CSRF token utilities
├─ safeLogger.ts         # Production-safe console wrapper
├─ themes.ts             # Theme definitions
└─ utils.ts              # cn() (clsx + tailwind-merge)
```

---

## Core Architectural Patterns

### 1. State Management

The app uses a **hybrid state pattern**:
- **React Context + useState** (`ErpProvider` in `store.tsx`) as the primary global store
- **Redux Toolkit** slices exist as a secondary pattern (hooks in `erp/hooks/` use `useErpRedux`)
- Local component state for UI-only concerns

```
ErpProvider (store.tsx)
├─ proyectos[], presupuestos[], movimientos[], empleados[]
├─ materiales[], ordenesCompra[], proveedores[], eventos[]
├─ selectedProyectoId — cross-module project linking
└─ CRUD actions: add*/update*/delete* + Supabase sync
```

### 2. Screen Routing (AppLayout.tsx)

No React Router for screen switching — uses a **view-name string + object map** pattern:

```typescript
// AppLayout.tsx manages viewName state
const screens = { dashboard: <Dashboard />, proyectos: <Proyectos />, ... }
// AuthGuard checks role before rendering
if (!user || !allowedViews.includes(viewName)) return <Login />
```

### 3. Supabase Sync Pattern

Every store action follows: **local state update first → Supabase INSERT/UPDATE/DELETE async**. Offline-first: if Supabase fails, local state persists.

### 4. Data Cascades

Critical cascades enforced in `store.tsx`:
- **P1 (Stock validation):** `addValeSalida` throws if stock insufficient (line ~2067)
- **P2 (OC→Stock):** `updateOrden` auto-increments material stock on "recibida" (line ~1993)
- **Avance→Proyecto:** `addAvance` recalculates weighted average `avance_fisico` on project (line ~1970)

### 5. RBAC Pattern

Role-based access via `allowedViews[]` arrays per role. `AppLayout` guards every render cycle — unauthorized users are redirected to `<Login />`.

### 6. Database Schema (Supabase PostgreSQL — 32 tables)

```
erp_proyectos (root entity)
  └─ erp_presupuestos (1:N, renglones stored as JSONB)
  └─ erp_avances (1:N)
  └─ erp_movimientos (1:N)
  └─ erp_vales_salida (1:N)
  └─ erp_bitacora (1:N)

erp_renglones → erp_insumos, erp_sub_renglones (1:N)
erp_ordenes_compra (items as JSONB) → cascades to erp_materiales.stock
logs_sistema (immutable audit trail via trigger fn_log_audit)
public.profiles (Supabase Auth users + role)
```

All tables have RLS policies enforced by user role stored in `public.profiles`.

---

## Key File Relationships

| File | Depends On | Used By |
|---|---|---|
| `store.tsx` | `types.ts`, `lib/supabase.ts`, `lib/storage.ts` | All screens via `useErpRedux` |
| `AppLayout.tsx` | `store.tsx`, all screens | `App.tsx` |
| `types.ts` | — | `store.tsx`, all screens |
| `lib/supabase.ts` | `.env` vars | `store.tsx`, `hooks/useSupabaseRealtime.ts` |
| `erp/hooks/useErpRedux.ts` | `store.tsx` | All screen components |
