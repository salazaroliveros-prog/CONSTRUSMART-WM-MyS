import { Skeleton } from '@/components/ui/skeleton';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import type { Incidente, PruebaLaboratorio, NoConformidad, LiberacionPartida } from '../types';
import { toast } from 'sonner';
import {
  Shield, AlertTriangle, FlaskConical, ClipboardList, CheckCircle, XCircle, Plus, MapPin,
  User, Activity, Check, Layers, HardHat, BarChart3, Calendar, Users, Search,
} from 'lucide-react';
import { todayISO } from '../utils';
import { z } from 'zod';

type TabSSO = 'incidentes' | 'checklist-sso' | 'estadisticas' | 'emergencia' | 'pruebas' | 'nc' | 'liberaciones';

type TabSSO = 'incidentes' | 'checklist-sso' | 'estadisticas' | 'emergencia' | 'pruebas' | 'nc' | 'liberaciones';

const SSOCalidad: React.FC = () => {
  const { t } = useTranslation();
  const incidenteSchema = z.object({
    tipo: z.enum(['accidente', 'cuasi-accidente', 'condicion_insegura', 'acto_inseguro']),
    descripcion: z.string().min(1, t('sso_calidad.descripcion_requerida')).max(1000, t('sso_calidad.max_1000_caracteres')),
    afectados: z.string().min(1, t('sso_calidad.afectados_requerido')).max(500, t('sso_calidad.max_500_caracteres')),
  });
  const pruebaSchema = z.object({
    tipo: z.enum(['concreto', 'suelo', 'acero', 'asfalto', 'otro']),
    descripcion: z.string().min(1, t('sso_calidad.descripcion_requerida')).max(500, t('sso_calidad.max_500_caracteres')),
    responsable: z.string().min(1, t('sso_calidad.responsable_requerido')).max(100, t('sso_calidad.max_100_caracteres')),
  });
  const ncSchema = z.object({
    descripcion: z.string().min(1, t('sso_calidad.descripcion_requerida')).max(1000, t('sso_calidad.max_1000_caracteres')),
    categoria: z.enum(['material', 'proceso', 'documento', 'instalacion', 'otro']),
    detectadoPor: z.string().min(1, t('sso_calidad.detectado_por_requerido')).max(100, t('sso_calidad.max_100_caracteres')),
  });
  const liberacionSchema = z.object({
    renglonNombre: z.string().min(1, t('sso_calidad.actividad_requerida')).max(200, t('sso_calidad.max_200_caracteres')),
    solicitante: z.string().max(100, t('sso_calidad.max_100_caracteres')).optional().default(''),
    supervisor: z.string().max(100, t('sso_calidad.max_100_caracteres')).optional().default(''),
  });
  const { proyectos, user, addNotificacion, incidentes, addIncidente, updateIncidente, pruebas, addPrueba, updatePrueba, ncs, addNC, updateNC, liberaciones, addLiberacion, updateLiberacion } = useErp();
  const [tab, setTab] = useState<TabSSO>('incidentes');
  const [currentProjectId, setCurrentProjectId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { setLoading(false); }, []);
  const [diasSinAccidentes, setDiasSinAccidentes] = useState(() => {
    const ultimoIncidente = incidentes.filter(i => i.tipo === 'accidente').sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
    if (!ultimoIncidente) return 0;
    return Math.floor((Date.now() - new Date(ultimoIncidente.fecha).getTime()) / 86400000);
  });
  const [ssFormErrors, setSsFormErrors] = useState<Record<string, string>>({});

  const clearSsError = (field: string) => setSsFormErrors(prev => ({ ...prev, [field]: '' }));
  const resetSsErrors = () => setSsFormErrors({});

  const proyectoActual = proyectos.find(p => p.id === currentProjectId);

  // === INCIDENTE FORM ===
  const [showIncForm, setShowIncForm] = useState(false);
  const [incForm, setIncForm] = useState({ tipo: 'accidente' as Incidente['tipo'], descripcion: '', afectados: '', testigos: '', acciones: '', lat: undefined as number | undefined, lng: undefined as number | undefined });

  const handleAddIncidente = () => {
    if (!currentProjectId) { setSsFormErrors(prev => ({ ...prev, proyecto: t('sso_calidad.selecciona_proyecto') })); return; }
    const result = incidenteSchema.safeParse({ tipo: incForm.tipo, descripcion: incForm.descripcion, afectados: incForm.afectados });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(err => { errs[err.path[0] as string] = err.message; });
      setSsFormErrors(errs);
      toast.error(result.error.errors[0].message);
      return;
    }
    setSsFormErrors({});
    const nuevo: Incidente = {
      id: Date.now().toString(),
      proyectoId: currentProjectId,
      tipo: incForm.tipo,
      fecha: todayISO(),
      hora: new Date().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }),
      descripcion: incForm.descripcion,
      afectados: incForm.afectados,
      testigos: incForm.testigos || undefined,
      accionesInmediatas: incForm.acciones || undefined,
      reportadoPor: user?.nombre || t('sso_calidad.anonimo'),
      latitud: incForm.lat,
      longitud: incForm.lng,
      fotos: [],
      estado: 'abierto',
    };
    addIncidente(nuevo);
    setDiasSinAccidentes(0);
    toast.success(t('sso_calidad.incidente_reportado'));
    setShowIncForm(false);
    setIncForm({ tipo: 'accidente', descripcion: '', afectados: '', testigos: '', acciones: '', lat: undefined, lng: undefined });
  };

  const capturarGeoIncidente = () => {
    if (!navigator.geolocation) { toast.error(t('sso_calidad.geolocalizacion_no_soportada')); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setIncForm(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude })); toast.success(t('sso_calidad.ubicacion_capturada')); },
      () => toast.error(t('sso_calidad.no_ubicacion')),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // === PRUEBAS FORM ===
  const [showPruebaForm, setShowPruebaForm] = useState(false);
  const [pruebaForm, setPruebaForm] = useState({ tipo: 'concreto' as PruebaLaboratorio['tipo'], descripcion: '', responsable: '' });

  const handleAddPrueba = () => {
    if (!currentProjectId) { setSsFormErrors(prev => ({ ...prev, proyecto: t('sso_calidad.selecciona_proyecto') })); return; }
    const result = pruebaSchema.safeParse(pruebaForm);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(err => { errs[err.path[0] as string] = err.message; });
      setSsFormErrors(errs);
      toast.error(result.error.errors[0].message);
      return;
    }
    setSsFormErrors({});
    addPrueba({
      proyectoId: currentProjectId,
      tipo: pruebaForm.tipo,
      descripcion: pruebaForm.descripcion,
      fechaMuestra: todayISO(),
      resultado: 'pendiente',
      responsable: pruebaForm.responsable,
    });
    toast.success(t('sso_calidad.prueba_lab_registrada'));
    setShowPruebaForm(false);
    setPruebaForm({ tipo: 'concreto', descripcion: '', responsable: '' });
  };

  const actualizarResultadoPrueba = (id: string, resultado: PruebaLaboratorio['resultado']) => {
    updatePrueba(id, { resultado, fechaResultado: todayISO() });
    toast.success(t('sso_calidad.resultado_actualizado', { resultado }));
  };

  // === NC FORM ===
  const [showNCForm, setShowNCForm] = useState(false);
  const [ncForm, setNcForm] = useState({ descripcion: '', categoria: 'material' as NoConformidad['categoria'], detectadoPor: '' });

  const handleAddNC = () => {
    if (!currentProjectId) { setSsFormErrors(prev => ({ ...prev, proyecto: t('sso_calidad.selecciona_proyecto') })); return; }
    const result = ncSchema.safeParse(ncForm);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(err => { errs[err.path[0] as string] = err.message; });
      setSsFormErrors(errs);
      toast.error(result.error.errors[0].message);
      return;
    }
    setSsFormErrors({});
    const count = ncs.filter(n => n.proyectoId === currentProjectId).length + 1;
    const codigo = `NC-${currentProjectId.slice(0, 4)}-${String(count).padStart(3, '0')}`;
    addNC({
      proyectoId: currentProjectId,
      codigo,
      descripcion: ncForm.descripcion,
      categoria: ncForm.categoria,
      fechaDeteccion: todayISO(),
      detectadoPor: ncForm.detectadoPor,
      estado: 'detectado',
    });
    toast.success(t('sso_calidad.nc_registrada', { codigo }));
    setShowNCForm(false);
    setNcForm({ descripcion: '', categoria: 'material', detectadoPor: '' });
  };

  const actualizarEstadoNC = (id: string, estado: NoConformidad['estado'], planAccion?: string) => {
    updateNC(id, { estado, ...(planAccion ? { planAccion } : {}), ...(estado === 'cerrado' ? { fechaCierre: todayISO() } : {}) });
    toast.success(t('sso_calidad.nc_actualizada', { estado }));
  };

  // === LIBERACION FORM ===
  const [showLibForm, setShowLibForm] = useState(false);
  const [libForm, setLibForm] = useState({ renglonId: '', renglonNombre: '', solicitante: '', supervisor: '' });

  const handleAddLiberacion = () => {
    if (!currentProjectId) { setSsFormErrors(prev => ({ ...prev, proyecto: t('sso_calidad.selecciona_proyecto') })); return; }
    const result = liberacionSchema.safeParse(libForm);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(err => { errs[err.path[0] as string] = err.message; });
      setSsFormErrors(errs);
      toast.error(result.error.errors[0].message);
      return;
    }
    setSsFormErrors({});
    addLiberacion({
      proyectoId: currentProjectId,
      renglonId: libForm.renglonId || Date.now().toString(),
      renglonNombre: libForm.renglonNombre,
      fechaSolicitud: todayISO(),
      solicitante: libForm.solicitante || user?.nombre || t('sso_calidad.anonimo'),
      supervisor: libForm.supervisor || '',
      checklistAprobado: false,
      estado: 'pendiente',
    });
    toast.success(t('sso_calidad.liberacion_creada'));
    setShowLibForm(false);
    setLibForm({ renglonId: '', renglonNombre: '', solicitante: '', supervisor: '' });
  };

  const actualizarLiberacion = (id: string, estado: LiberacionPartida['estado']) => {
    updateLiberacion(id, { estado, ...(estado !== 'pendiente' ? { fechaLiberacion: todayISO() } : {}), checklistAprobado: estado === 'liberado' });
    toast.success(t('sso_calidad.liberacion_actualizada', { estado }));
  };

  // === ESTADÍSTICAS ===
  const totalIncidentes = incidentes.filter(i => !currentProjectId || i.proyectoId === currentProjectId).length;
  const incidentesAbiertos = incidentes.filter(i => i.estado !== 'cerrado' && (!currentProjectId || i.proyectoId === currentProjectId)).length;
  const tasaIncidencia = proyectos.length > 0 ? ((totalIncidentes / proyectos.length) * 100).toFixed(1) : '0';

  const tabs = [
    { id: 'incidentes' as TabSSO, label: t('sso_calidad.tab_incidentes', 'Incidentes'), icon: AlertTriangle },
    { id: 'checklist-sso' as TabSSO, label: t('sso_calidad.tab_checklist', 'Checklist SSO'), icon: ClipboardList },
    { id: 'estadisticas' as TabSSO, label: t('sso_calidad.tab_estadisticas', 'Estadísticas'), icon: Activity },
    { id: 'emergencia' as TabSSO, label: t('sso_calidad.tab_emergencia', 'Emergencia'), icon: AlertTriangle },
    { id: 'pruebas' as TabSSO, label: t('sso_calidad.tab_pruebas', 'Pruebas Lab'), icon: FlaskConical },
    { id: 'nc' as TabSSO, label: t('sso_calidad.tab_nc', 'No Conformidades'), icon: XCircle },
    { id: 'liberaciones' as TabSSO, label: t('sso_calidad.tab_liberaciones', 'Liberación'), icon: CheckCircle },
  ];

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
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-red-500" /> {t('sso_calidad.titulo', 'SSO & Control de Calidad')}
        </h1>
        <select
          value={currentProjectId}
          onChange={e => { setCurrentProjectId(e.target.value); clearSsError('proyecto'); }}
          className="text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-red-400 bg-card"
        >
          <option value="">{t('sso_calidad.todos_proyectos', '— Todos los proyectos —')}</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
          {ssFormErrors.proyecto && <p className="text-xs text-red-500 mt-1">{ssFormErrors.proyecto}</p>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-muted p-1 rounded-xl overflow-x-auto">
        {tabs.map((tabItem) => {
          const Icon = tabItem.icon;
          const active = tab === tabItem.id;
          return (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              aria-label={tabItem.label}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-muted-foreground hover:bg-card/50'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">{tabItem.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========== INCIDENTES ========== */}
      {tab === 'incidentes' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-muted-foreground text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-500" /> {t('sso_calidad.reporte_incidentes', 'Reporte de Incidentes')}
            </h2>
            <button onClick={() => { setShowIncForm(true); resetSsErrors(); }} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600">
              <Plus className="w-3.5 h-3.5" /> {t('sso_calidad.nuevo_incidente', 'Nuevo Incidente')}
            </button>
          </div>

          {showIncForm && (
            <div className="bg-red-50 rounded-xl p-4 mb-4 border border-red-200 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <select
                    value={incForm.tipo}
                    onChange={e => { setIncForm(prev => ({ ...prev, tipo: e.target.value as Incidente['tipo'] })); clearSsError('tipo'); }}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-red-400 ${ssFormErrors.tipo ? 'border-red-500 bg-red-50' : 'border-red-200'}`}
                  >
                    <option value="accidente">{t('sso_calidad.tipo_accidente', 'Accidente')}</option>
                    <option value="cuasi-accidente">{t('sso_calidad.tipo_cuasi', 'Cuasi-accidente')}</option>
                    <option value="condicion_insegura">{t('sso_calidad.tipo_condicion', 'Condición Insegura')}</option>
                    <option value="acto_inseguro">{t('sso_calidad.tipo_acto', 'Acto Inseguro')}</option>
                  </select>
                  {ssFormErrors.tipo && <p className="text-xs text-red-500 mt-1">{ssFormErrors.tipo}</p>}
                </div>
                <button onClick={capturarGeoIncidente} className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-dashed border-red-300 text-xs text-red-600 hover:border-red-500">
                  <MapPin className="w-3.5 h-3.5" /> {incForm.lat ? <><MapPin className="w-3.5 h-3.5 inline text-red-500" aria-hidden="true" /> {incForm.lat.toFixed(4)}</> : t('sso_calidad.geolocalizar', 'Geolocalizar')}
                </button>
              </div>
              <textarea
                value={incForm.descripcion}
                onChange={e => { setIncForm(prev => ({ ...prev, descripcion: e.target.value })); clearSsError('descripcion'); }}
                placeholder={t('sso_calidad.descripcion_incidente', 'Describe el incidente...')}
                className={`w-full px-3 py-2 text-xs rounded-lg border outline-none focus:border-red-400 min-h-[60px] ${ssFormErrors.descripcion ? 'border-red-500 bg-red-50' : 'border-red-200'}`}
              />
              {ssFormErrors.descripcion && <p className="text-xs text-red-500 mt-1">{ssFormErrors.descripcion}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  value={incForm.afectados}
                  onChange={e => { setIncForm(prev => ({ ...prev, afectados: e.target.value })); clearSsError('afectados'); }}
                  placeholder={t('sso_calidad.afectados', 'Afectados')}
                  className={`w-full px-3 py-2 text-xs rounded-lg outline-none focus:border-red-400 ${ssFormErrors.afectados ? 'border-red-500 bg-red-50' : 'border-red-200 border'}`}
                />
                <input
                  value={incForm.testigos}
                  onChange={e => setIncForm(prev => ({ ...prev, testigos: e.target.value }))}
                  placeholder={t('sso_calidad.testigos', 'Testigos (opcional)')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-red-200 outline-none focus:border-red-400"
                />
              </div>
              <input
                value={incForm.acciones}
                onChange={e => setIncForm(prev => ({ ...prev, acciones: e.target.value }))}
                placeholder={t('sso_calidad.acciones_inmediatas', 'Acciones inmediatas tomadas')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-red-200 outline-none focus:border-red-400"
              />
              <div className="flex gap-2">
                <button onClick={handleAddIncidente} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-xs font-semibold">{t('sso_calidad.reportar_incidente', 'Reportar Incidente')}</button>
                <button onClick={() => setShowIncForm(false)} className="px-4 py-2 border border-border rounded-lg text-xs text-muted-foreground">{t('sso_calidad.cancelar', 'Cancelar')}</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {incidentes.filter(i => !currentProjectId || i.proyectoId === currentProjectId).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">{t('sso_calidad.sin_incidentes', 'Sin incidentes registrados')}</p>
              </div>
            ) : (
              incidentes.filter(i => !currentProjectId || i.proyectoId === currentProjectId).map(inc => {
                const proy = proyectos.find(p => p.id === inc.proyectoId);
                return (
                  <div key={inc.id} className={`p-3 rounded-lg border ${inc.estado === 'cerrado' ? 'bg-muted/30 border-border opacity-60' : 'bg-card border-border'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            inc.tipo === 'accidente' ? 'bg-red-100 text-red-600' : inc.tipo === 'cuasi-accidente' ? 'bg-amber-100 text-amber-600' : 'bg-orange-100 text-orange-600'
                          }`}>{inc.tipo.replace(/_/g, ' ')}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            inc.estado === 'abierto' ? 'bg-red-50 text-red-500' : inc.estado === 'investigacion' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'
                          }`}>{inc.estado}</span>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">{inc.descripcion}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> {inc.fecha} {inc.hora}</span>
                          <span className="flex items-center gap-1"><User className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> {inc.reportadoPor}</span>
                          {inc.lat && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> {inc.lat.toFixed(4)}, {inc.lng?.toFixed(4)}</span>}
                          {inc.afectados && <span className="flex items-center gap-1"><Users className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> {inc.afectados}</span>}
                          {proy && <span className="text-indigo-500">{proy.nombre}</span>}
                        </div>
                        {inc.accionesInmediatas && <p className="text-xs text-muted-foreground mt-1 italic">{t('sso_calidad.acciones_colon', 'Acciones:')} {inc.accionesInmediatas}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0 ml-2">
                        {inc.estado === 'abierto' && (
                          <button onClick={() => updateIncidente(inc.id, { estado: 'investigacion' as const })} className="px-2 py-1 bg-amber-500 text-white rounded text-[10px] hover:bg-amber-600">{t('sso_calidad.investigar', 'Investigar')}</button>
                        )}
                        {inc.estado !== 'cerrado' && (
                          <button onClick={() => updateIncidente(inc.id, { estado: 'cerrado' as const })} className="px-2 py-1 bg-emerald-500 text-white rounded text-[10px] hover:bg-emerald-600">{t('sso_calidad.cerrar', 'Cerrar')}</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========== CHECKLIST SSO ========== */}
      {tab === 'checklist-sso' && (
        <div>
          <h2 className="font-bold text-muted-foreground text-sm mb-3 flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-amber-500" /> {t('sso_calidad.titulo_checklist', 'Checklist Diario SSO')}
          </h2>
          <p className="text-xs text-muted-foreground mb-3">{t('sso_calidad.checklist_descripcion', 'Lista de verificación de seguridad diaria obligatoria antes de iniciar labores.')}</p>
          <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
            <div className="space-y-2">
              {[
                { id: 'epi', label: t('sso_calidad.check_epi') },
                { id: 'senalizacion', label: t('sso_calidad.check_senalizacion') },
                { id: 'extintores', label: t('sso_calidad.check_extintores') },
                { id: 'botiquin', label: t('sso_calidad.check_botiquin') },
                { id: 'andamios', label: t('sso_calidad.check_andamios') },
                { id: 'electrica', label: t('sso_calidad.check_electrica') },
                { id: 'orden', label: t('sso_calidad.check_orden') },
                { id: 'excavacion', label: t('sso_calidad.check_excavacion') },
                { id: 'alturas', label: t('sso_calidad.check_alturas') },
                { id: 'herramientas', label: t('sso_calidad.check_herramientas') },
                { id: 'induccion', label: t('sso_calidad.check_induccion') },
              ].map(item => (
                <label key={item.id} className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400" />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <input placeholder={t('sso_calidad.supervisor_placeholder', 'Nombre del supervisor')} className="px-3 py-1.5 text-xs rounded-lg border border-border outline-none focus:border-amber-400" />
              </div>
              <button onClick={() => toast.success(t('sso_calidad.checklist_registrado'))} className="px-4 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600">
                <Check className="w-3.5 h-3.5 inline mr-1" /> {t('sso_calidad.registrar_checklist', 'Registrar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== ESTADÍSTICAS ========== */}
      {tab === 'estadisticas' && (
        <div>
          <h2 className="font-bold text-muted-foreground text-sm mb-3 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-500" /> {t('sso_calidad.titulo_estadisticas', 'Estadísticas SSO')}
          </h2>
          {proyectos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">{t('sso_calidad.sin_datos_estadisticas', 'Sin datos de estadísticas')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="bg-card rounded-xl p-4 border border-border">
                  <div className="text-[10px] text-muted-foreground">{t('sso_calidad.dias_sin_accidentes', 'Días Sin Accidentes')}</div>
                  <div className="text-xl sm:text-3xl font-black text-emerald-600">{diasSinAccidentes}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{t('sso_calidad.dias', 'días')}</div>
                </div>
                <div className={`bg-card rounded-xl p-4 border ${totalIncidentes > 0 ? 'border-red-200' : 'border-border'}`}>
                  <div className="text-[10px] text-muted-foreground">{t('sso_calidad.total_incidentes', 'Total Incidentes')}</div>
                  <div className={`text-xl sm:text-3xl font-black ${totalIncidentes > 0 ? 'text-red-600' : 'text-foreground'}`}>{totalIncidentes}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{incidentesAbiertos} {t('sso_calidad.abiertos', 'abiertos')} · {totalIncidentes - incidentesAbiertos} {t('sso_calidad.cerrados', 'cerrados')}</div>
                </div>
              </div>
              <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
                <h3 className="font-bold text-xs text-muted-foreground mb-3">{t('sso_calidad.incidentes_por_tipo', 'Incidentes por Tipo')}</h3>
                <div className="space-y-2">
                  {(['accidente', 'cuasi-accidente', 'condicion_insegura', 'acto_inseguro'] as const).map(tipo => {
                    const count = incidentes.filter(i => i.tipo === tipo && (!currentProjectId || i.proyectoId === currentProjectId)).length;
                    const maxCount = Math.max(1, ...(['accidente', 'cuasi-accidente', 'condicion_insegura', 'acto_inseguro'] as const).map(t => incidentes.filter(i => i.tipo === t && (!currentProjectId || i.proyectoId === currentProjectId)).length));
                    return (
                      <div key={tipo} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-28">{tipo.replace(/_/g, ' ')}</span>
                        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${tipo === 'accidente' ? 'bg-red-400' : tipo === 'cuasi-accidente' ? 'bg-amber-400' : 'bg-orange-400'}`}
                            style={{ width: `${(count / maxCount) * 100}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========== EMERGENCIA ========== */}
      {tab === 'emergencia' && (
        <div className="text-center py-8">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-xl font-black text-red-600">{t('sso_calidad.boton_emergencia_titulo', 'Botón de Emergencia')}</h2>
            <p className="text-sm text-muted-foreground">{t('sso_calidad.boton_emergencia_desc', 'Activa este botón en caso de una emergencia real en obra. Se notificará a todos los supervisores y se enviará tu ubicación.')}</p>
            <button
              onClick={() => {
                if (!currentProjectId) { toast.error(t('sso_calidad.selecciona_proyecto_emergencia', 'Selecciona un proyecto primero')); return; }
                const confirmEmergencia = confirm(t('sso_calidad.confirmar_emergencia', '¿Confirmar activación de emergencia? Se notificará a todos los supervisores.'));
                if (!confirmEmergencia) return;
                
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const locationMsg = `${t('sso_calidad.emergencia_lat')}: ${pos.coords.latitude.toFixed(4)}, ${t('sso_calidad.emergencia_lng')}: ${pos.coords.longitude.toFixed(4)}`;
                      const mapsUrl = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
                      const nombreObra = proyectoActual?.nombre || t('sso_calidad.obra_default');
                      const msg = t('sso_calidad.emergencia_msg_toast', { nombreObra, locationMsg });
                      
                      toast.error(msg, { duration: 10000 });
                      
                      addNotificacion('emergencia', t('sso_calidad.emergencia_notif_titulo_emerg', { nombreObra }), 
                        t('sso_calidad.emergencia_notif_emerg_body', { locationMsg, mapsUrl }), 
                        currentProjectId, true);
                      
                      addNotificacion('general', t('sso_calidad.emergencia_notif_titulo_gral', { nombreObra }), 
                        t('sso_calidad.emergencia_notif_gral_body', { locationMsg }), 
                        currentProjectId);
                    },
                    (error) => {
                      console.error('Geolocation error:', error);
                      toast.error(t('sso_calidad.emergencia_sin_ubicacion'), { duration: 10000 });
                      addNotificacion('emergencia', t('sso_calidad.emergencia_notif_titulo_emerg', { nombreObra: proyectoActual?.nombre || t('sso_calidad.obra_default') }), 
                        t('sso_calidad.emergencia_sin_ubicacion_body'), 
                        currentProjectId, true);
                      addNotificacion('general', t('sso_calidad.emergencia_obra_notif'), t('sso_calidad.emergencia_activada_notif'), currentProjectId);
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                  );
                } else {
                  toast.error(t('sso_calidad.emergencia_reportada'), { duration: 10000 });
                  addNotificacion('emergencia', t('sso_calidad.emergencia_notif_titulo_emerg', { nombreObra: proyectoActual?.nombre || t('sso_calidad.obra_default') }), 
                    t('sso_calidad.emergencia_sin_geo_body'), 
                    currentProjectId, true);
                  addNotificacion('general', t('sso_calidad.emergencia_obra_notif'), t('sso_calidad.emergencia_activada_notif'), currentProjectId);
                }
              }}
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white font-bold text-xs shadow-sm shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center flex-col"
            >
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
              <span className="text-[10px] sm:text-[10px] font-semibold">{t('sso_calidad.emergencia_boton', 'EMERGENCIA')}</span>
            </button>
              <p className="text-[10px] text-muted-foreground">{t('sso_calidad.emergencia_aviso', 'Se compartirá tu ubicación con los equipos de respuesta')}</p>
          </div>
        </div>
      )}

      {/* ========== PRUEBAS LABORATORIO ========== */}
      {tab === 'pruebas' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-muted-foreground text-sm flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-purple-500" /> {t('sso_calidad.pruebas_laboratorio', 'Pruebas de Laboratorio')}
            </h2>
            <button onClick={() => { setShowPruebaForm(true); resetSsErrors(); }} className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-medium hover:bg-purple-600">
              <Plus className="w-3.5 h-3.5" /> {t('sso_calidad.nueva_prueba', 'Nueva Prueba')}
            </button>
          </div>

          {showPruebaForm && (
            <div className="bg-purple-50 rounded-xl p-4 mb-4 border border-purple-200 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <select
                    value={pruebaForm.tipo}
                    onChange={e => { setPruebaForm(prev => ({ ...prev, tipo: e.target.value as PruebaLaboratorio['tipo'] })); clearSsError('tipo'); }}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-purple-400 ${ssFormErrors.tipo ? 'border-red-500 bg-red-50' : 'border-purple-200'}`}
                  >
                    <option value="concreto">{t('sso_calidad.tipo_concreto', 'Concreto')}</option>
                    <option value="suelos">{t('sso_calidad.tipo_suelos', 'Suelos')}</option>
                    <option value="acero">{t('sso_calidad.tipo_acero', 'Acero')}</option>
                    <option value="asfalto">{t('sso_calidad.tipo_asfalto', 'Asfalto')}</option>
                    <option value="otro">{t('sso_calidad.tipo_otro', 'Otro')}</option>
                  </select>
                  {ssFormErrors.tipo && <p className="text-xs text-red-500 mt-1">{ssFormErrors.tipo}</p>}
                </div>
                <div>
                  <input
                    value={pruebaForm.responsable}
                    onChange={e => { setPruebaForm(prev => ({ ...prev, responsable: e.target.value })); clearSsError('responsable'); }}
                    placeholder={t('sso_calidad.responsable_placeholder', 'Responsable')}
                    className={`w-full px-3 py-2 rounded-lg text-xs outline-none focus:border-purple-400 ${ssFormErrors.responsable ? 'border-red-500 bg-red-50' : 'border-purple-200 border'}`}
                  />
                  {ssFormErrors.responsable && <p className="text-xs text-red-500 mt-1">{ssFormErrors.responsable}</p>}
                </div>
              </div>
              <div>
                <input
                  value={pruebaForm.descripcion}
                  onChange={e => { setPruebaForm(prev => ({ ...prev, descripcion: e.target.value })); clearSsError('descripcion'); }}
                  placeholder={t('sso_calidad.descripcion_prueba_placeholder', 'Descripción de la prueba (ej: Resistencia concreto 28 días)')}
                  className={`w-full px-3 py-2 text-xs rounded-lg outline-none focus:border-purple-400 ${ssFormErrors.descripcion ? 'border-red-500 bg-red-50' : 'border-purple-200 border'}`}
                />
                {ssFormErrors.descripcion && <p className="text-xs text-red-500 mt-1">{ssFormErrors.descripcion}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddPrueba} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-xs font-semibold">{t('sso_calidad.registrar_prueba', 'Registrar Prueba')}</button>
                <button onClick={() => setShowPruebaForm(false)} className="px-4 py-2 border border-border rounded-lg text-xs text-muted-foreground">{t('sso_calidad.cancelar', 'Cancelar')}</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {pruebas.filter(p => !currentProjectId || p.proyectoId === currentProjectId).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">{t('sso_calidad.sin_pruebas', 'Sin pruebas registradas')}</p>
              </div>
            ) : (
              pruebas.filter(p => !currentProjectId || p.proyectoId === currentProjectId).map(p => (
                <div key={p.id} className="p-3 bg-card rounded-lg border border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-blue-600 font-medium">{p.tipo}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          p.resultado === 'pasa' ? 'bg-emerald-50 text-emerald-600' : p.resultado === 'no_pasa' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'
                        }`}>{p.resultado.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">{p.descripcion}</p>
                      <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> {t('sso_calidad.muestra_label', 'Muestra')}: {p.fechaMuestra}</span>
                        {p.fechaResultado && <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> {t('sso_calidad.resultado_label', 'Resultado')}: {p.fechaResultado}</span>}
                        <span className="flex items-center gap-1"><User className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> {p.responsable}</span>
                      </div>
                    </div>
                    {p.resultado === 'pendiente' && (
                      <div className="flex gap-1 shrink-0 ml-2">
                        <button onClick={() => actualizarResultadoPrueba(p.id, 'pasa')} className="px-2 py-1 bg-emerald-500 text-white rounded text-[10px] hover:bg-emerald-600">{t('sso_calidad.pasa', 'Pasa')}</button>
                        <button onClick={() => actualizarResultadoPrueba(p.id, 'no_pasa')} className="px-2 py-1 bg-red-500 text-white rounded text-[10px] hover:bg-red-600">{t('sso_calidad.no_pasa', 'No Pasa')}</button>
                      </div>
                    )}
                  </div>
                  {p.observaciones && <p className="text-[10px] text-muted-foreground mt-1">{p.observaciones}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========== NO CONFORMIDADES ========== */}
      {tab === 'nc' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-muted-foreground text-sm flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-500" /> {t('sso_calidad.titulo_nc', 'No Conformidades (NC)')}
            </h2>
            <button onClick={() => { setShowNCForm(true); resetSsErrors(); }} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600">
              <Plus className="w-3.5 h-3.5" /> {t('sso_calidad.nueva_nc', 'Nueva NC')}
            </button>
          </div>

          {showNCForm && (
            <div className="bg-red-50 rounded-xl p-4 mb-4 border border-red-200 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <select
                    value={ncForm.categoria}
                    onChange={e => { setNcForm(prev => ({ ...prev, categoria: e.target.value as NoConformidad['categoria'] })); clearSsError('categoria'); }}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-red-400 ${ssFormErrors.categoria ? 'border-red-500 bg-red-50' : 'border-red-200'}`}
                  >
                    <option value="material">{t('sso_calidad.cat_material', 'Material')}</option>
                    <option value="proceso">{t('sso_calidad.cat_proceso', 'Proceso')}</option>
                    <option value="documento">{t('sso_calidad.cat_documento', 'Documentación')}</option>
                    <option value="instalacion">{t('sso_calidad.cat_instalacion', 'Instalación')}</option>
                    <option value="otro">{t('sso_calidad.cat_otro', 'Otro')}</option>
                  </select>
                  {ssFormErrors.categoria && <p className="text-xs text-red-500 mt-1">{ssFormErrors.categoria}</p>}
                </div>
                <div>
                  <input
                    value={ncForm.detectadoPor}
                    onChange={e => { setNcForm(prev => ({ ...prev, detectadoPor: e.target.value })); clearSsError('detectadoPor'); }}
                    placeholder={t('sso_calidad.detectado_por_placeholder', 'Detectado por')}
                    className={`w-full px-3 py-2 rounded-lg text-xs outline-none focus:border-red-400 ${ssFormErrors.detectadoPor ? 'border-red-500 bg-red-50' : 'border-red-200 border'}`}
                  />
                  {ssFormErrors.detectadoPor && <p className="text-xs text-red-500 mt-1">{ssFormErrors.detectadoPor}</p>}
                </div>
              </div>
              <div>
                <textarea
                  value={ncForm.descripcion}
                  onChange={e => { setNcForm(prev => ({ ...prev, descripcion: e.target.value })); clearSsError('descripcion'); }}
                  placeholder={t('sso_calidad.descripcion_nc_placeholder', 'Describe la no conformidad...')}
                  className={`w-full px-3 py-2 text-xs rounded-lg outline-none focus:border-red-400 min-h-[60px] ${ssFormErrors.descripcion ? 'border-red-500 bg-red-50' : 'border-red-200 border'}`}
                />
                {ssFormErrors.descripcion && <p className="text-xs text-red-500 mt-1">{ssFormErrors.descripcion}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddNC} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-xs font-semibold">{t('sso_calidad.registrar_nc', 'Registrar NC')}</button>
                <button onClick={() => setShowNCForm(false)} className="px-4 py-2 border border-border rounded-lg text-xs text-muted-foreground">{t('sso_calidad.cancelar', 'Cancelar')}</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {ncs.filter(n => !currentProjectId || n.proyectoId === currentProjectId).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <XCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">{t('sso_calidad.sin_nc', 'Sin no conformidades')}</p>
              </div>
            ) : (
              ncs.filter(n => !currentProjectId || n.proyectoId === currentProjectId).map(nc => (
                <div key={nc.id} className={`p-3 rounded-lg border ${nc.estado === 'cerrado' ? 'bg-emerald-50 border-emerald-200' : 'bg-card border-border'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{nc.codigo}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{nc.categoria}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          nc.estado === 'cerrado' ? 'bg-emerald-50 text-emerald-600' : nc.estado === 'plan_accion' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'
                        }`}>{nc.estado.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">{nc.descripcion}</p>
                      <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> {nc.fechaDeteccion}</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> {nc.detectadoPor}</span>
                      </div>
                      {nc.planAccion && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><ClipboardList className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> {t('sso_calidad.plan_colon', 'Plan:')} {nc.planAccion}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2 flex-col">
                      {nc.estado === 'detectado' && (
                        <button onClick={() => {
                          const plan = prompt(t('sso_calidad.plan_accion_prompt', 'Describe el plan de acción:'));
                          if (plan) actualizarEstadoNC(nc.id, 'plan_accion', plan);
                        }} className="px-2 py-1 bg-amber-500 text-white rounded text-[10px] hover:bg-amber-600">{t('sso_calidad.plan_boton', 'Plan')}</button>
                      )}
                      {nc.estado !== 'cerrado' && (
                        <button onClick={() => actualizarEstadoNC(nc.id, 'cerrado')} className="px-2 py-1 bg-emerald-500 text-white rounded text-[10px] hover:bg-emerald-600">{t('sso_calidad.cerrar', 'Cerrar')}</button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========== LIBERACIONES ========== */}
      {tab === 'liberaciones' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-muted-foreground text-sm flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> {t('sso_calidad.titulo_liberaciones', 'Liberación de Partidas')}
            </h2>
            <button onClick={() => { setShowLibForm(true); resetSsErrors(); }} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600">
              <Plus className="w-3.5 h-3.5" /> {t('sso_calidad.nueva_liberacion', 'Solicitar Liberación')}
            </button>
          </div>

          {showLibForm && (
            <div className="bg-emerald-50 rounded-xl p-4 mb-4 border border-emerald-200 space-y-2">
              <div>
                <input
                  value={libForm.renglonNombre}
                  onChange={e => { setLibForm(prev => ({ ...prev, renglonNombre: e.target.value })); clearSsError('renglonNombre'); }}
                  placeholder={t('sso_calidad.renglon_placeholder', 'Actividad / Partida a liberar')}
                  className={`w-full px-3 py-2 text-xs rounded-lg outline-none focus:border-emerald-400 ${ssFormErrors.renglonNombre ? 'border-red-500 bg-red-50' : 'border-emerald-200 border'}`}
                />
                {ssFormErrors.renglonNombre && <p className="text-xs text-red-500 mt-1">{ssFormErrors.renglonNombre}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <input
                    value={libForm.solicitante}
                    onChange={e => { setLibForm(prev => ({ ...prev, solicitante: e.target.value })); clearSsError('solicitante'); }}
                    placeholder={t('sso_calidad.solicitante_placeholder', 'Solicitante')}
                    className={`w-full px-3 py-2 text-xs rounded-lg outline-none focus:border-emerald-400 ${ssFormErrors.solicitante ? 'border-red-500 bg-red-50' : 'border-emerald-200 border'}`}
                  />
                  {ssFormErrors.solicitante && <p className="text-xs text-red-500 mt-1">{ssFormErrors.solicitante}</p>}
                </div>
                <div>
                  <input
                    value={libForm.supervisor}
                    onChange={e => { setLibForm(prev => ({ ...prev, supervisor: e.target.value })); clearSsError('supervisor'); }}
                    placeholder={t('sso_calidad.supervisor_placeholder', 'Supervisor')}
                    className={`w-full px-3 py-2 text-xs rounded-lg outline-none focus:border-emerald-400 ${ssFormErrors.supervisor ? 'border-red-500 bg-red-50' : 'border-emerald-200 border'}`}
                  />
                  {ssFormErrors.supervisor && <p className="text-xs text-red-500 mt-1">{ssFormErrors.supervisor}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddLiberacion} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-xs font-semibold">{t('sso_calidad.solicitar_liberacion', 'Solicitar Liberación')}</button>
                <button onClick={() => setShowLibForm(false)} className="px-4 py-2 border border-border rounded-lg text-xs text-muted-foreground">{t('sso_calidad.cancelar', 'Cancelar')}</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {liberaciones.filter(l => !currentProjectId || l.proyectoId === currentProjectId).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">{t('sso_calidad.sin_liberaciones', 'Sin solicitudes de liberación')}</p>
              </div>
            ) : (
              liberaciones.filter(l => !currentProjectId || l.proyectoId === currentProjectId).map(l => (
                <div key={l.id} className={`p-3 rounded-lg border ${l.estado === 'liberado' ? 'bg-emerald-50 border-emerald-200' : l.estado === 'rechazado' ? 'bg-red-50 border-red-200' : 'bg-card border-border'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          l.estado === 'liberado' ? 'bg-emerald-100 text-emerald-600' : l.estado === 'rechazado' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                        }`}>{l.estado}</span>
                        {l.checklistAprobado && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded flex items-center gap-0.5"><CheckCircle className="w-3 h-3" aria-hidden="true" /> {t('sso_calidad.checklist_ok')}</span>}
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">{l.renglonNombre}</p>
                      <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> {t('sso_calidad.solicitud_label', 'Sol')}: {l.fechaSolicitud}</span>
                        {l.fechaLiberacion && <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" aria-hidden="true" /> {t('sso_calidad.liberacion_label', 'Lib')}: {l.fechaLiberacion}</span>}
                        <span className="flex items-center gap-1"><User className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> {l.solicitante}</span>
                        {l.supervisor && <span className="flex items-center gap-1"><Search className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> {l.supervisor}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2 flex-col">
                      {l.estado === 'pendiente' && (
                        <>
                          <button onClick={() => actualizarLiberacion(l.id, 'liberado')} className="px-2 py-1 bg-emerald-500 text-white rounded text-[10px] hover:bg-emerald-600">{t('sso_calidad.liberar_boton', 'Liberar')}</button>
                          <button onClick={() => actualizarLiberacion(l.id, 'rechazado')} className="px-2 py-1 bg-red-500 text-white rounded text-[10px] hover:bg-red-600">{t('sso_calidad.rechazar_boton', 'Rechazar')}</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SSOCalidad;


