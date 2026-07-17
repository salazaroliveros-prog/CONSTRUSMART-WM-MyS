# Construsmart ERP — Comprehensive Audit & Remediation Plan

**Date**: 2026-07-16
**Scope**: 42 screens × 4 dimensions (UX/UI, Functional, IA/Sidebar, Business Logic)

---

## 1. Executive Summary

| Metric | Value |
|--------|-------|
| Total screens | 42 |
| Screens importing `ui.ts` (consistent design) | 22 (52%) |
| Screens NOT importing `ui.ts` | 20 (48%) |
| Screens reachable from sidebar | 23 |
| Screens **not** reachable from sidebar | **19** |
| Screens with missing empty-state | 6 |
| Screens with inline Zod schemas (should be canonical) | 3 |
| Screens with mock/fake data | 1 (Dashboard) |
| Screens with broken interactivity | 1 (CRM delete) |
| Screens leaking Ant Design | 2 (Auditoria.tsx, Ajustes.tsx) |
| Screens with hardcoded i18n strings | 1 (BottomNavigation) + Sidebar groups |
| `window.confirm` calls | 0 ✅ |
| `Modal.confirm` calls | 0 ✅ |

---

## 2. Severity Ratings

- **Critical**: Broken navigation / data integrity / user cannot complete core workflow
- **High**: Major UX inconsistency / missing states / theme leakage
- **Medium**: Cosmetic / i18n gaps / code organization
- **Low**: Minor code style / consolidation

---

## 3. Findings by Dimension

### 3.1 UX/UI Consistency

| # | File | Line(s) | Finding | Severity |
|---|------|---------|---------|----------|
| 1 | `Ajustes.tsx` | 5 | Imports 8+ Ant Design components (`Layout, Tabs, Input, Button, Switch, Select, Radio, Tooltip`) — **breaks `ui.ts` design system** | **High** |
| 2 | `Auditoria.tsx` | 5 | Imports `Table, Button, Modal, Input, Space, Select, DatePicker, Skeleton, Tooltip` from antd — **same theme leak** | **High** |
| 3 | `CalidadCumplimiento.tsx` | 1-33 | Uses raw Tailwind classes (`bg-card, border-border, text-foreground, text-muted-foreground`) — no import of `ui.ts` at all | **Medium** |
| 4 | `Dashboard.tsx` | 1-431 | Uses shared components (`KPICard, StatusBadge, TableWithRowActions, ExecutiveAlerts`) correctly ✅ | — |
| 5 | `Presupuestos.tsx` | 63-90 | Uses raw `<table>` instead of `TableWithRowActions`; imports only basics from `ui.ts` | **Medium** |
| 6 | `CRM.tsx` | 14 | Imports full `ui.ts` suite ✅ — but uses raw `<table>` instead of `TableWithRowActions` | **Medium** |
| 7 | `Riesgos.tsx` | 7 | Imports only `INPUT` from `ui.ts`; missing `SECTION_TITLE, CARD, KPI_CARD, BUTTON_PRIMARY, BUTTON_SECONDARY` | **Medium** |
| 8 | `Hitos.tsx` | 8 | Imports only `BUTTON_PRIMARY, BUTTON_SECONDARY, INPUT`; missing `CARD, KPI_CARD, SECTION_TITLE` | **Medium** |
| 9 | `Notificaciones.tsx` | 1-34 | Does **not** import `ui.ts` at all — uses raw styles throughout | **Medium** |
| 10 | `EntradasAlmacenOC.tsx` | 9 | Imports only `INPUT, BUTTON_PRIMARY, BUTTON_SECONDARY` — partial `ui.ts` adoption | **Medium** |
| 11 | `PlanillaDestajos.tsx` | — | No `ui.ts` import; need to verify | **Low** |
| 12 | `Activos.tsx` | — | No `ui.ts` import; need to verify | **Low** |
| 13 | `RRHH.tsx` | 9 | Imports `CARD, CARD_TITLE, BUTTON_DARK, BUTTON_ACCENT, INPUT, ERROR_STATE` ✅ | — |
| 14 | `ProfitabilityAnalytics.tsx` | 17 | Imports full color constants + components ✅ | — |

