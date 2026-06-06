import React, { useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Badge } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined, BellOutlined, UserOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

interface AntLayoutProps {
  logo?: React.ReactNode;
  menuItems: MenuProps['items'];
  onMenuClick?: (key: string) => void;
  header?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  currentUser?: { name: string; avatar?: string };
  onLogout?: () => void;
  notifications?: number;
  onNotifications?: () => void;
  onProfile?: () => void;
}

export const AntLayout: React.FC<AntLayoutProps> = ({
  logo,
  menuItems = [],
  onMenuClick,
  header,
  headerActions,
  children,
  collapsed = false,
  onCollapsedChange,
  currentUser,
  onLogout,
  notifications = 0,
  onNotifications,
  onProfile,
}) => {
  const [siderCollapsed, setSiderCollapsed] = useState(collapsed);

  const handleCollapse = (col: boolean) => {
    setSiderCollapsed(col);
    onCollapsedChange?.(col);
  };

  const userMenu: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'Perfil',
      onClick: onProfile,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Salir',
      danger: true,
      icon: <LogoutOutlined />,
      onClick: onLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sider */}
      <Sider
        trigger={null}
        collapsible
        collapsed={siderCollapsed}
        width={200}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        {logo && (
          <div style={{ padding: '16px', textAlign: 'center', color: 'white' }}>
            {logo}
          </div>
        )}
        <Menu
          theme="dark"
          mode="inline"
          items={menuItems}
          onClick={(info) => onMenuClick?.(info.key)}
        />
      </Sider>

      {/* Layout main */}
      <Layout style={{ marginLeft: siderCollapsed ? 80 : 200 }}>
        {/* Header */}
        <Header
          style={{
            background: '#fff',
            padding: '0 16px',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
          }}
        >
          <Button
            type="text"
            icon={siderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => handleCollapse(!siderCollapsed)}
          />

          <div style={{ flex: 1, marginLeft: 16 }}>
            {header}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {headerActions}

            {onNotifications && (
              <Badge count={notifications}>
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 18 }} />}
                  onClick={onNotifications}
                />
              </Badge>
            )}

            {currentUser && (
              <Dropdown menu={{ items: userMenu }} placement="bottomRight">
                <Avatar
                  style={{ cursor: 'pointer', backgroundColor: '#ff8c42' }}
                  icon={<UserOutlined />}
                  src={currentUser.avatar}
                />
              </Dropdown>
            )}
          </div>
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: '16px',
            padding: '16px',
            background: '#fff',
            borderRadius: 8,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AntLayout;
