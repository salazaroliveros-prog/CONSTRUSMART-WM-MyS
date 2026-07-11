import React, { useState, useMemo, useEffect } from 'react';
import { z } from 'zod';
import { useErp } from '../store';
import { Hito } from '../types';
import { Flag, CheckCircle, Clock, AlertTriangle, Plus, X, Filter, Link2, List, CalendarDays, Lock, Check, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { INPUT } from '../ui';
import { toast } from 'sonner';
import { Modal } from 'antd';
import { todayISO } from '../utils';
import { Skeleton } from '@/components/ui/skeleton';
import { hitoFormSchema } from '../store/schemas/calendario';
import { canUserDelete } from '@/lib/security';

const HitosScreen: React.FC = () => {
  const { t } = useTranslation();
  const { proyectos, updateProyecto, currentProjectId, setCurrentProjectId, hitos, addHito, updateHito, deleteHito, addNotificacion, user } = useErp();
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(false); }, []);
  const [showForm, setShowForm] = useState(false);
  const [vista, setVista] = useState<'lista' | 'calendario'>('lista');
  const [mesCalendario, setMesCalendario] = useState(() => {
    const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [form, setForm] = useState({ proyectoId: '', nombre: '', descripcion: '', fecha: '', tipo: 'hito' as Hito['tipo'], responsable: '', dependeDe: [] as string[] });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentProjectId && !form.proyectoId) {
      setForm(prev => ({ ...prev, proyectoId: currentProjectId }));
    }
  }, [currentProjectId, form.proyectoId]);

  const notifyVencidos = (todosHitos: Hito[]) => {
    const hoy = todayISO();
    const vencidos = todosHitos.filter(hi => hi.estado === 'pendiente' && hi.fecha < hoy);
    if (vencidos.length > 0 && currentProjectId) {
      const proy = proyectos.find(p => p.id === currentProjectId);
      addNotificacion('general', 'Hitos vencidos', `${vencidos.length} hito(s) vencido(s) en ${proy?.nombre || 'el proyecto'}`, currentProjectId || undefined);
    }
  };

  const agregar = () => {
    const result = hitoFormSchema.safeParse(form);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(e => {
        if (e.path[0]) errors[e.path[0] as string] = e.message;
      });
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    const nuevo: Hito = {
      id: crypto.randomUUID(),
      proyectoId: result.data.proyectoId,
      nombre: result.data.nombre,
      descripcion: result.data.descripcion,
      fecha: result.data.fecha,
      tipo: result.data.tipo,
      estado: 'pendiente',
      responsable: result.data.responsable,
      dependeDe: form.dependeDe.length > 0 ? form.dependeDe : undefined,
      createdAt: new Date().toISOString(),
    };
    addHito(nuevo);
    notifyVencidos([nuevo, ...hitos]);
    toast.success('Hito creado');
    setShowForm(false);
    setForm({ proyectoId: currentProjectId || '', nombre: '', descripcion: '', fecha: '', tipo: 'hito', responsable: '', dependeDe: [] });
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
    const nuevoEstado = retrasado ? 'retrasado' as const : 'completado' as const;
    updateHito(id, { estado: nuevoEstado, completadoEn: fechaHoy });
    if (hito.tipo === 'cierre') {
      updateProyecto(hito.proyectoId, { estado: 'finalizado' });
      addNotificacion('general', 'Proyecto finalizado', `"${hito.nombre}" completó el proyecto.`, hito.proyectoId);
    }
    toast.success(retrasado ? 'Hito completado con retraso' : 'Hito completado');
  };

  const eliminar = async (id: string) => {
    if (!canUserDelete(user?.rol)) {
      toast.error(t('common.sin_permisos', 'Sin permisos para eliminar'));
      return;
    }
    await Modal.confirm({ title: t('hitos.confirmar_eliminar_titulo', 'Confirmar eliminación'), content: t('hitos.confirmar_eliminar_contenido', '¿Eliminar este hito?'), centered: true, okText: t('common.si'), cancelText: t('common.cancelar') });
    deleteHito(id);
  };

  const hoy = todayISO();
  const hitosFiltrados = useMemo(() => {
    let filtrados = hitos;
    if (currentProjectId) filtrados = filtrados.filter(h => h.proyectoId === currentProjectId);
    return filtrados;
  }, [hitos, currentProjectId]);

  const pendientesVencidos = hitosFiltrados.filter(h => h.estado === 'pendiente' && h.fecha < hoy);
  const completados = hitosFiltrados.filter(h => h.estado === 'completado' || h.estado === 'retrasado');
  const proyActual = currentProjectId ? proyectos.find(p => p.id === currentProjectId) : null;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
            <Flag className="w-5 h-5 text-emerald-500" /> Hitos
            {proyActual && <span className="text-sm font-normal text-muted-foreground">— {proyActual.nombre}</span>}
          </h1>
          <p className="text-xs text-muted-foreground">Milestones y fases críticas del cronograma</p>
        </div>
        <button onClick={() => { setShowForm(true); setFormErrors({}); }} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Hito
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Flag className="w-4 h-4 text-blue-500" /><span className="text-xs text-muted-foreground">Total hitos</span></div>
          </div>
          <div className="text-xl font-bold text-foreground mt-1">{hitosFiltrados.length}</div>
          <div className="text-[10px] text-muted-foreground mt-1">{hitosFiltrados.length > 0 ? `${Math.round((completados.length / hitosFiltrados.length) * 100)}% completados` : '—'}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /><span className="text-xs text-muted-foreground">Completados</span></div>
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{completados.length}</div>
          <div className="text-[10px] text-muted-foreground mt-1">{completados.filter(h => h.estado === 'completado').length} a tiempo · {completados.filter(h => h.estado === 'retrasado').length} retrasados</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /><span className="text-xs text-muted-foreground">Pendientes</span></div>
          </div>
          <div className="text-xl font-bold text-amber-600 mt-1">{hitosFiltrados.length - completados.length}</div>
          <div className="text-[10px] text-muted-foreground mt-1">{pendientesVencidos.length} vencidos · {(hitosFiltrados.length - completados.length - pendientesVencidos.length) > 0 ? (hitosFiltrados.length - completados.length - pendientesVencidos.length) + ' en plazo' : 'Sin pendientes saludables'}</div>
        </div>
        <div className={`rounded-xl border p-4 ${pendientesVencidos.length > 0 ? 'bg-red-50 border-red-200' : 'bg-card border-border'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-xs text-muted-foreground">Vencidos</span></div>
            {pendientesVencidos.length > 0 && <span className="text-[10px] text-red-600 font-bold">ATENCIÓN</span>}
          </div>
          <div className="text-xl font-bold text-red-600 mt-1">{pendientesVencidos.length}</div>
          <div className="text-[10px] text-muted-foreground mt-1">{pendientesVencidos.length > 0 ? 'Requiere acción inmediata' : 'Sin vencidos'}</div>
        </div>
      </div>

      {/* Filtro global por proyecto */}
      {proyectos.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select value={currentProjectId || ''} onChange={e => setCurrentProjectId(e.target.value || null)} className={`${INPUT} max-w-xs`}>
            <option value="">Todos los proyectos</option>
            {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
      )}

      {showForm && (
        <div className="bg-emerald-50 rounded-xl p-4 mb-4 border border-emerald-200 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <input value={form.nombre} onChange={e => { setForm(p => ({ ...p, nombre: e.target.value })); setFormErrors(prev => ({ ...prev, nombre: '' })); }} placeholder="Nombre del hito *" className={INPUT} />
              {formErrors.nombre && <p className="text-xs text-red-500 mt-0.5">{formErrors.nombre}</p>}
            </div>
            <div>
              <select value={form.proyectoId} onChange={e => { setForm(p => ({ ...p, proyectoId: e.target.value })); setFormErrors(prev => ({ ...prev, proyectoId: '' })); }} className={INPUT}>
                <option value="">Seleccionar proyecto *</option>
                {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              {formErrors.proyectoId && <p className="text-xs text-red-500 mt-0.5">{formErrors.proyectoId}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <input type="date" value={form.fecha} onChange={e => { setForm(p => ({ ...p, fecha: e.target.value })); setFormErrors(prev => ({ ...prev, fecha: '' })); }} className={INPUT} />
              {formErrors.fecha && <p className="text-xs text-red-500 mt-0.5">{formErrors.fecha}</p>}
            </div>
            <div>
              <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value as unknown }))} className={INPUT}>
                <option value="inicio">Inicio</option>
                <option value="hito">Hito</option>
                <option value="entrega">Entrega</option>
                <option value="cierre">Cierre</option>
              </select>
              {formErrors.tipo && <p className="text-xs text-red-500 mt-0.5">{formErrors.tipo}</p>}
            </div>
            <div>
              <input value={form.responsable} onChange={e => { setForm(p => ({ ...p, responsable: e.target.value })); setFormErrors(prev => ({ ...prev, responsable: '' })); }} placeholder="Responsable" className={INPUT} />
              {formErrors.responsable && <p className="text-xs text-red-500 mt-0.5">{formErrors.responsable}</p>}
            </div>
          </div>
          <div>
            <textarea value={form.descripcion} onChange={e => { setForm(p => ({ ...p, descripcion: e.target.value })); setFormErrors(prev => ({ ...prev, descripcion: '' })); }} placeholder="Descripción del hito" className={`${INPUT} min-h-[50px]`} />
            {formErrors.descripcion && <p className="text-xs text-red-500 mt-0.5">{formErrors.descripcion}</p>}
          </div>

          {form.proyectoId && (() => {
            const hitosMismoProy = hitos.filter(h => h.proyectoId === form.proyectoId);
            return hitosMismoProy.length > 0 ? (
              <div>
                <label className="text-xs text-muted-foreground font-semibold mb-1 block flex items-center gap-1"><Link2 className="w-3 h-3" aria-hidden="true" /> Dependencias (predecesores)</label>
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
                      className={`px-2 py-1 rounded-lg text-xs border transition-colors ${
                        form.dependeDe.includes(h.id)
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                          : 'bg-card text-muted-foreground border-border hover:border-emerald-200'
                      }`}
                    >
                      {h.nombre}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Selecciona los hitos que deben completarse ANTES de este</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Crea otros hitos primero para asignar dependencias</p>
            );
          })()}

          <div className="flex gap-2">
            <button onClick={agregar} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-xs font-semibold">Crear Hito</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-xs text-muted-foreground">Cancelar</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <button onClick={() => setVista('lista')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${vista === 'lista' ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted'}`}><List className="w-3.5 h-3.5" aria-hidden="true" /> Lista</button>
        <button onClick={() => setVista('calendario')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${vista === 'calendario' ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted'}`}><CalendarDays className="w-3.5 h-3.5" aria-hidden="true" /> Calendario</button>
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
          <div className="bg-card rounded-xl border border-border p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setMesCalendario(m => m.month === 0 ? { year: m.year - 1, month: 11 } : { ...m, month: m.month - 1 })} className="text-muted-foreground hover:text-muted-foreground">◀</button>
              <h3 className="text-sm font-bold text-muted-foreground">{monthNames[month]} {year}</h3>
              <button onClick={() => setMesCalendario(m => m.month === 11 ? { year: m.year + 1, month: 0 } : { ...m, month: m.month + 1 })} className="text-muted-foreground hover:text-muted-foreground">▶</button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {dayNames.map(d => <div key={d} className="text-[10px] text-muted-foreground font-semibold py-1">{d}</div>)}
              {cells.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} />;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hitosDelDia = hitosFiltrados.filter(h => h.fecha === dateStr);
                const isToday = dateStr === hoy;
                return (
                  <div key={day} className={`min-h-[48px] p-0.5 rounded text-xs ${isToday ? 'bg-emerald-50 ring-1 ring-emerald-300' : 'hover:bg-accent'}`}>
                    <div className={`text-xs font-bold ${isToday ? 'text-emerald-600' : 'text-muted-foreground'}`}>{day}</div>
                    {hitosDelDia.slice(0, 2).map(h => {
                      const tipoColor: Record<string, string> = { inicio: 'bg-blue-100 text-blue-600', hito: 'bg-amber-100 text-amber-600', entrega: 'bg-purple-100 text-blue-600', cierre: 'bg-red-100 text-red-600' };
                      return <div key={h.id} className={`text-[8px] px-0.5 py-px rounded truncate ${tipoColor[h.tipo] || 'bg-muted text-muted-foreground'}`}>{h.nombre}</div>;
                    })}
                    {hitosDelDia.length > 2 && <div className="text-[8px] text-muted-foreground">+{hitosDelDia.length - 2}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="space-y-2">
        {hitosFiltrados.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
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
            <div key={h.id} className={`bg-card rounded-xl border p-4 ${h.estado === 'completado' ? 'border-emerald-200 bg-emerald-50/30' : esVencido ? 'border-red-200 bg-red-50/30' : bloqueado ? 'border-border bg-muted/30/50' : 'border-border'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${h.estado === 'completado' ? 'bg-emerald-500' : esVencido ? 'bg-red-500' : bloqueado ? 'bg-slate-400' : 'bg-amber-400'}`} />
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{h.tipo}</span>
                    <span className="text-xs text-muted-foreground">{proy?.nombre || '—'}</span>
                    {bloqueado && <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3" aria-hidden="true" /> Bloqueado</span>}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{h.nombre}</p>
                  {h.descripcion && <p className="text-xs text-muted-foreground mt-0.5">{h.descripcion}</p>}
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> {h.fecha}</span>
                    {h.responsable && <span className="flex items-center gap-1"><User className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> {h.responsable}</span>}
                    {h.completadoEn && <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" aria-hidden="true" /> Completado: {h.completadoEn}</span>}
                  </div>
                  {dependencias.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Link2 className="w-3 h-3" aria-hidden="true" /> Requiere:</span>
                      {dependencias.map(d => (
                        <span key={d!.id} className={`text-[10px] px-1.5 py-0.5 rounded ${d!.estado === 'completado' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          {d!.nombre} {d!.estado === 'completado' ? <Check className="w-3 h-3 inline text-emerald-500" aria-hidden="true" /> : <Clock className="w-3 h-3 inline text-amber-500" aria-hidden="true" />}
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
                      className={`px-2 py-1 rounded text-xs ${esVencido ? 'bg-orange-500 text-white' : bloqueado ? 'bg-slate-300 text-muted-foreground' : 'bg-emerald-500 text-white'} ${bloqueado ? 'cursor-not-allowed' : 'hover:opacity-80'}`}
                    >
                      {bloqueado ? <><Lock className="w-3 h-3 inline" aria-hidden="true" /> Bloqueado</> : esVencido ? 'Completar (retrasado)' : 'Completar'}
                    </button>
                  )}
                  <button onClick={() => eliminar(h.id)} className="p-1 text-slate-300 hover:text-red-500" aria-label={t('hitos.eliminar')}><X className="w-3 h-3" aria-hidden="true" /></button>
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



