import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { EMPRESA } from '../utils';
import { LogOut, Home, Menu, Upload, Bell } from 'lucide-react';
import SyncIndicator from './SyncIndicator';

const Header: React.FC<{ onMenu?: () => void; title?: string }> = ({ onMenu, title }) => {
  const { t } = useTranslation();
  const { user, logout, setView, view, notificacionesNoLeidas } = useErp();
  const [now, setNow] = useState(new Date());
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wm_photo');
      if (saved) setCustomPhoto(saved);
    } catch { /* ignore */ }
  }, []);

  const onPick = () => fileRef.current?.click();
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = typeof reader.result === 'string' ? reader.result : null;
      if (data) {
        setCustomPhoto(data);
        try { localStorage.setItem('wm_photo', data); } catch { /* ignore */ }
      }
    };
    reader.readAsDataURL(f);
  };

  const avatarSrc = user?.avatar ?? customPhoto;
  const initials = (user?.nombre || 'WM').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header className="bg-primary/80 backdrop-blur-md text-primary-foreground px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-lg">
      <div className="flex items-center gap-3 min-w-0">
        {onMenu && (
          <button onClick={onMenu} aria-label="Abrir menú" className="lg:hidden p-1.5 hover:bg-accent rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="w-10 h-10 rounded-xl shrink-0 bg-primary flex items-center justify-center ring-1 ring-primary/30 shadow-[0_0_6px_hsl(var(--primary)/0.35)]">
          <img src="/logo.png" alt="WM" className="w-full h-full object-contain" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm leading-tight truncate">{title || EMPRESA.nombre}</div>
          <div className="text-[10px] text-primary/80 italic">{EMPRESA.eslogan}</div>
        </div>
      </div>

      {/* SyncIndicator - estado de conexión y pendientes */}
      <div className="hidden sm:block">
        <SyncIndicator />
      </div>

      <div className="hidden md:block text-center">
        <div className="font-mono text-lg font-bold tabular-nums text-primary/80">{now.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
        <div className="text-[10px] text-muted-foreground capitalize">{now.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>

      <button onClick={() => setView('notificaciones')} aria-label={t('notificaciones.titulo')} className="relative p-2 hover:bg-accent rounded-lg" title={t('notificaciones.titulo')}>
        <Bell className="w-5 h-5" />
        {notificacionesNoLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {notificacionesNoLeidas > 99 ? '99+' : notificacionesNoLeidas}
          </span>
        )}
      </button>
      <div className="flex items-center gap-2">
        {view !== 'dashboard' && (
          <button onClick={() => setView('dashboard')} aria-label={t('common.volver_tablero')} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent/80 rounded-lg text-xs font-medium">
            <Home className="w-4 h-4" /> {t('common.volver_tablero')}
          </button>
        )}
        <div className="flex items-center gap-2">
          <button onClick={onPick} className="relative" aria-label="Cambiar foto">
            {avatarSrc ? (
              <img src={avatarSrc} alt={user?.nombre || 'Avatar'} className="w-9 h-9 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold">{initials}</div>
            )}
            <span className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 border border-border">
              <Upload className="w-3 h-3" />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          <div className="hidden lg:block">
            <div className="text-xs font-semibold leading-tight">{user?.nombre}</div>
            <div className="text-[10px] text-muted-foreground">{user?.rol}</div>
          </div>
        </div>
        <button onClick={logout} aria-label="Cerrar sesión" className="p-2 hover:bg-destructive/20 text-destructive rounded-lg">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Header;