import { Skeleton } from '@/components/ui/skeleton';
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { Riesgo } from '../types';
import { AlertTriangle, Shield, Plus, X, Filter, Clock, CheckCircle, Crosshair, DollarSign, Calendar, User, Cloud } from 'lucide-react';
import { INPUT } from '../ui';
import { toast } from 'sonner';
import { confirmAction } from '@/lib/confirm-action';
import { todayISO } from '../utils';
import { canUserDelete } from '@/lib/security';
import { calculateWeatherImpact } from '../services/weatherService';

type RProb = Riesgo['probabilidad'];
type RImp = Riesgo['impacto'];
type RTipo = Riesgo['tipo'];
type REstado = Riesgo['estado'];

const calcularNivel = (prob: number, imp: number): Riesgo['nivel'] => {
  const score = prob * imp;
  if (score >= 15) return 'critico';
  if (score >= 8) return 'alto';
  if (score >= 4) return 'medio';
  return 'bajo';
};

const Riesgos: React.FC = () => {
  const { t } = useTranslation();
  const { proyectos, currentProjectId, setCurrentProjectId, riesgos, addRiesgo, updateRiesgo, deleteRiesgo, addNotificacion, user, proyectoWeather } = useErp();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setLoading(false); }, []);
  const [form, setForm] = useState({
    proyectoId: '',
    nombre: '',
    descripcion: '',
    tipo: 'tecnico' as RTipo,
    probabilidad: 2 as RProb,
    impacto: 2 as RImp,
    planMitigacion: '',
    responsable: '',
    costoSoporte: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentProjectId && !form.proyectoId) {
      setForm(prev => ({ ...prev, proyectoId: currentProjectId }));
    }
  }, [currentProjectId, form.proyectoId]);

  const notifyCriticos = (todos: Riesgo[]) => {
    const criticos = todos.filter(ri => ri.nivel === 'critico' && ri.estado === 'identificado');
    if (criticos.length > 0 && currentProjectId) {
      const proy = proyectos.find(p => p.id === currentProjectId);
      addNotificacion('general', 'Riesgos críticos sin mitigar', `${criticos.length} riesgo(s) crítico(s) en ${proy?.nombre || 'el proyecto'}`, currentProjectId || undefined);
    }
  };

  const agregar = () => {
    const errors: Record<string, string> = {};
    if (!form.nombre.trim()) errors.nombre = t('riesgos.nombre_requerido', 'Nombre requerido');
    if (!form.proyectoId) errors.proyectoId = t('riesgos.proyecto_requerido', 'Proyecto requerido');
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    setFormErrors({});
    const nuevo: Riesgo = {
      id: crypto.randomUUID(),
      proyectoId: form.proyectoId,
      nombre: form.nombre,
      descripcion: form.descripcion,
      tipo: form.tipo,
      probabilidad: form.probabilidad,
      impacto: form.impacto,
      nivel: calcularNivel(form.probabilidad, form.impacto),
      planMitigacion: form.planMitigacion,
      responsable: form.responsable,
      fechaIdentificacion: todayISO(),
      estado: 'identificado',
      costoSoporte: form.costoSoporte || undefined,
      createdAt: new Date().toISOString(),
    };
    addRiesgo(nuevo);
    notifyCriticos([nuevo, ...riesgos]);
    toast.success(t('riesgos.registrado', 'Riesgo registrado'));
    setShowForm(false);
    setForm({ proyectoId: currentProjectId || '', nombre: '', descripcion: '', tipo: 'tecnico', probabilidad: 2, impacto: 2, planMitigacion: '', responsable: '', costoSoporte: 0 });
  };

  const actualizarEstado = (id: string, estado: Riesgo['estado']) => {
    updateRiesgo(id, { estado });
    if (estado === 'materializado') {
      const riesgo = riesgos.find(r => r.id === id);
      addNotificacion('general', 'Riesgo materializado', `"${riesgo?.nombre}" se ha materializado.`, riesgo?.proyectoId);
    }
  };

  const eliminar = async (id: string) => {
    if (!canUserDelete(user?.rol)) {
      toast.error(t('common.sin_permisos', 'Sin permisos para eliminar'));
      return;
    }
    await confirmAction({ title: t('riesgos.confirmar_eliminacion', 'Confirmar eliminación'), content: t('riesgos.confirmar_eliminar', '¿Eliminar este riesgo?'), centered: true, okText: t('riesgos.si_eliminar', 'Sí, eliminar'), cancelText: t('riesgos.cancelar', 'Cancelar') });
    deleteRiesgo(id);
  };

  const nivelColor = (n: Riesgo['nivel']) => {
    const map = { bajo: 'bg-emerald-50 text-emerald-600', medio: 'bg-amber-50 text-amber-600', alto: 'bg-orange-50 text-orange-600', critico: 'bg-red-50 text-red-600' };
    return map[n];
  };

  const riesgosFiltrados = useMemo(() => {
    if (!currentProjectId) return riesgos;
    return riesgos.filter(r => r.proyectoId === currentProjectId);
  }, [riesgos, currentProjectId]);

  const proyActual = currentProjectId ? proyectos.find(p => p.id === currentProjectId) : null;
  const mitigados = useMemo(() => riesgosFiltrados.filter((r: Riesgo) => r.estado === 'mitigado'), [riesgosFiltrados]);
  const altos = useMemo(() => riesgosFiltrados.filter(r => r.nivel === 'alto' || r.nivel === 'critico'), [riesgosFiltrados]);
  const enSeguimiento = useMemo(() => riesgosFiltrados.filter(r => r.estado === 'en_mitigacion'), [riesgosFiltrados]);

  // Riesgos climáticos automáticos derivados del pronóstico
  const riesgosClimaticos = useMemo(() => {
    if (!currentProjectId) return [];
    const weatherRec = proyectoWeather?.find(w => w.proyectoId === currentProjectId);
    if (!weatherRec?.weatherData) return [];
    const impact = weatherRec.impact ?? calculateWeatherImpact(weatherRec.weatherData);
    if (impact.level === 'low') return [];
    return impact.factors.map((factor, i) => ({
      id: `weather-auto-${i}`,
      factor,
      recommendation: impact.recommendations[i] ?? impact.recommendations[0] ?? '',
      level: impact.level,
      score: impact.score,
    }));
  }, [currentProjectId, proyectoWeather]);

  const agregarRiesgoClimatico = (factor: string, recommendation: string) => {
    const nuevo: Riesgo = {
      id: crypto.randomUUID(),
      proyectoId: currentProjectId || '',
      nombre: `Riesgo climático: ${factor}`,
      descripcion: factor,
      tipo: 'ambiental',
      probabilidad: 3,
      impacto: 3,
      nivel: calcularNivel(3, 3),
      planMitigacion: recommendation,
      responsable: '',
      fechaIdentificacion: todayISO(),
      estado: 'identificado',
      createdAt: new Date().toISOString(),
    };
    addRiesgo(nuevo);
    toast.success(t('riesgos.registrado', 'Riesgo registrado'));
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
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" /> {t('riesgos.titulo', 'Gestión de Riesgos')}
            {proyActual && <span className="text-sm font-normal text-muted-foreground">— {proyActual.nombre}</span>}
          </h1>
          <p className="text-xs text-muted-foreground">{t('riesgos.descripcion', 'Identificación, evaluación y mitigación de riesgos del proyecto')}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
          <Plus className="w-4 h-4" /> {t('riesgos.nuevo', 'Nuevo Riesgo')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">{t('riesgos.total_riesgos')}</span></div>
          </div>
          <div className="text-xl font-bold text-foreground mt-1">{riesgosFiltrados.length}</div>
          <div className="text-[10px] text-muted-foreground mt-1">{riesgosFiltrados.length > 0 ? `${Math.round((mitigados.length / riesgosFiltrados.length) * 100)}% ${t('riesgos.mitigados')}` : '—'}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-xs text-muted-foreground">Alto impacto</span></div>
          </div>
          <div className="text-xl font-bold text-red-600 mt-1">{altos.length}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{t('riesgos.mitigacion_prioritaria')}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /><span className="text-xs text-muted-foreground">En seguimiento</span></div>
          </div>
          <div className="text-xl font-bold text-amber-600 mt-1">{enSeguimiento.length}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{t('riesgos.monitoreo_activo')}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /><span className="text-xs text-muted-foreground">Mitigados</span></div>
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{mitigados.length}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{t('riesgos.controles_aplicados')}</div>
        </div>
      </div>

      {/* Filtro global por proyecto */}
      {proyectos.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select value={currentProjectId || ''} onChange={e => setCurrentProjectId(e.target.value || null)} className={`${INPUT} max-w-xs`}>
            <option value="">{t('riesgos.todos_proyectos', 'Todos los proyectos')}</option>
            {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
      )}

      <div className="bg-card rounded-xl p-4 border border-border mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2"><Crosshair className="w-4 h-4 text-red-500" aria-hidden="true" /> {t('riesgos.matriz_calor', 'Matriz de Calor (Probabilidad × Impacto)')}</h3>
          <div className="flex gap-2 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{t('riesgos.bajo', 'Bajo')}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />{t('riesgos.medio', 'Medio')}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" />{t('riesgos.alto', 'Alto')}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />{t('riesgos.critico', 'Crítico')}</span>
          </div>
        </div>
        <div className="flex gap-4 items-start">
          <div className="flex-shrink-0">
            <div className="text-[10px] text-muted-foreground text-center mb-1">Impacto →</div>
            <div className="overflow-x-auto -mx-1 px-1">
              <div className="grid grid-cols-5 gap-0.5" style={{ gridTemplateColumns: 'repeat(5, 44px)' }}>
              {[5,4,3,2,1].map(prob => 
                [1,2,3,4,5].map(imp => {
                  const nivel = calcularNivel(prob as 1|2|3|4|5, imp as 1|2|3|4|5);
                  const colorMap: Record<string, string> = { bajo: 'bg-emerald-100', medio: 'bg-amber-100', alto: 'bg-orange-100', critico: 'bg-red-100' };
                  const dotColorMap: Record<string, string> = { bajo: 'bg-emerald-500', medio: 'bg-amber-500', alto: 'bg-orange-500', critico: 'bg-red-500' };
                  const riesgosEnCelda = riesgosFiltrados.filter(r => r.probabilidad === prob && r.impacto === imp && r.estado !== 'mitigado');
                  return (
                    <div key={`${prob}-${imp}`} className={`w-[44px] h-[44px] rounded relative ${colorMap[nivel]} flex items-center justify-center font-bold text-[10px]`}>
                      <span className="text-muted-foreground">{prob * imp}</span>
                      {riesgosEnCelda.length > 0 && (
                        <div className="absolute -top-1 -right-1 bg-slate-800 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-bold shadow">
                          {riesgosEnCelda.length}
                        </div>
                      )}
                      {riesgosEnCelda.length > 0 && riesgosEnCelda.length <= 3 && (
                        <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                          {riesgosEnCelda.slice(0, 3).map((_, i) => (
                            <span key={i} className={`w-2 h-2 rounded-full ${dotColorMap[nivel]} shadow-sm border border-white`} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground text-center mt-1">← {t('riesgos.probabilidad_leyenda', 'Probabilidad (1-5 arriba a abajo)')}</div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-2">{t('riesgos.riesgos_por_nivel', 'Riesgos por nivel:')}</p>
            <div className="space-y-1.5">
              {(['critico', 'alto', 'medio', 'bajo'] as const).map(nivel => {
                const count = riesgosFiltrados.filter(r => r.nivel === nivel && r.estado !== 'mitigado').length;
                const colorMap: Record<string, string> = { bajo: 'bg-emerald-100 text-emerald-700', medio: 'bg-amber-100 text-amber-700', alto: 'bg-orange-100 text-orange-700', critico: 'bg-red-100 text-red-700' };
                return (
                  <div key={nivel} className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs ${colorMap[nivel]}`}>
                    <span className="font-semibold capitalize">{nivel}</span>
                    <span className="font-bold">{count} {t('riesgos.riesgo', 'riesgo')}{count !== 1 ? 's' : ''}</span>
                  </div>
                );
              })}
            </div>
            {riesgosFiltrados.filter(r => r.estado !== 'mitigado').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" aria-hidden="true" />
                <p className="text-xs">{t('riesgos.sin_riesgos_activos', 'Sin riesgos activos')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {riesgosClimaticos.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4 mb-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-3">
            <Cloud className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-blue-700 dark:text-blue-300">
              {t('riesgos.riesgos_climaticos', 'Riesgos Climáticos Detectados')}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200 ml-auto">
              {riesgosClimaticos.length} {t('riesgos.automaticos', 'automáticos')}
            </span>
          </div>
          <div className="space-y-2">
            {riesgosClimaticos.map(rc => {
              const yaRegistrado = riesgosFiltrados.some(r =>
                r.tipo === 'ambiental' && r.descripcion === rc.factor
              );
              return (
                <div key={rc.id} className="flex items-start justify-between gap-2 bg-white/60 dark:bg-black/20 rounded-lg p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{rc.factor}</p>
                    {rc.recommendation && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{rc.recommendation}</p>
                    )}
                  </div>
                  {yaRegistrado ? (
                    <span className="text-[10px] text-green-600 flex items-center gap-0.5 shrink-0">
                      <CheckCircle className="w-3 h-3" /> {t('riesgos.registrado_ya', 'Registrado')}
                    </span>
                  ) : (
                    <button
                      onClick={() => agregarRiesgoClimatico(rc.factor, rc.recommendation)}
                      className="text-[10px] px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shrink-0"
                    >
                      + {t('riesgos.agregar', 'Agregar')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-200 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder={t('riesgos.nombre_placeholder', 'Nombre del riesgo *')} className={INPUT} aria-invalid={!!formErrors.nombre} />
              {formErrors.nombre && <p className="text-xs text-red-500 mt-0.5">{formErrors.nombre}</p>}
            </div>
            <div>
              <select value={form.proyectoId} onChange={e => setForm(p => ({ ...p, proyectoId: e.target.value }))} className={INPUT} aria-invalid={!!formErrors.proyectoId}>
                <option value="">{t('riesgos.seleccionar_proyecto', 'Seleccionar proyecto *')}</option>
                {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              {formErrors.proyectoId && <p className="text-xs text-red-500 mt-0.5">{formErrors.proyectoId}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value as RTipo }))} className={INPUT}>
              <option value="tecnico">{t('riesgos.tipo_tecnico', 'Técnico')}</option>
              <option value="financiero">{t('riesgos.tipo_financiero', 'Financiero')}</option>
              <option value="cronograma">{t('riesgos.tipo_cronograma', 'Cronograma')}</option>
              <option value="legal">{t('riesgos.tipo_legal', 'Legal')}</option>
              <option value="ambiental">{t('riesgos.tipo_ambiental', 'Ambiental')}</option>
              <option value="seguridad">{t('riesgos.tipo_seguridad', 'Seguridad')}</option>
              <option value="otro">{t('riesgos.tipo_otro', 'Otro')}</option>
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">{t('riesgos.probabilidad', 'Probabilidad')} (1-5)</label>
              <input type="number" inputMode="decimal" min={1} max={5} value={form.probabilidad} onChange={e => setForm(p => ({ ...p, probabilidad: Math.min(5, Math.max(1, +e.target.value)) as RProb }))} className={INPUT} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">{t('riesgos.impacto', 'Impacto')} (1-5)</label>
              <input type="number" inputMode="decimal" min={1} max={5} value={form.impacto} onChange={e => setForm(p => ({ ...p, impacto: Math.min(5, Math.max(1, +e.target.value)) as RImp }))} className={INPUT} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <textarea value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} placeholder={t('riesgos.descripcion_placeholder', 'Descripción del riesgo')} className={`${INPUT} min-h-[60px]`} />
            <textarea value={form.planMitigacion} onChange={e => setForm(p => ({ ...p, planMitigacion: e.target.value }))} placeholder={t('riesgos.mitigacion_placeholder', 'Plan de mitigación')} className={`${INPUT} min-h-[60px]`} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input value={form.responsable} onChange={e => setForm(p => ({ ...p, responsable: e.target.value }))} placeholder={t('riesgos.responsable_placeholder', 'Responsable')} className={INPUT} />
            <input type="number" inputMode="decimal" value={form.costoSoporte || ''} onChange={e => setForm(p => ({ ...p, costoSoporte: +e.target.value }))} placeholder={t('riesgos.costo_soporte_placeholder', 'Costo estimado de soporte Q')} className={INPUT} />
          </div>
          <div className="flex gap-2">
            <button onClick={agregar} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg text-xs font-semibold">{t('riesgos.registrar', 'Registrar Riesgo')}</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-xs text-muted-foreground">{t('riesgos.cancelar', 'Cancelar')}</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {riesgosFiltrados.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Shield className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">{t('riesgos.sin_riesgos_filtro', 'Sin riesgos para')} {proyActual?.nombre || t('riesgos.filtro_actual', 'el filtro actual')}. {t('riesgos.identifica_primero', 'Identifica el primero')}</p>
          </div>
        ) : riesgosFiltrados.map(r => (
          <div key={r.id} className={`bg-card rounded-xl border p-4 ${nivelColor(r.nivel).split(' ')[0]} bg-opacity-20`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${nivelColor(r.nivel)}`}>{r.nivel.toUpperCase()}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{r.tipo}</span>
                  <span className="text-xs text-muted-foreground">{proyectos.find(p => p.id === r.proyectoId)?.nombre || '—'}</span>
                </div>
                <p className="text-sm font-semibold text-foreground truncate" title={r.nombre}>{r.nombre}</p>
                {r.descripcion && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3">{r.descripcion}</p>}
                <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                  <span>P:{r.probabilidad} I:{r.impacto} = {r.probabilidad * r.impacto}pts</span>
                  {r.responsable && <span className="flex items-center gap-1"><User className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> {r.responsable}</span>}
                  {r.costoSoporte ? <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> Q{r.costoSoporte.toLocaleString()}</span> : null}
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> {r.fechaIdentificacion}</span>
                </div>
                {r.planMitigacion && <div className="mt-1 text-xs text-muted-foreground italic flex items-center gap-1"><Shield className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> {r.planMitigacion}</div>}
              </div>
              <div className="flex gap-1 shrink-0 ml-2">
                <select value={r.estado} onChange={e => actualizarEstado(r.id, e.target.value as REstado)}
                  className={`text-xs px-1.5 py-1 rounded-lg border ${r.estado === 'mitigado' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : r.estado === 'materializado' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                  <option value="identificado">{t('riesgos.estado_identificado', 'Identificado')}</option>
                  <option value="en_mitigacion">{t('riesgos.estado_en_mitigacion', 'En mitigación')}</option>
                  <option value="mitigado">{t('riesgos.estado_mitigado', 'Mitigado')}</option>
                  <option value="materializado">{t('riesgos.estado_materializado', 'Materializado')}</option>
                </select>
                 <button onClick={() => eliminar(r.id)} className="p-1 text-slate-300 hover:text-red-500" aria-label={t('riesgos.eliminar')}><X className="w-3 h-3" aria-hidden="true" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Riesgos;

