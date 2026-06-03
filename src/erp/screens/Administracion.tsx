import React, { useState } from 'react';
import { useNuevosModulos } from '../hooks/useNuevosModulos';
import { useErp } from '../store';

export const Administracion: React.FC = () => {
  const { proyectos } = useErp();
  const {
    centrosCosto, addCentroCosto, updateCentroCosto,
    logs, validarPrecioSubrenglon
  } = useNuevosModulos();

  const [tab, setTab] = useState<'centros' | 'logs' | 'validacion'>('centros');
  const [showForm, setShowForm] = useState(false);

  // ---- CENTROS DE COSTO ----
  const renderCentros = () => {
    const totalPresupuesto = centrosCosto.reduce((a, c) => a + c.presupuestoAsignado, 0);
    const totalGasto = centrosCosto.reduce((a, c) => a + c.gastoActual, 0);
    const pctEjecucion = totalPresupuesto > 0 ? (totalGasto / totalPresupuesto) * 100 : 0;

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">🏢 Centros de Costo</h2>
          <button onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs">+ Nuevo Centro</button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <p className="text-xs text-blue-600">Centros</p>
            <p className="text-xl font-bold text-blue-700">{centrosCosto.length}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <p className="text-xs text-green-600">Presupuesto</p>
            <p className="text-xl font-bold text-green-700">Q{totalPresupuesto.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg text-center">
            <p className="text-xs text-orange-600">Gasto Actual</p>
            <p className="text-xl font-bold text-orange-700">Q{totalGasto.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-center">
            <p className="text-xs text-purple-600">Ejecución</p>
            <p className="text-xl font-bold text-purple-700">{pctEjecucion.toFixed(1)}%</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Código</th>
                <th className="p-2 text-left">Nombre</th>
                <th className="p-2 text-left">Tipo</th>
                <th className="p-2 text-right">Presupuesto</th>
                <th className="p-2 text-right">Gasto Actual</th>
                <th className="p-2 text-right">% Ejecución</th>
              </tr>
            </thead>
            <tbody>
              {centrosCosto.map(c => {
                const pct = c.presupuestoAsignado > 0 ? (c.gastoActual / c.presupuestoAsignado) * 100 : 0;
                const alerta = pct > 90;
                return (
                  <tr key={c.id} className={`border-t ${alerta ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <td className="p-2 font-mono text-xs">{c.codigo}</td>
                    <td className="p-2">{c.nombre}</td>
                    <td className="p-2 text-xs">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        c.tipo === 'directo' ? 'bg-blue-100 text-blue-700' :
                        c.tipo === 'indirecto' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                      }`}>{c.tipo}</span>
                    </td>
                    <td className="p-2 text-right font-mono">Q{c.presupuestoAsignado.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono">Q{c.gastoActual.toLocaleString()}</td>
                    <td className="p-2 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-20 bg-gray-200 rounded-full h-1.5">
                          <div className={`rounded-full h-1.5 ${alerta ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${alerta ? 'text-red-600' : 'text-gray-600'}`}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {centrosCosto.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No hay centros de costo configurados</p>}
      </div>
    );
  };

  // ---- LOGS DE AUDITORÍA ----
  const renderLogs = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">📋 Logs de Auditoría</h2>
        <span className="text-xs text-gray-500">Últimos 500 registros (imborrables)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-left">Usuario</th>
              <th className="p-2 text-left">Acción</th>
              <th className="p-2 text-left">Entidad</th>
              <th className="p-2 text-left">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {logs.slice(0, 100).map(l => (
              <tr key={l.id} className="border-t hover:bg-gray-50">
                <td className="p-2 text-xs">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="p-2 text-xs">{l.usuarioNombre}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    l.accion === 'UPDATE' ? 'bg-yellow-100 text-yellow-700' :
                    l.accion === 'DELETE' ? 'bg-red-100 text-red-700' :
                    l.accion === 'CREATE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>{l.accion}</span>
                </td>
                <td className="p-2 text-xs font-mono">{l.entidad}</td>
                <td className="p-2 text-xs text-gray-500 max-w-xs truncate">
                  {l.valoresNuevos ? JSON.stringify(l.valoresNuevos).slice(0, 80) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {logs.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No hay registros de auditoría</p>}
    </div>
  );

  // ---- VALIDACIÓN DE PRECIOS ----
  const renderValidacion = () => (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold">✅ Validación de Precios en Sub-Renglones</h2>
        <p className="text-sm text-gray-500 mt-1">Verifica precios de materiales ingresados en sub-renglones</p>
      </div>
      <div className="grid gap-3 max-w-lg">
        {[
          { nombre: 'Cemento UGC', precio: 92, esperado: '✅ OK' },
          { nombre: 'Arena de río', precio: 145, esperado: '✅ OK' },
          { nombre: 'Material sin precio', precio: 0, esperado: '⚠️ Alerta' },
          { nombre: 'Material negativo', precio: -50, esperado: '⚠️ Alerta' },
          { nombre: 'Acero premium', precio: 15000, esperado: '⚠️ Alerta' },
        ].map((item, i) => {
          const alerta = validarPrecioSubrenglon(item.precio, item.nombre);
          return (
            <div key={i} className={`p-3 rounded-lg border ${
              alerta ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">{item.nombre}</span>
                <span className={`font-mono text-sm ${alerta ? 'text-red-600' : 'text-green-600'}`}>
                  Q{item.precio.toFixed(2)}
                </span>
              </div>
              {alerta && (
                <p className="text-xs text-red-600 mt-1">{alerta}</p>
              )}
              {!alerta && (
                <p className="text-xs text-green-600 mt-1">✅ Precio válido</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b pb-2">
        {[
          { key: 'centros', label: '🏢 Centros Costo' },
          { key: 'logs', label: '📋 Auditoría' },
          { key: 'validacion', label: '✅ Validación Precios' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-t text-sm font-medium ${
              tab === t.key ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
            }`}>{t.label}</button>
        ))}
      </div>

      {tab === 'centros' && renderCentros()}
      {tab === 'logs' && renderLogs()}
      {tab === 'validacion' && renderValidacion()}

      {/* Modal Centro Costo */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-4">Nuevo Centro de Costo</h3>
            <div className="grid gap-3">
              <select className="w-full px-3 py-2 border rounded text-sm" id="cc-proyecto">
                <option value="">Seleccionar proyecto</option>
                {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <input placeholder="Código (ej: CC-001)" className="w-full px-3 py-2 border rounded text-sm" id="cc-codigo" />
              <input placeholder="Nombre" className="w-full px-3 py-2 border rounded text-sm" id="cc-nombre" />
              <input placeholder="Presupuesto asignado Q" type="number" className="w-full px-3 py-2 border rounded text-sm" id="cc-presupuesto" />
              <select className="w-full px-3 py-2 border rounded text-sm" id="cc-tipo">
                <option value="directo">Directo</option>
                <option value="indirecto">Indirecto</option>
                <option value="administrativo">Administrativo</option>
              </select>
              <button onClick={() => {
                const sel = document.getElementById('cc-proyecto') as HTMLSelectElement;
                const cod = document.getElementById('cc-codigo') as HTMLInputElement;
                const nom = document.getElementById('cc-nombre') as HTMLInputElement;
                const pre = document.getElementById('cc-presupuesto') as HTMLInputElement;
                const tipo = document.getElementById('cc-tipo') as HTMLSelectElement;
                addCentroCosto({
                  proyectoId: sel?.value || 'p1',
                  codigo: cod?.value || `CC-${String(centrosCosto.length + 1).padStart(3, '0')}`,
                  nombre: nom?.value || 'Nuevo centro',
                  presupuestoAsignado: parseFloat(pre?.value || '0'),
                  gastoActual: 0,
                  tipo: (tipo?.value as any) || 'directo'
                });
                setShowForm(false);
              }} className="bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Administracion;