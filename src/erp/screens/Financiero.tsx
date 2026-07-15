import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { fmtQ, fmtPct, safeNum } from '../utils';
import { BarChart, LineChart } from '../components/Charts';
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { KPICard } from '../components/shared';
import { ProfitabilityTable, AgingReport } from '../components/financiero';

/**
 * Financiero Screen - Dashboard Financiero Integrado
 * 
 * Estructura:
 * 1. KPIs principales (Ingresos, Gastos, Utilidad)
 * 2. Flujo de caja (12 meses)
 * 3. Rentabilidad por proyecto
 * 4. Cuentas Cobrar (Aging) integrada
 * 5. Cuentas Pagar (Vencimientos) integrada
 */
const Financiero: React.FC = () => {
  const { t } = useTranslation();
  const { movimientos, proyectos, cuentasCobrar, cuentasPagar } = useErp();
  const [filtroProyecto, setFiltroProyecto] = useState<string>('todos');
  const [filtroFecha, setFiltroFecha] = useState<string>('mes');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 300);
  }, []);

  // Filtrar movimientos
  const movimientosFiltrados = useMemo(() => {
    let data = [...movimientos];
    if (filtroProyecto !== 'todos') {
      data = data.filter((m) => m.proyectoId === filtroProyecto);
    }

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

  // Cálculos financieros
  const ingresos = useMemo(
    () =>
      movimientosFiltrados
        .filter((m) => m.tipo === 'ingreso')
        .reduce((s, m) => s + (m.monto || 0), 0),
    [movimientosFiltrados]
  );

  const egresos = useMemo(
    () =>
      movimientosFiltrados
        .filter((m) => m.tipo !== 'ingreso')
        .reduce((s, m) => s + (m.monto || 0), 0),
    [movimientosFiltrados]
  );

  const utilidad = useMemo(() => ingresos - egresos, [ingresos, egresos]);
  const margen = useMemo(() => (ingresos > 0 ? utilidad / ingresos : 0), [ingresos, utilidad]);

  // Rentabilidad por proyecto
  const profitabilityData = useMemo(() => {
    return proyectos.map((p) => {
      const ing = movimientos
        .filter((m) => m.proyectoId === p.id && m.tipo === 'ingreso')
        .reduce((s, m) => s + (m.monto || 0), 0);
      const gas = movimientos
        .filter((m) => m.proyectoId === p.id && m.tipo !== 'ingreso')
        .reduce((s, m) => s + (m.monto || 0), 0);
      const margenVal = ing - gas;
      const margenPct = ing > 0 ? (margenVal / ing) * 100 : 0;
      const rentabilidad = p.presupuestoTotal ? (margenVal / p.presupuestoTotal) * 100 : 0;

      return {
        id: p.id,
        nombre: p.nombre,
        presupuesto: p.presupuestoTotal || 0,
        ingresos: ing,
        gastos: gas,
        margen: margenVal,
        margenPct,
        rentabilidad,
      };
    });
  }, [proyectos, movimientos]);

  // Aging de cuentas por cobrar
  const agingCobrar = useMemo(() => {
    const vigentes = cuentasCobrar.filter((c) => {
      const dias = Math.floor(
        (new Date().getTime() - new Date(c.fecha).getTime()) / (1000 * 3600 * 24)
      );
      return dias <= 30;
    });
    const dias30_60 = cuentasCobrar.filter((c) => {
      const dias = Math.floor(
        (new Date().getTime() - new Date(c.fecha).getTime()) / (1000 * 3600 * 24)
      );
      return dias > 30 && dias <= 60;
    });
    const dias60_90 = cuentasCobrar.filter((c) => {
      const dias = Math.floor(
        (new Date().getTime() - new Date(c.fecha).getTime()) / (1000 * 3600 * 24)
      );
      return dias > 60 && dias <= 90;
    });
    const mayorA90 = cuentasCobrar.filter((c) => {
      const dias = Math.floor(
        (new Date().getTime() - new Date(c.fecha).getTime()) / (1000 * 3600 * 24)
      );
      return dias > 90;
    });

    const totalCobrar = cuentasCobrar.reduce((s, c) => s + (c.monto || 0), 0);

    return {
      total: totalCobrar,
      buckets: [
        {
          label: 'Vigente (< 30 días)',
          description: 'No vencidas',
          amount: vigentes.reduce((s, c) => s + (c.monto || 0), 0),
          percentage: totalCobrar > 0 ? (vigentes.reduce((s, c) => s + (c.monto || 0), 0) / totalCobrar) * 100 : 0,
          status: 'success' as const,
          color: 'hsl(var(--success))',
          bgColor: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
        },
        {
          label: '30-60 días',
          description: 'Vencidas',
          amount: dias30_60.reduce((s, c) => s + (c.monto || 0), 0),
          percentage: totalCobrar > 0 ? (dias30_60.reduce((s, c) => s + (c.monto || 0), 0) / totalCobrar) * 100 : 0,
          status: 'warning' as const,
          color: 'hsl(var(--warning))',
          bgColor: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
        },
        {
          label: '60-90 días',
          description: 'Muy vencidas',
          amount: dias60_90.reduce((s, c) => s + (c.monto || 0), 0),
          percentage: totalCobrar > 0 ? (dias60_90.reduce((s, c) => s + (c.monto || 0), 0) / totalCobrar) * 100 : 0,
          status: 'danger' as const,
          color: 'hsl(var(--destructive))',
          bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        },
        {
          label: '> 90 días',
          description: 'Crítico',
          amount: mayorA90.reduce((s, c) => s + (c.monto || 0), 0),
          percentage: totalCobrar > 0 ? (mayorA90.reduce((s, c) => s + (c.monto || 0), 0) / totalCobrar) * 100 : 0,
          status: 'danger' as const,
          color: 'hsl(var(--destructive))',
          bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        },
      ],
      status: mayorA90.length > 0 ? 'critical' : dias60_90.length > 0 ? 'caution' : 'healthy',
    };
  }, [cuentasCobrar]);

  // Vencimientos de cuentas por pagar
  const vencimientosPagar = useMemo(() => {
    const proximos7 = cuentasPagar.filter((c) => {
      const dias = Math.floor(
        (new Date(c.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
      );
      return dias > 0 && dias <= 7;
    });
    const proximos30 = cuentasPagar.filter((c) => {
      const dias = Math.floor(
        (new Date(c.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
      );
      return dias > 7 && dias <= 30;
    });
    const vigentes = cuentasPagar.filter((c) => {
      const dias = Math.floor(
        (new Date(c.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
      );
      return dias > 30;
    });
    const vencidas = cuentasPagar.filter((c) => {
      const dias = Math.floor(
        (new Date(c.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
      );
      return dias <= 0;
    });

    const totalPagar = cuentasPagar.reduce((s, c) => s + (c.monto || 0), 0);

    return {
      total: totalPagar,
      buckets: [
        {
          label: 'Vencidas',
          description: 'Requieren atención inmediata',
          amount: vencidas.reduce((s, c) => s + (c.monto || 0), 0),
          percentage: totalPagar > 0 ? (vencidas.reduce((s, c) => s + (c.monto || 0), 0) / totalPagar) * 100 : 0,
          status: 'danger' as const,
          color: 'hsl(var(--destructive))',
          bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        },
        {
          label: 'Próximos 7 días',
          description: 'Urgentes',
          amount: proximos7.reduce((s, c) => s + (c.monto || 0), 0),
          percentage: totalPagar > 0 ? (proximos7.reduce((s, c) => s + (c.monto || 0), 0) / totalPagar) * 100 : 0,
          status: 'danger' as const,
          color: 'hsl(var(--destructive))',
          bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        },
        {
          label: 'Próximos 30 días',
          description: 'A vigilar',
          amount: proximos30.reduce((s, c) => s + (c.monto || 0), 0),
          percentage: totalPagar > 0 ? (proximos30.reduce((s, c) => s + (c.monto || 0), 0) / totalPagar) * 100 : 0,
          status: 'warning' as const,
          color: 'hsl(var(--warning))',
          bgColor: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
        },
        {
          label: 'Futuros (> 30 días)',
          description: 'Normal',
          amount: vigentes.reduce((s, c) => s + (c.monto || 0), 0),
          percentage: totalPagar > 0 ? (vigentes.reduce((s, c) => s + (c.monto || 0), 0) / totalPagar) * 100 : 0,
          status: 'success' as const,
          color: 'hsl(var(--success))',
          bgColor: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
        },
      ],
      status: vencidas.length > 0 || proximos7.length > 0 ? 'critical' : proximos30.length > 0 ? 'caution' : 'healthy',
    };
  }, [cuentasPagar]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2">
            <Wallet className="w-7 h-7 text-emerald-500" />
            Dashboard Financiero
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Vista integrada de finanzas, rentabilidad y cuentas
          </p>
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <select
            value={filtroProyecto}
            onChange={(e) => setFiltroProyecto(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-card text-sm"
          >
            <option value="todos">Todos los proyectos</option>
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>

          <select
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-card text-sm"
          >
            <option value="mes">Este mes</option>
            <option value="trimestre">Este trimestre</option>
            <option value="anio">Este año</option>
          </select>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          label="Ingresos"
          value={fmtQ(ingresos)}
          icon={<ArrowUpRight size={18} />}
          status="success"
        />
        <KPICard
          label="Gastos"
          value={fmtQ(egresos)}
          icon={<ArrowDownRight size={18} />}
          status="warning"
        />
        <KPICard
          label="Utilidad"
          value={fmtQ(utilidad)}
          icon={<TrendingUp size={18} />}
          status={utilidad > 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Rentabilidad por Proyecto */}
      <ProfitabilityTable
        data={profitabilityData}
        onViewDetails={(projectId) => console.log('View details:', projectId)}
      />

      {/* Aging Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cuentas Cobrar */}
        <AgingReport
          title="Cuentas por Cobrar"
          buckets={agingCobrar.buckets}
          totalAmount={agingCobrar.total}
          overallStatus={agingCobrar.status}
        />

        {/* Cuentas Pagar */}
        <AgingReport
          title="Cuentas por Pagar"
          buckets={vencimientosPagar.buckets}
          totalAmount={vencimientosPagar.total}
          overallStatus={vencimientosPagar.status}
        />
      </div>
    </div>
  );
};

export default Financiero;
