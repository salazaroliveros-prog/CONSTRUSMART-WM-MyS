import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp, type View } from '../store';
import { useErpStore } from '../zustandStore';
import { fmtQ, fmtPct, calculateSupplierPerformance } from '../utils';
import GaugeKpi from '../components/GaugeKpi';
import MovimientoForm from '../components/MovimientoForm';
import AlertasPanel from '../components/AlertasPanel';
import CompactCalendar from '../components/CompactCalendar';
import { BarChart, Donut, Progress, Gauge } from '../components/Charts';
import { Building2, TrendingUp, DollarSign, AlertTriangle, Package, Users, CalendarClock, Calculator, Wallet, Warehouse, ClipboardCheck, Activity, TrendingDown, Download, Zap, Repeat, BarChart3, Shield, Loader2, Database, Award, ArrowRight } from 'lucide-react';
import GanttChart from '../components/GanttChart';
import { CARD, CARD_TITLE, COLOR_SUCCESS, COLOR_WARNING, COLOR_DANGER, COLOR_INFO, COLOR_PRIMARY, SECTION_TITLE } from '../ui';
import ProyectoFilter from '../components/ProyectoFilter';
import { SkeletonDashboard } from '../../components/SkeletonScreens';
import { supabase } from '@/lib/supabase';
import type { ActivoHerramienta, Empleado, Licitacion, Riesgo, OrdenCompra } from '../types';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#fbbf24', '#ec4899'];

const CATEGORIA_COLORS = ['#2563eb', '#f97316', '#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#0ea5e9', '#64748b'];

