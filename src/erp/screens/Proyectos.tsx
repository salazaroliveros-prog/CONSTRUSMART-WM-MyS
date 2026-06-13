import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import type { Proyecto, Tipologia } from '../types';
import { fmtQ, fmtPct, TIPOLOGIA_LABEL, todayISO } from '../utils';
import { Progress } from '../components/Charts';
import MapPicker from '../components/MapPicker';
import HeatMap from '../components/HeatMap';
import { INPUT, BUTTON_PRIMARY, MODAL_OVERLAY, MODAL_PANEL, MODAL_HEADER, MODAL_TITLE, MODAL_CLOSE, BUTTON_ICON, BUTTON_DANGER } from '../ui';
import { Plus, MapPin, Trash2, X, Building2, Pencil, Play, Pause, CheckCircle2, RotateCcw, AlertCircle, ChevronRight } from 'lucide-react';
import { message } from 'antd';
import { toast } from 'sonner';

const proyectoSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  tipologia: z.enum(['residencial', 'comercial', 'industrial', 'civil', 'publica'] as const),
  tipoObra: z.enum(['nueva', 'remodelacion', 'ampliacion'] as const).optional(),
  cliente: z.string().min(1, 'Cliente requerido'),
  clienteNit: z.string().optional(),
  clienteTelefono: z.string().optional(),
  clienteEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  ubicacion: z.string().min(1, 'Ubicación requerida'),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  departamento: z.string().optional(),
  codigoPostal: z.string().optional(),
  areaConstruccion: z.coerce.number().min(0, 'Debe ser positivo').optional(),
  numPisos: z.coerce.number().int().min(0).optional(),
  plazoSemanas: z.coerce.number().int().min(0).optional(),
  ingenieroResidente: z.string().optional(),
  supervisor: z.string().optional(),
  arquitecto: z.string().optional(),
  numeroExpediente: z.string().optional(),
  numeroLicencia: z.string().optional(),
  presupuestoTotal: z.coerce.number().min(0, 'Valor requerido'),
  montoContrato: z.coerce.number().min(0, 'Valor requerido'),
  fechaInicio: z.string().min(1, 'Fecha requerida'),
  fechaFin: z.string().min(1, 'Fecha requerida'),
  margenUtilidadObjetivo: z.coerce.number().min(0).max(100).optional(),
  moneda: z.enum(['GTQ', 'USD'] as const).optional(),
  estado: z.enum(['planeacion', 'ejecucion', 'pausado', 'finalizado'] as const),
  etapa: z.enum(['planificacion', 'diseno', 'preconstruccion', 'construccion', 'cierre'] as const).optional(),
});

type ProyectoFormData = z.infer<typeof proyectoSchema>;

const estadoColor = (p: { avanceFisico: number; avanceFinanciero: number; estado: string }) => {
  const dev = p.avanceFinanciero - p.avanceFisico;
  if (p.estado === 'planeacion') return '#94a3b8';
  if (dev > 8) return '#ef4444';
  if (dev > 3) return '#fbbf24';
  return '#10b981';
};

