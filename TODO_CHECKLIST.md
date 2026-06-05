# 📋 TODO CHECKLIST - ESTADO GENERAL DEL PROYECTO

> **Última actualización:** 05/06/2026
> 
> **Estado del proyecto:** ✅ COMPLETADO - Todas las implementaciones verificadas contra código fuente

---

## 🔴 PRIORIDAD ALTA - Urgente

| # | Tarea | Estado | Checklist Relacionado | Implementación |
|---|-------|--------|----------------------|----------------|
| 1 | Timeout de sesión por inactividad (30 min) | ✅ | VULN 1.2.5 - REF 1.1.1 | `src/hooks/useSessionTimeout.ts` |
| 2 | ErrorBoundary global | ✅ | VULN 4.2.1 - REF 1.2.6 | `src/components/ErrorBoundary.tsx` |
| 3 | Content Security Policy (CSP) | ✅ | VULN 5.2.1 - REF 4.2.1 | `vercel.json` + `index.html` |
| 4 | Rate limiting en formularios (client-side) | ✅ | VULN 1.2.8 | `src/hooks/useRateLimit.ts` |
| 5 | Sanitización de inputs en todos los forms | ✅ | VULN 2.2.x | `sanitizarTexto()` + `sanitizarObjeto()` en security.ts |
| 6 | Soft delete en Clientes y Proveedores | ✅ | VULN 3.2.4-5 | RPCs + `activo=false` |
| 7 | Protección auto-eliminación de usuarios | ✅ | VULN 1.1.6 | Verificación en `handleDelete` |
| 8 | XSS en export.ts (HTML injection) | ✅ | C-03 Auditoría | `sanitizarTexto()` en todas las variables de exportPDF |
| 9 | Bodega useEffect ciclo infinito | ✅ | M-12 Auditoría | `useRef` pattern para evitar dependency cycle |

## 🟡 PRIORIDAD MEDIA

| # | Tarea | Estado | Implementación |
|---|-------|--------|----------------|
| 8 | Debounce en búsquedas (400ms) | ✅ | `useDebouncedSearch` en todas las pages |
| 9 | CSRF tokens | ✅ | `src/lib/csrf.ts` |
| 10 | Advertencia de sesión próxima a expirar | ✅ | Banner en AuthContext |
| 11 | RPC eliminar_cliente_admin | ✅ | `sql/fix_rpc_eliminar_cliente_proveedor.sql` |
| 12 | RPC eliminar_proveedor_admin | ✅ | `sql/fix_rpc_eliminar_cliente_proveedor.sql` |
| 13 | RPC verificar_sesion_activa | ✅ | `sql/fix_rpc_eliminar_cliente_proveedor.sql` |
| 14 | Audit trail en eliminaciones | ✅ | RPCs insertan en `audit_log` |

## 🟢 PRIORIDAD BAJA

| # | Tarea | Estado | Implementación |
|---|-------|--------|----------------|
| 15 | ARIA labels en inputs de búsqueda | ✅ | `aria-label` en todas las pages |
| 16 | Log de errores en localStorage | ✅ | `ErrorBoundary.tsx` |
| 17 | Botones deshabilitados durante submit | ✅ | `isSubmitting` en todos los forms |
| 18 | Confirmación en eliminaciones | ✅ | `confirm()` con advertencia |

---

## 📊 RESUMEN GENERAL

| Checklist | Total Ítems | ✅ Completados | ❌ Pendientes | Progreso |
|-----------|-------------|---------------|---------------|----------|
| VULNERABILIDADES | 70 | 70 | 0 | 🟢 100% |
| HALLAZGOS | 69 | 69 | 0 | 🟢 100% |
| REFUERZO GENERAL | 40 | 40 | 0 | 🟢 100% |
| **TOTAL** | **179** | **179** | **0** | 🟢 **100%** |

---

## 🚀 MEJORAS DE GESTIÓN DE PROYECTOS

### 🔴 Prioridad Alta ✅ Verificado en código

| # | Mejora | Estado | Evidencia en código |
|---|--------|--------|---------------------|
| M-01 | Alerta automática de retraso | ✅ | `Dashboard.tsx` L71-81 |
| M-02 | Predicción de fecha de fin | ✅ | `Dashboard.tsx` L84-104 |
| M-03 | Dependencias Gantt (predecesores) | ✅ | `types.ts:78` |
| M-04 | Comparación real vs plan por renglón | ✅ | `Dashboard.tsx` L155-175 |
| M-05 | Costo por hora/hombre | ✅ | `store.tsx:1287-1299` |

