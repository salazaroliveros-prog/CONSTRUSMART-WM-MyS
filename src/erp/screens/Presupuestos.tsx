import React, { useMemo, useState } from 'react';
import { CARD, INPUT, BUTTON_DARK } from '../ui';

import { useErp } from '../store';
import { Tipologia, RenglonPresupuesto, SubRenglon } from '../types';
import { generarRenglones } from '../data';
import { fmtQ, TIPOLOGIA_LABEL, costoDirectoUnitario, precioUnitarioVenta, duracionPorRendimiento, HERRAMIENTA_MENOR, COSTOS_INDIRECTOS, ADMINISTRACION, IMPREVISTOS, UTILIDAD } from '../utils';
import { exportCSV, exportPDF } from '../export';
import { Plus, ChevronDown, ChevronRight, Trash2, FileText, FileSpreadsheet, Calculator, Save, X } from 'lucide-react';

const Presupuestos: React.FC = () => {
  useErp();
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
    setItems(s => [...s, { ...base, id: codigo, cantidad: 1, expanded: false, subrenglones: [] }]);
    setSel('');
  };
  const addTodos = () => {
    setItems(catalogo.map(c => ({ ...c, id: c.codigo, cantidad: 1, expanded: false, subrenglones: [] })));
  };

  const upd = (id: string, patch: Partial<RenglonPresupuesto>) =>
    setItems(s => s.map(i => i.id === id ? { ...i, ...patch } : i));
  const del = (id: string) => setItems(s => s.filter(i => i.id !== id));

  // Funciones para sub-renglones
  const addSubrenglon = (renglonId: string) => {
    upd(renglonId, {
      subrenglones: [
        ...(items.find(r => r.id === renglonId)?.subrenglones || []),
        {
          id: 'sub-' + Math.random().toString(36).slice(2, 9),
          nombreMaterial: '',
          unidad: 'kg',
          cantidadUnitaria: 0,
          precioUnitario: 0,
        } as SubRenglon
      ]
    });
  };

  const updSubrenglon = (renglonId: string, subId: string, patch: Partial<SubRenglon>) => {
    const renglon = items.find(r => r.id === renglonId);
    if (!renglon?.subrenglones) return;
    const subs = renglon.subrenglones.map(s => s.id === subId ? { ...s, ...patch } : s);
    upd(renglonId, { subrenglones: subs });
  };

  const delSubrenglon = (renglonId: string, subId: string) => {
    const renglon = items.find(r => r.id === renglonId);
    if (!renglon?.subrenglones) return;
    upd(renglonId, { subrenglones: renglon.subrenglones.filter(s => s.id !== subId) });
  };

  const calc = (r: RenglonPresupuesto) => {
    const cd = costoDirectoUnitario(r.costoMateriales, r.costoManoObra, r.costoEquipo);
    const pv = precioUnitarioVenta(cd);
    return { cd, pv, total: pv * r.cantidad, dur: duracionPorRendimiento(r.cantidad, r.rendimientoCuadrilla) };
  };
  const granTotal = items.reduce((a, r) => a + calc(r).total, 0);
  const granDir = items.reduce((a, r) => a + costoDirectoUnitario(r.costoMateriales, r.costoManoObra, r.costoEquipo) * r.cantidad, 0);

  // Resumen de materiales
  const resumenMateriales = useMemo(() => {
    const materiales: Record<string, { unidad: string; cantidad: number; total: number }> = {};
    items.forEach(r => {
      if (r.subrenglones) {
        r.subrenglones.forEach(sub => {
          const key = `${sub.nombreMaterial}-${sub.unidad}`;
          const cant = sub.cantidadUnitaria * r.cantidad;
          const tot = cant * sub.precioUnitario;
          if (!materiales[key]) {
            materiales[key] = { unidad: sub.unidad, cantidad: 0, total: 0 };
          }
          materiales[key].cantidad += cant;
          materiales[key].total += tot;
        });
      }
    });
    return Object.entries(materiales).map(([nombre, data]) => ({ nombre, ...data }));
  }, [items]);

  const save = () => { try { localStorage.setItem('wm_presupuesto_' + proyecto, JSON.stringify(items)); } catch { /* ignore */ } setSaved(true); setTimeout(() => setSaved(false), 1500); };

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
            <input value={proyecto} onChange={e => setProyecto(e.target.value)} placeholder="Ej. Presupuesto obra casa" className={INPUT} />
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

                    {/* Sub-renglones de materiales */}
                    <div className="mt-3 border-t pt-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-[10px] font-semibold text-slate-500">📦 Desglose de Materiales por Renglon</div>
                        <button onClick={() => addSubrenglon(r.id)} className="text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded flex items-center gap-1 hover:bg-orange-200">
                          <Plus className="w-3 h-3" /> Material
                        </button>
                      </div>
                      {r.subrenglones && r.subrenglones.length > 0 ? (
                        <div className="space-y-1.5">
                          {r.subrenglones.map((sub, subIdx) => {
                            const subTotal = (sub.cantidadUnitaria * r.cantidad * sub.precioUnitario);
                            return (
                              <div key={sub.id} className="bg-white rounded p-2 border border-slate-150 flex items-center gap-1.5 text-xs">
                                <span className="text-slate-400 w-6">{subIdx + 1}.</span>
                                <input 
                                  type="text" 
                                  value={sub.nombreMaterial} 
                                  onChange={e => updSubrenglon(r.id, sub.id, { nombreMaterial: e.target.value })}
                                  placeholder="Material"
                                  className="flex-1 px-1.5 py-0.5 rounded border border-slate-200 text-xs"
                                />
                                <input 
                                  type="number" 
                                  value={sub.cantidadUnitaria} 
                                  onChange={e => updSubrenglon(r.id, sub.id, { cantidadUnitaria: +e.target.value })}
                                  placeholder="Cant/u"
                                  className="w-12 px-1 py-0.5 rounded border border-slate-200 text-right text-xs"
                                />
                                <select 
                                  value={sub.unidad} 
                                  onChange={e => updSubrenglon(r.id, sub.id, { unidad: e.target.value })}
                                  className="w-14 px-1 py-0.5 rounded border border-slate-200 text-xs"
                                >
                                  <option>kg</option>
                                  <option>l</option>
                                  <option>m²</option>
                                  <option>m³</option>
                                  <option>u</option>
                                  <option>ml</option>
                                </select>
                                <input 
                                  type="number" 
                                  value={sub.precioUnitario} 
                                  onChange={e => updSubrenglon(r.id, sub.id, { precioUnitario: +e.target.value })}
                                  placeholder="Precio"
                                  className="w-16 px-1 py-0.5 rounded border border-slate-200 text-right text-xs"
                                />
                                <span className="text-slate-600 font-semibold w-20 text-right">{fmtQ(subTotal)}</span>
                                <button onClick={() => delSubrenglon(r.id, sub.id)} className="text-slate-300 hover:text-red-500">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic py-2">Sin desglose de materiales. Agrega uno con el botón + Material</div>
                      )}
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

          {/* Resumen de Materiales */}
          {resumenMateriales.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 p-4">
              <div className="text-sm font-bold text-emerald-900 mb-3">📊 Resumen de Materiales a Utilizar</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                {resumenMateriales.map((mat, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-2.5 border border-emerald-100">
                    <div className="font-semibold text-slate-700 truncate">{mat.nombre}</div>
                    <div className="flex justify-between mt-1 text-slate-600">
                      <span>{mat.cantidad.toFixed(2)} {mat.unidad}</span>
                      <span className="font-bold text-emerald-600">{fmtQ(mat.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-slate-600 text-center">
                <b className="text-emerald-700">{resumenMateriales.length} materiales diferentes</b> · Total materiales: <b className="text-emerald-700">{fmtQ(resumenMateriales.reduce((a, m) => a + m.total, 0))}</b>
              </div>
            </div>
          )}

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
