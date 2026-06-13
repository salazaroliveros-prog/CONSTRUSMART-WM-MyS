import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp, type View } from '../store';
import { fmtQ, fmtPct } from '../utils';
import KpiCard from '../components/KpiCard';
import MovimientoForm from '../components/MovimientoForm';
import AlertasPanel from '../components/AlertasPanel';
import CompactCalendar from '../components/CompactCalendar';
import { BarChart, Donut, Progress, Gauge } from '../components/Charts';
import { Building2, TrendingUp, DollarSign, AlertTriangle, Package, Users, CalendarClock, ArrowRight, Calculator, FileText, Wallet, Warehouse, ClipboardCheck, Activity, CircleDot, TrendingDown, Download, Shield, Zap, Repeat } from 'lucide-react';
import GanttChart from '../components/GanttChart';
import { CARD, CARD_TITLE } from '../ui';
import ProyectoFilter from '../components/ProyectoFilter';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#fbbf24', '#ec4899'];

const STATUS_COLORS: Record<string, string> = {
  planeacion: '#3b82f6',
  ejecucion: '#10b981',
  pausado: '#f59e0b',
  finalizado: '#8b5cf6',
};

function useStagger(delay: number): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setP(1), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return p;
}

function useOnlineStatus() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const ctx = useErp();
  const online = useOnlineStatus();
  const dashRef = useRef<HTMLDivElement>(null);

  const {
    proyectos, movimientos, avances, selectedProyectoId, setView,
    materiales, setSelectedProyectoId, empleados, hitos, ordenes,
    cuentasPagar, eventos, presupuestos, licitaciones, riesgos,
    ordenesCambio, cuentasCobrar
  } = ctx;

  const s1 = useStagger(0);
  const s2 = useStagger(100);
  const s3 = useStagger(200);
  const s4 = useStagger(300);
  const staggerArr = [s1, s2, s3, s4];

  const activos = proyectos.filter(p => p.estado === 'ejecucion');
  const proyectosSel = selectedProyectoId && selectedProyectoId !== 'none'
    ? proyectos.filter(p => p.id === selectedProyectoId) : proyectos;
  const presupuestoTotal = proyectosSel.reduce((a, b) => a + b.presupuestoTotal, 0);
  const margenProm = proyectosSel.length
    ? proyectosSel.reduce((a, b) => {
        const m = b.montoContrato > 0 ? ((b.montoContrato - b.presupuestoTotal) / b.montoContrato) * 100 : 0;
        return a + m;
      }, 0) / proyectosSel.length : 0;
  const desviacion = proyectosSel.length
    ? proyectosSel.reduce((a, b) => a + (b.avanceFinanciero - b.avanceFisico), 0) / proyectosSel.length : 0;
  const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((a, b) => a + (b.monto ?? b.costoTotal ?? 0), 0);
  const gastos = movimientos.filter(m => m.tipo === 'gasto').reduce((a, b) => a + (b.monto ?? b.costoTotal ?? 0), 0);
  const saldoNeto = ingresos - gastos;

  const avanceProm = useMemo(() => {
    const filtrados = selectedProyectoId && selectedProyectoId !== 'none'
      ? proyectos.filter(p => p.id === selectedProyectoId) : proyectos;
    const totalP = filtrados.reduce((a, b) => a + b.presupuestoTotal, 0);
    return totalP > 0
      ? Math.round(filtrados.reduce((a, b) => a + (b.avanceFisico * b.presupuestoTotal), 0) / totalP)
      : 0;
  }, [proyectos, selectedProyectoId]);

  const avanceFinProm = useMemo(() => {
    const filtrados = selectedProyectoId && selectedProyectoId !== 'none'
      ? proyectos.filter(p => p.id === selectedProyectoId) : proyectos;
    const totalP = filtrados.reduce((a, b) => a + b.presupuestoTotal, 0);
    return totalP > 0
      ? Math.round(filtrados.reduce((a, b) => a + (b.avanceFinanciero * b.presupuestoTotal), 0) / totalP)
      : 0;
  }, [proyectos, selectedProyectoId]);

  const carteraData = useMemo(() => {
    const counts: Record<string, number> = { planeacion: 0, ejecucion: 0, pausado: 0, finalizado: 0 };
    proyectos.forEach(p => { if (counts[p.estado] !== undefined) counts[p.estado]++; });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([k, v]) => ({
      label: t(`dashboard.${k}`), value: v, color: STATUS_COLORS[k] || '#6b7280',
    }));
  }, [proyectos, t]);

  const planVsReal = useMemo(() => {
    const filtrados = selectedProyectoId && selectedProyectoId !== 'none'
      ? materiales.filter(m => m.proyectoIds?.includes(selectedProyectoId)) : materiales;
    const items = filtrados.length ? filtrados : materiales;
    const conPlan = items.filter(m => typeof m.cantidadPresupuestada === 'number' && m.cantidadPresupuestada > 0);
    const costoPlanificado = conPlan.reduce((a, m) => a + ((m.cantidadPresupuestada ?? 0) * m.precio), 0);
    const costoReal = conPlan.reduce((a, m) => a + (m.stock * m.precio), 0);
    const avgDesv = conPlan.length ? conPlan.reduce((a, m) => a + ((m.stock - (m.cantidadPresupuestada ?? 0)) / Math.max(m.cantidadPresupuestada ?? 1, 1)) * 100, 0) / conPlan.length : 0;
    const top = conPlan.length ? [...conPlan].sort((a, b) => Math.abs((b.stock - (b.cantidadPresupuestada ?? 0)) / Math.max(b.cantidadPresupuestada ?? 1, 1)) - Math.abs((a.stock - (a.cantidadPresupuestada ?? 0)) / Math.max(a.cantidadPresupuestada ?? 1, 1)))[0] : null;
    return { conPlan: conPlan.length, costoPlanificado, costoReal, avgDesv, top, totalMateriales: items.length };
  }, [materiales, selectedProyectoId]);

  const stockData = useMemo(() => {
    const criticos = materiales.filter(m => m.stock <= (m.stockMinimo || 0));
    return {
      criticos: criticos.length,
      ok: Math.max(materiales.length - criticos.length, 0),
      total: materiales.length,
      items: criticos.slice(0, 5).map(m => ({
        nombre: m.nombre, stock: m.stock, minimo: m.stockMinimo || 0,
      })),
    };
  }, [materiales]);

  const rhData = useMemo(() => ({
    disponibles: empleados.filter(e => e.estado === 'disponible').length,
    ocupados: empleados.filter(e => e.estado === 'ocupado').length,
    total: empleados.length,
  }), [empleados]);

  const timelineData = useMemo(() => {
    const filtrados = selectedProyectoId && selectedProyectoId !== 'none'
      ? hitos.filter(h => h.proyectoId === selectedProyectoId) : hitos;
    const projMap = new Map(proyectos.map(p => [p.id, p.nombre]));
    return [...filtrados].filter(h => h.fecha).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 8).map(h => ({
      id: h.id, nombre: h.nombre, proyecto: projMap.get(h.proyectoId) || '',
      fecha: h.fecha, estado: h.estado || 'pendiente',
    }));
  }, [hitos, selectedProyectoId, proyectos]);

  const ganttData = useMemo(() => {
    const filtrados = selectedProyectoId && selectedProyectoId !== 'none'
      ? hitos.filter(h => h.proyectoId === selectedProyectoId) : hitos;
    const projMap = new Map(proyectos.map(p => [p.id, p.nombre]));
    return [...filtrados].filter(h => h.fecha).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 12).map(h => {
      const hoy = new Date();
      const fechaHito = new Date(h.fecha);
      const diffDias = Math.ceil((hoy.getTime() - fechaHito.getTime()) / 86400000);
      const inicio = new Date(fechaHito);
      inicio.setDate(inicio.getDate() - Math.max(diffDias + 14, 14));
      return {
        id: h.id,
        nombre: h.nombre,
        proyecto: projMap.get(h.proyectoId) || '',
        fechaInicio: inicio.toISOString().slice(0, 10),
        fechaFin: h.fecha,
        estado: h.estado || 'pendiente',
        avance: h.estado === 'completado' ? 100 : (h as any).avance,
      };
    });
  }, [hitos, selectedProyectoId, proyectos]);

  const movPorCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    movimientos.filter(m => m.tipo === 'gasto').forEach(m => { map[m.categoria] = (map[m.categoria] || 0) + (m.monto ?? m.costoTotal ?? 0); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([k, v], i) => ({ label: k.slice(0, 4), value: v, color: COLORS[i % COLORS.length] }));
  }, [movimientos]);

  const topProyectos = useMemo(() =>
    [...proyectos].sort((a, b) => b.presupuestoTotal - a.presupuestoTotal).slice(0, 3)
      .map(p => ({ id: p.id, nombre: p.nombre, presupuesto: p.presupuestoTotal, avance: p.avanceFisico, estado: p.estado })),
  [proyectos]);

  const ocPendientes = useMemo(() =>
    ordenes.filter(o => o.estado === 'pendiente' || o.estado === 'borrador').slice(0, 3)
      .map(o => ({ id: o.id, proveedor: o.proveedor, material: o.material, cantidad: o.cantidad, monto: (o.precioUnitario || 0) * (o.cantidad || 0) })),
  [ordenes]);

  const cuentasProximas = useMemo(() => {
    const hoy = new Date();
    const treintaDias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);
    return (cuentasPagar || [])
      .filter(c => c.fechaVencimiento && new Date(c.fechaVencimiento) <= treintaDias && c.estado !== 'pagado')
      .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()).slice(0, 3);
  }, [cuentasPagar]);

  const cobrarProximas = useMemo(() => {
    const hoy = new Date();
    const treintaDias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);
    return (cuentasCobrar || [])
      .filter(c => c.fechaVencimiento && new Date(c.fechaVencimiento) <= treintaDias && c.estado !== 'pagado')
      .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()).slice(0, 3);
  }, [cuentasCobrar]);

  const licitacionesData = useMemo(() => {
    const licits = licitaciones || [];
    const abiertas = licits.filter((l: any) => l.estado === 'abierta' || l.estado === 'en_proceso').length;
    const ganadas = licits.filter((l: any) => l.estado === 'ganada').length;
    const totalMonto = licits.reduce((a: number, l: any) => a + (l.montoEstimado || l.monto || 0), 0);
    const top = [...licits].sort((a: any, b: any) => (b.probabilidad || 0) - (a.probabilidad || 0)).slice(0, 3);
    return { abiertas, ganadas, totalMonto, count: licits.length, top };
  }, [licitaciones]);

  const riesgosActivos = useMemo(() => {
    const rs = riesgos || [];
    const activos = rs.filter((r: any) => r.estado === 'abierto' || r.estado === 'en_seguimiento');
    const alto = activos.filter((r: any) => (r.nivel || '').toLowerCase().includes('alto') || (r.nivel || '').toLowerCase().includes('high')).length;
    const medio = activos.filter((r: any) => (r.nivel || '').toLowerCase().includes('medio') || (r.nivel || '').toLowerCase().includes('medium')).length;
    const bajo = activos.length - alto - medio;
    const top = activos.slice(0, 3);
    return { total: activos.length, alto, medio, bajo: Math.max(bajo, 0), top };
  }, [riesgos]);

  const ocCambioPendientes = useMemo(() => {
    const ocs = ordenesCambio || [];
    return ocs.filter((o: any) => o.estado === 'pendiente' || o.estado === 'pendiente_aprobacion').slice(0, 3);
  }, [ordenesCambio]);

  const proyTrend = useMemo(() => {
    const base = activos.length || 1;
    return [base, Math.max(1, base - 1), base, Math.max(1, base + 1), base, Math.max(1, base - 1), base, base];
  }, [activos.length]);

  const gastoTrend = useMemo(() => {
    if (gastos <= 0) return [0, 0, 0, 0, 0, 0, 0, 0];
    const step = gastos / 7;
    return Array.from({ length: 8 }, (_, i) => Math.round(step * i * 100) / 100);
  }, [gastos]);

  const handleExportPdf = useCallback(() => {
    const el = dashRef.current;
    if (!el) return;
    import('html2canvas').then(({ default: html2canvas }) => {
      import('jspdf').then(({ default: jsPDF }) => {
        html2canvas(el, { scale: 2, useCORS: true }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('l', 'mm', 'a4');
          const w = pdf.internal.pageSize.getWidth();
          const h = (canvas.height * w) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, w, h);
          pdf.save('dashboard-construsmart.pdf');
        });
      });
    });
  }, []);

  const modulos = [
    { id: 'proyectos', label: t('nav.items.proyectos'), icon: Building2, c: 'from-blue-500 to-indigo-600' },
    { id: 'presupuestos', label: t('nav.items.presupuestos'), icon: Calculator, c: 'from-orange-500 to-amber-500' },
    { id: 'seguimiento', label: t('nav.items.seguimiento'), icon: ClipboardCheck, c: 'from-emerald-500 to-teal-600' },
    { id: 'financiero', label: t('nav.items.financiero'), icon: Wallet, c: 'from-violet-500 to-purple-600' },
    { id: 'rrhh', label: t('nav.items.rrhh'), icon: Users, c: 'from-pink-500 to-rose-600' },
    { id: 'bodega', label: t('nav.items.bodega'), icon: Warehouse, c: 'from-cyan-500 to-sky-600' },
    { id: 'cotizaciones', label: t('nav.items.cotizaciones') || 'Cotizaciones', icon: FileText, c: 'from-rose-500 to-pink-600' },
    { id: 'riesgos', label: t('nav.items.riesgos'), icon: Shield, c: 'from-red-500 to-orange-600' },
  ];

  const SkeletonCard: React.FC<{ h?: string }> = ({ h = 'h-8' }) => (
    <div className="rounded-lg sm:rounded-2xl bg-card border border-border overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      <div className={`${h} bg-muted rounded-lg sm:rounded-2xl`} />
    </div>
  );

  const loading = proyectos.length === 0;
  const avanceColor = avanceProm < 30 ? 'text-destructive' : avanceProm < 70 ? 'text-warning' : 'text-success';

  return (
    <div ref={dashRef} className="h-full flex flex-col p-2 sm:p-3 lg:p-4 max-w-[1600px] mx-auto overflow-hidden bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.04),transparent_50%)]">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-1 sm:gap-2 mb-2 flex-shrink-0">
        <div className="min-w-0 flex items-center gap-2">
          <div>
            <h1 className="text-sm sm:text-lg lg:text-xl font-black text-foreground leading-tight">{t('dashboard.tablero')}</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{t('dashboard.metricas_tiempo_real')}</p>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
            {online ? t('dashboard.en_vivo') : t('dashboard.offline')}
          </div>
          <button onClick={handleExportPdf} className="text-[9px] text-primary hover:text-primary/80 font-medium flex items-center gap-0.5 bg-primary/10 rounded-full px-2 py-0.5 transition-colors" title={t('dashboard.exportar_pdf')}>
            <Download className="w-2.5 h-2.5" /> PDF
          </button>
        </div>
        <ProyectoFilter value={selectedProyectoId ?? ''} onChange={(id) => setSelectedProyectoId(id || null)} proyectos={proyectos} />
      </div>

      {/* KPI Row */}
      {loading
        ? <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-2 flex-shrink-0">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        : <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-2 flex-shrink-0">
            {[
              { label: t('dashboard.proyectos'), value: String(activos.length), icon: <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, trend: `${proyectos.length} total`, accent: 'from-blue-500 to-indigo-500', spark: proyTrend, up: true },
              { label: t('dashboard.presupuesto'), value: fmtQ(presupuestoTotal), icon: <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, trend: `${proyectosSel.length} proy.`, accent: 'from-orange-500 to-amber-500', spark: gastoTrend, up: true },
              { label: t('dashboard.margen_util'), value: fmtPct(margenProm), icon: <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, trend: margenProm > 0 ? t('dashboard.sano') : t('dashboard.riesgo'), accent: 'from-emerald-500 to-teal-500', spark: undefined, up: margenProm > 0 },
              { label: t('dashboard.desviacion'), value: fmtPct(desviacion), icon: <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, trend: desviacion > 0 ? t('dashboard.riesgo') : t('dashboard.sano'), accent: Math.abs(desviacion) > 15 ? 'from-red-500 to-rose-500' : 'from-amber-500 to-yellow-500', spark: undefined, up: desviacion <= 0 },
            ].map((kpi, i) => (
              <div key={i} style={{ opacity: staggerArr[i], transform: `translateY(${(1 - staggerArr[i]) * 20}px)`, transition: 'all 0.5s ease-out' }}>
                <KpiCard label={kpi.label} value={kpi.value} icon={kpi.icon} trend={kpi.trend} trendUp={kpi.up} accent={kpi.accent} sparkData={kpi.spark} />
              </div>
            ))}
          </div>
      }

      {/* ─── ROW 2: Presupuesto + Avance + Recursos ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-1.5 sm:gap-2 mb-2 flex-shrink-0">
        <div className={`${CARD} flex flex-col p-2 sm:p-3 hover:border-primary/30 hover:shadow-[0_0_15px_hsl(var(--primary)/0.1)] transition-all`}>
          <h3 className={`${CARD_TITLE} text-xs sm:text-sm mb-1 flex items-center gap-1`}>
            <Calculator className="w-3 h-3 sm:w-4 sm:h-4 text-primary" aria-hidden="true" />
            {t('dashboard.planif')} vs {t('dashboard.real')}
          </h3>
          <div className="flex items-center gap-3">
            <Donut size={110} data={[
              { label: t('dashboard.planif'), value: planVsReal.costoPlanificado, color: '#3b82f6' },
              { label: t('dashboard.real'), value: planVsReal.costoReal, color: '#f97316' },
            ]} />
            <div className="flex-1 text-[10px] space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">{t('dashboard.planif')}</span><b className="text-foreground">{fmtQ(planVsReal.costoPlanificado)}</b></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('dashboard.real')}</span><b className="text-foreground">{fmtQ(planVsReal.costoReal)}</b></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('dashboard.desv_prom')}</span><b className={Math.abs(planVsReal.avgDesv) > 15 ? 'text-destructive' : 'text-success'}>{fmtPct(planVsReal.avgDesv)}</b></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('dashboard.mayor')}</span><b className="text-foreground truncate max-w-[120px] inline-block align-bottom text-right">{planVsReal.top?.nombre || (planVsReal.conPlan > 0 ? '-' : t('dashboard.sin_datos'))}</b></div>
              {planVsReal.conPlan > 0 && (
                <div className="pt-1">
                  <div className="flex justify-between text-[9px] text-muted-foreground mb-0.5"><span>{t('dashboard.materiales_planificados')}</span><span>{planVsReal.conPlan}/{planVsReal.totalMateriales}</span></div>
                  <Progress value={(planVsReal.conPlan / Math.max(planVsReal.totalMateriales, 1)) * 100} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`${CARD} flex flex-col p-2 sm:p-3 hover:border-primary/30 hover:shadow-[0_0_15px_hsl(var(--primary)/0.1)] transition-all`}>
          <h3 className={`${CARD_TITLE} text-xs sm:text-sm mb-1 flex items-center gap-1`}>
            <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-primary" aria-hidden="true" />
            {t('dashboard.avance_general')}
          </h3>
          <div className="flex items-center gap-3">
            <div className="w-24 flex-shrink-0">
              <Gauge value={avanceProm} max={100} label={t('dashboard.avance_fisico')} color={
                avanceProm < 30 ? 'hsl(var(--destructive))' : avanceProm < 70 ? 'hsl(var(--warning))' : 'hsl(var(--success))'
              } />
            </div>
            <div className="flex-1 text-[10px] space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t('dashboard.avance_fisico')}</span>
                <b className={avanceColor}>{fmtPct(avanceProm)}</b>
              </div>
              <Progress value={avanceProm} color={avanceProm < 30 ? 'hsl(var(--destructive))' : avanceProm < 70 ? 'hsl(var(--warning))' : 'hsl(var(--success))'} />
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-muted-foreground">{t('dashboard.avance_financiero')}</span>
                <b className={avanceFinProm < 30 ? 'text-destructive' : avanceFinProm < 70 ? 'text-warning' : 'text-success'}>{fmtPct(avanceFinProm)}</b>
              </div>
              <Progress value={avanceFinProm} color={avanceFinProm < 30 ? 'hsl(var(--destructive))' : avanceFinProm < 70 ? 'hsl(var(--warning))' : 'hsl(var(--success))'} />
              <div className="flex justify-between text-[9px] text-muted-foreground pt-0.5">
                <span>{t('dashboard.registros_avance')}</span><span className="text-foreground font-medium">{avances.length}</span>
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>{t('dashboard.proy_ejecucion')}</span><span className="text-foreground font-medium">{activos.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`${CARD} flex flex-col p-2 sm:p-3 hover:border-primary/30 hover:shadow-[0_0_15px_hsl(var(--primary)/0.1)] transition-all`}>
          <h3 className={`${CARD_TITLE} text-xs sm:text-sm mb-1 flex items-center gap-1`}>
            <Package className="w-3 h-3 sm:w-4 sm:h-4 text-primary" aria-hidden="true" />
            {t('dashboard.recursos') || 'Recursos'}
          </h3>
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <Donut size={90} data={[
                { label: t('dashboard.stock_critico'), value: stockData.criticos, color: '#ef4444' },
                { label: 'OK', value: stockData.ok, color: '#10b981' },
              ]} />
              <span className="text-[9px] text-muted-foreground mt-0.5">
                {stockData.criticos > 0 ? `${stockData.criticos} críticos` : `${stockData.total} mats`}
              </span>
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-muted-foreground flex items-center gap-1"><Users className="w-2.5 h-2.5" /> RRHH</span>
                  <span className="text-foreground font-medium">{rhData.total}</span>
                </div>
                <div className="flex h-4 rounded-full overflow-hidden bg-muted">
                  <div className="bg-success transition-all" style={{ width: rhData.total > 0 ? `${(rhData.disponibles / rhData.total) * 100}%` : '50%' }} title={`Disp: ${rhData.disponibles}`} />
                  <div className="bg-warning transition-all" style={{ width: rhData.total > 0 ? `${(rhData.ocupados / rhData.total) * 100}%` : '50%' }} title={`Ocup: ${rhData.ocupados}`} />
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                  <span>{rhData.disponibles} disp.</span><span>{rhData.ocupados} ocup.</span>
                </div>
              </div>
              {stockData.items.length > 0 && (
                <div className="space-y-0.5">
                  <span className="text-[9px] text-destructive font-medium">{t('dashboard.stock_critico')}</span>
                  {stockData.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-[9px]">
                      <span className="truncate max-w-[100px] text-muted-foreground">{item.nombre}</span>
                      <span className="text-destructive font-medium">{item.stock}/{item.minimo}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── ROW 3: Gantt + Top Proyectos + Licitaciones + Riesgos ──── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-1.5 sm:gap-2 min-h-0">
        <div className={`${CARD} lg:col-span-2 flex flex-col p-2 sm:p-3 min-h-0 hover:border-primary/30 transition-all`}>
          <div className="flex-1 overflow-y-auto min-h-0">
            {ganttData.length > 0 ? (
              <GanttChart
                items={ganttData}
                onVerDetalle={() => setView('seguimiento' as View)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-1">
                <CalendarClock className="w-6 h-6 text-muted-foreground/40" />
                <p className="text-[10px] text-muted-foreground">{t('dashboard.sin_datos')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden flex flex-col gap-1.5 sm:gap-2">
          {/* Top 3 Proyectos */}
          <div className={`${CARD} p-2 sm:p-3 hover:border-primary/30 transition-all`}>
            <h3 className={`${CARD_TITLE} text-xs sm:text-sm mb-1 flex items-center gap-1`}>
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary" aria-hidden="true" />
              {t('dashboard.top_proyectos')}
            </h3>
            <div className="space-y-1.5">
              {topProyectos.map((p, i) => {
                const maxP = topProyectos[0]?.presupuesto || 1;
                const Icono = i === 0 ? TrendingUp : i === 1 ? Activity : TrendingDown;
                return (
                  <div key={p.id} className="group cursor-pointer" onClick={() => setSelectedProyectoId(p.id)}>
                    <div className="flex items-center justify-between text-[9px] mb-0.5">
                      <span className="flex items-center gap-1 truncate">
                        <Icono className={`w-2.5 h-2.5 ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-blue-500' : 'text-slate-500'}`} />
                        <span className="text-foreground font-medium truncate max-w-[90px]">{p.nombre}</span>
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <span className="font-medium text-foreground">{fmtQ(p.presupuesto)}</span>
                        <span className={`text-[8px] ${p.avance > 70 ? 'text-success' : p.avance > 30 ? 'text-warning' : 'text-destructive'}`}>{p.avance}%</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all group-hover:opacity-80 ${i === 0 ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : i === 1 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-slate-500 to-gray-500'}`} style={{ width: `${(p.presupuesto / maxP) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
              {topProyectos.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-3">{t('common.sin_proyectos')}</p>}
            </div>
          </div>

          {/* Licitaciones / CRM */}
          {licitacionesData.count > 0 && (
            <div className={`${CARD} p-2 sm:p-3 hover:border-primary/30 transition-all`}>
              <h3 className={`${CARD_TITLE} text-xs sm:text-sm mb-1 flex items-center gap-1`}>
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" aria-hidden="true" />
                {t('dashboard.licitaciones_pipeline')}
                <span className="text-[8px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{licitacionesData.count}</span>
              </h3>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex-1 text-[9px] space-y-0.5">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('dashboard.pendiente')}</span><b className="text-primary">{licitacionesData.abiertas}</b></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('dashboard.aprobada')}</span><b className="text-success">{licitacionesData.ganadas}</b></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('dashboard.monto_total')}</span><b className="text-foreground">{fmtQ(licitacionesData.totalMonto)}</b></div>
                </div>
              </div>
              {licitacionesData.top.length > 0 && (
                <div className="space-y-0.5 border-t border-border pt-1">
                  {licitacionesData.top.map((l: any, i: number) => (
                    <div key={l.id || i} className="flex justify-between text-[9px]">
                      <span className="truncate text-muted-foreground max-w-[100px]">{l.nombre || l.cliente || `Licitación ${i + 1}`}</span>
                      <span className="text-primary font-medium">{l.probabilidad || 0}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Riesgos activos */}
          {riesgosActivos.total > 0 && (
            <div className={`${CARD} p-2 sm:p-3 hover:border-primary/30 transition-all`}>
              <h3 className={`${CARD_TITLE} text-xs sm:text-sm mb-1 flex items-center gap-1`}>
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" aria-hidden="true" />
                {t('dashboard.riesgos_activos')}
                <span className="text-[8px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{riesgosActivos.total}</span>
              </h3>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 text-[9px] space-y-0.5">
                  <div className="flex justify-between"><span className="text-destructive">{t('dashboard.riesgo_alto')}</span><b className="text-destructive">{riesgosActivos.alto}</b></div>
                  <div className="flex justify-between"><span className="text-warning">{t('dashboard.riesgo_medio')}</span><b className="text-warning">{riesgosActivos.medio}</b></div>
                  <div className="flex justify-between"><span className="text-success">{t('dashboard.riesgo_bajo')}</span><b className="text-success">{riesgosActivos.bajo}</b></div>
                </div>
              </div>
            </div>
          )}

          {/* OC Pendientes */}
          <div className={`${CARD} flex flex-col p-2 sm:p-3 hover:border-primary/30 transition-all`}>
            <h3 className={`${CARD_TITLE} text-xs sm:text-sm mb-1 flex items-center gap-1`}>
              <ClipboardCheck className="w-3 h-3 sm:w-4 sm:h-4 text-warning" aria-hidden="true" />
              {t('dashboard.oc_pendientes')}
              {ocPendientes.length > 0 && <span className="text-[8px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{ocPendientes.length}</span>}
            </h3>
            {ocPendientes.length > 0 ? (
              <div className="space-y-1">
                {ocPendientes.map(oc => (
                  <div key={oc.id} className="flex justify-between text-[9px] p-1 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-foreground">{oc.proveedor}</div>
                      <div className="truncate text-muted-foreground">{oc.material} x{oc.cantidad}</div>
                    </div>
                    <span className="text-warning font-medium flex-shrink-0">{fmtQ(oc.monto)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-[10px] text-muted-foreground text-center py-3">{t('common.no_data')}</p>}
          </div>
        </div>
      </div>

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-1.5 sm:gap-2 mt-2 flex-shrink-0">
        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-3 gap-1.5 sm:gap-2">
          <div className="lg:col-span-2">
            <h3 className="font-bold text-foreground text-xs mb-1">{t('dashboard.registro_rapido')}</h3>
            <MovimientoForm compact />
          </div>
          <div><AlertasPanel /></div>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {movPorCategoria.length > 0 && (
            <div>
              <h3 className="font-bold text-foreground text-xs mb-1 flex items-center gap-1">
                {t('dashboard.gastos')} <span className="text-muted-foreground font-normal text-[9px]">vs {t('dashboard.ingresos')}</span>
              </h3>
              <div className="h-10"><BarChart data={movPorCategoria} height={40} /></div>
              <div className="flex items-center justify-between text-[9px] bg-muted/30 rounded-lg px-2 py-1 mt-1">
                <span className="text-emerald-500 font-medium">{t('dashboard.ingresos')} {fmtQ(ingresos)}</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-red-500 font-medium">{t('dashboard.gastos')} {fmtQ(gastos)}</span>
                <span className="text-muted-foreground">|</span>
                <span className={`font-medium ${saldoNeto >= 0 ? 'text-success' : 'text-destructive'}`}>{saldoNeto >= 0 ? '+' : ''}{fmtQ(saldoNeto)}</span>
              </div>
            </div>
          )}
          {cuentasProximas.length > 0 && (
            <div>
              <h3 className="font-bold text-foreground text-xs mb-1 flex items-center gap-1">
                <Wallet className="w-2.5 h-2.5" /> {t('dashboard.proximos_pagos')}
                <span className="text-muted-foreground font-normal text-[9px]">{cuentasProximas.length}</span>
              </h3>
              <div className="space-y-0.5">
                {cuentasProximas.map(c => (
                  <div key={c.id} className="flex justify-between text-[9px] p-1 rounded bg-muted/30">
                    <span className="truncate text-muted-foreground max-w-[80px]">{c.proveedor || 'Proveedor'}</span>
                    <span className="text-destructive font-medium">{fmtQ(c.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {cobrarProximas.length > 0 && (
            <div>
              <h3 className="font-bold text-foreground text-xs mb-1 flex items-center gap-1">
                <DollarSign className="w-2.5 h-2.5 text-success" /> {t('dashboard.cuentas_cobrar')}
                <span className="text-muted-foreground font-normal text-[9px]">{cobrarProximas.length}</span>
              </h3>
              <div className="space-y-0.5">
                {cobrarProximas.map(c => (
                  <div key={c.id} className="flex justify-between text-[9px] p-1 rounded bg-success/5">
                    <span className="truncate text-muted-foreground max-w-[80px]">{c.cliente || c.descripcion || 'Cliente'}</span>
                    <span className="text-success font-medium">{fmtQ(c.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {ocCambioPendientes.length > 0 && (
            <div>
              <h3 className="font-bold text-foreground text-xs mb-1 flex items-center gap-1">
                <Repeat className="w-2.5 h-2.5 text-orange-500" /> {t('dashboard.ordenes_cambio')}
                <span className="text-muted-foreground font-normal text-[9px]">{ocCambioPendientes.length}</span>
              </h3>
              <div className="space-y-0.5">
                {ocCambioPendientes.map((oc: any) => (
                  <div key={oc.id} className="flex justify-between text-[9px] p-1 rounded bg-orange-500/5">
                    <span className="truncate text-muted-foreground max-w-[80px]">{oc.descripcion || oc.numero || 'OC'}</span>
                    <span className="text-orange-500 font-medium">{fmtQ(oc.montoAdicional || oc.monto || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <CompactCalendar />
          <div>
            <h3 className="font-bold text-foreground text-xs mb-1">{t('dashboard.modulos')}</h3>
            <nav aria-label="Acceso rápido a módulos" className="grid grid-cols-4 gap-1">
              {modulos.map(m => {
                const Icon = m.icon;
                return (
                  <button key={m.id} onClick={() => setView(m.id as View)}
                    aria-label={`Ir a ${m.label}`}
                    className={`bg-gradient-to-br ${m.c} text-white rounded-lg sm:rounded-xl p-1.5 sm:p-2 flex flex-col items-start gap-1 hover:scale-[1.02] active:scale-[0.97] transition-all shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70`}>
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                    <span className="text-[8px] sm:text-[10px] font-semibold leading-tight">{m.label.length > 8 ? m.label.slice(0, 8) : m.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;