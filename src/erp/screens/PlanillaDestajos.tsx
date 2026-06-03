import React, { useState, useMemo } from 'react';
import { useErp } from '../store';
import { useNuevosModulos } from '../hooks/useNuevosModulos';

export const PlanillaDestajos: React.FC = () => {
  const { proyectos, empleados } = useErp();
  const { destajos, getDestajosByProyecto } = useNuevosModulos();

  const [proyectoFilter, setProyectoFilter] = useState('');
  const [semanaFilter, setSemanaFilter] = useState(() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    return monday.toISOString().split('T')[0];
  });
  const [tasaPago, setTasaPago] = useState<Record<string, number>>({});

  // Calcular lunes de la semana seleccionada
  const semanaInicio = useMemo(() => new Date(semanaFilter), [semanaFilter]);
  const semanaFin = useMemo(() => {
    const end = new Date(semanaInicio);
    end.setDate(end.getDate() + 6);
    return end;
  }, [semanaInicio]);

  // Filtro de destajos por proyecto y semana
  const destajosSemana = useMemo(() => {
    let filtered = proyectoFilter
      ? getDestajosByProyecto(proyectoFilter)
      : destajos;

    return filtered.filter(d => {
      const fecha = new Date(d.fecha);
      return fecha >= semanaInicio && fecha <= semanaFin;
    });
  }, [destajos, proyectoFilter, semanaInicio, semanaFin, getDestajosByProyecto]);

  // Agrupar por cuadrilla
  const grupos = useMemo(() => {
    const map = new Map<string, { cuadrilla: string; totalEjecutado: number; unidad: string; renglones: string[]; dias: number }>();

    destajosSemana.forEach(d => {
      const key = `${d.cuadrilla}-${d.proyectoId}`;
      const existing = map.get(key);
      if (existing) {
        existing.totalEjecutado += d.cantidadEjecutada;
        if (!existing.renglones.includes(d.renglonCodigo)) {
          existing.renglones.push(d.renglonCodigo);
        }
        existing.dias += 1;
      } else {
        map.set(key, {
          cuadrilla: d.cuadrilla,
          totalEjecutado: d.cantidadEjecutada,
          unidad: d.unidad,
          renglones: [d.renglonCodigo],
          dias: 1,
        });
      }
    });

    return Array.from(map.entries()).map(([key, val]) => ({ key, ...val }));
  }, [destajosSemana]);

  // Calcular pago semanal
  const planilla = useMemo(() => {
    return grupos.map(g => {
      const tasa = tasaPago[g.key] || 150; // Default Q150/destajo
      const pago = g.totalEjecutado * tasa;
      return {
        ...g,
        tasa,
        pagoSemanal: pago,
      };
    });
  }, [grupos, tasaPago]);

  const totalPagar = planilla.reduce((a, p) => a + p.pagoSemanal, 0);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">📋 Planilla de Destajos — Pago Semanal</h1>
        <div className="flex gap-2 text-sm">
          <span className="text-gray-500">
            {semanaInicio.toLocaleDateString()} — {semanaFin.toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={proyectoFilter} onChange={e => setProyectoFilter(e.target.value)}
          className="text-sm px-3 py-2 border rounded">
          <option value="">Todos los proyectos</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <input type="date" value={semanaFilter} onChange={e => setSemanaFilter(e.target.value)}
          className="text-sm px-3 py-2 border rounded" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-blue-50 rounded-lg text-center">
          <p className="text-xs text-blue-600">Cuadrillas</p>
          <p className="text-xl font-bold text-blue-700">{planilla.length}</p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg text-center">
          <p className="text-xs text-green-600">Destajos registrados</p>
          <p className="text-xl font-bold text-green-700">{destajosSemana.length}</p>
        </div>
        <div className="p-3 bg-orange-50 rounded-lg text-center">
          <p className="text-xs text-orange-600">Total a Pagar</p>
          <p className="text-xl font-bold text-orange-700">Q{totalPagar.toFixed(2)}</p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg text-center">
          <p className="text-xs text-purple-600">Promedio/Cuadrilla</p>
          <p className="text-xl font-bold text-purple-700">
            Q{planilla.length > 0 ? (totalPagar / planilla.length).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      {/* Tabla de planilla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Cuadrilla</th>
              <th className="p-2 text-right">Total Ejecutado</th>
              <th className="p-2 text-left">Unidad</th>
              <th className="p-2 text-right">Días</th>
              <th className="p-2 text-right">Tasa (Q/x unidad)</th>
              <th className="p-2 text-right">Pago Semanal</th>
            </tr>
          </thead>
          <tbody>
            {planilla.map(p => (
              <tr key={p.key} className="border-t hover:bg-gray-50">
                <td className="p-2 font-medium">
                  {p.cuadrilla}
                  <div className="text-xs text-gray-400">{p.renglones.join(', ')}</div>
                </td>
                <td className="p-2 text-right font-mono">{p.totalEjecutado.toFixed(2)}</td>
                <td className="p-2 text-xs">{p.unidad}</td>
                <td className="p-2 text-right">{p.dias}</td>
                <td className="p-2 text-right">
                  <input type="number" value={tasaPago[p.key] || 150}
                    onChange={e => setTasaPago(prev => ({ ...prev, [p.key]: +e.target.value }))}
                    className="w-20 text-right px-2 py-1 border rounded text-sm font-mono" />
                </td>
                <td className="p-2 text-right font-bold font-mono text-green-700">
                  Q{p.pagoSemanal.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
              <td className="p-2" colSpan={4}>TOTALES</td>
              <td className="p-2 text-right">—</td>
              <td className="p-2 text-right text-green-700">Q{totalPagar.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {planilla.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">No hay destajos registrados para esta semana.</p>
          <p className="text-gray-400 text-xs mt-1">Registra destajos en el módulo Rendimiento → Destajos.</p>
        </div>
      )}

      {/* Botón exportar */}
      {planilla.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button onClick={() => {
            let csv = 'Cuadrilla,Total Ejecutado,Unidad,Días,Tasa (Q),Pago Semanal\n';
            planilla.forEach(p => {
              csv += `"${p.cuadrilla}",${p.totalEjecutado.toFixed(2)},"${p.unidad}",${p.dias},${p.tasa},${p.pagoSemanal.toFixed(2)}\n`;
            });
            csv += `,,,,TOTAL,${totalPagar.toFixed(2)}\n`;
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `planilla_destajos_${semanaFilter}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
            📥 Exportar CSV
          </button>
        </div>
      )}
    </div>
  );
};

export default PlanillaDestajos;