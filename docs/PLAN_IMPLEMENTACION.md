# Plan de Implementación — Correcciones y Mejoras CONSTRUSMART ERP

## Resumen de Hallazgos

### Ya Corregidos (Sesión Actual)
| # | Archivo | Corrección | Estado |
|---|---------|-----------|--------|
| 1 | `src/lib/supabase.ts` | Eliminada exposición de `VITE_SUPABASE_SERVICE_ROLE_KEY` en bundle | ✅ |
| 2 | `src/lib/supabase.ts` | Eliminados `getServiceClient()`, `getServiceRealtimeClient()`, `hasServiceRole` | ✅ |
| 3 | `src/lib/supabase.ts` | Simplificado `getEffectiveClient()` a anon-only con validación de sesión | ✅ |
| 4 | `src/erp/zustandStore.ts` | Eliminado fallback guest-mode service-role | ✅ |
| 5 | `src/hooks/useSupabaseRealtime.ts` | Limpiados imports de service-role | ✅ |
| 6 | `src/erp/zustandStore.ts` | `addPublicacionMuro` ahora encola mutación | ✅ |
| 7 | `src/erp/zustandStore.ts` | `deletePublicacionMuro` ahora encola mutación | ✅ |
| 8 | `src/erp/zustandStore.ts` | `deleteAjusteEstacionalActividad` ahora actualiza estado local | ✅ |
| 9 | `src/erp/zustandStore.ts` | `addCotizacion`/`updateCotizacion` preservan `proyectoId` | ✅ |
| 10 | `src/erp/store.tsx` | Logout limpia keys `wm_erp_data*` + `sb-*` correctamente | ✅ |
| 11 | `src/erp/store.tsx` | Agregado `syncInProgressRef` mutex a `forceSync` | ✅ |
| 12 | `src/erp/store.tsx` | Eliminado fallback service-role en `forceSync` | ✅ |
| 13 | `src/erp/store.tsx` | Corregida clave `proyectoWeather` (proyecto_weather → weather) | ✅ |
| 14 | `src/erp/store.tsx` | Agregadas 11 entidades faltantes a save map | ✅ |
| 15 | `src/erp/store.tsx` | Agregado cleanup de suscripciones Realtime en unmount | ✅ |
| 16 | `src/erp/constants/table-mappings.ts` | Corregido `erp_audit_log` → `erp_auditoria` | ✅ |
| 17 | `src/erp/constants/table-mappings.ts` | Eliminadas entradas muertas `erp_muro_likes`, `erp_rendimientos_cuadrilla` | ✅ |
| 18 | `src/erp/store/schemas/calendario.ts` | Agregado `as const` a `z.enum()` | ✅ |
| 19 | `src/erp/store/schemas/plantillas.ts` | Agregado `as const` a `z.enum()` | ✅ |
| 20 | `src/erp/store/schemas/weather.ts` | Agregado `as const` a `z.enum()` | ✅ |
| 21 | `src/lib/encryption.ts` | Movida clave AES-256-GCM de `localStorage` a `sessionStorage` | ✅ |

### Pendientes de Implementación

#### Categoría 1: Accesibilidad (14 pantallas)
- [ ] Administracion.tsx — aria-label en botones icon-only
- [ ] APUAvanzado.tsx — aria-label en botones icon-only
- [ ] ComercialFinanzas.tsx — aria-label en botones icon-only
- [ ] Dashboard.tsx — aria-label en botones icon-only
- [ ] DashboardPredictivo.tsx — aria-label en botones icon-only
- [ ] EntradasAlmacenOC.tsx — aria-label en botones icon-only
- [ ] GestionDocumental.tsx — aria-label en botones icon-only
- [ ] Impuestos.tsx — aria-label en botones icon-only
- [ ] Login.tsx — aria-label en botón principal
- [ ] Notificaciones.tsx — aria-label en botones icon-only
- [ ] OrdenesCambio.tsx — aria-label en botones icon-only
- [ ] ProveedorAnalytics.tsx — aria-label en botones icon-only
- [ ] SSOCalidad.tsx — aria-label en botones icon-only
- [ ] VisorBIM.tsx — aria-label en botones icon-only

