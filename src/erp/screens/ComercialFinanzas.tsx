import React, { useState } from 'react';
import { useNuevosModulos } from '../hooks/useNuevosModulos';
import { useErp } from '../store';

const uid = () => Math.random().toString(36).substr(2, 9);

export const ComercialFinanzas: React.FC = () => {
  const { proyectos } = useErp();
  const {
    ventas, addVenta, updateVenta,
    anticipos, addAnticipo, addAmortizacion, updateAnticipo,
    cajasChicas, addCajaChica, updateCajaChica
  } = useNuevosModulos();

  const [tab, setTab] = useState<'ventas' | 'anticipos' | 'cajas'>('ventas');
  const [showForm, setShowForm] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  // ---- VENTAS ----
  const renderVentas = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">🏠 Control de Ventas y Paquetes</h2>
        <button onClick={() => { setShowForm('venta'); setForm({}); }}
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs">+ Nueva Venta</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="p-3 bg-green-50 rounded-lg text-center">
          <p className="text-xs text-green-600">Disponibles</p>
          <p className="text-xl font-bold text-green-700">{ventas.filter(v => v.estado === 'disponible').length}</p>
        </div>
        <div className="p-3 bg-yellow-50 rounded-lg text-center">
          <p className="text-xs text-yellow-600">Reservados</p>
          <p className="text-xl font-bold text-yellow-700">{ventas.filter(v => v.estado === 'reservado').length}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg text-center">
          <p className="text-xs text-blue-600">Vendidos</p>
          <p className="text-xl font-bold text-blue-700">{ventas.filter(v => v.estado === 'vendido').length}</p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg text-center">
          <p className="text-xs text-purple-600">Total Ventas</p>
          <p className="text-xl font-bold text-purple-700">
            Q{ventas.filter(v => v.estado === 'vendido').reduce((a, v) => a + v.precioVenta, 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Identificador</th>
              <th className="p-2 text-left">Tipo</th>
              <th className="p-2 text-right">Precio</th>
              <th className="p-2 text-left">Cliente</th>
              <th className="p-2 text-left">Estado</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {ventas.map(v => (
              <tr key={v.id} className="border-t hover:bg-gray-50">
                <td className="p-2 font-medium">{v.identificador}</td>
                <td className="p-2 text-xs">{v.tipo}</td>
                <td className="p-2 text-right font-mono">Q{v.precioVenta.toLocaleString()}</td>
                <td className="p-2 text-xs">{v.cliente || '—'}</td>
                <td className="p-2">
                  <select value={v.estado} onChange={e => updateVenta(v.id, { estado: e.target.value as any })}
                    className={`text-xs px-1 py-0.5 rounded border ${
                      v.estado === 'disponible' ? 'text-green-700 border-green-200' :
                      v.estado === 'reservado' ? 'text-yellow-700 border-yellow-200' :
                      v.estado === 'vendido' ? 'text-blue-700 border-blue-200' :
                      'text-purple-700 border-purple-200'
                    }`}>
                    <option value="disponible">Disponible</option>
                    <option value="reservado">Reservado</option>
                    <option value="vendido">Vendido</option>
                    <option value="entregado">Entregado</option>
                  </select>
                </td>
                <td className="p-2"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {ventas.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No hay ventas registradas</p>}
    </div>
  );

  // ---- ANTICIPOS ----
  const renderAnticipos = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">💰 Gestión de Anticipos y Amortizaciones</h2>
        <button onClick={() => { setShowForm('anticipo'); setForm({}); }}
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs">+ Nuevo Anticipo</button>
      </div>
      <div className="grid gap-3">
        {anticipos.map(a => {
          const pctAmortizado = a.montoTotal > 0 ? ((a.montoTotal - a.saldoPendiente) / a.montoTotal) * 100 : 0;
          return (
            <div key={a.id} className="border rounded-lg p-3 bg-white">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-semibold">{a.concepto}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                    a.estado === 'activo' ? 'bg-yellow-100 text-yellow-700' :
                    a.estado === 'amortizado' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>{a.estado}</span>
                </div>
                <span className="text-xs text-gray-500">{a.beneficiario}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-mono">Total: Q{a.montoTotal.toFixed(2)}</span>
                <span className="font-mono">Saldo: Q{a.saldoPendiente.toFixed(2)}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 rounded-full h-2" style={{ width: `${pctAmortizado}%` }} />
                </div>
                <span className="text-xs text-gray-500">{pctAmortizado.toFixed(0)}%</span>
              </div>
              {a.estado === 'activo' && (
                <div className="mt-2 flex gap-2">
                  <input type="number" placeholder="Monto a amortizar"
                    className="text-xs px-2 py-1 border rounded w-32"
                    id={`amort-${a.id}`} />
                  <button onClick={() => {
                    const input = document.getElementById(`amort-${a.id}`) as HTMLInputElement;
                    const monto = parseFloat(input?.value || '0');
                    if (monto > 0) {
                      addAmortizacion(a.id, {
                        anticipoId: a.id,
                        monto: Math.min(monto, a.saldoPendiente),
                        fecha: new Date().toISOString().split('T')[0],
                        referencia: 'Amortización manual'
                      });
                      input.value = '';
                    }
                  }} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Amortizar</button>
                </div>
              )}
              {a.amortizaciones.length > 0 && (
                <div className="mt-2 border-t pt-2">
                  <p className="text-xs text-gray-500 mb-1">Historial de amortizaciones:</p>
                  {a.amortizaciones.map(am => (
                    <div key={am.id} className="flex justify-between text-xs text-gray-600">
                      <span>{new Date(am.fecha).toLocaleDateString()}</span>
                      <span className="font-mono">-Q{am.monto.toFixed(2)}</span>
                      {am.referencia && <span className="text-gray-400">{am.referencia}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {anticipos.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No hay anticipos registrados</p>}
    </div>
  );

  // ---- CAJAS CHICAS ----
  const renderCajas = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">💵 Cajas Chicas de Obra</h2>
        <button onClick={() => { setShowForm('caja'); setForm({}); }}
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs">+ Nuevo Gasto</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="p-3 bg-yellow-50 rounded-lg text-center">
          <p className="text-xs text-yellow-600">Pendientes Aprobación</p>
          <p className="text-xl font-bold text-yellow-700">{cajasChicas.filter(c => c.estado === 'pendiente').length}</p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg text-center">
          <p className="text-xs text-green-600">Aprobados</p>
          <p className="text-xl font-bold text-green-700">{cajasChicas.filter(c => c.estado === 'aprobada').length}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg text-center">
          <p className="text-xs text-blue-600">Total Aprobado</p>
          <p className="text-xl font-bold text-blue-700">
            Q{cajasChicas.filter(c => c.estado === 'aprobada').reduce((a, c) => a + c.monto, 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Descripción</th>
              <th className="p-2 text-left">Categoría</th>
              <th className="p-2 text-right">Monto</th>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-left">Solicitante</th>
              <th className="p-2 text-left">Estado</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {cajasChicas.map(c => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="p-2 text-xs">{c.descripcion}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    c.categoria === 'materiales' ? 'bg-blue-100 text-blue-700' :
                    c.categoria === 'herramientas' ? 'bg-purple-100' :
                    c.categoria === 'transporte' ? 'bg-orange-100 text-orange-700' :
                    c.categoria === 'comidas' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                  }`}>{c.categoria}</span>
                </td>
                <td className="p-2 text-right font-mono">Q{c.monto.toFixed(2)}</td>
                <td className="p-2 text-xs">{new Date(c.fechaGasto).toLocaleDateString()}</td>
                <td className="p-2 text-xs">{c.solicitante}</td>
                <td className="p-2">
                  <select value={c.estado} onChange={e => updateCajaChica(c.id, {
                    estado: e.target.value as any,
                    aprobadoPor: e.target.value === 'aprobada' ? 'Admin' : undefined,
                    fechaAprobacion: e.target.value === 'aprobada' ? new Date().toISOString() : undefined
                  })}
                    className={`text-xs px-1 py-0.5 rounded border ${
                      c.estado === 'aprobada' ? 'text-green-700 border-green-200' :
                      c.estado === 'rechazada' ? 'text-red-700 border-red-200' : 'text-yellow-700 border-yellow-200'
                    }`}>
                    <option value="pendiente">Pendiente</option>
                    <option value="aprobada">Aprobada</option>
                    <option value="rechazada">Rechazada</option>
                  </select>
                </td>
                <td className="p-2"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {cajasChicas.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No hay gastos de caja chica</p>}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b pb-2">
        {[
          { key: 'ventas', label: '🏠 Ventas' },
          { key: 'anticipos', label: '💰 Anticipos' },
          { key: 'cajas', label: '💵 Cajas Chicas' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-t text-sm font-medium ${
              tab === t.key ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
            }`}>{t.label}</button>
        ))}
      </div>

      {tab === 'ventas' && renderVentas()}
      {tab === 'anticipos' && renderAnticipos()}
      {tab === 'cajas' && renderCajas()}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowForm(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-4">
              {showForm === 'venta' && 'Nueva Venta / Paquete'}
              {showForm === 'anticipo' && 'Nuevo Anticipo'}
              {showForm === 'caja' && 'Nuevo Gasto de Caja Chica'}
            </h3>
            {showForm === 'venta' && (
              <div className="grid gap-3">
                <select className="w-full px-3 py-2 border rounded text-sm" value={form.proyectoId || ''}
                  onChange={e => setForm({ ...form, proyectoId: e.target.value })}>
                  <option value="">Seleccionar proyecto</option>
                  {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <select className="w-full px-3 py-2 border rounded text-sm" value={form.tipo || 'unidad'}
                  onChange={e => setForm({ ...form, tipo: e.target.value })}>
                  <option value="unidad">Unidad</option><option value="lote">Lote</option><option value="paquete">Paquete</option>
                </select>
                <input placeholder="Identificador (ej: Torre A - Apt 301)"
                  className="w-full px-3 py-2 border rounded text-sm" value={form.identificador || ''}
                  onChange={e => setForm({ ...form, identificador: e.target.value })} />
                <input placeholder="Precio de venta Q" type="number" className="w-full px-3 py-2 border rounded text-sm"
                  value={form.precioVenta || ''} onChange={e => setForm({ ...form, precioVenta: +e.target.value })} />
                <input placeholder="Cliente (opcional)" className="w-full px-3 py-2 border rounded text-sm"
                  value={form.cliente || ''} onChange={e => setForm({ ...form, cliente: e.target.value })} />
                <button onClick={() => {
                  addVenta({
                    proyectoId: form.proyectoId || 'p1',
                    tipo: form.tipo || 'unidad',
                    identificador: form.identificador || 'Nueva unidad',
                    precioVenta: form.precioVenta || 0,
                    precioContrato: form.precioVenta || 0,
                    estado: 'disponible',
                    cliente: form.cliente || undefined
                  });
                  setShowForm(null);
                }} className="bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">Guardar</button>
              </div>
            )}
            {showForm === 'anticipo' && (
              <div className="grid gap-3">
                <select className="w-full px-3 py-2 border rounded text-sm" value={form.proyectoId || ''}
                  onChange={e => setForm({ ...form, proyectoId: e.target.value })}>
                  <option value="">Seleccionar proyecto</option>
                  {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <select className="w-full px-3 py-2 border rounded text-sm" value={form.tipo || 'proveedor'}
                  onChange={e => setForm({ ...form, tipo: e.target.value })}>
                  <option value="cliente">Cliente</option><option value="proveedor">Proveedor</option>
                  <option value="empleado">Empleado</option>
                </select>
                <input placeholder="Beneficiario" className="w-full px-3 py-2 border rounded text-sm"
                  value={form.beneficiario || ''} onChange={e => setForm({ ...form, beneficiario: e.target.value })} />
                <input placeholder="Concepto" className="w-full px-3 py-2 border rounded text-sm"
                  value={form.concepto || ''} onChange={e => setForm({ ...form, concepto: e.target.value })} />
                <input placeholder="Monto total Q" type="number" className="w-full px-3 py-2 border rounded text-sm"
                  value={form.montoTotal || ''} onChange={e => setForm({ ...form, montoTotal: +e.target.value })} />
                <button onClick={() => {
                  const monto = form.montoTotal || 0;
                  addAnticipo({
                    proyectoId: form.proyectoId || 'p1',
                    montoTotal: monto,
                    saldoPendiente: monto,
                    tipo: form.tipo || 'proveedor',
                    beneficiario: form.beneficiario || 'Beneficiario',
                    concepto: form.concepto || 'Anticipo',
                    fechaEntrega: new Date().toISOString().split('T')[0],
                    estado: 'activo'
                  });
                  setShowForm(null);
                }} className="bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">Guardar</button>
              </div>
            )}
            {showForm === 'caja' && (
              <div className="grid gap-3">
                <input placeholder="Descripción del gasto" className="w-full px-3 py-2 border rounded text-sm"
                  value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                <select className="w-full px-3 py-2 border rounded text-sm" value={form.categoria || 'materiales'}
                  onChange={e => setForm({ ...form, categoria: e.target.value })}>
                  <option value="materiales">Materiales</option><option value="herramientas">Herramientas</option>
                  <option value="transporte">Transporte</option><option value="comidas">Comidas</option>
                  <option value="otros">Otros</option>
                </select>
                <input placeholder="Monto Q" type="number" className="w-full px-3 py-2 border rounded text-sm"
                  value={form.monto || ''} onChange={e => setForm({ ...form, monto: +e.target.value })} />
                <input placeholder="Solicitante" className="w-full px-3 py-2 border rounded text-sm"
                  value={form.solicitante || ''} onChange={e => setForm({ ...form, solicitante: e.target.value })} />
                <button onClick={() => {
                  addCajaChica({
                    proyectoId: form.proyectoId || 'p1',
                    monto: form.monto || 0,
                    descripcion: form.descripcion || 'Gasto',
                    categoria: form.categoria || 'materiales',
                    fechaGasto: new Date().toISOString().split('T')[0],
                    solicitante: form.solicitante || 'Usuario',
                    estado: 'pendiente'
                  });
                  setShowForm(null);
                }} className="bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">Guardar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComercialFinanzas;