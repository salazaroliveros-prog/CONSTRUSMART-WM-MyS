import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { fmtQ, fmtPct } from '../utils';
import { BarChart, LineChart, Donut } from '../components/Charts';
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { List as VirtualizedList } from 'react-window';

const ROW_HEIGHT = 42;

const Financiero: React.FC = () => {
  const { t } = useTranslation();
  const { movimientos, proyectos } = useErp();
  const [filtroProyecto, setFiltroProyecto] = useState<string>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [filtroFecha, setFiltroFecha] = useState<string>('mes');
  const [loading, setLoading] = useState(true);

  useEffect(() => { setTimeout(() => setLoading(false), 300); }, []);

  const movimientosFiltrados = useMemo(() => {
    let data = [...movimientos];
    if (filtroProyecto !== 'todos') data = data.filter(m => m.proyectoId === filtroProyecto);
    if (filtroCategoria !== 'todos') data = data.filter(m => m.categoria === filtroCategoria);
    const now = new Date();
    if (filtroFecha === 'mes') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      data = data.filter(m => new Date(m.fecha) >= start);
    } else if (filtroFecha === 'trimestre') {
      const start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      data = data.filter(m => new Date(m.fecha) >= start);
    } else if (filtroFecha === 'anio') {
      const start = new Date(now.getFullYear(), 0, 1);
      data = data.filter(m => new Date(m.fecha) >= start);
    }
    return data;
  }, [movimientos, filtroProyecto, filtroCategoria, filtroFecha]);

  const ingresos = useMemo(() => movimientosFiltrados.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + (m.monto || 0), 0), [movimientosFiltrados]);
  const egresos = useMemo(() => movimientosFiltrados.filter(m => m.tipo !== 'ingreso').reduce((s, m) => s + (m.monto || 0), 0), [movimientosFiltrados]);
  const utilidad = useMemo(() => ingresos - egresos, [ingresos, egresos]);
  const margen = useMemo(() => ingresos > 0 ? utilidad / ingresos : 0, [ingresos, utilidad]);

  const gastosPorCategoria = useMemo(() => {
    const cats: Record<string, number> = {};
    movimientosFiltrados.filter(m => m.tipo !== 'ingreso').forEach(m => { cats[m.categoria] = (cats[m.categoria] || 0) + (m.monto || 0); });
    return Object.entries(cats).map(([cat, val]) => ({ label: t(`movimientos.categoria_${cat}`) || cat, value: val, color: '#ef4444' }));
  }, [movimientosFiltrados, t]);

  const flujoCaja = useMemo(() => {
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const now = new Date();
    const data: { label: string; ingresos: number; egresos: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = meses[d.getMonth()];
      const movs = movimientos.filter(m => { const md = new Date(m.fecha); return md.getFullYear() === d.getFullYear() && md.getMonth() === d.getMonth(); });
      const ing = movs.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + (m.monto || 0), 0);
      const eg = movs.filter(m => m.tipo !== 'ingreso').reduce((s, m) => s + (m.monto || 0), 0);
      data.push({ label, ingresos: ing, egresos: eg });
    }
    return data;
  }, [movimientos]);

  const shouldVirtualize = movimientosFiltrados.length > 100;

  const renderRow = useCallback((m: typeof movimientos[0], _index: number) => (
    <tr key={m.id} className="border-b border-border">
      <td className="p-2 text-muted-foreground">{new Date(m.fecha).toLocaleDateString()}</td>
      <td className="p-2">{proyectos.find(p => p.id === m.proyectoId)?.nombre || '-'}</td>
      <td className="p-2">{t(`movimientos.categoria_${m.categoria}`) || m.categoria}</td>
      <td className="p-2">{m.descripcion}</td>
      <td className={`p-2 text-right font-medium ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-600'}`}>{m.tipo === 'ingreso' ? '+' : '-'}{fmtQ(m.monto)}</td>
      <td className="p-2 text-right text-muted-foreground">{fmtQ(m.monto)}</td>
    </tr>
  ), [proyectos, t]);

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><div className="grid grid-cols-3 gap-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div><Skeleton className="h-64" /><Skeleton className="h-96" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
          <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" aria-hidden="true" />
          {t('financiero.titulo')}
        </h1>
        <div className="flex gap-2">
          <select value={filtroProyecto} onChange={e => setFiltroProyecto(e.target.value)} className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm">
            <option value="todos">{t('financiero.todos_proyectos')}</option>
            {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm">
            <option value="todos">{t('financiero.todas_categorias')}</option>
          </select>
          <select value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm">
            <option value="mes">{t('financiero.filtro_mes')}</option>
            <option value="trimestre">{t('financiero.filtro_trimestre')}</option>
            <option value="anio">{t('financiero.filtro_anio')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <ArrowUpRight className="w-5 h-5 opacity-80" aria-hidden="true" />
            <span className="text-xs opacity-80">{t('financiero.ingresos_sub')}</span>
          </div>
          <div className="text-2xl font-bold">{fmtQ(ingresos)}</div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <ArrowDownRight className="w-5 h-5 opacity-80" aria-hidden="true" />
            <span className="text-xs opacity-80">{t('financiero.gastos_sub')}</span>
          </div>
          <div className="text-2xl font-bold">{fmtQ(egresos)}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 opacity-80" aria-hidden="true" />
            <span className="text-xs opacity-80">{t('financiero.utilidad_sub')}</span>
          </div>
          <div className="text-2xl font-bold">{fmtQ(utilidad)}</div>
          <div className="text-xs opacity-80 mt-1">{fmtPct(margen)} {t('financiero.margen')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" aria-hidden="true" />
            {t('financiero.flujo_caja')}
          </h3>
          <div className="h-64">
            <LineChart data={flujoCaja.map(d => ({ ...d, label: d.label }))} />
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-500" aria-hidden="true" />
            {t('financiero.gastos_categoria')}
          </h3>
          <div className="h-64">
            <Donut data={gastosPorCategoria.length > 0 ? gastosPorCategoria : [{ label: t('financiero.sin_datos'), value: 1, color: '#ccc' }]} />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-500" aria-hidden="true" />
          {t('financiero.movimientos')}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table" aria-label={t('financiero.movimientos')}>
            <thead><tr className="border-b border-border">
              <th className="text-left p-2" scope="col">{t('financiero.col_fecha')}</th>
              <th className="text-left p-2" scope="col">{t('financiero.col_proyecto')}</th>
              <th className="text-left p-2" scope="col">{t('financiero.col_categoria')}</th>
              <th className="text-left p-2" scope="col">{t('financiero.col_descripcion')}</th>
              <th className="text-right p-2" scope="col">{t('financiero.col_monto')}</th>
              <th className="text-right p-2" scope="col">{t('financiero.col_saldo')}</th>
            </tr></thead>
            <tbody>
              {!shouldVirtualize && movimientosFiltrados.map((m, i) => renderRow(m, i))}
              {movimientosFiltrados.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">{t('financiero.sin_movimientos')}</td></tr>}
            </tbody>
          </table>
          {shouldVirtualize && movimientosFiltrados.length > 0 && (
            <VirtualizedList
              height={Math.min(480, movimientosFiltrados.length * ROW_HEIGHT)}
              itemCount={movimientosFiltrados.length}
              itemSize={ROW_HEIGHT}
              width="100%"
              overscanCount={5}
            >
              {({ index, style }: { index: number; style: React.CSSProperties }) => (
                <div style={style}>
                  <table className="w-full text-sm" role="presentation">
                    <tbody>{renderRow(movimientosFiltrados[index], index)}</tbody>
                  </table>
                </div>
              )}
            </VirtualizedList>
          )}
        </div>
      </div>
    </div>
  );
};
export default Financiero;