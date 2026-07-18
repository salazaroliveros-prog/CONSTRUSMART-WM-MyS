import React from 'react';
import { Search, X, Layout, Star, Copy, Sparkles } from 'lucide-react';
import type { Tipologia } from '../../types';
import { TIPOLOGIA_LABEL } from '../../utils';
import { INPUT, BUTTON_PRIMARY, COLOR_WARNING } from '../../ui';
import MapPicker from '../../components/MapPicker';
import { obtenerSubtipologias } from '../../services/motorCalculo';
import { clienteFormSchema, proveedorFormSchema } from '../../store/schemas/crm';

interface ProyectoFormProps {
  show: boolean;
  editingId: string | null;
  onSubmit: (data: any) => void;
  onClose: () => void;
  register: any;
  handleSubmit: any;
  reset: any;
  setValue: any;
  watch: any;
  errors: any;
  submitting: boolean;
  selectedTemplate: string;
  setSelectedTemplate: (v: string) => void;
  templateSearch: string;
  setTemplateSearch: (v: string) => void;
  sugerencias: any[];
  plantillas: any[];
  coords: { lat?: number; lng?: number };
  setCoords: (v: any) => void;
  subtipologias: any[];
  setSubtipologias: (v: any[]) => void;
  TIPOS_OBRA: readonly string[];
  ETAPAS: readonly string[];
  tipoObraLabel: Record<string, string>;
  etapaLabel: Record<string, string>;
  estadoLabel?: Record<string, string>;
  t: (key: string, options?: any) => string;
}

const DEFAULT_ESTADO_LABEL: Record<string, string> = {
  planeacion: 'Planeación',
  ejecucion: 'Ejecución',
  pausado: 'Pausado',
  finalizado: 'Finalizado',
};

