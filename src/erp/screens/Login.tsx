import React from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { EMPRESA } from '../utils';
import { ShieldCheck, Chrome, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { signInWithGoogle, authError } = useErp();
  const [loading, setLoading] = React.useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      <div className="hidden lg:flex flex-1 bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'image-set(url(/empresa_b.webp) type("image/webp"), url(/empresa_b.jpg) type("image/jpeg"))', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/70 to-black/80" />
        <div className="relative z-10 text-primary-foreground max-w-md text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-primary to-black/60 flex items-center justify-center ring-1 ring-primary-foreground/30 shadow-[0_0_8px_hsl(var(--primary)/0.35)]">
              <picture>
                <source srcSet="/logo.webp" type="image/webp" />
                <img src="/logo.png" alt="WM" className="w-full h-full object-contain" />
              </picture>
            </div>
            <picture>
              <source srcSet="/construmys.webp" type="image/webp" />
              <img src="/construmys.png" alt="Construmys" className="h-16 w-16 object-contain drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
            </picture>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight">CONSTRUCTORA<br /><span className="text-2xl sm:text-3xl">WM / M&amp;S</span></h1>
          <p className="text-primary-foreground text-base sm:text-lg italic mt-2">{EMPRESA.eslogan}</p>
          <p className="text-primary-foreground/90 mt-6 leading-relaxed text-sm sm:text-base">Acceso restringido solo para usuarios autorizados</p>
          <div className="flex flex-wrap gap-4 sm:gap-6 mt-8 justify-center">
            <div className="text-center">
              <ShieldCheck className="w-5 h-5 mx-auto text-primary-foreground/80" />
              <span className="text-xs text-primary-foreground/60 mt-1 block">Acceso exclusivo</span>
            </div>
            <div className="text-center">
              <Chrome className="w-5 h-5 mx-auto text-primary-foreground/80" />
              <span className="text-xs text-primary-foreground/60 mt-1 block">Solo Google</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-primary to-black/60 flex items-center justify-center ring-1 ring-primary-foreground/30">
              <picture>
                <source srcSet="/logo.webp" type="image/webp" />
                <img src="/logo.png" alt="WM" className="w-full h-full object-contain" />
              </picture>
            </div>
            <div>
              <div className="font-bold text-foreground text-sm">{EMPRESA.nombre}</div>
              <div className="text-[10px] text-primary italic">{EMPRESA.eslogan}</div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-foreground">Iniciar Sesión</h2>
            <p className="text-xs text-muted-foreground mt-1">Acceso solo para administrador</p>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive">{authError}</p>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl flex items-center justify-center gap-3 shadow-md border border-gray-200 hover:shadow-lg transition-all disabled:opacity-60 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </>
            )}
          </button>
          <p className="text-center text-[10px] text-muted-foreground mt-4">
            Solo el correo autorizado puede acceder
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
