import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fmtQ } from '../utils';
import { useErp } from '../store';

interface DashboardExportData {
  proyectos: any[];
  movimientos: any[];
  kpis: {
    totalProyectos: number;
    proyectosActivos: number;
    totalPresupuesto: number;
    totalGastado: number;
    avancePromedioFisico: number;
    avancePromedioFinanciero: number;
  };
}

export const buildDashboardExportData = (data: { proyectos: any[]; movimientos: any[] }): DashboardExportData => {
  const { proyectos, movimientos } = data;

  const kpis = {
    totalProyectos: proyectos.length,
    proyectosActivos: proyectos.filter((p) => p.estado === 'ejecucion').length,
    totalPresupuesto: proyectos.reduce((sum, p) => sum + (p.presupuestoTotal || 0), 0),
    totalGastado: movimientos
      .filter((m) => m.tipo === 'gasto')
      .reduce((sum, m) => sum + (m.monto || 0), 0),
    avancePromedioFisico: proyectos.length
      ? Math.round(proyectos.reduce((sum, p) => sum + (p.avanceFisico || 0), 0) / proyectos.length)
      : 0,
    avancePromedioFinanciero: proyectos.length
      ? Math.round(proyectos.reduce((sum, p) => sum + (p.avanceFinanciero || 0), 0) / proyectos.length)
      : 0,
  };

  return { proyectos, movimientos, kpis };
};

export const useDashboardExportData = () => {
  const { proyectos, movimientos } = useErp();

  const build = () => buildDashboardExportData({ proyectos, movimientos });

  return {
    proyectos,
    movimientos,
    build,
  };
};

export const exportDashboardToPDF = ({ proyectos, kpis }: { proyectos: any[]; kpis: DashboardExportData['kpis'] }) => {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Reporte de Dashboard - CONSTRUSMART', 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 14, 28);

  const kpiData = [
    ['Total Proyectos', kpis.totalProyectos.toString()],
    ['Proyectos Activos', kpis.proyectosActivos.toString()],
    ['Presupuesto Total', fmtQ(kpis.totalPresupuesto)],
    ['Total Gastado', fmtQ(kpis.totalGastado)],
    ['Avance Físico Prom.', `${kpis.avancePromedioFisico}%`],
    ['Avance Financiero Prom.', `${kpis.avancePromedioFinanciero}%`],
  ];

  autoTable(doc, {
    startY: 35,
    head: [['Indicador', 'Valor']],
    body: kpiData,
    theme: 'striped',
    headStyles: { fillColor: [232, 117, 47] },
  });

  const proyectosData = proyectos.map((p: any) => [
    p.nombre,
    p.estado,
    fmtQ(p.presupuestoTotal || 0),
    `${p.avanceFisico || 0}%`,
    `${p.avanceFinanciero || 0}%`,
    p.fechaInicio ? p.fechaInicio.slice(0, 10) : '—',
    p.fechaFin ? p.fechaFin.slice(0, 10) : '—',
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Proyecto', 'Estado', 'Presupuesto', 'Av. Físico', 'Av. Financiero', 'Inicio', 'Fin']],
    body: proyectosData,
    theme: 'striped',
    headStyles: { fillColor: [232, 117, 47] },
    columnStyles: {
      0: { cellWidth: 40 },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
    },
  });

  doc.save(`dashboard-constru-smart-${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const useDashboardExport = () => {
  const { build } = useDashboardExportData();
  return { exportDashboardToPDF: () => exportDashboardToPDF(build()) };
};

export default exportDashboardToPDF;