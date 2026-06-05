import React, { useState } from 'react';
import { useNuevosModulos } from '../hooks/useNuevosModulos';
import { ActivoHerramienta, PagoProveedor } from '../types';
import { z } from 'zod';
import { toast } from 'sonner';

const uid = () => Math.random().toString(36).substr(2, 9);

// Zod schemas
const activoSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres'),
  codigoInventario: z.string().min(1, 'Código requerido').max(50, 'Máximo 50 caracteres'),
  tipo: z.enum(['herramienta', 'equipo', 'vehiculo', 'accesorio']),
  valorAdquisicion: z.coerce.number().min(0, 'Debe ser ≥ 0').max(9_999_999, 'Monto muy alto'),
});

const cuadroSchema = z.object({
  solicitud: z.string().min(3, 'Mínimo 3 caracteres').max(200, 'Máximo 200 caracteres'),
});

const pagoSchema = z.object({
  proveedorNombre: z.string().min(1, 'Proveedor requerido').max(100, 'Máximo 100 caracteres'),
  concepto: z.string().min(1, 'Concepto requerido').max(200, 'Máximo 200 caracteres'),
  monto: z.coerce.number().min(1, 'Debe ser ≥ Q1').max(99_999_999, 'Monto muy alto'),
  fechaVencimiento: z.string().min(1, 'Fecha requerida'),
});

