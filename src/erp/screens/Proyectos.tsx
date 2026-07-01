import { Skeleton } from '@/components/ui/skeleton';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import { INPUT, BUTTON_PRIMARY, MODAL_OVERLAY, MODAL_PANEL, MODAL_HEADER, MODAL_TITLE, MODAL_CLOSE, BUTTON_ICON, BUTTON_DANGER, KPI_CARD, CARD_TITLE } from '../ui';
import { Plus, MapPin, Trash2, X, Building2, Pencil, Play, Pause, CheckCircle2, RotateCcw, AlertCircle, ChevronRight, Copy, Layout, Sparkles, Star, Search, ArrowUpDown, List, Grid3x3, DollarSign, ClipboardList, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { proyectoSchemaObject as proyectoSchemaCanonico } from '../store/schemas/proyectos';

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
  nombre: z.string().min(1, t('proyectos.nombre_requerido')),
  cliente: z.string().min(1, t('proyectos.cliente_requerido')),
  ubicacion: z.string().min(1, t('proyectos.ubicacion_requerida')),
  presupuestoTotal: z.coerce.number().min(0, t('proyectos.valor_requerido')),
  montoContrato: z.coerce.number().min(0, t('proyectos.valor_requerido')),
  fechaInicio: z.string().min(1, t('proyectos.nombre_requerido')),
  fechaFin: z.string().min(1, t('proyectos.nombre_requerido')),
  clienteEmail: z.string().email(t('proyectos.nombre_requerido')).optional().or(z.literal('')),
  areaConstruccion: z.coerce.number().min(0).optional(),
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

const TIPOS_OBRA = ['nueva', 'remodelacion', 'ampliacion'] as const;
const ETAPAS = ['planificacion', 'diseno', 'preconstruccion', 'construccion', 'cierre'] as const;

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
  const [busqueda, setBusqueda] = useState('');
  const [ordenamiento, setOrdenamiento] = useState<'nombre' | 'fecha' | 'presupuesto'>('fecha');
  const [ordenDescendente, setOrdenDescendente] = useState(true);
  const [vistaLista, setVistaLista] = useState(false);

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

  const proyectosFiltrados = useMemo(() => {
    const filtrados = proyectos.filter(p =>
      busqueda === '' ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.cliente && p.cliente.toLowerCase().includes(busqueda.toLowerCase())) ||
      (p.ubicacion && p.ubicacion.toLowerCase().includes(busqueda.toLowerCase()))
    );
    return [...filtrados].sort((a, b) => {
      let comparison = 0;
      switch (ordenamiento) {
        case 'nombre':
          comparison = a.nombre.localeCompare(b.nombre);
          break;
        case 'fecha':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
        case 'presupuesto':
          comparison = (a.presupuestoTotal || 0) - (b.presupuestoTotal || 0);
          break;
      }
      return ordenDescendente ? -comparison : comparison;
    });
  }, [proyectos, busqueda, ordenamiento, ordenDescendente]);

  const kpis = useMemo(() => {
    const total = proyectos.length;
    const enEjecucion = proyectos.filter(p => p.estado === 'ejecucion').length;
    const presupuestoTotal = proyectos.reduce((s, p) => s + (p.presupuestoTotal || 0), 0);
    const contratoTotal = proyectos.reduce((s, p) => s + (p.montoContrato || 0), 0);
    return { total, enEjecucion, presupuestoTotal, contratoTotal };
  }, [proyectos]);

  const onSubmit = (data: ProyectoFormData) => {
    setSubmitting(true);
    try {
      if (editingId) {
        updateProyecto(editingId, { ...data, lat: coords.lat, lng: coords.lng });
        toast.success(t('proyectos.proyecto_actualizado', { nombre: data.nombre }), { description: t('proyectos.proyecto_actualizado_desc') });
      } else {
        if (selectedTemplate) {
          crearProyectoDesdePlantilla(selectedTemplate, {
            ...data,
            lat: coords.lat,
            lng: coords.lng,
            latitud: coords.lat,
            longitud: coords.lng,
          });
          toast.success(t('proyectos.proyecto_creado_plantilla', { nombre: data.nombre }), { description: t('proyectos.proyecto_creado_plantilla_desc') });
        } else {
          addProyecto({
            ...data,
            avanceFisico: 0,
            avanceFinanciero: 0,
            lat: coords.lat || 14.6349,
            lng: coords.lng || -90.5069,
            moneda: data.moneda || 'GTQ',
          });
          toast.success(t('proyectos.proyecto_creado', { nombre: data.nombre }), { description: t('proyectos.proyecto_creado_desc') });
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
      toast.error(t('proyectos.error_guardar'), { description: t('proyectos.error_guardar_desc') });
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
    if (!pauseReason.trim()) { toast.error(t('proyectos.motivo_pausa_requerido')); return; }
    if (!pauseAutorizador.trim()) { toast.error(t('proyectos.autorizador_requerido')); return; }
    updateProyecto(pauseModal.proyectoId, {
      estado: 'pausado',
      motivoPausa: pauseReason.trim(),
      pausadoPor: pauseAutorizador.trim(),
      fechaPausa: todayISO(),
      fechaReanudacionEstimada: pauseReanudacion || undefined,
    });
    toast.warning(t('proyectos.proyecto_pausado', { nombre: pauseModal.nombre }), { description: t('proyectos.proyecto_pausado_desc', { motivo: pauseReason }) });
    setPauseModal(null);
    setPauseReason('');
    setPauseAutorizador('');
    setPauseReanudacion('');
  }, [pauseModal, pauseReason, pauseAutorizador, pauseReanudacion, updateProyecto, t]);

  const accionRapida = (p: Proyecto, accion: string) => {
    switch (accion) {
      case 'iniciar':
        updateProyecto(p.id, { estado: 'ejecucion', etapa: 'preconstruccion', fechaInicioReal: todayISO() });
        toast.success(t('proyectos.proyecto_iniciado', { nombre: p.nombre }), { description: t('proyectos.proyecto_iniciado_desc') });
        break;
      case 'pausar':
        setPauseModal({ proyectoId: p.id, nombre: p.nombre });
        setPauseReason(p.motivoPausa || '');
        setPauseAutorizador(p.pausadoPor || '');
        setPauseReanudacion(p.fechaReanudacionEstimada || '');
        break;
      case 'reanudar':
        updateProyecto(p.id, { estado: 'ejecucion' });
        toast.success(t('proyectos.proyecto_reanudado', { nombre: p.nombre }), { description: t('proyectos.proyecto_reanudado_desc') });
        break;
      case 'finalizar':
        updateProyecto(p.id, { estado: 'finalizado', etapa: 'cierre', avanceFisico: 100, avanceFinanciero: 100, fechaFinEstimada: todayISO() });
        toast.success(t('proyectos.proyecto_finalizado', { nombre: p.nombre }), { description: t('proyectos.proyecto_finalizado_desc') });
        break;
      case 'reabrir':
        updateProyecto(p.id, { estado: 'planeacion', etapa: 'planificacion', avanceFisico: 0, avanceFinanciero: 0 });
        toast.info(t('proyectos.proyecto_reabierto', { nombre: p.nombre }), { description: t('proyectos.proyecto_reabierto_desc') });
        break;
    }
  };

  const estadoLabel: Record<string, string> = {
    planeacion: t('proyectos.planeacion'), ejecucion: t('proyectos.ejecucion'), pausado: t('proyectos.pausado'), finalizado: t('proyectos.finalizado'),
  };

  const tipoObraLabel: Record<string, string> = {
    nueva: t('proyectos.obra_nueva'), remodelacion: t('proyectos.remodelacion'), ampliacion: t('proyectos.ampliacion'),
  };

  const etapaLabel: Record<string, string> = {
    planificacion: t('proyectos.etapa_planificacion'), diseno: t('proyectos.etapa_diseno'),
    preconstruccion: t('proyectos.etapa_preconstruccion'), construccion: t('proyectos.etapa_construccion'),
    cierre: t('proyectos.etapa_cierre'),
  };

  const estadoBadgeClass = (estado: string) => {
    if (estado === 'ejecucion') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    if (estado === 'pausado') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    if (estado === 'finalizado') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
  };

  const limpiarProyectos = async () => {
    if (!proyectos.length) return;
    try {
      await Modal.confirm({
        title: t('proyectos.eliminar_todos'),
        content: t('proyectos.confirmar_eliminar_todos', { count: proyectos.length }),
        centered: true,
        okText: t('common.si'),
        cancelText: t('common.cancelar'),
        okType: 'danger',
        width: 520,
      });
      clearProyectos();
      toast.success(t('proyectos.proyectos_eliminados'), { description: t('proyectos.proyectos_eliminados_desc') });
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
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground">{t('proyectos.titulo')}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{t('proyectos.subtitulo', { count: proyectos.length })}</p>
        </div>
        <div className="flex gap-2">
          {proyectos.length > 0 && (
            <button onClick={limpiarProyectos} className="px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-semibold transition-colors">
              <Trash2 className="w-3 h-3 mr-1" aria-hidden="true" />{t('proyectos.eliminar_todos')}
            </button>
          )}
          <button onClick={openCreate} className={BUTTON_PRIMARY}>
            <Plus className="w-4 h-4" aria-hidden="true" /> {t('proyectos.nuevo')}
          </button>
        </div>
      </div>

      <div className="relative mb-4 isolate">
        <HeatMap proyectos={proyectos} />
        <div className="absolute top-0 left-0 right-0 z-20 p-4">
          <div className="flex items-center gap-2 text-white mb-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            <MapPin className="w-4 h-4 text-orange-200" /><span className="text-sm font-bold">{t('proyectos.mapa_calor')}</span>
          </div>
          <div className="flex gap-3 text-[10px] text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{t('proyectos.en_tiempo')}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />{t('proyectos.riesgo')}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />{t('proyectos.desviado')}</span>
          </div>
        </div>
      </div>

      {/* KPI metrics bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className={KPI_CARD}>
          <Activity className="w-4 h-4 text-primary" aria-hidden="true" />
          <div className="text-lg font-black">{kpis.total}</div>
          <div className={CARD_TITLE}>{t('proyectos.total_proyectos')}</div>
        </div>
        <div className={KPI_CARD}>
          <Play className="w-4 h-4 text-emerald-500" aria-hidden="true" />
          <div className="text-lg font-black">{kpis.enEjecucion}</div>
          <div className={CARD_TITLE}>{t('proyectos.en_ejecucion')}</div>
        </div>
        <div className={KPI_CARD}>
          <ClipboardList className="w-4 h-4 text-blue-500" aria-hidden="true" />
          <div className="text-lg font-black">{fmtQ(kpis.presupuestoTotal)}</div>
          <div className={CARD_TITLE}>{t('proyectos.total_presupuesto')}</div>
        </div>
        <div className={KPI_CARD}>
          <DollarSign className="w-4 h-4 text-emerald-500" aria-hidden="true" />
          <div className="text-lg font-black">{fmtQ(kpis.contratoTotal)}</div>
          <div className={CARD_TITLE}>{t('proyectos.total_contratos')}</div>
        </div>
      </div>

      {/* Search + Sort + View Toggle */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            placeholder={t('proyectos.buscar_proyectos')}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`${INPUT} pl-9`}
            aria-label={t('proyectos.buscar_proyectos')}
          />
        </div>
        <div className="flex gap-1">
          {(['nombre', 'fecha', 'presupuesto'] as const).map(key => (
            <button
              key={key}
              onClick={() => {
                if (ordenamiento === key) setOrdenDescendente(!ordenDescendente);
                else { setOrdenamiento(key); setOrdenDescendente(true); }
              }}
              className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                ordenamiento === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              aria-label={t('proyectos.ordenar_por')}
            >
              <ArrowUpDown className="w-3 h-3 inline mr-1" aria-hidden="true" />
              {ordenamiento === key && (ordenDescendente ? '↓ ' : '↑ ')}
              {t(`proyectos.sort_${key}`)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setVistaLista(!vistaLista)}
          className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${
            vistaLista ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
          aria-label={vistaLista ? t('proyectos.vista_grid') : t('proyectos.vista_lista')}
        >
          {vistaLista ? <Grid3x3 className="w-3 h-3 inline mr-1" aria-hidden="true" /> : <List className="w-3 h-3 inline mr-1" aria-hidden="true" />}
          {vistaLista ? t('proyectos.vista_grid') : t('proyectos.vista_lista')}
        </button>
      </div>

      {proyectos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/60" aria-hidden="true" />
          <h2 className="text-base font-bold text-foreground mb-1">{t('proyectos.sin_proyectos_title')}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t('proyectos.sin_proyectos_desc')}</p>
          <button onClick={openCreate} className={BUTTON_PRIMARY}>{t('proyectos.crear_primer')}</button>
        </div>
      ) : vistaLista ? (
        <div className="space-y-2">
          {proyectosFiltrados.map((p, i) => (
            <div
              key={p.id}
              className="group bg-card text-card-foreground rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-border p-4 flex flex-wrap items-center gap-3 focus:outline-none focus:ring-2 focus:ring-ring"
              tabIndex={0}
              role="row"
              aria-label={t('proyectos.aria_card', { nombre: p.nombre })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(p); }
              }}
            >
              <div className="w-1 self-stretch rounded" style={{ background: estadoColor(p) }} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm truncate">{p.nombre}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${estadoBadgeClass(p.estado)}`}>{estadoLabel[p.estado] || p.estado}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{p.cliente} · {p.ubicacion}</p>
              </div>
              <div className="text-xs text-muted-foreground hidden sm:block">
                <span className="block">{fmtQ(p.presupuestoTotal || 0)}</span>
                <span className="block">{fmtPct(p.avanceFisico)}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(p)} className={BUTTON_ICON} aria-label={t('proyectos.editar_proyecto', { nombre: p.nombre })}>
                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button onClick={() => openDetail(p)} className={BUTTON_ICON} aria-label={t('proyectos.ver_detalle', { nombre: p.nombre })}>
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {proyectosFiltrados.map((p, i) => (
          <div
            key={p.id}
            className="group bg-card text-card-foreground rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-border hover:-translate-y-1 animate-enter focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ animationDelay: `${i * 0.04}s` }}
            tabIndex={0}
            role="button"
            aria-label={t('proyectos.aria_card', { nombre: p.nombre })}
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
                  {p.areaConstruccion && <p className="text-[10px] text-muted-foreground">{p.areaConstruccion.toLocaleString()} m² · {p.numPisos ? `${p.numPisos} ${t('proyectos.niveles')}` : ''}</p>}
                </div>
                <div className="flex gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                  <button onClick={() => openEdit(p)} className={BUTTON_ICON} aria-label={t('proyectos.editar_proyecto', { nombre: p.nombre })}>
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button onClick={async () => {
                    try {
                      await Modal.confirm({
                        title: t('proyectos.eliminar_proyecto'),
                        content: t('proyectos.confirmar_eliminar', { nombre: p.nombre }),
                        centered: true,
                        okText: t('common.si'),
                        cancelText: t('common.cancelar'),
                        okType: 'danger',
                      });
                      deleteProyecto(p.id);
                      toast.success(t('proyectos.proyecto_eliminado', { nombre: p.nombre }));
                    } catch {}
                  }} className={BUTTON_DANGER} aria-label={t('proyectos.eliminar_proyecto_nombre', { nombre: p.nombre })}>
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-muted text-foreground font-medium">{TIPOLOGIA_LABEL[p.tipologia]}</span>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${estadoBadgeClass(p.estado)}`}>{estadoLabel[p.estado] || p.estado}</span>
                {p.etapa && <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground">{etapaLabel[p.etapa] || p.etapa}</span>}
                {p.estado === 'pausado' && p.motivoPausa && <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 truncate max-w-[140px]" title={p.motivoPausa}>{p.motivoPausa}</span>}
                {p.moneda && <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground">{p.moneda}</span>}
              </div>

              <div className="space-y-2.5 mb-4">
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-muted-foreground">{t('proyectos.avance_fisico')}</span>
                    <span className="font-semibold text-foreground">{fmtPct(p.avanceFisico)}</span>
                  </div>
                  <div className="relative overflow-hidden rounded-full">
                    <Progress value={p.avanceFisico} color="#3b82f6" />
                    <div className="shimmer-bar absolute inset-0 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-muted-foreground">{t('proyectos.avance_financiero')}</span>
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
                  <span className="text-muted-foreground block text-[10px] mb-0.5">{t('proyectos.presupuesto')}</span>
                  <b className="text-foreground font-semibold">{fmtQ(p.presupuestoTotal)}</b>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block text-[10px] mb-0.5">{t('proyectos.contrato')}</span>
                  <b className="text-emerald-600 dark:text-emerald-400 font-semibold">{fmtQ(p.montoContrato || 0)}</b>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-1.5">
                {p.estado === 'planeacion' && (
                  <button
                    onClick={() => accionRapida(p, 'iniciar')}
                    className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 hover:shadow-md"
                  >
                    <Play className="w-3 h-3" /> {t('proyectos.iniciar')}
                  </button>
                )}
                {p.estado === 'ejecucion' && (
                  <>
                    <button
                      onClick={() => accionRapida(p, 'pausar')}
                      className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 hover:shadow-md"
                    >
                      <Pause className="w-3 h-3" /> {t('proyectos.pausar')}
                    </button>
                    <button
                      onClick={() => accionRapida(p, 'finalizar')}
                      className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 hover:shadow-md"
                    >
                      <CheckCircle2 className="w-3 h-3" /> {t('proyectos.finalizar')}
                    </button>
                  </>
                )}
                {p.estado === 'pausado' && (
                  <button
                    onClick={() => accionRapida(p, 'reanudar')}
                    className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 hover:shadow-md"
                  >
                    <RotateCcw className="w-3 h-3" /> {t('proyectos.reanudar')}
                  </button>
                )}
                {p.estado === 'finalizado' && (
                  <button
                    onClick={() => accionRapida(p, 'reabrir')}
                    className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-500 hover:bg-slate-600 text-white font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 hover:shadow-md"
                  >
                    <RotateCcw className="w-3 h-3" /> {t('proyectos.reabrir')}
                  </button>
                )}
                <button
                  onClick={() => openDetail(p)}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground font-medium flex items-center justify-center gap-1 transition-all active:scale-95"
                >
                  <ChevronRight className="w-3 h-3" /> {t('proyectos.detalle')}
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
              <h2 id="modal-pausa-title" className={MODAL_TITLE}>{t('proyectos.pausar_proyecto')}</h2>
              <button type="button" onClick={() => { setPauseModal(null); setPauseReason(''); setPauseAutorizador(''); setPauseReanudacion(''); }} className={MODAL_CLOSE} aria-label={t('common.cerrar')}>
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">{t('proyectos.proyecto_label')}: <span className="text-primary">{pauseModal.nombre}</span></p>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">{t('proyectos.motivo_pausa')} *</label>
                <textarea
                  value={pauseReason}
                  onChange={e => setPauseReason(e.target.value)}
                  placeholder={t('proyectos.motivo_pausa_placeholder')}
                  className={`${INPUT} min-h-[80px] resize-none`}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">{t('proyectos.autorizado_por')} *</label>
                <input
                  value={pauseAutorizador}
                  onChange={e => setPauseAutorizador(e.target.value)}
                  placeholder={t('proyectos.autorizado_por_placeholder')}
                  className={INPUT}
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">{t('proyectos.fecha_reanudacion')}</label>
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
                <Pause className="w-4 h-4" /> {t('proyectos.confirmar_pausa')}
              </button>
              <button onClick={() => { setPauseModal(null); setPauseReason(''); setPauseAutorizador(''); setPauseReanudacion(''); }} className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground font-medium transition-all">
                {t('common.cancelar')}
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
                                    {p.descripcion || t('proyectos.sin_descripcion')}
                                  </p>
                                </div>
                                <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded shrink-0">
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
                                        {sugerencia.favorita && <Star className="w-3 h-3 text-amber-500 fill-current" />}
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
                                      <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
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
                    <input type="number" {...register('areaConstruccion')} placeholder={t('proyectos.area_placeholder')} className={INPUT} />
                    <input type="number" {...register('numPisos')} placeholder={t('proyectos.niveles_placeholder')} className={INPUT} />
                  </div>
                  <input type="number" {...register('plazoSemanas')} placeholder={t('proyectos.plazo_placeholder')} className={INPUT} />
                </div>
              </div>

              {/* Cliente */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">{t('proyectos.cliente')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <input {...register('cliente')} placeholder={t('proyectos.cliente_placeholder')} className={INPUT} />
                    {errors.cliente && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{errors.cliente.message}</p>}
                  </div>
                  <input {...register('clienteNit')} placeholder={t('proyectos.nit_placeholder')} className={INPUT} />
                  <input {...register('clienteTelefono')} placeholder={t('proyectos.telefono_placeholder')} className={INPUT} />
                  <div>
                    <input {...register('clienteEmail')} placeholder={t('proyectos.email_placeholder')} className={INPUT} />
                    {errors.clienteEmail && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{errors.clienteEmail.message}</p>}
                  </div>
                </div>
              </div>

              {/* Ubicacion y Mapa */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">{t('proyectos.ubicacion')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  <div>
                    <input {...register('ubicacion')} placeholder={t('proyectos.ubicacion_placeholder')} className={INPUT} />
                    {errors.ubicacion && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{errors.ubicacion.message}</p>}
                  </div>
                  <input {...register('direccion')} placeholder={t('proyectos.direccion_placeholder')} className={INPUT} />
                  <input {...register('ciudad')} placeholder={t('proyectos.ciudad_placeholder')} className={INPUT} />
                  <input {...register('departamento')} placeholder={t('proyectos.departamento_placeholder')} className={INPUT} />
                  <input {...register('codigoPostal')} placeholder={t('proyectos.codigo_postal_placeholder')} className={INPUT + ' sm:col-span-2'} />
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
                  <input {...register('ingenieroResidente')} placeholder={t('proyectos.ingeniero_placeholder')} className={INPUT} />
                  <input {...register('supervisor')} placeholder={t('proyectos.supervisor_placeholder')} className={INPUT} />
                  <input {...register('arquitecto')} placeholder={t('proyectos.arquitecto_placeholder')} className={INPUT + ' sm:col-span-2'} />
                </div>
              </div>

              {/* Documentacion */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">{t('proyectos.documentacion')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input {...register('numeroExpediente')} placeholder={t('proyectos.expediente_placeholder')} className={INPUT} />
                  <input {...register('numeroLicencia')} placeholder={t('proyectos.licencia_placeholder')} className={INPUT} />
                </div>
              </div>

              {/* Estado y Etapa */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">{t('proyectos.estado_proyecto')}</h3>
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
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">{t('proyectos.presupuesto_plazos')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">{t('proyectos.presupuesto_total')}</label>
                    <input type="number" {...register('presupuestoTotal')} placeholder={t('proyectos.presupuesto_placeholder')} className={INPUT} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">{t('proyectos.monto_contrato')}</label>
                    <input type="number" {...register('montoContrato')} placeholder={t('proyectos.contrato_placeholder')} className={INPUT} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">{t('proyectos.margen_utilidad')}</label>
                    <input type="number" {...register('margenUtilidadObjetivo')} placeholder={t('proyectos.margen_placeholder')} className={INPUT} />
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
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">{t('proyectos.campos_requeridos')}</p>
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
