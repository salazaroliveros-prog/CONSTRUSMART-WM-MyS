import React from 'react';
import { Presupuesto } from '../types';
import { fmtQ, fmtPct, TIPOLOGIA_LABEL } from '../utils';
import { Edit, Trash2, Copy, Download, Check } from 'lucide-react';

interface PresupuestosListProps {
  presupuestos: Presupuesto[];
  onEdit?: (p: Presupuesto) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (p: Presupuesto) => void;
  onExport?: (p: Presupuesto) => void;
  onApprove?: (p: Presupuesto) => void;
  onReject?: (p: Presupuesto) => void;
}

export const PresupuestosList: React.FC<PresupuestosListProps> = ({
  presupuestos,
  onEdit,
  onDelete,
  onDuplicate,
  onExport,
  onApprove,
  onReject,
}) => {
  if (presupuestos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
        <div className="text-slate-400 mb-2">📋 Sin presupuestos guardados</div>
        <p className="text-sm text-slate-500">Crea un presupuesto nuevo con los renglones y guárdalo vinculado a un proyecto.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {presupuestos.map(p => {
        const totalRenglones = p.renglones?.length || 0;
        const margen = ((p.totalCalculado - p.costoDirectoTotal) / p.totalCalculado * 100) || 0;

        return (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-slate-800 truncate text-sm">{p.notas || 'Presupuesto sin nombre'}</h4>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
                    p.estado === 'borrador' ? 'bg-amber-100 text-amber-700' :
                    p.estado === 'aprobado' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {p.estado}
                  </span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                    {TIPOLOGIA_LABEL[p.tipologia]}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] mb-0.5">Renglones</span>
                    <b className="text-slate-700">{totalRenglones}</b>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] mb-0.5">Costo Directo</span>
                    <b className="text-slate-700">{fmtQ(p.costoDirectoTotal)}</b>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] mb-0.5">Margen</span>
                    <b className="text-orange-600">{fmtPct(margen)}</b>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] mb-0.5">Total</span>
                    <b className="text-emerald-600 text-sm">{fmtQ(p.totalCalculado)}</b>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-2">
                  Creado: {new Date(p.fechaCreacion).toLocaleDateString('es-GT')} · v{p.versionPresupuesto || 1}
                </div>
              </div>
              <div className="flex gap-1">
                {onEdit && (
                  <button
                    onClick={() => onEdit(p)}
                    className="p-2 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                {onExport && (
                  <button
                    onClick={() => onExport(p)}
                    className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Descargar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                {p.estado === 'borrador' && onApprove && (
                  <button
                    onClick={() => onApprove(p)}
                    className="p-2 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                    title="Aprobar"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {p.estado === 'borrador' && onReject && (
                  <button
                    onClick={() => onReject(p)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                    title="Rechazar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {onDuplicate && (
                  <button
                    onClick={() => onDuplicate(p)}
                    className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                    title="Duplicar"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar este presupuesto?')) onDelete(p.id);
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PresupuestosList;
