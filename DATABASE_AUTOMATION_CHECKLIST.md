# Database Automation Checklist - CONSTRUSMART ERP

## Estado Actual: 2026-06-20

### ✅ Completado (Automatizado)
- [x] Phase 1.1: Fix Critical Nullable Columns (Migration 047)
- [x] Phase 1.2: Add Missing Indexes (Migration 048)
- [x] Phase 2.1: Add Foreign Keys (Migration 049)
- [x] Phase 3.1: Add Audit Triggers (Migration 050)
- [x] Phase 5.1: Column-Level Security (Migration 052)
- [x] Phase 6.1: Monitor Table Growth (Migrations 054-055)
- [x] Phase 7.1: Error Logging Table (Migration 053)
- [x] Phase 7.2: Deadlock Prevention (Migration 056)
- [x] Backup verification script (verify-backups.cjs)
- [x] Table growth monitoring script (monitor-table-growth.mjs)
- [x] HIGH-1: Habilitar CHECK Constraints (Migration 060 - enable_safe_check_constraints.sql)
- [x] HIGH-2: Integrar Error Logging en Aplicación (src/lib/error-logger.ts, ErrorLog.tsx, store integration)
- [x] HIGH-3: Automatizar Cleanup de Error Logs (scripts/cleanup-error-logs.mjs, GitHub Actions workflow)

---

## 📋 Tareas Pendientes Automatizables

### 🔴 HIGH PRIORITY

#### 1. Habilitar CHECK Constraints (Phase 3.2) ✅ COMPLETADO
**Archivo**: `supabase/migrations/000000000060_enable_safe_check_constraints.sql`

**Estado**: ✅ Completado (2026-06-26)

**Tareas realizadas**:
- [x] Crear script `validate-check-constraints.mjs` para validar datos existentes
- [x] Ejecutar validación en producción antes de habilitar constraints
- [x] Corregir datos que violen constraints si existen
- [x] Crear migration 060 con constraints habilitados (safe version con validación previa)
- [x] Aplicar migration 060
- [x] Verificar que application funciona con constraints activos

**Validaciones requeridas**:
- Montos monetarios >= 0 (ordenes_compra, cuentas_cobrar, cuentas_pagar)
- Estados válidos en tablas de negocio
- Fechas fin >= fechas inicio
- Porcentajes entre 0 y 100
- Severidades y estados válidos en calidad/incidentes

**Tiempo estimado**: 3-4 horas

---

#### 2. Integrar Error Logging en Aplicación ✅ COMPLETADO
**Archivo**: `src/lib/error-logger.ts` (nuevo)

**Estado**: ✅ Completado (2026-06-26)

**Tareas realizadas**:
- [x] Crear módulo `src/lib/error-logger.ts` con:
  - `logError()` function que llama a DB function `log_error()`
  - `resolveError()` function que llama a DB function `resolve_error()`
  - `logErrorFromException()` para capturar excepciones
  - `getErrorContext()` para extraer contexto del error
- [x] Actualizar `src/erp/store.tsx` para loggear errores en forceSync
- [x] Actualizar `src/erp/zustandStore.ts` para loggear errores en mutations (updateProyecto, updateOrden)
- [x] Crear vista de errores en admin dashboard (src/erp/screens/ErrorLog.tsx)
- [x] Integrar ErrorLog en AppLayout y Sidebar
- [x] Configurar cleanup automático de error logs (ver tarea 3)

**Tiempo estimado**: 4-5 horas

---

#### 3. Automatizar Cleanup de Error Logs ✅ COMPLETADO
**Archivo**: `scripts/cleanup-error-logs.mjs` (nuevo)

**Estado**: ✅ Completado (2026-06-26)

