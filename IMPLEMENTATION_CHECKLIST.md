# Checklist de Implementación: Cambios en Esquema de Base de Datos

## Pre-Deployment Checklist

### Preparación
- [ ] Backup de base de datos (full dump)
- [ ] Documentar estado actual de cola de mutaciones en localStorage
- [ ] Backup de localStorage de usuarios (si es posible)
- [ ] Verificar que todos los tests pasan (619/619)
- [ ] Verificar que no hay warnings de TypeScript
- [ ] Verificar que el build es exitoso
- [ ] Documentar versión actual de la aplicación
- [ ] Crear branch de feature: `feature/schema-alignment`
- [ ] Comunicar maintenance window a stakeholders

### Fase 1: Schemas Zod (CRÍTICO)

#### Archivos a modificar:
- [ ] `src/erp/store/schemas/calendario.ts`
- [ ] `src/erp/store/schemas/social.ts`
- [ ] `src/erp/store/schemas/bodega.ts`
- [ ] `src/erp/store/schemas/financiero.ts`
- [ ] `src/erp/store/schemas/presupuestos.ts`

#### Cambios por archivo:

**calendario.ts**
- [ ] Cambiar `proyectoId: z.string().nullable().optional().default('')` a `proyectoId: z.string().min(1, 'proyectoId es requerido')`
- [ ] Verificar que `created_at` y `updated_at` están en el schema
- [ ] Validar que no rompe parsing de datos existentes
- [ ] Actualizar tests que dependen de este schema

**social.ts**
- [ ] Cambiar `proyectoId: z.string().nullable().optional().default('')` a `proyectoId: z.string().min(1, 'proyectoId es requerido')`
- [ ] Verificar que `created_at` y `updated_at` están en el schema
- [ ] Validar que no rompe parsing de datos existentes
- [ ] Actualizar tests que dependen de este schema

**bodega.ts**
- [ ] Cambiar `proyectoId: z.string().nullable().optional().default('')` a `proyectoId: z.string().min(1, 'proyectoId es requerido')`
- [ ] Verificar que `created_at` y `updated_at` están en el schema
- [ ] Validar que no rompe parsing de datos existentes
- [ ] Actualizar tests que dependen de este schema

**financiero.ts**
- [ ] Cambiar `proyectoId: z.string().nullable().optional().default('')` a `proyectoId: z.string().min(1, 'proyectoId es requerido')`
- [ ] Verificar que `created_at` y `updated_at` están en el schema
- [ ] Validar que no rompe parsing de datos existentes
- [ ] Actualizar tests que dependen de este schema

**presupuestos.ts**
- [ ] Cambiar `proyectoId: z.string().nullable().optional().default('')` a `proyectoId: z.string().min(1, 'proyectoId es requerido')`
- [ ] Verificar que `created_at` y `updated_at` están en el schema
- [ ] Validar que no rompe parsing de datos existentes
- [ ] Actualizar tests que dependen de este schema

#### Validación:
- [ ] Ejecutar tests de integridad de schemas (`src/erp/__tests__/integrity.test.ts`)
- [ ] Verificar que `loadFromStorage` valida correctamente con nuevos schemas
- [ ] Probar parsing de datos existentes en localStorage
- [ ] Verificar que no hay errores de validación en consola

### Fase 2: Handlers de Mutación (CRÍTICO)

#### Archivo: `src/erp/zustandStore.ts`

**Modificar `enqueueMutation`**
- [ ] Añadir lógica para añadir `created_at` automáticamente si no está presente
- [ ] Añadir lógica para añadir `updated_at` automáticamente si no está presente
- [ ] Verificar que los timestamps se añaden en el formato correcto (ISO string)
- [ ] Testear con payloads que ya tienen timestamps
- [ ] Testear con payloads sin timestamps

**Estandarizar handlers de mutación**
- [ ] Revisar todos los handlers `add*` para verificar que añaden `createdAt`
- [ ] Revisar todos los handlers `update*` para verificar que añaden `updatedAt`
- [ ] Revisar todos los handlers `delete*` para verificar consistencia
- [ ] Añadir timestamps faltantes donde sea necesario
- [ ] Verificar que el formato de timestamps es consistente

