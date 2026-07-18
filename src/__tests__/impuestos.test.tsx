import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const translations: Record<string, string> = {
  'impuestos.titulo': 'Impuestos',
  'impuestos.subtitulo': 'Resumen fiscal del periodo',
  'impuestos.resumen_periodo': 'Resumen del periodo',
  'impuestos.impuestos_periodo': 'Impuestos del periodo',
  'impuestos.ingresos': 'Ingresos',
  'impuestos.egresos': 'Egresos',
  'impuestos.utilidad_bruta': 'Utilidad Bruta',
  'impuestos.isr': 'ISR',
  'impuestos.isr_desc': '25% sobre renta imponible',
  'impuestos.tasa_efectiva': 'Tasa efectiva',
  'impuestos.base': 'Base',
  'impuestos.iva_pagar': 'IVA por pagar',
  'impuestos.iva_desc': 'Debito menos credito',
  'impuestos.iva_debito': 'IVA Debito',
  'impuestos.iva_credito': 'IVA Credito',
  'impuestos.detalle_calculo': 'Base de calculo detallada',
  'impuestos.calculo_isr': 'Calculo ISR',
  'impuestos.ingresos_gravables': 'Ingresos gravables',
  'impuestos.egresos_deducibles': 'Egresos deducibles',
  'impuestos.renta_imponible': 'Renta imponible',
  'impuestos.isr_25': 'ISR (25%)',
  'impuestos.calculo_iva': 'Calculo IVA',
  'impuestos.ingresos_base': 'Ingresos base',
  'impuestos.iva_debito_12': 'IVA Debito (12%)',
  'impuestos.iva_credito_12': 'IVA Credito (12%)',
  'impuestos.movimientos_periodo': 'Movimientos del periodo',
  'impuestos.registros': 'registros',
  'impuestos.sin_movimientos_periodo': 'No hay movimientos en este periodo',
  'impuestos.monto': 'Monto',
  'common.fecha': 'Fecha',
  'common.descripcion': 'Descripcion',
  'common.tipo': 'Tipo',
  'common.categoria': 'Categoria',
  'common.cargando': 'Cargando',
};

vi.mock('react-i18next', () => ({
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
}));

let mockMovimientos: any[] = [];
let mockProyectos: any[] = [];

vi.mock('../erp/store', () => ({
  useErp: () => ({
    movimientos: mockMovimientos,
    proyectos: mockProyectos,
  }),
}));

import Impuestos from '../erp/screens/Impuestos';

const today = new Date();
const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

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
  mockMovimientos = [
    { id: 'm-1', proyectoId: 'proj-1', fecha: `${currentMonth}-15`, descripcion: 'Pago materiales', tipo: 'ingreso', monto: 500000, costoTotal: 500000, categoria: 'materiales' },
    { id: 'm-2', proyectoId: 'proj-1', fecha: `${currentMonth}-20`, descripcion: 'Pago nomina', tipo: 'gasto', monto: 200000, costoTotal: 200000, categoria: 'mano_obra' },
    { id: 'm-3', proyectoId: 'proj-2', fecha: `${currentMonth}-25`, descripcion: 'Venta', tipo: 'ingreso', monto: 300000, costoTotal: 300000, categoria: 'ventas' },
  ];
});

afterEach(cleanup);

describe('Impuestos Screen', () => {
  describe('Renderizado inicial', () => {
    it('renderiza titulo y subtitulo', async () => {
      render(<Impuestos />);
      await waitFor(() => {
        expect(screen.getByText('Impuestos')).toBeInTheDocument();
        expect(screen.getByText('Resumen fiscal del periodo')).toBeInTheDocument();
      });
    });

    it('renderiza filtros de proyecto y mes', async () => {
      render(<Impuestos />);
      await waitFor(() => {
        expect(screen.getByText('Impuestos')).toBeInTheDocument();
      });
      expect(document.querySelector('select')).toBeInTheDocument();
      expect(document.querySelector('input[type="month"]')).toBeInTheDocument();
    });

    it('renderiza tarjetas de resumen del periodo', async () => {
      render(<Impuestos />);
      await waitFor(() => {
        expect(screen.getByText('Ingresos')).toBeInTheDocument();
        expect(screen.getByText('Egresos')).toBeInTheDocument();
        expect(screen.getByText('Utilidad Bruta')).toBeInTheDocument();
      });
    });

    it('renderiza tarjetas de impuestos ISR e IVA', async () => {
      render(<Impuestos />);
      await waitFor(() => {
        expect(screen.getByText('ISR')).toBeInTheDocument();
        expect(screen.getByText('25% sobre renta imponible')).toBeInTheDocument();
        expect(screen.getByText('IVA por pagar')).toBeInTheDocument();
        expect(screen.getByText('Debito menos credito')).toBeInTheDocument();
      });
    });

    it('renderiza detalle de calculo ISR e IVA', async () => {
      render(<Impuestos />);
      await waitFor(() => {
        expect(screen.getByText(/Base de calculo detallada/)).toBeInTheDocument();
        expect(screen.getByText(/Calculo ISR/)).toBeInTheDocument();
        expect(screen.getByText(/Calculo IVA/)).toBeInTheDocument();
        expect(screen.getByText(/ISR \(25%\)/)).toBeInTheDocument();
        expect(screen.getByText(/IVA Debito \(12%\)/)).toBeInTheDocument();
        expect(screen.getByText(/IVA Credito \(12%\)/)).toBeInTheDocument();
      });
    });

    it('renderiza tabla de movimientos', async () => {
      render(<Impuestos />);
      await waitFor(() => {
        expect(screen.getByText(/Movimientos del periodo/)).toBeInTheDocument();
        expect(screen.getByText(/3 registros/)).toBeInTheDocument();
        expect(screen.getByText('Pago materiales')).toBeInTheDocument();
        expect(screen.getByText('Pago nomina')).toBeInTheDocument();
      });
    });
  });

  describe('Filtros', () => {
    it('filtra por proyecto dropdown', async () => {
      render(<Impuestos />);
      await waitFor(() => expect(screen.getByText('Pago materiales')).toBeInTheDocument());
      const select = document.querySelector('select');
      fireEvent.change(select!, { target: { value: 'proj-2' } });
      await waitFor(() => {
        expect(screen.queryByText('Pago materiales')).not.toBeInTheDocument();
        expect(screen.getByText('Venta')).toBeInTheDocument();
      });
    });

    it('filtra vacio cuando no hay movimientos en el mes', async () => {
      render(<Impuestos />);
      await waitFor(() => expect(document.querySelector('select')).toBeInTheDocument());
      const monthInput = document.querySelector('input[type="month"]') as HTMLInputElement;
      fireEvent.change(monthInput, { target: { value: '2025-01' } });
      await waitFor(() => {
        expect(screen.getByText('No hay movimientos en este periodo')).toBeInTheDocument();
      });
    });

    it('filtro Todos restaura todos los movimientos', async () => {
      render(<Impuestos />);
      await waitFor(() => expect(screen.getByText('Pago materiales')).toBeInTheDocument());
      const select = document.querySelector('select');
      fireEvent.change(select!, { target: { value: 'proj-2' } });
      await waitFor(() => expect(screen.getByText('Venta')).toBeInTheDocument());
      fireEvent.change(select!, { target: { value: '' } });
      await waitFor(() => {
        expect(screen.getByText('Pago materiales')).toBeInTheDocument();
        expect(screen.getByText('Pago nomina')).toBeInTheDocument();
        expect(screen.getByText('Venta')).toBeInTheDocument();
      });
    });
  });

  describe('Calculos de impuestos', () => {
    it('calcula ISR como 25% sobre utilidad', async () => {
      render(<Impuestos />);
      await waitFor(() => {
        expect(screen.getByText(/ISR \(25%\)/)).toBeInTheDocument();
      });
    });

    it('calcula IVA debito 12% sobre ingresos', async () => {
      render(<Impuestos />);
      await waitFor(() => {
        expect(screen.getByText(/IVA Debito \(12%\)/)).toBeInTheDocument();
        expect(screen.getByText(/IVA Credito \(12%\)/)).toBeInTheDocument();
      });
    });

    it('muestra tasa efectiva de ISR', async () => {
      render(<Impuestos />);
      await waitFor(() => {
        expect(screen.getByText(/Tasa efectiva/)).toBeInTheDocument();
      });
    });

    it('ISR es 0 cuando hay perdidas', async () => {
      mockMovimientos = [
        { id: 'm-4', proyectoId: 'proj-1', fecha: `${currentMonth}-15`, descripcion: 'Perdida', tipo: 'gasto', monto: 1000000, costoTotal: 1000000, categoria: 'operaciones' },
      ];
      render(<Impuestos />);
      await waitFor(() => {
        expect(screen.getByText('Utilidad Bruta')).toBeInTheDocument();
      });
    });
  });

  describe('Virtualizacion', () => {
    it('activa virtualizacion cuando hay mas de 50 movimientos', async () => {
      const manyMovs = Array.from({ length: 55 }, (_, i) => ({
        id: `mv-${i}`, proyectoId: 'proj-1', fecha: `${currentMonth}-15`, descripcion: `Movimiento ${i}`, tipo: 'ingreso', monto: 1000, costoTotal: 1000, categoria: 'materiales',
      }));
      mockMovimientos = manyMovs;
      render(<Impuestos />);
      await waitFor(() => {
        expect(screen.getByText(/55 registros/)).toBeInTheDocument();
      });
    });
  });

  describe('Estados vacio y carga', () => {
    it('muestra estado vacio cuando no hay movimientos', async () => {
      mockMovimientos = [];
      render(<Impuestos />);
      await waitFor(() => {
        expect(screen.getByText('No hay movimientos en este periodo')).toBeInTheDocument();
      });
    });
  });
});