const Proyectos: React.FC = () => {
  const { t } = useTranslation();
  const { proyectos, addProyecto, updateProyecto, deleteProyecto } = useErp();
  const [show, setShow] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProyectoFormData>({
    resolver: zodResolver(proyectoSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      tipologia: 'residencial',
      tipoObra: 'nueva',
      cliente: '',
      clienteNit: '',
      clienteTelefono: '',
      clienteEmail: '',
      ubicacion: '',
      direccion: '',
      ciudad: '',
      departamento: '',
      codigoPostal: '',
      areaConstruccion: undefined,
      numPisos: undefined,
      plazoSemanas: undefined,
      ingenieroResidente: '',
      supervisor: '',
      arquitecto: '',
      numeroExpediente: '',
      numeroLicencia: '',
      presupuestoTotal: 0,
      montoContrato: 0,
      fechaInicio: todayISO(),
      fechaFin: todayISO(),
      margenUtilidadObjetivo: undefined,
      moneda: 'GTQ',
      estado: 'planeacion',
      etapa: 'planificacion',
    },
  });

  const [submitting, setSubmitting] = useState(false);
  const [pauseModal, setPauseModal] = useState<{ proyectoId: string; nombre: string } | null>(null);
  const [pauseReason, setPauseReason] = useState('');
  const [pauseAutorizador, setPauseAutorizador] = useState('');
  const [pauseReanudacion, setPauseReanudacion] = useState('');

  const onSubmit = (data: ProyectoFormData) => {
    setSubmitting(true);
    try {
      if (editingId) {
        updateProyecto(editingId, { ...data, lat: coords.lat, lng: coords.lng });
        toast.success(`Proyecto "${data.nombre}" actualizado`, { description: 'Cambios guardados correctamente' });
      } else {
        addProyecto({
          ...data,
          avanceFisico: 0,
          avanceFinanciero: 0,
          lat: coords.lat || 14.6349,
          lng: coords.lng || -90.5069,
          moneda: data.moneda || 'GTQ',
        });
        toast.success(`Proyecto "${data.nombre}" creado`, { description: 'Proyecto registrado exitosamente' });
      }
      reset();
      setEditingId(null);
      setCoords({});
      setShow(false);
    } catch {
      toast.error('No se pudo guardar', { description: 'Se reintentará cuando haya conexión.' });
    } finally {
      setSubmitting(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setCoords({});
    reset({
      nombre: '',
      descripcion: '',
      tipologia: 'residencial',
      tipoObra: 'nueva',
      cliente: '',
      clienteNit: '',
      clienteTelefono: '',
      clienteEmail: '',
      ubicacion: '',
      direccion: '',
      ciudad: '',
      departamento: '',
      codigoPostal: '',
      areaConstruccion: undefined,
      numPisos: undefined,
      plazoSemanas: undefined,
      ingenieroResidente: '',
      supervisor: '',
      arquitecto: '',
      numeroExpediente: '',
      numeroLicencia: '',
      presupuestoTotal: 0,
      montoContrato: 0,
      fechaInicio: todayISO(),
      fechaFin: todayISO(),
      margenUtilidadObjetivo: undefined,
      moneda: 'GTQ',
      estado: 'planeacion',
      etapa: 'planificacion',
    });
    setShow(true);
  };

  const openEdit = (p: Proyecto) => {
    setEditingId(p.id);
    setCoords({ lat: p.lat, lng: p.lng });
    reset({
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      tipologia: p.tipologia,
      tipoObra: p.tipoObra || 'nueva',
      cliente: p.cliente || '',
      clienteNit: p.clienteNit || '',
      clienteTelefono: p.clienteTelefono || '',
      clienteEmail: p.clienteEmail || '',
      ubicacion: p.ubicacion,
      direccion: p.direccion || '',
      ciudad: p.ciudad || '',
      departamento: p.departamento || '',
      codigoPostal: p.codigoPostal || '',
      areaConstruccion: p.areaConstruccion || undefined,
      numPisos: p.numPisos || undefined,
      plazoSemanas: p.plazoSemanas || undefined,
      ingenieroResidente: p.ingenieroResidente || '',
      supervisor: p.supervisor || '',
      arquitecto: p.arquitecto || '',
      numeroExpediente: p.numeroExpediente || '',
      numeroLicencia: p.numeroLicencia || '',
      presupuestoTotal: p.presupuestoTotal,
      montoContrato: p.montoContrato || 0,
      fechaInicio: p.fechaInicio,
      fechaFin: p.fechaFin,
      margenUtilidadObjetivo: p.margenUtilidadObjetivo || undefined,
      moneda: p.moneda || 'GTQ',
      estado: p.estado,
      etapa: p.etapa || 'planificacion',
    });
    setShow(true);
  };

  const confirmarPausa = useCallback(() => {
    if (!pauseModal) return;
    if (!pauseReason.trim()) { toast.error('Motivo de pausa requerido'); return; }
    if (!pauseAutorizador.trim()) { toast.error('Autorizador requerido'); return; }
    updateProyecto(pauseModal.proyectoId, {
      estado: 'pausado',
      motivoPausa: pauseReason.trim(),
      pausadoPor: pauseAutorizador.trim(),
      fechaPausa: todayISO(),
      fechaReanudacionEstimada: pauseReanudacion || undefined,
    });
    toast.warning(`Proyecto "${pauseModal.nombre}" pausado`, { description: `Motivo: ${pauseReason}` });
    setPauseModal(null);
    setPauseReason('');
    setPauseAutorizador('');
    setPauseReanudacion('');
  }, [pauseModal, pauseReason, pauseAutorizador, pauseReanudacion, updateProyecto]);

  const accionRapida = (p: Proyecto, accion: string) => {
    switch (accion) {
      case 'iniciar':
        updateProyecto(p.id, { estado: 'ejecucion', etapa: 'preconstruccion', fechaInicioReal: todayISO() });
        toast.success(`Proyecto "${p.nombre}" iniciado`, { description: 'Estado cambiado a Ejecución' });
        break;
      case 'pausar':
        setPauseModal({ proyectoId: p.id, nombre: p.nombre });
        setPauseReason(p.motivoPausa || '');
        setPauseAutorizador(p.pausadoPor || '');
        setPauseReanudacion(p.fechaReanudacionEstimada || '');
        break;
      case 'reanudar':
        updateProyecto(p.id, { estado: 'ejecucion' });
        toast.success(`Proyecto "${p.nombre}" reanudado`, { description: 'Estado cambiado a Ejecución' });
        break;
      case 'finalizar':
        updateProyecto(p.id, { estado: 'finalizado', etapa: 'cierre', avanceFisico: 100, avanceFinanciero: 100, fechaFinEstimada: todayISO() });
        toast.success(`Proyecto "${p.nombre}" finalizado`, { description: 'Estado cambiado a Finalizado' });
        break;
      case 'reabrir':
        updateProyecto(p.id, { estado: 'planeacion', etapa: 'planificacion', avanceFisico: 0, avanceFinanciero: 0 });
        toast.info(`Proyecto "${p.nombre}" reabierto`, { description: 'Estado cambiado a Planeación' });
        break;
    }
  };

  const estadoLabel: Record<string, string> = {
    planeacion: 'Planeación', ejecucion: 'Ejecución', pausado: 'Pausado', finalizado: 'Finalizado',
  };

  const wMoneda = watch('moneda');
  const wArea = watch('areaConstruccion');

  return (
    <div className="p-2 sm:p-3 lg:p-4 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground">Portafolio de Proyectos</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{proyectos.length} proyectos registrados</p>
        </div>
        <button onClick={openCreate} className={BUTTON_PRIMARY}>
          <Plus className="w-4 h-4" aria-hidden="true" /> Nuevo Proyecto
        </button>
      </div>

      <div className="relative mb-4 isolate">
        <HeatMap proyectos={proyectos} />
        <div className="absolute top-0 left-0 right-0 z-20 p-4">
          <div className="flex items-center gap-2 text-white mb-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            <MapPin className="w-4 h-4 text-orange-200" /><span className="text-sm font-bold">Mapa de Calor - Geolocalización de Obras</span>
          </div>
          <div className="flex gap-3 text-[10px] text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />En tiempo</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Riesgo</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Desviado</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {proyectos.map((p, i) => (
          <div
            key={p.id}
            className="group bg-card text-card-foreground rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-border hover:-translate-y-1 animate-enter"
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            {/* Barra superior de color según estado */}
            <div className="h-1.5 rounded-t-2xl transition-all duration-300 group-hover:h-2" style={{ background: estadoColor(p) }} />

            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: estadoColor(p) }} aria-hidden="true">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-sm truncate">{p.nombre}</h3>
                  <p className="text-[11px] text-muted-foreground truncate">{p.cliente}</p>
                  {p.areaConstruccion && <p className="text-[10px] text-muted-foreground">{p.areaConstruccion.toLocaleString()} m² · {p.numPisos ? `${p.numPisos} niveles` : ''}</p>}
                </div>
                <div className="flex gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                  <button onClick={() => openEdit(p)} className={BUTTON_ICON} aria-label={`Editar proyecto ${p.nombre}`}>
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button onClick={() => {
                    if (window.confirm(`¿Eliminar proyecto "${p.nombre}"?\nEsta acción no se puede deshacer.`)) {
                      deleteProyecto(p.id);
                      toast.success(`Proyecto "${p.nombre}" eliminado`);
                    }
                  }} className={BUTTON_DANGER} aria-label={`Eliminar proyecto ${p.nombre}`}>
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-muted text-foreground font-medium">{TIPOLOGIA_LABEL[p.tipologia]}</span>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                  p.estado === 'ejecucion' ? 'bg-emerald-500/10 text-emerald-600' :
                  p.estado === 'pausado' ? 'bg-amber-500/10 text-amber-600' :
                  p.estado === 'finalizado' ? 'bg-blue-500/10 text-blue-600' :
                  'bg-slate-500/10 text-slate-600'
                }`}>{estadoLabel[p.estado] || p.estado}</span>
                {p.etapa && <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground">{p.etapa}</span>}
                {p.estado === 'pausado' && p.motivoPausa && <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 truncate max-w-[140px]" title={p.motivoPausa}>{p.motivoPausa}</span>}
                {p.moneda && <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground">{p.moneda}</span>}
              </div>

              <div className="space-y-2.5 mb-4">
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-muted-foreground">Avance Físico</span>
                    <span className="font-semibold text-foreground">{fmtPct(p.avanceFisico)}</span>
                  </div>
                  <div className="relative overflow-hidden rounded-full">
                    <Progress value={p.avanceFisico} color="#3b82f6" />
                    <div className="shimmer-bar absolute inset-0 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-muted-foreground">Avance Financiero</span>
                    <span className="font-semibold text-foreground">{fmtPct(p.avanceFinanciero)}</span>
                  </div>
                  <div className="relative overflow-hidden rounded-full">
                    <Progress value={p.avanceFinanciero} color="#f97316" />
                    <div className="shimmer-bar absolute inset-0 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="pt-3.5 flex justify-between text-xs border-t border-border">
                <div>
                  <span className="text-muted-foreground block text-[10px] mb-0.5">Presupuesto</span>
                  <b className="text-foreground font-semibold">{fmtQ(p.presupuestoTotal)}</b>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block text-[10px] mb-0.5">Contrato</span>
                  <b className="text-emerald-600 dark:text-emerald-400 font-semibold">{fmtQ(p.montoContrato || 0)}</b>
                </div>
              </div>

              {/* Botones de acción rápida */}
              <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-1.5">
                {p.estado === 'planeacion' && (
                  <button
                    onClick={() => accionRapida(p, 'iniciar')}
                    className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 hover:shadow-md"
                  >
                    <Play className="w-3 h-3" /> Iniciar Ejecución
                  </button>
                )}
                {p.estado === 'ejecucion' && (
                  <>
                    <button
                      onClick={() => accionRapida(p, 'pausar')}
                      className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 hover:shadow-md"
                    >
                      <Pause className="w-3 h-3" /> Pausar
                    </button>
                    <button
                      onClick={() => accionRapida(p, 'finalizar')}
                      className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 hover:shadow-md"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Finalizar
                    </button>
                  </>
                )}
                {p.estado === 'pausado' && (
                  <button
                    onClick={() => accionRapida(p, 'reanudar')}
                    className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 hover:shadow-md"
                  >
                    <RotateCcw className="w-3 h-3" /> Reanudar
                  </button>
                )}
                {p.estado === 'finalizado' && (
                  <button
                    onClick={() => accionRapida(p, 'reabrir')}
                    className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-500 hover:bg-slate-600 text-white font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 hover:shadow-md"
                  >
                    <RotateCcw className="w-3 h-3" /> Reabrir
                  </button>
                )}
                <button
                  onClick={() => openEdit(p)}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground font-medium flex items-center justify-center gap-1 transition-all active:scale-95"
                >
                  <ChevronRight className="w-3 h-3" /> Detalle
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pauseModal && (
        <div className={MODAL_OVERLAY + ' animate-enter'} role="dialog" aria-modal="true" aria-labelledby="modal-pausa-title">
          <div onClick={e => e.stopPropagation()} className={`${MODAL_PANEL.replace('max-w-lg sm:max-w-xl md:max-w-2xl', 'max-w-md')} animate-enter`}>
            <div className={MODAL_HEADER}>
              <h2 id="modal-pausa-title" className={MODAL_TITLE}>Pausar Proyecto</h2>
              <button type="button" onClick={() => { setPauseModal(null); setPauseReason(''); setPauseAutorizador(''); setPauseReanudacion(''); }} className={MODAL_CLOSE} aria-label="Cerrar">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Proyecto: <span className="text-primary">{pauseModal.nombre}</span></p>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Motivo de Pausa *</label>
                <textarea
                  value={pauseReason}
                  onChange={e => setPauseReason(e.target.value)}
                  placeholder="Describa la razón de la pausa (ej: falta de materiales, condiciones climáticas, problemas contractuales...)"
                  className={`${INPUT} min-h-[80px] resize-none`}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Autorizado por *</label>
                <input
                  value={pauseAutorizador}
                  onChange={e => setPauseAutorizador(e.target.value)}
                  placeholder="Nombre de quien autoriza la pausa"
                  className={INPUT}
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Fecha estimada de reanudación</label>
                <input
                  type="date"
                  value={pauseReanudacion}
                  onChange={e => setPauseReanudacion(e.target.value)}
                  className={INPUT}
                />
              </div>
            </div>
            <div className="px-4 pb-4 flex gap-2">
              <button onClick={confirmarPausa} className={BUTTON_PRIMARY + ' flex-1 justify-center active:scale-[0.98]'}>
                <Pause className="w-4 h-4" /> Confirmar Pausa
              </button>
              <button onClick={() => { setPauseModal(null); setPauseReason(''); setPauseAutorizador(''); setPauseReanudacion(''); }} className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground font-medium transition-all">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {show && (
        <div className={MODAL_OVERLAY + ' animate-enter'} role="dialog" aria-modal="true" aria-labelledby="modal-proyecto-title">
          <form onClick={e => e.stopPropagation()} onSubmit={handleSubmit(onSubmit)} className={`${MODAL_PANEL.replace('max-w-lg sm:max-w-xl md:max-w-2xl', 'max-w-xl')} animate-enter`}>
            <div className={MODAL_HEADER}>
              <h2 id="modal-proyecto-title" className={MODAL_TITLE}>{editingId ? t('proyectos.editar') : t('proyectos.nuevo')}</h2>
              <button type="button" onClick={() => { setShow(false); setEditingId(null); }} className={MODAL_CLOSE} aria-label={t('common.cerrar')}>
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              {/* Informacion General */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">{t('proyectos.informacion_general')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="sm:col-span-2">
                    <input {...register('nombre')} placeholder={t('proyectos.nombre_placeholder')} className={INPUT} />
                    {errors.nombre && <p className="text-xs text-red-500 mt-0.5">{errors.nombre.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <textarea {...register('descripcion')} placeholder={t('proyectos.descripcion_placeholder')} className={`${INPUT} min-h-[60px] resize-none`} rows={2} />
                  </div>
                  <select {...register('tipologia')} className={INPUT}>
                    {(Object.keys(TIPOLOGIA_LABEL) as Tipologia[]).map(t => <option key={t} value={t}>{TIPOLOGIA_LABEL[t]}</option>)}
                  </select>
                  <select {...register('tipoObra')} className={INPUT}>
                    <option value="nueva">Obra Nueva</option>
                    <option value="remodelacion">Remodelación</option>
                    <option value="ampliacion">Ampliación</option>
                  </select>
                  <select {...register('moneda')} className={INPUT}>
                    <option value="GTQ">GTQ - Quetzal</option>
                    <option value="USD">USD - Dólar</option>
                  </select>
                  <div className="flex gap-2 sm:col-span-2">
                    <input type="number" {...register('areaConstruccion')} placeholder="Área (m²)" className={INPUT} />
                    <input type="number" {...register('numPisos')} placeholder="Niveles" className={INPUT} />
                  </div>
                  <input type="number" {...register('plazoSemanas')} placeholder="Plazo estimado (semanas)" className={INPUT} />
                </div>
              </div>

              {/* Cliente */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">{t('proyectos.cliente')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input {...register('cliente')} placeholder="Nombre del cliente *" className={INPUT} />
                  {errors.cliente && <p className="text-xs text-red-500 mt-0.5">{errors.cliente.message}</p>}
                  <input {...register('clienteNit')} placeholder="NIT" className={INPUT} />
                  <input {...register('clienteTelefono')} placeholder="Teléfono" className={INPUT} />
                  <input {...register('clienteEmail')} placeholder="Email" className={INPUT} />
                  {errors.clienteEmail && <p className="text-xs text-red-500 mt-0.5">{errors.clienteEmail.message}</p>}
                </div>
              </div>

              {/* Ubicacion y Mapa */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">{t('proyectos.ubicacion')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  <input {...register('ubicacion')} placeholder="Ubicación (texto) *" className={INPUT} />
                  {errors.ubicacion && <p className="text-xs text-red-500 mt-0.5">{errors.ubicacion.message}</p>}
                  <input {...register('direccion')} placeholder="Dirección" className={INPUT} />
                  <input {...register('ciudad')} placeholder="Ciudad" className={INPUT} />
                  <input {...register('departamento')} placeholder="Departamento" className={INPUT} />
                  <input {...register('codigoPostal')} placeholder="Código Postal" className={INPUT + ' sm:col-span-2'} />
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
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">{t('proyectos.responsables')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input {...register('ingenieroResidente')} placeholder="Ingeniero Residente" className={INPUT} />
                  <input {...register('supervisor')} placeholder="Supervisor" className={INPUT} />
                  <input {...register('arquitecto')} placeholder="Arquitecto" className={INPUT + ' sm:col-span-2'} />
                </div>
              </div>

              {/* Documentacion */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">{t('proyectos.documentacion')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input {...register('numeroExpediente')} placeholder="N° Expediente" className={INPUT} />
                  <input {...register('numeroLicencia')} placeholder="N° Licencia Municipal" className={INPUT} />
                </div>
              </div>

              {/* Estado y Etapa */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">{t('proyectos.estado_proyecto')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
<div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">{t('proyectos.estado')}</label>
                    <select {...register('estado')} className={INPUT}>
                      <option value="planeacion">Planeación</option>
                      <option value="ejecucion">Ejecución</option>
                      <option value="pausado">Pausado</option>
                      <option value="finalizado">Finalizado</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">{t('proyectos.etapa')}</label>
                    <select {...register('etapa')} className={INPUT}>
                      <option value="planificacion">Planificación</option>
                      <option value="diseno">Diseño</option>
                      <option value="preconstruccion">Pre-construcción</option>
                      <option value="construccion">Construcción</option>
                      <option value="cierre">Cierre</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Presupuesto y Fechas */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">{t('proyectos.presupuesto_plazos')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">{t('proyectos.presupuesto_total')}</label>
                    <input type="number" {...register('presupuestoTotal')} placeholder="Presupuesto" className={INPUT} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">{t('proyectos.monto_contrato')}</label>
                    <input type="number" {...register('montoContrato')} placeholder="Contrato" className={INPUT} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">{t('proyectos.margen_utilidad')}</label>
                    <input type="number" {...register('margenUtilidadObjetivo')} placeholder="Ej: 15" className={INPUT} />
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
                  <p className="text-xs text-red-500 mt-1">Complete los campos requeridos</p>
                )}
              </div>
            </div>

            <button type="submit" className={`${BUTTON_PRIMARY} mt-4 w-full justify-center active:scale-[0.98]`}>
              {editingId ? t('proyectos.guardar_cambios') : t('proyectos.crear')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Proyectos;
