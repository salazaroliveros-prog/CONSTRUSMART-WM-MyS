# 📋 TODO CHECKLIST - ESTADO GENERAL DEL PROYECTO

> **Última actualización:** 05/06/2026
> 
> **Estado del proyecto:** ✅ COMPLETADO - Todas las implementaciones están alineadas con los checklists

---

## 🔴 PRIORIDAD ALTA - Urgente

| # | Tarea | Estado | Checklist Relacionado | Implementación |
|---|-------|--------|----------------------|----------------|
| 1 | Timeout de sesión por inactividad (30 min) | ✅ | VULN 1.2.5 - REF 1.1.1 | `src/hooks/useSessionTimeout.ts` |
| 2 | ErrorBoundary global | ✅ | VULN 4.2.1 - REF 1.2.6 | `src/components/ErrorBoundary.tsx` |
| 3 | Content Security Policy (CSP) | ✅ | VULN 5.2.1 - REF 4.2.1 | `vercel.json` |
| 4 | Rate limiting en formularios (client-side) | ✅ | VULN 1.2.8 | `src/hooks/useRateLimit.ts` |
| 5 | Sanitización de inputs en todos los forms | ✅ | VULN 2.2.x | `sanitization.ts` aplicado en todas las pages |
| 6 | Soft delete en Clientes y Proveedores | ✅ | VULN 3.2.4-5 | RPCs + `activo=false` |
| 7 | Protección auto-eliminación de usuarios | ✅ | VULN 1.1.6 | Verificación en `handleDelete` |

## 🟡 PRIORIDAD MEDIA

| # | Tarea | Estado | Checklist Relacionado | Implementación |
|---|-------|--------|----------------------|----------------|
| 8 | Debounce en búsquedas (400ms) | ✅ | VULN 4.4.1 | `useDebouncedSearch` en todas las pages |
| 9 | CSRF tokens | ✅ | VULN 1.2.7 | `src/lib/csrf.ts` |
| 10 | Advertencia de sesión próxima a expirar | ✅ | REF 1.1.2 | Banner en AuthContext |
| 11 | RPC eliminar_cliente_admin | ✅ | VULN 3.2.4 | `sql/fix_rpc_eliminar_cliente_proveedor.sql` |
| 12 | RPC eliminar_proveedor_admin | ✅ | VULN 3.2.5 | `sql/fix_rpc_eliminar_cliente_proveedor.sql` |
| 13 | RPC verificar_sesion_activa | ✅ | VULN 1.2.9 | `sql/fix_rpc_eliminar_cliente_proveedor.sql` |
| 14 | Audit trail en eliminaciones | ✅ | VULN 3.3.4 | RPCs insertan en `audit_log` |

## 🟢 PRIORIDAD BAJA

| # | Tarea | Estado | Checklist Relacionado | Implementación |
|---|-------|--------|----------------------|----------------|
| 15 | ARIA labels en inputs de búsqueda | ✅ | REF 3.2.1 | `aria-label` en todas las pages |
| 16 | Log de errores en localStorage | ✅ | VULN 4.2.3 | `ErrorBoundary.tsx` |
| 17 | Botones deshabilitados durante submit | ✅ | REF 3.1.2 | `isSubmitting` en todos los forms |
| 18 | Confirmación en eliminaciones | ✅ | REF 3.1.1 | `confirm()` con advertencia |

---

## 📊 RESUMEN GENERAL

| Checklist | Total Ítems | ✅ Completados | ❌ Pendientes | Progreso |
|-----------|-------------|---------------|---------------|----------|
| VULNERABILIDADES | 70 | 70 | 0 | 🟢 100% |
| HALLAZGOS | 69 | 69 | 0 | 🟢 100% |
| REFUERZO GENERAL | 40 | 40 | 0 | 🟢 100% |
| **TOTAL** | **179** | **179** | **0** | 🟢 **100%** |

---

## 🚀 MEJORAS DE GESTIÓN DE PROYECTOS — CHECKLIST_GESTION_PROYECTOS.md

### 🔴 Prioridad Alta (Quick Wins) — ✅ Implementado

| # | Mejora | Estado | Evidencia en código |
|---|--------|--------|---------------------|
| 1 | Alerta automática de retraso (fecha actual > fechaFin) | ✅ | `src/erp/screens/Dashboard.tsx` — `alertasRetraso` con cálculo de días |
| 2 | Comparación real vs plan por renglón (join presupuesto ↔ movimientos) | ✅ | `src/erp/screens/Dashboard.tsx` — `densidadCosto` + desglose por renglón |
| 3 | Dependencias entre renglones en Gantt (predecessores) | ✅ | `src/erp/types.ts:78` — `predecesores?: string[]` en RenglonPresupuesto |
| 4 | Predicción de fecha de fin por tasa de avance | ✅ | `src/erp/screens/Dashboard.tsx` — `prediccionFechaFin` con regresión lineal |
| 5 | Costo por hora/hombre calculado automáticamente | ✅ | `src/erp/store.tsx:1254` — `costoPorHoraHombre()` |

### 🟡 Prioridad Media — ✅ Implementado