export const LogisticaCompras: React.FC = () => {
  const {
    activos, addActivo, updateActivo, deleteActivo,
    cuadros, addCuadro, addCotizacion, selectCotizacion,
    pagos, addPago, updatePago, pagosVencidos,
  } = useNuevosModulos();

  const [tab, setTab] = useState<'activos' | 'cuadros' | 'pagos'>('activos');
  const [showForm, setShowForm] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => setFormErrors(prev => ({ ...prev, [field]: '' }));
  const updateForm = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  // ---- ACTIVE RENDERS ----
  const renderActivos = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">🔧 Control de Activos y Herramientas</h2>
        <button onClick={() => { setShowForm('activo'); setForm({}); setFormErrors({}); }}
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs">+ Nuevo Activo</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Código</th>
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2 text-left">Tipo</th>
              <th className="p-2 text-left">Estado</th>
              <th className="p-2 text-right">Valor</th>
              <th className="p-2 text-left">Asignado a</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {activos.map(a => (
              <tr key={a.id} className="border-t hover:bg-gray-50">
                <td className="p-2 font-mono text-xs">{a.codigoInventario}</td>
                <td className="p-2">{a.nombre}</td>
                <td className="p-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    a.tipo === 'herramienta' ? 'bg-blue-100 text-blue-700' :
                    a.tipo === 'equipo' ? 'bg-purple-100 text-purple-700' :
                    a.tipo === 'vehiculo' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                  }`}>{a.tipo}</span>
                </td>
                <td className="p-2">
                  <select value={a.estado} onChange={e => updateActivo(a.id, { estado: e.target.value as ActivoHerramienta['estado'] })}
                    className={`text-xs px-1 py-0.5 rounded border ${
                      a.estado === 'disponible' ? 'text-green-700' :
                      a.estado === 'asignado' ? 'text-blue-700' :
                      a.estado === 'mantenimiento' ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                    <option value="disponible">Disponible</option>
                    <option value="asignado">Asignado</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="baja">Baja</option>
                  </select>
                </td>
                <td className="p-2 text-right font-mono">Q{a.valorAdquisicion.toFixed(2)}</td>
                <td className="p-2 text-xs">{a.asignadoA || '—'}</td>
                <td className="p-2">
                  <button onClick={() => deleteActivo(a.id)} className="text-red-500 hover:text-red-700 text-xs">🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {activos.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No hay activos registrados</p>}
    </div>
  );

  // ---- CUADRO FORM ----
  const renderCuadros = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">📊 Cuadro Comparativo de Proveedores</h2>
        <button onClick={() => { setShowForm('cuadro'); setForm({}); setFormErrors({}); }}
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs">+ Nueva Solicitud</button>
      </div>
      <div className="grid gap-3">
        {cuadros.map(c => (
          <div key={c.id} className="border rounded-lg p-3 bg-white">
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="font-semibold">{c.solicitud}</span>
                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                  c.estado === 'abierto' ? 'bg-yellow-100 text-yellow-700' :
                  c.estado === 'cerrado' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                }`}>{c.estado}</span>
              </div>
              <span className="text-xs text-gray-500">{new Date(c.fechaSolicitud).toLocaleDateString()}</span>
            </div>
            {c.estado === 'abierto' && (
              <div className="mt-2">
                <h4 className="text-xs font-semibold text-gray-600 mb-1">Cotizaciones:</h4>
                {c.cotizaciones.map(ct => (
                  <div key={ct.id} className={`flex items-center justify-between text-xs p-2 rounded mb-1 ${
                    ct.seleccionada ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                  }`}>
                    <span>{ct.proveedorNombre}</span>
                    <span className="font-mono font-bold">Q{ct.montoTotal.toFixed(2)}</span>
                    <span className="text-gray-500">{ct.plazoEntrega ? `${ct.plazoEntrega} días` : '—'}</span>
                    {!ct.seleccionada && c.estado === 'abierto' && (
                      <button onClick={() => selectCotizacion(c.id, ct.id)}
                        className="bg-green-500 text-white px-2 py-0.5 rounded text-xs hover:bg-green-600">
                        Adjudicar
                      </button>
                    )}
                    {ct.seleccionada && <span className="text-green-600 font-bold">✅ Adjudicada</span>}
                  </div>
                ))}
                <button onClick={() => {
                  const proveedores = ['Cementos Progreso', 'Aceros GT', 'Ferretería Central', 'Distribuidora Norte'];
                  const prov = proveedores[Math.floor(Math.random() * proveedores.length)];
                  addCotizacion(c.id, {
                    cuadroId: c.id,
                    proveedorId: uid(),
                    proveedorNombre: prov,
                    montoTotal: Math.round(Math.random() * 50000 * 100) / 100,
                    plazoEntrega: Math.floor(Math.random() * 30) + 5,
                    seleccionada: false
                  });
                }} className="text-blue-600 text-xs mt-1 hover:underline">+ Agregar cotización</button>
              </div>
            )}
            {c.estado === 'adjudicado' && c.cotizaciones.find(ct => ct.seleccionada) && (
              <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                ✅ Adjudicado a: {c.cotizaciones.find(ct => ct.seleccionada)?.proveedorNombre}
              </div>
            )}
          </div>
        ))}
      </div>
      {cuadros.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No hay solicitudes de cotización</p>}
    </div>
  );

  // ---- PAGOS ----
  const renderPagos = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">💰 Programación de Pagos a Proveedores</h2>
        <button onClick={() => { setShowForm('pago'); setForm({}); setFormErrors({}); }}
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs">+ Nuevo Pago</button>
      </div>

      {pagosVencidos.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-bold text-red-700">⚠️ {pagosVencidos.length} pago(s) vencido(s)</p>
          {pagosVencidos.slice(0, 3).map(p => (
            <p key={p.id} className="text-xs text-red-600 mt-1">
              {p.concepto} — Q{p.monto.toFixed(2)} — Vencido {new Date(p.fechaVencimiento).toLocaleDateString()}
            </p>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Proveedor</th>
              <th className="p-2 text-left">Concepto</th>
              <th className="p-2 text-right">Monto</th>
              <th className="p-2 text-left">Vencimiento</th>
              <th className="p-2 text-left">Estado</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {pagos.map(p => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="p-2 font-medium">{p.proveedorNombre}</td>
                <td className="p-2 text-xs">{p.concepto}</td>
                <td className="p-2 text-right font-mono">Q{p.monto.toFixed(2)}</td>
                <td className="p-2 text-xs">{new Date(p.fechaVencimiento).toLocaleDateString()}</td>
                <td className="p-2">
                  <select value={p.estado} onChange={e => updatePago(p.id, { estado: e.target.value as PagoProveedor['estado'] })}
                    className={`text-xs px-1 py-0.5 rounded border ${
                      p.estado === 'pagado' ? 'text-green-700 bg-green-50 border-green-200' :
                      p.estado === 'vencido' ? 'text-red-700 bg-red-50 border-red-200' :
                      p.estado === 'cancelado' ? 'text-gray-500 bg-gray-50' :
                      'text-yellow-700 bg-yellow-50 border-yellow-200'
                    }`}>
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                    <option value="vencido">Vencido</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </td>
                <td className="p-2">
                  {p.estado === 'pendiente' && (
                    <button onClick={() => updatePago(p.id, { estado: 'pagado', fechaPago: new Date().toISOString().split('T')[0] })}
                      className="bg-green-500 text-white px-2 py-0.5 rounded text-xs">Pagar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagos.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No hay pagos registrados</p>}
    </div>
  );

  const fc = (field: string) => `w-full px-3 py-2 border rounded text-sm outline-none ${formErrors[field] ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-400'}`;

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b pb-2">
        {[
          { key: 'activos', label: '🔧 Activos' },
          { key: 'cuadros', label: '📊 Cotizaciones' },
          { key: 'pagos', label: '💰 Pagos' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as 'activos' | 'cuadros' | 'pagos')}
            className={`px-4 py-2 rounded-t text-sm font-medium ${
              tab === t.key ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
            }`}>{t.label}</button>
        ))}
      </div>

      {tab === 'activos' && renderActivos()}
      {tab === 'cuadros' && renderCuadros()}
      {tab === 'pagos' && renderPagos()}

      {/* Modal with Zod validation */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => { setShowForm(null); setFormErrors({}); }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-4">
              {showForm === 'activo' && 'Nuevo Activo / Herramienta'}
              {showForm === 'cuadro' && 'Nueva Solicitud de Cotización'}
              {showForm === 'pago' && 'Nuevo Pago a Proveedor'}
            </h3>
            {showForm === 'activo' && (
              <div className="grid gap-3">
                <div>
                  <input placeholder="Nombre del activo *" className={fc('nombre')}
                    value={form.nombre || ''} onChange={e => updateForm('nombre', e.target.value)} />
                  {formErrors.nombre && <p className="text-xs text-red-500 mt-1">{formErrors.nombre}</p>}
                </div>
                <div>
                  <input placeholder="Código de inventario *" className={fc('codigoInventario')}
                    value={form.codigoInventario || ''} onChange={e => updateForm('codigoInventario', e.target.value)} />
                  {formErrors.codigoInventario && <p className="text-xs text-red-500 mt-1">{formErrors.codigoInventario}</p>}
                </div>
                <select className="w-full px-3 py-2 border rounded text-sm"
                  value={form.tipo || 'herramienta'} onChange={e => updateForm('tipo', e.target.value)}>
                  <option value="herramienta">Herramienta</option><option value="equipo">Equipo</option>
                  <option value="vehiculo">Vehículo</option><option value="accesorio">Accesorio</option>
                </select>
                <div>
                  <input placeholder="Valor de adquisición Q *" type="number" className={fc('valorAdquisicion')}
                    value={form.valorAdquisicion || ''} onChange={e => updateForm('valorAdquisicion', e.target.value)} />
                  {formErrors.valorAdquisicion && <p className="text-xs text-red-500 mt-1">{formErrors.valorAdquisicion}</p>}
                </div>
                <button onClick={() => {
                  const result = activoSchema.safeParse(form);
                  if (!result.success) {
                    const errs: Record<string, string> = {};
                    result.error.errors.forEach(e => { errs[e.path[0] as string] = e.message; });
                    setFormErrors(errs);
                    toast.error('Corrige los errores del formulario');
                    return;
                  }
                  addActivo({
                    nombre: result.data.nombre,
                    codigoInventario: result.data.codigoInventario,
                    tipo: result.data.tipo,
                    valorAdquisicion: result.data.valorAdquisicion,
                    estado: 'disponible',
                    fechaAdquisicion: new Date().toISOString().split('T')[0]
                  });
                  setShowForm(null);
                  setFormErrors({});
                  toast.success('Activo creado');
                }} className="bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">Guardar</button>
              </div>
            )}
            {showForm === 'cuadro' && (
              <div className="grid gap-3">
                <div>
                  <input placeholder="Descripción de lo que se cotiza *" className={fc('solicitud')}
                    value={form.solicitud || ''} onChange={e => updateForm('solicitud', e.target.value)} />
                  {formErrors.solicitud && <p className="text-xs text-red-500 mt-1">{formErrors.solicitud}</p>}
                </div>
                <button onClick={() => {
                  const result = cuadroSchema.safeParse(form);
                  if (!result.success) {
                    const errs: Record<string, string> = {};
                    result.error.errors.forEach(e => { errs[e.path[0] as string] = e.message; });
                    setFormErrors(errs);
                    toast.error('Corrige los errores del formulario');
                    return;
                  }
                  addCuadro({
                    solicitud: result.data.solicitud,
                    fechaSolicitud: new Date().toISOString().split('T')[0],
                    estado: 'abierto'
                  });
                  setShowForm(null);
                  setFormErrors({});
                  toast.success('Solicitud creada');
                }} className="bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">Crear Solicitud</button>
              </div>
            )}
            {showForm === 'pago' && (
              <div className="grid gap-3">
                <div>
                  <input placeholder="Nombre del proveedor *" className={fc('proveedorNombre')}
                    value={form.proveedorNombre || ''} onChange={e => updateForm('proveedorNombre', e.target.value)} />
                  {formErrors.proveedorNombre && <p className="text-xs text-red-500 mt-1">{formErrors.proveedorNombre}</p>}
                </div>
                <div>
                  <input placeholder="Concepto *" className={fc('concepto')}
                    value={form.concepto || ''} onChange={e => updateForm('concepto', e.target.value)} />
                  {formErrors.concepto && <p className="text-xs text-red-500 mt-1">{formErrors.concepto}</p>}
                </div>
                <div>
                  <input placeholder="Monto Q *" type="number" className={fc('monto')}
                    value={form.monto || ''} onChange={e => updateForm('monto', e.target.value)} />
                  {formErrors.monto && <p className="text-xs text-red-500 mt-1">{formErrors.monto}</p>}
                </div>
                <div>
                  <input placeholder="Fecha de vencimiento *" type="date" className={fc('fechaVencimiento')}
                    value={form.fechaVencimiento || ''} onChange={e => updateForm('fechaVencimiento', e.target.value)} />
                  {formErrors.fechaVencimiento && <p className="text-xs text-red-500 mt-1">{formErrors.fechaVencimiento}</p>}
                </div>
                <button onClick={() => {
                  const result = pagoSchema.safeParse(form);
                  if (!result.success) {
                    const errs: Record<string, string> = {};
                    result.error.errors.forEach(e => { errs[e.path[0] as string] = e.message; });
                    setFormErrors(errs);
                    toast.error('Corrige los errores del formulario');
                    return;
                  }
                  addPago({
                    proveedorId: uid(),
                    proveedorNombre: result.data.proveedorNombre,
                    concepto: result.data.concepto,
                    monto: result.data.monto,
                    fechaEmision: new Date().toISOString().split('T')[0],
                    fechaVencimiento: result.data.fechaVencimiento,
                    estado: 'pendiente'
                  });
                  setShowForm(null);
                  setFormErrors({});
                  toast.success('Pago creado');
                }} className="bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">Guardar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LogisticaCompras;