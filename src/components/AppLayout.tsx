import React, { Suspense, lazy, useState, useEffect } from 'react';
import { ErpProvider, useErp } from '@/erp/store';
import AppProvider from '@/contexts/AppContext';
import { useAppContext } from '@/contexts/AppContext';
import Header from '@/erp/components/Header';
import Sidebar from '@/erp/components/Sidebar';
import Login from '@/erp/screens/Login';
import { ErrorBoundary } from './ErrorBoundary';
import LoaderSpinner from './LoaderSpinner';

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
const Riesgos = lazy(() => import('@/erp/screens/Riesgos'));
const HitosScreen = lazy(() => import('@/erp/screens/Hitos'));
const CuentasCobrarScreen = lazy(() => import('@/erp/screens/CuentasCobrar'));
const CuentasPagarScreen = lazy(() => import('@/erp/screens/CuentasPagar'));
const PlanillaDestajos = lazy(() => import('@/erp/screens/PlanillaDestajos'));
const Impuestos = lazy(() => import('@/erp/screens/Impuestos'));
const EntradasAlmacenOC = lazy(() => import('@/erp/screens/EntradasAlmacenOC'));
const VisorBIM = lazy(() => import('@/erp/screens/VisorBIM'));
const DashboardPredictivo = lazy(() => import('@/erp/screens/DashboardPredictivo'));

const LazyScreen: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoaderSpinner size={60} text="Cargando..." />}>
    {children}
  </Suspense>
);

// Transición suave entre módulos
const FadeView: React.FC<{ view: string; children: React.ReactNode }> = ({ view, children }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [view]);
  return (
    <div className={`transition-all duration-200 ease-in-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
      {children}
    </div>
  );
};

const Shell: React.FC = () => {
  const { view, initializing, allowedViews, setView } = useErp();
  const { sidebarOpen, toggleSidebar, sidebarCollapsed } = useAppContext();

  if (initializing) {
    return <LoaderSpinner size={80} text="Cargando sistema..." fullScreen />;
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
    'riesgos': <Riesgos />,
    'hitos': <HitosScreen />,
    'cuentas-cobrar': <CuentasCobrarScreen />,
    'cuentas-pagar': <CuentasPagarScreen />,
    'entradas-almacen': <EntradasAlmacenOC />,
  };

  const screenContent = allowedViews.includes(view)
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
          <Suspense fallback={<LoaderSpinner size={60} text="Cargando módulo..." />}>
            <FadeView key={view} view={view}><ErrorBoundary>{screenContent}</ErrorBoundary></FadeView>
          </Suspense>
        </main>
      </div>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .transition-opacity{transition-property:opacity}
        .transition-transform{transition-property:transform}
      `}</style>
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
