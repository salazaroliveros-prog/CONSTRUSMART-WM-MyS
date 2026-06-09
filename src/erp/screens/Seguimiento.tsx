import React, { useMemo, useState } from 'react';
import { useErp } from '../store';
import type { BitacoraEntry } from '../types';
import { fmtQ, todayISO } from '../utils';
import { Progress, Gauge, BarChart } from '../components/Charts';
import ChartToolbar from '../components/ChartToolbar';
import { useChartConfig } from '../hooks/useChartConfig';
import { CARD, CARD_TITLE, INPUT } from '../ui';
import { ClipboardCheck, Plus, CloudRain, Camera, Pencil, Trash2, Save, X } from 'lucide-react';
import GanttChart from '../components/GanttChart';
import EnhancedGantt from '../components/EnhancedGantt';
import PertGanttChart from '../components/PertGanttChart';

const Seguimiento: React.FC = () => {
  const { proyectos, movimientos, bitacora, addBitacora, updateProyecto, updateBitacora, deleteBitacora } = useErp();
  const barConfig = useChartConfig('line', 'default');
  const [selProy, setSelProy] = useState(proyectos[0]?.id || '');
  const [bit, setBit] = useState({ clima: 'soleado', personal: '12', maquinaria: 'Retroexcavadora', tareas: '', observaciones: '' });
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [pendingProgress, setPendingProgress] = useState<Record<string, string>>({});
  const [editingBit, setEditingBit] = useState<BitacoraEntry | null>(null);

  const proyData = useMemo(() => proyectos.map(p => {
    const ing = movimientos.filter(m => m.proyectoId === p.id && m.tipo === 'ingreso').reduce((a, b) => a + (b.monto ?? b.costoTotal ?? 0), 0);
    const gas = movimientos.filter(m => m.proyectoId === p.id && m.tipo === 'gasto').reduce((a, b) => a + (b.monto ?? b.costoTotal ?? 0), 0);
    const pendiente = Math.max(0, (p.montoContrato ?? 0) - ing);
    return { ...p, ing, gas, pendiente };
  }), [proyectos, movimientos]);

  const proy = proyectos.find(p => p.id === selProy);
  const PV = proy ? proy.presupuestoTotal * (proy.avanceFinanciero / 100) : 0;
  const EV = proy ? proy.presupuestoTotal * (proy.avanceFisico / 100) : 0;
  const AC = proy ? proyData.find(p => p.id === proy.id)?.gas || 0 : 0;
  const CV = EV - AC, SV = EV - PV;

  const saveProjectProgress = (id: string) => {
    const raw = pendingProgress[id] ?? '';
    const value = Math.min(100, Math.max(0, Number(raw)));
    if (!Number.isNaN(value)) updateProyecto(id, { avanceFisico: value });
    setEditingProject(null);
  };

  const startEditProjectProgress = (id: string, current: number) => {
    setEditingProject(id);
    setPendingProgress(prev => ({ ...prev, [id]: String(current) }));
  };

  const startEditBitacora = (entry: BitacoraEntry) => {
    setEditingBit(entry);
    setSelProy(entry.proyectoId);
    setBit({
      clima: entry.clima,
      personal: String(entry.personalPresente),
      maquinaria: entry.maquinaria,
      tareas: entry.tareasRealizadas,
      observaciones: entry.observaciones,
    });
  };

  const cancelEditBitacora = () => {
    setEditingBit(null);
    setBit({ clima: 'soleado', personal: '12', maquinaria: 'Retroexcavadora', tareas: '', observaciones: '' });
  };

  const guardarBit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selProy) return;
    const payload = {
      proyectoId: selProy,
      fecha: editingBit?.fecha || todayISO(),
      clima: bit.clima as 'soleado' | 'nublado' | 'lluvia',
      personalPresente: +bit.personal || 0,
      maquinaria: bit.maquinaria,
      tareasRealizadas: bit.tareas,
      observaciones: bit.observaciones,
      fotos: editingBit?.fotos ?? [],
    };

    if (editingBit) {
      updateBitacora(editingBit.id, payload);
      setEditingBit(null);
    } else {
      addBitacora(payload);
    }
    setBit({ clima: 'soleado', personal: '12', maquinaria: 'Retroexcavadora', tareas: '', observaciones: '' });
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto">
      <div className="mb-3 sm:mb-4">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" aria-hidden="true" /> Seguimiento y Control
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Avance físico-financiero, bitácora y valor ganado (EVM)</p>
      </div>

      <div className={`${CARD} overflow-hidden mb-3 sm:mb-4 p-0`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[560px]">
            <thead className="bg-muted text-muted-foreground text-xs">
              <tr>
                <th className="text-left p-3">Proyecto</th>
                <th className="p-3 w-24 sm:w-40">Avance Físico</th>
                <th className="p-3 w-24 sm:w-40">Avance Financiero</th>
                <th className="p-3 text-right">Ingresos</th>
                <th className="p-3 text-right">Gastos</th>
                <th className="p-3 text-right">Pendiente de Aportar</th>
              </tr>
            </thead>
            <tbody>
              {proyData.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-xs text-muted-foreground animate-pulse">Cargando proyectos...</td></tr>
              ) : proyData.map(p => (
                <tr key={p.id} className="border-t border-border/50 hover:bg-muted/40 transition-colors">
                  <td className="p-3">
                    <div className="font-semibold text-foreground">{p.nombre}</div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      p.estado === 'ejecucion'
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                    }`}>{p.estado}</span>
                  </td>
                  <td className="p-3">
                    {editingProject === p.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number" min={0} max={100}
                          value={pendingProgress[p.id] ?? String(p.avanceFisico)}
                          onChange={e => setPendingProgress(prev => ({ ...prev, [p.id]: e.target.value }))}
                          aria-label={`Avance físico de ${p.nombre}`}
                          className="w-20 px-2 py-1 border border-input bg-background text-foreground rounded text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button type="button" onClick={() => saveProjectProgress(p.id)}
                          aria-label="Guardar avance"
                          className="p-1 rounded bg-emerald-500 text-white text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
                          <Save className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => setEditingProject(null)}
                          aria-label="Cancelar edición"
                          className="p-1 rounded bg-muted text-foreground text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <X className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Progress value={p.avanceFisico} color="#3b82f6" />
                        <span className="text-xs font-semibold w-10 text-foreground">{p.avanceFisico}%</span>
                        <button type="button" onClick={() => startEditProjectProgress(p.id, p.avanceFisico)}
                          aria-label={`Editar avance físico de ${p.nombre}`}
                          className="p-1 rounded bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-3"><div className="flex items-center gap-2"><Progress value={p.avanceFinanciero} color="#f97316" /><span className="text-xs font-semibold w-10 text-foreground">{p.avanceFinanciero}%</span></div></td>
                  <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">{fmtQ(p.ing)}</td>
                  <td className="p-3 text-right text-red-500 dark:text-red-400 font-semibold">{fmtQ(p.gas)}</td>
                  <td className="p-3 text-right text-foreground font-bold">{fmtQ(p.pendiente)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className={`${CARD}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <h3 className={CARD_TITLE}>Valor Ganado (EVM)</h3>
            <select value={selProy} onChange={e => setSelProy(e.target.value)}
              aria-label="Seleccionar proyecto para EVM"
              className="text-xs px-2 py-1 rounded border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Selecciona proyecto</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Gauge value={CV} max={proy?.presupuestoTotal || 1} label="CV (Costo)" color={CV >= 0 ? '#10b981' : '#ef4444'} /><div className={`text-center text-xs font-bold ${CV >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtQ(CV)}</div></div>
            <div><Gauge value={SV} max={proy?.presupuestoTotal || 1} label="SV (Tiempo)" color={SV >= 0 ? '#10b981' : '#ef4444'} /><div className={`text-center text-xs font-bold ${SV >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtQ(SV)}</div></div>
          </div>
        </div>

        <div className={CARD}>
          <div className="flex items-center justify-between">
            <h3 className={CARD_TITLE}>Físico vs Financiero</h3>
            <ChartToolbar
              types={['line']}
              currentType={barConfig.type}
              onTypeChange={barConfig.setType}
              palette={barConfig.palette}
              onPaletteChange={barConfig.setPalette}
              series={[
                { id: 'Físico', label: 'Físico', color: '#3b82f6', visible: barConfig.isVisible('Físico') },
                { id: 'Financ.', label: 'Financ.', color: '#f97316', visible: barConfig.isVisible('Financ.') },
              ]}
              onToggleSeries={barConfig.toggleSeries}
              onReset={barConfig.reset}
            />
          </div>
          {proy && <BarChart height={150} data={[
            { label: 'Físico', value: proy.avanceFisico, color: '#3b82f6' },
            { label: 'Financ.', value: proy.avanceFinanciero, color: '#f97316' },
          ]} palette={barConfig.palette} />}
        </div>

        <div className={CARD}>
          <h3 className={`${CARD_TITLE} flex items-center gap-1`}><Camera className="w-4 h-4 text-emerald-500" aria-hidden="true" /> Bitácora Reciente</h3>
          <div className="space-y-2 max-h-44 overflow-y-auto">
            {bitacora.length === 0 && <p className="text-xs text-muted-foreground">Sin entradas. Registre el reporte diario abajo.</p>}
            {bitacora.slice(0, 6).map(b => (
              <div key={b.id} className="bg-muted rounded-lg p-2 text-xs">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="font-semibold text-foreground">{proyectos.find(p => p.id === b.proyectoId)?.nombre}</div>
                    <div className="text-muted-foreground text-[10px]">{b.fecha}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => startEditBitacora(b)}
                      aria-label="Editar entrada de bitácora"
                      className="p-1 rounded bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => deleteBitacora(b.id)}
                      aria-label="Eliminar entrada de bitácora"
                      className="p-1 rounded bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                  <CloudRain className="w-3 h-3" aria-hidden="true" /> {b.clima} · {b.personalPresente} pers.
                </div>
                {b.tareasRealizadas && <p className="text-foreground/80 mt-0.5">{b.tareasRealizadas}</p>}
                {b.observaciones && <p className="text-muted-foreground mt-0.5 italic">{b.observaciones}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={guardarBit} className={`${CARD}`}>
        <div className="flex items-start sm:items-center justify-between gap-2 mb-3 sm:mb-4">
          <div className="min-w-0">
            <h3 className={`${CARD_TITLE} text-sm sm:text-base`}>{editingBit ? 'Editar Bitácora' : 'Reporte Diario de Campo'}</h3>
            {editingBit && <p className="text-xs text-muted-foreground truncate">Editando: {proyectos.find(p => p.id === editingBit.proyectoId)?.nombre}</p>}
          </div>
          {editingBit && (
            <button type="button" onClick={cancelEditBitacora} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          <select value={selProy} onChange={e => setSelProy(e.target.value)} className={`${INPUT} sm:col-span-2`}>
            <option value="">Selecciona proyecto</option>
            {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <select value={bit.clima} onChange={e => setBit({ ...bit, clima: e.target.value })} className={INPUT}>
            <option value="soleado">☀️ Soleado</option>
            <option value="nublado">☁️ Nublado</option>
            <option value="lluvia">🌧️ Lluvia</option>
          </select>
          <input type="number" value={bit.personal} onChange={e => setBit({ ...bit, personal: e.target.value })} placeholder="Personal activo" className={INPUT} />
          <input value={bit.maquinaria} onChange={e => setBit({ ...bit, maquinaria: e.target.value })} placeholder="Maquinaria" className={`${INPUT} md:col-span-2`} />
          <input value={bit.tareas} onChange={e => setBit({ ...bit, tareas: e.target.value })} placeholder="Tareas ejecutadas" className={`${INPUT} md:col-span-2`} />
        </div>
        <button type="submit"
          className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
          <Plus className="w-4 h-4" aria-hidden="true" /> {editingBit ? 'Guardar cambios' : 'Registrar Reporte'}
        </button>
      </form>
    </div>
  );
};

export default Seguimiento;
