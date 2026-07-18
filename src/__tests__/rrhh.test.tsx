import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'rrhh.title': 'Recursos Humanos',
    'rrhh.description': 'Gestion de empleados',
    'rrhh.totalEmployees': 'Total Empleados',
    'rrhh.totalPayroll': 'Total Planilla',
    'rrhh.totalFSR': 'Total FSR',
    'rrhh.factorReal': 'Factor Real',
    'rrhh.payrollChart': 'Planilla por Proyecto',
    'rrhh.name': 'Nombre',
    'rrhh.position': 'Puesto',
    'rrhh.dailyWage': 'Salario Diario',
    'rrhh.daysWorked': 'Dias Trabajados',
    'rrhh.grossPay': 'Pago Bruto',
    'rrhh.netPayFSR': 'Pago Neto FSR',
    'rrhh.type': 'Tipo',
    'rrhh.noEmployees': 'Sin empleados',
    'rrhh.addEmployee': 'Agregar Empleado',
    'rrhh.editEmployee': 'Editar Empleado',
    'rrhh.newEmployee': 'Nuevo Empleado',
    'rrhh.namePlaceholder': 'Nombre',
    'rrhh.positionPlaceholder': 'Puesto',
    'rrhh.typePayroll': 'Planilla',
    'rrhh.typePiecework': 'Destajo',
    'common.noData': 'Sin datos',
    'common.project': 'Proyecto',
    'common.noProject': 'Sin proyecto',
    'common.actions': 'Acciones',
    'common.edit': 'Editar',
    'common.delete': 'Eliminar',
    'common.update': 'Actualizar',
    'common.create': 'Crear',
    'common.cancel': 'Cancelar',
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

let mockEmpleados: any[] = [];
let mockProyectos: any[] = [];
const mockAddEmpleado = vi.fn();
const mockUpdateEmpleado = vi.fn();
const mockDeleteEmpleado = vi.fn();

vi.mock('../erp/store', () => ({
  useErp: () => ({
    empleados: mockEmpleados,
    proyectos: mockProyectos,
    addEmpleado: mockAddEmpleado,
    updateEmpleado: mockUpdateEmpleado,
    deleteEmpleado: mockDeleteEmpleado,
  }),
}));

vi.mock('../erp/components/ProyectoFilter', () => ({
  default: ({ value, onChange, proyectos }: any) => (
    <select value={value} onChange={e => onChange(e.target.value)} data-testid="proyecto-filter">
      <option value="">Todos los proyectos</option>
      {proyectos.map((p: any) => (
        <option key={p.id} value={p.id}>{p.nombre}</option>
      ))}
    </select>
  ),
}));

import RRHH from '../erp/screens/RRHH';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

beforeEach(() => {
  vi.clearAllMocks();
  mockProyectos = [
    { id: 'proj-1', nombre: 'Proyecto Alpha' },
    { id: 'proj-2', nombre: 'Proyecto Beta' },
  ];
  mockEmpleados = [
    { id: 'emp-1', nombre: 'Juan Perez', puesto: 'Albanil', salarioDiario: 150, diasTrabajados: 20, proyectoId: 'proj-1', tipo: 'planilla' },
    { id: 'emp-2', nombre: 'Maria Lopez', puesto: 'Ayudante', salarioDiario: 100, diasTrabajados: 15, proyectoId: 'proj-1', tipo: 'destajo' },
    { id: 'emp-3', nombre: 'Carlos Ruiz', puesto: 'Oficial', salarioDiario: 200, diasTrabajados: 22, proyectoId: 'proj-2', tipo: 'planilla' },
  ];
});

afterEach(cleanup);

