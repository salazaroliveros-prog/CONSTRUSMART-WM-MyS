# API Documentation - CONSTRUSMART ERP

## Overview

Esta guía documenta la API del store CONSTRUSMART ERP para desarrolladores que deseen extender o integrar el sistema.

## ErpStore API

### Hook Principal

```typescript
import { useErp } from '@/erp/store';

const {
  proyectos,
  setProyectos,
  addProyecto,
  updateProyecto,
  deleteProyecto,
  selectedProyectoId,
  setSelectedProyectoId,
} = useErp();
```

### Estado Global

#### Entidades Disponibles

- `proyectos: Proyecto[]`
- `movimientos: Movimiento[]`
- `empleados: Empleado[]`
- `materiales: Material[]`
- `ordenes: OrdenCompra[]`
- `proveedores: Proveedor[]`
- `eventos: Evento[]`
- `bitacora: Bitacora[]`
- `presupuestos: Presupuesto[]`
- `cotizacionesNegocio: CotizacionNegocio[]`
- `avances: Avance[]`
- `valesSalida: ValeSalida[]`
- `seguimientoEVM: SeguimientoEVM[]`
- `cuentasCobrar: CuentaCobrar[]`
- `cuentasPagar: CuentaPagar[]`
- `ordenesCambio: OrdenCambio[]`
- `hitos: Hito[]`
- `riesgos: Riesgo[]`
- `incidentes: Incidente[]`
- `publicacionesMuro: PublicacionMuro[]`
- `pruebas: Prueba[]`
- `noConformidades: NoConformidad[]`
- `liberaciones: Liberacion[]`
- `planos: Plano[]`
- `rfis: Rfi[]`
- `submittals: Submittal[]`
- `activos: Activo[]`
- `cuadros: Cuadro[]`
- `pagosProveedor: PagoProveedor[]`
- `notificaciones: Notificacion[]`

#### Estado de Usuario

- `user: User | null`
- `isOnline: boolean`
- `syncStatus: 'loading' | 'synced' | 'queued' | 'error'`
- `syncError: string | null`
- `mutationQueue: QueuedMutation[]`
- `lastSyncedAt: string | null`

#### Estado de Aplicación

- `view: View`
- `selectedProyectoId: string | null`
- `settings: AppSettings`

## Operaciones CRUD

### Patrón General

Cada entidad sigue el mismo patrón de operaciones:

```typescript
const {
  // Lectura
  proyectos,
  
  // Escritura
  setProyectos,
  addProyecto,
  updateProyecto,
  deleteProyecto,
} = useErp();
```

### addEntity

Agrega una nueva entidad al store y encola para sincronización.

```typescript
const addProyecto: (data: Proyecto) => void;

addProyecto({
  id: generateId(),
  nombre: 'Nuevo Proyecto',
  cliente: 'Cliente X',
  tipologia: 'residencial',
  presupuestoActualId: null,
  presupuestoTotal: 0,
  estado: 'planeacion',
  etapa: 'preconstruccion',
  avance: 0,
  fechaInicio: new Date().toISOString(),
  fechaFin: new Date().toISOString(),
  created_at: new Date().toISOString(),
});
```

**Comportamiento:**
- Actualiza estado local inmediatamente (optimistic update)
- Encola mutación en `mutationQueue`
- Guarda en localStorage
- Intenta sincronizar con Supabase si hay conexión

### updateEntity

Actualiza una entidad existente.

```typescript
const updateProyecto: (id: string, patch: Partial<Proyecto>) => void;

updateProyecto('proyecto-123', {
  estado: 'ejecucion',
  etapa: 'construccion',
});
```

**Comportamiento:**
- Actualiza estado local inmediatamente
- Encola mutación UPDATE
- Si la entidad tiene `version`, la incrementa (optimistic locking)
- Guarda en localStorage

### deleteEntity

Elimina una entidad del store.

```typescript
const deleteProyecto: (id: string) => void;

deleteProyecto('proyecto-123');
```

**Comportamiento:**
- Elimina del estado local
- Encola mutación DELETE
- Guarda en localStorage

### setEntity

Reemplaza toda la entidad (usado por carga inicial).

```typescript
const setProyectos: (data: Proyecto[]) => void;

setProyectos([
  { id: '1', nombre: 'Proyecto 1' },
  { id: '2', nombre: 'Proyecto 2' },
]);
```

**Comportamiento:**
- Reemplaza estado completo
- No encola mutación (usado por carga inicial)
- Guarda en localStorage

## Sincronización

### forceSync

Procesa todas las mutaciones pendientes.

```typescript
const forceSync: () => Promise<void>;

await forceSync();
```

**Comportamiento:**
- Itera sobre `mutationQueue`
- Envía cada mutación a Supabase
- Remueve mutaciones exitosas
- Actualiza `syncStatus`

