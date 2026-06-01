import React, { useMemo, useState } from 'react';
import { useErp } from '../store';
import type { BitacoraEntry } from '../types';
import { fmtQ, todayISO } from '../utils';
import { Progress, Gauge, BarChart } from '../components/Charts';
import { CARD, CARD_TITLE, INPUT } from '../ui';
import { ClipboardCheck, Plus, CloudRain, Camera, Pencil, Trash2, Save, X } from 'lucide-react';

const Seguimiento: React.FC = () => {
  const { proyectos, movimientos, bitacora, addBitacora, updateProyecto, updateBitacora, deleteBitacora } = useErp();
  const [selProy, setSelProy] = useState(proyectos[0]?.id || '');
  const [bit, setBit] = useState({ clima: 'Despejado', personal: '12', maquinaria: 'Retroexcavadora', tareas: '', observaciones: '' });
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [pendingProgress, setPendingProgress] = useState<Record<string, string>>({});
  const [editingBit, setEditingBit] = useState<BitacoraEntry | null>(null);

  const proyData = useMemo(() => proyectos.map(p => {
    const ing = movimientos.filter(m => m.proyectoId === p.id && m.tipo === 'ingreso').reduce((a, b) => a + b.costoTotal, 0);
    const gas = movimientos.filter(m => m.proyectoId === p.id && m.tipo === 'gasto').reduce((a, b) => a + b.costoTotal, 0);
    const pendiente = Math.max(0, p.montoContrato - ing);
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
    if (!Number.isNaN(value)) {
      updateProyecto(id, { avanceFisico: value });
    }
    setEditingProject(null);
  };

  const startEditProjectProgress = (id: string, current: number) => {
    setEditingProject(id);
    setPendingProgress(prev => ({ ...prev, [id]: String(current) }));
  };

  const cancelProjectProgress = () => {
    setEditingProject(null);
  };

  const startEditBitacora = (entry: BitacoraEntry) => {
    setEditingBit(entry);
    setSelProy(entry.proyectoId);
    setBit({ clima: entry.clima, personal: String(entry.personal), maquinaria: entry.maquinaria, tareas: entry.tareas, observaciones: entry.observaciones });
  };

  const cancelEditBitacora = () => {
    setEditingBit(null);
    setBit({ clima: 'Despejado', personal: '12', maquinaria: 'Retroexcavadora', tareas: '', observaciones: '' });
  };

  const guardarBit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selProy) return;
    const payload = {
      proyectoId: selProy,
      fecha: editingBit?.fecha || todayISO(),
      clima: bit.clima,
      personal: +bit.personal || 0,
      maquinaria: bit.maquinaria,
      tareas: bit.tareas,
      observaciones: bit.observaciones,
    };

    if (editingBit) {
      updateBitacora(editingBit.id, payload);
      setEditingBit(null);
    } else {
      addBitacora(payload);
    }

    setBit({ clima: 'Despejado', personal: '12', maquinaria: 'Retroexcavadora', tareas: '', observaciones: '' });
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><ClipboardCheck className="w-6 h-6 text-emerald-500" /> Seguimiento y Control</h1>
        <p className="text-sm text-slate-400">Avance físico-financiero, bitácora y valor ganado (EVM)</p>
      </div>

      <div className={`${CARD} overflow-hidden mb-4`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr>
                <th className="text-left p-3">Proyecto</th>
                <th className="p-3 w-40">Avance Físico</th>
                <th className="p-3 w-40">Avance Financiero</th>
                <th className="p-3 text-right">Ingresos</th>
                <th className="p-3 text-right">Gastos</th>
                <th className="p-3 text-right">Pendiente de Aportar</th>
              </tr>
            </thead>
            <tbody>
              {proyData.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-xs text-slate-400 animate-pulse">Cargando proyectos...</td></tr>
              ) : proyData.map(p => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-semibold text-slate-700">{p.nombre}</div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${p.estado === 'ejecucion' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{p.estado}</span>
                  </td>
                  <td className="p-3">
                    {editingProject === p.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={pendingProgress[p.id] ?? String(p.avanceFisico)}
                          onChange={e => setPendingProgress(prev => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder="0-100"
                          className="w-20 px-2 py-1 border border-slate-200 rounded text-xs"
                        />
                        <button type="button" onClick={() => saveProjectProgress(p.id)} className="p-1 rounded bg-emerald-500 text-white text-xs"><Save className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={cancelProjectProgress} className="p-1 rounded bg-slate-100 text-slate-600 text-xs"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Progress value={p.avanceFisico} color="#3b82f6" />
                        <span className="text-xs font-semibold w-10">{p.avanceFisico}%</span>
                        <button type="button" onClick={() => startEditProjectProgress(p.id, p.avanceFisico)} className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-3"><div className="flex items-center gap-2"><Progress value={p.avanceFinanciero} color="#f97316" /><span className="text-xs font-semibold w-10">{p.avanceFinanciero}%</span></div></td>
                  <td className="p-3 text-right text-emerald-600 font-semibold">{fmtQ(p.ing)}</td>
                  <td className="p-3 text-right text-red-500 font-semibold">{fmtQ(p.gas)}</td>
                  <td className="p-3 text-right text-slate-700 font-bold">{fmtQ(p.pendiente)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className={`${CARD}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`${CARD_TITLE}`}>Valor Ganado (EVM)</h3>
            <select value={selProy} onChange={e => setSelProy(e.target.value)} className="text-xs px-2 py-1 rounded border border-slate-200">
              <option value="">Selecciona proyecto</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Gauge value={CV} max={Math.abs(CV) + EV * 0.3 + 1} label="CV (Costo)" color={CV >= 0 ? '#10b981' : '#ef4444'} /><div className={`text-center text-xs font-bold ${CV >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtQ(CV)}</div></div>
            <div><Gauge value={SV} max={Math.abs(SV) + EV * 0.3 + 1} label="SV (Tiempo)" color={SV >= 0 ? '#10b981' : '#ef4444'} /><div className={`text-center text-xs font-bold ${SV >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtQ(SV)}</div></div>
          </div>
        </div>

        <div className={`${CARD}`}>
          <h3 className={`${CARD_TITLE}`}>Físico vs Financiero</h3>
          {proy && <BarChart height={150} data={[
            { label: 'Físico', value: proy.avanceFisico, color: '#3b82f6' },
            { label: 'Financ.', value: proy.avanceFinanciero, color: '#f97316' },
          ]} />}
        </div>

        <div className={`${CARD}`}>
          <h3 className={`${CARD_TITLE} flex items-center gap-1`}><Camera className="w-4 h-4 text-emerald-500" /> Bitácora Reciente</h3>
          <div className="space-y-2 max-h-44 overflow-y-auto">
            {bitacora.length === 0 && <p className="text-xs text-slate-400">Sin entradas. Registre el reporte diario abajo.</p>}
            {bitacora.slice(0, 6).map(b => (
              <div key={b.id} className="bg-slate-50 rounded-lg p-2 text-xs">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="font-semibold text-slate-600">{proyectos.find(p => p.id === b.proyectoId)?.nombre}</div>
                    <div className="text-slate-400 text-[10px]">{b.fecha}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => startEditBitacora(b)} className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => deleteBitacora(b.id)} className="p-1 rounded bg-red-100 hover:bg-red-200 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-500 mt-0.5"><CloudRain className="w-3 h-3" /> {b.clima} · {b.personal} pers.</div>
                {b.tareas && <p className="text-slate-500 mt-0.5">{b.tareas}</p>}
                {b.observaciones && <p className="text-slate-500 mt-0.5 italic">{b.observaciones}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={guardarBit} className={`${CARD}`}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className={`${CARD_TITLE}`}>{editingBit ? 'Editar entrada de Bitácora' : 'Reporte Diario de Campo (Bitácora Digital)'}</h3>
            {editingBit && <p className="text-xs text-slate-500">Editando registro de {proyectos.find(p => p.id === editingBit.proyectoId)?.nombre}</p>}
          </div>
          {editingBit && (
            <button type="button" onClick={cancelEditBitacora} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"><X className="w-3.5 h-3.5" /> Cancelar</button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <select value={selProy} onChange={e => setSelProy(e.target.value)} className={`${INPUT} col-span-2`}>
            <option value="">Selecciona proyecto</option>
            {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <input value={bit.clima} onChange={e => setBit({ ...bit, clima: e.target.value })} placeholder="Clima" className={INPUT} />
          <input type="number" value={bit.personal} onChange={e => setBit({ ...bit, personal: e.target.value })} placeholder="Personal activo" className={INPUT} />
          <input value={bit.maquinaria} onChange={e => setBit({ ...bit, maquinaria: e.target.value })} placeholder="Maquinaria" className={`${INPUT} md:col-span-2`} />
          <input value={bit.tareas} onChange={e => setBit({ ...bit, tareas: e.target.value })} placeholder="Tareas ejecutadas" className={`${INPUT} md:col-span-2`} />
        </div>
        <button type="submit" className="mt-3 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"><Plus className="w-4 h-4" /> {editingBit ? 'Guardar cambios' : 'Registrar Reporte'}</button>
      </form>
    </div>
  );
};

export default Seguimiento;