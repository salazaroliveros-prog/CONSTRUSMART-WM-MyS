import React, { Suspense, lazy, useEffect, useState, createContext, useContext, useMemo, useRef } from 'react';
import { ErpProvider, useErp } from '@/erp/store';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { ErrorBoundary } from './ErrorBoundary';
import { PageTransition } from './Animations';

const Header = lazy(() => import('@/erp/components/Header'));
const Sidebar = lazy(() => import('@/erp/components/Sidebar'));
const Login = lazy(() => import('@/erp/screens/Login'));
const QuickActionsFab = lazy(() => import('@/erp/components/QuickActionsFab'));
const BottomNavigation = lazy(() => import('@/erp/components/BottomNavigation'));
import { syncAllVisualSettings } from '@/lib/themes';
import { EMPRESA } from '@/erp/utils';
import '@/styles/theme-variables.css';

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  sidebarCollapsed: boolean;
  toggleCollapse: () => void;
}
const AppContext = createContext<AppContextType | null>(null);
export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext debe usarse dentro de AppProvider');
  return ctx;
};

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('wm_sidebar_collapsed') === 'true'; } catch { return false; }
  });

  return (
    <AppContext.Provider value={{
      sidebarOpen,
      toggleSidebar: () => setSidebarOpen(p => !p),
      closeSidebar: () => setSidebarOpen(false),
      sidebarCollapsed,
      toggleCollapse: () => setSidebarCollapsed(p => !p),
    }}>
      {children}
    </AppContext.Provider>
  );
};

const Dashboard          = lazy(() => import('@/erp/screens/Dashboard'));
const Proyectos          = lazy(() => import('@/erp/screens/Proyectos'));
const Presupuestos       = lazy(() => import('@/erp/screens/Presupuestos'));
const Seguimiento        = lazy(() => import('@/erp/screens/Seguimiento'));
const Financiero         = lazy(() => import('@/erp/screens/Financiero'));
const RRHH               = lazy(() => import('@/erp/screens/RRHH'));
const Bodega             = lazy(() => import('@/erp/screens/Bodega'));
const CRM                = lazy(() => import('@/erp/screens/CRM'));
const APUAvanzado        = lazy(() => import('@/erp/screens/APUAvanzado'));
const BasePrecios        = lazy(() => import('@/erp/screens/BasePrecios'));
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
const Cotizaciones       = lazy(() => import('@/erp/screens/Cotizaciones'));
const PlantillasProyectos = lazy(() => import('@/erp/screens/PlantillasProyectos'));
const ProveedorAnalytics = lazy(() => import('@/erp/screens/ProveedorAnalytics'));
const ErrorLog            = lazy(() => import('@/erp/screens/ErrorLog'));
const Activos             = lazy(() => import('@/erp/screens/Activos'));
const Cuadros             = lazy(() => import('@/erp/screens/Cuadros'));
const ProfitabilityAnalytics = lazy(() => import('@/erp/screens/ProfitabilityAnalytics'));
const Weather             = lazy(() => import('@/erp/screens/Weather'));

const SCREEN_KEYS = ['dashboard','proyectos','presupuestos','seguimiento','financiero','rrhh','bodega','crm','apu','baseprecios','muro','ordenes-cambio','notificaciones','sso-calidad','documentos','visor-bim','predictivo','exportacion','logistica','rendimiento-campo','comercial-fin','admin-sistema','planilla-destajos','impuestos','entradas-almacen','ajustes','hitos','riesgos','cuentas-cobrar','cuentas-pagar','cotizaciones','plantillas','proveedor-analytics','error-log','activos','cuadros','profitability','weather'] as const;

