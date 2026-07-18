import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { fmtQ, fmtPct, safeNum } from '../utils';
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { KPICard } from '../components/shared';
import { ProfitabilityTable, CuentasModule } from '../components/financiero';

const Financiero: React.FC = () => {
  const { t } = useTranslation();
  const { movimientos, proyectos, cuentasCobrar, cuentasPagar } = useErp();
  const [filtroProyecto, setFiltroProyecto] = useState<string>('todos');
  const [filtroFecha, setFiltroFecha] = useState<string>('mes');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 300);
  }, []);

  const emptyState = (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Wallet className="w-16 h-16 text-muted-foreground/30 mb-4" aria-hidden="true" />
      <h2 className="text-xl font-bold text-foreground mb-2">{t('financiero.titulo')}</h2>
      <p className="text-muted-foreground">{t('financiero.sin_datos')}</p>
    </div>
  );
  const skeleton = (
    <div className="p-4 sm:p-6 space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Skeleton className="h-20 sm:h-24" />
        <Skeleton className="h-20 sm:h-24" />
        <Skeleton className="h-20 sm:h-24" />
      </div>
      <Skeleton className="h-56 sm:h-64" />
    </div>
  );

  const movimientosFiltrados = useMemo(() => {
    let data = [...movimientos];
    if (filtroProyecto !== 'todos') data = data.filter((m) => m.proyectoId === filtroProyecto);

    const now = new Date();
    if (filtroFecha === 'mes') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      data = data.filter((m) => new Date(m.fecha) >= start);
    } else if (filtroFecha === 'trimestre') {
      const start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      data = data.filter((m) => new Date(m.fecha) >= start);
    } else if (filtroFecha === 'anio') {
      const start = new Date(now.getFullYear(), 0, 1);
      data = data.filter((m) => new Date(m.fecha) >= start);
    }
    return data;
  }, [movimientos, filtroProyecto, filtroFecha]);

  const ingresos = useMemo(
    () =>
      movimientosFiltrados
        .filter((m) => typeof m.tipo === 'string' && m.tipo === 'ingreso')
        .reduce((s, m) => s + (typeof m.monto === 'number' ? m.monto : 0), 0),
    [movimientosFiltrados]
  );

  const egresos = useMemo(
    () =>
      movimientosFiltrados
        .filter((m) => typeof m.tipo === 'string' && m.tipo !== 'ingreso')
        .reduce((s, m) => s + (typeof m.monto === 'number' ? m.monto : 0), 0),
    [movimientosFiltrados]
  );

  const utilidad = useMemo(() => ingresos - egresos, [ingresos, egresos]);
  const margen = useMemo(() => (ingresos > 0 ? utilidad / ingresos : 0), [ingresos, utilidad]);

  const profitabilityData = useMemo(() => {
    return proyectos.map((p) => {
      const ing = movimientos
        .filter((m) => m.proyectoId === p.id && typeof m.tipo === 'string' && m.tipo === 'ingreso')
        .reduce((s, m) => s + (typeof m.monto === 'number' ? m.monto : 0), 0);
      const gas = movimientos
        .filter((m) => m.proyectoId === p.id && typeof m.tipo === 'string' && m.tipo !== 'ingreso')
        .reduce((s, m) => s + (typeof m.monto === 'number' ? m.monto : 0), 0);
      const margenVal = ing - gas;
      const rentabilidad = typeof p.presupuestoTotal === 'number' && p.presupuestoTotal > 0 ? (margenVal / p.presupuestoTotal) * 100 : 0;

      return {
        id: p.id,
        nombre: p.nombre,
        presupuesto: typeof p.presupuestoTotal === 'number' ? p.presupuestoTotal : 0,
        ingresos: ing,
        gastos: gas,
        margen: margenVal,
        rentabilidad,
      };
    });
  }, [proyectos, movimientos]);

  const agingCobrar = useMemo(() => {
    const totalCobrar = cuentasCobrar.reduce((s, c) => s + (typeof c.monto === 'number' ? c.monto : 0), 0);
    const bucket = (items: typeof cuentasCobrar) => items.reduce((s, c) => s + (typeof c.monto === 'number' ? c.monto : 0), 0);

    const vigentes = cuentasCobrar.filter((c) => {
      const dias = Math.floor((new Date().getTime() - new Date(c.fecha).getTime()) / (1000 * 3600 * 24));
      return dias <= 30;
    });
    const dias30_60 = cuentasCobrar.filter((c) => {
      const dias = Math.floor((new Date().getTime() - new Date(c.fecha).getTime()) / (1000 * 3600 * 24));
      return dias > 30 && dias <= 60;
    });
    const dias60_90 = cuentasCobrar.filter((c) => {
      const dias = Math.floor((new Date().getTime() - new Date(c.fecha).getTime()) / (1000 * 3600 * 24));
      return dias > 60 && dias <= 90;
    });
    const mayorA90 = cuentasCobrar.filter((c) => {
      const dias = Math.floor((new Date().getTime() - new Date(c.fecha).getTime()) / (1000 * 3600 * 24));
      return dias > 90;
    });

    return {
      total: totalCobrar,
      buckets: [
        { label: 'Vigente (< 30 días)', description: 'No vencidas', amount: bucket(vigentes), percentage: totalCobrar > 0 ? (bucket(vigentes) / totalCobrar) * 100 : 0, status: 'success' as const, color: 'hsl(var(--success))', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
        { label: '30-60 días', description: 'Vencidas', amount: bucket(dias30_60), percentage: totalCobrar > 0 ? (bucket(dias30_60) / totalCobrar) * 100 : 0, status: 'warning' as const, color: 'hsl(var(--warning))', bgColor: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-emerald-800' },
        { label: '60-90 días', description: 'Muy vencidas', amount: bucket(dias60_90), percentage: totalCobrar > 0 ? (bucket(dias60_90) / totalCobrar) * 100 : 0, status: 'danger' as const, color: 'hsl(var(--destructive))', bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
        { label: '> 90 días', description: 'Crítico', amount: bucket(mayorA90), percentage: totalCobrar > 0 ? (bucket(mayorA90) / totalCobrar) * 100 : 0, status: 'danger' as const, color: 'hsl(var(--destructive))', bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
      ],
      status: mayorA90.length > 0 ? 'critical' : dias60_90.length > 0 ? 'caution' : 'healthy',
    };
  }, [cuentasCobrar]);

  const vencimientosPagar = useMemo(() => {
    const totalPagar = cuentasPagar.reduce((s, c) => s + (typeof c.monto === 'number' ? c.monto : 0), 0);
    const bucket = (items: typeof cuentasPagar) => items.reduce((s, c) => s + (typeof c.monto === 'number' ? c.monto : 0), 0);

    const vencidas = cuentasPagar.filter((c) => Math.floor((new Date(c.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) <= 0);
    const proximos7 = cuentasPagar.filter((c) => {
      const dias = Math.floor((new Date(c.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return dias > 0 && dias <= 7;
    });
    const proximos30 = cuentasPagar.filter((c) => {
      const dias = Math.floor((new Date(c.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return dias > 7 && dias <= 30;
    });
    const vigentes = cuentasPagar.filter((c) => {
      const dias = Math.floor((new Date(c.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return dias > 30;
    });

    return {
      total: totalPagar,
      buckets: [
        { label: 'Vencidas', description: 'Requieren atención inmediata', amount: bucket(vencidas), percentage: totalPagar > 0 ? (bucket(vencidas) / totalPagar) * 100 : 0, status: 'danger' as const, color: 'hsl(var(--destructive))', bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
        { label: 'Próximos 7 días', description: 'Urgentes', amount: bucket(proximos7), percentage: totalPagar > 0 ? (bucket(proximos7) / totalPagar) * 100 : 0, status: 'danger' as const, color: 'hsl(var(--destructive))', bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
        { label: 'Próximos 30 días', description: 'A vigilar', amount: bucket(proximos30), percentage: totalPagar > 0 ? (bucket(proximos30) / totalPagar) * 100 : 0, status: 'warning' as const, color: 'hsl(var(--warning))', bgColor: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-red-800' },
        { label: 'Futuros (> 30 días)', description: 'Normal', amount: bucket(vigentes), percentage: totalPagar > 0 ? (bucket(vigentes) / totalPagar) * 100 : 0, status: 'success' as const, color: 'hsl(var(--success))', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-red-800' },
      ],
      status: vencidas.length > 0 || proximos7.length > 0 ? 'critical' : proximos30.length > 0 ? 'caution' : 'healthy',
    };
  }, [cuentasPagar]);

  if (loading) return skeleton;

  if (proyectos.length === 0) {
    return emptyState;
  }

  return (
    <div className="p-3 sm:p-6 max-w-[1600px] mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-foreground truncate" title="Dashboard Financiero">
            <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500" />
            Dashboard Financiero
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Vista integrada de finanzas, rentabilidad y cuentas</p>
        </div>
        <div className="flex gap-2">
          <select value={filtroProyecto} onChange={(e) => setFiltroProyecto(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-sm">
            <option value="todos">Todos los proyectos</option>
            {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <select value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-sm">
            <option value="mes">Este mes</option>
            <option value="trimestre">Este trimestre</option>
            <option value="anio">Este año</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <KPICard label="Ingresos" value={fmtQ(ingresos)} icon={<ArrowUpRight size={18} />} status="success" />
        <KPICard label="Gastos" value={fmtQ(egresos)} icon={<ArrowDownRight size={18} />} status="warning" />
        <KPICard label="Utilidad" value={fmtQ(utilidad)} icon={<TrendingUp size={18} />} status={utilidad > 0 ? 'success' : 'danger'} />
      </div>

      <ProfitabilityTable data={profitabilityData} onViewDetails={(projectId) => console.log('View details:', projectId)} />
      <CuentasModule cuentasCobrar={cuentasCobrar} cuentasPagar={cuentasPagar} />
    </div>
  );
};

export default Financiero;