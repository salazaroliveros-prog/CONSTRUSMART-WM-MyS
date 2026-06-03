# 🚀 IMPLEMENTACIÓN RÁPIDA: VINCULACIÓN PROYECTO-PRESUPUESTO

## ⏱️ Tiempo Estimado: 2-3 horas

Este documento contiene el código listo para copiar y pegar, en el orden correcto.

---

## ✅ PASO 1: AMPLIAR TIPOS (5 minutos)

**Archivo: `src/erp/types.ts`**

Agregar al final:

```typescript
// ✅ NEW: Interface de Presupuesto
export interface Presupuesto {
  id: string;
  proyectoId: string;           // FK a Proyecto
  tipologia: Tipologia;
  renglones: RenglonPresupuesto[];
  totalCalculado: number;       // Total con márgenes
  costDirectoTotal: number;     // Sin márgenes
  estado: 'borrador' | 'aprobado' | 'rechazado';
  fechaCreacion: string;
  fechaActualizacion: string;
  notas?: string;
  versionPresupuesto?: number;
}

// ✅ EXTENDER: Agregar campos a Proyecto (descommentar presupuestoActualId si existe)
// export interface Proyecto {
//   ...campos existentes...
//   presupuestoActualId?: string;  // ← Agregar esta línea
// }
```

---

## ✅ PASO 2: EXTENDER STORE (20 minutos)

**Archivo: `src/erp/store.tsx`**

### 2.1: Agregar estado

Buscar donde se declaran los estados (línea ~150-160):

```typescript
// Buscar estos estados existentes:
const [movimientos, setMovimientos] = useState<Movimiento[]>(() => loadFromStorage(STORAGE_KEY + '_movimientos', SEED_MOVIMIENTOS));
const [empleados, setEmpleados] = useState<Empleado[]>(() => loadFromStorage(STORAGE_KEY + '_empleados', SEED_EMPLEADOS));

// ✅ AGREGAR DESPUÉS:
const [presupuestos, setPresupuestos] = useState<Presupuesto[]>(() => loadFromStorage(STORAGE_KEY + '_presupuestos', []));
const [selectedProyectoId, setSelectedProyectoId] = useState<string | null>(null);
```

### 2.2: Agregar al interface ErpState

Buscar `interface ErpState` (línea ~40-100):

```typescript
// Buscar esta sección:
  empleados: Empleado[];
  addEmpleado: (e: Omit<Empleado, 'id'>) => Promise<void>;
  updateEmpleado: (id: string, patch: Partial<Empleado>) => Promise<void>;
  deleteEmpleado: (id: string) => Promise<void>;

// ✅ AGREGAR DESPUÉS:
  presupuestos: Presupuesto[];
  addPresupuesto: (p: Omit<Presupuesto, 'id'>) => Promise<void>;
  updatePresupuesto: (id: string, patch: Partial<Presupuesto>) => Promise<void>;
  deletePresupuesto: (id: string) => Promise<void>;
  getPresupuestoByProyecto: (proyectoId: string) => Presupuesto | undefined;
  
  selectedProyectoId: string | null;
  setSelectedProyectoId: (id: string | null) => void;
```

### 2.3: Agregar métodos en useCallback

Buscar donde se definen los métodos (después de `addEmpleado`, ~línea 350):

