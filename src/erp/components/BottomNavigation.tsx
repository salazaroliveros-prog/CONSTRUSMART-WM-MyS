import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/components/AppLayout';
import {
  LayoutGrid, DollarSign, FileText, Warehouse, MoreHorizontal, ChevronUp,
  AlertTriangle, BarChart3, Users, Truck, ClipboardList, Building2,
  Wrench, Settings, TrendingUp,
} from 'lucide-react';

interface BottomNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const PRIMARY_ITEMS = [
  { key: 'dashboard', icon: LayoutGrid, labelKey: 'nav.items.dashboard' },
  { key: 'proyectos', icon: Building2, labelKey: 'nav.items.proyectos' },
  { key: 'financiero', icon: DollarSign, labelKey: 'nav.items.financiero' },
  { key: 'base-precios', icon: ClipboardList, labelKey: 'nav.items.base_precios' },
  { key: 'mas', icon: MoreHorizontal, labelKey: 'common.mas' },
];

const MORE_EXTENDED = [
  { key: 'bodega', icon: Warehouse, labelKey: 'nav.items.bodega' },
  { key: 'logistica', icon: Truck, labelKey: 'nav.items.logistica' },
  { key: 'rrhh', icon: Users, labelKey: 'nav.items.rrhh' },
  { key: 'presupuestos', icon: FileText, labelKey: 'nav.items.presupuestos' },
  { key: 'seguimiento', icon: TrendingUp, labelKey: 'nav.items.seguimiento' },
  { key: 'activos', icon: Wrench, labelKey: 'nav.items.activos' },
  { key: 'riesgos', icon: AlertTriangle, labelKey: 'nav.items.riesgos' },
  { key: 'ajustes', icon: Settings, labelKey: 'nav.items.ajustes' },
];

const MORE_GRID = MORE_EXTENDED.map(item => ({
  ...item,
  icon: item.icon,
}));

const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentView, onViewChange }) => {
  const { t } = useTranslation();
  useAppContext();
  const [open, setOpen] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchRef = useRef({ startX: 0, startY: 0, startTime: 0 });
  const sheetRef = useRef<HTMLDivElement>(null);

  const closeSheet = useCallback(() => setOpen(false), []);

  const handleNavClick = useCallback((key: string) => {
    if (key === 'mas') {
      setOpen(p => !p);
    } else {
      onViewChange(key);
      setOpen(false);
    }
  }, [onViewChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      startTime: Date.now(),
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!open) return;
    const dy = e.touches[0].clientY - touchRef.current.startY;
    if (dy > 0) {
      setSwipeOffset(Math.min(dy, 200));
    }
  }, [open]);

  const handleTouchEnd = useCallback(() => {
    if (swipeOffset > 80) {
      closeSheet();
    }
    setSwipeOffset(0);
  }, [swipeOffset, closeSheet]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSheet(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, closeSheet]);

  useEffect(() => {
    setOpen(false);
  }, [currentView]);

  return (
    <>
      {/* Mobile bottom sheet overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={closeSheet}
          aria-hidden="true"
        />
      )}

      {/* Bottom sheet panel */}
      {open && (
        <div
          ref={sheetRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.15)] animate-in slide-in-from-bottom duration-300"
          style={{
            transform: swipeOffset > 0 ? `translateY(${swipeOffset}px)` : undefined,
            transition: swipeOffset > 0 ? 'none' : undefined,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
          role="dialog"
          aria-modal="true"
          aria-label={t('common.navegacion')}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
            <span className="text-sm font-semibold text-foreground">{t('common.navegacion')}</span>
            <button
              onClick={closeSheet}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted active:scale-90 transition-all"
              aria-label={t('common.cerrar_menu')}
            >
              <ChevronUp className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1 p-3 max-h-[50vh] overflow-y-auto">
            {MORE_GRID.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 px-1 transition-all active:scale-90 min-h-[64px] ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  aria-label={t(item.labelKey)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  <span className="text-[10px] font-medium leading-tight text-center">{t(item.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30 safe-area-bottom"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label={t('common.navegacion')}
      >
        <div className="flex items-center justify-around h-16 px-1">
          {PRIMARY_ITEMS.map((item) => {
            const isActive = currentView === item.key || (item.key === 'mas' && open);
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`flex flex-col items-center justify-center w-full h-full min-h-[48px] transition-all active:scale-90 rounded-lg ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                } ${item.key === 'mas' && open ? 'bg-primary/5' : ''}`}
                aria-label={t(item.labelKey)}
                aria-current={isActive ? 'page' : undefined}
                aria-expanded={item.key === 'mas' ? open : undefined}
              >
                <Icon className="w-5 h-5 mb-0.5" aria-hidden="true" />
                <span className="text-[10px] font-medium leading-tight">{t(item.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default BottomNavigation;