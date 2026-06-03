import React, { useState } from 'react';
import { useErp } from '../store';
import QRScanner from './QRScanner';
import { toast } from 'sonner';
import { QrCode, Check, X, Package, Truck } from 'lucide-react';
import { fmtQ } from '../utils';

const RecepcionMateriales: React.FC = () => {
  const { ordenes, updateOrden, updateMaterial, materiales } = useErp();
  const [showQR, setShowQR] = useState(false);
  const [selectedOC, setSelectedOC] = useState<string | null>(null);
  const [recepcionItems, setRecepcionItems] = useState<Record<string, number>>({});

  const ocSeleccionada = ordenes.find(o => o.id === selectedOC);

  const handleQRScan = (data: string) => {
    setShowQR(false);
    // Intentar encontrar OC por ID
    const oc = ordenes.find(o => o.id === data || o.id.endsWith(data) || o.proveedorId === data);
    if (oc) {
      setSelectedOC(oc.id);
      const initial: Record<string, number> = {};
      oc.items.forEach(item => { initial[item.materialId] = item.cantidad; });
      setRecepcionItems(initial);
      toast.success(`OC encontrada: ${oc.id.slice(0, 8)}...`);
      return;
    }
    // Intentar encontrar material por ID
    const mat = materiales.find(m => m.id === data);
    if (mat) {
      toast.success(`Material encontrado: ${mat.nombre} (Stock: ${mat.stock} ${mat.unidad})`);
      return;
    }
    toast.error('No se encontró una orden o material con ese código');
  };

  const handleRecibir = () => {
    if (!ocSeleccionada) return;
    // Actualizar stock de cada material
    ocSeleccionada.items.forEach(item => {
      const recibido = recepcionItems[item.materialId] || 0;
      if (recibido > 0) {
        const mat = materiales.find(m => m.id === item.materialId);
        if (mat) {
          updateMaterial(item.materialId, { stock: mat.stock + recibido });
        }
      }
    });
    updateOrden(ocSeleccionada.id, 'recibida');
    toast.success(`OC recibida: ${ocSeleccionada.items.length} materiales actualizados`);
    setSelectedOC(null);
    setRecepcionItems({});
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
          <Truck className="w-4 h-4 text-blue-500" /> Recepción de Materiales
        </h3>
        <button
          onClick={() => setShowQR(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors"
        >
          <QrCode className="w-4 h-4" /> Escanear QR
        </button>
      </div>

      {showQR && <QRScanner onScan={handleQRScan} onClose={() => setShowQR(false)} />}

      {/* OC Pendientes */}
      {!selectedOC && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 mb-2">Órdenes de compra pendientes de recepción:</p>
          {ordenes.filter(o => o.estado === 'aprobado').length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No hay OCs aprobadas pendientes de recepción</p>
          ) : (
            ordenes.filter(o => o.estado === 'aprobado').map(oc => (
              <div key={oc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => {
                setSelectedOC(oc.id);
                const initial: Record<string, number> = {};
                oc.items.forEach(item => { initial[item.materialId] = item.cantidad; });
                setRecepcionItems(initial);
              }}>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700">{oc.id.slice(0, 8)}...</p>
                  <p className="text-xs text-slate-400">{oc.items.length} materiales · {fmtQ(oc.total)}</p>
                </div>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Pendiente</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Detalle de OC seleccionada */}
      {selectedOC && ocSeleccionada && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">OC: {selectedOC.slice(0, 8)}...</p>
              <p className="text-xs text-slate-400">Total: {fmtQ(ocSeleccionada.total)}</p>
            </div>
            <button onClick={() => setSelectedOC(null)} className="text-xs text-slate-400 hover:text-slate-600">Cambiar OC</button>
          </div>
          <div className="space-y-2 mb-4">
            {ocSeleccionada.items.map(item => {
              const mat = materiales.find(m => m.id === item.materialId);
              return (
                <div key={item.materialId} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <Package className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{mat?.nombre || item.materialId}</p>
                    <p className="text-[10px] text-slate-400">OC: {item.cantidad} {mat?.unidad || 'u'} · Stock actual: {mat?.stock || 0}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      value={recepcionItems[item.materialId] ?? item.cantidad}
                      onChange={e => setRecepcionItems(prev => ({ ...prev, [item.materialId]: Math.max(0, +e.target.value) }))}
                      className="w-16 px-2 py-1 text-xs rounded border border-slate-200 text-right outline-none focus:border-blue-400"
                      min={0}
                    />
                    <span className="text-[10px] text-slate-400">{mat?.unidad || 'u'}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={handleRecibir} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" /> Confirmar Recepción
            </button>
            <button onClick={() => setSelectedOC(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecepcionMateriales;