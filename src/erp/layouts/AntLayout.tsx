import React, { useMemo } from 'react';
import { useErp, type View, parseView } from '../store';
import {
  Layout, Menu, Avatar, Badge, Typography, Space, Breadcrumb,
  Dropdown, Button, theme as antTheme, Grid,
} from 'antd';
import {
  DashboardOutlined, ProjectOutlined, CalculatorOutlined,
  AuditOutlined, WalletOutlined, TeamOutlined, ShoppingCartOutlined,
  ApartmentOutlined, BarChartOutlined,
  RiseOutlined, DatabaseOutlined, FileTextOutlined,
  MessageOutlined, SwapOutlined, BellOutlined, SafetyOutlined,
  FolderOpenOutlined, BoxPlotOutlined, ThunderboltOutlined,
  ExportOutlined, TruckOutlined, FieldTimeOutlined,
  DollarOutlined, SettingOutlined, FileProtectOutlined,
  PercentageOutlined, UnorderedListOutlined, AlertOutlined,
  FlagOutlined, CreditCardOutlined, ReconciliationOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined,
  LogoutOutlined, SunOutlined, MoonOutlined, RocketOutlined,
  FileTextOutlined, FilePdfOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const MENU_ITEMS: { key: View; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Tablero', icon: <DashboardOutlined /> },
  { key: 'proyectos', label: 'Proyectos', icon: <ProjectOutlined /> },
  { key: 'presupuestos', label: 'Presupuestos', icon: <CalculatorOutlined /> },
  { key: 'apu', label: 'APU Avanzado', icon: <ApartmentOutlined /> },
  { key: 'seguimiento', label: 'Seguimiento', icon: <AuditOutlined /> },
  { key: 'curvas', label: 'Curvas S', icon: <BarChartOutlined /> },
  { key: 'rendimiento-campo', label: 'Rendimiento Campo', icon: <RiseOutlined /> },
  { key: 'muro', label: 'Muro Obra', icon: <MessageOutlined /> },
  { key: 'ordenes-cambio', label: 'Órdenes Cambio', icon: <SwapOutlined /> },
  { key: 'financiero', label: 'Financiero', icon: <WalletOutlined /> },
  { key: 'rrhh', label: 'RRHH', icon: <TeamOutlined /> },
  { key: 'crm', label: 'CRM', icon: <RocketOutlined /> },
  { key: 'bodega', label: 'Bodega', icon: <ShoppingCartOutlined /> },
  { key: 'baseprecios', label: 'Base Precios', icon: <DatabaseOutlined /> },
  { key: 'notificaciones', label: 'Notificaciones', icon: <BellOutlined /> },
  { key: 'sso-calidad', label: 'SSO & Calidad', icon: <SafetyOutlined /> },
  { key: 'predictivo', label: 'Predictivo', icon: <ThunderboltOutlined /> },
  { key: 'visor-bim', label: 'Visor BIM', icon: <BoxPlotOutlined /> },
  { key: 'documentos', label: 'Docs / Planos', icon: <FolderOpenOutlined /> },
  { key: 'reportes', label: 'Reportes', icon: <FileTextOutlined /> },
  { key: 'exportacion', label: 'Exportar Datos', icon: <ExportOutlined /> },
  { key: 'logistica', label: 'Logística', icon: <TruckOutlined /> },
  { key: 'rendimiento-campo', label: 'Rendimiento', icon: <FieldTimeOutlined /> },
  { key: 'comercial-fin', label: 'Comercial/Fin', icon: <DollarOutlined /> },
  { key: 'admin-sistema', label: 'Admin Sistema', icon: <SettingOutlined /> },
  { key: 'planilla-destajos', label: 'Planilla Destajos', icon: <FileProtectOutlined /> },
  { key: 'impuestos', label: 'Impuestos', icon: <PercentageOutlined /> },
  { key: 'entradas-almacen', label: 'Entradas Almacén', icon: <UnorderedListOutlined /> },
  { key: 'riesgos', label: 'Riesgos', icon: <AlertOutlined /> },
  { key: 'hitos', label: 'Hitos', icon: <FlagOutlined /> },
  { key: 'cuentas-cobrar', label: 'CxC', icon: <CreditCardOutlined /> },
  { key: 'cuentas-pagar', label: 'CxP', icon: <ReconciliationOutlined /> },
  { key: 'ajustes', label: 'Ajustes', icon: <SettingOutlined /> },
];

const AntLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { view, setView, user, logout, allowedViews, notificacionesNoLeidas, appSettings, updateAppSettings } = useErp();
  const [collapsed, setCollapsed] = React.useState(false);
  const { token } = antTheme.useToken();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const filteredItems = useMemo(() =>
    MENU_ITEMS.filter(item => allowedViews.includes(item.key)),
    [allowedViews]
  );

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: user?.nombre || 'Usuario' },
    { type: 'divider' as const },
    { key: 'theme-toggle',
      icon: appSettings.appTheme === 'dark' ? <SunOutlined /> : <MoonOutlined />,
      label: appSettings.appTheme === 'dark' ? 'Modo Claro' : 'Modo Oscuro',
      onClick: () => updateAppSettings({
        appTheme: appSettings.appTheme === 'dark' ? 'light' : 'dark'
      })
    },
    { key: 'ajustes', icon: <SettingOutlined />, label: 'Ajustes' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Cerrar Sesión', danger: true },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      {isMobile && !collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
          aria-hidden="true"
        />
      )}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={240}
        collapsedWidth={isMobile ? 0 : 64}
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorder}`,
          overflow: 'auto',
          height: '100vh',
          position: isMobile ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          zIndex: 100,
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${token.colorBorder}`,
          padding: '0 16px',
        }}>
          {collapsed ? (
            <Text strong style={{ color: token.colorPrimary, fontSize: 20 }}>W</Text>
          ) : (
            <Space>
              <Text strong style={{ color: token.colorText, fontSize: 16 }}>CONSTRUSMART</Text>
              <Text style={{ color: token.colorPrimary, fontSize: 10, opacity: 0.7 }}>ERP</Text>
            </Space>
          )}
        </div>

        <div style={{ padding: '8px 12px' }}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[parseView(view).root]}
            items={filteredItems}
            onClick={({ key }) => setView(key as View)}
            style={{
              background: 'transparent',
              border: 'none',
            }}
          />
        </div>

        {!collapsed && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 16px',
            borderTop: `1px solid ${token.colorBorder}`,
          }}>
            <Text style={{ color: token.colorPrimary, fontSize: 11, fontWeight: 600 }}>
              {user?.rol}
            </Text>
            <Text style={{ color: token.colorTextSecondary, fontSize: 10, display: 'block' }}>
              CONSTRUCTORA WM
            </Text>
          </div>
        )}
      </Sider>

      <Layout>
        <Header style={{
          padding: '0 24px',
          background: token.colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${token.colorBorder}`,
          height: 64,
          position: 'sticky',
          top: 0,
          zIndex: 99,
        }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              size="large"
              aria-label={collapsed ? 'Abrir menú' : 'Cerrar menú'}
            />
            <Breadcrumb items={[
              { title: 'CONSTRUSMART' },
              { title: MENU_ITEMS.find(m => m.key === parseView(view).root)?.label || 'Módulo' },
            ]} />
          </Space>

          <Space size="middle">
            <Badge count={notificacionesNoLeidas} size="small">
              <BellOutlined style={{ fontSize: 18, color: token.colorTextSecondary, cursor: 'pointer' }}
                onClick={() => setView('notificaciones')} />
            </Badge>

            <Dropdown menu={{ items: userMenuItems, onClick: ({ key }) => {
              if (key === 'logout') logout();
              if (key === 'ajustes') setView('ajustes');
            }}} trigger={['click']}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  style={{ backgroundColor: token.colorPrimary }}
                />
                <Text style={{ fontSize: 13 }}>{user?.nombre || 'Usuario'}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{
          margin: 16,
          padding: 0,
          overflow: 'auto',
          minHeight: 'calc(100vh - 64px - 32px)',
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AntLayout;
