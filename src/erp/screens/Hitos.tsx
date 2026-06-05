import React, { useState, useMemo, useEffect } from 'react';
import { useErp } from '../store';
import { supabase } from '@/lib/supabase';
import { Hito } from '../types';
import { Flag, CheckCircle, Clock, AlertTriangle, Plus, X, Filter, Calendar } from 'lucide-react';
import { INPUT } from '../ui';
import { toast } from 'sonner';
import { todayISO } from '../utils';
import { useNotifications } from '../hooks/useNotifications';

const STORAGE_KEY = 'wm_hitos';

const HitosScreen: React.FC = () => {
  const { proyectos, updateProyecto, selectedProyectoId, setSelectedProyectoId } = useErp();
  const { showLocalNotification } = useNotifications();
  const [hitos, setHitos] = useState<Hito[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [synced, setSynced] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [vista, setVista] = useState<'lista' | 'calendario'>('lista');
  const [mesCalendario, setMesCalendario] = useState(() => {
    const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [form, setForm] = useState({ proyectoId: '', nombre: '', descripcion: '', fecha: '', tipo: 'hito' as Hito['tipo'], responsable: '', dependeDe: [] as string[] });

  useEffect(() => {
    if (selectedProyectoId && !form.proyectoId) {
      setForm(prev => ({ ...prev, proyectoId: selectedProyectoId }));
    }
  }, [selectedProyectoId]);

  useEffect(() => {
    if (!synced) {
      syncFromSupabase();
      setSynced(true);
    }
  }, [synced]);

  const syncFromSupabase = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('hitos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        const mapped: Hito[] = data.map((r: any) => ({
          id: r.id, proyectoId: r.proyecto_id, nombre: r.nombre,
          descripcion: r.descripcion || '', fecha: r.fecha,
          tipo: r.tipo, estado: r.estado,
          responsable: r.responsable || '', dependeDe: r.depende_de || undefined,
          completadoEn: r.completado_en || undefined, createdAt: r.created_at,
        }));
        const localIds = new Set(hitos.map(h => h.id));
        const nuevos = mapped.filter(h => !localIds.has(h.id));
        if (nuevos.length > 0) setHitos(prev => [...nuevos, ...prev]);
      }
    } catch (e) { console.warn('[Hitos] Error sync Supabase:', e); }
  };

  const syncToSupabase = async (h: Hito[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(h));
    if (!supabase) return;
    try {
      const { error } = await supabase.from('hitos').upsert(
        h.map(hi => ({
          id: hi.id, proyecto_id: hi.proyectoId, nombre: hi.nombre,
          descripcion: hi.descripcion || null, fecha: hi.fecha,
          tipo: hi.tipo, estado: hi.estado,
          responsable: hi.responsable || null, depende_de: hi.dependeDe || null,
          completado_en: hi.completadoEn || null, created_at: hi.createdAt,
        })),
        { onConflict: 'id' }
      );
      if (error) console.warn('[Hitos] Error sync Supabase:', error);
      const hoy = todayISO();
      const vencidos = h.filter(hi => hi.estado === 'pendiente' && hi.fecha < hoy);
      if (vencidos.length > 0 && selectedProyectoId) {
        const proy = proyectos.find(p => p.id === selectedProyectoId);
        showLocalNotification('Hitos vencidos', {
          body: `${vencidos.length} hito(s) vencido(s) en ${proy?.nombre || 'el proyecto'}`,
          tag: 'hitos-vencidos', url: '/hitos',
        });
      }
    } catch (e) { console.warn('[Hitos] Error sync Supabase:', e); }
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
      dependeDe: form.dependeDe.length > 0 ? form.dependeDe : undefined,
      createdAt: new Date().toISOString(),
    };
    syncToSupabase([nuevo, ...hitos]);
    setHitos(prev => [nuevo, ...prev]);
    toast.success('Hito creado');
    setShowForm(false);
    setForm({ proyectoId: selectedProyectoId || '', nombre: '', descripcion: '', fecha: '', tipo: 'hito', responsable: '', dependeDe: [] });
  };

  const completar = (id: string) => {
    const hito = hitos.find(h => h.id === id);
    if (!hito) return;
    if (hito.dependeDe && hito.dependeDe.length > 0) {
      const predecesoresPendientes = hito.dependeDe.filter(depId => {
        const dep = hitos.find(h => h.id === depId);
        return dep && dep.estado !== 'completado';
      });
      if (predecesoresPendientes.length > 0) {
        const nombres = predecesoresPendientes.map(depId => hitos.find(h => h.id === depId)?.nombre || depId).join(', ');
        toast.error(`No se puede completar. Faltan predecesores: ${nombres}`);
        return;
      }
    }
    const fechaHoy = todayISO();
    const retrasado = hito.fecha < fechaHoy;
    const nuevos = hitos.map(h => h.id === id ? { ...h, estado: retrasado ? 'retrasado' as const : 'completado' as const, completadoEn: fechaHoy } : h);
    syncToSupabase(nuevos);
    setHitos(nuevos);
    if (hito.tipo === 'cierre') {
      updateProyecto(hito.proyectoId, { estado: 'finalizado' });
      showLocalNotification('Proyecto finalizado', {
        body: `"${hito.nombre}" completó el proyecto.`,
        tag: 'proyecto-finalizado', url: '/proyectos',
      });
    }
    toast.success(retrasado ? '⚠️ Hito completado con retraso' : '✅ Hito completado');
  };

  const eliminar = (id: string) => {
    if (!confirm('¿Eliminar este hito?')) return;
    const nuevos = hitos.filter(h => h.id !== id);
    syncToSupabase(nuevos);
    setHitos(nuevos);
  };

  const hoy = todayISO();
  const hitosFiltrados = useMemo(() => {
    let filtrados = hitos;
    if (selectedProyectoId) filtrados = filtrados.filter(h => h.proyectoId === selectedProyectoId);
    return filtrados;
  }, [hitos, selectedProyectoId]);

  const pendientesVencidos = hitosFiltrados.filter(h => h.estado === 'pendiente' && h.fecha < hoy);
  const completados = hitosFiltrados.filter(h => h.estado === 'completado' || h.estado === 'retrasado');
  const proyActual = selectedProyectoId ? proyectos.find(p => p.id === selectedProyectoId) : null;

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Flag className="w-6 h-6 text-emerald-500" /> Hitos
            {proyActual && <span className="text-base font-normal text-slate-400">— {proyActual.nombre}</span>}
          </h1>
          <p className="text-sm text-slate-400">Milestones y fases críticas del cronograma</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Hito
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-2"><Flag className="w-4 h-4 text-blue-500" /><span className="text-xs text-slate-500">Total hitos</span></div>
          <div className="text-xl font-bold text-slate-800">{hitosFiltrados.length}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /><span className="text-xs text-slate-500">Completados</span></div>
          <div className="text-xl font-bold text-emerald-600">{completados.length}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /><span className="text-xs text-slate-500">Pendientes</span></div>
          <div className="text-xl font-bold text-amber-600">{hitosFiltrados.length - completados.length}</div>
        </div>
        <div className={`rounded-xl p-3 border ${pendientesVencidos.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-xs text-slate-500">Vencidos</span></div>
          <div className="text-xl font-bold text-red-600">{pendientesVencidos.length}</div>
        </div>
      </div>

      {/* Filtro global por proyecto */}
      {proyectos.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={selectedProyectoId || ''} onChange={e => setSelectedProyectoId(e.target.value || null)} className={`${INPUT} max-w-xs`}>
            <option value="">Todos los proyectos</option>
            {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
      )}

      {showForm && (
        <div className="bg-emerald-50 rounded-xl p-4 mb-4 border border-emerald-200 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre del hito *" className={INPUT} />
            <select value={form.proyectoId} onChange={e => setForm(p => ({ ...p, proyectoId: e.target.value }))} className={INPUT}>
              <option value="">Seleccionar proyecto *</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} className={INPUT} />
            <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value as any }))} className={INPUT}>
              <option value="inicio">Inicio</option>
              <option value="hito">Hito</option>
              <option value="entrega">Entrega</option>
              <option value="cierre">Cierre</option>
            </select>
            <input value={form.responsable} onChange={e => setForm(p => ({ ...p, responsable: e.target.value }))} placeholder="Responsable" className={INPUT} />
          </div>
          <textarea value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Descripción del hito" className={`${INPUT} min-h-[50px]`} />

          {form.proyectoId && (() => {
            const hitosMismoProy = hitos.filter(h => h.proyectoId === form.proyectoId);
            return hitosMismoProy.length > 0 ? (
              <div>
                <label className="text-[10px] text-slate-500 font-semibold mb-1 block">🔗 Dependencias (predecesores)</label>
                <div className="flex flex-wrap gap-1.5">
                  {hitosMismoProy.map(h => (
                    <button
                      key={h.id} type="button"
                      onClick={() => {
                        const newDep = form.dependeDe.includes(h.id)
                          ? form.dependeDe.filter(id => id !== h.id)
                          : [...form.dependeDe, h.id];
                        setForm(p => ({ ...p, dependeDe: newDep }));
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] border transition-colors ${
                        form.dependeDe.includes(h.id)
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-200'
                      }`}
                    >
                      {h.nombre}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-slate-400 mt-1">Selecciona los hitos que deben completarse ANTES de este</p>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic">Crea otros hitos primero para asignar dependencias</p>
            );
          })()}

          <div className="flex gap-2">
            <button onClick={agregar} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-xs font-semibold">Crear Hito</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-600">Cancelar</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <button onClick={() => setVista('lista')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${vista === 'lista' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>📋 Lista</button>
        <button onClick={() => setVista('calendario')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${vista === 'calendario' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>📅 Calendario</button>
      </div>

      {vista === 'calendario' && (() => {
        const year = mesCalendario.year;
        const month = mesCalendario.month;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const cells: (number | null)[] = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);

        return (
          <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setMesCalendario(m => m.month === 0 ? { year: m.year - 1, month: 11 } : { ...m, month: m.month - 1 })} className="text-slate-400 hover:text-slate-600">◀</button>
              <h3 className="text-sm font-bold text-slate-700">{monthNames[month]} {year}</h3>
              <button onClick={() => setMesCalendario(m => m.month === 11 ? { year: m.year + 1, month: 0 } : { ...m, month: m.month + 1 })} className="text-slate-400 hover:text-slate-600">▶</button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {dayNames.map(d => <div key={d} className="text-[9px] text-slate-400 font-semibold py-1">{d}</div>)}
              {cells.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} />;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hitosDelDia = hitosFiltrados.filter(h => h.fecha === dateStr);
                const isToday = dateStr === hoy;
                return (
                  <div key={day} className={`min-h-[48px] p-0.5 rounded text-[10px] ${isToday ? 'bg-emerald-50 ring-1 ring-emerald-300' : 'hover:bg-slate-50'}`}>
                    <div className={`text-[10px] font-bold ${isToday ? 'text-emerald-600' : 'text-slate-600'}`}>{day}</div>
                    {hitosDelDia.slice(0, 2).map(h => {
                      const tipoColor: Record<string, string> = { inicio: 'bg-blue-100 text-blue-600', hito: 'bg-amber-100 text-amber-600', entrega: 'bg-purple-100 text-purple-600', cierre: 'bg-red-100 text-red-600' };
                      return <div key={h.id} className={`text-[8px] px-0.5 py-px rounded truncate ${tipoColor[h.tipo] || 'bg-slate-100 text-slate-600'}`}>{h.nombre}</div>;
                    })}
                    {hitosDelDia.length > 2 && <div className="text-[8px] text-slate-400">+{hitosDelDia.length - 2}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="space-y-2">
        {hitosFiltrados.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Flag className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Sin hitos para {proyActual?.nombre || 'el filtro actual'}. Crea el primero.</p>
          </div>
        ) : hitosFiltrados.sort((a, b) => a.fecha.localeCompare(b.fecha)).map(h => {
          const esVencido = h.estado === 'pendiente' && h.fecha < hoy;
          const proy = proyectos.find(p => p.id === h.proyectoId);
          const dependencias = h.dependeDe?.map(depId => hitos.find(ht => ht.id === depId)).filter(Boolean) || [];
          const depsCompletadas = dependencias.every(d => d?.estado === 'completado');
          const bloqueado = h.estado === 'pendiente' && dependencias.length > 0 && !depsCompletadas;
          return (
            <div key={h.id} className={`bg-white rounded-xl border p-4 ${h.estado === 'completado' ? 'border-emerald-200 bg-emerald-50/30' : esVencido ? 'border-red-200 bg-red-50/30' : bloqueado ? 'border-slate-200 bg-slate-50/50' : 'border-slate-100'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${h.estado === 'completado' ? 'bg-emerald-500' : esVencido ? 'bg-red-500' : bloqueado ? 'bg-slate-400' : 'bg-amber-400'}`} />
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{h.tipo}</span>
                    <span className="text-xs text-slate-400">{proy?.nombre || '—'}</span>
                    {bloqueado && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-500">🔒 Bloqueado</span>}
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{h.nombre}</p>
                  {h.descripcion && <p className="text-xs text-slate-500 mt-0.5">{h.descripcion}</p>}
                  <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
                    <span>📅 {h.fecha}</span>
                    {h.responsable && <span>👤 {h.responsable}</span>}
                    {h.completadoEn && <span>✅ Completado: {h.completadoEn}</span>}
                  </div>
                  {dependencias.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className="text-[9px] text-slate-400">🔗 Requiere:</span>
                      {dependencias.map(d => (
                        <span key={d!.id} className={`text-[9px] px-1.5 py-0.5 rounded ${d!.estado === 'completado' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          {d!.nombre} {d!.estado === 'completado' ? '✅' : '⏳'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  {(h.estado === 'pendiente' || esVencido) && (
                    <button
                      onClick={() => completar(h.id)}
                      disabled={bloqueado}
                      className={`px-2 py-1 rounded text-[10px] ${esVencido ? 'bg-orange-500 text-white' : bloqueado ? 'bg-slate-300 text-slate-500' : 'bg-emerald-500 text-white'} ${bloqueado ? 'cursor-not-allowed' : 'hover:opacity-80'}`}
                    >
                      {bloqueado ? '🔒' : esVencido ? 'Completar (retrasado)' : 'Completar'}
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
