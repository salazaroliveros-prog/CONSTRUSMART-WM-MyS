import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { fmtQ, fmtPct } from '../utils';
import { Progress, BarChart, LineChart } from '../components/Charts';
import ChartToolbar from '../components/ChartToolbar';
import { useChartConfig } from '../hooks/useChartConfig';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  Wrench,
  Eye,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  KPICard,
  StatusBadge,
  TableWithRowActions,
  ExecutiveAlerts,
  type Column,
} from '../components/shared';

interface ProjectStatusRow {
  id: string;
  nombre: string;
  estado: 'ejecucion' | 'planeacion' | 'pausado' | 'finalizado';
  avanceFisico: number;
  avanceFinanciero: number;
  variacion: number;
  presupuestoTotal: number;
  montoEjecutado: number;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const ctx = useErp();
  const barConfig = useChartConfig('bar', 'default');

  const proyectos = ctx.proyectos || [];
  const presupuestos = ctx.presupuestos || [];
  const avances = ctx.avances || [];
  const materiales = ctx.materiales || [];
  const empleados = ctx.empleados || [];
  const hitos = ctx.hitos || [];
  const cuentasCobrar = ctx.cuentasCobrar || [];
  const cuentasPagar = ctx.cuentasPagar || [];
  const riesgos = ctx.riesgos || [];
  const ordenesCambio = ctx.ordenes || [];

  // ============ CÁLCULOS DE KPIs ==============
  const kpi = useMemo(() => {
    const activos = proyectos.filter((p) => p.estado === 'ejecucion').length;
    const presupuestoTotal = proyectos.reduce((s, p) => s + (p.presupuestoTotal || 0), 0);
    const montoEjecutado = proyectos.reduce((s, p) => s + (p.montoEjecutado || 0), 0);
    const margenProm =
      presupuestos.length > 0
        ? presupuestos.reduce((s, p) => s + (p.margen ?? 0), 0) / presupuestos.length
        : 0;
    const clientes = new Set(proyectos.map((p) => p.clienteId)).size;
    const utilidad = presupuestoTotal - montoEjecutado;

    // Trend (vs mes anterior - simulado)
    const proyectosVsMesAnterior = 2;
    const carteraVsMesAnterior = 15;
    const utilidadVsMesAnterior = 8;
    const margenVsMesAnterior = -1.2;

    return {
      proyectos: proyectos.length,
      activos,
      presupuestoTotal,
      montoEjecutado,
      utilidad,
      cartera: presupuestoTotal,
      margenProm: Number.isFinite(margenProm) ? margenProm : 0,
      clientes,
      empleados: empleados.length,
      // Trends
      proyectosVsMesAnterior,
      carteraVsMesAnterior,
      utilidadVsMesAnterior,
      margenVsMesAnterior,
    };
  }, [proyectos, presupuestos, empleados]);

  // ============ SPARKLINE DATA ==============
  const sparklineProyectos = [8, 9, 10, 11, 10, 12, 12];
  const sparklineCartera = [1800, 1900, 2000, 2150, 2200, 2280, 2300];
  const sparklineUtilidad = [250, 260, 270, 280, 290, 300, 290];
  const sparklineMargen = [14.2, 13.8, 13.5, 13.2, 12.8, 12.5, 12.5];

  // ============ ALERTAS EJECUTIVAS ==============
  const criticalRisks = riesgos.filter((r) => r.probabilidad >= 4 && r.impacto >= 4);
  const highRisks = riesgos.filter((r) => (r.probabilidad + r.impacto) >= 6 && (r.probabilidad + r.impacto) < 8);
  const projectVariances = proyectos.filter((p) => {
    const variance = Math.abs((p.avanceFisico || 0) - (p.avanceFinanciero || 0));
    return variance > 5;
  });
  const overdueTasks = ordenesCambio.filter((oc) => oc.estado === 'solicitada');