**Handlers específicos a revisar:**
- [ ] `addPublicacionMuro` (línea 681-684)
- [ ] `addMovimiento` (línea ~400)
- [ ] `addEmpleado` (línea ~450)
- [ ] `addMaterial` (línea ~500)
- [ ] `addOrdenCompra` (línea ~550)
- [ ] `addProveedor` (línea ~600)
- [ ] `addPresupuesto` (línea ~650)
- [ ] `addCotizacion` (línea ~700)
- [ ] `addHito` (línea ~750)
- [ ] `addRiesgo` (línea ~800)
- [ ] `addBitacora` (línea ~850)
- [ ] `addAvance` (línea ~900)
- [ ] `addPlantilla` (línea ~950)

#### Validación:
- [ ] Ejecutar tests de store operations (`src/__tests__/erp-store-operations-full.test.tsx`)
- [ ] Verificar que `forceSync` envía timestamps correctos a Supabase
- [ ] Testear offline-first con cola de mutaciones
- [ ] Verificar que las mutaciones se sincronizan correctamente

### Fase 3: Validación de FK (ALTA)

#### Archivo: `src/erp/zustandStore.ts`

**Crear helper function**
- [ ] Implementar `validateForeignKey<T extends { proyectoId?: string }>`
- [ ] Verificar que el helper valida contra el array `proyectos`
- [ ] Añadir mensaje de error claro cuando FK es inválida
- [ ] Loggear error cuando FK es inválida

**Añadir validación a handlers críticos**
- [ ] `addMovimiento`: añadir validación de `proyectoId`
- [ ] `addEmpleado`: añadir validación de `proyectoId`
- [ ] `addMaterial`: añadir validación de `proyectoId`
- [ ] `addOrdenCompra`: añadir validación de `proyectoId`
- [ ] `addPresupuesto`: añadir validación de `proyectoId`
- [ ] `addCotizacion`: añadir validación de `proyectoId`
- [ ] `addHito`: añadir validación de `proyectoId`
- [ ] `addRiesgo`: añadir validación de `proyectoId`
- [ ] `addBitacora`: añadir validación de `proyectoId`
- [ ] `addAvance`: añadir validación de `proyectoId`

**Validación de FKs secundarias**
- [ ] `addOrdenCompra`: validar `proveedorId` existe en `proveedores`
- [ ] `addCotizacion`: validar `proveedorId` existe en `proveedores`
- [ ] `addPlantilla`: validar `creadaPor` existe en `usuarios`

#### Validación:
- [ ] Testear creación de entidad con `proyectoId` inválido
- [ ] Verificar que se muestra error UI inmediato
- [ ] Verificar que la mutación NO se encola
- [ ] Testear creación de entidad con `proyectoId` válido
- [ ] Verificar que la mutación se encola correctamente

### Fase 4: Error Logging Integration (MEDIA)

#### Archivo: `src/lib/error-logger.ts`

**Modificar `logErrorFromException`**
- [ ] Añadir llamada a RPC `log_error` de Supabase
- [ ] Verificar que se pasan todos los parámetros requeridos
- [ ] Manejar error si la RPC falla (fallback a console)
- [ ] Testear logging de errores reales

**Parámetros a pasar a `log_error`:**
- [ ] `p_error_type`: tipo de error (database, api, ui, auth, sync)
- [ ] `p_error_message`: mensaje de error
- [ ] `p_severity`: severidad (error, warning, info)
- [ ] `p_component`: componente donde ocurrió el error
- [ ] `p_function_name`: función donde ocurrió el error
- [ ] `p_stack_trace`: stack trace del error
- [ ] `p_additional_context`: contexto adicional (JSON)

#### Archivo: Nuevo `src/lib/error-db-logger.ts`

**Crear módulo de logging a DB**
- [ ] Implementar `logErrorToDatabase(error, context)`
- [ ] Implementar `resolveErrorInDatabase(id, notes)`
- [ ] Implementar `cleanupOldErrorsInDatabase(daysOld)`
- [ ] Verificar que se usa el cliente Supabase correcto
- [ ] Manejar errores de conexión

