import React from 'react';
import { useAppContext } from '@/components/AppLayout';
import { LayoutGrid, DollarSign, FileText, Warehouse, MoreHorizontal } from 'lucide-react';

interface BottomNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentView, onViewChange }) => {
  const { sidebarOpen } = useAppContext();

  const navItems = [
    { key: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { key: 'proyectos', icon: FileText, label: 'Proyectos' },
    { key: 'financiero', icon: DollarSign, label: 'Financiero' },
    { key: 'bodega', icon: Warehouse, label: 'Bodega' },
    { key: 'mas', icon: MoreHorizontal, label: 'Más' },
  ];

  const handleNavClick = (key: string) => {
    if (key === 'mas') {
      onViewChange('dashboard');
    } else {
      onViewChange(key);
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = currentView === item.key || (item.key === 'mas' && !navItems.some(n => n.key === currentView));
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
            >
              <Icon className="w-5 h-5 mb-1" aria-hidden="true" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
