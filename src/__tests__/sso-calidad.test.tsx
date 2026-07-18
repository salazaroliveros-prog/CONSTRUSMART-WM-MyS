import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'sso_calidad.titulo': 'SSO y Control de Calidad',
    'sso_calidad.tab_incidentes': 'Incidentes',
    'sso_calidad.tab_checklist': 'Checklist SSO',
    'sso_calidad.tab_estadisticas': 'Estadisticas',
    'sso_calidad.tab_emergencia': 'Emergencia',
    'sso_calidad.tab_pruebas': 'Pruebas Lab',
    'sso_calidad.tab_nc': 'No Conformidades',
    'sso_calidad.tab_liberaciones': 'Liberacion',
    'sso_calidad.todos_proyectos': 'Todos los proyectos',
    'sso_calidad.reporte_incidentes': 'Reporte de Incidentes',
    'sso_calidad.nuevo_incidente': 'Nuevo Incidente',
    'sso_calidad.tipo_accidente': 'Accidente',
    'sso_calidad.tipo_cuasi': 'Cuasi-accidente',
    'sso_calidad.tipo_condicion': 'Condicion Insegura',
    'sso_calidad.tipo_acto': 'Acto Inseguro',
    'sso_calidad.geolocalizar': 'Geolocalizar',
    'sso_calidad.descripcion_incidente': 'Describe el incidente...',
    'sso_calidad.afectados': 'Afectados',
    'sso_calidad.testigos': 'Testigos (opcional)',
    'sso_calidad.acciones_inmediatas': 'Acciones inmediatas tomadas',
    'sso_calidad.reportar_incidente': 'Reportar Incidente',
    'sso_calidad.cancelar': 'Cancelar',
    'sso_calidad.incidente_reportado': 'Incidente reportado',
    'sso_calidad.sin_incidentes': 'Sin incidentes registrados',
    'sso_calidad.investigar': 'Investigar',
    'sso_calidad.cerrar': 'Cerrar',
    'sso_calidad.selecciona_proyecto': 'Selecciona un proyecto',
    'sso_calidad.descripcion_requerida': 'Descripcion requerida',
    'sso_calidad.max_1000_caracteres': 'Maximo 1000 caracteres',
    'sso_calidad.afectados_requerido': 'Afectados requerido',
    'sso_calidad.max_500_caracteres': 'Maximo 500 caracteres',
    'sso_calidad.titulo_checklist': 'Checklist Diario SSO',
    'sso_calidad.checklist_descripcion': 'Lista de verificacion',
    'sso_calidad.check_epi': 'EPI',
    'sso_calidad.check_senalizacion': 'Senalizacion',
    'sso_calidad.check_extintores': 'Extintores',
    'sso_calidad.check_botiquin': 'Botiquin',
    'sso_calidad.check_andamios': 'Andamios',
    'sso_calidad.check_electrica': 'Electrica',
    'sso_calidad.check_orden': 'Orden',
    'sso_calidad.check_excavacion': 'Excavacion',
    'sso_calidad.check_alturas': 'Alturas',
    'sso_calidad.check_herramientas': 'Herramientas',
    'sso_calidad.check_induccion': 'Induccion',
    'sso_calidad.supervisor_placeholder': 'Nombre del supervisor',
    'sso_calidad.registrar_checklist': 'Registrar',
    'sso_calidad.checklist_registrado': 'Checklist registrado',
    'sso_calidad.titulo_estadisticas': 'Estadisticas SSO',
    'sso_calidad.sin_datos_estadisticas': 'Sin datos de estadisticas',
    'sso_calidad.dias_sin_accidentes': 'Dias Sin Accidentes',
    'sso_calidad.dias': 'dias',
    'sso_calidad.total_incidentes': 'Total Incidentes',
    'sso_calidad.abiertos': 'abiertos',
    'sso_calidad.cerrados': 'cerrados',
    'sso_calidad.incidentes_por_tipo': 'Incidentes por Tipo',
    'sso_calidad.boton_emergencia_titulo': 'Boton de Emergencia',
    'sso_calidad.boton_emergencia_desc': 'Activa este boton',
    'sso_calidad.confirmar_emergencia': 'Confirmar activacion',
    'sso_calidad.emergencia_boton': 'EMERGENCIA',
    'sso_calidad.emergencia_aviso': 'Se compartira tu ubicacion',
    'sso_calidad.selecciona_proyecto_emergencia': 'Selecciona un proyecto primero',
    'sso_calidad.pruebas_laboratorio': 'Pruebas de Laboratorio',
    'sso_calidad.nueva_prueba': 'Nueva Prueba',
    'sso_calidad.sin_pruebas': 'Sin pruebas registradas',
    'sso_calidad.pasa': 'Pasa',
    'sso_calidad.no_pasa': 'No Pasa',
    'sso_calidad.registrar_prueba': 'Registrar Prueba',
    'sso_calidad.titulo_nc': 'No Conformidades (NC)',
    'sso_calidad.nueva_nc': 'Nueva NC',
    'sso_calidad.sin_nc': 'Sin no conformidades',
    'sso_calidad.registrar_nc': 'Registrar NC',
    'sso_calidad.plan_boton': 'Plan',
    'sso_calidad.titulo_liberaciones': 'Liberacion de Partidas',
    'sso_calidad.nueva_liberacion': 'Solicitar Liberacion',
    'sso_calidad.sin_liberaciones': 'Sin solicitudes de liberacion',
    'sso_calidad.solicitar_liberacion': 'Solicitar Liberacion',
    'sso_calidad.anonimo': 'Anonimo',
    'common.noData': 'Sin datos',
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
let mockUser: any = { nombre: 'Usuario Test' };
let mockIncidentes: any[] = [];
let mockPruebas: any[] = [];
let mockNcs: any[] = [];
let mockLiberaciones: any[] = [];
const mockAddNotificacion = vi.fn();
const mockAddIncidente = vi.fn();
const mockUpdateIncidente = vi.fn();
const mockAddPrueba = vi.fn();
const mockUpdatePrueba = vi.fn();
const mockAddNC = vi.fn();
const mockUpdateNC = vi.fn();
const mockAddLiberacion = vi.fn();
const mockUpdateLiberacion = vi.fn();

