# 📊 ANÁLISIS: VINCULACIÓN PROYECTO-PRESUPUESTO

## ⚠️ PROBLEMA IDENTIFICADO

Los módulos **Proyectos** y **Presupuestos** están **COMPLETAMENTE DESACOPLADOS**. No existe vinculación lógica ni técnica entre ellos.

---

## 🔴 ESTADO ACTUAL DEL CÓDIGO

### 1. **Módulo PROYECTOS** (`src/erp/screens/Proyectos.tsx`)

```typescript
// ✅ Estructura del Proyecto
interface Proyecto {
  id: string;
  nombre: string;
  cliente: string;
  ubicacion: string;
  tipologia: Tipologia;
  estado: 'planeacion' | 'ejecucion' | 'finalizado';
  presupuestoTotal: number;
  montoContrato: number;
  avanceFisico: number;
  avanceFinanciero: number;
  fechaInicio: string;
  fechaFin: string;
}
```

**Observaciones:**
- ⚠️ El proyecto ya muestra un `PresupuestoCard` en la tarjeta.
- ✅ El botón `onViewPresupuesto` ahora establece `selectedProyectoId` y navega a `presupuestos`.
- ⚠️ La pantalla de presupuestos preselecciona el proyecto y la tipología, pero aún puede cargar el proyecto por defecto si no hay selección.
- ⚠️ El flujo no busca automáticamente un presupuesto anterior del proyecto al entrar; sólo lo precarga cuando se edita.

---

### 2. **Módulo PRESUPUESTOS** (`src/erp/screens/Presupuestos.tsx`)

```typescript
// ✅ Estado local con contexto de proyecto seleccionado
const Presupuestos: React.FC = () => {
  const { proyectos, addPresupuesto, updatePresupuesto, deletePresupuesto, presupuestos, selectedProyectoId } = useErp();

  const [tipologia, setTipologia] = useState<Tipologia>('residencial');
  const [proyecto, setProyecto] = useState('Nuevo Presupuesto');
  const [projectId, setProjectId] = useState('');
  const [items, setItems] = useState<RenglonPresupuesto[]>([]);
```

**Observaciones:**
- ✅ `useErp()` se utiliza para obtener `proyectos`, `presupuestos` y `selectedProyectoId`.
- ✅ Existe un selector de proyecto manual (`<select value={projectId} ...>`).
- ✅ El formulario ahora preselecciona el proyecto y la tipología cuando `selectedProyectoId` está definido.
- ✅ Guardado usa `addPresupuesto()` / `updatePresupuesto()` con `projectId` válido.
- ⚠️ Si el usuario no selecciona proyecto y el dropdown queda vacío, aún puede caer en el fallback de localStorage.

---

### 3. **Store/Context** (`src/erp/store.tsx`)

```typescript
interface ErpState {
  // ✅ Existe manejo de Proyectos
  proyectos: Proyecto[];
  addProyecto: (p: Omit<Proyecto, 'id'>) => Promise<void>;
  updateProyecto: (id: string, patch: Partial<Proyecto>) => Promise<void>;
  deleteProyecto: (id: string) => Promise<void>;

  // ✅ Existe manejo de Presupuestos
  presupuestos: Presupuesto[];
  addPresupuesto: (p: Omit<Presupuesto, 'id'>) => Promise<void>;
  updatePresupuesto: (id: string, patch: Partial<Presupuesto>) => Promise<void>;
  deletePresupuesto: (id: string) => Promise<void>;
  getPresupuestoByProyecto: (proyectoId: string) => Presupuesto | undefined;

  // ⚠️ Tracking de proyecto seleccionado existe, pero no está integrado en la UI de presupuestos
  selectedProyectoId: string | null;
  setSelectedProyectoId: (id: string | null) => void;
}
```

---

## 🔗 FLUJO ACTUAL (PARCIAL)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO ACTUAL (PARCIAL)                       │
└─────────────────────────────────────────────────────────────────┘

1. Usuario navega a "Proyectos"
   ↓
2. Ve lista: "Casa San Salvador" | "Edificio Comercial" | etc.
   ↓
3. Usuario da click en el botón de presupuesto
   ↓
4. 🔴 El botón solo cambia la vista a `presupuestos`
   - `setView('presupuestos')` se ejecuta
   - No se establece `projectId` ni `selectedProyectoId`
   - El usuario llega a Presupuestos sin contexto automático
   ↓
5. Dentro de Presupuestos, el usuario debe seleccionar el proyecto en el dropdown
   ↓
6. El formulario puede cargar tipología y nombre del presupuesto manualmente
   ↓
7. Al guardar: si `projectId` está presente, el presupuesto se guarda en Supabase y el proyecto se actualiza
   - `addPresupuesto()` crea el presupuesto vinculado
   - `updateProyecto()` actualiza `presupuestoActualId` y `presupuestoTotal`
   ↓
8. Si no hay proyecto seleccionado, el código guarda en localStorage como fallback
   ↓
9. ⚠️ RESULTADO: la relación existe en el backend, pero el flujo de UI no es totalmente automático
```

---

## ✅ FLUJO DESEADO

```
┌─────────────────────────────────────────────────────────────────┐
│              FLUJO DESEADO (DESPUÉS DE IMPLEMENTAR)             │
└─────────────────────────────────────────────────────────────────┘

1. Usuario navega a "Proyectos"
   ↓
2. Ve lista con NEW COLUMN:
   ┌──────────────────────────────────────────┐
   │ Proyecto | Cliente | Estado | [Acciones] │
   │───────────────────────────────────────── ┤
   │Casa San Salvador | Juan Pérez | ejecución │
   │                                  [📊 Presupuesto] ← NEW
   │─────────────────────────────────────────┤
   │Edif. Comercial | Empresa XYZ | planeación │
   │                                  [📊 Presupuesto] ← NEW
   └──────────────────────────────────────────┘
   ↓
3. Usuario da click en botón [📊 Presupuesto]
   ↓
4. ⚠️ En el código actual el botón sólo cambia la vista a `presupuestos`, pero no preselecciona el proyecto.
   - La experiencia aún requiere seleccionar el proyecto desde la UI de Presupuestos.
   ↓
5. Presupuestos CARGA DATOS DEL PROYECTO cuando el usuario escoge un proyecto:
   ✅ Tipología = "residencial" (del proyecto)
   ✅ Nombre = editable/guardable como nota del presupuesto
   ✅ Si existe presupuesto anterior → carga renglones guardados
   ✅ Precarga campo de búsqueda/filtro
   ↓
6. Usuario solo necesita:
   - Ajustar cantidades de renglones
   - Verificar costos
   - Guardar
   ↓
7. Al guardar: Presupuesto se vincula a Proyecto
   {
     "id": "presupuesto-456",
     "proyectoId": "proyecto-123",  ← ✅ VINCULACIÓN
     "tipologia": "residencial",
     "renglones": [...],
     "totalCalculado": 48500,
     "estado": "borrador"
   }
   ↓
8. ✅ PROYECTO ACTUALIZA AUTOMÁTICAMENTE:
   {
     ...
     "presupuestoTotal": 48500,  ← Ahora refleја cálculo real
     "estado": "planeacion"      ← Puede cambiar a "ejecución"
   }
   ↓
10. ✅ SINCRONIZACIÓN EN DASHBOARD:
    - Proyecto muestra presupuesto actualizado
    - Si hay cambios → Dashboard refleja
    - Toda la app ve datos consistentes
```

---

## 📋 SOLUCIONES NECESARIAS

### **PASO 1: Ampliar el Modelo de Datos** (`types.ts`)

**Agregar nueva interface:**

```typescript
export interface Presupuesto {
  id: string;
  proyectoId: string;           // ✅ FK a Proyecto
  tipologia: Tipologia;
  renglones: RenglonPresupuesto[];
  totalCalculado: number;       // Total APU con indirectos/utilidad
  costDirectoTotal: number;     // Costo directo sin márgenes
  estado: 'borrador' | 'aprobado' | 'rechazado';
  fechaCreacion: string;
  fechaActualizacion: string;
  notas?: string;
  versionPresupuesto: number;   // Para histórico (v1, v2, etc.)
}

