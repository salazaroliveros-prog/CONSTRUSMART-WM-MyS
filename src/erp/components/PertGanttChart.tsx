import React, { useState, useMemo } from 'react';
import { Network, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface PertTask {
  codigo: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  avance: number;
  dependencias?: string[];
}

interface PertGanttProps {
  tasks: PertTask[];
  projectStart: string;
  projectEnd: string;
  projectName: string;
}

const DAY_MS = 86400000;

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY_MS) + 1;
}

const PertGanttChart: React.FC<PertGanttProps> = ({ tasks, projectStart, projectEnd, projectName }) => {
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'pert' | 'gantt' | 'combined'>('combined');

  const totalDays = Math.max(daysBetween(projectStart, projectEnd), 1);

  const taskData = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
    return sorted.map((t, i) => {
      const startOffset = Math.max(0, daysBetween(projectStart, t.fechaInicio) - 1);
      const duration = daysBetween(t.fechaInicio, t.fechaFin);
      const pctLeft = totalDays > 0 ? (startOffset / totalDays) * 100 : 0;
      const pctWidth = totalDays > 0 ? (duration / totalDays) * 100 : 0;
      const isDelayed = t.avance < 100 && t.fechaFin < new Date().toISOString().slice(0, 10);
      return { ...t, startOffset, duration, pctLeft, pctWidth, idx: i, isDelayed };
    });
  }, [tasks, projectStart, totalDays]);

  const criticalPath = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
    const maxFinish = Math.max(...sorted.map(t => daysBetween(projectStart, t.fechaFin)));
    const critical = new Set<string>();
    sorted.forEach(t => {
      const finish = daysBetween(projectStart, t.fechaFin);
      if (finish >= maxFinish - 2) critical.add(t.codigo);
    });
    return critical;
  }, [tasks, projectStart]);

  // Node positions for PERT network
  const nodePositions = useMemo(() => {
    const cols: Record<number, PertTask[]> = {};
    taskData.forEach(t => {
      const col = t.startOffset;
      if (!cols[col]) cols[col] = [];
      cols[col].push(t);
    });
    const positions: Record<string, { x: number; y: number }> = {};
    Object.entries(cols).forEach(([col, colTasks]) => {
      const x = parseInt(col);
      colTasks.forEach((t, i) => {
        positions[t.codigo] = { x: (x / totalDays) * 100, y: 15 + (i / colTasks.length) * 70 };
      });
    });
    return positions;
  }, [taskData, totalDays]);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-slate-50 to-teal-50/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-teal-500" />
            <h3 className="font-bold text-slate-700">PERT + Gantt</h3>
            <span className="text-xs text-slate-400">({projectName})</span>
          </div>
          <div className="flex bg-slate-200 rounded-lg p-0.5">
            {(['pert', 'gantt', 'combined'] as const).map(v => (
              <button key={v} onClick={() => setSelectedView(v)}
                className={`px-2 py-1 text-[10px] rounded-md font-medium transition-colors ${
                  selectedView === v ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                {v === 'pert' ? 'PERT' : v === 'gantt' ? 'Gantt' : 'Combinado'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PERT Network View */}
      {(selectedView === 'pert' || selectedView === 'combined') && (
        <div className={`p-4 ${selectedView === 'combined' ? 'border-b' : ''}`}>
          <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5" /> Red PERT (diagrama de red)
          </div>
          <div className="relative bg-slate-50 rounded-xl p-4" style={{ minHeight: 180 }}>
            <svg viewBox="0 0 100 100" className="w-full" preserveAspectRatio="xMidYMid meet">
              {/* Grid */}
              {[0, 20, 40, 60, 80].map(y => (
                <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e5e7eb" strokeWidth="0.2" />
              ))}
              {/* Dependency lines */}
              {taskData.map(t => {
                if (!t.dependencias) return null;
                return t.dependencias.map(dep => {
                  const from = nodePositions[dep];
                  const to = nodePositions[t.codigo];
                  if (!from || !to) return null;
                  const isCritical = criticalPath.has(t.codigo) && criticalPath.has(dep);
                  return (
                    <line key={`${dep}-${t.codigo}`}
                      x1={from.x + 3} y1={from.y}
                      x2={to.x - 3} y2={to.y}
                      stroke={isCritical ? '#f97316' : '#cbd5e1'}
                      strokeWidth={isCritical ? 0.8 : 0.4}
                      markerEnd={isCritical ? 'url(#arrow-orange)' : 'url(#arrow-gray)'}
                    />
                  );
                });
              })}
              {/* Arrow markers */}
              <defs>
                <marker id="arrow-orange" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f97316" />
                </marker>
                <marker id="arrow-gray" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
                </marker>
              </defs>
              {/* Task nodes */}
              {taskData.map(t => {
                const pos = nodePositions[t.codigo];
                if (!pos) return null;
                const isCrit = criticalPath.has(t.codigo);
                const isHov = hoveredTask === t.codigo;
                return (
                  <g key={t.codigo} onMouseEnter={() => setHoveredTask(t.codigo)}
                    onMouseLeave={() => setHoveredTask(null)}
                    className="cursor-pointer">
                    <circle cx={pos.x} cy={pos.y} r={isHov ? 3.5 : 2.8}
                      fill={isCrit ? '#f97316' : t.avance >= 100 ? '#10b981' : '#3b82f6'}
                      stroke={isCrit ? '#ea580c' : '#fff'}
                      strokeWidth={isCrit ? 0.6 : 0.3}
                      className="transition-all duration-300" />
                    {isHov && (
                      <text x={pos.x} y={pos.y - 4} fontSize="2.2" textAnchor="middle" fill="#334155" fontWeight="600">
                        {t.codigo}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            <div className="absolute bottom-2 left-2 flex gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Crítica</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Normal</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Completada</span>
            </div>
          </div>
        </div>
      )}

      {/* Gantt View */}
      {(selectedView === 'gantt' || selectedView === 'combined') && (
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header */}
            <div className="flex" style={{ height: 32 }}>
              <div className="shrink-0 border-r border-slate-200 bg-slate-50" style={{ width: 180 }}>
                <div className="h-full flex items-center px-3 text-[9px] font-semibold text-slate-500">Actividad</div>
              </div>
              <div className="flex-1 relative bg-slate-50">
                {taskData.map((t, i) => {
                  const x = ((t.startOffset) / totalDays) * 100;
                  return (
                    <div key={i} className="absolute top-0 text-[7px] text-slate-400 pt-0.5"
                      style={{ left: `${x}%`, transform: 'translateX(-50%)' }}>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Rows */}
            {taskData.map(t => (
              <div key={t.codigo} className="flex hover:bg-slate-50 transition-colors"
                style={{ height: 28 }}>
                <div className="shrink-0 border-r border-slate-100 flex items-center gap-1 px-2"
                  style={{ width: 180 }}>
                  <span className="text-[9px] font-mono text-slate-500 truncate">{t.codigo}</span>
                  <span className="text-[9px] text-slate-700 truncate">{t.nombre}</span>
                </div>
                <div className="flex-1 relative">
                  <div className={`absolute top-1/2 -translate-y-1/2 rounded-full transition-all ${
                    t.isDelayed ? 'bg-red-400 ring-1 ring-red-500' : criticalPath.has(t.codigo) ? 'bg-orange-400 ring-1 ring-orange-500' : 'bg-blue-400'
                  }`}
                    style={{
                      left: `${t.pctLeft}%`,
                      width: `${Math.max(t.pctWidth, 2)}%`,
                      height: 10,
                      minWidth: 4,
                      transition: 'width 0.3s ease',
                    }}
                    title={`${t.nombre} — ${t.duration} días — ${t.avance}%`} />
                  {t.avance > 0 && t.pctWidth > 5 && (
                    <div className="absolute top-1/2 -translate-y-1/2 rounded-full bg-emerald-400 opacity-50"
                      style={{
                        left: `${t.pctLeft}%`,
                        width: `${(t.avance / 100) * t.pctWidth}%`,
                        height: 10,
                        minWidth: 2,
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PertGanttChart;