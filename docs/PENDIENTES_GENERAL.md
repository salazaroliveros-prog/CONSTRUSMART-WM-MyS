# Pendientes Generales — CONSTRUSMART ERP

**Fecha:** 2026-07-17 (Actualizado)
**Base:** Análisis de `INCONSISTENCIAS_PENDIENTES.md` + `UI_REFINEMENT_REMAINING.md` + `IMPLEMENTATION_TRACKING.md` + código fuente.

---

## Estado de implementación

| Categoría | Estado | Avance |
|-----------|--------|--------|
| **Schemas Zod nuevos** (cliente, proveedor, empleadoForm, ordenCambio) | ✅ CREADOS | 4/4 |
| **Exportación en index.ts** | ✅ COMPLETADO | 1/1 |
| **Test de alineación** | ✅ 13/13 PASANDO | 1/1 |
| **Validación inputs ProyectoForm** | ⬜ PENDIENTE | 0/1 |
| **UI/UX truncate** | ⬜ PENDIENTE | 0/30 |
| **Nuevos formularios** | ⬜ PENDIENTE | 0/7 |
| **Refactor técnico** | ⬜ PENDIENTE | 0/5 |
| **DB (I2, I3, I4, D1)** | ⬜ PENDIENTE | 0/4 |

---

## 1. 🎨 UI/UX — Refinamiento tipográfico y renderizado (33 screens)

### 1.1 Aplicar `truncate-1` / `truncate-2` + `title` en contenedores NO tabla AntD
**Prioridad:** Media  
**Screens pendientes (30):**
Activos, Administracion, APUAvanzado, BasePrecios, Bodega, CalidadCumplimiento, ComercialFinanzas, Cotizaciones, CRM, Cuadros, CuentasCobrar, CuentasPagar, Dashboard, DashboardPredictivo, EntradasAlmacenOC, ExportacionInteligente, Financiero, Impuestos, LogisticaCompras, MuroObra, Notificaciones, Presupuestos, ProfitabilityAnalytics, ProveedorAnalytics, RendimientoCampo, ResourceConflicts, RRHH, Seguimiento, SSOCalidad, VisorBIM, Weather

### 1.2 Botones icon-only pequeños (< 36px) en mobile
**Prioridad:** Baja  
**Screens (7):** ProfitabilityAnalytics (4), ResourceConflicts (4), Cotizaciones (3), Bodega (1), Dashboard (1), Financiero (1), Seguimiento (1)  
**Acción:** Añadir `min-w-[44px]` en mobile.

### 1.3 Anchuras arbitrarias fijas (`w-[Npx]`) que causan overflow en mobile
**Prioridad:** Baja  
**Screens (~30):** ProfitabilityAnalytics, SSOCalidad, Bodega, GestionDocumental, Riesgos, Administracion, PlanillaDestajos, ProveedorAnalytics, LogisticaCompras, ComercialFinanzas, Activos, Impuestos, ResourceConflicts, Cuadros, EntradasAlmacenOC, Weather, Cotizaciones, CuentasCobrar, CuentasPagar, DashboardPredictivo, ExportacionInteligente, Seguimiento, MuroObra, VisorBIM, OrdenesCambio, RRHH, CRM, Presupuestos, RendimientoCampo, Hitos, Proyectos, APUAvanzado  
**Acción:** Reemplazar por expresiones fluidas (`min-width: fit-content`, `max-width: 100%`).

---

## 2. 🧩 Inconsistencias DB/app sin resolver

| # | Ítem | Prioridad | Documentación | Estado |
|---|------|-----------|---------------|--------|
| **W5** | Impacto climático en curva S (CurvasS) | Baja | `INCONSISTENCIAS_PENDIENTES.md` | ❌ No implementado |
| **I2** | Partitioning DB (`erp_movimientos`, `erp_audit_log`) | Baja | Ya existe migration 068 | ✅ Migration existe, aplicar en DB |
| **I3** | Rate limiting API endpoints | Media | Requiere edge functions o gateway | ❌ No implementado |
| **I4** | 2FA / MFA real en Supabase Auth | Baja | Requiere configurar en dashboard Supabase | ❌ No implementado |
| **D1** | Verificar existencia de `erp_publicaciones_muro` en DB | Media | Audit report indica que no existe | ❌ Sin verificar |

---

