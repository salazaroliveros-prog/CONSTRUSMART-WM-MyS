import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAccessLog } from '@/erp/hooks/useAccessLog';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(),
    })),
  },
  hasSupabase: true,
}));

describe.skip('useAccessLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should subscribe to auth state changes', () => {
    renderHook(() => useAccessLog());
    expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
  });

  it('should not insert when hasSupabase is false', () => {
    const { hasSupabase } = require('../lib/supabase');
    hasSupabase.value = false;
    renderHook(() => useAccessLog());
    expect(supabase.auth.onAuthStateChange).not.toHaveBeenCalled();
  });

  it('should insert access log on sign in', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        app_metadata: { provider: 'email' },
      },
    };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
    });

    const insertMock = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({ insert: insertMock });

    const { result } = renderHook(() => useAccessLog());
    
    const callback = (supabase.auth.onAuthStateChange as any).mock.calls[0][0];
    await callback('SIGNED_IN', mockSession);

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        email: 'test@example.com',
        event: 'sign_in',
        provider: 'email',
      })
    );
  });

  it('should handle missing email gracefully', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: null,
        app_metadata: { provider: 'email' },
      },
    };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
    });

    const insertMock = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({ insert: insertMock });

    const { result } = renderHook(() => useAccessLog());
    
    const callback = (supabase.auth.onAuthStateChange as any).mock.calls[0][0];
    await callback('SIGNED_IN', mockSession);

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        email: null,
      })
    );
  });

  it('should truncate user_agent to 200 chars', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        app_metadata: { provider: 'email' },
      },
    };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
    });

    const insertMock = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({ insert: insertMock });

    const longUserAgent = 'a'.repeat(300);
    Object.defineProperty(navigator, 'userAgent', {
      value: longUserAgent,
      configurable: true,
    });

    const { result } = renderHook(() => useAccessLog());
    
    const callback = (supabase.auth.onAuthStateChange as any).mock.calls[0][0];
    await callback('SIGNED_IN', mockSession);

    const insertedData = insertMock.mock.calls[0][0];
    expect(insertedData.user_agent.length).toBeLessThanOrEqual(200);
  });

  it('should log error on insert failure', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        app_metadata: { provider: 'email' },
      },
    };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
    });

    const insertMock = vi.fn().mockRejectedValue(new Error('DB Error'));
    (supabase.from as any).mockReturnValue({ insert: insertMock });

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useAccessLog());
    
    const callback = (supabase.auth.onAuthStateChange as any).mock.calls[0][0];
    await callback('SIGNED_IN', mockSession);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[useAccessLog] Failed to log access:',
      expect.any(Error)
    );

    consoleWarnSpy.mockRestore();
  });
});