#### Validación:
- [ ] Testear logging de error a DB
- [ ] Verificar que el error aparece en tabla `erp_error_log`
- [ ] Testear resolución de error
- [ ] Testear cleanup de errores antiguos

### Fase 5: UI para Error Log (BAJA)

#### Archivo: Nuevo `src/erp/screens/ErrorLog.tsx`

**Crear componente principal**
- [ ] Implementar estructura de la pantalla (header, KPIs, filtros, tabla)
- [ ] Implementar KPI cards (total, abiertos, resueltos, críticos)
- [ ] Implementar filtros avanzados (búsqueda, tipo, severidad, estado, fecha)
- [ ] Implementar tabla de errores con paginación
- [ ] Implementar modal de detalle de error
- [ ] Implementar bulk actions (resolver, eliminar, exportar, cleanup)

**Integración con store**
- [ ] Añadir `errorLogs` a `ErpData` interface
- [ ] Añadir `setErrorLogs` a `ErpActions` interface
- [ ] Añadir `resolveError` a `ErpActions` interface
- [ ] Añadir `deleteError` a `ErpActions` interface
- [ ] Añadir `cleanupOldErrors` a `ErpActions` interface
- [ ] Implementar acciones en `zustandStore.ts`

**Schema Zod**
- [ ] Crear `src/erp/store/schemas/errorLog.ts`
- [ ] Definir `errorLogSchema` con todos los campos
- [ ] Exportar `ErrorLogEntry` type
- [ ] Validar schema contra estructura de DB

#### Archivo: `src/erp/store.tsx`

**Actualizar type `View`**
- [ ] Añadir `'error-log'` al type `View`
- [ ] Verificar que no rompe navegación existente

**Actualizar `TABLE_MAP`**
- [ ] Añadir entrada para `erp_error_log`
- [ ] Verificar que mapea a `errorLogs` en store

**Actualizar `SUPABASE_TABLES`**
- [ ] Añadir `erp_error_log` a la lista
- [ ] Verificar que se usa en `fetchInitialData`

#### Archivo: `src/erp/components/Sidebar.tsx`

**Añadir entrada de menú**
- [ ] Añadir item de menú para "Log de Errores"
- [ ] Usar icono `AlertOutlined` de Ant Design
- [ ] Añadir badge con contador de errores no resueltos
- [ ] Restringir a rol `Administrador`
- [ ] Verificar navegación a pantalla `error-log`

#### Archivo: `src/erp/AppLayout.tsx`

**Añadir lazy import**
- [ ] Añadir lazy import de `ErrorLog` screen
- [ ] Añadir route para `error-log` view
- [ ] Verificar que funciona la navegación

#### Archivo: `src/lib/i18n/es.json` y `en.json`

**Añadir traducciones**
- [ ] Añadir keys para pantalla de error log
- [ ] Añadir keys para KPIs
- [ ] Añadir keys para filtros
- [ ] Añadir keys para modal de detalle
- [ ] Añadir keys para bulk actions

#### Validación:
- [ ] Testear navegación a pantalla de error log
- [ ] Testear KPI cards con datos reales
- [ ] Testear filtros avanzados
- [ ] Testear modal de detalle
- [ ] Testear bulk actions
- [ ] Testear resolución de error
- [ ] Testear cleanup de errores antiguos
- [ ] Testear export a CSV
- [ ] Verificar que solo administradores pueden acceder

### Fase 6: Testing y QA

#### Unit Tests
- [ ] Crear tests para `validateForeignKey` helper
- [ ] Crear tests para `enqueueMutation` con timestamps
- [ ] Crear tests para `logErrorToDatabase`
- [ ] Crear tests para `resolveErrorInDatabase`
- [ ] Crear tests para `cleanupOldErrorsInDatabase`
- [ ] Crear tests para `ErrorLog` screen components
- [ ] Verificar que todos los tests existentes aún pasan (619/619)

#### Integration Tests
- [ ] Testear `forceSync` con nuevos timestamps
- [ ] Testear validación de FK en mutaciones
- [ ] Testear logging de errores a DB
- [ ] Testear sincronización de error logs
- [ ] Testear cleanup de errores antiguos

