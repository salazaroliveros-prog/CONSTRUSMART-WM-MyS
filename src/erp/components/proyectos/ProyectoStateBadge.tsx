import React from 'react';
import { estadoBadgeClass } from '../../utils/proyectoColors';

interface ProyectoStateBadgeProps {
  estado: string;
  estadoLabel: Record<string, string>;
}

const ProyectoStateBadge: React.FC<ProyectoStateBadgeProps> = ({ estado, estadoLabel }) => {
  const label = estadoLabel[estado] || estado;
  return (
    <span className={`text-[10px] px-3 py-1.5 rounded-full font-medium transition-colors min-h-[32px] flex items-center ${estadoBadgeClass(estado)}`}>
      {label}
    </span>
  );
};

export default ProyectoStateBadge;
