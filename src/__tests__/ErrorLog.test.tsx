import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ErrorLog from '../erp/screens/ErrorLog';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

vi.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'error_log.titulo': 'Log de Errores',
    'error_log.total_errores': 'Total Errores',
    'error_log.abiertos': 'Abiertos',
    'error_log.resueltos': 'Resueltos',
    'error_log.criticos': 'Críticos',
    'error_log.buscar_placeholder': 'Buscar por mensaje, código o componente',
    'error_log.filtro_severidad': 'Severidad',
    'error_log.filtro_estado': 'Estado',
    'error_log.abierto': 'Abierto',
    'error_log.resuelto': 'Resuelto',
    'error_log.ver': 'Ver',
    'error_log.resolver': 'Resolver',
    'error_log.exportar_csv': 'Exportar CSV',
    'error_log.limpiar_antiguos': 'Limpiar Antiguos (> {{dias}} días)',
    'error_log.marcar_resuelto': 'Marcar como Resuelto',
    'error_log.sin_resultados': 'No hay errores que coincidan con los filtros',
    'error_log.columna_id': 'ID',
    'error_log.columna_tipo': 'Tipo',
    'error_log.columna_severidad': 'Severidad',
    'error_log.columna_estado': 'Estado',
    'error_log.columna_mensaje': 'Mensaje',
    'error_log.columna_componente': 'Componente',
    'error_log.columna_proyecto': 'Proyecto',
    'error_log.columna_fecha': 'Fecha',
    'error_log.columna_acciones': 'Acciones',
    'error_log.subtitulo': '{{total}} total · {{open}} abiertos · {{resolved}} resueltos · {{critical}} críticos',
    'error_log.total_paginacion': 'Total {{total}} errores',
    'error_log.detalle_titulo': 'Detalle de Error: {{id}}',
    'error_log.cerrar': 'Cerrar',
    'error_log.detalle_fecha_resolucion': 'Fecha de Resolución',
    'error_log.notas_resolucion': 'Notas de resolución (opcional):',
    'error_log.eliminar_dias': 'Eliminar errores resueltos más antiguos de (días):',
    'error_log.severidad_critico': 'Crítico',
    'error_log.severidad_error': 'Error',
    'error_log.severidad_advertencia': 'Advertencia',
    'error_log.severidad_info': 'Info',
    'error_log.severidad_debug': 'Debug',
    'error_log.resolver_seleccionados': 'Resolver Seleccionados ({{count}})',
    'error_log.eliminar_seleccionados': 'Eliminar Seleccionados ({{count}})',
    'error_log.detalle_id': 'ID',
    'error_log.detalle_severidad': 'Severidad',
    'error_log.detalle_estado': 'Estado',
    'error_log.detalle_fecha': 'Fecha',
    'error_log.detalle_componente': 'Componente',
    'error_log.detalle_funcion': 'Función',
    'error_log.detalle_proyecto': 'Proyecto',
    'error_log.detalle_mensaje': 'Mensaje de Error',
    'error_log.detalle_contexto': 'Contexto',
    'error_log.detalle_stack': 'Stack Trace',
    'error_log.detalle_resuelto_por': 'Resuelto Por',
    'error_log.detalle_notas': 'Notas de Resolución',
    'error_log.resolver_modal_titulo': 'Resolver Error',
    'error_log.resolver_modal_notas_label': 'Notas de resolución:',
    'error_log.resolver_modal_notas_placeholder': 'Describe cómo se resolvió el error...',
    'error_log.resolver_modal_cancelar': 'Cancelar',
    'error_log.resolver_modal_confirmar': 'Resolver',
  };
  return {
    useTranslation: () => ({
      t: (key: string, params?: Record<string, string | number>) => {
        let text = translations[key] || key;
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            text = text.replace(`{{${k}}}`, String(v));
          }
        }
        return text;
      },
      i18n: { language: 'es', changeLanguage: vi.fn() },
    }),
  };
});

const mockResolveError = vi.fn();
const mockDeleteError = vi.fn();
const mockCleanupOldErrors = vi.fn();

const mockProyectos = [
  { id: 'proj-1', nombre: 'Proyecto A' },
  { id: 'proj-2', nombre: 'Proyecto B' },
];

