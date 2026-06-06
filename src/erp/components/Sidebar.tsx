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
      <aside className={`fixed lg:sticky top-0 lg:top-[60px] left-0 h-screen lg:h-[calc(100vh-60px)] ${asideW} bg-background border-r border-border z-50 transition-all lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} flex flex-col overflow-hidden`}>
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="font-bold text-foreground">Módulos</span>
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-4 pt-4 pb-2 hidden lg:block flex-shrink-0">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{collapsed ? user?.rol?.charAt(0).toUpperCase() : `Rol: ${user?.rol}`}</span>
        </div>
        <nav className="p-3 space-y-1 flex-1 overflow-hidden" role="navigation" aria-label="Navegación principal" id="sidebar-navigation">
          {items.map(it => {
            const Icon = it.icon;
            const active = view === it.id;
            return (
              <button key={it.id} onClick={() => { setView(it.id); onClose(); }}
                title={collapsed ? it.label : undefined}
                aria-label={collapsed ? it.label : undefined}
                aria-current={active ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                  ${active ? 'bg-gradient-to-r from-primary to-warning text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-muted'}
                  ${collapsed ? 'justify-center px-0' : ''}`}>
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" /> {!collapsed && it.label}
              </button>
            );
          })}
        </nav>
        <div className="hidden lg:block flex-shrink-0 px-3 pb-3">
          <button
            onClick={toggleCollapse}
            aria-label={collapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
            aria-expanded={!collapsed}
            aria-controls="sidebar-navigation"
            className="w-full flex items-center justify-center py-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" aria-hidden="true" /> : <ChevronLeft className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>
        {!collapsed && (
          <div className="flex-shrink-0 mx-3 mb-3 bg-primary rounded-xl p-3 text-primary-foreground">
            <div className="text-xs font-bold">CONSTRUCTORA WM</div>
            <div className="text-[10px] text-primary-foreground/80 italic">Edificando el Futuro</div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
