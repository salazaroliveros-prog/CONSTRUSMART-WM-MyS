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

describe('useAccessLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should subscribe to auth state changes', () => {
    renderHook(() => useAccessLog());
    expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
  });
});
