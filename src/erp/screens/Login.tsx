import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useErp, Rol } from '../store';
import { EMPRESA } from '../utils';
import { Building2, ArrowRight, ShieldCheck, Chrome, Eye, EyeOff, Loader2 } from 'lucide-react';
import { INPUT, ERROR_STATE, BUTTON_SECONDARY } from '../ui';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  nombre: z.string().optional(),
  rol: z.enum(['Administrador', 'Gerente', 'Residente', 'Compras', 'Bodeguero'] as const),
});

type LoginFormData = z.infer<typeof loginSchema>;
const ROLES: Rol[] = ['Administrador', 'Gerente', 'Residente', 'Compras', 'Bodeguero'];

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { signIn, signUp, signInWithGoogle, authError } = useErp();
  const [mode, setMode] = React.useState<'in' | 'up'>('in');
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const emailRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', nombre: '', rol: 'Administrador' },
  });

  React.useEffect(() => {
    emailRef.current?.focus();
  }, [mode]);

  const [registroError, setRegistroError] = React.useState<string | null>(null);

  const CRM_ENDPOINT = import.meta.env.VITE_CRM_ENDPOINT as string | undefined;

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setRegistroError(null);
    if (mode === 'up') {
      if (data.rol === 'Administrador') {
        setRegistroError('El rol Administrador no está disponible para registro.');
        setLoading(false);
        return;
      }
      await signUp(data.email, data.password, data.nombre || '', data.rol);

      if (CRM_ENDPOINT) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          await fetch(CRM_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: data.email, name: data.nombre || undefined, source: 'erp-signup', tags: ['erp-user', data.rol] }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch { /* ignore */ }
      }
    } else {
      await signIn(data.email, data.password);
    }
    setLoading(false);
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
          <p className="text-primary-foreground/90 mt-6 leading-relaxed text-sm sm:text-base">{t('auth.ingrese_credenciales')}</p>
          <div className="flex flex-wrap gap-4 sm:gap-6 mt-8 justify-center">
            {(t('login_hero.items', { returnObjects: true }) as string[]).map(lbl => (
              <div key={lbl} className="text-center">
                <ShieldCheck className="w-5 h-5 mx-auto text-primary-foreground/80" />
                <span className="text-xs text-primary-foreground/60 mt-1 block">{lbl}</span>
              </div>
            ))}
          </div>
          <p className="text-primary-foreground/60 text-[10px] sm:text-xs mt-8">{t('login_hero.confianza')}</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-background min-h-screen lg:min-h-0">
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-primary to-black/60 flex items-center justify-center ring-1 ring-primary-foreground/30 shadow-[0_0_6px_hsl(var(--primary)/0.35)]">
              <picture>
                <source srcSet="/logo.webp" type="image/webp" />
                <img src="/logo.png" alt="WM" className="w-full h-full object-contain" />
              </picture>
            </div>
            <div>
              <div className="font-bold text-foreground text-sm sm:text-base">{EMPRESA.nombre}</div>
              <div className="text-[10px] sm:text-xs text-primary italic">{EMPRESA.eslogan}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-foreground mb-1">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold">{mode === 'in' ? t('auth.iniciar_sesion') : t('auth.registrarse')}</h2>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6">{t('auth.ingrese_credenciales')}</p>

          {mode === 'up' && (
            <>
              <input
                {...register('nombre')}
                placeholder={t('common.nombre')}
                className={`${INPUT} ${errors.nombre ? ERROR_STATE : ''}`}
              />
              {errors.nombre && <p className="text-xs text-destructive mb-2">{errors.nombre.message}</p>}
              <select {...register('rol')} className={INPUT}>
                {ROLES.map(r => (
                  <option key={r} value={r} disabled={r === 'Administrador'}>
                    {r}{r === 'Administrador' ? ` (${t('common.no' as any)})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-warning mt-1">{t('auth.error_permisos')}</p>
            </>
          )}
          <input
            ref={emailRef}
            type="email"
            autoComplete="email"
            {...register('email')}
            placeholder={t('auth.correo')}
            className={`${INPUT} ${errors.email ? ERROR_STATE : ''}`}
          />
          {errors.email && <p className="text-xs text-destructive mb-2">{errors.email.message}</p>}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              placeholder={t('auth.contrasena')}
              className={`${INPUT} pr-10 ${errors.password ? ERROR_STATE : ''}`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive mb-2">{errors.password.message}</p>}

          {authError && <p className="text-xs text-destructive mb-3">{authError}</p>}
          {registroError && <p className="text-xs text-destructive mb-3">{registroError}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:via-orange-400 hover:to-orange-500 text-primary-foreground font-semibold py-3 sm:py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/40 hover:brightness-110 disabled:opacity-60 active:scale-[0.98] transition-all"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {mode === 'in' ? t('auth.iniciar_sesion') : t('auth.registrarse')} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={async () => { setLoading(true); try { await signInWithGoogle(); } finally { setLoading(false); } }}
            className={`${BUTTON_SECONDARY} w-full justify-center hover:border-primary hover:text-primary hover:shadow-md hover:shadow-primary/10`}
          >
            <Chrome className="w-4 h-4" /> {t('auth.google')}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === 'in' ? 'up' : 'in')}
            className="w-full text-center text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4 hover:text-primary transition-colors"
          >
            {mode === 'in' ? t('auth.no_cuenta') : t('auth.ya_cuenta')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;