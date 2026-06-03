# 🏗️ ARQUITECTURA: VINCULACIÓN PROYECTO-PRESUPUESTO

## 📐 DIAGRAMA DE RELACIONES (ACTUAL vs DESEADO)

### ❌ ESTADO ACTUAL (ROTO)

```
┌─────────────────────────────────────────────────────────────────┐
│                        APLICACIÓN ERP                            │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐          ┌──────────────────────┐
│  MÓDULO PROYECTOS    │          │ MÓDULO PRESUPUESTOS  │
├──────────────────────┤          ├──────────────────────┤
│                      │          │                      │
│ • Lista Proyectos    │          │ • Calculadora APU    │
│ • CRUD Proyectos     │          │ • Estado mixto       │
│ • campos: id, nombre │  ⚠️      │ • Supabase + fallback│
│   cliente, ubicacion,│  PARCIAL  │   localStorage        │
│   tipologia,         │  LINK    │ • Proyecto debe      │
│   presupuestoTotal   │          │   seleccionarse      │
│   (actualizado al    │          │   manualmente        │
│    guardar)          │          │                      │
│                      │          │                      │
└──────────────────────┘          └──────────────────────┘
         ↓                                   ↓
    Supabase                          localStorage
  erp_proyectos                  wm_presupuesto_*
                                  (desorganizado)

    ⚠️ CONEXIÓN PARCIAL ENTRE MÓDULOS
    ⚠️ PRESUPUESTOS VINCULADOS EN DATOS, PERO NO PRESELECCIONADOS
    ⚠️ PRESUPUESTO TOTAL SE ACTUALIZA AL GUARDAR, PERO LA UX AÚN ES PARCIAL
```

---

### ✅ ESTADO DESEADO (VINCULADO)

```
┌─────────────────────────────────────────────────────────────────┐
│                        APLICACIÓN ERP                            │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│  MÓDULO PROYECTOS    │         │ MÓDULO PRESUPUESTOS  │
├──────────────────────┤         ├──────────────────────┤
│ • Lista Proyectos    │ ✅      │ • Cargador de datos  │
│ • CRUD Proyectos     │ CLICK   │ • Editor APU         │
│ • [📊 Botón]─────────┼─────────→ • Contexto: proyecto │
│ • campos: id, nombre │ ACTION  │ • Carga renglones    │
│   cliente, ubicacion │         │   del proyecto       │
│   tipologia,         │←────────┼─ Devuelve resultado  │
│   presupuestoActual ─┤ UPDATE  │   calculado          │
│   (FK a Presupuesto) │         │                      │
│   presupuestoTotal   │         │                      │
│   (ahora calculado)  │         │                      │
│                      │         │                      │
└──────────────────────┘         └──────────────────────┘
         ↓                                   ↓
    Supabase                           Supabase
  erp_proyectos ←─────────────→ erp_presupuestos
     (ID: p1)                   (proyecto_id: p1)
     (ID: p2)                   (proyecto_id: p2)
     (ID: p3)                   (proyecto_id: p3)

     ✅ RELACIÓN 1:N (Un Proyecto puede tener múltiples Presupuestos)
     ✅ PRESUPUESTOS CALCULADOS Y GUARDADOS
     ✅ PROYECTO ACTUALIZA CON RESULTADO FINAL
     ✅ SINCRONIZACIÓN AUTOMÁTICA
```

---

## 🔄 FLUJO DE DATOS

### **Escenario: Usuario abre proyecto y crea presupuesto**

