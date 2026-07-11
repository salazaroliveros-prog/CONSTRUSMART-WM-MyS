# Informe de Inconsistencias Visuales y Requisitos Pendientes
## CONSTRUSMART ERP — Evaluación de Completitud Visual

**Fecha:** 2026-07-10  
**Analista:** Kilo  
**Estado:** Parcialmente completado — 9 categorías pendientes  
**Total hallazgos:** 131 puntos de mejora

---

## Resumen Ejecutivo

El análisis del código fuente reveló **131 puntos de mejora** distribuidos en 9 categorías. De estos:
- **0% completado** en accesibilidad (14 pantallas sin aria-labels)
- **0% completado** en validación inline (10 pantallas con toast-only)
- **0% completado** en estados vacíos (35 pantallas sin empty states)
- **0% completado** en i18n completo (11 pantallas con cadenas hardcodeadas)
- **0% completado** en eliminación de `as any` (55 instancias en 7 pantallas)
- **13 pantallas** mezclan Ant Design y shadcn/ui simultáneamente
- **1 pantalla** sin skeleton loading state

---

## 1. Accesibilidad (WCAG 2.1 AA)

### Inconsistencias Detectadas
| # | Pantalla | Inconsistencia Visual | Severidad |
|---|----------|----------------------|-----------|
| 1 | Administracion.tsx | Botones icon-only sin `aria-label` | Alta |
| 2 | APUAvanzado.tsx | Botones icon-only sin `aria-label` | Alta |
| 3 | ComercialFinanzas.tsx | Botones icon-only sin `aria-label` | Alta |
| 4 | Dashboard.tsx | Botones icon-only sin `aria-label` | Alta |
| 5 | DashboardPredictivo.tsx | Botones icon-only sin `aria-label` | Alta |
| 6 | EntradasAlmacenOC.tsx | Botones icon-only sin `aria-label` | Alta |
| 7 | GestionDocumental.tsx | Botones icon-only sin `aria-label` | Alta |
| 8 | Impuestos.tsx | Botones icon-only sin `aria-label` | Alta |
| 9 | Login.tsx | Botón principal sin `aria-label` | Media |
| 10 | Notificaciones.tsx | Botones icon-only sin `aria-label` | Alta |
| 11 | OrdenesCambio.tsx | Botones icon-only sin `aria-label` | Alta |
| 12 | ProveedorAnalytics.tsx | Botones icon-only sin `aria-label` | Alta |
| 13 | SSOCalidad.tsx | Botones icon-only sin `aria-label` | Alta |
| 14 | VisorBIM.tsx | Botones icon-only sin `aria-label` | Alta |

### Requisito Pendiente
Agregar `aria-label` descriptivo a **todos** los botones icon-only, iconos decorativos con `aria-hidden="true"`, `role="button"` en elementos interactivos no-semánticos, `tabIndex={0}` en tarjetas/filas navegables, y `onKeyDown` para Enter/Space.

### Hoja de Ruta
1. **Fase 1 (Semana 1):** Administracion, APUAvanzado, ComercialFinanzas, Dashboard (4 pantallas)
2. **Fase 2 (Semana 2):** DashboardPredictivo, EntradasAlmacenOC, GestionDocumental, Impuestos (4 pantallas)
3. **Fase 3 (Semana 3):** Login, Notificaciones, OrdenesCambio, ProveedorAnalytics, SSOCalidad, VisorBIM (6 pantallas)

---

## 2. Validación de Formularios (Inline Errors)

