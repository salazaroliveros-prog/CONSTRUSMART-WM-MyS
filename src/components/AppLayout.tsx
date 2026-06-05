import React, { Suspense, lazy, useEffect, useMemo } from 'react';
import { ErpProvider, useErp, type AppThemeMode, parseView } from '@/erp/store';
import { useTranslation } from 'react-i18next';
import AppProvider from '@/contexts/AppContext';
import { useAppContext } from '@/contexts/AppContext';
import Header from '@/erp/components/Header';
import Sidebar from '@/erp/components/Sidebar';
import Login from '@/erp/screens/Login';
import AntLayout from '@/erp/layouts/AntLayout';
import { ErrorBoundary } from './ErrorBoundary';
import LoaderSpinner from './LoaderSpinner';
import { ConfigProvider, theme as antTheme } from 'antd';

// ── Shadcn screens (current) ──
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
const Ajustes = lazy(() => import('@/erp/screens/Ajustes'));

// ── Ant Design screens ──
const AntDashboard = lazy(() => import('@/erp/screens/antd/Dashboard'));
const AntProyectos = lazy(() => import('@/erp/screens/antd/Proyectos'));
const AntCRM = lazy(() => import('@/erp/screens/antd/CRM'));
const AntFinanciero = lazy(() => import('@/erp/screens/antd/Financiero'));

const LazyScreen: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoaderSpinner size={60} text="Cargando..." />}>
    {children}
  </Suspense>
);

// Transición suave entre módulos (Shadcn mode)
const FadeView: React.FC<{ view: string; children: React.ReactNode }> = ({ view, children }) => {
  const [visible, setVisible] = React.useState(false);
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

const buildAntdThemeConfig = (appSettings: any) => {
  const isModerno = appSettings.uiMode === 'antd';
  const baseFontSize = appSettings.fontSize === 'small' ? 12 : appSettings.fontSize === 'large' ? 16 : 14;
  return {
    algorithm: appSettings.appTheme === 'dark'
      ? antTheme.darkAlgorithm
      : appSettings.appTheme === 'high-contrast'
        ? antTheme.compactAlgorithm
        : antTheme.defaultAlgorithm,
    token: {
      colorPrimary: appSettings.primaryColor,
      borderRadius: isModerno ? 8 : 12,
      borderRadiusLG: isModerno ? 12 : 16,
      fontFamily: isModerno ? "'Segoe UI', system-ui, -apple-system, sans-serif" : "'Inter', system-ui, -apple-system, sans-serif",
      fontFamilyCode: "'JetBrains Mono', 'Fira Code', monospace",
      controlHeight: appSettings.compactMode ? 32 : isModerno ? 36 : 40,
      fontSize: baseFontSize,
      sizeStep: isModerno ? 4 : 5,
      sizeUnit: isModerno ? 4 : 5,
      wireframe: isModerno,
      ...(appSettings.compactMode ? { marginLG: 16, paddingLG: 12 } : {}),
    },
    components: {
      Menu: {
        colorItemBg: '#1e293b',
        colorItemText: '#94a3b8',
        colorItemTextSelected: appSettings.primaryColor,
        colorItemBgSelected: `${appSettings.primaryColor}26`,
        borderRadius: isModerno ? 6 : 8,
      },
      Card: {
        borderRadiusLG: isModerno ? 12 : 16,
        boxShadow: isModerno ? '0 1px 3px rgba(0,0,0,0.06)' : '0 4px 12px rgba(0,0,0,0.05)',
      },
      Table: {
        borderRadius: isModerno ? 8 : 12,
        headerBg: isModerno ? '#f8fafc' : '#fef3c7',
      },
      Button: {
        borderRadius: isModerno ? 6 : 10,
        controlHeight: appSettings.compactMode ? 28 : isModerno ? 32 : 36,
      },
      Input: {
        borderRadius: isModerno ? 6 : 10,
      },
      Select: {
        borderRadius: isModerno ? 6 : 10,
      },
    },
  };
};

const NoAccess: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-[calc(100vh-60px)] flex flex-col items-center justify-center p-8 text-center">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900 mb-3">{t('common.sin_acceso')}</h2>
        <p className="text-slate-600 mb-5">{t('common.sin_acceso_desc')}</p>
        <button onClick={onBack}
          className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition">
          {t('common.volver_tablero')}
        </button>
      </div>
    </div>
  );
};

// ── Screens map: Shadcn ──
const shadcnScreens = (setView: any, view: string): Record<string, React.ReactNode> => ({
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
  'ajustes': <LazyScreen><Ajustes /></LazyScreen>,
});

// ── Screens map: Ant Design (screens with antd versions) ──
// Screens without dedicated antd versions use GenericAntdScreen
const GenericAntdScreen = lazy(() => import('@/erp/screens/antd/GenericAntdScreen'));
const antdScreens = (setView: any, view: string): Record<string, React.ReactNode> => ({
  dashboard: <AntDashboard />,
  proyectos: <AntProyectos />,
  crm: <AntCRM />,
  financiero: <AntFinanciero />,
  'ajustes': <LazyScreen><Ajustes /></LazyScreen>,
  // render all remaining screens via GenericAntdScreen
});

// ── Shadcn Shell ──
// ── Shadcn Shell ──
const ShadcnShell: React.FC<{ view: string; screenContent: React.ReactNode }> = ({ view, screenContent }) => {
  const { sidebarOpen, toggleSidebar, sidebarCollapsed } = useAppContext();
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

// ── Ant Design Shell ──
const AntDesignShell: React.FC<{ view: string; screenContent: React.ReactNode }> = ({ view, screenContent }) => {
  return (
    <AntLayout>
      <Suspense fallback={<LoaderSpinner size={60} text="Cargando módulo..." />}>
        <ErrorBoundary key={view}>{screenContent}</ErrorBoundary>
      </Suspense>
    </AntLayout>
  );
};

const Shell: React.FC = () => {
  const { view, initializing, allowedViews, setView, appSettings } = useErp();
  const { root: activeScreen } = parseView(view);
  const { i18n } = useTranslation();
  const shadcn = shadcnScreens(setView, view);
  const antd = antdScreens(setView, view);
  const antdThemeConfig = useMemo(() => buildAntdThemeConfig(appSettings), [appSettings]);

  const isDark = appSettings.appTheme === 'dark';
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  useEffect(() => {
    if (i18n.language !== appSettings.language) {
      i18n.changeLanguage(appSettings.language);
    }
  }, [appSettings.language, i18n]);

  if (initializing) {
    return <LoaderSpinner size={80} text="Cargando sistema..." fullScreen />;
  }
  if (view === 'login') return <Login />;

  const isAntdMode = appSettings.uiMode === 'antd';
  const screenMap = isAntdMode ? antd : shadcn;

  const screenContent = allowedViews.includes(activeScreen)
    ? (screenMap[activeScreen] ?? (isAntdMode ? <GenericAntdScreen view={activeScreen} /> : null) ?? shadcn[activeScreen] ?? <Dashboard />)
    : <NoAccess onBack={() => setView('dashboard')} />;

  return (
    <ConfigProvider theme={antdThemeConfig}>
      <div className={isAntdMode ? 'mode-antd' : 'mode-shadcn'}>
        {isAntdMode ? (
          <AntDesignShell view={view} screenContent={screenContent} />
        ) : (
          <ShadcnShell view={view} screenContent={screenContent} />
        )}
      </div>
    </ConfigProvider>
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