## 3. 📝 Validación de inputs y formularios

### 3.1 Schemas Zod existentes (22 schemas) — todos implementados
- ✅ admin.ts, bodega.ts, calculos.ts, calendario.ts, calidad.ts, errorLog.ts, financiero.ts, gestion.ts, plantillas.ts, presupuestos.ts, profitability.ts, proyectos.ts, reordering.ts, rrhh.ts, seguimiento.ts, social.ts, weather.ts
- ✅ **crm.ts** (NUEVO): clienteSchema, proveedorSchema, empleadoFormSchema, ordenCambioSchema, nitSchema, telefonoGTSchema, dpiSchema

### 3.2 Validaciones pendientes en formularios específicos
| Screen | Formulario | Acción |
|--------|-----------|--------|
| **Proyectos.tsx** | ProyectoForm (crear/editar) | Validar `clienteNit` con regex NIT Guatemala, `clienteEmail`, `telefono` |
| **ProveedorAnalytics** | ProveedorForm | Validar NIT, teléfono, email del proveedor |
| **RRHH.tsx** | EmpleadoForm | Validar DPI (13 dígitos), teléfono, salario mínimo |
| **CRM.tsx** | ClienteForm | Validar NIT, email, teléfono |
| **OrdenesCambio.tsx** | OrdenCambioForm | Validar montos no negativos, fechas coherentes |
| **CuentasCobrar/Pagar** | Form | Validar montos, fechas de vencimiento |
| **Presupuestos.tsx** | RenglonForm | Validar cantidades > 0, precios unitarios > 0 |

---

## 4. 🆕 Nuevos formularios / funcionalidades

| # | Funcionalidad | Prioridad | Descripción |
|---|--------------|-----------|-------------|
| F1 | **Curva S con impacto climático** | Baja | Integrar weather en CurvasS.tsx (ya existe la screen) |
| F2 | **Formulario de configuración de empresa** | Media | Modal/Banner para completar `appSettings.empresaInfo` (nombre, NIT, teléfono, email, dirección, ciudad, país) |
| F3 | **Formulario de importación masiva** | Baja | Subir CSV/Excel para proyectos, empleados, materiales |
| F4 | **Bulk actions en más screens** | Media | Ya existe en PlantillasProyectos. Extender a: Proyectos, Empleados, Materiales |
| F5 | **Vista comparativa de proyectos** | Baja | Grid comparativo con KPIs lado a lado |
| F6 | **Dashboard personalizable** | Media | Widgets configurables por usuario |
| F7 | **Notificaciones push reales** | Baja | Service Worker + Supabase Realtime para notificaciones en segundo plano |

---

## 5. 🛠️ Refactor e implementación técnica

| # | Ítem | Prioridad | Descripción |
|---|------|-----------|-------------|
| R1 | **Migrar cards a ProyectoCardSimple en Proyectos.tsx** | Media | Reemplazar cards inline por componente extraído |
| R2 | **Añadir columna Profitability a tabla proyectos** | Media | Mostrar rentabilidad estimada por proyecto |
| R3 | **Virtual scrolling en más screens** | Baja | Ya existe en BasePrecios, Financiero, Impuestos. Extender a: Movimientos, Presupuestos, CuentasCobrar/Pagar |
| R4 | **Memoizar hooks en screens pesadas** | Media | Ya memoizadas las principales; revisar screens con datasets >1000 registros |
| R5 | **Rate limiting con token bucket** | Media | Ya implementado en store.tsx para forceSync. Extender a API calls de weather y clima |

---

## 6. 📊 Resumen de esfuerzo

| Categoría | Items | Esfuerzo estimado |
|-----------|-------|-------------------|
| UI/UX truncate + title | 30 screens | 4-6 horas |
| Iconos mobile <36px | 7 screens | 1 hora |
| Anchuras fijas a fluidas | ~30 screens | 3-4 horas |
| Validación inputs (6 screens) | 6 screens | 3-4 horas |
| Nuevos formularios (F1-F7) | 7 items | 8-16 horas |
| Refactor técnico (R1-R5) | 5 items | 6-10 horas |
| DB (I2, I3, I4, D1) | 4 items | 2-4 horas (requiere dashboard) |

**Total estimado:** 27-45 horas  
**Prioridad recomendada:** Validación inputs > UI/UX truncate > Formularios > Refactor > DB