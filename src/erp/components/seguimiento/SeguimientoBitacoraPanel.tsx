import React, { useState } from 'react';
import { Camera, Edit2, Trash2, Plus } from 'lucide-react';
import { StatusBadge } from '../shared';

interface BitacoraEntry {
  id: string;
  fecha: string;
  clima: string;
  personal: number;
  maquinaria: string;
  tareas: string;
  observaciones: string;
}

interface SeguimientoBitacoraPanelProps {
  entries: BitacoraEntry[];
  onAdd?: () => void;
  onEdit?: (entry: BitacoraEntry) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

/**
 * SeguimientoBitacoraPanel Component - Panel de bitácora de obra
 * 
 * Muestra:
 * - Última entrada de bitácora (destacada)
 * - Histórico de últimas entradas
 * - Acciones (agregar, editar, eliminar)
 */
export function SeguimientoBitacoraPanel({
  entries,
  onAdd,
  onEdit,
  onDelete,
  className = '',
}: SeguimientoBitacoraPanelProps) {
  const lastEntry = entries?.[0];
  const previousEntries = entries?.slice(1, 6) || [];

  const getClimaIcon = (clima: string) => {
    switch (clima.toLowerCase()) {
      case 'soleado':
        return '☀️';
      case 'nublado':
        return '☁️';
      case 'lluvia':
        return '🌧️';
      default:
        return '⛅';
    }
  };

  return (
    <div className={`bg-card border border-border rounded-xl p-6 space-y-4 ${className}`}>
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-500" />
            Bitácora de Obra
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Reportes diarios del campo
          </p>
        </div>
        <button
          onClick={onAdd}
          className={`
            flex items-center gap-1.5 px-3 py-2 rounded-lg
            bg-primary text-primary-foreground text-sm font-medium
            hover:bg-primary/90 transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          `}
        >
          <Plus size={16} />
          Nueva
        </button>
      </div>

      {/* Última entrada destacada */}
      {lastEntry ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Última entrada:</p>
              <p className="text-sm font-semibold text-foreground">{lastEntry.fecha}</p>
            </div>
            <StatusBadge status="info" label="Reciente" size="sm" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Clima</p>
              <p className="text-sm font-medium">
                {getClimaIcon(lastEntry.clima)} {lastEntry.clima}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Personal</p>
              <p className="text-sm font-medium">{lastEntry.personal} personas</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-muted-foreground mb-0.5">Maquinaria</p>
              <p className="text-sm font-medium">{lastEntry.maquinaria}</p>
            </div>
          </div>

          {lastEntry.tareas && (
            <div className="mb-3 pb-3 border-b border-blue-200 dark:border-blue-800">
              <p className="text-xs text-muted-foreground mb-1">Tareas Realizadas</p>
              <p className="text-sm text-foreground">{lastEntry.tareas}</p>
            </div>
          )}

          {lastEntry.observaciones && (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1">Observaciones</p>
              <p className="text-sm text-foreground italic">{lastEntry.observaciones}</p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-blue-200 dark:border-blue-800">
            <button
              onClick={() => onEdit?.(lastEntry)}
              className="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 transition-colors"
              title="Editar"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => onDelete?.(lastEntry.id)}
              className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 transition-colors"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-muted/30 border border-border/50 rounded-lg p-8 text-center">
          <Camera className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No hay entradas de bitácora
          </p>
        </div>
      )}

      {/* Histórico */}
      {previousEntries.length > 0 && (
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-foreground mb-3">Histórico</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {previousEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-muted/30 rounded-lg p-2 text-xs hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{entry.fecha}</span>
                  <span className="text-muted-foreground">
                    {getClimaIcon(entry.clima)} {entry.personal}p
                  </span>
                </div>
                {entry.tareas && (
                  <p className="text-muted-foreground mt-1 line-clamp-1">
                    {entry.tareas}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SeguimientoBitacoraPanel;
