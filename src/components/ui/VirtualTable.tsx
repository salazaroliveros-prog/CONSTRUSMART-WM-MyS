import React, { useMemo, useState, useCallback, useRef } from 'react';
import { FixedSizeList as List, ListChildComponentProps, areEqual } from 'react-window';
import { cn } from '@/lib/utils';

interface VirtualTableProps<T> {
  data: T[];
  columns: {
    key: keyof T;
    header: string;
    width?: number;
    render?: (value: any, row: T) => React.ReactNode;
    className?: string;
  }[];
  rowHeight?: number;
  height?: number;
  className?: string;
  onRowClick?: (row: T, index: number) => void;
  onRowDoubleClick?: (row: T, index: number) => void;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function VirtualTable<T extends Record<string, any>>({
  data,
  columns,
  rowHeight = 60,
  height = 400,
  className,
  onRowClick,
  onRowDoubleClick,
  emptyMessage = 'No hay datos disponibles',
  isLoading = false,
}: VirtualTableProps<T>) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const listRef = useRef<List>(null);

  // Calcular ancho total de columnas
  const totalWidth = useMemo(() => {
    return columns.reduce((sum, col) => sum + (col.width || 150), 0);
  }, [columns]);

  // Renderizar fila
  const Row = useCallback(
    ({ index, style }: ListChildComponentProps) => {
      const row = data[index];
      const isSelected = selectedIndex === index;

      const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIndex(index);
        onRowClick?.(row, index);
      };

      const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRowDoubleClick?.(row, index);
      };

      return (
        <div
          style={style}
          className={cn(
            'flex items-center border-b border-border hover:bg-muted/50 cursor-pointer transition-colors',
            isSelected && 'bg-primary/10 border-primary'
          )}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          role="row"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick(e as any);
            }
          }}
        >
          {columns.map((col) => {
            const value = row[col.key];
            const content = col.render ? col.render(value, row) : String(value ?? '');
            
            return (
              <div
                key={String(col.key)}
                className={cn(
                  'px-4 py-2 truncate text-sm',
                  col.className
                )}
                style={{ width: col.width || 150, flexShrink: 0 }}
                role="cell"
              >
                {content}
              </div>
            );
          })}
        </div>
      );
    },
    [data, columns, selectedIndex, onRowClick, onRowDoubleClick]
  );

  // Renderizar cabecera
  const Header = useMemo(() => {
    return (
      <div
        className="flex items-center border-b-2 border-border bg-muted/50 font-semibold text-sm"
        style={{ width: totalWidth }}
        role="row"
      >
        {columns.map((col) => (
          <div
            key={String(col.key)}
            className={cn('px-4 py-3 truncate', col.className)}
            style={{ width: col.width || 150, flexShrink: 0 }}
            role="columnheader"
            scope="col"
          >
            {col.header}
          </div>
        ))}
      </div>
    );
  }, [columns, totalWidth]);

  // Renderizar estado vacío
  if (data.length === 0 && !isLoading) {
    return (
      <div
        className={cn('flex items-center justify-center border border-border rounded-md', className)}
        style={{ height }}
        role="status"
        aria-label={emptyMessage}
      >
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </div>
    );
  }

  // Renderizar estado de carga
  if (isLoading) {
    return (
      <div
        className={cn('flex items-center justify-center border border-border rounded-md', className)}
        style={{ height }}
        role="status"
        aria-label="Cargando datos"
      >
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        <p className="text-muted-foreground text-sm ml-2">Cargando...</p>
      </div>
    );
  }

  return (
    <div className={cn('border border-border rounded-md overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <div style={{ width: totalWidth }}>
          {Header}
          <List
            ref={listRef}
            height={height}
            itemCount={data.length}
            itemSize={rowHeight}
            width={totalWidth}
            itemData={data}
            children={Row}
          />
        </div>
      </div>
    </div>
  );
}

// Umbral para activar virtual scrolling
export const VIRTUAL_SCROLL_THRESHOLD = 50;

// Hook para determinar si usar virtual scrolling
export function useVirtualScroll(dataLength: number) {
  return dataLength >= VIRTUAL_SCROLL_THRESHOLD;
}