const mockErrorLogs = [
  {
    id: 'error-1',
    errorMessage: 'Error de validación',
    severity: 'error',
    resolved: false,
    createdAt: '2024-01-15T10:00:00Z',
    context: { origen: 'Función de prueba' },
    entidad: 'Proyecto',
    entidadId: 'proj-1',
    proyectoId: 'proj-1',
  },
  {
    id: 'error-2',
    errorMessage: 'Advertencia de stock',
    severity: 'warning',
    resolved: false,
    createdAt: '2024-01-16T11:00:00Z',
    context: { origen: 'Bodega' },
    entidad: 'Material',
    entidadId: 'mat-1',
  },
  {
    id: 'error-3',
    errorMessage: 'Error crítico',
    severity: 'critical',
    resolved: false,
    createdAt: '2024-01-17T12:00:00Z',
    context: { origen: 'Sistema' },
  },
  {
    id: 'error-4',
    errorMessage: 'Error resuelto',
    severity: 'error',
    resolved: true,
    createdAt: '2024-01-14T09:00:00Z',
    resolvedAt: '2024-01-14T10:00:00Z',
    resolutionNotes: 'Fue un falso positivo',
  },
];

vi.mock('../erp/store', () => ({
  useErp: () => ({
    errorLogs: mockErrorLogs,
    resolveError: mockResolveError,
    deleteError: mockDeleteError,
    cleanupOldErrors: mockCleanupOldErrors,
    proyectos: mockProyectos,
  }),
}));

