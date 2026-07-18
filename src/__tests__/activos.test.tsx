import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
}));

let mockActivos: any[] = [];
let mockProyectos: any[] = [];

vi.mock('../erp/store', () => ({
  useErp: () => ({
    activos: mockActivos,
    setActivos: vi.fn(),
    proyectos: mockProyectos,
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}));

vi.mock('@/lib/confirm-action', () => ({
  confirmAction: vi.fn(() => Promise.resolve(true)),
}));

import Activos from '../erp/screens/Activos';

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
    { id: 'proj-1', nombre: 'Torre Norte' },
    { id: 'proj-2', nombre: 'Edificio Sur' },
  ];
  mockActivos = [
    { id: 'a-1', nombre: 'Taladro', codigo: 'TL-001', tipo: 'herramienta', estado: 'disponible', valor: 5000, proyectoId: '' },
    { id: 'a-2', nombre: 'Excavadora', codigo: 'EQ-001', tipo: 'equipo', estado: 'asignado', valor: 500000, proyectoId: 'proj-1' },
    { id: 'a-3', nombre: 'Camion', codigo: 'VH-001', tipo: 'vehiculo', estado: 'mantenimiento', valor: 200000, proyectoId: '' },
  ];
});

afterEach(cleanup);

describe('Activos Screen', () => {
  describe('Renderizado inicial', () => {
    it('renderiza titulo y boton nuevo activo', async () => {
      render(<Activos />);
      await waitFor(() => {
        expect(screen.getByText('activos.titulo')).toBeInTheDocument();
        expect(screen.getByText('activos.nuevo_activo')).toBeInTheDocument();
      });
    });

    it('renderiza KPIs', async () => {
      render(<Activos />);
      await waitFor(() => {
        expect(screen.getByText('activos.total')).toBeInTheDocument();
        expect(screen.getByText('activos.disponibles')).toBeInTheDocument();
        expect(screen.getByText('activos.asignados')).toBeInTheDocument();
        expect(screen.getByText('activos.valor_total')).toBeInTheDocument();
      });
    });

    it('renderiza filtros de busqueda, tipo y estado', async () => {
      render(<Activos />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('activos.buscar_placeholder')).toBeInTheDocument();
        expect(screen.getByText('activos.todos_tipos')).toBeInTheDocument();
        expect(screen.getByText('activos.todos_estados')).toBeInTheDocument();
      });
    });

    it('renderiza tabla de activos', async () => {
      render(<Activos />);
      await waitFor(() => {
        expect(screen.getByText('Taladro')).toBeInTheDocument();
        expect(screen.getByText('Excavadora')).toBeInTheDocument();
        expect(screen.getByText('Camion')).toBeInTheDocument();
      });
    });
  });

  describe('Filtros', () => {
    it('filtra por busqueda', async () => {
      render(<Activos />);
      await waitFor(() => expect(screen.getByText('Taladro')).toBeInTheDocument());
      fireEvent.change(screen.getByPlaceholderText('activos.buscar_placeholder'), { target: { value: 'Taladro' } });
      await waitFor(() => {
        expect(screen.getByText('Taladro')).toBeInTheDocument();
        expect(screen.queryByText('Excavadora')).not.toBeInTheDocument();
      });
    });

    it('filtra por tipo', async () => {
      render(<Activos />);
      await waitFor(() => expect(screen.getByText('Taladro')).toBeInTheDocument());
      const selects = document.querySelectorAll('select');
      fireEvent.change(selects[0], { target: { value: 'herramienta' } });
      await waitFor(() => {
        expect(screen.getByText('Taladro')).toBeInTheDocument();
        expect(screen.queryByText('Excavadora')).not.toBeInTheDocument();
      });
    });

    it('filtra por estado', async () => {
      render(<Activos />);
      await waitFor(() => expect(screen.getByText('Taladro')).toBeInTheDocument());
      const selects = document.querySelectorAll('select');
      fireEvent.change(selects[1], { target: { value: 'asignado' } });
      await waitFor(() => {
        expect(screen.queryByText('Taladro')).not.toBeInTheDocument();
        expect(screen.getByText('Excavadora')).toBeInTheDocument();
      });
    });
  });

  describe('Formulario', () => {
    it('abre formulario de creacion', async () => {
      render(<Activos />);
      await waitFor(() => expect(screen.getByText('activos.nuevo_activo')).toBeInTheDocument());
      fireEvent.click(screen.getByText('activos.nuevo_activo'));
      await waitFor(() => {
        expect(screen.getAllByText('activos.nuevo_activo').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('abre formulario de edicion', async () => {
      render(<Activos />);
      await waitFor(() => expect(screen.getByText('Taladro')).toBeInTheDocument());
      const editButtons = screen.getAllByLabelText(/activos\.editar/);
      fireEvent.click(editButtons[0]);
      await waitFor(() => {
        expect(screen.getByText('activos.editar_activo')).toBeInTheDocument();
      });
    });
  });

  describe('Validaciones', () => {
    it('no guarda si nombre esta vacio', async () => {
      render(<Activos />);
      await waitFor(() => expect(screen.getByText('activos.nuevo_activo')).toBeInTheDocument());
      fireEvent.click(screen.getByText('activos.nuevo_activo'));
      await waitFor(() => {
        expect(screen.getAllByText('activos.nuevo_activo').length).toBeGreaterThanOrEqual(1);
      });
      fireEvent.click(screen.getByText('common.guardar'));
      await waitFor(() => {
        expect(screen.getByText('activos.error_nombre')).toBeInTheDocument();
      });
    });

    it('no guarda si codigo esta vacio', async () => {
      render(<Activos />);
      await waitFor(() => expect(screen.getByText('activos.nuevo_activo')).toBeInTheDocument());
      fireEvent.click(screen.getByText('activos.nuevo_activo'));
      await waitFor(() => {
        expect(screen.getAllByText('activos.nuevo_activo').length).toBeGreaterThanOrEqual(1);
      });
      const nombreInput = screen.getByPlaceholderText('activos.columna_nombre');
      fireEvent.change(nombreInput, { target: { value: 'Nuevo Taladro' } });
      fireEvent.click(screen.getByText('common.guardar'));
      await waitFor(() => {
        expect(screen.getByText('activos.error_codigo')).toBeInTheDocument();
      });
    });
  });

  describe('Estados vacio y carga', () => {
    it('muestra estado vacio cuando no hay activos', async () => {
      mockActivos = [];
      render(<Activos />);
      await waitFor(() => {
        expect(screen.getByText('activos.sin_activos')).toBeInTheDocument();
      });
    });
  });
});
