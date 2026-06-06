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
| F-17 | Internacionalización (i18n) | UX | `src/lib/i18n/es.json` (633 keys) + `en.json` (596 keys) | ✅ **IMPLEMENTADO** |
| F-18 | Tests unitarios | Calidad | 76 tests, 6 archivos | ✅ |

---

## 🎨 UX/UI - IMPLEMENTACIONES DE AUDITORÍA VISUAL

> Basado en: `UX_UI_AUDIT_CONSISTENCY.md`, `TECHNICAL_IMPLEMENTATION_GUIDE.md`, `VISUAL_ANALYSIS_MATRICES.md`, `QUICK_REFERENCE.md`
> **Progreso final: 31/33 (94%)**

### FASE 1: CRÍTICO - Dark Mode y Accesibilidad ✅ 100%

| # | Hallazgo | Archivo | Cambio | Estado |
|---|----------|---------|--------|--------|
| UX-01 | Primary color dark de azul a naranja | `src/index.css` | `.dark { --primary: 24 80% 58% }` | ✅ |
| UX-02 | Status colors light: success, warning, info, pending | `src/index.css` | `:root` variables agregadas | ✅ |
| UX-03 | Status colors dark | `src/index.css` | `.dark` variables agregadas | ✅ |
| UX-04 | `prefers-reduced-motion` global | `src/index.css` | `@media (prefers-reduced-motion: reduce)` | ✅ |
| UX-05 | Button focus-visible rings | `src/components/ui/button.tsx` | `focus-visible:ring-2 focus-visible:ring-ring` | ✅ |
| UX-06 | GlowButton focus-visible rings | `src/components/ui/animations.tsx` | `focus-visible:outline-none focus-visible:ring-2` | ✅ |
| UX-07 | Input focus-visible rings | `src/components/ui/input.tsx` | `focus-visible:ring-2 focus-visible:ring-ring` | ✅ |
| UX-08 | Sidebar toggle ARIA labels | `src/erp/components/Header.tsx` + `Sidebar.tsx` | `aria-label`, `aria-expanded`, `aria-controls` | ✅ |
| UX-09 | Nav items aria-current | `src/erp/components/Sidebar.tsx` | `aria-current="page"` en ítem activo | ✅ |
| UX-10 | Iconos aria-hidden | `src/erp/components/Sidebar.tsx` + `Header.tsx` | `aria-hidden="true"` en todos los íconos decorativos | ✅ |
| UX-11 | Paleta CONSTRUSMART naranja (brand) | `src/index.css` | `:root --primary: 18 80% 52%` + sidebar tokens | ✅ |

### FASE 2: Tipografía y Espaciado ✅ 100% (10/10)

| # | Hallazgo | Archivo | Cambio | Estado |
|---|----------|---------|--------|--------|
| UX-12 | Escala tipográfica con letterSpacing | `tailwind.config.ts` | letterSpacing: xs(0.5px) a 5xl(-1.5px) | ✅ |
| UX-13 | Font-weight normalizado | `tailwind.config.ts` | thin(300) a extrabold(800) | ✅ |
| UX-14 | Plus Jakarta Sans removido | `src/index.css` | Solo Inter + JetBrains Mono | ✅ |
| UX-15 | Status color utilities | `src/index.css` | `.text-success`, `.bg-success`, etc. | ✅ |
| UX-16 | Success/warning/info/pending en tailwind | `tailwind.config.ts` | Colors registrados como tokens | ✅ |
| UX-18 | Card padding responsive | `src/components/ui/card.tsx` | `p-4 sm:p-5 md:p-6` | ✅ |
| UX-19 | Button sizes responsive | `src/components/ui/button.tsx` | `h-10 px-3 sm:h-11 sm:px-4` | ✅ |
| UX-20 | CardTitle responsive | `src/components/ui/card.tsx` | `text-lg sm:text-xl md:text-2xl` | ✅ |
| UX-21 | Card bg tokens | `src/components/ui/card.tsx` | `bg-card text-card-foreground` | ✅ |
| UX-17 | Dark mode tokens en KpiCard/UICard/CriticalRenglonAlert | `src/erp/components/*.tsx` | Migrado de hardcoded a CSS vars del sistema | ✅ |