vi.mock('../erp/components/ProyectoFilter', () => ({
  default: ({ proyectos, selectedProyectoId, onChange, className }: any) => (
    <select
      value={selectedProyectoId}
      onChange={e => onChange(e.target.value)}
      className={className}
      data-testid="proyecto-filter"
    >
      <option value="">Todos los proyectos</option>
      {proyectos.map((p: any) => (
        <option key={p.id} value={p.id}>{p.nombre}</option>
      ))}
    </select>
  ),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  const MockSelect = ({ value, onChange, placeholder, options, style, className, allowClear, ...props }: any) => (
    <select
      value={value ?? ''}
      onChange={e => onChange?.(e.target.value === '' ? null : e.target.value)}
      data-testid="mock-select"
      style={style}
      className={className}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options?.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
  return {
    ...actual,
    Select: MockSelect,
    DatePicker: {
      ...actual.DatePicker,
      RangePicker: () => <div data-testid="mock-range-picker" />,
    },
  };
});

describe('ErrorLog Screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.prompt = vi.fn();
  });

  it('debe renderizar el título y estadísticas correctamente', () => {
    render(<ErrorLog />);

    expect(screen.getByText('Log de Errores')).toBeInTheDocument();
    expect(screen.getByText(/4 total/)).toBeInTheDocument();
    expect(screen.getByText(/3 abiertos/)).toBeInTheDocument();
    expect(screen.getByText(/1 resueltos/)).toBeInTheDocument();
  });

  it('debe mostrar las tarjetas de estadísticas', () => {
    render(<ErrorLog />);

    expect(screen.getByText('Total Errores')).toBeInTheDocument();
    expect(screen.getByText('Abiertos')).toBeInTheDocument();
    expect(screen.getByText('Resueltos')).toBeInTheDocument();
    expect(screen.getByText('Críticos')).toBeInTheDocument();
  });

  it('debe mostrar todos los errores inicialmente', () => {
    render(<ErrorLog />);

    expect(screen.getByText('Error de validación')).toBeInTheDocument();
    expect(screen.getByText('Advertencia de stock')).toBeInTheDocument();
    expect(screen.getByText('Error crítico')).toBeInTheDocument();
    expect(screen.getByText('Error resuelto')).toBeInTheDocument();
  });

  it('debe filtrar por severidad', async () => {
    render(<ErrorLog />);

    const severitySelect = screen.getByDisplayValue('Severidad');
    fireEvent.change(severitySelect, { target: { value: 'error' } });

    await waitFor(() => {
      expect(screen.getByText('Error de validación')).toBeInTheDocument();
      expect(screen.queryByText('Advertencia de stock')).not.toBeInTheDocument();
      expect(screen.queryByText('Error crítico')).not.toBeInTheDocument();
    });
  });

  it('debe filtrar por estado (pendientes)', async () => {
    render(<ErrorLog />);

    const estadoSelect = screen.getByDisplayValue('Estado');
    fireEvent.change(estadoSelect, { target: { value: 'open' } });

    await waitFor(() => {
      expect(screen.getByText('Error de validación')).toBeInTheDocument();
      expect(screen.queryByText('Error resuelto')).not.toBeInTheDocument();
    });
  });

  it('debe filtrar por estado (resueltos)', async () => {
    render(<ErrorLog />);

    const estadoSelect = screen.getByDisplayValue('Estado');
    fireEvent.change(estadoSelect, { target: { value: 'resolved' } });

    await waitFor(() => {
      expect(screen.getByText('Error resuelto')).toBeInTheDocument();
      expect(screen.queryByText('Error de validación')).not.toBeInTheDocument();
    });
  });

  it('debe filtrar por búsqueda de texto', async () => {
    render(<ErrorLog />);

    const searchInput = screen.getByPlaceholderText('Buscar por mensaje, código o componente');
    fireEvent.change(searchInput, { target: { value: 'validación' } });

    await waitFor(() => {
      expect(screen.getByText('Error de validación')).toBeInTheDocument();
      expect(screen.queryByText('Advertencia de stock')).not.toBeInTheDocument();
    });
  });

  it('debe filtrar por proyecto', async () => {
    render(<ErrorLog />);

    const proyectoFilter = screen.getByTestId('proyecto-filter');
    fireEvent.change(proyectoFilter, { target: { value: 'proj-1' } });

    await waitFor(() => {
      expect(screen.getByText('Error de validación')).toBeInTheDocument();
      expect(screen.queryByText('Advertencia de stock')).not.toBeInTheDocument();
    });
  });

  it('debe mostrar mensaje cuando no hay errores que coincidan con filtros', async () => {
    render(<ErrorLog />);

    const searchInput = screen.getByPlaceholderText('Buscar por mensaje, código o componente');
    fireEvent.change(searchInput, { target: { value: 'texto que no existe' } });

    await waitFor(() => {
      expect(screen.getByText('No hay errores que coincidan con los filtros')).toBeInTheDocument();
    });
  });

  it('debe llamar resolveError cuando se hace clic en el botón de resolver', async () => {
    render(<ErrorLog />);

    const resolveButtons = screen.getAllByRole('button', { name: /marcar como resuelto/i });
    fireEvent.click(resolveButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Resolver Error')).toBeInTheDocument();
    });

    const textareas = screen.getAllByRole('textbox');
    const resolveTextarea = textareas[textareas.length - 1];
    fireEvent.change(resolveTextarea, { target: { value: 'Resolución de prueba' } });

    const confirmButton = screen.getByRole('button', { name: 'Resolver' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockResolveError).toHaveBeenCalledWith(expect.any(String), 'Resolución de prueba');
    });
  });

  it('debe llamar deleteError cuando se selecciona una fila y se hace clic en eliminar', async () => {
    render(<ErrorLog />);

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[checkboxes.length - 1]);
    const deleteButton = screen.getByRole('button', { name: /eliminar seleccionados/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteError).toHaveBeenCalledWith(expect.any(String));
    });
  });

  it('debe llamar cleanupOldErrors cuando se hace clic en el botón de limpiar antiguos', async () => {
    window.prompt = vi.fn().mockReturnValue('30');
    render(<ErrorLog />);

    const cleanupButton = screen.getByText(/Limpiar Antiguos/);
    fireEvent.click(cleanupButton);

    await waitFor(() => {
      expect(window.prompt).toHaveBeenCalledWith('Eliminar errores resueltos más antiguos de (días):', '30');
      expect(mockCleanupOldErrors).toHaveBeenCalledWith(30);
    });
  });

  it('debe mostrar la etiqueta "Resuelto" en errores resueltos', () => {
    render(<ErrorLog />);

    const resolvedLabels = screen.getAllByText('Resuelto');
    expect(resolvedLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('debe mostrar notas de resolución en el modal de detalle', async () => {
    render(<ErrorLog />);

    const verButtons = screen.getAllByRole('button', { name: /^Ver Detalle/ });
    fireEvent.click(verButtons[verButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Fue un falso positivo')).toBeInTheDocument();
    });
  });

  it('debe mostrar el nombre del proyecto cuando existe proyectoId', () => {
    render(<ErrorLog />);

    const projectCells = screen.getAllByRole('cell', { name: 'Proyecto A' });
    expect(projectCells.length).toBeGreaterThanOrEqual(1);
  });

  it('debe mostrar fechas formateadas', () => {
    render(<ErrorLog />);

    const dates = screen.getAllByText(/ene/);
    expect(dates.length).toBe(4);
  });

  it('debe mostrar fecha de resolución en el modal de detalle', async () => {
    render(<ErrorLog />);

    const verButtons = screen.getAllByRole('button', { name: /^Ver Detalle/ });
    fireEvent.click(verButtons[verButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Fecha de Resolución')).toBeInTheDocument();
    });
  });

  it('debe aplicar opacidad reducida a errores resueltos', () => {
    render(<ErrorLog />);

    const resolvedRow = screen.getByText('Error resuelto').closest('.opacity-60');
    expect(resolvedRow).not.toBeNull();
  });
});