#### Categoría 2: Validación Inline (10 pantallas)
- [ ] Activos.tsx — Reemplazar toast.error por Form.Item validateStatus
- [ ] Ajustes.tsx — Reemplazar message.error por Form.Item validateStatus
- [ ] APUAvanzado.tsx — Reemplazar 7 toast.error por Form.Item validateStatus
- [ ] ComercialFinanzas.tsx — Reemplazar 3 toast.error por Form.Item validateStatus
- [ ] ExportacionInteligente.tsx — Reemplazar toast.error por Form.Item validateStatus
- [ ] OrdenesCambio.tsx — Reemplazar toast.error por Form.Item validateStatus
- [ ] ProfitabilityAnalytics.tsx — Reemplazar toast.error por Form.Item validateStatus
- [ ] Riesgos.tsx — Reemplazar toast.error por Form.Item validateStatus
- [ ] VisorBIM.tsx — Reemplazar toast.error por Form.Item validateStatus
- [ ] Weather.tsx — Reemplazar toast.error por Form.Item validateStatus

#### Categoría 3: Estados Vacíos (35 pantallas)
- [ ] Activos.tsx — Agregar Empty cuando array vacío
- [ ] Administracion.tsx — Agregar Empty cuando tabla vacía
- [ ] Ajustes.tsx — Agregar Empty cuando lista vacía
- [ ] BasePrecios.tsx — Agregar Empty cuando lista vacía
- [ ] Bodega.tsx — Agregar Empty cuando tabla vacía
- [ ] ComercialFinanzas.tsx — Agregar Empty cuando lista vacía
- [ ] Cotizaciones.tsx — Agregar Empty cuando grid vacío
- [ ] CRM.tsx — Agregar Empty cuando pipeline vacío
- [ ] Cuadros.tsx — Agregar Empty cuando lista vacía
- [ ] CuentasCobrar.tsx — Agregar Empty cuando tabla vacía
- [ ] CuentasPagar.tsx — Agregar Empty cuando tabla vacía
- [ ] Dashboard.tsx — Agregar Empty cuando sin datos
- [ ] DashboardPredictivo.tsx — Agregar Empty cuando sin datos
- [ ] EntradasAlmacenOC.tsx — Agregar Empty cuando lista vacía
- [ ] ErrorLog.tsx — Agregar Empty cuando tabla vacía
- [ ] ExportacionInteligente.tsx — Agregar Empty cuando sin datos
- [ ] Financiero.tsx — Agregar Empty cuando lista vacía
- [ ] GestionDocumental.tsx — Agregar Empty cuando lista vacía
- [ ] Hitos.tsx — Agregar Empty cuando timeline vacío
- [ ] Impuestos.tsx — Agregar Empty cuando lista vacía
- [ ] LogisticaCompras.tsx — Agregar Empty cuando lista vacía
- [ ] MuroObra.tsx — Agregar Empty cuando feed vacío
- [ ] Notificaciones.tsx — Agregar Empty cuando lista vacía
- [ ] OrdenesCambio.tsx — Agregar Empty cuando lista vacía
- [ ] PlanillaDestajos.tsx — Agregar Empty cuando tabla vacía
- [ ] PlantillasProyectos.tsx — Agregar Empty cuando grid vacío
- [ ] Presupuestos.tsx — Agregar Empty cuando lista vacía
- [ ] ProfitabilityAnalytics.tsx — Agregar Empty cuando sin datos
- [ ] ProveedorAnalytics.tsx — Agregar Empty cuando sin datos
- [ ] Proyectos.tsx — Agregar Empty cuando grid vacío
- [ ] RendimientoCampo.tsx — Agregar Empty cuando lista vacía
- [ ] Riesgos.tsx — Agregar Empty cuando lista vacía
- [ ] RRHH.tsx — Agregar Empty cuando tabla vacía
- [ ] Seguimiento.tsx — Agregar Empty cuando gráfico vacío
- [ ] SSOCalidad.tsx — Agregar Empty cuando tabla vacía
- [ ] VisorBIM.tsx — Agregar Empty cuando sin modelos
- [ ] Weather.tsx — Agregar Empty cuando sin datos climáticos

#### Categoría 4: i18n (11 pantallas + 2 secciones)
- [ ] APUAvanzado.tsx — Migrar 6 cadenas hardcodeadas a t()
- [ ] Ajustes.tsx — Migrar 3 cadenas hardcodeadas a t()
- [ ] ComercialFinanzas.tsx — Migrar 3 cadenas hardcodeadas a t()
- [ ] Hitos.tsx — Migrar 1 cadena hardcodeada a t()
- [ ] Login.tsx — Migrar 1 cadena hardcodeada a t()
- [ ] OrdenesCambio.tsx — Migrar 2 cadenas hardcodeadas a t()
- [ ] PlantillasProyectos.tsx — Migrar 1 cadena hardcodeada a t()
- [ ] Presupuestos.tsx — Migrar 5 cadenas hardcodeadas a t()
- [ ] SSOCalidad.tsx — Migrar 2 cadenas hardcodeadas a t()
- [ ] VisorBIM.tsx — Migrar 2 cadenas hardcodeadas a t()
- [ ] Crear sección `bitacora` en `en.json` (10 keys)
- [ ] Crear sección `curvas_s` en `en.json` (20 keys)

#### Categoría 5: Type Safety (55 casts en 7 pantallas)
- [ ] APUAvanzado.tsx — Eliminar 41 casts `as any`
- [ ] Ajustes.tsx — Eliminar 8 casts `as any`
- [ ] PlantillasProyectos.tsx — Eliminar 2 casts `as any`
- [ ] Cuadros.tsx — Eliminar 1 cast `as any`
- [ ] Dashboard.tsx — Eliminar 1 cast `as any`
- [ ] Hitos.tsx — Eliminar 1 cast `as any`
- [ ] Weather.tsx — Eliminar 1 cast `as any`

#### Categoría 6: Framework UI Mixto (13 pantallas)
- [ ] Activos.tsx — Estandarizar componentes UI
- [ ] Ajustes.tsx — Estandarizar componentes UI
- [ ] Bodega.tsx — Estandarizar componentes UI
- [ ] Cotizaciones.tsx — Estandarizar componentes UI
- [ ] Cuadros.tsx — Estandarizar componentes UI
- [ ] CuentasCobrar.tsx — Estandarizar componentes UI
- [ ] CuentasPagar.tsx — Estandarizar componentes UI
- [ ] Hitos.tsx — Estandarizar componentes UI
- [ ] PlanillaDestajos.tsx — Estandarizar componentes UI
- [ ] PlantillasProyectos.tsx — Estandarizar componentes UI
- [ ] Presupuestos.tsx — Estandarizar componentes UI
- [ ] Riesgos.tsx — Estandarizar componentes UI
- [ ] ErrorLog.tsx — Estandarizar componentes UI

#### Categoría 7: Skeleton Loading (1 pantalla)
- [ ] APUAvanzado.tsx — Agregar Skeleton loading state

#### Categoría 8: RBAC y Seguridad (Pendientes)
- [ ] security.ts — Integrar `validarPermiso()` en handlers del store
- [ ] zustandStore.ts — Completar 15 mutation handlers huérfanos
- [ ] Edge Functions — Migrar operaciones service-role a Supabase Edge Functions

## Orden de Implementación

### Fase 1 (Semana 1) — Accesibilidad + Seguridad + Skeletons
1. APUAvanzado.tsx — aria-labels + skeleton + validación inline + eliminar as any
2. Dashboard.tsx — aria-labels + empty state
3. Login.tsx — aria-label + i18n
4. security.ts — Integrar validarPermiso()

### Fase 2 (Semana 2) — Validación + Estados Vacíos + i18n
1. Implementar validación inline en 10 pantallas
2. Agregar empty states en 35 pantallas
3. Migrar cadenas hardcodeadas a i18n

### Fase 3 (Semana 3) — Type Safety + Framework
1. Eliminar casts `as any` en 7 pantallas
2. Estandarizar framework UI en 13 pantallas

### Fase 4 (Semana 4) — Finalización
1. Completar en.json (bitacora, curvas_s)
2. Implementar mutation handlers huérfanos
3. Pruebas E2E de accesibilidad
4. Auditoría final
