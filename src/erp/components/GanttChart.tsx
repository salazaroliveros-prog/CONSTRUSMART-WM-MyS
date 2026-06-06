import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Calendar, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export interface GanttTask {
  id: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  rendimiento: number;
  fechaInicio: string;
  fechaFin: string;
  avance: number;
  expanded?: boolean;
  dependencias?: string[];
  subRenglones?: { nombre: string; cantidad: number; unidad: string }[];
}

interface GanttChartProps {
  tasks: GanttTask[];
  projectStart: string;
  projectEnd: string;
  projectName: string;
  onUpdateTask: (id: string, patch: Partial<GanttTask>) => void;
}

const DAY_MS = 86400000;

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY_MS) + 1;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-GT', { day: '2-digit', month: 'short' });
}

const BarColor = (avance: number, idx: number, isDelayed: boolean) => {
  if (isDelayed) return '#ef4444';
  if (avance >= 100) return '#10b981';
  const colors = ['#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#14b8a6'];
  return avance >= 50 ? colors[idx % colors.length] : colors[idx % colors.length] + '99';
};

const GanttChart: React.FC<GanttChartProps> = ({ tasks, projectStart, projectEnd, projectName, onUpdateTask }) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ inicio: string; fin: string }>({ inicio: '', fin: '' });
  const [viewMode, setViewMode] = useState<'semanas' | 'meses'>('semanas');
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalDays = Math.max(daysBetween(projectStart, projectEnd), 1);
  const hoy = new Date().toISOString().slice(0, 10);

  const timeline = useMemo(() => {
    const dates: { label: string; date: string; dayOffset: number }[] = [];
    const start = new Date(projectStart);
    const end = new Date(projectEnd);
    if (viewMode === 'semanas') {
      const iterDate = new Date(start);
      while (iterDate <= end) {
        const dayOfWeek = iterDate.getDay();
        if (dayOfWeek === 1 || dayOfWeek === 0) {
          const offset = Math.round((iterDate.getTime() - start.getTime()) / DAY_MS);
          dates.push({ label: iterDate.toLocaleDateString('es-GT', { day: 'numeric', month: 'short' }), date: iterDate.toISOString().slice(0, 10), dayOffset: Math.max(0, offset) });
        }
        iterDate.setDate(iterDate.getDate() + 1);
      }
    } else {
      const monthDate = new Date(start.getFullYear(), start.getMonth(), 1);
      while (monthDate <= end) {
        const offset = Math.round((monthDate.getTime() - start.getTime()) / DAY_MS);
        dates.push({ label: monthDate.toLocaleDateString('es-GT', { month: 'short', year: '2-digit' }), date: monthDate.toISOString().slice(0, 10), dayOffset: Math.max(0, offset) });
        monthDate.setMonth(monthDate.getMonth() + 1);
      }
    }
    return dates;
  }, [projectStart, projectEnd, viewMode]);

  const taskBars = useMemo(() => {
    return tasks.map((t, idx) => {
      const startOffset = Math.max(0, daysBetween(projectStart, t.fechaInicio) - 1);
      const duration = daysBetween(t.fechaInicio, t.fechaFin);
      const pctWidth = totalDays > 0 ? (duration / totalDays) * 100 : 0;
      const pctLeft = totalDays > 0 ? (startOffset / totalDays) * 100 : 0;
      const isDelayed = t.avance < 100 && t.fechaFin < hoy;
      const hasIncomingDeps = tasks.filter(dt => dt.dependencias?.includes(t.id));
      return { ...t, startOffset, duration, pctWidth, pctLeft, idx, isDelayed, hasIncomingDeps };
    });
  }, [tasks, projectStart, totalDays, hoy]);

  const getDependenciasInfo = (taskId: string) => {
    return taskBars.filter(t => t.dependencias?.includes(taskId));
  };

  const toggleTask = (id: string) => {
    setExpandedTasks(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const startEditTask = (task: GanttTask) => {
    setEditingTask(task.id);
    setEditValues({ inicio: task.fechaInicio, fin: task.fechaFin });
  };

  const validateDates = (task: GanttTask, inicio: string, fin: string): boolean => {
    if (!inicio || !fin) { toast.error('Ambas fechas son requeridas'); return false; }
    if (inicio > fin) { toast.error('La fecha de fin debe ser posterior a la de inicio'); return false; }
    if (fin < projectStart || inicio > projectEnd) { toast.error('Las fechas deben estar dentro del rango del proyecto'); return false; }
    if (task.dependencias && task.dependencias.length > 0) {
      for (const depId of task.dependencias) {
        const dep = tasks.find(t => t.id === depId);
        if (dep && inicio < dep.fechaFin) {
          toast.error(`"${task.nombre}" debe empezar DESPUÉS de que termine "${dep.nombre}" (${dep.fechaFin})`);
          return false;
        }
      }
    }
    const dependientes = tasks.filter(t => t.dependencias?.includes(task.id));
    for (const dep of dependientes) {
      if (dep.fechaInicio < fin) {
        toast.warning(`"${dep.nombre}" depende de esta tarea y puede requerir ajuste de fechas`);
      }
    }
    return true;
  };

  const saveEditTask = () => {
    if (!editingTask) return;
    const task = tasks.find(t => t.id === editingTask);
    if (!task) return;
    if (validateDates(task, editValues.inicio, editValues.fin)) {
      onUpdateTask(editingTask, { fechaInicio: editValues.inicio, fechaFin: editValues.fin });
    }
    setEditingTask(null);
  };

  useEffect(() => {
    if (scrollRef.current) {
      const todayOffset = daysBetween(projectStart, hoy);
      const scrollPct = totalDays > 0 ? todayOffset / totalDays : 0;
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth * scrollPct * 0.3;
    }
  }, [tasks, totalDays, projectStart, hoy]);

  const TASK_HEIGHT = 36;
  const LABEL_WIDTH = 200;
  const HEADER_HEIGHT = 40;
  const MIN_BAR_PX = 4;

  const overdueCount = taskBars.filter(t => t.isDelayed).length;

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
      <div className="p-4 border-b bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-700">Diagrama de Gantt</h3>
            <span className="text-xs text-slate-400">({projectName})</span>
          </div>
          <div className="flex items-center gap-2">
            {overdueCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-red-500 font-semibold bg-red-50 px-2 py-1 rounded-lg">
                <AlertTriangle className="w-3 h-3" /> {overdueCount} vencida(s)
              </span>
            )}
            <span className="text-[10px] text-slate-400">{formatDate(projectStart)} → {formatDate(projectEnd)} ({totalDays} días)</span>
            <div className="flex bg-slate-200 rounded-lg p-0.5">
              <button onClick={() => setViewMode('semanas')} className={`px-2 py-1 text-[10px] rounded-md font-medium transition-colors ${viewMode === 'semanas' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'}`}>Semanas</button>
              <button onClick={() => setViewMode('meses')} className={`px-2 py-1 text-[10px] rounded-md font-medium transition-colors ${viewMode === 'meses' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'}`}>Meses</button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-emerald-500 inline-block" /> Completado</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-red-500 inline-block" /> Vencido</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-blue-500 inline-block" /> En progreso</span>
          <span className="flex items-center gap-1"><span className="w-1 h-3 bg-red-400 inline-block" /> Hoy</span>
          <span className="flex items-center gap-1">🔗 Dependencia</span>
        </div>
      </div>

      <div className="overflow-x-auto" ref={scrollRef}>
        <div className="min-w-[800px]">
          <div className="flex" style={{ height: HEADER_HEIGHT }}>
            <div className="shrink-0 border-r border-slate-200 bg-slate-50" style={{ width: LABEL_WIDTH }}>
              <div className="h-full flex items-center px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Actividad / Renglón</div>
            </div>
            <div className="flex-1 relative bg-slate-50" style={{ minHeight: HEADER_HEIGHT }}>
              <div className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10" style={{ left: `${Math.min(Math.max((daysBetween(projectStart, hoy) / totalDays) * 100, 0), 100)}%`, opacity: 0.6 }} />
              {timeline.map((t, i) => (
                <div key={i} className="absolute top-0 text-[8px] text-slate-400 pt-1" style={{ left: `${(t.dayOffset / totalDays) * 100}%`, transform: 'translateX(-50%)' }}>{t.label}</div>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {taskBars.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No hay actividades. Agrega renglones en el presupuesto.
              </div>
            ) : taskBars.map(t => {
              const isExpanded = expandedTasks.has(t.id);
              const dependientes = getDependenciasInfo(t.id);
              return (
                <div key={t.id}>
                  <div className="flex hover:bg-slate-50 transition-colors group cursor-pointer" style={{ height: TASK_HEIGHT }} onClick={() => startEditTask(t)}>
                    <div className="shrink-0 border-r border-slate-100 flex items-center gap-1 px-2" style={{ width: LABEL_WIDTH }}>
                      <button onClick={(e) => { e.stopPropagation(); toggleTask(t.id); }} className="text-slate-400 hover:text-slate-600">
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>
                      <span className={`text-[10px] font-mono px-1 rounded shrink-0 ${t.isDelayed ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{t.codigo}</span>
                      <span className="text-xs text-slate-700 truncate flex items-center gap-1">
                        {t.nombre}
                        {t.isDelayed && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />}
                      </span>
                    </div>
                    <div className="flex-1 relative">
                      {timeline.map((tl, i) => (
                        <div key={i} className="absolute top-0 bottom-0 border-l border-slate-100" style={{ left: `${(tl.dayOffset / totalDays) * 100}%` }} />
                      ))}
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 rounded cursor-pointer transition-all duration-300 group-hover:shadow-md ${t.isDelayed ? 'animate-pulse' : ''} ${t.avance >= 100 ? 'opacity-80' : ''}`}
                        style={{
                          left: `${t.pctLeft}%`,
                          width: `${Math.max(t.pctWidth, MIN_BAR_PX / 100)}%`,
                          height: TASK_HEIGHT * 0.55,
                          background: BarColor(t.avance, t.idx, t.isDelayed),
                          minWidth: MIN_BAR_PX,
                          boxShadow: t.isDelayed ? '0 0 0 2px #ef4444' : 'none',
                        }}
                        title={`${t.nombre}: ${t.cantidad} ${t.unidad} (${t.duration} días, ${t.avance}%)${t.isDelayed ? ' ⚠️ VENCIDA' : ''}`}
                      >
                        {t.pctWidth > 12 && (
                          <div className="flex items-center justify-between px-2 h-full text-[9px] text-white font-medium truncate">
                            <span>{t.cantidad} {t.unidad}</span>
                            <span>{t.duration}d</span>
                          </div>
                        )}
                      </div>
                      {t.avance < 100 && t.pctWidth > 8 && (
                        <div className="absolute top-1/2 -translate-y-1/2 h-full rounded opacity-30" style={{
                          left: `${t.pctLeft}%`,
                          width: `${(t.avance / 100) * t.pctWidth}%`,
                          background: '#10b981',
                          minWidth: MIN_BAR_PX,
                          transition: 'width 0.5s ease',
                        }} />
                      )}
                      {/* Dependency arrow indicators */}
                      {t.dependencias && t.dependencias.map((depId, di) => {
                        const dep = taskBars.find(b => b.id === depId);
                        if (!dep) return null;
                        const depEndPx = dep.pctLeft + dep.pctWidth;
                        const startX = depEndPx;
                        const endX = t.pctLeft;
                        if (startX >= endX) return null;
                        return (
                          <div key={di} className="absolute top-0 flex items-center" style={{ left: `${startX}%`, width: `${endX - startX}%`, height: '100%' }}>
                            <svg className="w-full h-full" preserveAspectRatio="none">
                              <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3,2" />
                              <polygon points="100%,50% 95%,45% 95%,55%" fill="#f97316" />
                            </svg>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-slate-50 px-3 py-3 border-t border-slate-100">
                      {editingTask === t.id ? (
                        <div className="flex items-center gap-3">
                          <div>
                            <label className="text-[10px] text-slate-500 block">Inicio</label>
                            <input type="date" value={editValues.inicio} onChange={e => setEditValues(p => ({ ...p, inicio: e.target.value }))} className="text-xs px-2 py-1 rounded border border-slate-200" />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block">Fin</label>
                            <input type="date" value={editValues.fin} onChange={e => setEditValues(p => ({ ...p, fin: e.target.value }))} className="text-xs px-2 py-1 rounded border border-slate-200" />
                          </div>
                          <button onClick={saveEditTask} className="mt-4 bg-emerald-500 text-white px-3 py-1 rounded text-[10px] hover:bg-emerald-600">Guardar</button>
                          <button onClick={() => setEditingTask(null)} className="mt-4 bg-slate-200 text-slate-600 px-3 py-1 rounded text-[10px] hover:bg-slate-300">Cancelar</button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div><span className="text-slate-400 text-[10px] block">Cantidad</span><span className="font-semibold text-slate-700">{t.cantidad} {t.unidad}</span></div>
                          <div><span className="text-slate-400 text-[10px] block">Rendimiento</span><span className="font-semibold text-slate-700">{t.rendimiento} {t.unidad}/día</span></div>
                          <div><span className="text-slate-400 text-[10px] block">Duración</span><span className="font-semibold text-slate-700">{t.duration} días</span></div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Avance</span>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${t.avance}%`, background: t.avance >= 100 ? '#10b981' : '#3b82f6' }} />
                              </div>
                              <span className={`font-semibold text-[10px] ${t.avance >= 100 ? 'text-emerald-600' : 'text-blue-600'}`}>{t.avance}%</span>
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-slate-400 text-[10px] block">Fechas</span>
                            <span className="font-semibold text-slate-700">{formatDate(t.fechaInicio)} → {formatDate(t.fechaFin)}</span>
                            {t.isDelayed && <span className="text-red-500 text-[10px] ml-2 font-semibold">⚠️ VENCIDA</span>}
                          </div>
                          {/* Dependencias */}
                          {t.dependencias && t.dependencias.length > 0 && (
                            <div className="md:col-span-2">
                              <span className="text-slate-400 text-[10px] block">🔗 Depende de:</span>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {t.dependencias.map(depId => {
                                  const dep = tasks.find(tt => tt.id === depId);
                                  return (
                                    <span key={depId} className={`text-[9px] px-1.5 py-0.5 rounded ${dep ? (dep.avance >= 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600') : 'bg-slate-100 text-slate-500'}`}>
                                      {dep?.codigo || depId} {dep?.avance >= 100 ? '✅' : '⏳'}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {/* Dependientes (tareas que dependen de esta) */}
                          {dependientes.length > 0 && (
                            <div className="md:col-span-2">
                              <span className="text-slate-400 text-[10px] block">⬆️ Requerido por:</span>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {dependientes.map(dt => (
                                  <span key={dt.id} className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{dt.codigo} — {dt.nombre}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {t.subRenglones && t.subRenglones.length > 0 && (
                            <div className="md:col-span-2">
                              <span className="text-slate-400 text-[10px] block">Materiales ({t.subRenglones.length})</span>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {t.subRenglones.map((s, si) => (
                                  <span key={si} className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">{s.nombre}: {s.cantidad} {s.unidad}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-slate-900 text-white p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex gap-4">
              <span>{taskBars.length} actividades</span>
              <span>{taskBars.reduce((a, t) => a + t.duration, 0)} días-hombre</span>
            </div>
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {taskBars.filter(t => t.avance >= 100).length} completadas</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> {taskBars.filter(t => t.avance > 0 && t.avance < 100).length} en curso</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> {taskBars.filter(t => t.isDelayed).length} vencidas</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500" /> {taskBars.filter(t => t.avance === 0 && !t.isDelayed).length} pendientes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
