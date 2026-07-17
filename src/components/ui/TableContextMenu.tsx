import React, { useState, useCallback } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { MoreHorizontal, Eye, Pencil, Trash, Copy, Download, Share, Filter, SortAsc, SortDesc } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TableContextMenuProps<T> {
  children: React.ReactNode;
  rowData: T;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onDuplicate?: (row: T) => void;
  onExport?: (row: T) => void;
  onShare?: (row: T) => void;
  customActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (row: T) => void;
    separator?: boolean;
  }>;
  disabled?: boolean;
  className?: string;
}

export function TableContextMenu<T extends Record<string, any>>({
  children,
  rowData,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onExport,
  onShare,
  customActions = [],
  disabled = false,
  className,
}: TableContextMenuProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const handleView = useCallback(() => {
    onView?.(rowData);
    setIsOpen(false);
  }, [rowData, onView]);

  const handleEdit = useCallback(() => {
    onEdit?.(rowData);
    setIsOpen(false);
  }, [rowData, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete?.(rowData);
    setIsOpen(false);
  }, [rowData, onDelete]);

  const handleDuplicate = useCallback(() => {
    onDuplicate?.(rowData);
    setIsOpen(false);
  }, [rowData, onDuplicate]);

  const handleExport = useCallback(() => {
    onExport?.(rowData);
    setIsOpen(false);
  }, [rowData, onExport]);

  const handleShare = useCallback(() => {
    onShare?.(rowData);
    setIsOpen(false);
  }, [rowData, onShare]);

  const hasAnyAction = onView || onEdit || onDelete || onDuplicate || onExport || onShare || customActions.length > 0;

  if (!hasAnyAction || disabled) {
    return <>{children}</>;
  }

  return (
    <ContextMenu onOpenChange={setIsOpen} open={isOpen}>
      <ContextMenuTrigger asChild className={cn('outline-none', className)}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {onView && (
          <ContextMenuItem onClick={handleView}>
            <Eye className="w-4 h-4 mr-2" />
            Ver detalle
          </ContextMenuItem>
        )}
        
        {onEdit && (
          <ContextMenuItem onClick={handleEdit}>
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </ContextMenuItem>
        )}
        
        {onDuplicate && (
          <ContextMenuItem onClick={handleDuplicate}>
            <Copy className="w-4 h-4 mr-2" />
            Duplicar
          </ContextMenuItem>
        )}
        
        {(onDuplicate || onEdit) && onDelete && <ContextMenuSeparator />}
        
        {onDelete && (
          <ContextMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
            <Trash className="w-4 h-4 mr-2" />
            Eliminar
          </ContextMenuItem>
        )}
        
        {(onDelete || onEdit) && (onExport || onShare) && <ContextMenuSeparator />}
        
        {onExport && (
          <ContextMenuItem onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </ContextMenuItem>
        )}
        
        {onShare && (
          <ContextMenuItem onClick={handleShare}>
            <Share className="w-4 h-4 mr-2" />
            Compartir
          </ContextMenuItem>
        )}
        
        {customActions.map((action, index) => (
          <React.Fragment key={index}>
            {action.separator && <ContextMenuSeparator />}
            <ContextMenuItem onClick={() => action.onClick(rowData)}>
              {action.icon && <span className="w-4 h-4 mr-2">{action.icon}</span>}
              {action.label}
            </ContextMenuItem>
          </React.Fragment>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}

// Hook para generar acciones comunes
export function useTableActions<T extends Record<string, any>>() {
  return {
    getViewAction: (onView: (row: T) => void) => ({
      label: 'Ver detalle',
      icon: <Eye className="w-4 h-4" />,
      onClick: onView,
    }),
    getEditAction: (onEdit: (row: T) => void) => ({
      label: 'Editar',
      icon: <Pencil className="w-4 h-4" />,
      onClick: onEdit,
    }),
    getDeleteAction: (onDelete: (row: T) => void) => ({
      label: 'Eliminar',
      icon: <Trash className="w-4 h-4" />,
      onClick: onDelete,
      separator: true,
    }),
    getDuplicateAction: (onDuplicate: (row: T) => void) => ({
      label: 'Duplicar',
      icon: <Copy className="w-4 h-4" />,
      onClick: onDuplicate,
    }),
    getExportAction: (onExport: (row: T) => void) => ({
      label: 'Exportar',
      icon: <Download className="w-4 h-4" />,
      onClick: onExport,
      separator: true,
    }),
    getShareAction: (onShare: (row: T) => void) => ({
      label: 'Compartir',
      icon: <Share className="w-4 h-4" />,
      onClick: onShare,
    }),
  };
}

// Botón de acciones rápidas para uso en tabla
export function TableActionsButton<T extends Record<string, any>>({
  rowData,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onExport,
  onShare,
  customActions = [],
  disabled = false,
}: TableContextMenuProps<T>) {
  return (
    <TableContextMenu
      rowData={rowData}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onExport={onExport}
      onShare={onShare}
      customActions={customActions}
      disabled={disabled}
    >
      <button
        className="p-2 hover:bg-muted rounded-md transition-colors outline-none focus:ring-2 focus:ring-ring"
        aria-label="Más acciones"
        tabIndex={0}
      >
        <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
      </button>
    </TableContextMenu>
  );
}
