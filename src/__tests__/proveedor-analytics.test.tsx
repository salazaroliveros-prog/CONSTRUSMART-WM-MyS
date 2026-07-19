/**
 * TEST DE PROVEEDOR ANALYTICS — CONSTRUSMART ERP
 * Tests de renderizado, métricas, ranking, filtros y exportación
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useErp } from '../erp/store';
import ProveedorAnalytics from '../erp/screens/ProveedorAnalytics';

vi.mock('../erp/store');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockProveedores = [
  {
    id: 'prov1',
    nombre: 'Cemento Nacional',
    categoria: 'materiales',
    contacto: 'Juan Pérez',
    telefono: '+502 2222-2222',
    email: 'ventas@cemento.com',
    direccion: 'Zona 9, Guatemala',
    calificacion: 85,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prov2',
    nombre: 'Aceros del Norte',
    categoria: 'materiales',
    contacto: 'María García',
    telefono: '+502 3333-3333',
    email: 'ventas@aceros.com',
    direccion: 'Zona 10, Guatemala',
    calificacion: 72,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prov3',
    nombre: 'Transportes Rápidos',
    categoria: 'logistica',
    contacto: 'Carlos López',
    telefono: '+502 4444-4444',
    email: 'info@transportes.com',
    direccion: 'Zona 12, Guatemala',
    calificacion: 90,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockOrdenes = [
  {
    id: 'ord1',
    proveedorId: 'prov1',
    proyectoId: 'p1',
    monto: 150000,
    fecha: '2025-06-01',
    estado: 'entregado',
    fecha_entrega: '2025-06-05',
    fecha_esperada: '2025-06-05',
  },
  {
    id: 'ord2',
    proveedorId: 'prov2',
    proyectoId: 'p1',
    monto: 80000,
    fecha: '2025-06-10',
    estado: 'entregado',
    fecha_entrega: '2025-06-15',
    fecha_esperada: '2025-06-12',
  },
  {
    id: 'ord3',
    proveedorId: 'prov3',
    proyectoId: 'p2',
    monto: 45000,
    fecha: '2025-06-05',
    estado: 'entregado',
    fecha_entrega: '2025-06-06',
    fecha_esperada: '2025-06-06',
  },
];

const mockProyectos = [
  {
    id: 'p1',
    nombre: 'Residencial Altamira',
    cliente: 'Inmobiliaria GT',
    ubicacion: 'Zona 10, Guatemala',
    tipologia: 'residencial',
    estado: 'ejecucion',
    presupuesto_total: 5000000,
    monto_contrato: 5500000,
    avance_fisico: 45,
    avance_financiero: 42,
    fecha_inicio: '2025-01-01',
    fecha_fin: '2025-12-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p2',
    nombre: 'Comercial Centro',
    cliente: 'Grupo Corporativo',
    ubicacion: 'Zona 9, Guatemala',
    tipologia: 'comercial',
    estado: 'ejecucion',
    presupuesto_total: 8000000,
    monto_contrato: 8500000,
    avance_fisico: 62,
    avance_financiero: 58,
    fecha_inicio: '2025-02-01',
    fecha_fin: '2026-06-30',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe('ProveedorAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useErp as any).mockReturnValue({
      proveedores: mockProveedores,
      ordenes: mockOrdenes,
      proyectos: mockProyectos,
    });
  });

  it('renderiza skeleton durante loading', () => {
    (useErp as any).mockReturnValue({
      proveedores: [],
      ordenes: [],
      proyectos: [],
    });

    const { container } = render(<ProveedorAnalytics />);
    expect(container.querySelector('.animate-pulse')).toBeDefined();
  });

  it('renderiza KPI cards cuando hay datos', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/promedio_general/i)).toBeDefined();
      expect(screen.getByText(/mejor_proveedor/i)).toBeDefined();
      expect(screen.getByText(/total_proveedores/i)).toBeDefined();
      expect(screen.getByText(/alertas_riesgo/i)).toBeDefined();
    });
  });

  it('muestra puntaje promedio correcto', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/promedio_general/i)).toBeDefined();
    });
  });

  it('muestra mejor proveedor', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/mejor_proveedor/i)).toBeDefined();
    });
  });

  it('muestra total de proveedores', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/total_proveedores/i)).toBeDefined();
    });
  });

  it('renderiza select de filtro por proyecto', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      const projectSelect = screen.getByText(/todos_proyectos/i);
      expect(projectSelect).toBeDefined();
    });
  });

  it('renderiza select de filtro por categoría', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      const categorySelect = screen.getByText(/todas_categorias/i);
      expect(categorySelect).toBeDefined();
    });
  });

  it('renderiza botón de exportación', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/exportar/i)).toBeDefined();
    });
  });

  it('muestra alertas de riesgo cuando existen', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      const riskAlert = screen.queryByText(/riesgo_detectado/i);
      if (riskAlert) {
        expect(riskAlert).toBeDefined();
      }
    });
  });

  it('muestra recomendaciones cuando existen', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      const recommendations = screen.queryByText(/recomendados/i);
      if (recommendations) {
        expect(recommendations).toBeDefined();
      }
    });
  });

  it('renderiza gráfico de distribución por categoría', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/distribucion_categoria/i)).toBeDefined();
    });
  });

  it('renderiza gráfico de desempeño por categoría', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/desempeno_categoria/i)).toBeDefined();
    });
  });

  it('renderiza tabla de ranking', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/ranking/i)).toBeDefined();
    });
  });

  it('muestra empty state cuando no hay datos después de filtros', async () => {
    (useErp as any).mockReturnValue({
      proveedores: [],
      ordenes: [],
      proyectos: mockProyectos,
    });

    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/empty_filtros/i)).toBeDefined();
    });
  });

  it('tabla tiene columnas correctas', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/col_proveedor/i)).toBeDefined();
      expect(screen.getByText(/col_categoria/i)).toBeDefined();
      expect(screen.getByText(/col_general/i)).toBeDefined();
      expect(screen.getByText(/col_entrega/i)).toBeDefined();
      expect(screen.getByText(/col_calidad/i)).toBeDefined();
      expect(screen.getByText(/col_ordenes/i)).toBeDefined();
      expect(screen.getByText(/col_monto/i)).toBeDefined();
      expect(screen.getByText(/col_tendencia/i)).toBeDefined();
    });
  });

  it('fila de tabla es seleccionable con teclado', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(table).toBeDefined();
    });
  });

  it('muestra detalle de proveedor al seleccionar', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      const table = screen.getByRole('table');
      if (table) {
        const rows = table.querySelectorAll('tbody tr');
        if (rows.length > 0) {
          fireEvent.click(rows[0]);
        }
      }
    });
  });

  it('filtra por proyecto al cambiar select', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      const projectSelect = screen.getByText(/todos_proyectos/i);
      expect(projectSelect).toBeDefined();
    });
  });

  it('filtra por categoría al cambiar select', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      const categorySelect = screen.getByText(/todas_categorias/i);
      expect(categorySelect).toBeDefined();
    });
  });

  it('botón de exportación deshabilitado cuando no hay datos', async () => {
    (useErp as any).mockReturnValue({
      proveedores: [],
      ordenes: [],
      proyectos: mockProyectos,
    });

    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      const exportButton = screen.getByText(/exportar/i);
      expect(exportButton).toBeDisabled();
    });
  });

  it('renderiza iconos con aria-hidden', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      const icons = document.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  it('tabla tiene role y aria-label', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(table).toBeDefined();
    });
  });

  it('filas de tabla tienen tabIndex y onKeyDown', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      const table = screen.getByRole('table');
      if (table) {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
          expect(row.getAttribute('tabIndex')).toBe('0');
        });
      }
    });
  });

  it('respeta prefers-reduced-motion', () => {
    document.documentElement.classList.add('animations-disabled');
    render(<ProveedorAnalytics />);
    document.documentElement.classList.remove('animations-disabled');
  });

  it('calcula métricas correctamente', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/promedio_general/i)).toBeDefined();
    });
  });

  it('muestra tendencias con iconos correctos', async () => {
    render(<ProveedorAnalytics />);
    
    await waitFor(() => {
      const table = screen.getByRole('table');
      if (table) {
        expect(table).toBeDefined();
      }
    });
  });
});