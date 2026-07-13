import { Skeleton } from '@/components/ui/skeleton';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import type { CentroCosto, LogAuditoria } from '../types';
import ProyectoFilter from '../components/ProyectoFilter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Building2, History, Activity } from 'lucide-react';
import { centroCostoFormSchema } from '../store/schemas/admin';
import { usePerformanceMetrics } from '../hooks/usePerformanceMetrics';

type CentroCostoForm = z.infer<typeof centroCostoFormSchema>;

const Administracion: React.FC = () => {
  const { proyectos } = useErp();
  const safeProyectos = Array.isArray(proyectos) ? proyectos : [];
  const { t } = useTranslation();
  const [tab, setTab] = useState<'centros' | 'logs' | 'validacion' | 'rendimiento'>('centros');
  const { metrics, loading: metricsLoading, error: metricsError, fetch: fetchMetrics } = usePerformanceMetrics();
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([]);
  const [auditLog, setAuditLog] = useState<LogAuditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filtroProyecto, setFiltroProyecto] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const uid = () => Date.now().toString(36).substr(2, 9);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CentroCostoForm>({
    resolver: zodResolver(centroCostoFormSchema),
    defaultValues: { proyectoId: '', codigo: '', nombre: '', presupuestoAsignado: 0, tipo: 'directo' },
  });

  const onAddCentroCosto = (data: CentroCostoForm) => {
    setCentrosCosto(prev => [{ id: uid(), proyectoId: data.proyectoId, codigo: data.codigo, nombre: data.nombre, presupuestoAsignado: data.presupuestoAsignado, gastoActual: 0, tipo: data.tipo }, ...prev]);
    toast.success(t('admin.centro_creado'));
    setShowForm(false);
    reset();
  };

  const INPUT_BASE = 'w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-ring bg-background text-foreground';
  const inp = (hasErr: boolean) => `${INPUT_BASE} ${hasErr ? 'border-destructive' : 'border-input'}`;

  const renderCentros = () => {
    const centrosFiltered = filtroProyecto ? centrosCosto.filter(c => c.proyectoId === filtroProyecto) : centrosCosto;
    const totalPresupuesto = centrosFiltered.reduce((a, c) => a + c.presupuestoAsignado, 0);
    const totalGasto = centrosFiltered.reduce((a, c) => a + c.gastoActual, 0);
    const pctEjecucion = totalPresupuesto > 0 ? (totalGasto / totalPresupuesto) * 100 : 0;

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-foreground">{t('admin.centros')}</h2>
          <div className="flex items-center gap-2">
            <ProyectoFilter value={filtroProyecto} onChange={setFiltroProyecto} proyectos={safeProyectos} />
            <button onClick={() => { setShowForm(true); reset(); }} aria-label={t('admin.nuevo_centro')}
              className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs hover:bg-primary/90 font-medium">
              {t('admin.nuevo_centro')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="p-3 bg-info/10 rounded-lg text-center">
            <p className="text-xs text-info font-medium">{t('admin.centros')}</p>
            <p className="text-xl font-bold text-info">{centrosFiltered.length}</p>
          </div>
          <div className="p-3 bg-success/10 rounded-lg text-center">
            <p className="text-xs text-success font-medium">{t('admin.presupuesto')}</p>
            <p className="text-xl font-bold text-success">Q{totalPresupuesto.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg text-center">
            <p className="text-xs text-primary font-medium">{t('admin.gasto')}</p>
            <p className="text-xl font-bold text-primary">Q{totalGasto.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <p className="text-xs text-muted-foreground font-medium">{t('admin.ejecucion')}</p>
            <p className="text-xl font-bold text-foreground">{pctEjecucion.toFixed(1)}%</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-left p-2" scope="col">{t('admin.codigo')}</th>
                <th className="text-left p-2" scope="col">{t('admin.nombre')}</th>
                <th className="text-left p-2" scope="col">{t('admin.proyecto')}</th>
                <th className="text-right p-2" scope="col">{t('admin.presupuesto')}</th>
                <th className="text-right p-2" scope="col">{t('admin.gasto')}</th>
                <th className="text-right p-2" scope="col">{t('admin.saldo')}</th>
                <th className="text-right p-2" scope="col">{t('admin.ejec_pct')}</th>
              </tr>
            </thead>
            <tbody>
              {centrosFiltered.map(cc => {
                const saldo = cc.presupuestoAsignado - cc.gastoActual;
                const pct = cc.presupuestoAsignado > 0 ? (cc.gastoActual / cc.presupuestoAsignado) * 100 : 0;
                return (
                  <tr key={cc.id} className="border-t hover:bg-muted/50">
                    <td className="p-2 font-mono text-xs">{cc.codigo}</td>
                    <td className="p-2">{cc.nombre}</td>
                    <td className="p-2 text-xs text-muted-foreground">{safeProyectos.find(p => p.id === cc.proyectoId)?.nombre || cc.proyectoId}</td>
                    <td className="p-2 text-right font-mono">Q{cc.presupuestoAsignado.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono">Q{cc.gastoActual.toLocaleString()}</td>
                    <td className={`p-2 text-right font-semibold font-mono ${saldo < 0 ? 'text-destructive' : 'text-success'}`}>
                      Q{saldo.toLocaleString()}
                    </td>
                    <td className="p-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${pct > 90 ? 'bg-destructive/10 text-destructive' : pct > 70 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                        {pct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {centrosFiltered.length === 0 && <div className="text-center py-10 text-muted-foreground"><Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" aria-hidden="true" /><p className="text-sm">{t('admin.sin_centros')}</p></div>}
      </div>
    );
  };

  const renderLogs = () => (
    <div>
      <h2 className="text-lg font-bold mb-4 text-foreground">{t('admin.logs')}</h2>
      {auditLog.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <History className="w-10 h-10 mx-auto mb-2 opacity-30" aria-hidden="true" />
          <p className="text-sm">{t('admin.sin_logs')}</p>
          <p className="text-xs mt-1">{t('admin.logs_auto')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted sticky top-0">
                <th className="text-left p-2" scope="col">{t('admin.fecha')}</th>
                <th className="text-left p-2" scope="col">{t('admin.usuario')}</th>
                <th className="text-left p-2" scope="col">{t('admin.accion')}</th>
                <th className="text-left p-2" scope="col">{t('admin.entidad')}</th>
                <th className="text-left p-2" scope="col">{t('admin.detalle')}</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map(l => (
                <tr key={l.id} className="border-t hover:bg-muted/50">
                  <td className="p-2 whitespace-nowrap text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="p-2">{l.usuarioNombre}</td>
                  <td className="p-2">{l.accion}</td>
                  <td className="p-2 text-muted-foreground max-w-xs truncate">{l.entidad}</td>
                  <td className="p-2 text-muted-foreground max-w-xs truncate">
                    {l.valoresNuevos ? Object.entries(l.valoresNuevos).map(([k, v]) => `${k}:${v}`).join(', ') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderValidacion = () => (
    <div>
      <h2 className="text-lg font-bold mb-4 text-foreground">{t('admin.validacion')}</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {t('admin.validacion_desc')}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-success/10 rounded-lg border border-success/30">
          <p className="text-sm font-semibold text-success">{t('admin.validacion_cc')}</p>
          <p className="text-xs text-muted-foreground mt-1">{centrosCosto.length} {t('admin.centros')}, {centrosCosto.filter(c => c.gastoActual > c.presupuestoAsignado).length} {t('admin.con_sobrecosto')}</p>
        </div>
        <div className="p-4 bg-info/10 rounded-lg border border-info/30">
          <p className="text-sm font-semibold text-info">{t('admin.validacion_proy')}</p>
           <p className="text-xs text-muted-foreground mt-1">{safeProyectos.length} {t('admin.proyectos')}, {safeProyectos.filter(p => p.estado === 'ejecucion').length} {t('admin.en_ejecucion')}</p>
        </div>
      </div>
      <button onClick={() => {
        toast.info(t('admin.validacion_ok'));
      }} aria-label={t('admin.ejecutar_validacion')} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90 font-medium">
        {t('admin.ejecutar_validacion')}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }
  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-black text-foreground mb-4">{t('admin.titulo')}</h1>

      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-lg overflow-x-auto">
        {[
          { key: 'centros' as const,    label: t('admin.tab_centros') },
          { key: 'logs' as const,       label: t('admin.tab_logs') },
          { key: 'validacion' as const, label: t('admin.tab_validacion') },
          { key: 'rendimiento' as const, label: 'Rendimiento DB' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} aria-label={t.label}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
            }`}>{t.label}</button>
        ))}
      </div>

      {tab === 'centros'    && renderCentros()}
      {tab === 'logs'       && renderLogs()}
      {tab === 'validacion' && renderValidacion()}
      {tab === 'rendimiento' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><Activity className="w-4 h-4" /> Métricas de Rendimiento DB</h3>
            <button onClick={fetchMetrics} disabled={metricsLoading}
              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
              {metricsLoading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>
          {metricsError && <p className="text-sm text-red-500">{metricsError}</p>}
          {metrics && (
            <>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Consultas más lentas</h4>
                {metrics.slow_queries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin datos (pg_stat_statements puede no estar habilitado)</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted">
                        <th className="p-2 text-left">Query</th>
                        <th className="p-2 text-right">Llamadas</th>
                        <th className="p-2 text-right">Media (ms)</th>
                        <th className="p-2 text-right">Total (s)</th>
                      </tr></thead>
                      <tbody>{metrics.slow_queries.map((q, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2 font-mono max-w-xs truncate">{q.query_preview}</td>
                          <td className="p-2 text-right">{q.calls}</td>
                          <td className="p-2 text-right">{q.mean_ms}</td>
                          <td className="p-2 text-right">{q.total_sec}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Tamaño de tablas</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {metrics.table_sizes.map(tbl => (
                    <div key={tbl.table_name} className="bg-muted rounded-lg p-3">
                      <p className="text-xs font-mono truncate">{tbl.table_name}</p>
                      <p className="text-sm font-bold">{tbl.total_size}</p>
                      <p className="text-xs text-muted-foreground">{tbl.live_rows.toLocaleString()} filas</p>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Actualizado: {new Date(metrics.checked_at).toLocaleString()}</p>
            </>
          )}
          {!metrics && !metricsLoading && (
            <p className="text-sm text-muted-foreground">Haz clic en &quot;Actualizar&quot; para cargar las m&eacute;tricas.</p>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={t('admin.nuevo_centro')}>
          <form onSubmit={handleSubmit(onAddCentroCosto)} onClick={e => e.stopPropagation()} className="bg-card rounded-lg p-6 w-full max-w-md shadow-sm">
            <h3 className="font-bold mb-4 text-foreground">{t('admin.nuevo_centro')}</h3>
            <div className="grid gap-3">
              <div>
                <select {...register('proyectoId')} className={inp(!!errors.proyectoId)}>
                  <option value="">{t('admin.seleccionar_proyecto')}</option>
                  {safeProyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                {errors.proyectoId && <p className="text-xs text-destructive mt-1">{errors.proyectoId.message}</p>}
              </div>
              <div>
                <input {...register('codigo')} placeholder={t('admin.codigo_placeholder')} className={inp(!!errors.codigo)} />
                {errors.codigo && <p className="text-xs text-destructive mt-1">{errors.codigo.message}</p>}
              </div>
              <div>
                <input {...register('nombre')} placeholder={t('admin.nombre_placeholder')} className={inp(!!errors.nombre)} />
                {errors.nombre && <p className="text-xs text-destructive mt-1">{errors.nombre.message}</p>}
              </div>
              <div>
                <input {...register('presupuestoAsignado')} type="number" inputMode="decimal" placeholder={t('admin.presupuesto_placeholder')} className={inp(!!errors.presupuestoAsignado)} />
                {errors.presupuestoAsignado && <p className="text-xs text-destructive mt-1">{errors.presupuestoAsignado.message}</p>}
              </div>
              <div>
                <select {...register('tipo')} className={inp(false)}>
                  <option value="directo">{t('admin.tipo_directo')}</option>
                  <option value="indirecto">{t('admin.tipo_indirecto')}</option>
                  <option value="administrativo">{t('admin.tipo_admin')}</option>
                </select>
              </div>
              <button type="submit" className="bg-primary text-primary-foreground py-2 rounded-lg text-sm hover:bg-primary/90 font-medium">{t('admin.guardar')}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-input rounded-lg text-xs text-muted-foreground hover:bg-muted">{t('admin.cancelar')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Administracion;