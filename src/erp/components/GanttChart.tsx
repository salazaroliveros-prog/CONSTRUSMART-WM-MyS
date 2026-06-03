import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Calendar } from 'lucide-react';

export interface GanttTask {
  codigo: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  rendimiento: number; // unidades/día
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string;
  avance: number; // 0-100
  expanded?: boolean;
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

const BarColor = (avance: number, idx: number) => {
  const colors = ['#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#14b8a6', '#f43f5e', '#6366f1'];
  if (avance >= 100) return '#10b981';
  if (avance >= 50) return colors[idx % colors.length];
  return colors[idx % colors.length] + '99';
};

const GanttChart: React.FC<GanttChartProps> = ({ tasks, projectStart, projectEnd, projectName, onUpdateTask }) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ inicio: string; fin: string }>({ inicio: '', fin: '' });
  const [viewMode, setViewMode] = useState<'semanas' | 'meses'>('semanas');
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalDays = Math.max(daysBetween(projectStart, projectEnd), 1);

  // Generar timeline por semanas/meses
  const timeline = useMemo(() => {
    const dates: { label: string; date: string; dayOffset: number }[] = [];
    const start = new Date(projectStart);
    const end = new Date(projectEnd);
    
    if (viewMode === 'semanas') {
      const iterDate = new Date(start);
      while (iterDate <= end) {
        const dayOfWeek = iterDate.getDay();
        if (dayOfWeek === 1 || dayOfWeek === 0) { // Lunes o Domingo para marcadores
          const offset = Math.round((iterDate.getTime() - start.getTime()) / DAY_MS);
          dates.push({
            label: iterDate.toLocaleDateString('es-GT', { day: 'numeric', month: 'short' }),
            date: iterDate.toISOString().slice(0, 10),
            dayOffset: Math.max(0, offset),
          });
        }
        iterDate.setDate(iterDate.getDate() + 1);
      }
    } else {
      // Meses
      const monthDate = new Date(start.getFullYear(), start.getMonth(), 1);
      while (monthDate <= end) {
        const offset = Math.round((monthDate.getTime() - start.getTime()) / DAY_MS);
        dates.push({
          label: monthDate.toLocaleDateString('es-GT', { month: 'short', year: '2-digit' }),
          date: monthDate.toISOString().slice(0, 10),
          dayOffset: Math.max(0, offset),
        });
        monthDate.setMonth(monthDate.getMonth() + 1);
      }
    }
    return dates;
  }, [projectStart, projectEnd, viewMode]);

  // Calcular posición y ancho de cada barra
  const taskBars = useMemo(() => {
    return tasks.map((t, idx) => {
      const startOffset = Math.max(0, daysBetween(projectStart, t.fechaInicio) - 1);
      const duration = daysBetween(t.fechaInicio, t.fechaFin);
      const pctWidth = totalDays > 0 ? (duration / totalDays) * 100 : 0;
      const pctLeft = totalDays > 0 ? (startOffset / totalDays) * 100 : 0;
      return { ...t, startOffset, duration, pctWidth, pctLeft, idx };
    });
  }, [tasks, projectStart, totalDays]);

  const toggleTask = (id: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const startEditTask = (task: GanttTask) => {
    setEditingTask(task.id);
    setEditValues({ inicio: task.fechaInicio, fin: task.fechaFin });
  };

  const saveEditTask = () => {
    if (!editingTask) return;
    if (editValues.inicio && editValues.fin && editValues.inicio <= editValues.fin) {
      onUpdateTask(editingTask, { fechaInicio: editValues.inicio, fechaFin: editValues.fin });
    }
    setEditingTask(null);
  };

  // Auto-scroll al timeline actual
  useEffect(() => {
    if (scrollRef.current) {
      const today = new Date();
      const todayOffset = daysBetween(projectStart, today.toISOString().slice(0, 10));
      const scrollPct = totalDays > 0 ? todayOffset / totalDays : 0;
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth * scrollPct * 0.3;
    }
  }, [tasks, totalDays, projectStart]);

  const TASK_HEIGHT = 36;
  const LABEL_WIDTH = 200;
  const HEADER_HEIGHT = 40;
  const MIN_BAR_PX = 4;

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-700">Diagrama de Gantt</h3>
            <span className="text-xs text-slate-400">({projectName})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">
              {formatDate(projectStart)} → {formatDate(projectEnd)} ({totalDays} días)
            </span>
            <div className="flex bg-slate-200 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('semanas')}
                className={`px-2 py-1 text-[10px] rounded-md font-medium transition-colors ${
                  viewMode === 'semanas' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                Semanas
              </button>
              <button
                onClick={() => setViewMode('meses')}
                className={`px-2 py-1 text-[10px] rounded-md font-medium transition-colors ${
                  viewMode === 'meses' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                Meses
              </button>
            </div>
          </div>
        </div>
        {/* Leyenda */}
        <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-emerald-500 inline-block" /> Completado (100%)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-blue-500 inline-block" /> En progreso</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-amber-400 inline-block" /> Crítico</span>
          <span className="flex items-center gap-1"><span className="w-1 h-3 bg-red-400 inline-block" /> Hoy</span>
        </div>
      </div>

      {/* Timeline Header */}
      <div className="overflow-x-auto" ref={scrollRef}>
        <div className="min-w-[800px]">
          <div className="flex" style={{ height: HEADER_HEIGHT }}>
            {/* Columna de nombres */}
            <div className="shrink-0 border-r border-slate-200 bg-slate-50" style={{ width: LABEL_WIDTH }}>
              <div className="h-full flex items-center px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Actividad / Renglón
              </div>
            </div>
            {/* Timeline */}
            <div className="flex-1 relative bg-slate-50" style={{ minHeight: HEADER_HEIGHT }}>
              {/* Línea de hoy */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                style={{ 
                  left: `${Math.min(Math.max((daysBetween(projectStart, new Date().toISOString().slice(0, 10)) / totalDays) * 100, 0), 100)}%`,
                  opacity: 0.6 
                }}
              />
              {timeline.map((t, i) => (
                <div
                  key={i}
                  className="absolute top-0 text-[8px] text-slate-400 pt-1"
                  style={{ left: `${(t.dayOffset / totalDays) * 100}%`, transform: 'translateX(-50%)' }}
                >
                  {t.label}
                </div>
              ))}
            </div>
          </div>

          {/* Cuerpo del Gantt */}
          <div className="divide-y divide-slate-50">
            {taskBars.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No hay actividades para mostrar. Agrega renglones en el presupuesto.
              </div>
            ) : taskBars.map((t) => {
              const isExpanded = expandedTasks.has(t.id);
              return (
                <div key={t.id}>
                  {/* Fila principal */}
                  <div 
                    className="flex hover:bg-slate-50 transition-colors group cursor-pointer"
                    style={{ height: TASK_HEIGHT }}
                    onClick={() => startEditTask(t)}
                  >
                    {/* Nombre */}
                    <div className="shrink-0 border-r border-slate-100 flex items-center gap-1 px-2" style={{ width: LABEL_WIDTH }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleTask(t.id); }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>
                      <span className="text-[10px] font-mono bg-slate-100 px-1 rounded text-slate-500 shrink-0">{t.codigo}</span>
                      <span className="text-xs text-slate-700 truncate">{t.nombre}</span>
                    </div>
                    {/* Barra de tiempo */}
                    <div className="flex-1 relative">
                      {/* Fondo de cuadrícula */}
                      {timeline.map((tl, i) => (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 border-l border-slate-100"
                          style={{ left: `${(tl.dayOffset / totalDays) * 100}%` }}
                        />
                      ))}
                      {/* Barra del renglón */}
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 rounded-full cursor-pointer transition-all duration-300 group-hover:shadow-md ${
                          t.avance >= 100 ? 'opacity-80' : ''
                        }`}
                        style={{
                          left: `${t.pctLeft}%`,
                          width: `${Math.max(t.pctWidth, MIN_BAR_PX / 100)}%`,
                          height: TASK_HEIGHT * 0.55,
                          background: BarColor(t.avance, t.idx),
                          minWidth: MIN_BAR_PX,
                        }}
                        title={`${t.nombre}: ${t.cantidad} ${t.unidad} (${t.duration} días, ${t.avance}%)`}
                      >
                        {/* Label dentro de la barra si es suficientemente ancha */}
                        {t.pctWidth > 12 && (
                          <div className="flex items-center justify-between px-2 h-full text-[9px] text-white font-medium truncate">
                            <span>{t.cantidad} {t.unidad}</span>
                            <span>{t.duration}d</span>
                          </div>
                        )}
                      </div>
                      {/* Indicador de avance dentro de la barra */}
                      {t.avance < 100 && t.pctWidth > 8 && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-full rounded-full opacity-30"
                          style={{
                            left: `${t.pctLeft}%`,
                            width: `${(t.avance / 100) * t.pctWidth}%`,
                            background: '#10b981',
                            minWidth: MIN_BAR_PX,
                            transition: 'width 0.5s ease',
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Detalle expandido */}
                  {isExpanded && (
                    <div className="bg-slate-50 px-3 py-3 border-t border-slate-100">
                      {editingTask === t.id ? (
                        <div className="flex items-center gap-3">
                          <div>
                            <label className="text-[10px] text-slate-500 block">Inicio</label>
                            <input
                              type="date"
                              value={editValues.inicio}
                              onChange={e => setEditValues(prev => ({ ...prev, inicio: e.target.value }))}
                              className="text-xs px-2 py-1 rounded border border-slate-200"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block">Fin</label>
                            <input
                              type="date"
                              value={editValues.fin}
                              onChange={e => setEditValues(prev => ({ ...prev, fin: e.target.value }))}
                              className="text-xs px-2 py-1 rounded border border-slate-200"
                            />
                          </div>
                          <button
                            onClick={saveEditTask}
                            className="mt-4 bg-emerald-500 text-white px-3 py-1 rounded text-[10px] hover:bg-emerald-600"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingTask(null)}
                            className="mt-4 bg-slate-200 text-slate-600 px-3 py-1 rounded text-[10px] hover:bg-slate-300"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
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
                            <span className="text-slate-400 text-[10px] block">Avance</span>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{ width: `${t.avance}%`, background: t.avance >= 100 ? '#10b981' : '#3b82f6' }}
                                />
                              </div>
                              <span className={`font-semibold text-[10px] ${t.avance >= 100 ? 'text-emerald-600' : 'text-blue-600'}`}>
                                {t.avance}%
                              </span>
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-slate-400 text-[10px] block">Fechas</span>
                            <span className="font-semibold text-slate-700">
                              {formatDate(t.fechaInicio)} → {formatDate(t.fechaFin)}
                            </span>
                          </div>
                          {t.subRenglones && t.subRenglones.length > 0 && (
                            <div className="md:col-span-2">
                              <span className="text-slate-400 text-[10px] block">Materiales ({t.subRenglones.length})</span>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {t.subRenglones.map((s, si) => (
                                  <span key={si} className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">
                                    {s.nombre}: {s.cantidad} {s.unidad}
                                  </span>
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

          {/* Footer: Resumen */}
          <div className="bg-slate-900 text-white p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex gap-4">
              <span>{taskBars.length} actividades</span>
              <span>{taskBars.reduce((a, t) => a + t.duration, 0)} días-hombre totales</span>
            </div>
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> 
                {taskBars.filter(t => t.avance >= 100).length} completadas
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> 
                {taskBars.filter(t => t.avance > 0 && t.avance < 100).length} en curso
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-500" /> 
                {taskBars.filter(t => t.avance === 0).length} pendientes
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;