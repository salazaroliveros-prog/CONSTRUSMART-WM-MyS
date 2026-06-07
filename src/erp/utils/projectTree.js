// Helper to build tree-select options from flat project list
export const buildProjectTreeOptions = (projects) => {
  // Assuming projects may have parentId for hierarchy
  const map = {};
  projects.forEach(p => {
    map[p.id] = { ...p, children: [] };
  });
  const roots = [];
  projects.forEach(p => {
    if (p.parentId && map[p.parentId]) {
      map[p.parentId].children.push(map[p.id]);
    } else {
      roots.push(map[p.id]);
    }
  });
  return roots.map(r => ({
    label: r.nombre,
    value: r.id,
    children: r.children.map(c => ({ label: c.nombre, value: c.id })),
  }));
};