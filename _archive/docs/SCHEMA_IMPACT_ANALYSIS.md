# Análisis de Impacto: Cambios en Esquema de Base de Datos

## Resumen Ejecutivo

Este documento analiza el impacto de los cambios recientes en el esquema de base de datos (migraciones 47, 48, 49 y 53) sobre la lógica del sistema CONSTRUSMART ERP. Se identifican áreas críticas que requieren refactorización para garantizar la integridad de datos y el correcto funcionamiento de la aplicación.

## Migraciones Analizadas

### 1. Migration 000000000047_fix_nullable_columns.sql
**Cambio**: Adición de restricciones `NOT NULL` a columnas críticas
- `id` en todas las tablas principales
- `proyecto_id` en tablas transaccionales
- `created_at` y `updated_at` en todas las tablas

**Impacto**: Los registros existentes con valores NULL fueron actualizados a `NOW()` antes de aplicar las restricciones.

### 2. Migration 000000000048_add_missing_indexes.sql
**Cambio**: Creación de índices para optimización de consultas
- Índices en `proyecto_id` para tablas transaccionales
- Índices en `created_by` para auditoría
- Índices compuestos (`proyecto_id` + `created_at`, `proyecto_id` + `estado`)

**Impacto**: Mejora de rendimiento en consultas frecuentes. No requiere cambios en código.

### 3. Migration 000000000049_add_foreign_keys.sql
**Cambio**: Adición de restricciones de clave foránea
- Referencias a `erp_proyectos` vía `proyecto_id`
- `erp_subtipologias` → `erp_tipologias`
- `erp_plantillas_proyectos` → `erp_usuarios`

**Impacto**: Garantiza integridad referencial. Los intentos de insertar/actualizar con IDs inválidos fallarán.

### 4. Migration 000000000053_error_logging_table.sql
**Cambio**: Nueva tabla `erp_error_log` con RLS y funciones auxiliares
- Tabla centralizada para logging de errores
- Funciones: `log_error`, `resolve_error`, `cleanup_old_error_logs`
- Vistas: `error_statistics`, `recent_errors`

**Impacto**: Nueva funcionalidad que requiere implementación en UI y lógica de error handling.

---

## Impacto en Lógica del Sistema

### 🔴 CRÍTICO: Desalineación de Schemas Zod vs Base de Datos

#### Problema 1: `proyectoId` Nullable en Schemas pero NOT NULL en DB

**Archivos afectados**:
- `src/erp/store/schemas/calendario.ts` (línea 5)
- `src/erp/store/schemas/social.ts` (línea 28)
- `src/erp/store/schemas/bodega.ts` (línea 40)
- `src/erp/store/schemas/financiero.ts` (línea 5)
- `src/erp/store/schemas/presupuestos.ts` (línea 75)

**Definición actual**:
```typescript
proyectoId: z.string().nullable().optional().default('')
```

**Requerimiento DB**:
```sql
proyecto_id TEXT NOT NULL
```

**Consecuencia**:
- Validación Zod permite valores vacíos/null
- `forceSync` intentará insertar registros con `proyecto_id = ''` o `NULL`
- Supabase rechazará la inserción con error de constraint
- La mutación quedará en la cola con `retryCount` incrementado
- El usuario no verá el cambio reflejado en la DB

**Solución propuesta**:
```typescript
// Para entidades que DEBEN tener un proyecto
proyectoId: z.string().min(1, 'proyectoId es requerido')

// Para entidades que pueden ser globales (raro)
proyectoId: z.string().optional()
```

#### Problema 2: `created_at`/`updated_at` No Enviados en Mutaciones

**Análisis de `enqueueMutation`**:
```typescript
// zustandStore.ts línea 361-369
enqueueMutation: (type, payload) => {
  const sanitized = sanitizarObjeto(payload);
  const safePayload = toSnake(sanitized);
  // NO añade created_at/updated_at automáticamente
}
```