```typescript
// Buscar esto:
  const deleteEmpleado = useCallback(async (id: string) => {
    // ... código existente ...
  }, [empleados]);

// ✅ AGREGAR DESPUÉS:
  const addPresupuesto = useCallback(async (p: Omit<Presupuesto, 'id'>) => {
    const newPresupuesto: Presupuesto = {
      ...p,
      id: uid(),
    };
    
    if (isOnline) {
      const { error } = await supabase
        .from('erp_presupuestos')
        .insert([newPresupuesto]);
      if (error) { console.error('Error:', error); return; }
    }
    
    setPresupuestos(s => [...s, newPresupuesto]);
    
    // ✅ Automáticamente actualizar proyecto
    try {
      await updateProyecto(p.proyectoId, {
        presupuestoActualId: newPresupuesto.id,
        presupuestoTotal: newPresupuesto.totalCalculado,
      });
    } catch (err) {
      console.error('Error actualizando proyecto:', err);
    }
    
    saveToStorage(STORAGE_KEY + '_presupuestos', presupuestos);
  }, [presupuestos, updateProyecto, isOnline]);

  const updatePresupuesto = useCallback(async (id: string, patch: Partial<Presupuesto>) => {
    const updated = presupuestos.map(p => p.id === id ? { ...p, ...patch, fechaActualizacion: new Date().toISOString() } : p);
    
    if (isOnline) {
      const { error } = await supabase
        .from('erp_presupuestos')
        .update(patch)
        .eq('id', id);
      if (error) { console.error('Error:', error); return; }
    }
    
    setPresupuestos(updated);
    saveToStorage(STORAGE_KEY + '_presupuestos', updated);
  }, [presupuestos, isOnline]);

  const deletePresupuesto = useCallback(async (id: string) => {
    if (isOnline) {
      const { error } = await supabase
        .from('erp_presupuestos')
        .delete()
        .eq('id', id);
      if (error) { console.error('Error:', error); return; }
    }
    
    setPresupuestos(s => s.filter(p => p.id !== id));
    saveToStorage(STORAGE_KEY + '_presupuestos', presupuestos);
  }, [presupuestos, isOnline]);

  const getPresupuestoByProyecto = useCallback((proyectoId: string) => {
    return presupuestos.find(p => p.proyectoId === proyectoId);
  }, [presupuestos]);
```

### 2.4: Agregar al fetchInitialData

Buscar la función `fetchInitialData` (línea ~200-250):

```typescript
// Buscar:
  const fetchInitialData = useCallback(async () => {
    try {
      const [
        { data: p }, { data: m }, { data: e }, { data: mat }, { data: o }, { data: prov }, { data: evt }, { data: bit }
      ] = await Promise.all([

// ✅ REEMPLAZAR con:
  const fetchInitialData = useCallback(async () => {
    try {
      const [
        { data: p }, { data: m }, { data: e }, { data: mat }, { data: o }, { data: prov }, { data: evt }, { data: bit }, { data: presup }
      ] = await Promise.all([
        supabase.from('erp_proyectos').select('*'),
        supabase.from('erp_movimientos').select('*').order('fecha', { ascending: false }),
        supabase.from('erp_empleados').select('*'),
        supabase.from('erp_materiales').select('*'),
        supabase.from('erp_ordenes_compra').select('*').order('created_at', { ascending: false }),
        supabase.from('erp_proveedores').select('*'),
        supabase.from('erp_eventos_calendario').select('*'),
        supabase.from('erp_bitacora').select('*').order('fecha', { ascending: false }),
        supabase.from('erp_presupuestos').select('*'),  // ← NEW
      ]);

      // ... código existente de mapFromSnakeCase ...
      
      // Al final, agregar:
      if (presup) setPresupuestos(presup.map(mapFromSnakeCase));
```

### 2.5: Agregar al return del Provider

Buscar donde retorna el value del contexto (final del ErpProvider):

```typescript
// Buscar:
      bitacora,
      addBitacora,
      updateBitacora,
      deleteBitacora,
    }}>

// ✅ AGREGAR ANTES del cierre:
      presupuestos,
      addPresupuesto,
      updatePresupuesto,
      deletePresupuesto,
      getPresupuestoByProyecto,
      selectedProyectoId,
      setSelectedProyectoId,
    }}>
```

---

## ✅ PASO 3: CREAR TABLA SUPABASE (10 minutos)

**Supabase SQL Console:**

```sql
-- Crear tabla erp_presupuestos
CREATE TABLE IF NOT EXISTS erp_presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  tipologia TEXT NOT NULL CHECK (tipologia IN ('residencial', 'comercial', 'industrial', 'civil', 'publica')),
  renglones JSONB NOT NULL DEFAULT '[]',
  total_calculado DECIMAL(12, 2) DEFAULT 0,
  costo_directo_total DECIMAL(12, 2) DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'aprobado', 'rechazado')),
  notas TEXT,
  version_presupuesto INT NOT NULL DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT now(),
  fecha_actualizacion TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(proyecto_id, version_presupuesto)
);

-- Crear índices
CREATE INDEX idx_erp_presupuestos_proyecto ON erp_presupuestos(proyecto_id);
CREATE INDEX idx_erp_presupuestos_estado ON erp_presupuestos(estado);

-- Crear trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_erp_presupuestos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_erp_presupuestos_timestamp
BEFORE UPDATE ON erp_presupuestos
FOR EACH ROW
EXECUTE FUNCTION update_erp_presupuestos_timestamp();

-- Agregar columna a erp_proyectos (si no existe)
ALTER TABLE erp_proyectos ADD COLUMN IF NOT EXISTS presupuesto_actual_id UUID;
```

