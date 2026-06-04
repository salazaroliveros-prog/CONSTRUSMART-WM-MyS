import React, { useState } from 'react';
import { useErp } from '../store';
import QRScanner from './QRScanner';
import { toast } from 'sonner';
import { QrCode, Package, Check, RotateCcw, Search } from 'lucide-react';

const ConteoCiclico: React.FC = () => {
  const { materiales, updateMaterial } = useErp();
  const [showQR, setShowQR] = useState(false);
  const [selectedMatId, setSelectedMatId] = useState<string | null>(null);
  const [conteo, setConteo] = useState<Record<string, { fisico: number; observaciones: string }>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const handleQRScan = (data: string) => {
    setShowQR(false);
    const mat = materiales.find(m => m.id === data || m.nombre.toLowerCase().includes(data.toLowerCase()));
    if (mat) {
      setSelectedMatId(mat.id);
      setConteo(prev => ({ ...prev, [mat.id]: prev[mat.id] || { fisico: mat.stock, observaciones: '' } }));
      toast.success(`Material: ${mat.nombre}`);
    } else {
      toast.error('Material no encontrado');
    }
  };

  const filteredMateriales = searchTerm
    ? materiales.filter(m => m.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    : materiales;

  const handleGuardarConteo = (materialId: string) => {
    const data = conteo[materialId];
    if (!data) return;
    const mat = materiales.find(m => m.id === materialId);
    if (!mat) return;
    updateMaterial(materialId, { stock: data.fisico });
    toast.success(`✅ ${mat.nombre}: stock actualizado a ${data.fisico} ${mat.unidad}`);
    setSelectedMatId(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
          <RotateCcw className="w-4 h-4 text-purple-500" /> Conteo Cíclico de Inventario
        </h3>
        <button
          onClick={() => setShowQR(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-medium hover:bg-purple-600 transition-colors"
        >
          <QrCode className="w-4 h-4" /> Escanear QR
        </button>
      </div>

      {showQR && <QRScanner onScan={handleQRScan} onClose={() => setShowQR(false)} />}

      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar material para conteo..."
          className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 outline-none focus:border-purple-400"
        />
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredMateriales.map(mat => {
          const data = conteo[mat.id];
          const diff = data ? data.fisico - mat.stock : 0;
          const tieneConteo = !!data;
          const editando = selectedMatId === mat.id;
          return (
            <div key={mat.id} className={`p-3 rounded-lg border transition-colors ${editando ? 'border-purple-400 bg-purple-50' : 'border-slate-100 hover:bg-slate-50'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Package className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-700 truncate">{mat.nombre}</span>
                  {diff !== 0 && tieneConteo && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${diff > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {diff > 0 ? '+' : ''}{diff}
                    </span>
                  )}
                </div>
                {!editando && (
                  <button
                    onClick={() => {
                      setSelectedMatId(mat.id);
                      setConteo(prev => ({ ...prev, [mat.id]: prev[mat.id] || { fisico: mat.stock, observaciones: '' } }));
                    }}
                    className="text-xs text-purple-500 hover:text-purple-700 font-medium"
                  >
                    Contar
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span>Stock sistema: <b>{mat.stock}</b> {mat.unidad}</span>
                {editando && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      Stock físico:
                      <input
                        type="number"
                        value={conteo[mat.id]?.fisico ?? mat.stock}
                        onChange={e => setConteo(prev => ({ ...prev, [mat.id]: { ...prev[mat.id], fisico: Math.max(0, +e.target.value), observaciones: prev[mat.id]?.observaciones || '' } }))}
                        className="w-16 px-1.5 py-0.5 text-xs rounded border border-purple-200 text-right outline-none focus:border-purple-400"
                      />
                    </span>
                    <span>{mat.unidad}</span>
                    <button onClick={() => handleGuardarConteo(mat.id)} className="ml-1 px-2 py-0.5 bg-emerald-500 text-white rounded text-[10px] hover:bg-emerald-600">
                      <Check className="w-3 h-3 inline" /> Guardar
                    </button>
                  </>
                )}
              </div>
              {editando && (
                <input
                  value={conteo[mat.id]?.observaciones || ''}
                  onChange={e => setConteo(prev => ({ ...prev, [mat.id]: { ...prev[mat.id], fisico: prev[mat.id]?.fisico ?? mat.stock, observaciones: e.target.value } }))}
                  placeholder="Observaciones del conteo..."
                  className="mt-1 w-full px-2 py-1 text-[10px] rounded border border-slate-200 outline-none focus:border-purple-400"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConteoCiclico;