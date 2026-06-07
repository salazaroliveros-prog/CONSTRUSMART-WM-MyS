import React from 'react';
import { Tag, Badge } from 'antd';

interface StatusChipProps {
  estado: string;
  size?: 'small' | 'default' | 'large';
  showLabel?: boolean;
}

const estadoConfig: Record<string, { color: string; label: string }> = {
  planeacion: { color: 'blue', label: 'Planeación' },
  ejecucion: { color: 'green', label: 'Ejecución' },
  pausado: { color: 'gold', label: 'Pausado' },
  finalizado: { color: 'cyan', label: 'Finalizado' },
};

export const StatusChip: React.FC<StatusChipProps> = ({
  estado,
  size = 'default',
  showLabel = true,
}) => {
  const config = estadoConfig[estado] || { color: 'default', label: estado };

  return (
    <Tag color={config.color as any} size={size}>
      {showLabel ? config.label : estado}
    </Tag>
  );
};

export const ProjectStatusBadge: React.FC<{
  proyecto: { estado: string; avanceFisico: number; avanceFinanciero: number };
  size?: 'small' | 'default';
}> = ({ proyecto, size = 'default' }) => {
  const { estado, avanceFisico, avanceFinanciero } = proyecto;
  const dev = avanceFinanciero - avanceFisico;

  let statusColor = 'blue';
  let statusText = 'Planeación';

  if (estado === 'finalizado') {
    statusColor = 'green';
    statusText = 'Finalizado';
  } else if (estado === 'pausado') {
    statusColor = 'gold';
    statusText = 'Pausado';
  } else if (estado === 'ejecucion') {
    if (dev > 8) {
      statusColor = 'red';
      statusText = 'Crítico';
    } else if (dev > 3) {
      statusColor = 'orange';
      statusText = 'Alerta';
    } else {
      statusColor = 'green';
      statusText = 'En curso';
    }
  }

  return (
    <Badge
      status={statusColor as any}
      text={statusText}
      size={size}
    />
  );
};

export const BudgetStatusIndicator: React.FC<{
  presupuestoTotal: number;
  avanceFinanciero: number;
  size?: 'small' | 'default';
}> = ({ presupuestoTotal, avanceFinanciero, size = 'default' }) => {
  const porcentaje = presupuestoTotal > 0 ? (avanceFinanciero / presupuestoTotal) * 100 : 0;

  let color: 'green' | 'orange' | 'red' = 'green';
  let text = 'OK';

  if (porcentaje > 100) {
    color = 'red';
    text = 'Sobre presupuesto';
  } else if (porcentaje > 80) {
    color = 'orange';
    text = 'Cerca del límite';
  }

  return (
    <Badge status={color} text={text} size={size} />
  );
};

export default StatusChip;