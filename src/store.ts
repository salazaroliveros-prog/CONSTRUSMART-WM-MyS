import { configureStore, createSlice, createAsyncThunk, combineReducers } from '@reduxjs/toolkit';
import { supabase } from './lib/supabase';
import { z } from 'zod';

// Zod schemas for validation
const proyectoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  ubicacion: z.string(),
  tipologia: z.enum(['residencial', 'comercial', 'industrial', 'civil', 'publica']),
  presupuestoTotal: z.number().default(0),
  montoContrato: z.number().optional().default(0),
  cliente: z.string().optional().default(''),
  fechaInicio: z.string().nullable().optional().default(''),
  fechaFin: z.string().nullable().optional().default(''),
  avanceFisico: z.number().default(0),
  avanceFinanciero: z.number().default(0),
  estado: z.enum(['planeacion', 'ejecucion', 'pausado', 'finalizado']).default('planeacion'),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

const movimientoSchema = z.object({
  id: z.string(),
  proyectoId: z.string().nullable().optional().default(''),
  tipo: z.enum(['ingreso', 'gasto', 'egreso']),
  categoria: z.string().default('otros'),
  descripcion: z.string().default(''),
  cantidad: z.number().nullable().optional().default(1),
  unidad: z.string().nullable().optional().default(''),
  costoUnitario: z.number().nullable().optional().default(0),
  costoTotal: z.number().nullable().optional().default(0),
  monto: z.number().optional().default(0),
  fecha: z.string(),
  proveedor: z.string().optional(),
  factura: z.string().nullable().optional(),
});

const presupuestoSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  tipologia: z.enum(['residencial', 'comercial', 'industrial', 'civil', 'publica']),
  renglones: z.array(z.record(z.unknown())).default([]),
  estado: z.string().default('borrador'),
  totalCalculado: z.number().default(0),
  costoDirectoTotal: z.number().default(0),
  fechaCreacion: z.string().default(new Date().toISOString()),
  fechaActualizacion: z.string().default(new Date().toISOString()),
  versionPresupuesto: z.number().optional().default(1),
  notas: z.string().nullable().optional(),
});

const empleadoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  puesto: z.string().default(''),
  salarioDiario: z.number().default(0),
  tipo: z.enum(['planilla', 'destajo']).default('planilla'),
  activo: z.boolean().optional().default(true),
  proyectoId: z.string().nullable().optional(),
  proyectoIds: z.array(z.string()).optional().default([]),
  telefono: z.string().nullable().optional(),
  diasTrabajados: z.number().nullable().optional().default(0),
});

const materialSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  unidad: z.string().default(''),
  stock: z.number().default(0),
  stockMinimo: z.number().default(0),
  precio: z.number().default(0),
  critico: z.boolean().nullable().optional().default(false),
  categoria: z.string().optional().default('general'),
  proyectoIds: z.array(z.string()).optional().default([]),
});

// -----------------------------------------------------------------------------
// Async thunks for Supabase CRUD operations
// -----------------------------------------------------------------------------

export const fetchProyectos = createAsyncThunk('proyectos/fetchProyectos', async () => {
  const { data, error } = await supabase.from('erp_proyectos').select('*');
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
});

export const addProyecto = createAsyncThunk('proyectos/addProyecto', async (proyecto) => {
  // Validate with Zod before sending to Supabase
  const result = proyectoSchema.omit({ id: true }).safeParse(proyecto);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  const { data, error } = await supabase.from('erp_proyectos').insert(result.data).single();
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
});

export const updateProyecto = createAsyncThunk('proyectos/updateProyecto', async ({ id, ...patch }) => {
  // Validate patch with Zod (partial validation)
  const result = proyectoSchema.partial().safeParse(patch);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  const { data, error } = await supabase.from('erp_proyectos').update(result.data).eq('id', id).single();
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
});

export const deleteProyecto = createAsyncThunk('proyectos/deleteProyecto', async (id) => {
  const { error } = await supabase.from('erp_proyectos').delete().eq('id', id);
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return id;
});

// Budgets thunks
export const fetchPresupuestos = createAsyncThunk('presupuestos/fetchPresupuestos', async () => {
  const { data, error } = await supabase.from('erp_presupuestos').select('*');
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
});

export const addPresupuesto = createAsyncThunk('presupuestos/addPresupuesto', async (presupuesto) => {
  const result = presupuestoSchema.omit({ id: true }).safeParse(presupuesto);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  const { data, error } = await supabase.from('erp_presupuestos').insert(result.data).single();
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
});

export const updatePresupuesto = createAsyncThunk('presupuestos/updatePresupuesto', async ({ id, ...patch }) => {
  const result = presupuestoSchema.partial().safeParse(patch);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  const { data, error } = await supabase.from('erp_presupuestos').update(result.data).eq('id', id).single();
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
});

