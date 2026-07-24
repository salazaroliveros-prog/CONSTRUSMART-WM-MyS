import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

const hoisted = vi.hoisted(() => {
  let onAuthStateChangeCb: ((event: string, session: unknown) => void) | null = null;
  let supabaseEnabled = true;
  const mockSingle = vi.fn();
  const mockUnsubscribe = vi.fn();
  const mockEq = vi.fn(() => ({ single: mockSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));

  return {
    getSupabaseEnabled: () => supabaseEnabled,
    setSupabaseEnabled: (v: boolean) => { supabaseEnabled = v; },
    getOnAuthStateChangeCb: () => onAuthStateChangeCb,
    setOnAuthStateChangeCb: (v: null) => { onAuthStateChangeCb = v; },
    mockGetSession: vi.fn(),
    mockOnAuthStateChange: vi.fn((cb) => {
      onAuthStateChangeCb = cb;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    }),
    mockSignInWithOAuth: vi.fn(),
    mockSignOut: vi.fn(),
    mockSingle,
    mockEq,
    mockSelect,
    mockFrom,
    mockUnsubscribe,
  };
});

vi.mock('@/lib/supabase', () => ({
  get hasSupabase() { return hoisted.getSupabaseEnabled(); },
  supabase: {
    auth: {
      getSession: hoisted.mockGetSession,
      onAuthStateChange: hoisted.mockOnAuthStateChange,
      signInWithOAuth: hoisted.mockSignInWithOAuth,
      signOut: hoisted.mockSignOut,
    },
    from: hoisted.mockFrom,
  },
}));

function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User',
      picture: 'https://example.com/avatar.png',
    },
    ...overrides,
  };
}

