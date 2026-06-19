# Arquitectura de Sincronización - CONSTRUSMART ERP

## Overview

El sistema CONSTRUSMART ERP implementa un patrón **offline-first** con sincronización opcional a Supabase. La arquitectura de sincronización permite que la aplicación funcione completamente offline mientras mantiene una cola de mutaciones que se sincronizan automáticamente cuando hay conexión.

## Componentes Principales

### 1. ErpProvider (Store Context)

Ubicación: `src/erp/store.tsx`

El `ErpProvider` es el contenedor principal de estado que implementa:

- **Persistencia localStorage**: Cada entidad se guarda automáticamente en localStorage con `saveToStorage()`
- **Carga con validación**: `loadAndValidateFromStorage()` carga datos validados con schemas Zod
- **Mutation Queue**: Cola de mutaciones pendientes de sincronización
- **forceSync**: Mecanismo para enviar mutaciones a Supabase

### 2. Mutation Queue Pattern

La cola de mutaciones (`mutationQueue`) almacena operaciones pendientes:

```typescript
interface QueuedMutation {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  payload: Record<string, unknown>;
  timestamp: number;
}
```

#### Flujo de Mutaciones:

1. **Operación Local**: Cuando el usuario realiza una acción (add/update/delete), se:
   - Actualiza el estado local inmediatamente (optimistic update)
   - Encola la mutación en `mutationQueue` vía `enqueueMutation()`
   - Guarda en localStorage

2. **Intento de Sincronización**: 
   - Si hay conexión, `forceSync()` procesa la cola
   - Si no hay conexión, la mutación permanece en la cola

3. **Reconexión Automática**:
   - El hook `useSupabaseRealtime` detecta reconexión
   - Llama a `forceSync()` automáticamente
   - Procesa todas las mutaciones pendientes

### 3. forceSync

Ubicación: `src/erp/zustandStore.ts`

`forceSync()` es el núcleo de la sincronización:

```typescript
const forceSync = useCallback(async () => {
  const { mutationQueue, isOnline } = get();
  
  if (!isOnline || mutationQueue.length === 0) return;
  
  for (const mutation of mutationQueue) {
    try {
      await syncMutation(mutation);
      removeMutation(mutation.id);
    } catch (error) {
      logger.error(error, 'SYNC_ERROR');
    }
  }
}, []);
```

#### Procesamiento de Mutaciones:

Cada mutación se procesa según su tipo:

- **INSERT**: `supabase.from(table).insert(payload)`
- **UPDATE**: `supabase.from(table).update(payload).eq('id', id)`
- **DELETE**: `supabase.from(table).delete().eq('id', id)`

#### tableMap

El `tableMap` define qué entidades se sincronizan y cómo:

```typescript
const tableMap: Record<string, {
  table: string;
  pk: string;
  transform?: (data: any) => any;
}> = {
  addProyecto: { table: 'erp_proyectos', pk: 'id' },
  updateProyecto: { table: 'erp_proyectos', pk: 'id' },
  deleteProyecto: { table: 'erp_proyectos', pk: 'id' },
};
```

### 4. fetchInitialData

Ubicación: `src/erp/zustandStore.ts`

`fetchInitialData()` carga datos desde Supabase en el primer login:

```typescript
const fetchInitialData = async () => {
  const tables = [
    'erp_proyectos',
    'erp_presupuestos',
    'erp_ordenes_compra',
    'erp_empleados',
    'erp_materiales',
  ];
  
  for (const table of tables) {
    const { data } = await supabase.from(table).select('*');
    setEntity(table, data);
  }
  
  setSyncStatus('synced');
};
```

#### Carga Progresiva:

Las tablas se cargan en orden de prioridad:
- **Críticas**: proyectos, movimientos, presupuestos
- **Secundarias**: empleados, materiales, proveedores
- **Background**: eventos, bitacora, etc.

### 5. Health Check

Ubicación: `src/erp/store.tsx`

`scheduleHealthCheck()` monitorea el estado del store cada 10 minutos:

```typescript
const scheduleHealthCheck = () => {
  setInterval(() => {
    const health = checkStoreHealth(state);
    if (health.issues.length > 0) {
      logger.warn(health, 'STORE_HEALTH');
    }
  }, 10 * 60 * 1000);
};
```

## Flujo de Sincronización

### Flujo Normal (Online)

```
Usuario Acción
    ↓
Actualizar Estado Local (optimistic)
    ↓
enqueueMutation(mutation)
    ↓
forceSync() → Procesar Cola
    ↓
Enviar a Supabase
    ↓
Actualizar Sync Status: synced
```

### Flujo Offline

```
Usuario Acción
    ↓
Actualizar Estado Local (optimistic)
    ↓
enqueueMutation(mutation)
    ↓
isOnline = false → No procesar
    ↓
Guardar en localStorage
    ↓
Sync Status: queued
```

### Flujo de Reconexión

