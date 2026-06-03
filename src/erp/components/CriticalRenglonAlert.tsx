import React, { useMemo } from 'react';
import { useErp } from '../store';
import { fmtQ, fmtPct } from '../utils';
import { AlertTriangle, TrendingDown, TrendingUp, ArrowRight } from 'lucide-react';

interface CriticalAlert {
  proyectoId: string;
  proyectoNombre: string;
  codigo: string;
  nombre: string;
  costoEstimado: number;
  costoReal: number;
  desviacion: number;
  porcentajeDesviacion: number;
  critico: 'alta' | 'media' | 'baja';
}

const CriticalRenglonAlert: React.FC = () => {
  const { proyectos, presupuestos, movimientos, setView } = useErp();

  const alertas = useMemo(() => {
    const alerts: CriticalAlert[] = [];

    proyectos.forEach(proy => {
      // Encontrar presupuesto vinculado
      const presupuesto = proy.presupuestoActualId
        ? presupuestos.find(p => p.id === proy.presupuestoActualId)
        : presupuestos.find(p => p.proyectoId === proy.id);

      if (!presupuesto || !presupuesto.renglones) return;

      // Gastos reales del proyecto
      const gastosReales = movimientos
        .filter(m => m.proyectoId === proy.id && m.tipo === 'gasto')
        .reduce((a, m) => a + m.costoTotal, 0);

      // Analizar cada renglon
      presupuesto.renglones.forEach(renglon => {
        // Costo directo total del renglon
        const costoDirecto = (renglon.costoMateriales + renglon.costoManoObra + renglon.costoEquipo) * renglon.cantidad;
        
        // Distribución proporcional de gastos reales a este renglon
        const pesoRenglon = presupuesto.totalCalculado > 0 
          ? ((renglon.costoMateriales + renglon.costoManoObra + renglon.costoEquipo) * renglon.cantidad) / presupuesto.totalCalculado 
          : 0;
        const costoRealAprox = gastosReales * pesoRenglon;

        // Desviación
        const desviacion = costoRealAprox - costoDirecto;
        const pctDesv = costoDirecto > 0 ? (desviacion / costoDirecto) * 100 : 0;

        // Solo mostrar si hay desviación significativa
        if (Math.abs(pctDesv) > 5) {
          alerts.push({
            proyectoId: proy.id,
            proyectoNombre: proy.nombre,
            codigo: renglon.codigo,
            nombre: renglon.nombre,
            costoEstimado: costoDirecto,
            costoReal: costoRealAprox,
            desviacion,
            porcentajeDesviacion: pctDesv,
            critico: Math.abs(pctDesv) > 20 ? 'alta' : Math.abs(pctDesv) > 10 ? 'media' : 'baja',
          });
        }
      });
    });

    // Ordenar por desviación absoluta, top 8
    return alerts.sort((a, b) => Math.abs(b.porcentajeDesviacion) - Math.abs(a.porcentajeDesviacion)).slice(0, 8);
  }, [proyectos, presupuestos, movimientos]);

  if (alertas.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Alertas de Renglones Críticos
          </h3>
          <div className="flex items-center gap-1 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-slate-400">Crítico</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 ml-1" />
            <span className="text-slate-400">Alerta</span>
          </div>
        </div>
      </div>
      <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
        {alertas.map((a, i) => (
          <div key={i} className="p-3 hover:bg-slate-50 transition-colors group">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                    a.critico === 'alta' ? 'bg-red-100 text-red-600 animate-pulse' :
                    a.critico === 'media' ? 'bg-amber-100 text-amber-600' :
                    'bg-blue-100 text-blue-500'
                  }`}>
                    {a.critico === 'alta' ? '🔴 Crítico' : a.critico === 'media' ? '🟡 Alerta' : '🔵 Seguimiento'}
                  </span>
                  <span className="text-[10px] font-mono bg-slate-100 px-1 rounded text-slate-500">{a.codigo}</span>
                </div>
                <div className="font-semibold text-sm text-slate-700 truncate">{a.nombre}</div>
                <div className="text-[10px] text-slate-400 truncate">{a.proyectoNombre}</div>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="text-slate-500">Est: {fmtQ(a.costoEstimado)}</span>
                  <span className="text-slate-300">→</span>
                  <span className={`font-bold ${a.desviacion > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    Real: {fmtQ(a.costoReal)}
                  </span>
                </div>
              </div>
              <div className={`text-right shrink-0 ${a.desviacion > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                <div className="flex items-center gap-0.5 justify-end">
                  {a.desviacion > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span className="font-bold text-xs">{fmtPct(a.porcentajeDesviacion)}</span>
                </div>
                <div className="text-[9px] text-slate-400">{a.desviacion > 0 ? 'Sobrecosto' : 'Ahorro'}</div>
              </div>
            </div>
            {/* Barra visual de desviación */}
            <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${Math.min(Math.abs(a.porcentajeDesviacion), 100)}%`,
                  background: a.desviacion > 0 
                    ? (a.critico === 'alta' ? '#ef4444' : '#f59e0b')
                    : '#10b981',
                }}
              />
            </div>
            {a.critico === 'alta' && (
              <button 
                onClick={() => setView('seguimiento')}
                className="mt-1.5 text-[9px] text-orange-600 hover:text-orange-700 font-medium flex items-center gap-0.5"
              >
                Ver en Seguimiento <ArrowRight className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
        <span className="text-[9px] text-slate-400">
          Basado en comparación de presupuesto APU vs gastos reales.
          {alertas.filter(a => a.critico === 'alta').length > 0 && (
            <span className="text-red-500 ml-1 font-medium">
              · {alertas.filter(a => a.critico === 'alta').length} críticos requieren atención
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default CriticalRenglonAlert;