**Screens NOT importing `ui.ts` (20 total):** CalidadCumplimiento, Notificaciones, Administracion, PlanillaDestajos, Activos, ExportacionInteligente, VisorBIM, Predictivo, ErrorLog, ComercialFin, BasePrecios, Documentos, SSOCalidad (no ui import), Seguimiento (uses shared components), Financiero, OrdenesCambio (minimal), APU, etc.

### 3.2 Functional / Interaction Issues

| # | File | Line(s) | Finding | Severity |
|---|------|---------|---------|----------|
| 1 | **CRM.tsx** | **84** | **Delete button has `onClick={(e) => { e.stopPropagation(); }}` with NO actual delete function** — you cannot delete licitaciones from the UI | **Critical** |
| 2 | **Dashboard.tsx** | 69-72, 93-96 | **Hardcoded mock trend values** (`proyectosVsMesAnterior = 2`, etc.) and **hardcoded sparkline arrays** (`sparklineProyectos = [8,9,10,...]`) — show fake trends even with 0 projects | **Critical** |
| 3 | Dashboard.tsx | 116, 128, 140 | ExecutiveAlerts `action.onClick` are empty `() => {}` stubs — non-functional "Ver Riesgos", "Analizar", "Revisar" buttons | **High** |
| 4 | CRM.tsx | 76 | Uses `setSelectedId(l.id)` on row click but `selectedId` is **never defined** (TypeScript should flag this) | **High** |
| 5 | Presupuestos.tsx | — | No empty-state branch — shows empty `<table>` when no presupuestos exist | **High** |
| 6 | CRM.tsx | 63-90 | No empty-state branch — shows raw `<table>` with empty `<tbody>` when no licitaciones | **High** |
| 7 | Hitos.tsx | — | No empty-state — empty list rendering with no message | **Medium** |
| 8 | Impuestos.tsx | — | No empty-state — virtualized list renders 0 rows with no message | **High** |
| 9 | MuroObra.tsx | — | No empty-state — empty filtered posts with no message | **High** |
| 10 | SSOCalidad.tsx | — | No empty-state for incidentes/pruebas/nc/liberaciones sub-tabs | **High** |
| 11 | SSOCalidad.tsx | 15-34 | Inline Zod schemas (`incidenteSchema, pruebaSchema, ncSchema, liberacionSchema`) instead of canonical `store/schemas/` | **Medium** |
| 12 | MuroObra.tsx | — | `mensajeSchema` inline instead of canonical `muroSchema` from `store/schemas/social.ts` | **Medium** |
| 13 | CRM.tsx | 16-25 | `licitacionFormSchema` defined inline — should be canonical | **Medium** |

### 3.3 IA / Sidebar Navigation

| # | File | Line(s) | Finding | Severity |
|---|------|---------|---------|----------|
| 1 | `Sidebar.tsx` | — | **19 screens are NOT in the ITEMS array** and unreachable from sidebar: crm, cotizaciones, activos, visor-bim, baseprecios, muro, sso-calidad, calidad-cumplimiento, documentos, error-log, impuestos, planilla-destajos, proveedor-analytics, weather, exportacion, comercial-fin, rendimiento-campo (via View only), auditoria, predictivo | **Critical** |
| 2 | `Sidebar.tsx` | 77-83 | Group labels (`Planificación`, `Ejecución`, `Suministro`, `Finanzas`, `Administración`) are hardcoded Spanish with i18n key mapping — **mapping exists but labels in code are Spanish** | **High** |
| 3 | `Sidebar.tsx` | 64-65 | `cuentas-cobrar` and `cuentas-pagar` both use `TrendingUp` icon — **icon collision** | **Low** |
| 4 | `Sidebar.tsx` | 70-72 | `conflicts` and `riesgos` both use `AlertTriangle` icon — **icon collision** | **Low** |
| 5 | `BottomNavigation.tsx` | 10-15, 22-27 | **Hardcoded Spanish labels** (`Dashboard`, `Proyectos`, `Financiero`, `Bodega`, `Más`, `Presupuestos`) instead of `t()` | **High** |
| 6 | `BottomNavigation.tsx` | 10-15 | `MORE_ITEMS` only has 4 items — many screens inaccessible on mobile | **High** |
| 7 | Sidebar ITEMS | 47, 55 | `presupuestos` and `rendimiento-campo` use `id` strings that may not match `View` type properly | **Medium** |

