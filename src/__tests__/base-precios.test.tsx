import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('../erp/hooks/useRefDataQueries', () => ({
  useInsumosBase: () => mockMateriales,
}));

vi.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'baseprecios.titulo': 'Base de Precios',
    'baseprecios.total_insumos': 'Total Insumos',
    'baseprecios.zona': 'Zona',
    'baseprecios.factor_zona': 'Factor Zona',
    'baseprecios.inactivos': 'Inactivos',
    'baseprecios.importar_csv': 'Importar CSV',
    'baseprecios.exportar_csv': 'Exportar CSV',
    'baseprecios.convertir': 'Convertir',
    'baseprecios.nuevo': 'Nuevo',
    'baseprecios.conversor': 'Conversor de Unidades',
    'baseprecios.desde': 'Desde',
    'baseprecios.hasta': 'Hasta',
    'baseprecios.cantidad': 'Cantidad',
    'baseprecios.resultado': 'Resultado',
    'baseprecios.unidad': 'Unidad',
    'baseprecios.nuevo_insumo': 'Nuevo Insumo',
    'baseprecios.nombre_placeholder': 'Nombre',
    'baseprecios.precio_placeholder': 'Precio',
    'baseprecios.unidad_placeholder': 'Unidad',
    'baseprecios.rubro_placeholder': 'Rubro',
    'baseprecios.agregar_btn': 'Agregar',
    'baseprecios.cancelar': 'Cancelar',
    'baseprecios.buscar': 'Buscar',
    'baseprecios.todos_rubros': 'Todos los rubros',
    'baseprecios.todas_categorias': 'Todas las categorias',
    'baseprecios.mano_obra': 'Mano de Obra',
    'baseprecios.insumo': 'Insumo',
    'baseprecios.categoria': 'Categoria',
    'baseprecios.precio_base': 'Precio Base',
    'baseprecios.precio_zona': 'Precio Zona',
    'baseprecios.estado': 'Estado',
    'baseprecios.acciones': 'Acciones',
    'baseprecios.activo': 'Activo',
    'baseprecios.inactivo': 'Inactivo',
    'baseprecios.guardar': 'Guardar',
    'baseprecios.cancelar_edicion': 'Cancelar edicion',
    'baseprecios.editar': 'Editar',
    'baseprecios.activar_btn': 'Activar',
    'baseprecios.eliminar_btn': 'Eliminar',
    'baseprecios.actualizado': 'Actualizado',
    'baseprecios.agregado': 'Agregado',
    'baseprecios.eliminado': 'Eliminado',
    'baseprecios.activado': 'Activado',
    'baseprecios.sin_insumos': 'No hay insumos en la base de precios',
    'baseprecios.sin_insumos_desc': 'Agrega insumos o ajusta los filtros de busqueda',
    'baseprecios.insumos': 'insumos',
    'baseprecios.precio_base_total': 'Precio base total',
    'baseprecios.csv_vacio': 'CSV vacio',
    'baseprecios.csv_invalido': 'CSV invalido',
    'baseprecios.importados': 'Importados {{count}}',
    'baseprecios.importar_fallo': 'Error al importar',
    'baseprecios.exportar': 'Exportado',
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

let mockMateriales: any[] = [];
const mockAddInsumoBase = vi.fn();
const mockUpdateInsumoBase = vi.fn();
const mockDeleteInsumoBase = vi.fn();

vi.mock('../erp/store', () => ({
  useErp: () => ({
    materiales: mockMateriales,
    addInsumoBase: mockAddInsumoBase,
    updateInsumoBase: mockUpdateInsumoBase,
    deleteInsumoBase: mockDeleteInsumoBase,
  }),
}));

import BasePrecios from '../erp/screens/BasePrecios';

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
  URL.createObjectURL = vi.fn(() => 'blob:test') as any;
});

const uid = () => crypto.randomUUID();

beforeEach(() => {
  vi.clearAllMocks();
  mockMateriales = [
    { id: uid(), codigo: 'IB-001', nombre: 'Cemento', categoria: 'material', unidad: 'bolsa', costo_base: 85, rubro: 'estructura', activo: true },
    { id: uid(), codigo: 'IB-002', nombre: 'Arena', categoria: 'material', unidad: 'm³', costo_base: 120, rubro: 'estructura', activo: true },
    { id: uid(), codigo: 'IB-003', nombre: 'Piedrin', categoria: 'material', unidad: 'm³', costo_base: 95, rubro: 'acabados', activo: true },
    { id: uid(), codigo: 'IB-004', nombre: 'Albanil', categoria: 'mano_obra', unidad: 'dia', costo_base: 150, rubro: 'mano_obra', activo: true },
    { id: uid(), codigo: 'IB-005', nombre: 'Excavadora', categoria: 'equipo', unidad: 'hora', costo_base: 200, rubro: 'equipo', activo: false },
  ];
});

