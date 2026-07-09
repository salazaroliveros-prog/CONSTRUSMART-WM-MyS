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
import { INPUT, BUTTON_PRIMARY, BUTTON_SECONDARY, MODAL_OVERLAY, MODAL_PANEL, MODAL_HEADER, MODAL_TITLE, MODAL_CLOSE, BUTTON_ICON, BUTTON_DANGER, KPI_CARD, CARD_TITLE, SECTION_TITLE, COLOR_SUCCESS, COLOR_WARNING, COLOR_DANGER, COLOR_INFO, COLOR_PRIMARY } from '../ui';
import { Plus, MapPin, Trash2, X, Building2, Pencil, Play, Pause, CheckCircle2, RotateCcw, ChevronRight, Copy, Layout, Sparkles, Star, Search, ArrowUpDown, List, Grid3x3, DollarSign, ClipboardList, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { proyectoSchemaObject as proyectoSchemaCanonico } from '../store/schemas/proyectos';
import { estadoColor, estadoBadgeClass } from '../utils/proyectoColors';
import ProyectoStateBadge from '../components/proyectos/ProyectoStateBadge';
import ProyectoProgress from '../components/proyectos/ProyectoProgress';
import ProyectoActions from '../components/proyectos/ProyectoActions';
import ProyectoCard from '../components/proyectos/ProyectoCard';
import ProyectoListItem from '../components/proyectos/ProyectoListItem';
import ProyectosKPI from '../components/proyectos/ProyectosKPI';
import ProyectosToolbar from '../components/proyectos/ProyectosToolbar';
import ProyectoForm from '../components/proyectos/ProyectoForm';
import ProyectoPauseModal from '../components/proyectos/ProyectoPauseModal';

const TIPOS_OBRA = ['nueva', 'remodelacion', 'ampliacion'] as const;
const ETAPAS = ['planificacion', 'diseno', 'preconstruccion', 'construccion', 'cierre'] as const;

const Proyectos: React.FC = () => {
  const { t } = useTranslation();

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

  const { proyectos, addProyecto, updateProyecto, deleteProyecto, clearProyectos, plantillas, crearProyectoDesdePlantilla, sugerirPlantillas, setCurrentProjectId, setView } = useErp();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
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
  const [pauseModal, setPauseModal] = useState<{ proyectoId: string; nombre: string } | null>(null);
  const [pauseReason, setPauseReason] = useState('');
  const [pauseAutorizador, setPauseAutorizador] = useState('');
  const [pauseReanudacion, setPauseReanudacion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setLoading(false); }, []);

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
    setCurrentProjectId(p.id);
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

  const handleDelete = useCallback(async (p: Proyecto) => {
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
      toast.success(t('proyectos.proyecto_eliminado', { nombre: p.nombre }), { description: t('proyectos.proyecto_eliminado_desc') });
    } catch (error) {
      if (error instanceof Error) return;
      console.error('Error deleting proyecto:', error);
      toast.error(t('common.error'), { description: t('proyectos.error_eliminar_proyecto_desc') });
    }
  }, [deleteProyecto, t]);

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
    } catch (error) {
      if (error instanceof Error) {
        return;
      }
      console.error('Error in limpiarProyectos:', error);
      toast.error(t('common.error'), { description: t('proyectos.error_eliminar_todos_desc') });
    }
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
    <div className="p-[var(--density-padding)] max-w-[1600px] mx-auto">
      <ProyectosToolbar
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        ordenamiento={ordenamiento}
        setOrdenamiento={setOrdenamiento}
        ordenDescendente={ordenDescendente}
        setOrdenDescendente={setOrdenDescendente}
        vistaLista={vistaLista}
        setVistaLista={setVistaLista}
        proyectosCount={proyectos.length}
        onOpenCreate={openCreate}
        onClearAll={limpiarProyectos}
        t={t}
      />

      <div className="relative mb-4 rounded-2xl overflow-hidden border border-border">
        <HeatMap proyectos={proyectos} />
        <div className="absolute top-0 left-0 right-0 z-20 p-3 sm:p-4">
          <div className="flex items-center gap-2 text-white mb-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
            <MapPin className="w-4 h-4 text-orange-200" /><span className="text-sm font-bold">{t('proyectos.mapa_calor')}</span>
          </div>
          <div className="flex gap-3 text-xs text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{t('proyectos.en_tiempo')}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />{t('proyectos.riesgo')}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />{t('proyectos.desviado')}</span>
          </div>
        </div>
      </div>

      <ProyectosKPI
        total={kpis.total}
        enEjecucion={kpis.enEjecucion}
        presupuestoTotal={kpis.presupuestoTotal}
        contratoTotal={kpis.contratoTotal}
        t={t}
      />

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
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 active:bg-muted'
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
            vistaLista ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80 active:bg-muted'
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
            <ProyectoListItem
              key={p.id}
              proyecto={p}
              estadoLabel={estadoLabel}
              onEdit={openEdit}
              onDetail={openDetail}
              onAccionRapida={accionRapida}
              t={t}
              fmtQ={fmtQ}
              fmtPct={fmtPct}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {proyectosFiltrados.map((p, i) => (
            <ProyectoCard
              key={p.id}
              proyecto={p}
              index={i}
              estadoLabel={estadoLabel}
              etapaLabel={etapaLabel}
              tipoObraLabel={tipoObraLabel}
              TIPOLOGIA_LABEL={TIPOLOGIA_LABEL}
              onEdit={openEdit}
              onDelete={handleDelete}
              onDetail={openDetail}
              onAccionRapida={accionRapida}
              t={t}
            />
          ))}
        </div>
      )}

      <ProyectoPauseModal
        pauseModal={pauseModal}
        pauseReason={pauseReason}
        setPauseReason={setPauseReason}
        pauseAutorizador={pauseAutorizador}
        setPauseAutorizador={setPauseAutorizador}
        pauseReanudacion={pauseReanudacion}
        setPauseReanudacion={setPauseReanudacion}
        onConfirm={confirmarPausa}
        onClose={() => { setPauseModal(null); setPauseReason(''); setPauseAutorizador(''); setPauseReanudacion(''); }}
        t={t}
        INPUT={INPUT}
        BUTTON_PRIMARY={BUTTON_PRIMARY}
      />

      <ProyectoForm
        show={show}
        editingId={editingId}
        onSubmit={onSubmit}
        onClose={() => { setShow(false); setEditingId(null); setSelectedTemplate(''); setSugerencias([]); setTemplateSearch(''); }}
        register={register}
        handleSubmit={handleSubmit}
        reset={reset}
        setValue={setValue}
        watch={watch}
        errors={errors}
        submitting={submitting}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        templateSearch={templateSearch}
        setTemplateSearch={setTemplateSearch}
        sugerencias={sugerencias}
        plantillas={plantillas}
        coords={coords}
        setCoords={setCoords}
        subtipologias={subtipologias}
        setSubtipologias={setSubtipologias}
        TIPOS_OBRA={TIPOS_OBRA}
        ETAPAS={ETAPAS}
        tipoObraLabel={tipoObraLabel}
        etapaLabel={etapaLabel}
        t={t}
      />
    </div>
  );
};

export default Proyectos;
