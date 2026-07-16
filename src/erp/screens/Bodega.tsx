import React, { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { confirmAction } from '@/lib/confirm-action';
import { useErp } from '../store';
import { useMateriales, useProveedores } from '../hooks/useRefDataQueries';
import { fmtQ, fmtPct, todayISO } from '../utils';
import { useTranslation } from 'react-i18next';
import { exportStockPDF } from '../export';
import { Progress, BarChart } from '../components/Charts';
import ChartToolbar from '../components/ChartToolbar';
import { useChartConfig } from '../hooks/useChartConfig';
import { Warehouse, Check, X, AlertTriangle, Star, Plus, Trash2, Edit2, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { INPUT_COMPACT, COLOR_WARNING, COLOR_DANGER, COLOR_INFO, CARD, KPI_CARD, BUTTON_PRIMARY, BUTTON_SECONDARY, MODAL_OVERLAY, MODAL_PANEL } from '../ui';
import { List as VirtualizedList } from 'react-window';
import { proveedorFormSchema, ordenFormSchema } from '../store/schemas/bodega';

type ProveedorFormData = z.infer<typeof proveedorFormSchema>;
type OrdenFormData = z.infer<typeof ordenFormSchema>;
type ProveedorOption = { id: string; nombre: string };

const Bodega: React.FC = () => {
  const paretoConfig = useChartConfig('line', 'default');
  const { t } = useTranslation();
  const ctx = useErp();
  const { updateMaterial, ordenes, updateOrden, addOrden, addProveedor, updateProveedor, deleteProveedor, proyectos } = ctx;
  const rawMateriales = useMateriales();
  const proveedores = useProveedores();
  const materiales = useMemo(() => {
    const seen = new Set<string>();
    return rawMateriales.filter(m => {
      const key = m.nombre.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [rawMateriales]);
  const handleExportStockPDF = () => exportStockPDF(materiales, proyectos.find(p => p.id === ctx.currentProjectId)?.nombre);
  const [showProveedor, setShowProveedor] = useState(false);
  const [showOrden, setShowOrden] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setLoading(false); }, []);

  const criticos = useMemo(() => materiales.filter(m => m.stock < m.stockMinimo), [materiales]);
  const pendientes = useMemo(() => ordenes.filter(o => o.estado === 'pendiente'), [ordenes]);
  const conPlan = useMemo(() => materiales.filter(m => typeof m.cantidadPresupuestada === 'number' && m.cantidadPresupuestada > 0), [materiales]);

  const coverage = useMemo(() => {
    if (conPlan.length === 0) return 0;
    return conPlan.reduce((a, m) => a + (m.cantidadPresupuestada ?? 0), 0);
  }, [conPlan]);

  const avgDesv = useMemo(() => {
    if (conPlan.length === 0) return 0;
    const total = conPlan.reduce((a, m) => a + ((m.stock - (m.cantidadPresupuestada ?? 0)) / Math.max(m.cantidadPresupuestada ?? 1, 1)) * 100, 0);
    return total / conPlan.length;
  }, [conPlan]);

  const maxDesvMat = useMemo(() => {
    if (conPlan.length === 0) return null;
    return [...conPlan].sort((a, b) => {
      const desvA = Math.abs((a.stock - (a.cantidadPresupuestada ?? 0)) / Math.max(a.cantidadPresupuestada ?? 1, 1) * 100);
      const desvB = Math.abs((b.stock - (b.cantidadPresupuestada ?? 0)) / Math.max(b.cantidadPresupuestada ?? 1, 1) * 100);
      return desvB - desvA;
    })[0];
  }, [conPlan]);

  const {
    register: registerProv,
    handleSubmit: handleSubmitProv,
    reset: resetProv,
    setValue,
    formState: { errors: errorsProv },
  } = useForm<ProveedorFormData>({
    resolver: zodResolver(proveedorFormSchema),
    defaultValues: { nombre: '', contacto: '', rubro: '', calificacion: 3 },
  });

  const {
    register: registerOrd,
    handleSubmit: handleSubmitOrd,
    reset: resetOrd,
    watch: watchOrd,
    formState: { errors: errorsOrd },
  } = useForm<OrdenFormData>({
    resolver: zodResolver(ordenFormSchema),
    defaultValues: { proveedor: '', proyectoId: '', proveedorId: '', material: '', categoria: 'materiales', cantidad: 1, monto: 0 },
  });

  const onAddProveedor = (data: ProveedorFormData) => {
    if (editingProveedor) {
      updateProveedor(editingProveedor, data);
      setEditingProveedor(null);
    } else {
      addProveedor(data);
    }
    resetProv();
    setShowProveedor(false);
  };

  const onAddOrden = (data: OrdenFormData) => {
    const mat = materiales.find(m => m.nombre.toLowerCase() === (data.material || '').toLowerCase());
    const items = mat ? [{ materialId: mat.id, cantidad: data.cantidad || 0, precioUnitario: (data.monto || 0) / (data.cantidad || 1) }] : undefined;
    addOrden({ ...data, estado: 'borrador', fecha: todayISO(), items });
    resetOrd();
    setShowOrden(false);
  };

  const editProveedor = (p: { id: string; nombre: string; contacto: string; rubro: string; calificacion: number }) => {
    setEditingProveedor(p.id);
    setValue('nombre', p.nombre);
    setValue('contacto', p.contacto);
    setValue('rubro', p.rubro);
    setValue('calificacion', p.calificacion);
    setShowProveedor(true);
  };

  const pareto = useMemo(() => {
    const sorted = [...materiales].map(m => ({ label: m.nombre.split(' ')[0], value: m.stock * m.precio, color: 'hsl(var(--warning))' })).sort((a, b) => b.value - a.value).slice(0, 8);
    return sorted;
  }, [materiales]);

const ITEM_HEIGHT = 52;
const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
  const m = materiales[index];
  const planificado = m.cantidadPresupuestada ?? 0;
  const desv = planificado > 0 ? ((m.stock - planificado) / Math.max(planificado, 1)) * 100 : 0;
  const claseDesv = Math.abs(desv) > 15 ? `${COLOR_DANGER} dark:text-red-400` : Math.abs(desv) > 5 ? `${COLOR_WARNING} dark:text-amber-400` : 'text-emerald-600 dark:text-emerald-400';
  return (
    <div style={style} className="flex items-center border-b border-border hover:bg-muted/50">
      <div className="w-full px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="truncate max-w-[180px]">{m.nombre}</span>
            {m.critico && <span className={`text-[10px] bg-red-100 dark:bg-red-900/40 ${COLOR_DANGER} dark:text-red-400 px-1.5 py-0.5 rounded-full`}>{t('bodega.critico')}</span>}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="w-16 text-right"><input type="number" inputMode="decimal" value={m.stock} onChange={e => updateMaterial(m.id, { stock: +e.target.value })} className="w-16 px-1.5 py-1 rounded border border-input bg-background text-foreground text-right focus:outline-none focus:ring-2 focus:ring-ring" /></span>
            <span className="w-20 text-right">{m.stockMinimo} <span className="text-muted-foreground">{m.unidad}</span></span>
            <span className={`w-28 text-right ${planificado === 0 ? 'text-muted-foreground italic' : ''}`}>{planificado === 0 ? t('bodega.no_planificado') : `${planificado} ${m.unidad}`}</span>
            <span className={`w-16 text-right ${claseDesv}`}>{planificado === 0 ? t('bodega.no_planificado') : `${fmtPct(desv)}`}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const inp = INPUT_COMPACT;

if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-5 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-2">
          <h1 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2 mb-0">
          <Warehouse className={`w-5 h-5 sm:w-6 sm:h-6 ${COLOR_INFO}`} aria-hidden="true" /> <span className="hidden sm:inline">{t('bodega.title_full')}</span><span className="sm:hidden">{t('bodega.titulo')}</span>
        </h1>
        <div className="flex gap-2">
          <button onClick={() => setShowOrden(true)}
            className={`${BUTTON_PRIMARY} flex-1 sm:flex-none justify-center`}>
            <Plus className="w-4 h-4" aria-hidden="true" /> <span className="hidden sm:inline">{t('common.nuevo')}</span> {t('bodega.oc_abreviatura')}
          </button>
          <button onClick={() => { setShowProveedor(true); setEditingProveedor(null); }}
            className={`${BUTTON_SECONDARY} flex-1 sm:flex-none justify-center`}>
            <Plus className="w-4 h-4" aria-hidden="true" /> {t('bodega.proveedor')}
          </button>
          <button onClick={handleExportStockPDF} disabled={!ctx || materiales.length === 0} className={`${BUTTON_SECONDARY} flex-1 sm:flex-none justify-center`}>
            <TrendingUp className="w-4 h-4" aria-hidden="true" /> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 mb-2">
        <div className={KPI_CARD}>
              <div className="text-xl sm:text-2xl font-black text-foreground">{materiales.length}</div>
          <div className="text-xs text-muted-foreground">{t('bodega.materiales')}</div>
        </div>
        <div className="bg-red-50 dark:bg-red-950/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-red-100 dark:border-red-900/50">
              <div className={`text-xl sm:text-2xl font-black ${COLOR_DANGER} flex items-center gap-1`}>
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />{criticos.length}
          </div>
          <div className={`text-xs ${COLOR_DANGER} dark:text-red-400`}>{t('bodega.stock_bajo_minimo')}</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-amber-100 dark:border-amber-900/50">
          <div className={`text-xl sm:text-2xl font-bold ${COLOR_WARNING} dark:text-amber-400`}>{pendientes.length}</div>
          <div className={`text-xs ${COLOR_WARNING} dark:text-amber-400`}>{t('bodega.oc_por_aprobar')}</div>
        </div>
        <div className={KPI_CARD}>
          <div className="text-lg sm:text-2xl font-bold text-foreground truncate">{fmtQ(materiales.reduce((a, m) => a + m.stock * m.precio, 0))}</div>
          <div className="text-xs text-muted-foreground">{t('bodega.valor_inventario')}</div>
        </div>
        <div className="bg-violet-50 dark:bg-violet-950/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-violet-100 dark:border-violet-900/50">
          <div className="text-xl sm:text-2xl font-bold text-violet-700 dark:text-violet-300">{conPlan.length}</div>
          <div className="text-xs text-violet-600 dark:text-violet-400">{t('bodega.items_con_presupuesto')}</div>
        </div>
        <div className="bg-sky-50 dark:bg-sky-950/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-sky-100 dark:border-sky-900/50">
          <div className="text-xl sm:text-2xl font-bold text-sky-700 dark:text-sky-300 truncate">{fmtQ(coverage)}</div>
          <div className="text-xs text-sky-600 dark:text-sky-400">{t('bodega.presupuestado_bodega')}</div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-emerald-100 dark:border-emerald-900/50">
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300">{fmtPct(avgDesv)}</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400">{t('bodega.desviacion_promedio')}</div>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-rose-100 dark:border-rose-900/50">
          <div className="text-xl sm:text-2xl font-bold text-rose-700 dark:text-rose-300 truncate">{maxDesvMat?.nombre?.split(' ')[0] ?? '—'}</div>
          <div className="text-xs text-rose-600 dark:text-rose-400">{t('bodega.mayor_desviacion')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3">
        <div className={`lg:col-span-2 ${CARD} overflow-hidden`}>
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm">{t('bodega.control_stock')}</h3>
            <div className="flex items-center gap-2">
              <button onClick={handleExportStockPDF} disabled={!ctx || materiales.length === 0} className={`${BUTTON_PRIMARY} text-xs min-h-[var(--touch-target)]`}>PDF</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {materiales.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground"><Warehouse className="w-8 h-8 mx-auto mb-2 opacity-40" aria-hidden="true" />{t('bodega.sin_materiales')}</div>
            ) : (
              <VirtualizedList
                height={Math.min(480, Math.max(200, materiales.length * ITEM_HEIGHT))}
                itemCount={materiales.length}
                itemSize={ITEM_HEIGHT}
                width="100%"
                aria-label={t('bodega.control_stock_aria')}
              >
                {Row}
              </VirtualizedList>
            )}
          </div>
          <div className="p-3">
            <Progress value={Math.min(100, Math.max(0, 100 - Math.abs(avgDesv)))} color={avgDesv > 15 ? 'hsl(var(--destructive))' : 'hsl(var(--success))'} />
            <p className="text-[10px] text-muted-foreground mt-1">{t('bodega.cobertura_presupuestaria', { desv: fmtPct(avgDesv) })}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className={CARD}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-foreground text-sm">{t('bodega.pareto_inventario')}</h3>
              <ChartToolbar
                types={['bar']}
                currentType={paretoConfig.type}
                onTypeChange={paretoConfig.setType}
                palette={paretoConfig.palette}
                onPaletteChange={paretoConfig.setPalette}
                onReset={paretoConfig.reset}
              />
            </div>
            <BarChart height={160} data={pareto} palette={paretoConfig.palette} />
          </div>

          <div className={`${CARD} overflow-hidden`}>
            <div className="p-3 border-b border-border">
              <h3 className="font-bold text-foreground text-sm">{t('bodega.ordenes_por_aprobar')}</h3>
            </div>
            <div className="divide-y divide-border max-h-56 overflow-y-auto">
              {ordenes.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground"><AlertTriangle className="w-6 h-6 mx-auto mb-1 opacity-40" aria-hidden="true" />{t('bodega.sin_ordenes')}</div>
              ) : ordenes.map(o => (
                <div key={o.id} className="p-3 text-xs">
                  <div className="flex justify-between">
                    <b className="text-foreground">{o.material}</b>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      o.estado === 'aprobado'
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                        : o.estado === 'recibida'
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        : o.estado === 'rechazado'
                        ? `bg-red-100 dark:bg-red-900/40 ${COLOR_DANGER} dark:text-red-400`
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                    }`}>{o.estado}</span>
                  </div>
                  <div className="text-muted-foreground mt-0.5">{o.proveedor} · {o.cantidad} u · {fmtQ(o.monto)}</div>
                  {o.estado === 'pendiente' && (
                    <div className="flex gap-1 mt-1.5">
                       <button onClick={async () => { 
                         try { 
                           await confirmAction({ title: t('bodega.aprobar_orden'), content: t('bodega.aprobar_orden_confirm'), centered: true, okText: t('bodega.si_aprobar'), cancelText: t('common.cancelar') }); 
                           updateOrden(o.id, { estado: 'aprobado' }); 
                         } catch (error) {
                           // Usuario canceló la acción
                           console.log('Acción cancelada por usuario');
                         } 
                       }}
                         aria-label={t('bodega.aprobar_orden_aria', { material: o.material })}
                         className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-1 rounded flex items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
                        <Check className="w-3 h-3" aria-hidden="true" /> {t('bodega.aprobar')}
                      </button>
                      <button onClick={() => updateOrden(o.id, { estado: 'rechazado' })}
                        aria-label={t('bodega.rechazar_orden_aria', { material: o.material })}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1 rounded flex items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
                        <X className="w-3 h-3" aria-hidden="true" /> {t('bodega.rechazar')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`${CARD} mt-3`}>
        <h3 className="font-bold text-foreground text-sm mb-3">{t('bodega.proveedores')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {proveedores.length === 0 ? (
            <div className="col-span-full text-center py-6 text-sm text-muted-foreground"><Star className="w-6 h-6 mx-auto mb-1 opacity-40" aria-hidden="true" />{t('bodega.sin_proveedores')}</div>
          ) : proveedores.map(p => (
            <div key={p.id} className="bg-muted rounded-xl p-3 flex items-center justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-foreground truncate" title={p.nombre}>{p.nombre}</div>
                <div className="text-xs text-muted-foreground truncate" title={`${p.rubro} · ${p.contacto}`}>{p.rubro} · {p.contacto}</div>
              </div>
              <div className="flex items-center gap-1">
                <span aria-label={t('bodega.calificacion_aria', { calificacion: p.calificacion })} className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < p.calificacion ? 'text-amber-400 fill-amber-400' : 'text-border'}`} aria-hidden="true" />
                  ))}
                </span>
                <button onClick={() => editProveedor(p)}
                  aria-label={t('bodega.editar_proveedor_aria', { nombre: p.nombre })}
                  className="ml-1 p-1 rounded text-muted-foreground hover:text-primary hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Edit2 className="w-3 h-3" aria-hidden="true" />
                </button>
                <button onClick={() => deleteProveedor(p.id)}
                  aria-label={t('bodega.eliminar_proveedor_aria', { nombre: p.nombre })}
                  className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:text-red-400 dark:hover:text-red-300">
                  <Trash2 className="w-3 h-3" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showProveedor && (
        <div className={MODAL_OVERLAY} role="dialog" aria-modal="true" aria-labelledby="modal-proveedor-title">
          <form onClick={e => e.stopPropagation()} onSubmit={handleSubmitProv(onAddProveedor)}
            className={MODAL_PANEL}>
            <div className="flex items-center justify-between mb-3">
              <h2 id="modal-proveedor-title" className="font-bold text-lg text-foreground">{editingProveedor ? t('bodega.editar_proveedor') : t('bodega.nuevo_proveedor')}</h2>
              <button type="button" onClick={() => setShowProveedor(false)} aria-label={t('bodega.cerrar_dialogo')}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-3">
              <input {...registerProv('nombre')} placeholder={t('common.nombre')} className={`${inp} ${errorsProv.nombre ? 'border-red-400' : ''}`} />
              {errorsProv.nombre && <p className={`text-xs ${COLOR_DANGER} dark:text-red-400`}>{errorsProv.nombre.message}</p>}
              <input {...registerProv('contacto')} placeholder={t('bodega.contacto')} className={`${inp} ${errorsProv.contacto ? 'border-red-400' : ''}`} />
              {errorsProv.contacto && <p className={`text-xs ${COLOR_DANGER} dark:text-red-400`}>{errorsProv.contacto.message}</p>}
              <input {...registerProv('rubro')} placeholder={t('bodega.rubro')} className={`${inp} ${errorsProv.rubro ? 'border-red-400' : ''}`} />
              {errorsProv.rubro && <p className={`text-xs ${COLOR_DANGER} dark:text-red-400`}>{errorsProv.rubro.message}</p>}
              <select {...registerProv('calificacion', { valueAsNumber: true })} className={inp}>
                {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{t('bodega.estrellas', { n })}</option>)}
              </select>
            </div>
            <button type="submit" className="mt-4 w-full bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground py-2.5 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {editingProveedor ? t('bodega.actualizar_proveedor') : t('bodega.crear_proveedor')}
            </button>
          </form>
        </div>
      )}

      {showOrden && (
        <div className={MODAL_OVERLAY} role="dialog" aria-modal="true" aria-labelledby="modal-orden-title">
          <form onClick={e => e.stopPropagation()} onSubmit={handleSubmitOrd(onAddOrden)}
            className={MODAL_PANEL}>
            <div className="flex items-center justify-between mb-3">
              <h2 id="modal-orden-title" className="font-bold text-lg text-foreground">{t('bodega.nueva_orden_compra')}</h2>
              <button type="button" onClick={() => setShowOrden(false)} aria-label={t('bodega.cerrar_dialogo')}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-3">
              <select {...registerOrd('proveedor')} className={`${inp} ${errorsOrd.proveedor ? 'border-red-400' : ''}`}>
                <option value="">{t('bodega.seleccionar_proveedor')}</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.nombre}>
                    {p.nombre}
                  </option>
                ))}
              </select>
              <input type="hidden" {...registerOrd('proveedorId')} value={watchOrd('proveedor') || ''} />
              <select {...registerOrd('proyectoId')} className={`${inp} ${errorsOrd.proyectoId ? 'border-red-400' : ''}`}>
                <option value="">{t('bodega.seleccionar_proyecto')}</option>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
              <input {...registerOrd('material')} placeholder={t('bodega.material')} className={`${inp} ${errorsOrd.material ? 'border-red-400' : ''}`} />
              <input type="number" inputMode="decimal" {...registerOrd('cantidad')} placeholder={t('common.cantidad')} className={`${inp} ${errorsOrd.cantidad ? 'border-red-400' : ''}`} />
              <input type="number" inputMode="decimal" {...registerOrd('monto')} placeholder={t('bodega.monto_q')} className={`${inp} ${errorsOrd.monto ? 'border-red-400' : ''}`} />
            </div>
            <button type="submit" className="mt-4 w-full bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground py-2.5 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{t('bodega.crear_orden')}</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Bodega;