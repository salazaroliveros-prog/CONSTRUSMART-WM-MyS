import React from 'react';
import { AlertTriangle, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface Alert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  count: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ExecutiveAlertsProps {
  alerts: Alert[];
  className?: string;
  maxVisibleAlerts?: number;
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    textColor: 'text-red-900 dark:text-red-100',
    titleColor: 'text-red-700 dark:text-red-300',
  },
  high: {
    icon: AlertCircle,
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    textColor: 'text-orange-900 dark:text-orange-100',
    titleColor: 'text-orange-700 dark:text-orange-300',
  },
  medium: {
    icon: AlertCircle,
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    textColor: 'text-amber-900 dark:text-amber-100',
    titleColor: 'text-amber-700 dark:text-amber-300',
  },
  low: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-900 dark:text-blue-100',
    titleColor: 'text-blue-700 dark:text-blue-300',
  },
};

/**
 * ExecutiveAlerts Component - Panel de alertas consolidadas
 * 
 * Características:
 * - 4 niveles de severidad
 * - Contador de problemas
 * - Acciones contextuales
 * - Ocultable si no hay alertas
 * - Responsive
 * - Accesible
 */
export function ExecutiveAlerts({
  alerts,
  className = '',
  maxVisibleAlerts = 5,
}: ExecutiveAlertsProps) {
  const criticalAlerts = alerts.filter(
    (a) => a.severity === 'critical' || a.severity === 'high'
  );

  if (criticalAlerts.length === 0) {
    return null;
  }

  const visibleAlerts = criticalAlerts.slice(0, maxVisibleAlerts);
  const hiddenCount = Math.max(0, criticalAlerts.length - maxVisibleAlerts);

  return (
    <div
      className={`
        bg-card border rounded-xl p-4 mb-4
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-destructive" aria-hidden="true" />
        <span>
          Alertas Críticas
          {criticalAlerts.length > 0 && (
            <span className="ml-1 text-destructive">({criticalAlerts.length})</span>
          )}
        </span>
      </h3>

      <div className="space-y-2">
        {visibleAlerts.map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;

          return (
            <div
              key={alert.id}
              className={`
                flex items-start justify-between gap-3 p-3 rounded-lg
                border ${config.borderColor}
                ${config.bgColor}
              `}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Icon
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.titleColor}`}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${config.titleColor}`}>
                    {alert.title}
                  </p>
                  <p className={`text-xs mt-0.5 ${config.textColor} opacity-90`}>
                    {alert.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-lg font-bold ${config.titleColor}`}>
                  {alert.count}
                </span>
                {alert.action && (
                  <button
                    onClick={alert.action.onClick}
                    className={`
                      px-2.5 py-1 text-xs font-semibold rounded
                      transition-all duration-200
                      focus-visible:outline-none focus-visible:ring-2
                      ${
                        alert.severity === 'critical'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : alert.severity === 'high'
                          ? 'bg-orange-600 hover:bg-orange-700 text-white'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }
                    `}
                  >
                    {alert.action.label}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {hiddenCount > 0 && (
          <div className="p-2 text-center text-xs text-muted-foreground bg-muted/30 rounded-lg">
            +{hiddenCount} alertas adicionales ocultas
          </div>
        )}
      </div>
    </div>
  );
}

export default ExecutiveAlerts;
