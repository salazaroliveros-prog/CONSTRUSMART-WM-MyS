import { Client } from 'pg';
import fs from 'fs';

const envLocal = new URL('../../../.env.local', import.meta.url);
const envFile = fs.existsSync(envLocal) ? envLocal : new URL('../../../.env', import.meta.url);
const env = Object.fromEntries(fs.readFileSync(envFile, 'utf8').split(/\r?\n/).filter(line => line && !line.startsWith('#')).map(line => { const index = line.indexOf('='); return [line.slice(0, index), line.slice(index + 1)]; }));
const ref = (env.VITE_SUPABASE_URL || env.SUPABASE_URL || '').match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const connectionString = env.SUPABASE_DB_URL || env.VITE_SUPABASE_DB_URL || (ref ? `postgres://postgres:postgres@db.${ref}.supabase.co:5432/postgres` : 'postgres://postgres:postgres@127.0.0.1:54322/postgres');
const isLocal = connectionString.includes('127.0.0.1') || connectionString.includes('localhost');
const client = new Client({ connectionString, ssl: isLocal ? false : { rejectUnauthorized: false } });
await client.connect();
await client.query('SET session_replication_role = replica');
const now = new Date();
const d = (offsetDays = 0) => { const dt = new Date(now); dt.setDate(dt.getDate() - offsetDays); return dt.toISOString().slice(0, 10); };
const ts = (offsetDays = 0) => `${d(offsetDays)}T00:00:00Z`;
const q = (value: string) => `"${value.replace(/"/g, '""')}"`;
const sqlValue = (value: unknown): string => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value) || typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  return `'${String(value).replace(/'/g, "''")}'`;
};
const batch = async <T extends Record<string, unknown>>(label: string, rows: T[]) => {
  if (!rows.length) return;
  const columns = Object.keys(rows[0]);
  const updateColumns = columns.filter(column => column !== 'id');
  const update = updateColumns.map(column => `${q(column)} = EXCLUDED.${q(column)}`).join(', ');
  const insertColumns = columns.map(q).join(', ');
  for (const row of rows) {
    const values = `(${columns.map(column => sqlValue(row[column])).join(', ')})`;
    const insertSql = `INSERT INTO public.${q(label)} (${insertColumns}) VALUES ${values} ON CONFLICT (id) DO NOTHING`;
    const updateSql = `UPDATE public.${q(label)} SET ${updateColumns.map(column => `${q(column)} = ${sqlValue(row[column])}`).join(', ')} WHERE id = ${sqlValue(row.id)}`;
    try {
      const result = await client.query(insertSql);
      if (result.rowCount === 0) {
        await client.query(updateSql);
      }
    } catch (error) {
      console.error(`error en ${label}`, error);
      console.error(insertSql.slice(0, 3000));
      console.error(updateSql.slice(0, 3000));
      throw error;
    }
  }
  console.log(`${label}: ${rows.length}`);
};
const upsert = batch;
const insert = batch;
const ensureColumns = async (table: string, columns: Record<string, string>) => {
  for (const [column, type] of Object.entries(columns)) {
    await client.query(`ALTER TABLE public.${q(table)} ADD COLUMN IF NOT EXISTS ${q(column)} ${type}`);
  }
};