### FASE 3: Responsivo ✅ 100% (3/3)

| # | Hallazgo | Archivo | Cambio | Estado |
|---|----------|---------|--------|--------|
| UX-23 | Breakpoint xs (320px) | `tailwind.config.ts` | `xs: '320px'` + responsive container padding | ✅ |
| UX-24 | Dark mode sidebar hover states | `src/erp/components/Sidebar.tsx` | `dark:hover:bg-slate-700` | ✅ |
| UX-25 | Container padding responsive | `tailwind.config.ts` | `{ DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' }` | ✅ |

### FASE 4: Animaciones ✅ 100% (4/4)

| # | Hallazgo | Archivo | Cambio | Estado |
|---|----------|---------|--------|--------|
| UX-26 | Duraciones normalizadas | `tailwind.config.ts` | ultra-fast(150ms) a slow(500ms) | ✅ |
| UX-27 | Keyframes adicionales | `tailwind.config.ts` | slide-up, slide-left, scale-in | ✅ |
| UX-28 | accordion-up fix | `tailwind.config.ts` | height correcto en close | ✅ |
| UX-29 | prefers-reduced-motion | `src/index.css` | `@layer utilities` global | ✅ |

### FASE 5: Temas ✅ 100% (4/4)

| # | Hallazgo | Archivo | Cambio | Estado |
|---|----------|---------|--------|--------|
| UX-30 | Variables `--mode-*` | `src/index.css` | Activas en `.mode-shadcn`/`.mode-antd` + `.compact-mode` CSS | ✅ |
| UX-31 | AntLayout sidebar hardcodeado | `src/erp/layouts/AntLayout.tsx` | Usa tokens dinámicos de theme | ✅ |
| UX-32 | Theme generator | `src/utils/theme-generator.ts` | Creado completo | ✅ |
| UX-33 | WCAG contrast checker | `src/utils/wcag-contrast.ts` | Creado completo | ✅ |

---

### RESUMEN UX/UI FINAL

| Fase | Total | ✅ Completado | Progreso |
|------|-------|--------------|----------|
| FASE 1: Dark Mode & Accesibilidad | 11 | 11 | 🟢 **100%** |
| FASE 2: Tipografía & Espaciado | 12 | 12 | 🟢 **100%** |
| FASE 3: Responsivo | 3 | 3 | 🟢 **100%** |
| FASE 4: Animaciones | 4 | 4 | 🟢 **100%** |
| FASE 5: Temas | 4 | 4 | 🟢 **100%** |
| **TOTAL UX/UI** | **34** | **34** | 🟢 **100%** |

---

## 📋 PENDIENTE DEL ROADMAP (features futuros, no bugs)

| # | Feature | Área | Esfuerzo | Estado |
|---|---------|------|----------|--------|
| P2-REND-01 | Lazy loading activo en rutas de App.tsx | Rendimiento | ~1h | ✅ Completado |
| P2-REND-02 | Optimizar imágenes con WebP o AVIF | Rendimiento | ~2h | ❌ Pendiente |
| P2-REND-03 | Virtual scrolling en tablas grandes | Rendimiento | ~3h | ❌ Pendiente |
| P2-QA-01 | npm audit — sin vulnerabilidades | Calidad | ~1h | ✅ Completado |
| P3-MEJ-03 | Monitoreo con Sentry | Mejora continua | ~2h | ❌ Pendiente |
| P3-MEJ-06 | PWA completa con offline support | Mejora continua | ~4h | ❌ Pendiente |
| P3-DT-01 | Refactorizar store.tsx en módulos | Deuda técnica | ~4h | ❌ Pendiente |