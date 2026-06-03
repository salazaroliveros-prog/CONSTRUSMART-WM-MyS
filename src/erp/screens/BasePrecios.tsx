import React, { useMemo, useState } from 'react';
import { useErp } from '../store';
import {
  Database, Search, Check, X, RefreshCw, Upload, Download,
  Plus, Edit3, Trash2, ArrowUpDown
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { SEED_INSUMOS_BASE } from '../data';
import { InsumoBase } from '../types';

// Factor por zona/región
const FACTORES_ZONA: Record<string, number> = {
  'Guatemala': 1.0,
  'Mixco': 1.02,
  'Villa Nueva': 1.03,
  'Amatitlán': 1.05,
  'Chinautla': 1.04,
  'Santa Catarina Pinula': 1.01,
  'Escuintla': 1.08,
  'Quetzaltenango': 1.12,
  'Sololá': 1.10,
  'Chimaltenango': 1.07,
};

// Conversión de unidades
const CONVERSIONES: Record<string, { de: string; a: string; factor: number }[]> = {
  'm³': [{ de: 'm³', a: 'lt', factor: 1000 }, { de: 'lt', a: 'm³', factor: 0.001 }],
  'kg': [{ de: 'kg', a: 'qq', factor: 0.01 }, { de: 'qq', a: 'kg', factor: 100 }],
  'm': [{ de: 'm', a: 'cm', factor: 100 }, { de: 'cm', a: 'm', factor: 0.01 }],
  'm²': [{ de: 'm²', a: 'ft²', factor: 10.764 }, { de: 'ft²', a: 'm²', factor: 0.0929 }],
  'saco': [{ de: 'saco', a: 'kg', factor: 42.5 }],
  'galon': [{ de: 'galon', a: 'lt', factor: 3.785 }, { de: 'lt', a: 'galon', factor: 0.264 }],
};

const BasePrecios: React.FC = () => {
  const { proyectos } = useErp();
  const [loading, setLoading] = useState(true);
  const [insumos, setInsumos] = useState<InsumoBase[]>(SEED_INSUMOS_BASE);
  const [search, setSearch] = useState('');
  const [rubroFilter, setRubroFilter] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [zonaSeleccionada, setZonaSeleccionada] = useState('Guatemala');
  const [showConvertir, setShowConvertir] = useState(false);
  const [convDe, setConvDe] = useState('');
  const [convA, setConvA] = useState('');
  const [convCantidad, setConvCantidad] = useState(1);
  const [editando, setEditando] = useState<string | null>(null);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState(0);
  const [nuevoUnidad, setNuevoUnidad] = useState('');
  const [nuevoRubro, setNuevoRubro] = useState('');
  const [showAgregar, setShowAgregar] = useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  const rubros = useMemo(() => [...new Set(insumos.map(i => i.rubro))].sort(), [insumos]);
  const unidades = useMemo(() => [...new Set(insumos.map(i => i.unidad))].sort(), [insumos]);
  const zonas = Object.keys(FACTORES_ZONA);

  const filtered = useMemo(() => {
    let f = insumos;
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(i => i.nombre.toLowerCase().includes(q));
    }
    if (rubroFilter) f = f.filter(i => i.rubro === rubroFilter);
    if (categoriaFilter) f = f.filter(i => i.categoria === categoriaFilter);
    return f;
  }, [insumos, search, rubroFilter, categoriaFilter]);

  const factorZona = FACTORES_ZONA[zonaSeleccionada] || 1;

  // Conversión de unidades
  const resultadoConversion = useMemo(() => {
    if (!convDe || !convA || convCantidad <= 0) return null;
    // Si es la misma unidad
    if (convDe === convA) return { resultado: convCantidad, factor: 1 };
    // Buscar conversión directa
    const conversionesDe = CONVERSIONES[convDe] || [];
    const conv = conversionesDe.find(c => c.a === convA);
    if (conv) return { resultado: +(convCantidad * conv.factor).toFixed(4), factor: conv.factor };
    // Buscar conversión inversa
    const convInv = (CONVERSIONES[convA] || []).find(c => c.a === convDe);
    if (convInv) return { resultado: +(convCantidad / convInv.factor).toFixed(4), factor: 1 / convInv.factor };
    return null;
  }, [convDe, convA, convCantidad]);

  const handleExportarCSV = () => {
    const header = 'Nombre,Categoría,Unidad,Precio Referencia,Rubro,Última Actualización';
    const rows = filtered.map(i =>
      `${i.nombre},${i.categoria},${i.unidad},${i.precioReferencia},${i.rubro},${i.fechaActualizacion}`
    ).join('\n');
    const csv = `${header}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `base-precios-${zonaSeleccionada}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('📥 CSV exportado');
  };

  const handleImportarCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) { toast.error('CSV vacío o inválido'); return; }
        const header = lines[0].toLowerCase();
        if (!header.includes('nombre') || !header.includes('precio')) {
          toast.error('Formato CSV inválido (requiere columnas: nombre, precio_referencia)');
          return;
        }
        const nuevos: InsumoBase[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          if (cols.length >= 3) {
            nuevos.push({
              id: `ib-imported-${Date.now()}-${i}`,
              nombre: cols[0] || `Insumo ${i}`,
              categoria: (cols[1] || 'material') as InsumoBase['categoria'],
              unidad: cols[2] || 'u',
              precioReferencia: parseFloat(cols[3]) || 0,
              rubro: cols[4] || 'general',
              fechaActualizacion: new Date().toISOString().slice(0, 10),
            });
          }
        }
        if (nuevos.length > 0) {
          setInsumos(prev => [...prev, ...nuevos]);
          toast.success(`✅ ${nuevos.length} insumos importados`);
        } else {
          toast.error('No se pudieron importar insumos del CSV');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleActivarDesactivar = (id: string) => {
    // Simulamos activar/desactivar con un campo "activo" implícito (precio = 0 = inactivo)
    setInsumos(prev => prev.map(i =>
      i.id === id ? { ...i, precioReferencia: i.precioReferencia > 0 ? 0 : 1, fechaActualizacion: new Date().toISOString().slice(0, 10) } : i
    ));
  };

  const handleGuardarEdicion = (id: string) => {
    setInsumos(prev => prev.map(i => i.id === id ? {
      ...i,
      nombre: nuevoNombre || i.nombre,
      precioReferencia: nuevoPrecio > 0 ? nuevoPrecio : i.precioReferencia,
      unidad: nuevoUnidad || i.unidad,
      rubro: nuevoRubro || i.rubro,
      fechaActualizacion: new Date().toISOString().slice(0, 10),
    } : i));
    setEditando(null);
    toast.success('Insumo actualizado');
  };

  const handleAgregar = () => {
    if (!nuevoNombre.trim()) { toast.error('Nombre requerido'); return; }
    if (nuevoPrecio <= 0) { toast.error('Precio requerido'); return; }
    const nuevo: InsumoBase = {
      id: `ib-new-${Date.now()}`,
      nombre: nuevoNombre.trim(),
      categoria: 'material',
      unidad: nuevoUnidad || 'u',
      precioReferencia: nuevoPrecio,
      rubro: nuevoRubro || 'general',
      fechaActualizacion: new Date().toISOString().slice(0, 10),
    };
    setInsumos(prev => [...prev, nuevo]);
    toast.success('✅ Insumo agregado');
    setNuevoNombre(''); setNuevoPrecio(0); setNuevoUnidad(''); setNuevoRubro('');
    setShowAgregar(false);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const totalValor = filtered.reduce((a, i) => a + i.precioReferencia, 0);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Database className="w-6 h-6 text-teal-500" /> Base de Precios
        </h1>
        <div className="flex gap-2 flex-wrap">
          <select
            value={zonaSeleccionada}
            onChange={e => setZonaSeleccionada(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 outline-none bg-white"
          >
            {zonas.map(z => (
              <option key={z} value={z}>{z} {FACTORES_ZONA[z] > 1 ? `(+${((FACTORES_ZONA[z]-1)*100).toFixed(0)}%)` : ''}</option>
            ))}
          </select>
          <button onClick={handleImportarCSV} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition-colors">
            <Upload className="w-3.5 h-3.5" /> Importar CSV
          </button>
          <button onClick={handleExportarCSV} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors">
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </button>
          <button onClick={() => setShowConvertir(!showConvertir)} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors">
            <ArrowUpDown className="w-3.5 h-3.5" /> Convertir
          </button>
          <button onClick={() => { setShowAgregar(true); setNuevoNombre(''); setNuevoPrecio(0); setNuevoUnidad(''); setNuevoRubro(''); }} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Nuevo
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="text-[10px] text-slate-400">Insumos</div>
          <div className="text-lg font-bold text-slate-800">{insumos.length}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="text-[10px] text-slate-400">Zona</div>
          <div className="text-lg font-bold text-slate-800">{zonaSeleccionada}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="text-[10px] text-slate-400">Factor Zona</div>
          <div className="text-lg font-bold text-teal-600">x{factorZona.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="text-[10px] text-slate-400">Inactivos</div>
          <div className="text-lg font-bold text-red-600">{insumos.filter(i => i.precioReferencia === 0).length}</div>
        </div>
      </div>

      {/* Conversor de unidades */}
      {showConvertir && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-4">
          <h3 className="font-bold text-slate-700 text-sm mb-3">🔄 Conversor de Unidades</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">De</label>
              <select value={convDe} onChange={e => setConvDe(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white outline-none">
                <option value="">— Unidad —</option>
                {unidades.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">A</label>
              <select value={convA} onChange={e => setConvA(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white outline-none">
                <option value="">— Unidad —</option>
                {unidades.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Cantidad</label>
              <input type="number" value={convCantidad} onChange={e => setConvCantidad(Math.max(0, +e.target.value))} min={0} className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 outline-none" />
            </div>
            <div className="bg-white rounded-lg p-2 text-center border border-slate-200">
              <div className="text-[9px] text-slate-400">Resultado</div>
              <div className="text-lg font-bold text-indigo-600">
                {resultadoConversion ? `${resultadoConversion.resultado} ${convA}` : '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agregar insumo */}
      {showAgregar && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-4">
          <h3 className="font-bold text-slate-700 text-sm mb-3">➕ Agregar Nuevo Insumo</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder="Nombre *" className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-emerald-400" />
            <input type="number" value={nuevoPrecio || ''} onChange={e => setNuevoPrecio(+e.target.value)} placeholder="Precio Q *" min={0} step={0.01} className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-emerald-400" />
            <input value={nuevoUnidad} onChange={e => setNuevoUnidad(e.target.value)} placeholder="Unidad (m², kg...)" className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-emerald-400" />
            <input value={nuevoRubro} onChange={e => setNuevoRubro(e.target.value)} placeholder="Rubro (concreto...)" className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-emerald-400" />
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={handleAgregar} className="text-xs px-4 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors font-medium">Agregar</button>
            <button onClick={() => setShowAgregar(false)} className="text-xs px-4 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="relative flex-1 min-w-[150px]">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar insumo..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-teal-400"
          />
        </div>
        <select value={rubroFilter} onChange={e => setRubroFilter(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 outline-none">
          <option value="">Todos los rubros</option>
          {rubros.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={categoriaFilter} onChange={e => setCategoriaFilter(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 outline-none">
          <option value="">Todas las categorías</option>
          <option value="material">Material</option>
          <option value="mano_obra">Mano de obra</option>
          <option value="equipo">Equipo</option>
          <option value="subcontrato">Subcontrato</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 bg-slate-50">
                <th className="text-left py-2 px-2 font-medium">Insumo</th>
                <th className="text-left py-2 px-2 font-medium">Cat.</th>
                <th className="text-left py-2 px-2 font-medium">Unidad</th>
                <th className="text-right py-2 px-2 font-medium">Precio Base</th>
                <th className="text-right py-2 px-2 font-medium">Precio × Zona</th>
                <th className="text-left py-2 px-2 font-medium">Rubro</th>
                <th className="text-left py-2 px-2 font-medium">Actualizado</th>
                <th className="text-center py-2 px-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ins => {
                const precioZona = +(ins.precioReferencia * factorZona).toFixed(2);
                const inactivo = ins.precioReferencia === 0;
                return (
                  <tr key={ins.id} className={`border-b border-slate-50 hover:bg-slate-50 ${inactivo ? 'opacity-50' : ''}`}>
                    <td className="py-2 px-2 font-medium text-slate-700">
                      {editando === ins.id ? (
                        <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} className="w-full text-xs px-1 py-0.5 rounded border border-teal-300 outline-none" />
                      ) : ins.nombre}
                    </td>
                    <td className="py-2 px-2">
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                        ins.categoria === 'material' ? 'bg-blue-50 text-blue-600' :
                        ins.categoria === 'mano_obra' ? 'bg-emerald-50 text-emerald-600' :
                        ins.categoria === 'equipo' ? 'bg-purple-50 text-purple-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {ins.categoria}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-slate-500">{ins.unidad}</td>
                    <td className="py-2 px-2 text-right font-semibold text-slate-700">
                      {editando === ins.id ? (
                        <input type="number" value={nuevoPrecio} onChange={e => setNuevoPrecio(+e.target.value)} className="w-20 text-xs px-1 py-0.5 rounded border border-teal-300 text-right outline-none" />
                      ) : `Q${ins.precioReferencia.toFixed(2)}`}
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-teal-600">
                      Q{precioZona.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-slate-500">{ins.rubro}</td>
                    <td className="py-2 px-2 text-slate-400 text-[10px]">{ins.fechaActualizacion}</td>
                    <td className="py-2 px-2 text-center">
                      {editando === ins.id ? (
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleGuardarEdicion(ins.id)} className="p-1 text-emerald-500 hover:text-emerald-600"><Check className="w-3 h-3" /></button>
                          <button onClick={() => setEditando(null)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-1">
                          <button onClick={() => { setEditando(ins.id); setNuevoNombre(ins.nombre); setNuevoPrecio(ins.precioReferencia); setNuevoUnidad(ins.unidad); setNuevoRubro(ins.rubro); }} className="p-1 text-slate-400 hover:text-teal-500"><Edit3 className="w-3 h-3" /></button>
                          <button onClick={() => handleActivarDesactivar(ins.id)} className={`p-1 ${inactivo ? 'text-emerald-400' : 'text-red-400 hover:text-red-500'}`}>
                            {inactivo ? <RefreshCw className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <span className="text-[10px] text-slate-400">{filtered.length} insumos · Precio base total: Q{totalValor.toFixed(2)}</span>
          <span className="text-[10px] text-teal-500 font-medium">Zona: {zonaSeleccionada} (x{factorZona})</span>
        </div>
      </div>
    </div>
  );
};

export default BasePrecios;