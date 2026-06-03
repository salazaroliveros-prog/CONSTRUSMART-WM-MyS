import React from 'react';
import { Presupuesto } from '../types';
import { fmtQ } from '../utils';
import { BarChart3, Eye, Edit3 } from 'lucide-react';

interface PresupuestoCardProps {
  presupuesto: Presupuesto | undefined;
  onViewPresupuesto?: () => void;
  onEditPresupuesto?: () => void;
}

export const PresupuestoCard: React.FC<PresupuestoCardProps> = ({
  presupuesto,
  onViewPresupuesto,
  onEditPresupuesto,
}) => {
  if (!presupuesto) {
    return (
      <div className="bg-orange-50 rounded-lg border border-orange-200 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-semibold text-orange-700">Sin presupuesto</span>
          </div>
          {onEditPresupuesto && (
            <button
              onClick={onEditPresupuesto}
              className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
            >
              Crear
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" />
            {presupuesto.notas || 'Presupuesto'}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              presupuesto.estado === 'borrador' ? 'bg-amber-100 text-amber-700' :
              presupuesto.estado === 'aprobado' ? 'bg-emerald-100 text-emerald-700' :
              'bg-red-100 text-red-700'
            }`}>
              {presupuesto.estado}
            </span>
          </div>
          <div className="flex gap-3 mt-1.5 text-xs">
            <div>
              <span className="text-emerald-600 text-[10px] font-medium">Renglones</span>
              <div className="font-bold text-slate-700">{presupuesto.renglones?.length || 0}</div>
            </div>
            <div>
              <span className="text-emerald-600 text-[10px] font-medium">Total</span>
              <div className="font-bold text-emerald-700">{fmtQ(presupuesto.totalCalculado)}</div>
            </div>
            <div>
              <span className="text-emerald-600 text-[10px] font-medium">V.</span>
              <div className="font-bold text-slate-700">{presupuesto.versionPresupuesto || 1}</div>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {onViewPresupuesto && (
            <button
              onClick={onViewPresupuesto}
              className="p-1.5 rounded bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
              title="Ver"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
          {onEditPresupuesto && (
            <button
              onClick={onEditPresupuesto}
              className="p-1.5 rounded bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
              title="Editar"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PresupuestoCard;
