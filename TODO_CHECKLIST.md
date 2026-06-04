# 📋 TODO CHECKLIST - ESTADO GENERAL DEL PROYECTO

> **Última actualización:** 06/04/2026
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

### 🔴 Prioridad Alta (Quick Wins)

| # | Mejora | Estado |
|---|--------|--------|
| 1 | Alerta automática de retraso (fecha actual > fechaFin) | ⬜ Pendiente |
| 2 | Comparación real vs plan por renglón (join presupuesto ↔ movimientos) | ⬜ Pendiente |
| 3 | Dependencias entre renglones en Gantt (predecessores) | ⬜ Pendiente |
| 4 | Predicción de fecha de fin por tasa de avance | ⬜ Pendiente |
| 5 | Costo por hora/hombre calculado automáticamente | ⬜ Pendiente |

### 🟡 Prioridad Media

| # | Mejora | Estado |
|---|--------|--------|
| 6 | Módulo de Hitos (tipo Hito con fecha, responsable, estado) | ⬜ Pendiente |
| 7 | Historial de cambios de cronograma | ⬜ Pendiente |
| 8 | Control de disponibilidad de empleados | ⬜ Pendiente |
| 9 | Flujo de caja consolidado mejorado | ⬜ Pendiente |
| 10 | Reporte financiero multi-proyecto (EERR) | ⬜ Pendiente |
| 11 | Eficiencia de tiempo en bitácora | ⬜ Pendiente |

### 🟢 Prioridad Baja

| # | Mejora | Estado |
|---|--------|--------|
| 12 | Bloqueo de fechas finalizadas | ⬜ Pendiente |
| 13 | Vincular materiales a proyectos en vale de salida | ⬜ Pendiente |
| 14 | Dashboard de rendimiento por equipo | ⬜ Pendiente |

### 📊 Métricas de cobertura

| Categoría | % Actual | Meta |
|-----------|----------|------|
| Seguimiento | 44% | 80% |
| Financieros | 62% | 90% |
| Cronograma | 53% | 85% |
| **General** | **54%** | **85%** |
