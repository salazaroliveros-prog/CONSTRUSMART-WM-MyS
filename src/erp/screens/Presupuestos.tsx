import React, { useMemo, useState } from 'react';
import { CARD, CARD_TITLE, INPUT, BUTTON_DARK } from '../ui';

import { useErp } from '../store';
import { Tipologia, RenglonPresupuesto } from '../types';
import { generarRenglones } from '../data';
import { fmtQ, TIPOLOGIA_LABEL, costoDirectoUnitario, precioUnitarioVenta, duracionPorRendimiento, HERRAMIENTA_MENOR, COSTOS_INDIRECTOS, ADMINISTRACION, IMPREVISTOS, UTILIDAD } from '../utils';
import { exportCSV, exportPDF } from '../export';
import { Plus, ChevronDown, ChevronRight, Trash2, FileText, FileSpreadsheet, Calculator, Save } from 'lucide-react';

const Presupuestos: React.FC = () => {
  const { setView: _setView } = useErp();
  const [tipologia, setTipologia] = useState<Tipologia>('residencial');
  const [proyecto, setProyecto] = useState('Nuevo Presupuesto');
  const [items, setItems] = useState<RenglonPresupuesto[]>([]);
  const [sel, setSel] = useState('');
  const [saved, setSaved] = useState(false);

  const catalogo = useMemo(() => generarRenglones(tipologia), [tipologia]);
  const disponibles = catalogo.filter(c => !items.some(i => i.codigo === c.codigo));

  const addRenglon = (codigo: string) => {
    const base = catalogo.find(c => c.codigo === codigo);
    if (!base) return;
    setItems(s => [...s, { ...base, id: codigo, cantidad: 1, expanded: true }]);
    setSel('');
  };
  const addTodos = () => {
    setItems(catalogo.map(c => ({ ...c, id: c.codigo, cantidad: 1, expanded: false })));
  };

  const upd = (id: string, patch: Partial<RenglonPresupuesto>) =>
    setItems(s => s.map(i => i.id === id ? { ...i, ...patch } : i));
  const del = (id: string) => setItems(s => s.filter(i => i.id !== id));

  const calc = (r: RenglonPresupuesto) => {
    const cd = costoDirectoUnitario(r.costoMateriales, r.costoManoObra, r.costoEquipo);
    const pv = precioUnitarioVenta(cd);
    return { cd, pv, total: pv * r.cantidad, dur: duracionPorRendimiento(r.cantidad, r.rendimientoCuadrilla) };
  };
  const granTotal = items.reduce((a, r) => a + calc(r).total, 0);
  const granDir = items.reduce((a, r) => a + costoDirectoUnitario(r.costoMateriales, r.costoManoObra, r.costoEquipo) * r.cantidad, 0);

  const save = () => { try { localStorage.setItem('wm_presupuesto_' + proyecto, JSON.stringify(items)); } catch {} setSaved(true); setTimeout(() => setSaved(false), 1500); };

  const ninp = "w-full px-2 py-1 text-xs rounded border border-slate-200 outline-none focus:border-orange-400 text-right";
  const SkeletonRow = (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 animate-pulse space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-slate-200" />
        <div className="h-3 w-32 bg-slate-200 rounded" />
        <div className="h-3 w-24 bg-slate-200 rounded ml-auto" />
      </div>
      <div className="h-2 w-full bg-slate-100 rounded" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Calculator className="w-6 h-6 text-orange-500" /> Calculadora de Presupuestos APU</h1>
          <p className="text-sm text-slate-400">Motor de cálculo con FSR, herramienta menor {(HERRAMIENTA_MENOR*100)}%, indirectos {(COSTOS_INDIRECTOS*100)}%, admin {(ADMINISTRACION*100)}%, imprevistos {(IMPREVISTOS*100)}%, utilidad {(UTILIDAD*100)}%</p>
        </div>
        <div className="flex gap-2">
          <button onClick={save} className={BUTTON_DARK}><Save className="w-4 h-4" /> {saved ? 'Guardado' : 'Guardar'}</button>
          <button disabled={!items.length} onClick={() => exportPDF(items, proyecto, tipologia)} className="bg-red-500 disabled:opacity-40 text-white px-3 py-2 rounded-xl text-sm flex items-center gap-1.5"><FileText className="w-4 h-4" /> PDF</button>
          <button disabled={!items.length} onClick={() => exportCSV(items, proyecto, tipologia)} className="bg-emerald-600 disabled:opacity-40 text-white px-3 py-2 rounded-xl text-sm flex items-center gap-1.5"><FileSpreadsheet className="w-4 h-4" /> CSV</button>
        </div>
      </div>

      <div className={`${CARD}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500">Nombre del presupuesto</label>
            <input value={proyecto} onChange={e => setProyecto(e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Tipología (40+ renglones c/u)</label>
            <select value={tipologia} onChange={e => { setTipologia(e.target.value as Tipologia); setItems([]); }} className={INPUT}>
              {(Object.keys(TIPOLOGIA_LABEL) as Tipologia[]).map(t => <option key={t} value={t}>{TIPOLOGIA_LABEL[t]} ({generarRenglones(t).length} renglones)</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-500">Agregar renglón (filtro)</label>
            <div className="flex gap-2 mt-1">
              <select value={sel} onChange={e => addRenglon(e.target.value)} className={`${INPUT} flex-1`}>
                <option value="">— Seleccionar renglón ({disponibles.length} disponibles) —</option>
                {disponibles.map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} · {c.nombre}</option>)}
              </select>
              <button onClick={addTodos} className="bg-orange-500 text-white px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap flex items-center gap-1"><Plus className="w-4 h-4" /> Todos</button>
            </div>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i}>{SkeletonRow}</div>)}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((r, idx) => {
            const c = calc(r);
            return (
              <div key={r.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-2 p-3">
                  <button onClick={() => upd(r.id, { expanded: !r.expanded })} className="text-slate-400">
                    {r.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{r.codigo}</span>
                  <span className="flex-1 text-sm font-semibold text-slate-700 truncate">{idx + 1}. {r.nombre}</span>
                  <div className="hidden sm:flex items-center gap-1 text-xs">
                    <span className="text-slate-400">Cant.</span>
                    <input type="number" value={r.cantidad} onChange={e => upd(r.id, { cantidad: +e.target.value })} className="w-16 px-2 py-1 rounded border border-slate-200 text-right text-xs" />
                    <span className="text-slate-400">{r.unidad}</span>
                  </div>
                  <span className="text-sm font-bold text-orange-600 w-24 text-right">{fmtQ(c.total)}</span>
                  <button onClick={() => del(r.id)}><Trash2 className="w-4 h-4 text-slate-300 hover:text-red-500" /></button>
                </div>
                {r.expanded && (
                  <div className="bg-slate-50 px-3 pb-3 pt-1 border-t border-slate-100">
                    <div className="grid grid-cols-2 sm:hidden gap-2 mb-2 text-xs">
                      <div><label className="text-slate-400">Cantidad ({r.unidad})</label><input type="number" value={r.cantidad} onChange={e => upd(r.id, { cantidad: +e.target.value })} className={ninp} /></div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 text-xs">
                      <div><label className="text-slate-400 block mb-0.5">Rendimiento/día</label><input type="number" value={r.rendimientoCuadrilla} onChange={e => upd(r.id, { rendimientoCuadrilla: +e.target.value })} className={ninp} /></div>
                      <div><label className="text-slate-400 block mb-0.5">Materiales Q</label><input type="number" value={r.costoMateriales} onChange={e => upd(r.id, { costoMateriales: +e.target.value })} className={ninp} /></div>
                      <div><label className="text-slate-400 block mb-0.5">Mano Obra Q</label><input type="number" value={r.costoManoObra} onChange={e => upd(r.id, { costoManoObra: +e.target.value })} className={ninp} /></div>
                      <div><label className="text-slate-400 block mb-0.5">Equipo Q</label><input type="number" value={r.costoEquipo} onChange={e => upd(r.id, { costoEquipo: +e.target.value })} className={ninp} /></div>
                      <div><label className="text-slate-400 block mb-0.5">Duración (días)</label><div className={ninp + ' bg-white text-slate-600'}>{c.dur}</div></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                      <div className="bg-white rounded-lg p-2 text-center"><div className="text-slate-400 text-[10px]">Costo Directo Unit.</div><b className="text-slate-700">{fmtQ(c.cd)}</b></div>
                      <div className="bg-white rounded-lg p-2 text-center"><div className="text-slate-400 text-[10px]">Precio Unit. Venta</div><b className="text-orange-600">{fmtQ(c.pv)}</b></div>
                      <div className="bg-white rounded-lg p-2 text-center"><div className="text-slate-400 text-[10px]">Total Renglón</div><b className="text-emerald-600">{fmtQ(c.total)}</b></div>
                    </div>
                    <div className="mt-2">
                      <div className="text-[10px] font-semibold text-slate-500 mb-1">Desglose APU (insumos)</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {r.insumos.map(ins => (
                          <div key={ins.id} className="flex justify-between bg-white rounded px-2 py-1 text-[11px]">
                            <span className="text-slate-600 truncate">{ins.nombre}</span>
                            <span className="text-slate-400">{ins.tipo} · {fmtQ(ins.precio)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 sticky bottom-2">
            <div className="flex gap-6 text-sm">
              <div><span className="text-slate-400 text-xs block">Costo Directo</span><b>{fmtQ(granDir)}</b></div>
              <div><span className="text-slate-400 text-xs block">Renglones</span><b>{items.length}</b></div>
            </div>
            <div className="text-right">
              <span className="text-orange-300 text-xs block">TOTAL PRESUPUESTO (c/ indirectos y utilidad)</span>
              <b className="text-2xl">{fmtQ(granTotal)}</b>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Presupuestos;
