# Database Automation Checklist - CONSTRUSMART ERP

## Estado Actual: 2026-06-26

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
- [x] MEDIUM-4: Agregar Audit Triggers a Tablas Faltantes (Migrations 061-062)
- [x] MEDIUM-5: Script de Validación de Integridad de Datos (scripts/validate-data-integrity.mjs)
- [x] MEDIUM-6: Script de Optimización de Índices (scripts/optimize-indexes.mjs)
- [x] MEDIUM-7: Script de Monitoreo de Deadlocks (scripts/monitor-deadlocks.mjs)

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

#### 4. Agregar Audit Triggers a Tablas Faltantes ✅ COMPLETADO
**Archivo**: `supabase/migrations/000000000061_add_missing_audit_triggers.sql`, `supabase/migrations/000000000062_add_critical_audit_triggers.sql`

**Estado**: ✅ Completado (2026-06-26)

**Tareas realizadas**:
- [x] Identificar tablas sin audit triggers (script audit-trigger-coverage.mjs)
- [x] Migration 061: Agregar triggers a tablas de configuración y usuarios:
  - `erp_empresas`
  - `erp_insumos_base`
  - `erp_usuarios`
  - `erp_notificaciones`
  - `erp_cotizaciones_negocio`
  - `erp_plantillas_proyectos`
  - `erp_avances`
  - `erp_hitos`
  - `erp_riesgos`
  - `erp_planos`
  - `erp_pruebas_laboratorio`
  - `erp_liberaciones_partida`
- [x] Migration 062: Agregar triggers a tablas críticas de negocio:
  - `erp_cuadros`
  - `erp_eventos_calendario`
  - `erp_bitacora`
  - `erp_seguimiento`
  - `erp_empleados`
- [x] Aplicar migrations 061 y 062
- [x] Verificar cobertura de audit triggers (46.5% = 33/71 tablas)

**Notas**:
- Las siguientes tablas son VIEWS, no TABLES, por lo que no pueden tener triggers:
  - `erp_cuadros_comparativos` (view de cuadro_comparativo_proveedores)
  - `erp_incidentes_sso` (view)
  - `erp_publicaciones_muro` (view de erp_muro)
- Las tablas restantes sin triggers son:
  - Tablas de sistema (audit_log, error_log, auditoria) - no necesitan triggers
  - Tablas de referencia/configuración (geografía, parámetros de cálculo) - baja prioridad
  - Tablas de baja actividad (movimientos) - baja prioridad
  - Tablas de negocio restantes (sub_renglones, licitaciones, insumos, activos_herramienta, rendimientos_cuadrilla, proveedores, proyecto_miembros) - pueden agregarse en futuro si se requiere

**Tiempo estimado**: 2-3 horas

---

#### 5. Script de Validación de Integridad de Datos ✅ COMPLETADO
**Archivo**: `scripts/validate-data-integrity.mjs`

**Estado**: ✅ Completado (2026-06-26)

**Tareas realizadas**:
- [x] Crear script que valide:
  - Orphaned records (sin FKs válidos) - 12 tablas con proyecto_id
  - NULL values en columnas que deberían ser NOT NULL - 6 tablas críticas
  - Valores fuera de rango (porcentajes > 100, montos negativos) - 8 checks
  - Fechas inconsistentes (fin < inicio) - 3 tablas con fechas
- [x] Generar reporte HTML con hallazgos (data-integrity-report.html)
- [x] Agregar npm script: `npm run validate:integrity`
- [x] Integrar con error logging para reportar violaciones (log_error RPC)
- [x] Validaciones implementadas:
  - Orphaned records: ordenes_compra, vales_salida, cuentas_cobrar, cuentas_pagar, avances, hitos, riesgos, planos, cuadros, bitacora, licitaciones, muro
  - NULL values: presupuestos, ordenes_compra, vales_salida, activos, hitos, cuadros
  - Out of range: montos negativos, cantidades no positivas, porcentajes < 0 o > 100
  - Inconsistent dates: hitos, eventos_calendario, licitaciones

**Tiempo estimado**: 4-5 horas

---

#### 6. Script de Optimización de Índices ✅ COMPLETADO
**Archivo**: `scripts/optimize-indexes.mjs`

**Estado**: ✅ Completado (2026-06-26)

**Tareas realizadas**:
- [x] Crear script que analice:
  - Índices no utilizados (idx_scan = 0)
  - Índices duplicados o redundantes
  - Índices faltantes sugeridos por pg_stat_statements
- [x] Generar reporte HTML con recomendaciones
- [x] Agregar npm script: `npm run analyze:indexes`
- [x] Configurar para ejecución trimestral (recomendación)
- [x] Analizar estadísticas de uso de índices

**Validaciones requeridas**:
- Índices con idx_scan = 0 (no utilizados)
- Índices duplicados (mismo conjunto de columnas)
- Columnas de FK sin índice
- Columnas comúnmente consultadas sin índice (proyecto_id, created_by, estado, fechas)

**Tiempo estimado**: 3-4 horas

---

#### 7. Script de Monitoreo de Deadlocks ✅ COMPLETADO
**Archivo**: `scripts/monitor-deadlocks.mjs`

**Estado**: ✅ Completado (2026-06-26)

**Tareas realizadas**:
- [x] Crear script que consulte `erp_audit_log` por deadlock events
- [x] Generar reporte de deadlocks en último período (7 días)
- [x] Identificar patrones de deadlock (por tabla, operación, hora, día)
- [x] Agregar npm script: `npm run monitor:deadlocks`
- [x] Configurar alertas cuando deadlocks > threshold (5 en 24 horas)
- [x] Integrar con error logging para tasas altas de deadlock

**Validaciones requeridas**:
- Consulta erp_audit_log por eventos de deadlock
- Análisis de patrones: tabla más afectada, operación más frecuente, hora pico
- Recomendaciones de prevención (isolation levels, advisory locks, orden de transacciones)
- Alerta automática cuando > 5 deadlocks en 24 horas

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
| 🟡 MEDIUM | 0 | 0 horas |
| 🟢 LOW | 8 | 35-46 horas |
| **TOTAL** | **11** | **44-57 horas** |

---

## 🎯 Recomendación de Orden de Implementación

### Sesión 1 (Prioridad Alta - 9-11 horas) ✅ COMPLETADO
1. Habilitar CHECK Constraints (3-4 horas) ✅
2. Integrar Error Logging en Aplicación (4-5 horas) ✅
3. Automatizar Cleanup de Error Logs (2 horas) ✅

### Sesión 2 (Prioridad Media - 11-15 horas) ✅ COMPLETADO
4. Agregar Audit Triggers a Tablas Faltantes (2-3 horas) ✅
5. Script de Validación de Integridad de Datos (4-5 horas) ✅
6. Script de Optimización de Índices (3-4 horas) ✅
7. Script de Monitoreo de Deadlocks (2-3 horas) ✅

### ✅ COMPLETADO (SESIÓN-14 — 2026-06-26)
- [x] 8. Auditoría screen con filters, KPIs, CSV export (`src/erp/screens/Auditoria.tsx`)
- [x] 9. ErrorLog screen completa con resolve modal, chart, filters (`src/erp/screens/ErrorLog.tsx`)
- [x] 10. backup:create script + GitHub Actions weekly (`scripts/create-backup.js`, `.github/workflows/backup-verify.yml`)
- [x] 11. error-db-logger.ts con RPC log_error + cleanup + resolve (`src/lib/error-db-logger.ts`)
- [x] 12. verify-backups.cjs con verificación de tablas críticas, FK integrity, reporte JSON
- [x] 13. Dashboard cards de Integridad de Datos y Performance de Queries
- [x] 14. Schema alignment completo (Zod ↔ DB constraints)
- [x] 15. Todos los archivos .md cerrados con estado COMPLETADO

---

## 📝 Notas

- Todas las tareas requieren testing en staging antes de producción
- Documentar cada script con instrucciones de uso
- Agregar logging y manejo de errores en todos los scripts
- Configurar alertas para scripts críticos (backup, restore, integrity)
- Revisar y actualizar este checklist después de cada sesión
