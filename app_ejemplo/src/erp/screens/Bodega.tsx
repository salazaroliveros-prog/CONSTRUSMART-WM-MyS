import React, { useMemo } from 'react';
import { useErp } from '../store';
import { fmtQ } from '../utils';
import { Progress, BarChart } from '../components/Charts';
import { Warehouse, Check, X, AlertTriangle, Star } from 'lucide-react';

const Bodega: React.FC = () => {
  const { materiales, updateMaterial, ordenes, updateOrden, proveedores } = useErp();

  const criticos = materiales.filter(m => m.stock < m.stockMinimo);
  const pendientes = ordenes.filter(o => o.estado === 'pendiente');

  // Pareto: valor de inventario
  const pareto = useMemo(() => {
    const sorted = [...materiales].map(m => ({ label: m.nombre.split(' ')[0], value: m.stock * m.precio, color: '#f97316' })).sort((a, b) => b.value - a.value).slice(0, 8);
    return sorted;
  }, [materiales]);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4"><Warehouse className="w-6 h-6 text-cyan-500" /> Bodega, Compras y Proveedores</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"><div className="text-2xl font-bold text-slate-800">{materiales.length}</div><div className="text-xs text-slate-400">Materiales</div></div>
        <div className="bg-red-50 rounded-2xl p-4 border border-red-100"><div className="text-2xl font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="w-5 h-5" />{criticos.length}</div><div className="text-xs text-red-400">Stock Bajo Mínimo</div></div>
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100"><div className="text-2xl font-bold text-amber-600">{pendientes.length}</div><div className="text-xs text-amber-500">OC por Aprobar</div></div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"><div className="text-2xl font-bold text-slate-800">{fmtQ(materiales.reduce((a, m) => a + m.stock * m.precio, 0))}</div><div className="text-xs text-slate-400">Valor Inventario</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-3 border-b border-slate-100"><h3 className="font-bold text-slate-700 text-sm">Control de Stock</h3></div>
          <div className="divide-y divide-slate-50">
            {materiales.map(m => {
              const pct = (m.stock / Math.max(m.stockMinimo * 2, 1)) * 100;
              const bajo = m.stock < m.stockMinimo;
              return (
                <div key={m.id} className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">{m.nombre}</span>
                      {m.critico && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">crítico</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <input type="number" value={m.stock} onChange={e => updateMaterial(m.id, { stock: +e.target.value })} className="w-16 px-2 py-1 rounded border border-slate-200 text-right" />
                      <span className="text-slate-400">{m.unidad}</span>
                    </div>
                  </div>
                  <Progress value={pct} color={bajo ? '#ef4444' : '#10b981'} />
                  <div className="text-[10px] text-slate-400 mt-1">Mínimo: {m.stockMinimo} {m.unidad} {bajo && <span className="text-red-500 font-semibold">· ¡Reabastecer!</span>}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-700 text-sm mb-2">Pareto 80/20 Inventario</h3>
            <BarChart height={150} data={pareto} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-3 border-b border-slate-100"><h3 className="font-bold text-slate-700 text-sm">Órdenes por Aprobar</h3></div>
            <div className="divide-y divide-slate-50 max-h-56 overflow-y-auto">
              {ordenes.map(o => (
                <div key={o.id} className="p-3 text-xs">
                  <div className="flex justify-between"><b className="text-slate-700">{o.material}</b><span className={`px-1.5 py-0.5 rounded-full text-[10px] ${o.estado === 'aprobado' ? 'bg-emerald-50 text-emerald-600' : o.estado === 'rechazado' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'}`}>{o.estado}</span></div>
                  <div className="text-slate-400">{o.proveedor} · {o.cantidad} u · {fmtQ(o.monto)}</div>
                  {o.estado === 'pendiente' && (
                    <div className="flex gap-1 mt-1.5">
                      <button onClick={() => updateOrden(o.id, 'aprobado')} className="flex-1 bg-emerald-500 text-white py-1 rounded flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Aprobar</button>
                      <button onClick={() => updateOrden(o.id, 'rechazado')} className="flex-1 bg-red-500 text-white py-1 rounded flex items-center justify-center gap-1"><X className="w-3 h-3" /> Rechazar</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mt-4">
        <h3 className="font-bold text-slate-700 text-sm mb-3">Proveedores</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {proveedores.map(p => (
            <div key={p.id} className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
              <div><div className="font-semibold text-sm text-slate-700">{p.nombre}</div><div className="text-xs text-slate-400">{p.rubro} · {p.contacto}</div></div>
              <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < p.calificacion ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Bodega;
