import React, { useState } from 'react';
import { useErp } from '../store';
import { EMPRESA } from '../utils';
import { hasSupabase } from '@/lib/supabase';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
    'w-full bg-card hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl flex items-center justify-center gap-3 shadow-sm border border-gray-200 hover:shadow-sm transition-all disabled:opacity-60 active:scale-[0.98]';

  return (
    <div className="min-h-screen flex flex-col sm:flex-row lg:flex-row">
      <div className="hidden lg:flex flex-1 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
        <div
          className="absolute inset-0 opacity-60"
          style={{ backgroundImage: 'url(/empresa_b.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-slate-900/30 to-black/80" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
        <div className="relative z-10 text-white max-w-md text-center flex flex-col items-center">
          <img
            src="/logo.png"
            alt="WM"
            className="w-32 h-32 object-contain drop-shadow-[0_0_12px_rgba(249,115,22,0.45)] mb-6"
          />
          <h1 className="text-4xl font-black leading-tight text-white drop-shadow-sm">{EMPRESA.nombre}</h1>
          <p className="mt-6 text-xl font-bold text-yellow-600"
             style={{ textShadow: '0 0 18px rgba(59,130,246,0.85), 0 0 6px rgba(59,130,246,0.7)' }}>
            EDIFICANDO EL FUTURO
          </p>
          <p className="mt-3 text-sm text-gray-200"
             style={{ textShadow: '0 0 14px rgba(59,130,246,0.75), 0 0 5px rgba(59,130,246,0.6)' }}>
            La satisfacción de nuestros clientes es nuestra prioridad
          </p>
        </div>
      </div>

      <div
        className="flex-1 flex items-center justify-center p-6 relative"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(0,0,0,0.08) 0%, transparent 45%), radial-gradient(circle at 75% 70%, rgba(255,255,255,0.35) 0%, transparent 50%), linear-gradient(160deg, #cbd5e1 0%, #e2e8f0 45%, #ffffff 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(0,0,0,0.18) 0, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 10px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.12) 0, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 10px)',
            backgroundSize: '20px 20px',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0))',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0))',
          }}
        />
        <div className="w-full max-w-sm relative z-10">
          <div className="rounded-3xl bg-card/25 backdrop-blur-xl border border-white/40 shadow-[0_20px_60px_rgba(15,23,42,0.18)] p-6">
            {loading && (<div className="space-y-3 mb-6"><Skeleton className="h-8 w-40 mx-auto" /><Skeleton className="h-4 w-56 mx-auto" /></div>)}
            {!loading && (<div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Iniciar Sesión</h2>
              <p className="text-xs text-amber-500 mt-1">Acceso solo para administrador</p>
            </div>)}

            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-600">{authError}</p>
              </div>
            )}

            {!hasSupabase && (
              <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-xs text-amber-700">
                    Supabase no está configurado. El administrador debe configurar VITE_SUPABASE_URL y VITE_SUPABASE_KEY en el archivo .env
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col items-center space-y-3">
              <button type="button" onClick={handleGoogleLogin} disabled={loading || !hasSupabase} className={btn}>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
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
              <p className="text-center text-[10px] text-amber-500 mt-4">
                Solo el correo autorizado puede acceder
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


