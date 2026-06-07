import React from 'react';
import { useErp, View } from '../store';
import { useAppContext } from '@/components/AppLayout';
import {
  LayoutDashboard, Building2, Calculator, ClipboardCheck, Wallet, Users, Warehouse,
  X, ChevronLeft, ChevronRight, Target, Receipt, TrendingUp, BookOpen, Newspaper,
  GitPullRequest, Bell, ShieldCheck, FolderOpen, BarChart3, Download,
  HardHat, DollarSign, Settings, Flag,
  CreditCard, Landmark, Percent, TriangleAlert,
  ClipboardList, PieChart, Cpu, Truck, FileCog, Package,
} from 'lucide-react';

interface NavItem { id: View; label: string; icon: React.ElementType; group: string }

// ─── Navegación reorganizada por área funcional de una constructora ──────────
const ITEMS: NavItem[] = [
  // ── 1. PRINCIPAL ──────────────────────────────────────────────────────────
  { id: 'dashboard',         label: 'Tablero',            icon: LayoutDashboard, group: 'Principal'    },
  { id: 'proyectos',         label: 'Proyectos',          icon: Building2,       group: 'Principal'    },
  { id: 'crm',               label: 'CRM / Pipeline',     icon: Target,          group: 'Principal'    },

  // ── 2. PLANIFICACIÓN ──────────────────────────────────────────────────────
  { id: 'presupuestos',      label: 'Presupuestos APU',   icon: Calculator,      group: 'Planificación'},
  { id: 'apu',               label: 'APU Avanzado',       icon: Receipt,         group: 'Planificación'},
  { id: 'baseprecios',       label: 'Base de Precios',    icon: BookOpen,        group: 'Planificación'},
  { id: 'hitos',             label: 'Hitos',              icon: Flag,            group: 'Planificación'},
  { id: 'riesgos',           label: 'Riesgos',            icon: TriangleAlert,   group: 'Planificación'},

  // ── 3. EJECUCIÓN / CAMPO ──────────────────────────────────────────────────
  { id: 'seguimiento',       label: 'Seguimiento EVM',    icon: ClipboardCheck,  group: 'Ejecución'    },
  { id: 'curvas',            label: 'Curvas S',           icon: TrendingUp,      group: 'Ejecución'    },
  { id: 'rendimiento-campo', label: 'Rendimiento Campo',  icon: HardHat,         group: 'Ejecución'    },
  { id: 'sso-calidad',       label: 'SSO & Calidad',      icon: ShieldCheck,     group: 'Ejecución'    },
  { id: 'muro',              label: 'Muro de Obra',       icon: Newspaper,       group: 'Ejecución'    },
  { id: 'ordenes-cambio',    label: 'Órdenes de Cambio',  icon: GitPullRequest,  group: 'Ejecución'    },
  { id: 'documentos',        label: 'Documentos',         icon: FolderOpen,      group: 'Ejecución'    },
  { id: 'visor-bim',         label: 'Visor BIM',          icon: Cpu,             group: 'Ejecución'    },

  // ── 4. SUMINISTRO / BODEGA ────────────────────────────────────────────────
  { id: 'bodega',            label: 'Bodega',             icon: Warehouse,       group: 'Suministro'   },
  { id: 'logistica',         label: 'Logística/Compras',  icon: Truck,           group: 'Suministro'   },
  { id: 'entradas-almacen',  label: 'Entradas Almacén',   icon: Package,         group: 'Suministro'   },

  // ── 5. RRHH / NÓMINA ──────────────────────────────────────────────────────
  { id: 'rrhh',              label: 'RRHH',               icon: Users,           group: 'RRHH'         },
  { id: 'planilla-destajos', label: 'Planilla Destajos',  icon: ClipboardList,   group: 'RRHH'         },

  // ── 6. FINANZAS ───────────────────────────────────────────────────────────
  { id: 'financiero',        label: 'Financiero',         icon: Wallet,          group: 'Finanzas'     },
  { id: 'comercial-fin',     label: 'Comercial/Finanzas', icon: DollarSign,      group: 'Finanzas'     },
  { id: 'cuentas-cobrar',    label: 'Cuentas x Cobrar',   icon: CreditCard,      group: 'Finanzas'     },
  { id: 'cuentas-pagar',     label: 'Cuentas x Pagar',    icon: Landmark,        group: 'Finanzas'     },
  { id: 'impuestos',         label: 'Impuestos',          icon: Percent,         group: 'Finanzas'     },

  // ── 7. ANÁLISIS / BI ──────────────────────────────────────────────────────
  { id: 'predictivo',        label: 'Dashboard BI',       icon: PieChart,        group: 'Análisis BI'  },
  { id: 'exportacion',       label: 'Exportación',        icon: Download,        group: 'Análisis BI'  },
  { id: 'reportes',          label: 'Reportes Técnicos',  icon: BarChart3,       group: 'Análisis BI'  },

  // ── 8. SISTEMA ────────────────────────────────────────────────────────────
  { id: 'notificaciones',    label: 'Notificaciones',     icon: Bell,            group: 'Sistema'      },
  { id: 'admin-sistema',     label: 'Administración',     icon: FileCog,         group: 'Sistema'      },
  { id: 'ajustes',           label: 'Ajustes',            icon: Settings,        group: 'Sistema'      },
];

