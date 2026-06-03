import React, { Suspense, lazy } from 'react';
import { ErpProvider, useErp } from '@/erp/store';
import AppProvider from '@/contexts/AppContext';
import { useAppContext } from '@/contexts/AppContext';
import Header from '@/erp/components/Header';
import Sidebar from '@/erp/components/Sidebar';
import Login from '@/erp/screens/Login';
import { ErrorBoundary } from './ErrorBoundary';

const Dashboard = lazy(() => import('@/erp/screens/Dashboard'));
const Proyectos = lazy(() => import('@/erp/screens/Proyectos'));
const Presupuestos = lazy(() => import('@/erp/screens/Presupuestos'));
const Seguimiento = lazy(() => import('@/erp/screens/Seguimiento'));
const Financiero = lazy(() => import('@/erp/screens/Financiero'));
const RRHH = lazy(() => import('@/erp/screens/RRHH'));
const Bodega = lazy(() => import('@/erp/screens/Bodega'));
const CRM = lazy(() => import('@/erp/screens/CRM'));
const APUAvanzado = lazy(() => import('@/erp/screens/APUAvanzado'));
const CurvasS = lazy(() => import('@/erp/screens/CurvasS'));
const Rendimientos = lazy(() => import('@/erp/screens/Rendimientos'));
const BasePrecios = lazy(() => import('@/erp/screens/BasePrecios'));
const ReportesTecnicos = lazy(() => import('@/erp/screens/ReportesTecnicos'));
const MuroObra = lazy(() => import('@/erp/screens/MuroObra'));
const OrdenesCambio = lazy(() => import('@/erp/screens/OrdenesCambio'));
const Notificaciones = lazy(() => import('@/erp/screens/Notificaciones'));
const SSOCalidad = lazy(() => import('@/erp/screens/SSOCalidad'));
const GestionDocumental = lazy(() => import('@/erp/screens/GestionDocumental'));
const ExportacionInteligente = lazy(() => import('@/erp/screens/ExportacionInteligente'));
const LogisticaCompras = lazy(() => import('@/erp/screens/LogisticaCompras'));
const RendimientoCampo = lazy(() => import('@/erp/screens/RendimientoCampo'));
const ComercialFinanzas = lazy(() => import('@/erp/screens/ComercialFinanzas'));
const Administracion = lazy(() => import('@/erp/screens/Administracion'));
const PlanillaDestajos = lazy(() => import('@/erp/screens/PlanillaDestajos'));
const Impuestos = lazy(() => import('@/erp/screens/Impuestos'));
const EntradasAlmacenOC = lazy(() => import('@/erp/screens/EntradasAlmacenOC'));
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
          <div key={view} className="animate-[fadeIn_0.3s_ease]"><ErrorBoundary>{currentScreen}</ErrorBoundary></div>
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
