import React from 'react';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { fmtQ } from '../../utils';
import { Progress } from '../Charts';

interface AgingBucket {
  label: string;
  description: string;
  amount: number;
  percentage: number;
  status: 'success' | 'warning' | 'danger';
  color: string;
  bgColor: string;
}

interface AgingReportProps {
  title: string;
  buckets: AgingBucket[];
  totalAmount: number;
  overallStatus: 'healthy' | 'caution' | 'critical';
  className?: string;
}

/**
 * AgingReport Component - Reporte de antigüedad de cuentas
 * 
 * Muestra:
 * - Desglose por rangos (Vigente, 30-60, 60-90, >90)
 * - Amount y percentage en cada rango
 * - Status semántico por urgencia
 */
export function AgingReport({
  title,
  buckets,
  totalAmount,
  overallStatus,
  className = '',
}: AgingReportProps) {
  const getStatusIcon = () => {
    switch (overallStatus) {
      case 'healthy':
        return '✅';
      case 'caution':
        return '⚠️';
      case 'critical':
        return '🔴';
      default:
        return 'ℹ️';
    }
  };

  const getStatusText = () => {
    switch (overallStatus) {
      case 'healthy':
        return 'Estado saludable';
      case 'caution':
        return 'Requiere atención';
      case 'critical':
        return 'Situación crítica';
      default:
        return 'Por revisar';
    }
  };

  const getStatusColor = () => {
    switch (overallStatus) {
      case 'healthy':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'caution':
        return 'text-amber-600 dark:text-amber-400';
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const criticalAmount = buckets
    .filter((b) => b.status === 'danger')
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className={`bg-card border border-border rounded-xl p-6 space-y-6 ${className}`}>
      {/* Encabezado */}
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Análisis de antigüedad de cuentas
        </p>
      </div>

      {/* Status general */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
        <div>
          <p className="text-sm font-medium text-foreground">Total: {fmtQ(totalAmount)}</p>
          <p className={`text-sm font-semibold mt-1 ${getStatusColor()}`}>
            {getStatusIcon()} {getStatusText()}
          </p>
        </div>
        {criticalAmount > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Crítico:</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              {fmtQ(criticalAmount)}
            </p>
          </div>
        )}
      </div>

      {/* Buckets detallado */}
      <div className="space-y-4">
        {buckets.map((bucket, idx) => {
          const bgColor = `${bucket.bgColor} border-current/20`;
          const statusBadgeColor = {
            success: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
            warning: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
            danger: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
          }[bucket.status];

          return (
            <div key={idx} className={`${bgColor} border rounded-lg p-4`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground">{bucket.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{bucket.description}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadgeColor}`}>
                  {bucket.percentage.toFixed(1)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-2">
                <Progress
                  value={bucket.percentage}
                  color={bucket.color}
                />
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">{fmtQ(bucket.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  {((bucket.amount / totalAmount) * 100).toFixed(0)}% del total
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Análisis y recomendaciones */}
      {criticalAmount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                Atención Requerida
              </p>
              <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                Hay {fmtQ(criticalAmount)} vencidos o críticos. Se recomienda gestión inmediata.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgingReport;
