import React from 'react';
import { TreeSelect } from 'antd';
import { useSelector } from 'react-redux';
import { selectActiveProyectos } from '../selectors';

interface ProjectTreeSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  allowClear?: boolean;
}

const { TreeNode } = TreeSelect;

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
  const projects = useSelector(selectActiveProyectos);
  const treeData = React.useMemo(() => buildTreeNodes(projects), [projects]);

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