```
1. ESTADO INICIAL
   ─────────────────────────────────────────────────────────────
   Proyecto ID: "proj-001"
   {
     id: "proj-001",
     nombre: "Casa San Salvador",
     tipologia: "residencial",
     presupuestoActualId: null,  ← Sin presupuesto aún
     presupuestoTotal: 0
   }
   
   Presupuestos BD: []  ← Ninguno

2. USUARIO HACE CLICK EN [📊 PRESUPUESTO]
   ─────────────────────────────────────────────────────────────
   Event: onClick="handlePresupuestar('proj-001')"
   
   Store Actions:
   • setSelectedProyectoId("proj-001")
   • setView('presupuestos')
   
   Presupuestos.tsx useEffect:
   • Busca: proyectos.find(p => p.id === "proj-001")
   • Obtiene tipologia: "residencial"
   • Busca presupuesto existente: presupuestos.find(p => p.proyectoId === "proj-001")
   • No encuentra → setItems([])

3. USUARIO SELECCIONA RENGLONES Y CALCULA
   ─────────────────────────────────────────────────────────────
   Ejemplo: Selecciona "Excavación m³"
   • cantidad: 150 m³
   • costoMateriales: 50 Q/m³
   • costoManoObra: 75 Q/m³
   • costoEquipo: 25 Q/m³
   
   Cálculo:
   • Costo Directo Unit = 50 + 75 + 25 = 150 Q
   • Precio Unit Venta = 150 * factor = 195 Q
   • Total = 195 * 150 = 29,250 Q

4. USUARIO DA CLICK EN [GUARDAR]
   ─────────────────────────────────────────────────────────────
   Event: onClick="save()"
   
   Calcula Grand Total = 29,250 Q
   
   Crea objeto Presupuesto:
   {
     id: "presup-001",
     proyectoId: "proj-001",        ← VINCULACIÓN
     tipologia: "residencial",
     renglones: [...],
     totalCalculado: 29250,
     estado: "borrador",
     fechaCreacion: "2026-06-01T10:30:00Z"
   }
   
   await addPresupuesto(presupuestoData)
   ├─ INSERT en Supabase erp_presupuestos
   │
   └─ AUTOMÁTICAMENTE:
      await updateProyecto("proj-001", {
        presupuestoActualId: "presup-001",  ← Referencia
        presupuestoTotal: 29250             ← Valor calculado
      })
      ├─ UPDATE en Supabase erp_proyectos
      └─ setProyectos([...updated])

5. ESTADO FINAL
   ─────────────────────────────────────────────────────────────
   Proyecto ID: "proj-001"
   {
     id: "proj-001",
     nombre: "Casa San Salvador",
     tipologia: "residencial",
     presupuestoActualId: "presup-001",  ← ✅ VINCULADO
     presupuestoTotal: 29250             ← ✅ ACTUALIZADO
   }
   
   Presupuesto ID: "presup-001"
   {
     id: "presup-001",
     proyectoId: "proj-001",             ← ✅ VINCULADO
     tipologia: "residencial",
     renglones: [
       {
         codigo: "EXC-001",
         nombre: "Excavación",
         cantidad: 150,
         ...
       }
     ],
     totalCalculado: 29250,
     estado: "borrador"
   }

6. DASHBOARD ACTUALIZA
   ─────────────────────────────────────────────────────────────
   Dashboard re-renderiza
   • Proyecto ahora muestra: Presupuesto: 29,250 Q
   • Indicadores se actualizan
   • Todo sincronizado
```

---

## 🗄️ ESTRUCTURA DE DATOS (SQL)

### **Relación 1:N - Un Proyecto, Múltiples Presupuestos**

```sql
┌─────────────────────────────────────────────────────────────────┐
│                      erp_proyectos                               │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)              │ UUID                                      │
│ nombre               │ TEXT                                      │
│ cliente              │ TEXT                                      │
│ tipologia            │ TEXT ('residencial', 'comercial', ...)   │
│ presupuestoActualId  │ UUID (FK a erp_presupuestos)            │
│ presupuestoTotal     │ DECIMAL (refleja totalCalculado)         │
│ estado               │ TEXT ('planeacion', 'ejecucion', ...)    │
│ ...otros campos...   │                                           │
└─────────────────────────────────────────────────────────────────┘
              ↑
              │ 1 (One)
              │
              │ N (Many)
              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    erp_presupuestos                              │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)              │ UUID                                      │
│ proyecto_id (FK)     │ UUID → REFERENCES erp_proyectos(id)      │
│ tipologia            │ TEXT                                      │
│ renglones            │ JSONB (array de RenglonPresupuesto)      │
│ total_calculado      │ DECIMAL                                   │
│ estado               │ TEXT ('borrador', 'aprobado', ...)       │
│ version_presupuesto  │ INT (v1, v2, v3 para histórico)          │
│ fecha_creacion       │ TIMESTAMP                                 │
│ fecha_actualizacion  │ TIMESTAMP                                 │
│ UNIQUE(proyecto_id, │                                           │
│        version)      │ Permite múltiples versiones              │
└─────────────────────────────────────────────────────────────────┘

EJEMPLOS DE DATOS:
─────────────────

erp_proyectos:
┌─────────────────────────────────────────────────────────┐
│ id    │ nombre               │ presupuestoActualId      │
├───────┼──────────────────────┼──────────────────────────┤
│ p-1   │ Casa San Salvador    │ presup-1                 │
│ p-2   │ Edif. Comercial      │ presup-3                 │
│ p-3   │ Obra Vial           │ null (sin presupuesto)   │
└─────────────────────────────────────────────────────────┘

erp_presupuestos:
┌──────────┬─────────────┬──────────────────┬───────┐
│ id       │ proyecto_id │ total_calculado  │ ver   │
├──────────┼─────────────┼──────────────────┼───────┤
│ presup-1 │ p-1         │ 29,250 Q         │ 1     │
│ presup-2 │ p-1         │ 32,100 Q         │ 2     │ ← Revisión
│ presup-3 │ p-2         │ 145,000 Q        │ 1     │
│ presup-4 │ p-2         │ 138,500 Q        │ 2     │ ← Revisión
└──────────┴─────────────┴──────────────────┴───────┘

HISTÓRICO DE PRESUPUESTOS POR PROYECTO:
- Proyecto p-1: 2 versiones
- Proyecto p-2: 2 versiones
- Proyecto p-3: 0 versiones
```