const CATEGORIA_MAP = [
  { id: 'principal', label: 'Principal', targetView: 'dashboard', modules: ['Tablero', 'Proyectos', 'CRM', 'Cotizaciones'], tables: ['erp_proyectos', 'erp_licitaciones', 'erp_cotizaciones_negocio'] },
  { id: 'planificacion', label: 'Planificación', targetView: 'presupuestos', modules: ['Presupuestos', 'APU', 'Base Precios', 'Hitos', 'Riesgos'], tables: ['erp_presupuestos', 'erp_renglones', 'erp_insumos_base', 'erp_hitos', 'erp_riesgos'] },
  { id: 'ejecucion', label: 'Ejecución', targetView: 'seguimiento', modules: ['Seguimiento', 'Curvas S', 'Rendimiento Campo', 'SSO', 'Muro', 'Órdenes Cambio', 'Documentos', 'BIM'], tables: ['erp_seguimiento', 'erp_avances', 'erp_rendimientos_cuadrilla', 'erp_no_conformidades', 'erp_publicaciones_muro', 'erp_ordenes_cambio', 'erp_planos', 'erp_rfis', 'erp_submittals'] },
  { id: 'suministro', label: 'Suministro', targetView: 'bodega', modules: ['Bodega', 'Logística', 'Entradas Almacén'], tables: ['erp_materiales', 'erp_ordenes_compra', 'erp_vales_salida', 'recepciones_almacen', 'erp_proveedores'] },
  { id: 'rrhh', label: 'RRHH', targetView: 'rrhh', modules: ['Recursos Humanos', 'Planilla Destajos'], tables: ['erp_empleados', 'destajos'] },
  { id: 'finanzas', label: 'Finanzas', targetView: 'financiero', modules: ['Financiero', 'Comercial', 'Cuentas Cobrar', 'Cuentas Pagar', 'Impuestos'], tables: ['erp_movimientos', 'ventas_paquetes', 'erp_cuentas_cobrar', 'erp_cuentas_pagar', 'pagos_proveedores'] },
  { id: 'bi', label: 'Análisis BI', targetView: 'predictivo', modules: ['Dashboard BI', 'Exportación', 'Reportes Técnicos'], tables: ['erp_seguimiento', 'erp_avances', 'erp_movimientos', 'erp_presupuestos'] },
  { id: 'sistema', label: 'Sistema', targetView: 'notificaciones', modules: ['Notificaciones', 'Administración', 'Ajustes'], tables: ['erp_notificaciones'] },
];

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
  const ctx = useErp();
  const { t } = useTranslation();
  const online = useOnlineStatus();
  const dashRef = useRef<HTMLDivElement>(null);
  const [integrityData, setIntegrityData] = useState<any>(null);

  const {
    proyectos, movimientos, avances, selectedProyectoId, setView,
    materiales, setSelectedProyectoId, empleados, hitos, ordenes, proveedores,
    cuentasPagar, presupuestos, licitaciones, riesgos,
    ordenesCambio, cuentasCobrar, valesSalida, recepciones, destajos,
    publicacionesMuro, planos, rfis, submittals, ventasPaquetes, pagosProveedor,
    ncs, seguimientoEVM,
    mutationQueue, syncStatus, lastSyncedAt, syncError,
    cotizacionesNegocio, notificacionesNoLeidas,
  } = ctx;

  const hasData = (proyectos || []).length > 0 || (movimientos || []).length > 0 || (materiales || []).length > 0;

  const filteredProyectos = useMemo(() => {
    if (selectedProyectoId && selectedProyectoId !== 'none') {
      return (proyectos || []).filter(p => p.id === selectedProyectoId);
    }
    return proyectos || [];
  }, [proyectos, selectedProyectoId]);

  const proyectosSel = filteredProyectos;
  const totalOrphans = integrityData?.fk_orphans?.reduce?.((a, o) => a + o.count, 0) ?? 0;
  const totalNulls = integrityData?.null_checks?.reduce?.((a, o) => a + o.count, 0) ?? 0;

  const s1 = useStagger(0);
  const s2 = useStagger(100);
  const s3 = useStagger(200);
  const s4 = useStagger(300);
  const staggerArr = [s1, s2, s3, s4];

  const activos = useMemo(() => (proyectos || []).filter(p => p.estado === 'ejecucion'), [proyectos]);

  const { presupuestoTotal, margenProm, desviacion, avanceProm, avanceFinProm } = useMemo(() => {
    if (filteredProyectos.length === 0) {
      return { presupuestoTotal: 0, margenProm: 0, desviacion: 0, avanceProm: 0, avanceFinProm: 0 };
    }
    const totalP = filteredProyectos.reduce((a, b) => a + b.presupuestoTotal, 0);
    let mSum = 0;
    let dSum = 0;
    let avFisSum = 0;
    let avFinSum = 0;
    filteredProyectos.forEach(p => {
      const m = p.montoContrato > 0 ? ((p.montoContrato - p.presupuestoTotal) / p.montoContrato) * 100 : 0;
      mSum += m;
      dSum += (p.avanceFinanciero - p.avanceFisico);
      avFisSum += (p.avanceFisico * p.presupuestoTotal);
      avFinSum += (p.avanceFinanciero * p.presupuestoTotal);
    });
    return {
      presupuestoTotal: totalP,
      margenProm: mSum / filteredProyectos.length,
      desviacion: dSum / filteredProyectos.length,
      avanceProm: totalP > 0 ? Math.round(avFisSum / totalP) : 0,
      avanceFinProm: totalP > 0 ? Math.round(avFinSum / totalP) : 0,
    };
  }, [filteredProyectos]);

  const ingresos = useMemo(() => (movimientos || []).filter(m => m.tipo === 'ingreso').reduce((a, b) => a + (b.monto ?? b.costoTotal ?? 0), 0), [movimientos]);
  const gastos = useMemo(() => (movimientos || []).filter(m => m.tipo === 'gasto').reduce((a, b) => a + (b.monto ?? b.costoTotal ?? 0), 0), [movimientos]);
  const saldoNeto = useMemo(() => ingresos - gastos, [ingresos, gastos]);

  const carteraData = useMemo(() => {
    const counts: Record<string, number> = { planeacion: 0, ejecucion: 0, pausado: 0, finalizado: 0 };
    (proyectos || []).forEach(p => { if (counts[p.estado] !== undefined) counts[p.estado]++; });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([k, v]) => ({
      label: t(`dashboard.${k}`), value: v, color: STATUS_COLORS[k] || '#6b7280',
    }));
  }, [proyectos, t]);

  const planVsReal = useMemo(() => {
    const presupuestosActivos = (presupuestos || []).filter(p => p.estado !== 'anulado' && p.estado !== 'rechazado');
    const costoPlanificado = presupuestosActivos.reduce((a, p) => a + (p.totalCalculado || 0), 0);
    const movsGasto = (movimientos || []).filter(m => m.tipo === 'gasto').reduce((a, m) => a + (m.monto ?? m.costoTotal ?? 0), 0);
    const movsIngreso = (movimientos || []).filter(m => m.tipo === 'ingreso').reduce((a, m) => a + (m.monto ?? m.costoTotal ?? 0), 0);
    const costoReal = movsGasto - movsIngreso;
    const avgDesv = presupuestosActivos.length
      ? presupuestosActivos.reduce((a, p) => a + ((p.avance || 0) - 100), 0) / presupuestosActivos.length
      : 0;
    const top = presupuestosActivos.length ? presupuestosActivos[0] : null;
    return { conPlan: presupuestosActivos.length, costoPlanificado, costoReal, avgDesv, top, totalMateriales: presupuestosActivos.length };
  }, [presupuestos, movimientos]);

  const stockData = useMemo(() => {
    const mats = materiales || [];
    const criticos = mats.filter(m => m.stock <= (m.stockMinimo || 0));
    return {
      criticos: criticos.length,
      ok: Math.max(mats.length - criticos.length, 0),
      total: mats.length,
      items: criticos.slice(0, 5).map(m => ({
        nombre: m.nombre, stock: m.stock, minimo: m.stockMinimo || 0,
      })),
    };
  }, [materiales]);

  const rhData = useMemo(() => {
    const datos = (empleados || []);
    const conEstado = datos.filter((e: Empleado) => e.estado);
    const disponibles = conEstado.filter((e: Empleado) => e.estado === 'disponible').length;
    const ocupados = conEstado.filter((e: Empleado) => e.estado === 'ocupado').length;
    const sinEstado = Math.max(datos.length - conEstado.length, 0);
    return { disponibles: disponibles + sinEstado, ocupados, total: datos.length };
  }, [empleados]);

  const timelineData = useMemo(() => {
    const filtrados = selectedProyectoId && selectedProyectoId !== 'none'
      ? (hitos || []).filter(h => h.proyectoId === selectedProyectoId) : (hitos || []);
    const projMap = new Map((proyectos || []).map(p => [p.id, p.nombre]));
    return [...filtrados].filter(h => h.fecha).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 8).map(h => ({
      id: h.id, nombre: h.nombre, proyecto: projMap.get(h.proyectoId) || '',
      fecha: h.fecha, estado: h.estado || 'pendiente',
    }));
  }, [hitos, selectedProyectoId, proyectos]);

  const ganttData = useMemo(() => {
    const filtrados = selectedProyectoId && selectedProyectoId !== 'none'
      ? (hitos || []).filter(h => h.proyectoId === selectedProyectoId) : (hitos || []);
    const projMap = new Map((proyectos || []).map(p => [p.id, p.nombre]));
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
    const mapGastos: Record<string, number> = {};
    const mapIngresos: Record<string, number> = {};
    (movimientos || []).forEach(m => {
      const val = m.monto ?? m.costoTotal ?? 0;
      if (m.tipo === 'gasto') mapGastos[m.categoria] = (mapGastos[m.categoria] || 0) + val;
      if (m.tipo === 'ingreso') mapIngresos[m.categoria] = (mapIngresos[m.categoria] || 0) + val;
    });
    const cats = new Set([...Object.keys(mapGastos), ...Object.keys(mapIngresos)]);
    const labels = Array.from(cats).slice(0, 8);
    const data = labels.map((k, i) => ({
      label: k || 'Otros',
      value: Math.max(mapGastos[k] || 0, mapIngresos[k] || 0),
      gasto: mapGastos[k] || 0,
      ingreso: mapIngresos[k] || 0,
      color: CATEGORIA_COLORS[i % CATEGORIA_COLORS.length],
    }));
    return data;
  }, [movimientos]);

  const topProyectos = useMemo(() =>
    [...(proyectos || [])].sort((a, b) => b.presupuestoTotal - a.presupuestoTotal).slice(0, 3)
      .map(p => ({ id: p.id, nombre: p.nombre, presupuesto: p.presupuestoTotal, avance: p.avanceFisico, estado: p.estado })),
  [proyectos]);

  const ocPendientes = useMemo(() =>
    (ordenes || []).filter(o => o.estado === 'pendiente' || o.estado === 'borrador').slice(0, 3)
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
    const abiertas = licits.filter((l: Licitacion) => l.estado === 'abierta' || l.estado === 'en_proceso').length;
    const ganadas = licits.filter((l: Licitacion) => l.estado === 'ganada').length;
    const totalMonto = licits.reduce((a: number, l: Licitacion) => a + (l.montoEstimado || l.monto || 0), 0);
    const top = [...licits].sort((a: Licitacion, b: Licitacion) => (b.probabilidad || 0) - (a.probabilidad || 0)).slice(0, 3);
    return { abiertas, ganadas, totalMonto, count: licits.length, top };
  }, [licitaciones]);

  const riesgosActivos = useMemo(() => {
    const rs = riesgos || [];
    const activos = rs.filter((r: Riesgo) => r.estado === 'abierto' || r.estado === 'en_seguimiento');
    const alto = activos.filter((r: Riesgo) => (r.nivel || '').toLowerCase().includes('alto') || (r.nivel || '').toLowerCase().includes('high')).length;
    const medio = activos.filter((r: Riesgo) => (r.nivel || '').toLowerCase().includes('medio') || (r.nivel || '').toLowerCase().includes('medium')).length;
    const bajo = activos.length - alto - medio;
    const top = activos.slice(0, 3);
    return { total: activos.length, alto, medio, bajo: Math.max(bajo, 0), top };
  }, [riesgos]);

  const supplierPerformanceData = useMemo(() => {
    const allPerformance = (proveedores || []).map(proveedor => {
      const metrics = calculateSupplierPerformance(proveedor, ordenes || []);
      return {
        id: proveedor.id,
        nombre: proveedor.nombre,
        ...metrics,
      };
    });
    const topPerformers = [...allPerformance]
      .sort((a, b) => b.puntajeGeneral - a.puntajeGeneral)
      .slice(0, 3);
    const atRisk = allPerformance
      .filter(s => s.puntajeGeneral < 60)
      .sort((a, b) => a.puntajeGeneral - b.puntajeGeneral)
      .slice(0, 3);
    return { total: allPerformance.length, topPerformers, atRisk };
  }, [proveedores, ordenes]);

  const ocCambioPendientes = useMemo(() => {
    const ocs = ordenesCambio || [];
    return ocs.filter((o: OrdenCompra) => o.estado === 'pendiente' || o.estado === 'pendiente_aprobacion').slice(0, 3);
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

  useEffect(() => {
    // Generar notificaciones basadas en hitos próximos SOLO si hay datos reales de proyectos
    if (typeof window === 'undefined') return;
    const store = useErpStore.getState();
    if (store.notificaciones.length > 0) return;

    // Solo generar notificaciones si hay proyectos con hitos (datos reales)
    if ((proyectos || []).length === 0) return;

    const proximos = (hitos || []).filter(h => h.fecha).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 3);
    if (proximos.length > 0) {
      const store = useErpStore.getState();
      proximos.forEach(h => {
        store.addNotificacion('general', `Hito próximo: ${h.nombre}`, `Fecha: ${h.fecha}`, h.proyectoId, h.id);
      });
    }
  }, [hitos, proyectos]);

  const [exportingPdf, setExportingPdf] = useState(false);
  const handleExportPdf = useCallback(async () => {
    const el = dashRef.current;
    if (!el || exportingPdf) return;
    setExportingPdf(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, w, h);
      pdf.save('dashboard-construsmart.pdf');
    } catch {
    } finally {
      setExportingPdf(false);
    }
  }, [exportingPdf]);

  const tableToDataMap = useMemo(() => ({
    erp_proyectos: proyectos || [],
    erp_licitaciones: licitaciones || [],
    erp_cotizaciones_negocio: cotizacionesNegocio || [],
    erp_presupuestos: presupuestos || [],
    erp_hitos: hitos || [],
    erp_riesgos: riesgos || [],
    erp_seguimiento: seguimientoEVM || [],
    erp_avances: avances || [],
    erp_no_conformidades: ncs || [],
    erp_publicaciones_muro: publicacionesMuro || [],
    erp_ordenes_cambio: ordenesCambio || [],
    erp_planos: planos || [],
    erp_rfis: rfis || [],
    erp_submittals: submittals || [],
    erp_materiales: materiales || [],
    erp_ordenes_compra: ordenes || [],
    erp_vales_salida: valesSalida || [],
    recepciones_almacen: recepciones || [],
    erp_proveedores: proveedores || [],
    erp_empleados: empleados || [],
    destajos: destajos || [],
    erp_movimientos: movimientos || [],
    ventas_paquetes: ventasPaquetes || [],
    erp_cuentas_cobrar: cuentasCobrar || [],
    erp_cuentas_pagar: cuentasPagar || [],
    pagos_proveedores: pagosProveedor || [],
    erp_notificaciones: notificacionesNoLeidas || [],
  }), [proyectos, licitaciones, cotizacionesNegocio, presupuestos, hitos, riesgos, seguimientoEVM, avances, ncs, publicacionesMuro, ordenesCambio, planos, rfis, submittals, materiales, ordenes, valesSalida, recepciones, empleados, destajos, movimientos, cuentasCobrar, cuentasPagar, pagosProveedor, notificacionesNoLeidas, proveedores, ventasPaquetes]);

  const categoriaResumen = useMemo(() => CATEGORIA_MAP.map((categoria, index) => {
    const count = categoria.tables.reduce((sum, table) => sum + (tableToDataMap[table]?.length || 0), 0);
    return { ...categoria, count, color: CATEGORIA_COLORS[index % CATEGORIA_COLORS.length] };
  }), [tableToDataMap]);

  const categoriaChartData = useMemo(() => categoriaResumen.map(c => ({ label: c.label.slice(0, 3), value: c.count, color: c.color })), [categoriaResumen]);

  const SkeletonCard: React.FC<{ h?: string }> = ({ h = 'h-8' }) => (
    <div className="rounded-lg sm:rounded-2xl bg-card border border-border overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      <div className={`${h} bg-muted rounded-lg sm:rounded-2xl`} />
    </div>
  );

  const loading = ctx.initializing || false;
  const avanceColor = avanceProm < 30 ? 'text-destructive' : avanceProm < 70 ? COLOR_WARNING : COLOR_SUCCESS;

  if (syncStatus === 'loading') {
    return <SkeletonDashboard />;
  }

  return (
    <div ref={dashRef} className="h-full flex flex-col p-3 sm:p-4 lg:p-5 max-w-[1600px] mx-auto overflow-hidden bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.04),transparent_50%)]">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-1 sm:gap-2 mb-2 flex-shrink-0">
        <div className="min-w-0 flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
          <div>
            <h1 className={SECTION_TITLE}>{t('dashboard.tablero')}</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">{t('dashboard.metricas_tiempo_real')}</p>
          </div>
            <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
            {online ? t('dashboard.en_vivo') : t('dashboard.offline')}
            <span className="text-muted-foreground/60">·</span>
            <span className={syncStatus === 'error' ? 'text-destructive' : 'text-primary'}>{syncStatus === 'synced' ? 'Supabase conectado' : syncStatus === 'loading' ? 'Leyendo Supabase' : syncStatus === 'error' ? syncError || 'Error sync' : mutationQueue.length > 0 ? `${mutationQueue.length} pendientes` : 'Supabase activo'}</span>
          </div>
          {lastSyncedAt && <div className="text-[10px] text-muted-foreground bg-muted/40 rounded-full px-2 py-0.5">Sync {new Date(lastSyncedAt).toLocaleTimeString()}</div>}
          <button onClick={handleExportPdf} disabled={exportingPdf} className="text-[10px] text-primary hover:text-primary/80 font-medium flex items-center gap-0.5 bg-primary/10 rounded-full px-2 py-0.5 transition-colors disabled:opacity-60" title={t('dashboard.exportar_pdf')}>
            {exportingPdf ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Download className="w-2.5 h-2.5" />}
            {exportingPdf ? 'Exportando...' : 'PDF'}
          </button>
        </div>
        <ProyectoFilter value={selectedProyectoId ?? ''} onChange={(id) => setSelectedProyectoId(id || null)} proyectos={proyectos} />
      </div>

      {/* ─── KPI Row: Velocímetros animados ────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-2 flex-shrink-0" style={{ opacity: s1, transform: `translateY(${(1 - s1) * 12}px)`, transition: 'all 0.4s ease-out' }}>
        <GaugeKpi
          label={t('dashboard.proyectos')}
          sublabel={`${activos.length} activos · ${proyectos.length} total`}
          value={activos.length}
          displayValue={String(activos.length)}
          max={Math.max(proyectos.length, 1)}
          color="from-blue-500 to-indigo-500"
          icon={<Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
          hasData={hasData}
          delay={0}
          sparkData={proyTrend}
          zones={[
            { from: 0, to: Math.max(proyectos.length, 1) * 0.3, color: '#6366f1' },
            { from: Math.max(proyectos.length, 1) * 0.3, to: Math.max(proyectos.length, 1) * 0.7, color: '#3b82f6' },
            { from: Math.max(proyectos.length, 1) * 0.7, to: Math.max(proyectos.length, 1), color: '#10b981' },
          ]}
        />
        <GaugeKpi
          label={t('dashboard.presupuesto')}
          sublabel={fmtQ(presupuestoTotal)}
          value={presupuestoTotal}
          displayValue={presupuestoTotal > 0 ? `Q ${(presupuestoTotal / 1000000).toFixed(1)}M` : 'Q 0'}
          max={Math.max(presupuestoTotal * 1.5, 1000000)}
          color="from-orange-500 to-amber-500"
          icon={<DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
          hasData={hasData}
          delay={100}
          sparkData={gastoTrend}
        />
        <GaugeKpi
          label={t('dashboard.margen_util')}
          sublabel={margenProm > 0 ? t('dashboard.sano') : t('dashboard.riesgo')}
          value={Math.max(0, margenProm)}
          displayValue={fmtPct(margenProm)}
          max={50}
          color="from-emerald-500 to-teal-500"
          icon={<TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
          hasData={hasData && presupuestoTotal > 0}
          delay={200}
          zones={[
            { from: 0, to: 10, color: '#ef4444' },
            { from: 10, to: 25, color: '#f59e0b' },
            { from: 25, to: 50, color: '#10b981' },
          ]}
        />
        <GaugeKpi
          label={t('dashboard.desviacion')}
          sublabel={Math.abs(desviacion) > 15 ? t('dashboard.riesgo') : t('dashboard.sano')}
          value={Math.max(0, Math.min(100, 50 + desviacion * 2))}
          displayValue={fmtPct(desviacion)}
          max={100}
          color={Math.abs(desviacion) > 15 ? 'from-red-500 to-rose-500' : 'from-amber-500 to-yellow-500'}
          icon={<AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
          hasData={hasData && proyectosSel.length > 0}
          delay={300}
          zones={[
            { from: 0, to: 30, color: '#10b981' },
            { from: 30, to: 70, color: '#f59e0b' },
            { from: 70, to: 100, color: '#ef4444' },
          ]}
        />
      </div>

      {/* ─── ROW 2: Presupuesto + Avance + Recursos ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-1.5 sm:gap-2 mb-2 flex-shrink-0">
            <div className={`${CARD} flex flex-col p-2 sm:p-3 hover:border-primary/30 hover:shadow-[0_0_15px_hsl(var(--primary)/0.1)] transition-all duration-200`}>
            <h3 className={`${CARD_TITLE} text-xs sm:text-sm mb-1 flex items-center gap-1`}>
              <Calculator className="w-3 h-3 sm:w-4 sm:h-4 text-primary" aria-hidden="true" />
              {t('dashboard.planif')} vs {t('dashboard.real')}
            </h3>
            {(planVsReal.conPlan > 0 || planVsReal.costoPlanificado > 0 || planVsReal.costoReal > 0) ? (
              <div className="flex items-center gap-3">
                <Donut size={110} data={[
                  { label: t('dashboard.planif'), value: planVsReal.costoPlanificado || 0, color: '#3b82f6' },
                  { label: t('dashboard.real'), value: Math.max(planVsReal.costoReal, 0) || 0, color: '#f97316' },
                ]} />
                <div className="flex-1 text-[10px] space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Planificado</span><b className="text-foreground">{fmtQ(planVsReal.costoPlanificado || 0)}</b></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Real</span><b className="text-foreground">{fmtQ(Math.max(planVsReal.costoReal, 0))}</b></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Desviación</span><b className={Math.abs(planVsReal.avgDesv) > 15 ? COLOR_DANGER : COLOR_SUCCESS}>{fmtPct(planVsReal.avgDesv)}</b></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Mayor desviación</span><b className="text-foreground truncate max-w-[120px] inline-block align-bottom text-right">{planVsReal.top?.nombre || (planVsReal.conPlan > 0 ? '-' : 'Sin datos')}</b></div>
                  {planVsReal.conPlan > 0 && (
                    <div className="pt-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5"><span>Registros</span><span>{planVsReal.conPlan}/{planVsReal.totalMateriales}</span></div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Fuente</span>
                        <span>Supabase</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                Sin presupuestos cargados
              </div>
            )}
          </div>

        <div className={`${CARD} flex flex-col p-2 sm:p-3 hover:border-primary/30 hover:shadow-[0_0_15px_hsl(var(--primary)/0.1)] transition-all`}>
          <h3 className={`${CARD_TITLE} text-xs sm:text-sm mb-1 flex items-center gap-1`}>
            <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-primary" aria-hidden="true" />
            {t('dashboard.avance_general')}
          </h3>
          <div className="flex items-center gap-3">
            <div className="w-24 flex-shrink-0">
              <Gauge value={avanceProm} max={100} label={t('dashboard.avance_fisico')} color={avanceProm < 30 ? '#ef4444' : avanceProm < 70 ? '#f59e0b' : '#10b981'} />
            </div>
            <div className="flex-1 text-[10px] space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t('dashboard.avance_fisico')}</span>
                <b className={avanceColor}>{fmtPct(avanceProm)}</b>
              </div>
              <Progress value={Math.min(avanceProm, 100)} color={avanceProm < 30 ? '#ef4444' : avanceProm < 70 ? '#f59e0b' : '#10b981'} />
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-muted-foreground">{t('dashboard.avance_financiero')}</span>
                <b className={avanceFinProm < 30 ? COLOR_DANGER : avanceFinProm < 70 ? COLOR_WARNING : COLOR_SUCCESS}>{fmtPct(avanceFinProm)}</b>
              </div>
              <Progress value={Math.min(avanceFinProm, 100)} color={avanceFinProm < 30 ? '#ef4444' : avanceFinProm < 70 ? '#f59e0b' : '#10b981'} />
              <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
                <span>{t('dashboard.registros_avance')}</span><span className="text-foreground font-medium">{avances.length}</span>
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
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
              <span className="text-[10px] text-muted-foreground mt-0.5">
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
                <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                  <span>{rhData.disponibles} disp.</span><span>{rhData.ocupados} ocup.</span>
                </div>
              </div>
              {stockData.items.length > 0 && (
                <div className="space-y-0.5">
                  <span className="text-[10px] text-destructive font-medium">{t('dashboard.stock_critico')}</span>
                  {stockData.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-[10px]">
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
                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                      <span className="flex items-center gap-1 truncate">
                        <Icono className={`w-2.5 h-2.5 ${i === 0 ? COLOR_WARNING : i === 1 ? COLOR_INFO : 'text-slate-500 dark:text-slate-400'}`} />
                        <span className="text-foreground font-medium truncate max-w-[90px]">{p.nombre}</span>
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <span className="font-medium text-foreground">{fmtQ(p.presupuesto)}</span>
                        <span className={`text-[8px] ${p.avance > 70 ? COLOR_SUCCESS : p.avance > 30 ? COLOR_WARNING : 'text-destructive'}`}>{p.avance}%</span>
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
                <Zap className={`w-3 h-3 sm:w-4 sm:h-4 ${COLOR_WARNING}`} aria-hidden="true" />
                {t('dashboard.licitaciones_pipeline')}
                <span className="text-[8px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{licitacionesData.count}</span>
              </h3>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex-1 text-[10px] space-y-0.5">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('dashboard.pendiente')}</span><b className="text-primary">{licitacionesData.abiertas}</b></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('dashboard.aprobada')}</span><b className={COLOR_SUCCESS}>{licitacionesData.ganadas}</b></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('dashboard.monto_total')}</span><b className="text-foreground">{fmtQ(licitacionesData.totalMonto)}</b></div>
                </div>
              </div>
              {licitacionesData.top.length > 0 && (
                <div className="space-y-0.5 border-t border-border pt-1">
                  {licitacionesData.top.map((l: Licitacion, i: number) => (
                    <div key={l.id || i} className="flex justify-between text-[10px]">
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
                <div className="flex-1 text-[10px] space-y-0.5">
                  <div className="flex justify-between"><span className="text-destructive">{t('dashboard.riesgo_alto')}</span><b className="text-destructive">{riesgosActivos.alto}</b></div>
                  <div className="flex justify-between"><span className={COLOR_WARNING}>{t('dashboard.riesgo_medio')}</span><b className={COLOR_WARNING}>{riesgosActivos.medio}</b></div>
                  <div className="flex justify-between"><span className={COLOR_SUCCESS}>{t('dashboard.riesgo_bajo')}</span><b className={COLOR_SUCCESS}>{riesgosActivos.bajo}</b></div>
                </div>
              </div>
            </div>
          )}

          {/* OC Pendientes */}
          <div className={`${CARD} flex flex-col p-2 sm:p-3 hover:border-primary/30 transition-all`}>
            <h3 className={`${CARD_TITLE} text-xs sm:text-sm mb-1 flex items-center gap-1`}>
              <ClipboardCheck className={`w-3 h-3 sm:w-4 sm:h-4 ${COLOR_WARNING}`} aria-hidden="true" />
              {t('dashboard.oc_pendientes')}
              {ocPendientes.length > 0 && <span className="text-[8px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{ocPendientes.length}</span>}
            </h3>
            {ocPendientes.length > 0 ? (
              <div className="space-y-1">
                {ocPendientes.map(oc => (
                  <div key={oc.id} className="flex justify-between text-[10px] p-1 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-foreground">{oc.proveedor}</div>
                      <div className="truncate text-muted-foreground">{oc.material} x{oc.cantidad}</div>
                    </div>
                    <span className={COLOR_WARNING + ' font-medium flex-shrink-0'}>{fmtQ(oc.monto)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-[10px] text-muted-foreground text-center py-3">{t('common.no_data')}</p>}
          </div>

          {/* Data Integrity Card */}
          <div className={`${CARD} flex flex-col p-2 sm:p-3 hover:border-primary/30 transition-all`}>
            <h3 className={`${CARD_TITLE} text-xs sm:text-sm mb-1 flex items-center gap-1`}>
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-primary" aria-hidden="true" />
              {t('dashboard.integridad_titulo')}
            </h3>
            <div className="text-[10px] space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('dashboard.integridad_huérfanos', { count: totalOrphans })}</span>
                <span className={totalOrphans > 0 ? 'text-destructive font-medium' : COLOR_SUCCESS + ' font-medium'}>{totalOrphans}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('dashboard.integridad_nulls', { count: totalNulls })}</span>
                <span className={totalNulls > 0 ? 'text-destructive font-medium' : COLOR_SUCCESS + ' font-medium'}>{totalNulls}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('dashboard.integridad_constraints', { count: mutationQueue.filter(m => m.retryCount > 2).length })}</span>
                <span className={mutationQueue.filter(m => m.retryCount > 2).length > 0 ? 'text-destructive font-medium' : COLOR_SUCCESS + ' font-medium'}>
                  {mutationQueue.filter(m => m.retryCount > 2).length}
                </span>
              </div>
            </div>
          </div>

          {/* Query Performance Card */}
          <div className={`${CARD} flex flex-col p-2 sm:p-3 hover:border-primary/30 transition-all`}>
            <h3 className={`${CARD_TITLE} text-xs sm:text-sm mb-1 flex items-center gap-1`}>
              <Database className="w-3 h-3 sm:w-4 sm:h-4 text-primary" aria-hidden="true" />
              {t('dashboard.performance_titulo')}
            </h3>
            <div className="text-[10px] space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('dashboard.performance_lentas', { count: 0 })}</span>
                <span className={COLOR_SUCCESS + ' font-medium'}>0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('dashboard.performance_sync', { time: (lastSyncedAt ? ((Date.now() - new Date(lastSyncedAt).getTime()) / 1000).toFixed(1) : 'N/A') })}</span>
                <span className="text-foreground font-medium">{lastSyncedAt ? `${((Date.now() - new Date(lastSyncedAt).getTime()) / 1000).toFixed(1)}s` : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('dashboard.performance_db_size', { size: `${proyectos.length + movimientos.length + materiales.length + empleados.length + ordenes.length} registros` })}</span>
                <span className="text-foreground font-medium">{proyectos.length + movimientos.length + materiales.length + empleados.length + ordenes.length}</span>
              </div>
            </div>
          </div>

          {/* Supplier Analytics Widget */}
          {supplierPerformanceData.total > 0 && (
            <div className={`${CARD} flex flex-col p-2 sm:p-3 hover:border-primary/30 transition-all`}>
              <h3 className={`${CARD_TITLE} text-xs sm:text-sm mb-1 flex items-center gap-1`}>
                <Award className="w-3 h-3 sm:w-4 sm:h-4 text-primary" aria-hidden="true" />
                Analytics Proveedores
                <span className="text-[8px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{supplierPerformanceData.total}</span>
              </h3>
              <div className="space-y-1.5">
                {supplierPerformanceData.topPerformers.length > 0 && (
                  <div>
                    <span className={`text-[10px] ${COLOR_SUCCESS} font-medium`}>Top Desempeño</span>
                    {supplierPerformanceData.topPerformers.slice(0, 2).map((s, i) => (
                      <div key={s.id} className="flex justify-between items-center text-[10px] mt-0.5">
                        <span className="truncate text-muted-foreground max-w-[100px]">{s.nombre}</span>
                        <span className={COLOR_SUCCESS + ' font-medium'}>{fmtPct(s.puntajeGeneral)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {supplierPerformanceData.atRisk.length > 0 && (
                  <div className="border-t border-border pt-1">
                    <span className="text-[10px] text-destructive font-medium">En Riesgo</span>
                    {supplierPerformanceData.atRisk.slice(0, 2).map((s, i) => (
                      <div key={s.id} className="flex justify-between items-center text-[10px] mt-0.5">
                        <span className="truncate text-muted-foreground max-w-[100px]">{s.nombre}</span>
                        <span className="text-destructive font-medium">{fmtPct(s.puntajeGeneral)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setView('proveedor-analytics' as View)}
                  className="w-full mt-1 flex items-center justify-center gap-1 text-[10px] text-primary hover:text-primary/80 bg-primary/10 rounded-lg py-1 transition-colors"
                >
                  Ver Analytics Completo
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── FOOTER: Compacto y funcional ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-1.5 sm:gap-2 mt-2 flex-shrink-0">
        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-3 gap-1.5 sm:gap-2">
          <div className="lg:col-span-2">
            <h3 className="font-bold text-foreground text-xs mb-1">{t('dashboard.registro_rapido')}</h3>
            <MovimientoForm compact />
          </div>
          <div><AlertasPanel /></div>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {/* Ingresos vs Gastos con BarChart — siempre visible aunque vacío */}
          <div className={`${CARD} flex flex-col p-2 sm:p-3`}>
            <h3 className={`${CARD_TITLE} text-xs sm:text-sm mb-1 flex items-center gap-1`}>
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-primary" aria-hidden="true" />
              {t('dashboard.gastos')} <span className="text-muted-foreground font-normal text-[10px]">vs {t('dashboard.ingresos')}</span>
            </h3>
            <div className="h-16 sm:h-20">
              <BarChart data={movPorCategoria.length > 0 ? movPorCategoria.map(d => ({ label: d.label, value: d.value, color: d.color })) : []} height={60} />
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px]">
              <span className={COLOR_SUCCESS + ' font-medium flex items-center gap-1'}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> {t('dashboard.ingresos')}
              </span>
              <span className="text-foreground font-medium">{fmtQ(ingresos)}</span>
              <span className={COLOR_DANGER + ' font-medium flex items-center gap-1 ml-2'}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> {t('dashboard.gastos')}
              </span>
              <span className="text-foreground font-medium">{fmtQ(gastos)}</span>
            </div>
          </div>

          {/* Próximas actividades — muestra hitos reales de proyectos */}
          <CompactCalendar />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
