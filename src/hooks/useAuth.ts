import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import { hasSupabase } from '@/lib/supabase';

export type Rol = 'Administrador' | 'Gerente' | 'Residente' | 'Compras' | 'Bodeguero';

const ADMIN_EMAIL = 'salazaroliveros@gmail.com';
const ALLOWED_EMAILS = new Set([ADMIN_EMAIL]);

function mapRol(email?: string): Rol {
  if (email && ALLOWED_EMAILS.has(email)) return 'Administrador';
  return 'Residente';
}

const userSchema = z.object({
  id: z.string(),
  email: z.string().email().optional().default(''),
  nombre: z.string().default('Usuario'),
  rol: z.string().default('Residente'),
});

function safeParse<T extends z.ZodTypeAny>(schema: T, data: z.infer<T>, fallback: z.infer<T>, ctx?: string): z.infer<T> {
  try {
    const result = schema.safeParse(data);
    return result.success ? result.data : fallback;
  } catch {
    return fallback;
  }
}

export interface UseAuthReturn {
  user: { id: string; email: string; nombre: string; rol: Rol } | null;
  loading: boolean;
  error: string;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<{ id: string; email: string; nombre: string; rol: Rol } | null>(null);
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
    const rol = mapRol(email);

    const validated = safeParse(userSchema, session.user as any, {
      id: session.user.id,
      email,
      nombre: email.split('@')[0] || 'Usuario',
      rol,
    }, 'useAuth:buildUser');

    if (!validated.email || !ALLOWED_EMAILS.has(validated.email)) {
      setUser(null);
      setError('Correo no autorizado. Solo admin@construsmart puede acceder.');
      setLoading(false);
      return;
    }

    setUser(validated);
    setLoading(false);
    setError('');
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
