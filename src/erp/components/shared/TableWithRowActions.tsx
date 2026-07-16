import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T extends { id?: string }> {
  key: keyof T;
  header: string;
  width?: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface RowAction<T> {
  label: string;
  icon: React.ReactNode;
  onClick: (row: T) => void;
  variant?: 'default' | 'danger' | 'success' | 'info';
}

interface TableWithRowActionsProps<T extends { id?: string }> {
  data: T[];
  columns: Column<T>[];
  actions?: RowAction<T>[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyState?: {
    icon: React.ReactNode;
    title: string;
    description: string;
  };
  sortable?: boolean;
  defaultSort?: keyof T;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

/**
 * TableWithRowActions Component - Tabla genérica con acciones por fila
 * 
 * Características:
 * - Columnas configurables
 * - Acciones por fila (múltiples)
 * - Sort opcional
 * - Empty state
 * - Loading state
 * - Responsive
 * - Accesible
 */
export function TableWithRowActions<T extends { id?: string }>({
  data,
  columns,
  actions,
  onRowClick,
  isLoading,
  emptyState,
  sortable = false,
  defaultSort,
  className = '',
}: TableWithRowActionsProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(defaultSort || null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (col: Column<T>) => {
    if (!col.sortable) return;

    if (sortColumn === col.key) {
      // Ciclar: asc → desc → none
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(col.key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortColumn || sortDirection === null) return data;

    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return sorted;
  }, [data, sortColumn, sortDirection]);

  if (isLoading) {
    return (
      <div className="p-8 text-center" role="status" aria-label="Cargando tabla">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">Cargando datos...</p>
      </div>
    );
  }

  if (sortedData.length === 0 && emptyState) {
    return (
      <div className="p-8 text-center" role="status">
        <div className="mb-3 flex justify-center text-muted-foreground/60">
          {emptyState.icon}
        </div>
        <h3 className="font-semibold text-foreground">{emptyState.title}</h3>
        <p className="text-sm text-muted-foreground">{emptyState.description}</p>
      </div>
    );
  }

  const actionVariantClasses: Record<string, string> = {
    default: 'hover:bg-primary/10 text-foreground dark:text-foreground',
    danger: 'hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400',
    success: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    info: 'hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm" role="table">
        <thead className="bg-muted/50 text-muted-foreground sticky top-0">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`
                  p-3 font-semibold text-left
                  ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                  ${col.sortable ? 'cursor-pointer hover:bg-muted select-none' : ''}
                `}
                style={{ width: col.width }}
                scope="col"
                onClick={() => handleSort(col)}
                role={col.sortable ? 'button' : undefined}
                tabIndex={col.sortable ? 0 : undefined}
              >
                <div className="flex items-center gap-2">
                  <span>{col.header}</span>
                  {col.sortable && (
                    <div className="flex flex-col gap-px">
                      <ChevronUp
                        size={14}
                        className={sortColumn === col.key && sortDirection === 'asc' ? 'text-primary' : 'opacity-30'}
                      />
                      <ChevronDown
                        size={14}
                        className={sortColumn === col.key && sortDirection === 'desc' ? 'text-primary' : 'opacity-30'}
                      />
                    </div>
                  )}
                </div>
              </th>
            ))}
            {actions && <th className="p-3 text-right" scope="col">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => (
            <tr
              key={row.id || Math.random()}
              className={`
                border-t border-border/50 hover:bg-muted/30 transition-colors
                ${onRowClick ? 'cursor-pointer' : ''}
              `}
              onClick={() => onRowClick?.(row)}
              role="row"
            >
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  className={`
                    p-3 max-w-0
                    ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                  `}
                >
                  {col.render ? (
                    col.render(row[col.key], row)
                  ) : (
                    <span className="block truncate" title={String(row[col.key] ?? '-')}>
                      {String(row[col.key] ?? '-')}
                    </span>
                  )}
                </td>
              ))}
              {actions && (
                <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    {actions.map((action, idx) => (
                      <button
                        key={`${row.id}-action-${idx}`}
                        onClick={() => action.onClick(row)}
                        title={action.label}
                        className={`
                          p-1.5 rounded transition-colors
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                          ${actionVariantClasses[action.variant || 'default']}
                        `}
                        aria-label={action.label}
                      >
                        {action.icon}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TableWithRowActions;
