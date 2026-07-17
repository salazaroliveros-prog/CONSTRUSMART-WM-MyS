import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/components/AppLayout';
import { LayoutGrid, DollarSign, FileText, Warehouse, MoreHorizontal, ChevronUp } from 'lucide-react';

interface BottomNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentView, onViewChange }) => {
  const { t } = useTranslation();
  useAppContext();
  const [open, setOpen] = useState(false);

  const MORE_ITEMS = [
    { key: 'presupuestos', label: t('nav.items.presupuestos'), icon: LayoutGrid },
    { key: 'bodega', label: t('nav.items.bodega'), icon: Warehouse },
    { key: 'financiero', label: t('nav.items.financiero'), icon: DollarSign },
    { key: 'proyectos', label: t('nav.items.proyectos'), icon: FileText },
  ];

  const navItems = [
    { key: 'dashboard', icon: LayoutGrid, label: t('nav.items.dashboard') },
    { key: 'proyectos', icon: FileText, label: t('nav.items.proyectos') },
    { key: 'financiero', icon: DollarSign, label: t('nav.items.financiero') },
    { key: 'bodega', icon: Warehouse, label: t('nav.items.bodega') },
    { key: 'mas', icon: MoreHorizontal, label: t('common.mas') },
  ];

  const handleNavClick = (key: string) => {
    if (key === 'mas') {
      setOpen(p => !p);
    } else {
      onViewChange(key);
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = currentView === item.key || (item.key === 'mas' && open);
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              onClick={() => handleNavClick(item.key)}
              className={`flex flex-col items-center justify-center w-full h-full min-h-[44px] transition-all active:scale-95 ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              aria-expanded={item.key === 'mas' ? open : undefined}
            >
              <Icon className="w-5 h-5 mb-1" aria-hidden="true" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      {open && (
        <div className="absolute bottom-full left-0 right-0 bg-card border-t border-border rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
            <span className="text-xs font-semibold text-foreground">{t('common.mas_modulos')}</span>
            <button onClick={() => setOpen(false)} className="p-1 rounded-md text-muted-foreground hover:text-foreground" aria-label={t('common.cerrar_menu')}>
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1 p-2">
            {MORE_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => { onViewChange(item.key); setOpen(false); }}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 transition-all active:scale-95 ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                  }`}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BottomNavigation;
