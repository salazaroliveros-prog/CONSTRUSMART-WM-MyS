import React from 'react';
import { Presupuesto } from '../types';
import { fmtQ } from '../utils';
import { X, Eye, GitBranch } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  presupuestos: Presupuesto[];
  currentVersionId?: string;
  onView: (p: Presupuesto) => void;
  onApply: (p: Presupuesto) => void;
  onApprove?: (p: Presupuesto) => void;
  onReject?: (p: Presupuesto) => void;
}

const HistorialPresupuestosModal: React.FC<Props> = ({ open, onClose, presupuestos, currentVersionId, onView, onApply, onApprove, onReject }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-70 w-[900px] max-w-full bg-white rounded-2xl shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Historial de Presupuestos</h3>
          <button onClick={onClose} className="text-slate-500 p-1 rounded hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>

        {presupuestos.length === 0 ? (
          <div className="py-6 text-center text-slate-500">No hay presupuestos guardados para este proyecto.</div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {presupuestos.map(p => {
              const current = currentVersionId === p.id;
              const base = presupuestos.find(x => x.id === currentVersionId) || presupuestos[0];
              const diffTotal = base && base.id !== p.id ? p.totalCalculado - base.totalCalculado : 0;
              const deltaLabel = base && base.id !== p.id ? `${diffTotal >= 0 ? '+' : '-'}${fmtQ(Math.abs(diffTotal))}` : '';
              return (
                <div key={p.id} className="bg-slate-50 rounded-lg p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold">{p.notas || 'Presupuesto'}</div>
                      <div className="text-[11px] px-2 py-0.5 rounded bg-white text-slate-600 border">v{p.versionPresupuesto || 1}</div>
                      <div className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${current ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {current ? 'Activo' : p.estado}
                      </div>
                      <div className="text-xs text-slate-500">{new Date(p.fechaCreacion).toLocaleDateString('es-GT')}</div>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold">Total:</span> {fmtQ(p.totalCalculado)}
                      <span className="ml-3 text-slate-500">Costo Directo: {fmtQ(p.costoDirectoTotal)}</span>
                    </div>
                    {deltaLabel && (
                      <div className="mt-1 text-xs text-slate-500">Diferencia vs activo: {deltaLabel}</div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => onView(p)} title="Ver" className="p-2 rounded hover:bg-slate-100"><Eye className="w-4 h-4 text-slate-600" /></button>
                    <button onClick={() => onApply(p)} title="Aplicar versión" className="p-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2"><GitBranch className="w-4 h-4" /> Aplicar</button>
                    {p.estado === 'borrador' && onApprove && (
                      <button onClick={() => onApprove(p)} className="p-2 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Aprobar</button>
                    )}
                    {p.estado === 'borrador' && onReject && (
                      <button onClick={() => onReject(p)} className="p-2 rounded bg-red-100 text-red-700 hover:bg-red-200">Rechazar</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialPresupuestosModal;
