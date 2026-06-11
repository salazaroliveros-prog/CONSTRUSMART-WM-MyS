import { useState, useEffect, useCallback } from 'react';
import { supabase, hasSupabase } from '@/lib/supabase';
import { log } from '@/lib/auto-logger';
import { safeParse } from '@/lib/safe-parse';
import { z } from 'zod';

export type Rol = 'Administrador' | 'Gerente' | 'Residente' | 'Compras' | 'Bodeguero';

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  avatar?: string;
}

const ADMIN_EMAIL = 'salazaroliveros@gmail.com';

const validRoles: Rol[] = ['Administrador', 'Gerente', 'Residente', 'Compras', 'Bodeguero'];

function mapRol(rol: string, email?: string): Rol {
  if (validRoles.includes(rol as Rol)) return rol as Rol;
  if (email === ADMIN_EMAIL) return 'Administrador';
  return 'Residente';
}

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  nombre: z.string().default('Usuario'),
  rol: z.enum(['Administrador','Gerente','Residente','Compras','Bodeguero'] as const).default('Residente'),
  avatar: z.string().optional(),
});

export interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  error: string;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nombre: string, rol: Rol) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Recuperar metadata del usuario desde Supabase auth.user_metadata
  const buildUserFromSession = useCallback(async () => {
    if (!hasSupabase) {
      log('warn', 'useAuth', 'Supabase no configurado — modo offline/local');
      setLoading(false);
      return;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        log('error', 'useAuth', 'Error obteniendo sesión', { error: sessionError.message });
        setUser(null);
        setLoading(false);
        return;
      }

      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userData = session.user;
      const metadata = userData.user_metadata || {};
      
      // Intentar obtener el rol desde la tabla erp_usuarios o metadata
      let rol: Rol = mapRol(metadata.rol || '', userData.email);

      const authUser: AuthUser = {
        id: userData.id,
        email: userData.email || '',
        nombre: metadata.nombre || metadata.full_name || userData.email?.split('@')[0] || 'Usuario',
        rol,
        avatar: metadata.avatar_url || metadata.picture || undefined,
      };

      const validated = safeParse(userSchema, authUser, {
        id: userData.id,
        email: userData.email || '',
        nombre: 'Usuario',
        rol: 'Residente',
      }, 'useAuth:buildUser');

      setUser(validated);
      log('info', 'useAuth', `Sesión activa: ${validated.email} (${validated.rol})`);
    } catch (err) {
      log('error', 'useAuth', 'Error construyendo usuario desde sesión', { error: String(err) });
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Inicializar escuchando cambios de auth state
  useEffect(() => {
    if (!hasSupabase) {
      setLoading(false);
      return;
    }

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      log('info', 'useAuth', `Auth event: ${event}`, { hasSession: !!session });

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        await buildUserFromSession();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setError('');
      }
    });

    // Cargar sesión inicial
    buildUserFromSession();

    const refreshInterval = setInterval(async () => {
      try {
        if (hasSupabase) await supabase.auth.refreshSession();
      } catch { /* next interval will retry */ }
    }, 25 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [buildUserFromSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!hasSupabase) {
      setError('Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_KEY.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        log('error', 'useAuth', 'Error de inicio de sesión', { error: signInError.message });
        setError(signInError.message === 'Invalid login credentials'
          ? 'Credenciales inválidas. Verifica tu email y contraseña.'
          : signInError.message);
        return;
      }

      if (data?.user) {
        log('info', 'useAuth', `Usuario autenticado: ${data.user.email}`);
        await buildUserFromSession();
      }
    } catch (err) {
      log('error', 'useAuth', 'Excepción en signIn', { error: String(err) });
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [buildUserFromSession]);

  const signUp = useCallback(async (email: string, password: string, nombre: string, rol: Rol) => {
    if (!hasSupabase) {
      setError('Supabase no está configurado.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            nombre: nombre.trim(),
            rol,
          },
        },
      });

      if (signUpError) {
        log('error', 'useAuth', 'Error de registro', { error: signUpError.message });
        setError(signUpError.message);
        return;
      }

      if (data?.user) {
        log('info', 'useAuth', `Usuario registrado: ${data.user.email}`);
        setError('Registro exitoso. Revisa tu email para confirmar la cuenta.');
      }
    } catch (err) {
      log('error', 'useAuth', 'Excepción en signUp', { error: String(err) });
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

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
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (oauthError) {
        log('error', 'useAuth', 'Error en OAuth Google', { error: oauthError.message });
        setError(oauthError.message);
      }
    } catch (err) {
      log('error', 'useAuth', 'Excepción en signInWithGoogle', { error: String(err) });
      setError('Error al iniciar autenticación con Google.');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (!hasSupabase) {
      setUser(null);
      return;
    }

    try {
      const { error: logoutError } = await supabase.auth.signOut();
      if (logoutError) {
        log('error', 'useAuth', 'Error al cerrar sesión', { error: logoutError.message });
      }
      setUser(null);
      setError('');
      log('info', 'useAuth', 'Sesión cerrada exitosamente');
    } catch (err) {
      log('error', 'useAuth', 'Excepción en logout', { error: String(err) });
      setUser(null);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    await buildUserFromSession();
  }, [buildUserFromSession]);

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    refreshSession,
  };
}

export default useAuth;