### 3.4 Business Logic / Data Processing

| # | File | Line(s) | Finding | Severity |
|---|------|---------|---------|----------|
| 1 | Dashboard.tsx | 93-96 | Hardcoded sparkline arrays — **misleading data visualization** | **Critical** |
| 2 | Dashboard.tsx | 69-72 | Hardcoded vs-mes-anterior trend values — **misleading** | **Critical** |
| 3 | Dashboard.tsx | 385-425 | Stock/inventory data correctly uses real `materiales[]` — **correct** ✅ | — |
| 4 | Dashboard.tsx | 229-232 | Financial data correctly computed from `cuentasCobrar`/`cuentasPagar` — **correct** ✅ | — |
| 5 | Dashboard.tsx | 99-144 | ExecutiveAlerts correctly show empty array when no risks/variances — **correct** ✅ | — |
| 6 | `Presupuestos.tsx` | — | Uses `new Date().toISOString()` for `createdAt` instead of store default | **Low** |
| 7 | Various | — | 5 screens use `setTimeout(() => setLoading(false), N)` instead of actual async resolution — inconsistent UX | **Medium** |

---

## 4. Sidebar Coverage Map

### In Sidebar (23 items)
dashboard, proyectos, notificaciones, riesgos, presupuestos, apu, hitos, plantillas, seguimiento, ordenes-cambio, rendimiento-campo (via View), bodega, logistica, entradas-almacen, financiero, cuentas-cobrar, cuentas-pagar, profitability, rrhh, conflicts, admin-sistema, ajustes

### NOT in Sidebar (19 items — CRITICAL)
crm, cotizaciones, activos, visor-bim, baseprecios, muro, sso-calidad, calidad-cumplimiento, documentos, error-log, impuestos, planilla-destajos, proveedor-analytics, weather, exportacion, comercial-fin, auditoria, predictivo, rendimiento-campo (needs View enum)

---

## 5. Remediation Plan

### P0 — URGENT (Critical)

| # | Task | Files | Complexity |
|---|------|-------|------------|
| 1 | **Fix CRM delete button**: wire `deleteLicitacion(id)` to the Trash2 button's `onClick` | `CRM.tsx:84` | 1 line |
| 2 | **Strip Dashboard mock data**: remove hardcoded sparkline arrays and fake trends; compute real trends from historical data or omit sparklines when data is empty | `Dashboard.tsx:69-72,93-96` | 30 lines |
| 3 | **Add 19 missing screens to Sidebar ITEMS**: extend `ITEMS` array with all orphaned screens, create missing `View` enum entries | `Sidebar.tsx`, `store.tsx:54`, `AppLayout.tsx` | ~60 lines |

### P1 — HIGH

