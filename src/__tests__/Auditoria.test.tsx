import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Auditoria from '../erp/screens/Auditoria';

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
    'auditoria.titulo': 'Auditoría de Cambios',
    'auditoria.subtitulo': '{{total}} cambios registrados · {{creations}} creaciones · {{updates}} actualizaciones · {{deletes}} eliminaciones',
    'auditoria.exportar_csv': 'Exportar CSV',
    'auditoria.buscar_placeholder': 'Buscar por entidad, ID o usuario',
    'auditoria.filtro_tabla': 'Tabla',
    'auditoria.filtro_usuario': 'Usuario',
    'auditoria.filtro_operacion': 'Operación',
    'auditoria.columna_fecha': 'Fecha',
    'auditoria.columna_usuario': 'Usuario',
    'auditoria.columna_tabla': 'Tabla',
    'auditoria.columna_operacion': 'Operación',
    'auditoria.columna_id': 'ID Registro',
    'auditoria.columna_detalles': 'Detalles',
    'auditoria.operacion_creacion': 'Creación',
    'auditoria.operacion_actualizacion': 'Actualización',
    'auditoria.operacion_eliminacion': 'Eliminación',
    'auditoria.ver': 'Ver',
    'auditoria.detalle_titulo': 'Detalle de Cambio: {{id}}',
    'auditoria.cerrar': 'Cerrar',
    'auditoria.datos_anteriores': 'Datos Anteriores',
    'auditoria.datos_nuevos': 'Datos Nuevos',
    'auditoria.sin_resultados': 'No hay cambios que coincidan con los filtros',
    'auditoria.total_paginacion': 'Total {{total}} cambios',
    'auditoria.total': 'Total Cambios',
    'auditoria.creaciones': 'Creaciones',
    'auditoria.actualizaciones': 'Actualizaciones',
    'auditoria.eliminaciones': 'Eliminaciones',
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

const mockAuditLog = [
  {
    id: 'audit-1',
    usuarioNombre: 'Admin',
    accion: 'creación_proyecto',
    entidad: 'Proyecto',
    entidadId: 'proj-1',
    valoresAnteriores: {},
    valoresNuevos: { nombre: 'Proyecto Alpha', estado: 'planeacion' },
    createdAt: '2024-06-01T10:00:00Z',
  },
  {
    id: 'audit-2',
    usuarioNombre: 'Admin',
    accion: 'actualización_proyecto',
    entidad: 'Proyecto',
    entidadId: 'proj-1',
    valoresAnteriores: { estado: 'planeacion' },
    valoresNuevos: { estado: 'ejecucion' },
    createdAt: '2024-06-02T11:00:00Z',
  },
  {
    id: 'audit-3',
    usuarioNombre: 'Usuario1',
    accion: 'creación_material',
    entidad: 'Material',
    entidadId: 'mat-1',
    valoresAnteriores: {},
    valoresNuevos: { nombre: 'Cemento', cantidad: 100 },
    createdAt: '2024-06-03T12:00:00Z',
  },
  {
    id: 'audit-4',
    usuarioNombre: 'Admin',
    accion: 'eliminación_orden',
    entidad: 'OrdenCompra',
    entidadId: 'oc-1',
    valoresAnteriores: { total: 5000 },
    valoresNuevos: {},
    createdAt: '2024-06-04T14:00:00Z',
  },
  {
    id: 'audit-5',
    usuarioNombre: 'Usuario1',
    accion: 'cambio_estado',
    entidad: 'Proyecto',
    entidadId: 'proj-2',
    valoresAnteriores: { estado: 'pausado' },
    valoresNuevos: { estado: 'ejecucion', motivoPausa: 'Receso por lluvias' },
    createdAt: '2024-06-05T09:00:00Z',
  },
];