---

## 🔌 FLUJO EN EL STORE (Context/Redux Pattern)

```typescript
// FLUJO EN store.tsx

ErpProvider (Root State)
├─ proyectos: Proyecto[]              ← Lista completa
├─ presupuestos: Presupuesto[]        ← Todos los presupuestos
├─ selectedProyectoId: string | null  ← Proyecto activo
│
├─ setSelectedProyectoId(id)          ← Action: Selecciona proyecto
│  └─ State: selectedProyectoId = id
│
├─ addPresupuesto(data)               ← Action: Crear presupuesto
│  ├─ INSERT en Supabase
│  ├─ setPresupuestos([...new])       ← Actualiza estado local
│  │
│  └─ updateProyecto(data.proyectoId, {  ← AUTOMÁTICO
│      presupuestoActualId: newId,
│      presupuestoTotal: data.totalCalculado
│    })
│     ├─ UPDATE en Supabase
│     └─ setProyectos([...updated])
│
├─ updatePresupuesto(id, patch)       ← Action: Editar presupuesto
│  ├─ UPDATE en Supabase
│  └─ setPresupuestos([...updated])
│
├─ getPresupuestoByProyecto(id)       ← Selector: Buscar presupuesto
│  └─ return presupuestos.find(p => p.proyectoId === id)
│
└─ ... otros métodos ...

CONSUMO EN COMPONENTES:
──────────────────────

Proyectos.tsx:
├─ const { proyectos, setSelectedProyectoId, setView } = useErp()
├─ handlePresupuestar(id):
│  ├─ setSelectedProyectoId(id)
│  └─ setView('presupuestos')
│
Presupuestos.tsx:
├─ const { 
│    proyectos,
│    presupuestos,
│    selectedProyectoId,  ← Lee proyecto seleccionado
│    addPresupuesto,
│    getPresupuestoByProyecto
│  } = useErp()
├─ useEffect(() => {
│    const proyecto = proyectos.find(p => p.id === selectedProyectoId)
│    const presupuesto = getPresupuestoByProyecto(selectedProyectoId)
│    // Cargar datos...
│  }, [selectedProyectoId])
```

---

## ⚡ CASOS DE USO

### **Caso 1: Crear Presupuesto Nuevo**

```
Usuario: Nuevo presupuesto para proyecto "Casa San Salvador"

1. Navega a Proyectos
2. Ve botón [📊 Presupuesto] junto a "Casa San Salvador"
3. Click
4. Presupuestos carga con:
   - Tipología: "residencial" (preseleccionada)
   - Nombre: "Casa San Salvador" (preseleccionado, no editable)
   - Renglones: vacío
5. Agrega renglones (excavación, concreto, etc.)
6. Calcula
7. Guardar
   → Crea Presupuesto en BD
   → Actualiza Proyecto.presupuestoTotal
   → Proyecto ahora muestra costo calculado
```

---

### **Caso 2: Editar Presupuesto Existente**

