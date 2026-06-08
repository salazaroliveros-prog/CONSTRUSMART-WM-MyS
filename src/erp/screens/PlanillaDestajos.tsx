import React, { useState, useMemo } from 'react';
import { useErp, uid } from '../store';
import type { Destajo } from '../types';
import { downloadBlob } from '../utils';

export const PlanillaDestajos: React.FC = () => {
  const { proyectos } = useErp();

  const [proyectoFilter, setProyectoFilter] = useState('');
  const [semanaFilter, setSemanaFilter] = useState(() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    return monday.toISOString().split('T')[0];
  });
  const [tasaPago, setTasaPago] = useState<Record<string, number>>({});

  const [destajos, setDestajos] = useState<Destajo[]>([]);

  const addDestajo = (data: Omit<Destajo, 'id' | 'rendimientoReal'>) => {
    const rendimientoReal = data.horasTrabajadas > 0 ? data.cantidadEjecutada / data.horasTrabajadas : 0;
    const nuevo: Destajo = { ...data, id: uid(), rendimientoReal };
    setDestajos(prev => [nuevo, ...prev]);
  };

  const semanaInicio = useMemo(() => new Date(semanaFilter), [semanaFilter]);
  const semanaFin = useMemo(() => {
    const end = new Date(semanaInicio);
    end.setDate(end.getDate() + 6);
    return end;
  }, [semanaInicio]);

  const destajosSemana = useMemo(() => {
    const filtered = proyectoFilter ? destajos.filter(d => d.proyectoId === proyectoFilter) : destajos;
    return filtered.filter(d => {
      const fecha = new Date(d.fecha);
      return fecha >= semanaInicio && fecha <= semanaFin;
    });
  }, [destajos, proyectoFilter, semanaInicio, semanaFin]);

  const grupos = useMemo(() => {
    const map = new Map<string, { cuadrilla: string; totalEjecutado: number; unidad: string; renglones: string[]; dias: number }>();
    destajosSemana.forEach(d => {
      const key = `${d.cuadrilla}-${d.proyectoId}`;
      const existing = map.get(key);
      if (existing) {
        existing.totalEjecutado += d.cantidadEjecutada;
        if (!existing.renglones.includes(d.renglonCodigo)) existing.renglones.push(d.renglonCodigo);
        existing.dias += 1;
      } else {
        map.set(key, { cuadrilla: d.cuadrilla, totalEjecutado: d.cantidadEjecutada, unidad: d.unidad, renglones: [d.renglonCodigo], dias: 1 });
      }
    });
    return Array.from(map.entries()).map(([key, val]) => ({ key, ...val }));
  }, [destajosSemana]);

  const planilla = useMemo(() => grupos.map(g => {
    const tasa = tasaPago[g.key] || 150;
    return { ...g, tasa, pagoSemanal: g.totalEjecutado * tasa };
  }), [grupos, tasaPago]);

  const totalPagar = planilla.reduce((a, p) => a + p.pagoSemanal, 0);

  const INPUT = 'text-sm px-3 py-2 border border-input rounded-lg outline-none focus:border-ring bg-background text-foreground';

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">📋 Planilla de Destajos — Pago Semanal</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {semanaInicio.toLocaleDateString()} — {semanaFin.toLocaleDateString()}
          </p>
        </div>
        <button onClick={() => {
          const proy = proyectos[0];
          if (!proy) return;
          addDestajo({ proyectoId: proy.id, renglonCodigo: 'EXC-001', cuadrilla: '1 Albañil + 1 Ayudante', fecha: new Date().toISOString().split('T')[0], cantidadEjecutada: Math.round(Math.random() * 20 + 5), unidad: 'm³', horasTrabajadas: 8, rendimientoTeorico: 10 });
        }} className="bg-success text-success-foreground px-3 py-1.5 rounded-lg text-xs hover:bg-success/90 font-medium">+ Demo Destajo</button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={proyectoFilter} onChange={e => setProyectoFilter(e.target.value)} className={INPUT}>
          <option value="">Todos los proyectos</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <input type="date" value={semanaFilter} onChange={e => setSemanaFilter(e.target.value)} className={INPUT} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-info/10 rounded-lg text-center">
          <p className="text-xs text-info font-medium">Cuadrillas</p>
          <p className="text-xl font-bold text-info">{planilla.length}</p>
        </div>
        <div className="p-3 bg-success/10 rounded-lg text-center">
          <p className="text-xs text-success font-medium">Destajos</p>
          <p className="text-xl font-bold text-success">{destajosSemana.length}</p>
        </div>
        <div className="p-3 bg-primary/10 rounded-lg text-center">
          <p className="text-xs text-primary font-medium">Total a Pagar</p>
          <p className="text-xl font-bold text-primary">Q{totalPagar.toFixed(2)}</p>
        </div>
        <div className="p-3 bg-muted rounded-lg text-center">
          <p className="text-xs text-muted-foreground font-medium">Promedio/Cuadrilla</p>
          <p className="text-xl font-bold text-foreground">Q{planilla.length > 0 ? (totalPagar / planilla.length).toFixed(2) : '0.00'}</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left">Cuadrilla</th>
              <th className="p-2 text-right">Total Ejecutado</th>
              <th className="p-2 text-left">Unidad</th>
              <th className="p-2 text-right">Días</th>
              <th className="p-2 text-right">Tasa (Q/unidad)</th>
              <th className="p-2 text-right">Pago Semanal</th>
            </tr>
          </thead>
          <tbody>
            {planilla.map(p => (
              <tr key={p.key} className="border-t hover:bg-muted/50">
                <td className="p-2 font-medium text-foreground">
                  {p.cuadrilla}
                  <div className="text-xs text-muted-foreground">{p.renglones.join(', ')}</div>
                </td>
                <td className="p-2 text-right font-mono">{p.totalEjecutado.toFixed(2)}</td>
                <td className="p-2 text-xs">{p.unidad}</td>
                <td className="p-2 text-right">{p.dias}</td>
                <td className="p-2 text-right">
                  <input type="number" value={tasaPago[p.key] || 150}
                    onChange={e => setTasaPago(prev => ({ ...prev, [p.key]: +e.target.value }))}
                    className="w-20 text-right px-2 py-1 border border-input rounded-lg text-sm font-mono bg-background text-foreground outline-none focus:border-ring" />
                </td>
                <td className="p-2 text-right font-bold font-mono text-success">
                  Q{p.pagoSemanal.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          {planilla.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-border bg-muted font-bold">
                <td className="p-2 text-foreground" colSpan={4}>TOTALES</td>
                <td className="p-2 text-right text-muted-foreground">—</td>
                <td className="p-2 text-right text-success">Q{totalPagar.toFixed(2)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {planilla.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">No hay destajos registrados para esta semana.</p>
          <p className="text-muted-foreground text-xs mt-1">Registra destajos en Rendimiento → Destajos.</p>
        </div>
      )}

      {planilla.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button onClick={() => {
            let csv = 'Cuadrilla,Total Ejecutado,Unidad,Días,Tasa (Q),Pago Semanal\n';
            planilla.forEach(p => { csv += `"${p.cuadrilla}",${p.totalEjecutado.toFixed(2)},"${p.unidad}",${p.dias},${p.tasa},${p.pagoSemanal.toFixed(2)}\n`; });
            csv += `,,,,TOTAL,${totalPagar.toFixed(2)}\n`;
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            downloadBlob(blob, `planilla_destajos_${semanaFilter}.csv`);
          }} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90 font-medium">
            📥 Exportar CSV
          </button>
        </div>
      )}
    </div>
  );
};

export default PlanillaDestajos;
