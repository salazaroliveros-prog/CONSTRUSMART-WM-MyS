import React, { useState, useEffect } from 'react';
import { useErp } from '../store';
import { EMPRESA } from '../utils';
import { LogOut, Home, Menu } from 'lucide-react';

const Header: React.FC<{ onMenu?: () => void; title?: string }> = ({ onMenu, title }) => {
  const { user, logout, setView, view } = useErp();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hora = now.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fecha = now.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const initials = (user?.nombre || 'WM').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-lg">
      <div className="flex items-center gap-3 min-w-0">
        {onMenu && (
          <button onClick={onMenu} className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-black text-sm shrink-0">WM</div>
        <div className="min-w-0">
          <div className="font-bold text-sm leading-tight truncate">{EMPRESA.nombre}</div>
          <div className="text-[10px] text-orange-300 italic">{EMPRESA.eslogan}</div>
        </div>
      </div>

      <div className="hidden md:block text-center">
        <div className="font-mono text-lg font-bold tabular-nums text-orange-300">{hora}</div>
        <div className="text-[10px] text-slate-400 capitalize">{fecha}</div>
      </div>

      <div className="flex items-center gap-2">
        {view !== 'dashboard' && (
          <button onClick={() => setView('dashboard')} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium">
            <Home className="w-4 h-4" /> Inicio
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold">{initials}</div>
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