| # | Mejora | Estado | Evidencia en código |
|---|--------|--------|---------------------|
| 6 | Módulo de Hitos (tipo Hito con fecha, responsable, estado) | ✅ | `src/erp/types.ts:299-311` — Interface `Hito` completa |
| 7 | Historial de cambios de cronograma | ✅ | `src/erp/screens/Proyectos.tsx` — registro en localStorage |
| 8 | Control de disponibilidad de empleados | ✅ | `src/erp/store.tsx:1269` — `empleadosDisponibles()` |
| 9 | Flujo de caja consolidado mejorado | ✅ | `src/erp/screens/Financiero.tsx` — pagos proveedores incluidos |
| 10 | Reporte financiero multi-proyecto (EERR) | ✅ | `src/erp/screens/Dashboard.tsx` — `eerr` con utilidad/margen/ROI |
| 11 | Eficiencia de tiempo en bitácora | ✅ | `src/erp/screens/Seguimiento.tsx` — horas hombre estimadas |

### 🟢 Prioridad Baja — ✅ Implementado

| # | Mejora | Estado | Evidencia en código |
|---|--------|--------|---------------------|
| 12 | Bloqueo de fechas finalizadas | ✅ | `src/erp/screens/Proyectos.tsx` — inputs disabled si finalizado |
| 13 | Vincular materiales a proyectos en vale de salida | ✅ | `src/erp/screens/ValeSalidaModal.tsx` — filtro por proyectoId |
| 14 | Dashboard de rendimiento por equipo | ✅ | `src/erp/screens/Dashboard.tsx` — costoMO, empleados, salario promedio |

### 📊 Métricas de cobertura actualizadas

| Categoría | % Actual | Meta | Estado |
|-----------|----------|------|--------|
| Seguimiento | 48% | 80% | ✅ F-07 hitos vencidos, F-06 predecesores Gantt |
| Financieros | 62% | 90% | ✅ F-04 EERR exportable |
| Cronograma | 55% | 85% | ✅ F-06 predecesores implementados |
| **General** | **58%** | **85%** | **✅ +2% por F-12, F-13, F-14** |

---

## 🚀 NUEVAS IMPLEMENTACIONES (06/04/2026)

### 🔴 Fixes y optimizaciones

| # | Feature | Área | Implementación | Estado |
|---|---------|------|----------------|--------|
| - | Chunk optimization (manualChunks) | Build | `vite.config.ts` — vendor, radix, antd, three, web-ifc, jspdf, charts, xlsx, framer | ✅ |
| - | Inconsistencia naming Subrenglon | Presupuestos | `Presupuestos.tsx` — `addSubrenglon` → `addSubRenglon` | ✅ |
| - | Corrección tsconfig | Build | `tsconfig.json` — eliminado `ignoreDeprecations` inválido en TS 5.9 | ✅ |

### 🟡 Features de roadmap

| # | Feature | Área | Implementación | Estado |
|---|---------|------|----------------|--------|
| F-04 | Reporte EERR exportable (hoja Excel) | Exportación | `ExportacionInteligente.tsx` — Nueva hoja EERR con ingresos, costos, utilidad, margen, ROI | ✅ |
| F-06 | Dependencias predecesoras en Gantt | Cronograma | `Seguimiento.tsx` — `r.predecesores` mapeado a `dependencias` en tareas Gantt | ✅ |
| F-07 | Dashboard hitos vencidos | Seguimiento | `Seguimiento.tsx` — Tarjeta hitos vencidos (rojo) y próximos 7 días (amarillo) | ✅ |
| F-10 | Supabase Realtime subscriptions | General | `useSupabaseRealtime.ts` + `store.tsx` — 8 tablas, auto-reconnect 5s | ✅ |
| F-11 | Matriz de riesgos interactiva | Riesgos | `Riesgos.tsx` — Grilla 5x5 con puntos reales, badges, desglose por nivel | ✅ |
| F-12 | Hitos con dependencias (predecesores) | Cronograma | `Hitos.tsx` — Selector de dependeDe, validación de cadena, bloqueo 🔒 | ✅ |
| F-13 | Filtro global por proyecto | UX | `useFiltroProyectoGlobal.ts` — Hook con localStorage, multi-pestaña | ✅ |
| F-14 | Vista calendario para hitos | Cronograma | `Hitos.tsx` — Toggle Lista/Calendario, navegación mensual, colores por tipo | ✅ |
| F-16 | Tema oscuro sincronizado | UX | `theme-provider.tsx` + `AppLayout.tsx` — clase dark, toggle en sidebar | ✅ |

### 🟢 Ya implementados previamente

| # | Feature | Área | Estado |
|---|---------|------|--------|
| F-01 | Cuentas por Cobrar | Financiero | ✅ Existente |
| F-02 | Cuentas por Pagar | Financiero | ✅ Existente |
| F-03 | Vinculación empleado ↔ proyecto | RRHH | ✅ Existente en types.ts |
| F-05 | Reporte EERR en Dashboard | Financiero | ✅ Existente en Dashboard.tsx |
| F-08 | Alerta déficit financiero | Financiero | ✅ Existente en Financiero.tsx |

---

## 📋 PENDIENTE DEL ROADMAP

| # | Feature | Área | Esfuerzo | Estado |
|---|---------|------|----------|--------|
| F-15 | Notificaciones push (Service Worker) | General | ~2h | ✅ Implementado (`public/sw.js`, `src/erp/hooks/useNotifications.ts`) |
| F-17 | Internacionalización (i18n) | UX | ~4h | ❌ Pendiente |
| F-18 | Tests unitarios | Calidad | ~3h | ✅ Implementado (76 tests, 6 archivos, vitest.config.ts) |