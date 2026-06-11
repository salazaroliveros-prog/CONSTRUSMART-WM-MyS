import React, { useState } from 'react';
import { useErp } from '../store';
import { CuentaCobrar } from '../types';
import ProyectoFilter from '../components/ProyectoFilter';
import { DollarSign, Plus, X, TrendingUp, CalendarDays, AlertTriangle } from 'lucide-react';
import { INPUT } from '../ui';
import { toast } from 'sonner';
import { todayISO, fmtQ } from '../utils';

const CuentasCobrarScreen: React.FC = () => {
  const { proyectos, cuentasCobrar, addCuentaCobrar, updateCuentaCobrar, deleteCuentaCobrar } = useErp();
  const [showForm, setShowForm] = useState(false);
  const [filtroProyecto, setFiltroProyecto] = useState('');
  const [form, setForm] = useState({ proyectoId: '', cliente: '', concepto: '', monto: 0, fechaEmision: todayISO(), fechaVencimiento: '', notas: '' });

  const agregar = () => {
    if (!form.cliente || !form.concepto || form.monto <= 0) { toast.error('Cliente, concepto y monto requeridos'); return; }
    addCuentaCobrar({
      proyectoId: form.proyectoId, cliente: form.cliente, concepto: form.concepto,
      monto: form.monto, saldoPendiente: form.monto, fechaEmision: form.fechaEmision,
      fechaVencimiento: form.fechaVencimiento, estado: 'pendiente', notas: form.notas || undefined,
    });
    toast.success('Cuenta por cobrar registrada');
    setShowForm(false); setForm({ proyectoId: '', cliente: '', concepto: '', monto: 0, fechaEmision: todayISO(), fechaVencimiento: '', notas: '' });
  };

  const cobrar = (id: string) => {
    updateCuentaCobrar(id, { estado: 'cobrado', fechaCobro: todayISO(), saldoPendiente: 0 });
    toast.success('Cobro registrado');
  };

  const eliminar = (id: string) => { if (confirm('¿Eliminar?')) deleteCuentaCobrar(id); };

  const filtradas = filtroProyecto ? cuentasCobrar.filter(c => c.proyectoId === filtroProyecto) : cuentasCobrar;
  const pendientes = filtradas.filter(c => c.estado === 'pendiente' || c.estado === 'parcial' || c.estado === 'vencido');
  const vencidos = filtradas.filter(c => c.estado === 'vencido' || (c.estado === 'pendiente' && c.fechaVencimiento < todayISO()));
  const totalPendiente = pendientes.reduce((a, c) => a + c.saldoPendiente, 0);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><DollarSign className="w-6 h-6 text-emerald-500" /> Cuentas por Cobrar</h1><p className="text-sm text-slate-400">Gestión de cuentas por cobrar a clientes</p></div>
        <div className="flex items-center gap-2">
          <ProyectoFilter value={filtroProyecto} onChange={setFiltroProyecto} proyectos={proyectos} />
          <button onClick={() => setShowForm(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Nueva Cuenta</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 border border-slate-100"><div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-500" /><span className="text-xs text-slate-500">Total por cobrar</span></div><div className="text-xl font-bold text-emerald-600">{fmtQ(totalPendiente)}</div></div>
        <div className="bg-white rounded-xl p-3 border border-slate-100"><div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /><span className="text-xs text-slate-500">Pendientes</span></div><div className="text-xl font-bold text-slate-800">{pendientes.length}</div></div>
        <div className="bg-white rounded-xl p-3 border border-slate-100"><div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-amber-500" /><span className="text-xs text-slate-500">Cobradas</span></div><div className="text-xl font-bold text-amber-600">{filtradas.filter(c => c.estado === 'cobrado').length}</div></div>
        <div className={`rounded-xl p-3 border ${vencidos.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}><div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-xs text-slate-500">Vencidas</span></div><div className="text-xl font-bold text-red-600">{vencidos.length}</div></div>
      </div>
      {showForm && (
        <div className="bg-emerald-50 rounded-xl p-4 mb-4 border border-emerald-200 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input value={form.cliente} onChange={e => setForm(prev => ({ ...prev, cliente: e.target.value }))} placeholder="Nombre del cliente *" className={INPUT} />
            <input value={form.concepto} onChange={e => setForm(prev => ({ ...prev, concepto: e.target.value }))} placeholder="Concepto *" className={INPUT} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input type="number" value={form.monto ?? ''} onChange={e => setForm(prev => ({ ...prev, monto: +e.target.value }))} placeholder="Monto Q *" className={INPUT} />
            <input type="date" value={form.fechaEmision} onChange={e => setForm(prev => ({ ...prev, fechaEmision: e.target.value }))} className={INPUT} />
            <input type="date" value={form.fechaVencimiento} onChange={e => setForm(prev => ({ ...prev, fechaVencimiento: e.target.value }))} placeholder="Fecha vencimiento" className={INPUT} />
          </div>
          <select value={form.proyectoId} onChange={e => setForm(prev => ({ ...prev, proyectoId: e.target.value }))} className={INPUT}><option value="">Sin proyecto</option>{proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select>
          <input value={form.notas} onChange={e => setForm(prev => ({ ...prev, notas: e.target.value }))} placeholder="Notas" className={INPUT} />
          <div className="flex gap-2"><button onClick={agregar} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-xs font-semibold">Registrar</button><button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-600">Cancelar</button></div>
        </div>
      )}
      <div className="space-y-2">
        {filtradas.length === 0 ? <div className="text-center py-10 text-slate-400"><DollarSign className="w-10 h-10 mx-auto mb-2 text-slate-300" /><p className="text-sm">Sin cuentas por cobrar</p></div>
        : [...filtradas].sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento)).map(c => {
          const vencida = c.estado === 'pendiente' && c.fechaVencimiento < todayISO();
          return (
            <div key={c.id} className={`bg-white rounded-xl border p-4 ${c.estado === 'cobrado' ? 'border-emerald-200 bg-emerald-50/30' : vencida ? 'border-red-200 bg-red-50/30' : 'border-slate-100'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${c.estado === 'cobrado' ? 'bg-emerald-100 text-emerald-600' : vencida ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{c.estado}</span>
                    <span className="text-xs text-slate-400">{proyectos.find(p => p.id === c.proyectoId)?.nombre || '—'}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{c.cliente}</p>
                  <p className="text-xs text-slate-500">{c.concepto}</p>
                  <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
                    <span>💰 {fmtQ(c.monto)}</span>
                    <span>📅 Vence: {c.fechaVencimiento}</span>
                    {c.saldoPendiente > 0 && <span className="font-bold text-amber-600">Saldo: {fmtQ(c.saldoPendiente)}</span>}
                    {c.fechaCobro && <span>✅ Cobrado: {c.fechaCobro}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  {c.estado !== 'cobrado' && <button onClick={() => cobrar(c.id)} className="px-2 py-1 bg-emerald-500 text-white rounded text-[10px] hover:bg-emerald-600">Cobrar</button>}
                  <button onClick={() => eliminar(c.id)} className="p-1 text-slate-300 hover:text-red-500"><X className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default CuentasCobrarScreen;