import React from 'react';
import { KPICard, StatusBadge, VarianceBadge } from '../shared';
import { TrendingUp, Cloud, Sun, CloudRain, Wind } from 'lucide-react';

interface Proyecto {
  id: string;
  nombre: string;
  avanceFisico?: number;
  avanceFinanciero?: number;
  estado?: 'ejecucion' | 'planeacion' | 'pausado' | 'finalizado';
}

interface SeguimientoStatusBarProps {
  proyecto: Proyecto | null;
  weatherImpact?: { level?: string; score?: number } | null;
  className?: string;
}

/**
 * SeguimientoStatusBar Component - Barra de estado del proyecto
 * 
 * Muestra:
 * - Avance Físico vs Plan
 * - Avance Financiero vs Plan
 * - Variación (Física - Financiera)
 * - Status semántico (rojo/amarillo/verde)
 */
export function SeguimientoStatusBar({
  proyecto,
  weatherImpact,
  className = '',
}: SeguimientoStatusBarProps) {
  if (!proyecto) {
    return (
      <div className={`bg-muted/30 border border-border rounded-xl p-4 ${className}`}>
        <p className="text-sm text-muted-foreground">
          Selecciona un proyecto para ver su estado
        </p>
      </div>
    );
  }

  const fisica = proyecto.avanceFisico || 0;
  const financiero = proyecto.avanceFinanciero || 0;
  const variacion = fisica - financiero;

  // Determinar status semántico
  const getStatus = () => {
    if (Math.abs(variacion) < 3) return 'success'; // Dentro de 3%
    if (Math.abs(variacion) < 5) return 'warning'; // Entre 3-5%
    return 'danger'; // > 5%
  };

  const statusBadgeStatus = getStatus();
  const statusLabel =
    statusBadgeStatus === 'success'
      ? 'En Tiempo'
      : statusBadgeStatus === 'warning'
      ? 'En Riesgo'
      : 'Crítico';

  return (
    <div className={`bg-card border border-border rounded-xl p-4 ${className}`}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          Estado: {proyecto.nombre}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Última actualización: {new Date().toLocaleDateString('es-ES')}
        </p>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Avance Físico</div>
          <div className="text-2xl font-bold text-foreground">{fisica}%</div>
          <div className="text-xs text-muted-foreground mt-0.5">vs plan: +0%</div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-1">Avance Financiero</div>
          <div className="text-2xl font-bold text-amber-600">{financiero}%</div>
          <div className="text-xs text-muted-foreground mt-0.5">vs plan: -2%</div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-1">Variación</div>
          <div className={`text-2xl font-bold ${variacion >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {variacion > 0 ? '+' : variacion < 0 ? '-' : ''}{Math.abs(variacion)}%
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Físico - Financ</div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <span className="text-xs font-medium text-muted-foreground">Estado Proyecto:</span>
        <StatusBadge
          status={statusBadgeStatus}
          label={statusLabel}
          size="md"
        />
      </div>

      {weatherImpact && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Impacto Climático:</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              weatherImpact.level === 'critical' ? 'bg-red-100 text-red-700' :
              weatherImpact.level === 'high' ? 'bg-orange-100 text-orange-700' :
              weatherImpact.level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {weatherImpact.level || 'N/A'} ({weatherImpact.score ?? '-'})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SeguimientoStatusBar;
