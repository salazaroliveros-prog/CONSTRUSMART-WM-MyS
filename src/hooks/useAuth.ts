import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import { hasSupabase } from '@/lib/supabase';

type Rol = string;

const userSchema = z.object({
  id: z.string(),
  email: z.string().email().optional().default(''),
  nombre: z.string().default('Usuario'),
  rol: z.string().default('Administrador'),
  avatar: z.string().optional().default(''),
});

function safeParse<T extends z.ZodTypeAny>(schema: T, data: z.infer<T>, fallback: z.infer<T>, ctx?: string): z.infer<T> {
  try {
    const result = schema.safeParse(data);
    return result.success ? result.data : fallback;
  } catch {
    return fallback;
  }
}

export interface AuthUser {
  id: string; email: string; nombre: string; rol: Rol; avatar?: string;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  error: string;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const buildUserFromSession = useCallback(async () => {
    if (!hasSupabase) {
      setUser(null);
      setLoading(false);
      return;
    }

    const { supabase } = await import('@/lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    const email = session.user.email || '';
    const userMeta = (session.user as any).user_metadata || {};
    const nombre = userMeta.full_name || userMeta.name || email.split('@')[0] || 'Usuario';
    const avatar = userMeta.picture || userMeta.avatar_url || '';
    const rol = 'Administrador';

    const validated = safeParse(userSchema, {
      ...session.user,
      nombre,
      avatar,
    } as any, {
      id: session.user.id,
      email,
      nombre,
      rol,
      avatar,
    }, 'useAuth:buildUser');

    setUser(validated);
    setLoading(false);
    setError('');

    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (!hash || hash === 'login') {
        window.location.hash = '#dashboard';
      }
    }
  }, []);

  useEffect(() => {
    buildUserFromSession();

    if (!hasSupabase) return;
    import('@/lib/supabase').then(({ supabase }) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
        if (session?.user) {
          buildUserFromSession();
        } else {
          setUser(null);
          setLoading(false);
        }
      });
      return () => subscription.unsubscribe();
    });
  }, [buildUserFromSession]);

  const signInWithGoogle = useCallback(async () => {
    if (!hasSupabase) {
      setError('Supabase no está configurado.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { supabase } = await import('@/lib/supabase');
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
      }
    } catch (err) {
      setError('Error al iniciar autenticación con Google.');
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!hasSupabase) {
      setUser(null);
      return;
    }

    try {
      const { supabase } = await import('@/lib/supabase');
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setError('');
  }, []);

  const refreshSession = useCallback(async () => {
    await buildUserFromSession();
  }, [buildUserFromSession]);

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
    refreshSession,
  };
}
