import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('@/lib/confirm-action', () => ({
  confirmAction: vi.fn(() => Promise.resolve()),
}));

vi.mock('react-window', () => ({
  List: ({ children, itemCount, itemData }: any) => {
    const items = [];
    for (let i = 0; i < itemCount; i++) {
      items.push(children({ index: i, data: itemData, style: {} }));
    }
    return <div data-testid="virtualized-list">{items}</div>;
  },
}));

vi.mock('../erp/export', () => ({
  exportStockPDF: vi.fn(),
}));

vi.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'bodega.title_full': 'Bodega',
    'bodega.titulo': 'Bodega',
    'bodega.materiales': 'Materiales',
    'bodega.stock_bajo_minimo': 'Stock Bajo Minimo',
    'bodega.oc_por_aprobar': 'OC por Aprobar',
    'bodega.valor_inventario': 'Valor Inventario',
    'bodega.items_con_presupuesto': 'Items con Presupuesto',
    'bodega.presupuestado_bodega': 'Presupuestado Bodega',
    'bodega.desviacion_promedio': 'Desviacion Promedio',
    'bodega.mayor_desviacion': 'Mayor Desviacion',
    'bodega.control_stock': 'Control de Stock',
    'bodega.control_stock_aria': 'Control de stock',
    'bodega.sin_materiales': 'Sin materiales',
    'bodega.critico': 'CRITICO',
    'bodega.no_planificado': 'No planificado',
    'bodega.cobertura_presupuestaria': 'Cobertura presupuestaria',
    'bodega.pareto_inventario': 'Pareto Inventario',
    'bodega.ordenes_por_aprobar': 'Ordenes por Aprobar',
    'bodega.sin_ordenes': 'Sin ordenes',
    'bodega.aprobar_orden': 'Aprobar orden',
    'bodega.aprobar_orden_confirm': 'Aprobar orden',
    'bodega.si_aprobar': 'Si, aprobar',
    'bodega.aprobar': 'Aprobar',
    'bodega.rechazar': 'Rechazar',
    'bodega.aprobar_orden_aria': 'Aprobar orden de {{material}}',
    'bodega.rechazar_orden_aria': 'Rechazar orden de {{material}}',
    'bodega.proveedores': 'Proveedores',
    'bodega.sin_proveedores': 'Sin proveedores',
    'bodega.calificacion_aria': 'Calificacion {{calificacion}}',
    'bodega.editar_proveedor_aria': 'Editar proveedor {{nombre}}',
    'bodega.eliminar_proveedor_aria': 'Eliminar proveedor {{nombre}}',
    'bodega.editar_proveedor': 'Editar Proveedor',
    'bodega.nuevo_proveedor': 'Nuevo Proveedor',
    'bodega.crear_proveedor': 'Crear Proveedor',
    'bodega.actualizar_proveedor': 'Actualizar Proveedor',
    'bodega.cerrar_dialogo': 'Cerrar',
    'bodega.contacto': 'Contacto',
    'bodega.rubro': 'Rubro',
    'bodega.estrellas': '{{n}} estrellas',
    'bodega.nueva_orden_compra': 'Nueva Orden de Compra',
    'bodega.seleccionar_proveedor': 'Seleccionar proveedor',
    'bodega.seleccionar_proyecto': 'Seleccionar proyecto',
    'bodega.material': 'Material',
    'bodega.monto_q': 'Monto (Q)',
    'bodega.crear_orden': 'Crear Orden',
    'bodega.oc_abreviatura': 'OC',
    'bodega.proveedor': 'Proveedor',
    'common.nuevo': 'Nuevo',
    'common.cancelar': 'Cancelar',
    'common.nombre': 'Nombre',
    'common.cantidad': 'Cantidad',
    'common.guardar': 'Guardar',
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
let mockOrdenes: any[] = [];
let mockProveedores: any[] = [];
let mockProyectos: any[] = [];
let mockCurrentProjectId = 'proj-1';
const mockUpdateMaterial = vi.fn();
const mockUpdateOrden = vi.fn();
const mockAddOrden = vi.fn();
const mockAddProveedor = vi.fn();
const mockUpdateProveedor = vi.fn();
const mockDeleteProveedor = vi.fn();

vi.mock('../erp/store', () => ({
  useErp: () => ({
    materiales: mockMateriales,
    ordenes: mockOrdenes,
    proveedores: mockProveedores,
    proyectos: mockProyectos,
    currentProjectId: mockCurrentProjectId,
    updateMaterial: mockUpdateMaterial,
    updateOrden: mockUpdateOrden,
    addOrden: mockAddOrden,
    addProveedor: mockAddProveedor,
    updateProveedor: mockUpdateProveedor,
    deleteProveedor: mockDeleteProveedor,
  }),
}));

vi.mock('../erp/hooks/useRefDataQueries', () => ({
  useMateriales: () => mockMateriales,
  useProveedores: () => mockProveedores,
}));

import Bodega from '../erp/screens/Bodega';

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
  mockCurrentProjectId = 'proj-1';
  mockMateriales = [
    { id: 'mat-1', nombre: 'Cemento', unidad: 'kg', stock: 100, stockMinimo: 50, precio: 10, cantidadPresupuestada: 200, categoria: 'materiales' },
    { id: 'mat-2', nombre: 'Acero', unidad: 'kg', stock: 30, stockMinimo: 50, precio: 25, cantidadPresupuestada: 100, categoria: 'materiales' },
    { id: 'mat-3', nombre: 'Grava', unidad: 'm3', stock: 80, stockMinimo: 20, precio: 15, cantidadPresupuestada: 0, categoria: 'materiales' },
  ];
  mockOrdenes = [
    { id: 'ord-1', proveedor: 'Proveedor A', material: 'Cemento', cantidad: 50, monto: 500, estado: 'pendiente' },
  ];
  mockProveedores = [
    { id: 'prov-1', nombre: 'Proveedor A', contacto: 'contacto@a.com', rubro: 'Materiales', calificacion: 4 },
  ];
});

