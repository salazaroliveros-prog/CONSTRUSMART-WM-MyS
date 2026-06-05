import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp, View, parseView } from '../store';
import { useAppContext } from '@/contexts/AppContext';
import { LayoutDashboard, Building2, Wallet, Users, Warehouse, X, ChevronLeft, ChevronRight, Shield, Settings, Zap, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react';

interface SubItem {
  id: View;
}

interface GrupoMenu {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  items: SubItem[];
}

const GRUPOS: GrupoMenu[] = [
  {
    id: 'tablero', labelKey: 'nav.grupos.tablero', icon: LayoutDashboard,
    items: [
      { id: 'dashboard' },
      { id: 'predictivo' },
      { id: 'reportes' },
    ],
  },
  {
    id: 'proyectos', labelKey: 'nav.grupos.proyectos', icon: Building2,
    items: [
      { id: 'proyectos' },
      { id: 'presupuestos' },
      { id: 'apu' },
      { id: 'seguimiento' },
      { id: 'curvas' },
      { id: 'rendimientos' },
      { id: 'hitos' },
      { id: 'riesgos' },
    ],
  },
  {
    id: 'finanzas', labelKey: 'nav.grupos.finanzas', icon: Wallet,
    items: [
      { id: 'financiero' },
      { id: 'impuestos' },
      { id: 'cuentas-cobrar' },
      { id: 'cuentas-pagar' },
      { id: 'comercial-fin' },
    ],
  },
  {
    id: 'bodega', labelKey: 'nav.grupos.bodega', icon: Warehouse,
    items: [
      { id: 'bodega' },
      { id: 'logistica' },
      { id: 'baseprecios' },
      { id: 'entradas-almacen' },
    ],
  },
  {
    id: 'rrhh', labelKey: 'nav.grupos.rrhh', icon: Users,
    items: [
      { id: 'rrhh' },
      { id: 'planilla-destajos' },
      { id: 'rendimiento-campo' },
    ],
  },
  {
    id: 'calidad', labelKey: 'nav.grupos.calidad', icon: Shield,
    items: [
      { id: 'sso-calidad' },
      { id: 'muro' },
      { id: 'ordenes-cambio' },
      { id: 'documentos' },
    ],
  },
  {
    id: 'admin', labelKey: 'nav.grupos.admin', icon: Settings,
    items: [
      { id: 'admin-sistema' },
      { id: 'crm' },
      { id: 'notificaciones' },
    ],
  },
  {
    id: 'herramientas', labelKey: 'nav.grupos.herramientas', icon: Zap,
    items: [
      { id: 'visor-bim' },
      { id: 'exportacion' },
      { id: 'ajustes' },
    ],
  },
];

const Sidebar: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { view, setView, user, allowedViews } = useErp();
  const { sidebarCollapsed, toggleCollapse } = useAppContext();
  const { root: activeView } = parseView(view);
  const [expandedGrupos, setExpandedGrupos] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    GRUPOS.forEach(g => {
      if (g.items.some(i => i.id === activeView)) initial[g.id] = true;
    });
    return initial;
  });
  // Keep groups expanded when navigating within the same parent
  useEffect(() => {
    setExpandedGrupos(prev => {
      const next = { ...prev };
      GRUPOS.forEach(g => {
        if (g.items.some(i => i.id === activeView)) next[g.id] = true;
      });
      return next;
    });
  }, [activeView]);

  const toggleGrupo = (id: string) => {
    setExpandedGrupos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const collapsed = sidebarCollapsed;

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:sticky top-0 lg:top-[60px] left-0 h-screen lg:h-[calc(100vh-60px)] ${collapsed ? 'w-16' : 'w-60'} bg-white border-r border-slate-100 z-50 transition-all lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="font-bold text-slate-700">Módulos</span>
          <button onClick={onClose} aria-label="Cerrar menú"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-4 pt-4 pb-2 hidden lg:block flex-shrink-0">
          <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
            {collapsed ? user?.rol?.charAt(0).toUpperCase() : `Rol: ${user?.rol}`}
          </span>
        </div>

        <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
          {GRUPOS.map(grupo => {
            const itemsVisibles = grupo.items.filter(item => allowedViews.includes(item.id));
            if (itemsVisibles.length === 0) return null;
            const Icon = grupo.icon;
            const expanded = expandedGrupos[grupo.id] ?? false;

            return (
              <div key={grupo.id}>
                {/* Título del grupo */}
                <button
                  onClick={() => collapsed ? null : toggleGrupo(grupo.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors
                    ${collapsed ? 'justify-center text-slate-400' : 'text-slate-500 hover:text-slate-700'}
                    ${!collapsed && 'hover:bg-slate-50'}`}
                  title={collapsed ? t(grupo.labelKey) : undefined}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{t(grupo.labelKey)}</span>
                      {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
                    </>
                  )}
                </button>

                {/* Sub-items del grupo */}
                {(!collapsed && expanded) && (
                  <div className="ml-1 pl-3 border-l-2 border-slate-100 space-y-0.5 mb-1">
                    {itemsVisibles.map(sub => {
                      const active = activeView === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => { setView(sub.id); onClose(); }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
                            ${active
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                            }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-white' : 'bg-slate-300'}`} />
                          {t(`nav.items.${sub.id}`)}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Modo colapsado: mostrar solo el primer item como acceso rápido */}
                {collapsed && itemsVisibles.length > 0 && (
                  <button
                    onClick={() => setView(itemsVisibles[0].id)}
                    className={`w-full flex items-center justify-center py-2 rounded-lg text-[10px] font-medium transition-colors
                      ${activeView === itemsVisibles[0].id ? 'text-orange-500' : 'text-slate-400 hover:text-slate-600'}`}
                    title={t(`nav.items.${itemsVisibles[0].id}`)}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                )}
              </div>
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
            <div className="text-xs font-bold">{t('ajustes.constructora_wm')}</div>
            <div className="text-[10px] text-orange-300 italic">{t('ajustes.eslogan')}</div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;