```
Online Detectado (useSupabaseRealtime)
    ↓
forceSync() → Procesar Cola
    ↓
Enviar Mutaciones Pendientes
    ↓
Limpiar mutationQueue
    ↓
Sync Status: synced
```

## Supabase Realtime

El sistema usa Supabase Realtime para mantener datos actualizados en tiempo real:

### Tablas con Realtime

- `erp_publicaciones_muro` - Publicaciones del muro
- `erp_presupuestos` - Presupuestos
- `erp_ordenes_compra` - Órdenes de compra
- `erp_avances` - Avances de obra
- `erp_vales_salida` - Vales de salida
- `erp_cotizaciones_negocio` - Cotizaciones de negocio

### onCambio Callback

El callback `onCambio()` se ejecuta cuando hay cambios en tiempo real:

```typescript
onCambio: (payload) => {
  const { eventType, new: newRecord, old: oldRecord } = payload;
  
  if (eventType === 'INSERT') {
    addEntity(newRecord);
  } else if (eventType === 'UPDATE') {
    updateEntity(newRecord);
  } else if (eventType === 'DELETE') {
    deleteEntity(oldRecord.id);
  }
  
  forceSync();
}
```

## Métodos de Sincronización

### enqueueMutation

```typescript
enqueueMutation: (type: string, table: string, payload: Record<string, unknown>) => void
```

Encola una mutación para sincronización.

**Parámetros:**
- `type`: 'INSERT' | 'UPDATE' | 'DELETE'
- `table`: Nombre de la tabla Supabase
- `payload`: Datos a sincronizar

### forceSync

```typescript
forceSync: () => Promise<void>
```

Procesa todas las mutaciones en la cola y las envía a Supabase.

### fetchInitialData

```typescript
fetchInitialData: (auth?: boolean) => Promise<void>
```

Carga datos iniciales desde Supabase. Se ejecuta en el primer login.

## Estados de Sincronización

El estado `syncStatus` indica el estado actual:

- **'loading'**: Cargando datos desde Supabase
- **'synced'**: Sincronizado con Supabase
- **'queued'**: Hay mutaciones pendientes en la cola
- **'error'**: Error en la sincronización

## Manejo de Errores

### Errores de Conexión

Si no hay conexión Supabase:
- Las mutaciones se mantienen en la cola
- `syncStatus` se pone en 'queued'
- `isOnline` se pone en false
- La aplicación funciona normalmente offline

### Errores de Sincronización

Si una mutación falla al enviar a Supabase:
- La mutación permanece en la cola
- `syncStatus` se pone en 'error'
- `syncError` contiene el mensaje de error
- El usuario puede reintentar manualmente

### Recuperación de Errores

Para recuperar de errores:
1. Verificar conexión a internet
2. Reintentar `forceSync()`
3. Si persiste, borrar la mutación problemática manualmente

## Optimizaciones

### 1. Carga Progresiva

Las tablas se cargan en orden de prioridad para mejorar el tiempo de carga inicial.

### 2. Compresión lz-string

Datos >10KB se comprimen con lz-string antes de guardar en localStorage.

### 3. Sanitización

Todos los payloads se sanitizan con `sanitizarObjeto()` antes de encolar.

### 4. Versioning (Optimistic Locking)

Algunas entidades tienen `version` para detectar conflictos de sincronización.

## Consideraciones de Seguridad

### 1. Sanitización XSS

Todos los inputs se sanitizan para prevenir ataques XSS.

### 2. RLS Policies

Las políticas RLS de Supabase controlan el acceso a datos según el usuario.

### 3. Encriptación

Datos sensibles en localStorage están encriptados con AES-GCM.

## Troubleshooting

### Problema: Sync stuck en 'loading'

**Causa**: `fetchInitialData` no se completó

**Solución**: 
- Verificar conexión a Supabase
- Revisar consola para errores
- Forzar reload de la aplicación

### Problema: Mutaciones no se sincronizan

**Causa**: `forceSync` no se ejecuta o no hay conexión

**Solución**:
- Verificar `isOnline` status
- Revisar `mutationQueue` en localStorage
- Llamar manualmente a `forceSync()`

### Problema: Datos desincronizados

**Causa**: Conflicto entre versiones local y remota

**Solución**:
- Recargar datos desde Supabase con `fetchInitialData(true)`
- Limpiar `mutationQueue` si hay errores
- Verificar RLS policies en Supabase

### Problema: localStorage quota exceeded

**Causa**: Datos comprimidos exceden el límite

**Solución**:
- El sistema limpia automáticamente keys pequeñas
- Verificar `isStorageQuotaCritical()` en utils.ts
- Considerar limpiar datos antiguos manualmente

## Métricas de Sincronización

El sistema de métricas (`src/lib/metrics.ts`) registra:

- Duración de cada sync
- Cantidad de mutaciones procesadas
- Tasa de errores de sincronización
- Tiempo offline total

Estas métricas ayudan a identificar problemas de performance en producción.