afterEach(cleanup);

describe('Bodega Screen', () => {
  describe('KPI cards', () => {
    it('renderiza tarjeta total materiales', async () => {
      render(<Bodega />);
      await waitFor(() => {
        expect(screen.getByText('Materiales')).toBeInTheDocument();
      });
    });

    it('renderiza tarjeta stock critico', async () => {
      render(<Bodega />);
      await waitFor(() => {
        expect(screen.getByText('Stock Bajo Minimo')).toBeInTheDocument();
      });
    });

    it('renderiza tarjeta valor inventario', async () => {
      render(<Bodega />);
      await waitFor(() => {
        expect(screen.getByText('Valor Inventario')).toBeInTheDocument();
      });
    });

    it('renderiza tarjeta items con presupuesto', async () => {
      render(<Bodega />);
      await waitFor(() => {
        expect(screen.getByText('Items con Presupuesto')).toBeInTheDocument();
      });
    });
  });

  describe('Control de stock', () => {
    it('renderiza lista de control de stock', async () => {
      render(<Bodega />);
      await waitFor(() => {
        expect(screen.getByText('Control de Stock')).toBeInTheDocument();
      });
    });

    it('renderiza materiales en la lista', async () => {
      render(<Bodega />);
      await waitFor(() => {
        expect(screen.getAllByText('Cemento').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Acero').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Grava').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('edicion inline de stock funciona', async () => {
      render(<Bodega />);
      await waitFor(() => {
        const stockInputs = screen.getAllByRole('spinbutton');
        fireEvent.change(stockInputs[0], { target: { value: '150' } });
        expect(mockUpdateMaterial).toHaveBeenCalled();
      });
    });

    it('muestra desviacion porcentual por material', async () => {
      render(<Bodega />);
      await waitFor(() => {
        expect(screen.getByText('Desviacion Promedio')).toBeInTheDocument();
      });
    });
  });

  describe('Virtualizacion', () => {
    it('activa virtualizacion cuando hay mas de 50 materiales', async () => {
      mockMateriales = Array.from({ length: 55 }, (_, i) => ({
        id: `mat-${i}`,
        nombre: `Material ${i}`,
        unidad: 'kg',
        stock: 100,
        stockMinimo: 50,
        precio: 10,
        cantidadPresupuestada: 100,
        categoria: 'materiales',
      }));
      render(<Bodega />);
      await waitFor(() => {
        expect(screen.getByText('Material 0')).toBeInTheDocument();
      });
    });
  });

  describe('Pareto', () => {
    it('renderiza grafico Pareto', async () => {
      render(<Bodega />);
      await waitFor(() => {
        expect(screen.getByText('Pareto Inventario')).toBeInTheDocument();
      });
    });
  });

  describe('Ordenes por aprobar', () => {
    it('renderiza ordenes pendientes con botones Aprobar y Rechazar', async () => {
      render(<Bodega />);
      await waitFor(() => {
        expect(screen.getByText('Ordenes por Aprobar')).toBeInTheDocument();
        expect(screen.getAllByText('Cemento').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('aprobar orden llama updateOrden', async () => {
      render(<Bodega />);
      await waitFor(() => {
        const aprobarBtn = screen.getByLabelText('Aprobar orden de Cemento');
        fireEvent.click(aprobarBtn);
        expect(mockUpdateOrden).toHaveBeenCalledWith('ord-1', { estado: 'aprobado' });
      });
    });
  });

  describe('Proveedores', () => {
    it('renderiza tarjetas de proveedores', async () => {
      render(<Bodega />);
      await waitFor(() => {
        expect(screen.getByText('Proveedores')).toBeInTheDocument();
        expect(screen.getByText('Proveedor A')).toBeInTheDocument();
      });
    });
  });

  describe('Exportacion PDF', () => {
    it('renderiza boton de exportar PDF', async () => {
      render(<Bodega />);
      await waitFor(() => {
        expect(screen.getAllByText('PDF').length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Modales', () => {
    it('abre modal de nuevo proveedor', async () => {
      render(<Bodega />);
      await waitFor(() => {
        const proveedorBtn = screen.getByText('Proveedor');
        fireEvent.click(proveedorBtn);
      });
      await waitFor(() => {
        expect(screen.getByText('Nuevo Proveedor')).toBeInTheDocument();
      });
    });

    it('abre modal de nueva orden de compra', async () => {
      render(<Bodega />);
      await waitFor(() => {
        const ocBtn = screen.getByText('OC');
        fireEvent.click(ocBtn);
      });
      await waitFor(() => {
        expect(screen.getByText('Nueva Orden de Compra')).toBeInTheDocument();
      });
    });
  });

  describe('Estado vacio', () => {
    it('muestra estado vacio cuando no hay materiales', async () => {
      mockMateriales = [];
      render(<Bodega />);
      await waitFor(() => {
        expect(screen.getByText('Sin materiales')).toBeInTheDocument();
      });
    });
  });
});
