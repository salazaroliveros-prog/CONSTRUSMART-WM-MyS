import React, { useMemo, useState, useRef } from 'react';
import { useErp } from '../store';
import { fmtQ, todayISO } from '../utils';
import {
  TrendingUp, AlertTriangle, DollarSign, Download,
  BarChart3, Target,
} from 'lucide-react';
import { toast } from 'sonner';

// Curva S teórica: genera el programado siguiendo la forma logística (sigmoide)
const generarCurvaSTeorica = (total: number, meses: number): number[] => {
  const puntos: number[] = [];
  for (let i = 0; i < meses; i++) {
    const t = (i + 1) / meses;
    const pctProg = 100 / (1 + Math.exp(-8 * (t - 0.5)));
    const pctProgNorm = (pctProg - 100 / (1 + Math.exp(4))) / (100 / (1 + Math.exp(-4)) - 100 / (1 + Math.exp(4))) * 100;
    puntos.push(+(total * Math.min(pctProgNorm, 100) / 100).toFixed(0));
  }
  return puntos;
};

// Genera el real acumulado mes a mes desde los avances registrados
const generarRealDesdeAvances = (avances: { fecha: string; avanceFisico: number }[], total: number, fechaInicio: Date, meses: number): (number | null)[] => {
  if (avances.length === 0) return Array(meses).fill(null);
  const sorted = [...avances].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const real: (number | null)[] = [];
  for (let i = 0; i < meses; i++) {
    const avancesMes = sorted.filter(a => {
      if (!a.fecha) return false;
      const aDate = new Date(a.fecha);
      const diffMonths = (aDate.getFullYear() - fechaInicio.getFullYear()) * 12 + (aDate.getMonth() - fechaInicio.getMonth());
      return diffMonths === i;
    });
    if (avancesMes.length > 0) {
      const ultimoAvance = avancesMes[avancesMes.length - 1];
      real.push(+(total * Math.min(ultimoAvance.avanceFisico, 100) / 100).toFixed(0));
    } else if (real.length > 0 && real[real.length - 1] !== null) {
      real.push(real[real.length - 1]);
    } else {
      real.push(null);
    }
  }
  return real;
};

