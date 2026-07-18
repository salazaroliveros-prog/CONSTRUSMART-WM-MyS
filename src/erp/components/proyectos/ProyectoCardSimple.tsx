import React from 'react';
import { Building2, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { StatusBadge } from '../shared';
import { fmtQ, fmtPct } from '../../utils';

interface Proyecto {
  id: string;
  nombre: string;
  estado?: string;
  etapa?: string;
  avanceFisico?: number;
  presupuestoTotal?: number;
  montoEjecutado?: number;
}

interface ProyectoCardSimpleProps {
  proyecto: Proyecto;
  onClick?: () => void;
  className?: string;
  profitability?: number;
}

/**
 * ProyectoCardSimple - Card simplificado de proyecto
 * 
 * Muestra:
 * - Nombre proyecto
 * - Estado (badge)
 * - Avance físico
 * - Presupuesto vs Ejecutado
 * - Clickeable → abre modal
 */
export function ProyectoCardSimple({
  proyecto,
  onClick,
  className = '',
  profitability,
}: ProyectoCardSimpleProps) {
  const estadoColor =
    proyecto.estado === 'ejecucion'
      ? 'success'
      : proyecto.estado === 'finalizado'
      ? 'info'
      : proyecto.estado === 'pausado'
      ? 'warning'
      : 'pending';

  const avance = proyecto.avanceFisico || 0;
  const presupuesto = proyecto.presupuestoTotal || 0;
  const ejecutado = proyecto.montoEjecutado || 0;
  const disponible = Math.max(0, presupuesto - ejecutado);

  return (
    <div
      onClick={onClick}
      className={`
        group bg-card border border-border rounded-xl p-4 sm:p-5
        hover:border-primary/50 hover:shadow-md
        transition-all duration-200 cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        ${className}
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {proyecto.nombre}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 truncate" title={proyecto.etapa ? proyecto.etapa.charAt(0).toUpperCase() + proyecto.etapa.slice(1) : 'Sin etapa'}>
            {proyecto.etapa ? proyecto.etapa.charAt(0).toUpperCase() + proyecto.etapa.slice(1) : 'Sin etapa'}
          </p>
        </div>

        {/* Estado badge */}
        <div className="ml-2 flex-shrink-0">
          <StatusBadge status={estadoColor} label={proyecto.estado || 'Desconocido'} size="sm" />
        </div>
      </div>

      {/* Avance */}
      <div className="mb-4 pb-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Avance Físico</span>
          <span className="text-sm font-bold text-foreground">{avance}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${avance}%` }}
            aria-label={`Avance: ${avance}%`}
          ></div>
        </div>
      </div>

      {/* Financiero */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <DollarSign size={14} />
            Presupuesto
          </span>
          <span className="font-semibold text-foreground truncate ml-2" title={fmtQ(presupuesto)}>{fmtQ(presupuesto)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Building2 size={14} />
            Ejecutado
          </span>
          <span className="font-semibold text-amber-600 dark:text-amber-400 truncate ml-2" title={fmtQ(ejecutado)}>
            {fmtQ(ejecutado)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar size={14} />
            Disponible
          </span>
          <span className={`font-semibold ${disponible > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {fmtQ(disponible)}
          </span>
        </div>

        {profitability !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp size={14} />
              Rentabilidad
            </span>
            <span className={`font-semibold ${profitability >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {fmtQ(profitability)}
            </span>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="mt-4 pt-3 border-t border-border/50">
        <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
          Click para ver detalles →
        </p>
      </div>
    </div>
  );
}

export default ProyectoCardSimple;