### fetchInitialData

Carga datos iniciales desde Supabase.

```typescript
const fetchInitialData: (auth?: boolean) => Promise<void>;

await fetchInitialData(true);
```

**Parámetros:**
- `auth`: Si es true, refuerza autenticación antes de cargar

**Comportamiento:**
- Carga tablas en orden de prioridad
- Valida datos con schemas Zod
- Actualiza estado local
- Actualiza `syncStatus` a 'synced'

## Notificaciones

### addNotificacion

Agrega una notificación al sistema.

```typescript
const addNotificacion: (
  tipo: string,
  titulo: string,
  mensaje: string,
  proyectoId?: string | null,
  referenciaId?: string
) => void;

addNotificacion('alerta', 'Stock Crítico', 'Material sin stock', 'proyecto-123', 'material-456');
```

**Tipos de notificación:**
- `general`: Notificaciones generales
- `alerta`: Alertas importantes
- `exito`: Confirmaciones de éxito
- `error`: Errores del sistema

## Validación

### Schemas Zod

Todas las entidades tienen schemas Zod canónicos en `src/erp/store/schemas/`:

```typescript
import { proyectoSchema } from '@/erp/store/schemas/proyectos';

const validated = proyectoSchema.parse(data);
```

**Schemas disponibles:**
- `proyectoSchema`
- `presupuestoSchema`
- `materialSchema`
- `empleadoSchema`
- `ordenSchema`
- `proveedorSchema`
- etc.

### Validación en Operaciones

Las operaciones CRUD validan automáticamente con Zod:

```typescript
addProyecto(data); 
```

Si `data` no pasa validación:
- Se lanza error Zod
- La operación no se ejecuta
- El error se reporta al sistema

## Utils

### fmtQ

Formatea cantidades monetarias.

```typescript
import { fmtQ } from '@/erp/utils';

fmtQ(1234.56); // "Q1,234.56"
```

### generateId

Genera IDs únicos.

```typescript
import { generateId } from '@/erp/utils';

const id = generateId(); // "abc123xyz456"
```

### sanitizarObjeto

Sanitiza objetos para prevenir XSS.

```typescript
import { sanitizarObjeto } from '@/erp/lib/security';

const clean = sanitizarObjeto(dirtyObject);
```

## Auth

### useAuth

Hook para autenticación.

```typescript
import { useAuth } from '@/hooks/useAuth';

const { user, login, logout, signInWithGoogle, error } = useAuth();

// Login con email/password
await login('user@example.com', 'password');

// Login con Google
await signInWithGoogle();

// Logout
await logout();
```

## Supabase Client

### Supabase Instance

Acceso directo al cliente Supabase.

```typescript
import { supabase } from '@/lib/supabase';

const { data } = await supabase.from('erp_proyectos').select('*');
```

### Realtime

Suscripción a cambios en tiempo real.

```typescript
import { supabase } from '@/lib/subabase';

const channel = supabase
  .channel('proyectos')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'erp_proyectos',
  }, (payload) => {
    console.log('Cambio:', payload);
  })
  .subscribe();
```

## Storage

### Carga desde localStorage

```typescript
const loaded = loadFromStorage<Proyecto[]>('erp_proyectos');
```

### Guardar en localStorage

```typescript
saveToStorage('erp_proyectos', proyectos);
```

### Carga con validación

```typescript
const loaded = loadFromStorage<Proyecto[]>('erp_proyectos', proyectoSchema.array());
```

## Métricas

### Sistema de Métricas

Registro de métricas de operación.

```typescript
import { metrics } from '@/lib/metrics';

metrics.recordSync(1000, true, 10);
metrics.recordRender('Dashboard', 500);
metrics.recordError('sync', 'warning');
```

### Consultar Métricas

```typescript
const metrics = JSON.parse(localStorage.getItem('erp_metrics') || '[]');
```

## Exportación

### PDF Export

Exportación a PDF usando jsPDF + html2canvas.

```typescript
import { exportToPDF } from '@/lib/export';

await exportToPDF(element, 'nombre-archivo');
```

### Excel Export

Exportación a Excel usando xlsx.

```typescript
import { exportToExcel } from '@/lib/export';

await exportToExcel(data, 'nombre-archivo');
```

## Navegación

### useNavigation

Hook para navegación de vistas.

```typescript
import { useErp } from '@/erp/store';

const { setView, view } = useErp();

setView('dashboard');
setView('presupuestos');
```

### Vistas Disponibles

```typescript
type View =
  | 'dashboard'
  | 'proyectos'
  | 'presupuestos'
  | 'financiero'
  | 'rrhh'
  | 'bodega'
  | 'seguimiento'
  | 'crm'
  | 'logistica'
  | 'rendimiento-campo'
  | 'comercial'
  | 'administracion'
  | 'gantt'
  | 'apu'
  | 'visor-bim'
  | 'hitos'
  | 'riesgos'
  | 'sso-calidad'
  | 'muro'
  | 'ajustes'
  | 'cotizaciones';
```

