import React, { useMemo, useState } from 'react';
import { useErp } from '../store';
import { fmtQ } from '../utils';
import { Calendar, AlertTriangle, DollarSign, Activity, Zap } from 'lucide-react';

const DashboardPredictivo: React.FC = () => {
  const { proyectos, movimientos, presupuestos, avances, empleados } = useErp();
  const [selProyecto, setSelProyecto] = useState('');

  const proyecto = proyectos.find(p => p.id === selProyecto);
  const presupuesto = presupuestos.find(p => p.proyectoId === selProyecto);

  // --- Cálculos ---
  const gastos = movimientos.filter(m => m.proyectoId === selProyecto && (m.tipo === 'gasto' || m.tipo === 'egreso'));
  const totalGastos = gastos.reduce((a, m) => a + (m.costoTotal ?? m.monto), 0);

  // Costo final proyectado (EAC = AC + (BAC - EV) / CPI)
  const BAC = proyecto?.presupuestoTotal || proyecto?.presupuesto || presupuesto?.totalPV || 0;
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
    const _avancesProyecto = avances.filter(a => a.proyectoId === selProyecto);
    const _diasTotales = fechaInicio && fechaFin ? Math.round((new Date(fechaFin).getTime() - new Date(fechaInicio).getTime()) / 86400000) : 1;
    const _diasTranscurridos = fechaInicio ? Math.round((Date.now() - new Date(fechaInicio).getTime()) / 86400000) : 0;
    return _renglones.map(r => {
      const avancesRenglon = _avancesProyecto.filter(a => a.renglonNombre === r.nombre || a.renglonId === r.id);
      const pctAvance = avancesRenglon.length > 0 ? Math.max(...avancesRenglon.map(a => a.avanceFisico)) : 0;
      const avanceEsperado = _diasTotales > 0 ? (_diasTranscurridos / _diasTotales) * 100 : 0;
      const desviacion = pctAvance - avanceEsperado;
      return { ...r, pctAvance, avanceEsperado, desviacion };
    });
  }, [presupuesto, avances, selProyecto, fechaInicio, fechaFin]);

  const riesgosAltos = renglonesConAvance.filter(r => r.pctAvance < 50 && r.desviacion < -20);
  const riesgosMedios = renglonesConAvance.filter(r => r.desviacion < -10 && r.desviacion >= -20);
  const actividadesSaludables = renglonesConAvance.filter(r => r.desviacion >= -10);

  // Costo de MO por día
  const costoMOPorDia = empleados
    .filter(e => e.activo && (!selProyecto || e.proyectoIds.includes(selProyecto)))
    .reduce((a, e) => a + e.salarioDiario, 0);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Zap className="w-6 h-6 text-purple-500" /> Dashboard Predictivo
        </h1>
        <select
          value={selProyecto}
          onChange={e => setSelProyecto(e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-purple-400 bg-white"
        >
          <option value="">— Todos los proyectos —</option>
          {proyectos.filter(p => p.estado === 'ejecucion' || p.estado === 'planeacion').map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </div>

      {!selProyecto ? (
        <div className="text-center py-16 text-slate-400">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Selecciona un proyecto</p>
          <p className="text-sm">Para ver las predicciones de costo, plazo y riesgos</p>
        </div>
      ) : (
        <>
          {/* === PROYECCIÓN DE COSTO FINAL === */}
          <div>
            <h2 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Proyección de Costo Final
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <div className="text-[10px] text-slate-400">Presupuesto (BAC)</div>
                <div className="text-lg font-bold text-slate-800">{fmtQ(BAC)}</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <div className="text-[10px] text-slate-400">Ejecutado (AC)</div>
                <div className="text-lg font-bold text-orange-600">{fmtQ(totalGastos)}</div>
              </div>
              <div className={`rounded-xl p-4 border ${sobrecosto > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="text-[10px] text-slate-400">Costo Final Estimado (EAC)</div>
                <div className="text-lg font-bold text-slate-800">{fmtQ(EAC)}</div>
                {sobrecosto > 0 && <div className="text-[10px] text-red-600 mt-1">⚠️ +{fmtQ(sobrecosto)} sobre presupuesto</div>}
                {sobrecosto <= 0 && <div className="text-[10px] text-emerald-600 mt-1">✅ Debajo de presupuesto</div>}
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <div className="text-[10px] text-slate-400">CPI (Rend. Costo)</div>
                <div className="text-lg font-bold text-slate-800">{CPI.toFixed(2)}</div>
                <div className="text-[10px] text-slate-400 mt-1">{CPI >= 1 ? '✅ Eficiente' : '⚠️ Sobre costo'}</div>
              </div>
            </div>
            {/* Barra de progreso EAC vs BAC */}
            <div className="bg-white rounded-xl p-4 border border-slate-100">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Presupuesto (BAC)</span>
                <span className="font-semibold">{fmtQ(BAC)}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${EAC > BAC ? 'bg-red-400' : 'bg-emerald-400'}`}
                  style={{ width: `${Math.min((EAC / Math.max(BAC, 1)) * 100, 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-slate-500">Estimado Final (EAC)</span>
                <span className={`font-semibold ${EAC > BAC ? 'text-red-600' : 'text-emerald-600'}`}>{fmtQ(EAC)}</span>
              </div>
            </div>
          </div>

          {/* === ESTIMACIÓN DE FECHA DE FINALIZACIÓN === */}
          <div>
            <h2 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-500" /> Estimación de Fecha de Finalización
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <div className="text-[10px] text-slate-400">Fecha Planificada</div>
                <div className="text-sm font-bold text-slate-800">{proyecto?.fechaFin ? new Date(proyecto.fechaFin).toLocaleDateString('es-GT') : '—'}</div>
              </div>
              <div className={`rounded-xl p-4 border ${desviacionDias > 30 ? 'bg-red-50 border-red-200' : desviacionDias > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="text-[10px] text-slate-400">Fecha Estimada</div>
                <div className="text-sm font-bold text-slate-800">{fechaEstimadaFin.toLocaleDateString('es-GT')}</div>
                {desviacionDias > 0 && <div className="text-[10px] text-red-600 mt-1">⚠️ +{Math.round(desviacionDias)} días de retraso</div>}
                {desviacionDias <= 0 && <div className="text-[10px] text-emerald-600 mt-1">✅ Adelantado</div>}
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <div className="text-[10px] text-slate-400">Avance Físico</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${avanceReal}%` }} />
                  </div>
                  <span className="text-lg font-bold text-slate-800">{avanceReal}%</span>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <div className="text-[10px] text-slate-400">Días Transcurridos</div>
                <div className="text-lg font-bold text-slate-800">{diasTranscurridos}/{diasTotales}</div>
                <div className="text-[10px] text-slate-400 mt-1">{((diasTranscurridos / Math.max(diasTotales, 1)) * 100).toFixed(0)}% del plazo</div>
              </div>
            </div>
            {/* Gráfico de avance vs tiempo */}
            <div className="bg-white rounded-xl p-4 border border-slate-100">
              <h3 className="text-xs font-bold text-slate-600 mb-2">Ritmo de Avance</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Ritmo esperado</span>
                    <span className="font-semibold">{ritmoEsperado.toFixed(2)}%/día</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min((ritmoEsperado / Math.max(ritmoEsperado, ritmoActual, 1)) * 100, 100)}%` }} />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Ritmo actual</span>
                    <span className={`font-semibold ${ritmoActual < ritmoEsperado ? 'text-red-600' : 'text-emerald-600'}`}>
                      {ritmoActual.toFixed(2)}%/día
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${ritmoActual < ritmoEsperado ? 'bg-red-400' : 'bg-emerald-400'}`}
                      style={{ width: `${Math.min((ritmoActual / Math.max(ritmoEsperado, ritmoActual, 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t text-[10px] text-slate-400">
                {diasEstimadosRestantes > 0
                  ? `Se estiman ${Math.round(diasEstimadosRestantes)} días restantes (${fechaEstimadaFin.toLocaleDateString('es-GT')})`
                  : 'Calculando estimación...'}
              </div>
            </div>
          </div>

          {/* === RIESGOS === */}
          <div>
            <h2 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Riesgos por Renglón
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="text-[10px] text-red-600 font-medium">🔴 Alto Riesgo</div>
                <div className="text-2xl font-black text-red-600">{riesgosAltos.length}</div>
                <div className="text-[10px] text-red-500">{'Actividades con desviación < -20%'}</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="text-[10px] text-amber-600 font-medium">🟡 Riesgo Medio</div>
                <div className="text-2xl font-black text-amber-600">{riesgosMedios.length}</div>
                <div className="text-[10px] text-amber-500">Desviación entre -10% y -20%</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <div className="text-[10px] text-emerald-600 font-medium">🟢 Saludable</div>
                <div className="text-2xl font-black text-emerald-600">{actividadesSaludables.length}</div>
                <div className="text-[10px] text-emerald-500">Actividades dentro de lo esperado</div>
              </div>
            </div>

            {renglonesConAvance.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                  {renglonesConAvance.sort((a, b) => a.desviacion - b.desviacion).map(r => (
                    <div key={r.id} className="p-3 hover:bg-slate-50">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-medium text-slate-700 truncate">{r.codigo} - {r.nombre}</span>
                          {r.desviacion < -20 && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />}
                        </div>
                        <span className={`font-semibold shrink-0 ml-2 ${r.desviacion < -20 ? 'text-red-600' : r.desviacion < -10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {r.desviacion > 0 ? '+' : ''}{r.desviacion.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${r.desviacion < -20 ? 'bg-red-400' : r.desviacion < -10 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${Math.min(Math.max(r.pctAvance, 0), 100)}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400">{r.pctAvance.toFixed(0)}% vs esperado {r.avanceEsperado.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {riesgosAltos.length > 0 && (
              <div className="mt-3 bg-red-50 rounded-xl p-4 border border-red-200">
                <h3 className="text-xs font-bold text-red-700 mb-2">🔴 Acciones Recomendadas</h3>
                <ul className="text-[11px] text-red-700 space-y-1">
                  {riesgosAltos.slice(0, 3).map(r => (
                    <li key={r.id} className="flex items-start gap-1.5">
                      <span>•</span>
                      <span><b>{r.nombre}</b>: avanzado solo {r.pctAvance.toFixed(0)}% (esperado {r.avanceEsperado.toFixed(0)}%). Asignar más recursos.</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Quema de horas hombre */}
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <h3 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-orange-500" /> Quema de Horas Hombre
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <div className="text-[10px] text-slate-400">Costo MO / Día</div>
                <div className="text-lg font-bold text-slate-800">{fmtQ(costoMOPorDia)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Costo MO Total</div>
                <div className="text-lg font-bold text-slate-800">{fmtQ(costoMOPorDia * diasTranscurridos)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Costo MO Proyectado</div>
                <div className="text-lg font-bold text-slate-800">{fmtQ(costoMOPorDia * (diasTranscurridos + diasEstimadosRestantes))}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPredictivo;