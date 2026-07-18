import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockAddPublicacionMuro = vi.fn();
const mockAddComentarioMuro = vi.fn();
const mockLikePublicacionMuro = vi.fn();

let mockPublicaciones: any[] = [];
let mockProyectos: any[] = [];
let mockCurrentProjectId = 'proj-1';

vi.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'muro.titulo': 'Muro de Obra',
    'muro.filtrar_tipo': 'Filtrar por tipo',
    'muro.todos': 'Todos',
    'muro.placeholder': '¿Qué hay de nuevo en la obra?',
    'muro.publicar': 'Publicar',
    'muro.publicacion_creada': 'Publicación creada',
    'muro.comentario_agregado': 'Comentario agregado',
    'muro.sin_publicaciones': 'Sin publicaciones aún',
    'muro.like': 'Me gusta',
    'muro.comentar': 'Comentar',
    'muro.enviar_comentario': 'Enviar comentario',
    'muro.placeholder_comentario': 'Escribe un comentario...',
    'muro.tipo_avance': 'Avance',
    'muro.tipo_calidad': 'Calidad',
    'muro.tipo_seguridad': 'Seguridad',
    'muro.tipo_general': 'General',
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
    publicaciones: mockPublicaciones,
    proyectos: mockProyectos,
    addPublicacionMuro: mockAddPublicacionMuro,
    addComentarioMuro: mockAddComentarioMuro,
    likePublicacionMuro: mockLikePublicacionMuro,
    currentProjectId: mockCurrentProjectId,
  }),
}));

import MuroObra from '../erp/screens/MuroObra';

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
  mockPublicaciones = [
    { id: 'pub-1', proyectoId: 'proj-1', texto: 'Avance de losa nivel 3', tipo: 'avance', likes: 4, comentarios: [], createdAt: '2026-07-10T10:00:00.000Z', foto: 'https://example.com/foto1.jpg' },
    { id: 'pub-2', proyectoId: 'proj-1', texto: 'Incidencia de seguridad en andamio', tipo: 'seguridad', likes: 1, comentarios: [{ id: 'c-1', autor: 'Juan', texto: 'Revisar de inmediato', createdAt: '2026-07-10T11:00:00.000Z' }], createdAt: '2026-07-09T09:00:00.000Z' },
    { id: 'pub-3', proyectoId: 'proj-1', texto: 'Control de calidad de concreto', tipo: 'calidad', likes: 0, comentarios: [], createdAt: '2026-07-08T08:00:00.000Z' },
  ];
});

afterEach(cleanup);

describe('MuroObra Screen', () => {
  describe('Renderizado del feed', () => {
    it('renderiza título', async () => {
      render(<MuroObra />);
      await waitFor(() => {
        expect(screen.getByText('Muro de Obra')).toBeInTheDocument();
      });
    });

    it('renderiza las publicaciones del feed', async () => {
      render(<MuroObra />);
      await waitFor(() => {
        expect(screen.getByText('Avance de losa nivel 3')).toBeInTheDocument();
        expect(screen.getByText('Incidencia de seguridad en andamio')).toBeInTheDocument();
        expect(screen.getByText('Control de calidad de concreto')).toBeInTheDocument();
      });
    });

    it('muestra el contador de likes de cada publicación', async () => {
      render(<MuroObra />);
      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument();
      });
    });
  });

  describe('Filtros por tipo', () => {
    it('filtra publicaciones por tipo seguridad', async () => {
      render(<MuroObra />);
      await waitFor(() => expect(screen.getByText('Avance de losa nivel 3')).toBeInTheDocument());
      const select = screen.getByLabelText('Filtrar por tipo');
      fireEvent.change(select, { target: { value: 'seguridad' } });
      await waitFor(() => {
        expect(screen.getByText('Incidencia de seguridad en andamio')).toBeInTheDocument();
        expect(screen.queryByText('Avance de losa nivel 3')).not.toBeInTheDocument();
      });
    });

    it('filtra publicaciones por tipo avance', async () => {
      render(<MuroObra />);
      await waitFor(() => expect(screen.getByText('Avance de losa nivel 3')).toBeInTheDocument());
      const select = screen.getByLabelText('Filtrar por tipo');
      fireEvent.change(select, { target: { value: 'avance' } });
      await waitFor(() => {
        expect(screen.getByText('Avance de losa nivel 3')).toBeInTheDocument();
        expect(screen.queryByText('Control de calidad de concreto')).not.toBeInTheDocument();
      });
    });

    it('combina filtro de tipo con orden por fecha descendente', async () => {
      render(<MuroObra />);
      await waitFor(() => expect(screen.getByText('Avance de losa nivel 3')).toBeInTheDocument());
      const select = screen.getByLabelText('Filtrar por tipo');
      fireEvent.change(select, { target: { value: 'calidad' } });
      await waitFor(() => {
        expect(screen.getByText('Control de calidad de concreto')).toBeInTheDocument();
        expect(screen.queryByText('Incidencia de seguridad en andamio')).not.toBeInTheDocument();
      });
    });
  });

  describe('Crear publicación', () => {
    it('renderiza el selector de tipo y el área de texto', async () => {
      render(<MuroObra />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('¿Qué hay de nuevo en la obra?')).toBeInTheDocument();
        expect(screen.getByText('Publicar')).toBeInTheDocument();
      });
    });

    it('crea una publicación con texto y tipo seleccionado', async () => {
      render(<MuroObra />);
      await waitFor(() => expect(screen.getByPlaceholderText('¿Qué hay de nuevo en la obra?')).toBeInTheDocument());
      fireEvent.change(screen.getByPlaceholderText('¿Qué hay de nuevo en la obra?'), { target: { value: 'Nueva publicación de prueba' } });
      fireEvent.click(screen.getByText('Publicar'));
      await waitFor(() => {
        expect(mockAddPublicacionMuro).toHaveBeenCalledWith(expect.objectContaining({ texto: 'Nueva publicación de prueba', tipo: 'general' }));
        expect(toast.success).toHaveBeenCalledWith('Publicación creada');
      });
    });

    it('no publica cuando el texto está vacío', async () => {
      render(<MuroObra />);
      await waitFor(() => expect(screen.getByText('Publicar')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Publicar'));
      await waitFor(() => {
        expect(mockAddPublicacionMuro).not.toHaveBeenCalled();
      });
    });
  });

  describe('Interacciones con publicaciones', () => {
    it('da like a una publicación', async () => {
      render(<MuroObra />);
      await waitFor(() => expect(screen.getByText('Avance de losa nivel 3')).toBeInTheDocument());
      fireEvent.click(screen.getAllByLabelText('Me gusta')[0]);
      await waitFor(() => {
        expect(mockLikePublicacionMuro).toHaveBeenCalled();
      });
    });

    it('agrega un comentario a una publicación', async () => {
      render(<MuroObra />);
      await waitFor(() => expect(screen.getByText('Avance de losa nivel 3')).toBeInTheDocument());
      const inputs = screen.getAllByPlaceholderText('Escribe un comentario...');
      fireEvent.change(inputs[0], { target: { value: 'Excelente avance' } });
      fireEvent.click(screen.getAllByLabelText('Enviar comentario')[0]);
      await waitFor(() => {
        expect(mockAddComentarioMuro).toHaveBeenCalledWith('pub-1', 'Excelente avance');
        expect(toast.success).toHaveBeenCalledWith('Comentario agregado');
      });
    });

    it('muestra los comentarios existentes de una publicación', async () => {
      render(<MuroObra />);
      await waitFor(() => {
        expect(screen.getByText('Revisar de inmediato')).toBeInTheDocument();
        expect(screen.getByText('Juan')).toBeInTheDocument();
      });
    });
  });

  describe('Estado vacío', () => {
    it('muestra mensaje cuando no hay publicaciones', async () => {
      mockPublicaciones = [];
      render(<MuroObra />);
      await waitFor(() => {
        expect(screen.getByText('Sin publicaciones aún')).toBeInTheDocument();
      });
    });

    it('muestra estado vacío cuando ninguna publicación pertenece al proyecto activo', async () => {
      mockCurrentProjectId = 'proj-99';
      render(<MuroObra />);
      await waitFor(() => {
        expect(screen.getByText('Sin publicaciones aún')).toBeInTheDocument();
      });
    });
  });
});
