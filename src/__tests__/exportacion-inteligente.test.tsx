import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import ExportacionInteligente from '../erp/screens/ExportacionInteligente';

const { mockFmtQ, mockTodayISO, mockDownloadBlob, mockSanitizarTexto } = vi.hoisted(() => ({
  mockFmtQ: vi.fn((n: number) => `Q ${(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`),
  mockTodayISO: vi.fn(() => '2026-07-19'),
  mockDownloadBlob: vi.fn(),
  mockSanitizarTexto: vi.fn((x: string) => x),
}));

const { mockJsPdfInstance, mockHtml2canvasFn } = vi.hoisted(() => ({
  mockJsPdfInstance: {
    internal: { pageSize: { getWidth: vi.fn(() => 210) } },
    addImage: vi.fn(),
    save: vi.fn(),
  },
  mockHtml2canvasFn: vi.fn(() => Promise.resolve({
    toDataURL: vi.fn(() => 'data:image/png;base64,fake'),
    width: 800,
    height: 600,
  })),
}));

const { mockXLSXWriteFile, mockXLSXBookNew, mockXLSXJsonToSheet, mockXLSXBookAppendSheet, mockXLSXDecodeRange, mockXLSXEncodeCell } = vi.hoisted(() => ({
  mockXLSXWriteFile: vi.fn(),
  mockXLSXBookNew: vi.fn(() => ({})),
  mockXLSXJsonToSheet: vi.fn(() => ({ '!ref': 'A1:B2' })),
  mockXLSXBookAppendSheet: vi.fn(),
  mockXLSXDecodeRange: vi.fn(() => ({ s: { c: 0, r: 0 }, e: { c: 1, r: 2 } })),
  mockXLSXEncodeCell: vi.fn(() => 'A1'),
}));

const mockProyectos = [
  { id: 'proy-1', nombre: 'Residencial Aurora', ubicacion: 'Zona 10', cliente: 'Cliente A', tipologia: 'residencial', estado: 'ejecucion', presupuestoTotal: 500000, montoContrato: 450000, avanceFisico: 60, avanceFinanciero: 55, fechaInicio: '2026-01-01', fechaFin: '2026-12-31', factorSobrecosto: 1.05 },
  { id: 'proy-2', nombre: 'Torre Comercial', ubicacion: 'Zona 14', cliente: 'Cliente B', tipologia: 'comercial', estado: 'planeacion', presupuestoTotal: 1200000, montoContrato: 1100000, avanceFisico: 10, avanceFinanciero: 8, fechaInicio: '2026-03-01', fechaFin: '2027-06-30', factorSobrecosto: 1.03 },
];

const mockMovimientos = [
  { id: 'mov-1', proyectoId: 'proy-1', tipo: 'ingreso', categoria: 'venta', monto: 100000, costoTotal: 100000, descripcion: 'Pago inicial', fecha: '2026-01-15', proveedor: 'Cliente A' },
  { id: 'mov-2', proyectoId: 'proy-1', tipo: 'gasto', categoria: 'materiales', monto: 30000, costoTotal: 30000, descripcion: 'Compra cemento', fecha: '2026-02-01', proveedor: 'Proveedor A' },
];

const mockEmpleados = [
  { id: 'emp-1', nombre: 'Carlos López', puesto: 'Ingeniero', salarioDiario: 500, tipo: 'permanente', activo: true, proyectoIds: ['proy-1'] },
  { id: 'emp-2', nombre: 'Ana Martínez', puesto: 'Arquitecta', salarioDiario: 450, tipo: 'permanente', activo: true, proyectoIds: ['proy-2'] },
];

const mockMateriales = [
  { id: 'mat-1', nombre: 'Cemento', unidad: 'saco', stock: 500, stockMinimo: 100, precio: 85, precioUnitario: 85, categoria: 'materiales', critico: true },
  { id: 'mat-2', nombre: 'Varilla', unidad: 'quintal', stock: 200, stockMinimo: 50, precio: 350, precioUnitario: 350, categoria: 'materiales', critico: false },
];

