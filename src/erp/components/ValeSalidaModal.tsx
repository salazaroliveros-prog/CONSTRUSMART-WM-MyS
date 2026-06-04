import React, { useState } from 'react';
import { X, Plus, Trash2, Search } from 'lucide-react';
import { useErp } from '../store';
import { ValeSalida, ValeSalidaItem } from '../types';
import { todayISO } from '../utils';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ValeSalidaModal: React.FC<Props> = ({ open, onClose }) => {
  const { proyectos, materiales, addValeSalida } = useErp();

  const [proyectoId, setProyectoId] = useState('');
  const [renglonCodigo, setRenglonCodigo] = useState('');
  const [renglonNombre, setRenglonNombre] = useState('');
  const [responsable, setResponsable] = useState('');
  const [notas, setNotas] = useState('');
  const [searchMat, setSearchMat] = useState('');
  const [items, setItems] = useState<Array<{ materialId: string; materialNombre: string; unidad: string; cantidad: number; precio: number }>>([]);

  const proyectosActivos = proyectos.filter(p => p.estado !== 'finalizado');

  // M-13: Filtrar materiales por proyecto seleccionado
  const materialesFiltrados = materiales.filter(m => {
    if (proyectoId && m.proyectoIds && m.proyectoIds.length > 0) {
      return m.proyectoIds.includes(proyectoId) && (!searchMat || m.nombre.toLowerCase().includes(searchMat.toLowerCase()));
    }
    return !searchMat || m.nombre.toLowerCase().includes(searchMat.toLowerCase());
  });

  const handleAddItem = (mat: typeof materiales[0]) => {
    if (items.find(i => i.materialId === mat.id)) return;
    setItems(s => [...s, {
      materialId: mat.id,
      materialNombre: mat.nombre,
      unidad: mat.unidad,
      cantidad: 1,
      precio: mat.precio,
    }]);
    setSearchMat('');
  };

  const handleRemoveItem = (materialId: string) => {
    setItems(s => s.filter(i => i.materialId !== materialId));
  };

  const updateItemCantidad = (materialId: string, cantidad: number) => {
    setItems(s => s.map(i =>
      i.materialId === materialId ? { ...i, cantidad: Math.max(0.01, cantidad) } : i
    ));
  };

  const handleGuardar = async () => {
    if (!proyectoId) {
      toast.error('Selecciona un proyecto');
      return;
    }
    if (items.length === 0) {
      toast.error('Agrega al menos un material');
      return;
    }
    if (!responsable.trim()) {
      toast.error('Indica el responsable');
      return;
    }

    // Validar stock suficiente
    for (const item of items) {
      const mat = materiales.find(m => m.id === item.materialId);
      if (mat && mat.stock < item.cantidad) {
        toast.error(`Stock insuficiente: ${item.materialNombre} (disponible: ${mat.stock} ${mat.unidad})`);
        return;
      }
    }

    const vale: Omit<ValeSalida, 'id'> = {
      proyectoId,
      renglonCodigo: renglonCodigo.trim() || undefined,
      renglonNombre: renglonNombre.trim() || undefined,
      fecha: todayISO(),
      items: items.map(i => ({
        ...i,
        total: i.cantidad * i.precio,
      })),
      responsable: responsable.trim(),
      notas: notas.trim() || undefined,
    };

    await addValeSalida(vale);
    toast.success(`✅ Vale de salida creado (${items.length} material${items.length > 1 ? 'es' : ''})`);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setProyectoId('');
    setRenglonCodigo('');
    setRenglonNombre('');
    setResponsable('');
    setNotas('');
    setSearchMat('');
    setItems([]);
  };

  const total = items.reduce((sum, i) => sum + i.cantidad * i.precio, 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <h2 className="font-bold text-lg text-slate-800">🧾 Vale de Salida — Bodega</h2>
          <button type="button" onClick={() => { resetForm(); onClose(); }}>
            <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Proyecto */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block font-medium">Proyecto *</label>
            <select
              value={proyectoId}
              onChange={e => setProyectoId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-cyan-400 bg-white"
            >
              <option value="">— Seleccionar proyecto —</option>
              {proyectosActivos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {/* Renglón (opcional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Código de renglón (opcional)</label>
              <input
                value={renglonCodigo}
                onChange={e => setRenglonCodigo(e.target.value)}
                placeholder="Ej: REN-001"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Nombre de renglón (opcional)</label>
              <input
                value={renglonNombre}
                onChange={e => setRenglonNombre(e.target.value)}
                placeholder="Ej: Cimentación"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Responsable */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block font-medium">Responsable *</label>
            <input
              value={responsable}
              onChange={e => setResponsable(e.target.value)}
              placeholder="Nombre de quien retira"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-cyan-400"
            />
          </div>

          {/* Materiales: search + add */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block font-medium">Agregar Materiales</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                value={searchMat}
                onChange={e => setSearchMat(e.target.value)}
                placeholder="Buscar material..."
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-cyan-400"
              />
            </div>
            {searchMat && (
              <div className="mt-1 border border-slate-200 rounded-lg max-h-36 overflow-y-auto bg-white shadow-sm">
                {materialesFiltrados.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 text-center">Sin resultados</div>
                ) : materialesFiltrados.slice(0, 10).map(m => {
                  const yaAgregado = items.some(i => i.materialId === m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={yaAgregado}
                      onClick={() => handleAddItem(m)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${
                        yaAgregado ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-slate-700 truncate">{m.nombre}</span>
                        <span className="text-slate-400 shrink-0">{m.unidad}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-500">Stock: {m.stock}</span>
                        {!yaAgregado && <Plus className="w-3.5 h-3.5 text-cyan-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Items list */}
          {items.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-500">Materiales agregados ({items.length})</span>
                <span className="text-xs text-slate-400 font-medium">Total: Q{total.toFixed(2)}</span>
              </div>
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <div key={item.materialId} className="flex items-center gap-2 px-3 py-2">
                    <span className="text-xs text-slate-400 w-5 shrink-0">#{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-700 truncate">{item.materialNombre}</div>
                      <div className="text-[10px] text-slate-400">{item.unidad}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={item.cantidad}
                        onChange={e => updateItemCantidad(item.materialId, +e.target.value)}
                        min={0.01}
                        step={0.01}
                        className="w-20 px-2 py-1 text-xs rounded border border-slate-200 text-right outline-none focus:border-cyan-400"
                      />
                      <span className="text-xs text-slate-400 w-6">{item.unidad}</span>
                    </div>
                    <div className="text-xs text-slate-500 w-20 text-right">
                      Q{(item.cantidad * item.precio).toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.materialId)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block font-medium">Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Observaciones del vale de salida..."
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-cyan-400 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t shrink-0">
          <button
            type="button"
            onClick={() => { resetForm(); onClose(); }}
            className="flex-1 py-2.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={!proyectoId || items.length === 0 || !responsable.trim()}
            className="flex-1 py-2.5 text-sm rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generar Vale de Salida
          </button>
        </div>
      </div>
    </div>
  );
};

export default ValeSalidaModal;