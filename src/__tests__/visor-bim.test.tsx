import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';

vi.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'visor_bim.titulo': 'BIM - Vinculación ERP',
    'visor_bim.descripcion': 'Vincula elementos del modelo IFC con el ERP y extrae cubicaciones',
    'visor_bim.proyecto': 'Proyecto',
    'visor_bim.selecciona_proyecto': 'Selecciona un proyecto',
    'visor_bim.selecciona_proyecto_ver': 'Selecciona un proyecto para visualizar',
    'visor_bim.tab_visor': 'Visor 3D',
    'visor_bim.tab_vincular': 'Vincular Renglones',
    'visor_bim.tab_cubicacion': 'Cubicación',
    'visor_bim.tab_avance': 'Avance vs Campo',
    'visor_bim.visor_3d_carga': 'Cargar modelo IFC para visualizar',
    'visor_bim.cargar_modelo': 'Cargar modelo IFC',
    'visor_bim.elementos_modelo': 'Elementos del Modelo BIM',
    'visor_bim.renglon_a_vincular': 'Renglón a vincular:',
    'visor_bim.renglon_placeholder': '— Renglón —',
    'visor_bim.vincular': 'Vincular',
    'visor_bim.desvincular': 'Desvincular',
    'visor_bim.separador': ' · ',
    'visor_bim.tabla_elemento': 'Elemento',
    'visor_bim.tabla_renglon': 'Renglón',
    'visor_bim.tabla_cantidad': 'Cantidad',
    'visor_bim.tabla_precio_unit': 'Precio Unit.',
    'visor_bim.tabla_total': 'Total',
    'visor_bim.moneda': 'Q',
    'visor_bim.cubicacion_vacia': 'Vincula elementos para generar la cubicación.',
    'visor_bim.avance_vs_campo': 'Avance vs Campo',
    'visor_bim.comparativa': 'Comparativa entre avance modelado en BIM y avance físico registrado en campo.',
    'visor_bim.modelado_bim': 'MODELADO (BIM)',
    'visor_bim.campo_erp': 'CAMPO (ERP)',
    'visor_bim.error_selecciona_renglon': 'Selecciona renglón:',
    'visor_bim.error_vincular_primero': 'Vincula elementos primero',
    'visor_bim.vinculacion_creada': 'Vinculación creada',
    'visor_bim.vinculacion_eliminada': 'Vinculación eliminada',
    'visor_bim.cubicacion_generada': 'Cubicación generada',
    'visor_bim.desconocido': 'Desconocido',
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

let mockProyectos: any[] = [];
let mockPresupuestos: any[] = [];
let currentProjectId = 'proj-1';
const mockSetCurrentProjectId = vi.fn();
const mockSetView = vi.fn();

vi.mock('../erp/store', () => ({
  useErp: () => ({
    proyectos: mockProyectos,
    presupuestos: mockPresupuestos,
    currentProjectId,
    setCurrentProjectId: mockSetCurrentProjectId,
    setView: mockSetView,
  }),
}));

async function renderVisorBIM() {
  const VisorBIM = (await import('../erp/screens/VisorBIM')).default;
  return render(React.createElement(VisorBIM));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockProyectos = [
    { id: 'proj-1', nombre: 'Edificio Torre Centro', estado: 'ejecucion' },
    { id: 'proj-2', nombre: 'Parque Industrial', estado: 'planeacion' },
  ];
  mockPresupuestos = [
    {
      id: 'pres-1',
      proyectoId: 'proj-1',
      renglones: [
        { id: 'ren-1', nombre: 'Muros', precioUnitario: 150 },
        { id: 'ren-2', nombre: 'Columnas', precioUnitario: 300 },
      ],
    },
  ];
  currentProjectId = 'proj-1';
});

afterEach(cleanup);

