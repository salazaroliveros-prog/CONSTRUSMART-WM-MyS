import React, { useMemo, useState } from 'react';
import { useErp, type View } from '../store';
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

  const SkeletonCard: React.FC<{ h?: string }> = ({ h = 'h-8' }) => (
    <div className="rounded-2xl bg-card border border-border animate-pulse">
      <div className={`${h} bg-muted rounded-2xl`} />
    </div>
  );

  const loading = proyectos.length === 0 && movimientos.length === 0;

  return (
    <div className="h-full flex flex-col p-3 sm:p-4 max-w-[1600px] mx-auto overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-2 flex-shrink-0">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-foreground leading-tight">Tablero Principal</h1>
          <p className="text-xs text-muted-foreground">Centro de comando — métricas en tiempo real</p>
        </div>
        <select
          value={filtroProy}
          onChange={e => setFiltroProy(e.target.value)}
          aria-label="Filtrar por proyecto"
          className="px-3 py-1.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-ring bg-background border border-input text-foreground">
          <option value="">Todos los proyectos</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      {loading
        ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-2 flex-shrink-0">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-2 flex-shrink-0">
            <KpiCard label="Margen de Utilidad Prom." value={fmtPct(margenProm)} icon={<TrendingUp className="w-4 h-4" />} trend="+2.4%" trendUp accent="from-emerald-500 to-teal-500" />
            <KpiCard label="Proyectos Activos" value={String(activos.length)} icon={<Building2 className="w-4 h-4" />} trend={`${proyectos.length} total`} trendUp accent="from-blue-500 to-indigo-500" />
            <KpiCard label="Presupuesto en Ejecución" value={fmtQ(presupuestoTotal)} icon={<DollarSign className="w-4 h-4" />} accent="from-orange-500 to-amber-500" />
            <KpiCard label="Desviación Global Costos" value={fmtPct(desviacion)} icon={<AlertTriangle className="w-4 h-4" />} trend={desviacion > 0 ? 'Riesgo' : 'Sano'} trendUp={desviacion <= 0} accent="from-red-500 to-rose-500" />
          </div>
      }

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-2 min-h-0">
        <div className={`${CARD} lg:col-span-2 flex flex-col min-h-0 p-3`}>
          <div className="flex items-center justify-between mb-1 flex-shrink-0">
            <h3 className={`${CARD_TITLE} flex items-center gap-1 text-sm mb-0`}><Activity className="w-3.5 h-3.5 text-primary" aria-hidden="true" /> Curva S Consolidada</h3>
            <div className="flex gap-2 text-[9px] text-muted-foreground" aria-hidden="true">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Programado</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Real</span>
            </div>
          </div>
          <div className="flex-1 min-h-0" role="img" aria-label="Gráfico Curva S: avance programado vs real">
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
            <h3 className={`${CARD_TITLE} text-sm mb-1`}>Gastos por Categoría</h3>
            <div className="flex-1 min-h-0">
              {movPorCategoria.length ? <BarChart data={movPorCategoria} height={100} /> : <p className="text-xs text-muted-foreground">Sin datos</p>}
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
                <div><span className="w-2 h-2 inline-block rounded-full bg-emerald-500 mr-1" />Ingresos<br /><b className="text-foreground">{fmtQ(ingresos)}</b></div>
                <div><span className="w-2 h-2 inline-block rounded-full bg-red-500 mr-1" />Gastos<br /><b className="text-foreground">{fmtQ(gastos)}</b></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mt-2 flex-shrink-0">
        <div className="lg:col-span-2">
          <h3 className="font-bold text-foreground text-xs mb-1">Registro Rápido de Ingresos y Gastos</h3>
          <MovimientoForm compact />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-xs mb-1">Acceso a Módulos</h3>
          <nav aria-label="Acceso rápido a módulos" className="grid grid-cols-2 gap-1.5">
            {modulos.map(m => {
              const Icon = m.icon;
              return (
                <button key={m.id} onClick={() => setView(m.id as View)}
                  aria-label={`Ir a ${m.label}`}
                  className={`bg-gradient-to-br ${m.c} text-white rounded-xl p-2 flex flex-col items-start gap-1 hover:scale-[1.03] lg:hover:scale-[1.03] active:scale-[0.97] transition-transform shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70`}>
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span className="text-[10px] font-semibold flex items-center gap-1">{m.label} <ArrowRight className="w-2.5 h-2.5" aria-hidden="true" /></span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