const SCREEN_SET = new Set<string>(SCREEN_KEYS as readonly string[]);

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
  const { view, initializing, appSettings, user, allowedViews, setView, forceSync } = useErp();
  const { sidebarOpen, toggleSidebar, closeSidebar, sidebarCollapsed } = useAppContext();

  useSupabaseRealtime({
    tablas: ([
      'erp_proyectos', 'erp_movimientos', 'erp_empleados', 'erp_materiales',
      'erp_notificaciones', 'erp_muro',
      'erp_presupuestos', 'erp_ordenes_compra', 'erp_avances', 'erp_vales_salida',
      'erp_cotizaciones_negocio', 'erp_licitaciones', 'erp_destajos', 'erp_recepciones',
      'erp_hitos', 'erp_riesgos', 'erp_ordenes_cambio',
      'erp_cuentas_cobrar', 'erp_cuentas_pagar', 'erp_no_conformidades',
      'erp_incidentes', 'erp_pruebas_laboratorio', 'erp_liberaciones_partida',
      'erp_planos', 'erp_rfis', 'erp_submittals', 'erp_activos', 'erp_cuadros',
      'erp_ventas_paquetes', 'erp_pagos_proveedor',
    ] as string[]),
    enabled: true,
    rol: user?.rol,
    onCambio: (payload) => {
      console.log(`[Realtime] ${payload.tabla}: ${payload.tipo} (${payload.id})`);
      if (forceSync) forceSync();
    },
  });

  // Sync ALL visual preferences to DOM in one unified effect
  useEffect(() => {
    syncAllVisualSettings({
      appTheme: appSettings.appTheme,
      compactMode: appSettings.compactMode,
      primaryColor: appSettings.primaryColor,
      uiMode: appSettings.uiMode,
      animationsEnabled: appSettings.animationsEnabled,
      fontSize: appSettings.fontSize,
      fontFamily: appSettings.fontFamily,
      borderRadius: appSettings.borderRadius,
      spacingScale: appSettings.spacingScale,
      densityTable: appSettings.densityTable,
      sidebarPosition: appSettings.sidebarPosition,
      sidebarMode: appSettings.sidebarMode,
      sidebarWidth: appSettings.sidebarWidth,
      breadcrumbsEnabled: appSettings.breadcrumbsEnabled,
      footerEnabled: appSettings.footerEnabled,
      touchMode: appSettings.touchMode,
    });
  }, [
    appSettings.appTheme, appSettings.compactMode, appSettings.primaryColor,
    appSettings.uiMode, appSettings.animationsEnabled, appSettings.fontSize,
    appSettings.fontFamily, appSettings.borderRadius, appSettings.spacingScale,
    appSettings.densityTable, appSettings.sidebarPosition, appSettings.sidebarMode,
    appSettings.sidebarWidth, appSettings.breadcrumbsEnabled, appSettings.footerEnabled,
    appSettings.touchMode,
  ]);

  const viewName = typeof view === 'string' ? view.split(':')[0] : 'dashboard';

  const screens: Record<string, React.ReactNode> = useMemo(() => ({
    dashboard:         <Dashboard />,
    proyectos:         <Proyectos />,
    presupuestos:      <Presupuestos />,
    seguimiento:       <Seguimiento />,
    financiero:        <Financiero />,
    rrhh:              <RRHH />,
    bodega:            <Bodega />,
    crm:               <CRM />,
    apu:               <APUAvanzado />,
    baseprecios:       <BasePrecios />,
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
    cotizaciones:      <Cotizaciones />,
    plantillas:        <PlantillasProyectos />,
    'proveedor-analytics': <ProveedorAnalytics />,
    'error-log':       <ErrorLog />,
    activos:           <Activos />,
    cuadros:           <Cuadros />,
    profitability:     <ProfitabilityAnalytics />,
    weather:           <Weather />,
  }), []);

  type ScreenKey = (typeof SCREEN_KEYS)[number];
  const allAllowedScreens = useMemo(() => SCREEN_KEYS.filter((key): key is ScreenKey => (allowedViews as string[]).includes(key)), [allowedViews]);

  const setViewRef = useRef<((v: string) => void) | null>(null);
  useEffect(() => { setViewRef.current = setView; }, [setView]);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && SCREEN_SET.has(hash)) setViewRef.current?.(hash);
  }, []);

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && SCREEN_SET.has(hash)) setViewRef.current?.(hash);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const resolvedView = viewName;

  let safeScreen = screens['dashboard'];
  if ((allAllowedScreens as string[]).includes(resolvedView)) {
    safeScreen = screens[resolvedView];
  } else {
    safeScreen = screens['dashboard'];
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
        <Header onMenu={toggleSidebar} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar open={sidebarOpen} onClose={closeSidebar} />
          <main
            id="main-content"
            className={`flex-1 min-w-0 overflow-auto transition-all duration-300 pb-16 md:pb-0 ${sidebarCollapsed ? 'lg:ml-0' : ''}`}
            role="main"
            aria-label="Contenido principal"
          >
            {appSettings.breadcrumbsEnabled !== false && (
              <nav className="px-3 sm:px-4 lg:px-6 py-1.5 text-xs text-muted-foreground border-b border-border/30 flex items-center gap-1.5" aria-label="Breadcrumb">
                <span className="text-foreground/60">ERP</span>
                <span className="text-foreground/30">/</span>
                <span className="font-medium text-foreground/80 capitalize">{viewName.replace(/-/g, ' ')}</span>
              </nav>
            )}
            <PageTransition animationType={appSettings.animationType || 'fade'}>
              <ErrorBoundary moduleName={String(viewName)}>
                <Suspense fallback={<ScreenLoader />}>
                  {safeScreen}
                </Suspense>
              </ErrorBoundary>
            </PageTransition>
          </main>
        </div>
        {appSettings.footerEnabled !== false && (
          <footer className="border-t border-border bg-muted/30 px-3 sm:px-4 lg:px-6 py-2 flex-shrink-0">
            <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>© {new Date().getFullYear()} CONSTRUSMART ERP</span>
              <span>{EMPRESA?.nombre ?? 'CONSTRUSMART'} · {EMPRESA?.eslogan ?? ''}</span>
            </div>
          </footer>
        )}
        <Suspense fallback={null}>
          <QuickActionsFab />
        </Suspense>
        <Suspense fallback={null}>
          <BottomNavigation currentView={viewName} onViewChange={setView} />
        </Suspense>
      </div>
  );
};

const AppLayoutContent: React.FC = () => {
  const { user, initializing } = useErp();

  if (initializing) {
    return <AppLoader />;
  }

  const BYPASS_LOGIN = import.meta.env.DEV;

  if (!user && !BYPASS_LOGIN) {
    return (
      <Suspense fallback={<AppLoader />}>
        <Login />
      </Suspense>
    );
  }

  return <Shell />;
};

const AppLayout: React.FC = () => (
  <AppProvider>
    <ErpProvider>
      <AppLayoutContent />
    </ErpProvider>
  </AppProvider>
);

export default AppLayout;

