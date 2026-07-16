import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import { hasSupabase, supabase } from '@/lib/supabase';

/**
 * Tipo de rol de usuario en el sistema
 */
type Rol = string;

/**
 * Schema Zod para validar datos de usuario
 */
const userSchema = z.object({
  id: z.string(),
  email: z.string().email().optional().default(''),
  nombre: z.string().default('Usuario'),
  rol: z.string().default('Administrador'),
  avatar: z.string().optional().default(''),
});

/**
 * Parsea datos de forma segura usando Zod con fallback
 * @param schema - Schema Zod para validar
 * @param data - Datos a validar
 * @param fallback - Valor a retornar si la validación falla
 * @param ctx - Contexto opcional para logging
 * @returns Datos validados o fallback
 */
function safeParse<T extends z.ZodTypeAny>(schema: T, data: z.infer<T>, fallback: z.infer<T>, ctx?: string): z.infer<T> {
  try {
    const result = schema.safeParse(data);
    return result.success ? result.data : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Interfaz de usuario autenticado
 */
export interface AuthUser {
  id: string; email: string; nombre: string; rol: Rol; avatar?: string;
}

/**
 * Retorno del hook useAuth
 */
export interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  error: string;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

/**
 * Hook de autenticación con Supabase y Google OAuth
 * 
 * Características:
 * - Autenticación con Google OAuth
 * - Gestión de sesión con Supabase
 * - Validación de usuario con Zod
 * - Obtención de rol desde tabla profiles
 * - Manejo de errores
 * - Refresh de sesión
 * 
 * @returns Objeto con estado de autenticación y métodos de acción
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /**
   * Construye el objeto de usuario desde la sesión de Supabase
   * Obtiene el rol desde la tabla profiles y valida con Zod
   */
  const buildUserFromSession = useCallback(async () => {
    if (!hasSupabase) {
      setError('Supabase no está configurado. Configura VITE_SUPABASE_URL y VITE_SUPABASE_KEY en .env');
      setUser(null);
      setLoading(false);
      return;
    }

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

    // Obtener rol desde la base de datos
    let rol = 'usuario';
    try {
      const { data: roleData } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', session.user.id)
        .single();

      if (roleData?.rol) {
        rol = roleData.rol;
      }
    } catch (error) {
      // Si no hay perfil, usar rol por defecto
      console.warn('No se pudo obtener el rol del perfil, usando "usuario"');
    }

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      if (session?.user) {
        buildUserFromSession();
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [buildUserFromSession]);

  /**
   * Inicia sesión con Google OAuth
   */
  const signInWithGoogle = useCallback(async () => {
    if (!hasSupabase) {
      setError('Supabase no está configurado.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
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

  /**
   * Cierra la sesión del usuario
   */
  const signOut = useCallback(async () => {
    if (!hasSupabase) {
      setUser(null);
      return;
    }

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
    setUser(null);
    setError('');
  }, []);

  /**
   * Refresca la sesión del usuario
   */
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
