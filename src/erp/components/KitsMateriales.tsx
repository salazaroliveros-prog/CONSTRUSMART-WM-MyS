import React, { useMemo, useState } from 'react';
import { useErp } from '../store';
import type { KitMaterial } from '../types';
import { Layers, Package, Plus, Trash2, BarChart3, Check, X } from 'lucide-react';
import { fmtQ, todayISO } from '../utils';
import { toast } from 'sonner';

const KitsMateriales: React.FC = () => {
  const { proyectos, presupuestos, materiales, valesSalida } = useErp();
  const [kits, setKits] = useState<KitMaterial[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('wm_kits_materiales') || '[]');
    } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [selProyecto, setSelProyecto] = useState('');
  const [selRenglon, setSelRenglon] = useState('');
  const [selMaterial, setSelMaterial] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [editKitId, setEditKitId] = useState<string | null>(null);

  const saveKits = (k: KitMaterial[]) => {
    setKits(k);
    localStorage.setItem('wm_kits_materiales', JSON.stringify(k));
  };

  const presupuestoDelProyecto = presupuestos.find(p => p.proyectoId === selProyecto);
  const renglones = presupuestoDelProyecto?.renglones || [];

  const handleAdd = () => {
    if (!selRenglon || !selMaterial || cantidad <= 0) {
      toast.error('Selecciona renglón, material y cantidad');
      return;
    }
    const renglon = renglones.find(r => r.codigo === selRenglon || r.id === selRenglon);
    const mat = materiales.find(m => m.id === selMaterial);
    const nuevo: KitMaterial = {
      id: Date.now().toString(),
      renglonId: selRenglon,
      renglonNombre: renglon?.nombre || selRenglon,
      materialId: selMaterial,
      materialNombre: mat?.nombre || selMaterial,
      cantidadTeorica: cantidad,
      unidad: mat?.unidad || 'u',
    };
    saveKits([...kits, nuevo]);
    toast.success(`Kit agregado: ${nuevo.materialNombre} → ${nuevo.renglonNombre}`);
    setSelMaterial('');
    setCantidad(1);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    saveKits(kits.filter(k => k.id !== id));
    toast.success('Kit eliminado');
  };

  // Agrupar por renglón
  const kitsPorRenglon = useMemo(() => {
    const map: Record<string, KitMaterial[]> = {};
    kits.forEach(k => {
      if (!map[k.renglonId]) map[k.renglonId] = [];
      map[k.renglonId].push(k);
    });
    return Object.entries(map);
  }, [kits]);

  // Calcular consumo real desde vales de salida
  const consumoReal = useMemo(() => {
    const map: Record<string, number> = {};
    valesSalida.forEach(v => {
      v.items.forEach(item => {
        const key = item.materialId;
        map[key] = (map[key] || 0) + item.cantidad;
      });
    });
    return map;
  }, [valesSalida]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-indigo-500" /> Kits de Materiales por Renglón
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-medium hover:bg-indigo-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Agregar Kit
        </button>
      </div>

      {/* Selector de proyecto para contexto */}
      <div className="mb-3">
        <select
          value={selProyecto}
          onChange={e => { setSelProyecto(e.target.value); setSelRenglon(''); }}
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 outline-none focus:border-indigo-400"
        >
          <option value="">— Selecciona proyecto (opcional) —</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      {/* Formulario para agregar kit */}
      {showForm && (
        <div className="bg-indigo-50 rounded-xl p-3 mb-4 space-y-2 border border-indigo-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <select
              value={selRenglon}
              onChange={e => setSelRenglon(e.target.value)}
              className="px-2 py-1.5 text-xs rounded-lg border border-indigo-200 outline-none focus:border-indigo-400 bg-white"
            >
              <option value="">— Renglón —</option>
              {renglones.map(r => (
                <option key={r.codigo} value={r.codigo}>{r.codigo} - {r.nombre}</option>
              ))}
              {renglones.length === 0 && <option disabled>Selecciona un proyecto con presupuesto</option>}
            </select>
            <select
              value={selMaterial}
              onChange={e => setSelMaterial(e.target.value)}
              className="px-2 py-1.5 text-xs rounded-lg border border-indigo-200 outline-none focus:border-indigo-400 bg-white"
            >
              <option value="">— Material —</option>
              {materiales.map(m => (
                <option key={m.id} value={m.id}>{m.nombre} ({m.unidad})</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={cantidad}
              onChange={e => setCantidad(Math.max(0, +e.target.value))}
              placeholder="Cantidad teórica"
              className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-indigo-200 outline-none focus:border-indigo-400"
              min={0}
              step={0.01}
            />
            <button onClick={handleAdd} className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-medium hover:bg-indigo-600">
              <Check className="w-3.5 h-3.5 inline" /> Agregar
            </button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Lista de kits por renglón */}
      {kitsPorRenglon.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No hay kits configurados</p>
          <p className="text-xs">Define los materiales necesarios por cada renglón de presupuesto</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {kitsPorRenglon.map(([renglonId, items]) => (
            <div key={renglonId} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 border-b">
                <p className="text-xs font-semibold text-slate-700">{items[0].renglonNombre}</p>
                <p className="text-[10px] text-slate-400">{items.length} materiales</p>
              </div>
              <div className="divide-y divide-slate-50">
                {items.map(kit => {
                  const real = consumoReal[kit.materialId] || 0;
                  const diff = real - kit.cantidadTeorica;
                  const pct = kit.cantidadTeorica > 0 ? (real / kit.cantidadTeorica) * 100 : 0;
                  return (
                    <div key={kit.id} className="p-2.5 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-700 truncate">{kit.materialNombre}</p>
                            <p className="text-[10px] text-slate-400">
                              Teórico: {kit.cantidadTeorica} {kit.unidad} · Real: {real.toFixed(1)} {kit.unidad}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {real > 0 && (
                            <div className="text-right">
                              <div className="flex items-center gap-1">
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${pct > 100 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                </div>
                                <span className={`text-[10px] font-medium ${diff > 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                  {pct.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          )}
                          <button onClick={() => handleDelete(kit.id)} className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KitsMateriales;