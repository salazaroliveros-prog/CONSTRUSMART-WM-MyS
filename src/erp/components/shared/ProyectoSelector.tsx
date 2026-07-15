import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Proyecto {
  id: string;
  nombre: string;
}

interface ProyectoSelectorProps {
  proyectos: Proyecto[];
  currentProyectoId: string;
  onProyectoChange: (proyectoId: string) => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  className?: string;
}

/**
 * ProyectoSelector Component - Selector sticky de proyecto
 * 
 * Características:
 * - Dropdown con proyecto actual
 * - Navegación prev/next
 * - Indicador de posición
 * - Sticky en top
 * - Accesible
 */
export function ProyectoSelector({
  proyectos,
  currentProyectoId,
  onProyectoChange,
  onNavigate,
  className = '',
}: ProyectoSelectorProps) {
  const currentIndex = proyectos.findIndex((p) => p.id === currentProyectoId);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < proyectos.length - 1;

  const handlePrevClick = () => {
    if (canGoPrev) {
      onNavigate?.('prev');
      if (currentIndex > 0) {
        onProyectoChange(proyectos[currentIndex - 1].id);
      }
    }
  };

  const handleNextClick = () => {
    if (canGoNext) {
      onNavigate?.('next');
      if (currentIndex < proyectos.length - 1) {
        onProyectoChange(proyectos[currentIndex + 1].id);
      }
    }
  };

  return (
    <div
      className={`
        sticky top-0 z-40 bg-card border-b border-border
        p-3 flex items-center justify-between gap-2
        ${className}
      `}
      role="region"
      aria-label="Selector de proyecto"
    >
      {/* Botón Anterior */}
      <button
        onClick={handlePrevClick}
        disabled={!canGoPrev}
        className={`
          p-2 rounded-lg transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          ${canGoPrev
            ? 'hover:bg-muted text-foreground cursor-pointer'
            : 'opacity-40 cursor-not-allowed'
          }
        `}
        aria-label="Proyecto anterior"
        title={canGoPrev ? 'Anterior' : 'No hay proyectos anteriores'}
      >
        <ChevronLeft size={20} aria-hidden="true" />
      </button>

      {/* Selector Dropdown */}
      <select
        value={currentProyectoId}
        onChange={(e) => onProyectoChange(e.target.value)}
        className={`
          flex-1 px-3 py-2 border border-border rounded-lg
          text-sm font-medium bg-card text-foreground
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          transition-colors duration-200
          hover:bg-muted/50
        `}
        aria-label="Seleccionar proyecto"
      >
        {proyectos.length === 0 ? (
          <option value="">No hay proyectos</option>
        ) : (
          proyectos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))
        )}
      </select>

      {/* Indicador de Posición */}
      {proyectos.length > 0 && (
        <span className="text-xs text-muted-foreground whitespace-nowrap px-2 py-1 bg-muted/30 rounded">
          {currentIndex + 1} / {proyectos.length}
        </span>
      )}

      {/* Botón Siguiente */}
      <button
        onClick={handleNextClick}
        disabled={!canGoNext}
        className={`
          p-2 rounded-lg transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          ${canGoNext
            ? 'hover:bg-muted text-foreground cursor-pointer'
            : 'opacity-40 cursor-not-allowed'
          }
        `}
        aria-label="Proyecto siguiente"
        title={canGoNext ? 'Siguiente' : 'No hay proyectos siguientes'}
      >
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </div>
  );
}

export default ProyectoSelector;
