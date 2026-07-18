import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/upload-document', () => ({
  uploadDocument: vi.fn(() => Promise.resolve('https://example.com/doc.pdf')),
  validateDocumentFile: vi.fn(() => ({ valid: true })),
}));

const mockAddPlano = vi.fn();
const mockUpdatePlano = vi.fn();
const mockAddRfi = vi.fn();
const mockUpdateRfi = vi.fn();
const mockAddSubmittal = vi.fn();
const mockUpdateSubmittal = vi.fn();
const mockSetCurrentProjectId = vi.fn();

let mockDocumentos: any[] = [];
let mockPlanos: any[] = [];
let mockRfis: any[] = [];
let mockSubmittals: any[] = [];
let mockProyectos: any[] = [];
let mockCurrentProjectId = 'proj-1';

vi.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'gestion_documental.titulo': 'Gestión Documental',
    'gestion_documental.todos_proyectos': '— Todos los proyectos —',
    'gestion_documental.kpi_planos': 'Planos',
    'gestion_documental.kpi_rfis': 'RFIs Activos',
    'gestion_documental.kpi_submittals': 'Submittals Pendientes',
    'gestion_documental.tab_planos': 'Planos',
    'gestion_documental.tab_rfis': 'RFIs',
    'gestion_documental.tab_submittals': 'Submittals',
    'gestion_documental.planos_titulo': 'Planos por Disciplina',
    'gestion_documental.rfis_titulo': 'Request for Information (RFI)',
    'gestion_documental.submittals_titulo': 'Submittals',
    'gestion_documental.subir_plano': 'Subir Plano',
    'gestion_documental.nuevo_rfi': 'Nuevo RFI',
    'gestion_documental.nuevo_submittal': 'Nuevo Submittal',
    'gestion_documental.enviar_rfi': 'Enviar RFI',
    'gestion_documental.registrar_submittal': 'Registrar',
    'gestion_documental.sin_planos': 'Sin planos registrados',
    'gestion_documental.sin_rfis': 'Sin RFIs registrados',
    'gestion_documental.sin_submittals': 'Sin submittals registrados',
    'gestion_documental.nombre_plano_placeholder': 'Nombre del plano',
    'gestion_documental.version_placeholder': 'Versión (ej: 1.0)',
    'gestion_documental.descripcion_placeholder': 'Descripción (opcional)',
    'gestion_documental.rfi_titulo_placeholder': 'Título del RFI',
    'gestion_documental.rfi_descripcion_placeholder': 'Descripción detallada...',
    'gestion_documental.rfi_destino_placeholder': 'Destinatario (ej: Arquitecto de proyecto)',
    'gestion_documental.submittal_titulo_placeholder': 'Título',
    'gestion_documental.proveedor_placeholder': 'Proveedor',
    'gestion_documental.descripcion_submittal_placeholder': 'Descripción...',
    'gestion_documental.nueva_version': 'Nueva versión',
    'gestion_documental.obsoleto': 'Obsoleto',
    'gestion_documental.activar': 'Activar',
    'gestion_documental.responder': 'Responder',
    'gestion_documental.cerrar': 'Cerrar',
    'gestion_documental.aprobar': 'Aprobar',
    'gestion_documental.comentar': 'Comentar',
    'gestion_documental.rechazar': 'Rechazar',
    'gestion_documental.ver_archivo': 'Ver archivo',
    'gestion_documental.selecciona_proyecto': 'Selecciona un proyecto',
    'gestion_documental.disciplina_arquitectura': 'Arquitectura',
    'gestion_documental.disciplina_estructura': 'Estructura',
    'gestion_documental.disciplina_instalaciones': 'Instalaciones',
    'gestion_documental.disciplina_electricas': 'Eléctricas',
    'gestion_documental.disciplina_sanitarias': 'Sanitarias',
    'gestion_documental.disciplina_mecanicas': 'Mecánicas',
    'gestion_documental.disciplina_otra': 'Otra',
    'gestion_documental.cat_material': 'Material',
    'gestion_documental.cat_equipo': 'Equipo',
    'gestion_documental.cat_especificacion': 'Especificación',
    'gestion_documental.cat_otro': 'Otro',
    'gestion_documental.archivo': 'Archivo (PDF, Imágenes)',
    'gestion_documental.archivo_adjunto': 'Archivo adjunto (opcional)',
    'gestion_documental.archivo_submittal': 'Archivo de submittal (opcional)',
    'common.cancelar': 'Cancelar',
  };
  return {
    useTranslation: () => ({
      t: (key: string, fallback?: string, params?: Record<string, string | number>) => {
        let text = translations[key] || (typeof fallback === 'string' ? fallback : key);
        const p = typeof fallback === 'object' ? fallback : params;
        if (p) {
          for (const [k, v] of Object.entries(p)) {
            text = text.replace(`{{${k}}}`, String(v));
          }
        }
        return text;
      },
      i18n: { language: 'es', changeLanguage: vi.fn() },
    }),
  };
});