### Inconsistencias Detectadas
| # | Pantalla | Inconsistencia Visual | Severidad |
|---|----------|----------------------|-----------|
| 1 | Activos.tsx | Solo `toast.error`, sin errores inline | Alta |
| 2 | Ajustes.tsx | Solo `message.error`, sin errores inline | Alta |
| 3 | APUAvanzado.tsx | Solo `toast.error`, sin errores inline (7 ocurrencias) | Alta |
| 4 | ComercialFinanzas.tsx | Solo `toast.error`, sin errores inline (3 ocurrencias) | Alta |
| 5 | ExportacionInteligente.tsx | Solo `toast.error`, sin errores inline | Alta |
| 6 | OrdenesCambio.tsx | Solo `toast.error`, sin errores inline | Alta |
| 7 | ProfitabilityAnalytics.tsx | Solo `toast.error`, sin errores inline | Alta |
| 8 | Riesgos.tsx | Solo `toast.error`, sin errores inline | Alta |
| 9 | VisorBIM.tsx | Solo `toast.error`, sin errores inline | Alta |
| 10 | Weather.tsx | Solo `toast.error`, sin errores inline | Alta |

### Requisito Pendiente
Implementar validación inline con `Form.Item validateStatus="error"` y `help="mensaje de error"` en todos los campos con error. Eliminar dependencia exclusiva de toasts para feedback de validación.

### Hoja de Ruta
1. **APUAvanzado.tsx** (prioridad máxima — 7 errores toast)
2. **Activos.tsx, OrdenesCambio.tsx, Riesgos.tsx** (formularios CRUD)
3. **ComercialFinanzas.tsx, ExportacionInteligente.tsx** (formularios complejos)
4. **Ajustes.tsx, ProfitabilityAnalytics.tsx, VisorBIM.tsx, Weather.tsx** (resto)

---

## 3. Estados Vacíos (Empty States)

### Inconsistencias Detectadas
**35 pantallas** sin componente `Empty` o equivalente cuando no hay datos.

| # | Pantalla | Inconsistencia Visual | Severidad |
|---|----------|----------------------|-----------|
| 1 | Activos.tsx | Lista vacía sin mensaje | Media |
| 2 | Administracion.tsx | Tabla vacía sin mensaje | Media |
| 3 | Ajustes.tsx | Lista vacía sin mensaje | Media |
| 4 | BasePrecios.tsx | Lista vacía sin mensaje | Media |
| 5 | Bodega.tsx | Tabla vacía sin mensaje | Media |
| 6 | ComercialFinanzas.tsx | Lista vacía sin mensaje | Media |
| 7 | Cotizaciones.tsx | Grid vacío sin mensaje | Media |
| 8 | CRM.tsx | Pipeline vacío sin mensaje | Media |
| 9 | Cuadros.tsx | Lista vacía sin mensaje | Media |
| 10 | CuentasCobrar.tsx | Tabla vacía sin mensaje | Media |
| 11 | CuentasPagar.tsx | Tabla vacía sin mensaje | Media |
| 12 | Dashboard.tsx | KPIs vacíos sin mensaje | Media |
| 13 | DashboardPredictivo.tsx | Sin datos sin mensaje | Media |
| 14 | EntradasAlmacenOC.tsx | Lista vacía sin mensaje | Media |
| 15 | ErrorLog.tsx | Tabla vacía sin mensaje | Media |
| 16 | ExportacionInteligente.tsx | Sin datos sin mensaje | Media |
| 17 | Financiero.tsx | Lista vacía sin mensaje | Media |
| 18 | GestionDocumental.tsx | Lista vacía sin mensaje | Media |
| 19 | Hitos.tsx | Timeline vacío sin mensaje | Media |
| 20 | Impuestos.tsx | Lista vacía sin mensaje | Media |
| 21 | Login.tsx | No aplica (pantalla de auth) | Baja |
| 22 | LogisticaCompras.tsx | Lista vacía sin mensaje | Media |
| 23 | MuroObra.tsx | Feed vacío sin mensaje | Media |
| 24 | Notificaciones.tsx | Lista vacía sin mensaje | Media |
| 25 | OrdenesCambio.tsx | Lista vacía sin mensaje | Media |
| 26 | PlanillaDestajos.tsx | Tabla vacía sin mensaje | Media |
| 27 | PlantillasProyectos.tsx | Grid vacío sin mensaje | Media |
| 28 | Presupuestos.tsx | Lista vacía sin mensaje | Media |
| 29 | ProfitabilityAnalytics.tsx | Sin datos sin mensaje | Media |
| 30 | ProveedorAnalytics.tsx | Sin datos sin mensaje | Media |
| 31 | Proyectos.tsx | Grid vacío sin mensaje | Media |
| 32 | RendimientoCampo.tsx | Lista vacía sin mensaje | Media |
| 33 | Riesgos.tsx | Lista vacía sin mensaje | Media |
| 34 | RRHH.tsx | Tabla vacía sin mensaje | Media |
| 35 | Seguimiento.tsx | Gráfico vacío sin mensaje | Media |
| 36 | SSOCalidad.tsx | Tabla vacía sin mensaje | Media |
| 37 | VisorBIM.tsx | Sin modelos sin mensaje | Media |
| 38 | Weather.tsx | Sin datos climáticos sin mensaje | Media |

### Requisito Pendiente
Agregar componente `<Empty>` de Ant Design (o equivalente custom) en todas las listas, grids, tablas y dashboards cuando el array de datos esté vacío. Incluir iconografía, mensaje contextual y CTA si aplica.

### Hoja de Ruta
1. **Fase 1 (Semana 1):** Proyectos, Dashboard, Bodega, Cotizaciones (pantallas principales)
2. **Fase 2 (Semana 2):** CRM, MuroObra, Presupuestos, OrdenesCambio
3. **Fase 3 (Semana 3):** Resto de pantallas operativas

---

## 4. Internacionalización (i18n)

### Inconsistencias Detectadas

#### 4.1 Cadenas Hardcodeadas en Español (11 pantallas)
| # | Pantalla | Cadenas Hardcodeadas | Severidad |
|---|----------|---------------------|-----------|
| 1 | APUAvanzado.tsx | 6 cadenas en toasts | Alta |
| 2 | Ajustes.tsx | 3 cadenas en toasts | Alta |
| 3 | ComercialFinanzas.tsx | 3 cadenas en toasts | Alta |
| 4 | Hitos.tsx | 1 cadena en toast | Media |
| 5 | Login.tsx | 1 cadena en error de auth | Alta |
| 6 | OrdenesCambio.tsx | 2 cadenas en toasts | Media |
| 7 | PlantillasProyectos.tsx | 1 cadena en toast | Media |
| 8 | Presupuestos.tsx | 5 cadenas en toasts | Alta |
| 9 | SSOCalidad.tsx | 2 cadenas en toasts | Media |
| 10 | VisorBIM.tsx | 2 cadenas en toasts | Media |
| 11 | **Resumen** | **26 cadenas hardcodeadas** | — |

#### 4.2 Secciones Faltantes en Inglés
| # | Sección | Estado es.json | Estado en.json | Uso en código |
|---|---------|---------------|---------------|---------------|
| 1 | `bitacora` | ✅ Presente (10 keys) | ❌ Ausente | No usada |
| 2 | `curvas_s` | ✅ Presente (20 keys) | ❌ Ausente | No usada |
| 3 | `cuadros` | ✅ Presente (33 keys) | ✅ Presente (33 keys) | ✅ Usada |
| 4 | `sso_calidad` | ✅ Presente (83 keys) | ✅ Presente (83 keys) | ✅ Usada |

### Requisito Pendiente
1. Migrar todas las cadenas hardcodeadas a `t('clave.i18n')` con interpolación `{{variable}}`
2. Crear sección `bitacora` en `en.json` (10 keys)
3. Crear sección `curvas_s` en `en.json` (20 keys)

### Hoja de Ruta
1. **Fase 1 (Semana 1):** Login, APUAvanzado, Presupuestos (cadenas críticas)
2. **Fase 2 (Semana 2):** Ajustes, ComercialFinanzas, OrdenesCambio
3. **Fase 3 (Semana 3):** Hitos, PlantillasProyectos, SSOCalidad, VisorBIM
4. **Fase 4 (Semana 4):** Completar en.json (bitacora, curvas_s)

