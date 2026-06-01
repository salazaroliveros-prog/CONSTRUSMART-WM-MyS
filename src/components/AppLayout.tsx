import React from 'react';
import { ErpProvider, useErp } from '@/erp/store';
import AppProvider from '@/contexts/AppContext';
import { useAppContext } from '@/contexts/AppContext';
import Header from '@/erp/components/Header';
import Sidebar from '@/erp/components/Sidebar';
import Login from '@/erp/screens/Login';
import Dashboard from '@/erp/screens/Dashboard';
import Proyectos from '@/erp/screens/Proyectos';
import Presupuestos from '@/erp/screens/Presupuestos';
import Seguimiento from '@/erp/screens/Seguimiento';
import Financiero from '@/erp/screens/Financiero';
import RRHH from '@/erp/screens/RRHH';
import Bodega from '@/erp/screens/Bodega';

const Shell: React.FC = () => {
  const { view } = useErp();
  const { sidebarOpen, toggleSidebar } = useAppContext();

  if (view === 'login') return <Login />;

  const screens: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    proyectos: <Proyectos />,
    presupuestos: <Presupuestos />,
    seguimiento: <Seguimiento />,
    financiero: <Financiero />,
    rrhh: <RRHH />,
    bodega: <Bodega />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onMenu={toggleSidebar} />
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={toggleSidebar} />
        <main className="flex-1 min-w-0">
          <div key={view} className="animate-[fadeIn_0.3s_ease]">{screens[view]}</div>
        </main>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <AppProvider>
      <ErpProvider>
        <Shell />
      </ErpProvider>
    </AppProvider>
  );
};

export default AppLayout;
