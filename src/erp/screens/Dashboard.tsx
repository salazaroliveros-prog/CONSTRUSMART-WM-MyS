import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { fmtQ, fmtPct } from '../utils';
import { Progress, BarChart } from '../components/Charts';
import ChartToolbar from '../components/ChartToolbar';
import { useChartConfig } from '../hooks/useChartConfig';
import { TrendingUp, AlertTriangle, CheckCircle2, Clock, DollarSign, Users, Wrench } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const ctx = useErp();
  const barConfig = useChartConfig('bar', 'default');
  const donutConfig = useChartConfig('donut', 'default');

  const proyectos = ctx.proyectos || [];
  const presupuestos = ctx.presupuestos || [];
  const avances = ctx.avances || [];
  const materiales = ctx.materiales || [];
  const empleados = ctx.empleados || [];
  const ordenes = ctx.ordenes || [];
  const hitos = ctx.hitos || [];
  const cuentasCobrar = ctx.cuentasCobrar || [];
  const cuentasPagar = ctx.cuentasPagar || [];

  const kpi = useMemo(() => {
    const activos = proyectos.filter(p => p.estado === 'ejecucion').length;
    const presupuestoTotal = proyectos.reduce((s, p) => s + (p.presupuestoTotal || 0), 0);
    const margenProm = presupuestos.length > 0 ? presupuestos.reduce((s, p) => s + (p.margen ?? 0), 0) / presupuestos.length : 0;
    const clientes = new Set(proyectos.map(p => p.clienteId)).size;
    return {
      proyectos: proyectos.length,
      activos,
      presupuestoTotal,
      margenProm: Number.isFinite(margenProm) ? margenProm : 0,
      clientes,
      empleados: empleados.length,
    };
  }, [proyectos, presupuestos, empleados]);

  const avanceData = useMemo(() => {
    if (avances.length === 0) return Array(8).fill(0);
    const map = new Map<string, number>();
    avances.forEach(a => {
      const val = a.porcentaje || 0;
      if (val > 0) map.set(a.proyectoId, val);
    });
    return Array.from(map.values()).slice(0, 8);
  }, [avances]);

  const categoriaMap = useMemo(() => {
    const map: Record<string, number> = {};
    proyectos.forEach(p => {
      const cat = p.categoria || 'general';
      map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  }, [proyectos]);

  const stockData = useMemo(() => {
    const criticos = materiales.filter(m => m.stock < m.stockMinimo).length;
    const ok = materiales.length - criticos;
    return [
      { name: t('dashboard.stock_ok'), value: Math.max(0, ok), color: 'hsl(var(--success))' },
      { name: t('dashboard.stock_critico'), value: criticos, color: 'hsl(var(--destructive))' },
    ];
  }, [materiales]);

  const rrhhData = useMemo(() => {
    const activos = empleados.filter(e => e.activo !== false).length;
    return [
      { name: t('dashboard.rrhh_activos'), value: activos, color: 'hsl(var(--primary))' },
      { name: t('dashboard.rrhh_inactivos'), value: Math.max(0, empleados.length - activos), color: 'hsl(var(--muted-foreground))' },
    ];
  }, [empleados]);

  if (!ctx) return null;

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" aria-hidden="true" /> {t('dashboard.title')}
          </h1>
          <p className="text-xs text-muted-foreground">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex gap-2">
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { label: t('dashboard.proyectos'), value: kpi.proyectos, icon: TrendingUp, color: 'text-primary' },
          { label: t('dashboard.activos'), value: kpi.activos, icon: CheckCircle2, color: 'text-emerald-500' },
          { label: t('dashboard.presupuesto'), value: fmtQ(kpi.presupuestoTotal), icon: DollarSign, color: 'text-blue-500' },
          { label: t('dashboard.margen'), value: fmtPct(kpi.margenProm), icon: TrendingUp, color: 'text-purple-500' },
          { label: t('dashboard.clientes'), value: kpi.clientes, icon: Users, color: 'text-amber-500' },
          { label: t('dashboard.empleados'), value: kpi.empleados, icon: Wrench, color: 'text-rose-500' },
        ].map((k, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-3">
            <div className="text-[10px] text-muted-foreground">{k.label}</div>
            <div className={`text-lg font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <div className="xl:col-span-2 bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm">{t('dashboard.avance')}</h3>
            <ChartToolbar types={['bar']} currentType={barConfig.type} onTypeChange={barConfig.setType} palette={barConfig.palette} onPaletteChange={barConfig.setPalette} onReset={barConfig.reset} />
          </div>
          {avanceData.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('dashboard.sin_datos')}</p>
          ) : (
            <BarChart height={180} data={avanceData.map((v, i) => ({ label: `${i + 1}`, value: v, color: 'hsl(var(--primary))' }))} palette={barConfig.palette} />
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-bold text-sm mb-2">{t('dashboard.cartera_titulo')}</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('dashboard.cartera_proyectos')}</span>
              <span className="font-semibold">{proyectos.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('dashboard.cartera_presupuesto')}</span>
              <span className="font-semibold">{fmtQ(kpi.presupuestoTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('dashboard.cartera_por_cobrar')}</span>
              <span className="font-semibold">{fmtQ(cuentasCobrar.reduce((s, c) => s + (c.monto || 0), 0))}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('dashboard.cartera_por_pagar')}</span>
              <span className="font-semibold">{fmtQ(cuentasPagar.reduce((s, c) => s + (c.monto || 0), 0))}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-bold text-sm mb-2">{t('dashboard.stock_titulo')}</h3>
          {stockData.every(d => d.value === 0) ? (
            <p className="text-xs text-muted-foreground">{t('dashboard.sin_datos')}</p>
          ) : (
            <BarChart height={160} data={stockData} palette={donutConfig.palette} />
          )}
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-bold text-sm mb-2">{t('dashboard.rrhh_titulo')}</h3>
          {rrhhData.every(d => d.value === 0) ? (
            <p className="text-xs text-muted-foreground">{t('dashboard.sin_datos')}</p>
          ) : (
            <BarChart height={160} data={rrhhData} palette={barConfig.palette} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;