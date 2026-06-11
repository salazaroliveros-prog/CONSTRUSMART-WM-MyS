import React, { useState, useMemo } from 'react';
import { useErp } from '../store';
import ProyectoFilter from '../components/ProyectoFilter';
import { downloadBlob } from '../utils';

export const PlanillaDestajos: React.FC = () => {
  const { proyectos, destajos, addDestajo, deleteDestajo } = useErp();

  const [proyectoFilter, setProyectoFilter] = useState('');
  const [semanaFilter, setSemanaFilter] = useState(() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    return monday.toISOString().split('T')[0];
  });
  const [tasaPago, setTasaPago] = useState<Record<string, number>>({});

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    proyectoId: '', renglonCodigo: '', cuadrilla: '',
    fecha: new Date().toISOString().split('T')[0],
    cantidadEjecutada: 0, unidad: '', horasTrabajadas: 8, rendimientoTeorico: 0,
  });

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

  const handleSubmitForm = () => {
    if (!formData.proyectoId || !formData.renglonCodigo || !formData.cuadrilla) return;
    const rendimientoReal = formData.horasTrabajadas > 0 ? formData.cantidadEjecutada / formData.horasTrabajadas : 0;
    addDestajo({ ...formData, rendimientoReal });
    setFormData({
      proyectoId: '', renglonCodigo: '', cuadrilla: '',
      fecha: new Date().toISOString().split('T')[0],
      cantidadEjecutada: 0, unidad: '', horasTrabajadas: 8, rendimientoTeorico: 0,
    });
    setShowForm(false);
  };

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
        <button onClick={() => setShowForm(true)}
          className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs hover:bg-primary/90 font-medium">
          + Nuevo Destajo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <ProyectoFilter value={proyectoFilter} onChange={setProyectoFilter} proyectos={proyectos} />
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
          <p className="text-muted-foreground text-xs mt-1">Agrega un destajo usando el botón &quot;+ Nuevo Destajo&quot;.</p>
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

      {/* Modal Nuevo Destajo */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-4">Nuevo Destajo</h3>
            <div className="grid gap-3">
              <select value={formData.proyectoId} onChange={e => setFormData(p => ({ ...p, proyectoId: e.target.value }))} className={INPUT}>
                <option value="">Seleccionar proyecto</option>
                {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <input placeholder="Renglón código" value={formData.renglonCodigo} onChange={e => setFormData(p => ({ ...p, renglonCodigo: e.target.value }))} className={INPUT} />
              <input placeholder="Cuadrilla" value={formData.cuadrilla} onChange={e => setFormData(p => ({ ...p, cuadrilla: e.target.value }))} className={INPUT} />
              <input type="date" value={formData.fecha} onChange={e => setFormData(p => ({ ...p, fecha: e.target.value }))} className={INPUT} />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Cant. ejecutada" value={formData.cantidadEjecutada || ''} onChange={e => setFormData(p => ({ ...p, cantidadEjecutada: +e.target.value }))} className={INPUT} />
                <input placeholder="Unidad" value={formData.unidad} onChange={e => setFormData(p => ({ ...p, unidad: e.target.value }))} className={INPUT} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Horas trabajadas" value={formData.horasTrabajadas || ''} onChange={e => setFormData(p => ({ ...p, horasTrabajadas: +e.target.value }))} className={INPUT} />
                <input type="number" placeholder="Rend. teórico" value={formData.rendimientoTeorico || ''} onChange={e => setFormData(p => ({ ...p, rendimientoTeorico: +e.target.value }))} className={INPUT} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSubmitForm}
                  className="flex-1 bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700">
                  ✅ Guardar Destajo
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded text-sm hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanillaDestajos;
