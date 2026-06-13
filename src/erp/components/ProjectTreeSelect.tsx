import React from 'react';
import { TreeSelect } from 'antd';
import { useErp } from '../store';

interface ProjectTreeSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  allowClear?: boolean;
}

const buildTreeNodes = (projects: any[]) => {
  return projects.map(p => ({
    title: p.nombre,
    value: p.id,
    key: p.id,
    disabled: p.estado === 'finalizado',
  }));
};

export const ProjectTreeSelect: React.FC<ProjectTreeSelectProps> = ({
  value,
  onChange,
  placeholder = 'Seleccionar proyecto...',
  style = { width: '100%' },
  disabled = false,
  allowClear = true,
}) => {
  const { proyectos } = useErp();
  const active = proyectos.filter((p: any) => p.estado === 'ejecucion');
  const treeData = React.useMemo(() => buildTreeNodes(active), [active]);

  return (
    <TreeSelect
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={style}
      disabled={disabled}
      allowClear={allowClear}
      treeData={treeData}
      showSearch
      dropdownStyle={{ maxHeight: 400 }}
    />
  );
};

export default ProjectTreeSelect;