function createMockSession(userOverrides: Record<string, unknown> = {}) {
  return {
    data: {
      session: {
        user: createMockUser(userOverrides),
      },
    },
  };
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.setOnAuthStateChangeCb(null);
    hoisted.setSupabaseEnabled(true);
    hoisted.mockGetSession.mockResolvedValue({ data: { session: null } });
    hoisted.mockSingle.mockResolvedValue({ data: null });
    hoisted.mockSignInWithOAuth.mockResolvedValue({ error: null });
    hoisted.mockSignOut.mockResolvedValue(undefined);
  });

  it('initial loading state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('session found', async () => {
    hoisted.mockGetSession.mockResolvedValue(createMockSession());
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      nombre: 'Test User',
      rol: expect.any(String),
      avatar: 'https://example.com/avatar.png',
    });
    expect(result.current.user?.id).toBe('user-123');
    expect(result.current.user?.email).toBe('test@example.com');
    expect(result.current.user?.nombre).toBe('Test User');
    expect(result.current.user?.avatar).toBe('https://example.com/avatar.png');
  });

  it('no session', async () => {
    hoisted.mockGetSession.mockResolvedValue({ data: { session: null } });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe('');
  });

  it('supabase not configured', async () => {
    hoisted.setSupabaseEnabled(false);
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Supabase no está configurado. Configura VITE_SUPABASE_URL y VITE_SUPABASE_KEY en .env');
  });

  it('rol from profiles table', async () => {
    hoisted.mockGetSession.mockResolvedValue(createMockSession());
    hoisted.mockSingle.mockResolvedValue({ data: { rol: 'Compras' } });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(hoisted.mockFrom).toHaveBeenCalledWith('profiles');
    expect(hoisted.mockSingle).toHaveBeenCalled();
    expect(result.current.user?.rol).toBe('Compras');
  });

  it('default rol when profiles fails', async () => {
    hoisted.mockGetSession.mockResolvedValue(createMockSession());
    hoisted.mockSingle.mockRejectedValue(new Error('not found'));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.rol).toBe('Residente');
  });

  it('signInWithGoogle', async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signInWithGoogle();
    });
    expect(hoisted.mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { access_type: 'offline', prompt: 'select_account' },
      },
    });
  });

  it('signInWithGoogle OAuth error', async () => {
    hoisted.mockSignInWithOAuth.mockResolvedValue({ error: { message: 'OAuth failed' } });
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signInWithGoogle();
    });
    expect(result.current.error).toBe('OAuth failed');
    expect(result.current.loading).toBe(false);
  });

  it('signInWithGoogle when Supabase not configured', async () => {
    hoisted.setSupabaseEnabled(false);
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signInWithGoogle();
    });
    expect(result.current.error).toBe('Supabase no está configurado.');
    expect(hoisted.mockSignInWithOAuth).not.toHaveBeenCalled();
  });

  it('signOut', async () => {
    hoisted.mockGetSession.mockResolvedValue(createMockSession());
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.signOut();
    });
    expect(hoisted.mockSignOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('signOut error', async () => {
    hoisted.mockSignOut.mockRejectedValue(new Error('signout error'));
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signOut();
    });
    expect(hoisted.mockSignOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('signOut when Supabase not configured', async () => {
    hoisted.setSupabaseEnabled(false);
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.signOut();
    });
    expect(hoisted.mockSignOut).not.toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('refreshSession', async () => {
    hoisted.mockGetSession.mockResolvedValue(createMockSession());
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    hoisted.mockGetSession.mockClear();
    hoisted.mockGetSession.mockResolvedValue(createMockSession());
    await act(async () => {
      await result.current.refreshSession();
    });
    expect(hoisted.mockGetSession).toHaveBeenCalled();
  });

  it('onAuthStateChange listener', () => {
    renderHook(() => useAuth());
    expect(hoisted.mockOnAuthStateChange).toHaveBeenCalled();
  });

  it('onAuthStateChange unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => useAuth());
    unmount();
    expect(hoisted.mockUnsubscribe).toHaveBeenCalled();
  });

  it('onAuthStateChange with session', async () => {
    hoisted.mockGetSession.mockResolvedValue({ data: { session: null } });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    hoisted.mockGetSession.mockResolvedValue(createMockSession());
    const cb = hoisted.getOnAuthStateChangeCb();
    expect(cb).not.toBeNull();
    await act(async () => {
      cb!('SIGNED_IN', { user: createMockUser() });
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.id).toBe('user-123');
  });

  it('onAuthStateChange without session', async () => {
    hoisted.mockGetSession.mockResolvedValue(createMockSession());
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).not.toBeNull();
    const cb = hoisted.getOnAuthStateChangeCb();
    await act(async () => {
      cb!('SIGNED_OUT', null);
    });
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('window hash update', async () => {
    window.location.hash = '#login';
    hoisted.mockGetSession.mockResolvedValue(createMockSession());
    renderHook(() => useAuth());
    await waitFor(() => {
      expect(window.location.hash).toBe('#dashboard');
    });
    window.location.hash = '';
  });

  it('buildUserFromSession with user metadata', async () => {
    hoisted.mockGetSession.mockResolvedValue(createMockSession({
      user_metadata: {
        full_name: 'Full User',
        name: 'NameField',
        picture: 'https://pic.jpg',
        avatar_url: 'https://avatar.jpg',
      },
    }));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.nombre).toBe('Full User');
    expect(result.current.user?.avatar).toBe('https://pic.jpg');
  });

  it('email-based name fallback', async () => {
    hoisted.mockGetSession.mockResolvedValue(createMockSession({
      email: 'john.doe@example.com',
      user_metadata: {},
    }));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.nombre).toBe('john.doe');
    expect(result.current.user?.email).toBe('john.doe@example.com');
  });

  it('all fields default gracefully', async () => {
    const baseUser = createMockUser();
    hoisted.mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { id: baseUser.id } as never,
        },
      },
    });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.nombre).toBe('Usuario');
    expect(result.current.user?.email).toBe('');
    expect(result.current.user?.avatar).toBe('');
    expect(result.current.user?.id).toBe('user-123');
  });
});
