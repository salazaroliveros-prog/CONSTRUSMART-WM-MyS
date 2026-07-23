import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { confirmAction } from '@/lib/confirm-action';
import { useErp } from '../store';
import ProyectoFilter from '../components/ProyectoFilter';
import { downloadBlob } from '../utils';
import { CheckCircle, ClipboardList, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { z } from 'zod';

const destajoSchema = z.object({
  proyectoId: z.string().min(1, 'Proyecto requerido'),
  renglonCodigo: z.string().min(1, 'Renglón requerido'),
  cuadrilla: z.string().min(1, 'Cuadrilla requerida'),
  fecha: z.string().min(1, 'Fecha requerida'),
  cantidadEjecutada: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
  unidad: z.string().min(1, 'Unidad requerida'),
  horasTrabajadas: z.number().min(0, 'Horas inválidas'),
  rendimientoTeorico: z.number().min(0, 'Rendimiento inválido'),
});

export const PlanillaDestajos: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);
  const { proyectos, destajos, addDestajo, deleteDestajo } = useErp();

  const [proyectoFilter, setProyectoFilter] = useState('');
  const [semanaFilter, setSemanaFilter] = useState(() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    return monday.toISOString().split('T')[0];
  });
  const [tasaPago, setTasaPago] = useState<Record<string, number>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    proyectoId: '', renglonCodigo: '', cuadrilla: '',
    fecha: new Date().toISOString().split('T')[0],
    cantidadEjecutada: 0, unidad: '', horasTrabajadas: 8, rendimientoTeorico: 0,
  });

  const semanaInicio = useMemo(() => new Date(semanaFilter), [semanaFilter]);
  const semanaFin = useMemo(() => {
    const end = new Date(semanaInicio);
    end.setDate(end.getDate() + 6);
    return end;
  }, [semanaInicio]);

  const destajosSemana = useMemo(() => {
    const filtered = proyectoFilter ? destajos.filter(d => d.proyectoId === proyectoFilter) : destajos;
    return filtered.filter(d => {
      const fecha = new Date(d.fecha);
      return fecha >= semanaInicio && fecha <= semanaFin;
    });
  }, [destajos, proyectoFilter, semanaInicio, semanaFin]);

  const grupos = useMemo(() => {
    const map = new Map<string, { cuadrilla: string; totalEjecutado: number; unidad: string; renglones: string[]; dias: number }>();
    destajosSemana.forEach(d => {
      const key = `${d.cuadrilla}-${d.proyectoId}`;
      const existing = map.get(key);
      if (existing) {
        existing.totalEjecutado += d.cantidadEjecutada;
        if (!existing.renglones.includes(d.renglonCodigo)) existing.renglones.push(d.renglonCodigo);
        existing.dias += 1;
      } else {
        map.set(key, { cuadrilla: d.cuadrilla, totalEjecutado: d.cantidadEjecutada, unidad: d.unidad, renglones: [d.renglonCodigo], dias: 1 });
      }
    });
    return Array.from(map.entries()).map(([key, val]) => ({ key, ...val }));
  }, [destajosSemana]);

  const planilla = useMemo(() => grupos.map(g => {
    const tasa = tasaPago[g.key] || 150;
    return { ...g, tasa, pagoSemanal: g.totalEjecutado * tasa };
  }), [grupos, tasaPago]);

  const totalPagar = useMemo(() => planilla.reduce((a, p) => a + p.pagoSemanal, 0), [planilla]);

  const handleSubmitForm = () => {
    const result = destajoSchema.safeParse(formData);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(err => { errs[err.path[0] as string] = err.message; });
      setFormErrors(errs);
      return;
    }
    setFormErrors({});
    const rendimientoReal = formData.horasTrabajadas > 0 ? formData.cantidadEjecutada / formData.horasTrabajadas : 0;
    addDestajo({ ...result.data, rendimientoReal });
    setFormData({
      proyectoId: '', renglonCodigo: '', cuadrilla: '',
      fecha: new Date().toISOString().split('T')[0],
      cantidadEjecutada: 0, unidad: '', horasTrabajadas: 8, rendimientoTeorico: 0,
    });
    setShowForm(false);
  };

  const INPUT = 'text-sm px-3 py-2 border border-input rounded-lg outline-none focus:border-ring bg-background text-foreground';

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
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground"><ClipboardList className="w-5 h-5 inline" aria-hidden="true" /> {t('planilla.titulo')} — {t('planilla_destajos.pago_semanal')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {semanaInicio.toLocaleDateString('es-GT')} — {semanaFin.toLocaleDateString('es-GT')}
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setFormErrors({}); }}
          className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs hover:bg-primary/90 font-medium">
          + {t('planilla_destajos.nuevo_destajo')}
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <ProyectoFilter value={proyectoFilter} onChange={setProyectoFilter} proyectos={proyectos} />
        <input type="date" value={semanaFilter} onChange={e => setSemanaFilter(e.target.value)} className={INPUT} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-info/10 rounded-lg text-center">
          <p className="text-xs text-info font-medium">{t('planilla_destajos.cuadrillas')}</p>
          <p className="text-xl font-bold text-info">{planilla.length}</p>
        </div>
        <div className="p-3 bg-success/10 rounded-lg text-center">
          <p className="text-xs text-success font-medium">{t('planilla_destajos.destajos')}</p>
          <p className="text-xl font-bold text-success">{destajosSemana.length}</p>
        </div>
        <div className="p-3 bg-primary/10 rounded-lg text-center">
          <p className="text-xs text-primary font-medium">{t('planilla_destajos.total_a_pagar')}</p>
          <p className="text-xl font-bold text-primary">Q{totalPagar.toFixed(2)}</p>
        </div>
        <div className="p-3 bg-muted rounded-lg text-center">
          <p className="text-xs text-muted-foreground font-medium">{t('planilla_destajos.promedio_cuadrilla')}</p>
          <p className="text-xl font-bold text-foreground">Q{planilla.length > 0 ? (totalPagar / planilla.length).toFixed(2) : '0.00'}</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table role="table" className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th scope="col" className="p-2 text-left">{t('planilla_destajos.cuadrilla')}</th>
              <th scope="col" className="p-2 text-right">{t('planilla_destajos.total_ejecutado')}</th>
              <th scope="col" className="p-2 text-left">{t('planilla_destajos.unidad')}</th>
              <th scope="col" className="p-2 text-right">{t('planilla_destajos.dias')}</th>
              <th scope="col" className="p-2 text-right">{t('planilla_destajos.tasa')}</th>
              <th scope="col" className="p-2 text-right">{t('planilla_destajos.pago_semanal')}</th>
            </tr>
          </thead>
          <tbody>
            {planilla.map(p => (
              <tr key={p.key} className="border-t border-border hover:bg-muted/50">
                <td className="p-2 font-medium text-foreground">
                  <span className="truncate block" title={p.cuadrilla}>{p.cuadrilla}</span>
                  <div className="text-xs text-muted-foreground truncate">{p.renglones.join(', ')}</div>
                </td>
                <td className="p-2 text-right font-mono">{p.totalEjecutado.toFixed(2)}</td>
                <td className="p-2 text-xs truncate" title={p.unidad}>{p.unidad}</td>
                <td className="p-2 text-right">{p.dias}</td>
                <td className="p-2 text-right">
                  <input type="number" inputMode="decimal" value={tasaPago[p.key] || 150}
                    onChange={e => setTasaPago(prev => ({ ...prev, [p.key]: +e.target.value }))}
                    className="w-20 text-right px-2 py-1 border border-input rounded-lg text-sm font-mono bg-background text-foreground outline-none focus:border-ring" />
                </td>
                <td className="p-2 text-right font-bold font-mono text-success">
                  Q{p.pagoSemanal.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          {planilla.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-border bg-muted font-bold">
                <td className="p-2 text-foreground" colSpan={4}>{t('planilla_destajos.totales')}</td>
                <td className="p-2 text-right text-muted-foreground">—</td>
                <td className="p-2 text-right text-success">Q{totalPagar.toFixed(2)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Detalle de Destajos Individuales */}
      {destajosSemana.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-foreground mb-3"><ClipboardList className="w-4 h-4 inline" aria-hidden="true" /> {t('planilla_destajos.detalle_individual')}</h2>
          <div className="overflow-x-auto">
            <table role="table" className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th scope="col" className="p-2 text-left">{t('planilla_destajos.cuadrilla')}</th>
                  <th scope="col" className="p-2 text-left">{t('planilla_destajos.renglon')}</th>
                  <th scope="col" className="p-2 text-left">{t('planilla_destajos.proyecto')}</th>
                  <th scope="col" className="p-2 text-right">{t('planilla_destajos.cantidad')}</th>
                  <th scope="col" className="p-2 text-right">{t('planilla_destajos.unidad')}</th>
                  <th scope="col" className="p-2 text-center">{t('planilla_destajos.accion')}</th>
                </tr>
              </thead>
              <tbody>
                {destajosSemana.map(d => (
                  <tr key={d.id} className="border-t border-border hover:bg-muted/50">
                    <td className="p-2 font-medium text-foreground">{d.cuadrilla}</td>
                    <td className="p-2 text-muted-foreground">{d.renglonCodigo}</td>
                    <td className="p-2 text-muted-foreground">{proyectos.find(p => p.id === d.proyectoId)?.nombre || '—'}</td>
                    <td className="p-2 text-right font-mono">{d.cantidadEjecutada.toFixed(2)}</td>
                    <td className="p-2 text-right text-xs">{d.unidad}</td>
                    <td className="p-2 text-center">
                      <button
                        onClick={async () => {
                          try {
                            await confirmAction({
                              title: t('destajos.confirmar_eliminar_titulo'),
                              content: t('destajos.confirmar_eliminar_contenido', { cuadrilla: d.cuadrilla, codigo: d.renglonCodigo }),
                              centered: true,
                              okText: t('common.si'),
                              cancelText: t('common.cancelar'),
                              variant: 'destructive',
                            });
                            deleteDestajo(d.id);
                          } catch (error) {
                            console.error('Error al confirmar eliminación de destajo:', error);
                          }
                        }}
                        className="text-destructive dark:text-destructive hover:text-destructive dark:text-destructive/80 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-2 py-1"
                        aria-label={t('planilla_destajos.eliminar_destajo_aria', { cuadrilla: d.cuadrilla })}
                      >
                        {t('planilla_destajos.eliminar')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {planilla.length === 0 && destajosSemana.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" aria-hidden="true" />
          <p className="text-sm">{t('planilla.sin_destajos_semana')}</p>
        </div>
      )}

      {planilla.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button onClick={() => {
            let csv = 'Cuadrilla,Total Ejecutado,Unidad,Días,Tasa (Q),Pago Semanal\n';
            planilla.forEach(p => { csv += `"${p.cuadrilla}",${p.totalEjecutado.toFixed(2)},"${p.unidad}",${p.dias},${p.tasa},${p.pagoSemanal.toFixed(2)}\n`; });
            csv += `,,,,TOTAL,${totalPagar.toFixed(2)}\n`;
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            downloadBlob(blob, `planilla_destajos_${semanaFilter}.csv`);
          }} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90 font-medium">
            <Download className="w-4 h-4" aria-hidden="true" /> {t('planilla_destajos.exportar_csv')}
          </button>
        </div>
      )}

      {/* Modal Nuevo Destajo */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div className="bg-card rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-4">{t('planilla_destajos.nuevo_destajo')}</h3>
            <div className="grid gap-3">
              <div>
                <label htmlFor="destajo-proyecto" className="text-xs text-muted-foreground mb-1 block">{t('planilla_destajos.proyecto', 'Proyecto')}</label>
                <select id="destajo-proyecto" value={formData.proyectoId} onChange={e => { setFormData(p => ({ ...p, proyectoId: e.target.value })); setFormErrors(prev => ({ ...prev, proyectoId: '' })); }} className={INPUT}>
                  <option value="">{t('planilla_destajos.seleccionar_proyecto')}</option>
                  {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                {formErrors.proyectoId && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{formErrors.proyectoId}</p>}
              </div>
              <div>
                <label htmlFor="destajo-renglon" className="text-xs text-muted-foreground mb-1 block">{t('planilla_destajos.renglon', 'Renglón código')}</label>
                <input id="destajo-renglon" placeholder={t('planilla_destajos.renglon_codigo_ph')} value={formData.renglonCodigo} onChange={e => { setFormData(p => ({ ...p, renglonCodigo: e.target.value })); setFormErrors(prev => ({ ...prev, renglonCodigo: '' })); }} className={INPUT} />
                {formErrors.renglonCodigo && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{formErrors.renglonCodigo}</p>}
              </div>
              <div>
                <label htmlFor="destajo-cuadrilla" className="text-xs text-muted-foreground mb-1 block">{t('planilla_destajos.cuadrilla', 'Cuadrilla')}</label>
                <input id="destajo-cuadrilla" placeholder={t('planilla_destajos.cuadrilla_ph')} value={formData.cuadrilla} onChange={e => { setFormData(p => ({ ...p, cuadrilla: e.target.value })); setFormErrors(prev => ({ ...prev, cuadrilla: '' })); }} className={INPUT} />
                {formErrors.cuadrilla && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{formErrors.cuadrilla}</p>}
              </div>
              <div>
                <label htmlFor="destajo-fecha" className="text-xs text-muted-foreground mb-1 block">{t('planilla_destajos.fecha', 'Fecha')}</label>
                <input id="destajo-fecha" type="date" value={formData.fecha} onChange={e => { setFormData(p => ({ ...p, fecha: e.target.value })); setFormErrors(prev => ({ ...prev, fecha: '' })); }} className={INPUT} />
                {formErrors.fecha && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{formErrors.fecha}</p>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="destajo-cantidad" className="text-xs text-muted-foreground mb-1 block">{t('planilla_destajos.cantidad', 'Cant. ejecutada')}</label>
                  <input id="destajo-cantidad" type="number" inputMode="decimal" placeholder={t('planilla_destajos.cantidad_ejecutada_ph')} value={formData.cantidadEjecutada || ''} onChange={e => { setFormData(p => ({ ...p, cantidadEjecutada: +e.target.value })); setFormErrors(prev => ({ ...prev, cantidadEjecutada: '' })); }} className={INPUT} />
                  {formErrors.cantidadEjecutada && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{formErrors.cantidadEjecutada}</p>}
                </div>
                <div>
                  <label htmlFor="destajo-unidad" className="text-xs text-muted-foreground mb-1 block">{t('planilla_destajos.unidad', 'Unidad')}</label>
                  <input id="destajo-unidad" placeholder={t('planilla_destajos.unidad_ph')} value={formData.unidad} onChange={e => { setFormData(p => ({ ...p, unidad: e.target.value })); setFormErrors(prev => ({ ...prev, unidad: '' })); }} className={INPUT} />
                  {formErrors.unidad && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{formErrors.unidad}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="destajo-horas" className="text-xs text-muted-foreground mb-1 block">{t('planilla_destajos.horas', 'Horas trabajadas')}</label>
                  <input id="destajo-horas" type="number" inputMode="decimal" placeholder={t('planilla_destajos.horas_trabajadas_ph')} value={formData.horasTrabajadas || ''} onChange={e => { setFormData(p => ({ ...p, horasTrabajadas: +e.target.value })); setFormErrors(prev => ({ ...prev, horasTrabajadas: '' })); }} className={INPUT} />
                  {formErrors.horasTrabajadas && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{formErrors.horasTrabajadas}</p>}
                </div>
                <div>
                  <label htmlFor="destajo-rendimiento" className="text-xs text-muted-foreground mb-1 block">{t('planilla_destajos.rendimiento', 'Rend. teórico')}</label>
                  <input id="destajo-rendimiento" type="number" inputMode="decimal" placeholder={t('planilla_destajos.rendimiento_teorico_ph')} value={formData.rendimientoTeorico || ''} onChange={e => { setFormData(p => ({ ...p, rendimientoTeorico: +e.target.value })); setFormErrors(prev => ({ ...prev, rendimientoTeorico: '' })); }} className={INPUT} />
                  {formErrors.rendimientoTeorico && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{formErrors.rendimientoTeorico}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSubmitForm}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm hover:bg-primary/90 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <CheckCircle className="w-4 h-4 inline mr-1" aria-hidden="true" /> {t('planilla_destajos.guardar_destajo')}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-muted-foreground">
                  {t('planilla_destajos.cancelar')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanillaDestajos;

