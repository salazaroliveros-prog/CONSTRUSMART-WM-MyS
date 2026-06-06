import React, { useMemo, useState } from 'react';
import { useErp } from '../store';
import { fmtQ, CATEGORIA_LABEL, fmtPct } from '../utils';
import { AreaChart, Donut } from '../components/Charts';
import MovimientoForm from '../components/MovimientoForm';
import { Wallet, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#fbbf24', '#ec4899', '#14b8a6', '#a855f7', '#f43f5e'];

const Financiero: React.FC = () => {
  const { movimientos, deleteMovimiento, proyectos } = useErp();
  const [filtro, setFiltro] = useState<'todos' | 'ingreso' | 'gasto'>('todos');

  const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((a, b) => a + b.costoTotal, 0);
  const gastos = movimientos.filter(m => m.tipo === 'gasto').reduce((a, b) => a + b.costoTotal, 0);
  const utilidad = ingresos - gastos;

  const porCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    movimientos.filter(m => m.tipo === 'gasto').forEach(m => { map[m.categoria] = (map[m.categoria] || 0) + m.costoTotal; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([k, v], i) => ({ label: CATEGORIA_LABEL[k as keyof typeof CATEGORIA_LABEL], value: v, color: COLORS[i % COLORS.length] }));
  }, [movimientos]);

  const centrosCosto = useMemo(() => proyectos.map(p => {
    const ing = movimientos.filter(m => m.proyectoId === p.id && m.tipo === 'ingreso').reduce((a, b) => a + b.costoTotal, 0);
    const gas = movimientos.filter(m => m.proyectoId === p.id && m.tipo === 'gasto').reduce((a, b) => a + b.costoTotal, 0);
    return { nombre: p.nombre, ing, gas, margen: ing - gas };
  }), [proyectos, movimientos]);

  const cashFlow = { ingresos: [ingresos * 0.3, ingresos * 0.55, ingresos], egresos: [gastos * 0.35, gastos * 0.6, gastos] };
  const lista = movimientos.filter(m => filtro === 'todos' || m.tipo === filtro);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4"><Wallet className="w-6 h-6 text-violet-500" /> Control Financiero y Caja</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-emerald-500 text-white rounded-2xl p-4"><TrendingUp className="w-5 h-5 mb-2" /><div className="text-2xl font-bold">{fmtQ(ingresos)}</div><div className="text-xs opacity-80">Ingresos Totales</div></div>
        <div className="bg-red-500 text-white rounded-2xl p-4"><TrendingDown className="w-5 h-5 mb-2" /><div className="text-2xl font-bold">{fmtQ(gastos)}</div><div className="text-xs opacity-80">Gastos Totales</div></div>
        <div className={`${utilidad >= 0 ? 'bg-slate-900' : 'bg-red-700'} text-white rounded-2xl p-4`}><Wallet className="w-5 h-5 mb-2" /><div className="text-2xl font-bold">{fmtQ(utilidad)}</div><div className="text-xs opacity-80">Utilidad Neta</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-700 text-sm mb-2">Flujo de Caja Proyectado (30/60/90 días)</h3>
          <AreaChart labels={['30 días', '60 días', '90 días']} series={[
            { label: 'Ingresos', color: '#10b981', data: cashFlow.ingresos },
            { label: 'Egresos', color: '#ef4444', data: cashFlow.egresos },
          ]} />
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-700 text-sm mb-2">Gastos por Categoría</h3>
          <div className="flex items-center gap-3">
            <Donut size={110} data={porCategoria.length ? porCategoria : [{ label: '-', value: 1, color: '#e2e8f0' }]} />
            <div className="text-[11px] space-y-1 flex-1 max-h-32 overflow-y-auto">
              {porCategoria.map(c => <div key={c.label} className="flex items-center gap-1 justify-between"><span className="flex items-center gap-1 truncate"><span className="w-2 h-2 rounded-full" style={{ background: c.color }} />{c.label}</span><b className="text-slate-600">{fmtQ(c.value)}</b></div>)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-700 text-sm">Movimientos</h3>
              <div className="flex gap-1">
                {(['todos', 'ingreso', 'gasto'] as const).map(f => (
                  <button key={f} onClick={() => setFiltro(f)} className={`text-xs px-2.5 py-1 rounded-lg capitalize ${filtro === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>{f}</button>
                ))}
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <tbody>
                  {lista.map(m => (
                    <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-2"><div className="font-semibold text-slate-700">{m.descripcion}</div><div className="text-slate-400">{CATEGORIA_LABEL[m.categoria]} · {proyectos.find(p => p.id === m.proyectoId)?.nombre || 'Operativo'} · {m.fecha}</div></td>
                      <td className={`p-2 text-right font-bold ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-500'}`}>{m.tipo === 'ingreso' ? '+' : '-'}{fmtQ(m.costoTotal)}</td>
                      <td className="p-2 w-8"><button onClick={() => deleteMovimiento(m.id)}><Trash2 className="w-3.5 h-3.5 text-slate-300 hover:text-red-500" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mt-4 p-4">
            <h3 className="font-bold text-slate-700 text-sm mb-2">Utilidad Neta por Centro de Costo</h3>
            <table className="w-full text-xs">
              <thead className="text-slate-400"><tr><th className="text-left pb-1">Proyecto</th><th className="text-right">Ingresos</th><th className="text-right">Egresos</th><th className="text-right">Margen</th></tr></thead>
              <tbody>
                {centrosCosto.map(c => (
                  <tr key={c.nombre} className="border-t border-slate-50"><td className="py-1.5 text-slate-600">{c.nombre}</td><td className="text-right text-emerald-600">{fmtQ(c.ing)}</td><td className="text-right text-red-500">{fmtQ(c.gas)}</td><td className={`text-right font-bold ${c.margen >= 0 ? 'text-slate-700' : 'text-red-600'}`}>{fmtQ(c.margen)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-slate-700 text-sm mb-2">Registrar Movimiento</h3>
          <MovimientoForm compact />
        </div>
      </div>
    </div>
  );
};

export default Financiero;