afterEach(cleanup);

describe('BasePrecios Screen', () => {
  describe('Carga y renderizado inicial', () => {
    it('renderiza titulo con icono de base de precios', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        expect(screen.getByText('Base de Precios')).toBeInTheDocument();
      });
    });

    it('muestra tarjeta de total insumos', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        expect(screen.getByText('Total Insumos')).toBeInTheDocument();
        expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('muestra tarjeta de zona seleccionada', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        expect(screen.getByText('Zona')).toBeInTheDocument();
        expect(screen.getAllByText('Guatemala').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('muestra tarjeta de factor zona', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        expect(screen.getByText('Factor Zona')).toBeInTheDocument();
      });
    });

    it('muestra tarjeta de inactivos', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        expect(screen.getByText('Inactivos')).toBeInTheDocument();
        expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renderiza boton de nuevo insumo', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        expect(screen.getByText('Nuevo')).toBeInTheDocument();
      });
    });

    it('renderiza boton de exportar CSV', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        expect(screen.getByText('Exportar CSV')).toBeInTheDocument();
      });
    });

    it('renderiza boton de importar CSV', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        expect(screen.getByText('Importar CSV')).toBeInTheDocument();
      });
    });

    it('renderiza boton de convertir unidades', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        expect(screen.getByText('Convertir')).toBeInTheDocument();
      });
    });

    it('renderiza selector de zona', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        const zonaSelect = screen.getAllByRole('combobox')[0];
        expect(zonaSelect).toBeInTheDocument();
      });
    });
  });

  describe('Filtros de tabla', () => {
    it('renderiza campo de busqueda', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Buscar')).toBeInTheDocument();
      });
    });

    it('filtra por busqueda de texto', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar');
        fireEvent.change(searchInput, { target: { value: 'Cemento' } });
        expect(screen.getAllByText('Cemento').length).toBeGreaterThanOrEqual(1);
        expect(screen.queryByText('Arena')).not.toBeInTheDocument();
      });
    });

    it('filtra por rubro', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        const rubroSelect = screen.getAllByRole('combobox')[1];
        fireEvent.change(rubroSelect, { target: { value: 'acabados' } });
        expect(screen.getByText('Piedrin')).toBeInTheDocument();
        expect(screen.queryByText('Cemento')).not.toBeInTheDocument();
      });
    });

    it('filtra por categoria', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        const categoriaSelect = screen.getAllByRole('combobox')[2];
        fireEvent.change(categoriaSelect, { target: { value: 'mano_obra' } });
        expect(screen.getByText('Albanil')).toBeInTheDocument();
        expect(screen.queryByText('Cemento')).not.toBeInTheDocument();
      });
    });

    it('combina filtros de busqueda y rubro', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar');
        fireEvent.change(searchInput, { target: { value: 'Cemento' } });
        const rubroSelect = screen.getAllByRole('combobox')[1];
        fireEvent.change(rubroSelect, { target: { value: 'estructura' } });
        expect(screen.getAllByText('Cemento').length).toBeGreaterThanOrEqual(1);
        expect(screen.queryByText('Arena')).not.toBeInTheDocument();
      });
    });

    it('limpia filtros al seleccionar opcion vacia', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar');
        fireEvent.change(searchInput, { target: { value: 'Cemento' } });
        const rubroSelect = screen.getAllByRole('combobox')[1];
        fireEvent.change(rubroSelect, { target: { value: '' } });
        fireEvent.change(searchInput, { target: { value: '' } });
        expect(screen.getAllByText('Cemento').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Arena').length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Tabla de insumos', () => {
    it('renderiza encabezados de tabla', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        const table = document.querySelector('[role="table"]');
        expect(table).toBeInTheDocument();
        const headers = table?.querySelectorAll('th');
        expect(headers?.length).toBeGreaterThanOrEqual(8);
      });
    });

    it('renderiza filas de insumos', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        const cementoRows = screen.getAllByText('Cemento');
        expect(cementoRows.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('muestra precios base con formato Q', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        expect(screen.getAllByText('Q85.00').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Q120.00').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('muestra precios de zona con factor aplicado', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        expect(screen.getAllByText(/Q85\.00/).length).toBeGreaterThanOrEqual(1);
      });
    });

    it('muestra total de precio base en pie de tabla', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        expect(screen.getByText(/Precio base total/)).toBeInTheDocument();
      });
    });

    it('edita precio inline', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        const editButtons = screen.getAllByLabelText('Editar');
        fireEvent.click(editButtons[0]);
        const priceInput = screen.getByDisplayValue('85');
        fireEvent.change(priceInput, { target: { value: '90' } });
        const saveButton = screen.getByLabelText('Guardar');
        fireEvent.click(saveButton);
        expect(mockUpdateInsumoBase).toHaveBeenCalled();
      });
    });

    it('cancela edicion inline', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        const editButtons = screen.getAllByLabelText('Editar');
        fireEvent.click(editButtons[0]);
        const cancelButton = screen.getByLabelText('Cancelar edicion');
        fireEvent.click(cancelButton);
        expect(screen.getAllByText('Cemento').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('elimina insumo activo', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Eliminar');
        fireEvent.click(deleteButtons[0]);
        expect(mockDeleteInsumoBase).toHaveBeenCalled();
      });
    });

    it('activa insumo inactivo', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        const activateButtons = screen.getAllByLabelText('Activar');
        fireEvent.click(activateButtons[0]);
        expect(mockUpdateInsumoBase).toHaveBeenCalled();
      });
    });
  });

  describe('Estados vacio y carga', () => {
    it('muestra estado vacio cuando no hay insumos', async () => {
      mockMateriales = [];
      render(<BasePrecios />);
      await waitFor(() => {
        expect(screen.getByText('No hay insumos en la base de precios')).toBeInTheDocument();
      });
    });

    it('muestra mensaje de vacio con filtros activos', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar');
        fireEvent.change(searchInput, { target: { value: 'NoExiste' } });
        expect(screen.getByText('No hay insumos en la base de precios')).toBeInTheDocument();
      });
    });

    it('renderiza contenido despues de carga', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        expect(screen.getByText('Base de Precios')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Buscar')).toBeInTheDocument();
      });
    });
  });

  describe('Calculos y totales', () => {
    it('calcula total de precio base', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        expect(screen.getByText(/Precio base total/)).toBeInTheDocument();
      });
    });

    it('actualiza factor al cambiar zona', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        const zonaSelect = screen.getAllByRole('combobox')[0];
        fireEvent.change(zonaSelect, { target: { value: 'Escuintla' } });
        expect(screen.getAllByText(/x1\.08/).length).toBeGreaterThanOrEqual(1);
      });
    });

    it('recalcula precios de zona al cambiar zona', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        const zonaSelect = screen.getAllByRole('combobox')[0];
        fireEvent.change(zonaSelect, { target: { value: 'Quetzaltenango' } });
        expect(screen.getAllByText(/x1\.12/).length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Acciones CRUD', () => {
    it('abre formulario de nuevo insumo', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        const nuevoBtn = screen.getByText('Nuevo');
        fireEvent.click(nuevoBtn);
        expect(screen.getByText('Nuevo Insumo')).toBeInTheDocument();
      });
    });

    it('agrega nuevo insumo', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        const nuevoBtn = screen.getByText('Nuevo');
        fireEvent.click(nuevoBtn);
        const nombreInput = screen.getByPlaceholderText('Nombre');
        fireEvent.change(nombreInput, { target: { value: 'Ladrillo' } });
        const precioInput = screen.getByPlaceholderText('Precio');
        fireEvent.change(precioInput, { target: { value: '5' } });
        const unidadInput = screen.getByPlaceholderText('Unidad');
        fireEvent.change(unidadInput, { target: { value: 'u' } });
        const rubroInput = screen.getByPlaceholderText('Rubro');
        fireEvent.change(rubroInput, { target: { value: 'acabados' } });
        const agregarBtn = screen.getByText('Agregar');
        fireEvent.click(agregarBtn);
        expect(mockAddInsumoBase).toHaveBeenCalled();
      });
    });

    it('actualiza insumo existente', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        const editButtons = screen.getAllByLabelText('Editar');
        fireEvent.click(editButtons[0]);
        const nombreInput = screen.getByDisplayValue('Cemento');
        fireEvent.change(nombreInput, { target: { value: 'Cemento Portland' } });
        const saveButton = screen.getByLabelText('Guardar');
        fireEvent.click(saveButton);
        expect(mockUpdateInsumoBase).toHaveBeenCalled();
      });
    });
  });

  describe('Conversor de unidades', () => {
    it('abre conversor de unidades', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        const convertirBtn = screen.getByText('Convertir');
        fireEvent.click(convertirBtn);
        expect(screen.getByText('Conversor de Unidades')).toBeInTheDocument();
      });
    });

    it('muestra selectores de unidades', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        const convertirBtn = screen.getByText('Convertir');
        fireEvent.click(convertirBtn);
        const selects = screen.getAllByRole('combobox');
        expect(selects.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('cierra conversor al hacer clic en boton', async () => {
      render(<BasePrecios />);
      await waitFor(() => {
        const convertirBtn = screen.getByText('Convertir');
        fireEvent.click(convertirBtn);
        expect(screen.getByText('Conversor de Unidades')).toBeInTheDocument();
        fireEvent.click(convertirBtn);
        expect(screen.queryByText('Conversor de Unidades')).not.toBeInTheDocument();
      });
    });
  });
});