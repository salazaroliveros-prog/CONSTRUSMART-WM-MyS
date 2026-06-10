import React, { useMemo, useState, useEffect } from 'react';
import { useErp, type View } from '../store';
import { fmtQ, fmtPct } from '../utils';
import KpiCard from '../components/KpiCard';
import Calendar from '../components/Calendar';
import MovimientoForm from '../components/MovimientoForm';
import { ConfigurableLineArea, BarChart, Donut } from '../components/Charts';
import ChartToolbar from '../components/ChartToolbar';
import { useChartConfig } from '../hooks/useChartConfig';
import { Building2, TrendingUp, DollarSign, AlertTriangle, Activity, Calculator, ClipboardCheck, Wallet, Users, Warehouse, ArrowRight, FileText } from 'lucide-react';
import { CARD, CARD_TITLE } from '../ui';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#fbbf24', '#ec4899'];
const SAFE_STEPS = 8;

const Dashboard: React.FC = () => {
  const ctx = useErp();
  if (!ctx) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">No se pudo cargar el panel. Reintente nuevamente.</p>
      </div>
    );
  }
  const { proyectos, movimientos, avances, selectedProyectoId, setView } = ctx;
  const [filtroProy, setFiltroProy] = useState('');
  const curvaConfig = useChartConfig('area', 'cool');

  const proyFiltrados = filtroProy
    ? proyectos.filter(p => p.id === filtroProy)
    : proyectos;
  const activos = proyFiltrados.filter(p => p.estado === 'ejecucion');
  const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((a, b) => a + (b.monto ?? b.costoTotal ?? 0), 0);
  const gastos = movimientos.filter(m => m.tipo === 'gasto').reduce((a, b) => a + (b.monto ?? b.costoTotal ?? 0), 0);
  const presupuestoTotal = activos.reduce((a, b) => a + b.presupuestoTotal, 0);
  const margenProm = activos.length
    ? activos.reduce((a, b) => {
        const m = b.montoContrato > 0 ? ((b.montoContrato - b.presupuestoTotal) / b.montoContrato) * 100 : 0;
        return a + m;
      }, 0) / activos.length : 0;
  const desviacion = activos.length
    ? activos.reduce((a, b) => a + (b.avanceFinanciero - b.avanceFisico), 0) / activos.length : 0;

  const avanceData = useMemo(() => {
    const steps = 8;
    const data = selectedProyectoId
      ? avances.filter(a => a.proyectoId === selectedProyectoId)
      : avances;
    if (data.length === 0) {
      return { prog: Array(steps).fill(0), real: Array(steps).fill(0), labels: ['E','F','M','A','M','J','J','A'] };
    }
    const sorted = [...data].sort((a, b) => a.fecha.localeCompare(b.fecha));
    const prog = Array.from({ length: steps }, (_, i) => {
      if (i === 0) return 0;
      if (i === steps - 1) return 100;
      const t = i / (steps - 1);
      return Math.round(100 / (1 + Math.exp(-8 * (t - 0.5))));
    });
    const stepSize = sorted.length / (steps - 1);
    let acumulado = 0;
    const real = Array.from({ length: steps }, (_, i) => {
      if (i === 0) return 0;
      const endIdx = Math.min(Math.round(i * stepSize), sorted.length);
      const slice = sorted.slice(Math.round((i - 1) * stepSize), endIdx);
      acumulado += slice.reduce((s, a) => s + a.avanceFisico, 0);
      return Math.round(Math.min(acumulado, 100));
    });
    const mesesSet = new Set<string>();
    sorted.forEach(a => { if (a.fecha?.length >= 7) mesesSet.add(a.fecha.substring(0, 7)); });
    const mesesArr = Array.from(mesesSet).sort();
    const labelMap: Record<string, string> = { '01':'E','02':'F','03':'M','04':'A','05':'M','06':'J','07':'J','08':'A','09':'S','10':'O','11':'N','12':'D' };
    const labels = mesesArr.length >= steps
      ? mesesArr.slice(0, steps).map(m => labelMap[m.split('-')[1]] || m)
      : ['E','F','M','A','M','J','J','A'];
    return { prog, real, labels };
  }, [avances, selectedProyectoId]);

  const movPorCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    movimientos.filter(m => m.tipo === 'gasto').forEach(m => { map[m.categoria] = (map[m.categoria] || 0) + (m.monto ?? m.costoTotal ?? 0); });
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
    { id: 'cotizaciones', label: 'Cotizaciones', icon: FileText, c: 'from-rose-500 to-pink-600' },
  ];

  const SkeletonCard: React.FC<{ h?: string }> = ({ h = 'h-8' }) => (
    <div className="rounded-lg sm:rounded-2xl bg-card border border-border animate-pulse">
      <div className={`${h} bg-muted rounded-lg sm:rounded-2xl`} />
    </div>
  );

  const loading = proyectos.length === 0;

  return (
    <div className="h-full flex flex-col p-2 sm:p-3 lg:p-4 max-w-[1600px] mx-auto overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-1 sm:gap-2 mb-2 flex-shrink-0">
        <div className="min-w-0">
          <h1 className="text-sm sm:text-lg lg:text-xl font-black text-foreground leading-tight">Tablero</h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Métricas en tiempo real</p>
        </div>
        <select
          value={filtroProy}
          onChange={e => setFiltroProy(e.target.value)}
          aria-label="Filtrar por proyecto"
          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs outline-none focus:ring-2 focus:ring-ring bg-background border border-input text-foreground flex-shrink-0">
          <option value="">Todos</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre.substring(0, 15)}</option>)}
        </select>
      </div>

      {/* KPI Grid */}
      {loading
        ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 mb-2 flex-shrink-0">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 mb-2 flex-shrink-0">
            <KpiCard label="Margen Util." value={fmtPct(margenProm)} icon={<TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} trend="Prom." trendUp accent="from-emerald-500 to-teal-500" />
            <KpiCard label="Proyectos" value={String(activos.length)} icon={<Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} trend={`${proyectos.length} total`} trendUp accent="from-blue-500 to-indigo-500" />
            <KpiCard label="Presupuesto" value={fmtQ(presupuestoTotal)} icon={<DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} accent="from-orange-500 to-amber-500" />
            <KpiCard label="Desviación" value={fmtPct(desviacion)} icon={<AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} trend={desviacion > 0 ? 'Riesgo' : 'Sano'} trendUp={desviacion <= 0} accent="from-red-500 to-rose-500" />
          </div>
      }

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-1.5 sm:gap-2 min-h-0">
        {/* Curva S — configurable (cambia a Área por defecto para evitar duplicidad con módulo Curvas S) */}
        <div className={`${CARD} lg:col-span-2 flex flex-col min-h-0 p-2 sm:p-3`}>
          <div className="flex items-center justify-between mb-1 flex-shrink-0">
            <h3 className={`${CARD_TITLE} flex items-center gap-1 text-xs sm:text-sm mb-0`}><Activity className="w-3 h-3 sm:w-4 sm:h-4 text-primary" aria-hidden="true" /> Curva S</h3>
            <div className="flex items-center gap-1">
              <div className="flex gap-1.5 text-[8px] sm:text-[9px] text-muted-foreground" aria-hidden="true">
                <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Prog</span>
                <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Real</span>
              </div>
              <ChartToolbar
                types={['line', 'area']}
                currentType={curvaConfig.type}
                onTypeChange={curvaConfig.setType}
                palette={curvaConfig.palette}
                onPaletteChange={curvaConfig.setPalette}
                series={[
                  { id: 'Programado', label: 'Programado', color: '#3b82f6', visible: curvaConfig.isVisible('Programado') },
                  { id: 'Real', label: 'Real', color: '#f97316', visible: curvaConfig.isVisible('Real') },
                ]}
                onToggleSeries={curvaConfig.toggleSeries}
                onReset={curvaConfig.reset}
              />
            </div>
          </div>
          <div className="flex-1 min-h-0 min-h-[140px]" role="img" aria-label="Gráfico Curva S: avance programado vs real">
            <ConfigurableLineArea labels={avanceData.labels}
              type={curvaConfig.type} palette={curvaConfig.palette}
              series={[
                { label: 'Programado', color: '#3b82f6', data: avanceData.prog },
                { label: 'Real', color: '#f97316', data: avanceData.real },
              ].filter(s => curvaConfig.isVisible(s.label))} />
          </div>
        </div>

        {/* Calendar */}
        <div className="row-span-2 overflow-hidden">
          <Calendar />
        </div>

        {/* Gastos e Ingresos */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 min-h-0">
          <div className={`${CARD} flex flex-col p-2 sm:p-3 min-h-0`}>
            <h3 className={`${CARD_TITLE} text-xs sm:text-sm mb-1`}>Gastos</h3>
            <div className="flex-1 min-h-0">
              {movPorCategoria.length ? <BarChart data={movPorCategoria} height={130} /> : <p className="text-xs text-muted-foreground">Sin datos</p>}
            </div>
          </div>
          <div className={`${CARD} flex flex-col p-2 sm:p-3 min-h-0`}>
            <h3 className={`${CARD_TITLE} text-xs sm:text-sm mb-1`}>Ing vs Gast</h3>
            <div className="flex-1 flex items-center gap-2 min-h-0">
              <Donut size={130} data={[
                { label: 'Ingresos', value: ingresos, color: '#10b981' },
                { label: 'Gastos', value: gastos, color: '#ef4444' },
              ]} />
              <div className="text-[9px] sm:text-[10px] space-y-1">
                <div><span className="w-1.5 h-1.5 inline-block rounded-full bg-emerald-500 mr-1" />Ing<br /><b className="text-foreground text-[8px] sm:text-[9px]">{fmtQ(ingresos)}</b></div>
                <div><span className="w-1.5 h-1.5 inline-block rounded-full bg-red-500 mr-1" />Gas<br /><b className="text-foreground text-[8px] sm:text-[9px]">{fmtQ(gastos)}</b></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-1.5 sm:gap-2 mt-2 flex-shrink-0">
        <div className="lg:col-span-2">
          <h3 className="font-bold text-foreground text-xs mb-1">Registro Rápido</h3>
          <MovimientoForm compact />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-xs mb-1">Módulos</h3>
          <nav aria-label="Acceso rápido a módulos" className="grid grid-cols-2 gap-1">
            {modulos.map(m => {
              const Icon = m.icon;
              return (
                <button key={m.id} onClick={() => setView(m.id as View)}
                  aria-label={`Ir a ${m.label}`}
                  className={`bg-gradient-to-br ${m.c} text-white rounded-lg sm:rounded-xl p-1.5 sm:p-2 flex flex-col items-start gap-1 hover:scale-[1.02] active:scale-[0.97] transition-transform shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70`}>
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                  <span className="text-[8px] sm:text-[10px] font-semibold flex items-center gap-0.5 leading-tight">{m.label.length > 8 ? m.label.slice(0, 8) : m.label} <ArrowRight className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5" aria-hidden="true" /></span>
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
