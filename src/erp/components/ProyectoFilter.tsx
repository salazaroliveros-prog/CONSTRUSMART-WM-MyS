import React from 'react';
import type { Proyecto } from '../types';

interface ProyectoFilterProps {
  value: string;
  onChange: (value: string) => void;
  proyectos: Proyecto[];
  labelAll?: string;
}

const ProyectoFilter: React.FC<ProyectoFilterProps> = ({ value, onChange, proyectos, labelAll = 'Todos los proyectos' }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    className="px-2 py-1.5 rounded-lg text-xs outline-none focus:ring-2 focus:ring-ring bg-background border border-input text-foreground">
    <option value="">{labelAll}</option>
    {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
  </select>
);

export default ProyectoFilter;