const ProyectoForm: React.FC<ProyectoFormProps> = ({
  show, editingId, onSubmit, onClose, register, handleSubmit, reset, setValue, watch, errors,
  submitting, selectedTemplate, setSelectedTemplate, templateSearch, setTemplateSearch,
  sugerencias, plantillas, coords, setCoords, subtipologias, setSubtipologias, TIPOS_OBRA, ETAPAS,
  tipoObraLabel, etapaLabel, estadoLabel: estadoLabelProp, t
}) => {
  const estadoLabel = estadoLabelProp ?? DEFAULT_ESTADO_LABEL;
  React.useEffect(() => {
    if (selectedTemplate && !editingId) {
      const template = plantillas.find(p => p.id === selectedTemplate);
      if (template && template.configuracion) {
        setValue('tipologia', template.configuracion.tipologia || 'residencial');
        setValue('tipoObra', template.configuracion.tipoObra || 'nueva');
        setValue('moneda', template.configuracion.moneda || 'GTQ');
        setValue('descripcion', template.descripcion || '');
        if (template.configuracion.factorSobrecosto) {
          setValue('margenUtilidadObjetivo', template.configuracion.factorSobrecosto.utilidad);
        }
      }
    }
  }, [selectedTemplate, plantillas, editingId, setValue]);

  React.useEffect(() => {
    const tipologia = watch('tipologia');
    if (tipologia) {
      obtenerSubtipologias(tipologia).then(setSubtipologias).catch(() => setSubtipologias([]));
    }
  }, [watch, setSubtipologias]);

  const cliente = watch('cliente');
  const nit = watch('clienteNit');
  const telefono = watch('clienteTelefono');
  const email = watch('clienteEmail');
  const direccion = watch('direccion');
  const ciudad = watch('ciudad');
  const clienteError = React.useMemo(() => {
    try {
      if (cliente && nit && telefono && email) {
        clienteFormSchema.parse({ cliente, nit, telefono, email, direccion, ciudad });
      }
    } catch (e: any) {
      const msg = e?.errors?.[0]?.message || 'Datos de cliente inválidos';
      return msg;
    }
    return null;
  }, [cliente, nit, telefono, email, direccion, ciudad]);

  if (!show) return null;

  const handleClose = () => {
    setSelectedTemplate('');
    setTemplateSearch('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-enter" role="dialog" aria-modal="true" aria-labelledby="modal-proyecto-title">
      <form onClick={e => e.stopPropagation()} onSubmit={handleSubmit(onSubmit)} className="bg-card rounded-[var(--radius-selected,var(--radius-lg,12px))] shadow-xl border border-border w-full max-w-xl animate-enter max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-[var(--density-padding)] border-b border-border">
          <h2 id="modal-proyecto-title" className="text-base sm:text-lg font-semibold text-foreground">{editingId ? t('proyectos.editar') : t('proyectos.nuevo')}</h2>
          <button type="button" onClick={handleClose} className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors hover:bg-muted" aria-label={t('common.cerrar')}>
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {!editingId && (
            <>
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Layout className="w-3 h-3" />
                  {t('proyectos.plantilla_opcional')}
                </h3>
                
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder={t('proyectos.buscar_plantilla')}
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        className={`${INPUT} pl-9`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setTemplateSearch('')}
                      className="px-3 py-2 text-xs bg-muted hover:bg-muted/80 active:bg-muted rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {plantillas
                      .filter(p => p.activa)
                      .filter(p => 
                        templateSearch 
                          ? p.nombre.toLowerCase().includes(templateSearch.toLowerCase()) ||
                            p.descripcion?.toLowerCase().includes(templateSearch.toLowerCase()) ||
                            p.categoria.toLowerCase().includes(templateSearch.toLowerCase())
                          : true
                      )
                      .sort((a, b) => (b.favorita ? 1 : 0) - (a.favorita ? 1 : 0) || (b.usosCount || 0) - (a.usosCount || 0))
                      .map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedTemplate(p.id)}
                          className={`w-full p-3 rounded-lg border text-left transition-all hover:scale-[1.01] ${
                            selectedTemplate === p.id 
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {p.favorita && <Star className={`w-3 h-3 ${COLOR_WARNING} fill-current`} />}
                                <span className="font-medium text-sm">{p.nombre}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {p.descripcion || t('proyectos.sin_descripcion')}
                              </p>
                            </div>
                            <div className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded shrink-0">
                              {p.categoria}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs">
                            <div className="text-center">
                              <div className="font-semibold">{p.estructuraPresupuesto?.length || 0}</div>
                              <div className="text-muted-foreground text-[10px]">{t('proyectos.renglones')}</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold">{p.hitosTemplate?.length || 0}</div>
                              <div className="text-muted-foreground text-[10px]">{t('proyectos.hitos')}</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold">{p.riesgosTemplate?.length || 0}</div>
                              <div className="text-muted-foreground text-[10px]">{t('proyectos.riesgos')}</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold">{p.usosCount || 0}</div>
                              <div className="text-muted-foreground text-[10px]">{t('proyectos.usos')}</div>
                            </div>
                          </div>
                          {selectedTemplate === p.id && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-xs text-blue-700 dark:text-blue-300">
                              <div className="flex items-center gap-1 mb-1">
                                <Copy className="w-3 h-3" />
                                <span className="font-medium">{t('proyectos.se_crearan_auto')}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-[10px]">
                                <div>• {t('proyectos.presupuesto_renglones')}</div>
                                <div>• {t('proyectos.hitos_proyecto')}</div>
                                <div>• {t('proyectos.riesgos_predefinidos')}</div>
                                <div>• {t('proyectos.configuracion_base')}</div>
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                  </div>

                  {!templateSearch && sugerencias.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                        <Sparkles className="w-3 h-3" />
                        <span>{t('proyectos.sugerencias')}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {sugerencias.map(sugerencia => {
                          const catInfo = TIPOLOGIA_LABEL[sugerencia.categoria as keyof typeof TIPOLOGIA_LABEL] || sugerencia.categoria;
                          return (
                            <button
                              key={sugerencia.id}
                              type="button"
                              onClick={() => setSelectedTemplate(sugerencia.id)}
                              className={`p-3 border rounded-lg hover:bg-muted/50 text-left transition-colors ${
                                selectedTemplate === sugerencia.id
                                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                  : 'border-border'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="font-medium text-sm flex items-center gap-2">
                                    {sugerencia.favorita && <Star className={`w-3 h-3 ${COLOR_WARNING} fill-current`} />}
                                    {sugerencia.nombre}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {catInfo} • {sugerencia.estructuraPresupuesto?.length || 0} {t('proyectos.renglones')} • {sugerencia.usosCount || 0} {t('proyectos.usos')}
                                  </div>
                                  {sugerencia.clienteNombre && (
                                    <div className="text-xs text-blue-600 mt-1">
                                      {t('proyectos.cliente')}: {sugerencia.clienteNombre}
                                    </div>
                                  )}
                                </div>
                                {sugerencia.metricas?.exitoPromedio && sugerencia.metricas.exitoPromedio >= 80 && (
                                  <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded">
                                    <Star className="w-3 h-3" />
                                    <span>{t('proyectos.excelente')}</span>
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate('')}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  {t('proyectos.omitir_plantilla')}
                </button>
              </div>
            </>
          )}

          {/* Informacion General */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {t('proyectos.informacion_general')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="sm:col-span-2">
                <input {...register('nombre')} placeholder={t('proyectos.nombre_placeholder')} className={INPUT} />
                {errors.nombre && <p className={`text-xs text-red-600 dark:text-red-400 mt-0.5`}>{errors.nombre.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <textarea {...register('descripcion')} placeholder={t('proyectos.descripcion_placeholder')} className={`${INPUT} min-h-[60px] resize-none`} rows={2} />
              </div>
              <select {...register('tipologia')} className={INPUT}>
                {(Object.keys(TIPOLOGIA_LABEL) as Tipologia[]).map(t => <option key={t} value={t}>{TIPOLOGIA_LABEL[t]}</option>)}
              </select>
              {subtipologias.length > 0 && (
                <select {...register('subtipo')} className={INPUT}>
                  <option value="">{t('proyectos.subtipo_opcional')}</option>
                  {subtipologias.map(s => (
                    <option key={s.subtipo} value={s.subtipo}>{s.subtipo}</option>
                  ))}
                </select>
              )}
              <select {...register('tipoObra')} className={INPUT}>
                {TIPOS_OBRA.map(t => <option key={t} value={t}>{tipoObraLabel[t]}</option>)}
              </select>
              <select {...register('moneda')} className={INPUT}>
                <option value="GTQ">GTQ - {t('proyectos.quetzal')}</option>
                <option value="USD">USD - {t('proyectos.dolar')}</option>
              </select>
              <div className="flex gap-2 sm:col-span-2">
                <input type="number" inputMode="decimal" {...register('areaConstruccion')} placeholder={t('proyectos.area_placeholder')} className={INPUT} />
                <input type="number" inputMode="decimal" {...register('numPisos')} placeholder={t('proyectos.niveles_placeholder')} className={INPUT} />
              </div>
              <input type="number" inputMode="decimal" {...register('plazoSemanas')} placeholder={t('proyectos.plazo_placeholder')} className={INPUT} />
            </div>
          </div>

          {/* Cliente */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {t('proyectos.cliente')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <input {...register('cliente')} placeholder={t('proyectos.cliente_placeholder')} className={INPUT} />
                {errors.cliente && <p className={`text-xs text-red-600 dark:text-red-400 mt-0.5`}>{errors.cliente.message}</p>}
              </div>
              <div>
                <input {...register('clienteNit')} placeholder={t('proyectos.nit_placeholder')} className={INPUT} />
                {errors.clienteNit && <p className={`text-xs text-red-600 dark:text-red-400 mt-0.5`}>{errors.clienteNit.message}</p>}
              </div>
              <div>
                <input {...register('clienteTelefono')} placeholder={t('proyectos.telefono_placeholder')} className={INPUT} />
                {errors.clienteTelefono && <p className={`text-xs text-red-600 dark:text-red-400 mt-0.5`}>{errors.clienteTelefono.message}</p>}
              </div>
              <div>
                <input {...register('clienteEmail')} placeholder={t('proyectos.email_placeholder')} className={INPUT} />
                {errors.clienteEmail && <p className={`text-xs text-red-600 dark:text-red-400 mt-0.5`}>{errors.clienteEmail.message}</p>}
              </div>
              {clienteError && <p className={`text-xs text-red-600 dark:text-red-400 sm:col-span-2`}>{clienteError}</p>}
            </div>
          </div>

          {/* Ubicacion y Mapa */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {t('proyectos.ubicacion')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <div>
                <input {...register('ubicacion')} placeholder={t('proyectos.ubicacion_placeholder')} className={INPUT} />
                {errors.ubicacion && <p className={`text-xs text-red-600 dark:text-red-400 mt-0.5`}>{errors.ubicacion.message}</p>}
              </div>
              <input {...register('direccion')} placeholder={t('proyectos.direccion_placeholder')} className={INPUT} />
              <input {...register('ciudad')} placeholder={t('proyectos.ciudad_placeholder')} className={INPUT} />
              <input {...register('departamento')} placeholder={t('proyectos.departamento_placeholder')} className={INPUT} />
              <input {...register('codigoPostal')} placeholder={t('proyectos.codigo_postal_placeholder')} className={`${INPUT} sm:col-span-2`} />
            </div>
            <MapPicker
              lat={coords.lat}
              lng={coords.lng}
              onChange={(lat, lng) => {
                setCoords({ lat, lng });
                setValue('ubicacion', `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
              }}
            />
          </div>

          {/* Responsables */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {t('proyectos.responsables')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input {...register('ingenieroResidente')} placeholder={t('proyectos.ingeniero_placeholder')} className={INPUT} />
              <input {...register('supervisor')} placeholder={t('proyectos.supervisor_placeholder')} className={INPUT} />
              <input {...register('arquitecto')} placeholder={t('proyectos.arquitecto_placeholder')} className={`${INPUT} sm:col-span-2`} />
            </div>
          </div>

          {/* Documentacion */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {t('proyectos.documentacion')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input {...register('numeroExpediente')} placeholder={t('proyectos.expediente_placeholder')} className={INPUT} />
              <input {...register('numeroLicencia')} placeholder={t('proyectos.licencia_placeholder')} className={INPUT} />
            </div>
          </div>

          {/* Estado y Etapa */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {t('proyectos.estado_proyecto')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">{t('proyectos.estado')}</label>
                <select {...register('estado')} className={INPUT}>
                  {Object.entries(estadoLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">{t('proyectos.etapa')}</label>
                <select {...register('etapa')} className={INPUT}>
                  {ETAPAS.map(e => <option key={e} value={e}>{etapaLabel[e]}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Presupuesto y Fechas */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {t('proyectos.presupuesto_plazos')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">{t('proyectos.presupuesto_total')}</label>
                <input type="number" inputMode="decimal" {...register('presupuestoTotal')} placeholder={t('proyectos.presupuesto_placeholder')} className={INPUT} />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">{t('proyectos.monto_contrato')}</label>
                <input type="number" inputMode="decimal" {...register('montoContrato')} placeholder={t('proyectos.contrato_placeholder')} className={INPUT} />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">{t('proyectos.margen_utilidad')}</label>
                <input type="number" inputMode="decimal" {...register('margenUtilidadObjetivo')} placeholder={t('proyectos.margen_placeholder')} className={INPUT} />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">{t('proyectos.fecha_inicio')}</label>
                <input type="date" {...register('fechaInicio')} className={INPUT} />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">{t('proyectos.fecha_fin_estimada')}</label>
                <input type="date" {...register('fechaFin')} className={INPUT} />
              </div>
            </div>
            {(errors.presupuestoTotal || errors.montoContrato || errors.fechaInicio || errors.fechaFin) && (
              <p className={`text-xs text-red-600 dark:text-red-400 mt-1`}>{t('proyectos.campos_requeridos')}</p>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6 pt-0">
          <button type="submit" className={`${BUTTON_PRIMARY} mt-4 w-full justify-center active:scale-[0.98]`} disabled={submitting}>
            {editingId ? t('proyectos.guardar_cambios') : t('proyectos.crear')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProyectoForm;