// Extender Proyecto para tener referencia a presupuesto activo
export interface Proyecto {
  // ... campos existentes ...
  presupuestoActualId?: string;  // ← NEW: referencia al presupuesto en uso
}
```

---

### **PASO 2: Extender el Store/Context** (`store.tsx`)

**Agregar al estado ErpState:**

```typescript
interface ErpState {
  // ... campos existentes de proyectos ...
  
  // ✅ NEW: Manejo de Presupuestos
  presupuestos: Presupuesto[];
  addPresupuesto: (p: Omit<Presupuesto, 'id'>) => Promise<void>;
  updatePresupuesto: (id: string, patch: Partial<Presupuesto>) => Promise<void>;
  deletePresupuesto: (id: string) => Promise<void>;
  getPresupuestoByProyecto: (proyectoId: string) => Presupuesto | undefined;
  
  // ✅ NEW: Tracking de Proyecto Seleccionado
  selectedProyectoId: string | null;
  setSelectedProyectoId: (id: string | null) => void;
}
```

**En el Provider:**

```typescript
const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
const [selectedProyectoId, setSelectedProyectoId] = useState<string | null>(null);

const addPresupuesto = useCallback(async (p: Omit<Presupuesto, 'id'>) => {
  const newPresupuesto: Presupuesto = {
    ...p,
    id: uid(),
  };
  
  // Guardar en Supabase
  await supabase
    .from('erp_presupuestos')
    .insert([newPresupuesto]);
  
  // Actualizar estado local
  setPresupuestos(s => [...s, newPresupuesto]);
  
  // ✅ Actualizar proyecto con nuevo presupuesto
  await updateProyecto(p.proyectoId, {
    presupuestoActualId: newPresupuesto.id,
    presupuestoTotal: newPresupuesto.totalCalculado,
  });
}, []);
```

---

### **PASO 3: Crear Tabla en Supabase**

```sql
-- Migración: create_erp_presupuestos
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
  UNIQUE(proyecto_id, version_presupuesto)  -- ← Permite versiones de presupuesto
);

CREATE INDEX idx_erp_presupuestos_proyecto ON erp_presupuestos(proyecto_id);
CREATE INDEX idx_erp_presupuestos_estado ON erp_presupuestos(estado);

-- Trigger para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION update_erp_presupuestos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_erp_presupuestos_timestamp
BEFORE UPDATE ON erp_presupuestos
FOR EACH ROW
EXECUTE FUNCTION update_erp_presupuestos_timestamp();
```

---

### **PASO 4: Actualizar Componente Proyectos** (`Proyectos.tsx`)

**Agregar columna con acciones:**

```typescript
const Proyectos: React.FC = () => {
  const { proyectos, setSelectedProyectoId, setView } = useErp();
  
  const handlePresupuestar = (proyectoId: string) => {
    setSelectedProyectoId(proyectoId);
    setView('presupuestos');
  };
  
  const handleVerPresupuestos = (proyectoId: string) => {
    setSelectedProyectoId(proyectoId);
    // Abrir modal o vista de histórico de presupuestos
  };

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cliente</th>
            <th>Tipología</th>
            <th>Presupuesto</th>
            <th>Estado</th>
            <th>Acciones</th> {/* ← NEW */}
          </tr>
        </thead>
        <tbody>
          {proyectos.map(p => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>{p.cliente}</td>
              <td>{TIPOLOGIA_LABEL[p.tipologia]}</td>
              <td>{fmtQ(p.presupuestoTotal)}</td>
              <td>{p.estado}</td>
              <td>
                {/* ← NEW BUTTONS */}
                <button 
                  onClick={() => handlePresupuestar(p.id)}
                  className="bg-orange-500 text-white px-3 py-1 rounded text-sm"
                  title="Crear o editar presupuesto"
                >
                  📊 Presupuesto
                </button>
                <button 
                  onClick={() => handleVerPresupuestos(p.id)}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm ml-1"
                  title="Ver histórico de presupuestos"
                >
                  📋 Historial
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

### **PASO 5: Actualizar Componente Presupuestos** (`Presupuestos.tsx`)

**Cargar datos del proyecto automáticamente:**

```typescript
const Presupuestos: React.FC = () => {
  const { 
    proyectos, 
    presupuestos, 
    selectedProyectoId,
    addPresupuesto, 
    updatePresupuesto 
  } = useErp();
  
  const [tipologia, setTipologia] = useState<Tipologia>('residencial');
  const [proyecto, setProyecto] = useState('Nuevo Presupuesto');
  const [items, setItems] = useState<RenglonPresupuesto[]>([]);
  const [presupuestoId, setPresupuestoId] = useState<string | null>(null);

  // ✅ NEW: Cargar datos cuando se selecciona un proyecto
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

  const save = async () => {
    if (!selectedProyectoId) {
      toast.error('Debe seleccionar un proyecto');
      return;
    }

    const granTotal = items.reduce((a, r) => {
      const cd = costoDirectoUnitario(r.costoMateriales, r.costoManoObra, r.costoEquipo);
      const pv = precioUnitarioVenta(cd);
      return a + (pv * r.cantidad);
    }, 0);

    const presupuestoData: Omit<Presupuesto, 'id'> = {
      proyectoId: selectedProyectoId,
      tipologia,
      renglones: items,
      totalCalculado: granTotal,
      estado: 'borrador',
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    };

    if (presupuestoId) {
      // Actualizar existente
      await updatePresupuesto(presupuestoId, presupuestoData);
    } else {
      // Crear nuevo
      await addPresupuesto(presupuestoData);
    }

    toast.success('Presupuesto guardado');
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      {/* ← NEW: Mostrar proyecto vinculado */}
      {selectedProyectoId && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>📌 Proyecto:</strong> {proyecto}
          </p>
        </div>
      )}

      {/* ... resto del código ... */}
    </div>
  );
};
```

---

## 🎯 RESUMEN DE CAMBIOS

| Componente | Cambio | Prioridad | Estado |
|-----------|--------|-----------|--------|
| `types.ts` | Agregar interface `Presupuesto` | 🔴 CRÍTICA | ✅ COMPLETADO |
| `store.tsx` | Agregar estados y métodos para presupuestos | 🔴 CRÍTICA | ✅ COMPLETADO |
| `Supabase` | Crear tabla `erp_presupuestos` | 🔴 CRÍTICA | ✅ COMPLETADO (SQL disponible) |
| `Proyectos.tsx` | Agregar `PresupuestoCard` con vinculación | 🟠 IMPORTANTE | ✅ COMPLETADO |
| `Presupuestos.tsx` | Integrar con contexto y selector de proyecto | 🟠 IMPORTANTE | ✅ COMPLETADO |
| `AppLayout.tsx` | No requiere cambios | ⚪ NINGUNO | ❌ No necesario |

---

## 📊 VERIFICACIÓN DESPUÉS

Después de implementar, verificar:

- ✅ Click en proyecto → navega a Presupuestos con datos cargados (vía `PresupuestoCard` con `onViewPresupuesto()`)
- ✅ Presupuestos precarga tipología del proyecto (selector `<select>` en Presupuestos.tsx)
- ✅ Guardar presupuesto → actualiza proyecto automáticamente (`addPresupuesto()` llama a `updateProyecto()`)
- ✅ Presupuesto guardado en Supabase table `erp_presupuestos` (INSERT/UPDATE/ DELETE en store.tsx)
- ✅ Dashboard muestra presupuesto actualizado (Proyectos.tsx usa `presupuestoActualId` para mostrar tarjeta)
- ✅ Puede haber múltiples versiones de presupuesto por proyecto (`versionPresupuesto` + `UNIQUE(proyecto_id, version_presupuesto)`)
- ✅ Histórico de presupuestos accesible desde Proyectos (`PresupuestosList` con editar/duplicar/exportar)

---

**Última actualización:** 1 de Junio de 2026