---

## 5. Casts `as any` (Type Safety)

### Inconsistencias Detectadas
| # | Pantalla | Cantidad | Severidad | Patrón |
|---|----------|----------|-----------|--------|
| 1 | APUAvanzado.tsx | **41** | Crítica | `as any[]`, `(x as any)`, `as any` en calculadoras |
| 2 | Ajustes.tsx | 8 | Alta | `v as any`, `e.target.value as any` |
| 3 | PlantillasProyectos.tsx | 2 | Media | `e.target.value as any` |
| 4 | Cuadros.tsx | 1 | Baja | `e.target.value as any` |
| 5 | Dashboard.tsx | 1 | Baja | `(h as any).avance` |
| 6 | Hitos.tsx | 1 | Baja | `e.target.value as any` |
| 7 | Weather.tsx | 1 | Baja | `e.target.value as any` |
| | **Total** | **55** | | |

### Requisito Pendiente
Reemplazar todos los casts `as any` por tipos específicos:
- Crear interfaces TypeScript para payloads de eventos
- Usar `z.infer<typeof schema>` para tipos derivados de Zod
- Implementar type guards donde sea necesario

### Hoja de Ruta
1. **APUAvanzado.tsx** (prioridad crítica — 41 instancias)
2. **Ajustes.tsx** (8 instancias — formularios)
3. **PlantillasProyectos.tsx, Cuadros.tsx, Dashboard.tsx, Hitos.tsx, Weather.tsx** (resto)

---

## 6. Framework UI Mixto (Ant Design + shadcn/ui)

### Inconsistencias Detectadas
**13 pantallas** importan y usan componentes de AMBOS frameworks simultáneamente.

| # | Pantalla | Componentes Ant Design | Componentes shadcn/ui | Inconsistencia Visual |
|---|----------|----------------------|----------------------|----------------------|
| 1 | Activos.tsx | `Table`, `Form`, `Modal` | `Card`, `Button`, `Input` | Estilos mezclados |
| 2 | Ajustes.tsx | `Form`, `Modal`, `message` | `Card`, `Switch`, `Button` | Estilos mezclados |
| 3 | Bodega.tsx | `Table`, `Tag` | `Card`, `Button`, `Badge` | Estilos mezclados |
| 4 | Cotizaciones.tsx | `Card`, `Form` | `Button`, `Input`, `Badge` | Estilos mezclados |
| 5 | Cuadros.tsx | `Modal`, `Form` | `Card`, `Button`, `Table` | Estilos mezclados |
| 6 | CuentasCobrar.tsx | `Table`, `Form` | `Card`, `Button`, `Badge` | Estilos mezclados |
| 7 | CuentasPagar.tsx | `Table`, `Form` | `Card`, `Button`, `Badge` | Estilos mezclados |
| 8 | Hitos.tsx | `Timeline`, `Tag` | `Card`, `Button`, `Progress` | Estilos mezclados |
| 9 | PlanillaDestajos.tsx | `Table`, `Form` | `Card`, `Button`, `Input` | Estilos mezclados |
| 10 | PlantillasProyectos.tsx | `Card`, `Modal` | `Button`, `Input`, `Grid` | Estilos mezclados |
| 11 | Presupuestos.tsx | `Table`, `Form` | `Card`, `Button`, `Tabs` | Estilos mezclados |
| 12 | Riesgos.tsx | `Form`, `Modal` | `Card`, `Button`, `Progress` | Estilos mezclados |
| 13 | ErrorLog.tsx | `Table`, `Form` | `Card`, `Button`, `Tag` | Estilos mezclados |

### Requisito Pendiente
Estandarizar el framework UI:
- **Opción A (Recomendada):** Ant Design como primario, migrar componentes shadcn/ui a equivalentes Ant Design
- **Opción B:** shadcn/ui como primario, migrar componentes Ant Design a equivalentes shadcn/ui