const proyectos = [
  { id: 'a2000000-0000-0000-0000-000000000001', nombre: 'Hospital Regional El Roble', descripcion: 'Ampliación de urgencias y hospitalización', tipologia: 'publica', tipo_obra: 'ampliacion', cliente: 'Ministerio de Salud Pública', cliente_nit: '3456789-1', cliente_telefono: '2414-8000', cliente_email: 'compras@mspas.gob.gt', ubicacion: 'Mixco, Guatemala', direccion: 'Calzada San Juan Ostuncalco Km 4', ciudad: 'Mixco', departamento: 'Guatemala', pais: 'Guatemala', codigo_postal: '01009', area_construccion: 18500, num_pisos: 6, plazo_semanas: 96, ingeniero_residente: 'Ing. Luis Hernández', supervisor: 'Ing. Patricia Vásquez', arquitecto: 'Arq. Sofía Morales', numero_expediente: 'EXP-2026-041', numero_licencia: 'LIC-SALUD-2026-004', presupuesto_total: 38000000, monto_contrato: 41800000, avance_fisico: 46, avance_financiero: 41, estado: 'ejecucion', etapa: 'construccion', margen_utilidad_objetivo: 12.5, moneda: 'GTQ', fecha_inicio: d(-150), fecha_fin: d(510), fecha_inicio_real: d(-150), fecha_fin_estimada: d(510), factor_sobrecosto: { indirectos: 8, administracion: 5, imprevistos: 6, utilidad: 12.5 }, lat: 14.6349, lng: -90.6077 },
  { id: 'a2000000-0000-0000-0000-000000000002', nombre: 'Parque Logístico Tecún Umán', descripcion: 'Bodegas, patios de maniobra y oficinas administrativas', tipologia: 'industrial', tipo_obra: 'nueva', cliente: 'Grupo Tecún Logística S.A.', cliente_nit: '7654321-9', cliente_telefono: '2360-4100', cliente_email: 'obras@tecunlogistica.com', ubicacion: 'San José, Escuintla', direccion: 'Carretera al Atlántico Km 92', ciudad: 'San José', departamento: 'Escuintla', pais: 'Guatemala', codigo_postal: '08003', area_construccion: 32000, num_pisos: 2, plazo_semanas: 72, ingeniero_residente: 'Ing. Mario Paredes', supervisor: 'Ing. Elena Ruano', arquitecto: 'Arq. Danilo Cruz', numero_expediente: 'EXP-2026-052', numero_licencia: 'LIC-IND-2026-012', presupuesto_total: 54000000, monto_contrato: 59400000, avance_fisico: 28, avance_financiero: 24, estado: 'ejecucion', etapa: 'construccion', margen_utilidad_objetivo: 14, moneda: 'GTQ', fecha_inicio: d(-90), fecha_fin: d(414), fecha_inicio_real: d(-90), fecha_fin_estimada: d(414), factor_sobrecosto: { indirectos: 9, administracion: 5, imprevistos: 7, utilidad: 14 }, lat: 14.3808, lng: -90.8599 },
  { id: 'a2000000-0000-0000-0000-000000000003', nombre: 'Residencial Terrazas del Lago', descripcion: 'Condominio de 96 apartamentos y áreas comunes', tipologia: 'residencial', tipo_obra: 'nueva', cliente: 'Inmobiliaria Lago S.A.', cliente_nit: '9876543-2', cliente_telefono: '2337-9200', cliente_email: 'proyectos@lagosa.com.gt', ubicacion: 'San Pedro Sacatepéquez, San Marcos', direccion: 'Aldea El Tablón, Paraje Mirador', ciudad: 'San Pedro Sacatepéquez', departamento: 'San Marcos', pais: 'Guatemala', codigo_postal: '12001', area_construccion: 22000, num_pisos: 8, plazo_semanas: 88, ingeniero_residente: 'Ing. Andrea Lemus', supervisor: 'Ing. Oscar Chacón', arquitecto: 'Arq. Natalia De León', numero_expediente: 'EXP-2026-063', numero_licencia: 'LIC-MUN-SP-2026-019', presupuesto_total: 46000000, monto_contrato: 50600000, avance_fisico: 18, avance_financiero: 14, estado: 'ejecucion', etapa: 'construccion', margen_utilidad_objetivo: 13.5, moneda: 'GTQ', fecha_inicio: d(-55), fecha_fin: d(553), fecha_inicio_real: d(-55), fecha_fin_estimada: d(553), factor_sobrecosto: { indirectos: 8, administracion: 5, imprevistos: 6, utilidad: 13.5 }, lat: 14.9622, lng: -91.7645 },
  { id: 'a2000000-0000-0000-0000-000000000004', nombre: 'Remodelación Oficinas Centrales Grupo Financiero', descripcion: 'Adecuación de 5 niveles con acabados corporativos', tipologia: 'comercial', tipo_obra: 'remodelacion', cliente: 'Grupo Financiero CEFI', cliente_nit: '1122334-4', cliente_telefono: '2202-7700', cliente_email: 'infraestructura@cefi.com.gt', ubicacion: 'Zona 9, Ciudad de Guatemala', direccion: '7a Avenida 12-30', ciudad: 'Guatemala', departamento: 'Guatemala', pais: 'Guatemala', codigo_postal: '01009', area_construccion: 9800, num_pisos: 5, plazo_semanas: 34, ingeniero_residente: 'Ing. Mauricio Samayoa', supervisor: 'Ing. Karla Méndez', arquitecto: 'Arq. Felipe Asturias', numero_expediente: 'EXP-2026-074', numero_licencia: 'LIC-MUN-2026-074', presupuesto_total: 18500000, monto_contrato: 20350000, avance_fisico: 72, avance_financiero: 68, estado: 'ejecucion', etapa: 'construccion', margen_utilidad_objetivo: 15, moneda: 'GTQ', fecha_inicio: d(-120), fecha_fin: d(116), fecha_inicio_real: d(-120), fecha_fin_estimada: d(116), factor_sobrecosto: { indirectos: 7, administracion: 5, imprevistos: 5, utilidad: 15 }, lat: 14.5995, lng: -90.5135 },
];
await upsert('erp_proyectos', proyectos);
const renglones = [
  { id: '2a000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', codigo: 'H-001', nombre: 'Cimentación hospitalaria', unidad: 'm3', tipologia: 'publica', rendimiento_cuadrilla: 18, costo_materiales: 2200000, costo_mano_obra: 1200000, costo_equipo: 850000, cantidad: 1 },
  { id: '2a000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000001', codigo: 'H-002', nombre: 'Estructura concreto armado', unidad: 'm3', tipologia: 'publica', rendimiento_cuadrilla: 22, costo_materiales: 8500000, costo_mano_obra: 4100000, costo_equipo: 2400000, cantidad: 1 },
  { id: '2a000000-0000-0000-0000-000000000003', proyecto_id: 'a2000000-0000-0000-0000-000000000002', codigo: 'L-001', nombre: 'Movimiento de tierras y pavimento', unidad: 'm2', tipologia: 'industrial', rendimiento_cuadrilla: 120, costo_materiales: 5600000, costo_mano_obra: 2100000, costo_equipo: 3200000, cantidad: 1 },
  { id: '2a000000-0000-0000-0000-000000000004', proyecto_id: 'a2000000-0000-0000-0000-000000000003', codigo: 'T-001', nombre: 'Apartamentos losa y muros', unidad: 'm2', tipologia: 'residencial', rendimiento_cuadrilla: 65, costo_materiales: 12000000, costo_mano_obra: 6200000, costo_equipo: 1800000, cantidad: 1 },
  { id: '2a000000-0000-0000-0000-000000000005', proyecto_id: 'a2000000-0000-0000-0000-000000000004', codigo: 'O-001', nombre: 'Adecuación arquitectónica oficinas', unidad: 'm2', tipologia: 'comercial', rendimiento_cuadrilla: 42, costo_materiales: 4800000, costo_mano_obra: 3100000, costo_equipo: 650000, cantidad: 1 },
];
await upsert('erp_renglones', renglones);
await upsert('erp_insumos', [
  { id: '5a000000-0000-0000-0000-000000000001', renglon_id: '2a000000-0000-0000-0000-000000000001', nombre: 'Cemento Portland', tipo: 'material', unidad: 'saco', precio: 89.5, rendimiento: 8 },
  { id: '5a000000-0000-0000-0000-000000000002', renglon_id: '2a000000-0000-0000-0000-000000000001', nombre: 'Acero de refuerzo', tipo: 'material', unidad: 'qq', precio: 425, rendimiento: 2.4 },
  { id: '5a000000-0000-0000-0000-000000000003', renglon_id: '2a000000-0000-0000-0000-000000000002', nombre: 'Concreto f\'c 3000', tipo: 'material', unidad: 'm3', precio: 920, rendimiento: 1 },
  { id: '5a000000-0000-0000-0000-000000000004', renglon_id: '2a000000-0000-0000-0000-000000000003', nombre: 'Asfalto en caliente', tipo: 'material', unidad: 'ton', precio: 680, rendimiento: 0.08 },
  { id: '5a000000-0000-0000-0000-000000000005', renglon_id: '2a000000-0000-0000-0000-000000000004', nombre: 'Block estructural', tipo: 'material', unidad: 'unidad', precio: 7.8, rendimiento: 12 },
  { id: '5a000000-0000-0000-0000-000000000006', renglon_id: '2a000000-0000-0000-0000-000000000005', nombre: 'Drywall RH', tipo: 'material', unidad: 'm2', precio: 118, rendimiento: 1 },
]);
await upsert('erp_sub_renglones', [
  { id: '5b000000-0000-0000-0000-000000000001', renglon_id: '2a000000-0000-0000-0000-000000000001', nombre_material: 'Zapata corrida', unidad: 'm3', cantidad_unitaria: 1, precio_unitario: 920 },
  { id: '5b000000-0000-0000-0000-000000000002', renglon_id: '2a000000-0000-0000-0000-000000000002', nombre_material: 'Columna C-1', unidad: 'm3', cantidad_unitaria: 1, precio_unitario: 1050 },
  { id: '5b000000-0000-0000-0000-000000000003', renglon_id: '2a000000-0000-0000-0000-000000000003', nombre_material: 'Base granular', unidad: 'm3', cantidad_unitaria: 0.12, precio_unitario: 185 },
]);
await upsert('erp_insumos_base', [
  { id: 'b2000000-0000-0000-0000-000000000001', nombre: 'Cemento Portland tipo I', categoria: 'materiales', unidad: 'saco', precio_referencia: 89.5, rubro: 'Obra gris', activo: true, fecha_actualizacion: d() },
  { id: 'b2000000-0000-0000-0000-000000000002', nombre: 'Varilla corrugada #4', categoria: 'materiales', unidad: 'qq', precio_referencia: 425, rubro: 'Acero', activo: true, fecha_actualizacion: d() },
  { id: 'b2000000-0000-0000-0000-000000000003', nombre: 'Concreto premezclado f\'c 3000', categoria: 'materiales', unidad: 'm3', precio_referencia: 920, rubro: 'Concreto', activo: true, fecha_actualizacion: d() },
  { id: 'b2000000-0000-0000-0000-000000000004', nombre: 'Mano de obra oficial albañil', categoria: 'mano_obra', unidad: 'jornal', precio_referencia: 220, rubro: 'Construcción', activo: true, fecha_actualizacion: d() },
]);
await upsert('erp_rendimientos_cuadrilla', [
  { id: '2b000000-0000-0000-0000-000000000001', actividad: 'Colado losa 10 cm', cuadrilla: 'Estructura A', rendimiento_diario: 42, unidad: 'm3/dia' },
  { id: '2b000000-0000-0000-0000-000000000002', actividad: 'Levantamiento de block', cuadrilla: 'Mampostería B', rendimiento_diario: 38, unidad: 'm2/dia' },
  { id: '2b000000-0000-0000-0000-000000000003', actividad: 'Pavimento asfáltico', cuadrilla: 'Vialidad C', rendimiento_diario: 260, unidad: 'm2/dia' },
]);
await upsert('erp_presupuestos', [
  { id: 'e2000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', tipologia: 'publica', renglones: [{ id: '2a000000-0000-0000-0000-000000000001', codigo: 'H-001', nombre: 'Cimentación hospitalaria', unidad: 'm3', tipologia: 'publica', cantidad: 1, rendimientoCuadrilla: 18, costoMateriales: 2200000, costoManoObra: 1200000, costoEquipo: 850000, totalCD: 4250000, totalPV: 4887500 }, { id: '2a000000-0000-0000-0000-000000000002', codigo: 'H-002', nombre: 'Estructura concreto armado', unidad: 'm3', tipologia: 'publica', cantidad: 1, rendimientoCuadrilla: 22, costoMateriales: 8500000, costoManoObra: 4100000, costoEquipo: 2400000, totalCD: 15000000, totalPV: 17250000 }], total_calculado: 22137500, costo_directo_total: 19250000, estado: 'aprobado', notas: 'Presupuesto base fase estructural', version_presupuesto: 2, fecha_creacion: ts(-150), fecha_actualizacion: ts(-3) },
  { id: 'e2000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000002', tipologia: 'industrial', renglones: [{ id: '2a000000-0000-0000-0000-000000000003', codigo: 'L-001', nombre: 'Movimiento de tierras y pavimento', unidad: 'm2', tipologia: 'industrial', cantidad: 1, rendimientoCuadrilla: 120, costoMateriales: 5600000, costoManoObra: 2100000, costoEquipo: 3200000, totalCD: 10900000, totalPV: 12535000 }], total_calculado: 12535000, costo_directo_total: 10900000, estado: 'aprobado', notas: 'Presupuesto preliminar logística', version_presupuesto: 1, fecha_creacion: ts(-90), fecha_actualizacion: ts(-10) },
  { id: 'e2000000-0000-0000-0000-000000000003', proyecto_id: 'a2000000-0000-0000-0000-000000000003', tipologia: 'residencial', renglones: [{ id: '2a000000-0000-0000-0000-000000000004', codigo: 'T-001', nombre: 'Apartamentos losa y muros', unidad: 'm2', tipologia: 'residencial', cantidad: 1, rendimientoCuadrilla: 65, costoMateriales: 12000000, costoManoObra: 6200000, costoEquipo: 1800000, totalCD: 20000000, totalPV: 23000000 }], total_calculado: 23000000, costo_directo_total: 20000000, estado: 'borrador', notas: 'En revisión de precios', version_presupuesto: 1, fecha_creacion: ts(-55), fecha_actualizacion: ts(-5) },
]);
await upsert('erp_movimientos', [
  { id: '5c000000-0000-0000-0000-000000000001', tipo: 'ingreso', proyecto_id: 'a2000000-0000-0000-0000-000000000001', descripcion: 'Anticipo contrato hospitalario', cantidad: 1, unidad: 'global', categoria: 'administrativo', costo_unitario: 12000000, costo_total: 12000000, fecha: d(-140), proveedor: 'Ministerio de Salud Pública', proveedor_nit: '3456789-1', factura: 'ANT-HOSP-001', forma_pago: 'transferencia', retencion_isr: 0, retencion_iva: 0, notas: 'Anticipo 30%' },
  { id: '5c000000-0000-0000-0000-000000000002', tipo: 'gasto', proyecto_id: 'a2000000-0000-0000-0000-000000000001', descripcion: 'Compra acero estructural', cantidad: 120, unidad: 'qq', categoria: 'materiales', costo_unitario: 425, costo_total: 51000, fecha: d(-132), proveedor: 'Aceros Industriales GT', proveedor_nit: '6543219-8', factura: 'FAC-AIG-8841', forma_pago: 'transferencia', retencion_isr: 1275, retencion_iva: 6120, notas: 'Entrega parcial' },
  { id: '5c000000-0000-0000-0000-000000000003', tipo: 'gasto', proyecto_id: 'a2000000-0000-0000-0000-000000000002', descripcion: 'Renta excavadora y compactadora', cantidad: 2, unidad: 'mes', categoria: 'herramienta', costo_unitario: 85000, costo_total: 170000, fecha: d(-70), proveedor: 'Maquinaria Pesada S.A.', forma_pago: 'transferencia' },
  { id: '5c000000-0000-0000-0000-000000000004', tipo: 'gasto', proyecto_id: 'a2000000-0000-0000-0000-000000000003', descripcion: 'Compra block y arena', cantidad: 1, unidad: 'global', categoria: 'materiales', costo_unitario: 185000, costo_total: 185000, fecha: d(-35), proveedor: 'Materiales San Marcos', forma_pago: 'otro' },
  { id: '5c000000-0000-0000-0000-000000000005', tipo: 'ingreso', proyecto_id: 'a2000000-0000-0000-0000-000000000004', descripcion: 'Estimación remodelación nivel 3', cantidad: 1, unidad: 'servicio', categoria: 'administrativo', costo_unitario: 4200000, costo_total: 4200000, fecha: d(-45), proveedor: 'Grupo Financiero CEFI', forma_pago: 'transferencia' },
]);
await upsert('erp_empleados', [
  { id: 'c2000000-0000-0000-0000-000000000001', nombre: 'Juan Pérez López', puesto: 'Albañil', proyecto_id: 'a2000000-0000-0000-0000-000000000001', salario_diario: 180, dias_trabajados: 82, tipo: 'planilla', activo: true, telefono: '5555-1101' },
  { id: 'c2000000-0000-0000-0000-000000000002', nombre: 'Pedro García Ruiz', puesto: 'Oficial', proyecto_id: 'a2000000-0000-0000-0000-000000000001', salario_diario: 220, dias_trabajados: 76, tipo: 'planilla', activo: true, telefono: '5555-1102' },
  { id: 'c2000000-0000-0000-0000-000000000003', nombre: 'Carlos Martínez Gómez', proyecto_id: 'a2000000-0000-0000-0000-000000000002', puesto: 'Maestro de obra', salario_diario: 260, dias_trabajados: 64, tipo: 'planilla', activo: true, telefono: '5555-1103' },
  { id: 'c2000000-0000-0000-0000-000000000004', nombre: 'Ana Santizo Morales', proyecto_id: 'a2000000-0000-0000-0000-000000000003', puesto: 'Ayudante', salario_diario: 130, dias_trabajados: 32, tipo: 'destajo', activo: true, telefono: '5555-1104' },
]);
await upsert('erp_materiales', [
  { id: '5e000000-0000-0000-0000-000000000001', nombre: 'Cemento UGC Tolteca 42.5kg', unidad: 'saco', stock: 850, stock_minimo: 200, precio: 89.5, critico: false, categoria: 'materiales', bodega: 'Central', renglon_id: '2a000000-0000-0000-0000-000000000001' },
  { id: '5e000000-0000-0000-0000-000000000002', nombre: 'Varilla corrugada #4', unidad: 'qq', stock: 320, stock_minimo: 100, precio: 425, critico: false, categoria: 'materiales', bodega: 'Central', renglon_id: '2a000000-0000-0000-0000-000000000002' },
  { id: '5e000000-0000-0000-0000-000000000003', nombre: 'Arena de río', unidad: 'm3', stock: 35, stock_minimo: 60, precio: 185, critico: true, categoria: 'materiales', bodega: 'Central', renglon_id: '2a000000-0000-0000-0000-000000000003' },
  { id: '5e000000-0000-0000-0000-000000000004', nombre: 'Block 14x19x39', unidad: 'unidad', stock: 4500, stock_minimo: 1000, precio: 7.8, critico: false, categoria: 'materiales', bodega: 'Central', renglon_id: '2a000000-0000-0000-0000-000000000004' },
]);
await upsert('erp_proveedores', [
  { id: '5f000000-0000-0000-0000-000000000001', nombre: 'Cementos Progreso', contacto: 'Carlos Soto', telefono: '2245-7890', email: 'ventas@cempro.gt', categoria: 'materiales', rubro: 'Materiales de Construcción', calificacion: 4 },
  { id: '5f000000-0000-0000-0000-000000000002', nombre: 'Aceros Industriales GT', contacto: 'Luis Fernández', telefono: '2233-4567', email: 'ventas@acerosgt.com', categoria: 'materiales', rubro: 'Acero', calificacion: 5 },
  { id: '5f000000-0000-0000-0000-000000000003', nombre: 'Maquinaria Pesada S.A.', contacto: 'Ana María Rivas', telefono: '2288-9012', email: 'ventas@mquiposa.gt', categoria: 'herramienta', rubro: 'Renta de Maquinaria', calificacion: 4 },
]);
await upsert('erp_ordenes_compra', [
  { id: '5d000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', proveedor: 'Aceros Industriales GT', material: 'Varilla corrugada #4', cantidad: 120, monto: 51000, items: [{ materialId: '5e000000-0000-0000-0000-000000000002', cantidad: 120, precioUnitario: 425 }], estado: 'recibida', fecha: d(-132) },
  { id: '5d000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000002', proveedor: 'Maquinaria Pesada S.A.', material: 'Renta compactadora', cantidad: 2, monto: 170000, items: [], estado: 'pendiente', fecha: d(-70) },
  { id: '5d000000-0000-0000-0000-000000000003', proyecto_id: 'a2000000-0000-0000-0000-000000000003', proveedor: 'Materiales San Marcos', material: 'Block y arena', cantidad: 1, monto: 185000, items: [{ materialId: '5e000000-0000-0000-0000-000000000004', cantidad: 1000, precioUnitario: 7.8 }], estado: 'aprobado', fecha: d(-35) },
]);
await upsert('erp_avances', [
  { id: 'a3000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', presupuesto_id: 'e2000000-0000-0000-0000-000000000001', renglon_id: '2a000000-0000-0000-0000-000000000001', fecha: d(-120), avance_fisico: 8, cantidad_ejecutada: 120, foto: '', latitud: 14.6349, longitud: -90.6077, notas: 'Inicio excavaciones' },
  { id: 'a3000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000001', presupuesto_id: 'e2000000-0000-0000-0000-000000000001', renglon_id: '2a000000-0000-0000-0000-000000000002', fecha: d(-60), avance_fisico: 26, cantidad_ejecutada: 420, foto: '', latitud: 14.6349, longitud: -90.6077, notas: 'Cimentación y columnas' },
  { id: 'a3000000-0000-0000-0000-000000000003', proyecto_id: 'a2000000-0000-0000-0000-000000000002', presupuesto_id: 'e2000000-0000-0000-0000-000000000002', renglon_id: '2a000000-0000-0000-0000-000000000003', fecha: d(-55), avance_fisico: 18, cantidad_ejecutada: 2800, foto: '', latitud: 14.3808, longitud: -90.8599, notas: 'Terracerías lote 1' },
  { id: 'a3000000-0000-0000-0000-000000000004', proyecto_id: 'a2000000-0000-0000-0000-000000000003', presupuesto_id: 'e2000000-0000-0000-0000-000000000003', renglon_id: '2a000000-0000-0000-0000-000000000004', fecha: d(-30), avance_fisico: 12, cantidad_ejecutada: 1150, foto: '', latitud: 14.9622, longitud: -91.7645, notas: 'Cimentación torres A y B' },
  { id: 'a3000000-0000-0000-0000-000000000005', proyecto_id: 'a2000000-0000-0000-0000-000000000004', presupuesto_id: 'e1000000-0000-0000-0000-000000000006', renglon_id: '2a000000-0000-0000-0000-000000000005', fecha: d(-70), avance_fisico: 58, cantidad_ejecutada: 1200, foto: '', latitud: 14.5995, longitud: -90.5135, notas: 'Drywall y acabados nivel 2' },
]);
await upsert('erp_seguimiento', [
  { id: '5b000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', fecha: d(-120), avance_fisico: 8, avance_financiero: 7, costo_planeado: 1200000, costo_real: 1280000, valor_planeado: 1150000, valor_ganado: 1120000 },
  { id: '5b000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000001', fecha: d(-60), avance_fisico: 26, avance_financiero: 24, costo_planeado: 4200000, costo_real: 4550000, valor_planeado: 4000000, valor_ganado: 3900000 },
  { id: '5b000000-0000-0000-0000-000000000003', proyecto_id: 'a2000000-0000-0000-0000-000000000001', fecha: d(-14), avance_fisico: 46, avance_financiero: 41, costo_planeado: 8200000, costo_real: 8750000, valor_planeado: 7900000, valor_ganado: 7600000 },
  { id: '5b000000-0000-0000-0000-000000000004', proyecto_id: 'a2000000-0000-0000-0000-000000000002', fecha: d(-45), avance_fisico: 28, avance_financiero: 24, costo_planeado: 6100000, costo_real: 6400000, valor_planeado: 5900000, valor_ganado: 5600000 },
  { id: '5b000000-0000-0000-0000-000000000005', proyecto_id: 'a2000000-0000-0000-0000-000000000003', fecha: d(-25), avance_fisico: 18, avance_financiero: 14, costo_planeado: 3100000, costo_real: 3250000, valor_planeado: 3000000, valor_ganado: 2900000 },
  { id: '5b000000-0000-0000-0000-000000000006', proyecto_id: 'a2000000-0000-0000-0000-000000000004', fecha: d(-20), avance_fisico: 72, avance_financiero: 68, costo_planeado: 9800000, costo_real: 10150000, valor_planeado: 9500000, valor_ganado: 9300000 },
]);
await upsert('erp_vales_salida', [
  { id: '60000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', renglon_id: '2a000000-0000-0000-0000-000000000002', items: [{ materialId: '5e000000-0000-0000-0000-000000000002', cantidad: 40 }], solicitante: 'Ing. Luis Hernández', fecha: d(-8), observaciones: 'Salida para colado losa' },
  { id: '60000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000003', renglon_id: '2a000000-0000-0000-0000-000000000004', items: [{ materialId: '5e000000-0000-0000-0000-000000000004', cantidad: 300 }], solicitante: 'Ing. Andrea Lemus', fecha: d(-10), observaciones: 'Mampostería torre A' },
]);
await upsert('erp_hitos', [
  { id: '61000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', nombre: 'Inicio de obra', descripcion: 'Acta de inicio y movilización', fecha: d(-150), tipo: 'inicio', estado: 'completado', responsable: 'Ing. Luis Hernández', depende_de: '[]', completado_en: `${d(-150)}T00:00:00Z` },
  { id: '61000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000001', nombre: 'Cimentación completada', fecha: d(-40), tipo: 'hito', estado: 'retrasado', responsable: 'Ing. Patricia Vásquez', depende_de: '["61000000-0000-0000-0000-000000000001"]' },
  { id: '61000000-0000-0000-0000-000000000003', proyecto_id: 'a2000000-0000-0000-0000-000000000002', nombre: 'Terracerías lote 1', fecha: d(-30), tipo: 'hito', estado: 'pendiente', responsable: 'Ing. Mario Paredes', depende_de: '[]' },
  { id: '61000000-0000-0000-0000-000000000004', proyecto_id: 'a2000000-0000-0000-0000-000000000004', nombre: 'Entrega nivel 3', fecha: d(20), tipo: 'entrega', estado: 'pendiente', responsable: 'Ing. Mauricio Samayoa', depende_de: '[]' },
]);
await upsert('erp_riesgos', [
  { id: '3a000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', nombre: 'Retraso en acero estructural', descripcion: 'Proveedor reporta demora de 10 días', tipo: 'tecnico', probabilidad: 4, impacto: 4, nivel: 'alto', plan_mitigacion: 'Autorizar proveedor alterno y reforzar inventario', plan_contingencia: 'Reprogramar colados críticos', responsable: 'Ing. Patricia Vásquez', fecha_identificacion: d(-90), estado: 'mitigado', costo_soporte: 180000 },
  { id: '3a000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000002', nombre: 'Lluvias en patio de maniobras', descripcion: 'Temporada lluviosa puede afectar terracerías', tipo: 'ambiental', probabilidad: 3, impacto: 4, nivel: 'medio', plan_mitigacion: 'Instalar drenaje temporal y geomalla', plan_contingencia: 'Trabajar turnos dobles al mejorar clima', responsable: 'Ing. Elena Ruano', fecha_identificacion: d(-60), estado: 'identificado', costo_soporte: 95000 },
  { id: '3a000000-0000-0000-0000-000000000003', proyecto_id: 'a2000000-0000-0000-0000-000000000003', nombre: 'Variación precio block', descripcion: 'Incremento previsto en insumos', tipo: 'financiero', probabilidad: 3, impacto: 3, nivel: 'medio', plan_mitigacion: 'Cerrar compra parcial con proveedor', plan_contingencia: 'Ajustar presupuesto fase 2', responsable: 'Ing. Oscar Chacón', fecha_identificacion: d(-35), estado: 'identificado', costo_soporte: 60000 },
]);
await upsert('erp_ordenes_cambio', [
  { id: '3b000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', titulo: 'Ampliación sala de triage', descripcion: 'Cliente solicita ampliar sala de triage 18 m2', impacto_costo: 420000, impacto_plazo: 5, estado: 'revision', solicitante: 'Ministerio de Salud Pública', solicitante_rol: 'Supervisor cliente', aprobador: null, fecha_aprobacion: null },
  { id: '3b000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000004', titulo: 'Cambio de acabado lobby', descripcion: 'Sustitución de porcelanato por piedra natural', impacto_costo: 280000, impacto_plazo: 3, estado: 'aprobado', solicitante: 'Grupo Financiero CEFI', solicitante_rol: 'Infraestructura', aprobador: null, fecha_aprobacion: `${d(-25)}T00:00:00Z` },
]);
await upsert('erp_cuentas_cobrar', [
  { id: 'cc200000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', cliente: 'Ministerio de Salud Pública', concepto: 'Estimación 2 hospital', monto: 8500000, saldo_pendiente: 3200000, fecha_emision: d(-45), fecha_vencimiento: d(15), fecha_cobro: null, estado: 'parcial', notas: 'Pago parcial recibido' },
  { id: 'cc200000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000002', cliente: 'Grupo Tecún Logística S.A.', concepto: 'Anticipo fase 2', monto: 12000000, saldo_pendiente: 12000000, fecha_emision: d(-10), fecha_vencimiento: d(20), estado: 'pendiente', notas: 'Pendiente transferencia' },
]);
await upsert('erp_cuentas_pagar', [
  { id: '62000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', proveedor: 'Aceros Industriales GT', concepto: 'Saldo acero estructural', monto: 38000, saldo_pendiente: 38000, fecha_emision: d(-130), fecha_vencimiento: d(-10), estado: 'vencido', factura_url: '' },
  { id: '62000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000003', proveedor: 'Materiales San Marcos', concepto: 'Block y arena', monto: 185000, saldo_pendiente: 92500, fecha_emision: d(-35), fecha_vencimiento: d(10), estado: 'parcial', factura_url: '' },
]);
await upsert('erp_ventas_paquetes', [
  { id: '3c000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000003', tipo: 'unidad', identificador: 'TORRE-A-APT-301', precio_venta: 1250000, precio_contrato: 1180000, estado: 'reservado', cliente: 'Lic. Mario Pérez', fecha_reserva: d(-12), fecha_venta: null, plan_pago: 'Cuota inicial 20%, saldo financiamiento bancario', notas: 'Reserva con promoción lanzamiento' },
  { id: '3c000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000003', tipo: 'unidad', identificador: 'TORRE-B-APT-502', precio_venta: 1320000, precio_contrato: 1250000, estado: 'disponible', cliente: '', fecha_reserva: null, fecha_venta: null, plan_pago: 'Contado o financiamiento', notas: '' },
]);
await upsert('erp_pagos_proveedor', [
  { id: '63000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', proveedor_id: '5f000000-0000-0000-0000-000000000002', monto: 38000, concepto: 'Saldo acero estructural', fecha_emision: d(-130), fecha_vencimiento: d(-10), fecha_pago: null, estado: 'vencido', factura_url: '' },
  { id: '63000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000002', proveedor_id: '5f000000-0000-0000-0000-000000000003', monto: 170000, concepto: 'Renta compactadora', fecha_emision: d(-70), fecha_vencimiento: d(5), fecha_pago: null, estado: 'pendiente', factura_url: '' },
]);
await upsert('erp_licitaciones', [
  { id: '3d000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000003', nombre: 'Fase 2 Terrazas del Lago', cliente: 'Inmobiliaria Lago S.A.', monto: 24000000, fecha_limite: d(30), estado: 'activa', documentos: [{ nombre: 'Plano arquitectónico fase 2', url: '' }], notas: 'Pipeline comercial activo', probabilidad: 62 },
  { id: '3d000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000002', nombre: 'Ampliación bodega refrigerada', cliente: 'Grupo Tecún Logística S.A.', monto: 18000000, fecha_limite: d(45), estado: 'activa', documentos: [], notas: 'En espera de especificaciones térmicas', probabilidad: 48 },
]);
await upsert('erp_cotizaciones_negocio', [
  { id: '64000000-0000-0000-0000-000000000001', tipo: 'construccion', numero: 'COT-2026-081', fecha: d(-8), fecha_vencimiento: d(22), cliente_nombre: 'Inmobiliaria Lago S.A.', cliente_nit: '9876543-2', cliente_telefono: '2337-9200', cliente_email: 'proyectos@lagosa.com.gt', cliente_direccion: 'Zona 10, Ciudad de Guatemala', descripcion: 'Ampliación residencial fase 2', alcance: 'Obra gris, acabados comunes y urbanización', renglones: [{ codigo: 'F2-001', nombre: 'Urbanización', unidad: 'global', cantidad: 1, costoMateriales: 3200000, costoManoObra: 1800000, costoEquipo: 900000, totalCD: 5900000, totalPV: 6785000 }], costo_directo_total: 5900000, precio_venta_total: 6785000, estado: 'enviada', notas: 'Cotización enviada al cliente' },
  { id: '64000000-0000-0000-0000-000000000002', tipo: 'construccion', numero: 'COT-2026-082', fecha: d(-5), fecha_vencimiento: d(25), cliente_nombre: 'Grupo Tecún Logística S.A.', cliente_nit: '7654321-9', cliente_telefono: '2360-4100', cliente_email: 'obras@tecunlogistica.com', cliente_direccion: 'San José, Escuintla', descripcion: 'Bodega refrigerada', alcance: 'Adecuación térmica y piso industrial', renglones: [], costo_directo_total: 0, precio_venta_total: 0, estado: 'borrador', notas: 'Pendiente desglose de refrigeración' },
]);
await ensureColumns('erp_cuadros', {
  solicitud: 'text',
  fecha_solicitud: 'date',
  fecha_cierre: 'date',
  adjudicado_a: 'uuid',
  cotizaciones: 'jsonb',
  estado: 'text',
  observaciones: 'text',
});
await upsert('erp_cuadros', [
  { id: '65000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', nombre: 'Cotización acero estructural hospital', descripcion: 'Comparativo para fase estructural', tipo: 'comparativo', solicitud: 'Cotización acero estructural hospital', fecha_solicitud: d(-20), fecha_cierre: d(10), estado: 'abierto', adjudicado_a: null, observaciones: 'Comparativo para fase estructural', cotizaciones: [{ id: '66000000-0000-0000-0000-000000000001', cuadroId: '65000000-0000-0000-0000-000000000001', proveedorId: '5f000000-0000-0000-0000-000000000002', proveedorNombre: 'Aceros Industriales GT', montoTotal: 51000, plazoEntrega: 7, seleccionada: false }] },
  { id: '65000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000003', nombre: 'Cotización block residencial', descripcion: 'Comparativo para torre A y B', tipo: 'comparativo', solicitud: 'Cotización block residencial', fecha_solicitud: d(-12), fecha_cierre: d(8), estado: 'abierto', adjudicado_a: null, observaciones: 'Comparativo para torre A y B', cotizaciones: [{ id: '66000000-0000-0000-0000-000000000002', cuadroId: '65000000-0000-0000-0000-000000000002', proveedorId: '5f000000-0000-0000-0000-000000000001', proveedorNombre: 'Materiales San Marcos', montoTotal: 185000, plazoEntrega: 5, seleccionada: false }] },
]);
await ensureColumns('erp_activos', {
  codigo_inventario: 'text',
  marca: 'text',
  valor_adquisicion: 'numeric',
  fecha_asignacion: 'date',
  fecha_adquisicion: 'date',
  proveedor_id: 'uuid',
  proveedor_nombre: 'text',
  observaciones: 'text',
});
await upsert('erp_activos', [
  { id: 'ac200000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', nombre: 'Vibrador de concreto', codigo_inventario: 'ACT-H-001', tipo: 'herramienta', marca: 'Wacker', modelo: 'Epic 28', numero_serie: 'WK-88421', valor_adquisicion: 18500, estado: 'asignado', ubicacion: 'Hospital El Roble', asignado_a: 'Cuadrilla Estructura A', fecha_asignacion: d(-120), fecha_adquisicion: d(-180) },
  { id: 'ac200000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000002', nombre: 'Compactadora placa', codigo_inventario: 'ACT-L-002', tipo: 'equipo', marca: 'Dynapac', modelo: 'LF82', numero_serie: 'DY-1204', valor_adquisicion: 96000, estado: 'disponible', ubicacion: 'Bodega Tecún', asignado_a: '', fecha_adquisicion: d(-140) },
]);
await client.query(`ALTER TABLE public."erp_planos" ALTER COLUMN version TYPE text USING version::text`);
await ensureColumns('erp_planos', {
  subido_por: 'text',
  fecha_subida: 'date',
  revision: 'integer',
});
await upsert('erp_planos', [
  { id: '67000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', nombre: 'Arquitectónico hospitalario nivel 1', disciplina: 'arquitectura', tipo: 'plano', version: '3.2', estado: 'vigente', archivo_url: '', subido_por: 'Arq. Sofía Morales', fecha_subida: d(-20), revision: 3 },
  { id: '67000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000002', nombre: 'Pavimentos y drenajes lote 1', disciplina: 'civil', tipo: 'plano', version: '1.1', estado: 'en_revision', archivo_url: '', subido_por: 'Ing. Elena Ruano', fecha_subida: d(-8), revision: 1 },
]);
await ensureColumns('erp_rfis', {
  solicitante: 'text',
  destino: 'text',
  fecha_solicitud: 'timestamp with time zone',
  fecha_respuesta: 'timestamp with time zone',
});
await upsert('erp_rfis', [
  { id: '68000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', numero: 'RFI-014', titulo: 'Confirmar acero de refuerzo en losa médica', descripcion: 'Solicito confirmar detalle estructural S-12', solicitante: 'Ing. Luis Hernández', remitente: 'Ing. Luis Hernández', destino: 'Consultor estructural', destinatario: 'Consultor estructural', estado: 'abierto', fecha_solicitud: d(-6), fecha_envio: d(-6), respuesta: null, fecha_respuesta: null },
  { id: '68000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000004', numero: 'RFI-007', titulo: 'Aprobación de piedra natural lobby', descripcion: 'Solicito aprobar muestra y mantenimiento', solicitante: 'Ing. Mauricio Samayoa', remitente: 'Ing. Mauricio Samayoa', destino: 'Grupo Financiero CEFI', destinatario: 'Grupo Financiero CEFI', estado: 'en_respuesta', fecha_solicitud: d(-15), fecha_envio: d(-15), respuesta: 'En revisión por arquitectura interna', fecha_respuesta: null },
]);
await ensureColumns('erp_submittals', {
  categoria: 'text',
  proveedor: 'text',
});
await upsert('erp_submittals', [
  { id: '3e000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', numero: 'SUB-001', titulo: 'Ficha técnica concreto f\'c 3000', categoria: 'proceso', proveedor: 'Concreteras GT', fecha_envio: d(-18), estado: 'aprobado' },
  { id: '3e000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000004', numero: 'SUB-002', titulo: 'Muestra piedra natural lobby', categoria: 'proceso', proveedor: 'Piedras y Acabados', fecha_envio: d(-12), estado: 'con_comentarios' },
]);
await upsert('erp_no_conformidades', [
  { id: '3f000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', codigo: 'NC-H-001', descripcion: 'Recubrimiento de acero inferior al especificado en eje C-4', categoria: 'documentacion', fecha_deteccion: d(-18), detectado_por: 'Ing. Patricia Vásquez', plan_accion: 'Revisar detalle, liberar reparaciones y nueva inspección', responsable_cierre: 'Ing. Luis Hernández', fecha_cierre: null, estado: 'plan_accion' },
  { id: '3f000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000003', codigo: 'NC-T-001', descripcion: 'Apilamiento de block sin protección contra lluvia', categoria: 'proceso', fecha_deteccion: d(-9), detectado_por: 'Ing. Andrea Lemus', plan_accion: 'Cubrir material y rotar inventario afectado', responsable_cierre: 'Bodega San Marcos', fecha_cierre: null, estado: 'detectado' },
]);
await upsert('erp_incidentes', [
  { id: '4a000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000002', tipo: 'condicion_insegura', fecha: d(-11), hora: '10:30:00', descripcion: 'Talud temporal sin señalización en acceso norte', afectados: 'Cuadrilla vialidad', testigos: 'Jefe de seguridad', acciones_inmediatas: 'Señalizar área y restringir paso', reportado_por: 'Ing. Elena Ruano', latitud: 14.3808, longitud: -90.8599, fotos: '{}', estado: 'investigacion' },
  { id: '4a000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000004', tipo: 'cuasi_accidente', fecha: d(-5), hora: '15:10:00', descripcion: 'Caída menor de herramienta en área acordonada', afectados: 'Ninguno', testigos: 'Supervisor acabados', acciones_inmediatas: 'Refuerzo de charla de seguridad', reportado_por: 'Ing. Karla Méndez', latitud: 14.5995, longitud: -90.5135, fotos: '{}', estado: 'cerrado' },
]);
await upsert('erp_pruebas_laboratorio', [
  { id: '4b000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', tipo: 'concreto', descripcion: 'Cilindros colada eje C-4', fecha_muestra: d(-20), fecha_resultado: d(-5), resultado: 'pasa', responsable: 'Laboratorio Centroamericano', observaciones: 'f\'c promedio 3150 psi' },
  { id: '4b000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000002', tipo: 'suelos', descripcion: 'Prueba Proctor compactación lote 1', fecha_muestra: d(-14), fecha_resultado: null, resultado: 'pendiente', responsable: 'Laboratorio Suelos GT', observaciones: 'Pendiente resultado final' },
]);
await upsert('erp_liberaciones_partida', [
  { id: '69000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', renglon_id: '2a000000-0000-0000-0000-000000000001', renglon_nombre: 'Cimentación hospitalaria', fecha_solicitud: d(-16), fecha_liberacion: d(-12), solicitante: 'Ing. Luis Hernández', supervisor: 'Ing. Patricia Vásquez', checklist_aprobado: true, observaciones: 'Liberado con observación menor cerrada', estado: 'liberado' },
  { id: '69000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000003', renglon_id: '2a000000-0000-0000-0000-000000000004', renglon_nombre: 'Apartamentos losa y muros', fecha_solicitud: d(-4), fecha_liberacion: null, solicitante: 'Ing. Andrea Lemus', supervisor: 'Ing. Oscar Chacón', checklist_aprobado: false, observaciones: 'Falta liberación de acero', estado: 'pendiente' },
]);
await ensureColumns('destajos', {
  rendimiento_real: 'numeric',
  registrado_por: 'uuid',
});
await upsert('destajos', [
  { id: 'de200000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', renglon_codigo: 'H-002', cuadrilla: 'Estructura A', fecha: d(-7), cantidad_ejecutada: 86, unidad: 'm3', horas_trabajadas: 72, rendimiento_teorico: 88, observaciones: 'Buen rendimiento en colado losa' },
  { id: 'de200000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000003', renglon_codigo: 'T-001', cuadrilla: 'Mampostería B', fecha: d(-6), cantidad_ejecutada: 142, unidad: 'm2', horas_trabajadas: 64, rendimiento_teorico: 160, observaciones: 'Rendimiento bajo por lluvia' },
]);
await upsert('erp_recepciones', [
  { id: '6a000000-0000-0000-0000-000000000001', oc_id: '5d000000-0000-0000-0000-000000000001', proveedor: 'Aceros Industriales GT', fecha_recepcion: d(-130), items: [{ material: 'Varilla corrugada #4', cantidad: 120 }], observaciones: 'Cantidad recibida completa, sin diferencias' },
  { id: '6a000000-0000-0000-0000-000000000002', oc_id: '5d000000-0000-0000-0000-000000000003', proveedor: 'Materiales San Marcos', fecha_recepcion: d(-33), items: [{ material: 'Block 14x19x39', cantidad: 980 }], observaciones: 'Faltan 20 unidades según OC' },
]);
await upsert('erp_eventos_calendario', [
  { id: '4c000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', fecha: d(2), hora: '09:00', titulo: 'Inspección cimentación hospital', descripcion: 'Revisión con interventoría', tipo: 'Reunión', completado: false },
  { id: '4c000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000002', fecha: d(5), hora: '08:00', titulo: 'Entrega compactadora', descripcion: 'Confirmar movilización', tipo: 'Actividad', completado: false },
]);
await ensureColumns('erp_bitacora', {
  latitud: 'double precision',
  longitud: 'double precision',
  fotos: 'jsonb',
  firma: 'text',
});
await upsert('erp_bitacora', [
  { id: '6b000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', fecha: d(-1), clima: 'nublado', personal: 58, maquinaria: 'Grúa torre, vibrador, bomba concreta', tareas: 'Colado losa médica eje C-D', observaciones: 'Sin contratiempos', latitud: 14.6349, longitud: -90.6077 },
  { id: '6b000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000003', fecha: d(-2), clima: 'lluvia', personal: 34, maquinaria: 'Mezcladora, andamios', tareas: 'Levantamiento muros torre A', observaciones: 'Lluvia intermitente', latitud: 14.9622, longitud: -91.7645 },
]);
await upsert('erp_muro', [
  { id: '4d000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', autor: 'Ing. Luis Hernández', autor_avatar: '', contenido: 'Avance 46% en hospital. Cimentación y estructura avanzan según curva S.', tipo: 'general', fotos: '{}', documento: null, likes: 8, comentarios: [{ id: 'com-001', autor: 'Interventoría', autorAvatar: '', contenido: 'Solicitar reporte de ensayos', createdAt: `${d(-1)}T16:00:00Z` }] },
  { id: '4d000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000002', autor: 'Ing. Elena Ruano', autor_avatar: '', contenido: 'Coordinar drenaje temporal antes de próximas lluvias.', tipo: 'general', fotos: '{}', documento: null, likes: 3, comentarios: [] },
]);
await upsert('erp_notificaciones', [
  { id: '4e000000-0000-0000-0000-000000000001', proyecto_id: 'a2000000-0000-0000-0000-000000000001', tipo: 'stock_critico', titulo: 'Stock crítico: Arena de río', mensaje: 'El material está por debajo del mínimo en bodega central', referencia_id: '5e000000-0000-0000-0000-000000000003', leido: false, created_at: `${d(-1)}T08:00:00Z`, created_by: null },
  { id: '4e000000-0000-0000-0000-000000000002', proyecto_id: 'a2000000-0000-0000-0000-000000000001', tipo: 'orden_cambio_pendiente', titulo: 'Orden de cambio en revisión', mensaje: 'Ampliación sala de triage pendiente de aprobación', referencia_id: '3b000000-0000-0000-0000-000000000001', leido: false, created_at: `${d(-2)}T10:00:00Z`, created_by: null },
]);
console.log('seed completo');
await client.query('SET session_replication_role = origin');
await client.end();


