| # | Task | Files | Complexity |
|---|------|-------|------------|
| 4 | **Fix Ajustes antd leak**: replace `Tabs, Input, Button, Switch, Select, Radio, Tooltip` with `ui.ts` or custom equivalents | `Ajustes.tsx:5` | Medium |
| 5 | **Fix Auditoria antd leak**: same pattern as Ajustes | `Auditoria.tsx:5` | Medium |
| 6 | **Add empty-state branches** to 6 screens: Presupuestos, CRM, Hitos, Impuestos, MuroObra, SSOCalidad | 6 files | 20 lines each |
| 7 | **Fix BottomNavigation hardcoded labels**: wrap all label strings in `t()` | `BottomNavigation.tsx:10-15,22-27,67` | Small |
| 8 | **Fix Sidebar group labels**: ensure `GROUP_LABELS` map drives all rendered group labels via `t()` | `Sidebar.tsx:77-83` | Small |
| 9 | **Fix CRM undefined `selectedId`**: remove or declare the state variable | `CRM.tsx:76` | 1 line |
| 10 | **Add skeleton loading** to screens missing it: Dashboard (uses Skeleton ✅ but many areas not wrapped), Financiero, Proyectos | 3 files | Medium |
| 11 | **Fix ExecutiveAlerts action handlers**: wire to real navigation (use `setView`) | `Dashboard.tsx:116,128,140` | 3 lines |

### P2 — MEDIUM

| # | Task | Files | Complexity |
|---|------|-------|------------|
| 12 | **Move inline Zod schemas** to canonical `store/schemas/`: SSOCalidad (4 schemas), MuroObra (mensajeSchema), CRM (licitacionFormSchema) | 3 files + 3 new schema files | Medium |
| 13 | **Consolidate local types** in Hitos.tsx (`TipoHito, HitoItem, HitoUpdate`) into canonical `types.ts` | `Hitos.tsx:10-39`, `types.ts` | Small |
| 14 | **Unify loading-state patterns**: replace `setTimeout(() => setLoading(false), N)` with immediate `setLoading(false)` or real async | 5 files (Presupuestos, Riesgos, Impuestos, Hitos, MuroObra) | Small |
| 15 | **Add `rendimiento-campo` View** if missing from the union type | `store.tsx:54` | 1 line |
| 16 | **Fix icon collisions**: `cuentas-cobrar`/`cuentas-pagar` both use `TrendingUp`; `conflicts`/`riesgos` both use `AlertTriangle` | `Sidebar.tsx:64-65,70-71` | Small |
| 17 | **Add `CalidadCumplimiento` (hardcoded 87%/12/45)** — replace static values with real store data | `CalidadCumplimiento.tsx` | Small |

### P3 — LOW / PHASE 2

| # | Task | Complexity |
|---|------|------------|
| 18 | Break up Weather.tsx (1018 lines) into smaller components | Large |
| 19 | Add i18n linting coverage across all 42 screens | Medium |
| 20 | Expand `ui.ts` with `PAGE_CONTAINER`, `PAGE_HEADER`, `PAGE_FILTERBAR` constants | Small |
| 21 | Audit and standardise color-constant imports across all 20 non-importing screens | Medium |

---

## 6. Implementation Order

```
Week 1: P0 items (CRM delete, Dashboard mock data, Sidebar gaps)
Week 2: P1 items 4-8 (antd leaks, empty states, i18n labels, skeleton)
Week 3: P1 items 9-11 (CRM selectedId, skeleton, ExecutiveAlerts wiring)
Week 4: P2 items 12-17 (schemas, types, loading patterns, icons, CalidadCumplimiento)
Phase 2: P3 items (Weather refactor, i18n linting, ui.ts expansion)
```

---

## 7. Current State (Post-Implementation Tracking)

| Milestone | Status |
|-----------|--------|
| CRM delete button fix | [ ] |
| Dashboard mock data stripped | [ ] |
| 19 missing screens added to sidebar | [ ] |
| Ajustes antd leak fixed | [ ] |
| Auditoria antd leak fixed | [ ] |
| Empty-state branches added | [ ] |
| BottomNavigation i18n | [ ] |
| Sidebar group labels i18n | [ ] |
| CRM selectedId fixed | [ ] |
| Skeleton loading added | [ ] |
| ExecutiveAlerts wired | [ ] |
| Inline schemas moved | [ ] |
| Hitos types consolidated | [ ] |
| Loading patterns unified | [ ] |
| Icon collisions fixed | [ ] |
| CalidadCumplimiento data-bound | [ ] |
