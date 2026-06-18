import React, { useMemo, useState } from 'react';
import { useErp } from '../store';
import {
  Receipt, Search, DollarSign, Users, Wrench, Save, Edit3,
  BarChart3, Table as TableIcon, Settings, RefreshCw,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { FactorSobrecosto, InsumoBase, RendimientoCuadrilla } from '../types';

type Tab = 'insumos' | 'rendimientos' | 'sobrecosto' | 'calculo' | 'historico';

const FACTOR_DEFAULT: FactorSobrecosto = {
  indirectos: 12,
  administracion: 5,
  imprevistos: 5,
  utilidad: 10,
};

const APUAvanzado: React.FC = () => {
  const { proyectos, updateProyecto, insumosBase, rendimientosCuadrilla } = useErp();

  const [tab, setTab] = useState<Tab>('insumos');
  const [loading, setLoading] = useState(false);
  const [searchInsumo, setSearchInsumo] = useState('');
  const [searchRend, setSearchRend] = useState('');
  const [proyectoId, setProyectoId] = useState('');
  const [factor, setFactor] = useState<FactorSobrecosto>(FACTOR_DEFAULT);
  const [editFactor, setEditFactor] = useState(false);

  // Usar datos reales del store
  const insumos = insumosBase || [];
  const rendimientos = rendimientosCuadrilla || [];

  const rubros = useMemo(() => [...new Set(insumos.map(i => i.rubro))], [insumos]);
  const [rubroFilter, setRubroFilter] = useState('');

  const filteredInsumos = useMemo(() => {
    let f = insumos;
    if (searchInsumo) {
      const q = searchInsumo.toLowerCase();
      f = f.filter(i => i.nombre.toLowerCase().includes(q));
    }
    if (rubroFilter) f = f.filter(i => i.rubro === rubroFilter);
    return f;
  }, [insumos, searchInsumo, rubroFilter]);

  const filteredRendimientos = useMemo(() => {
    if (!searchRend) return rendimientos;
    const q = searchRend.toLowerCase();
    return rendimientos.filter(r =>
      r.actividad.toLowerCase().includes(q) || r.cuadrilla.toLowerCase().includes(q)
    );
  }, [rendimientos, searchRend]);

  const proyecto = proyectos.find(p => p.id === proyectoId);

  // Cálculo APU
  const calculos = useMemo(() => {
    // Ejemplo con un renglón típico: Concreto en cimientos
    const cd = {
      materiales: 950,
      manoObra: 280,
      equipo: 60,
    };
    const costoDirecto = cd.materiales + cd.manoObra + cd.equipo;
    const f = proyecto?.factorSobrecosto || factor;
    const pctTotal = f.indirectos + f.administracion + f.imprevistos + f.utilidad;
    const factorMultiplicador = 1 + (pctTotal / 100);
    const precioVenta = costoDirecto * factorMultiplicador;
    return { cd, costoDirecto, f, pctTotal, factorMultiplicador, precioVenta };
  }, [proyecto, factor]);

  const handleSaveFactor = () => {
    if (proyectoId) {
      updateProyecto(proyectoId, { factorSobrecosto: factor });
      toast.success('Factor de sobrecosto actualizado para el proyecto');
    } else {
      toast.success('Factor guardado (sin proyecto)');
    }
    setEditFactor(false);
  };

  // Histórico de precios generado desde datos reales de insumos
  const historial = useMemo(() => {
    if (insumos.length === 0) return [];
    
    // Agrupar por fecha actualización si existe
    const fechasUnicas = [...new Set(insumos.map(i => i.fechaActualizacion).filter(Boolean))] as string[];
    if (fechasUnicas.length === 0) return [];
    
    // Generar histórico basado en precios reales
    const historialGenerado = fechasUnicas.slice(-5).map(fecha => {
      const insumosFecha = insumos.filter(i => i.fechaActualizacion === fecha);
      const cemento = insumosFecha.find(i => i.nombre.toLowerCase().includes('cemento'))?.precioReferencia || 0;
      const hierro = insumosFecha.find(i => i.nombre.toLowerCase().includes('hierro') || i.nombre.toLowerCase().includes('varilla'))?.precioReferencia || 0;
      const arena = insumosFecha.find(i => i.nombre.toLowerCase().includes('arena'))?.precioReferencia || 0;
      const block = insumosFecha.find(i => i.nombre.toLowerCase().includes('block'))?.precioReferencia || 0;
      
      return {
        fecha: fecha.slice(0, 7), // YYYY-MM
        cemento: cemento || 0,
        hierro: hierro || 0,
        arena: arena || 0,
        block: block || 0,
      };
    });
    
    return historialGenerado;
  }, [insumos]);



  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'insumos', label: 'Insumos Base', icon: TableIcon },
    { id: 'rendimientos', label: 'Rendimientos', icon: Users },
    { id: 'sobrecosto', label: 'Sobrecosto', icon: Settings },
    { id: 'calculo', label: 'Cálculo APU', icon: DollarSign },
    { id: 'historico', label: 'Histórico Precios', icon: BarChart3 },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Receipt className="w-6 h-6 text-primary" /> APU Avanzado
        </h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="w-3 h-3" />
          Precios referencia Guatemala 2026
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-4 bg-muted rounded-xl p-1 shadow-sm border border-border">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                tab === t.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-background'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-4 sm:p-5">
        {tab === 'insumos' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <h2 className="font-bold text-foreground text-sm">Catálogo de Insumos Base</h2>
              <div className="flex flex-wrap gap-2">
                <select
                  value={rubroFilter}
                  onChange={e => setRubroFilter(e.target.value)}
                  className="text-xs px-2 py-1.5 rounded-lg border border-input outline-none bg-background text-foreground"
                >
                  <option value="">Todos los rubros</option>
                  {rubros.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <div className="relative">
                  <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={searchInsumo}
                    onChange={e => setSearchInsumo(e.target.value)}
                    placeholder="Buscar insumo..."
                    className="pl-7 pr-3 py-1.5 text-xs rounded-lg border border-input outline-none focus:border-ring bg-background text-foreground w-full sm:w-44"
                  />
                </div>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground mb-2">
              {filteredInsumos.length} insumos · Precios de referencia INSIVUMEH / MOP
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 px-2 font-medium">Insumo</th>
                    <th className="text-left py-2 px-2 font-medium">Categoría</th>
                    <th className="text-left py-2 px-2 font-medium">Unidad</th>
                    <th className="text-right py-2 px-2 font-medium">Precio Ref.</th>
                    <th className="text-left py-2 px-2 font-medium">Rubro</th>
                    <th className="text-left py-2 px-2 font-medium">Últ. Actualización</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInsumos.map(ins => (
                    <tr key={ins.id} className="border-b border-border hover:bg-muted">
                      <td className="py-2 px-2 font-medium text-foreground">{ins.nombre}</td>
                      <td className="py-2 px-2">
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                          ins.categoria === 'material' ? 'bg-info/10 text-info' :
                          ins.categoria === 'mano_obra' ? 'bg-success/10 text-success' :
                          ins.categoria === 'equipo' ? 'bg-accent/10 text-accent' :
                          'bg-warning/10 text-warning'
                        }`}>
                          {ins.categoria}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">{ins.unidad}</td>
                      <td className="py-2 px-2 text-right font-semibold text-foreground">Q{ins.precioReferencia.toFixed(2)}</td>
                      <td className="py-2 px-2 text-muted-foreground">{ins.rubro}</td>
                      <td className="py-2 px-2 text-muted-foreground">{ins.fechaActualizacion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'rendimientos' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-700 text-sm">Rendimientos por Cuadrilla</h2>
              <div className="relative">
                <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={searchRend}
                  onChange={e => setSearchRend(e.target.value)}
                  placeholder="Buscar actividad..."
                  className="pl-7 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-orange-400 w-full sm:w-44"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400">
                    <th className="text-left py-2 px-2 font-medium">Actividad</th>
                    <th className="text-left py-2 px-2 font-medium">Cuadrilla</th>
                    <th className="text-right py-2 px-2 font-medium">Rendimiento</th>
                    <th className="text-left py-2 px-2 font-medium">Unidad</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRendimientos.map(r => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-2 font-medium text-slate-700">{r.actividad}</td>
                      <td className="py-2 px-2 text-slate-500">{r.cuadrilla}</td>
                      <td className="py-2 px-2 text-right font-semibold text-slate-700">{r.rendimientoDiario}</td>
                      <td className="py-2 px-2 text-slate-500">{r.unidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'sobrecosto' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-700 text-sm">Factor de Sobrecosto</h2>
              <button
                onClick={() => setEditFactor(!editFactor)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <Edit3 className="w-3 h-3" /> {editFactor ? 'Cancelar' : 'Editar'}
              </button>
            </div>

            {/* Selector de proyecto */}
            <div className="mb-4">
              <label className="text-xs text-slate-500 mb-1 block font-medium">Aplicar a proyecto</label>
              <select
                value={proyectoId}
                onChange={e => {
                  setProyectoId(e.target.value);
                  const p = proyectos.find(pr => pr.id === e.target.value);
                  if (p?.factorSobrecosto) setFactor(p.factorSobrecosto);
                }}
                className="w-full max-w-xs px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-orange-400"
              >
                <option value="">— Sin proyecto (referencia general) —</option>
                {proyectos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.factorSobrecosto ? '✅' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Factores editables */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {([
                { key: 'indirectos', label: 'Indirectos', desc: 'Gastos generales de obra' },
                { key: 'administracion', label: 'Administración', desc: 'Gastos administrativos' },
                { key: 'imprevistos', label: 'Imprevistos', desc: 'Contingencias' },
                { key: 'utilidad', label: 'Utilidad', desc: 'Margen de ganancia' },
              ] as const).map(item => (
                <div key={item.key} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-[10px] text-slate-400 mb-1">{item.label}</div>
                  <div className="text-[10px] text-slate-300 mb-1">{item.desc}</div>
                  {editFactor ? (
                    <input
                      type="number"
                      value={factor[item.key]}
                      onChange={e => setFactor(f => ({ ...f, [item.key]: Math.max(0, +e.target.value) }))}
                      min={0}
                      max={100}
                      className="w-full px-2 py-1 text-sm font-bold text-right rounded border border-slate-200 outline-none focus:border-orange-400"
                    />
                  ) : (
                    <div className="text-lg font-bold text-slate-800">{factor[item.key]}%</div>
                  )}
                </div>
              ))}
            </div>

            {/* Resumen */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-xs text-orange-600 font-medium">Total sobrecosto:</span>
                  <span className="text-xl font-bold text-orange-700 ml-2">
                    {factor.indirectos + factor.administracion + factor.imprevistos + factor.utilidad}%
                  </span>
                </div>
                <div>
                  <span className="text-xs text-orange-600 font-medium">Factor multiplicador:</span>
                  <span className="text-xl font-bold text-orange-700 ml-2">
                    x{((factor.indirectos + factor.administracion + factor.imprevistos + factor.utilidad) / 100 + 1).toFixed(2)}
                  </span>
                </div>
                {editFactor && (
                  <button
                    onClick={handleSaveFactor}
                    className="flex items-center gap-1 text-xs px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium"
                  >
                    <Save className="w-3 h-3" /> Guardar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'calculo' && (
          <div>
            <h2 className="font-bold text-slate-700 text-sm mb-3">Cálculo Automático: CD → PV</h2>
            <p className="text-xs text-slate-400 mb-4">
              Ejemplo con renglón: <strong>Concreto en cimientos</strong> (1 m³)
            </p>

            {/* Desglose CD */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Wrench className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs font-medium text-blue-600">Materiales</span>
                </div>
                <div className="text-xl font-bold text-blue-700">Q{calculos.cd.materiales.toFixed(2)}</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-600">Mano de Obra</span>
                </div>
                <div className="text-xl font-bold text-emerald-700">Q{calculos.cd.manoObra.toFixed(2)}</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Settings className="w-3.5 h-3.5 text-purple-500" />
                  <span className="text-xs font-medium text-purple-600">Equipo</span>
                </div>
                <div className="text-xl font-bold text-purple-700">Q{calculos.cd.equipo.toFixed(2)}</div>
              </div>
            </div>

            {/* Costo Directo */}
            <div className="bg-slate-900 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Costo Directo (CD)</span>
                  <div className="text-xl font-bold text-white">Q{calculos.costoDirecto.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Sobrecosto</span>
                  <div className="text-lg font-bold text-orange-400">{calculos.pctTotal}%</div>
                </div>
              </div>
            </div>

            {/* Precio de Venta */}
            <div className="bg-gradient-to-r from-primary to-warning rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-white/80">Precio de Venta (PV)</span>
                  <div className="text-2xl font-bold text-white">Q{calculos.precioVenta.toFixed(2)}</div>
                  <span className="text-[10px] text-white/60">por unidad de obra</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-white/80">Factor</span>
                  <div className="text-lg font-bold text-white">x{calculos.factorMultiplicador.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Fórmula */}
            <div className="mt-4 bg-slate-50 rounded-xl p-3 text-xs text-slate-500 font-mono">
              <div className="font-semibold text-slate-700 mb-1">Fórmula:</div>
              <div>CD = Materiales + MO + Equipo = Q{calculos.cd.materiales.toFixed(2)} + Q{calculos.cd.manoObra.toFixed(2)} + Q{calculos.cd.equipo.toFixed(2)} = Q{calculos.costoDirecto.toFixed(2)}</div>
              <div>PV = CD × (1 + (Indirectos + Admin + Imprevistos + Utilidad) / 100)</div>
              <div>PV = Q{calculos.costoDirecto.toFixed(2)} × (1 + {calculos.pctTotal} / 100) = Q{calculos.precioVenta.toFixed(2)}</div>
            </div>
          </div>
        )}

        {tab === 'historico' && (
          <div>
            <h2 className="font-bold text-slate-700 text-sm mb-3">Histórico de Precios por Insumo</h2>
            <p className="text-xs text-slate-400 mb-4">Evolución de precios de referencia — Guatemala 2025–2026</p>

            {/* Mini gráfica de tendencia */}
            <div className="relative h-40 mb-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-end gap-1 h-full">
                {historial.map((h, i) => {
                  const maxVal = Math.max(...historial.map(x => x.cemento));
                  const hPct = (h.cemento / maxVal) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-slate-400 font-medium">{h.cemento}</span>
                      <div
                        className="w-full bg-orange-400 rounded-t transition-all"
                        style={{ height: `${hPct}%`, minHeight: 8 }}
                      />
                      <span className="text-[8px] text-slate-400">{h.fecha.slice(2)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="absolute top-2 left-3 text-[10px] text-slate-400">Cemento UGC (Q/saco)</div>
            </div>

            {/* Tabla histórica */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400">
                    <th className="text-left py-2 px-2 font-medium">Fecha</th>
                    <th className="text-right py-2 px-2 font-medium">Cemento</th>
                    <th className="text-right py-2 px-2 font-medium">Hierro 3/8&quot;</th>
                    <th className="text-right py-2 px-2 font-medium">Arena</th>
                    <th className="text-right py-2 px-2 font-medium">Block</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((h, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-2 font-medium text-slate-700">{h.fecha}</td>
                      <td className="py-2 px-2 text-right">Q{h.cemento}</td>
                      <td className="py-2 px-2 text-right">Q{h.hierro}</td>
                      <td className="py-2 px-2 text-right">Q{h.arena}</td>
                      <td className="py-2 px-2 text-right">Q{h.block}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tendencia */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="text-[10px] text-slate-500">Cemento</div>
                <div className="text-sm font-bold text-orange-600">
                  Q{historial[historial.length-1].cemento.toFixed(0)}
                  <span className="text-[10px] ml-1 text-red-500">↑ {((historial[historial.length-1].cemento - historial[0].cemento) / historial[0].cemento * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="text-[10px] text-slate-500">Hierro 3/8&quot;</div>
                <div className="text-sm font-bold text-blue-600">
                  Q{historial[historial.length-1].hierro.toFixed(0)}
                  <span className="text-[10px] ml-1 text-red-500">↑ {((historial[historial.length-1].hierro - historial[0].hierro) / historial[0].hierro * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="text-[10px] text-slate-500">Arena</div>
                <div className="text-sm font-bold text-emerald-600">
                  Q{historial[historial.length-1].arena.toFixed(0)}
                  <span className="text-[10px] ml-1 text-red-500">↑ {((historial[historial.length-1].arena - historial[0].arena) / historial[0].arena * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="text-[10px] text-slate-500">Block</div>
                <div className="text-sm font-bold text-purple-600">
                  Q{historial[historial.length-1].block.toFixed(0)}
                  <span className="text-[10px] ml-1 text-red-500">↑ {((historial[historial.length-1].block - historial[0].block) / historial[0].block * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default APUAvanzado;