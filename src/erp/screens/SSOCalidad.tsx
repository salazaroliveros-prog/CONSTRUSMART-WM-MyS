import React, { useState, useMemo } from 'react';
import { useErp } from '../store';
import type { Incidente, PruebaLaboratorio, NoConformidad, LiberacionPartida } from '../types';
import { toast } from 'sonner';
import {
  Shield, AlertTriangle, FlaskConical, ClipboardList, CheckCircle, XCircle, Plus, Trash2, MapPin,
  FileText, Calendar, User, Search, Send, Camera, Activity, Clock, ArrowUpCircle, Check, Layers,
} from 'lucide-react';
import { CARD, CARD_TITLE, INPUT } from '../ui';
import { fmtQ, todayISO } from '../utils';
import { z } from 'zod';

// Zod schemas
const incidenteSchema = z.object({
  tipo: z.enum(['accidente', 'cuasi_accidente', 'incidente', 'condicion_insegura']),
  descripcion: z.string().min(1, 'Descripción requerida').max(1000, 'Máximo 1000 caracteres'),
  afectados: z.string().min(1, 'Indica los afectados').max(500, 'Máximo 500 caracteres'),
});
const pruebaSchema = z.object({
  tipo: z.enum(['concreto', 'suelo', 'acero', 'asfalto', 'otro']),
  descripcion: z.string().min(1, 'Descripción requerida').max(500, 'Máximo 500 caracteres'),
  responsable: z.string().min(1, 'Responsable requerido').max(100, 'Máximo 100 caracteres'),
});
const ncSchema = z.object({
  descripcion: z.string().min(1, 'Descripción requerida').max(1000, 'Máximo 1000 caracteres'),
  categoria: z.enum(['material', 'proceso', 'documento', 'instalacion', 'otro']),
  detectadoPor: z.string().min(1, 'Indica quién detectó').max(100, 'Máximo 100 caracteres'),
});
const liberacionSchema = z.object({
  renglonNombre: z.string().min(1, 'Actividad/partida requerida').max(200, 'Máximo 200 caracteres'),
  solicitante: z.string().max(100, 'Máximo 100 caracteres').optional().default(''),
  supervisor: z.string().max(100, 'Máximo 100 caracteres').optional().default(''),
});

type TabSSO = 'incidentes' | 'checklist-sso' | 'estadisticas' | 'emergencia' | 'pruebas' | 'nc' | 'liberaciones';

const SSOCalidad: React.FC = () => {
  const { proyectos, user, addNotificacion } = useErp();
  const [tab, setTab] = useState<TabSSO>('incidentes');
  const [selProyecto, setSelProyecto] = useState('');

  // === STORAGE KEYS ===
  const INC_KEY = 'wm_incidentes';
  const PRUEBA_KEY = 'wm_pruebas_lab';
  const NC_KEY = 'wm_no_conformidades';
  const LIB_KEY = 'wm_liberaciones';
  const SSO_DAYS_KEY = 'wm_sso_dias_sin_accidentes';

  // === STATE ===
  const [incidentes, setIncidentes] = useState<Incidente[]>(() => {
    try { return JSON.parse(localStorage.getItem(INC_KEY) || '[]'); } catch { return []; }
  });
  const [pruebas, setPruebas] = useState<PruebaLaboratorio[]>(() => {
    try { return JSON.parse(localStorage.getItem(PRUEBA_KEY) || '[]'); } catch { return []; }
  });
  const [ncs, setNcs] = useState<NoConformidad[]>(() => {
    try { return JSON.parse(localStorage.getItem(NC_KEY) || '[]'); } catch { return []; }
  });
  const [liberaciones, setLiberaciones] = useState<LiberacionPartida[]>(() => {
    try { return JSON.parse(localStorage.getItem(LIB_KEY) || '[]'); } catch { return []; }
  });
  const [diasSinAccidentes, setDiasSinAccidentes] = useState(() => {
    try { return +(localStorage.getItem(SSO_DAYS_KEY) || '0'); } catch { return 0; }
  });
  const [ssFormErrors, setSsFormErrors] = useState<Record<string, string>>({});

  const save = (key: string, data: unknown) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const clearSsError = (field: string) => setSsFormErrors(prev => ({ ...prev, [field]: '' }));
  const resetSsErrors = () => setSsFormErrors({});

  const proyFiltrados = selProyecto
    ? proyectos.filter(p => p.id === selProyecto)
    : proyectos;

  const proyectoActual = proyectos.find(p => p.id === selProyecto);

  // === INCIDENTE FORM ===
  const [showIncForm, setShowIncForm] = useState(false);
  const [incForm, setIncForm] = useState({ tipo: 'accidente' as Incidente['tipo'], descripcion: '', afectados: '', testigos: '', acciones: '', lat: undefined as number | undefined, lng: undefined as number | undefined });

  const handleAddIncidente = () => {
    if (!selProyecto) { toast.error('Selecciona un proyecto'); return; }
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
      proyectoId: selProyecto,
      tipo: incForm.tipo,
      fecha: todayISO(),
      hora: new Date().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }),
      descripcion: incForm.descripcion,
      afectados: incForm.afectados,
      testigos: incForm.testigos || undefined,
      accionesInmediatas: incForm.acciones || undefined,
      reportadoPor: user?.nombre || 'Anónimo',
      latitud: incForm.lat,
      longitud: incForm.lng,
      fotos: [],
      estado: 'abierto',
    };
    const updated = [nuevo, ...incidentes];
    setIncidentes(updated);
    save(INC_KEY, updated);
    setDiasSinAccidentes(0);
    save(SSO_DAYS_KEY, 0);
    toast.success('Incidente reportado');
    setShowIncForm(false);
    setIncForm({ tipo: 'accidente', descripcion: '', afectados: '', testigos: '', acciones: '', lat: undefined, lng: undefined });
  };

  const capturarGeoIncidente = () => {
    if (!navigator.geolocation) { toast.error('Geolocalización no soportada'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setIncForm(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude })); toast.success('Ubicación capturada'); },
      () => toast.error('No se pudo obtener ubicación'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // === PRUEBAS FORM ===
  const [showPruebaForm, setShowPruebaForm] = useState(false);
  const [pruebaForm, setPruebaForm] = useState({ tipo: 'concreto' as PruebaLaboratorio['tipo'], descripcion: '', responsable: '' });

  const handleAddPrueba = () => {
    if (!selProyecto) { toast.error('Selecciona un proyecto'); return; }
    const result = pruebaSchema.safeParse(pruebaForm);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(err => { errs[err.path[0] as string] = err.message; });
      setSsFormErrors(errs);
      toast.error(result.error.errors[0].message);
      return;
    }
    setSsFormErrors({});
    const nueva: PruebaLaboratorio = {
      id: Date.now().toString(),
      proyectoId: selProyecto,
      tipo: pruebaForm.tipo,
      descripcion: pruebaForm.descripcion,
      fechaMuestra: todayISO(),
      resultado: 'pendiente',
      responsable: pruebaForm.responsable,
    };
    const updated = [nueva, ...pruebas];
    setPruebas(updated);
    save(PRUEBA_KEY, updated);
    toast.success('Prueba de laboratorio registrada');
    setShowPruebaForm(false);
    setPruebaForm({ tipo: 'concreto', descripcion: '', responsable: '' });
  };

  const actualizarResultadoPrueba = (id: string, resultado: PruebaLaboratorio['resultado']) => {
    const updated = pruebas.map(p => p.id === id ? { ...p, resultado, fechaResultado: todayISO() } : p);
    setPruebas(updated);
    save(PRUEBA_KEY, updated);
    toast.success(`Resultado actualizado: ${resultado}`);
  };

  // === NC FORM ===
  const [showNCForm, setShowNCForm] = useState(false);
  const [ncForm, setNcForm] = useState({ descripcion: '', categoria: 'material' as NoConformidad['categoria'], detectadoPor: '' });

  const handleAddNC = () => {
    if (!selProyecto) { toast.error('Selecciona un proyecto'); return; }
    const result = ncSchema.safeParse(ncForm);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(err => { errs[err.path[0] as string] = err.message; });
      setSsFormErrors(errs);
      toast.error(result.error.errors[0].message);
      return;
    }
    setSsFormErrors({});
    const count = ncs.filter(n => n.proyectoId === selProyecto).length + 1;
    const nueva: NoConformidad = {
      id: Date.now().toString(),
      proyectoId: selProyecto,
      codigo: `NC-${selProyecto.slice(0, 4)}-${String(count).padStart(3, '0')}`,
      descripcion: ncForm.descripcion,
      categoria: ncForm.categoria,
      fechaDeteccion: todayISO(),
      detectadoPor: ncForm.detectadoPor,
      estado: 'detectado',
    };
    const updated = [nueva, ...ncs];
    setNcs(updated);
    save(NC_KEY, updated);
    toast.success(`NC ${nueva.codigo} registrada`);
    setShowNCForm(false);
    setNcForm({ descripcion: '', categoria: 'material', detectadoPor: '' });
  };

  const actualizarEstadoNC = (id: string, estado: NoConformidad['estado'], planAccion?: string) => {
    const updated = ncs.map(n => n.id === id ? { ...n, estado, planAccion: planAccion || n.planAccion, fechaCierre: estado === 'cerrado' ? todayISO() : n.fechaCierre } : n);
    setNcs(updated);
    save(NC_KEY, updated);
    toast.success(`NC actualizada: ${estado}`);
  };

  // === LIBERACION FORM ===
  const [showLibForm, setShowLibForm] = useState(false);
  const [libForm, setLibForm] = useState({ renglonId: '', renglonNombre: '', solicitante: '', supervisor: '' });

  const handleAddLiberacion = () => {
    if (!selProyecto) { toast.error('Selecciona un proyecto'); return; }
    const result = liberacionSchema.safeParse(libForm);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(err => { errs[err.path[0] as string] = err.message; });
      setSsFormErrors(errs);
      toast.error(result.error.errors[0].message);
      return;
    }
    setSsFormErrors({});
    const nueva: LiberacionPartida = {
      id: Date.now().toString(),
      proyectoId: selProyecto,
      renglonId: libForm.renglonId || Date.now().toString(),
      renglonNombre: libForm.renglonNombre,
      fechaSolicitud: todayISO(),
      solicitante: libForm.solicitante || user?.nombre || 'Anónimo',
      supervisor: libForm.supervisor || '',
      checklistAprobado: false,
      estado: 'pendiente',
    };
    const updated = [nueva, ...liberaciones];
    setLiberaciones(updated);
    save(LIB_KEY, updated);
    toast.success('Solicitud de liberación creada');
    setShowLibForm(false);
    setLibForm({ renglonId: '', renglonNombre: '', solicitante: '', supervisor: '' });
  };

  const actualizarLiberacion = (id: string, estado: LiberacionPartida['estado']) => {
    const updated = liberaciones.map(l => l.id === id ? { ...l, estado, fechaLiberacion: estado !== 'pendiente' ? todayISO() : l.fechaLiberacion, checklistAprobado: estado === 'liberado' } : l);
    setLiberaciones(updated);
    save(LIB_KEY, updated);
    toast.success(`Liberación ${estado}`);
  };

  // === ESTADÍSTICAS ===
  const totalIncidentes = incidentes.filter(i => !selProyecto || i.proyectoId === selProyecto).length;
  const incidentesAbiertos = incidentes.filter(i => i.estado !== 'cerrado' && (!selProyecto || i.proyectoId === selProyecto)).length;
  const tasaIncidencia = proyectos.length > 0 ? ((totalIncidentes / proyectos.length) * 100).toFixed(1) : '0';

  const tabs = [
    { id: 'incidentes' as TabSSO, label: 'Incidentes', icon: AlertTriangle },
    { id: 'checklist-sso' as TabSSO, label: 'Checklist SSO', icon: ClipboardList },
    { id: 'estadisticas' as TabSSO, label: 'Estadísticas', icon: Activity },
    { id: 'emergencia' as TabSSO, label: 'Emergencia', icon: AlertTriangle },
    { id: 'pruebas' as TabSSO, label: 'Pruebas Lab', icon: FlaskConical },
    { id: 'nc' as TabSSO, label: 'No Conformidades', icon: XCircle },
    { id: 'liberaciones' as TabSSO, label: 'Liberación', icon: CheckCircle },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Shield className="w-6 h-6 text-red-500" /> SSO & Control de Calidad
        </h1>
        <select
          value={selProyecto}
          onChange={e => setSelProyecto(e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-red-400 bg-white"
        >
          <option value="">— Todos los proyectos —</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                active ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========== INCIDENTES ========== */}
      {tab === 'incidentes' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Reporte de Incidentes
            </h2>
            <button onClick={() => { setShowIncForm(true); resetSsErrors(); }} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600">
              <Plus className="w-3.5 h-3.5" /> Nuevo Incidente
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
                    <option value="accidente">Accidente</option>
                    <option value="cuasi-accidente">Cuasi-accidente</option>
                    <option value="condicion_insegura">Condición Insegura</option>
                    <option value="acto_inseguro">Acto Inseguro</option>
                  </select>
                  {ssFormErrors.tipo && <p className="text-xs text-red-500 mt-1">{ssFormErrors.tipo}</p>}
                </div>
                <button onClick={capturarGeoIncidente} className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-dashed border-red-300 text-xs text-red-600 hover:border-red-500">
                  <MapPin className="w-3.5 h-3.5" /> {incForm.lat ? `📍 ${incForm.lat.toFixed(4)}` : 'Geolocalizar'}
                </button>
              </div>
              <textarea
                value={incForm.descripcion}
                onChange={e => { setIncForm(prev => ({ ...prev, descripcion: e.target.value })); clearSsError('descripcion'); }}
                placeholder="Describe el incidente..."
                className={`w-full px-3 py-2 text-xs rounded-lg border outline-none focus:border-red-400 min-h-[60px] ${ssFormErrors.descripcion ? 'border-red-500 bg-red-50' : 'border-red-200'}`}
              />
              {ssFormErrors.descripcion && <p className="text-xs text-red-500 mt-1">{ssFormErrors.descripcion}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  value={incForm.afectados}
                  onChange={e => { setIncForm(prev => ({ ...prev, afectados: e.target.value })); clearSsError('afectados'); }}
                  placeholder="Afectados"
                  className={`w-full px-3 py-2 text-xs rounded-lg outline-none focus:border-red-400 ${ssFormErrors.afectados ? 'border-red-500 bg-red-50' : 'border-red-200 border'}`}
                />
                <input
                  value={incForm.testigos}
                  onChange={e => setIncForm(prev => ({ ...prev, testigos: e.target.value }))}
                  placeholder="Testigos (opcional)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-red-200 outline-none focus:border-red-400"
                />
              </div>
              <input
                value={incForm.acciones}
                onChange={e => setIncForm(prev => ({ ...prev, acciones: e.target.value }))}
                placeholder="Acciones inmediatas tomadas"
                className="w-full px-3 py-2 text-xs rounded-lg border border-red-200 outline-none focus:border-red-400"
              />
              <div className="flex gap-2">
                <button onClick={handleAddIncidente} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-xs font-semibold">Reportar Incidente</button>
                <button onClick={() => setShowIncForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50">Cancelar</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {incidentes.filter(i => !selProyecto || i.proyectoId === selProyecto).length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Shield className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Sin incidentes registrados</p>
              </div>
            ) : (
              incidentes.filter(i => !selProyecto || i.proyectoId === selProyecto).map(inc => {
                const proy = proyectos.find(p => p.id === inc.proyectoId);
                return (
                  <div key={inc.id} className={`p-3 rounded-lg border ${inc.estado === 'cerrado' ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-100'}`}>
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
                        <p className="text-sm font-medium text-slate-700">{inc.descripcion}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-slate-400">
                          <span>📅 {inc.fecha} {inc.hora}</span>
                          <span>👤 {inc.reportadoPor}</span>
                          {inc.lat && <span>📍 {inc.lat.toFixed(4)}, {inc.lng?.toFixed(4)}</span>}
                          {inc.afectados && <span>👥 {inc.afectados}</span>}
                          {proy && <span className="text-indigo-500">{proy.nombre}</span>}
                        </div>
                        {inc.accionesInmediatas && <p className="text-xs text-slate-500 mt-1 italic">Acciones: {inc.accionesInmediatas}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0 ml-2">
                        {inc.estado === 'abierto' && (
                          <button onClick={() => { const u = incidentes.map(i => i.id === inc.id ? { ...i, estado: 'investigacion' as const } : i); setIncidentes(u); save(INC_KEY, u); }} className="px-2 py-1 bg-amber-500 text-white rounded text-[10px] hover:bg-amber-600">Investigar</button>
                        )}
                        {inc.estado !== 'cerrado' && (
                          <button onClick={() => { const u = incidentes.map(i => i.id === inc.id ? { ...i, estado: 'cerrado' as const } : i); setIncidentes(u); save(INC_KEY, u); }} className="px-2 py-1 bg-emerald-500 text-white rounded text-[10px] hover:bg-emerald-600">Cerrar</button>
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
          <h2 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-amber-500" /> Checklist Diario SSO
          </h2>
          <p className="text-xs text-slate-400 mb-3">Lista de verificación de seguridad diaria obligatoria antes de iniciar labores.</p>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <div className="space-y-2">
              {[
                { id: 'epi', label: '🧢 Todo el personal usa EPP completo (casco, chaleco, botas)' },
                { id: 'senalizacion', label: '⚠️ Señalización de seguridad visible en áreas de riesgo' },
                { id: 'extintores', label: '🧯 Extintores en sitio, con carga vigente' },
                { id: 'botiquin', label: '🩹 Botiquín de primeros auxilios completo' },
                { id: 'andamios', label: '🏗️ Andamios/plataformas estables con barandas' },
                { id: 'electrica', label: '⚡ Instalaciones eléctricas protegidas (no cables expuestos)' },
                { id: 'orden', label: '🧹 Área de trabajo ordenada y libre de obstáculos' },
                { id: 'excavacion', label: '🕳️ Excavaciones con apuntalamiento y señalización' },
                { id: 'alturas', label: '🔝 Trabajos en altura con arnés y línea de vida' },
                { id: 'herramientas', label: '🔧 Herramientas manuales y eléctricas en buen estado' },
                { id: 'induccion', label: '📋 Inducción SSO firmada por todo el personal nuevo' },
              ].map(item => (
                <label key={item.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400" />
                  <span className="text-xs text-slate-700">{item.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <input placeholder="Nombre del supervisor" className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-amber-400" />
              </div>
              <button onClick={() => toast.success('✅ Checklist SSO registrado')} className="px-4 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600">
                <Check className="w-3.5 h-3.5 inline mr-1" /> Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== ESTADÍSTICAS ========== */}
      {tab === 'estadisticas' && (
        <div>
          <h2 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-500" /> Estadísticas SSO
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-xl p-4 border border-slate-100">
              <div className="text-[10px] text-slate-400">Días Sin Accidentes</div>
              <div className="text-3xl font-black text-emerald-600">{diasSinAccidentes}</div>
              <div className="text-[10px] text-slate-400 mt-1">días</div>
            </div>
            <div className={`bg-white rounded-xl p-4 border ${totalIncidentes > 0 ? 'border-red-200' : 'border-slate-100'}`}>
              <div className="text-[10px] text-slate-400">Total Incidentes</div>
              <div className={`text-3xl font-black ${totalIncidentes > 0 ? 'text-red-600' : 'text-slate-800'}`}>{totalIncidentes}</div>
              <div className="text-[10px] text-slate-400 mt-1">{incidentesAbiertos} abiertos · {totalIncidentes - incidentesAbiertos} cerrados</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-100">
              <div className="text-[10px] text-slate-400">Tasa de Incidencia</div>
              <div className="text-3xl font-black text-orange-600">{tasaIncidencia}%</div>
              <div className="text-[10px] text-slate-400 mt-1">incidentes por proyecto</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h3 className="font-bold text-xs text-slate-700 mb-3">Incidentes por Tipo</h3>
            <div className="space-y-2">
              {(['accidente', 'cuasi-accidente', 'condicion_insegura', 'acto_inseguro'] as const).map(tipo => {
                const count = incidentes.filter(i => i.tipo === tipo && (!selProyecto || i.proyectoId === selProyecto)).length;
                const maxCount = Math.max(1, ...(['accidente', 'cuasi-accidente', 'condicion_insegura', 'acto_inseguro'] as const).map(t => incidentes.filter(i => i.tipo === t && (!selProyecto || i.proyectoId === selProyecto)).length));
                return (
                  <div key={tipo} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 w-28">{tipo.replace(/_/g, ' ')}</span>
                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${tipo === 'accidente' ? 'bg-red-400' : tipo === 'cuasi-accidente' ? 'bg-amber-400' : 'bg-orange-400'}`}
                        style={{ width: `${(count / maxCount) * 100}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========== EMERGENCIA ========== */}
      {tab === 'emergencia' && (
        <div className="text-center py-8">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-xl font-black text-red-600">Botón de Emergencia</h2>
            <p className="text-sm text-slate-500">Activa este botón en caso de una emergencia real en obra. Se notificará a todos los supervisores y se enviará tu ubicación.</p>
            <button
              onClick={() => {
                if (!selProyecto) { toast.error('Selecciona un proyecto primero'); return; }
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const msg = `🚨 EMERGENCIA en ${proyectoActual?.nombre || 'obra'} - Ubicación: https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
                      toast.error(msg, { duration: 10000 });
                      addNotificacion('general', `🚨 Emergencia: ${proyectoActual?.nombre || 'Obra'}`, `¡Emergencia reportada! Ubicación capturada.`, selProyecto);
                    },
                    () => {
                      toast.error('🚨 EMERGENCIA reportada (sin ubicación)', { duration: 10000 });
                      addNotificacion('general', '🚨 Emergencia en obra', 'Se ha activado el botón de emergencia', selProyecto);
                    },
                    { enableHighAccuracy: true, timeout: 10000 }
                  );
                } else {
                  toast.error('🚨 EMERGENCIA reportada', { duration: 10000 });
                  addNotificacion('general', '🚨 Emergencia en obra', 'Se ha activado el botón de emergencia', selProyecto);
                }
              }}
              className="w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white font-black text-lg shadow-2xl shadow-red-500/50 hover:shadow-red-500/70 hover:scale-105 active:scale-95 transition-all duration-200 animate-pulse flex items-center justify-center flex-col"
            >
              <AlertTriangle className="w-10 h-10 mb-1" />
              <span className="text-sm">EMERGENCIA</span>
            </button>
            <p className="text-[10px] text-slate-400">Se compartirá tu ubicación con los equipos de respuesta</p>
          </div>
        </div>
      )}

      {/* ========== PRUEBAS LABORATORIO ========== */}
      {tab === 'pruebas' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-purple-500" /> Pruebas de Laboratorio
            </h2>
            <button onClick={() => { setShowPruebaForm(true); resetSsErrors(); }} className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-medium hover:bg-purple-600">
              <Plus className="w-3.5 h-3.5" /> Nueva Prueba
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
                    <option value="concreto">Concreto</option>
                    <option value="suelos">Suelos</option>
                    <option value="acero">Acero</option>
                    <option value="asfalto">Asfalto</option>
                    <option value="otro">Otro</option>
                  </select>
                  {ssFormErrors.tipo && <p className="text-xs text-red-500 mt-1">{ssFormErrors.tipo}</p>}
                </div>
                <div>
                  <input
                    value={pruebaForm.responsable}
                    onChange={e => { setPruebaForm(prev => ({ ...prev, responsable: e.target.value })); clearSsError('responsable'); }}
                    placeholder="Responsable"
                    className={`w-full px-3 py-2 rounded-lg text-xs outline-none focus:border-purple-400 ${ssFormErrors.responsable ? 'border-red-500 bg-red-50' : 'border-purple-200 border'}`}
                  />
                  {ssFormErrors.responsable && <p className="text-xs text-red-500 mt-1">{ssFormErrors.responsable}</p>}
                </div>
              </div>
              <div>
                <input
                  value={pruebaForm.descripcion}
                  onChange={e => { setPruebaForm(prev => ({ ...prev, descripcion: e.target.value })); clearSsError('descripcion'); }}
                  placeholder="Descripción de la prueba (ej: Resistencia concreto 28 días)"
                  className={`w-full px-3 py-2 text-xs rounded-lg outline-none focus:border-purple-400 ${ssFormErrors.descripcion ? 'border-red-500 bg-red-50' : 'border-purple-200 border'}`}
                />
                {ssFormErrors.descripcion && <p className="text-xs text-red-500 mt-1">{ssFormErrors.descripcion}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddPrueba} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-xs font-semibold">Registrar Prueba</button>
                <button onClick={() => setShowPruebaForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-600">Cancelar</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {pruebas.filter(p => !selProyecto || p.proyectoId === selProyecto).length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Sin pruebas registradas</p>
              </div>
            ) : (
              pruebas.filter(p => !selProyecto || p.proyectoId === selProyecto).map(p => (
                <div key={p.id} className="p-3 bg-white rounded-lg border border-slate-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 font-medium">{p.tipo}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          p.resultado === 'pasa' ? 'bg-emerald-50 text-emerald-600' : p.resultado === 'no_pasa' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'
                        }`}>{p.resultado.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-700">{p.descripcion}</p>
                      <div className="flex gap-2 mt-1 text-[10px] text-slate-400">
                        <span>📅 Muestra: {p.fechaMuestra}</span>
                        {p.fechaResultado && <span>📊 Resultado: {p.fechaResultado}</span>}
                        <span>👤 {p.responsable}</span>
                      </div>
                    </div>
                    {p.resultado === 'pendiente' && (
                      <div className="flex gap-1 shrink-0 ml-2">
                        <button onClick={() => actualizarResultadoPrueba(p.id, 'pasa')} className="px-2 py-1 bg-emerald-500 text-white rounded text-[10px] hover:bg-emerald-600">Pasa</button>
                        <button onClick={() => actualizarResultadoPrueba(p.id, 'no_pasa')} className="px-2 py-1 bg-red-500 text-white rounded text-[10px] hover:bg-red-600">No Pasa</button>
                      </div>
                    )}
                  </div>
                  {p.observaciones && <p className="text-[10px] text-slate-500 mt-1">{p.observaciones}</p>}
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
            <h2 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-500" /> No Conformidades (NC)
            </h2>
            <button onClick={() => { setShowNCForm(true); resetSsErrors(); }} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600">
              <Plus className="w-3.5 h-3.5" /> Nueva NC
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
                    <option value="material">Material</option>
                    <option value="proceso">Proceso</option>
                    <option value="documento">Documentación</option>
                    <option value="instalacion">Instalación</option>
                    <option value="otro">Otro</option>
                  </select>
                  {ssFormErrors.categoria && <p className="text-xs text-red-500 mt-1">{ssFormErrors.categoria}</p>}
                </div>
                <div>
                  <input
                    value={ncForm.detectadoPor}
                    onChange={e => { setNcForm(prev => ({ ...prev, detectadoPor: e.target.value })); clearSsError('detectadoPor'); }}
                    placeholder="Detectado por"
                    className={`w-full px-3 py-2 rounded-lg text-xs outline-none focus:border-red-400 ${ssFormErrors.detectadoPor ? 'border-red-500 bg-red-50' : 'border-red-200 border'}`}
                  />
                  {ssFormErrors.detectadoPor && <p className="text-xs text-red-500 mt-1">{ssFormErrors.detectadoPor}</p>}
                </div>
              </div>
              <div>
                <textarea
                  value={ncForm.descripcion}
                  onChange={e => { setNcForm(prev => ({ ...prev, descripcion: e.target.value })); clearSsError('descripcion'); }}
                  placeholder="Describe la no conformidad..."
                  className={`w-full px-3 py-2 text-xs rounded-lg outline-none focus:border-red-400 min-h-[60px] ${ssFormErrors.descripcion ? 'border-red-500 bg-red-50' : 'border-red-200 border'}`}
                />
                {ssFormErrors.descripcion && <p className="text-xs text-red-500 mt-1">{ssFormErrors.descripcion}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddNC} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-xs font-semibold">Registrar NC</button>
                <button onClick={() => setShowNCForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-600">Cancelar</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {ncs.filter(n => !selProyecto || n.proyectoId === selProyecto).length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <XCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Sin no conformidades</p>
              </div>
            ) : (
              ncs.filter(n => !selProyecto || n.proyectoId === selProyecto).map(nc => (
                <div key={nc.id} className={`p-3 rounded-lg border ${nc.estado === 'cerrado' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{nc.codigo}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{nc.categoria}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          nc.estado === 'cerrado' ? 'bg-emerald-50 text-emerald-600' : nc.estado === 'plan_accion' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'
                        }`}>{nc.estado.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-700">{nc.descripcion}</p>
                      <div className="flex gap-2 mt-1 text-[10px] text-slate-400">
                        <span>📅 {nc.fechaDeteccion}</span>
                        <span>👤 {nc.detectadoPor}</span>
                      </div>
                      {nc.planAccion && <p className="text-xs text-slate-600 mt-1">📋 Plan: {nc.planAccion}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2 flex-col">
                      {nc.estado === 'detectado' && (
                        <button onClick={() => {
                          const plan = prompt('Describe el plan de acción:');
                          if (plan) actualizarEstadoNC(nc.id, 'plan_accion', plan);
                        }} className="px-2 py-1 bg-amber-500 text-white rounded text-[10px] hover:bg-amber-600">Plan</button>
                      )}
                      {nc.estado !== 'cerrado' && (
                        <button onClick={() => actualizarEstadoNC(nc.id, 'cerrado')} className="px-2 py-1 bg-emerald-500 text-white rounded text-[10px] hover:bg-emerald-600">Cerrar</button>
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
            <h2 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Liberación de Partidas
            </h2>
            <button onClick={() => { setShowLibForm(true); resetSsErrors(); }} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600">
              <Plus className="w-3.5 h-3.5" /> Solicitar Liberación
            </button>
          </div>

          {showLibForm && (
            <div className="bg-emerald-50 rounded-xl p-4 mb-4 border border-emerald-200 space-y-2">
              <div>
                <input
                  value={libForm.renglonNombre}
                  onChange={e => { setLibForm(prev => ({ ...prev, renglonNombre: e.target.value })); clearSsError('renglonNombre'); }}
                  placeholder="Actividad / Partida a liberar"
                  className={`w-full px-3 py-2 text-xs rounded-lg outline-none focus:border-emerald-400 ${ssFormErrors.renglonNombre ? 'border-red-500 bg-red-50' : 'border-emerald-200 border'}`}
                />
                {ssFormErrors.renglonNombre && <p className="text-xs text-red-500 mt-1">{ssFormErrors.renglonNombre}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <input
                    value={libForm.solicitante}
                    onChange={e => { setLibForm(prev => ({ ...prev, solicitante: e.target.value })); clearSsError('solicitante'); }}
                    placeholder="Solicitante"
                    className={`w-full px-3 py-2 text-xs rounded-lg outline-none focus:border-emerald-400 ${ssFormErrors.solicitante ? 'border-red-500 bg-red-50' : 'border-emerald-200 border'}`}
                  />
                  {ssFormErrors.solicitante && <p className="text-xs text-red-500 mt-1">{ssFormErrors.solicitante}</p>}
                </div>
                <div>
                  <input
                    value={libForm.supervisor}
                    onChange={e => { setLibForm(prev => ({ ...prev, supervisor: e.target.value })); clearSsError('supervisor'); }}
                    placeholder="Supervisor"
                    className={`w-full px-3 py-2 text-xs rounded-lg outline-none focus:border-emerald-400 ${ssFormErrors.supervisor ? 'border-red-500 bg-red-50' : 'border-emerald-200 border'}`}
                  />
                  {ssFormErrors.supervisor && <p className="text-xs text-red-500 mt-1">{ssFormErrors.supervisor}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddLiberacion} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-xs font-semibold">Solicitar Liberación</button>
                <button onClick={() => setShowLibForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-600">Cancelar</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {liberaciones.filter(l => !selProyecto || l.proyectoId === selProyecto).length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Layers className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Sin solicitudes de liberación</p>
              </div>
            ) : (
              liberaciones.filter(l => !selProyecto || l.proyectoId === selProyecto).map(l => (
                <div key={l.id} className={`p-3 rounded-lg border ${l.estado === 'liberado' ? 'bg-emerald-50 border-emerald-200' : l.estado === 'rechazado' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          l.estado === 'liberado' ? 'bg-emerald-100 text-emerald-600' : l.estado === 'rechazado' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                        }`}>{l.estado}</span>
                        {l.checklistAprobado && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">✅ Checklist OK</span>}
                      </div>
                      <p className="text-sm font-medium text-slate-700">{l.renglonNombre}</p>
                      <div className="flex gap-2 mt-1 text-[10px] text-slate-400">
                        <span>📅 Sol: {l.fechaSolicitud}</span>
                        {l.fechaLiberacion && <span>✅ Lib: {l.fechaLiberacion}</span>}
                        <span>👤 {l.solicitante}</span>
                        {l.supervisor && <span>🔍 {l.supervisor}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2 flex-col">
                      {l.estado === 'pendiente' && (
                        <>
                          <button onClick={() => actualizarLiberacion(l.id, 'liberado')} className="px-2 py-1 bg-emerald-500 text-white rounded text-[10px] hover:bg-emerald-600">Liberar</button>
                          <button onClick={() => actualizarLiberacion(l.id, 'rechazado')} className="px-2 py-1 bg-red-500 text-white rounded text-[10px] hover:bg-red-600">Rechazar</button>
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