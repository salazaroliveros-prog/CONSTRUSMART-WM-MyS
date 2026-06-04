import React, { useState } from 'react';
import { useErp } from '../store';
import { Hito } from '../types';
import { Flag, CheckCircle, Clock, AlertTriangle, Plus, X } from 'lucide-react';
import { INPUT } from '../ui';
import { toast } from 'sonner';
import { todayISO } from '../utils';

const HitosScreen: React.FC = () => {
  const { proyectos, updateProyecto } = useErp();
  const [hitos, setHitos] = useState<Hito[]>(() => {
    try { return JSON.parse(localStorage.getItem('wm_hitos') || '[]'); } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ proyectoId: '', nombre: '', descripcion: '', fecha: '', tipo: 'hito' as Hito['tipo'], responsable: '' });

  const save = (h: Hito[]) => {
    setHitos(h);
    localStorage.setItem('wm_hitos', JSON.stringify(h));
  };

  const agregar = () => {
    if (!form.nombre || !form.proyectoId || !form.fecha) {
      toast.error('Nombre, proyecto y fecha son requeridos');
      return;
    }
    const nuevo: Hito = {
      id: crypto.randomUUID(),
      proyectoId: form.proyectoId,
      nombre: form.nombre,
      descripcion: form.descripcion,
      fecha: form.fecha,
      tipo: form.tipo,
      estado: 'pendiente',
      responsable: form.responsable,
      createdAt: new Date().toISOString(),
    };
    save([nuevo, ...hitos]);
    toast.success('Hito creado');
    setShowForm(false);
    setForm({ proyectoId: '', nombre: '', descripcion: '', fecha: '', tipo: 'hito', responsable: '' });
  };

  const completar = (id: string) => {
    const hito = hitos.find(h => h.id === id);
    if (!hito) return;
    const fechaHoy = todayISO();
    const retrasado = hito.fecha < fechaHoy;
    save(hitos.map(h => h.id === id ? { ...h, estado: retrasado ? 'retrasado' as const : 'completado' as const, completadoEn: fechaHoy } : h));
    if (hito.tipo === 'cierre') {
      updateProyecto(hito.proyectoId, { estado: 'finalizado' });
    }
    toast.success(retrasado ? '⚠️ Hito completado con retraso' : '✅ Hito completado');
  };

  const eliminar = (id: string) => {
    if (confirm('¿Eliminar este hito?')) save(hitos.filter(h => h.id !== id));
  };

  const hoy = todayISO();
  const pendientesVencidos = hitos.filter(h => h.estado === 'pendiente' && h.fecha < hoy);
  const completados = hitos.filter(h => h.estado === 'completado' || h.estado === 'retrasado');

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Flag className="w-6 h-6 text-emerald-500" /> Hitos del Proyecto
          </h1>
          <p className="text-sm text-slate-400">Milestones y fases críticas del cronograma</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Hito
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-2"><Flag className="w-4 h-4 text-blue-500" /><span className="text-xs text-slate-500">Total hitos</span></div>
          <div className="text-xl font-bold text-slate-800">{hitos.length}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /><span className="text-xs text-slate-500">Completados</span></div>
          <div className="text-xl font-bold text-emerald-600">{completados.length}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /><span className="text-xs text-slate-500">Pendientes</span></div>
          <div className="text-xl font-bold text-amber-600">{hitos.length - completados.length}</div>
        </div>
        <div className={`rounded-xl p-3 border ${pendientesVencidos.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-xs text-slate-500">Vencidos</span></div>
          <div className="text-xl font-bold text-red-600">{pendientesVencidos.length}</div>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-emerald-50 rounded-xl p-4 mb-4 border border-emerald-200 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input value={form.nombre} onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))} placeholder="Nombre del hito *" className={INPUT} />
            <select value={form.proyectoId} onChange={e => setForm(prev => ({ ...prev, proyectoId: e.target.value }))} className={INPUT}>
              <option value="">Seleccionar proyecto *</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input type="date" value={form.fecha} onChange={e => setForm(prev => ({ ...prev, fecha: e.target.value }))} className={INPUT} />
            <select value={form.tipo} onChange={e => setForm(prev => ({ ...prev, tipo: e.target.value as any }))} className={INPUT}>
              <option value="inicio">Inicio</option>
              <option value="hito">Hito</option>
              <option value="entrega">Entrega</option>
              <option value="cierre">Cierre</option>
            </select>
            <input value={form.responsable} onChange={e => setForm(prev => ({ ...prev, responsable: e.target.value }))} placeholder="Responsable" className={INPUT} />
          </div>
          <textarea value={form.descripcion} onChange={e => setForm(prev => ({ ...prev, descripcion: e.target.value }))} placeholder="Descripción del hito" className={`${INPUT} min-h-[50px]`} />
          <div className="flex gap-2">
            <button onClick={agregar} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-xs font-semibold">Crear Hito</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-600">Cancelar</button>
          </div>
        </div>
      )}

      {/* Timeline de hitos */}
      <div className="space-y-2">
        {hitos.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Flag className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Sin hitos definidos. Crea el primero para tu proyecto.</p>
          </div>
        ) : hitos.sort((a, b) => a.fecha.localeCompare(b.fecha)).map(h => {
          const esVencido = h.estado === 'pendiente' && h.fecha < hoy;
          const proy = proyectos.find(p => p.id === h.proyectoId);
          return (
            <div key={h.id} className={`bg-white rounded-xl border p-4 ${h.estado === 'completado' ? 'border-emerald-200 bg-emerald-50/30' : esVencido ? 'border-red-200 bg-red-50/30' : 'border-slate-100'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${h.estado === 'completado' ? 'bg-emerald-500' : esVencido ? 'bg-red-500' : 'bg-amber-400'}`} />
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{h.tipo}</span>
                    <span className="text-xs text-slate-400">{proy?.nombre || '—'}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{h.nombre}</p>
                  {h.descripcion && <p className="text-xs text-slate-500 mt-0.5">{h.descripcion}</p>}
                  <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
                    <span>📅 {h.fecha}</span>
                    {h.responsable && <span>👤 {h.responsable}</span>}
                    {h.completadoEn && <span>✅ Completado: {h.completadoEn}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  {(h.estado === 'pendiente' || esVencido) && (
                    <button onClick={() => completar(h.id)} className={`px-2 py-1 rounded text-[10px] ${esVencido ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'} hover:opacity-80`}>
                      {esVencido ? 'Completar (retrasado)' : 'Completar'}
                    </button>
                  )}
                  <button onClick={() => eliminar(h.id)} className="p-1 text-slate-300 hover:text-red-500"><X className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HitosScreen;