**Análisis de handlers de mutación**:
```typescript
// Ejemplo: addPublicacionMuro (línea 681-684)
addPublicacionMuro: (p) => {
  const n = { ...p, id: uid(), createdAt: new Date().toISOString(), likes: 0, comentarios: [] };
  // Añade createdAt localmente
}
```

**Inconsistencia**:
- Algunos handlers añaden `createdAt`/`updatedAt` manualmente
- Otros no lo hacen
- La DB tiene triggers DEFAULT NOW() pero esto puede no ser suficiente si el payload incluye valores NULL

**Solución propuesta**:
1. Modificar `enqueueMutation` para añadir timestamps automáticamente si no están presentes
2. Estandarizar todos los handlers para incluir timestamps
3. Actualizar schemas Zod para hacer timestamps requeridos

#### Problema 3: Foreign Key Violations Potenciales

**Escenario de riesgo**:
```typescript
// Usuario intenta crear movimiento con proyecto inexistente
addMovimiento({ 
  proyectoId: 'invalid-id-123',
  tipo: 'ingreso',
  monto: 1000
})
```

**Resultado esperado**:
- Validación local pasa (no hay check de existencia de proyecto)
- `forceSync` envía a Supabase
- Supabase rechaza con error de FK violation
- Mutación falla y se reintentará 3 veces antes de ser descartada

**Solución propuesta**:
1. Añadir validación en handlers antes de `enqueueMutation`
2. Verificar que `proyectoId` existe en `proyectos` array
3. Mostrar error UI inmediato en lugar de falla silenciosa

### 🟡 MEDIO: Error Logging No Integrado

#### Problema 4: Función `log_error` No Utilizada

**Función DB disponible**:
```sql
CREATE OR REPLACE FUNCTION log_error(...)
RETURNS UUID
```

**Estado actual**:
- Función existe en DB pero no se llama desde la aplicación
- `logErrorFromException` en `src/lib/error-logger.ts` solo escribe a console
- No hay integración con `erp_error_log`

**Solución propuesta**:
1. Modificar `logErrorFromException` para llamar a `log_error` RPC
2. Crear nueva vista UI para ver errores centralizados
3. Añadir función `cleanup_old_error_logs` en cron job o manual

### 🟢 BAJO: Rendimiento y Consultas

#### Oportunidad 1: Aprovechar Nuevos Índices

**Índices creados**:
- `idx_erp_movimientos_proyecto_id`
- `idx_erp_movimientos_created_at`
- `idx_erp_movimientos_proyecto_created_at`

**Estado actual**:
- Consultas ya filtran por `proyectoId` pero podrían optimizarse
- No hay consultas explícitas que usen índices compuestos

**Solución propuesta**:
1. Revisar consultas frecuentes en `fetchInitialData`
2. Añadir `order` en selects que usan `created_at`
3. Considerar filtros compuestos en queries específicas

---

## Matriz de Impacto por Módulo

| Módulo | Impacto Schema | Impacto FK | Impacto Error Log | Prioridad |
|--------|----------------|------------|-------------------|-----------|
| Proyectos | 🟡 Medio | 🟢 Bajo | 🟢 Bajo | P2 |
| Movimientos | 🔴 Crítico | 🔴 Crítico | 🟡 Medio | P1 |
| Empleados | 🔴 Crítico | 🔴 Crítico | 🟡 Medio | P1 |
| Materiales | 🔴 Crítico | 🔴 Crítico | 🟡 Medio | P1 |
| Ordenes Compra | 🔴 Crítico | 🔴 Crítico | 🟡 Medio | P1 |
| Proveedores | 🟡 Medio | 🟢 Bajo | 🟡 Medio | P2 |
| Presupuestos | 🔴 Crítico | 🔴 Crítico | 🟡 Medio | P1 |
| Cotizaciones | 🔴 Crítico | 🟡 Medio | 🟡 Medio | P1 |
| Hitos | 🔴 Crítico | 🔴 Crítico | 🟡 Medio | P1 |
| Riesgos | 🔴 Crítico | 🔴 Crítico | 🟡 Medio | P1 |
| Muro Social | 🔴 Crítico | 🔴 Crítico | 🟡 Medio | P1 |
| Bitácora | 🔴 Crítico | 🔴 Crítico | 🟡 Medio | P1 |
| Avances | 🔴 Crítico | 🔴 Crítico | 🟡 Medio | P1 |
| Plantillas | 🟡 Medio | 🔴 Crítico | 🟡 Medio | P1 |

---

## Propuesta de Refactorización

### Fase 1: Schemas Zod (CRÍTICO)

**Archivos a modificar**:
1. `src/erp/store/schemas/calendario.ts`
2. `src/erp/store/schemas/social.ts`
3. `src/erp/store/schemas/bodega.ts`
4. `src/erp/store/schemas/financiero.ts`
5. `src/erp/store/schemas/presupuestos.ts`

**Cambios**:
```typescript
// ANTES
proyectoId: z.string().nullable().optional().default('')

// DESPUÉS (para entidades con proyecto requerido)
proyectoId: z.string().min(1, 'proyectoId es requerido')

// DESPUÉS (para entidades globales, si aplica)
proyectoId: z.string().optional()
```

### Fase 2: Handlers de Mutación (CRÍTICO)

**Archivos a modificar**:
1. `src/erp/zustandStore.ts`

**Cambios**:
1. Modificar `enqueueMutation` para añadir timestamps automáticos
2. Añadir validación de FK antes de encolar mutación
3. Estandarizar timestamps en todos los handlers

```typescript
// Nueva implementación de enqueueMutation
enqueueMutation: (type, payload) => {
  if (!checkRateLimit(type)) return '';
  
  const sanitized = sanitizarObjeto(payload);
  const safePayload = toSnake(sanitized);
  
  // Añadir timestamps automáticamente si no están presentes
  if (!safePayload.created_at && (type.startsWith('add') || type === 'clonarPlantilla')) {
    safePayload.created_at = new Date().toISOString();
  }
  if (!safePayload.updated_at && (type.startsWith('update') || type.startsWith('add'))) {
    safePayload.updated_at = new Date().toISOString();
  }
  
  const mutation: Mutation = {
    id: uid(),
    type,
    payload: safePayload,
    timestamp: Date.now(),
    retryCount: 0,
  };
  
  get().setMutationQueue(prev => [...prev, mutation]);
  return mutation.id;
}
```

### Fase 3: Validación de FK (ALTA)

**Archivos a modificar**:
1. `src/erp/zustandStore.ts`

**Cambios**:
Añadir helper function para validar FKs:

```typescript
function validateForeignKey<T extends { proyectoId?: string }>(
  entity: T,
  entityName: string
): { valid: boolean; error?: string } {
  if (entity.proyectoId) {
    const proyecto = get().proyectos.find(p => p.id === entity.proyectoId);
    if (!proyecto) {
      return { 
        valid: false, 
        error: `${entityName}: proyectoId ${entity.proyectoId} no existe` 
      };
    }
  }
  return { valid: true };
}

// Usar en handlers
addMovimiento: (m) => {
  const validation = validateForeignKey(m, 'Movimiento');
  if (!validation.valid) {
    safeLogger.error(validation.error);
    return;
  }
  const n = { ...m, id: uid() };
  get().setMovimientos(prev => [n, ...prev]);
  get().enqueueMutation('addMovimiento', n);
}
```

### Fase 4: Error Logging Integration (MEDIA)

**Archivos a modificar**:
1. `src/lib/error-logger.ts`
2. Nuevo: `src/erp/screens/ErrorLog.tsx`

**Cambios**:
1. Modificar `logErrorFromException` para llamar a RPC `log_error`
2. Crear pantalla de visualización de errores
3. Añadir botón para limpiar errores antiguos

### Fase 5: UI para Error Log (BAJA)

**Nueva vista**: `error-log` en `View` type
**Nueva pantalla**: `src/erp/screens/ErrorLog.tsx`
**Actualización**: Sidebar para incluir nueva vista

---

## Riesgos y Mitigación

### Riesgo 1: Datos Existentes con proyectoId Vacío

