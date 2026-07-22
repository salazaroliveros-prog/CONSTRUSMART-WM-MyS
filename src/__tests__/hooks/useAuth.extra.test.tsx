import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

const ADMIN_EMAIL = 'salazaroliveros@gmail.com';

const hoisted = vi.hoisted(() => {
  let supabaseEnabled = true;
  const mockSingle = vi.fn();
  const mockUnsubscribe = vi.fn();
  const mockEq = vi.fn(() => ({ single: mockSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));

  return {
    getSupabaseEnabled: () => supabaseEnabled,
    setSupabaseEnabled: (v: boolean) => { supabaseEnabled = v; },
    mockGetSession: vi.fn(),
    mockOnAuthStateChange: vi.fn((_cb: unknown) => ({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    })),
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

function makeSession(email: string, meta: Record<string, string> = {}) {
  return {
    data: {
      session: {
        user: {
          id: 'uid-abc',
          email,
          user_metadata: { full_name: 'Some Name', ...meta },
        },
      },
    },
  };
}

describe('useAuth — admin email shortcut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.setSupabaseEnabled(true);
    hoisted.mockGetSession.mockResolvedValue({ data: { session: null } });
    hoisted.mockSingle.mockResolvedValue({ data: null });
    hoisted.mockSignInWithOAuth.mockResolvedValue({ error: null });
    hoisted.mockSignOut.mockResolvedValue(undefined);
  });

  it('admin email always receives Administrador rol without hitting profiles table', async () => {
    hoisted.mockGetSession.mockResolvedValue(makeSession(ADMIN_EMAIL));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.rol).toBe('Administrador');
    expect(hoisted.mockFrom).not.toHaveBeenCalled();
  });

  it('admin email matching is case-insensitive', async () => {
    hoisted.mockGetSession.mockResolvedValue(makeSession(ADMIN_EMAIL.toUpperCase()));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.rol).toBe('Administrador');
    expect(hoisted.mockFrom).not.toHaveBeenCalled();
  });

  it('non-admin email queries profiles table for rol', async () => {
    hoisted.mockGetSession.mockResolvedValue(makeSession('worker@example.com'));
    hoisted.mockSingle.mockResolvedValue({ data: { rol: 'Residente' } });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(hoisted.mockFrom).toHaveBeenCalledWith('profiles');
    expect(result.current.user?.rol).toBe('Residente');
  });
});

describe('useAuth — session timeout race', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.setSupabaseEnabled(true);
    hoisted.mockSignInWithOAuth.mockResolvedValue({ error: null });
    hoisted.mockSignOut.mockResolvedValue(undefined);
    hoisted.mockSingle.mockResolvedValue({ data: null });
  });

  it('treats timeout (never-resolving getSession) as no session', async () => {
    vi.useFakeTimers();
    hoisted.mockGetSession.mockImplementation(
      () => new Promise(() => {}),
    );
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      vi.advanceTimersByTime(5100);
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    vi.useRealTimers();
  });
});

describe('useAuth — signInWithGoogle exception path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.setSupabaseEnabled(true);
    hoisted.mockGetSession.mockResolvedValue({ data: { session: null } });
    hoisted.mockSingle.mockResolvedValue({ data: null });
  });

  it('sets generic error message when signInWithOAuth throws unexpectedly', async () => {
    hoisted.mockSignInWithOAuth.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signInWithGoogle();
    });
    expect(result.current.error).toBe('Error al iniciar autenticación con Google.');
    expect(result.current.loading).toBe(false);
  });
});

describe('useAuth — user metadata fallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.setSupabaseEnabled(true);
    hoisted.mockSingle.mockResolvedValue({ data: null });
  });

  it('falls back to metadata.name when full_name is absent', async () => {
    hoisted.mockGetSession.mockResolvedValue(
      makeSession('x@example.com', { name: 'Via Name Field', full_name: undefined as unknown as string }),
    );
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.nombre).toBe('Via Name Field');
  });

  it('uses avatar_url when picture is absent', async () => {
    hoisted.mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'u1',
            email: 'a@a.com',
            user_metadata: { avatar_url: 'https://cdn.example.com/a.jpg' },
          },
        },
      },
    });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.avatar).toBe('https://cdn.example.com/a.jpg');
  });
});