### 🟡 Prioridad Media ✅ Verificado en código

| # | Mejora | Estado | Evidencia en código |
|---|--------|--------|---------------------|
| M-06 | Módulo de Hitos | ✅ | `types.ts:299-311` + `Hitos.tsx` |
| M-07 | Historial de cambios de cronograma | ✅ | `Proyectos.tsx` |
| M-08 | Disponibilidad de empleados | ✅ | `store.tsx:1302-1304` |
| M-09 | Flujo de caja consolidado | ✅ | `Financiero.tsx` |
| M-10 | Reporte financiero multi-proyecto | ✅ | `Dashboard.tsx` EERR |
| M-11 | Eficiencia de tiempo en bitácora | ✅ | `Seguimiento.tsx` |

### 🟢 Prioridad Baja ✅ Verificado en código

| # | Mejora | Estado | Evidencia en código |
|---|--------|--------|---------------------|
| M-12 | Bloqueo de fechas finalizadas | ✅ | `Proyectos.tsx` |
| M-13 | Materiales vinculados proyecto en vale | ✅ | `ValeSalidaModal.tsx` |
| M-14 | Dashboard rendimiento equipo | ✅ | `Dashboard.tsx` |

---

## 🚀 IMPLEMENTACIONES COMPLETADAS

| # | Feature | Área | Implementación | Estado |
|---|---------|------|----------------|--------|
| F-01 | Cuentas por Cobrar | Financiero | `CuentasCobrar.tsx` | ✅ |
| F-02 | Cuentas por Pagar | Financiero | `CuentasPagar.tsx` | ✅ |
| F-03 | Vinculación empleado ↔ proyecto | RRHH | `types.ts` | ✅ |
| F-04 | Reporte EERR exportable | Exportación | `ExportacionInteligente.tsx` | ✅ |
| F-05 | Reporte EERR en Dashboard | Dashboard | `Dashboard.tsx` | ✅ |
| F-06 | Dependencias predecesoras en Gantt | Cronograma | `Seguimiento.tsx` | ✅ |
| F-07 | Dashboard hitos vencidos | Seguimiento | `Seguimiento.tsx` | ✅ |
| F-08 | Alerta déficit financiero | Financiero | `Financiero.tsx` | ✅ |
| F-09 | Exportación a Excel (.xlsx) | General | SheetJS | ✅ |
| F-10 | Supabase Realtime subscriptions | General | `useSupabaseRealtime.ts` | ✅ |
| F-11 | Matriz de riesgos interactiva | Riesgos | `Riesgos.tsx` — Grilla 5x5 | ✅ |
| F-12 | Hitos con dependencias (predecesores) | Cronograma | `Hitos.tsx` | ✅ |
| F-13 | Filtro global por proyecto | UX | `useFiltroProyectoGlobal.ts` | ✅ |
| F-14 | Vista calendario para hitos | Cronograma | `Hitos.tsx` | ✅ |
| F-15 | Notificaciones push (Service Worker) | General | `public/sw.js`, `useNotifications.ts` | ✅ |
| F-16 | Tema oscuro sincronizado | UX | `theme-provider.tsx` | ✅ |
| F-17 | Internacionalización (i18n) | UX | `src/lib/i18n/es.json` (672 keys) + `en.json` | ✅ **IMPLEMENTADO** |
| F-18 | Tests unitarios | Calidad | 76 tests, 6 archivos | ✅ |

---

## 📋 PENDIENTE DEL ROADMAP (features futuros, no bugs)

| # | Feature | Área | Esfuerzo | Estado |
|---|---------|------|----------|--------|
| P2-REND-01 | Verificar lazy loading activo en todas las rutas | Rendimiento | ~1h | ❌ Pendiente |
| P2-REND-02 | Optimizar imágenes con WebP o AVIF | Rendimiento | ~2h | ❌ Pendiente |
| P2-REND-03 | Virtual scrolling en tablas grandes | Rendimiento | ~3h | ❌ Pendiente |
| P2-QA-01 | Ejecutar npm audit y resolver vulnerabilidades | Calidad | ~1h | ❌ Pendiente |
| P3-MEJ-03 | Monitoreo con Sentry | Mejora continua | ~2h | ❌ Pendiente |
| P3-MEJ-06 | PWA completa con offline support | Mejora continua | ~4h | ❌ Pendiente |
| P3-DT-01 | Refactorizar store.tsx en módulos | Deuda técnica | ~4h | ❌ Pendiente |