describe('VisorBIM Screen', () => {
  it('renders screen title and project selector', async () => {
    await renderVisorBIM();
    await waitFor(() => {
      expect(screen.getByText('BIM - Vinculación ERP')).toBeInTheDocument();
      expect(screen.getByText('Proyecto')).toBeInTheDocument();
    });
  });

  it('renders 4 tabs', async () => {
    await renderVisorBIM();
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Visor 3D' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Vincular Renglones' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Cubicación' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Avance vs Campo' })).toBeInTheDocument();
    });
  });

  it('switching tabs shows correct content', async () => {
    await renderVisorBIM();
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Visor 3D' })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('tab', { name: 'Vincular Renglones' }));
    await waitFor(() => {
      expect(screen.getByText('Elementos del Modelo BIM')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('tab', { name: 'Cubicación' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generar/i })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('tab', { name: 'Avance vs Campo' }));
    await waitFor(() => {
      expect(screen.getByText('MODELADO (BIM)')).toBeInTheDocument();
    });
  });

  it('visor tab shows 3D viewer placeholder and load button', async () => {
    await renderVisorBIM();
    await waitFor(() => {
      expect(screen.getByText('Cargar modelo IFC para visualizar')).toBeInTheDocument();
      expect(screen.getByText('Cargar modelo IFC')).toBeInTheDocument();
    });
  });

  it('vincular tab shows IFC elements list', async () => {
    await renderVisorBIM();
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Visor 3D' })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('tab', { name: 'Vincular Renglones' }));
    await waitFor(() => {
      expect(screen.getByText('Muro Norte - Planta Baja')).toBeInTheDocument();
      expect(screen.getByText('Columna C-01')).toBeInTheDocument();
      expect(screen.getByText('Losa Cubierta Nivel 2')).toBeInTheDocument();
    });
  });

  it('linking element to budget line item works', async () => {
    await renderVisorBIM();
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Visor 3D' })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('tab', { name: 'Vincular Renglones' }));
    await waitFor(() => {
      const renglonSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(renglonSelect, { target: { value: 'ren-1' } });
      const vincularButtons = screen.getAllByText('Vincular');
      fireEvent.click(vincularButtons[0]);
      expect(screen.getByText('Desvincular')).toBeInTheDocument();
    });
  });

  it('cubicacion tab shows generate button', async () => {
    await renderVisorBIM();
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Visor 3D' })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('tab', { name: 'Cubicación' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generar/i })).toBeInTheDocument();
    });
  });

  it('cubicacion table shows after generating', async () => {
    await renderVisorBIM();
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Visor 3D' })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('tab', { name: 'Vincular Renglones' }));
    await waitFor(() => {
      const renglonSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(renglonSelect, { target: { value: 'ren-1' } });
      const vincularButtons = screen.getAllByText('Vincular');
      fireEvent.click(vincularButtons[0]);
      expect(screen.getByText('Desvincular')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('tab', { name: 'Cubicación' }));
    await waitFor(() => {
      const generateBtn = screen.getByRole('button', { name: /generar/i });
      fireEvent.click(generateBtn);
      expect(screen.getByText('Muro Norte - Planta Baja')).toBeInTheDocument();
      expect(screen.getByText('Muros')).toBeInTheDocument();
    });
  });

  it('avance tab shows BIM vs Campo comparison', async () => {
    await renderVisorBIM();
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Visor 3D' })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('tab', { name: 'Avance vs Campo' }));
    await waitFor(() => {
      expect(screen.getByText('MODELADO (BIM)')).toBeInTheDocument();
      expect(screen.getByText('CAMPO (ERP)')).toBeInTheDocument();
      expect(screen.getByText('78%')).toBeInTheDocument();
      expect(screen.getByText('72%')).toBeInTheDocument();
    });
  });

  it('empty state when no project selected', async () => {
    currentProjectId = null;
    await renderVisorBIM();
    await waitFor(() => {
      expect(screen.getByText('Selecciona un proyecto para visualizar')).toBeInTheDocument();
    });
  });
});