const mockPresupuestos = [
  { id: 'pres-1', proyectoId: 'proy-1', version: 1, estado: 'aprobado', totalCD: 350000, totalPV: 500000, renglones: [{ id: 'r-1', nombre: 'Cimentación' }], costoDirectoTotal: 350000, totalCalculado: 500000, versionPresupuesto: 1, fechaActualizacion: '2026-01-10T00:00:00Z' },
  { id: 'pres-2', proyectoId: 'proy-2', version: 1, estado: 'borrador', totalCD: 800000, totalPV: 1200000, renglones: [{ id: 'r-2', nombre: 'Estructura' }], costoDirectoTotal: 800000, totalCalculado: 1200000, versionPresupuesto: 1, fechaActualizacion: '2026-03-05T00:00:00Z' },
];

const mockAvances = [
  { id: 'av-1', proyectoId: 'proy-1', renglonNombre: 'Cimentación', avanceFisico: 80, cantidadEjecutada: 40, fecha: '2026-06-01' },
];

const mockUseErp = {
  proyectos: mockProyectos,
  movimientos: mockMovimientos,
  empleados: mockEmpleados,
  materiales: mockMateriales,
  presupuestos: mockPresupuestos,
  avances: mockAvances,
};

const mockT = (key: string) => key;

vi.mock('../erp/store', () => ({
  useErp: () => mockUseErp,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/security', () => ({
  sanitizarTexto: mockSanitizarTexto,
}));

vi.mock('@/lib/safeLogger', () => ({
  safeLogger: { error: vi.fn() },
}));

vi.mock('../erp/utils', () => ({
  fmtQ: mockFmtQ,
  todayISO: mockTodayISO,
  downloadBlob: mockDownloadBlob,
}));

vi.mock('../erp/ui', () => ({
  INPUT: 'w-full px-3 py-2 border rounded-md',
}));

vi.mock('jspdf', () => ({ default: vi.fn(() => mockJsPdfInstance) }));
vi.mock('html2canvas', () => ({ default: mockHtml2canvasFn }));

vi.mock('xlsx', () => ({
  utils: {
    book_new: mockXLSXBookNew,
    json_to_sheet: mockXLSXJsonToSheet,
    book_append_sheet: mockXLSXBookAppendSheet,
    decode_range: mockXLSXDecodeRange,
    encode_cell: mockXLSXEncodeCell,
  },
  writeFile: mockXLSXWriteFile,
}));

