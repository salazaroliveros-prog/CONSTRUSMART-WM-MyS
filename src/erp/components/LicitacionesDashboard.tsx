import React from 'react';
import { useErp, type View } from '../store';
import { fmtQ } from '../utils';
import { Target, ArrowRight, Briefcase, TrendingUp } from 'lucide-react';

const ESTADO_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  identificado: { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' },
  en_estudio: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-400' },
  presentado: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' },
  ganado: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400' },
  perdido: { bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-400' },
};

const ESTADO_LABELS: Record<string, string> = {
  identificado: 'Identificado',
  en_estudio: 'En Estudio',
  presentado: 'Presentado',
  ganado: 'Ganado 🏆',
  perdido: 'Perdido',
};

const LicitacionesDashboard: React.FC = () => {
  const { licitaciones, setView } = useErp();

  const activas = licitaciones.filter(l => l.estado !== 'ganado' && l.estado !== 'perdido');
  const ganadas = licitaciones.filter(l => l.estado === 'ganado');
  const pipelinePonderado = activas.reduce((a, l) => a + l.monto * (l.probabilidad / 100), 0);

  if (licitaciones.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-purple-500" /> Pipeline Comercial
        </h3>
        <button 
          onClick={() => setView('crm' as View)}
          className="text-[9px] text-purple-600 hover:text-purple-700 font-medium flex items-center gap-0.5"
        >
          Ver todo <ArrowRight className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Resumen rápido */}
      <div className="flex gap-2 mb-2 text-[10px]">
        <div className="bg-purple-50 rounded-lg px-2 py-1 flex-1">
          <div className="font-bold text-purple-700">{activas.length}</div>
          <div className="text-purple-500">Activas</div>
        </div>
        <div className="bg-emerald-50 rounded-lg px-2 py-1 flex-1">
          <div className="font-bold text-emerald-700">{ganadas.length}</div>
          <div className="text-emerald-500">Ganadas</div>
        </div>
        <div className="bg-blue-50 rounded-lg px-2 py-1 flex-1">
          <div className="font-bold text-blue-700">{fmtQ(pipelinePonderado)}</div>
          <div className="text-blue-500">Ponderado</div>
        </div>
      </div>

      {/* Lista compacta de licitaciones activas */}
      <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0">
        {activas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-slate-300">
            <Briefcase className="w-6 h-6 mb-1" />
            <span className="text-[10px]">Sin oportunidades activas</span>
          </div>
        ) : activas.slice(0, 5).map(l => (
          <div key={l.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors group">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ESTADO_COLORS[l.estado]?.dot || '#94a3b8' }} />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-semibold text-slate-700 truncate">{l.titulo}</div>
              <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                <span>{l.cliente}</span>
                <span>·</span>
                <span className="font-medium">{fmtQ(l.monto)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className={`text-[8px] px-1 py-0.5 rounded-full font-medium ${ESTADO_COLORS[l.estado]?.bg || 'bg-slate-50'} ${ESTADO_COLORS[l.estado]?.text || 'text-slate-600'}`}>
                {ESTADO_LABELS[l.estado] || l.estado}
              </span>
              <span className="text-[9px] text-slate-400">{l.probabilidad}%</span>
            </div>
          </div>
        ))}
      </div>

      {activas.length > 5 && (
        <div className="text-center mt-1">
          <button 
            onClick={() => setView('crm' as View)}
            className="text-[9px] text-purple-500 hover:text-purple-600 font-medium"
          >
            +{activas.length - 5} más...
          </button>
        </div>
      )}
    </div>
  );
};

export default LicitacionesDashboard;