import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { fmtQ, formatDateFmt } from '../utils';
import { Calendar, AlertTriangle, DollarSign, Activity, Zap, CheckCircle, Cloud, CloudRain, Wind } from 'lucide-react';
import { calculateWeatherImpact } from '../services/weatherService';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardPredictivo: React.FC = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);
  const { t } = useTranslation();
  const { proyectos, movimientos, presupuestos, avances, empleados, currentProjectId, setCurrentProjectId, proyectoWeather } = useErp();

  const proyecto = proyectos.find(p => p.id === currentProjectId);
  const presupuesto = presupuestos.find(p => p.proyectoId === currentProjectId);

  // --- Cálculos ---
  const gastos = useMemo(() => movimientos.filter(m => m.proyectoId === currentProjectId && (m.tipo === 'gasto' || m.tipo === 'egreso')), [movimientos, currentProjectId]);
  const totalGastos = useMemo(() => gastos.reduce((a, m) => a + (m.costoTotal ?? m.monto), 0), [gastos]);

  // Costo final proyectado (EAC = AC + (BAC - EV) / CPI)
  const BAC = proyecto?.presupuestoTotal || presupuesto?.totalCalculado || 0;
  const avanceReal = proyecto?.avanceFisico || 0;
  const EV = BAC * (avanceReal / 100);
  const CPI = EV > 0 ? EV / Math.max(totalGastos, 1) : 1;
  const EAC = CPI > 0 ? BAC / CPI : BAC;
  const sobrecosto = EAC - BAC;

  // Fecha de finalización estimada
  const fechaInicio = proyecto?.fechaInicio;
  const fechaFin = proyecto?.fechaFin;
  const diasTranscurridos = fechaInicio ? Math.round((Date.now() - new Date(fechaInicio).getTime()) / 86400000) : 0;
  const diasTotales = fechaInicio && fechaFin ? Math.round((new Date(fechaFin).getTime() - new Date(fechaInicio).getTime()) / 86400000) : 1;
  const ritmoEsperado = diasTotales > 0 ? 100 / diasTotales : 0;
  const ritmoActual = diasTranscurridos > 0 ? avanceReal / diasTranscurridos : 0;
  const diasEstimadosRestantes = ritmoActual > 0 ? (100 - avanceReal) / ritmoActual : 0;
  const fechaEstimadaFin = new Date(Date.now() + diasEstimadosRestantes * 86400000);
  const desviacionDias = diasEstimadosRestantes - (diasTotales - diasTranscurridos);

  // Riesgos: renglones con desviación
  const renglonesConAvance = useMemo(() => {
    const _renglones = presupuesto?.renglones ?? [];
    const _avancesProyecto = avances.filter(a => a.proyectoId === currentProjectId);
    const _diasTotales = fechaInicio && fechaFin ? Math.round((new Date(fechaFin).getTime() - new Date(fechaInicio).getTime()) / 86400000) : 1;
    const _diasTranscurridos = fechaInicio ? Math.round((Date.now() - new Date(fechaInicio).getTime()) / 86400000) : 0;
    return _renglones.map(r => {
      const avancesRenglon = _avancesProyecto.filter(a => a.renglonNombre === r.nombre || a.renglonId === r.id);
      const pctAvance = avancesRenglon.length > 0 ? Math.max(...avancesRenglon.map(a => a.avanceFisico)) : 0;
      const avanceEsperado = _diasTotales > 0 ? (_diasTranscurridos / _diasTotales) * 100 : 0;
      const desviacion = pctAvance - avanceEsperado;
      return { ...r, pctAvance, avanceEsperado, desviacion };
    });
  }, [presupuesto, avances, currentProjectId, fechaInicio, fechaFin]);

  const riesgosAltos = useMemo(() => renglonesConAvance.filter(r => r.pctAvance < 50 && r.desviacion < -20), [renglonesConAvance]);
  const riesgosMedios = useMemo(() => renglonesConAvance.filter(r => r.desviacion < -10 && r.desviacion >= -20), [renglonesConAvance]);
  const actividadesSaludables = useMemo(() => renglonesConAvance.filter(r => r.desviacion >= -10), [renglonesConAvance]);

  // Costo de MO por día
  const costoMOPorDia = useMemo(() => empleados
    .filter(e => e.activo && (!currentProjectId || e.proyectoIds.includes(currentProjectId)))
    .reduce((a, e) => a + e.salarioDiario, 0), [empleados, currentProjectId]);

  const proyectosActivos = useMemo(() => proyectos.filter(p => p.estado === 'ejecucion' || p.estado === 'planeacion'), [proyectos]);

  const weatherImpactData = useMemo(() => {
    const weatherRec = proyectoWeather?.find(w => w.proyectoId === currentProjectId);
    if (!weatherRec?.weatherData) return null;
    const impact = weatherRec.impact ?? calculateWeatherImpact(weatherRec.weatherData);
    const history = weatherRec.history ?? [];
    const workableDays = history.filter(h => h.impactLevel === 'low' || h.impactLevel === 'medium').length;
    const lostDays = history.filter(h => h.impactLevel === 'high' || h.impactLevel === 'critical').length;
    const diasPerdidosEst = lostDays > 0 ? Math.round(lostDays * 0.5) : 0;
    const impactColor = impact.level === 'critical' ? 'border-red-300 bg-red-50 dark:bg-red-950'
      : impact.level === 'high' ? 'border-orange-300 bg-orange-50 dark:bg-orange-950'
      : impact.level === 'medium' ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950'
      : 'border-green-300 bg-green-50 dark:bg-green-950';
    return { impact, history, workableDays, lostDays, diasPerdidosEst, impactColor };
  }, [proyectoWeather, currentProjectId]);

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
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
          <Zap className="w-6 h-6 text-purple-500" /> {t('dashboard_predictivo.titulo', 'Dashboard Predictivo')}
        </h1>
        <select
          value={currentProjectId}
          onChange={e => setCurrentProjectId(e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-purple-400 bg-card"
          aria-label={t('dashboard_predictivo.seleccionar_proyecto_aria', 'Seleccionar proyecto para dashboard predictivo')}
        >
          <option value="">{t('dashboard_predictivo.todos_proyectos', '— Todos los proyectos —')}</option>
          {proyectosActivos.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </div>

      {!currentProjectId ? (
        <div className="text-center py-16 text-muted-foreground">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">{t('dashboard_predictivo.selecciona_proyecto', 'Selecciona un proyecto')}</p>
          <p className="text-sm">{t('dashboard_predictivo.selecciona_subtitulo', 'Para ver las predicciones de costo, plazo y riesgos')}</p>
        </div>
      ) : (
        <>
          {/* === PROYECCIÓN DE COSTO FINAL === */}
          <div>
            <h2 className="font-bold text-muted-foreground text-sm mb-3 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" /> {t('dashboard_predictivo.proyeccion_costo', 'Proyección de Costo Final')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="text-[10px] text-muted-foreground">{t('dashboard_predictivo.presupuesto_bac', 'Presupuesto (BAC)')}</div>
                <div className="text-lg font-bold text-foreground">{fmtQ(BAC)}</div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="text-[10px] text-muted-foreground">{t('dashboard_predictivo.ejecutado_ac', 'Ejecutado (AC)')}</div>
                <div className="text-lg font-bold text-orange-600">{fmtQ(totalGastos)}</div>
              </div>
              <div className={`rounded-xl p-4 border ${sobrecosto > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="text-[10px] text-muted-foreground">{t('dashboard_predictivo.costo_final_eac', 'Costo Final Estimado (EAC)')}</div>
                <div className="text-lg font-bold text-foreground">{fmtQ(EAC)}</div>
                {sobrecosto > 0 && <div className="text-[10px] text-red-600 mt-1"><AlertTriangle className="w-3 h-3 inline text-red-600" aria-hidden="true" /> +{fmtQ(sobrecosto)}{t('dashboard_predictivo.sobre_presupuesto', ' sobre presupuesto')}</div>}
                {sobrecosto <= 0 && <div className="text-[10px] text-emerald-600 mt-1"><CheckCircle className="w-3 h-3 inline text-emerald-600" aria-hidden="true" />{t('dashboard_predictivo.debajo_presupuesto', ' Debajo de presupuesto')}</div>}
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="text-[10px] text-muted-foreground">{t('dashboard_predictivo.cpi', 'CPI (Rend. Costo)')}</div>
                <div className="text-lg font-bold text-foreground">{CPI.toFixed(2)}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{CPI >= 1 ? <><CheckCircle className="w-3 h-3 inline text-emerald-600" aria-hidden="true" />{t('dashboard_predictivo.eficiente', ' Eficiente')}</> : <><AlertTriangle className="w-3 h-3 inline text-red-400" aria-hidden="true" />{t('dashboard_predictivo.sobre_costo', ' Sobre costo')}</>}</div>
              </div>
            </div>
            {/* Barra de progreso EAC vs BAC */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{t('dashboard_predictivo.presupuesto_bac', 'Presupuesto (BAC)')}</span>
                <span className="font-semibold">{fmtQ(BAC)}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${EAC > BAC ? 'bg-red-400' : 'bg-emerald-400'}`}
                  style={{ width: `${Math.min((EAC / Math.max(BAC, 1)) * 100, 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-muted-foreground">{t('dashboard_predictivo.estimado_final_eac', 'Estimado Final (EAC)')}</span>
                <span className={`font-semibold ${EAC > BAC ? 'text-red-600' : 'text-emerald-600'}`}>{fmtQ(EAC)}</span>
              </div>
            </div>
          </div>

          {/* === ESTIMACIÓN DE FECHA DE FINALIZACIÓN === */}
          <div>
            <h2 className="font-bold text-muted-foreground text-sm mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-500" /> {t('dashboard_predictivo.estimacion_fecha', 'Estimación de Fecha de Finalización')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="text-[10px] text-muted-foreground">{t('dashboard_predictivo.fecha_planificada', 'Fecha Planificada')}</div>
                <div className="text-sm font-bold text-foreground">{proyecto?.fechaFin ? formatDateFmt(proyecto.fechaFin) : '—'}</div>
              </div>
              <div className={`rounded-xl p-4 border ${desviacionDias > 30 ? 'bg-red-50 border-red-200' : desviacionDias > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="text-[10px] text-muted-foreground">{t('dashboard_predictivo.fecha_estimada', 'Fecha Estimada')}</div>
                <div className="text-sm font-bold text-foreground">{formatDateFmt(fechaEstimadaFin.toISOString())}</div>
                {desviacionDias > 0 && <div className="text-[10px] text-red-600 mt-1"><AlertTriangle className="w-3 h-3 inline text-red-600" aria-hidden="true" /> +{Math.round(desviacionDias)}{t('dashboard_predictivo.dias_retraso', ' días de retraso')}</div>}
                {desviacionDias <= 0 && <div className="text-[10px] text-emerald-600 mt-1"><CheckCircle className="w-3 h-3 inline text-emerald-600" aria-hidden="true" />{t('dashboard_predictivo.adelantado', ' Adelantado')}</div>}
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="text-[10px] text-muted-foreground">{t('dashboard_predictivo.avance_fisico', 'Avance Físico')}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${avanceReal}%` }} />
                  </div>
                  <span className="text-lg font-bold text-foreground">{avanceReal}%</span>
                </div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="text-[10px] text-muted-foreground">{t('dashboard_predictivo.dias_transcurridos', 'Días Transcurridos')}</div>
                <div className="text-lg font-bold text-foreground">{diasTranscurridos}/{diasTotales}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{((diasTranscurridos / Math.max(diasTotales, 1)) * 100).toFixed(0)}{t('dashboard_predictivo.porcentaje_plazo', '% del plazo')}</div>
              </div>
            </div>
            {/* Gráfico de avance vs tiempo */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="text-xs font-bold text-muted-foreground mb-2">{t('dashboard_predictivo.ritmo_avance', 'Ritmo de Avance')}</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">{t('dashboard_predictivo.ritmo_esperado', 'Ritmo esperado')}</span>
                    <span className="font-semibold">{ritmoEsperado.toFixed(2)}%/día</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min((ritmoEsperado / Math.max(ritmoEsperado, ritmoActual, 1)) * 100, 100)}%` }} />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">{t('dashboard_predictivo.ritmo_actual', 'Ritmo actual')}</span>
                    <span className={`font-semibold ${ritmoActual < ritmoEsperado ? 'text-red-600' : 'text-emerald-600'}`}>
                      {ritmoActual.toFixed(2)}%/día
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${ritmoActual < ritmoEsperado ? 'bg-red-400' : 'bg-emerald-400'}`}
                      style={{ width: `${Math.min((ritmoActual / Math.max(ritmoEsperado, ritmoActual, 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t text-[10px] text-muted-foreground">
                {diasEstimadosRestantes > 0
                  ? t('dashboard_predictivo.dias_restantes', 'Se estiman {{dias}} días restantes ({{fecha}})', { dias: Math.round(diasEstimadosRestantes), fecha: formatDateFmt(fechaEstimadaFin.toISOString()) })
                  : t('dashboard_predictivo.calculando_estimacion', 'Calculando estimación...')}
              </div>
            </div>
          </div>

              {/* === RIESGOS === */}
              <div>
                <h2 className="font-bold text-muted-foreground text-sm mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> {t('dashboard_predictivo.riesgos_renglon', 'Riesgos por Renglón')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                    <div className="text-[10px] text-red-600 font-medium">{t('dashboard_predictivo.alto_riesgo', 'Alto Riesgo')}</div>
                    <div className="text-2xl font-black text-red-600">{riesgosAltos.length}</div>
                    <div className="text-[10px] text-red-500">{t('dashboard_predictivo.actividades_desviacion_alta', 'Actividades con desviación < -20%')}</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <div className="text-[10px] text-amber-600 font-medium">{t('dashboard_predictivo.riesgo_medio', 'Riesgo Medio')}</div>
                    <div className="text-2xl font-black text-amber-600">{riesgosMedios.length}</div>
                    <div className="text-[10px] text-amber-500">{t('dashboard_predictivo.desviacion_media', 'Desviación entre -10% y -20%')}</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <div className="text-[10px] text-emerald-600 font-medium">{t('dashboard_predictivo.saludable', 'Saludable')}</div>
                    <div className="text-2xl font-black text-emerald-600">{actividadesSaludables.length}</div>
                    <div className="text-[10px] text-emerald-500">{t('dashboard_predictivo.actividades_saludables', 'Actividades dentro de lo esperado')}</div>
                  </div>
                </div>

                {renglonesConAvance.length > 0 ? (
                  <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                      {[...renglonesConAvance].sort((a, b) => a.desviacion - b.desviacion).map(r => (
                        <div key={r.id} className="p-3 hover:bg-accent">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-medium text-muted-foreground truncate">{r.codigo} - {r.nombre}</span>
                              {r.desviacion < -20 && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" aria-hidden="true" />}
                            </div>
                            <span className={`font-semibold shrink-0 ml-2 ${r.desviacion < -20 ? 'text-red-600' : r.desviacion < -10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {r.desviacion > 0 ? '+' : ''}{r.desviacion.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${r.desviacion < -20 ? 'bg-red-400' : r.desviacion < -10 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                style={{ width: `${Math.min(Math.max(r.pctAvance, 0), 100)}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground">{r.pctAvance.toFixed(0)}%{t('dashboard_predictivo.vs_esperado', ' vs esperado ')}{r.avanceEsperado.toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl bg-card">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" aria-hidden="true" />
                    <p className="text-sm">{t('dashboard_predictivo.sin_datos_avance', 'Sin datos de avance por renglón')}</p>
                    <p className="text-xs mt-1">{t('dashboard_predictivo.registra_avances', 'Registra avances para evaluar desviaciones')}</p>
                  </div>
                )}

                {riesgosAltos.length > 0 && (
                  <div className="mt-3 bg-red-50 dark:bg-red-950/40 rounded-xl p-4 border border-red-200 dark:border-red-900">
                    <h3 className="text-xs font-bold text-red-700 mb-2">{t('dashboard_predictivo.acciones_recomendadas', 'Acciones Recomendadas')}</h3>
                    <ul className="text-xs text-red-700 space-y-1">
                      {riesgosAltos.slice(0, 3).map(r => (
                        <li key={r.id} className="flex items-start gap-1.5">
                          <span>•</span>
                          <span><b>{r.nombre}</b>{t('dashboard_predictivo.accion_recomendada', ': avanzado solo {{pct}}% (esperado {{esperado}}%). Asignar más recursos.', { pct: r.pctAvance.toFixed(0), esperado: r.avanceEsperado.toFixed(0) })}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* === IMPACTO CLIMÁTICO === */}
              {weatherImpactData ? (
                <div>
                  <h2 className="font-bold text-muted-foreground text-sm mb-3 flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-blue-500" /> {t('dashboard_predictivo.impacto_climatico', 'Impacto Climático en el Proyecto')}
                  </h2>
                  <div className={`rounded-xl p-4 border ${weatherImpactData.impactColor} mb-3`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold capitalize">{t('dashboard_predictivo.nivel_actual', 'Nivel actual: ')}{weatherImpactData.impact.level}</span>
                      <span className="text-xs font-bold">{weatherImpactData.impact.score}/100 pts</span>
                    </div>
                    {weatherImpactData.impact.factors.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {weatherImpactData.impact.factors.map((f, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20 border">{f}</span>
                        ))}
                      </div>
                    )}
                    {weatherImpactData.impact.recommendations.length > 0 && (
                      <p className="text-xs text-muted-foreground">{weatherImpactData.impact.recommendations[0]}</p>
                    )}
                  </div>
                  {weatherImpactData.history.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-card rounded-xl p-3 border border-border text-center">
                        <div className="text-[10px] text-muted-foreground">{t('dashboard_predictivo.dias_registrados', 'Días registrados')}</div>
                        <div className="text-lg font-bold">{weatherImpactData.history.length}</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950 rounded-xl p-3 border border-green-200 text-center">
                        <div className="text-[10px] text-green-600">{t('dashboard_predictivo.dias_trabajables', 'Días trabajables')}</div>
                        <div className="text-lg font-bold text-green-600">{weatherImpactData.workableDays}</div>
                      </div>
                      <div className="bg-red-50 dark:bg-red-950 rounded-xl p-3 border border-red-200 text-center">
                        <div className="text-[10px] text-red-600">{t('dashboard_predictivo.dias_perdidos_est', 'Días perdidos est.')}</div>
                        <div className="text-lg font-bold text-red-600">{weatherImpactData.diasPerdidosEst}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-card rounded-xl p-3 border border-border text-center">
                        <div className="text-[10px] text-muted-foreground">{t('dashboard_predictivo.dias_registrados', 'Días registrados')}</div>
                        <div className="text-lg font-bold">0</div>
                      </div>
                      <div className="bg-card rounded-xl p-3 border border-border text-center">
                        <div className="text-[10px] text-muted-foreground">{t('dashboard_predictivo.dias_trabajables', 'Días trabajables')}</div>
                        <div className="text-lg font-bold">—</div>
                      </div>
                      <div className="bg-card rounded-xl p-3 border border-border text-center">
                        <div className="text-[10px] text-muted-foreground">{t('dashboard_predictivo.dias_perdidos_est', 'Días perdidos est.')}</div>
                        <div className="text-lg font-bold">—</div>
                      </div>
                    </div>
                  )}
                  {weatherImpactData.diasPerdidosEst > 0 && (
                    <div className="mt-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950 border border-amber-200 rounded-lg p-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
                      {t('dashboard_predictivo.dias_adicionales_clima', 'Se estiman ~{{dias}} días adicionales por condiciones climáticas adversas.', { dias: weatherImpactData.diasPerdidosEst })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl bg-card">
                  <Cloud className="w-8 h-8 mx-auto mb-2 opacity-40" aria-hidden="true" />
                  <p className="text-sm">{t('dashboard_predictivo.sin_datos_climaticos', 'Sin datos climáticos')}</p>
                  <p className="text-xs mt-1">{t('dashboard_predictivo.vincula_clima', 'Vincula registros de clima para calcular impacto')}</p>
                </div>
              )}

              {/* Quema de horas hombre */}
              <div className="bg-card rounded-xl p-4 border border-border">
                <h3 className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-500" /> {t('dashboard_predictivo.quema_horas_hombre', 'Quema de Horas Hombre')}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="text-[10px] text-muted-foreground">{t('dashboard_predictivo.costo_mo_dia', 'Costo MO / Día')}</div>
                    <div className="text-lg font-bold text-foreground">{fmtQ(costoMOPorDia)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">{t('dashboard_predictivo.costo_mo_total', 'Costo MO Total')}</div>
                    <div className="text-lg font-bold text-foreground">{fmtQ(costoMOPorDia * diasTranscurridos)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">{t('dashboard_predictivo.costo_mo_proyectado', 'Costo MO Proyectado')}</div>
                    <div className="text-lg font-bold text-foreground">{fmtQ(costoMOPorDia * (diasTranscurridos + diasEstimadosRestantes))}</div>
                  </div>
                </div>
              </div>
        </>
      )}
    </div>
  );
};

export default DashboardPredictivo;