  const alerts = [
    ...(criticalRisks.length > 0
      ? [
          {
            id: 'critical-risks',
            severity: 'critical' as const,
            title: 'Riesgos Críticos Identificados',
            description: `${criticalRisks.length} riesgos de alta probabilidad e impacto requieren atención inmediata`,
            count: criticalRisks.length,
            action: { label: 'Ver Riesgos', onClick: () => {} },
          },
        ]
      : []),
    ...(projectVariances.length > 0
      ? [
          {
            id: 'variances',
            severity: 'high' as const,
            title: 'Variaciones Presupuestarias Detectadas',
            description: `${projectVariances.length} proyectos muestran desviaciones > 5%`,
            count: projectVariances.length,
            action: { label: 'Analizar', onClick: () => {} },
          },
        ]
      : []),
    ...(overdueTasks.length > 0
      ? [
          {
            id: 'pending-orders',
            severity: 'high' as const,
            title: 'Órdenes de Cambio Pendientes',
            description: `${overdueTasks.length} órdenes de cambio requieren revisión`,
            count: overdueTasks.length,
            action: { label: 'Revisar', onClick: () => {} },
          },
        ]
      : []),
  ];

  // ============ TABLA DE PROYECTOS ==============
  const projectStatusData: ProjectStatusRow[] = proyectos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    estado: p.estado as 'ejecucion' | 'planeacion' | 'pausado' | 'finalizado',
    avanceFisico: p.avanceFisico || 0,
    avanceFinanciero: p.avanceFinanciero || 0,
    variacion: (p.avanceFisico || 0) - (p.avanceFinanciero || 0),
    presupuestoTotal: p.presupuestoTotal || 0,
    montoEjecutado: p.montoEjecutado || 0,
  }));

  const projectColumns: Column<ProjectStatusRow>[] = [
    {
      key: 'nombre',
      header: 'Proyecto',
      width: '30%',
      sortable: true,
    },
    {
      key: 'estado',
      header: 'Estado',
      width: '15%',
      render: (val) => (
        <StatusBadge
          status={val === 'ejecucion' ? 'success' : val === 'finalizado' ? 'info' : 'warning'}
          label={
            val === 'ejecucion'
              ? 'En Ejecución'
              : val === 'finalizado'
              ? 'Finalizado'
              : val === 'pausado'
              ? 'Pausado'
              : 'Planeación'
          }
          size="sm"
        />
      ),
    },
    {
      key: 'avanceFisico',
      header: 'Avance Físico',
      width: '15%',
      align: 'center',
      render: (val) => (
        <div className="flex items-center justify-center gap-2">
          <Progress value={val as number} color="hsl(var(--primary))" />
          <span className="text-xs font-semibold w-8">{val}%</span>
        </div>
      ),
    },
    {
      key: 'variacion',
      header: 'Variación',
      width: '12%',
      align: 'center',
      render: (val) => {
        const variance = val as number;
        const statusColor = Math.abs(variance) < 3 ? 'text-emerald-600' : Math.abs(variance) < 5 ? 'text-amber-600' : 'text-red-600';
        return (
          <span className={`text-xs font-semibold ${statusColor}`}>
            {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
          </span>
        );
      },
    },
    {
      key: 'presupuestoTotal',
      header: 'Presupuesto',
      width: '14%',
      align: 'right',
      render: (val) => <span className="text-xs font-medium">{fmtQ(val as number)}</span>,
    },
    {
      key: 'montoEjecutado',
      header: 'Ejecutado',
      width: '14%',
      align: 'right',
      render: (val) => <span className="text-xs font-medium text-amber-600">{fmtQ(val as number)}</span>,
    },
  ];

  // ============ DATOS FINANCIEROS ==============
  const ingresos = cuentasCobrar.reduce((s, c) => s + (c.monto || 0), 0);
  const egresos = cuentasPagar.reduce((s, c) => s + (c.monto || 0), 0);
  const cobrado = cuentasCobrar.filter((c) => c.estado === 'pagado').reduce((s, c) => s + (c.monto || 0), 0);
  const pagado = cuentasPagar.filter((c) => c.estado === 'pagado').reduce((s, c) => s + (c.monto || 0), 0);

  if (!ctx) return null;

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
      {/* ============ HEADER ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-primary" aria-hidden="true" />
            {t('dashboard.title')}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>
      </div>

      {/* ============ KPIs CON TREND ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          label={t('dashboard.proyectos')}
          value={kpi.proyectos}
          trend={{
            percentage: kpi.proyectosVsMesAnterior,
            direction: kpi.proyectosVsMesAnterior > 0 ? 'up' : 'down',
            period: 'vs mes anterior',
          }}
          icon={<TrendingUp size={18} />}
          sparklineData={sparklineProyectos}
          status="info"
        />

        <KPICard
          label={t('dashboard.cartera')}
          value={fmtQ(kpi.cartera)}
          trend={{
            percentage: kpi.carteraVsMesAnterior,
            direction: kpi.carteraVsMesAnterior > 0 ? 'up' : 'down',
            period: 'vs mes anterior',
          }}
          icon={<DollarSign size={18} />}
          sparklineData={sparklineCartera}
          status="success"
        />

        <KPICard
          label={t('dashboard.utilidad')}
          value={fmtQ(kpi.utilidad)}
          trend={{
            percentage: kpi.utilidadVsMesAnterior,
            direction: kpi.utilidadVsMesAnterior > 0 ? 'up' : 'down',
            period: 'vs mes anterior',
          }}
          icon={<CheckCircle2 size={18} />}
          sparklineData={sparklineUtilidad}
          status={kpi.utilidad > 0 ? 'success' : 'danger'}
        />

        <KPICard
          label={t('dashboard.margen')}
          value={fmtPct(kpi.margenProm)}
          trend={{
            percentage: kpi.margenVsMesAnterior,
            direction: kpi.margenVsMesAnterior > 0 ? 'up' : 'down',
            period: 'vs mes anterior',
          }}
          icon={<TrendingUp size={18} />}
          sparklineData={sparklineMargen}
          status={kpi.margenProm > 15 ? 'success' : kpi.margenProm > 10 ? 'warning' : 'danger'}
        />
      </div>

      {/* ============ ALERTAS EJECUTIVAS ============ */}
      <ExecutiveAlerts alerts={alerts} />

      {/* ============ TABLA DE PROYECTOS EN EJECUCIÓN ============ */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Proyectos en Ejecución
          </h2>
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
            {proyectos.filter((p) => p.estado === 'ejecucion').length} activos
          </span>
        </div>

        <TableWithRowActions
          data={projectStatusData.filter((p) => p.estado === 'ejecucion')}
          columns={projectColumns}
          actions={[
            {
              label: 'Ver Detalle',
              icon: <Eye size={16} />,
              onClick: (row) => {
                console.log('Ver detalle:', row.id);
              },
              variant: 'default',
            },
          ]}
          emptyState={{
            icon: <CheckCircle2 size={48} className="text-muted-foreground/40" />,
            title: 'Sin proyectos en ejecución',
            description: 'Todos tus proyectos están en planeación o finalizados',
          }}
        />
      </div>

      {/* ============ GRID: FINANCIERO + STOCK ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Flujo Financiero */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
          <h3 className="text-base font-semibold text-foreground mb-4">Situación Financiera</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Cobrado</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {fmtQ(cobrado)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                de {fmtQ(ingresos)}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Balance</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {fmtQ(cobrado - pagado)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Disponible
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Pagado</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {fmtQ(pagado)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                de {fmtQ(egresos)}
              </p>
            </div>
          </div>
        </div>

        {/* Stock de Materiales */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-base font-semibold text-foreground mb-4">Inventario</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">En Stock</span>
                <span className="text-sm font-semibold text-emerald-600">
                  {materiales.filter((m) => m.stock > m.stockMinimo).length}
                </span>
              </div>
              <Progress
                value={
                  materiales.length > 0
                    ? (materiales.filter((m) => m.stock > m.stockMinimo).length / materiales.length) * 100
                    : 0
                }
                color="hsl(var(--success))"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">Crítico</span>
                <span className="text-sm font-semibold text-red-600">
                  {materiales.filter((m) => m.stock < m.stockMinimo).length}
                </span>
              </div>
              <Progress
                value={
                  materiales.length > 0
                    ? (materiales.filter((m) => m.stock < m.stockMinimo).length / materiales.length) * 100
                    : 0
                }
                color="hsl(var(--destructive))"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">Empleados</span>
                <span className="text-sm font-semibold">{kpi.empleados}</span>
              </div>
              <Progress value={100} color="hsl(var(--info))" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
