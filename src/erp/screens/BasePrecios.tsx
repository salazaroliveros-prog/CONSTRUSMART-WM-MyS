import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import {
  Database, Search, Check, X, RefreshCw, Upload, Download,
  Plus, Edit3, Trash2, ArrowUpDown
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { downloadBlob } from '../utils';

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

const CONVERSIONES: Record<string, { de: string; a: string; factor: number }[]> = {
  'm³': [{ de: 'm³', a: 'lt', factor: 1000 }, { de: 'lt', a: 'm³', factor: 0.001 }],
  'kg': [{ de: 'kg', a: 'qq', factor: 0.01 }, { de: 'qq', a: 'kg', factor: 100 }],
  'm': [{ de: 'm', a: 'cm', factor: 100 }, { de: 'cm', a: 'm', factor: 0.01 }],
  'm²': [{ de: 'm²', a: 'ft²', factor: 10.764 }, { de: 'ft²', a: 'm²', factor: 0.0929 }],
  'saco': [{ de: 'saco', a: 'kg', factor: 42.5 }],
  'galon': [{ de: 'galon', a: 'lt', factor: 3.785 }, { de: 'lt', a: 'galon', factor: 0.264 }],
};

const BasePrecios: React.FC = () => {
  const { t } = useTranslation();
  const { insumosBase, addInsumoBase, updateInsumoBase, deleteInsumoBase } = useErp();
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(false); }, []);
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

  const rubros = useMemo(() => [...new Set(insumosBase.map(i => i.rubro))].sort(), [insumosBase]);
  const unidades = useMemo(() => [...new Set(insumosBase.map(i => i.unidad))].sort(), [insumosBase]);
  const zonas = Object.keys(FACTORES_ZONA);

  const filtered = useMemo(() => {
    let f = insumosBase;
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(i => i.nombre.toLowerCase().includes(q));
    }
    if (rubroFilter) f = f.filter(i => i.rubro === rubroFilter);
    if (categoriaFilter) f = f.filter(i => i.categoria === categoriaFilter);
    return f;
  }, [insumosBase, search, rubroFilter, categoriaFilter]);

  const factorZona = FACTORES_ZONA[zonaSeleccionada] || 1;

  const resultadoConversion = useMemo(() => {
    if (!convDe || !convA || convCantidad <= 0) return null;
    if (convDe === convA) return { resultado: convCantidad, factor: 1 };
    const conversionesDe = CONVERSIONES[convDe] || [];
    const conv = conversionesDe.find(c => c.a === convA);
    if (conv) return { resultado: +(convCantidad * conv.factor).toFixed(4), factor: conv.factor };
    const convInv = (CONVERSIONES[convA] || []).find(c => c.a === convDe);
    if (convInv) return { resultado: +(convCantidad / convInv.factor).toFixed(4), factor: 1 / convInv.factor };
    return null;
  }, [convDe, convA, convCantidad]);

  const handleExportarCSV = () => {
    const header = 'Nombre,Categoría,Unidad,Precio Base,Rubro,Código,Activo';
    const rows = filtered.map(i =>
      `${i.nombre},${i.categoria},${i.unidad},${i.costo_base ?? 0},${i.rubro},${i.codigo},${i.activo}`
    ).join('\n');
    const csv = `${header}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadBlob(blob, `base-precios-${zonaSeleccionada}-${new Date().toISOString().slice(0,10)}.csv`);
    toast.success(t('baseprecios.exportar'));
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
        if (lines.length < 2) { toast.error(t('baseprecios.csv_vacio')); return; }
        const header = lines[0].toLowerCase();
        if (!header.includes('nombre') || !header.includes('precio')) {
          toast.error(t('baseprecios.csv_invalido'));
          return;
        }
        let imported = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          if (cols.length >= 3) {
            const codigo = `ib-imported-${Date.now()}-${i}`;
            addInsumoBase({
              codigo,
              nombre: cols[0] || `Insumo ${i}`,
              categoria: cols[1] || 'material',
              unidad: cols[2] || 'u',
              costo_base: parseFloat(cols[3]) || 0,
              rubro: cols[4] || 'general',
              activo: true,
            });
            imported++;
          }
        }
        if (imported > 0) {
          toast.success(t('baseprecios.importados', { count: imported }));
        } else {
          toast.error(t('baseprecios.importar_fallo'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleActivarDesactivar = (id: string) => {
    const ins = insumosBase.find(i => i.id === id);
    if (!ins) return;
    if (ins.activo) {
      deleteInsumoBase(id);
      toast.success(t('baseprecios.eliminado'));
    } else {
      updateInsumoBase(id, { activo: true, costo_base: 1 });
      toast.success(t('baseprecios.activado'));
    }
  };

  const handleGuardarEdicion = (id: string) => {
    updateInsumoBase(id, {
      nombre: nuevoNombre || undefined,
      costo_base: nuevoPrecio > 0 ? nuevoPrecio : undefined,
      unidad: nuevoUnidad || undefined,
      rubro: nuevoRubro || undefined,
    });
    setEditando(null);
    toast.success(t('baseprecios.actualizado'));
  };

  const handleAgregar = () => {
    if (!nuevoNombre.trim()) { toast.error(t('baseprecios.nombre_requerido')); return; }
    if (nuevoPrecio <= 0) { toast.error(t('baseprecios.precio_requerido')); return; }
    const codigo = `ib-new-${Date.now()}`;
    addInsumoBase({
      codigo,
      nombre: nuevoNombre.trim(),
      categoria: 'material',
      unidad: nuevoUnidad || 'u',
      costo_base: nuevoPrecio,
      rubro: nuevoRubro || 'general',
      activo: true,
    });
    toast.success(t('baseprecios.agregado'));
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

  const totalValor = filtered.reduce((a, i) => a + (i.costo_base ?? 0), 0);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Database className="w-6 h-6 text-teal-500" /> {t('baseprecios.titulo')}
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
            <Upload className="w-3.5 h-3.5" aria-hidden="true" /> {t('baseprecios.importar_csv')}
          </button>
          <button onClick={handleExportarCSV} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors">
            <Download className="w-3.5 h-3.5" aria-hidden="true" /> {t('baseprecios.exportar_csv')}
          </button>
          <button onClick={() => setShowConvertir(!showConvertir)} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors">
            <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" /> {t('baseprecios.convertir')}
          </button>
          <button onClick={() => { setShowAgregar(true); setNuevoNombre(''); setNuevoPrecio(0); setNuevoUnidad(''); setNuevoRubro(''); }} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t('baseprecios.nuevo')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="text-[10px] text-slate-400">{t('baseprecios.total_insumos')}</div>
          <div className="text-lg font-bold text-slate-800">{insumosBase.length}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="text-[10px] text-slate-400">{t('baseprecios.zona')}</div>
          <div className="text-lg font-bold text-slate-800">{zonaSeleccionada}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="text-[10px] text-slate-400">{t('baseprecios.factor_zona')}</div>
          <div className="text-lg font-bold text-teal-600">x{factorZona.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="text-[10px] text-slate-400">{t('baseprecios.inactivos')}</div>
          <div className="text-lg font-bold text-red-600">{insumosBase.filter(i => !i.activo).length}</div>
        </div>
      </div>

      {showConvertir && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-4">
          <h3 className="font-bold text-slate-700 text-sm mb-3">{t('baseprecios.conversor')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('baseprecios.desde')}</label>
              <select value={convDe} onChange={e => setConvDe(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white outline-none">
                <option value="">— {t('baseprecios.unidad')} —</option>
                {unidades.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('baseprecios.hasta')}</label>
              <select value={convA} onChange={e => setConvA(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white outline-none">
                <option value="">— {t('baseprecios.unidad')} —</option>
                {unidades.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('baseprecios.cantidad')}</label>
              <input type="number" inputMode="decimal" value={convCantidad} onChange={e => setConvCantidad(Math.max(0, +e.target.value))} min={0} className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 outline-none" />
            </div>
            <div className="bg-white rounded-lg p-2 text-center border border-slate-200">
              <div className="text-[9px] text-slate-400">{t('baseprecios.resultado')}</div>
              <div className="text-lg font-bold text-indigo-600">
                {resultadoConversion ? `${resultadoConversion.resultado} ${convA}` : '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAgregar && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-4">
          <h3 className="font-bold text-slate-700 text-sm mb-3">{t('baseprecios.nuevo_insumo')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder={t('baseprecios.nombre_placeholder')} className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-emerald-400" />
            <input type="number" inputMode="decimal" value={nuevoPrecio || ''} onChange={e => setNuevoPrecio(+e.target.value)} placeholder={t('baseprecios.precio_placeholder')} min={0} step={0.01} className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-emerald-400" />
            <input value={nuevoUnidad} onChange={e => setNuevoUnidad(e.target.value)} placeholder={t('baseprecios.unidad_placeholder')} className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-emerald-400" />
            <input value={nuevoRubro} onChange={e => setNuevoRubro(e.target.value)} placeholder={t('baseprecios.rubro_placeholder')} className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-emerald-400" />
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={handleAgregar} className="text-xs px-4 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors font-medium">{t('baseprecios.agregar_btn')}</button>
            <button onClick={() => setShowAgregar(false)} className="text-xs px-4 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">{t('baseprecios.cancelar')}</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        <div className="relative flex-1 min-w-[150px]">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('baseprecios.buscar')}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-teal-400"
          />
        </div>
        <select value={rubroFilter} onChange={e => setRubroFilter(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 outline-none">
          <option value="">{t('baseprecios.todos_rubros')}</option>
          {rubros.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={categoriaFilter} onChange={e => setCategoriaFilter(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 outline-none">
          <option value="">{t('baseprecios.todas_categorias')}</option>
          <option value="material">Material</option>
          <option value="mano_obra">{t('baseprecios.mano_obra')}</option>
          <option value="equipo">Equipo</option>
          <option value="subcontrato">Subcontrato</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs" role="table">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 bg-slate-50">
                <th className="text-left py-2 px-2 font-medium" scope="col">{t('baseprecios.insumo')}</th>
                <th className="text-left py-2 px-2 font-medium" scope="col">{t('baseprecios.categoria')}</th>
                <th className="text-left py-2 px-2 font-medium" scope="col">{t('baseprecios.unidad')}</th>
                <th className="text-right py-2 px-2 font-medium" scope="col">{t('baseprecios.precio_base')}</th>
                <th className="text-right py-2 px-2 font-medium" scope="col">{t('baseprecios.precio_zona')}</th>
                <th className="text-left py-2 px-2 font-medium" scope="col">{t('baseprecios.rubro')}</th>
                <th className="text-left py-2 px-2 font-medium" scope="col">{t('baseprecios.estado')}</th>
                <th className="text-center py-2 px-2 font-medium" scope="col">{t('baseprecios.acciones')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ins => {
                const costoBase = ins.costo_base ?? 0;
                const precioZona = +(costoBase * factorZona).toFixed(2);
                const inactivo = !ins.activo;
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
                        <input type="number" inputMode="decimal" value={nuevoPrecio} onChange={e => setNuevoPrecio(+e.target.value)} className="w-20 text-xs px-1 py-0.5 rounded border border-teal-300 text-right outline-none" />
                      ) : `Q${costoBase.toFixed(2)}`}
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-teal-600">
                      Q{precioZona.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-slate-500">{ins.rubro}</td>
                    <td className="py-2 px-2">
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${ins.activo ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {ins.activo ? t('baseprecios.activo') : t('baseprecios.inactivo')}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      {editando === ins.id ? (
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleGuardarEdicion(ins.id)} className="p-1 text-emerald-500 hover:text-emerald-600" aria-label={t('baseprecios.guardar')}><Check className="w-3 h-3" aria-hidden="true" /></button>
                          <button onClick={() => setEditando(null)} className="p-1 text-slate-400 hover:text-slate-600" aria-label={t('baseprecios.cancelar_edicion')}><X className="w-3 h-3" aria-hidden="true" /></button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-1">
                          <button onClick={() => { setEditando(ins.id); setNuevoNombre(ins.nombre); setNuevoPrecio(costoBase); setNuevoUnidad(ins.unidad); setNuevoRubro(ins.rubro); }} className="p-1 text-slate-400 hover:text-teal-500" aria-label={t('baseprecios.editar')}><Edit3 className="w-3 h-3" aria-hidden="true" /></button>
                          <button onClick={() => handleActivarDesactivar(ins.id)} className={`p-1 ${inactivo ? 'text-emerald-400' : 'text-red-400 hover:text-red-500'}`} aria-label={inactivo ? t('baseprecios.activar_btn') : t('baseprecios.eliminar_btn')}>
                            {inactivo ? <RefreshCw className="w-3 h-3" aria-hidden="true" /> : <Trash2 className="w-3 h-3" aria-hidden="true" />}
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
          <span className="text-[10px] text-slate-400">{filtered.length} {t('baseprecios.insumos')} · {t('baseprecios.precio_base_total')}: Q{totalValor.toFixed(2)}</span>
          <span className="text-[10px] text-teal-500 font-medium">{t('baseprecios.zona')}: {zonaSeleccionada} (x{factorZona})</span>
        </div>
      </div>
    </div>
  );
};

export default BasePrecios;