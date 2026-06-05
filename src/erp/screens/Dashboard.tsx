import React, { useMemo, useState } from 'react';
import { useErp, type View } from '../store';
import { fmtQ, fmtPct, todayISO } from '../utils';
import KpiCard from '../components/KpiCard';
import Calendar from '../components/Calendar';
import MovimientoForm from '../components/MovimientoForm';
import { LineChart, BarChart, Donut } from '../components/Charts';
import { Building2, TrendingUp, DollarSign, AlertTriangle, Activity, Calculator, ClipboardCheck, Wallet, Users, Warehouse, ArrowRight, Target, Clock, CalendarDays } from 'lucide-react';
import { CARD, CARD_TITLE } from '../ui';
import CriticalRenglonAlert from '../components/CriticalRenglonAlert';
import LicitacionesDashboard from '../components/LicitacionesDashboard';
import CajasChicasWidget from '../components/CajasChicasWidget';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#fbbf24', '#ec4899'];

const Dashboard: React.FC = () => {
  const { proyectos, movimientos, presupuestos, empleados, costoPorHoraHombre, setView } = useErp();
  const [filtroProy, setFiltroProy] = useState('');

  const activos = proyectos.filter(p => p.estado === 'ejecucion');
  const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((a, b) => a + b.costoTotal, 0);
  const gastos = movimientos.filter(m => m.tipo === 'gasto').reduce((a, b) => a + b.costoTotal, 0);
  const presupuestoTotal = activos.reduce((a, b) => a + b.presupuestoTotal, 0);
  const margenProm = activos.length
    ? activos.reduce((a, b) => a + ((b.montoContrato - b.presupuestoTotal) / b.montoContrato) * 100, 0) / activos.length : 0;
  const desviacion = activos.length
    ? activos.reduce((a, b) => a + (b.avanceFinanciero - b.avanceFisico), 0) / activos.length : 0;

  // Gap #1: Densidad de costo (Q/m²), ROI y seguimiento de horas-hombre
  const densidadCosto = useMemo(() => {
    return proyectos.filter(p => p.presupuestoTotal > 0).map(p => {
      const gastos = movimientos.filter(m => m.proyectoId === p.id && m.tipo === 'gasto').reduce((a, b) => a + b.costoTotal, 0);
      const ingresos = movimientos.filter(m => m.proyectoId === p.id && m.tipo === 'ingreso').reduce((a, b) => a + b.costoTotal, 0);
      // Densidad de costo estimada (asume ~100m² por proyecto como default)
      const areaEstimada = 100;
      const densidad = gastos > 0 ? gastos / areaEstimada : 0;
      const roi = ingresos > 0 ? ((ingresos - gastos) / gastos) * 100 : 0;
      return { id: p.id, nombre: p.nombre, presupuesto: p.presupuestoTotal, gastos, ingresos, roi, densidad };
    });
  }, [proyectos, movimientos]);

  // Seguimiento de horas-hombre por empleado
  const horasHombreSeg = useMemo(() => {
    const totalDias = empleados.filter(e => e.activo).reduce((sum, e) => sum + (e.diasTrabajados || 0), 0);
    return { totalDias, totalHoras: totalDias * 8, empleadosActivos: empleados.filter(e => e.activo).length };
  }, [empleados]);

  // Gap #8: Estado de resultados (EERR) detallado por categoría
  const eerr = useMemo(() => {
    const totalIngresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((a, b) => a + b.costoTotal, 0);
    const totalGastos = movimientos.filter(m => m.tipo === 'gasto').reduce((a, b) => a + b.costoTotal, 0);
    const ingresosPorProyecto = proyectos.map(p => ({
      nombre: p.nombre,
      ingresos: movimientos.filter(m => m.proyectoId === p.id && m.tipo === 'ingreso').reduce((a, b) => a + b.costoTotal, 0),
      gastos: movimientos.filter(m => m.proyectoId === p.id && m.tipo === 'gasto').reduce((a, b) => a + b.costoTotal, 0),
      presupuesto: p.presupuestoTotal,
    }));
    const gastosPorCategoria = [... new Set(movimientos.filter(m => m.tipo === 'gasto').map(m => m.categoria))].map(cat => ({
      categoria: cat,
      monto: movimientos.filter(m => m.tipo === 'gasto' && m.categoria === cat).reduce((a, b) => a + b.costoTotal, 0),
      porcentaje: totalGastos > 0 ? (movimientos.filter(m => m.tipo === 'gasto' && m.categoria === cat).reduce((a, b) => a + b.costoTotal, 0) / totalGastos) * 100 : 0,
    })).sort((a, b) => b.monto - a.monto);
    const utilidadBruta = totalIngresos - totalGastos;
    const margenNeto = totalIngresos > 0 ? (utilidadBruta / totalIngresos) * 100 : 0;
    const roiGlobal = totalGastos > 0 ? ((totalIngresos - totalGastos) / totalGastos) * 100 : 0;
    return { totalIngresos, totalGastos, utilidadBruta, margenNeto, roiGlobal, gastosPorCategoria, ingresosPorProyecto };
  }, [movimientos, proyectos]);

  // M-01: Alertas de retraso y predicción de fecha de fin
  const hoy = todayISO();
  const alertasRetraso = useMemo(() => {
    return proyectos
      .filter(p => p.estado === 'ejecucion' && p.fechaFin && p.fechaFin < hoy && p.avanceFisico < 100)
      .map(p => ({
        id: p.id,
        nombre: p.nombre,
        fechaFin: p.fechaFin,
        avance: p.avanceFisico,
        diasRetraso: Math.round((new Date(hoy).getTime() - new Date(p.fechaFin).getTime()) / 86400000),
      }));
  }, [proyectos, hoy]);

  // M-02: Predicción de fecha de fin por tasa de avance
  const prediccionFechaFin = useMemo(() => {
    return proyectos
      .filter(p => p.estado === 'ejecucion' && p.avanceFisico > 0 && p.fechaInicio)
      .map(p => {
        const diasTranscurridos = Math.max(1, Math.round((new Date(hoy).getTime() - new Date(p.fechaInicio).getTime()) / 86400000));
        const tasaDiaria = p.avanceFisico / diasTranscurridos;
        const diasRestantes = tasaDiaria > 0 ? Math.round((100 - p.avanceFisico) / tasaDiaria) : 0;
        const fechaEstimada = new Date();
        fechaEstimada.setDate(fechaEstimada.getDate() + diasRestantes);
        return {
          id: p.id,
          nombre: p.nombre,
          avance: p.avanceFisico,
          tasaDiaria: +(tasaDiaria * 100).toFixed(2),
          diasRestantes,
          fechaEstimada: fechaEstimada.toISOString().slice(0, 10),
          fechaPlanificada: p.fechaFin,
          desviacionDias: p.fechaFin ? Math.round((fechaEstimada.getTime() - new Date(p.fechaFin).getTime()) / 86400000) : 0,
        };
      });
  }, [proyectos, hoy]);

  const avanceData = useMemo(() => {
    const prog = [0, 12, 28, 45, 62, 78, 90, 100];
    return { prog, real: [0, 10, 24, 40, 55, 67, 79, 88] };
  }, []);

  const movPorCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    movimientos.filter(m => m.tipo === 'gasto').forEach(m => { map[m.categoria] = (map[m.categoria] || 0) + m.costoTotal; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([k, v], i) => ({ label: k.slice(0, 4), value: v, color: COLORS[i % COLORS.length] }));
  }, [movimientos]);

  // M-10: Reporte financiero consolidado multi-proyecto
  const reporteFinanciero = useMemo(() => {
    return proyectos.map(p => {
      const ingresos = movimientos.filter(m => m.proyectoId === p.id && m.tipo === 'ingreso').reduce((a, b) => a + b.costoTotal, 0);
      const gastos = movimientos.filter(m => m.proyectoId === p.id && m.tipo === 'gasto').reduce((a, b) => a + b.costoTotal, 0);
      const margen = ingresos > 0 ? ((ingresos - gastos) / ingresos) * 100 : 0;
      return { id: p.id, nombre: p.nombre, ingresos, gastos, margen, presupuesto: p.presupuestoTotal, avance: p.avanceFisico };
    });
  }, [proyectos, movimientos]);

  // M-14: Dashboard rendimiento equipo
  const rendimientoEquipo = useMemo(() => {
    const costoMO = costoPorHoraHombre();
    return {
      totalEmpleados: costoMO.empleados,
      costoDiario: costoMO.total,
      promedioSalarioHora: costoMO.promedioSalario,
    };
  }, [costoPorHoraHombre, empleados]);

  const modulos = [
    { id: 'proyectos', label: 'Proyectos', icon: Building2, c: 'from-blue-500 to-indigo-600' },
    { id: 'presupuestos', label: 'Presupuestos', icon: Calculator, c: 'from-orange-500 to-amber-500' },
    { id: 'seguimiento', label: 'Seguimiento', icon: ClipboardCheck, c: 'from-emerald-500 to-teal-600' },
    { id: 'financiero', label: 'Financiero', icon: Wallet, c: 'from-violet-500 to-purple-600' },
    { id: 'crm', label: 'CRM', icon: Target, c: 'from-purple-500 to-pink-600' },
    { id: 'rrhh', label: 'RRHH', icon: Users, c: 'from-pink-500 to-rose-600' },
    { id: 'bodega', label: 'Bodega', icon: Warehouse, c: 'from-cyan-500 to-sky-600' },
  ];

  const SkeletonCard: React.FC<{ h?: string }> = ({ h = 'h-8' }) => (
    <div className="rounded-2xl bg-white animate-pulse">
      <div className={`${h} bg-slate-100 rounded-2xl`} />
    </div>
  );

  // M-04: Comparación real vs plan por renglón (último presupuesto aprobado)
  const comparacionRenglones = useMemo(() => {
    if (presupuestos.length === 0) return [];
    const ultimoPresupuesto = presupuestos.sort((a, b) => 
      new Date(b.fechaActualizacion).getTime() - new Date(a.fechaActualizacion).getTime()
    )[0];
    if (!ultimoPresupuesto || !ultimoPresupuesto.renglones) return [];
    
    return ultimoPresupuesto.renglones.slice(0, 10).map(r => {
      const gastoReal = movimientos
        .filter(m => m.proyectoId === ultimoPresupuesto.proyectoId && m.categoria === 'materiales')
        .reduce((a, b) => a + b.costoTotal, 0);
      const plan = r.costoMateriales + r.costoManoObra + r.costoEquipo;
      return {
        codigo: r.codigo,
        nombre: r.nombre,
        plan,
        real: gastoReal * (r.cantidad / (ultimoPresupuesto.renglones.length || 1)),
        variacion: 0,
      };
    });
  }, [presupuestos, movimientos]);

  const loading = proyectos.length === 0 && movimientos.length === 0;

  return (
    <div className="h-full flex flex-col p-3 sm:p-4 max-w-[1600px] mx-auto overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-2 flex-shrink-0">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-800 leading-tight">Tablero Principal</h1>
          <p className="text-xs text-slate-500">Centro de comando — métricas en tiempo real</p>
        </div>
        <select value={filtroProy} onChange={e => setFiltroProy(e.target.value)}
          className="px-3 py-1.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-100 bg-white border border-slate-200">
          <option value="">Todos los proyectos</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      {/* M-01: Alertas de retraso */}
      {alertasRetraso.length > 0 && (
        <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-xl flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold text-red-700 uppercase">Alertas de retraso</span>
          </div>
          <div className="space-y-1">
            {alertasRetraso.map(a => (
              <div key={a.id} className="flex items-center justify-between text-xs text-red-600 bg-red-100/50 px-2 py-1 rounded">
                <span className="font-semibold">{a.nombre}</span>
                <span>{a.diasRetraso} días de retraso · {a.avance}% avance</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* M-02: Predicción de fecha de fin */}
      {prediccionFechaFin.length > 0 && (
        <div className="mb-2 p-3 bg-amber-50 border border-amber-200 rounded-xl flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-amber-700 uppercase">Pronóstico de finalización</span>
          </div>
          <div className="space-y-1">
            {prediccionFechaFin.filter(p => p.desviacionDias > 0).slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between text-xs text-amber-700 bg-amber-100/50 px-2 py-1 rounded">
                <span className="font-semibold">{p.nombre}</span>
                <span>Fin estimado: {p.fechaEstimada} ({p.desviacionDias} días después de lo planeado)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading
        ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2 flex-shrink-0">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        : <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2 flex-shrink-0">
            <KpiCard label="Margen de Utilidad Prom." value={fmtPct(margenProm)} icon={<TrendingUp className="w-4 h-4" />} trend="+2.4%" trendUp accent="from-emerald-500 to-teal-500" />
            <KpiCard label="Proyectos Activos" value={String(activos.length)} icon={<Building2 className="w-4 h-4" />} trend={`${proyectos.length} total`} trendUp accent="from-blue-500 to-indigo-500" />
            <KpiCard label="Presupuesto en Ejecución" value={fmtQ(presupuestoTotal)} icon={<DollarSign className="w-4 h-4" />} accent="from-orange-500 to-amber-500" />
            <KpiCard label="Desviación Global Costos" value={fmtPct(desviacion)} icon={<AlertTriangle className="w-4 h-4" />} trend={desviacion > 0 ? 'Riesgo' : 'Sano'} trendUp={desviacion <= 0} accent="from-red-500 to-rose-500" />
          </div>
      }

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-2 min-h-0">
        <div className={`${CARD} lg:col-span-2 flex flex-col min-h-0 p-3`}>
          <div className="flex items-center justify-between mb-1 flex-shrink-0">
            <h3 className={`${CARD_TITLE} flex items-center gap-1 text-sm mb-0`}><Activity className="w-3.5 h-3.5 text-orange-500" /> Curva S Consolidada</h3>
            <div className="flex gap-2 text-[9px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Programado</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Real</span>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <LineChart labels={['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A']}
              series={[
                { label: 'Programado', color: '#3b82f6', data: avanceData.prog },
                { label: 'Real', color: '#f97316', data: avanceData.real },
              ]} />
          </div>
        </div>

        <div className="row-span-2 overflow-hidden">
          <Calendar />
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2 min-h-0">
          <div className={`${CARD} flex flex-col p-3 min-h-0`}>
            <h3 className={`${CARD_TITLE} text-sm mb-1`}>Gastos por Categoria</h3>
            <div className="flex-1 min-h-0">
              {movPorCategoria.length ? <BarChart data={movPorCategoria} height={100} /> : <p className="text-xs text-slate-400">Sin datos</p>}
            </div>
          </div>
          <div className={`${CARD} flex flex-col p-3 min-h-0`}>
            <h3 className={`${CARD_TITLE} text-sm mb-1`}>Ingresos vs Gastos</h3>
            <div className="flex-1 flex items-center gap-3 min-h-0">
              <Donut size={80} data={[
                { label: 'Ingresos', value: ingresos, color: '#10b981' },
                { label: 'Gastos', value: gastos, color: '#ef4444' },
              ]} />
              <div className="text-[10px] space-y-1">
                <div><span className="w-2 h-2 inline-block rounded-full bg-emerald-500 mr-1" />Ingresos<br /><b className="text-slate-700">{fmtQ(ingresos)}</b></div>
                <div><span className="w-2 h-2 inline-block rounded-full bg-red-500 mr-1" />Gastos<br /><b className="text-slate-700">{fmtQ(gastos)}</b></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 mt-2 flex-shrink-0">
        <div className="lg:col-span-2">
          <CriticalRenglonAlert />
        </div>
        <div>
          <LicitacionesDashboard />
        </div>
        <div>
          <CajasChicasWidget />
        </div>
      </div>

      {/* EERR Detallado + % Utilización Recursos */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 mt-2 flex-shrink-0">
        <div className="lg:col-span-2 bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-700 text-xs mb-1">Estado de Resultados (EERR) por Categoría</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
            <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
              <div className="text-emerald-600 font-bold text-sm">{fmtQ(eerr.totalIngresos)}</div>
              <div className="text-emerald-700">Ingresos Totales</div>
            </div>
            <div className="bg-red-50 rounded-lg p-2 border border-red-100">
              <div className="text-red-600 font-bold text-sm">{fmtQ(eerr.totalGastos)}</div>
              <div className="text-red-700">Gastos Totales</div>
            </div>
            <div className={`rounded-lg p-2 border ${eerr.utilidadBruta >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-100 border-red-200'}`}>
              <div className={`font-bold text-sm ${eerr.utilidadBruta >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{fmtQ(eerr.utilidadBruta)}</div>
              <div className={`${eerr.utilidadBruta >= 0 ? 'text-blue-700' : 'text-red-700'}`}>Utilidad Neta</div>
            </div>
          </div>
          {eerr.gastosPorCategoria.length > 0 && (
            <div className="mt-2 space-y-1">
              {eerr.gastosPorCategoria.slice(0, 5).map((g, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                  <span className="w-20 text-right text-slate-500">{g.categoria.replace('_', ' ')}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                    <div className="bg-orange-500 rounded-full h-1.5" style={{ width: `${g.porcentaje}%` }} />
                  </div>
                  <span className="w-16 text-right font-mono text-slate-600">{fmtQ(g.monto)}</span>
                  <span className="w-8 text-right text-slate-400">{g.porcentaje.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-700 text-xs mb-1">% Utilización Recursos</h3>
          <div className="text-center">
            <div className="text-3xl font-black text-blue-600">
              {empleados.length > 0 ? ((empleados.filter(e => e.activo && (e.diasTrabajados || 0) > 0).length / Math.max(empleados.length, 1)) * 100).toFixed(0) : 0}%
            </div>
            <div className="text-[10px] text-slate-500">Empleados activos con horas registradas</div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
              <div className="bg-slate-50 rounded p-1">
                <div className="font-bold text-slate-700">{empleados.filter(e => e.activo).length}</div>
                <div className="text-slate-400">Activos</div>
              </div>
              <div className="bg-slate-50 rounded p-1">
                <div className="font-bold text-slate-700">{horasHombreSeg.totalHoras.toLocaleString()}</div>
                <div className="text-slate-400">HH acumuladas</div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-bold text-slate-700 text-xs mb-1">Herramientas Rápidas</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {modulos.map(m => {
              const Icon = m.icon;
              return (
                <button key={m.id} onClick={() => setView(m.id as View)}
                  className={`bg-gradient-to-br ${m.c} text-white rounded-xl p-2 flex flex-col items-start gap-1 hover:scale-[1.03] transition-transform shadow-sm`}>
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-semibold flex items-center gap-1">{m.label} <ArrowRight className="w-2.5 h-2.5" /></span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
