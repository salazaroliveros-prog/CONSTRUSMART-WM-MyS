import React from 'react';
import { BarChart3, FileText, CalendarClock, AlertTriangle } from 'lucide-react';

type TabType = 'analysis' | 'bitacora' | 'cronograma' | 'riesgos';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ElementType;
  description: string;
}

interface SeguimientoTabBarProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
  className?: string;
}

const TABS: Tab[] = [
  {
    id: 'analysis',
    label: 'Análisis EVM',
    icon: BarChart3,
    description: 'Valor ganado y rendimiento',
  },
  {
    id: 'bitacora',
    label: 'Bitácora',
    icon: FileText,
    description: 'Reportes diarios de campo',
  },
  {
    id: 'cronograma',
    label: 'Cronograma',
    icon: CalendarClock,
    description: 'Hitos y timeline',
  },
  {
    id: 'riesgos',
    label: 'Riesgos',
    icon: AlertTriangle,
    description: 'Matriz de riesgos',
  },
];

/**
 * SeguimientoTabBar Component - Toolbar de pestañas
 * 
 * En lugar de tabs tradicionales, usa botones que actúan como toolbar
 * Cada pestaña tiene icon + label + descripción
 */
export function SeguimientoTabBar({
  activeTab,
  onChange,
  className = '',
}: SeguimientoTabBarProps) {
  return (
    <div className={`bg-card border-b border-border ${className}`}>
      <div className="flex items-center overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                flex items-center gap-2.5 px-4 py-3 border-b-2 transition-all
                whitespace-nowrap text-sm font-medium
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                ${
                  isActive
                    ? 'border-b-primary text-primary bg-primary/5'
                    : 'border-b-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
              `}
              aria-label={`${tab.label} - ${tab.description}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SeguimientoTabBar;
