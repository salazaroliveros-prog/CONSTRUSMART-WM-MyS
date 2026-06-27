import { Skeleton } from '@/components/ui/skeleton';
import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import type { Proyecto, Tipologia } from '../types';
import { fmtQ, fmtPct, TIPOLOGIA_LABEL, todayISO } from '../utils';
import { obtenerSubtipologias } from '../services/motorCalculo';
import { Progress } from '../components/Charts';
import MapPicker from '../components/MapPicker';
import HeatMap from '../components/HeatMap';
import { INPUT, BUTTON_PRIMARY, MODAL_OVERLAY, MODAL_PANEL, MODAL_HEADER, MODAL_TITLE, MODAL_CLOSE, BUTTON_ICON, BUTTON_DANGER } from '../ui';
import { Plus, MapPin, Trash2, X, Building2, Pencil, Play, Pause, CheckCircle2, RotateCcw, AlertCircle, ChevronRight, Copy, Layout, Sparkles, Star, Search } from 'lucide-react';
import { toast } from 'sonner';
import { proyectoSchema as proyectoSchemaCanonico } from '../store/schemas/proyectos';

const proyectoSchema = proyectoSchemaCanonico.pick({
  nombre: true,
  descripcion: true,
  tipologia: true,
  subtipo: true,
  tipoObra: true,
  cliente: true,
  clienteNit: true,
  clienteTelefono: true,
  clienteEmail: true,
  ubicacion: true,
  direccion: true,
  ciudad: true,
  departamento: true,
  codigoPostal: true,
  areaConstruccion: true,
  numPisos: true,
  plazoSemanas: true,
  ingenieroResidente: true,
  supervisor: true,
  arquitecto: true,
  numeroExpediente: true,
  numeroLicencia: true,
  presupuestoTotal: true,
  montoContrato: true,
  fechaInicio: true,
  fechaFin: true,
  margenUtilidadObjetivo: true,
  moneda: true,
  estado: true,
  etapa: true,
}).extend({
  nombre: z.string().min(1, 'Nombre requerido'),
  cliente: z.string().min(1, 'Cliente requerido'),
  ubicacion: z.string().min(1, 'Ubicación requerida'),
  presupuestoTotal: z.coerce.number().min(0, 'Valor requerido'),
  montoContrato: z.coerce.number().min(0, 'Valor requerido'),
  fechaInicio: z.string().min(1, 'Fecha requerida'),
  fechaFin: z.string().min(1, 'Fecha requerida'),
  clienteEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  areaConstruccion: z.coerce.number().min(0, 'Debe ser positivo').optional(),
  numPisos: z.coerce.number().int().min(0).optional(),
  plazoSemanas: z.coerce.number().int().min(0).optional(),
  margenUtilidadObjetivo: z.coerce.number().min(0).max(100).optional(),
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
  const { proyectos, addProyecto, updateProyecto, deleteProyecto, clearProyectos, plantillas, crearProyectoDesdePlantilla, sugerirPlantillas, setSelectedProyectoId, setView } = useErp();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setLoading(false); }, []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});
  const [subtipologias, setSubtipologias] = useState<any[]>([]);

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

  useEffect(() => {
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

  useEffect(() => {
    if (!editingId && show) {
      const tipologia = watch('tipologia');
      const cliente = watch('cliente');
      const tipoObra = watch('tipoObra');

      if (tipologia || cliente || tipoObra) {
        const sugerenciasCalculadas = sugerirPlantillas({
          tipologia,
          cliente,
          tipoObra,
        });
        setSugerencias(sugerenciasCalculadas);
      } else {
        setSugerencias([]);
      }
    }
  }, [show, watch, sugerirPlantillas, editingId]);

  useEffect(() => {
    const tipologia = watch('tipologia');
    if (tipologia) {
      obtenerSubtipologias(tipologia).then(setSubtipologias).catch(() => setSubtipologias([]));
    }
  }, [watch]);

  const onSubmit = (data: ProyectoFormData) => {
    setSubmitting(true);
    try {
      if (editingId) {
        updateProyecto(editingId, { ...data, lat: coords.lat, lng: coords.lng });
        toast.success(`Proyecto "${data.nombre}" actualizado`, { description: 'Cambios guardados correctamente' });
      } else {
        if (selectedTemplate) {
          crearProyectoDesdePlantilla(selectedTemplate, {
            ...data,
            lat: coords.lat,
            lng: coords.lng,
            latitud: coords.lat,
            longitud: coords.lng,
          });
          toast.success(`Proyecto "${data.nombre}" creado desde plantilla`, { description: 'Proyecto registrado exitosamente con configuración de plantilla' });
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
      }
      reset();
      setEditingId(null);
      setCoords({});
      setSelectedTemplate('');
      setSugerencias([]);
      setTemplateSearch('');
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
    setSelectedTemplate('');
    setSugerencias([]);
    setTemplateSearch('');
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

  const openDetail = (p: Proyecto) => {
    setSelectedProyectoId(p.id);
    setView('presupuestos');
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

  const limpiarProyectos = async () => {
    if (!proyectos.length) return;
    try {
      await Modal.confirm({
        title: 'Eliminar todos los proyectos',
        content: `¿Eliminar los ${proyectos.length} proyectos y sus dependencias registradas en Supabase?\nEsta acción no se puede deshacer.`,
        centered: true,
        okText: 'Sí, eliminar todo',
        cancelText: 'Cancelar',
        okType: 'danger',
        width: 520,
      });
      clearProyectos();
      toast.success('Proyectos eliminados', { description: 'Los cambios se sincronizarán con Supabase.' });
    } catch {}
  };

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
    <div className="p-2 sm:p-3 lg:p-4 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground">Portafolio de Proyectos</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{proyectos.length} proyectos registrados</p>
        </div>
        <div className="flex gap-2">
          {proyectos.length > 0 && (
            <button onClick={limpiarProyectos} className="px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-semibold transition-colors">
              Eliminar todos
            </button>
          )}
          <button onClick={openCreate} className={BUTTON_PRIMARY}>
            <Plus className="w-4 h-4" aria-hidden="true" /> Nuevo Proyecto
          </button>
        </div>
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

      {proyectos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/60" aria-hidden="true" />
          <h2 className="text-base font-bold text-foreground mb-1">No hay proyectos registrados</h2>
          <p className="text-sm text-muted-foreground mb-4">Crea un proyecto nuevo o sincroniza desde Supabase para alimentar tableros, KPIs y gráficas.</p>
          <button onClick={openCreate} className={BUTTON_PRIMARY}>Crear primer proyecto</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {proyectos.map((p, i) => (
          <div
            key={p.id}
            className="group bg-card text-card-foreground rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-border hover:-translate-y-1 animate-enter focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ animationDelay: `${i * 0.04}s` }}
            tabIndex={0}
            role="button"
            aria-label={`Proyecto ${p.nombre}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openDetail(p);
              }
            }}
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
                  <button onClick={async () => {
                    try {
                      await Modal.confirm({
                        title: 'Eliminar proyecto',
                        content: `¿Eliminar proyecto "${p.nombre}"?\nEsta acción no se puede deshacer.`,
                        centered: true,
                        okText: 'Sí, eliminar',
                        cancelText: 'Cancelar',
                        okType: 'danger',
                      });
                      deleteProyecto(p.id);
                      toast.success(`Proyecto "${p.nombre}" eliminado`);
                    } catch {}
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
                  onClick={() => openDetail(p)}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground font-medium flex items-center justify-center gap-1 transition-all active:scale-95"
                >
                  <ChevronRight className="w-3 h-3" /> Detalle
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

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
              <button type="button" onClick={() => { setShow(false); setEditingId(null); setSelectedTemplate(''); setSugerencias([]); setTemplateSearch(''); }} className={MODAL_CLOSE} aria-label={t('common.cerrar')}>
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              {!editingId && (
                <>
                  <div>
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Layout className="w-3 h-3" />
                      Plantilla (Opcional)
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Buscar plantilla..."
                            value={templateSearch}
                            onChange={(e) => setTemplateSearch(e.target.value)}
                            className={`${INPUT} pl-9`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setTemplateSearch('')}
                          className="px-3 py-2 text-xs bg-muted hover:bg-muted/80 rounded"
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
                                    {p.favorita && <Star className="w-3 h-3 text-amber-500 fill-current" />}
                                    <span className="font-medium text-sm">{p.nombre}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {p.descripcion || 'Sin descripción'}
                                  </p>
                                </div>
                                <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded shrink-0">
                                  {p.categoria}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs">
                                <div className="text-center">
                                  <div className="font-semibold">{p.estructuraPresupuesto?.length || 0}</div>
                                  <div className="text-muted-foreground text-[10px]">Renglones</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-semibold">{p.hitosTemplate?.length || 0}</div>
                                  <div className="text-muted-foreground text-[10px]">Hitos</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-semibold">{p.riesgosTemplate?.length || 0}</div>
                                  <div className="text-muted-foreground text-[10px]">Riesgos</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-semibold">{p.usosCount || 0}</div>
                                  <div className="text-muted-foreground text-[10px]">Usos</div>
                                </div>
                              </div>
                              {selectedTemplate === p.id && (
                                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-xs text-blue-700 dark:text-blue-300">
                                  <div className="flex items-center gap-1 mb-1">
                                    <Copy className="w-3 h-3" />
                                    <span className="font-medium">Se crearán automáticamente:</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                                    <div>• Presupuesto con renglones</div>
                                    <div>• Hitos del proyecto</div>
                                    <div>• Riesgos predefinidos</div>
                                    <div>• Configuración base</div>
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
                            <span>Sugerencias basadas en tu proyecto:</span>
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
                                        {sugerencia.favorita && <Star className="w-3 h-3 text-amber-500 fill-current" />}
                                        {sugerencia.nombre}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {catInfo} • {sugerencia.estructuraPresupuesto?.length || 0} renglones • {sugerencia.usosCount || 0} usos
                                      </div>
                                      {sugerencia.clienteNombre && (
                                        <div className="text-xs text-blue-600 mt-1">
                                          Cliente: {sugerencia.clienteNombre}
                                        </div>
                                      )}
                                    </div>
                                    {sugerencia.metricas?.exitoPromedio && sugerencia.metricas.exitoPromedio >= 80 && (
                                      <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                        <Star className="w-3 h-3" />
                                        <span>Excelente</span>
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
                      Omitir plantilla
                    </button>
                  </div>
                </>
              )}

              {/* Informacion General */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">{t('proyectos.informacion_general')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="sm:col-span-2">
                    <input {...register('nombre')} placeholder={t('proyectos.nombre_placeholder')} className={INPUT} />
                    {errors.nombre && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{errors.nombre.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <textarea {...register('descripcion')} placeholder={t('proyectos.descripcion_placeholder')} className={`${INPUT} min-h-[60px] resize-none`} rows={2} />
                  </div>
                  <select {...register('tipologia')} className={INPUT}>
                    {(Object.keys(TIPOLOGIA_LABEL) as Tipologia[]).map(t => <option key={t} value={t}>{TIPOLOGIA_LABEL[t]}</option>)}
                  </select>
                  {subtipologias.length > 0 && (
                    <select {...register('subtipo')} className={INPUT}>
                      <option value="">Subtipo (opcional)</option>
                      {subtipologias.map(s => (
                        <option key={s.subtipo} value={s.subtipo}>{s.subtipo}</option>
                      ))}
                    </select>
                  )}
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
                  {errors.cliente && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{errors.cliente.message}</p>}
                  <input {...register('clienteNit')} placeholder="NIT" className={INPUT} />
                  <input {...register('clienteTelefono')} placeholder="Teléfono" className={INPUT} />
                  <input {...register('clienteEmail')} placeholder="Email" className={INPUT} />
                  {errors.clienteEmail && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{errors.clienteEmail.message}</p>}
                </div>
              </div>

              {/* Ubicacion y Mapa */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">{t('proyectos.ubicacion')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  <input {...register('ubicacion')} placeholder="Ubicación (texto) *" className={INPUT} />
                  {errors.ubicacion && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{errors.ubicacion.message}</p>}
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
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">Complete los campos requeridos</p>
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
