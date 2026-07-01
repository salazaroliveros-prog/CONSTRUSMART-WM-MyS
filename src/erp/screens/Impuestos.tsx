import { Skeleton } from '@/components/ui/skeleton';
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import ProyectoFilter from '../components/ProyectoFilter';
import { CATEGORIA_LABEL } from '../utils';

export const Impuestos: React.FC = () => {
  const { t } = useTranslation();
  const { movimientos, proyectos } = useErp();

  const [proyectoFilter, setProyectoFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { setLoading(false); }, []);
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

  // Cálculos de impuestos
  const calculos = useMemo(() => {
    const ingresos = movimientosFiltrados
      .filter(m => m.tipo === 'ingreso')
      .reduce((a, m) => a + m.monto, 0);

    const egresos = movimientosFiltrados
      .filter(m => m.tipo === 'gasto' || m.tipo === 'egreso')
      .reduce((a, m) => a + m.monto, 0);

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">📊 {t('impuestos.titulo')}</h1>
        <div className="text-xs text-gray-500">
          {t('impuestos.subtitulo')}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <ProyectoFilter value={proyectoFilter} onChange={setProyectoFilter} proyectos={proyectos} />
        <input type="month" value={mesFilter} onChange={e => setMesFilter(e.target.value)}
          className="text-sm px-3 py-2 border rounded" />
      </div>

      {/* Resumen del período */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">{t('impuestos.resumen_periodo')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600">{t('impuestos.ingresos')}</p>
              <p className="text-xl font-bold text-green-700">Q{calculos.ingresos.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-red-600">{t('impuestos.egresos')}</p>
              <p className="text-xl font-bold text-red-700">Q{calculos.egresos.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg col-span-2">
              <p className="text-xs text-blue-600">{t('impuestos.utilidad_bruta')}</p>
              <p className={`text-xl font-bold ${calculos.utilidadBruta >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                Q{calculos.utilidadBruta.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">{t('impuestos.impuestos_periodo')}</h3>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-yellow-600 font-medium">{t('impuestos.isr')}</p>
                  <p className="text-xs text-gray-400">{t('impuestos.isr_desc')}</p>
                </div>
                <p className="text-lg font-bold text-yellow-700">
                  Q{calculos.isr.toLocaleString()}
                </p>
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>{t('impuestos.tasa_efectiva')}: {calculos.tasaEfectiva.toFixed(1)}%</span>
                <span>{t('impuestos.base')}: Q{Math.max(0, calculos.utilidadBruta).toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-orange-600 font-medium">{t('impuestos.iva_pagar')}</p>
                  <p className="text-xs text-gray-400">{t('impuestos.iva_desc')}</p>
                </div>
                <p className="text-lg font-bold text-orange-700">
                  Q{calculos.ivaPagar.toLocaleString()}
                </p>
              </div>
              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-400">
                <span>{t('impuestos.iva_debito')}: Q{calculos.ivaSobreIngresos.toLocaleString()}</span>
                <span>{t('impuestos.iva_credito')}: Q{calculos.ivaAcreditable.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Base de cálculo detallada */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-3">📋 {t('impuestos.detalle_calculo')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm">
          <div>
            <h4 className="font-medium mb-2">{t('impuestos.calculo_isr')}</h4>
            <div className="space-y-1 text-gray-600">
              <p>{t('impuestos.ingresos_gravables')}: Q{calculos.ingresos.toLocaleString()}</p>
              <p>{t('impuestos.egresos_deducibles')}: Q{calculos.egresos.toLocaleString()}</p>
              <p className="border-t pt-1 font-semibold">{t('impuestos.renta_imponible')}: Q{Math.max(0, calculos.utilidadBruta).toLocaleString()}</p>
              <p>{t('impuestos.isr_25')}: <span className="font-bold text-yellow-700">Q{calculos.isr.toLocaleString()}</span></p>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">{t('impuestos.calculo_iva')}</h4>
            <div className="space-y-1 text-gray-600">
              <p>{t('impuestos.ingresos_base')}: Q{calculos.ingresos.toLocaleString()}</p>
              <p>{t('impuestos.iva_debito_12')}: Q{calculos.ivaSobreIngresos.toLocaleString()}</p>
              <p>{t('impuestos.iva_credito_12')}: Q{calculos.ivaAcreditable.toLocaleString()}</p>
              <p className="border-t pt-1 font-semibold">{t('impuestos.iva_pagar')}: <span className="font-bold text-orange-700">Q{calculos.ivaPagar.toLocaleString()}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Movimientos del período */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-500 mb-3">
          {t('impuestos.movimientos_periodo')} ({movimientosFiltrados.length} {t('impuestos.registros')})
        </h3>
        <div className="overflow-x-auto max-h-60 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="p-2 text-left text-xs">{t('common.fecha')}</th>
                <th className="p-2 text-left text-xs">{t('common.descripcion')}</th>
                <th className="p-2 text-left text-xs">{t('common.tipo')}</th>
                <th className="p-2 text-right text-xs">{t('impuestos.monto')}</th>
                <th className="p-2 text-left text-xs">{t('common.categoria')}</th>
              </tr>
            </thead>
            <tbody>
              {movimientosFiltrados.map(m => (
                <tr key={m.id} className="border-t hover:bg-gray-50">
                  <td className="p-2 text-xs">{new Date(m.fecha).toLocaleDateString()}</td>
                  <td className="p-2 text-xs">{m.descripcion}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      m.tipo === 'ingreso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>{m.tipo}</span>
                  </td>
                  <td className="p-2 text-right font-mono text-xs">Q{m.monto.toLocaleString()}</td>
                  <td className="p-2 text-xs text-gray-500">{CATEGORIA_LABEL[m.categoria as keyof typeof CATEGORIA_LABEL] ?? m.categoria}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Impuestos;