## Filtros

### ProyectoFilter

Filtro global por proyecto.

```typescript
import { ProyectoFilter } from '@/erp/components/ProyectoFilter';

<ProyectoFilter />
```

**Uso:**
- Selecciona proyecto activo
- Filtra datos en todas las vistas
- Actualiza `selectedProyectoId` en store

## Error Handling

### Error Reporting

Sistema automático de reporte de errores.

```typescript
import { reportError } from '@/lib/errorReporting';

reportError(error, 'OPERATION', context);
```

### try/catch Pattern

Las operaciones pueden fallar:

```typescript
try {
  addProyecto(data);
} catch (error) {
  reportError(error, 'ADD_PROYECTO', data);
}
```

## Ejemplos Completos

### Crear Proyecto

```typescript
import { useErp } from '@/erp/store';

function CreateProyecto() {
  const { addProyecto } = useErp();
  
  const handleCreate = () => {
    addProyecto({
      id: generateId(),
      nombre: 'Nuevo Proyecto',
      cliente: 'Cliente X',
      tipologia: 'residencial',
      presupuestoActualId: null,
      presupuestoTotal: 0,
      estado: 'planeacion',
      etapa: 'preconstruccion',
      avance: 0,
      fechaInicio: new Date().toISOString(),
      fechaFin: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
  };
  
  return <button onClick={handleCreate}>Crear Proyecto</button>;
}
```

### Actualizar Proyecto

```typescript
import { useErp } from '@/erp/store';

function UpdateProyecto({ id }: { id: string }) {
  const { updateProyecto } = useErp();
  
  const handleUpdate = () => {
    updateProyecto(id, {
      estado: 'ejecucion',
      etapa: 'construccion',
    });
  };
  
  return <button onClick={handleUpdate}>Iniciar Ejecución</button>;
}
```

### Sincronizar Manualmente

```typescript
import { useErp } from '@/erp/store';

function SyncButton() {
  const { forceSync, syncStatus } = useErp();
  
  const handleSync = async () => {
    await forceSync();
  };
  
  return (
    <button 
      onClick={handleSync}
      disabled={syncStatus === 'loading'}
    >
      Sincronizar
    </button>
  );
}
```

### Suscribir a Cambios Realtime

```typescript
import { useErp } from '@/erp/store';
import { supabase } from '@/lib/supabase';

function ProyectoRealtime() {
  const { setProyectos } = useErp();
  
  useEffect(() => {
    const channel = supabase
      .channel('proyectos')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'erp_proyectos',
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProyectos(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setProyectos(prev => prev.map(p => 
            p.id === payload.new.id ? payload.new : p
          ));
        } else if (payload.eventType === 'DELETE') {
          setProyectos(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();
      
    return () => channel.unsubscribe();
  }, []);
  
  return null;
}
```

## Best Practices

1. **Siempre usar hooks del store** para operaciones CRUD
2. **Validar datos con Zod** antes de operaciones personalizadas
3. **Usar try/catch** para operaciones que pueden fallar
4. **Reportar errores** automáticamente con errorReporting
5. **Considerar modo offline** al diseñar features
6. **Usar generateId()** para IDs consistentes
7. **Sanitizar inputs** de usuario con sanitizarObjeto
8. **Usar optimistic updates** para mejor UX
9. **Implementar cleanup** en useEffect
10. **Mantener schemas sincronizados** con Supabase

## Tipos TypeScript

### Proyecto

```typescript
interface Proyecto {
  id: string;
  nombre: string;
  cliente: string;
  tipologia: string;
  presupuestoActualId: string | null;
  presupuestoTotal: number;
  estado: 'planeacion' | 'ejecucion' | 'pausado' | 'finalizado';
  etapa: 'preconstruccion' | 'construccion' | 'postconstruccion';
  avance: number;
  fechaInicio: string;
  fechaFin: string;
  motivoPausa?: string;
  pausadoPor?: string;
  fechaPausa?: string;
  fechaReanudacionEstimada?: string;
  version?: number;
  created_at: string;
}
```

### Presupuesto

```typescript
interface Presupuesto {
  id: string;
  proyectoId: string;
  tipologia: string;
  renglones: Renglon[];
  totalCalculado: number;
  estado: 'borrador' | 'aprobado' | 'rechazado';
  versionPresupuesto: number;
  notas?: string;
  created_at: string;
}
```

Para tipos completos, ver `src/erp/types.ts`.

---

## ✅ Acta de Cierre

**Verificación**: 2026-06-19 — Documento verificado y corregido (`loadAndValidateFromStorage` → `loadFromStorage`).
**Estado**: ✅ Cerrado — Documento funcional y preciso