const CurvasS: React.FC = () => {
  const { proyectos, movimientos, avances } = useErp();
  const chartRef = useRef<HTMLDivElement>(null);

  const [selectedProyectoId, setSelectedProyectoId] = useState('');
  const [selectedView, setSelectedView] = useState<'curvas' | 'flujo' | 'alertas'>('curvas');

  const proyecto = proyectos.find(p => p.id === selectedProyectoId);

  const curvaS = useMemo(() => {
    if (!proyecto) return null;
    const presupuesto = proyecto.presupuestoTotal || 1;
    const fechaInicio = new Date(proyecto.fechaInicio);
    const fechaFin = new Date(proyecto.fechaFin);
    const mesesTotales = Math.max(1, Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (30 * 24 * 60 * 60 * 1000)));

    // Programado teórico (curva S logística)
    const programado = generarCurvaSTeorica(presupuesto, mesesTotales);

    // Real desde avances registrados en Supabase
    const proyAvances = avances
      .filter(a => a.proyectoId === proyecto.id)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
    const real = generarRealDesdeAvances(proyAvances, presupuesto, fechaInicio, mesesTotales);

    return programado.map((prog, i) => ({
      mes: i + 1,
      label: `Mes ${i + 1}`,
      programado: prog,
      real: real[i],
    }));
  }, [proyecto, avances]);

  // ===== FLUJO DE CAJA =====
  const flujoCaja = useMemo(() => {
    const hoy = new Date();
    const meses: { label: string; ingresos: number; egresos: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      meses.push({
        label: fecha.toLocaleDateString('es-GT', { month: 'short', year: '2-digit' }),
        ingresos: 0,
        egresos: 0,
      });
    }
    movimientos.forEach(m => {
      if (!m.fecha) return;
      const fechaMov = new Date(m.fecha);
      if (isNaN(fechaMov.getTime())) return;
      const diffMonths = (hoy.getFullYear() - fechaMov.getFullYear()) * 12 + (hoy.getMonth() - fechaMov.getMonth());
      const idx = 11 - diffMonths;
      if (idx >= 0 && idx < 12) {
        if (m.tipo === 'ingreso') meses[idx].ingresos += (m.costoTotal ?? m.monto ?? 0);
        else meses[idx].egresos += (m.costoTotal ?? m.monto ?? 0);
      }
    });
    return meses;
  }, [movimientos]);

  // ===== ALERTAS PREDICTIVAS =====
  const alertas = useMemo(() => {
    const list: { tipo: 'danger' | 'warning' | 'info'; titulo: string; desc: string; valor: string }[] = [];

    proyectos.filter(p => p.estado !== 'finalizado').forEach(p => {
      // Desviación > 10%
      if (p.avanceFisico > 0 && p.avanceFinanciero > 0) {
        const desviacion = Math.abs(p.avanceFisico - p.avanceFinanciero);
        if (desviacion > 10) {
          list.push({
            tipo: 'danger',
            titulo: `⚠️ Desviación crítica: ${p.nombre}`,
            desc: `Avance físico (${p.avanceFisico}%) vs financiero (${p.avanceFinanciero}%) — diferencia ${desviacion.toFixed(0)}%`,
            valor: `${desviacion.toFixed(0)}%`,
          });
        }
      }

      // Proyección sobrecosto
      const movsProy = movimientos.filter(m => m.proyectoId === p.id);
      const totalGastado = movsProy.filter(m => m.tipo === 'gasto').reduce((a, b) => a + (b.costoTotal ?? b.monto ?? 0), 0);
      if (p.avanceFisico > 0 && totalGastado > 0) {
        const costoProyectado = (totalGastado / (p.avanceFisico / 100));
        const sobrecosto = costoProyectado - p.presupuestoTotal;
        if (sobrecosto > 0) {
          const pctSobrecosto = (sobrecosto / p.presupuestoTotal) * 100;
          list.push({
            tipo: pctSobrecosto > 15 ? 'danger' : 'warning',
            titulo: `💰 ${pctSobrecosto > 15 ? 'Sobrecosto severo' : 'Posible sobrecosto'}: ${p.nombre}`,
            desc: `Presupuesto: ${fmtQ(p.presupuestoTotal)} · Proyectado: ${fmtQ(costoProyectado)} · Diferencia: ${fmtQ(sobrecosto)}`,
            valor: `${pctSobrecosto.toFixed(1)}%`,
          });
        }
      }
    });

    // Quema de horas hombre (simplificada con empleados)
    const totalSalarios = movimientos
      .filter(m => m.tipo === 'gasto' && m.categoria === 'mano_obra')
      .reduce((a, b) => a + (b.costoTotal ?? b.monto ?? 0), 0);
    if (totalSalarios > 0) {
      list.push({
        tipo: 'info',
        titulo: '👷 Quema de horas hombre',
        desc: `Total gastado en mano de obra: ${fmtQ(totalSalarios)} en todos los proyectos`,
        valor: fmtQ(totalSalarios),
      });
    }

    // Resumen ingresos vs egresos
    const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((a, b) => a + (b.costoTotal ?? b.monto ?? 0), 0);
    const egresos = movimientos.filter(m => m.tipo === 'gasto').reduce((a, b) => a + (b.costoTotal ?? b.monto ?? 0), 0);
    const ratio = egresos > 0 ? ingresos / egresos : 0;
    if (ratio < 1) {
      list.push({
        tipo: 'warning',
        titulo: '📉 Flujo de caja negativo',
        desc: `Ingresos: ${fmtQ(ingresos)} · Egresos: ${fmtQ(egresos)} · Ratio: ${ratio.toFixed(2)}`,
        valor: `${((1 - ratio) * 100).toFixed(0)}%`,
      });
    }

    return list;
  }, [proyectos, movimientos]);

  const handleExportImage = () => {
    if (chartRef.current) {
      import('html2canvas').then(html2canvas => {
        html2canvas.default(chartRef.current!).then(canvas => {
          const link = document.createElement('a');
          link.download = `curvas-s-${proyecto?.nombre || 'general'}-${todayISO()}.png`;
          link.href = canvas.toDataURL();
          link.click();
          toast.success('📸 Curvas exportadas como imagen');
        });
      }).catch(() => {
        toast.error('Error al exportar imagen');
      });
    }
  };

  const maxValorCurva = Math.max(
    ...(curvaS?.map(p => p.programado) || [1]),
    ...(curvaS?.map(p => p.real || 0) || [0]),
    1
  );

  const maxFlujo = Math.max(
    ...flujoCaja.map(m => Math.max(m.ingresos, m.egresos, 1))
  );

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-indigo-500" /> Curvas S y Flujo de Caja
        </h1>
        <div className="flex gap-2">
          <select
            value={selectedProyectoId}
            onChange={e => setSelectedProyectoId(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-400 bg-white"
          >
            <option value="">— Todos los proyectos —</option>
            {proyectos.filter(p => p.estado !== 'finalizado').map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          <button onClick={handleExportImage} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors">
            <Download className="w-3.5 h-3.5" aria-hidden="true" /> Exportar
          </button>
        </div>
      </div>

      {/* KPIs del proyecto seleccionado */}
      {proyecto && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 border border-slate-100">
            <div className="text-[10px] text-slate-400">Presupuesto</div>
            <div className="text-lg font-bold text-slate-800">{fmtQ(proyecto.presupuestoTotal)}</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-100">
            <div className="text-[10px] text-slate-400">Avance Físico</div>
            <div className="text-lg font-bold text-blue-600">{proyecto.avanceFisico}%</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-100">
            <div className="text-[10px] text-slate-400">Avance Financiero</div>
            <div className="text-lg font-bold text-emerald-600">{proyecto.avanceFinanciero}%</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-100">
            <div className="text-[10px] text-slate-400">Duración</div>
            <div className="text-lg font-bold text-slate-800">
              {Math.ceil((new Date(proyecto.fechaFin).getTime() - new Date(proyecto.fechaInicio).getTime()) / (30 * 24 * 60 * 60 * 1000))} meses
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-4 bg-white rounded-xl p-1 shadow-sm border border-slate-100">
        {([
          { id: 'curvas' as const, label: 'Curva S', icon: BarChart3 },
          { id: 'flujo' as const, label: 'Flujo de Caja', icon: DollarSign },
          { id: 'alertas' as const, label: `Alertas (${alertas.length})`, icon: AlertTriangle },
        ]).map(tab => {
          const Icon = tab.icon;
          const isActive = selectedView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                isActive ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div ref={chartRef} className="space-y-4">
        {selectedView === 'curvas' && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-700 text-sm">Curva S — Programado vs Real</h2>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-indigo-400" />
                  <span className="text-slate-500">Programado</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-orange-400" />
                  <span className="text-slate-500">Real</span>
                </div>
              </div>
            </div>

            {!curvaS ? (
              <div className="text-center py-8 text-sm text-slate-400">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                Selecciona un proyecto para ver la curva S
              </div>
            ) : (
              <div className="relative h-64">
                {/* Y axis labels */}
                <div className="absolute left-0 inset-y-0 w-12 flex flex-col justify-between text-[10px] text-slate-400 pr-2">
                  <span>{fmtQ(maxValorCurva)}</span>
                  <span>{fmtQ(maxValorCurva / 2)}</span>
                  <span>Q0</span>
                </div>
                {/* Chart area */}
                <div className="ml-14 h-full relative">
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                    <div
                      key={pct}
                      className="absolute left-0 right-0 border-t border-dashed border-slate-100"
                      style={{ bottom: `${pct * 100}%` }}
                    />
                  ))}
                  {/* Bars */}
                  <div className="absolute inset-0 flex items-end gap-1">
                    {curvaS.map((punto, i) => {
                      const progH = (punto.programado / maxValorCurva) * 100;
                      const realH = punto.real !== null ? (punto.real / maxValorCurva) * 100 : 0;
                      const desviacion = punto.real !== null ? punto.programado - punto.real : 0;
                      const alerta = Math.abs(desviacion) / (punto.programado || 1) > 0.1;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative">
                          {/* Barra programado */}
                          <div
                            className="w-full max-w-[20px] bg-indigo-400 rounded-t transition-all"
                            style={{ height: `${progH}%`, minHeight: progH > 0 ? 2 : 0 }}
                          />
                          {/* Barra real */}
                          {punto.real !== null && (
                            <div
                              className={`w-full max-w-[20px] rounded-t transition-all ${alerta ? 'bg-red-400' : 'bg-orange-400'}`}
                              style={{ height: `${realH}%`, minHeight: realH > 0 ? 2 : 0 }}
                            />
                          )}
                          {/* Tooltip */}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            {punto.label}: Prog={fmtQ(punto.programado)}
                            {punto.real !== null && ` · Real=${fmtQ(punto.real)}`}
                            {alerta && ` ⚠️`}
                          </div>
                          {/* X label */}
                          <span className="text-[8px] text-slate-400 mt-1">{punto.mes}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Leyenda desviaciones */}
            {curvaS && (
              <div className="mt-3 flex flex-wrap gap-2">
                {curvaS.filter(p => p.real !== null).map((p, i) => {
                  const desv = ((p.programado - (p.real || 0)) / (p.programado || 1)) * 100;
                  return (
                    <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      Math.abs(desv) > 10
                        ? 'bg-red-50 text-red-600'
                        : Math.abs(desv) > 5
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      Mes {p.mes}: {desv > 0 ? '-' : '+'}{Math.abs(desv).toFixed(1)}%
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {selectedView === 'flujo' && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-700 text-sm">Flujo de Caja — 12 meses</h2>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-emerald-400" />
                  <span className="text-slate-500">Ingresos</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-400" />
                  <span className="text-slate-500">Egresos</span>
                </div>
              </div>
            </div>

            {/* Gráfico de flujo */}
            <div className="relative h-52">
              <div className="absolute left-0 inset-y-0 w-12 flex flex-col justify-between text-[10px] text-slate-400 pr-2">
                <span>{fmtQ(maxFlujo)}</span>
                <span>{fmtQ(maxFlujo / 2)}</span>
                <span>Q0</span>
              </div>
              <div className="ml-14 h-full">
                {[0, 0.5, 1].map(pct => (
                  <div key={pct} className="relative h-1/2 border-t border-dashed border-slate-100" />
                ))}
                <div className="absolute inset-0 flex items-end gap-1 ml-14 mr-0" style={{ marginLeft: 0 }}>
                  {flujoCaja.map((m, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative">
                      {/* Ingreso bar */}
                      <div
                        className="w-full max-w-[16px] bg-emerald-400 rounded-t transition-all"
                        style={{ height: `${(m.ingresos / maxFlujo) * 100}%`, minHeight: m.ingresos > 0 ? 2 : 0 }}
                      />
                      {/* Egreso bar */}
                      <div
                        className="w-full max-w-[16px] bg-red-400 rounded-t transition-all"
                        style={{ height: `${(m.egresos / maxFlujo) * 100}%`, minHeight: m.egresos > 0 ? 2 : 0 }}
                      />
                      {/* Tooltip */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {m.label}: I={fmtQ(m.ingresos)} · E={fmtQ(m.egresos)}
                      </div>
                      <span className="text-[8px] text-slate-400 mt-1">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resumen flujo */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-emerald-50 rounded-xl p-2 text-center">
                <div className="text-[9px] text-emerald-600 font-medium">Total Ingresos</div>
                <div className="text-sm font-bold text-emerald-700">
                  {fmtQ(flujoCaja.reduce((a, b) => a + b.ingresos, 0))}
                </div>
              </div>
              <div className="bg-red-50 rounded-xl p-2 text-center">
                <div className="text-[9px] text-red-600 font-medium">Total Egresos</div>
                <div className="text-sm font-bold text-red-700">
                  {fmtQ(flujoCaja.reduce((a, b) => a + b.egresos, 0))}
                </div>
              </div>
              <div className="bg-indigo-50 rounded-xl p-2 text-center">
                <div className="text-[9px] text-indigo-600 font-medium">Saldo Neto</div>
                <div className="text-sm font-bold text-indigo-700">
                  {fmtQ(flujoCaja.reduce((a, b) => a + b.ingresos - b.egresos, 0))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'alertas' && (
          <div className="space-y-3">
            {alertas.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-sm text-slate-400 border border-slate-100">
                <Target className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                Sin alertas predictivas — todo dentro de parámetros ✅
              </div>
            ) : alertas.map((a, i) => (
              <div key={i} className={`rounded-2xl p-4 border shadow-sm ${
                a.tipo === 'danger' ? 'bg-red-50 border-red-200' :
                a.tipo === 'warning' ? 'bg-amber-50 border-amber-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-800">{a.titulo}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{a.desc}</div>
                  </div>
                  <span className={`shrink-0 text-sm font-bold px-2 py-1 rounded-lg ${
                    a.tipo === 'danger' ? 'bg-red-100 text-red-700' :
                    a.tipo === 'warning' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {a.valor}
                  </span>
                </div>
              </div>
            ))}

            {/* Resumen general */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-700 text-sm mb-3">📊 Resumen Predictivo General</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-[10px] text-slate-400">Proyectos activos</div>
                  <div className="text-lg font-bold text-slate-700">{proyectos.filter(p => p.estado === 'ejecucion').length}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-[10px] text-slate-400">Alertas activas</div>
                  <div className="text-lg font-bold text-red-600">{alertas.filter(a => a.tipo === 'danger').length}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-[10px] text-slate-400">Advertencias</div>
                  <div className="text-lg font-bold text-amber-600">{alertas.filter(a => a.tipo === 'warning').length}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurvasS;