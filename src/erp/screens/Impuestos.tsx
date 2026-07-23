import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { BarChart3, FileText } from 'lucide-react';
import ProyectoFilter from '../components/ProyectoFilter';
import { CATEGORIA_LABEL, fmtQ } from '../utils';
import { List as VirtualizedList } from 'react-window';
import { Skeleton } from '@/components/ui/skeleton';

const ROW_HEIGHT = 36;

export const Impuestos: React.FC = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);
  const { t } = useTranslation();
  const { movimientos, proyectos } = useErp();

  const [proyectoFilter, setProyectoFilter] = useState('');
  const [mesFilter, setMesFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Impuestos: fechas calculadas dentro del useMemo para evitar dependencias inestables
  const movimientosFiltrados = useMemo(() => {
    const [y, m] = mesFilter.split('-').map(Number);
    const fechaInicio = new Date(y, m - 1, 1);
    const fechaFin = new Date(y, m, 1);
    let filtered = movimientos;
    if (proyectoFilter) {
      filtered = filtered.filter(mv => mv.proyectoId === proyectoFilter);
    }
    return filtered.filter(mv => {
      const fecha = new Date(mv.fecha);
      return fecha >= fechaInicio && fecha < fechaFin;
    });
  }, [movimientos, proyectoFilter, mesFilter]);

  const shouldVirtualize = movimientosFiltrados.length > 50;

  const renderRow = useCallback((m: typeof movimientos[0], _index: number) => (
    <tr key={m.id} className="border-t border-border hover:bg-muted/50">
      <td className="p-2 text-xs">{new Date(m.fecha).toLocaleDateString('es-GT')}</td>
      <td className="p-2 text-xs truncate" title={m.descripcion}>{m.descripcion}</td>
      <td className="p-2">
        <span className={`px-2 py-0.5 rounded text-xs ${
          m.tipo === 'ingreso' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
        }`}>{m.tipo}</span>
      </td>
      <td className="p-2 text-right font-mono text-xs">{fmtQ(m.monto ?? m.costoTotal ?? 0)}</td>
      <td className="p-2 text-xs text-muted-foreground truncate">{CATEGORIA_LABEL[m.categoria as keyof typeof CATEGORIA_LABEL] ?? m.categoria}</td>
    </tr>
  ), []);

  // Cálculos de impuestos
  const calculos = useMemo(() => {
    const ingresos = movimientosFiltrados
      .filter(m => m.tipo === 'ingreso')
      .reduce((a, m) => a + (m.monto ?? m.costoTotal ?? 0), 0);

    const egresos = movimientosFiltrados
      .filter(m => m.tipo === 'gasto' || m.tipo === 'egreso')
      .reduce((a, m) => a + (m.monto ?? m.costoTotal ?? 0), 0);

    const utilidadBruta = ingresos - egresos;

    // ISR: 25% sobre utilidad (Guatemala)
    const isr = Math.max(0, utilidadBruta * 0.25);

    // IVA: 12% sobre ingresos
    const ivaSobreIngresos = ingresos * 0.12;

    // IVA acreditable: 12% sobre egresos facturables (asumimos 70% facturable)
    const egresosFacturables = egresos * 0.7;
    const ivaAcreditable = egresosFacturables * 0.12;

    // IVA por pagar
    const ivaPagar = Math.max(0, ivaSobreIngresos - ivaAcreditable);

    return {
      ingresos,
      egresos,
      utilidadBruta,
      isr,
      ivaSobreIngresos,
      ivaAcreditable,
      ivaPagar,
      tasaEfectiva: ingresos > 0 ? (isr / ingresos) * 100 : 0,
    };
  }, [movimientosFiltrados]);

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
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2"><BarChart3 className="w-5 h-5" /> {t('impuestos.titulo')}</h1>
        <div className="text-xs text-muted-foreground">
          {t('impuestos.subtitulo')}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <ProyectoFilter value={proyectoFilter} onChange={setProyectoFilter} proyectos={proyectos} />
        <input type="month" value={mesFilter} onChange={e => setMesFilter(e.target.value)}
          className="text-sm px-3 py-2 border border-border rounded-lg bg-background text-foreground outline-none focus:border-ring" />
      </div>

      {/* Resumen del período */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 truncate" title={t('impuestos.resumen_periodo')}>{t('impuestos.resumen_periodo')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs text-emerald-600 dark:text-emerald-400">{t('impuestos.ingresos')}</p>
               <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{fmtQ(calculos.ingresos)}</p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-600 dark:text-red-400">{t('impuestos.egresos')}</p>
               <p className="text-xl font-bold text-red-700 dark:text-red-300">{fmtQ(calculos.egresos)}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 col-span-2">
              <p className="text-xs text-blue-600 dark:text-blue-400">{t('impuestos.utilidad_bruta')}</p>
                 <p className={`text-xl font-bold ${calculos.utilidadBruta >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
                  {fmtQ(calculos.utilidadBruta)}
                </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 truncate" title={t('impuestos.impuestos_periodo')}>{t('impuestos.impuestos_periodo')}</h3>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/40 rounded-xl border border-yellow-200 dark:border-yellow-800">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">{t('impuestos.isr')}</p>
                  <p className="text-xs text-muted-foreground">{t('impuestos.isr_desc')}</p>
                </div>
                   <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                   {fmtQ(calculos.isr)}
                 </p>
              </div>
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                 <span>{t('impuestos.tasa_efectiva')}: {calculos.tasaEfectiva.toFixed(1)}%</span>
                 <span>{t('impuestos.base')}: {fmtQ(Math.max(0, calculos.utilidadBruta))}</span>
              </div>
            </div>

            <div className="p-3 bg-orange-50 dark:bg-orange-950/40 rounded-xl border border-orange-200 dark:border-orange-800">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">{t('impuestos.iva_pagar')}</p>
                  <p className="text-xs text-muted-foreground">{t('impuestos.iva_desc')}</p>
                </div>
                 <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                   {fmtQ(calculos.ivaPagar)}
                 </p>
               </div>
               <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                 <span>{t('impuestos.iva_debito')}: {fmtQ(calculos.ivaSobreIngresos)}</span>
                 <span>{t('impuestos.iva_credito')}: {fmtQ(calculos.ivaAcreditable)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Base de cálculo detallada */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5"><FileText className="w-4 h-4" /> {t('impuestos.detalle_calculo')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm">
          <div>
            <h4 className="font-medium mb-2">{t('impuestos.calculo_isr')}</h4>
            <div className="space-y-1 text-muted-foreground">
               <p>{t('impuestos.ingresos_gravables')}: {fmtQ(calculos.ingresos)}</p>
               <p>{t('impuestos.egresos_deducibles')}: {fmtQ(calculos.egresos)}</p>
               <p className="border-t border-border pt-1 font-semibold">{t('impuestos.renta_imponible')}: {fmtQ(Math.max(0, calculos.utilidadBruta))}</p>
               <p>{t('impuestos.isr_25')}: <span className="font-bold text-yellow-700 dark:text-yellow-300">{fmtQ(calculos.isr)}</span></p>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">{t('impuestos.calculo_iva')}</h4>
            <div className="space-y-1 text-muted-foreground">
               <p>{t('impuestos.ingresos_base')}: {fmtQ(calculos.ingresos)}</p>
               <p>{t('impuestos.iva_debito_12')}: {fmtQ(calculos.ivaSobreIngresos)}</p>
               <p>{t('impuestos.iva_credito_12')}: {fmtQ(calculos.ivaAcreditable)}</p>
               <p className="border-t border-border pt-1 font-semibold">{t('impuestos.iva_pagar')}: <span className="font-bold text-orange-700 dark:text-orange-300">{fmtQ(calculos.ivaPagar)}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Movimientos del período */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 truncate" title={t('impuestos.movimientos_periodo')}>
          {t('impuestos.movimientos_periodo')} ({movimientosFiltrados.length} {t('impuestos.registros')})
        </h3>
        {movimientosFiltrados.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-500" />
            <p className="text-sm">{t('impuestos.sin_movimientos_periodo')}</p>
          </div>
        ) : (
        <div className="overflow-x-auto max-h-60 overflow-y-auto">
          <table role="table" className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80">
              <tr>
                <th scope="col" className="p-2 text-left text-xs">{t('common.fecha')}</th>
                <th scope="col" className="p-2 text-left text-xs">{t('common.descripcion')}</th>
                <th scope="col" className="p-2 text-left text-xs">{t('common.tipo')}</th>
                <th scope="col" className="p-2 text-right text-xs">{t('impuestos.monto')}</th>
                <th scope="col" className="p-2 text-left text-xs">{t('common.categoria')}</th>
              </tr>
            </thead>
            <tbody>
              {!shouldVirtualize && movimientosFiltrados.map((m, i) => renderRow(m, i))}
              {shouldVirtualize && movimientosFiltrados.length > 0 && (
                <div className="overflow-auto" style={{ maxHeight: Math.min(240, movimientosFiltrados.length * ROW_HEIGHT) }}>
                  <table className="w-full text-sm" role="presentation">
                    <tbody>{movimientosFiltrados.map((m, i) => renderRow(m, i))}</tbody>
                  </table>
                </div>
              )}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
};

export default Impuestos;