vi.mock('../erp/store', () => ({
  useErp: () => ({
    documentos: mockDocumentos,
    proyectos: mockProyectos,
    user: { nombre: 'Tester' },
    planos: mockPlanos,
    addPlano: mockAddPlano,
    updatePlano: mockUpdatePlano,
    rfis: mockRfis,
    addRfi: mockAddRfi,
    updateRfi: mockUpdateRfi,
    submittals: mockSubmittals,
    addSubmittal: mockAddSubmittal,
    updateSubmittal: mockUpdateSubmittal,
    currentProjectId: mockCurrentProjectId,
    setCurrentProjectId: mockSetCurrentProjectId,
  }),
}));

import GestionDocumental from '../erp/screens/GestionDocumental';

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

beforeEach(() => {
  vi.clearAllMocks();
  mockProyectos = [
    { id: 'proj-1', nombre: 'Torre Norte', etapa: 'ejecucion' },
    { id: 'proj-2', nombre: 'Edificio Sur', etapa: 'ejecucion' },
  ];
  mockCurrentProjectId = 'proj-1';
  mockDocumentos = [
    { id: 'doc-1', proyectoId: 'proj-1', tipo: 'plano', nombre: 'Plano estructural', estado: 'vigente' },
    { id: 'doc-2', proyectoId: 'proj-1', tipo: 'rfi', nombre: 'RFI cimentación', estado: 'abierto' },
    { id: 'doc-3', proyectoId: 'proj-1', tipo: 'submittal', nombre: 'Submittal acero', estado: 'pendiente' },
  ];
  mockPlanos = [
    { id: 'p-1', proyectoId: 'proj-1', tipo: 'plano', nombre: 'Plano Arquitectónico', disciplina: 'arquitectura', version: '1.0', fechaSubida: '2026-07-01', subidoPor: 'Tester', estado: 'vigente', url: 'https://example.com/p1.pdf' },
    { id: 'p-2', proyectoId: 'proj-1', tipo: 'plano', nombre: 'Plano Estructural', disciplina: 'estructura', version: '2.0', fechaSubida: '2026-07-02', subidoPor: 'Tester', estado: 'obsoleto' },
  ];
  mockRfis = [
    { id: 'r-1', proyectoId: 'proj-1', tipo: 'rfi', numero: 'RFI-proj-001', titulo: 'Consulta de cimentación', descripcion: 'Detalle de zapata', solicitante: 'Tester', destino: 'Arquitecto', fechaSolicitud: '2026-07-01', fechaEnvio: '2026-07-01', estado: 'abierto' },
    { id: 'r-2', proyectoId: 'proj-1', tipo: 'rfi', numero: 'RFI-proj-002', titulo: 'Consulta cerrada', descripcion: 'Ya resuelto', solicitante: 'Tester', destino: 'Ingeniero', fechaSolicitud: '2026-06-01', fechaEnvio: '2026-06-01', estado: 'cerrado' },
  ];
  mockSubmittals = [
    { id: 's-1', proyectoId: 'proj-1', tipo: 'submittal', titulo: 'Submittal de concreto', categoria: 'material', proveedor: 'Cementos GT', fechaEnvio: '2026-07-01', estado: 'pendiente' },
    { id: 's-2', proyectoId: 'proj-1', tipo: 'submittal', titulo: 'Submittal aprobado', categoria: 'equipo', proveedor: 'Equipos SA', fechaEnvio: '2026-06-01', estado: 'aprobado' },
  ];
});

afterEach(cleanup);

describe('GestionDocumental Screen', () => {
  describe('Renderizado de tabs', () => {
    it('renderiza título', async () => {
      render(<GestionDocumental />);
      await waitFor(() => {
        expect(screen.getByText('Gestión Documental')).toBeInTheDocument();
      });
    });

    it('renderiza los tres tabs Planos, RFIs y Submittals', async () => {
      render(<GestionDocumental />);
      await waitFor(() => {
        expect(screen.getByLabelText('Planos')).toBeInTheDocument();
        expect(screen.getByLabelText('RFIs')).toBeInTheDocument();
        expect(screen.getByLabelText('Submittals')).toBeInTheDocument();
      });
    });

    it('muestra el tab de Planos por defecto con su contenido', async () => {
      render(<GestionDocumental />);
      await waitFor(() => {
        expect(screen.getByText('Planos por Disciplina')).toBeInTheDocument();
        expect(screen.getByText('Plano Arquitectónico')).toBeInTheDocument();
      });
    });
  });

  describe('Carga de contenido por tab', () => {
    it('carga el contenido del tab RFIs al seleccionarlo', async () => {
      render(<GestionDocumental />);
      await waitFor(() => expect(screen.getByLabelText('RFIs')).toBeInTheDocument());
      fireEvent.click(screen.getByLabelText('RFIs'));
      await waitFor(() => {
        expect(screen.getByText('Request for Information (RFI)')).toBeInTheDocument();
        expect(screen.getByText('Consulta de cimentación')).toBeInTheDocument();
      });
    });

    it('carga el contenido del tab Submittals al seleccionarlo', async () => {
      render(<GestionDocumental />);
      await waitFor(() => expect(screen.getByLabelText('Submittals')).toBeInTheDocument());
      fireEvent.click(screen.getByLabelText('Submittals'));
      await waitFor(() => {
        expect(screen.getByText('Submittal de concreto')).toBeInTheDocument();
      });
    });

    it('filtra los RFIs cerrados del listado activo', async () => {
      render(<GestionDocumental />);
      await waitFor(() => expect(screen.getByLabelText('RFIs')).toBeInTheDocument());
      fireEvent.click(screen.getByLabelText('RFIs'));
      await waitFor(() => {
        expect(screen.getByText('Consulta de cimentación')).toBeInTheDocument();
        expect(screen.queryByText('Consulta cerrada')).not.toBeInTheDocument();
      });
    });

    it('solo muestra submittals pendientes en el listado', async () => {
      render(<GestionDocumental />);
      await waitFor(() => expect(screen.getByLabelText('Submittals')).toBeInTheDocument());
      fireEvent.click(screen.getByLabelText('Submittals'));
      await waitFor(() => {
        expect(screen.getByText('Submittal de concreto')).toBeInTheDocument();
        expect(screen.queryByText('Submittal aprobado')).not.toBeInTheDocument();
      });
    });
  });

  describe('Transiciones de estado del flujo', () => {
    it('cambia el estado de un plano vigente a obsoleto', async () => {
      render(<GestionDocumental />);
      await waitFor(() => expect(screen.getByText('Plano Arquitectónico')).toBeInTheDocument());
      fireEvent.click(screen.getAllByText('Obsoleto')[0]);
      await waitFor(() => {
        expect(mockUpdatePlano).toHaveBeenCalledWith('p-1', { estado: 'obsoleto' });
      });
    });

    it('aprueba un submittal pendiente', async () => {
      render(<GestionDocumental />);
      await waitFor(() => expect(screen.getByLabelText('Submittals')).toBeInTheDocument());
      fireEvent.click(screen.getByLabelText('Submittals'));
      await waitFor(() => expect(screen.getByText('Aprobar')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Aprobar'));
      await waitFor(() => {
        expect(mockUpdateSubmittal).toHaveBeenCalledWith('s-1', { estado: 'aprobado' });
      });
    });

    it('rechaza un submittal pendiente', async () => {
      render(<GestionDocumental />);
      await waitFor(() => expect(screen.getByLabelText('Submittals')).toBeInTheDocument());
      fireEvent.click(screen.getByLabelText('Submittals'));
      await waitFor(() => expect(screen.getByText('Rechazar')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Rechazar'));
      await waitFor(() => {
        expect(mockUpdateSubmittal).toHaveBeenCalledWith('s-1', { estado: 'rechazado' });
      });
    });
  });

  describe('Formulario de carga de documentos', () => {
    it('abre el formulario para subir un plano', async () => {
      render(<GestionDocumental />);
      await waitFor(() => expect(screen.getAllByText('Subir Plano')[0]).toBeInTheDocument());
      fireEvent.click(screen.getAllByText('Subir Plano')[0]);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Nombre del plano')).toBeInTheDocument();
      });
    });

    it('abre el formulario para crear un RFI', async () => {
      render(<GestionDocumental />);
      await waitFor(() => expect(screen.getByLabelText('RFIs')).toBeInTheDocument());
      fireEvent.click(screen.getByLabelText('RFIs'));
      await waitFor(() => expect(screen.getByText('Nuevo RFI')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Nuevo RFI'));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Título del RFI')).toBeInTheDocument();
      });
    });
  });

  describe('Preview y versiones de documentos', () => {
    it('muestra enlace de vista previa del archivo del plano', async () => {
      render(<GestionDocumental />);
      await waitFor(() => {
        expect(screen.getAllByText('Ver archivo')[0]).toBeInTheDocument();
      });
    });

    it('muestra la versión del plano', async () => {
      render(<GestionDocumental />);
      await waitFor(() => {
        expect(screen.getByText('📄 v1.0')).toBeInTheDocument();
      });
    });
  });

  describe('Estado vacío por tab', () => {
    it('muestra mensaje cuando no hay planos', async () => {
      mockPlanos = [];
      render(<GestionDocumental />);
      await waitFor(() => {
        expect(screen.getByText('Sin planos registrados')).toBeInTheDocument();
      });
    });

    it('muestra mensaje cuando no hay RFIs', async () => {
      mockRfis = [];
      render(<GestionDocumental />);
      await waitFor(() => expect(screen.getByLabelText('RFIs')).toBeInTheDocument());
      fireEvent.click(screen.getByLabelText('RFIs'));
      await waitFor(() => {
        expect(screen.getByText('Sin RFIs registrados')).toBeInTheDocument();
      });
    });

    it('muestra mensaje cuando no hay submittals', async () => {
      mockSubmittals = [];
      render(<GestionDocumental />);
      await waitFor(() => expect(screen.getByLabelText('Submittals')).toBeInTheDocument());
      fireEvent.click(screen.getByLabelText('Submittals'));
      await waitFor(() => {
        expect(screen.getByText('Sin submittals registrados')).toBeInTheDocument();
      });
    });
  });

  describe('Filtro por proyecto', () => {
    it('renderiza el selector de proyecto y sus opciones', async () => {
      render(<GestionDocumental />);
      await waitFor(() => {
        expect(screen.getByText('— Todos los proyectos —')).toBeInTheDocument();
        expect(screen.getByText('Torre Norte')).toBeInTheDocument();
      });
    });

    it('combina el filtro por proyecto activo mostrando solo sus documentos', async () => {
      mockCurrentProjectId = 'proj-2';
      render(<GestionDocumental />);
      await waitFor(() => {
        expect(screen.getByText('Sin planos registrados')).toBeInTheDocument();
      });
    });
  });
});
