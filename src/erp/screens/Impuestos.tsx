import React, { useState, useMemo } from 'react';
import { useErp } from '../store';

export const Impuestos: React.FC = () => {
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
    const fechaFin = new Date(y, m, 0);
    let filtered = movimientos;
    if (proyectoFilter) {
      filtered = filtered.filter(mv => mv.proyectoId === proyectoFilter);
    }
    return filtered.filter(mv => {
      const fecha = new Date(mv.fecha);
      return fecha >= fechaInicio && fecha <= fechaFin;
    });
  }, [movimientos, proyectoFilter, mesFilter]);

  // Cálculos de impuestos
  const calculos = useMemo(() => {
    const ingresos = movimientosFiltrados
      .filter(m => m.tipo === 'ingreso')
      .reduce((a, m) => a + m.monto, 0);

    const egresos = movimientosFiltrados
      .filter(m => m.tipo === 'egreso')
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

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">📊 Automatización de Impuestos</h1>
        <div className="text-xs text-gray-500">
          Retenciones ISR e IVA — Guatemala
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={proyectoFilter} onChange={e => setProyectoFilter(e.target.value)}
          className="text-sm px-3 py-2 border rounded">
          <option value="">Consolidado (todos)</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <input type="month" value={mesFilter} onChange={e => setMesFilter(e.target.value)}
          className="text-sm px-3 py-2 border rounded" />
      </div>

      {/* Resumen del período */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">RESUMEN DEL PERÍODO</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600">Ingresos</p>
              <p className="text-xl font-bold text-green-700">Q{calculos.ingresos.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-red-600">Egresos</p>
              <p className="text-xl font-bold text-red-700">Q{calculos.egresos.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg col-span-2">
              <p className="text-xs text-blue-600">Utilidad Bruta</p>
              <p className={`text-xl font-bold ${calculos.utilidadBruta >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                Q{calculos.utilidadBruta.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">IMPUESTOS DEL PERÍODO</h3>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-yellow-600 font-medium">ISR (25% s/utilidad)</p>
                  <p className="text-xs text-gray-400">Impuesto Sobre la Renta</p>
                </div>
                <p className="text-lg font-bold text-yellow-700">
                  Q{calculos.isr.toLocaleString()}
                </p>
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>Tasa efectiva: {calculos.tasaEfectiva.toFixed(1)}%</span>
                <span>Base: Q{Math.max(0, calculos.utilidadBruta).toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-orange-600 font-medium">IVA por Pagar</p>
                  <p className="text-xs text-gray-400">IVA Débito - IVA Crédito</p>
                </div>
                <p className="text-lg font-bold text-orange-700">
                  Q{calculos.ivaPagar.toLocaleString()}
                </p>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-gray-400">
                <span>IVA Débito (12% s/ingresos): Q{calculos.ivaSobreIngresos.toLocaleString()}</span>
                <span>IVA Crédito (12% s/gastos): Q{calculos.ivaAcreditable.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Base de cálculo detallada */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-3">📋 DETALLE DE CÁLCULO</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium mb-2">Cálculo del ISR</h4>
            <div className="space-y-1 text-gray-600">
              <p>Ingresos gravables: Q{calculos.ingresos.toLocaleString()}</p>
              <p>Egresos deducibles: Q{calculos.egresos.toLocaleString()}</p>
              <p className="border-t pt-1 font-semibold">Renta imponible: Q{Math.max(0, calculos.utilidadBruta).toLocaleString()}</p>
              <p>ISR (25%): <span className="font-bold text-yellow-700">Q{calculos.isr.toLocaleString()}</span></p>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Cálculo del IVA</h4>
            <div className="space-y-1 text-gray-600">
              <p>Ingresos base: Q{calculos.ingresos.toLocaleString()}</p>
              <p>IVA Débito (12%): Q{calculos.ivaSobreIngresos.toLocaleString()}</p>
              <p>IVA Crédito (12% s/70% gastos): Q{calculos.ivaAcreditable.toLocaleString()}</p>
              <p className="border-t pt-1 font-semibold">IVA por Pagar: <span className="font-bold text-orange-700">Q{calculos.ivaPagar.toLocaleString()}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Movimientos del período */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-500 mb-3">
          Movimientos del Período ({movimientosFiltrados.length} registros)
        </h3>
        <div className="overflow-x-auto max-h-60 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="p-2 text-left text-xs">Fecha</th>
                <th className="p-2 text-left text-xs">Descripción</th>
                <th className="p-2 text-left text-xs">Tipo</th>
                <th className="p-2 text-right text-xs">Monto</th>
                <th className="p-2 text-left text-xs">Categoría</th>
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
                  <td className="p-2 text-xs text-gray-500">{m.categoria}</td>
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