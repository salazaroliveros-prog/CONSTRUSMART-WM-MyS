import React, { useMemo, useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);
  const ctx = useErp();
  const barConfig = useChartConfig('bar', 'default');

  const proyectos = useMemo(() => ctx.proyectos || [], [ctx.proyectos]);
  const avances = useMemo(() => ctx.avances || [], [ctx.avances]);
  const materiales = useMemo(() => ctx.materiales || [], [ctx.materiales]);
  const hitos = useMemo(() => ctx.hitos || [], [ctx.hitos]);
  const cuentasCobrar = useMemo(() => ctx.cuentasCobrar || [], [ctx.cuentasCobrar]);
  const cuentasPagar = useMemo(() => ctx.cuentasPagar || [], [ctx.cuentasPagar]);
  const riesgos = useMemo(() => ctx.riesgos || [], [ctx.riesgos]);
  const ordenesCambio = useMemo(() => ctx.ordenesCambio || [], [ctx.ordenesCambio]);
  const empleados = useMemo(() => ctx.empleados || [], [ctx.empleados]);

  const proyectosEnRiesgo = useMemo(() => riesgos?.filter(r => r.nivel === 'alto' || r.nivel === 'critico').length || 0, [riesgos]);
  const ordenesPendientes = useMemo(() => ordenesCambio?.filter(o => o.estado === 'pendiente').length || 0, [ordenesCambio]);
  const empleadosActivos = useMemo(() => empleados?.length || 0, [empleados]);
  const flujoNeto = useMemo(() => {
    const cobrado = cuentasCobrar?.filter(c => c.estado === 'pagado').reduce((s, c) => s + (c.monto || 0), 0) || 0;
    const pagado = cuentasPagar?.filter(p => p.estado === 'pagado').reduce((s, p) => s + (p.monto || 0), 0) || 0;
    return cobrado - pagado;
  }, [cuentasCobrar, cuentasPagar]);

  // ============ CÁLCULOS DE KPIs ==============
  const kpi = useMemo(() => {
    const proyectos = ctx.proyectos || [];
    const presupuestos = ctx.presupuestos || [];
    const empleados = ctx.empleados || [];

    const activos = proyectos.filter((p) => p.estado === 'ejecucion').length;
    const presupuestoTotal = proyectos.reduce((s, p) => s + (p.presupuestoTotal || 0), 0);
    const montoEjecutado = proyectos.reduce((s, p) => s + ((p.presupuestoTotal || 0) * ((p.avanceFinanciero || 0) / 100)), 0);
    const totalCalculadoPresupuesto = presupuestos.reduce((s, p) => s + (p.totalCalculado || 0), 0);
    const totalCostoDirecto = presupuestos.reduce((s, p) => s + (p.costoDirectoTotal || 0), 0);
    const margenProm = totalCalculadoPresupuesto > 0
      ? ((totalCalculadoPresupuesto - totalCostoDirecto) / totalCalculadoPresupuesto) * 100
      : 0;
    const clientes = new Set(proyectos.map((p) => p.cliente).filter(Boolean)).size;
    const utilidad = presupuestoTotal - montoEjecutado;

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
    };
  }, [ctx]);

  // ============ ALERTAS EJECUTIVAS ==============
  const criticalRisks = useMemo(() => riesgos.filter((r) => r.probabilidad >= 4 && r.impacto >= 4), [riesgos]);
  const highRisks = useMemo(() => riesgos.filter((r) => (r.probabilidad + r.impacto) >= 6 && (r.probabilidad + r.impacto) < 8), [riesgos]);
  const projectVariances = useMemo(() => proyectos.filter((p) => {
    const variance = Math.abs((p.avanceFisico || 0) - (p.avanceFinanciero || 0));
    return variance > 5;
  }), [proyectos]);
  const overdueTasks = useMemo(() => ordenesCambio.filter((oc) => oc.estado === 'solicitada'), [ordenesCambio]);

  const alerts = [
    ...(criticalRisks.length > 0
      ? [
          {
            id: 'critical-risks',
            severity: 'critical' as const,
            title: t('dashboard.alert_riesgos_criticos_title'),
            description: t('dashboard.alert_riesgos_criticos_desc', { count: criticalRisks.length }),
            count: criticalRisks.length,
            action: { label: t('dashboard.alert_riesgos_criticos_action'), onClick: () => ctx.setView('riesgos') },
          },
        ]
      : []),
    ...(projectVariances.length > 0
      ? [
          {
            id: 'variances',
            severity: 'high' as const,
            title: t('dashboard.alert_variaciones_title'),
            description: t('dashboard.alert_variaciones_desc', { count: projectVariances.length }),
            count: projectVariances.length,
            action: { label: t('dashboard.alert_variaciones_action'), onClick: () => ctx.setView('seguimiento') },
          },
        ]
      : []),
    ...(overdueTasks.length > 0
      ? [
          {
            id: 'pending-orders',
            severity: 'high' as const,
            title: t('dashboard.alert_ordenes_cambio_title'),
            description: t('dashboard.alert_ordenes_cambio_desc', { count: overdueTasks.length }),
            count: overdueTasks.length,
            action: { label: t('dashboard.alert_ordenes_cambio_action'), onClick: () => ctx.setView('ordenes-cambio') },
          },
        ]
      : []),
  ];

  // ============ TABLA DE PROYECTOS ==============
  const projectColumns: Column<ProjectStatusRow>[] = [
    {
      key: 'nombre',
      header: t('dashboard.table_header_proyecto'),
      width: '30%',
      sortable: true,
    },
    {
      key: 'estado',
      header: t('dashboard.table_header_estado'),
      width: '15%',
      render: (val) => (
        <StatusBadge
          status={val === 'ejecucion' ? 'success' : val === 'finalizado' ? 'info' : 'warning'}
          label={
            val === 'ejecucion'
              ? t('dashboard.estado_ejecucion')
              : val === 'finalizado'
              ? t('dashboard.estado_finalizado')
              : val === 'pausado'
              ? t('dashboard.estado_pausado')
              : t('dashboard.estado_planeacion')
          }
          size="sm"
        />
      ),
    },
    {
      key: 'avanceFisico',
      header: t('dashboard.table_header_avance_fisico'),
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
      header: t('dashboard.table_header_variacion'),
      width: '12%',
      align: 'center',
      render: (val) => {
        const variance = val as number;
        const statusColor = Math.abs(variance) < 3 ? 'text-success' : Math.abs(variance) < 5 ? 'text-warning' : 'text-destructive';
        return (
          <span className={`text-xs font-semibold ${statusColor}`}>
            {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
          </span>
        );
      },
    },
    {
      key: 'presupuestoTotal',
      header: t('dashboard.table_header_presupuesto'),
      width: '14%',
      align: 'right',
      render: (val) => <span className="text-xs font-medium">{fmtQ(val as number)}</span>,
    },
    {
      key: 'montoEjecutado',
      header: t('dashboard.table_header_ejecutado'),
      width: '14%',
      align: 'right',
      render: (val) => <span className="text-xs font-medium text-warning">{fmtQ(val as number)}</span>,
    },
  ];

  // ============ DATOS FINANCIEROS ==============
  const ingresos = useMemo(() => cuentasCobrar.reduce((s, c) => s + (c.monto || 0), 0), [cuentasCobrar]);
  const egresos = useMemo(() => cuentasPagar.reduce((s, c) => s + (c.monto || 0), 0), [cuentasPagar]);
  const cobrado = useMemo(() => cuentasCobrar.filter((c) => c.estado === 'pagado').reduce((s, c) => s + (c.monto || 0), 0), [cuentasCobrar]);
  const pagado = useMemo(() => cuentasPagar.filter((c) => c.estado === 'pagado').reduce((s, c) => s + (c.monto || 0), 0), [cuentasPagar]);

  const proyectosEnEjecucion = useMemo(() => proyectos.filter((p) => p.estado === 'ejecucion'), [proyectos]);
  const projectStatusData = useMemo(() => proyectos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    estado: p.estado as 'ejecucion' | 'planeacion' | 'pausado' | 'finalizado',
    avanceFisico: p.avanceFisico || 0,
    avanceFinanciero: p.avanceFinanciero || 0,
    variacion: (p.avanceFisico || 0) - (p.avanceFinanciero || 0),
    presupuestoTotal: p.presupuestoTotal || 0,
    montoEjecutado: ((p.presupuestoTotal || 0) * ((p.avanceFinanciero || 0) / 100)),
  })), [proyectos]);
  const materialesEnStock = useMemo(() => materiales.filter((m) => m.stock > m.stockMinimo), [materiales]);
  const materialesCriticos = useMemo(() => materiales.filter((m) => m.stock < m.stockMinimo), [materiales]);

  if (!ctx) return null;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

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
          icon={<TrendingUp size={18} />}
          status="info"
        />

        <KPICard
          label={t('dashboard.cartera')}
          value={fmtQ(kpi.cartera)}
          icon={<DollarSign size={18} />}
          status="success"
        />

        <KPICard
          label={t('dashboard.utilidad')}
          value={fmtQ(kpi.utilidad)}
          icon={<CheckCircle2 size={18} />}
          status={kpi.utilidad > 0 ? 'success' : kpi.utilidad < 0 ? 'danger' : 'info'}
        />

        <KPICard
          label={t('dashboard.margen')}
          value={fmtPct(kpi.margenProm)}
          icon={<TrendingUp size={18} />}
          status={kpi.margenProm > 15 ? 'success' : kpi.margenProm > 0 ? 'warning' : kpi.margenProm < 0 ? 'danger' : 'info'}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-destructive/10 rounded-xl p-4 text-center">
          <p className="text-xs text-destructive font-medium">En Riesgo</p>
          <p className="text-xl font-bold text-destructive">{proyectosEnRiesgo}</p>
        </div>
        <div className="bg-warning/10 rounded-xl p-4 text-center">
          <p className="text-xs text-warning font-medium">OC Pendientes</p>
          <p className="text-xl font-bold text-warning">{ordenesPendientes}</p>
        </div>
        <div className="bg-info/10 rounded-xl p-4 text-center">
          <p className="text-xs text-info font-medium">Empleados</p>
          <p className="text-xl font-bold text-info">{empleadosActivos}</p>
        </div>
        <div className="bg-success/10 rounded-xl p-4 text-center">
          <p className="text-xs text-success font-medium">Flujo Neto</p>
          <p className="text-xl font-bold text-success">{fmtQ(flujoNeto)}</p>
        </div>
      </div>

      {/* ============ ALERTAS EJECUTIVAS ============ */}
      <ExecutiveAlerts alerts={alerts} />

      {/* ============ TABLA DE PROYECTOS EN EJECUCIÓN ============ */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground truncate" title="Proyectos en Ejecución">
            Proyectos en Ejecución
          </h2>
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
            {proyectosEnEjecucion.length} activos
          </span>
        </div>

        <TableWithRowActions
          data={proyectosEnEjecucion.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            estado: p.estado as 'ejecucion' | 'planeacion' | 'pausado' | 'finalizado',
            avanceFisico: p.avanceFisico || 0,
            avanceFinanciero: p.avanceFinanciero || 0,
            variacion: (p.avanceFisico || 0) - (p.avanceFinanciero || 0),
            presupuestoTotal: p.presupuestoTotal || 0,
            montoEjecutado: ((p.presupuestoTotal || 0) * ((p.avanceFinanciero || 0) / 100)),
          }))}
          columns={projectColumns}
          actions={[
            {
              label: 'Ver Detalle',
              icon: <Eye size={16} />,
              onClick: (row) => {
                ctx.setView('ordenes-cambio');
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Flujo Financiero */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
          <h3 className="text-base font-semibold text-foreground mb-4 truncate" title="Situación Financiera">Situación Financiera</h3>
          {ingresos > 0 || egresos > 0 ? (
            <div className="space-y-4">
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
              <BarChart
                data={[
                  { label: 'Cobrado', value: cobrado, color: '#10b981' },
                  { label: 'Pendiente', value: Math.max(0, ingresos - cobrado), color: '#f59e0b' },
                  { label: 'Pagado', value: pagado, color: '#ef4444' },
                  { label: 'Balance', value: Math.max(0, cobrado - pagado), color: '#3b82f6' },
                ]}
                height={180}
                palette="default"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <DollarSign size={40} className="opacity-30" aria-hidden="true" />
              <p className="text-sm font-medium">Sin datos financieros</p>
              <p className="text-xs">Registra cuentas por cobrar y pagar para ver gráficos</p>
            </div>
          )}
        </div>

        {/* Stock de Materiales */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-base font-semibold text-foreground mb-4 truncate" title="Inventario">Inventario</h3>
          {materiales.length > 0 ? (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">En Stock</span>
                  <span className="text-sm font-semibold text-emerald-600">
                    {materialesEnStock.length}
                  </span>
                </div>
                <Progress
                  value={
                    materiales.length > 0
                      ? (materialesEnStock.length / materiales.length) * 100
                      : 0
                  }
                  color="hsl(var(--success))"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">Crítico</span>
                  <span className="text-sm font-semibold text-red-600">
                    {materialesCriticos.length}
                  </span>
                </div>
                <Progress
                  value={
                    materiales.length > 0
                      ? (materialesCriticos.length / materiales.length) * 100
                      : 0
                  }
                  color="hsl(var(--destructive))"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Wrench size={40} className="opacity-30" aria-hidden="true" />
              <p className="text-sm font-medium">Sin inventario registrado</p>
              <p className="text-xs">Agrega materiales para ver el estado de stock</p>
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-muted-foreground">Empleados</span>
              <span className="text-sm font-semibold">{kpi.empleados}</span>
            </div>
            <div className="h-2 bg-muted rounded-full"><div className="h-full bg-info rounded-full" style={{ width: `${Math.min(100, Math.max(0, (kpi.empleados / 50) * 100))}%` }}></div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