**Tareas realizadas**:
- [x] Crear script `scripts/cleanup-error-logs.mjs`
- [x] Configurar para ejecutar semanalmente (keep 90 days)
- [x] Agregar npm script: `npm run cleanup:error-logs`
- [x] Configurar GitHub Action workflow para ejecución automática (Sundays 2AM UTC)
- [x] Agregar logging de cleanup results
- [x] Actualizar .gitignore para permitir scripts/*.mjs
- [x] Actualizar eslint.config.js para ignorar scripts/*.mjs

**Tiempo estimado**: 2 horas

---

### 🟡 MEDIUM PRIORITY

#### 4. Agregar Audit Triggers a Tablas Faltantes
**Archivo**: `supabase/migrations/000000000050_add_audit_triggers.sql`

**Estado**: Triggers creados para 15+ tablas, pero faltan algunas

**Tareas**:
- [ ] Identificar tablas sin audit triggers (revisar lista en DATABASE_IMPROVEMENTS.md)
- [ ] Agregar triggers a tablas faltantes:
  - `erp_empresas`
  - `erp_insumos_base`
  - `erp_usuarios`
  - `erp_notificaciones`
  - Otras tablas críticas identificadas
- [ ] Aplicar migration actualizada
- [ ] Verificar que triggers funcionan correctamente

**Tiempo estimado**: 2-3 horas

---

#### 5. Script de Validación de Integridad de Datos
**Archivo**: `scripts/validate-data-integrity.mjs` (nuevo)

**Estado**: No existe

**Tareas**:
- [ ] Crear script que valide:
  - Orphaned records (sin FKs válidos)
  - NULL values en columnas que deberían ser NOT NULL
  - Valores fuera de rango (porcentajes > 100, montos negativos)
  - Fechas inconsistentes (fin < inicio)
- [ ] Generar reporte HTML con hallazgos
- [ ] Agregar npm script: `npm run validate:integrity`
- [ ] Configurar para ejecución mensual automática
- [ ] Integrar con error logging para reportar violaciones

**Tiempo estimado**: 4-5 horas

---

#### 6. Script de Optimización de Índices
**Archivo**: `scripts/optimize-indexes.mjs` (nuevo)

**Estado**: No existe

**Tareas**:
- [ ] Crear script que analice:
  - Índices no utilizados (idx_scan = 0)
  - Índices duplicados o redundantes
  - Índices faltantes sugeridos por pg_stat_statements
- [ ] Generar reporte con recomendaciones
- [ ] Agregar npm script: `npm run analyze:indexes`
- [ ] Configurar para ejecución trimestral
- [ ] Implementar建议的优化 (previa aprobación)

**Tiempo estimado**: 3-4 horas

---

#### 7. Script de Monitoreo de Deadlocks
**Archivo**: `scripts/monitor-deadlocks.mjs` (nuevo)

**Estado**: Función DB `log_deadlock_event()` existe pero no hay monitoreo activo

**Tareas**:
- [ ] Crear script que consulte `erp_audit_log` por deadlock events
- [ ] Generar reporte de deadlocks en último período (7 días)
- [ ] Identificar patrones de deadlock
- [ ] Agregar npm script: `npm run monitor:deadlocks`
- [ ] Configurar alertas cuando deadlocks > threshold
- [ ] Integrar con `src/lib/transaction-retry.ts` para loggear deadlocks

**Tiempo estimado**: 2-3 horas

---

### 🟢 LOW PRIORITY

#### 8. Script de Estadísticas de Uso de Tablas
**Archivo**: `scripts/table-usage-stats.mjs` (nuevo)

**Estado**: No existe

**Tareas**:
- [ ] Crear script que analice:
  - Row counts por tabla
  - Growth rate por tabla
  - Queries más frecuentes por tabla
  - Write vs read ratio
- [ ] Generar reporte visual (gráficos con Chart.js o similar)
- [ ] Agregar npm script: `npm run stats:table-usage`
- [ ] Configurar para ejecución mensual
- [ ] Usar datos para planificar particionamiento futuro

**Tiempo estimado**: 3-4 horas

---

#### 9. Script de Análisis de Slow Queries
**Archivo**: `scripts/analyze-slow-queries.mjs` (nuevo)

**Estado**: No existe

**Tareas**:
- [ ] Crear script que use pg_stat_statements
- [ ] Identificar queries > 1s
- [ ] Analizar EXPLAIN ANALYZE de slow queries
- [ ] Generar recomendaciones de optimización
- [ ] Agregar npm script: `npm run analyze:slow-queries`
- [ ] Configurar para ejecución semanal
- [ ] Integrar con Supabase Query Performance Insights

**Tiempo estimado**: 4-5 horas

---

#### 10. Script de Backup Automático Local
**Archivo**: `scripts/local-backup.mjs` (nuevo)

**Estado**: Verificación de backup existe, pero no backup local

**Tareas**:
- [ ] Crear script que haga dump local de DB
- [ ] Comprimir backup con gzip
- [ ] Subir a almacenamiento seguro (S3, Azure Blob, etc.)
- [ ] Agregar npm script: `npm run backup:local`
- [ ] Configurar cron job para backup diario
- [ ] Implementar rotación de backups (keep 7 days, 4 weeks, 12 months)
- [ ] Enviar notificación si backup falla

**Tiempo estimado**: 3-4 horas

---

#### 11. Script de Restore Testing
**Archivo**: `scripts/test-restore.mjs` (nuevo)

**Estado**: No existe

**Tareas**:
- [ ] Crear script que restaure backup en ambiente de prueba
- [ ] Validar integridad de datos post-restore
- [ ] Ejecutar suite de tests post-restore
- [ ] Generar reporte de restore test
- [ ] Agregar npm script: `npm run test:restore`
- [ ] Configurar para ejecución mensual
- [ ] Enviar alerta si restore falla

**Tiempo estimado**: 4-5 horas

---

#### 12. Integración de Audit Log en UI
**Archivo**: `src/erp/screens/AuditLog.tsx` (nuevo)

**Estado**: Tabla y triggers existen, pero no hay UI para ver

**Tareas**:
- [ ] Crear pantalla de Audit Log en ERP
- [ ] Filtros por tabla, acción, usuario, fecha
- [ ] Vista de diff (old_data vs new_data)
- [ ] Exportación de audit log a CSV/Excel
- [ ] Integrar en sidebar para usuarios admin
- [ ] Agregar a ACL (solo admin puede ver)

**Tiempo estimado**: 5-6 horas

---

#### 13. Integración de Error Log en UI
**Archivo**: `src/erp/screens/ErrorLog.tsx` (nuevo)

**Estado**: Tabla y funciones existen, pero no hay UI para ver

**Tareas**:
- [ ] Crear pantalla de Error Log en ERP
- [ ] Filtros por tipo, severidad, componente, fecha
- [ ] Vista detallada de error con stack trace
- [ ] Función para marcar error como resuelto
- [ ] Exportación de error log a CSV/Excel
- [ ] Integrar en sidebar para usuarios admin
- [ ] Agregar a ACL (solo admin puede ver)

**Tiempo estimado**: 5-6 horas

---

#### 14. Script de Particionamiento de Tablas Grandes
**Archivo**: `scripts/partition-tables.mjs` (nuevo)

**Estado**: No existe (no necesario actualmente, pero preparación futura)

**Tareas**:
- [ ] Identificar tablas que podrían crecer > 1M rows
- [ ] Diseñar estrategia de particionamiento (por fecha, por proyecto)
- [ ] Crear script para particionar tablas
- [ ] Implementar particionamiento automático para nuevas tablas
- [ ] Documentar estrategia de particionamiento
- [ ] Configurar para ejecución cuando threshold se alcance

**Tiempo estimado**: 6-8 horas

---

#### 15. Script de Archivo de Datos Históricos
**Archivo**: `scripts/archive-historical-data.mjs` (nuevo)

**Estado**: No existe

**Tareas**:
- [ ] Identificar datos históricos (audit logs > 1 año, error logs resueltos > 6 meses)
- [ ] Crear script para mover datos a tablas de archivo
- [ ] Comprimir datos archivados
- [ ] Mover a almacenamiento de bajo costo
- [ ] Crear vistas unificadas para查询 datos archivados
- [ ] Configurar para ejecución trimestral

**Tiempo estimado**: 5-6 horas

---

## 📊 Resumen de Tiempos

| Prioridad | Tareas | Tiempo Total |
|-----------|--------|--------------|
| 🔴 HIGH | 3 | 9-11 horas |
| 🟡 MEDIUM | 4 | 11-15 horas |
| 🟢 LOW | 8 | 35-46 horas |
| **TOTAL** | **15** | **55-72 horas** |

---

## 🎯 Recomendación de Orden de Implementación

### Sesión 1 (Prioridad Alta - 9-11 horas)
1. Habilitar CHECK Constraints (3-4 horas)
2. Integrar Error Logging en Aplicación (4-5 horas)
3. Automatizar Cleanup de Error Logs (2 horas)

### Sesión 2 (Prioridad Media - 11-15 horas)
4. Agregar Audit Triggers a Tablas Faltantes (2-3 horas)
5. Script de Validación de Integridad de Datos (4-5 horas)
6. Script de Optimización de Índices (3-4 horas)
7. Script de Monitoreo de Deadlocks (2-3 horas)

### Sesión 3-4 (Prioridad Baja - 35-46 horas)
8. Script de Estadísticas de Uso de Tablas (3-4 horas)
9. Script de Análisis de Slow Queries (4-5 horas)
10. Script de Backup Automático Local (3-4 horas)
11. Script de Restore Testing (4-5 horas)
12. Integración de Audit Log en UI (5-6 horas)
13. Integración de Error Log en UI (5-6 horas)
14. Script de Particionamiento de Tablas Grandes (6-8 horas)
15. Script de Archivo de Datos Históricos (5-6 horas)

---

## 📝 Notas

- Todas las tareas requieren testing en staging antes de producción
- Documentar cada script con instrucciones de uso
- Agregar logging y manejo de errores en todos los scripts
- Configurar alertas para scripts críticos (backup, restore, integrity)
- Revisar y actualizar este checklist después de cada sesión
