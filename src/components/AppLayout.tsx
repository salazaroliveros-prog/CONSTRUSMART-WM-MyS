import React, { Suspense, lazy, useEffect } from 'react';
import { ErpProvider, useErp } from '@/erp/store';
import AppProvider from '@/contexts/AppContext';
import { useAppContext } from '@/contexts/AppContext';
import Header from '@/erp/components/Header';
import Sidebar from '@/erp/components/Sidebar';
import Login from '@/erp/screens/Login';
import { applyThemeToDocument } from '@/utils/theme-generator';

const Dashboard          = lazy(() => import('@/erp/screens/Dashboard'));
const Proyectos          = lazy(() => import('@/erp/screens/Proyectos'));
const Presupuestos       = lazy(() => import('@/erp/screens/Presupuestos'));
const Seguimiento        = lazy(() => import('@/erp/screens/Seguimiento'));
const Financiero         = lazy(() => import('@/erp/screens/Financiero'));
const RRHH               = lazy(() => import('@/erp/screens/RRHH'));
const Bodega             = lazy(() => import('@/erp/screens/Bodega'));
const CRM                = lazy(() => import('@/erp/screens/CRM'));
const APUAvanzado        = lazy(() => import('@/erp/screens/APUAvanzado'));
const CurvasS            = lazy(() => import('@/erp/screens/CurvasS'));
const Rendimientos       = lazy(() => import('@/erp/screens/Rendimientos'));
const BasePrecios        = lazy(() => import('@/erp/screens/BasePrecios'));
const ReportesTecnicos   = lazy(() => import('@/erp/screens/ReportesTecnicos'));
const MuroObra           = lazy(() => import('@/erp/screens/MuroObra'));
const OrdenesCambio      = lazy(() => import('@/erp/screens/OrdenesCambio'));
const Notificaciones     = lazy(() => import('@/erp/screens/Notificaciones'));
const SSOCalidad         = lazy(() => import('@/erp/screens/SSOCalidad'));
const GestionDocumental  = lazy(() => import('@/erp/screens/GestionDocumental'));
const VisorBIM           = lazy(() => import('@/erp/screens/VisorBIM'));
const DashboardPredictivo = lazy(() => import('@/erp/screens/DashboardPredictivo'));
const ExportacionInteligente = lazy(() => import('@/erp/screens/ExportacionInteligente'));
const LogisticaCompras   = lazy(() => import('@/erp/screens/LogisticaCompras'));
const RendimientoCampo   = lazy(() => import('@/erp/screens/RendimientoCampo'));
const ComercialFinanzas  = lazy(() => import('@/erp/screens/ComercialFinanzas'));
const Administracion     = lazy(() => import('@/erp/screens/Administracion'));
const PlanillaDestajos   = lazy(() => import('@/erp/screens/PlanillaDestajos'));
const Impuestos          = lazy(() => import('@/erp/screens/Impuestos'));
const EntradasAlmacen    = lazy(() => import('@/erp/screens/EntradasAlmacenOC'));
const Ajustes            = lazy(() => import('@/erp/screens/Ajustes'));
const Hitos              = lazy(() => import('@/erp/screens/Hitos'));
const Riesgos            = lazy(() => import('@/erp/screens/Riesgos'));
const CuentasCobrar      = lazy(() => import('@/erp/screens/CuentasCobrar'));
const CuentasPagar       = lazy(() => import('@/erp/screens/CuentasPagar'));

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
  const { view, initializing, appSettings, user, allowedViews } = useErp();
  const { sidebarOpen, toggleSidebar, closeSidebar, sidebarCollapsed } = useAppContext();

  useEffect(() => {
    applyThemeToDocument({
      appTheme: appSettings.appTheme,
      compactMode: appSettings.compactMode,
      primaryColor: appSettings.primaryColor,
      uiMode: appSettings.uiMode,
    });
  }, [appSettings.appTheme, appSettings.compactMode, appSettings.primaryColor, appSettings.uiMode]);

  if (initializing) return <AppLoader />;
  if (view === 'login') return <Login />;
  
  // P4: AuthGuard - bloquear acceso a vistas no permitidas
  const viewName = view.split(':')[0];
  if (!user || !allowedViews.includes(viewName as any)) {
    return <Login />;
  }

  const screens: Record<string, React.ReactNode> = {
    dashboard:         <Dashboard />,
    proyectos:         <Proyectos />,
    presupuestos:      <Presupuestos />,
    seguimiento:       <Seguimiento />,
    financiero:        <Financiero />,
    rrhh:              <RRHH />,
    bodega:            <Bodega />,
    crm:               <CRM />,
    apu:               <APUAvanzado />,
    curvas:            <CurvasS />,
    rendimientos:      <Rendimientos />,
    baseprecios:       <BasePrecios />,
    reportes:          <ReportesTecnicos />,
    muro:              <MuroObra />,
    'ordenes-cambio':  <OrdenesCambio />,
    notificaciones:    <Notificaciones />,
    'sso-calidad':     <SSOCalidad />,
    documentos:        <GestionDocumental />,
    'visor-bim':       <VisorBIM />,
    predictivo:        <DashboardPredictivo />,
    exportacion:       <ExportacionInteligente />,
    logistica:         <LogisticaCompras />,
    'rendimiento-campo': <RendimientoCampo />,
    'comercial-fin':   <ComercialFinanzas />,
    'admin-sistema':   <Administracion />,
    'planilla-destajos': <PlanillaDestajos />,
    impuestos:         <Impuestos />,
    'entradas-almacen': <EntradasAlmacen />,
    ajustes:           <Ajustes />,
    hitos:             <Hitos />,
    riesgos:           <Riesgos />,
    'cuentas-cobrar':  <CuentasCobrar />,
    'cuentas-pagar':   <CuentasPagar />,
  };

  // P3: Solo renderizar screens permitidas para el rol
  const allAllowedScreens = Object.keys(screens).filter(key => allowedViews.includes(key as any));
  const safeScreen = allAllowedScreens.includes(viewName) ? screens[viewName] : screens['dashboard'];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header onMenu={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />
        <main
          id="main-content"
          className={`flex-1 min-w-0 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-0' : ''}`}
          role="main"
          aria-label="Contenido principal"
        >
          <Suspense fallback={<ScreenLoader />}>
            <div key={view} className="animate-slide-up">
              {safeScreen}
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