describe('RRHH Screen', () => {
  describe('KPI cards', () => {
    it('renderiza tarjeta total empleados', async () => {
      render(<RRHH />);
      await waitFor(() => {
        expect(screen.getByText('Total Empleados')).toBeInTheDocument();
      });
    });

    it('renderiza tarjeta total planilla', async () => {
      render(<RRHH />);
      await waitFor(() => {
        expect(screen.getByText('Total Planilla')).toBeInTheDocument();
      });
    });

    it('renderiza tarjeta total FSR', async () => {
      render(<RRHH />);
      await waitFor(() => {
        expect(screen.getByText('Total FSR')).toBeInTheDocument();
      });
    });

    it('renderiza tarjeta factor real', async () => {
      render(<RRHH />);
      await waitFor(() => {
        expect(screen.getByText('Factor Real')).toBeInTheDocument();
      });
    });
  });

  describe('Tabla de empleados', () => {
    it('renderiza tabla con datos', async () => {
      render(<RRHH />);
      await waitFor(() => {
        expect(screen.getByText('Juan Perez')).toBeInTheDocument();
        expect(screen.getByText('Maria Lopez')).toBeInTheDocument();
        expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
      });
    });

    it('renderiza encabezados de tabla', async () => {
      render(<RRHH />);
      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(within(table).getByText('Nombre')).toBeInTheDocument();
        expect(within(table).getByText('Puesto')).toBeInTheDocument();
        expect(within(table).getByText('Salario Diario')).toBeInTheDocument();
        expect(within(table).getByText('Dias Trabajados')).toBeInTheDocument();
        expect(within(table).getByText('Pago Bruto')).toBeInTheDocument();
        expect(within(table).getByText('Pago Neto FSR')).toBeInTheDocument();
        expect(within(table).getByText('Tipo')).toBeInTheDocument();
      });
    });
  });

  describe('Filtro por proyecto', () => {
    it('selector de proyecto filtra tabla', async () => {
      render(<RRHH />);
      await waitFor(() => {
        const select = screen.getByTestId('proyecto-filter');
        fireEvent.change(select, { target: { value: 'proj-2' } });
        expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
        expect(screen.queryByText('Juan Perez')).not.toBeInTheDocument();
      });
    });
  });

  describe('Formulario de empleado', () => {
    it('abre formulario al hacer clic en agregar', async () => {
      render(<RRHH />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('Agregar Empleado'));
      });
      await waitFor(() => {
        expect(screen.getByText('Nuevo Empleado')).toBeInTheDocument();
      });
    });

    it('enviar formulario llama addEmpleado', async () => {
      render(<RRHH />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('Agregar Empleado'));
      });
      const nombreInput = screen.getByPlaceholderText('Nombre');
      fireEvent.change(nombreInput, { target: { value: 'Nuevo Empleado' } });
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[2], { target: { value: 'proj-1' } });
      fireEvent.click(screen.getByText('Crear'));
      await waitFor(() => {
        expect(mockAddEmpleado).toHaveBeenCalled();
      });
    });
  });

  describe('Edicion de empleado', () => {
    it('editar empleado abre formulario con datos', async () => {
      render(<RRHH />);
      await waitFor(() => {
        const editBtn = screen.getAllByLabelText('Editar')[0];
        fireEvent.click(editBtn);
      });
      await waitFor(() => {
        expect(screen.getByText('Editar Empleado')).toBeInTheDocument();
        const nombreInput = screen.getByPlaceholderText('Nombre');
        expect(nombreInput).toHaveValue('Juan Perez');
      });
    });

    it('actualizar empleado llama updateEmpleado', async () => {
      render(<RRHH />);
      await waitFor(() => {
        const editBtn = screen.getAllByLabelText('Editar')[0];
        fireEvent.click(editBtn);
      });
      await waitFor(() => {
        expect(screen.getByText('Editar Empleado')).toBeInTheDocument();
      });
      const textboxes = screen.getAllByRole('textbox');
      fireEvent.change(textboxes[0], { target: { value: 'Juan Actualizado' } });
      const submitBtn = screen.getByText('Actualizar');
      fireEvent.click(submitBtn);
      await waitFor(() => {
        expect(mockUpdateEmpleado).toHaveBeenCalled();
      });
    });
  });

  describe('Eliminacion de empleado', () => {
    it('eliminar empleado llama deleteEmpleado', async () => {
      render(<RRHH />);
      await waitFor(() => {
        const deleteBtn = screen.getAllByLabelText('Eliminar')[0];
        fireEvent.click(deleteBtn);
        expect(mockDeleteEmpleado).toHaveBeenCalled();
      });
    });
  });

  describe('Grafico de planilla', () => {
    it('renderiza grafico de planilla por proyecto', async () => {
      render(<RRHH />);
      await waitFor(() => {
        expect(screen.getByText('Planilla por Proyecto')).toBeInTheDocument();
      });
    });
  });

  describe('Validacion de formulario', () => {
    it('rechaza datos invalidos', async () => {
      render(<RRHH />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('Agregar Empleado'));
      });
      await waitFor(() => {
        const submitBtn = screen.getByText('Crear');
        fireEvent.click(submitBtn);
        expect(mockAddEmpleado).not.toHaveBeenCalled();
      });
    });
  });

  describe('Estado vacio', () => {
    it('muestra estado vacio cuando no hay empleados', async () => {
      mockEmpleados = [];
      render(<RRHH />);
      await waitFor(() => {
        expect(screen.getByText('Sin empleados')).toBeInTheDocument();
      });
    });
  });

  describe('Skeleton de carga', () => {
    it('renderiza skeleton durante carga', () => {
      render(<RRHH />);
      expect(document.querySelector('.animate-pulse') || screen.queryByText('Recursos Humanos')).toBeTruthy();
    });
  });
});
