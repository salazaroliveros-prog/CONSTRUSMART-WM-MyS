import { Skeleton } from '@/components/ui/skeleton';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import type { Proyecto } from '../types';
import { fmtQ, fmtPct, TIPOLOGIA_LABEL } from '../utils';
import { Progress } from '../components/Charts';
import MapPicker from '../components/MapPicker';
import HeatMap from '../components/HeatMap';
import { INPUT, BUTTON_PRIMARY, BUTTON_SECONDARY } from '../ui';
import { Plus, MapPin, Trash2, X, Building2, Pencil, Play, Pause, CheckCircle2, RotateCcw, ChevronRight, Copy, Layout, Sparkles, Star, Search, ArrowUpDown, List, Grid3x3, DollarSign, ClipboardList, Activity, TriangleAlert } from 'lucide-react';
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
import { useProyectosActions } from '../hooks/useProyectosActions';
import { conflictDetectionService } from '../services/conflictDetection';

const TIPOS_OBRA = ['nueva', 'remodelacion', 'ampliacion'] as const;
const ETAPAS = ['planificacion', 'diseno', 'preconstruccion', 'construccion', 'cierre'] as const;

const Proyectos: React.FC = () => {
  const { t } = useTranslation();
  const proyectos = useErp(s => s.proyectos);
  const empleados = useErp(s => s.empleados);
  const materiales = useErp(s => s.materiales);
  const activos = useErp(s => s.activos);
  const hitos = useErp(s => s.hitos);
  const ordenes = useErp(s => s.ordenes);
  const safeProyectos = React.useMemo(() => Array.isArray(proyectos) ? proyectos : [], [proyectos]);

  const resourceConflicts = React.useMemo(() => {
    return conflictDetectionService.detectAllConflicts(
      empleados || [],
      materiales || [],
      activos || [],
      safeProyectos,
      hitos || [],
      ordenes || []
    );
  }, [empleados, materiales, activos, safeProyectos, hitos, ordenes]);

  const criticalConflicts = React.useMemo(() => {
    return resourceConflicts.filter(c => c.severidad === 'critico' || c.severidad === 'alto');
  }, [resourceConflicts]);

  const {
    show, setShow,
    editingId, setEditingId,
    selectedTemplate, setSelectedTemplate,
    templateSearch, setTemplateSearch,
    coords, setCoords,
    subtipologias, setSubtipologias,
    pauseModal, setPauseModal,
    pauseReason, setPauseReason,
    pauseAutorizador, setPauseAutorizador,
    pauseReanudacion, setPauseReanudacion,
    submitting, setSubmitting,
    register, handleSubmit, reset, setValue, watch, errors,
    openCreate, openEdit, openDetail,
    onSubmit, accionRapida, confirmarPausa, handleDelete, limpiarProyectos,
    proyectosFiltrados, sugerencias, plantillas,
  } = useProyectosActions({ onCreated: () => { reset({}); setCoords({}); setSelectedTemplate(''); setTemplateSearch(''); } });
  const [ordenamiento, setOrdenamiento] = React.useState<'nombre' | 'fecha' | 'presupuesto'>('fecha');
  const [ordenDescendente, setOrdenDescendente] = React.useState(true);
  const [vistaLista, setVistaLista] = React.useState(false);

  const kpis = useMemo(() => {
    const total = safeProyectos.length;
    const enEjecucion = safeProyectos.filter(p => p.estado === 'ejecucion').length;
    const presupuestoTotal = safeProyectos.reduce((s, p) => s + (p.presupuestoTotal || 0), 0);
    const contratoTotal = safeProyectos.reduce((s, p) => s + (p.montoContrato || 0), 0);
    return { total, enEjecucion, presupuestoTotal, contratoTotal };
  }, [safeProyectos]);

  if (show === undefined) return null;

  return (
    <div className="p-[var(--density-padding)] max-w-[1600px] mx-auto">
      <ProyectosToolbar
        busqueda={templateSearch}
        setBusqueda={setTemplateSearch}
        ordenamiento={ordenamiento}
        setOrdenamiento={setOrdenamiento}
        ordenDescendente={ordenDescendente}
        setOrdenDescendente={setOrdenDescendente}
        vistaLista={vistaLista}
        setVistaLista={setVistaLista}
        proyectosCount={safeProyectos.length}
        onOpenCreate={openCreate}
        onClearAll={limpiarProyectos}
        t={t}
      />

      <div className="relative mb-4 rounded-2xl overflow-hidden border border-border">
        <HeatMap proyectos={safeProyectos} />
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

      {criticalConflicts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4">
          <div className="flex items-start gap-3">
            <TriangleAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-red-900 dark:text-red-100 text-sm mb-1">
                {t('conflicts.critical_conflicts')}: {criticalConflicts.length}
              </h3>
              <p className="text-xs text-red-700 dark:text-red-300 mb-2">
                {t('conflicts.immediate_action')}
              </p>
              <div className="space-y-1">
                {criticalConflicts.slice(0, 2).map(conflict => (
                  <div key={conflict.id} className="text-xs text-red-800 dark:text-red-200">
                    <span className="font-medium">{conflict.recursoNombre}</span>: {conflict.descripcion}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            placeholder={t('proyectos.buscar_proyectos')}
            value={templateSearch}
            onChange={(e) => setTemplateSearch(e.target.value)}
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
              className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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
          className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            vistaLista ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80 active:bg-muted'
          }`}
          aria-label={vistaLista ? t('proyectos.vista_grid') : t('proyectos.vista_lista')}
        >
          {vistaLista ? <Grid3x3 className="w-3 h-3 inline mr-1" aria-hidden="true" /> : <List className="w-3 h-3 inline mr-1" aria-hidden="true" />}
          {vistaLista ? t('proyectos.vista_grid') : t('proyectos.vista_lista')}
        </button>
      </div>

      {safeProyectos.length === 0 ? (
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
              estadoLabel={{ planeacion: t('proyectos.planeacion'), ejecucion: t('proyectos.ejecucion'), pausado: t('proyectos.pausado'), finalizado: t('proyectos.finalizado') }}
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
          {safeProyectos.map((p, i) => (
            <ProyectoCard
              key={p.id}
              proyecto={p}
              index={i}
              estadoLabel={{ planeacion: t('proyectos.planeacion'), ejecucion: t('proyectos.ejecucion'), pausado: t('proyectos.pausado'), finalizado: t('proyectos.finalizado') }}
              etapaLabel={{ planificacion: t('proyectos.etapa_planificacion'), diseno: t('proyectos.etapa_diseno'), preconstruccion: t('proyectos.etapa_preconstruccion'), construccion: t('proyectos.etapa_construccion'), cierre: t('proyectos.etapa_cierre') }}
              tipoObraLabel={{ nueva: t('proyectos.obra_nueva'), remodelacion: t('proyectos.remodelacion'), ampliacion: t('proyectos.ampliacion') }}
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
        tipoObraLabel={{ nueva: t('proyectos.obra_nueva'), remodelacion: t('proyectos.remodelacion'), ampliacion: t('proyectos.ampliacion') }}
        etapaLabel={{ planificacion: t('proyectos.etapa_planificacion'), diseno: t('proyectos.etapa_diseno'), preconstruccion: t('proyectos.etapa_preconstruccion'), construccion: t('proyectos.etapa_construccion'), cierre: t('proyectos.etapa_cierre') }}
        t={t}
      />
    </div>
  );
};

export default Proyectos;