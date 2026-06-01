import React, { useMemo, useState } from 'react';
import { useErp } from '../store';
import { fmtQ, fmtPct } from '../utils';
import KpiCard from '../components/KpiCard';
import Calendar from '../components/Calendar';
import MovimientoForm from '../components/MovimientoForm';
import { LineChart, BarChart, Donut } from '../components/Charts';
import { Building2, TrendingUp, DollarSign, AlertTriangle, Activity, Calculator, ClipboardCheck, Wallet, Users, Warehouse, ArrowRight } from 'lucide-react';
import { CARD, CARD_TITLE } from '../ui';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#fbbf24', '#ec4899'];

const Dashboard: React.FC = () => {
  const { proyectos, movimientos, setView } = useErp();
  const [filtroProy, setFiltroProy] = useState('');

  const activos = proyectos.filter(p => p.estado === 'ejecucion');
  const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((a, b) => a + b.costoTotal, 0);
  const gastos = movimientos.filter(m => m.tipo === 'gasto').reduce((a, b) => a + b.costoTotal, 0);
  const presupuestoTotal = activos.reduce((a, b) => a + b.presupuestoTotal, 0);
  const margenProm = activos.length
    ? activos.reduce((a, b) => a + ((b.montoContrato - b.presupuestoTotal) / b.montoContrato) * 100, 0) / activos.length : 0;
  const desviacion = activos.length
    ? activos.reduce((a, b) => a + (b.avanceFinanciero - b.avanceFisico), 0) / activos.length : 0;

  const avanceData = useMemo(() => {
    const prog = [0, 12, 28, 45, 62, 78, 90, 100];
    const real = [0, 10, 25, 42, 58, 70, 82, 0].slice(0, 7).concat([0]);
    void real;
    return { prog, real: [0, 10, 24, 40, 55, 67, 79, 88] };
  }, []);

  const movPorCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    movimientos.filter(m => m.tipo === 'gasto').forEach(m => { map[m.categoria] = (map[m.categoria] || 0) + m.costoTotal; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([k, v], i) => ({ label: k.slice(0, 4), value: v, color: COLORS[i % COLORS.length] }));
  }, [movimientos]);

  const modulos = [
    { id: 'proyectos', label: 'Proyectos', icon: Building2, c: 'from-blue-500 to-indigo-600' },
    { id: 'presupuestos', label: 'Presupuestos', icon: Calculator, c: 'from-orange-500 to-amber-500' },
    { id: 'seguimiento', label: 'Seguimiento', icon: ClipboardCheck, c: 'from-emerald-500 to-teal-600' },
    { id: 'financiero', label: 'Financiero', icon: Wallet, c: 'from-violet-500 to-purple-600' },
    { id: 'rrhh', label: 'RRHH', icon: Users, c: 'from-pink-500 to-rose-600' },
    { id: 'bodega', label: 'Bodega', icon: Warehouse, c: 'from-cyan-500 to-sky-600' },
  ];

  const SkeletonCard: React.FC<{ h?: string }> = ({ h = 'h-10' }) => (
    <div className="rounded-2xl border border-slate-100 bg-white animate-pulse">
      <div className={`${h} bg-slate-100 rounded-2xl`} />
    </div>
  );

  const loading = proyectos.length === 0 && movimientos.length === 0;

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Tablero Principal</h1>
          <p className="text-sm text-slate-400">Centro de comando — métricas en tiempo real</p>
        </div>
        <select value={filtroProy} onChange={e => setFiltroProy(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-orange-400 bg-white">
          <option value="">Todos los proyectos</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      {loading
        ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        : <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KpiCard label="Margen de Utilidad Prom." value={fmtPct(margenProm)} icon={<TrendingUp className="w-5 h-5" />} trend="+2.4%" trendUp accent="from-emerald-500 to-teal-500" />
            <KpiCard label="Proyectos Activos" value={String(activos.length)} icon={<Building2 className="w-5 h-5" />} trend={`${proyectos.length} total`} trendUp accent="from-blue-500 to-indigo-500" />
            <KpiCard label="Presupuesto en Ejecución" value={fmtQ(presupuestoTotal)} icon={<DollarSign className="w-5 h-5" />} accent="from-orange-500 to-amber-500" />
            <KpiCard label="Desviación Global Costos" value={fmtPct(desviacion)} icon={<AlertTriangle className="w-5 h-5" />} trend={desviacion > 0 ? 'Riesgo' : 'Sano'} trendUp={desviacion <= 0} accent="from-red-500 to-rose-500" />
          </div>
      }

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className={`${CARD} lg:col-span-2`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`${CARD_TITLE} flex items-center gap-2`}><Activity className="w-4 h-4 text-orange-500" /> Curva S Consolidada</h3>
            <div className="flex gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Programado</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Real</span>
            </div>
          </div>
          <LineChart labels={['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A']}
            series={[
              { label: 'Programado', color: '#3b82f6', data: avanceData.prog },
              { label: 'Real', color: '#f97316', data: avanceData.real },
            ]} />
        </div>

        <div className="row-span-2">
          <Calendar />
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={CARD}>
            <h3 className={CARD_TITLE}>Gastos por Categoría</h3>
            {movPorCategoria.length ? <BarChart data={movPorCategoria} height={160} /> : <p className="text-xs text-slate-400">Sin datos</p>}
          </div>
          <div className={`${CARD} flex flex-col`}>
            <h3 className={CARD_TITLE}>Ingresos vs Gastos</h3>
            <div className="flex items-center gap-4">
              <Donut size={120} data={[
                { label: 'Ingresos', value: ingresos, color: '#10b981' },
                { label: 'Gastos', value: gastos, color: '#ef4444' },
              ]} />
              <div className="text-xs space-y-2">
                <div><span className="w-2 h-2 inline-block rounded-full bg-emerald-500 mr-1" />Ingresos<br /><b className="text-slate-700">{fmtQ(ingresos)}</b></div>
                <div><span className="w-2 h-2 inline-block rounded-full bg-red-500 mr-1" />Gastos<br /><b className="text-slate-700">{fmtQ(gastos)}</b></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <h3 className="font-bold text-slate-700 text-sm mb-2">Registro Rápido de Ingresos y Gastos</h3>
          <MovimientoForm />
        </div>
        <div>
          <h3 className="font-bold text-slate-700 text-sm mb-2">Acceso a Módulos</h3>
          <div className="grid grid-cols-2 gap-2">
            {modulos.map(m => {
              const Icon = m.icon;
              return (
                <button key={m.id} onClick={() => setView(m.id as any)}
                  className={`bg-gradient-to-br ${m.c} text-white rounded-2xl p-3 flex flex-col items-start gap-2 hover:scale-[1.03] transition-transform shadow-sm`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold flex items-center gap-1">{m.label} <ArrowRight className="w-3 h-3" /></span>
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
