import React from 'react';
import { Search, ArrowUpDown, List, Grid3x3, Plus, Trash2, X } from 'lucide-react';
import { Modal, message } from 'antd';
import { toast } from 'sonner';
import { INPUT, BUTTON_PRIMARY, BUTTON_SECONDARY, BUTTON_ICON, BUTTON_DANGER } from '../../ui';

interface ProyectosToolbarProps {
  busqueda: string;
  setBusqueda: (v: string) => void;
  ordenamiento: 'nombre' | 'fecha' | 'presupuesto';
  setOrdenamiento: (v: 'nombre' | 'fecha' | 'presupuesto') => void;
  ordenDescendente: boolean;
  setOrdenDescendente: (v: boolean) => void;
  vistaLista: boolean;
  setVistaLista: (v: boolean) => void;
  proyectosCount: number;
  onOpenCreate: () => void;
  onClearAll: () => void;
  t: (key: string, options?: any) => string;
}

const ProyectosToolbar: React.FC<ProyectosToolbarProps> = ({ busqueda, setBusqueda, ordenamiento, setOrdenamiento, ordenDescendente, setOrdenDescendente, vistaLista, setVistaLista, proyectosCount, onOpenCreate, onClearAll, t }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
      <div>
        <h1 className="text-lg sm:text-xl font-black text-foreground mb-3 flex items-center gap-2">{t('proyectos.titulo')}</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">{t('proyectos.subtitulo', { count: proyectosCount })}</p>
      </div>
      <div className="flex gap-2">
        {proyectosCount > 0 && (
          <button onClick={onClearAll} className="px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-semibold transition-colors">
            <Trash2 className="w-3 h-3 mr-1" aria-hidden="true" />{t('proyectos.eliminar_todos')}
          </button>
        )}
        <button onClick={onOpenCreate} className={`${BUTTON_PRIMARY} h-[var(--density-input-height)]`}>
          <Plus className="w-4 h-4" aria-hidden="true" /> {t('proyectos.nuevo')}
        </button>
      </div>
    </div>
  );
};

export default ProyectosToolbar;
