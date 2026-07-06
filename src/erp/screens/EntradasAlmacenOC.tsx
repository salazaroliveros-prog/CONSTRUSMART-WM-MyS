import React, { useState, useMemo, useEffect } from 'react';
import { Package, CheckCircle, AlertTriangle, ClipboardList } from 'lucide-react';
import { useErp } from '../store';
import { Skeleton } from '@/components/ui/skeleton';
import { z } from 'zod';

const recepcionSchema = z.object({
  cantidad: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
});

export const EntradasAlmacenOC: React.FC = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(false); }, []);
  const { ordenes, updateOrden, recepciones, addRecepcion } = useErp();
  const [ocFilter, setOcFilter] = useState<'todas' | 'pendientes' | 'aprobadas'>('todas');
  const [showForm, setShowForm] = useState<string | null>(null);
  const [formCantidad, setFormCantidad] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const ocFiltradas = useMemo(() => {
    let filtered = ordenes;
    if (ocFilter === 'pendientes') filtered = filtered.filter(o => o.estado === 'pendiente');
    if (ocFilter === 'aprobadas') filtered = filtered.filter(o => o.estado === 'aprobado');
    return filtered;
  }, [ordenes, ocFilter]);

  const handleReception = (ocId: string) => {
    const orden = ordenes.find(o => o.id === ocId);
    if (!orden) return;

    const result = recepcionSchema.safeParse({ cantidad: formCantidad });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(err => { errs[err.path[0] as string] = err.message; });
      setFormErrors(errs);
      return;
    }

    const ocRecs = recsPorOC.get(ocId);
    const totalRecibido = ocRecs?.totalRecibido || 0;
    const saldo = orden.cantidad - totalRecibido;

    if (formCantidad > saldo) {
      setFormErrors({ cantidad: `Cantidad excede el saldo disponible (${saldo})` });
      return;
    }

    setFormErrors({});
    updateOrden(ocId, { estado: 'recibida' });

    const recibidoTotal = formCantidad;
    const diferencia = orden.cantidad - recibidoTotal;

    addRecepcion({
      ocId,
      fecha: new Date().toISOString(),
      cantidadRecibida: formCantidad,
      cantidadOC: orden.cantidad,
      diferencia,
      material: orden.material,
      proveedor: orden.proveedor
    });

    setShowForm(null);
    setFormCantidad(0);
  };

  const historialRecepciones = recepciones;
  const recsPorOC = useMemo(() => {
    const map = new Map<string, { totalRecibido: number }>();
    recepciones.forEach(r => {
      const existing = map.get(r.ocId);
      if (existing) existing.totalRecibido += r.cantidadRecibida;
      else map.set(r.ocId, { totalRecibido: r.cantidadRecibida });
    });
    return map;
  }, [recepciones]);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      {loading && (<div className="space-y-4"><Skeleton className="h-8 w-72" /><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-32 rounded-xl" /></div><Skeleton className="h-64 rounded-2xl" /></div>)}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2"><Package className="w-5 h-5" /> Entradas de Almacén vs Órdenes de Compra</h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['todas', 'pendientes', 'aprobadas'] as const).map(f => (
            <button key={f} onClick={() => setOcFilter(f)}
              className={`px-3 py-1.5 rounded text-xs font-medium ${
                ocFilter === f ? 'bg-card shadow text-blue-700' : 'text-gray-500'
              }`}>
              {f === 'todas' ? 'Todas' : f === 'pendientes' ? 'Pendientes' : 'Aprobadas'}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 self-center">{ocFiltradas.length} OC(s)</span>
      </div>

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
              const ocRecs = recsPorOC.get(oc.id);
              const totalRecibido = ocRecs?.totalRecibido || 0;
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
                      <button onClick={() => { setShowForm(oc.id); setFormCantidad(saldo); setFormErrors({}); }}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                        + Recibir
                      </button>
                    ) : (
                      <span className="text-green-600 text-xs font-bold"><CheckCircle className="w-3 h-3 inline" aria-hidden="true" /> Completa</span>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {totalRecibido > 0 ? (
                      <div className="text-xs">
                        <span className={totalRecibido <= oc.cantidad ? 'text-green-600' : 'text-red-600'}>
                          {totalRecibido}/{oc.cantidad}
                        </span>
                        {totalRecibido > oc.cantidad && (
                          <span className="ml-1 text-red-600 font-bold"><AlertTriangle className="w-3 h-3 inline" aria-hidden="true" /> Excede</span>
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

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-card rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-4">Registrar Recepción</h3>
            <p className="text-sm text-gray-500 mb-3">
              OC: {ordenes.find(o => o.id === showForm)?.material} — {ordenes.find(o => o.id === showForm)?.proveedor}
            </p>
            <div className="grid gap-3">
              <div>
                <label className="text-xs text-gray-500">Cantidad a recibir</label>
                <input type="number" inputMode="decimal" value={formCantidad}
                  onChange={e => { setFormCantidad(+e.target.value); setFormErrors(prev => ({ ...prev, cantidad: '' })); }}
                  max={ordenes.find(o => o.id === showForm)?.cantidad || 0}
                  className="w-full px-3 py-2 border rounded text-sm" />
                {formErrors.cantidad && <p className="text-xs text-red-500 mt-0.5">{formErrors.cantidad}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleReception(showForm)}
                  className="flex-1 bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700">
                  <CheckCircle className="w-4 h-4" aria-hidden="true" /> Confirmar Recepción
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

      {historialRecepciones.length > 0 && (
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">
            <ClipboardList className="w-4 h-4 inline" aria-hidden="true" /> Historial de Recepciones ({historialRecepciones.length})
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
                {historialRecepciones.slice().reverse().map(r => (
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

