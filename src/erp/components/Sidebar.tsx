import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp, View } from '../store';
import { useAppContext } from '@/components/AppLayout';
import {
  LayoutDashboard,
  Building2,
  Calculator,
  ClipboardCheck,
  Wallet,
  Users,
  Warehouse,
  X,
  ChevronLeft,
  ChevronRight,
  Target,
  Receipt,
  Bell,
  Copy,
  ShieldCheck,
  Flag,
  Cpu,
  FileCog,
  FileText,
  TrendingUp,
  History,
  AlertTriangle,
} from 'lucide-react';

interface NavItem {
  id: View;
  labelKey: string;
  icon: React.ElementType;
  group: string;
}

// ─── NAVEGACIÓN REORGANIZADA POR FLUJO DE PROYECTO ──────────────────────────
// Nueva jerarquía: Flujo de proyecto, no similitud técnica
const ITEMS: NavItem[] = [
  // NIVEL 1: VISIBILIDAD INTEGRAL
  { id: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard, group: '' },
  { id: 'proyectos', labelKey: 'proyectos', icon: Building2, group: '' },
  { id: 'notificaciones', labelKey: 'notificaciones', icon: Bell, group: '' },
  { id: 'riesgos', labelKey: 'riesgos', icon: AlertTriangle, group: '' },

  // NIVEL 2: PLANIFICACIÓN & DISEÑO
  { id: 'presupuestos', labelKey: 'presupuestos', icon: Calculator, group: 'Planificación' },
  { id: 'apu', labelKey: 'apu', icon: Receipt, group: 'Planificación' },
  { id: 'hitos', labelKey: 'hitos', icon: Target, group: 'Planificación' },
  { id: 'plantillas', labelKey: 'plantillas', icon: Copy, group: 'Planificación' },

  // NIVEL 3: EJECUCIÓN & MONITOREO
  { id: 'seguimiento', labelKey: 'seguimiento', icon: ClipboardCheck, group: 'Ejecución' },
  { id: 'ordenes-cambio', labelKey: 'ordenes-cambio', icon: FileText, group: 'Ejecución' },
  { id: 'rendimiento-campo', labelKey: 'rendimiento-campo', icon: TrendingUp, group: 'Ejecución' },

  // NIVEL 4: SUMINISTRO & LOGÍSTICA
  { id: 'bodega', labelKey: 'bodega', icon: Warehouse, group: 'Suministro' },
  { id: 'logistica', labelKey: 'logistica', icon: Cpu, group: 'Suministro' },
  { id: 'entradas-almacen', labelKey: 'entradas-almacen', icon: FileText, group: 'Suministro' },

  // NIVEL 5: FINANCIERO & CUENTAS
  { id: 'financiero', labelKey: 'financiero', icon: Wallet, group: 'Finanzas' },
  { id: 'cuentas-cobrar', labelKey: 'cuentas-cobrar', icon: TrendingUp, group: 'Finanzas' },
  { id: 'cuentas-pagar', labelKey: 'cuentas-pagar', icon: TrendingUp, group: 'Finanzas' },
  { id: 'profitability', labelKey: 'profitability', icon: TrendingUp, group: 'Finanzas' },

  // NIVEL 6: GENTE & ADMINISTRACIÓN
  { id: 'rrhh', labelKey: 'rrhh', icon: Users, group: 'Administración' },
  { id: 'conflicts', labelKey: 'conflicts', icon: AlertTriangle, group: 'Administración' },
  { id: 'admin-sistema', labelKey: 'admin-sistema', icon: FileCog, group: 'Administración' },
  { id: 'ajustes', labelKey: 'ajustes', icon: FileCog, group: 'Administración' },
];

const GROUP_ORDER = ['', 'Planificación', 'Ejecución', 'Suministro', 'Finanzas', 'Administración'];

