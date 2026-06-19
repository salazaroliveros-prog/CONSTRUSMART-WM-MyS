import React, { useState, useEffect, useRef } from 'react';
import { useErp } from '../store';
import { EMPRESA } from '../utils';
import { LogOut, Home, Menu, Upload, Bell } from 'lucide-react';
import SyncIndicator from './SyncIndicator';
import { SyncStatusBadge } from '../../components/SyncStatusBadge';

const Header: React.FC<{ onMenu?: () => void; title?: string }> = ({ onMenu, title }) => {
  const { user, logout, setView, view, notificacionesNoLeidas } = useErp();
  const [now, setNow] = useState(new Date());
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('wm_photo');
      if (saved) setCustomPhoto(saved);
    } catch { /* ignore */ }
  }, []);

  const avatarFromUser = user?.avatar;
  useEffect(() => {
    try {
      const googleAvatar = localStorage.getItem('wm_google_avatar');
      if (googleAvatar) setCustomPhoto(googleAvatar);
      else if (avatarFromUser) {
        setCustomPhoto(avatarFromUser);
        localStorage.setItem('wm_google_avatar', avatarFromUser);
      }
    } catch { /* ignore */ }
  }, [avatarFromUser]);

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

  const avatarSrc = customPhoto || user?.avatar;
  const initials = (user?.nombre || 'WM').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header className="bg-primary/80 backdrop-blur-md text-primary-foreground h-[50px] sm:h-[60px] px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2 flex items-center justify-between gap-1 sm:gap-2 lg:gap-3 sticky top-0 z-30 shadow-lg">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 min-w-0 flex-1">
        {onMenu && (
          <button onClick={onMenu} aria-label="Abrir menú" className="lg:hidden p-1 rounded-lg hover:bg-primary-foreground/20 transition-colors flex-shrink-0">
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
        <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-lg shrink-0 bg-primary flex items-center justify-center ring-1 ring-primary/30">
          <img src="/logo.png" alt="WM" className="w-full h-full object-contain" />
        </div>
        <div className="min-w-0 hidden sm:block">
          <div className="font-bold text-xs sm:text-sm leading-tight truncate">{title || EMPRESA.nombre}</div>
          <div className="text-[8px] sm:text-[9px] text-primary-foreground/75 italic truncate">{EMPRESA.eslogan}</div>
        </div>
      </div>

      {/* Center: Sync + Clock (hidden on mobile) */}
      <div className="hidden md:flex items-center gap-3 lg:gap-4">
        <SyncIndicator />
        <SyncStatusBadge />
        <div className="text-center">
          <div className="font-mono text-xs lg:text-sm font-bold tabular-nums text-primary-foreground/90">
            {now.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-[8px] lg:text-[9px] text-primary-foreground/60">
            {now.toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 flex-shrink-0">
        {/* Notifications */}
        <button
          onClick={() => setView('notificaciones')}
          aria-label="Notificaciones"
          className="relative p-1 sm:p-1.5 lg:p-2 hover:bg-primary-foreground/20 rounded-lg transition-colors"
        >
          <Bell className="w-4 h-4 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
          {notificacionesNoLeidas > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[7px] sm:text-[8px] font-bold rounded-full min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] flex items-center justify-center px-0.5">
              {notificacionesNoLeidas > 99 ? '99+' : notificacionesNoLeidas}
            </span>
          )}
        </button>

        {/* Dashboard button */}
        {view !== 'dashboard' && (
          <button
            onClick={() => setView('dashboard')}
            aria-label="Volver al tablero"
            className="hidden sm:flex items-center gap-1 px-2 sm:px-2.5 lg:px-3 py-1 sm:py-1.5 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-lg text-xs font-medium transition-colors"
          >
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden md:inline">Tablero</span>
          </button>
        )}

        {/* Avatar */}
        <button onClick={onPick} className="relative flex-shrink-0" aria-label="Cambiar foto de perfil">
          {avatarSrc ? (
            <img src={avatarSrc} alt={user?.nombre || 'Avatar'} className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full object-cover border border-primary-foreground/30" />
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center text-[8px] sm:text-xs font-bold">
              {initials}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5 border border-border">
            <Upload className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-foreground" />
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

        {/* User info */}
        <div className="hidden lg:flex flex-col gap-0 ml-1">
          <div className="text-xs font-semibold leading-tight">{user?.nombre}</div>
          <div className="text-[8px] text-primary-foreground/60">{user?.rol}</div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          aria-label="Cerrar sesión"
          className="p-1 sm:p-1.5 lg:p-2 hover:bg-destructive/20 text-primary-foreground hover:text-destructive rounded-lg transition-colors flex-shrink-0"
        >
          <LogOut className="w-4 h-4 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