export const deletePresupuesto = createAsyncThunk('presupuestos/deletePresupuesto', async (id) => {
  const { error } = await supabase.from('erp_presupuestos').delete().eq('id', id);
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return id;
});

// Employees thunks
export const fetchEmpleados = createAsyncThunk('empleados/fetchEmpleados', async () => {
  const { data, error } = await supabase.from('erp_empleados').select('*');
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
});

export const addEmpleado = createAsyncThunk('empleados/addEmpleado', async (empleado) => {
  const result = empleadoSchema.omit({ id: true }).safeParse(empleado);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  const { data, error } = await supabase.from('erp_empleados').insert(result.data).single();
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
});

export const updateEmpleado = createAsyncThunk('empleados/updateEmpleado', async ({ id, ...patch }) => {
  const result = empleadoSchema.partial().safeParse(patch);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  const { data, error } = await supabase.from('erp_empleados').update(result.data).eq('id', id).single();
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
});

export const deleteEmpleado = createAsyncThunk('empleados/deleteEmpleado', async (id) => {
  const { error } = await supabase.from('erp_empleados').delete().eq('id', id);
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return id;
});

// Materials thunks
export const fetchMateriales = createAsyncThunk('materiales/fetchMateriales', async () => {
  const { data, error } = await supabase.from('erp_materiales').select('*');
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
});

export const addMaterial = createAsyncThunk('materiales/addMaterial', async (material) => {
  const result = materialSchema.omit({ id: true }).safeParse(material);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  const { data, error } = await supabase.from('erp_materiales').insert(result.data).single();
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
});

export const updateMaterial = createAsyncThunk('materiales/updateMaterial', async ({ id, ...patch }) => {
  const result = materialSchema.partial().safeParse(patch);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  const { data, error } = await supabase.from('erp_materiales').update(result.data).eq('id', id).single();
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
});

export const deleteMaterial = createAsyncThunk('materiales/deleteMaterial', async (id) => {
  const { error } = await supabase.from('erp_materiales').delete().eq('id', id);
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return id;
});

// Orders thunks
const ordenSchema = z.object({
  id: z.string(),
  proyectoId: z.string().nullable().optional(),
  proveedor: z.string().default(''),
  material: z.string().default(''),
  cantidad: z.number().default(0),
  monto: z.number().default(0),
  fecha: z.string(),
  estado: z.string().default('pendiente'),
  proveedorId: z.string().nullable().optional(),
  total: z.number().optional(),
  items: z.array(z.object({
    materialId: z.string(),
    cantidad: z.number(),
    precioUnitario: z.number(),
  })).optional(),
});

export const fetchOrdenes = createAsyncThunk('ordenes/fetchOrdenes', async () => {
  const { data, error } = await supabase.from('erp_ordenes_compra').select('*');
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
});

export const addOrden = createAsyncThunk('ordenes/addOrden', async (orden) => {
  const result = ordenSchema.omit({ id: true }).safeParse(orden);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  const { data, error } = await supabase.from('erp_ordenes_compra').insert(result.data).single();
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
});

export const updateOrden = createAsyncThunk('ordenes/updateOrden', async ({ id, ...patch }) => {
  const result = ordenSchema.partial().safeParse(patch);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  const { data, error } = await supabase.from('erp_ordenes_compra').update(result.data).eq('id', id).single();
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
});

export const deleteOrden = createAsyncThunk('ordenes/deleteOrden', async (id) => {
  const { error } = await supabase.from('erp_ordenes_compra').delete().eq('id', id);
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return id;
});

// Movimientos thunks
export const fetchMovimientos = createAsyncThunk('movimientos/fetchMovimientos', async () => {
  const { data, error } = await supabase.from('erp_movimientos').select('*');
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
});

export const addMovimiento = createAsyncThunk('movimientos/addMovimiento', async (movimiento) => {
  const result = movimientoSchema.omit({ id: true }).safeParse(movimiento);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  const { data, error } = await supabase.from('erp_movimientos').insert(result.data).single();
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
});

export const deleteMovimiento = createAsyncThunk('movimientos/deleteMovimiento', async (id) => {
  const { error } = await supabase.from('erp_movimientos').delete().eq('id', id);
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return id;
});

export const updateMovimiento = createAsyncThunk('movimientos/updateMovimiento', async ({ id, ...patch }) => {
  const result = movimientoSchema.partial().safeParse(patch);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  const { data, error } = await supabase.from('erp_movimientos').update(result.data).eq('id', id).single();
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
});

// -----------------------------------------------------------------------------
// Slices definitions
// -----------------------------------------------------------------------------

