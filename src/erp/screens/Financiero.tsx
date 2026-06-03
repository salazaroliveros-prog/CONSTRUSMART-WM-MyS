import React, { useMemo, useState, useEffect } from 'react';
import { useErp } from '../store';
import { fmtQ, CATEGORIA_LABEL } from '../utils';
import { AreaChart, Donut } from '../components/Charts';
import MovimientoForm from '../components/MovimientoForm';
import { Wallet, Trash2, TrendingUp, TrendingDown, AlertTriangle, CalendarDays } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#fbbf24', '#ec4899', '#14b8a6', '#a855f7', '#f43f5e'];

const Financiero: React.FC = () => {
  const { movimientos, deleteMovimiento, proyectos, ordenes } = useErp();
  const [filtro, setFiltro] = useState<'todos' | 'ingreso' | 'gasto'>('todos');
  const [loading, setLoading] = useState(true);
  const [vistaCF, setVistaCF] = useState<'real' | 'proyectado'>('real');
  const [mesesProy, setMesesProy] = useState(3);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((a, b) => a + b.costoTotal, 0);
  const gastos = movimientos.filter(m => m.tipo === 'gasto').reduce((a, b) => a + b.costoTotal, 0);
  const utilidad = ingresos - gastos;

  // Agrupar movimientos por mes (últimos 12 meses)
  const cashFlowMensual = useMemo(() => {
    const hoy = new Date();
    const meses: { label: string; ingresos: number; egresos: number; saldo: number }[] = [];
    
    for (let i = 11; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const label = fecha.toLocaleDateString('es-GT', { month: 'short', year: '2-digit' });
      meses.push({ label, ingresos: 0, egresos: 0, saldo: 0 });
    }
    
    movimientos.forEach(m => {
      const fechaMov = new Date(m.fecha);
      const diffMonths = (hoy.getFullYear() - fechaMov.getFullYear()) * 12 + (hoy.getMonth() - fechaMov.getMonth());
      const idx = 11 - diffMonths;
      if (idx >= 0 && idx < 12) {
        if (m.tipo === 'ingreso') meses[idx].ingresos += m.costoTotal;
        else meses[idx].egresos += m.costoTotal;
      }
    });
    
    let saldoAcum = 0;
    meses.forEach(m => {
      saldoAcum += m.ingresos - m.egresos;
      m.saldo = saldoAcum;
    });
    
    return meses;
  }, [movimientos]);

  // Cash Flow Proyectado
  const cashFlowProyectado = useMemo(() => {
    const mesActual = new Date();
    const mesesConDatos = cashFlowMensual.filter(m => m.ingresos > 0 || m.egresos > 0).length || 1;
    const promedioIngresos = cashFlowMensual.reduce((a, m) => a + m.ingresos, 0) / mesesConDatos;
    const promedioEgresos = cashFlowMensual.reduce((a, m) => a + m.egresos, 0) / mesesConDatos;
    const saldoActual = cashFlowMensual[cashFlowMensual.length - 1]?.saldo || 0;

    // Pendiente de cobro por contratos
    const pendienteCobro = proyectos
      .filter(p => p.estado === 'ejecucion')
      .reduce((a, p) => a + Math.max(0, p.montoContrato - movimientos.filter(m => m.proyectoId === p.id && m.tipo === 'ingreso').reduce((s, m) => s + m.costoTotal, 0)), 0);
    
    // Compromisos por OC
    const egresosCompromiso = ordenes.filter(o => o.estado === 'aprobado' || o.estado === 'pendiente').reduce((a, o) => a + o.monto, 0);

    const proy: { label: string; ingresos: number; egresos: number; saldo: number }[] = [];
    let saldo = saldoActual + pendienteCobro * 0.3 - egresosCompromiso * 0.2; // Ajuste inicial

    for (let i = 0; i < mesesProy; i++) {
      const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth() + i, 1);
      const label = fecha.toLocaleDateString('es-GT', { month: 'short', year: '2-digit' });
      
      const ing = Math.round((pendienteCobro / mesesProy) * 0.7 + promedioIngresos * 0.3);
      const eg = Math.round((egresosCompromiso / mesesProy) * 0.6 + promedioEgresos * 0.4);
      
      saldo += ing - eg;
      proy.push({ label, ingresos: ing, egresos: eg, saldo: Math.round(saldo) });
    }
    
    return proy;
  }, [movimientos, proyectos, ordenes, mesesProy, cashFlowMensual]);

  // Alerta de déficit
  const deficitAlert = useMemo(() => {
    if (cashFlowProyectado.length === 0) return null;
    const mesesRojos = cashFlowProyectado.filter(m => m.saldo < 0);
    if (mesesRojos.length === 0) return null;
    const saldoMin = Math.min(...cashFlowProyectado.map(m => m.saldo));
    const critico = saldoMin < -(cashFlowMensual[cashFlowMensual.length - 1]?.saldo || 1) * 0.5;
    return { meses: mesesRojos.length, saldoMin, critico };
  }, [cashFlowProyectado, cashFlowMensual]);

  const porCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    movimientos.filter(m => m.tipo === 'gasto').forEach(m => { map[m.categoria] = (map[m.categoria] || 0) + m.costoTotal; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([k, v], i) => ({ label: CATEGORIA_LABEL[k as keyof typeof CATEGORIA_LABEL], value: v, color: COLORS[i % COLORS.length] }));
  }, [movimientos]);

  const centrosCosto = useMemo(() => proyectos.map(p => {
    const ing = movimientos.filter(m => m.proyectoId === p.id && m.tipo === 'ingreso').reduce((a, b) => a + b.costoTotal, 0);
    const gas = movimientos.filter(m => m.proyectoId === p.id && m.tipo === 'gasto').reduce((a, b) => a + b.costoTotal, 0);
    return { nombre: p.nombre, ing, gas, margen: ing - gas };
  }), [proyectos, movimientos]);

  const lista = movimientos.filter(m => filtro === 'todos' || m.tipo === filtro);

  // Datos para el AreaChart
  const cfData = vistaCF === 'real' ? cashFlowMensual : cashFlowProyectado;
  const cfSeries = [
    { label: 'Ingresos', color: '#10b981', data: cfData.map(m => m.ingresos) },
    { label: 'Egresos', color: '#ef4444', data: cfData.map(m => m.egresos) },
  ];
  const cfLabels = cfData.map(m => m.label);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4">
        <Wallet className="w-6 h-6 text-violet-500" /> Control Financiero y Caja
      </h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-emerald-500 text-white rounded-2xl p-4">
          <TrendingUp className="w-5 h-5 mb-2" />
          <div className="text-xl font-bold">{fmtQ(ingresos)}</div>
          <div className="text-[10px] opacity-80">Ingresos Totales</div>
        </div>
        <div className="bg-red-500 text-white rounded-2xl p-4">
          <TrendingDown className="w-5 h-5 mb-2" />
          <div className="text-xl font-bold">{fmtQ(gastos)}</div>
          <div className="text-[10px] opacity-80">Gastos Totales</div>
        </div>
        <div className={`${utilidad >= 0 ? 'bg-slate-900' : 'bg-red-700'} text-white rounded-2xl p-4`}>
          <Wallet className="w-5 h-5 mb-2" />
          <div className="text-xl font-bold">{fmtQ(utilidad)}</div>
          <div className="text-[10px] opacity-80">Utilidad Neta</div>
        </div>
        <div className="bg-blue-600 text-white rounded-2xl p-4">
          <CalendarDays className="w-5 h-5 mb-2" />
          <div className="text-xl font-bold">{fmtQ(cashFlowMensual[cashFlowMensual.length - 1]?.saldo || 0)}</div>
          <div className="text-[10px] opacity-80">Saldo en Caja</div>
        </div>
      </div>

      {/* Cash Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-700 text-sm flex items-center gap-1">
              <CalendarDays className="w-4 h-4 text-violet-500" /> 
              {vistaCF === 'real' ? 'Flujo de Caja Real (12 meses)' : 'Flujo de Caja Proyectado'}
            </h3>
            <div className="flex items-center gap-2">
              {vistaCF === 'proyectado' && (
                <select 
                  value={mesesProy}
                  onChange={e => setMesesProy(+e.target.value)}
                  className="text-[10px] px-2 py-1 rounded border border-slate-200 outline-none"
                >
                  <option value={3}>3 meses</option>
                  <option value={6}>6 meses</option>
                  <option value={12}>12 meses</option>
                </select>
              )}
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setVistaCF('real')}
                  className={`px-2 py-1 text-[10px] rounded-md font-medium transition-colors ${
                    vistaCF === 'real' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Real
                </button>
                <button
                  onClick={() => setVistaCF('proyectado')}
                  className={`px-2 py-1 text-[10px] rounded-md font-medium transition-colors ${
                    vistaCF === 'proyectado' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Proyectado
                </button>
              </div>
            </div>
          </div>

          {/* Alerta de déficit */}
          {deficitAlert && vistaCF === 'proyectado' && (
            <div className={`mb-3 p-2 rounded-lg text-[10px] flex items-center gap-1.5 ${
              deficitAlert.critico ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>
                Déficit proyectado en <b>{deficitAlert.meses} meses</b>. 
                Saldo mínimo estimado: <b>{fmtQ(deficitAlert.saldoMin)}</b>
                {deficitAlert.critico && <span className="font-bold"> · ¡ALERTA CRÍTICA!</span>}
              </span>
            </div>
          )}

          <AreaChart labels={cfLabels} series={cfSeries} />

          {/* Tabla resumen del CF proyectado */}
          {vistaCF === 'proyectado' && (
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              {cashFlowProyectado.map((m, i) => (
                <div key={i} className={`rounded-lg p-2 border ${
                  m.saldo >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="font-semibold mb-0.5">{m.label}</div>
                  <div className="text-emerald-600">+{fmtQ(m.ingresos)}</div>
                  <div className="text-red-500">-{fmtQ(m.egresos)}</div>
                  <div className={`font-bold mt-0.5 ${m.saldo >= 0 ? 'text-slate-700' : 'text-red-600'}`}>
                    Saldo: {fmtQ(m.saldo)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Donut de categorías */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-700 text-sm mb-2">Gastos por Categoría</h3>
            <div className="flex items-center gap-3">
              <Donut size={110} data={porCategoria.length ? porCategoria : [{ label: '-', value: 1, color: '#e2e8f0' }]} />
              <div className="text-[11px] space-y-1 flex-1 max-h-32 overflow-y-auto">
                {porCategoria.map(c => (
                  <div key={c.label} className="flex items-center gap-1 justify-between">
                    <span className="flex items-center gap-1 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                      {c.label}
                    </span>
                    <b className="text-slate-600">{fmtQ(c.value)}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resumen OC + Ingresos Pendientes */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-700 text-sm mb-2">Compromisos Financieros</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">OC por aprobar</span>
                <span className="font-semibold text-amber-600">{ordenes.filter(o => o.estado === 'pendiente').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valor OC pendientes</span>
                <span className="font-semibold text-slate-700">
                  {fmtQ(ordenes.filter(o => o.estado === 'pendiente').reduce((a, o) => a + o.monto, 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">OC aprobadas</span>
                <span className="font-semibold text-emerald-600">
                  {fmtQ(ordenes.filter(o => o.estado === 'aprobado').reduce((a, o) => a + o.monto, 0))}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-slate-500 font-semibold">Pendiente cobro contratos</span>
                <span className="font-bold text-blue-600">
                  {fmtQ(proyectos
                    .filter(p => p.estado === 'ejecucion')
                    .reduce((a, p) => a + Math.max(0, p.montoContrato - movimientos.filter(m => m.proyectoId === p.id && m.tipo === 'ingreso').reduce((s, m) => s + m.costoTotal, 0)), 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Movimientos + Centros de Costo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {/* Tabla de movimientos */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-700 text-sm">Movimientos</h3>
              <div className="flex gap-1">
                {(['todos', 'ingreso', 'gasto'] as const).map(f => (
                  <button key={f} onClick={() => setFiltro(f)} className={`text-xs px-2.5 py-1 rounded-lg capitalize ${filtro === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>{f}</button>
                ))}
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[420px]">
                  <tbody>
                    {lista.map(m => (
                      <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="p-2">
                          <div className="font-semibold text-slate-700">{m.descripcion}</div>
                          <div className="text-slate-400">
                            {CATEGORIA_LABEL[m.categoria]} · {proyectos.find(p => p.id === m.proyectoId)?.nombre || 'Operativo'} · {m.fecha}
                          </div>
                        </td>
                        <td className={`p-2 text-right font-bold ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-500'}`}>
                          {m.tipo === 'ingreso' ? '+' : '-'}{fmtQ(m.costoTotal)}
                        </td>
                        <td className="p-2 w-8">
                          <button onClick={() => deleteMovimiento(m.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-slate-300 hover:text-red-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Centros de Costo */}
          <div className="bg-white rounded-2xl shadow-sm mt-4 p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-700 text-sm">Utilidad Neta por Centro de Costo</h3>
              <span className="text-[10px] text-slate-400">{proyectos.length} proyectos</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[400px]">
                <thead className="text-slate-400">
                  <tr>
                    <th className="text-left pb-2 font-medium">Proyecto</th>
                    <th className="text-right pb-2 font-medium">Ingresos</th>
                    <th className="text-right pb-2 font-medium">Egresos</th>
                    <th className="text-right pb-2 font-medium">Margen</th>
                    <th className="text-right pb-2 font-medium">Rentab.</th>
                  </tr>
                </thead>
                <tbody>
                  {centrosCosto.map(c => {
                    const rentabilidad = c.ing > 0 ? ((c.margen / c.ing) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={c.nombre} className="border-t border-slate-50">
                        <td className="py-2 text-slate-600 font-medium">{c.nombre}</td>
                        <td className="py-2 text-right text-emerald-600">{fmtQ(c.ing)}</td>
                        <td className="py-2 text-right text-red-500">{fmtQ(c.gas)}</td>
                        <td className={`py-2 text-right font-bold ${c.margen >= 0 ? 'text-slate-700' : 'text-red-600'}`}>
                          {fmtQ(c.margen)}
                        </td>
                        <td className={`py-2 text-right font-bold ${+rentabilidad >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {rentabilidad}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Formulario de movimientos */}
        <div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-700 text-sm mb-3">Registrar Movimiento</h3>
            <MovimientoForm compact />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Financiero;