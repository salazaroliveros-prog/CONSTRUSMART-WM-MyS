import React from 'react';
import { TrendingUp, Eye } from 'lucide-react';
import { fmtQ, fmtPct } from '../../utils';
import { TableWithRowActions, type Column } from '../shared';

interface ProjectProfitability {
  id: string;
  nombre: string;
  presupuesto: number;
  ingresos: number;
  gastos: number;
  margen: number;
  margenPct: number;
  rentabilidad: number;
}

interface ProfitabilityTableProps {
  data: ProjectProfitability[];
  onViewDetails?: (projectId: string) => void;
  className?: string;
}

/**
 * ProfitabilityTable Component - Tabla de rentabilidad por proyecto
 * 
 * Muestra:
 * - Presupuesto vs Ejecución
 * - Margen en dinero y %
 * - Rentabilidad real
 * - Comparativas por proyecto
 */
export function ProfitabilityTable({
  data,
  onViewDetails,
  className = '',
}: ProfitabilityTableProps) {
  const columns: Column<ProjectProfitability>[] = [
    {
      key: 'nombre',
      header: 'Proyecto',
      width: '20%',
      sortable: true,
    },
    {
      key: 'presupuesto',
      header: 'Presupuesto',
      width: '15%',
      align: 'right',
      sortable: true,
      render: (val) => <span className="font-medium">{fmtQ(val as number)}</span>,
    },
    {
      key: 'ingresos',
      header: 'Ingresos',
      width: '15%',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
          {fmtQ(val as number)}
        </span>
      ),
    },
    {
      key: 'gastos',
      header: 'Gastos',
      width: '15%',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className="text-red-600 dark:text-red-400 font-medium">
          {fmtQ(val as number)}
        </span>
      ),
    },
    {
      key: 'margen',
      header: 'Margen',
      width: '15%',
      align: 'right',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center justify-end gap-2">
          <span className="font-bold text-foreground">{fmtQ(val as number)}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            (row as ProjectProfitability).margenPct >= 20
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
              : (row as ProjectProfitability).margenPct >= 10
              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
              : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
          }`}>
            {fmtPct((row as ProjectProfitability).margenPct)}
          </span>
        </div>
      ),
    },
    {
      key: 'rentabilidad',
      header: 'Rentabilidad',
      width: '15%',
      align: 'right',
      sortable: true,
      render: (val) => {
        const rentabilidad = val as number;
        const color =
          rentabilidad >= 15
            ? 'text-emerald-600'
            : rentabilidad >= 10
            ? 'text-amber-600'
            : rentabilidad >= 5
            ? 'text-orange-600'
            : 'text-red-600';
        return <span className={`font-bold ${color}`}>{rentabilidad.toFixed(1)}%</span>;
      },
    },
  ];

  const summaryData = {
    totalPresupuesto: data.reduce((sum, p) => sum + p.presupuesto, 0),
    totalIngresos: data.reduce((sum, p) => sum + p.ingresos, 0),
    totalGastos: data.reduce((sum, p) => sum + p.gastos, 0),
    totalMargen: data.reduce((sum, p) => sum + p.margen, 0),
    promedioRentabilidad:
      data.length > 0 ? data.reduce((sum, p) => sum + p.rentabilidad, 0) / data.length : 0,
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Presupuesto Total</p>
          <p className="text-lg font-bold text-foreground">{fmtQ(summaryData.totalPresupuesto)}</p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Ingresos</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {fmtQ(summaryData.totalIngresos)}
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Gastos</p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">
            {fmtQ(summaryData.totalGastos)}
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Margen Total</p>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
            {fmtQ(summaryData.totalMargen)}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Rent. Promedio</p>
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {summaryData.promedioRentabilidad.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Rentabilidad por Proyecto
          </h3>
        </div>

        <TableWithRowActions
          data={data}
          columns={columns}
          actions={[
            {
              label: 'Ver Detalle',
              icon: <Eye size={16} />,
              onClick: (row) => onViewDetails?.(row.id),
            },
          ]}
          emptyState={{
            icon: <TrendingUp size={48} />,
            title: 'Sin datos de rentabilidad',
            description: 'Los proyectos aparecerán aquí cuando tengan movimientos',
          }}
          sortable
          defaultSort="margen"
        />
      </div>
    </div>
  );
}

export default ProfitabilityTable;
