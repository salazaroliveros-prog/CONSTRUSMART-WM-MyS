import React, { useMemo, useState } from 'react';
import { useErp } from '../store';
import { fmtQ, CATEGORIA_LABEL } from '../utils';
import { AreaChart, Donut } from '../components/Charts';
import MovimientoForm from '../components/MovimientoForm';
import { Wallet, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#fbbf24', '#ec4899', '#14b8a6', '#a855f7', '#f43f5e'];

const Financiero: React.FC = () => {
  const { movimientos, deleteMovimiento, proyectos } = useErp();
  const [filtro, setFiltro] = useState<'todos' | 'ingreso' | 'gasto'>('todos');
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((a, b) => a + (b.monto ?? 0), 0);
  const gastos = movimientos.filter(m => m.tipo === 'gasto').reduce((a, b) => a + (b.monto ?? 0), 0);
  const utilidad = ingresos - gastos;

  const porCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    movimientos.filter(m => m.tipo === 'gasto').forEach(m => { map[m.categoria] = (map[m.categoria] || 0) + (m.monto ?? 0); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([k, v], i) => ({ label: CATEGORIA_LABEL[k as keyof typeof CATEGORIA_LABEL], value: v, color: COLORS[i % COLORS.length] }));
  }, [movimientos]);

  const centrosCosto = useMemo(() => proyectos.map(p => {
    const ing = movimientos.filter(m => m.proyectoId === p.id && m.tipo === 'ingreso').reduce((a, b) => a + (b.monto ?? 0), 0);
    const gas = movimientos.filter(m => m.proyectoId === p.id && m.tipo === 'gasto').reduce((a, b) => a + (b.monto ?? 0), 0);
    return { nombre: p.nombre, ing, gas, margen: ing - gas };
  }), [proyectos, movimientos]);

  const cashFlow = useMemo(() => {
    const monthlyIng = new Array(12).fill(0);
    const monthlyEgr = new Array(12).fill(0);
    movimientos.forEach(m => {
      const month = new Date(m.fecha).getMonth();
      if (m.tipo === 'ingreso') monthlyIng[month] += (m.monto ?? 0);
      else if (m.tipo === 'gasto') monthlyEgr[month] += (m.monto ?? 0);
    });
    return { ingresos: monthlyIng, egresos: monthlyEgr };
  }, [movimientos]);
  const lista = movimientos.filter(m => filtro === 'todos' || m.tipo === filtro);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
    <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto">
      <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground flex items-center gap-2 mb-3 sm:mb-4"><Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-violet-500" aria-hidden="true" /> Control Financiero y Caja</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="bg-emerald-500 text-white rounded-xl sm:rounded-2xl p-3 sm:p-4"><TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-2" aria-hidden="true" /><div className="text-xl sm:text-2xl font-bold">{fmtQ(ingresos)}</div><div className="text-xs opacity-80">Ingresos Totales</div></div>
        <div className="bg-red-500 text-white rounded-xl sm:rounded-2xl p-3 sm:p-4"><TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-2" aria-hidden="true" /><div className="text-xl sm:text-2xl font-bold">{fmtQ(gastos)}</div><div className="text-xs opacity-80">Gastos Totales</div></div>
        <div className={`${utilidad >= 0 ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'} rounded-xl sm:rounded-2xl p-3 sm:p-4`}><Wallet className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-2 opacity-80" aria-hidden="true" /><div className="text-xl sm:text-2xl font-bold">{fmtQ(utilidad)}</div><div className="text-xs opacity-80">Utilidad Neta</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="lg:col-span-2 bg-card text-card-foreground rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-border">
          <h3 className="font-bold text-foreground text-sm mb-2">Flujo de Caja Proyectado (30/60/90 días)</h3>
          <AreaChart labels={['30 días', '60 días', '90 días']} series={[
            { label: 'Ingresos', color: '#10b981', data: cashFlow.ingresos },
            { label: 'Egresos', color: '#ef4444', data: cashFlow.egresos },
          ]} />
        </div>
        <div className="bg-card text-card-foreground rounded-2xl p-4 shadow-sm border border-border">
          <h3 className="font-bold text-foreground text-sm mb-2">Gastos por Categoría</h3>
          <div className="flex items-center gap-3">
            <Donut size={110} data={porCategoria.length ? porCategoria : [{ label: '-', value: 1, color: '#e2e8f0' }]} />
            <div className="text-[11px] space-y-1 flex-1 max-h-32 overflow-y-auto">
              {porCategoria.map(c => <div key={c.label} className="flex items-center gap-1 justify-between"><span className="flex items-center gap-1 truncate"><span className="w-2 h-2 rounded-full" style={{ background: c.color }} />{c.label}</span><b className="text-foreground">{fmtQ(c.value)}</b></div>)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="lg:col-span-2">
          <div className="bg-card text-card-foreground rounded-xl sm:rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 border-b border-border gap-2">
              <h3 className="font-bold text-foreground text-sm">Movimientos</h3>
              <div className="flex gap-1" role="group" aria-label="Filtrar movimientos">
                {(['todos', 'ingreso', 'gasto'] as const).map(f => (
                  <button key={f} onClick={() => setFiltro(f)}
                    aria-pressed={filtro === f}
                    className={`text-xs px-2.5 py-1 rounded-lg capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${filtro === f ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
                <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[360px]">
                  <tbody>
                    {lista.map(m => (
                      <tr key={m.id} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                        <td className="p-2"><div className="font-semibold text-foreground">{m.descripcion}</div><div className="text-muted-foreground">{CATEGORIA_LABEL[m.categoria]} · {proyectos.find(p => p.id === m.proyectoId)?.nombre || 'Operativo'} · {m.fecha}</div></td>
                        <td className={`p-2 text-right font-bold ${m.tipo === 'ingreso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>{m.tipo === 'ingreso' ? '+' : '-'}{fmtQ(m.costoTotal)}</td>
                        <td className="p-2 w-8">
                          <button onClick={() => deleteMovimiento(m.id)} aria-label={`Eliminar movimiento ${m.descripcion}`}
                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-card text-card-foreground rounded-2xl shadow-sm mt-4 p-4 border border-border overflow-x-auto">
            <h3 className="font-bold text-foreground text-sm mb-2">Utilidad Neta por Centro de Costo</h3>
            <table className="w-full text-xs min-w-[320px]">
              <thead className="text-muted-foreground"><tr><th className="text-left pb-1">Proyecto</th><th className="text-right">Ingresos</th><th className="text-right">Egresos</th><th className="text-right">Margen</th></tr></thead>
              <tbody>
                {centrosCosto.map(c => (
                  <tr key={c.nombre} className="border-b border-border/40"><td className="py-1.5 text-foreground">{c.nombre}</td><td className="text-right text-emerald-600 dark:text-emerald-400">{fmtQ(c.ing)}</td><td className="text-right text-red-500 dark:text-red-400">{fmtQ(c.gas)}</td><td className={`text-right font-bold ${c.margen >= 0 ? 'text-foreground' : 'text-red-600 dark:text-red-400'}`}>{fmtQ(c.margen)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-foreground text-sm mb-2">Registrar Movimiento</h3>
          <MovimientoForm compact />
        </div>
      </div>
    </div>
  );
};

export default Financiero;