vi.mock('../erp/store', () => ({
  useErp: () => ({
    proyectos: mockProyectos,
    user: mockUser,
    addNotificacion: mockAddNotificacion,
    incidentes: mockIncidentes,
    addIncidente: mockAddIncidente,
    updateIncidente: mockUpdateIncidente,
    pruebas: mockPruebas,
    addPrueba: mockAddPrueba,
    updatePrueba: mockUpdatePrueba,
    ncs: mockNcs,
    addNC: mockAddNC,
    updateNC: mockUpdateNC,
    liberaciones: mockLiberaciones,
    addLiberacion: mockAddLiberacion,
    updateLiberacion: mockUpdateLiberacion,
  }),
}));

import SSOCalidad from '../erp/screens/SSOCalidad';

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
  Object.defineProperty(navigator, 'geolocation', {
    writable: true,
    value: {
      getCurrentPosition: vi.fn().mockImplementation((success) =>
        success({ coords: { latitude: 14.6349, longitude: -90.5062 } })
      ),
    },
  });
});

beforeEach(() => {
  vi.clearAllMocks();
  mockProyectos = [
    { id: 'proj-1', nombre: 'Proyecto Alpha' },
    { id: 'proj-2', nombre: 'Proyecto Beta' },
  ];
  mockIncidentes = [
    { id: 'inc-1', proyectoId: 'proj-1', tipo: 'accidente', descripcion: 'Caida de obrero', estado: 'abierto', fecha: '2026-07-10', hora: '10:00', reportadoPor: 'Juan', afectados: '2', testigos: '', accionesInmediatas: '', latitud: 14.6349, longitud: -90.5062, fotos: [] },
    { id: 'inc-2', proyectoId: 'proj-1', tipo: 'cuasi-accidente', descripcion: 'Cerca de caida', estado: 'investigacion', fecha: '2026-07-09', hora: '09:00', reportadoPor: 'Maria', afectados: '1', testigos: '', accionesInmediatas: '', latitud: null, longitud: null, fotos: [] },
  ];
  mockPruebas = [
    { id: 'prb-1', proyectoId: 'proj-1', tipo: 'concreto', descripcion: 'Resistencia 28 dias', resultado: 'pendiente', fechaMuestra: '2026-07-10', fechaResultado: '', responsable: 'Laboratorio A' },
  ];
  mockNcs = [
    { id: 'nc-1', proyectoId: 'proj-1', codigo: 'NC-001', descripcion: 'Concreto deficiente', categoria: 'material', estado: 'detectado', fechaDeteccion: '2026-07-10', detectadoPor: 'Inspector', planAccion: '', fechaCierre: '' },
  ];
  mockLiberaciones = [
    { id: 'lib-1', proyectoId: 'proj-1', renglonId: 'ren-1', renglonNombre: 'Losas nivel 3', estado: 'pendiente', fechaSolicitud: '2026-07-10', solicitante: 'Supervisor', supervisor: '', checklistAprobado: false, fechaLiberacion: '' },
  ];
});

afterEach(cleanup);

describe('SSOCalidad Screen', () => {
  describe('Tabs', () => {
    it('renderiza 7 botones de tabs', async () => {
      render(<SSOCalidad />);
      await waitFor(() => {
        expect(screen.getByText('Incidentes')).toBeInTheDocument();
        expect(screen.getByText('Checklist SSO')).toBeInTheDocument();
        expect(screen.getByText('Estadisticas')).toBeInTheDocument();
        expect(screen.getByText('Emergencia')).toBeInTheDocument();
        expect(screen.getByText('Pruebas Lab')).toBeInTheDocument();
        expect(screen.getByText('No Conformidades')).toBeInTheDocument();
        expect(screen.getByText('Liberacion')).toBeInTheDocument();
      });
    });

    it('cambiar tab muestra contenido correcto', async () => {
      render(<SSOCalidad />);
      await waitFor(() => {
        expect(screen.getByText('Reporte de Incidentes')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Emergencia'));
      await waitFor(() => {
        expect(screen.getByText('Boton de Emergencia')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Incidentes', () => {
    it('renderiza formulario de incidentes', async () => {
      render(<SSOCalidad />);
      await waitFor(() => {
        expect(screen.getByText('Nuevo Incidente')).toBeInTheDocument();
      });
    });

    it('enviar formulario llama addIncidente', async () => {
      render(<SSOCalidad />);
      await waitFor(() => {
        const select = screen.getAllByRole('combobox')[0];
        fireEvent.change(select, { target: { value: 'proj-1' } });
        fireEvent.click(screen.getByText('Nuevo Incidente'));
      });
      await waitFor(() => {
        const descInput = screen.getByPlaceholderText('Describe el incidente...');
        fireEvent.change(descInput, { target: { value: 'Nuevo incidente' } });
        const afectadosInput = screen.getByPlaceholderText('Afectados');
        fireEvent.change(afectadosInput, { target: { value: '3 personas' } });
        const submitBtn = screen.getByText('Reportar Incidente');
        fireEvent.click(submitBtn);
        expect(mockAddIncidente).toHaveBeenCalled();
      });
    });

    it('renderiza tarjetas de incidentes', async () => {
      render(<SSOCalidad />);
      await waitFor(() => {
        expect(screen.getByText('Caida de obrero')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Checklist SSO', () => {
    it('renderiza 11 items de checklist', async () => {
      render(<SSOCalidad />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('Checklist SSO'));
      });
      await waitFor(() => {
        expect(screen.getByText('EPI')).toBeInTheDocument();
        expect(screen.getByText('Senalizacion')).toBeInTheDocument();
        expect(screen.getByText('Extintores')).toBeInTheDocument();
        expect(screen.getByText('Botiquin')).toBeInTheDocument();
        expect(screen.getByText('Andamios')).toBeInTheDocument();
        expect(screen.getByText('Electrica')).toBeInTheDocument();
        expect(screen.getByText('Orden')).toBeInTheDocument();
        expect(screen.getByText('Excavacion')).toBeInTheDocument();
        expect(screen.getByText('Alturas')).toBeInTheDocument();
        expect(screen.getByText('Herramientas')).toBeInTheDocument();
        expect(screen.getByText('Induccion')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Estadisticas', () => {
    it('muestra dias sin accidentes', async () => {
      render(<SSOCalidad />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('Estadisticas'));
      });
      await waitFor(() => {
        expect(screen.getByText('Dias Sin Accidentes')).toBeInTheDocument();
        expect(screen.getByText('Total Incidentes')).toBeInTheDocument();
      });
    });

    it('renderiza grafico de barras por tipo', async () => {
      render(<SSOCalidad />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('Estadisticas'));
      });
      await waitFor(() => {
        expect(screen.getByText('Incidentes por Tipo')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Emergencia', () => {
    it('renderiza boton de emergencia', async () => {
      render(<SSOCalidad />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('Emergencia'));
      });
      await waitFor(() => {
        expect(screen.getByText('EMERGENCIA')).toBeInTheDocument();
      });
    });

    it('boton emergencia activa flujo con confirmacion', async () => {
      render(<SSOCalidad />);
      await waitFor(() => {
        const select = screen.getAllByRole('combobox')[0];
        fireEvent.change(select, { target: { value: 'proj-1' } });
        fireEvent.click(screen.getByText('Emergencia'));
      });
      await waitFor(() => {
        const emergenciaBtn = screen.getByText('EMERGENCIA');
        window.confirm = vi.fn(() => true);
        fireEvent.click(emergenciaBtn);
        expect(mockAddNotificacion).toHaveBeenCalled();
      });
    });
  });

  describe('Tab Pruebas', () => {
    it('renderiza tarjetas de pruebas', async () => {
      render(<SSOCalidad />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('Pruebas Lab'));
      });
      await waitFor(() => {
        expect(screen.getByText('Resistencia 28 dias')).toBeInTheDocument();
        expect(screen.getByText('Pasa')).toBeInTheDocument();
        expect(screen.getByText('No Pasa')).toBeInTheDocument();
      });
    });
  });

  describe('Tab NC', () => {
    it('renderiza tarjetas de no conformidades', async () => {
      render(<SSOCalidad />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('No Conformidades'));
      });
      await waitFor(() => {
        expect(screen.getByText('Concreto deficiente')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Liberaciones', () => {
    it('renderiza tarjetas de liberaciones', async () => {
      render(<SSOCalidad />);
      await waitFor(() => {
        fireEvent.click(screen.getByText('Liberacion'));
      });
      await waitFor(() => {
        expect(screen.getByText('Losas nivel 3')).toBeInTheDocument();
      });
    });
  });

  describe('Selector de proyecto', () => {
    it('cambia contexto de proyecto', async () => {
      render(<SSOCalidad />);
      await waitFor(() => {
        const select = screen.getAllByRole('combobox')[0];
        fireEvent.change(select, { target: { value: 'proj-2' } });
        expect(screen.getByText('Reporte de Incidentes')).toBeInTheDocument();
      });
    });
  });

  describe('Estado vacio', () => {
    it('muestra estado vacio cuando no hay datos', async () => {
      mockIncidentes = [];
      mockPruebas = [];
      mockNcs = [];
      mockLiberaciones = [];
      render(<SSOCalidad />);
      await waitFor(() => {
        expect(screen.getByText('Sin incidentes registrados')).toBeInTheDocument();
      });
    });
  });
});