const GROUP_LABELS: Record<string, string> = {
  'Planificación': 'planning',
  'Ejecución': 'execution',
  'Suministro': 'supply',
  'Finanzas': 'finance',
  'Administración': 'admin',
};

const GROUP_COLORS: Record<string, string> = {
  'Planificación': 'bg-blue-500',
  'Ejecución': 'bg-emerald-500',
  'Suministro': 'bg-orange-500',
  'Finanzas': 'bg-yellow-500',
  'Administración': 'bg-gray-500',
};

const Sidebar: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { view, setView, allowedViews, user, notificacionesNoLeidas } = useErp();
  const { sidebarCollapsed, toggleCollapse } = useAppContext();
  const [hoverExpand, setHoverExpand] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const items = user && allowedViews.length > 0
    ? ITEMS.filter((it) => allowedViews.includes(it.id))
    : ITEMS;

  const { sidebarPosition, sidebarMode } = useErp().appSettings;
  const isCollapsed = sidebarCollapsed || sidebarMode === 'collapsed';
  const isMini = sidebarMode === 'mini';
  const isHoverExpand = sidebarMode === 'hover-expand';
  const effectivelyExpanded = !isCollapsed && !isMini && !(isHoverExpand && !hoverExpand);
  const effectivelyCollapsed = isCollapsed || isMini || (isHoverExpand && !hoverExpand);

  // Hover-to-expand
  useEffect(() => {
    if (!isHoverExpand || !sidebarRef.current) return;
    const el = sidebarRef.current;
    const onMouseEnter = () => setHoverExpand(true);
    const onMouseLeave = () => setHoverExpand(false);
    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mouseleave', onMouseLeave);
    return () => {
      el.removeEventListener('mouseenter', onMouseEnter);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [isHoverExpand]);

  const groups = effectivelyExpanded ? GROUP_ORDER.filter((g) => g && items.some((it) => it.group === g)) : null;

  const renderNavItem = (it: NavItem) => {
    const Icon = it.icon;
    const active = view === it.id;
    const badge = it.id === 'notificaciones' && notificacionesNoLeidas > 0;

    const handleClick = () => {
      setView(it.id);
      window.location.hash = it.id;
      onClose();
    };

    return (
      <button
        key={it.id}
        onClick={handleClick}
        title={effectivelyCollapsed ? t(`nav.items.${it.labelKey}`) : undefined}
        aria-label={t(`nav.items.${it.labelKey}`)}
        aria-current={active ? 'page' : undefined}
        className={`
          group relative w-full flex items-center gap-3 rounded-xl
          transition-all duration-200 active:scale-[0.97]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          focus-visible:ring-offset-1
          ${effectivelyCollapsed
            ? 'justify-center p-3'
            : 'px-2.5 py-[7px] text-xs font-medium'
          }
          ${active
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }
        `}
      >
        <Icon
          className={`
            shrink-0 transition-transform duration-200 group-hover:scale-110
            ${effectivelyCollapsed ? 'w-[17px] h-[17px]' : 'w-[15px] h-[15px]'}
            ${active ? 'drop-shadow-sm' : ''}
          `}
          aria-hidden="true"
        />
        {!effectivelyCollapsed && (
          <span className="truncate leading-tight transition-opacity duration-200">
            {t(`nav.items.${it.labelKey}`)}
          </span>
        )}
        {effectivelyCollapsed && (
          <span className={`
            absolute left-full ml-2 px-2 py-1 rounded-md
            bg-popover text-popover-foreground text-[11px] font-medium
            shadow-lg border border-border whitespace-nowrap opacity-0
            invisible group-hover:opacity-100 group-hover:visible
            transition-all duration-200 translate-x-[-4px]
            group-hover:translate-x-0 z-[70] pointer-events-none
          `}>
            {t(`nav.items.${it.labelKey}`)}
          </span>
        )}
        {badge && effectivelyCollapsed && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full border border-background animate-pulse-soft" />
        )}
        {badge && !effectivelyCollapsed && (
          <span className={`
            ml-auto shrink-0 min-w-[16px] h-4 text-[9px] font-bold
            bg-destructive text-destructive-foreground rounded-full
            flex items-center justify-center px-1 animate-scale-in
          `}>
            {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
          </span>
        )}
      </button>
    );
  };

  const mainItems = items.filter((it) => !it.group);
  const groupedItems = items.filter((it) => it.group);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        ref={sidebarRef}
        className={`
          fixed lg:sticky top-0 lg:top-[60px]
          ${sidebarPosition === 'right' ? 'right-0' : 'left-0'} h-screen
          lg:h-[calc(100vh-60px)] bg-background
          border-r ${sidebarPosition === 'right' ? 'border-l' : 'border-r'}
          border-border z-[60] transition-[width] duration-300 ease-in-out
          lg:translate-x-0
          ${open ? 'translate-x-0' : sidebarPosition === 'right' ? 'translate-x-full' : '-translate-x-full'}
          flex flex-col overflow-hidden
        `}
        style={{
          width: effectivelyExpanded
            ? 'var(--sidebar-width, 256px)'
            : 'var(--sidebar-mini-width, 72px)',
        }}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border lg:hidden flex-shrink-0">
          <span className="font-semibold text-sm text-foreground">{t('nav.modules')}</span>
          <button
            onClick={onClose}
            aria-label={t('sidebar.close_menu')}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User badge */}
        {effectivelyExpanded && (
          <div className="px-3 pt-3 pb-0 flex-shrink-0">
            <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-muted/60 border border-border/60">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-primary">
                  {user?.nombre?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-foreground truncate leading-tight">
                  {user?.nombre || t('common.usuario')}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {user?.rol || t('common.administrador')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav
          className="px-2 py-2 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
          role="navigation"
          aria-label={t('nav.main_navigation')}
          id="sidebar-navigation"
        >
          {effectivelyCollapsed ? (
            <div className="space-y-0.5 pt-1">
              {items.map(renderNavItem)}
            </div>
          ) : (
            <div className="space-y-1 pt-2">
              {/* Main items (sin grupo) */}
              {mainItems.map(renderNavItem)}

              {/* Grouped items */}
              {groups!.map((group) => {
                const groupItems = groupedItems.filter((it) => it.group === group);
                const dotColor = GROUP_COLORS[group] || 'bg-muted-foreground';

                return (
                  <div key={group}>
                    <div className="h-px bg-border/50 mx-1 my-2" />
                    <div className="flex items-center gap-1.5 px-2 mb-1">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70 truncate">
                        {t(`nav.groups.${GROUP_LABELS[group]}`)}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {groupItems.map(renderNavItem)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </nav>

        {/* Collapse toggle */}
        <div className="hidden lg:flex flex-shrink-0 px-2 py-2 border-t border-border/60">
          <button
            onClick={toggleCollapse}
            aria-label={
              isCollapsed
                ? t('sidebar.expand_menu')
                : t('sidebar.collapse_menu')
            }
            aria-expanded={!isCollapsed}
            aria-controls="sidebar-navigation"
            className={`
              w-full flex items-center justify-center gap-2 py-2 px-2
              rounded-xl text-muted-foreground hover:bg-muted
              hover:text-foreground transition-colors text-xs
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
            `}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                <span className="truncate">{t('sidebar.collapse')}</span>
              </>
            )}
          </button>
        </div>

        {/* Brand footer */}
        {effectivelyExpanded && (
          <div className="flex-shrink-0 px-2 pb-2">
            <div className="bg-primary/8 border border-primary/15 rounded-xl px-3 py-2">
              <p className="text-[11px] font-bold text-primary truncate">
                CONSTRUSMART ERP
              </p>
              <p className="text-[9px] text-muted-foreground italic">
                {t('sidebar.tagline')}
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
