import React, { useState } from 'react';
import { useErp } from '../store';
import { fmtQ, factorSalarioReal, FSR_PRESTACIONES } from '../utils';
import { BarChart } from '../components/Charts';
import { Users, Plus, Trash2 } from 'lucide-react';

const RRHH: React.FC = () => {
  const { empleados, addEmpleado, updateEmpleado, deleteEmpleado, proyectos } = useErp();
  const [form, setForm] = useState({ nombre: '', puesto: '', salarioDiario: '', proyectoId: '', tipo: 'planilla' as 'planilla' | 'destajo' });

  const pago = (e: typeof empleados[0]) => e.salarioDiario * e.diasTrabajados;
  const pagoFSR = (e: typeof empleados[0]) => factorSalarioReal(e.salarioDiario) * e.diasTrabajados;
  const totalPlanilla = empleados.reduce((a, e) => a + pago(e), 0);
  const totalFSR = empleados.reduce((a, e) => a + pagoFSR(e), 0);

  const porProyecto = proyectos.map((p, i) => ({
    label: p.nombre.split(' ')[0],
    value: empleados.filter(e => e.proyectoId === p.id).reduce((a, e) => a + pago(e), 0),
    color: ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'][i % 5],
  })).filter(x => x.value > 0);

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre) return;
    addEmpleado({ nombre: form.nombre, puesto: form.puesto, salarioDiario: +form.salarioDiario || 0, proyectoId: form.proyectoId || null, diasTrabajados: 0, tipo: form.tipo });
    setForm({ nombre: '', puesto: '', salarioDiario: '', proyectoId: '', tipo: 'planilla' });
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4"><Users className="w-6 h-6 text-pink-500" /> RRHH y Planillas</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"><div className="text-2xl font-bold text-slate-800">{empleados.length}</div><div className="text-xs text-slate-400">Personal Activo</div></div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"><div className="text-2xl font-bold text-slate-800">{fmtQ(totalPlanilla)}</div><div className="text-xs text-slate-400">Planilla Base</div></div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"><div className="text-2xl font-bold text-orange-600">{fmtQ(totalFSR)}</div><div className="text-xs text-slate-400">Con FSR (+{(FSR_PRESTACIONES*100).toFixed(0)}%)</div></div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"><div className="text-2xl font-bold text-slate-800">{empleados.filter(e => e.tipo === 'destajo').length}</div><div className="text-xs text-slate-400">Destajistas</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-3 border-b border-slate-100"><h3 className="font-bold text-slate-700 text-sm">Planilla Semanal</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[640px]">
              <thead className="bg-slate-50 text-slate-400"><tr><th className="text-left p-2">Empleado</th><th className="p-2">Proyecto</th><th className="p-2">Salario/día</th><th className="p-2">Días</th><th className="p-2">Pago FSR</th><th className="p-2"></th></tr></thead>
              <tbody>
                {empleados.map(e => (
                  <tr key={e.id} className="border-t border-slate-50">
                    <td className="p-2"><div className="font-semibold text-slate-700">{e.nombre}</div><div className="text-slate-400">{e.puesto} · {e.tipo}</div></td>
                    <td className="p-2 text-center text-slate-500">{proyectos.find(p => p.id === e.proyectoId)?.nombre.split(' ')[0] || '-'}</td>
                    <td className="p-2 text-center">{fmtQ(e.salarioDiario)}</td>
                    <td className="p-2 text-center"><input type="number" value={e.diasTrabajados} onChange={ev => updateEmpleado(e.id, { diasTrabajados: +ev.target.value })} className="w-14 px-1 py-0.5 rounded border border-slate-200 text-center" /></td>
                    <td className="p-2 text-center font-bold text-orange-600">{fmtQ(pagoFSR(e))}</td>
                    <td className="p-2"><button onClick={() => deleteEmpleado(e.id)}><Trash2 className="w-3.5 h-3.5 text-slate-300 hover:text-red-500" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-700 text-sm mb-2">Costo MO por Proyecto</h3>
            {porProyecto.length ? <BarChart height={140} data={porProyecto} /> : <p className="text-xs text-slate-400">Sin datos</p>}
          </div>
          <form onSubmit={guardar} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2">
            <h3 className="font-bold text-slate-700 text-sm">Nuevo Empleado</h3>
            <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            <input value={form.puesto} onChange={e => setForm({ ...form, puesto: e.target.value })} placeholder="Puesto" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={form.salarioDiario} onChange={e => setForm({ ...form, salarioDiario: e.target.value })} placeholder="Salario/día" className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as any })} className="px-3 py-2 rounded-lg border border-slate-200 text-sm"><option value="planilla">Planilla</option><option value="destajo">Destajo</option></select>
            </div>
            <select value={form.proyectoId} onChange={e => setForm({ ...form, proyectoId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"><option value="">Sin proyecto</option>{proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select>
            <button type="submit" className="w-full bg-pink-500 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1"><Plus className="w-4 h-4" /> Agregar</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RRHH;