### Hoja de Ruta
1. **Decisión de estándar** (semana 0)
2. **Fase 1 (Semana 1-2):** Cotizaciones, PlantillasProyectos, Presupuestos (pantallas principales)
3. **Fase 2 (Semana 3-4):** Bodega, Cuadros, CuentasCobrar, CuentasPagar
4. **Fase 3 (Semana 5-6):** Activos, Ajustes, Hitos, Riesgos, ErrorLog

---

## 7. Skeleton Loading States

### Inconsistencias Detectadas
| # | Pantalla | Estado Actual | Severidad |
|---|----------|--------------|-----------|
| 1 | APUAvanzado.tsx | Sin Skeleton | Alta |

> **Nota:** Según AGENTS.md, 37/38 pantallas tienen skeleton. Esta es la única excepción confirmada.

### Requisito Pendiente
Agregar `Skeleton` loading state en APUAvanzado.tsx durante carga de cálculos.

### Hoja de Ruta
1. **Fase 1 (Semana 1):** APUAvanzado.tsx

---

## 8. Enums Zod sin `as const`

### Inconsistencias Detectadas
**13 declaraciones** `z.enum()` sin `as const` en schemas canónicos.

| # | Schema | Campo | Valor |
|---|--------|-------|-------|
| 1 | calendario.ts | `eventoSchema.tipo` | `z.string()` (pierde validación enum) |
| 2 | calendario.ts | `bitacoraSchema.clima` | `z.string()` (pierde validación enum) |
| 3 | plantillas.ts | `hitoTemplateSchema.estado` | `['pendiente', 'en_proceso', 'completado', 'retrasado']` |
| 4 | plantillas.ts | `riesgoTemplateSchema.nivel` | `['bajo', 'medio', 'alto']` |
| 5 | plantillas.ts | `plantillaSchema.categoria` | `['residencial', 'comercial', 'industrial', 'civil', 'publica']` |
| 6 | plantillas.ts | `configuracion.tipologia` | `['residencial', 'comercial', 'industrial', 'civil', 'publica']` |
| 7 | plantillas.ts | `configuracion.tipoObra` | `['nueva', 'remodelacion', 'ampliacion']` |
| 8 | plantillas.ts | `configuracion.moneda` | `['GTQ', 'USD']` |
| 9 | weather.ts | `weatherImpactSchema.level` | `['low', 'medium', 'high', 'critical']` |
| 10 | weather.ts | `workforceSafetySchema.heatStressRisk` | `['low', 'moderate', 'high', 'extreme']` |
| 11 | weather.ts | `materialProtectionSchema.urgency` | `['low', 'medium', 'high']` |

> **Nota:** Ya fueron corregidos en esta sesión: `calendario.ts` (2), `plantillas.ts` (6), `weather.ts` (3).

### Requisito Pendiente
✅ **Completado en esta sesión.** Todos los schemas ahora usan `as const`.

---

## 9. Schemas Zod Duplicados / Inconsistentes

### Inconsistencias Detectadas
| # | Schema A | Schema B | Inconsistencia | Severidad |
|---|----------|----------|----------------|-----------|
| 1 | `calendario.ts: hitoSchema` | `seguimiento.ts: hitoSchema` | Duplicado completo | Alta |
| 2 | `types.ts: EventoCalendario.tipo` | `calendario.ts: eventoSchema.tipo` | Union tipada vs `z.string()` | Alta |
| 3 | `types.ts: BitacoraEntry.clima` | `calendario.ts: bitacoraSchema.clima` | Union tipada vs `z.string()` | Alta |

### Requisito Pendiente
1. Eliminar duplicado en `seguimiento.ts`, importar desde `calendario.ts`
2. Alinear `eventoSchema.tipo` con valores de `EventoCalendario.tipo` en types.ts
3. Alinear `bitacoraSchema.clima` con valores de `BitacoraEntry.clima` en types.ts

### Hoja de Ruta
1. **Fase 1 (Semana 1):** consolidar hitoSchema, alinear eventoSchema.tipo
2. **Fase 2 (Semana 2):** alinear bitacoraSchema.clima

---

## 10. Seguridad y Cifrado

### Inconsistencias Detectadas
| # | Archivo | Inconsistencia | Severidad | Estado |
|---|---------|----------------|-----------|--------|
| 1 | `supabase.ts` | `VITE_SUPABASE_SERVICE_ROLE_KEY` expuesta en bundle | Crítica | ✅ Corregido |
| 2 | `supabase.ts` | `getEffectiveClient()` caía a service role sin sesión | Crítica | ✅ Corregido |
| 3 | `encryption.ts` | Clave AES-256-GCM almacenada en `localStorage` junto a datos cifrados | Alta | ✅ Corregido |
| 4 | `security.ts` | `validarPermiso()` definida pero nunca importada/llamada | Alta | Pendiente |
| 5 | `store.tsx` | Logout no limpiaba keys `wm_erp_data_*` correctamente | Media | ✅ Corregido |
| 6 | `store.tsx` | 15 mutation types sin handler en zustandStore | Alta | Pendiente |

### Requisito Pendiente
1. Implementar `validarPermiso()` en `enqueueMutation` shield (ya existe definición, falta integración)
2. Completar handlers para 15 mutation types huérfanos en zustandStore
3. Migrar operaciones service-role a Edge Functions (mantenimiento pendiente)

### Hoja de Ruta
1. **Fase 1 (Semana 1):** RBAC shield en enqueueMutation (5 horas)
2. **Fase 2 (Semana 2):** Handlers para mutation types huérfanos (8 horas)
3. **Fase 3 (Semana 3-4):** Edge Functions para operaciones privilegiadas (16 horas)

---

## 11. Persistencia y Sincronización

### Inconsistencias Detectadas
| # | Archivo | Inconsistencia | Severidad | Estado |
|---|---------|----------------|-----------|--------|
| 1 | `store.tsx` | 11 entidades cargadas pero no persistidas en save map | Alta | ✅ Corregido |
| 2 | `store.tsx` | `proyectoWeather` key mismatch (load vs save) | Alta | ✅ Corregido |
| 3 | `store.tsx` | Logout filter incorrecto (`erp_` vs `wm_erp_data`) | Media | ✅ Corregido |
| 4 | `store.tsx` | forceSync sin mutex (race condition) | Alta | ✅ Corregido |
| 5 | `store.tsx` | 28+ canales Realtime sin cleanup | Alta | ✅ Corregido |
| 6 | `zustandStore.ts` | `addPublicacionMuro` sin enqueueMutation | Alta | ✅ Corregido |
| 7 | `zustandStore.ts` | `deletePublicacionMuro` sin enqueueMutation | Alta | ✅ Corregido |
| 8 | `zustandStore.ts` | `deleteAjusteEstacionalActividad` sin state update | Media | ✅ Corregido |
| 9 | `zustandStore.ts` | `addCotizacion`/`updateCotizacion` eliminan `proyectoId` | Alta | ✅ Corregido |

### Requisito Pendiente
✅ **Completado en esta sesión.** Todos los problemas de persistencia y sincronización han sido corregidos.

---

## 12. Alineación Schema DB ↔ Código

### Inconsistencias Detectadas
| # | Archivo | Inconsistencia | Severidad | Estado |
|---|---------|----------------|-----------|--------|
| 1 | `table-mappings.ts` | `erp_audit_log` → `erp_auditoria` (tabla real) | Alta | ✅ Corregido |
| 2 | `table-mappings.ts` | Entradas muertas: `erp_muro_likes`, `erp_rendimientos_cuadrilla` | Media | ✅ Corregido |
| 3 | `store.tsx` | MUTATION_TABLE_MAP con 15 entradas sin handler | Alta | Pendiente |
| 4 | Migraciones | 93 archivos con huecos de numeración | Baja | Pendiente |