describe('ExportacionInteligente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockUseErp.proyectos = [...mockProyectos];
    mockUseErp.movimientos = [...mockMovimientos];
    mockUseErp.empleados = [...mockEmpleados];
    mockUseErp.materiales = [...mockMateriales];
    mockUseErp.presupuestos = [...mockPresupuestos];
    mockUseErp.avances = [...mockAvances];
    mockTodayISO.mockReturnValue('2026-07-19');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders title and subtitle', () => {
    render(<ExportacionInteligente />);
    expect(screen.getByText('exportacion.titulo')).toBeInTheDocument();
    expect(screen.getByText('exportacion.subtitulo')).toBeInTheDocument();
  });

  it('renders 4 export buttons after loading resolves', () => {
    render(<ExportacionInteligente />);
    expect(screen.getByText('exportacion.excel')).toBeInTheDocument();
    expect(screen.getByText('exportacion.json')).toBeInTheDocument();
    expect(screen.getByText('exportacion.csv')).toBeInTheDocument();
    expect(screen.getByText('exportacion.pdf')).toBeInTheDocument();
  });

  it('clicking Excel button triggers exportXLSX and shows loading state', () => {
    render(<ExportacionInteligente />);
    const excelButton = screen.getByText('exportacion.excel');
    fireEvent.click(excelButton);
    act(() => { vi.advanceTimersByTime(600); });
    expect(mockXLSXWriteFile).toHaveBeenCalledWith(expect.any(Object), 'construsmart-export-2026-07-19.xlsx');
  });

  it('clicking JSON button triggers downloadBlob', () => {
    render(<ExportacionInteligente />);
    const jsonButton = screen.getByText('exportacion.json');
    fireEvent.click(jsonButton);
    act(() => { vi.advanceTimersByTime(400); });
    expect(mockDownloadBlob).toHaveBeenCalled();
    const blobArg = mockDownloadBlob.mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(mockDownloadBlob.mock.calls[0][1]).toBe('construsmart-export-2026-07-19.json');
  });

  it('clicking CSV button triggers downloadBlob', () => {
    render(<ExportacionInteligente />);
    const csvButton = screen.getByText('exportacion.csv');
    fireEvent.click(csvButton);
    act(() => { vi.advanceTimersByTime(600); });
    expect(mockDownloadBlob).toHaveBeenCalled();
    const blobArg = mockDownloadBlob.mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(mockDownloadBlob.mock.calls[0][1]).toBe('construsmart-export-2026-07-19.csv');
  });

  it('clicking PDF button triggers generarPDF', async () => {
    render(<ExportacionInteligente />);
    const pdfButton = screen.getByText('exportacion.pdf');
    fireEvent.click(pdfButton);
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(mockHtml2canvasFn).toHaveBeenCalled();
    expect(mockJsPdfInstance.save).toHaveBeenCalledWith('construsmart-reporte-2026-07-19.pdf');
  });

  it('shows empty state for reportes programados initially', () => {
    render(<ExportacionInteligente />);
    expect(screen.getByText('exportacion.sin_reportes')).toBeInTheDocument();
  });

  it('opens form for nuevo reporte programado', () => {
    render(<ExportacionInteligente />);
    const programarBtn = screen.getByText('exportacion.programar_reporte');
    fireEvent.click(programarBtn);
    expect(screen.getByPlaceholderText('exportacion.nombre_reporte')).toBeInTheDocument();
    expect(screen.getByText('exportacion.programar')).toBeInTheDocument();
  });

  it('form validation: empty nombre shows error', () => {
    render(<ExportacionInteligente />);
    const programarBtn = screen.getByText('exportacion.programar_reporte');
    fireEvent.click(programarBtn);
    const submitBtn = screen.getByText('exportacion.programar');
    fireEvent.click(submitBtn);
    expect(screen.getByText('exportacion.error_nombre')).toBeInTheDocument();
  });

  it('adds reporte programado on valid submission', () => {
    render(<ExportacionInteligente />);
    const programarBtn = screen.getByText('exportacion.programar_reporte');
    fireEvent.click(programarBtn);
    const nombreInput = screen.getByPlaceholderText('exportacion.nombre_reporte');
    fireEvent.change(nombreInput, { target: { value: 'Reporte Semanal' } });
    const submitBtn = screen.getByText('exportacion.programar');
    fireEvent.click(submitBtn);
    expect(screen.getByText('Reporte Semanal')).toBeInTheDocument();
    expect(screen.getByText('exportacion.activo')).toBeInTheDocument();
  });

  it('toggles reporte activo pausado', () => {
    render(<ExportacionInteligente />);
    const programarBtn = screen.getByText('exportacion.programar_reporte');
    fireEvent.click(programarBtn);
    const nombreInput = screen.getByPlaceholderText('exportacion.nombre_reporte');
    fireEvent.change(nombreInput, { target: { value: 'Reporte Mensual' } });
    const submitBtn = screen.getByText('exportacion.programar');
    fireEvent.click(submitBtn);
    const toggleBtn = screen.getByText('exportacion.activo');
    fireEvent.click(toggleBtn);
    expect(screen.getByText('exportacion.pausado')).toBeInTheDocument();
    fireEvent.click(screen.getByText('exportacion.pausado'));
    expect(screen.getByText('exportacion.activo')).toBeInTheDocument();
  });

  it('deletes reporte programado', () => {
    render(<ExportacionInteligente />);
    const programarBtn = screen.getByText('exportacion.programar_reporte');
    fireEvent.click(programarBtn);
    const nombreInput = screen.getByPlaceholderText('exportacion.nombre_reporte');
    fireEvent.change(nombreInput, { target: { value: 'Reporte a Eliminar' } });
    const submitBtn = screen.getByText('exportacion.programar');
    fireEvent.click(submitBtn);
    expect(screen.getByText('Reporte a Eliminar')).toBeInTheDocument();
    const deleteBtn = screen.getByLabelText('exportacion.eliminar_reporte');
    fireEvent.click(deleteBtn);
    expect(screen.queryByText('Reporte a Eliminar')).not.toBeInTheDocument();
    expect(screen.getByText('exportacion.sin_reportes')).toBeInTheDocument();
  });

  it('reportes list shows correct info', () => {
    render(<ExportacionInteligente />);
    const programarBtn = screen.getByText('exportacion.programar_reporte');
    fireEvent.click(programarBtn);
    const nombreInput = screen.getByPlaceholderText('exportacion.nombre_reporte');
    fireEvent.change(nombreInput, { target: { value: 'Reporte Test' } });
    const submitBtn = screen.getByText('exportacion.programar');
    fireEvent.click(submitBtn);
    expect(screen.getByText('Reporte Test')).toBeInTheDocument();
    expect(screen.getByText('exportacion.activo')).toBeInTheDocument();
    expect(screen.getByText('ejecutivo')).toBeInTheDocument();
    expect(screen.getAllByText('JSON').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('semanal')).toBeInTheDocument();
  });

  it('ejecutar ahora triggers export for the report format', () => {
    render(<ExportacionInteligente />);
    const programarBtn = screen.getByText('exportacion.programar_reporte');
    fireEvent.click(programarBtn);
    const nombreInput = screen.getByPlaceholderText('exportacion.nombre_reporte');
    fireEvent.change(nombreInput, { target: { value: 'Ejecutar Reporte' } });
    const submitBtn = screen.getByText('exportacion.programar');
    fireEvent.click(submitBtn);
    const ejecutarBtn = screen.getByText('exportacion.ejecutar');
    fireEvent.click(ejecutarBtn);
    act(() => { vi.advanceTimersByTime(400); });
    expect(mockDownloadBlob).toHaveBeenCalled();
    expect(mockDownloadBlob.mock.calls[0][1]).toContain('.json');
  });

  it('shows empty data export with no proyectos', () => {
    mockUseErp.proyectos = [];
    render(<ExportacionInteligente />);
    const jsonButton = screen.getByText('exportacion.json');
    fireEvent.click(jsonButton);
    act(() => { vi.advanceTimersByTime(400); });
    expect(mockDownloadBlob).toHaveBeenCalled();
  });

  it('shows empty data export with no movimientos', () => {
    mockUseErp.movimientos = [];
    render(<ExportacionInteligente />);
    const jsonButton = screen.getByText('exportacion.json');
    fireEvent.click(jsonButton);
    act(() => { vi.advanceTimersByTime(400); });
    expect(mockDownloadBlob).toHaveBeenCalled();
  });

  it('cancels reporte form when cancel is clicked', () => {
    render(<ExportacionInteligente />);
    const programarBtn = screen.getByText('exportacion.programar_reporte');
    fireEvent.click(programarBtn);
    expect(screen.getByPlaceholderText('exportacion.nombre_reporte')).toBeInTheDocument();
    const cancelBtn = screen.getByText('common.cancelar');
    fireEvent.click(cancelBtn);
    expect(screen.queryByPlaceholderText('exportacion.nombre_reporte')).not.toBeInTheDocument();
  });

  it('disables export button while exporting', () => {
    render(<ExportacionInteligente />);
    const jsonButton = screen.getByText('exportacion.json');
    const parentButton = jsonButton.closest('button');
    expect(parentButton).not.toBeDisabled();
    fireEvent.click(jsonButton);
    expect(parentButton).toBeDisabled();
    act(() => { vi.advanceTimersByTime(400); });
    expect(parentButton).not.toBeDisabled();
  });
});
