import React from 'react';
import type { Proyecto } from '../types';
import { APP_STAGES } from '../types';

interface ProyectoFilterProps {
  value: string;
  onChange: (value: string) => void;
  proyectos: Proyecto[];
  labelAll?: string;
}

const etapaOrden = Object.keys(APP_STAGES) as Array<keyof typeof APP_STAGES>;

const ProyectoFilter: React.FC<ProyectoFilterProps> = ({ value, onChange, proyectos, labelAll = 'Todos los proyectos' }) => {
  const sorted = React.useMemo(() => {
    const map: Record<string, number> = {};
    etapaOrden.forEach((e, i) => { map[e] = i; });
    return [...proyectos].sort((a, b) => (map[a.etapa] ?? 99) - (map[b.etapa] ?? 99));
  }, [proyectos]);

  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="px-2 py-1.5 rounded-lg text-xs outline-none focus:ring-2 focus:ring-ring bg-background border border-input text-foreground">
      <option value="">{labelAll}</option>
      {sorted.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
    </select>
  );
};

export default ProyectoFilter;