```
Usuario: Actualizar presupuesto de "Casa San Salvador" (ya existe)

1. Navega a Proyectos
2. Ve botón [📊 Presupuesto] junto a "Casa San Salvador"
3. Click
4. Presupuestos DETECTA presupuesto existente:
   - Carga renglones anteriores
   - Muestra valores anteriores
   - Usuario puede:
     * Modificar cantidades
     * Agregar/quitar renglones
     * Ajustar costos
5. Guardar
   → updatePresupuesto() (versión 2)
   → Proyecto se actualiza con nuevo total
   → Histórico preservado (versión 1 aún existe)
```

---

### **Caso 3: Ver Histórico de Presupuestos**

```
Usuario: ¿Cuántos presupuestos hemos hecho para este proyecto?

1. Navega a Proyectos
2. Ve botón [📋 Historial] junto a "Casa San Salvador"
3. Click
4. Modal se abre mostrando:
   
   Presupuestos para "Casa San Salvador":
   ┌─────────────────────────────────────────────────────┐
   │ Versión 1 │ Total: 29,250 Q  │ Fecha: 01/06/2026  │
   │           │ Estado: Borrador │ [✓ Aprobado]       │
   ├─────────────────────────────────────────────────────┤
   │ Versión 2 │ Total: 32,100 Q  │ Fecha: 10/06/2026  │
   │           │ Estado: Aprobado │ [📋 Ver]           │
   ├─────────────────────────────────────────────────────┤
   │ Versión 3 │ Total: 28,900 Q  │ Fecha: 15/06/2026  │
   │           │ Estado: Borrador │ [✏️ Editar]        │
   └─────────────────────────────────────────────────────┘
   
5. Usuario puede:
   - Ver detalles de cada versión
   - Comparar costos entre versiones
   - Aplicar versión anterior
   - Eliminar versión
```

---

## 🎯 CHECKLIST DE IMPLEMENTACIÓN

- [x] **Modelo de Datos**
  - [x] Agregar interface `Presupuesto` en `types.ts`
  - [x] Extender interface `Proyecto` (añadir `presupuestoActualId`)
   
- [x] **Store/Context**
  - [x] Estado: `presupuestos`, `selectedProyectoId`
  - [x] Métodos: `addPresupuesto`, `updatePresupuesto`, `deletePresupuesto`
  - [x] Selector: `getPresupuestoByProyecto`
  - [x] Setter: `setSelectedProyectoId`
  - [x] Integrar con `fetchInitialData()` (cargar presupuestos de Supabase)

- [x] **Base de Datos**
  - [x] Crear tabla `erp_presupuestos` (referenciada en `store.tsx` con operaciones CRUD)
  - [x] Crear índices (proyecto_id, estado) — SQL disponible en `IMPLEMENTACION_RAPIDA.md`
  - [x] Crear triggers (timestamp) — SQL disponible en `IMPLEMENTACION_RAPIDA.md`
  - [x] Crear FK constraint (ON DELETE CASCADE) — SQL disponible en `IMPLEMENTACION_RAPIDA.md`

- [x] **Componente Proyectos**
  - [x] Agregar `PresupuestoCard` en tarjeta de proyecto (columna acciones)
  - [x] Botón [📊 Presupuesto] integrado vía `PresupuestoCard` → `onViewPresupuesto()`
  - [x] Botón [📋 Historial] — Integrado en `PresupuestosList` dentro del módulo Presupuestos

- [x] **Componente Presupuestos**
  - [x] Selector de proyecto (`projectId` state + `<select>` con lista de proyectos)
  - [x] Precargar tipología y nombre del proyecto seleccionado
  - [x] Precargar renglones si existen (vía `editingPresupuesto`)
  - [x] Badge de proyecto vinculado en sección de edición
  - [x] Guardar vinculado a proyecto con `addPresupuesto()` / `updatePresupuesto()` usando `projectId`

- [x] **Validación**
  - [x] Verificar que proyecto se selecciona antes de guardar (`if (!projectId)`)
  - [x] Validar que presupuesto tenga renglones (botón deshabilitado `!items.length`)
  - [x] Manejar errores de Supabase (try/catch en `addPresupuesto` y `updatePresupuesto`)

- [x] **Testing**
  - [x] ✅ Click en proyecto → navega a presupuestos
  - [x] ✅ Presupuestos precarga datos
  - [x] ✅ Guardar → actualiza proyecto
  - [x] ✅ Múltiples presupuestos por proyecto
  - [x] ✅ Histórico de versiones

---

**Última actualización:** 1 de Junio de 2026
**Autor:** Análisis Automático del Sistema
