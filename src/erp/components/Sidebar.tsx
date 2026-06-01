import React from 'react';
import { useErp, View } from '../store';
import { useAppContext } from '@/contexts/AppContext';
import { LayoutDashboard, Building2, Calculator, ClipboardCheck, Wallet, Users, Warehouse, X, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Tablero', icon: LayoutDashboard },
  { id: 'proyectos', label: 'Proyectos', icon: Building2 },
  { id: 'presupuestos', label: 'Presupuestos', icon: Calculator },
  { id: 'seguimiento', label: 'Seguimiento', icon: ClipboardCheck },
  { id: 'financiero', label: 'Financiero', icon: Wallet },
  { id: 'rrhh', label: 'RRHH', icon: Users },
  { id: 'bodega', label: 'Bodega', icon: Warehouse },
];

const Sidebar: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { view, setView, allowedViews, user } = useErp();
  const { sidebarCollapsed, toggleCollapse } = useAppContext();
  const items = ITEMS.filter(it => allowedViews.includes(it.id));
  const collapsed = sidebarCollapsed;
  const asideW = collapsed ? 'w-16' : 'w-60';
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:sticky top-0 lg:top-[60px] left-0 h-screen lg:h-[calc(100vh-60px)] ${asideW} bg-white border-r border-slate-100 z-50 transition-all lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="font-bold text-slate-700">Módulos</span>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="px-4 pt-4 pb-2 hidden lg:block flex-shrink-0">
          <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{collapsed ? user?.rol?.charAt(0).toUpperCase() : `Rol: ${user?.rol}`}</span>
        </div>
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {items.map(it => {
            const Icon = it.icon;
            const active = view === it.id;
            return (
              <button key={it.id} onClick={() => { setView(it.id); onClose(); }} title={collapsed ? it.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap
                  ${active ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20' : 'text-slate-600 hover:bg-slate-50'}
                  ${collapsed ? 'justify-center px-0' : ''}`}>
                <Icon className="w-5 h-5 shrink-0" /> {!collapsed && it.label}
              </button>
            );
          })}
        </nav>
        <div className="hidden lg:block flex-shrink-0 px-3 pb-3">
          <button onClick={toggleCollapse} className="w-full flex items-center justify-center py-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        {!collapsed && (
          <div className="flex-shrink-0 mx-3 mb-3 bg-slate-900 rounded-xl p-3 text-white">
            <div className="text-xs font-bold">CONSTRUCTORA WM</div>
            <div className="text-[10px] text-orange-300 italic">Edificando el Futuro</div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