#### E2E Tests
- [ ] Testear flujo completo de creación de entidad con `proyectoId` válido
- [ ] Testear flujo completo de creación de entidad con `proyectoId` inválido
- [ ] Testear navegación a pantalla de error log
- [ ] Testear aplicación de filtros en error log
- [ ] Testear resolución de error desde UI
- [ ] Testear cleanup de errores antiguos desde UI
- [ ] Testear export a CSV desde UI

#### Performance Testing
- [ ] Verificar que la carga de error logs no afecta rendimiento
- [ ] Verificar que la paginación funciona correctamente
- [ ] Verificar que los filtros no causan lag
- [ ] Verificar que la sincronización de error logs es eficiente

#### Accessibility Testing
- [ ] Verificar aria-labels en todos los botones
- [ ] Verificar navegación por teclado en tabla de errores
- [ ] Verificar contrast ratios en dark mode
- [ ] Verificar focus visible en elementos interactivos

### Fase 7: Deployment

#### Pre-Deployment
- [ ] Verificar que todos los tests pasan (619/619)
- [ ] Verificar que no hay warnings de TypeScript
- [ ] Verificar que el build es exitoso
- [ ] Ejecutar migration scripts en staging
- [ ] Validar datos en staging
- [ ] Performance testing con nuevos índices
- [ ] Documentación actualizada
- [ ] Rollback plan documentado
- [ ] Monitoreo configurado para errores post-deployment

#### Deployment
- [ ] Hacer merge de branch `feature/schema-alignment` a `main`
- [ ] Ejecutar migration scripts en producción
- [ ] Verificar que las migraciones se ejecutan sin errores
- [ ] Desplegar aplicación a producción
- [ ] Verificar que la aplicación carga correctamente
- [ ] Verificar que no hay errores en consola
- [ ] Verificar que las mutaciones se sincronizan correctamente
- [ ] Verificar que el error logging funciona

#### Post-Deployment
- [ ] Monitorear errores en primera hora post-deployment
- [ ] Verificar que no hay mutaciones fallidas
- [ ] Verificar que los error logs se registran correctamente
- [ ] Verificar que la UI de error log funciona
- [ ] Recopilar feedback de usuarios
- [ ] Documentar cualquier problema encontrado
- [ ] Crear tickets para issues encontrados

### Fase 8: Documentación

#### Documentación Técnica
- [ ] Actualizar `AGENTS.md` con nuevos cambios
- [ ] Documentar nuevos schemas en `SCHEMA_IMPACT_ANALYSIS.md`
- [ ] Documentar nueva pantalla de error log en `UI_DESIGN_ERROR_LOG.md`
- [ ] Documentar cambios en `zustandStore.ts`
- [ ] Documentar cambios en `error-logger.ts`

#### Documentación de Usuario
- [ ] Crear guía de usuario para pantalla de error log
- [ ] Crear guía de troubleshooting para errores comunes
- [ ] Actualizar documentación de existente con cambios

#### Documentación de Deployment
- [ ] Documentar pasos de deployment
- [ ] Documentar rollback plan
- [ ] Documentar monitoreo post-deployment
- [ ] Documentar issues conocidos y soluciones

## Métricas de Éxito

### Antes
- [ ] Mutaciones fallidas por constraint: ~10% (estimado)
- [ ] Tiempo de sync: 5-10s
- [ ] Errores no rastreados: 100%

### Después (Objetivo)
- [ ] Mutaciones fallidas por constraint: 0%
- [ ] Tiempo de sync: 2-5s (mejora por índices)
- [ ] Errores rastreados: 100%
- [ ] Tiempo de resolución de errores: -50%

## Checklist Final

### Verificación Final
- [ ] Todos los items del checklist están completados
- [ ] Todos los tests pasan (619/619)
- [ ] No hay warnings de TypeScript
- [ ] Build es exitoso
- [ ] Documentación está actualizada
- [ ] Rollback plan está documentado
- [ ] Monitoreo está configurado
- [ ] Stakeholders están notificados
- [ ] Maintenance window está confirmado

### Sign-off
- [ ] Developer: _______________________
- [ ] QA Engineer: _______________________
- [ ] Tech Lead: _______________________
- [ ] Product Owner: _______________________
- [ ] Date: _______________________