// Dot color por grupo para separación visual
const GROUP_DOT: Record<string, string> = {
  'Principal':     'bg-primary',
  'Planificación': 'bg-blue-500',
  'Ejecución':     'bg-emerald-500',
  'Suministro':    'bg-orange-500',
  'RRHH':          'bg-violet-500',
  'Finanzas':      'bg-yellow-500',
  'Análisis BI':   'bg-cyan-500',
  'Sistema':       'bg-muted-foreground',
};

const Sidebar: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { view, setView, allowedViews, user, notificacionesNoLeidas } = useErp();
  const { sidebarCollapsed, toggleCollapse } = useAppContext();

  const items   = ITEMS.filter(it => allowedViews.includes(it.id));
  const collapsed = sidebarCollapsed;
  const asideW  = collapsed ? 'w-[58px]' : 'w-[222px]';
  const groups  = collapsed ? null : [...new Set(items.map(it => it.group))];

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 lg:top-[60px] left-0 h-screen lg:h-[calc(100vh-60px)]
          ${asideW} bg-background border-r border-border z-50
          transition-[width] duration-300
          lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col overflow-hidden`}
      >
        {/* ── Mobile header ── */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border lg:hidden flex-shrink-0">
          <span className="font-semibold text-sm text-foreground">Módulos</span>
          <button onClick={onClose} aria-label="Cerrar menú"
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── User badge (expanded only) ── */}
        {!collapsed && (
          <div className="px-3 pt-3 pb-0 flex-shrink-0">
            <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-muted/60 border border-border/60">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-primary">
                  {user?.nombre?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-foreground truncate leading-tight">
                  {user?.nombre || 'Usuario'}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">{user?.rol}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Nav ── */}
        <nav
          className="px-2 py-2 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
          role="navigation"
          aria-label="Navegación principal"
          id="sidebar-navigation"
        >
          {collapsed ? (
            /* ── COLLAPSED: solo iconos ── */
            <div className="space-y-0.5 pt-1">
              {items.map(it => {
                const Icon  = it.icon;
                const active = view === it.id;
                const badge  = it.id === 'notificaciones' && notificacionesNoLeidas > 0;
                return (
                  <button
                    key={it.id}
                    onClick={() => { setView(it.id); onClose(); }}
                    title={it.label}
                    aria-label={it.label}
                    aria-current={active ? 'page' : undefined}
                    className={`relative w-full flex items-center justify-center p-2.5 rounded-xl
                      transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                      ${active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                  >
                    <Icon className="w-[17px] h-[17px] shrink-0" aria-hidden="true" />
                    {badge && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full border border-background" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* ── EXPANDED: grupos con separadores ── */
            <div className="space-y-1 pt-2">
              {groups!.map((group, gIdx) => {
                const groupItems = items.filter(it => it.group === group);
                const dot = GROUP_DOT[group] || 'bg-muted-foreground';
                return (
                  <div key={group}>
                    {gIdx > 0 && <div className="h-px bg-border/50 mx-1 my-2" />}

                    {/* Grupo label */}
                    <div className="flex items-center gap-1.5 px-2 mb-1">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70 truncate">
                        {group}
                      </span>
                    </div>

                    {/* Ítems del grupo */}
                    <div className="space-y-0.5">
                      {groupItems.map(it => {
                        const Icon   = it.icon;
                        const active = view === it.id;
                        const badge  = it.id === 'notificaciones' && notificacionesNoLeidas > 0;
                        return (
                          <button
                            key={it.id}
                            onClick={() => { setView(it.id); onClose(); }}
                            aria-current={active ? 'page' : undefined}
                            className={`relative w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-xl
                              text-xs font-medium transition-colors
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1
                              ${active
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                          >
                            <Icon className="w-[15px] h-[15px] shrink-0" aria-hidden="true" />
                            <span className="truncate leading-tight">{it.label}</span>
                            {badge && (
                              <span className="ml-auto shrink-0 min-w-[16px] h-4 text-[9px] font-bold
                                bg-destructive text-destructive-foreground rounded-full
                                flex items-center justify-center px-1">
                                {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </nav>

        {/* ── Collapse toggle ── */}
        <div className="hidden lg:flex flex-shrink-0 px-2 py-2 border-t border-border/60">
          <button
            onClick={toggleCollapse}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            aria-expanded={!collapsed}
            aria-controls="sidebar-navigation"
            className="w-full flex items-center justify-center gap-2 py-2 px-2 rounded-xl
              text-muted-foreground hover:bg-muted hover:text-foreground
              transition-colors text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" aria-hidden="true" />
              : <><ChevronLeft className="w-4 h-4" aria-hidden="true" /><span className="truncate">Colapsar</span></>
            }
          </button>
        </div>

        {/* ── Brand footer ── */}
        {!collapsed && (
          <div className="flex-shrink-0 px-2 pb-2">
            <div className="bg-primary/8 border border-primary/15 rounded-xl px-3 py-2">
              <p className="text-[11px] font-bold text-primary truncate">CONSTRUSMART ERP</p>
              <p className="text-[9px] text-muted-foreground italic">Edificando el Futuro</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