vi.mock('../erp/store', () => ({
  useErp: () => ({
    auditLog: mockAuditLog,
  }),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  const MockSelect = ({ value, onChange, placeholder, style, className, ...props }: any) => (
    <select
      value={value ?? ''}
      onChange={e => onChange?.(e.target.value === '' ? null : e.target.value)}
      data-testid={`mock-select-${(placeholder || 'none') as string}`}
      style={style}
      className={className}
      {...props}
    >
      <option value="">{placeholder}</option>
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

describe('Auditoria Screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el título y KPIs correctamente', () => {
    render(<Auditoria />);
    expect(screen.getByText('Auditoría de Cambios')).toBeInTheDocument();
    expect(screen.getByText('Total Cambios')).toBeInTheDocument();
    expect(screen.getByText('Exportar CSV')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    const creacionesVal = screen.getAllByText('2');
    expect(creacionesVal.length).toBeGreaterThanOrEqual(1);
  });

  it('debe mostrar el subtítulo con métricas', () => {
    render(<Auditoria />);
    expect(screen.getByText(/5 cambios registrados/)).toBeInTheDocument();
    expect(screen.getByText(/2 creaciones/)).toBeInTheDocument();
  });

  it('debe mostrar tabla con entidades únicas', () => {
    render(<Auditoria />);
    const materiales = screen.getAllByText('Material');
    expect(materiales.length).toBeGreaterThanOrEqual(1);
    const ordenes = screen.getAllByText('OrdenCompra');
    expect(ordenes.length).toBeGreaterThanOrEqual(1);
  });

  it('debe mostrar los nombres de usuario en la tabla', () => {
    render(<Auditoria />);
    const admins = screen.getAllByText('Admin');
    expect(admins.length).toBeGreaterThanOrEqual(1);
    const users = screen.getAllByText('Usuario1');
    expect(users.length).toBeGreaterThanOrEqual(1);
  });

  it('debe renderizar el botón Exportar CSV', () => {
    render(<Auditoria />);
    const csvButtons = screen.getAllByRole('button', { name: 'Exportar CSV' });
    expect(csvButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('debe filtrar por búsqueda de texto', () => {
    render(<Auditoria />);
    const searchInput = screen.getByPlaceholderText('Buscar por entidad, ID o usuario');
    fireEvent.change(searchInput, { target: { value: 'Material' } });
    expect(screen.queryByText('OrdenCompra')).not.toBeInTheDocument();
  });

  it('debe filtrar por búsqueda de usuario', () => {
    render(<Auditoria />);
    const searchInput = screen.getByPlaceholderText('Buscar por entidad, ID o usuario');
    fireEvent.change(searchInput, { target: { value: 'Usuario1' } });
    expect(screen.queryByText('OrdenCompra')).not.toBeInTheDocument();
  });

  it('debe mostrar los botones Ver en la tabla', () => {
    render(<Auditoria />);
    const verButtons = screen.getAllByRole('button', { name: 'Ver' });
    expect(verButtons.length).toBe(5);
  });

  it('debe mostrar el filtro de operación funcionando', () => {
    render(<Auditoria />);
    const opSelect = screen.getByTestId('mock-select-Operación');
    fireEvent.change(opSelect, { target: { value: 'Creación' } });
    const creationTags = screen.getAllByText('Creación');
    expect(creationTags.length).toBeGreaterThanOrEqual(1);
  });

  it('debe mostrar tags con la etiqueta correcta según operación', () => {
    render(<Auditoria />);
    const creationTags = screen.getAllByText('Creación');
    expect(creationTags.length).toBeGreaterThanOrEqual(1);
    const updateTags = screen.getAllByText('Actualización');
    expect(updateTags.length).toBeGreaterThanOrEqual(1);
    const deleteTags = screen.getAllByText('Eliminación');
    expect(deleteTags.length).toBeGreaterThanOrEqual(1);
  });

  it('debe exportar CSV al hacer clic en el botón', () => {
    const createObjectURL = vi.fn(() => 'blob:url');
    const revokeObjectURL = vi.fn();
    window.URL.createObjectURL = createObjectURL;
    window.URL.revokeObjectURL = revokeObjectURL;

    render(<Auditoria />);
    const csvButtons = screen.getAllByRole('button', { name: 'Exportar CSV' });
    fireEvent.click(csvButtons[0]);

    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
  });

  it('debe mostrar mensaje vacío cuando no hay datos tras filtrar', () => {
    render(<Auditoria />);
    const searchInput = screen.getByPlaceholderText('Buscar por entidad, ID o usuario');
    fireEvent.change(searchInput, { target: { value: 'xyz_no_existe' } });
    expect(screen.getByText('No hay cambios que coincidan con los filtros')).toBeInTheDocument();
  });
});
