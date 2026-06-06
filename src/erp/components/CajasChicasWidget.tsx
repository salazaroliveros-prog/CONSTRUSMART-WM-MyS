import React, { useMemo } from 'react';
import { useErp } from '../store';
import { fmtQ } from '../utils';
import { Receipt, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface _CajaChica {
  id: string;
  proyectoId: string | null;
  proyectoNombre: string;
  descripcion: string;
  monto: number;
  categoria: string;
  fecha: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
}

const CajasChicasWidget: React.FC = () => {
  const { movimientos, proyectos } = useErp();

  const cajasChicas = useMemo(() => {
    // Usamos los movimientos de gasto como "cajas chicas" pendientes
    // Los que tienen fecha reciente (últimos 14 días) son pendientes de validación
    const hoy = new Date();
    const hace14 = new Date(hoy.getTime() - 14 * 86400000);
    
    return movimientos
      .filter(m => m.tipo === 'gasto' && new Date(m.fecha) >= hace14)
      .map(m => {
        const proyecto = proyectos.find(p => p.id === m.proyectoId);
        // Simular estado: los más recientes son pendientes
        const esReciente = new Date(m.fecha) >= new Date(hoy.getTime() - 3 * 86400000);
        return {
          id: m.id,
          proyectoId: m.proyectoId,
          proyectoNombre: proyecto?.nombre || 'Operativo',
          descripcion: m.descripcion,
          monto: m.costoTotal,
          categoria: m.categoria,
          fecha: m.fecha,
          estado: esReciente ? 'pendiente' as const : 'aprobada' as const,
        };
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 8);
  }, [movimientos, proyectos]);

  const pendientes = cajasChicas.filter(c => c.estado === 'pendiente');
  const totalPendiente = pendientes.reduce((a, c) => a + c.monto, 0);
  const totalAprobadas = cajasChicas.filter(c => c.estado === 'aprobada').reduce((a, c) => a + c.monto, 0);

  return (
    <div className="bg-card rounded-2xl p-3 shadow-sm border border-border h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
          <Receipt className="w-3.5 h-3.5 text-amber-500" /> Cajas Chicas
        </h3>
        <span className="text-[10px] text-muted-foreground">Últimos 14 días</span>
      </div>

      {/* Resumen */}
      <div className="flex gap-2 mb-2 text-[10px]">
        <div className="bg-amber-50 dark:bg-amber-950/40 rounded-lg px-2 py-1 flex-1">
          <div className="font-bold text-amber-700 dark:text-amber-400">{pendientes.length}</div>
          <div className="text-amber-600 dark:text-amber-500">Por validar</div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-lg px-2 py-1 flex-1">
          <div className="font-bold text-emerald-700 dark:text-emerald-400">{fmtQ(totalAprobadas)}</div>
          <div className="text-emerald-600 dark:text-emerald-500">Aprobadas</div>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/40 rounded-lg px-2 py-1 flex-1">
          <div className="font-bold text-rose-700 dark:text-rose-400">{fmtQ(totalPendiente)}</div>
          <div className="text-rose-600 dark:text-rose-500">Pendientes</div>
        </div>
      </div>

      {/* Lista de cajas chicas */}
      <div className="space-y-1 flex-1 overflow-y-auto min-h-0">
        {cajasChicas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
            <Receipt className="w-6 h-6 mb-1" />
            <span className="text-[10px]">Sin facturas recientes</span>
          </div>
        ) : cajasChicas.map(c => (
          <div key={c.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors">
            <div className="shrink-0">
              {c.estado === 'pendiente' ? (
                <Clock className="w-3 h-3 text-amber-500" />
              ) : (
                <CheckCircle className="w-3 h-3 text-emerald-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-semibold text-foreground truncate">{c.descripcion}</div>
              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                <span className="truncate">{c.proyectoNombre}</span>
                <span>·</span>
                <span>{c.fecha.slice(5, 10)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className={`text-[10px] font-bold ${c.estado === 'pendiente' ? 'text-amber-600' : 'text-emerald-600'}`}>
                {fmtQ(c.monto)}
              </span>
              {c.estado === 'pendiente' && (
                <button 
                  onClick={() => toast.info('Validación de caja chica — Próximamente')}
                  className="text-[8px] bg-amber-100 text-amber-600 px-1 py-0.5 rounded hover:bg-amber-200"
                >
                  Validar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {pendientes.length > 0 && (
        <div className="mt-1 p-1.5 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center gap-1 text-[9px] text-amber-700">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span><b>{pendientes.length}</b> facturas pendientes por <b>{fmtQ(totalPendiente)}</b></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CajasChicasWidget;