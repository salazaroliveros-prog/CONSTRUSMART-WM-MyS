import React, { Suspense, lazy } from 'react';
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
import CRM from '@/erp/screens/CRM';
import APUAvanzado from '@/erp/screens/APUAvanzado';
import CurvasS from '@/erp/screens/CurvasS';
import Rendimientos from '@/erp/screens/Rendimientos';
import BasePrecios from '@/erp/screens/BasePrecios';
import ReportesTecnicos from '@/erp/screens/ReportesTecnicos';
import MuroObra from '@/erp/screens/MuroObra';
import OrdenesCambio from '@/erp/screens/OrdenesCambio';
import Notificaciones from '@/erp/screens/Notificaciones';
import SSOCalidad from '@/erp/screens/SSOCalidad';
import GestionDocumental from '@/erp/screens/GestionDocumental';
import ExportacionInteligente from '@/erp/screens/ExportacionInteligente';
import LogisticaCompras from '@/erp/screens/LogisticaCompras';
import RendimientoCampo from '@/erp/screens/RendimientoCampo';
import ComercialFinanzas from '@/erp/screens/ComercialFinanzas';
import Administracion from '@/erp/screens/Administracion';
import PlanillaDestajos from '@/erp/screens/PlanillaDestajos';
import Impuestos from '@/erp/screens/Impuestos';
import EntradasAlmacenOC from '@/erp/screens/EntradasAlmacenOC';

// Dynamic imports for heavy screens (web-ifc = 3.6MB)
const VisorBIM = lazy(() => import('@/erp/screens/VisorBIM'));
const DashboardPredictivo = lazy(() => import('@/erp/screens/DashboardPredictivo'));

const LazyScreen: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}>
    {children}
  </Suspense>
);

const Shell: React.FC = () => {
  const { view, initializing, allowedViews, setView } = useErp();
  const { sidebarOpen, toggleSidebar, sidebarCollapsed } = useAppContext();

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium animate-pulse">Cargando...</p>
        </div>
      </div>
    );
  }

  if (view === 'login') return <Login />;

  const screens: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    proyectos: <Proyectos />,
    presupuestos: <Presupuestos />,
    seguimiento: <Seguimiento />,
    financiero: <Financiero />,
    rrhh: <RRHH />,
    apu: <APUAvanzado />,
    curvas: <CurvasS />,
    rendimientos: <Rendimientos />,
    baseprecios: <BasePrecios />,
    reportes: <ReportesTecnicos />,
    muro: <MuroObra />,
    'ordenes-cambio': <OrdenesCambio />,
    notificaciones: <Notificaciones />,
    bodega: <Bodega />,
    crm: <CRM />,
    'sso-calidad': <SSOCalidad />,
    'documentos': <GestionDocumental />,
    'predictivo': <LazyScreen><DashboardPredictivo /></LazyScreen>,
    'exportacion': <ExportacionInteligente />,
    'visor-bim': <LazyScreen><VisorBIM /></LazyScreen>,
    'logistica': <LogisticaCompras />,
    'rendimiento-campo': <RendimientoCampo />,
    'comercial-fin': <ComercialFinanzas />,
    'admin-sistema': <Administracion />,
    'planilla-destajos': <PlanillaDestajos />,
    'impuestos': <Impuestos />,
    'entradas-almacen': <EntradasAlmacenOC />,
  };

  const currentScreen = allowedViews.includes(view)
    ? screens[view] ?? <Dashboard />
    : (
      <div className="min-h-[calc(100vh-60px)] flex flex-col items-center justify-center p-8 text-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Acceso no autorizado</h2>
          <p className="text-slate-600 mb-5">No tienes permiso para ver esta sección. Selecciona otro módulo o regresa al tablero.</p>
          <button onClick={() => setView('dashboard')} className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition">
            Volver al Tablero
          </button>
        </div>
      </div>
    );

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header onMenu={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={toggleSidebar} />
        <main className={`flex-1 min-w-0 overflow-auto transition-all ${sidebarCollapsed ? 'lg:ml-0' : ''}`}>
          <div key={view} className="animate-[fadeIn_0.3s_ease]">{currentScreen}</div>
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