// Proyectos slice
const proyectosSlice = createSlice({
  name: 'proyectos',
  initialState: {
    list: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProyectos.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProyectos.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchProyectos.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addProyecto.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateProyecto.fulfilled, (state, action) => {
        const index = state.list.findIndex(p => p.id === action.payload.id);
        if (index >= 0) state.list[index] = action.payload;
      })
      .addCase(deleteProyecto.fulfilled, (state, action) => {
        state.list = state.list.filter(p => p.id !== action.payload);
      });
  },
});

// Movimientos slice
const movimientosSlice = createSlice({
  name: 'movimientos',
  initialState: {
    list: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMovimientos.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMovimientos.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchMovimientos.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addMovimiento.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(deleteMovimiento.fulfilled, (state, action) => {
        state.list = state.list.filter(m => m.id !== action.payload);
      })
      .addCase(updateMovimiento.fulfilled, (state, action) => {
        const index = state.list.findIndex(m => m.id === action.payload.id);
        if (index >= 0) state.list[index] = action.payload;
      });
  },
});

// Presupuestos slice
const presupuestosSlice = createSlice({
  name: 'presupuestos',
  initialState: {
    list: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPresupuestos.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPresupuestos.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchPresupuestos.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addPresupuesto.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updatePresupuesto.fulfilled, (state, action) => {
        const index = state.list.findIndex(p => p.id === action.payload.id);
        if (index >= 0) state.list[index] = action.payload;
      })
      .addCase(deletePresupuesto.fulfilled, (state, action) => {
        state.list = state.list.filter(p => p.id !== action.payload);
      });
  },
});

// Empleados slice
const empleadosSlice = createSlice({
  name: 'empleados',
  initialState: {
    list: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmpleados.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchEmpleados.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchEmpleados.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addEmpleado.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateEmpleado.fulfilled, (state, action) => {
        const index = state.list.findIndex(e => e.id === action.payload.id);
        if (index >= 0) state.list[index] = action.payload;
      })
      .addCase(deleteEmpleado.fulfilled, (state, action) => {
        state.list = state.list.filter(e => e.id !== action.payload);
      });
  },
});

// Materiales slice
const materialesSlice = createSlice({
  name: 'materiales',
  initialState: {
    list: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMateriales.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMateriales.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchMateriales.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addMaterial.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateMaterial.fulfilled, (state, action) => {
        const index = state.list.findIndex(m => m.id === action.payload.id);
        if (index >= 0) state.list[index] = action.payload;
      })
      .addCase(deleteMaterial.fulfilled, (state, action) => {
        state.list = state.list.filter(m => m.id !== action.payload);
      });
  },
});

// Ordenes slice
const ordenesSlice = createSlice({
  name: 'ordenes',
  initialState: {
    list: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrdenes.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchOrdenes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchOrdenes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addOrden.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateOrden.fulfilled, (state, action) => {
        const index = state.list.findIndex(o => o.id === action.payload.id);
        if (index >= 0) state.list[index] = action.payload;
      })
      .addCase(deleteOrden.fulfilled, (state, action) => {
        state.list = state.list.filter(o => o.id !== action.payload);
      });
  },
});

// -----------------------------------------------------------------------------
// Exported reducers and actions
// -----------------------------------------------------------------------------

export const proyectosReducer = proyectosSlice.reducer;
export const movimientosReducer = movimientosSlice.reducer;
export const presupuestosReducer = presupuestosSlice.reducer;
export const empleadosReducer = empleadosSlice.reducer;
export const materialesReducer = materialesSlice.reducer;
export const ordenesReducer = ordenesSlice.reducer;

// Actions grupo
export const {
  reducer: proyectosActions,
  actions: proyectosActionsEnum,
} = proyectosSlice;
export const {
  reducer: movimientosActions,
  actions: movimientosActionsEnum,
} = movimientosSlice;
export const {
  reducer: presupuestosActions,
  actions: presupuestosActionsEnum,
} = presupuestosSlice;
export const {
  reducer: empleadosActions,
  actions: empleadosActionsEnum,
} = empleadosSlice;
export const {
  reducer: materialesActions,
  actions: materialesActionsEnum,
} = materialesSlice;
export const {
  reducer: ordenesActions,
  actions: ordenesActionsEnum,
} = ordenesSlice;

// -----------------------------------------------------------------------------
// Store configuration
// -----------------------------------------------------------------------------

const rootReducer = combineReducers({
  proyectos: proyectosSlice.reducer,
  movimientos: movimientosSlice.reducer,
  presupuestos: presupuestosSlice.reducer,
  empleados: empleadosSlice.reducer,
  materiales: materialesSlice.reducer,
  ordenes: ordenesSlice.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Supabase returns non‑serializable Dates, remove check
    }),
});

export default store;