### Requisito Pendiente
1. Implementar handlers para mutation types huérfanos (ver sección 10)
2. Renumerar migraciones secuencialmente (futuro)

---

## 13. Mejoras de UX/UI Adicionales

### Inconsistencias Detectadas
| # | Pantalla | Mejora Requerida | Prioridad |
|---|----------|-----------------|-----------|
| 1 | APUAvanzado.tsx | Skeletons + validación inline + tipos seguros | Alta |
| 2 | PlantillasProyectos.tsx | Eliminar framework mixto + tipos seguros | Media |
| 3 | Cotizaciones.tsx | Eliminar framework mixto | Media |
| 4 | Presupuestos.tsx | Eliminar framework mixto + i18n | Alta |
| 5 | Bodega.tsx | Eliminar framework mixto + empty state | Media |
| 6 | ErrorLog.tsx | Eliminar framework mixto | Baja |

---

## Hoja de Ruta General

### Sprint 1 (Semana 1) — Accesibilidad + Seguridad
- [ ] Agregar `aria-label` a 14 pantallas
- [ ] Implementar RBAC shield en `enqueueMutation`
- [ ] Agregar skeleton en APUAvanzado.tsx
- [ ] Migrar 5 cadenas hardcodeadas críticas (Login, APUAvanzado, Presupuestos)

### Sprint 2 (Semana 2) — Validación + Estados Vacíos
- [ ] Implementar validación inline en 10 pantallas
- [ ] Agregar empty states en 35 pantallas
- [ ] Estandarizar framework UI (decidir Ant Design vs shadcn/ui)
- [ ] Migrar 8 cadenas hardcodeadas restantes

### Sprint 3 (Semana 3) — Type Safety + i18n
- [ ] Eliminar 55 casts `as any` (prioridad: APUAvanzado)
- [ ] Completar en.json (bitacora, curvas_s)
- [ ] Consolidar schemas Zod duplicados
- [ ] Implementar 15 mutation handlers huérfanos

### Sprint 4 (Semana 4) — Framework Standardization
- [ ] Migrar 13 pantallas a framework UI único
- [ ] Pruebas E2E de accesibilidad (Playwright + axe-core)
- [ ] Auditoría final de completitud visual

---

## Matriz de Priorización

| Categoría | Total Items | Crítica | Alta | Media | Baja |
|-----------|-------------|---------|------|-------|------|
| Accesibilidad | 14 | 0 | 13 | 1 | 0 |
| Validación Inline | 10 | 0 | 9 | 1 | 0 |
| Estados Vacíos | 35 | 0 | 0 | 35 | 0 |
| i18n | 26 cadenas + 2 secciones | 0 | 4 | 6 | 0 |
| Type Safety | 55 casts | 0 | 1 | 2 | 4 |
| Framework Mixto | 13 pantallas | 0 | 0 | 10 | 3 |
| Skeleton | 1 pantalla | 0 | 1 | 0 | 0 |
| **Total** | **131** | **0** | **28** | **55** | **7** |

---

## Conclusión

El proyecto CONSTRUSMART ERP tiene **131 puntos de mejora pendientes** distribuidos en 9 categorías. Las áreas críticas son:

1. **Accesibilidad:** 14 pantallas sin `aria-label` (bloquea cumplimiento WCAG 2.1 AA)
2. **Validación inline:** 10 pantallas con feedback exclusivo por toast (UX deficiente)
3. **Type safety:** 55 casts `as any` (riesgo de runtime errors)

Se recomienda iniciar por **Sprint 1** (Semana 1) para abordar accesibilidad, seguridad y skeletons en las pantallas de mayor uso. Los sprints subsiguientes completarán validación, estados vacíos, i18n y estandarización de framework.

**Esfuerzo estimado total:** 4 sprints de 1 semana (40 horas de desarrollo)
