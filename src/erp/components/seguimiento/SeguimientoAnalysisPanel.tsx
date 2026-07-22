import React from 'react';
import { LineChart, BarChart } from '../Charts';
import { TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';
import { fmtQ, safePct } from '../../utils';

interface Proyecto {
  id: string;
  presupuestoTotal?: number;
  avanceFisico?: number;
  avanceFinanciero?: number;
  montoEjecutado?: number;
}

interface SeguimientoAnalysisPanelProps {
  proyecto: Proyecto | null;
  className?: string;
}

/**
 * SeguimientoAnalysisPanel Component - Panel de análisis EVM
 * 
 * Muestra:
 * - Cost Performance Index (CPI)
 * - Schedule Performance Index (SPI)
 * - Cost Variance (CV)
 * - Schedule Variance (SV)
 * - Gráfico de Físico vs Financiero
 * - Curva de avance últimas semanas
 */
export function SeguimientoAnalysisPanel({
  proyecto,
  className = '',
}: SeguimientoAnalysisPanelProps) {
  if (!proyecto) {
    return (
      <div className={`bg-card border border-border rounded-xl p-6 text-center ${className}`}>
        <AlertCircle className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Selecciona un proyecto para ver análisis EVM
        </p>
      </div>
    );
  }

  const presupuesto = proyecto.presupuestoTotal || 0;
  const fisica = proyecto.avanceFisico || 0;
  const financiero = proyecto.avanceFinanciero || 0;
  const ejecutado = proyecto.montoEjecutado || 0;

  // Cálculos EVM
  const PV = presupuesto * (financiero / 100); // Planned Value
  const EV = presupuesto * (fisica / 100);     // Earned Value
  const AC = ejecutado;                         // Actual Cost

  const CV = EV - AC;   // Cost Variance
  const SV = EV - PV;   // Schedule Variance

  const CPI = AC > 0 ? EV / AC : 1;             // Cost Performance Index
  const SPI = PV > 0 ? EV / PV : 1;             // Schedule Performance Index

  const hasEVMData = presupuesto > 0 && (fisica > 0 || financiero > 0 || ejecutado > 0);

  // Datos de curva de avance (últimas 4 semanas simulado)
  const curvaAvance = [
    { semana: 'Sem 1', fisica: 45, financiero: 48 },
    { semana: 'Sem 2', fisica: 50, financiero: 52 },
    { semana: 'Sem 3', fisica: 55, financiero: 53 },
    { semana: 'Sem 4', fisica: fisica, financiero: financiero },
  ];

  const getHealthStatus = () => {
    if (SPI >= 0.95 && CPI >= 0.95) return 'success';
    if (SPI >= 0.85 && CPI >= 0.85) return 'warning';
    return 'danger';
  };

  const healthStatus = getHealthStatus();
  const healthColor =
    healthStatus === 'success'
      ? 'text-emerald-600 dark:text-emerald-400'
      : healthStatus === 'warning'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400';
  const healthBgColor =
    healthStatus === 'success'
      ? 'bg-emerald-50 dark:bg-emerald-900/20'
      : healthStatus === 'warning'
      ? 'bg-amber-50 dark:bg-amber-900/20'
      : 'bg-red-50 dark:bg-red-900/20';

  return (
    <div className={`bg-card border border-border rounded-xl p-6 space-y-6 ${className}`}>
      {/* Título */}
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Análisis de Valor Ganado (EVM)
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Indicadores de rendimiento del proyecto
        </p>
      </div>

      {/* Indicadores principales */}
      {hasEVMData ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* CPI */}
          <div className={`${healthBgColor} border border-current/20 rounded-lg p-3`}>
            <div className="text-xs text-muted-foreground mb-1">CPI (Rendimiento Costo)</div>
            <div className={`text-2xl font-bold ${healthColor}`}>{Number.isFinite(CPI) ? CPI.toFixed(2) : '—'}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {CPI >= 1.0
                ? 'Bajo presupuesto'
                : CPI >= 0.95
                ? 'Dentro rango'
                : 'Sobre presupuesto'}
            </div>
          </div>

          {/* SPI */}
          <div className={`${healthBgColor} border border-current/20 rounded-lg p-3`}>
            <div className="text-xs text-muted-foreground mb-1">SPI (Rendimiento Tiempo)</div>
            <div className={`text-2xl font-bold ${healthColor}`}>{Number.isFinite(SPI) ? SPI.toFixed(2) : '—'}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {SPI >= 1.0 ? 'Adelantado' : SPI >= 0.95 ? 'En tiempo' : 'Retrasado'}
            </div>
          </div>

          {/* CV */}
          <div className={`${CV >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'} border border-current/20 rounded-lg p-3`}>
            <div className="text-xs text-muted-foreground mb-1">CV (Variancia Costo)</div>
            <div className={`text-2xl font-bold ${CV >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {fmtQ(CV)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {CV >= 0 ? 'Bajo presupuesto' : 'Sobre presupuesto'}
            </div>
          </div>

          {/* SV */}
          <div className={`${SV >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'} border border-current/20 rounded-lg p-3`}>
            <div className="text-xs text-muted-foreground mb-1">SV (Variancia Tiempo)</div>
            <div className={`text-2xl font-bold ${SV >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {fmtQ(SV)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {SV >= 0 ? 'Adelantado' : 'Retrasado'}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
          <BarChart3 size={36} className="opacity-30" aria-hidden="true" />
          <p className="text-sm font-medium">Sin datos EVM</p>
          <p className="text-xs">Define un presupuesto y avances para ver indicadores</p>
        </div>
      )}

      {/* Gráfico Físico vs Financiero */}
      <div className="border-t border-border/50 pt-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Físico vs Financiero</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="h-40">
              <BarChart
                data={[
                  { label: 'Físico', value: fisica, color: 'hsl(var(--primary))' },
                  { label: 'Financiero', value: financiero, color: '#f59e0b' },
                ]}
                height={160}
                palette="default"
              />
            </div>
          </div>

          {/* Leyenda */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-sm"></div>
              <span className="text-xs">Físico: {fisica}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
              <span className="text-xs">Financiero: {financiero}%</span>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="text-xs font-medium text-foreground">
                Diferencia: {(fisica - financiero).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {fisica > financiero
                  ? 'Avance físico mayor'
                  : 'Avance financiero mayor'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interpretación */}
      {hasEVMData ? (
        <div className={`${healthBgColor} border border-current/20 rounded-lg p-4`}>
          <h4 className="text-sm font-semibold text-foreground mb-2">Interpretación</h4>
          <ul className="text-xs text-foreground/80 space-y-1">
            <li>
              • <span className="font-medium">CPI {Number.isFinite(CPI) ? CPI.toFixed(2) : '—'}:</span> Por cada quetzal gastado, se
              ganó {AC > 0 ? fmtQ(EV / AC) : 'Q0.00'} de valor
            </li>
            <li>
              • <span className="font-medium">SPI {Number.isFinite(SPI) ? SPI.toFixed(2) : '—'}:</span> Proyecto
              {SPI < 1 ? ' RETRASADO' : SPI < 1.05 ? ' en tiempo' : ' ADELANTADO'}
            </li>
            <li>
              • <span className="font-medium">Estado General:</span> {healthStatus === 'success'
                ? 'Proyecto SALUDABLE'
                : healthStatus === 'warning'
                ? 'Proyecto requiere atención'
                : 'Proyecto EN RIESGO'}
            </li>
          </ul>
        </div>
      ) : (
        <div className="border border-border rounded-lg p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">Interpretación</h4>
          <p className="text-xs text-muted-foreground">No hay datos suficientes para generar interpretación EVM.</p>
        </div>
      )}
    </div>
  );
}

export default SeguimientoAnalysisPanel;
