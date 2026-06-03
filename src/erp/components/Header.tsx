import React, { useState, useEffect, useRef } from 'react';
import { useErp } from '../store';
import { EMPRESA } from '../utils';
import { LogOut, Home, Menu, Upload, Bell } from 'lucide-react';
import SyncIndicator from './SyncIndicator';

const Header: React.FC<{ onMenu?: () => void; title?: string }> = ({ onMenu, title }) => {
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
    <header className="bg-slate-900/80 backdrop-blur-md text-white px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-lg">
      <div className="flex items-center gap-3 min-w-0">
        {onMenu && (
          <button onClick={onMenu} className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="w-10 h-10 rounded-xl shrink-0 bg-slate-900 flex items-center justify-center ring-1 ring-orange-400/30 shadow-[0_0_6px_rgba(249,115,22,0.35)]">
          <img src="/logo.png" alt="WM" className="w-full h-full object-contain" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm leading-tight truncate">{title || EMPRESA.nombre}</div>
          <div className="text-[10px] text-orange-300 italic">{EMPRESA.eslogan}</div>
        </div>
      </div>

      {/* SyncIndicator - estado de conexión y pendientes */}
      <div className="hidden sm:block">
        <SyncIndicator />
      </div>

      <div className="hidden md:block text-center">
        <div className="font-mono text-lg font-bold tabular-nums text-orange-300">{now.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
        <div className="text-[10px] text-slate-400 capitalize">{now.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>

      <button onClick={() => setView('notificaciones')} className="relative p-2 hover:bg-white/10 rounded-lg" title="Notificaciones">
        <Bell className="w-5 h-5" />
        {notificacionesNoLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {notificacionesNoLeidas > 99 ? '99+' : notificacionesNoLeidas}
          </span>
        )}
      </button>
      <div className="flex items-center gap-2">
        {view !== 'dashboard' && (
          <button onClick={() => setView('dashboard')} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium">
            <Home className="w-4 h-4" /> Inicio
          </button>
        )}
        <div className="flex items-center gap-2">
          <button onClick={onPick} className="relative" title="Cambiar foto">
            {avatarSrc ? (
              <img src={avatarSrc} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-white/20" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold">{initials}</div>
            )}
            <span className="absolute -bottom-1 -right-1 bg-slate-800 rounded-full p-0.5 border border-white/20">
              <Upload className="w-3 h-3" />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          <div className="hidden lg:block">
            <div className="text-xs font-semibold leading-tight">{user?.nombre}</div>
            <div className="text-[10px] text-slate-400">{user?.rol}</div>
          </div>
        </div>
        <button onClick={logout} title="Salir" className="p-2 hover:bg-red-500/20 text-red-300 rounded-lg">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Header;