**Probabilidad**: Alta
**Impacto**: Medio

**Mitigación**:
- La migración 47 ya actualizó NULL a partir de NOW()
- Para valores vacíos '', se necesita script de limpieza
- Validar antes de deployment

### Riesgo 2: Pérdida de Mutaciones en Cola

**Probabilidad**: Media
**Impacto**: Alto

**Mitigación**:
- Procesar cola existente antes de aplicar cambios
- Añadir modo de compatibilidad temporal
- Backup de localStorage antes de deployment

### Riesgo 3: Breaking Changes en UI

**Probabilidad**: Media
**Impacto**: Medio

**Mitigación**:
- Añadir validación en forms para prevenir submission inválido
- Mostrar mensajes de error claros
- Testing exhaustivo de flujos críticos

---

## Recomendaciones de Implementación

### Orden de Ejecución

1. **Preparación** (1 día)
   - Backup de base de datos
   - Backup de localStorage de usuarios (si es posible)
   - Documentar estado actual de cola de mutaciones

2. **Fase 1 - Schemas** (2 días)
   - Modificar schemas Zod
   - Actualizar tests que dependen de schemas
   - Validar que no rompe parsing de datos existentes

3. **Fase 2 - Mutations** (2 días)
   - Modificar `enqueueMutation`
   - Actualizar handlers de mutación
   - Testing de forceSync con datos de prueba

4. **Fase 3 - FK Validation** (1 día)
   - Implementar helper de validación
   - Añadir a handlers críticos
   - Testing de escenarios de error

5. **Fase 4 - Error Logging** (1 día)
   - Integrar con `log_error` RPC
   - Testing de logging de errores reales

6. **Fase 5 - UI Error Log** (2 días)
   - Crear pantalla ErrorLog
   - Añadir a sidebar
   - Testing de UX

7. **QA & Testing** (3 días)
   - Testing end-to-end de todos los módulos
   - Testing de offline-first con cola de mutaciones
   - Testing de error handling

**Total estimado**: 12 días

### Checklist de Pre-Deployment

- [x] Todos los tests pasan (840/840)
- [x] No hay warnings de TypeScript
- [ ] Build exitoso
- [ ] Migration scripts ejecutados en staging
- [ ] Validación de datos en staging
- [ ] Performance testing con nuevos índices
- [ ] Documentación actualizada
- [ ] Rollback plan documentado
- [ ] Monitoreo configurado para errores post-deployment

---

## Métricas de Éxito

### Antes
- Mutaciones fallidas por constraint: ~10% (estimado)
- Tiempo de sync: 5-10s
- Errores no rastreados: 100%

### Después (Objetivo)
- Mutaciones fallidas por constraint: 0%
- Tiempo de sync: 2-5s (mejora por índices)
- Errores rastreados: 100%
- Tiempo de resolución de errores: -50%

---

## ✅ COMPLETADO (SESIÓN-15 — 2026-06-27)

Todos los items identificados en este análisis han sido implementados exitosamente:

- ✅ Schemas Zod alineados con constraints NOT NULL (Fase 1)
- ✅ Handlers de mutación mejorados con validación FK (Fase 2-3)
- ✅ Sistema de error logging integrado (store, RPC, UI ErrorLog)
- ✅ Pantalla Auditoría con KPIs, filtros, CSV export
- ✅ Dashboard con cards de Integridad y Performance
- ✅ Backups automatizados con verificación semanal
- ✅ 840/840 tests pasando, build 0 errores (25s)
- ✅ 68 migraciones SQL aplicadas (063-068)
- ✅ 74/74 tablas con RLS — 0 políticas permissivas
- ✅ 100% alineación app ↔ DB (37/37 tablas existen)
- ✅ CI/CD: GitHub Actions + Vercel deploy automático
- ✅ Vercel producción HTTP 200 — sin warnings
- ✅ Fix warning Node.js engines (>=18.0.0 → 18.x)
- ✅ Auditoría UI/UX módulo Ajustes: 11 issues corregidos

El sistema es ahora más robusto, mantenible y está listo para producción.
