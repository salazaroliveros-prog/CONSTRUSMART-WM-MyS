import React, { useState, useMemo, useRef } from 'react';
import { ChevronDown, ChevronRight, Calendar, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export interface GanttTask {
  codigo: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  rendimiento: number;
  fechaInicio: string;
  fechaFin: string;
  avance: number;
  expanded?: boolean;
  subRenglones?: { nombre: string; cantidad: number; unidad: string }[];
}

interface EnhancedGanttProps {
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

// Algoritmo de ruta crítica (CPM)
function calcularRutaCritica(tasks: GanttTask[]): Set<string> {
  const sorted = [...tasks].sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
  const finishTimes: Record<string, number> = {};
  const critical: Set<string> = new Set();

  sorted.forEach(task => {
    const start = daysBetween(sorted[0]?.fechaInicio || task.fechaInicio, task.fechaInicio);
    const duration = daysBetween(task.fechaInicio, task.fechaFin);
    const earliestFinish = start + duration;
    finishTimes[task.codigo] = earliestFinish;
  });

  const maxFinish = Math.max(...Object.values(finishTimes));
  sorted.forEach(task => {
    if (finishTimes[task.codigo] >= maxFinish - 1) {
      critical.add(task.codigo);
    }
  });

  return critical;
}

const EnhancedGantt: React.FC<EnhancedGanttProps> = ({ tasks, projectStart, projectEnd, projectName, onUpdateTask }) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ inicio: string; fin: string }>({ inicio: '', fin: '' });
  const [viewMode, setViewMode] = useState<'semanas' | 'meses' | 'dias'>('semanas');
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalDays = Math.max(daysBetween(projectStart, projectEnd), 1);
  const rutaCritica = useMemo(() => calcularRutaCritica(tasks), [tasks]);

  const timeline = useMemo(() => {
    const dates: { label: string; date: string; dayOffset: number }[] = [];
    const start = new Date(projectStart);
    const end = new Date(projectEnd);
    
    if (viewMode === 'dias') {
      const d = new Date(start);
      while (d <= end) {
        const offset = Math.round((d.getTime() - start.getTime()) / DAY_MS);
        dates.push({
          label: d.toLocaleDateString('es-GT', { day: 'numeric', month: 'short' }),
          date: d.toISOString().slice(0, 10),
          dayOffset: offset,
        });
        d.setDate(d.getDate() + 1);
      }
    } else if (viewMode === 'semanas') {
      const iterDate = new Date(start);
      while (iterDate <= end) {
        const dayOfWeek = iterDate.getDay();
        if (dayOfWeek === 1 || dayOfWeek === 0) {
          const offset = Math.round((iterDate.getTime() - start.getTime()) / DAY_MS);
          dates.push({
            label: iterDate.toLocaleDateString('es-GT', { day: 'numeric', month: 'short' }),
            date: iterDate.toISOString().slice(0, 10),
            dayOffset: offset,
          });
        }
        iterDate.setDate(iterDate.getDate() + 1);
      }
    } else {
      const monthDate = new Date(start.getFullYear(), start.getMonth(), 1);
      while (monthDate <= end) {
        const offset = Math.round((monthDate.getTime() - start.getTime()) / DAY_MS);
        dates.push({
          label: monthDate.toLocaleDateString('es-GT', { month: 'short', year: '2-digit' }),
          date: monthDate.toISOString().slice(0, 10),
          dayOffset: offset,
        });
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
      const isCritical = rutaCritica.has(t.codigo);
      const todayOffset = Math.max(0, daysBetween(projectStart, new Date().toISOString().slice(0, 10)));
      const delay = t.avance < 100 && t.fechaFin < new Date().toISOString().slice(0, 10);
      return { ...t, startOffset, duration, pctWidth, pctLeft, idx, isCritical, todayOffset, delay };
    });
  }, [tasks, projectStart, totalDays, rutaCritica]);

  const toggleTask = (id: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const startEditTask = (task: GanttTask) => {
    setEditingTask(task.codigo);
    setEditValues({ inicio: task.fechaInicio, fin: task.fechaFin });
  };

  const saveEditTask = () => {
    if (!editingTask) return;
    onUpdateTask(editingTask, { fechaInicio: editValues.inicio, fechaFin: editValues.fin });
    setEditingTask(null);
  };

  const COLUMN_COLORS: Record<string, string> = {
    'planeacion': '#94a3b8',
    'ejecucion': '#3b82f6',
    'pausado': '#f59e0b',
    'finalizado': '#10b981',
  };

  const HEADER_HEIGHT = 40;
  const TASK_HEIGHT = 38;
  const LABEL_WIDTH = 220;
  const MIN_BAR_PX = 4;

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-slate-50 to-orange-50/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-slate-700">Diagrama de Gantt</h3>
            <span className="text-xs text-slate-400">({projectName})</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[10px] text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                checked={showCriticalPath}
                onChange={() => setShowCriticalPath(!showCriticalPath)}
                className="accent-orange-500"
              />
              <AlertTriangle className="w-3 h-3 text-orange-500" />
              Ruta Crítica
            </label>
            <span className="text-[10px] text-slate-400">
              {formatDate(projectStart)} → {formatDate(projectEnd)} ({totalDays} días)
            </span>
            <div className="flex bg-slate-200 rounded-lg p-0.5">
              {(['dias', 'semanas', 'meses'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-2 py-1 text-[10px] rounded-md font-medium transition-colors ${
                    viewMode === mode ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Leyenda */}
        <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-3 h-1.5 rounded-full bg-emerald-500 inline-block" /> Completado
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-1.5 rounded-full bg-blue-500 inline-block" /> En progreso
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-1.5 rounded-full bg-amber-400 inline-block" /> Crítico
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-1.5 rounded-full bg-red-500 inline-block" /> Retrasado
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1 h-3 bg-red-400 inline-block" /> Hoy
          </span>
        </div>
      </div>

      {/* Timeline + Body */}
      <div className="overflow-x-auto" ref={scrollRef}>
        <div className="min-w-[800px]">
          {/* Timeline Header */}
          <div className="flex" style={{ height: HEADER_HEIGHT }}>
            <div className="shrink-0 border-r border-slate-200 bg-slate-50" style={{ width: LABEL_WIDTH }}>
              <div className="h-full flex items-center px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Actividad
              </div>
            </div>
            <div className="flex-1 relative bg-slate-50" style={{ minHeight: HEADER_HEIGHT }}>
              <div className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                style={{
                  left: `${Math.min(Math.max((daysBetween(projectStart, new Date().toISOString().slice(0, 10)) / totalDays) * 100, 0), 100)}%`,
                  opacity: 0.6
                }}
              />
              {timeline.map((t, i) => (
                <div key={i} className="absolute top-0 text-[8px] text-slate-400 pt-1"
                  style={{ left: `${(t.dayOffset / totalDays) * 100}%`, transform: 'translateX(-50%)' }}>
                  {t.label}
                </div>
              ))}
            </div>
          </div>

          {/* Task Rows */}
          <div className="divide-y divide-slate-50">
            {taskBars.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No hay actividades para mostrar
              </div>
            ) : taskBars.map((t) => {
              const isExpanded = expandedTasks.has(t.codigo);
              return (
                <div key={t.codigo}>
                  <div className="flex hover:bg-slate-50 transition-colors group cursor-pointer"
                    style={{ height: TASK_HEIGHT }}
                    onClick={() => startEditTask(t)}>
                    <div className="shrink-0 border-r border-slate-100 flex items-center gap-1 px-2"
                      style={{ width: LABEL_WIDTH }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleTask(t.codigo); }}
                        className="text-slate-400 hover:text-slate-600">
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>
                      {t.isCritical && showCriticalPath && <AlertTriangle className="w-3 h-3 text-orange-500 shrink-0" />}
                      <span className="text-[10px] font-mono bg-slate-100 px-1 rounded text-slate-500 shrink-0">{t.codigo}</span>
                      <span className="text-xs text-slate-700 truncate">{t.nombre}</span>
                    </div>
                    <div className="flex-1 relative">
                      {timeline.map((tl, i) => (
                        <div key={i} className="absolute top-0 bottom-0 border-l border-slate-100"
                          style={{ left: `${(tl.dayOffset / totalDays) * 100}%` }} />
                      ))}
                      <div className={`absolute top-1/2 -translate-y-1/2 rounded-full cursor-pointer transition-all duration-300 group-hover:shadow-md ${
                        t.delay ? 'ring-2 ring-red-400' : t.isCritical && showCriticalPath ? 'ring-2 ring-orange-400 ring-opacity-60' : ''
                      }`}
                        style={{
                          left: `${t.pctLeft}%`,
                          width: `${Math.max(t.pctWidth, MIN_BAR_PX / 100)}%`,
                          height: TASK_HEIGHT * 0.55,
                          background: t.delay ? '#ef4444' : t.avance >= 100 ? '#10b981' : '#3b82f6',
                          minWidth: MIN_BAR_PX,
                          transition: 'width 0.5s ease',
                        }}
                        title={`${t.nombre}: ${t.cantidad} ${t.unidad} (${t.duration} días, ${t.avance}%)`}>
                        {t.pctWidth > 12 && (
                          <div className="flex items-center justify-between px-2 h-full text-[9px] text-white font-medium truncate">
                            <span>{t.cantidad} {t.unidad}</span>
                            <span>{t.duration}d</span>
                          </div>
                        )}
                      </div>
                      {t.avance < 100 && t.pctWidth > 8 && (
                        <div className="absolute top-1/2 -translate-y-1/2 h-full rounded-full opacity-30"
                          style={{
                            left: `${t.pctLeft}%`,
                            width: `${(t.avance / 100) * t.pctWidth}%`,
                            background: t.delay ? '#ef4444' : '#10b981',
                            minWidth: MIN_BAR_PX,
                            transition: 'width 0.5s ease',
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-slate-50 px-3 py-3 border-t border-slate-100">
                      {editingTask === t.codigo ? (
                        <div className="flex items-center gap-3">
                          <div>
                            <label className="text-[10px] text-slate-500 block">Inicio</label>
                            <input type="date" value={editValues.inicio} onChange={e => setEditValues(prev => ({ ...prev, inicio: e.target.value }))}
                              className="text-xs px-2 py-1 rounded border border-slate-200" />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block">Fin</label>
                            <input type="date" value={editValues.fin} onChange={e => setEditValues(prev => ({ ...prev, fin: e.target.value }))}
                              className="text-xs px-2 py-1 rounded border border-slate-200" />
                          </div>
                          <button onClick={saveEditTask} className="mt-4 bg-emerald-500 text-white px-3 py-1 rounded text-[10px]">Guardar</button>
                          <button onClick={() => setEditingTask(null)} className="mt-4 bg-slate-200 text-slate-600 px-3 py-1 rounded text-[10px]">Cancelar</button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px] block">Cantidad</span>
                            <span className="font-semibold text-slate-700">{t.cantidad} {t.unidad}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Rendimiento</span>
                            <span className="font-semibold text-slate-700">{t.rendimiento} {t.unidad}/día</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Duración</span>
                            <span className="font-semibold text-slate-700">{t.duration} días</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Estado</span>
                            <div className="flex items-center gap-1">
                              {t.avance >= 100 ? <CheckCircle className="w-3 h-3 text-emerald-500" /> :
                               t.delay ? <AlertTriangle className="w-3 h-3 text-red-500" /> :
                               <Clock className="w-3 h-3 text-blue-500" />}
                              <span className="font-semibold text-slate-700">{t.avance}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex gap-4">
              <span>{taskBars.length} actividades</span>
              <span>{taskBars.filter(t => t.isCritical).length} ruta crítica</span>
              <span>{taskBars.filter(t => t.delay).length} retrasadas</span>
            </div>
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> {taskBars.filter(t => t.avance >= 100).length} completadas
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> {taskBars.filter(t => t.avance > 0 && t.avance < 100).length} en curso
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-500" /> {taskBars.filter(t => t.avance === 0).length} pendientes
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedGantt;