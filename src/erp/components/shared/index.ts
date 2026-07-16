/**
 * Shared Components Library
 * 
 * Componentes reutilizables UI para toda la aplicación ERP CONSTRUSMART.
 * Estos componentes siguen el sistema de diseño unificado y son accesibles (WCAG AA).
 * 
 * @module erp/components/shared
 */

/**
 * KPICard - Componente de tarjeta para métricas KPI
 * Muestra un valor principal con tendencia, icono y estado visual
 * @example
 * ```tsx
 * <KPICard 
 *   label="Ingresos" 
 *   value={fmtQ(ingresos)} 
 *   icon={<TrendingUp size={18} />} 
 *   status="success" 
 * />
 * ```
 */
export { KPICard, type KPICardProps } from './KPICard';

/**
 * StatusBadge - Badge de estado con colores semánticos
 * Muestra estados como 'success', 'warning', 'danger', 'info' con colores apropiados
 * @example
 * ```tsx
 * <StatusBadge status="success" label="Completado" size="sm" />
 * ```
 */
export { StatusBadge, type StatusBadgeProps } from './StatusBadge';

/**
 * VarianceBadge - Badge para mostrar variaciones porcentuales
 * Indica si una variación es positiva, negativa o neutra con colores apropiados
 * @example
 * ```tsx
 * <VarianceBadge value={5.2} format="pct" />
 * ```
 */
export { VarianceBadge, type VarianceBadgeProps } from './VarianceBadge';

/**
 * TableWithRowActions - Tabla con acciones por fila
 * Tabla reutilizable con soporte para ordenamiento, columnas configurables y acciones por fila
 * @example
 * ```tsx
 * <TableWithRowActions
 *   data={tableData}
 *   columns={columns}
 *   actions={[{ label: 'Ver', onClick: (row) => console.log(row) }]}
 * />
 * ```
 */
export {
  TableWithRowActions,
  type Column,
  type RowAction,
} from './TableWithRowActions';

/**
 * ExecutiveAlerts - Componente de alertas ejecutivas
 * Muestra alertas críticas y de alta prioridad para el dashboard ejecutivo
 * @example
 * ```tsx
 * <ExecutiveAlerts alerts={[{ severity: 'critical', title: 'Riesgo', description: '...' }]} />
 * ```
 */
export { ExecutiveAlerts, type ExecutiveAlertsProps } from './ExecutiveAlerts';

/**
 * ProyectoSelector - Selector de proyectos con navegación
 * Selector visual de proyectos con soporte para navegación previa/siguiente y filtrado
 * @example
 * ```tsx
 * <ProyectoSelector
 *   proyectos={proyectos}
 *   currentProyectoId={selectedId}
 *   onProyectoChange={setSelectedId}
 *   onNavigate={(direction) => console.log(direction)}
 * />
 * ```
 */
export { ProyectoSelector, type ProyectoSelectorProps } from './ProyectoSelector';
