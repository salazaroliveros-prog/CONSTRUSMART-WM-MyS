import React, { useState, useMemo } from 'react';
import IFCViewer from '../components/IFCViewer';
import { useErp } from '../store';
import type { RenglonPresupuesto } from '../types';
import { Box, Link, BarChart3, Ruler, Check, X, Search, Layers, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { fmtQ } from '../utils';

type BIMTab = 'visor' | 'vincular' | 'cubicacion' | 'avance';

const VisorBIM: React.FC = () => {
  const { proyectos, presupuestos, avances } = useErp();
  const [tab, setTab] = useState<BIMTab>('visor');
  const [selProyecto, setSelProyecto] = useState('');
  const [vinculos, setVinculos] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('wm_bim_vinculos') || '{}'); } catch { return {}; }
  });
  const [elementoSeleccionado, setElementoSeleccionado] = useState<string | null>(null);

  const proyectoActual = proyectos.find(p => p.id === selProyecto);
  const presupuestoActual = presupuestos.find(p => p.proyectoId === selProyecto);

  const renglones = presupuestoActual?.renglones || [];

  const saveVinculos = (v: Record<string, string>) => {
    setVinculos(v);
    localStorage.setItem('wm_bim_vinculos', JSON.stringify(v));
  };

  const vincularRenglon = (elementoId: string, renglonId: string) => {
    const nuevos = { ...vinculos, [elementoId]: renglonId };
    saveVinculos(nuevos);
    toast.success(`Elemento BIM vinculado a renglón`);
  };

  const desvincular = (elementoId: string) => {
    const nuevos = { ...vinculos };
    delete nuevos[elementoId];
    saveVinculos(nuevos);
    toast.success('Vinculación eliminada');
  };

  // Elementos BIM simulados (en producción vendrían del modelo IFC parseado)
  const elementosBIM = [
    { id: 'ifc_elem_001', nombre: 'Zapata Eje A-1', tipo: 'concreto' },
    { id: 'ifc_elem_002', nombre: 'Columna C-1', tipo: 'concreto' },
    { id: 'ifc_elem_003', nombre: 'Viga VP-101', tipo: 'concreto' },
    { id: 'ifc_elem_004', nombre: 'Losa Nivel +0.00', tipo: 'concreto' },
    { id: 'ifc_elem_005', nombre: 'Muro Fachada Este', tipo: 'mamposteria' },
    { id: 'ifc_elem_006', nombre: 'Muro Fachada Oeste', tipo: 'mamposteria' },
  ];

  // Cubicación extraída del modelo IFC (simulada)
  const cubicacionBIM = [
    { elementoId: 'ifc_elem_001', concepto: 'Concreto en zapatas', unidad: 'm³', cantidad: 4.5 },
    { elementoId: 'ifc_elem_002', concepto: 'Concreto en columnas', unidad: 'm³', cantidad: 3.2 },
    { elementoId: 'ifc_elem_003', concepto: 'Concreto en vigas', unidad: 'm³', cantidad: 6.8 },
    { elementoId: 'ifc_elem_004', concepto: 'Concreto en losas', unidad: 'm³', cantidad: 12.5 },
    { elementoId: 'ifc_elem_005', concepto: 'Mampostería fachada', unidad: 'm²', cantidad: 85 },
    { elementoId: 'ifc_elem_006', concepto: 'Mampostería fachada', unidad: 'm²', cantidad: 92 },
  ];

  // Avance desde campo (vales + avances registrados)
  const avanceCampo = useMemo(() => {
    const map: Record<string, number> = {};
    avances.filter(a => a.proyectoId === selProyecto).forEach(a => {
      const key = a.renglonId || a.renglonNombre;
      if (key) map[key] = Math.max(map[key] || 0, a.avanceFisico);
    });
    return map;
  }, [avances, selProyecto]);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Box className="w-6 h-6 text-blue-500" />
          <div>
            <h1 className="text-2xl font-black text-slate-800">BIM - Vinculación ERP</h1>
            <p className="text-xs text-slate-500">Vincula elementos del modelo IFC con el ERP y extrae cubicaciones</p>
          </div>
        </div>
        <select
          value={selProyecto}
          onChange={e => setSelProyecto(e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-400 bg-white"
        >
          <option value="">— Selecciona proyecto —</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl">
        {[
          { id: 'visor' as BIMTab, label: 'Visor 3D', icon: Box },
          { id: 'vincular' as BIMTab, label: 'Vincular Renglones', icon: Link },
          { id: 'cubicacion' as BIMTab, label: 'Cubicación', icon: Ruler },
          { id: 'avance' as BIMTab, label: 'Avance vs Campo', icon: Activity },
        ].map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                active ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}>
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Visor 3D */}
      {tab === 'visor' && <IFCViewer className="flex-1 min-h-[500px]" />}

      {/* Vincular Renglones */}
      {tab === 'vincular' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-auto">
          {/* Elementos BIM */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h2 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-1.5">
              <Box className="w-4 h-4 text-blue-500" /> Elementos del Modelo BIM
            </h2>
            <div className="space-y-2">
              {elementosBIM.map(elem => {
                const renglonVinculado = vinculos[elem.id];
                const renglonData = renglones.find(r => r.id === renglonVinculado || r.codigo === renglonVinculado);
                return (
                  <div key={elem.id} className={`p-3 rounded-lg border transition-colors ${renglonVinculado ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700">{elem.nombre}</p>
                        <p className="text-[10px] text-slate-400">{elem.tipo} · ID: {elem.id}</p>
                        {renglonVinculado && renglonData && (
                          <div className="mt-1 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded inline-block">
                            ✅ {renglonData.codigo} - {renglonData.nombre}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0 ml-2">
                        {renglonVinculado ? (
                          <button onClick={() => desvincular(elem.id)} className="px-2 py-1 bg-red-100 text-red-600 rounded text-[10px] hover:bg-red-200">Desvincular</button>
                        ) : (
                          <button onClick={() => setElementoSeleccionado(elem.id)} className="px-2 py-1 bg-blue-500 text-white rounded text-[10px] hover:bg-blue-600">Vincular</button>
                        )}
                      </div>
                    </div>
                    {/* Selector de renglón */}
                    {elementoSeleccionado === elem.id && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-[10px] font-medium text-blue-700 mb-1">Selecciona renglón:</p>
                        <select
                          onChange={e => { if (e.target.value) vincularRenglon(elem.id, e.target.value); }}
                          className="w-full px-2 py-1 text-xs rounded border border-blue-200 outline-none focus:border-blue-400"
                          defaultValue=""
                        >
                          <option value="" disabled>— Renglón —</option>
                          {renglones.map(r => (
                            <option key={r.id} value={r.id}>{r.codigo} - {r.nombre}</option>
                          ))}
                          {renglones.length === 0 && (
                            <option disabled>Sin renglones (selecciona proyecto con presupuesto)</option>
                          )}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Renglones del presupuesto */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h2 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-500" /> Renglones del Presupuesto
            </h2>
            {renglones.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Selecciona un proyecto con presupuesto</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {renglones.map(r => {
                  const vinculadoA = Object.entries(vinculos).find(([, v]) => v === r.id);
                  return (
                    <div key={r.id} className={`p-2 rounded-lg text-xs ${vinculadoA ? 'bg-emerald-50 border border-emerald-200' : 'border border-slate-100'}`}>
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-slate-700">{r.codigo}</span>
                          <span className="text-slate-400 ml-1">{r.nombre}</span>
                          {vinculadoA && (
                            <span className="ml-1 text-[10px] text-emerald-600">🔗 {vinculadoA[1]}</span>
                          )}
                        </div>
                        <span className="text-slate-400">{r.unidad} · {fmtQ(r.totalCD || 0)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cubicación */}
      {tab === 'cubicacion' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h2 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-1.5">
              <Ruler className="w-4 h-4 text-orange-500" /> Cubicación desde Modelo BIM
            </h2>
            <div className="space-y-2">
              {cubicacionBIM.map(c => {
                const elemBIM = elementosBIM.find(e => e.id === c.elementoId);
                return (
                  <div key={c.elementoId} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-700">{c.concepto}</p>
                      <p className="text-[10px] text-slate-400">{elemBIM?.nombre}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-bold text-orange-600">{c.cantidad.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-400">{c.unidad}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t flex justify-between text-xs font-bold text-slate-700">
              <span>Total:</span>
              <span>{cubicacionBIM.reduce((a, c) => a + c.cantidad, 0).toFixed(2)} unidades</span>
            </div>
          </div>

          {/* Comparativa BIM vs Presupuesto */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h2 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-500" /> BIM vs Presupuesto ERP
            </h2>
            {renglones.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Selecciona un proyecto con presupuesto</p>
            ) : (
              <div className="space-y-2">
                {renglones.slice(0, 10).map(r => {
                  // Encontrar cubicación BIM equivalente por nombre
                  const cBIM = cubicacionBIM.find(c => r.nombre.toLowerCase().includes(c.concepto.toLowerCase().split(' ').slice(0, 2).join(' ')));
                  const cantBIM = cBIM?.cantidad || 0;
                  const cantPresup = r.cantidad || 0;
                  const diff = cantBIM - cantPresup;
                  const pct = cantPresup > 0 ? (cantBIM / cantPresup) * 100 : 0;
                  return (
                    <div key={r.id} className="p-2 rounded-lg border border-slate-100">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700">{r.codigo} - {r.nombre}</span>
                        <span className={`text-[10px] ${Math.abs(diff) > 1 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)} {r.unidad}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400 w-20 text-right">
                          BIM: {cantBIM.toFixed(1)} / Presup: {cantPresup.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Avance vs Campo */}
      {tab === 'avance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h2 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-500" /> Avance desde Campo
            </h2>
            {renglones.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Selecciona un proyecto</p>
            ) : (
              <div className="space-y-2">
                {renglones.map(r => {
                  const avance = avanceCampo[r.id] || avanceCampo[r.codigo] || 0;
                  return (
                    <div key={r.id} className="p-2 rounded-lg border border-slate-100">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700 truncate">{r.codigo} - {r.nombre}</span>
                        <span className="font-bold text-blue-600">{avance}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min(avance, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Comparativa: Modelo vs Campo */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h2 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-purple-500" /> Modelo BIM vs Avance Campo
            </h2>
            <p className="text-xs text-slate-400 mb-3">Compara los elementos del modelo BIM vinculados con el avance físico registrado en campo.</p>
            <div className="space-y-2">
              {elementosBIM.filter(e => vinculos[e.id]).map(elem => {
                const renglonId = vinculos[elem.id];
                const renglon = renglones.find(r => r.id === renglonId);
                const avanceFisico = avanceCampo[renglonId] || avanceCampo[renglon?.codigo || ''] || 0;
                const avanceModelo = 0; // En producción vendría del modelo comparando geometría
                return (
                  <div key={elem.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700">{elem.nombre}</span>
                      <span className="text-[10px] text-indigo-500">{renglon?.codigo}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <div>
                        <p className="text-[10px] text-slate-400">Campo</p>
                        <div className="flex items-center gap-1">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${avanceFisico}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600">{avanceFisico}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Modelo BIM</p>
                        <div className="flex items-center gap-1">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${avanceModelo}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-blue-600">{avanceModelo}%</span>
                        </div>
                      </div>
                    </div>
                    {avanceFisico > 0 && avanceModelo > 0 && Math.abs(avanceFisico - avanceModelo) > 5 && (
                      <p className="text-[10px] text-amber-600 mt-1">⚠️ Desviación detectada: {Math.abs(avanceFisico - avanceModelo).toFixed(0)}%</p>
                    )}
                  </div>
                );
              })}
              {elementosBIM.filter(e => vinculos[e.id]).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Vincula elementos BIM con renglones para ver la comparativa</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisorBIM;