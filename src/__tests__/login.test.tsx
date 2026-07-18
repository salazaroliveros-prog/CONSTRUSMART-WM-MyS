import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Login from '../erp/screens/Login';

const mockSignInWithGoogle = vi.fn();
const mockSetView = vi.fn();

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

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(() => ({ data: null, error: null })) })) })),
    })),
  },
  hasSupabase: true,
}));

vi.mock('../erp/store', () => ({
  useErp: () => ({
    signInWithGoogle: mockSignInWithGoogle,
    setView: mockSetView,
    user: null,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'auth.iniciar_sesion': 'Iniciar Sesión',
        'auth.solo_admin_puede_acceder': 'Acceso solo para administrador',
        'auth.iniciar_sesion_google': 'Iniciar sesión con Google',
        'auth.iniciando_sesion': 'Iniciando sesión...',
        'auth.error_autenticacion': 'Error de autenticación',
        'auth.supabase_no_configurado': 'Supabase no está configurado',
        'auth.todos_derechos_reservados': 'Todos los derechos reservados',
      };
      return translations[key] || fallback || key;
    },
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
}));

describe('Login Screen', () => {
  beforeEach(() => {
    mockSignInWithGoogle.mockReset();
    mockSetView.mockReset();
  });

  it('debe renderizar el botón de inicio de sesión con Google', () => {
    render(<Login />);
    const btn = screen.getByRole('button', { name: /iniciar sesión con google/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it('debe mostrar el título de inicio de sesión', () => {
    render(<Login />);
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
  });

  it('debe llamar a signInWithGoogle al hacer clic en el botón', async () => {
    mockSignInWithGoogle.mockResolvedValueOnce(undefined);
    render(<Login />);
    const btn = screen.getByRole('button', { name: /iniciar sesión con google/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    });
  });

  it('debe deshabilitar el botón mientras loading es verdadero', async () => {
    mockSignInWithGoogle.mockImplementationOnce(() => new Promise(() => {}));
    render(<Login />);
    const btn = screen.getByRole('button', { name: /iniciar sesión con google/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(btn).toBeDisabled();
    });
    expect(screen.getByText('Iniciando sesión...')).toBeInTheDocument();
  });

  it('debe mostrar error de autenticación si signInWithGoogle falla', async () => {
    mockSignInWithGoogle.mockRejectedValueOnce(new Error('Error de conexión'));
    render(<Login />);
    const btn = screen.getByRole('button', { name: /iniciar sesión con google/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText('Error de conexión')).toBeInTheDocument();
    });
  });

  it('debe mostrar skeleton cuando hay loading sin error', () => {
    vi.mocked(mockSignInWithGoogle).mockImplementationOnce(() => new Promise(() => {}));
    render(<Login />);
    const btn = screen.getByRole('button', { name: /iniciar sesión con google/i });
    fireEvent.click(btn);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('debe deshabilitar el botón si Supabase no está configurado', async () => {
    const mod = await import('../lib/supabase');
    vi.mocked(mod).hasSupabase = false;
    render(<Login />);
    const btn = screen.getByRole('button', { name: /iniciar sesión con google/i });
    expect(btn).toBeDisabled();
    expect(screen.getByText(/supabase no está configurado/i)).toBeInTheDocument();
  });

  it('debe mostrar el año actual en el footer', () => {
    render(<Login />);
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(String(year)))).toBeInTheDocument();
  });
});
