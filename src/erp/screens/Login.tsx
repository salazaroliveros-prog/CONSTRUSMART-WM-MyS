import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { EMPRESA } from '../utils';
import { ShieldCheck, Chrome, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { signInWithGoogle, authError } = useErp();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  const btn =
    'w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl flex items-center justify-center gap-3 shadow-md border border-gray-200 hover:shadow-lg transition-all disabled:opacity-60 active:scale-[0.98]';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
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
          <h1 className="text-4xl font-black leading-tight text-orange-300">{EMPRESA.nombre}</h1>
          <p className="text-orange-300 text-lg italic mt-2">{EMPRESA.eslogan}</p>
          <p className="text-orange-200/80 mt-6 leading-relaxed">Acceso exclusivo solo para usuarios autorizados.</p>
          <div className="flex gap-6 mt-8">
            <div className="text-center">
              <ShieldCheck className="w-5 h-5 mx-auto text-orange-400" />
              <span className="text-xs text-orange-200 mt-1 block">{t('common.exclusive_access') || 'Acceso exclusivo'}</span>
            </div>
            <div className="text-center">
              <Chrome className="w-5 h-5 mx-auto text-orange-400" />
              <span className="text-xs text-orange-200 mt-1 block">Solo Google</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl bg-white/60 backdrop-blur-md border border-white/40 shadow-xl p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Iniciar Sesión</h2>
              <p className="text-xs text-orange-500 mt-1">Acceso solo para administrador</p>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-600">{authError}</p>
              </div>
            )}

            <div className="flex flex-col items-center">
              <button type="button" onClick={handleGoogleLogin} disabled={loading} className={btn}>
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
              <p className="text-center text-[10px] text-orange-500 mt-4">
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
