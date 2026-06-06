import React, { Suspense, lazy } from 'react';
import { ErpProvider, useErp } from '@/erp/store';
import AppProvider from '@/contexts/AppContext';
import { useAppContext } from '@/contexts/AppContext';
import Header from '@/erp/components/Header';
import Sidebar from '@/erp/components/Sidebar';
import Login from '@/erp/screens/Login';

const Dashboard    = lazy(() => import('@/erp/screens/Dashboard'));
const Proyectos    = lazy(() => import('@/erp/screens/Proyectos'));
const Presupuestos = lazy(() => import('@/erp/screens/Presupuestos'));
const Seguimiento  = lazy(() => import('@/erp/screens/Seguimiento'));
const Financiero   = lazy(() => import('@/erp/screens/Financiero'));
const RRHH         = lazy(() => import('@/erp/screens/RRHH'));
const Bodega       = lazy(() => import('@/erp/screens/Bodega'));

const ScreenLoader: React.FC = () => (
  <div className="flex items-center justify-center h-64" role="status" aria-label="Cargando módulo">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
  </div>
);

const AppLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label="Iniciando aplicación">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      <p className="text-muted-foreground text-sm font-medium">Cargando...</p>
    </div>
  </div>
);

const Shell: React.FC = () => {
  const { view, initializing } = useErp();
  const { sidebarOpen, toggleSidebar, closeSidebar, sidebarCollapsed } = useAppContext();

  if (initializing) return <AppLoader />;
  if (view === 'login') return <Login />;

  const screens: Record<string, React.ReactNode> = {
    dashboard:    <Dashboard />,
    proyectos:    <Proyectos />,
    presupuestos: <Presupuestos />,
    seguimiento:  <Seguimiento />,
    financiero:   <Financiero />,
    rrhh:         <RRHH />,
    bodega:       <Bodega />,
  };

  const currentScreen = screens[view] ?? <Dashboard />;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header onMenu={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />
        <main
          id="main-content"
          className={`flex-1 min-w-0 overflow-auto transition-all duration-200 ${sidebarCollapsed ? 'lg:ml-0' : ''}`}
          role="main"
          aria-label="Contenido principal"
        >
          <Suspense fallback={<ScreenLoader />}>
            <div key={view} className="animate-slide-up">
              {currentScreen}
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => (
  <AppProvider>
    <ErpProvider>
      <Shell />
    </ErpProvider>
  </AppProvider>
);

export default AppLayout;
