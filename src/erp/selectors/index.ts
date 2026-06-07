import { createSelector } from '@reduxjs/toolkit';
import { projectsState } from '../store';

// Optimized selector for filtered projects by status
export const selectProyectosByStatus = (status) =>
  createSelector(
    (state) => state.proyectos.list,
    (projects) => projects.filter(p => p.estado === status)
  );

// Optimized selector for active projects
export const selectActiveProyectos = createSelector(
  (state) => state.proyectos.list,
  (projects) => projects.filter(p => p.estado === 'ejecucion')
);

// Optimized selector for budget status
export const selectProyectosBudgetStatus = createSelector(
  (state) => state.proyectos.list,
  (projects) => projects.map(p => ({
    id: p.id,
    nombre: p.nombre,
    presupuestoTotal: p.presupuestoTotal,
    avanceFinanciero: p.avanceFinanciero,
    sobrePresupuesto: p.avanceFinanciero > p.presupuestoTotal,
  }))
);