import React, { useState } from 'react';
import { useErp } from '../store';
import { EMPRESA } from '../utils';
import { hasSupabase } from '@/lib/supabase';
import { Loader2, AlertTriangle, Building2, HardHat, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ElevatedCard } from '@/components/ui/elevated-card';

const Login: React.FC = () => {
  const { signInWithGoogle, setView, user } = useErp();
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setAuthError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const btn =
    'w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-3 shadow-sm border border-gray-200 hover:shadow-md hover:border-primary/30 transition-all duration-200 disabled:opacity-60 active:scale-[0.97]';

  return (
    <div className="min-h-screen flex flex-col sm:flex-row lg:flex-row bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden items-center justify-center p-12">
        {/* Decorative grid pattern */}
        <div className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Radial glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]" />
        {/* Background image overlay */}
        <div
          className="absolute inset-0 opacity-40 mix-blend-overlay"
          style={{ backgroundImage: 'url(/empresa_b.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />

        <div className="relative z-10 text-white max-w-md text-center flex flex-col items-center animate-fade-in-up">
          <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 backdrop-blur-sm border border-white/10 flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
            <img
              src="/logo.webp"
              alt="WM"
              className="w-20 h-20 object-contain drop-shadow-[0_0_20px_rgba(249,115,22,0.5)]"
            />
          </div>
          <h1 className="text-4xl font-black leading-tight text-white drop-shadow-lg">
            {EMPRESA.nombre}
          </h1>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary-foreground">
            <HardHat className="w-4 h-4" />
            <span className="text-sm font-bold tracking-widest">EDIFICANDO EL FUTURO</span>
          </div>
          <p className="mt-6 text-sm text-gray-300 max-w-xs leading-relaxed">
            La satisfacción de nuestros clientes es nuestra prioridad
          </p>
          <div className="mt-8 flex gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Building2 className="w-3.5 h-3.5" />
              <span>Gestión Integral</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Shield className="w-3.5 h-3.5" />
              <span>Datos Seguros</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 relative bg-gradient-to-br from-muted/50 via-background to-muted/30">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 30%, currentColor 0%, transparent 45%), radial-gradient(circle at 75% 70%, currentColor 0%, transparent 50%)',
            color: 'hsl(var(--primary))',
          }}
        />

        <div className="w-full max-w-sm relative z-10 animate-scale-in">
          {/* Logo mobile */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3">
              <img src="/logo.webp" alt="WM" className="w-12 h-12 object-contain" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{EMPRESA.nombre}</h2>
            <p className="text-xs text-muted-foreground mt-1">Inicia sesión para continuar</p>
          </div>

          <ElevatedCard variant="glass" padding="lg" className="w-full">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-40 mx-auto rounded-lg" />
                <Skeleton className="h-4 w-56 mx-auto rounded-md" />
              </div>
            ) : (
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Iniciar Sesión</h2>
                <p className="text-xs text-muted-foreground mt-1.5">Acceso solo para administrador</p>
              </div>
            )}

            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-fade-in">
                <p className="text-xs text-destructive">{authError}</p>
              </div>
            )}

            {!hasSupabase && (
              <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/20 animate-fade-in">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-xs text-warning-foreground">
                    Supabase no está configurado. El administrador debe configurar VITE_SUPABASE_URL y VITE_SUPABASE_KEY en el archivo .env
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col items-center space-y-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading || !hasSupabase}
                className={btn}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    <span className="text-gray-500">Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continuar con Google
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-muted-foreground">
                Solo el correo autorizado puede acceder
              </p>
            </div>
          </ElevatedCard>

          {/* Footer info */}
          <p className="text-center text-xs text-muted-foreground/60 mt-6">
            &copy; {new Date().getFullYear()} {EMPRESA.nombre} &mdash; Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;