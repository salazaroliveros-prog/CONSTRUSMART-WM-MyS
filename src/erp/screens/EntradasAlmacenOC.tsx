import React, { useState, useMemo } from 'react';
import { useErp } from '../store';
import RecepcionMateriales from '../components/RecepcionMateriales';

export const EntradasAlmacenOC: React.FC = () => {
  const { ordenes, materiales, updateMaterial, updateOrden } = useErp();
  const [ocFilter, setOcFilter] = useState<'todas' | 'pendientes' | 'aprobadas'>('todas');
  const [showForm, setShowForm] = useState<string | null>(null);
  const [formCantidad, setFormCantidad] = useState(0);
  const [recepciones, setRecepciones] = useState<any[]>([]);

  const ocFiltradas = useMemo(() => {
    let filtered = ordenes;
    if (ocFilter === 'pendientes') filtered = filtered.filter(o => o.estado === 'pendiente');
    if (ocFilter === 'aprobadas') filtered = filtered.filter(o => o.estado === 'aprobada');
    return filtered;
  }, [ordenes, ocFilter]);

  const handleReception = (ocId: string) => {
    const orden = ordenes.find(o => o.id === ocId);
    if (!orden) return;

    const cantidad = recepciones[ocId] || 0;
    if (cantidad <= 0) return;

    // Actualizar stock de materiales - matching exacto primero, luego por ID, luego fuzzy
    const materialNombre = orden.material?.toLowerCase() || '';
    const material =
      materiales.find(m => m.nombre.toLowerCase() === materialNombre) ||
      materiales.find(m => m.id === materialNombre || m.codigo === materialNombre) ||
      materiales.find(m =>
        m.nombre.toLowerCase().includes(materialNombre) ||
        materialNombre.includes(m.nombre.toLowerCase().split(' ')[0].toLowerCase())
      );

    if (material) {
      updateMaterial(material.id, {
        stock: material.stock + cantidad
      });
    }

    updateOrden(ocId, 'recibida');

    // Actualizar estado de OC
    const recibidoTotal = cantidad;
    const diferencia = orden.cantidad - recibidoTotal;

    // Registrar recepción en store
    const nuevaRecepcion = {
      id: Date.now().toString(),
      ocId,
      fecha: new Date().toISOString(),
      cantidadRecibida: cantidad,
      cantidadOC: orden.cantidad,
      diferencia,
      material: orden.material,
      proveedor: orden.proveedor
    };
    setRecepciones(prev => [...prev, nuevaRecepcion]);

    setShowForm(null);
    setFormCantidad(0);
  };

  const historialRecepciones = recepciones;

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">📦 Entradas de Almacén vs Órdenes de Compra</h1>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['todas', 'pendientes', 'aprobadas'] as const).map(f => (
            <button key={f} onClick={() => setOcFilter(f)}
              className={`px-3 py-1.5 rounded text-xs font-medium ${
                ocFilter === f ? 'bg-white shadow text-blue-700' : 'text-gray-500'
              }`}>
              {f === 'todas' ? 'Todas' : f === 'pendientes' ? 'Pendientes' : 'Aprobadas'}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 self-center">{ocFiltradas.length} OC(s)</span>
      </div>

      {/* Tabla de OC */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Proveedor</th>
              <th className="p-2 text-left">Material</th>
              <th className="p-2 text-right">Cantidad OC</th>
              <th className="p-2 text-right">Monto</th>
              <th className="p-2 text-left">Estado</th>
              <th className="p-2 text-right">Recibir</th>
              <th className="p-2 text-right">Validación</th>
            </tr>
          </thead>
          <tbody>
            {ocFiltradas.map(oc => {
              // Calcular total recibido
              const recs = historialRecepciones.filter((r: any) => r.ocId === oc.id);
              const totalRecibido = recs.reduce((a: number, r: any) => a + r.cantidadRecibida, 0);
              const saldo = oc.cantidad - totalRecibido;
              const completada = saldo <= 0;

              return (
                <tr key={oc.id} className={`border-t ${completada ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                  <td className="p-2 font-medium">{oc.proveedor}</td>
                  <td className="p-2">{oc.material}</td>
                  <td className="p-2 text-right font-mono">{oc.cantidad}</td>
                  <td className="p-2 text-right font-mono">Q{oc.monto.toLocaleString()}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      oc.estado === 'aprobado' ? 'bg-green-100 text-green-700' :
                      oc.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                      oc.estado === 'recibida' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>{oc.estado}</span>
                  </td>
                  <td className="p-2 text-right">
                    {saldo > 0 ? (
                      <button onClick={() => { setShowForm(oc.id); setFormCantidad(saldo); }}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                        + Recibir
                      </button>
                    ) : (
                      <span className="text-green-600 text-xs font-bold">✅ Completa</span>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {totalRecibido > 0 ? (
                      <div className="text-xs">
                        <span className={totalRecibido <= oc.cantidad ? 'text-green-600' : 'text-red-600'}>
                          {totalRecibido}/{oc.cantidad}
                        </span>
                        {totalRecibido > oc.cantidad && (
                          <span className="ml-1 text-red-600 font-bold">⚠️ Excede</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de recepción */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-4">Registrar Recepción</h3>
            <p className="text-sm text-gray-500 mb-3">
              OC: {ordenes.find(o => o.id === showForm)?.material} — {ordenes.find(o => o.id === showForm)?.proveedor}
            </p>
            <div className="grid gap-3">
              <div>
                <label className="text-xs text-gray-500">Cantidad a recibir</label>
                <input type="number" value={formCantidad}
                  onChange={e => setFormCantidad(+e.target.value)}
                  max={ordenes.find(o => o.id === showForm)?.cantidad || 0}
                  className="w-full px-3 py-2 border rounded text-sm" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleReception(showForm)}
                  className="flex-1 bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700">
                  ✅ Confirmar Recepción
                </button>
                <button onClick={() => setShowForm(null)}
                  className="px-4 py-2 border rounded text-sm hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historial de recepciones */}
      {historialRecepciones.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">
            📋 Historial de Recepciones ({historialRecepciones.length})
          </h3>
          <div className="overflow-x-auto max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="p-2 text-left text-xs">Fecha</th>
                  <th className="p-2 text-left text-xs">Proveedor</th>
                  <th className="p-2 text-left text-xs">Material</th>
                  <th className="p-2 text-right text-xs">Recibido</th>
                  <th className="p-2 text-right text-xs">OC</th>
                  <th className="p-2 text-right text-xs">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {historialRecepciones.slice().reverse().map((r: any) => (
                  <tr key={r.id} className={`border-t ${r.diferencia < 0 ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <td className="p-2 text-xs">{new Date(r.fecha).toLocaleDateString()}</td>
                    <td className="p-2 text-xs">{r.proveedor}</td>
                    <td className="p-2 text-xs">{r.material}</td>
                    <td className="p-2 text-right font-mono text-xs">{r.cantidadRecibida}</td>
                    <td className="p-2 text-right font-mono text-xs">{r.cantidadOC}</td>
                    <td className={`p-2 text-right font-mono text-xs ${r.diferencia < 0 ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                      {r.diferencia > 0 ? `Faltan: ${r.diferencia}` : r.diferencia === 0 ? '0' : r.diferencia}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {ocFiltradas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">No hay órdenes de compra para validar.</p>
        </div>
      )}
    </div>
  );
};

export default EntradasAlmacenOC;