---

## ✅ PASO 4: ACTUALIZAR COMPONENTE PROYECTOS (15 minutos)

**Archivo: `src/erp/screens/Proyectos.tsx`**

Buscar el render del table body. Reemplazar la sección de renglones de proyectos:

```typescript
// Buscar el map donde renderiza proyectos. Ejemplo:
// {proyectos.map(p => (
//   <div key={p.id}>...

// ✅ ACTUALIZAR para agregar botones de acción:

// Primero, agregar imports:
import { Plus, MapPin, Trash2, X, Building2, Pencil, Calculator, BarChart3 } from 'lucide-react';

// En el componente, después de deleteProyecto, agregar:
const handlePresupuestar = (proyectoId: string) => {
  setSelectedProyectoId(proyectoId);
  setView('presupuestos');
};

// En el render, buscar la sección de botones de proyecto y agregar:
<button 
  onClick={() => handlePresupuestar(p.id)}
  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded text-xs flex items-center gap-1"
  title="Presupuestar proyecto"
>
  <Calculator className="w-4 h-4" /> Presupuesto
</button>
```

---

## ✅ PASO 5: ACTUALIZAR COMPONENTE PRESUPUESTOS (25 minutos)

**Archivo: `src/erp/screens/Presupuestos.tsx`**

### 5.1: Actualizar imports y estado

```typescript
// Buscar los imports:
import React, { useMemo, useState } from 'react';

// ✅ REEMPLAZAR con:
import React, { useMemo, useState, useEffect } from 'react';

// Buscar:
const Presupuestos: React.FC = () => {
  useErp();
  const [tipologia, setTipologia] = useState<Tipologia>('residencial');
  const [proyecto, setProyecto] = useState('Nuevo Presupuesto');
  const [items, setItems] = useState<RenglonPresupuesto[]>([]);
  const [sel, setSel] = useState('');
  const [saved, setSaved] = useState(false);

// ✅ REEMPLAZAR con:
const Presupuestos: React.FC = () => {
  const { 
    proyectos, 
    presupuestos, 
    selectedProyectoId, 
    addPresupuesto, 
    updatePresupuesto,
    getPresupuestoByProyecto 
  } = useErp();
  
  const [tipologia, setTipologia] = useState<Tipologia>('residencial');
  const [proyecto, setProyecto] = useState('Nuevo Presupuesto');
  const [items, setItems] = useState<RenglonPresupuesto[]>([]);
  const [sel, setSel] = useState('');
  const [saved, setSaved] = useState(false);
  const [presupuestoId, setPresupuestoId] = useState<string | null>(null);
```

### 5.2: Agregar useEffect

```typescript
// Después de la declaración de estados, agregar:

  // ✅ NEW: Cargar datos del proyecto seleccionado
  useEffect(() => {
    if (selectedProyectoId) {
      const selectedProyecto = proyectos.find(p => p.id === selectedProyectoId);
      if (selectedProyecto) {
        // Precargar tipología
        setTipologia(selectedProyecto.tipologia);
        setProyecto(selectedProyecto.nombre);
        
        // Buscar presupuesto existente
        const existingPresupuesto = presupuestos.find(
          p => p.proyectoId === selectedProyectoId && p.estado === 'borrador'
        );
        
        if (existingPresupuesto) {
          setItems(existingPresupuesto.renglones);
          setPresupuestoId(existingPresupuesto.id);
        } else {
          setItems([]);
          setPresupuestoId(null);
        }
      }
    }
  }, [selectedProyectoId, proyectos, presupuestos]);
```

### 5.3: Actualizar función save()

```typescript
// Buscar:
  const save = () => { 
    try { 
      localStorage.setItem('wm_presupuesto_' + proyecto, JSON.stringify(items)); 
    } catch { /* ignore */ } 
    setSaved(true); 
    setTimeout(() => setSaved(false), 1500); 
  };

// ✅ REEMPLAZAR con:
  const save = async () => { 
    if (!selectedProyectoId) {
      toast.error('Debe seleccionar un proyecto');
      return;
    }

    const granTotal = items.reduce((a, r) => a + calc(r).total, 0);

    const presupuestoData: Omit<Presupuesto, 'id'> = {
      proyectoId: selectedProyectoId,
      tipologia,
      renglones: items,
      totalCalculado: granTotal,
      costDirectoTotal: granDir,
      estado: 'borrador',
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    };

    try {
      if (presupuestoId) {
        await updatePresupuesto(presupuestoId, presupuestoData);
        toast.success('Presupuesto actualizado');
      } else {
        await addPresupuesto(presupuestoData);
        toast.success('Presupuesto guardado');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      toast.error('Error al guardar presupuesto');
      console.error(err);
    }
  };
```

### 5.4: Agregar indicador visual de proyecto vinculado

En el return (donde renderiza), buscar la sección inicial y agregar:

```typescript
  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      {/* ← NEW: Mostrar proyecto vinculado */}
      {selectedProyectoId && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <span className="text-blue-700 text-sm">
            <strong>📌 Proyecto:</strong> {proyecto}
          </span>
          <span className="text-blue-500 text-xs">(Presupuesto vinculado)</span>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        {/* ... resto del código existente ... */}
```

---

## ✅ PASO 6: REGENERAR TIPOS (5 minutos)

En terminal:

```bash
# Regenerar tipos de TypeScript desde Supabase
supabase gen types typescript --local > src/types/supabase.ts
```

---

## ✅ PASO 7: PRUEBAS (10 minutos) — ✅ COMPLETADO

Verificar en la app:

- [x] Navega a Proyectos
- [x] Ve `PresupuestoCard` en cada tarjeta de proyecto con opciones Ver/Editar
- [x] Hace click en "Ver Presupuesto"
- [x] Navega automáticamente a Presupuestos
- [x] Presupuestos precarga:
  - [x] Tipología del proyecto (selector `<select>` con opción)
  - [x] Nombre del proyecto (en selector de proyectos)
  - [x] Renglones anteriores (vía `editingPresupuesto` al editar)
- [x] Agrega renglones
- [x] Calcula
- [x] Hace click en [Guardar]
- [x] Ve mensaje toast de confirmación
- [x] Presupuesto guardado en Supabase + localStorage
- [x] Proyecto actualizado automáticamente con nuevo `presupuestoTotal`
- [x] Múltiples versiones de presupuesto por proyecto
- [x] Exportación PDF/CSV con desglose de materiales

---

## 📋 ERRORES COMUNES

| Error | Causa | Solución |
|-------|-------|----------|
| `presupuestos is undefined` | No agregaste estado en store | Verificar paso 2.1 |
| `setSelectedProyectoId not found` | No está en el contexto | Verificar paso 2.5 |
| `Presupuesto[] is not assignable` | Falta interface `Presupuesto` | Verificar paso 1 |
| Proyecto no actualiza presupuesto | No se ejecutó `updateProyecto` en `addPresupuesto` | Verificar paso 2.3 |
| localStorage todavía se usa | No reemplazaste la función `save()` | Verificar paso 5.3 |
| Supabase error 404 | Tabla no existe | Ejecutar paso 3 SQL |

---

## 🎯 PRÓXIMOS PASOS OPCIONALES

Después de tener esto funcionando:

1. **Modal de Historial**: Botón [📋 Historial] para ver versiones anteriores
2. **Aprobación de Presupuestos**: Cambiar estado a 'aprobado'
3. **Comparación**: Ver diferencias entre versiones
4. **Exportación Mejorada**: Exportar con vínculo a proyecto
5. **Notificaciones**: Alertar cuando presupuesto cambia significativamente

---

**Tiempo total:** 2-3 horas
**Dificultad:** Media
**Riesgo:** Bajo (cambios localizados)

